// ============================================================
//  BRAIN NETWORK V11.5 - SONIC LOADER
//  "Nintendo Switch Smooth" Audio Engine
//  Pre-warmed PCM buffers for instant playback
// ============================================================

export class SonicLoader {
  constructor(audioContext = null) {
    this.ctx = audioContext;
    this.buffers = new Map();
    this.gainNode = null;
    this.isHydrated = false;
    this.volume = 0.7;

    // Audio manifest - all sounds pre-loaded to RAM
    this.manifest = {
      // Core UI sounds
      'cast': '/sfx/cast.wav',
      'confirm': '/sfx/confirm.wav',
      'error': '/sfx/error.wav',
      'hover': '/sfx/hover.wav',
      'click': '/sfx/click.wav',

      // Voice feedback
      'voice-start': '/sfx/voice-start.wav',
      'voice-end': '/sfx/voice-end.wav',
      'voice-error': '/sfx/voice-error.wav',

      // Spell casting
      'spell-charge': '/sfx/spell-charge.wav',
      'spell-release': '/sfx/spell-release.wav',
      'spell-fail': '/sfx/spell-fail.wav',

      // Achievements
      'level-up': '/sfx/level-up.wav',
      'achievement': '/sfx/achievement.wav',
      'xp-gain': '/sfx/xp-gain.wav',

      // System
      'boot': '/sfx/boot.wav',
      'ready': '/sfx/ready.wav',
      'alert': '/sfx/alert.wav'
    };

    // Fallback synthesized sounds
    this.synthSounds = new Map();
  }

  // ============================================================
  //  INITIALIZATION
  // ============================================================

  async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Create master gain node
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = this.volume;
    this.gainNode.connect(this.ctx.destination);

    // Generate fallback synth sounds
    this.generateSynthSounds();

    return this;
  }

  // ============================================================
  //  HYDRATE - Pre-load all audio to RAM
  // ============================================================

  async hydrate() {
    if (this.isHydrated) return;
    if (!this.ctx) await this.init();

    const startTime = performance.now();
    const entries = Object.entries(this.manifest);

    // Parallel fetch from cache/network
    const results = await Promise.allSettled(
      entries.map(async ([id, url]) => {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
          this.buffers.set(id, audioBuffer);
          return { id, success: true };
        } catch (error) {
          // Use synth fallback
          return { id, success: false, error: error.message };
        }
      })
    );

    const loaded = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const elapsed = (performance.now() - startTime).toFixed(1);

    console.log(`[Sonic] Audio Engine Hydrated: ${loaded}/${entries.length} sounds in ${elapsed}ms`);
    this.isHydrated = true;

    return { loaded, total: entries.length, elapsed };
  }

  // ============================================================
  //  SYNTH FALLBACK - Generate sounds when files missing
  // ============================================================

  generateSynthSounds() {
    const sampleRate = this.ctx?.sampleRate || 44100;

    // Confirm beep
    this.synthSounds.set('confirm', this.createTone(880, 0.1, 'sine'));
    this.synthSounds.set('click', this.createTone(1200, 0.05, 'square'));
    this.synthSounds.set('hover', this.createTone(600, 0.03, 'sine'));
    this.synthSounds.set('error', this.createTone(200, 0.2, 'sawtooth'));
    this.synthSounds.set('cast', this.createSweep(400, 800, 0.15));
    this.synthSounds.set('voice-start', this.createTone(500, 0.08, 'sine'));
    this.synthSounds.set('voice-end', this.createTone(400, 0.08, 'sine'));
    this.synthSounds.set('level-up', this.createArpeggio([523, 659, 784, 1047], 0.4));
    this.synthSounds.set('achievement', this.createArpeggio([659, 784, 880, 1047], 0.5));
    this.synthSounds.set('xp-gain', this.createTone(1000, 0.05, 'sine'));
    this.synthSounds.set('boot', this.createSweep(200, 600, 0.3));
    this.synthSounds.set('ready', this.createArpeggio([440, 554, 659], 0.3));
    this.synthSounds.set('alert', this.createTone(440, 0.15, 'square'));
  }

  createTone(freq, duration, type = 'sine') {
    if (!this.ctx) return null;

    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8); // Decay
      let sample = 0;

      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * freq * t);
          break;
        case 'square':
          sample = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
          break;
        case 'sawtooth':
          sample = 2 * ((freq * t) % 1) - 1;
          break;
      }

      data[i] = sample * envelope * 0.3;
    }

    return buffer;
  }

  createSweep(startFreq, endFreq, duration) {
    if (!this.ctx) return null;

    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = i / length;
      const freq = startFreq + (endFreq - startFreq) * progress;
      const envelope = Math.sin(Math.PI * progress); // Fade in/out
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
    }

    return buffer;
  }

  createArpeggio(freqs, duration) {
    if (!this.ctx) return null;

    const sampleRate = this.ctx.sampleRate;
    const noteLength = Math.floor(sampleRate * duration / freqs.length);
    const length = noteLength * freqs.length;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    freqs.forEach((freq, noteIndex) => {
      const offset = noteIndex * noteLength;
      for (let i = 0; i < noteLength; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 6);
        data[offset + i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
      }
    });

    return buffer;
  }

  // ============================================================
  //  PLAY - Instant fire from RAM buffer
  // ============================================================

  play(id, options = {}) {
    if (!this.ctx) return;

    // Resume context if suspended (autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // Get buffer from pre-loaded or synth fallback
    let buffer = this.buffers.get(id) || this.synthSounds.get(id);

    if (!buffer) {
      console.warn(`[Sonic] Sound not found: ${id}`);
      return;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Optional: pitch shift
    if (options.playbackRate) {
      source.playbackRate.value = options.playbackRate;
    }

    // Optional: individual volume
    if (options.volume !== undefined) {
      const gain = this.ctx.createGain();
      gain.gain.value = options.volume;
      source.connect(gain);
      gain.connect(this.gainNode);
    } else {
      source.connect(this.gainNode);
    }

    source.start(0);

    return source;
  }

  // ============================================================
  //  CONVENIENCE METHODS
  // ============================================================

  confirm() { this.play('confirm'); }
  click() { this.play('click'); }
  hover() { this.play('hover'); }
  error() { this.play('error'); }
  cast() { this.play('cast'); }
  voiceStart() { this.play('voice-start'); }
  voiceEnd() { this.play('voice-end'); }
  levelUp() { this.play('level-up'); }
  achievement() { this.play('achievement'); }
  xpGain() { this.play('xp-gain', { playbackRate: 1 + Math.random() * 0.2 }); }
  boot() { this.play('boot'); }
  ready() { this.play('ready'); }
  alert() { this.play('alert'); }

  // ============================================================
  //  VOLUME CONTROL
  // ============================================================

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  mute() {
    if (this.gainNode) {
      this.gainNode.gain.value = 0;
    }
  }

  unmute() {
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  // ============================================================
  //  CLEANUP
  // ============================================================

  dispose() {
    this.buffers.clear();
    this.synthSounds.clear();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}

// Singleton instance
let sonicInstance = null;

export function getSonicLoader() {
  if (!sonicInstance) {
    sonicInstance = new SonicLoader();
  }
  return sonicInstance;
}

export default SonicLoader;
