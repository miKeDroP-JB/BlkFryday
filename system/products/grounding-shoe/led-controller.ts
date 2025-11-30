/**
 * TERRA-PULSE LED Controller
 * Manages the thin LED lighting system for grounding shoes
 */

// LED Configuration
export const LED_CONFIG = {
  TOTAL_LEDS: 42,
  ZONES: {
    OUTSOLE_PERIMETER: { start: 0, count: 18 },
    HEEL_COUNTER: { start: 18, count: 8 },
    SIDE_LEFT: { start: 26, count: 6 },
    SIDE_RIGHT: { start: 32, count: 6 },
    TONGUE: { start: 38, count: 4 }
  },
  MAX_BRIGHTNESS: 255,
  DEFAULT_BRIGHTNESS: 180,
  STRIP_TYPE: 'SK6812_RGBW'
};

// Color Definitions
export interface RGBWColor {
  r: number;  // 0-255
  g: number;  // 0-255
  b: number;  // 0-255
  w: number;  // 0-255 (warm white)
}

export const COLORS = {
  EARTH_GREEN: { r: 0, g: 255, b: 136, w: 0 },
  SAFETY_WHITE: { r: 255, g: 255, b: 255, w: 255 },
  GROUNDING_AMBER: { r: 255, g: 140, b: 0, w: 50 },
  ALERT_RED: { r: 255, g: 0, b: 0, w: 0 },
  CALM_BLUE: { r: 0, g: 100, b: 255, w: 0 },
  WARNING_YELLOW: { r: 255, g: 255, b: 0, w: 0 },
  OFF: { r: 0, g: 0, b: 0, w: 0 }
};

// Lighting Modes
export enum LightingMode {
  OFF = 'off',
  EARTH_PULSE = 'earth_pulse',
  NIGHT_RUNNER = 'night_runner',
  HEART_SYNC = 'heart_sync',
  MUSIC_REACTIVE = 'music_reactive',
  GROUNDING_INDICATOR = 'grounding_indicator',
  RAINBOW_FLOW = 'rainbow_flow',
  STEP_COUNTER = 'step_counter',
  CUSTOM = 'custom'
}

// Grounding Status
export enum GroundingStatus {
  CONNECTED = 'connected',
  PARTIAL = 'partial',
  DISCONNECTED = 'disconnected'
}

// LED State Interface
export interface LEDState {
  leds: RGBWColor[];
  brightness: number;
  mode: LightingMode;
  isActive: boolean;
}

/**
 * Terra-Pulse LED Controller Class
 */
export class TerraPulseLEDController {
  private state: LEDState;
  private animationFrame: number | null = null;
  private groundingStatus: GroundingStatus = GroundingStatus.DISCONNECTED;
  private heartRate: number = 70;
  private audioLevel: number = 0;

  constructor() {
    this.state = {
      leds: Array(LED_CONFIG.TOTAL_LEDS).fill({ ...COLORS.OFF }),
      brightness: LED_CONFIG.DEFAULT_BRIGHTNESS,
      mode: LightingMode.OFF,
      isActive: false
    };
  }

  /**
   * Initialize the LED system
   */
  async initialize(): Promise<boolean> {
    console.log('🔌 Initializing TERRA-PULSE LED System...');
    console.log(`   LED Type: ${LED_CONFIG.STRIP_TYPE}`);
    console.log(`   Total LEDs: ${LED_CONFIG.TOTAL_LEDS}`);

    // Perform startup sequence
    await this.runStartupSequence();

    this.state.isActive = true;
    return true;
  }

  /**
   * Run startup LED sequence
   */
  private async runStartupSequence(): Promise<void> {
    // Flash all zones in sequence
    const zones = Object.values(LED_CONFIG.ZONES);

    for (const zone of zones) {
      this.setZoneColor(zone.start, zone.count, COLORS.EARTH_GREEN);
      await this.delay(100);
      this.setZoneColor(zone.start, zone.count, COLORS.OFF);
    }

    // Final confirmation flash
    await this.delay(200);
    this.setAllLEDs(COLORS.EARTH_GREEN);
    await this.delay(300);
    this.setAllLEDs(COLORS.OFF);
  }

