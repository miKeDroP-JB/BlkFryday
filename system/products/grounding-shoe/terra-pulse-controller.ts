/**
 * TERRA-PULSE Main Controller
 * Integrates LED, Speaker, and Grounding systems into unified shoe controller
 */

import {
  TerraPulseLEDController,
  ledController,
  LightingMode,
  GroundingStatus as LEDGroundingStatus,
  RGBWColor,
  COLORS
} from './led-controller';

import {
  TerraPulseSpeaker,
  speakerSystem,
  AUDIO_PRESETS
} from './speaker-system';

import {
  GroundingSensor,
  groundingSensor,
  GroundingQuality,
  GroundingStatus
} from './grounding-sensor';

// Device Configuration
export const DEVICE_CONFIG = {
  PRODUCT_NAME: 'TERRA-PULSE',
  PRODUCT_LINE: 'Grounding Shoe',
  VERSION: '1.0.0',
  MODELS: {
    CORE: { led: true, speaker: false, boneConduction: false, price: 189 },
    AUDIO: { led: true, speaker: true, boneConduction: false, price: 249 },
    PRO: { led: true, speaker: true, boneConduction: true, price: 299 }
  },
  BATTERY: {
    CAPACITY_MAH: 400,
    VOLTAGE: 3.7,
    CHARGING: ['qi_wireless', 'usb_c']
  },
  CONNECTIVITY: {
    BLUETOOTH: '5.3',
    NFC: true,
    APP: 'TERRA-PULSE Connect'
  }
};

// Shoe Position
export enum ShoePosition {
  LEFT = 'left',
  RIGHT = 'right'
}

// Device State
export interface DeviceState {
  isActive: boolean;
  batteryLevel: number;
  isCharging: boolean;
  bluetoothConnected: boolean;
  appConnected: boolean;
  currentMode: ShoeMode;
  ledActive: boolean;
  speakerActive: boolean;
  groundingActive: boolean;
}

// Shoe Operating Modes
export enum ShoeMode {
  STANDBY = 'standby',
  GROUNDING = 'grounding',
  RUNNING = 'running',
  MEDITATION = 'meditation',
  PARTY = 'party',
  NAVIGATION = 'navigation',
  CUSTOM = 'custom'
}

// Mode Presets
const MODE_PRESETS: Record<ShoeMode, {
  led: LightingMode;
  audio: string | null;
  groundingFeedback: boolean;
}> = {
  [ShoeMode.STANDBY]: {
    led: LightingMode.OFF,
    audio: null,
    groundingFeedback: false
  },
  [ShoeMode.GROUNDING]: {
    led: LightingMode.GROUNDING_INDICATOR,
    audio: 'SCHUMANN_RESONANCE',
    groundingFeedback: true
  },
  [ShoeMode.RUNNING]: {
    led: LightingMode.NIGHT_RUNNER,
    audio: 'STEP_CADENCE',
    groundingFeedback: false
  },
  [ShoeMode.MEDITATION]: {
    led: LightingMode.EARTH_PULSE,
    audio: 'BINAURAL_THETA',
    groundingFeedback: true
  },
  [ShoeMode.PARTY]: {
    led: LightingMode.MUSIC_REACTIVE,
    audio: null,
    groundingFeedback: false
  },
  [ShoeMode.NAVIGATION]: {
    led: LightingMode.OFF,
    audio: null,
    groundingFeedback: false
  },
  [ShoeMode.CUSTOM]: {
    led: LightingMode.CUSTOM,
    audio: null,
    groundingFeedback: false
  }
};

/**
 * Terra-Pulse Main Controller Class
 */
export class TerraPulseController {
  private position: ShoePosition;
  private model: keyof typeof DEVICE_CONFIG.MODELS;
  private state: DeviceState;
  private led: TerraPulseLEDController;
  private speaker: TerraPulseSpeaker;
  private grounding: GroundingSensor;
  private stepCount: number = 0;
  private lastAcceleration: number = 0;
  private audioLedSyncInterval: NodeJS.Timeout | null = null;

  constructor(
    position: ShoePosition = ShoePosition.LEFT,
    model: keyof typeof DEVICE_CONFIG.MODELS = 'PRO'
  ) {
    this.position = position;
    this.model = model;
    this.led = ledController;
    this.speaker = speakerSystem;
    this.grounding = groundingSensor;

    this.state = {
      isActive: false,
      batteryLevel: 100,
      isCharging: false,
      bluetoothConnected: false,
      appConnected: false,
      currentMode: ShoeMode.STANDBY,
      ledActive: false,
      speakerActive: false,
      groundingActive: false
    };
  }

