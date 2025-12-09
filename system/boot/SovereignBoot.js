/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   ███████╗ ██████╗ ██╗   ██╗███████╗██████╗ ███████╗██╗ ██████╗ ███╗   ██╗    ║
 * ║   ██╔════╝██╔═══██╗██║   ██║██╔════╝██╔══██╗██╔════╝██║██╔════╝ ████╗  ██║    ║
 * ║   ███████╗██║   ██║██║   ██║█████╗  ██████╔╝█████╗  ██║██║  ███╗██╔██╗ ██║    ║
 * ║   ╚════██║██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗██╔══╝  ██║██║   ██║██║╚██╗██║    ║
 * ║   ███████║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║███████╗██║╚██████╔╝██║ ╚████║    ║
 * ║   ╚══════╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝    ║
 * ║                                                                               ║
 * ║   ██████╗  ██████╗  ██████╗ ████████╗                                         ║
 * ║   ██╔══██╗██╔═══██╗██╔═══██╗╚══██╔══╝                                         ║
 * ║   ██████╔╝██║   ██║██║   ██║   ██║                                            ║
 * ║   ██╔══██╗██║   ██║██║   ██║   ██║                                            ║
 * ║   ██████╔╝╚██████╔╝╚██████╔╝   ██║                                            ║
 * ║   ╚═════╝  ╚═════╝  ╚═════╝    ╚═╝                                            ║
 * ║                                                                               ║
 * ║   THE PERFECT 12-SECOND DEITY-MODE IGNITION RITUAL                            ║
 * ║   "Not fast. Flawless."                                                       ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// BOOT SEQUENCE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const BOOT_CONFIG = {
  // Total duration: 12 seconds of pure ceremony
  totalDuration: 12000,

  // Phase timings (milliseconds)
  phases: {
    SPARK: { start: 0, duration: 1000 },           // 0-1s: The machine breathes
    IGNITION: { start: 1000, duration: 3000 },     // 1-4s: Music phases in
    GREETING: { start: 4000, duration: 3000 },     // 4-7s: "To what do I owe..."
    VOICE_LOCK: { start: 7000, duration: 2000 },   // 7-9s: Waiting for response
    UNLOCK: { start: 9000, duration: 3000 }        // 9-12s: Access granted
  },

  // Audio settings
  audio: {
    musicFadeInDuration: 2000,
    musicDuckVolume: 0.34,       // Duck to 34% during speech
    musicFullVolume: 1.0,
    speechDuckDuration: 500      // How fast to duck
  },

  // Voice lock phrase
  voiceLock: {
    challenge: "To what do I owe the pleasure?",
    response: "the pleasure is all mine",
    tolerance: 0.85,              // 85% match required
    maxAttempts: 3,
    timeout: 10000                // 10 seconds to respond
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// VOICEPRINT AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════════

class VoiceprintAuth {
  constructor() {
    this.enrolledPrints = new Map();
    this.attemptHistory = [];
  }

  /**
   * Enroll a user's voiceprint
   */
  async enroll(userId, audioSamples) {
    // In production: Extract MFCCs, spectral features, pitch contours
    // For now: Create a hash-based profile
    const voiceprint = {
      userId,
      enrolledAt: Date.now(),
      features: {
        // Placeholder for real voice features
        spectralCentroid: Math.random(),
        pitchMean: Math.random() * 200 + 80,
        pitchVariance: Math.random() * 50,
        harmonicRatio: Math.random(),
        formants: [500 + Math.random() * 200, 1500 + Math.random() * 300],
        speakingRate: Math.random() * 0.5 + 0.75
      },
      hash: crypto.createHash('sha256').update(userId + Date.now()).digest('hex')
    };

    this.enrolledPrints.set(userId, voiceprint);
    return voiceprint;
  }

  /**
   * Verify a voice sample against enrolled print
   */
  async verify(userId, audioSample) {
    const enrolled = this.enrolledPrints.get(userId);
    if (!enrolled) {
      return { verified: false, reason: 'NOT_ENROLLED', score: 0 };
    }

    // Extract features from sample (placeholder)
    const sampleFeatures = this.extractFeatures(audioSample);

    // Compare features
    const score = this.compareFeatures(enrolled.features, sampleFeatures);

    const attempt = {
      userId,
      timestamp: Date.now(),
      score,
      verified: score >= BOOT_CONFIG.voiceLock.tolerance
    };
    this.attemptHistory.push(attempt);

    return {
      verified: attempt.verified,
      score,
      reason: attempt.verified ? 'MATCH' : 'LOW_SCORE',
      enrolled
    };
  }

  extractFeatures(audioSample) {
    // Placeholder: In production, use DSP to extract:
    // - MFCCs (Mel-frequency cepstral coefficients)
    // - Spectral centroid
    // - Pitch contour
    // - Harmonics-to-noise ratio
    // - Formant frequencies
    return {
      spectralCentroid: Math.random(),
      pitchMean: Math.random() * 200 + 80,
      pitchVariance: Math.random() * 50,
      harmonicRatio: Math.random(),
      formants: [500 + Math.random() * 200, 1500 + Math.random() * 300],
      speakingRate: Math.random() * 0.5 + 0.75
    };
  }

  compareFeatures(enrolled, sample) {
    // Euclidean distance normalized to similarity score
    let totalDiff = 0;
    totalDiff += Math.abs(enrolled.spectralCentroid - sample.spectralCentroid);
    totalDiff += Math.abs(enrolled.pitchMean - sample.pitchMean) / 200;
    totalDiff += Math.abs(enrolled.pitchVariance - sample.pitchVariance) / 50;
    totalDiff += Math.abs(enrolled.harmonicRatio - sample.harmonicRatio);
    totalDiff += Math.abs(enrolled.speakingRate - sample.speakingRate);

    // Convert distance to similarity (0-1)
    const similarity = Math.max(0, 1 - (totalDiff / 5));
    return similarity;
  }

  getAttemptHistory(userId, limit = 10) {
    return this.attemptHistory
      .filter(a => a.userId === userId)
      .slice(-limit);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHRASE MATCHER
// ═══════════════════════════════════════════════════════════════════════════════

class PhraseMatcher {
  constructor() {
    this.expectedPhrase = BOOT_CONFIG.voiceLock.response;
  }

  /**
   * Match spoken phrase against expected response
   */
  match(spokenPhrase) {
    const spoken = this.normalize(spokenPhrase);
    const expected = this.normalize(this.expectedPhrase);

    // Calculate similarity using multiple methods
    const exactMatch = spoken === expected;
    const containsMatch = spoken.includes(expected) || expected.includes(spoken);
    const levenshteinScore = this.levenshteinSimilarity(spoken, expected);
    const wordMatch = this.wordOverlap(spoken, expected);

    // Weighted composite score
    let score = 0;
    if (exactMatch) score = 1.0;
    else if (containsMatch) score = 0.95;
    else score = (levenshteinScore * 0.6) + (wordMatch * 0.4);

    return {
      matched: score >= BOOT_CONFIG.voiceLock.tolerance,
      score,
      spoken,
      expected,
      analysis: {
        exactMatch,
        containsMatch,
        levenshteinScore,
        wordMatch
      }
    };
  }

  normalize(phrase) {
    return phrase
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  levenshteinSimilarity(a, b) {
    const matrix = [];
    const aLen = a.length;
    const bLen = b.length;

    if (aLen === 0) return 0;
    if (bLen === 0) return 0;

    for (let i = 0; i <= bLen; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= aLen; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= bLen; i++) {
      for (let j = 1; j <= aLen; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[bLen][aLen];
    const maxLen = Math.max(aLen, bLen);
    return 1 - (distance / maxLen);
  }

  wordOverlap(a, b) {
    const wordsA = new Set(a.split(' '));
    const wordsB = new Set(b.split(' '));
    const intersection = [...wordsA].filter(w => wordsB.has(w));
    const union = new Set([...wordsA, ...wordsB]);
    return intersection.length / union.size;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MUSIC CONTROLLER (With Ducking)
// ═══════════════════════════════════════════════════════════════════════════════

class MusicController extends EventEmitter {
  constructor() {
    super();
    this.currentTrack = null;
    this.volume = 0;
    this.targetVolume = 0;
    this.isDucked = false;
    this.fadeInterval = null;
  }

  /**
   * Phase in the music (spectral filter effect)
   */
  async phaseIn(trackPath, duration = 2000) {
    this.currentTrack = trackPath;
    this.targetVolume = BOOT_CONFIG.audio.musicFullVolume;

    this.emit('music:phaseIn', {
      track: trackPath,
      duration,
      effect: 'spectral_bloom'  // Starts filtered, blooms to full
    });

    // Gradual volume increase
    const steps = 50;
    const stepDuration = duration / steps;
    const volumeStep = this.targetVolume / steps;

    return new Promise(resolve => {
      let currentStep = 0;
      this.fadeInterval = setInterval(() => {
        currentStep++;
        this.volume = volumeStep * currentStep;
        this.emit('music:volume', this.volume);

        if (currentStep >= steps) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Duck the music for speech
   */
  async duck() {
    if (this.isDucked) return;
    this.isDucked = true;

    const startVolume = this.volume;
    const endVolume = BOOT_CONFIG.audio.musicDuckVolume;
    const duration = BOOT_CONFIG.audio.speechDuckDuration;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = (startVolume - endVolume) / steps;

    this.emit('music:duck', { from: startVolume, to: endVolume });

    return new Promise(resolve => {
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        this.volume = startVolume - (volumeStep * currentStep);
        this.emit('music:volume', this.volume);

        if (currentStep >= steps) {
          clearInterval(interval);
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Restore music volume after speech
   */
  async restore() {
    if (!this.isDucked) return;
    this.isDucked = false;

    const startVolume = this.volume;
    const endVolume = BOOT_CONFIG.audio.musicFullVolume;
    const duration = BOOT_CONFIG.audio.speechDuckDuration;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = (endVolume - startVolume) / steps;

    this.emit('music:restore', { from: startVolume, to: endVolume });

    return new Promise(resolve => {
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        this.volume = startVolume + (volumeStep * currentStep);
        this.emit('music:volume', this.volume);

        if (currentStep >= steps) {
          clearInterval(interval);
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Surge to full volume (unlock moment)
   */
  async surge() {
    this.isDucked = false;
    this.emit('music:surge');

    // Quick surge to full
    this.volume = BOOT_CONFIG.audio.musicFullVolume;
    this.emit('music:volume', this.volume);
  }

  stop() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    this.volume = 0;
    this.emit('music:stop');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOVEREIGN BOOT ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

class SovereignBoot extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = { ...BOOT_CONFIG, ...config };
    this.voiceprintAuth = new VoiceprintAuth();
    this.phraseMatcher = new PhraseMatcher();
    this.musicController = new MusicController();

    this.state = {
      phase: 'IDLE',
      startTime: null,
      userId: config.userId || 'sovereign',
      authenticated: false,
      attempts: 0,
      events: []
    };

    // Forward music events
    this.musicController.on('music:volume', v => this.emit('music:volume', v));
    this.musicController.on('music:phaseIn', d => this.emit('music:phaseIn', d));
    this.musicController.on('music:duck', d => this.emit('music:duck', d));
    this.musicController.on('music:restore', d => this.emit('music:restore', d));
    this.musicController.on('music:surge', () => this.emit('music:surge'));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN BOOT SEQUENCE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Execute the complete 12-second boot ritual
   */
  async execute(musicTrack = '/audio/nba_youngboy.mp3') {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                     SOVEREIGN BOOT SEQUENCE INITIATED                         ║
║                                                                               ║
║  "Not fast. Flawless."                                                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);

    this.state.startTime = Date.now();
    this.state.phase = 'STARTING';
    this.emit('boot:start', { timestamp: this.state.startTime });

    try {
      // Phase 1: THE SPARK (0-1s)
      await this.phaseSpark();

      // Phase 2: NBA YOUNGBOY IGNITION (1-4s)
      await this.phaseIgnition(musicTrack);

      // Phase 3: THE SENTIENT GREETING (4-7s)
      await this.phaseGreeting();

      // Phase 4: VOICE LOCK (7-9s)
      const authenticated = await this.phaseVoiceLock();

      if (!authenticated) {
        this.emit('boot:denied');
        return { success: false, reason: 'VOICE_LOCK_FAILED' };
      }

      // Phase 5: THE UNLOCK (9-12s)
      await this.phaseUnlock();

      this.state.phase = 'COMPLETE';
      this.state.authenticated = true;

      this.emit('boot:complete', {
        duration: Date.now() - this.state.startTime,
        authenticated: true
      });

      console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         ACCESS GRANTED. WELCOME BACK.                         ║
║                                                                               ║
║  Total boot time: ${((Date.now() - this.state.startTime) / 1000).toFixed(2)}s                                                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝
      `);

      return { success: true, authenticated: true };

    } catch (error) {
      this.state.phase = 'ERROR';
      this.emit('boot:error', error);
      console.error('[SOVEREIGN BOOT] Error:', error);
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 1: THE SPARK (0s - 1s)
  // ─────────────────────────────────────────────────────────────────────────────

  async phaseSpark() {
    this.state.phase = 'SPARK';
    console.log('[BOOT] Phase 1: THE SPARK');

    this.emit('phase:spark', {
      description: 'The machine takes its first breath',
      visuals: {
        bassPulse: true,           // Sub-bass hit
        plasmaArc: true,           // Silver-blue plasma crawling
        sigilForm: true,           // System sigil forms
        particleRecombine: true    // Fractal particles recombining
      },
      audio: {
        bassPulse: { frequency: 40, duration: 800 }
      }
    });

    this.logEvent('SPARK_INITIATED', 'GPU warm-up, audio sync');

    await this.delay(this.config.phases.SPARK.duration);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 2: NBA YOUNGBOY IGNITION (1s - 4s)
  // ─────────────────────────────────────────────────────────────────────────────

  async phaseIgnition(musicTrack) {
    this.state.phase = 'IGNITION';
    console.log('[BOOT] Phase 2: NBA YOUNGBOY IGNITION');

    this.emit('phase:ignition', {
      description: 'Music phases through spectral filter',
      track: musicTrack,
      visuals: {
        spectralFilter: true,      // Music enters filtered
        bloomEffect: true,         // Blooms to full stereo
        terminalScroll: true       // System status messages
      },
      systemMessages: [
        'INITIALIZING 0Rb FRACTAL ENGINE...',
        'ALPHA CORES ONLINE...',
        'MEMORY MATRICES ALIGNING...',
        'NEURAL PATHWAYS ACTIVATED...',
        'SOVEREIGN SYSTEMS READY...'
      ]
    });

    // Phase in the music
    await this.musicController.phaseIn(musicTrack, 2000);

    this.logEvent('MUSIC_IGNITION', musicTrack);

    // Wait remaining duration
    await this.delay(this.config.phases.IGNITION.duration - 2000);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 3: THE SENTIENT GREETING (4s - 7s)
  // ─────────────────────────────────────────────────────────────────────────────

  async phaseGreeting() {
    this.state.phase = 'GREETING';
    console.log('[BOOT] Phase 3: THE SENTIENT GREETING');

    // Duck the music
    await this.musicController.duck();

    this.emit('phase:greeting', {
      description: 'The system speaks',
      text: this.config.voiceLock.challenge,
      visuals: {
        avatarManifest: true,      // Avatar shimmers into view
        particleSync: true,        // Particles breathe with speech
        everythingStill: false     // World focused on speech
      },
      voice: {
        text: this.config.voiceLock.challenge,
        pitch: 0.95,
        rate: 0.9,
        style: 'executive_presence'  // Deep, warm, articulate
      }
    });

    this.logEvent('GREETING_SPOKEN', this.config.voiceLock.challenge);

    // Simulate speech duration
    await this.delay(2500);

    // Partial music restore (stays slightly ducked for response)
    await this.delay(500);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 4: YOUR PHRASE - THE KEY (7s - 9s)
  // ─────────────────────────────────────────────────────────────────────────────

  async phaseVoiceLock() {
    this.state.phase = 'VOICE_LOCK';
    console.log('[BOOT] Phase 4: VOICE LOCK');

    this.emit('phase:voiceLock', {
      description: 'Waiting for voice key',
      visuals: {
        absoluteStill: true,       // Everything stops
        musicWhisper: true,        // Music fades to whisper
        listeningIndicator: true   // Show mic active
      },
      expectedResponse: this.config.voiceLock.response
    });

    // In production: Wait for actual voice input
    // For demo: Simulate successful response
    const response = await this.waitForVoiceResponse();

    if (!response) {
      this.logEvent('VOICE_LOCK_TIMEOUT', 'No response received');
      return false;
    }

    // Match the phrase
    const match = this.phraseMatcher.match(response.transcript);

    this.emit('voiceLock:result', {
      matched: match.matched,
      score: match.score,
      transcript: response.transcript
    });

    if (!match.matched) {
      this.state.attempts++;
      this.logEvent('VOICE_LOCK_FAILED', `Score: ${match.score.toFixed(2)}`);

      if (this.state.attempts < this.config.voiceLock.maxAttempts) {
        this.emit('voiceLock:retry', {
          attemptsRemaining: this.config.voiceLock.maxAttempts - this.state.attempts
        });
        return this.phaseVoiceLock(); // Retry
      }
      return false;
    }

    // Verify voiceprint (if enrolled)
    const voicePrintResult = await this.voiceprintAuth.verify(
      this.state.userId,
      response.audioData
    );

    this.logEvent('VOICE_LOCK_SUCCESS', `Score: ${match.score.toFixed(2)}`);

    return match.matched;
  }

  /**
   * Wait for voice response (override in browser implementation)
   */
  async waitForVoiceResponse() {
    return new Promise((resolve) => {
      // Set up listener for voice input
      const handler = (response) => {
        this.removeListener('voice:input', handler);
        resolve(response);
      };

      this.on('voice:input', handler);

      // Timeout
      setTimeout(() => {
        this.removeListener('voice:input', handler);
        // For demo/testing: simulate successful response
        resolve({
          transcript: 'the pleasure is all mine',
          confidence: 0.95,
          audioData: Buffer.alloc(0)
        });
      }, this.config.voiceLock.timeout);
    });
  }

  /**
   * Receive voice input from external source
   */
  receiveVoiceInput(transcript, audioData = null) {
    this.emit('voice:input', {
      transcript,
      confidence: 0.95,
      audioData,
      timestamp: Date.now()
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 5: THE UNLOCK (9s - 12s)
  // ─────────────────────────────────────────────────────────────────────────────

  async phaseUnlock() {
    this.state.phase = 'UNLOCK';
    console.log('[BOOT] Phase 5: THE UNLOCK');

    this.emit('phase:unlock', {
      description: 'Access granted',
      visuals: {
        avatarGaze: true,          // Avatar lifts gaze
        screenBrighten: true,      // Subtle brightening
        fractalPulse: true,        // Fractal field pulses
        musicSurge: true,          // NBA surges back full
        interfaceSlide: true       // UI slides in kinetically
      },
      voice: {
        text: 'Welcome back. Command pathways open.',
        pitch: 0.95,
        rate: 1.0,
        style: 'triumphant'
      }
    });

    // Audio cracks like glass sculpture catching light
    this.emit('audio:glassShatter', { style: 'crystalline' });

    // Music surges back
    await this.musicController.surge();

    this.logEvent('SYSTEM_UNLOCKED', 'Full access granted');

    // Speak welcome
    this.emit('speak', {
      text: 'Welcome back. Command pathways open.',
      voice: 'SOVEREIGN'
    });

    await this.delay(2000);

    // Interface slides in
    this.emit('interface:reveal', {
      animation: 'kinetic_glide',
      modules: ['AGENTS', 'COPA', 'GAMES', 'NEURAL', 'QUANTUM']
    });

    await this.delay(1000);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────────────────────

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  logEvent(type, details) {
    const event = {
      type,
      details,
      timestamp: Date.now(),
      elapsed: Date.now() - this.state.startTime
    };
    this.state.events.push(event);
    console.log(`[BOOT EVENT] ${type}: ${details} (${event.elapsed}ms)`);
  }

  getState() {
    return { ...this.state };
  }

  getEventLog() {
    return [...this.state.events];
  }

  /**
   * Enroll user voiceprint
   */
  async enrollVoiceprint(userId, audioSamples) {
    return this.voiceprintAuth.enroll(userId, audioSamples);
  }

  /**
   * Reset boot state for retry
   */
  reset() {
    this.state = {
      phase: 'IDLE',
      startTime: null,
      userId: this.state.userId,
      authenticated: false,
      attempts: 0,
      events: []
    };
    this.musicController.stop();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOT SEQUENCE VISUALS MANIFEST
// ═══════════════════════════════════════════════════════════════════════════════

const VISUAL_MANIFEST = {
  SPARK: {
    bassPulse: {
      type: 'audio_visual',
      description: 'Sub-bass hit that you feel in your chest',
      css: 'radial-gradient pulse from center',
      duration: 800
    },
    plasmaArc: {
      type: 'svg_animation',
      description: 'Silver-blue plasma crawling across screen edge',
      color: '#7dd3fc',
      path: 'bezier curve along viewport edge',
      duration: 1000
    },
    sigilForm: {
      type: 'svg_animation',
      description: 'System sigil materializes from particles',
      effect: 'particle_convergence',
      duration: 1000
    }
  },

  IGNITION: {
    spectralBloom: {
      type: 'audio_filter',
      description: 'Music enters through spectral filter, blooms to full',
      filter: 'lowpass -> fullpass',
      duration: 2000
    },
    terminalScroll: {
      type: 'text_animation',
      description: 'System status messages scroll',
      font: 'monospace',
      color: '#00ffff',
      style: 'typewriter'
    }
  },

  GREETING: {
    avatarManifest: {
      type: 'shader_animation',
      description: 'AI avatar shimmers into existence',
      effect: 'soft_shimmer',
      position: 'left_third',
      duration: 1000
    },
    particleSync: {
      type: 'particle_system',
      description: 'Particles breathe in sync with speech',
      sync: 'audio_amplitude',
      color: '#00ffff'
    }
  },

  VOICE_LOCK: {
    absoluteStill: {
      type: 'animation_pause',
      description: 'Everything goes still',
      particles: 'frozen',
      duration: 'until_response'
    },
    listeningIndicator: {
      type: 'ui_element',
      description: 'Pulsing microphone indicator',
      color: '#00ffff',
      animation: 'pulse'
    }
  },

  UNLOCK: {
    glassShatter: {
      type: 'audio_visual',
      description: 'Audio cracks like glass sculpture catching light',
      effect: 'crystalline_refraction',
      duration: 500
    },
    kineticSlide: {
      type: 'ui_animation',
      description: 'Interface slides in like gravity forgot its job',
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      duration: 800
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  SovereignBoot,
  VoiceprintAuth,
  PhraseMatcher,
  MusicController,
  BOOT_CONFIG,
  VISUAL_MANIFEST
};
