/**
 * AudioEngine.js
 * Audio-reactive engine for HyperMode cinematic visualization
 * Generates tones and audio cues based on branch activity
 */

class AudioEngine {
    constructor(config = {}) {
        this.enabled = config.enabled !== false;
        this.volume = config.volume || 0.3;
        this.audioContext = null;
        this.masterGain = null;
        this.oscillators = new Map();
        this.lastPlayTime = 0;
        this.minInterval = config.minInterval || 50; // ms between tones

        // Tone presets for different events
        this.presets = {
            spawn: { type: 'sine', attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.1 },
            complete: { type: 'triangle', attack: 0.02, decay: 0.15, sustain: 0.1, release: 0.2 },
            win: { type: 'sine', attack: 0.05, decay: 0.3, sustain: 0.2, release: 0.5 },
            pulse: { type: 'sine', attack: 0.01, decay: 0.05, sustain: 0.02, release: 0.05 },
            ambient: { type: 'sine', attack: 0.5, decay: 0.5, sustain: 0.3, release: 1.0 }
        };

        this._initAudio();
        console.log('[AudioEngine] 🎶 initialized');
    }

    /**
     * Initialize Web Audio API context
     */
    _initAudio() {
        try {
            // Node.js environment - use stub
            if (typeof window === 'undefined') {
                this.audioContext = null;
                console.log('[AudioEngine] Running in Node.js - audio output stubbed');
                return;
            }

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // Master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);

            // Compressor for consistent levels
            this.compressor = this.audioContext.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;
            this.compressor.connect(this.masterGain);

        } catch (e) {
            console.warn('[AudioEngine] Audio init failed:', e.message);
            this.audioContext = null;
        }
    }

    /**
     * Play a tone at specified frequency
     * @param {number} freq - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {string} preset - Preset name for envelope
     */
    playTone(freq, duration = 0.1, preset = 'pulse') {
        if (!this.enabled) return;

        // Rate limiting
        const now = Date.now();
        if (now - this.lastPlayTime < this.minInterval) return;
        this.lastPlayTime = now;

        // Node.js stub - just log
        if (!this.audioContext) {
            // Silent in Node.js
            return;
        }

        try {
            const ctx = this.audioContext;
            const env = this.presets[preset] || this.presets.pulse;

            // Create oscillator
            const osc = ctx.createOscillator();
            osc.type = env.type;
            osc.frequency.value = Math.max(20, Math.min(freq, 20000));

            // Create gain for envelope
            const gain = ctx.createGain();
            gain.gain.value = 0;

            // Connect
            osc.connect(gain);
            gain.connect(this.compressor);

            // Envelope
            const startTime = ctx.currentTime;
            const attackEnd = startTime + env.attack;
            const decayEnd = attackEnd + env.decay;
            const sustainEnd = decayEnd + duration;
            const releaseEnd = sustainEnd + env.release;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.5, attackEnd);
            gain.gain.linearRampToValueAtTime(env.sustain * 0.5, decayEnd);
            gain.gain.setValueAtTime(env.sustain * 0.5, sustainEnd);
            gain.gain.linearRampToValueAtTime(0, releaseEnd);

            // Start and stop
            osc.start(startTime);
            osc.stop(releaseEnd + 0.1);

            // Cleanup
            osc.onended = () => {
                osc.disconnect();
                gain.disconnect();
            };

        } catch (e) {
            console.warn('[AudioEngine] playTone error:', e.message);
        }
    }

    /**
     * Play chord (multiple tones)
     * @param {number[]} freqs - Array of frequencies
     * @param {number} duration - Duration in seconds
     */
    playChord(freqs, duration = 0.2) {
        freqs.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, duration, 'ambient'), i * 20);
        });
    }

    /**
     * Play branch spawn sound
     * @param {Object} branch - Branch data
     */
    playSpawn(branch) {
        const baseFreq = 300 + (branch.depth || 0) * 50;
        this.playTone(baseFreq, 0.1, 'spawn');
    }

    /**
     * Play branch complete sound
     * @param {Object} branch - Branch data
     * @param {Object} result - Result data
     */
    playComplete(branch, result) {
        if (result?.status === 'win') {
            // Victory fanfare
            this.playChord([523.25, 659.25, 783.99], 0.5); // C major
            setTimeout(() => this.playTone(1046.50, 0.3, 'win'), 200);
        } else {
            const freq = 200 + (result?.score || 0) * 5;
            this.playTone(freq, 0.15, 'complete');
        }
    }

    /**
     * Play phase transition sound
     * @param {string} phase - Phase name
     */
    playPhaseTransition(phase) {
        const phaseFreqs = {
            MemoryFastPath: [400, 500, 600],
            CompositeChains: [350, 450, 550],
            Convergence: [500, 600, 700],
            InfiniteSearch: [300, 400, 500],
            GODMODE: [600, 750, 900]
        };
        const freqs = phaseFreqs[phase] || [400, 500, 600];
        this.playChord(freqs, 0.3);
    }

    /**
     * Play ambient drone based on activity level
     * @param {number} level - Activity level 0-1
     */
    playAmbient(level) {
        if (!this.audioContext || !this.enabled) return;

        const baseFreq = 80 + level * 40; // 80-120 Hz
        this.playTone(baseFreq, 2.0, 'ambient');
    }

    /**
     * Map score to frequency
     * @param {number} score - Score value
     * @param {number} min - Min frequency
     * @param {number} max - Max frequency
     */
    scoreToFreq(score, min = 200, max = 1200) {
        const normalized = Math.max(0, Math.min(1, score / 100));
        return min + normalized * (max - min);
    }

    /**
     * Set master volume
     * @param {number} vol - Volume 0-1
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    /**
     * Enable/disable audio
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Resume audio context (required after user interaction)
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

module.exports = AudioEngine;
