/**
 * TERRA-PULSE Speaker System
 * Compact audio system for grounding shoe with bone conduction support
 */

// Speaker Hardware Configuration
export const SPEAKER_CONFIG = {
  DRIVER: {
    SIZE_MM: 15,
    TYPE: 'neodymium',
    POWER_WATTS: 1,
    IMPEDANCE_OHMS: 8,
    FREQUENCY_RESPONSE: { min: 80, max: 18000 } // Hz
  },
  PASSIVE_RADIATOR: {
    SIZE_MM: 20,
    BASS_EXTENSION_HZ: 60
  },
  BONE_CONDUCTION: {
    ENABLED: true,
    FREQUENCY_RESPONSE: { min: 100, max: 8000 } // Hz
  },
  BLUETOOTH: {
    VERSION: '5.3',
    CODEC: ['SBC', 'AAC', 'aptX'],
    PROFILES: ['A2DP', 'AVRCP', 'HFP']
  },
  VOLUME: {
    MIN: 0,
    MAX: 100,
    DEFAULT: 50
  }
};

// Audio Presets for Grounding Experience
export const AUDIO_PRESETS = {
  SCHUMANN_RESONANCE: {
    name: 'Earth Frequency',
    description: 'Simulates the 7.83Hz Schumann resonance for deep grounding',
    frequency: 7.83,
    harmonics: [14.3, 20.8, 27.3, 33.8],
    volume: 30
  },
  BINAURAL_ALPHA: {
    name: 'Alpha Waves',
    description: 'Binaural beats for relaxation (8-12Hz)',
    baseFrequency: 200,
    beatFrequency: 10,
    volume: 40
  },
  BINAURAL_THETA: {
    name: 'Theta Waves',
    description: 'Binaural beats for deep meditation (4-8Hz)',
    baseFrequency: 200,
    beatFrequency: 6,
    volume: 40
  },
  NATURE_EARTH: {
    name: 'Forest Floor',
    description: 'Natural earth sounds for immersive grounding',
    sounds: ['birdsong', 'leaves', 'stream', 'wind'],
    volume: 45
  },
  GUIDED_GROUNDING: {
    name: 'Guided Session',
    description: 'Voice-guided grounding meditation',
    duration: 600, // seconds
    volume: 50
  },
  STEP_CADENCE: {
    name: 'Running Beat',
    description: 'Metronome for running cadence',
    bpmOptions: [160, 170, 180],
    volume: 60
  }
};

// Equalizer Presets
export const EQ_PRESETS = {
  FLAT: { name: 'Flat', bands: [0, 0, 0, 0, 0] },
  BASS_BOOST: { name: 'Bass Boost', bands: [6, 4, 0, -1, -2] },
  VOICE: { name: 'Voice Clarity', bands: [-2, 0, 3, 4, 2] },
  OUTDOOR: { name: 'Outdoor', bands: [4, 2, 0, 2, 4] },
  MEDITATION: { name: 'Meditation', bands: [2, 3, 2, 1, 0] }
};

// Audio State Interface
export interface AudioState {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentPreset: string | null;
  eqPreset: string;
  boneConduction: boolean;
  bluetoothConnected: boolean;
  batteryOptimized: boolean;
}

// Audio Event Types
export type AudioEventType =
  | 'play'
  | 'pause'
  | 'stop'
  | 'volume_change'
  | 'preset_change'
  | 'bluetooth_connect'
  | 'bluetooth_disconnect';

export interface AudioEvent {
  type: AudioEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

/**
 * Terra-Pulse Speaker Controller Class
 */
export class TerraPulseSpeaker {
  private state: AudioState;
  private audioContext: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private eventListeners: Map<AudioEventType, Function[]> = new Map();

  constructor() {
    this.state = {
      isPlaying: false,
      volume: SPEAKER_CONFIG.VOLUME.DEFAULT,
      isMuted: false,
      currentPreset: null,
      eqPreset: 'FLAT',
      boneConduction: false,
      bluetoothConnected: false,
      batteryOptimized: true
    };
  }

  /**
   * Initialize the audio system
   */
  async initialize(): Promise<boolean> {
    console.log('🔊 Initializing TERRA-PULSE Speaker System...');
    console.log(`   Driver: ${SPEAKER_CONFIG.DRIVER.SIZE_MM}mm ${SPEAKER_CONFIG.DRIVER.TYPE}`);
    console.log(`   Power: ${SPEAKER_CONFIG.DRIVER.POWER_WATTS}W`);
    console.log(`   Bluetooth: ${SPEAKER_CONFIG.BLUETOOTH.VERSION}`);

    try {
      // Initialize Web Audio API (for simulation/testing)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);

      // Set initial volume
      this.setVolume(this.state.volume);

      // Play startup sound
      await this.playStartupSound();

      console.log('✅ Speaker system initialized');
      return true;
    } catch (error) {
      console.error('❌ Speaker initialization failed:', error);
      return false;
    }
  }

