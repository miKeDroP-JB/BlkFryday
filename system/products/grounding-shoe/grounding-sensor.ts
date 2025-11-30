/**
 * TERRA-PULSE Grounding Sensor System
 * Detects earth connection through conductive pathways
 */

// Grounding Hardware Configuration
export const GROUNDING_CONFIG = {
  CONTACT_POINTS: 7,
  MEASUREMENT_INTERVAL_MS: 100,
  RESISTANCE_THRESHOLDS: {
    CONNECTED: 100000,      // < 100kΩ = fully grounded
    PARTIAL: 1000000,       // < 1MΩ = partial connection
    DISCONNECTED: 10000000  // > 10MΩ = no connection
  },
  INSOLE: {
    MATERIAL: 'copper_mesh',
    COVERAGE_PERCENT: 60
  },
  CARBON_PLATE: {
    THICKNESS_MM: 1.5,
    CONDUCTIVITY: 'high'
  },
  OUTSOLE_PODS: {
    MATERIAL: 'conductive_rubber',
    COMPOUND: 'carbon_infused_silicone',
    LOCATIONS: ['heel_center', 'heel_left', 'heel_right', 'arch', 'ball_left', 'ball_right', 'toe']
  }
};

// Grounding Status Types
export enum GroundingQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  PARTIAL = 'partial',
  WEAK = 'weak',
  NONE = 'none'
}

export interface GroundingStatus {
  isGrounded: boolean;
  quality: GroundingQuality;
  resistance: number;           // Ohms
  contactPoints: boolean[];     // Which pods are making contact
  activeContacts: number;       // Count of active contact points
  duration: number;             // Seconds grounded in current session
  lastConnection: Date | null;
}

export interface GroundingSession {
  startTime: Date;
  endTime: Date | null;
  totalDuration: number;        // Seconds
  averageQuality: GroundingQuality;
  resistanceHistory: number[];
  location?: { lat: number; lng: number };
}

/**
 * Terra-Pulse Grounding Sensor Controller
 */
export class GroundingSensor {
  private status: GroundingStatus;
  private currentSession: GroundingSession | null = null;
  private measurementInterval: NodeJS.Timeout | null = null;
  private sessionHistory: GroundingSession[] = [];
  private onStatusChangeCallbacks: ((status: GroundingStatus) => void)[] = [];

  constructor() {
    this.status = {
      isGrounded: false,
      quality: GroundingQuality.NONE,
      resistance: Infinity,
      contactPoints: Array(GROUNDING_CONFIG.CONTACT_POINTS).fill(false),
      activeContacts: 0,
      duration: 0,
      lastConnection: null
    };
  }

  /**
   * Initialize the grounding sensor system
   */
  async initialize(): Promise<boolean> {
    console.log('🌍 Initializing TERRA-PULSE Grounding Sensor...');
    console.log(`   Contact Points: ${GROUNDING_CONFIG.CONTACT_POINTS}`);
    console.log(`   Insole: ${GROUNDING_CONFIG.INSOLE.MATERIAL}`);
    console.log(`   Outsole: ${GROUNDING_CONFIG.OUTSOLE_PODS.COMPOUND}`);

    // Start continuous measurement
    this.startMeasurement();

    console.log('✅ Grounding sensor initialized');
    return true;
  }

  /**
   * Start continuous resistance measurement
   */
  private startMeasurement(): void {
    this.measurementInterval = setInterval(() => {
      this.measureGrounding();
    }, GROUNDING_CONFIG.MEASUREMENT_INTERVAL_MS);
  }

  /**
   * Measure grounding status
   */
  private measureGrounding(): void {
    // Simulate resistance measurement from each contact point
    // In production, this reads from actual ADC connected to contact pads
    const contactReadings = this.readContactPoints();

    // Calculate total effective resistance (parallel circuit)
    const activeReadings = contactReadings.filter(r => r < GROUNDING_CONFIG.RESISTANCE_THRESHOLDS.DISCONNECTED);
    let totalResistance: number;

    if (activeReadings.length === 0) {
      totalResistance = Infinity;
    } else if (activeReadings.length === 1) {
      totalResistance = activeReadings[0];
    } else {
      // Parallel resistance: 1/Rtotal = 1/R1 + 1/R2 + ...
      totalResistance = 1 / activeReadings.reduce((sum, r) => sum + (1 / r), 0);
    }

    // Determine quality
    const quality = this.calculateQuality(totalResistance, activeReadings.length);

    // Update status
    const wasGrounded = this.status.isGrounded;
    const isNowGrounded = quality !== GroundingQuality.NONE;

    this.status = {
      isGrounded: isNowGrounded,
      quality,
      resistance: totalResistance,
      contactPoints: contactReadings.map(r => r < GROUNDING_CONFIG.RESISTANCE_THRESHOLDS.DISCONNECTED),
      activeContacts: activeReadings.length,
      duration: isNowGrounded ? this.status.duration + (GROUNDING_CONFIG.MEASUREMENT_INTERVAL_MS / 1000) : 0,
      lastConnection: isNowGrounded ? new Date() : this.status.lastConnection
    };

    // Handle session transitions
    if (!wasGrounded && isNowGrounded) {
      this.startSession();
    } else if (wasGrounded && !isNowGrounded) {
      this.endSession();
    }

    // Record resistance for current session
    if (this.currentSession && isNowGrounded) {
      this.currentSession.resistanceHistory.push(totalResistance);
    }

    // Notify listeners
    this.notifyStatusChange();
  }

  /**
   * Read resistance from each contact point
   */
  private readContactPoints(): number[] {
    // Simulated readings - in production, these come from ADC
    return GROUNDING_CONFIG.OUTSOLE_PODS.LOCATIONS.map(() => {
      // Simulate varying contact based on random walk
      const baseResistance = Math.random() < 0.6 ? 50000 : 5000000;
      const noise = (Math.random() - 0.5) * 20000;
      return Math.max(0, baseResistance + noise);
    });
  }