  /**
   * Set lighting mode
   */
  setMode(mode: LightingMode): void {
    this.state.mode = mode;
    this.stopAnimation();

    switch (mode) {
      case LightingMode.OFF:
        this.setAllLEDs(COLORS.OFF);
        break;
      case LightingMode.EARTH_PULSE:
        this.startEarthPulseAnimation();
        break;
      case LightingMode.NIGHT_RUNNER:
        this.setAllLEDs(COLORS.SAFETY_WHITE);
        break;
      case LightingMode.HEART_SYNC:
        this.startHeartSyncAnimation();
        break;
      case LightingMode.MUSIC_REACTIVE:
        this.startMusicReactiveMode();
        break;
      case LightingMode.GROUNDING_INDICATOR:
        this.updateGroundingIndicator();
        break;
      case LightingMode.RAINBOW_FLOW:
        this.startRainbowAnimation();
        break;
      case LightingMode.STEP_COUNTER:
        this.startStepCounterMode();
        break;
    }
  }

  /**
   * Earth Pulse Animation - Breathing effect in earth tones
   */
  private startEarthPulseAnimation(): void {
    let phase = 0;
    const frequency = 0.5; // Hz

    const animate = () => {
      phase += 0.02;
      const intensity = (Math.sin(phase * Math.PI * 2 * frequency) + 1) / 2;

      const color: RGBWColor = {
        r: Math.floor(COLORS.EARTH_GREEN.r * intensity),
        g: Math.floor(COLORS.EARTH_GREEN.g * intensity),
        b: Math.floor(COLORS.EARTH_GREEN.b * intensity),
        w: Math.floor(30 * intensity)
      };

      this.setAllLEDs(color);
      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Heart Rate Sync Animation
   */
  private startHeartSyncAnimation(): void {
    const animate = () => {
      const beatInterval = 60000 / this.heartRate; // ms per beat
      const phase = (Date.now() % beatInterval) / beatInterval;

      // Quick pulse on beat
      let intensity: number;
      if (phase < 0.1) {
        intensity = 1;
      } else if (phase < 0.2) {
        intensity = 1 - ((phase - 0.1) / 0.1);
      } else {
        intensity = 0.1;
      }

      const color: RGBWColor = {
        r: Math.floor(255 * intensity),
        g: Math.floor(50 * intensity),
        b: Math.floor(50 * intensity),
        w: 0
      };

      this.setAllLEDs(color);
      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Music Reactive Mode
   */
  private startMusicReactiveMode(): void {
    const animate = () => {
      // Audio level determines color intensity and hue
      const hue = (this.audioLevel * 360) % 360;
      const color = this.hslToRgbw(hue, 100, 50 + this.audioLevel * 25);

      // Apply to different zones based on frequency ranges
      const { OUTSOLE_PERIMETER, HEEL_COUNTER, SIDE_LEFT, SIDE_RIGHT, TONGUE } = LED_CONFIG.ZONES;

      // Bass on outsole
      this.setZoneColor(OUTSOLE_PERIMETER.start, OUTSOLE_PERIMETER.count, color);

      // Mids on sides
      this.setZoneColor(SIDE_LEFT.start, SIDE_LEFT.count, color);
      this.setZoneColor(SIDE_RIGHT.start, SIDE_RIGHT.count, color);

      // Highs on heel and tongue
      this.setZoneColor(HEEL_COUNTER.start, HEEL_COUNTER.count, color);
      this.setZoneColor(TONGUE.start, TONGUE.count, color);

      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Rainbow Flow Animation
   */
  private startRainbowAnimation(): void {
    let hueOffset = 0;

    const animate = () => {
      hueOffset = (hueOffset + 1) % 360;

      for (let i = 0; i < LED_CONFIG.TOTAL_LEDS; i++) {
        const hue = (hueOffset + (i * 360 / LED_CONFIG.TOTAL_LEDS)) % 360;
        this.state.leds[i] = this.hslToRgbw(hue, 100, 50);
      }

      this.render();
      this.animationFrame = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Step Counter Mode - Flash on each step
   */
  private startStepCounterMode(): void {
    // This would integrate with accelerometer data
    // For now, show ready state
    this.setAllLEDs(COLORS.CALM_BLUE);
  }

  /**
   * Update grounding indicator based on status
   */
  updateGroundingIndicator(): void {
    let color: RGBWColor;

    switch (this.groundingStatus) {
      case GroundingStatus.CONNECTED:
        color = COLORS.EARTH_GREEN;
        break;
      case GroundingStatus.PARTIAL:
        color = COLORS.WARNING_YELLOW;
        break;
      case GroundingStatus.DISCONNECTED:
        color = COLORS.ALERT_RED;
        break;
    }

    // Show status on heel counter (most visible when standing)
    const heel = LED_CONFIG.ZONES.HEEL_COUNTER;
    this.setZoneColor(heel.start, heel.count, color);

    // Subtle glow on outsole
    const outsole = LED_CONFIG.ZONES.OUTSOLE_PERIMETER;
    const dimColor = this.dimColor(color, 0.3);
    this.setZoneColor(outsole.start, outsole.count, dimColor);
  }

  /**
   * Set grounding status (called by grounding sensor)
   */
  setGroundingStatus(status: GroundingStatus): void {
    this.groundingStatus = status;
    if (this.state.mode === LightingMode.GROUNDING_INDICATOR) {
      this.updateGroundingIndicator();
    }
  }

  /**
   * Update heart rate for sync mode
   */
  setHeartRate(bpm: number): void {
    this.heartRate = Math.max(40, Math.min(200, bpm));
  }

  /**
   * Update audio level for reactive mode (0-1)
   */
  setAudioLevel(level: number): void {
    this.audioLevel = Math.max(0, Math.min(1, level));
  }

  /**
   * Trigger step flash for step counter mode
   */
  triggerStep(): void {
    if (this.state.mode === LightingMode.STEP_COUNTER) {
      this.setAllLEDs(COLORS.EARTH_GREEN);
      setTimeout(() => this.setAllLEDs(COLORS.CALM_BLUE), 150);
    }
  }

  /**
   * Set brightness level (0-255)
   */
  setBrightness(level: number): void {
    this.state.brightness = Math.max(0, Math.min(255, level));
    this.render();
  }

  /**
   * Set custom color for all LEDs
   */
  setCustomColor(color: RGBWColor): void {
    this.state.mode = LightingMode.CUSTOM;
    this.stopAnimation();
    this.setAllLEDs(color);
  }

  /**
   * Set color for a specific zone
   */
  setZoneCustomColor(zoneName: keyof typeof LED_CONFIG.ZONES, color: RGBWColor): void {
    const zone = LED_CONFIG.ZONES[zoneName];
    this.setZoneColor(zone.start, zone.count, color);
    this.render();
  }

  // === Private Helper Methods ===

  private setAllLEDs(color: RGBWColor): void {
    this.state.leds = Array(LED_CONFIG.TOTAL_LEDS).fill({ ...color });
    this.render();
  }

  private setZoneColor(start: number, count: number, color: RGBWColor): void {
    for (let i = start; i < start + count; i++) {
      this.state.leds[i] = { ...color };
    }
  }

  private dimColor(color: RGBWColor, factor: number): RGBWColor {
    return {
      r: Math.floor(color.r * factor),
      g: Math.floor(color.g * factor),
      b: Math.floor(color.b * factor),
      w: Math.floor(color.w * factor)
    };
  }

  private hslToRgbw(h: number, s: number, l: number): RGBWColor {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    return {
      r: Math.floor((r + m) * 255),
      g: Math.floor((g + m) * 255),
      b: Math.floor((b + m) * 255),
      w: 0
    };
  }

  private render(): void {
    // Apply brightness and send to hardware
    const adjustedLEDs = this.state.leds.map(led => ({
      r: Math.floor(led.r * this.state.brightness / 255),
      g: Math.floor(led.g * this.state.brightness / 255),
      b: Math.floor(led.b * this.state.brightness / 255),
      w: Math.floor(led.w * this.state.brightness / 255)
    }));

    // In production, this would send data to the actual LED strip
    // via SPI, I2C, or proprietary protocol
    this.sendToHardware(adjustedLEDs);
  }

  private sendToHardware(leds: RGBWColor[]): void {
    // Hardware abstraction layer
    // This is where we'd interface with the actual LED controller chip
    console.debug('LED Update:', leds.length, 'pixels');
  }

  private stopAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Shutdown the LED system
   */
  async shutdown(): Promise<void> {
    this.stopAnimation();
    this.setAllLEDs(COLORS.OFF);
    this.state.isActive = false;
    console.log('💡 TERRA-PULSE LED System shutdown complete');
  }

  /**
   * Get current state
   */
  getState(): LEDState {
    return { ...this.state };
  }
}

// Export singleton instance
export const ledController = new TerraPulseLEDController();