  /**
   * Play startup confirmation sound
   */
  private async playStartupSound(): Promise<void> {
    if (!this.audioContext || !this.gainNode) return;

    const osc = this.audioContext.createOscillator();
    const tempGain = this.audioContext.createGain();

    osc.connect(tempGain);
    tempGain.connect(this.gainNode);

    // Pleasant startup tone
    osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(660, this.audioContext.currentTime + 0.2);

    tempGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    tempGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.3);
  }

  /**
   * Play Schumann Resonance (7.83Hz carrier)
   */
  playSchumannResonance(): void {
    if (!this.audioContext || !this.gainNode) return;

    this.stopAll();
    const preset = AUDIO_PRESETS.SCHUMANN_RESONANCE;

    // Create carrier tone with modulation
    const carrier = this.audioContext.createOscillator();
    const modulator = this.audioContext.createOscillator();
    const modulatorGain = this.audioContext.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(200, this.audioContext.currentTime);

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(preset.frequency, this.audioContext.currentTime);

    modulatorGain.gain.setValueAtTime(50, this.audioContext.currentTime);

    modulator.connect(modulatorGain);
    modulatorGain.connect(carrier.frequency);
    carrier.connect(this.gainNode);

    carrier.start();
    modulator.start();

    this.oscillators.push(carrier, modulator);
    this.state.isPlaying = true;
    this.state.currentPreset = 'SCHUMANN_RESONANCE';
    this.emit('play', { preset: 'SCHUMANN_RESONANCE' });
  }

  /**
   * Play binaural beats
   */
  playBinauralBeats(preset: 'BINAURAL_ALPHA' | 'BINAURAL_THETA'): void {
    if (!this.audioContext || !this.gainNode) return;

    this.stopAll();
    const settings = AUDIO_PRESETS[preset];

    // Left ear tone
    const leftOsc = this.audioContext.createOscillator();
    const leftPan = this.audioContext.createStereoPanner();
    leftOsc.type = 'sine';
    leftOsc.frequency.setValueAtTime(settings.baseFrequency, this.audioContext.currentTime);
    leftPan.pan.setValueAtTime(-1, this.audioContext.currentTime);
    leftOsc.connect(leftPan);
    leftPan.connect(this.gainNode);

    // Right ear tone (slightly different frequency for binaural effect)
    const rightOsc = this.audioContext.createOscillator();
    const rightPan = this.audioContext.createStereoPanner();
    rightOsc.type = 'sine';
    rightOsc.frequency.setValueAtTime(
      settings.baseFrequency + settings.beatFrequency,
      this.audioContext.currentTime
    );
    rightPan.pan.setValueAtTime(1, this.audioContext.currentTime);
    rightOsc.connect(rightPan);
    rightPan.connect(this.gainNode);

    leftOsc.start();
    rightOsc.start();

    this.oscillators.push(leftOsc, rightOsc);
    this.state.isPlaying = true;
    this.state.currentPreset = preset;
    this.emit('play', { preset });
  }

  /**
   * Play step cadence metronome
   */
  playCadence(bpm: number = 170): void {
    if (!this.audioContext || !this.gainNode) return;

    this.stopAll();
    const interval = 60000 / bpm;

    const playClick = () => {
      if (!this.audioContext || !this.gainNode || !this.state.isPlaying) return;

      const osc = this.audioContext.createOscillator();
      const clickGain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, this.audioContext.currentTime);

      clickGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

      osc.connect(clickGain);
      clickGain.connect(this.gainNode);

      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + 0.05);