  /**
   * Initialize the shoe system
   */
  async initialize(): Promise<boolean> {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('              TERRA-PULSE GROUNDING SHOE SYSTEM');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Model: ${DEVICE_CONFIG.PRODUCT_NAME} ${this.model}`);
    console.log(`   Position: ${this.position.toUpperCase()}`);
    console.log(`   Version: ${DEVICE_CONFIG.VERSION}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    try {
      // Initialize subsystems
      const modelConfig = DEVICE_CONFIG.MODELS[this.model];

      // LED system (all models)
      if (modelConfig.led) {
        await this.led.initialize();
        this.state.ledActive = true;
      }

      // Speaker system (Audio and Pro models)
      if (modelConfig.speaker) {
        await this.speaker.initialize();
        this.state.speakerActive = true;
      }

      // Grounding sensor (all models)
      await this.grounding.initialize();
      this.state.groundingActive = true;

      // Set up grounding status listener
      this.grounding.onStatusChange((status) => this.handleGroundingChange(status));

      this.state.isActive = true;
      console.log('\n✅ TERRA-PULSE initialization complete\n');

      // Start in grounding mode by default
      await this.setMode(ShoeMode.GROUNDING);

      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      return false;
    }
  }

  /**
   * Set operating mode
   */
  async setMode(mode: ShoeMode): Promise<void> {
    const preset = MODE_PRESETS[mode];
    this.state.currentMode = mode;

    console.log(`🔄 Mode: ${mode.toUpperCase()}`);

    // Configure LED
    if (this.state.ledActive) {
      this.led.setMode(preset.led);
    }

    // Configure audio
    if (this.state.speakerActive && preset.audio) {
      switch (preset.audio) {
        case 'SCHUMANN_RESONANCE':
          this.speaker.playSchumannResonance();
          break;
        case 'BINAURAL_THETA':
          this.speaker.playBinauralBeats('BINAURAL_THETA');
          break;
        case 'BINAURAL_ALPHA':
          this.speaker.playBinauralBeats('BINAURAL_ALPHA');
          break;
        case 'STEP_CADENCE':
          this.speaker.playCadence(170);
          break;
      }
    } else if (this.state.speakerActive) {
      this.speaker.stopAll();
    }

    // Start audio-LED sync for party mode
    if (mode === ShoeMode.PARTY && this.state.speakerActive) {
      this.startAudioLedSync();
    } else {
      this.stopAudioLedSync();
    }
  }

  /**
   * Handle grounding status changes
   */
  private handleGroundingChange(status: GroundingStatus): void {
    // Update LED grounding indicator
    if (this.state.currentMode === ShoeMode.GROUNDING ||
        this.state.currentMode === ShoeMode.MEDITATION) {

      let ledStatus: LEDGroundingStatus;

      switch (status.quality) {
        case GroundingQuality.EXCELLENT:
        case GroundingQuality.GOOD:
          ledStatus = LEDGroundingStatus.CONNECTED;
          break;
        case GroundingQuality.PARTIAL:
        case GroundingQuality.WEAK:
          ledStatus = LEDGroundingStatus.PARTIAL;
          break;
        default:
          ledStatus = LEDGroundingStatus.DISCONNECTED;
      }

      this.led.setGroundingStatus(ledStatus);

      // Play audio feedback on connection
      if (status.isGrounded && status.duration < 0.2 && this.state.speakerActive) {
        this.speaker.playGroundingConfirmation();
      }
    }
  }

  /**
   * Start audio-LED synchronization
   */
  private startAudioLedSync(): void {
    this.audioLedSyncInterval = setInterval(() => {
      if (this.state.speakerActive) {
        const level = this.speaker.getAudioLevel();
        this.led.setAudioLevel(level);
      }
    }, 16); // ~60fps
  }

  /**
   * Stop audio-LED synchronization
   */
  private stopAudioLedSync(): void {
    if (this.audioLedSyncInterval) {
      clearInterval(this.audioLedSyncInterval);
      this.audioLedSyncInterval = null;
    }
  }

  /**
   * Handle step detection (from accelerometer)
   */
  onStep(): void {
    this.stepCount++;
    this.led.triggerStep();

    // Flash on step in running mode
    if (this.state.currentMode === ShoeMode.RUNNING) {
      // Step flash handled by LED controller
    }
  }

  /**
   * Handle accelerometer data
   */
  onAccelerometerData(x: number, y: number, z: number): void {
    const acceleration = Math.sqrt(x * x + y * y + z * z);

    // Simple step detection
    if (acceleration > 15 && this.lastAcceleration < 12) {
      this.onStep();
    }

    this.lastAcceleration = acceleration;
  }