  /**
   * Calculate grounding quality from resistance and contact count
   */
  private calculateQuality(resistance: number, contactCount: number): GroundingQuality {
    if (resistance > GROUNDING_CONFIG.RESISTANCE_THRESHOLDS.PARTIAL) {
      return GroundingQuality.NONE;
    }

    if (resistance < GROUNDING_CONFIG.RESISTANCE_THRESHOLDS.CONNECTED) {
      if (contactCount >= 5) return GroundingQuality.EXCELLENT;
      if (contactCount >= 3) return GroundingQuality.GOOD;
      return GroundingQuality.PARTIAL;
    }

    if (contactCount >= 3) return GroundingQuality.PARTIAL;
    return GroundingQuality.WEAK;
  }

  /**
   * Start a new grounding session
   */
  private startSession(): void {
    this.currentSession = {
      startTime: new Date(),
      endTime: null,
      totalDuration: 0,
      averageQuality: GroundingQuality.NONE,
      resistanceHistory: []
    };
    console.log('🌍 Grounding session started');
  }

  /**
   * End current grounding session
   */
  private endSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = new Date();
    this.currentSession.totalDuration =
      (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / 1000;

    // Calculate average quality
    const avgResistance =
      this.currentSession.resistanceHistory.reduce((a, b) => a + b, 0) /
      this.currentSession.resistanceHistory.length;
    this.currentSession.averageQuality = this.calculateQuality(
      avgResistance,
      Math.round(this.status.activeContacts)
    );

    this.sessionHistory.push(this.currentSession);
    console.log(`🌍 Grounding session ended: ${this.currentSession.totalDuration.toFixed(1)}s`);
    this.currentSession = null;
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: GroundingStatus) => void): void {
    this.onStatusChangeCallbacks.push(callback);
  }

  /**
   * Notify all listeners of status change
   */
  private notifyStatusChange(): void {
    this.onStatusChangeCallbacks.forEach(cb => cb(this.getStatus()));
  }

  /**
   * Get current grounding status
   */
  getStatus(): GroundingStatus {
    return { ...this.status };
  }

  /**
   * Get current session info
   */
  getCurrentSession(): GroundingSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  /**
   * Get session history
   */
  getSessionHistory(): GroundingSession[] {
    return [...this.sessionHistory];
  }

  /**
   * Get total grounding time today
   */
  getTodayGroundingTime(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.sessionHistory
      .filter(s => s.startTime >= today)
      .reduce((total, s) => total + s.totalDuration, 0) +
      (this.currentSession ?
        (Date.now() - this.currentSession.startTime.getTime()) / 1000 : 0);
  }

  /**
   * Get grounding statistics
   */
  getStats(): {
    totalSessions: number;
    totalTime: number;
    averageSessionLength: number;
    bestQuality: GroundingQuality;
    longestSession: number;
  } {
    const allSessions = [...this.sessionHistory];
    if (this.currentSession) {
      allSessions.push({
        ...this.currentSession,
        totalDuration: (Date.now() - this.currentSession.startTime.getTime()) / 1000
      });
    }

    if (allSessions.length === 0) {
      return {
        totalSessions: 0,
        totalTime: 0,
        averageSessionLength: 0,
        bestQuality: GroundingQuality.NONE,
        longestSession: 0
      };
    }

    const totalTime = allSessions.reduce((sum, s) => sum + s.totalDuration, 0);
    const qualityRanking: GroundingQuality[] = [
      GroundingQuality.EXCELLENT,
      GroundingQuality.GOOD,
      GroundingQuality.PARTIAL,
      GroundingQuality.WEAK,
      GroundingQuality.NONE
    ];

    const bestQuality = allSessions.reduce((best, s) => {
      const currentRank = qualityRanking.indexOf(s.averageQuality);
      const bestRank = qualityRanking.indexOf(best);
      return currentRank < bestRank ? s.averageQuality : best;
    }, GroundingQuality.NONE);

    return {
      totalSessions: allSessions.length,
      totalTime,
      averageSessionLength: totalTime / allSessions.length,
      bestQuality,
      longestSession: Math.max(...allSessions.map(s => s.totalDuration))
    };
  }

  /**
   * Calibrate the sensor (should be done on known grounded surface)
   */
  async calibrate(): Promise<boolean> {
    console.log('🔧 Calibrating grounding sensor...');
    console.log('   Please stand on a conductive surface');

    // Take multiple readings and average
    const readings: number[] = [];
    for (let i = 0; i < 10; i++) {
      const contacts = this.readContactPoints();
      const activeReadings = contacts.filter(r => r < GROUNDING_CONFIG.RESISTANCE_THRESHOLDS.DISCONNECTED);
      if (activeReadings.length > 0) {
        readings.push(1 / activeReadings.reduce((sum, r) => sum + (1 / r), 0));
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (readings.length < 5) {
      console.log('❌ Calibration failed: insufficient ground contact');
      return false;
    }

    const avgResistance = readings.reduce((a, b) => a + b) / readings.length;
    console.log(`✅ Calibration complete. Reference resistance: ${(avgResistance / 1000).toFixed(1)}kΩ`);
    return true;
  }

  /**
   * Shutdown the sensor system
   */
  shutdown(): void {
    if (this.measurementInterval) {
      clearInterval(this.measurementInterval);
      this.measurementInterval = null;
    }

    if (this.currentSession) {
      this.endSession();
    }

    console.log('🌍 Grounding sensor shutdown complete');
  }
}

// Export singleton instance
export const groundingSensor = new GroundingSensor();