      setTimeout(playClick, interval);
    };

    this.state.isPlaying = true;
    this.state.currentPreset = 'STEP_CADENCE';
    playClick();
    this.emit('play', { preset: 'STEP_CADENCE', bpm });
  }

  /**
   * Play navigation prompt
   */
  async playNavigationPrompt(direction: 'left' | 'right' | 'straight' | 'arrived'): Promise<void> {
    if (!this.audioContext || !this.gainNode) return;

    const frequencies: Record<string, number[]> = {
      left: [440, 330],      // Descending = left
      right: [330, 440],     // Ascending = right
      straight: [440, 440],  // Same = straight
      arrived: [440, 550, 660, 880] // Triumphant = arrived
    };

    const tones = frequencies[direction];
    const duration = 0.15;

    for (let i = 0; i < tones.length; i++) {
      const osc = this.audioContext.createOscillator();
      const tempGain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(tones[i], this.audioContext.currentTime + i * duration);

      tempGain.gain.setValueAtTime(0.4, this.audioContext.currentTime + i * duration);
      tempGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + (i + 1) * duration);

      osc.connect(tempGain);
      tempGain.connect(this.gainNode);

      osc.start(this.audioContext.currentTime + i * duration);
      osc.stop(this.audioContext.currentTime + (i + 1) * duration);
    }
  }

  /**
   * Play grounding confirmation
   */
  playGroundingConfirmation(): void {
    if (!this.audioContext || !this.gainNode) return;

    // Earth-like low frequency pulse
    const osc = this.audioContext.createOscillator();
    const tempGain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(82.41, this.audioContext.currentTime); // Low E
    osc.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.5);

    tempGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    tempGain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.3);
    tempGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);

    osc.connect(tempGain);
    tempGain.connect(this.gainNode);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.8);
  }

  /**
   * Set volume (0-100)
   */
  setVolume(level: number): void {
    this.state.volume = Math.max(SPEAKER_CONFIG.VOLUME.MIN, Math.min(SPEAKER_CONFIG.VOLUME.MAX, level));

    if (this.gainNode) {
      // Convert 0-100 to logarithmic gain
      const gain = this.state.isMuted ? 0 : Math.pow(this.state.volume / 100, 2);
      this.gainNode.gain.setValueAtTime(gain, this.audioContext?.currentTime || 0);
    }

    this.emit('volume_change', { volume: this.state.volume });
  }

  /**
   * Mute/unmute
   */
  toggleMute(): boolean {
    this.state.isMuted = !this.state.isMuted;
    this.setVolume(this.state.volume); // Re-apply volume with mute state
    return this.state.isMuted;
  }

  /**
   * Toggle bone conduction mode
   */
  toggleBoneConduction(): boolean {
    this.state.boneConduction = !this.state.boneConduction;
    // In hardware, this would switch audio routing
    console.log(`Bone conduction: ${this.state.boneConduction ? 'ON' : 'OFF'}`);
    return this.state.boneConduction;
  }

  /**
   * Set EQ preset
   */
  setEQ(presetName: keyof typeof EQ_PRESETS): void {
    this.state.eqPreset = presetName;
    const preset = EQ_PRESETS[presetName];
    // In production, this would adjust actual EQ filters
    console.log(`EQ set to: ${preset.name}`, preset.bands);
  }

  /**
   * Stop all audio
   */
  stopAll(): void {
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    this.oscillators = [];
    this.state.isPlaying = false;
    this.state.currentPreset = null;
    this.emit('stop', {});
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
      this.state.isPlaying = false;
      this.emit('pause', {});
    }
  }

  /**
   * Resume playback
   */
  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
      this.state.isPlaying = true;
      this.emit('play', { resumed: true });
    }
  }

  /**
   * Simulate Bluetooth connection
   */
  async connectBluetooth(deviceId: string): Promise<boolean> {
    console.log(`🔵 Connecting to Bluetooth device: ${deviceId}`);

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    this.state.bluetoothConnected = true;
    this.emit('bluetooth_connect', { deviceId });
    console.log('✅ Bluetooth connected');
    return true;
  }

  /**
   * Disconnect Bluetooth
   */
  disconnectBluetooth(): void {
    this.state.bluetoothConnected = false;
    this.emit('bluetooth_disconnect', {});
    console.log('🔵 Bluetooth disconnected');
  }

  /**
   * Get audio level for LED sync (returns 0-1)
   */
  getAudioLevel(): number {
    // In production, this would analyze actual audio output
    // For now, return simulated level based on playing state
    if (!this.state.isPlaying) return 0;
    return (Math.sin(Date.now() / 100) + 1) / 2 * (this.state.volume / 100);
  }

  /**
   * Event handling
   */
  on(event: AudioEventType, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: AudioEventType, data: Record<string, unknown>): void {
    const listeners = this.eventListeners.get(event) || [];
    const audioEvent: AudioEvent = {
      type: event,
      timestamp: Date.now(),
      data
    };
    listeners.forEach(callback => callback(audioEvent));
  }

  /**
   * Get current state
   */
  getState(): AudioState {
    return { ...this.state };
  }

  /**
   * Shutdown speaker system
   */
  async shutdown(): Promise<void> {
    this.stopAll();
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
    console.log('🔇 TERRA-PULSE Speaker System shutdown complete');
  }
}

// Export singleton instance
export const speakerSystem = new TerraPulseSpeaker();