  /**
   * Send navigation haptic/audio
   */
  navigate(direction: 'left' | 'right' | 'straight' | 'arrived'): void {
    if (this.state.speakerActive) {
      this.speaker.playNavigationPrompt(direction);
    }

    // Also flash LED in navigation direction
    if (this.state.ledActive) {
      const color: RGBWColor = direction === 'arrived' ? COLORS.EARTH_GREEN : COLORS.SAFETY_WHITE;
      this.led.setCustomColor(color);
      setTimeout(() => {
        if (this.state.currentMode !== ShoeMode.NAVIGATION) {
          this.setMode(this.state.currentMode);
        }
      }, 500);
    }
  }

  /**
   * Set LED brightness
   */
  setBrightness(level: number): void {
    if (this.state.ledActive) {
      this.led.setBrightness(level);
    }
  }

  /**
   * Set speaker volume
   */
  setVolume(level: number): void {
    if (this.state.speakerActive) {
      this.speaker.setVolume(level);
    }
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    if (this.state.speakerActive) {
      return this.speaker.toggleMute();
    }
    return false;
  }

  /**
   * Set custom LED color
   */
  setCustomLEDColor(color: RGBWColor): void {
    if (this.state.ledActive) {
      this.led.setCustomColor(color);
    }
  }

  /**
   * Connect to Bluetooth
   */
  async connectBluetooth(deviceId: string): Promise<boolean> {
    if (this.state.speakerActive) {
      const connected = await this.speaker.connectBluetooth(deviceId);
      this.state.bluetoothConnected = connected;
      return connected;
    }
    return false;
  }

  /**
   * Update heart rate for sync mode
   */
  setHeartRate(bpm: number): void {
    if (this.state.ledActive) {
      this.led.setHeartRate(bpm);
    }
  }

  /**
   * Get grounding statistics
   */
  getGroundingStats() {
    return this.grounding.getStats();
  }

  /**
   * Get today's grounding time
   */
  getTodayGroundingTime(): number {
    return this.grounding.getTodayGroundingTime();
  }

  /**
   * Get current grounding status
   */
  getGroundingStatus(): GroundingStatus {
    return this.grounding.getStatus();
  }

  /**
   * Get step count
   */
  getStepCount(): number {
    return this.stepCount;
  }

  /**
   * Reset step count
   */
  resetStepCount(): void {
    this.stepCount = 0;
  }

  /**
   * Get battery level (simulated)
   */
  getBatteryLevel(): number {
    return this.state.batteryLevel;
  }

  /**
   * Simulate battery drain
   */
  simulateBatteryDrain(percent: number): void {
    this.state.batteryLevel = Math.max(0, this.state.batteryLevel - percent);

    // Low battery warning
    if (this.state.batteryLevel <= 10 && this.state.ledActive) {
      // Flash red warning
      this.led.setCustomColor(COLORS.ALERT_RED);
      if (this.state.speakerActive) {
        this.speaker.playNavigationPrompt('left'); // Use as warning tone
      }
    }
  }

  /**
   * Get device state
   */
  getState(): DeviceState {
    return { ...this.state };
  }

  /**
   * Calibrate grounding sensor
   */
  async calibrateGrounding(): Promise<boolean> {
    return await this.grounding.calibrate();
  }

  /**
   * Shutdown the shoe system
   */
  async shutdown(): Promise<void> {
    console.log('\n🔌 Shutting down TERRA-PULSE...');

    this.stopAudioLedSync();

    if (this.state.ledActive) {
      await this.led.shutdown();
    }

    if (this.state.speakerActive) {
      await this.speaker.shutdown();
    }

    if (this.state.groundingActive) {
      this.grounding.shutdown();
    }

    this.state.isActive = false;
    console.log('👟 TERRA-PULSE shutdown complete\n');
  }

  /**
   * Factory reset
   */
  async factoryReset(): Promise<void> {
    console.log('⚠️ Factory reset initiated...');
    await this.shutdown();
    this.stepCount = 0;
    this.state.batteryLevel = 100;
    await this.initialize();
    console.log('✅ Factory reset complete');
  }
}

// Export factory function
export function createTerraPulse(
  position: ShoePosition = ShoePosition.LEFT,
  model: keyof typeof DEVICE_CONFIG.MODELS = 'PRO'
): TerraPulseController {
  return new TerraPulseController(position, model);
}

// Export pair creation for both shoes
export function createTerraPulsePair(
  model: keyof typeof DEVICE_CONFIG.MODELS = 'PRO'
): { left: TerraPulseController; right: TerraPulseController } {
  return {
    left: createTerraPulse(ShoePosition.LEFT, model),
    right: createTerraPulse(ShoePosition.RIGHT, model)
  };
}
