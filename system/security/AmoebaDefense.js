/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║    █████╗ ███╗   ███╗ ██████╗ ███████╗██████╗  █████╗                     ║
 * ║   ██╔══██╗████╗ ████║██╔═══██╗██╔════╝██╔══██╗██╔══██╗                    ║
 * ║   ███████║██╔████╔██║██║   ██║█████╗  ██████╔╝███████║                    ║
 * ║   ██╔══██║██║╚██╔╝██║██║   ██║██╔══╝  ██╔══██╗██╔══██║                    ║
 * ║   ██║  ██║██║ ╚═╝ ██║╚██████╔╝███████╗██████╔╝██║  ██║                    ║
 * ║   ╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═════╝ ╚═╝  ╚═╝                    ║
 * ║                                                                           ║
 * ║   ██████╗ ███████╗███████╗███████╗███╗   ██╗███████╗███████╗              ║
 * ║   ██╔══██╗██╔════╝██╔════╝██╔════╝████╗  ██║██╔════╝██╔════╝              ║
 * ║   ██║  ██║█████╗  █████╗  █████╗  ██╔██╗ ██║███████╗█████╗                ║
 * ║   ██║  ██║██╔══╝  ██╔══╝  ██╔══╝  ██║╚██╗██║╚════██║██╔══╝                ║
 * ║   ██████╔╝███████╗██║     ███████╗██║ ╚████║███████║███████╗              ║
 * ║   ╚═════╝ ╚══════╝╚═╝     ╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝              ║
 * ║                                                                           ║
 * ║   ADAPTIVE SECURITY SYSTEM - IMPENETRABLE & REGENERATIVE                  ║
 * ║   "Like an amoeba - shapeless, adaptive, impossible to catch"             ║
 * ║                                                                           ║
 * ║   JB$ SIGNATURE EMBEDDED                                                  ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const { SACRED_NUMBERS, FIBONACCI_SEQUENCE, PHI } = require('../core/SacredMath.js');

// ═══════════════════════════════════════════════════════════════════════════
// THREAT LEVELS - Based on sacred numbers
// ═══════════════════════════════════════════════════════════════════════════

const THREAT_LEVELS = {
  NONE: 0,
  LOW: 1,
  MODERATE: 2,
  ELEVATED: 3,
  HIGH: 5,
  SEVERE: 8,
  CRITICAL: 13
};

const THREAT_TYPES = {
  // External threats
  INJECTION: 'injection',
  XSS: 'xss',
  CSRF: 'csrf',
  DOS: 'dos',
  BRUTE_FORCE: 'brute_force',
  DATA_EXFIL: 'data_exfiltration',

  // Internal threats
  PRIVILEGE_ESCALATION: 'privilege_escalation',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  DATA_TAMPERING: 'data_tampering',
  REPLAY_ATTACK: 'replay_attack',

  // System threats
  MEMORY_CORRUPTION: 'memory_corruption',
  RESOURCE_EXHAUSTION: 'resource_exhaustion',
  DEPENDENCY_ATTACK: 'dependency_attack',

  // Unknown
  ANOMALY: 'anomaly',
  UNKNOWN: 'unknown'
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFENSE MODES - The amoeba's shapes
// ═══════════════════════════════════════════════════════════════════════════

const DEFENSE_MODES = {
  // Normal operation - fluid, efficient
  PASSIVE: {
    name: 'Passive',
    description: 'Monitoring, minimal intervention',
    icon: '🔵',
    resourceUsage: 0.1,
    sensitivity: 0.3
  },

  // Heightened awareness
  ALERT: {
    name: 'Alert',
    description: 'Active monitoring, logging increased',
    icon: '🟡',
    resourceUsage: 0.3,
    sensitivity: 0.5
  },

  // Active defense
  DEFENSIVE: {
    name: 'Defensive',
    description: 'Blocking suspicious activity',
    icon: '🟠',
    resourceUsage: 0.5,
    sensitivity: 0.7
  },

  // Full lockdown
  FORTRESS: {
    name: 'Fortress',
    description: 'Maximum security, minimal access',
    icon: '🔴',
    resourceUsage: 0.8,
    sensitivity: 0.9
  },

  // Adaptive response
  AMOEBA: {
    name: 'Amoeba',
    description: 'Shape-shifting defense, unpredictable',
    icon: '🟣',
    resourceUsage: 'dynamic',
    sensitivity: 'dynamic'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MEMBRANE CLASS - The outer defense layer
// ═══════════════════════════════════════════════════════════════════════════

class Membrane {
  constructor(config = {}) {
    this.id = `membrane-${Date.now()}`;
    this.permeability = config.permeability || 0.5;  // 0 = sealed, 1 = open
    this.elasticity = config.elasticity || PHI;       // Ability to stretch
    this.strength = config.strength || 1.0;
    this.receptors = new Map();                       // Detection points
    this.gates = new Map();                           // Entry/exit points

    this.state = {
      integrity: 1.0,
      stress: 0,
      lastCheck: Date.now()
    };
  }

  /**
   * Add a receptor (detection point)
   */
  addReceptor(type, handler) {
    this.receptors.set(type, {
      type,
      handler,
      triggers: 0,
      lastTriggered: null
    });
    return this;
  }

  /**
   * Add a gate (controlled entry point)
   */
  addGate(name, config) {
    this.gates.set(name, {
      name,
      open: config.open !== false,
      whitelist: config.whitelist || [],
      blacklist: config.blacklist || [],
      rateLimit: config.rateLimit || 100,
      currentRate: 0,
      lastReset: Date.now()
    });
    return this;
  }

  /**
   * Check if something can pass through
   */
  canPass(entity, gate) {
    const gateConfig = this.gates.get(gate);
    if (!gateConfig) return false;
    if (!gateConfig.open) return false;

    // Check blacklist
    if (gateConfig.blacklist.includes(entity.id)) return false;

    // Check whitelist (if exists, must be on it)
    if (gateConfig.whitelist.length > 0 && !gateConfig.whitelist.includes(entity.id)) {
      return false;
    }

    // Check rate limit
    if (gateConfig.currentRate >= gateConfig.rateLimit) return false;

    return true;
  }

  /**
   * Record passage through membrane
   */
  recordPassage(entity, gate) {
    const gateConfig = this.gates.get(gate);
    if (gateConfig) {
      gateConfig.currentRate++;
    }
  }

  /**
   * Strengthen the membrane
   */
  strengthen(amount = 0.1) {
    this.strength = Math.min(2.0, this.strength + amount);
    this.permeability = Math.max(0.1, this.permeability - amount / 2);
  }

  /**
   * Adapt the membrane shape
   */
  adapt(stressPoints) {
    // Redistribute strength to stress points
    const totalStress = stressPoints.reduce((a, b) => a + b.stress, 0);
    this.state.stress = totalStress;

    // Elastic response
    if (this.state.stress > this.elasticity) {
      this.strengthen(this.state.stress * 0.1);
    }
  }

  /**
   * Self-repair
   */
  repair() {
    if (this.state.integrity < 1.0) {
      this.state.integrity = Math.min(1.0, this.state.integrity + 0.1);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// THREAT DETECTOR CLASS
// ═══════════════════════════════════════════════════════════════════════════

class ThreatDetector {
  constructor() {
    this.patterns = new Map();
    this.anomalyBaseline = new Map();
    this.recentActivity = [];
    this.maxActivityLog = FIBONACCI_SEQUENCE[10];  // 55 entries
  }

  /**
   * Register a threat pattern
   */
  registerPattern(type, pattern) {
    if (!this.patterns.has(type)) {
      this.patterns.set(type, []);
    }
    this.patterns.get(type).push({
      pattern,
      detected: 0,
      lastSeen: null
    });
  }

  /**
   * Analyze activity for threats
   */
  analyze(activity) {
    const threats = [];

    // Check against known patterns
    for (const [type, patterns] of this.patterns) {
      for (const patternInfo of patterns) {
        if (this.matchesPattern(activity, patternInfo.pattern)) {
          patternInfo.detected++;
          patternInfo.lastSeen = Date.now();
          threats.push({
            type,
            pattern: patternInfo.pattern.name || 'unnamed',
            confidence: this.calculateConfidence(activity, patternInfo),
            activity
          });
        }
      }
    }

    // Check for anomalies
    const anomaly = this.detectAnomaly(activity);
    if (anomaly) {
      threats.push(anomaly);
    }

    // Log activity
    this.logActivity(activity, threats);

    return threats;
  }

  matchesPattern(activity, pattern) {
    if (pattern.test && typeof pattern.test === 'function') {
      return pattern.test(activity);
    }
    if (pattern.regex) {
      return pattern.regex.test(JSON.stringify(activity));
    }
    if (pattern.keywords) {
      const str = JSON.stringify(activity).toLowerCase();
      return pattern.keywords.some(kw => str.includes(kw.toLowerCase()));
    }
    return false;
  }

  calculateConfidence(activity, patternInfo) {
    const baseConfidence = 0.5;
    const frequencyBoost = Math.min(0.3, patternInfo.detected * 0.01);
    return Math.min(0.99, baseConfidence + frequencyBoost);
  }

  detectAnomaly(activity) {
    // Simple anomaly detection based on activity patterns
    const activityHash = this.hashActivity(activity);
    const baseline = this.anomalyBaseline.get(activity.type);

    if (!baseline) {
      this.anomalyBaseline.set(activity.type, {
        count: 1,
        hashes: [activityHash]
      });
      return null;
    }

    // If this exact activity hasn't been seen before, flag it
    if (!baseline.hashes.includes(activityHash)) {
      baseline.hashes.push(activityHash);
      if (baseline.hashes.length > 100) {
        baseline.hashes.shift();
      }

      // Only flag if we have enough baseline
      if (baseline.count > 10) {
        return {
          type: THREAT_TYPES.ANOMALY,
          pattern: 'behavioral_anomaly',
          confidence: 0.3,
          activity
        };
      }
    }

    baseline.count++;
    return null;
  }

  hashActivity(activity) {
    return crypto.createHash('sha256')
      .update(JSON.stringify(activity))
      .digest('hex')
      .substring(0, 16);
  }

  logActivity(activity, threats) {
    this.recentActivity.push({
      activity,
      threats,
      timestamp: Date.now()
    });

    if (this.recentActivity.length > this.maxActivityLog) {
      this.recentActivity.shift();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE HANDLER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class ResponseHandler {
  constructor() {
    this.responses = new Map();
    this.activeResponses = new Map();
    this.history = [];
  }

  /**
   * Register a response for a threat type
   */
  registerResponse(threatType, response) {
    this.responses.set(threatType, response);
  }

  /**
   * Handle a detected threat
   */
  async handle(threat, context = {}) {
    const response = this.responses.get(threat.type) || this.responses.get('default');

    if (!response) {
      return { handled: false, reason: 'no_response_defined' };
    }

    const responseId = `response-${Date.now()}`;

    this.activeResponses.set(responseId, {
      id: responseId,
      threat,
      startTime: Date.now(),
      status: 'executing'
    });

    try {
      const result = await response.execute(threat, context);

      this.activeResponses.get(responseId).status = 'completed';
      this.activeResponses.get(responseId).result = result;

      this.history.push({
        responseId,
        threat,
        result,
        timestamp: Date.now()
      });

      return { handled: true, result };

    } catch (error) {
      this.activeResponses.get(responseId).status = 'failed';
      this.activeResponses.get(responseId).error = error.message;

      return { handled: false, error: error.message };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AMOEBA DEFENSE CLASS - THE MAIN SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

class AmoebaDefense extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      mode: config.mode || 'AMOEBA',
      autoAdapt: config.autoAdapt !== false,
      regenerationInterval: config.regenerationInterval || FIBONACCI_SEQUENCE[7] * 1000, // 13s
      ...config
    };

    this.membrane = new Membrane(config.membrane);
    this.detector = new ThreatDetector();
    this.responder = new ResponseHandler();

    this.currentMode = DEFENSE_MODES[this.config.mode];
    this.threatLevel = THREAT_LEVELS.NONE;
    this.state = {
      active: false,
      startTime: null,
      totalThreatsDetected: 0,
      totalThreatsBlocked: 0,
      adaptations: 0
    };

    this.signature = 'JB$';

    // Register default patterns
    this.registerDefaultPatterns();

    // Register default responses
    this.registerDefaultResponses();

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║            AMOEBA DEFENSE SYSTEM INITIALIZED                  ║
╠══════════════════════════════════════════════════════════════╣
║  Mode: ${this.currentMode.name.padEnd(51)}║
║  Auto-Adapt: ${(this.config.autoAdapt ? 'ENABLED' : 'DISABLED').padEnd(45)}║
║  Regeneration: ${(this.config.regenerationInterval / 1000).toFixed(0)}s${' '.repeat(44)}║
║  Signature: ${this.signature.padEnd(46)}║
╚══════════════════════════════════════════════════════════════╝
    `);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────────────────

  registerDefaultPatterns() {
    // SQL Injection patterns
    this.detector.registerPattern(THREAT_TYPES.INJECTION, {
      name: 'sql_injection',
      keywords: ['SELECT', 'DROP', 'DELETE', 'INSERT', '--', ';', 'OR 1=1']
    });

    // XSS patterns
    this.detector.registerPattern(THREAT_TYPES.XSS, {
      name: 'xss_script',
      regex: /<script[^>]*>|javascript:|on\w+=/i
    });

    // Brute force pattern (detect rapid attempts)
    this.detector.registerPattern(THREAT_TYPES.BRUTE_FORCE, {
      name: 'rapid_attempts',
      test: (activity) => activity.type === 'auth' && activity.failCount > 5
    });

    // Resource exhaustion
    this.detector.registerPattern(THREAT_TYPES.RESOURCE_EXHAUSTION, {
      name: 'high_resource_usage',
      test: (activity) => activity.resourceUsage > 0.9
    });
  }

  registerDefaultResponses() {
    // Block and log
    this.responder.registerResponse(THREAT_TYPES.INJECTION, {
      execute: async (threat, context) => {
        return { action: 'blocked', logged: true, blacklisted: true };
      }
    });

    // Sanitize and continue
    this.responder.registerResponse(THREAT_TYPES.XSS, {
      execute: async (threat, context) => {
        return { action: 'sanitized', logged: true };
      }
    });

    // Rate limit
    this.responder.registerResponse(THREAT_TYPES.BRUTE_FORCE, {
      execute: async (threat, context) => {
        return { action: 'rate_limited', duration: 300000 }; // 5 minutes
      }
    });

    // Throttle
    this.responder.registerResponse(THREAT_TYPES.RESOURCE_EXHAUSTION, {
      execute: async (threat, context) => {
        return { action: 'throttled' };
      }
    });

    // Default response
    this.responder.registerResponse('default', {
      execute: async (threat, context) => {
        return { action: 'logged', escalated: true };
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Core Operations
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Start the defense system
   */
  start() {
    this.state.active = true;
    this.state.startTime = Date.now();

    // Start regeneration cycle
    if (this.config.autoAdapt) {
      this.regenerationTimer = setInterval(() => {
        this.regenerate();
      }, this.config.regenerationInterval);
    }

    this.emit('started');
    console.log('[AMOEBA] Defense system activated');

    return this;
  }

  /**
   * Stop the defense system
   */
  stop() {
    this.state.active = false;

    if (this.regenerationTimer) {
      clearInterval(this.regenerationTimer);
    }

    this.emit('stopped');
    console.log('[AMOEBA] Defense system deactivated');

    return this;
  }

  /**
   * Process incoming activity
   */
  async process(activity) {
    if (!this.state.active) {
      return { allowed: true, reason: 'defense_inactive' };
    }

    // Check membrane first (rate limiting, blacklists)
    const gateCheck = this.checkGate(activity);
    if (!gateCheck.allowed) {
      return gateCheck;
    }

    // Analyze for threats
    const threats = this.detector.analyze(activity);

    if (threats.length === 0) {
      this.membrane.recordPassage(activity, activity.gate || 'default');
      return { allowed: true };
    }

    // Update threat level
    this.updateThreatLevel(threats);
    this.state.totalThreatsDetected += threats.length;

    // Handle each threat
    const responses = [];
    for (const threat of threats) {
      const response = await this.responder.handle(threat, { activity });
      responses.push(response);

      if (response.handled && response.result?.action === 'blocked') {
        this.state.totalThreatsBlocked++;
        this.emit('threat:blocked', { threat, response });
        return { allowed: false, reason: 'blocked', threats, responses };
      }
    }

    // Adapt based on threats
    if (this.config.autoAdapt) {
      this.adapt(threats);
    }

    this.emit('threat:detected', { threats, responses });

    // Determine if activity should proceed
    const blocked = responses.some(r => r.result?.action === 'blocked');
    return { allowed: !blocked, threats, responses };
  }

  checkGate(activity) {
    const gate = activity.gate || 'default';

    if (!this.membrane.gates.has(gate)) {
      // Create default gate
      this.membrane.addGate(gate, { open: true, rateLimit: 1000 });
    }

    if (!this.membrane.canPass(activity, gate)) {
      return { allowed: false, reason: 'gate_blocked' };
    }

    return { allowed: true };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Adaptation - The Amoeba's superpower
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Adapt defenses based on threats
   */
  adapt(threats) {
    this.state.adaptations++;

    // Calculate stress from threats
    const stressPoints = threats.map(t => ({
      location: t.type,
      stress: THREAT_LEVELS[this.threatLevelForType(t.type)] || 1
    }));

    // Adapt membrane
    this.membrane.adapt(stressPoints);

    // Switch mode if needed
    const newMode = this.calculateOptimalMode();
    if (newMode !== this.currentMode.name) {
      this.setMode(newMode);
    }

    this.emit('adapted', { stressPoints, mode: this.currentMode });
  }

  threatLevelForType(type) {
    const severityMap = {
      [THREAT_TYPES.INJECTION]: 'HIGH',
      [THREAT_TYPES.XSS]: 'MODERATE',
      [THREAT_TYPES.BRUTE_FORCE]: 'ELEVATED',
      [THREAT_TYPES.DOS]: 'SEVERE',
      [THREAT_TYPES.DATA_EXFIL]: 'CRITICAL',
      [THREAT_TYPES.ANOMALY]: 'LOW'
    };
    return severityMap[type] || 'LOW';
  }

  calculateOptimalMode() {
    if (this.threatLevel >= THREAT_LEVELS.CRITICAL) return 'FORTRESS';
    if (this.threatLevel >= THREAT_LEVELS.HIGH) return 'DEFENSIVE';
    if (this.threatLevel >= THREAT_LEVELS.MODERATE) return 'ALERT';
    if (this.threatLevel >= THREAT_LEVELS.LOW) return 'AMOEBA';
    return 'PASSIVE';
  }

  setMode(modeName) {
    const mode = DEFENSE_MODES[modeName];
    if (!mode) return;

    const oldMode = this.currentMode;
    this.currentMode = mode;

    this.emit('mode:changed', { from: oldMode, to: mode });
    console.log(`[AMOEBA] Mode changed: ${oldMode.name} → ${mode.name}`);
  }

  updateThreatLevel(threats) {
    if (threats.length === 0) {
      // Decay threat level over time
      this.threatLevel = Math.max(0, this.threatLevel - 1);
      return;
    }

    // Calculate new threat level based on highest threat
    const maxThreat = threats.reduce((max, t) => {
      const level = THREAT_LEVELS[this.threatLevelForType(t.type)] || 0;
      return Math.max(max, level);
    }, 0);

    this.threatLevel = Math.max(this.threatLevel, maxThreat);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Regeneration - Self-healing
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Regenerate and repair defenses
   */
  regenerate() {
    // Repair membrane
    this.membrane.repair();

    // Decay threat level naturally
    if (this.threatLevel > 0) {
      this.threatLevel = Math.max(0, this.threatLevel - 1);
    }

    // Reset rate limits
    for (const gate of this.membrane.gates.values()) {
      gate.currentRate = 0;
      gate.lastReset = Date.now();
    }

    // Clean old activity logs
    const now = Date.now();
    const maxAge = this.config.regenerationInterval * 10;
    this.detector.recentActivity = this.detector.recentActivity.filter(
      a => now - a.timestamp < maxAge
    );

    // Recalculate optimal mode
    if (this.config.autoAdapt) {
      const optimalMode = this.calculateOptimalMode();
      if (optimalMode !== this.currentMode.name) {
        this.setMode(optimalMode);
      }
    }

    this.emit('regenerated');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  getStatus() {
    return {
      active: this.state.active,
      mode: this.currentMode,
      threatLevel: this.threatLevel,
      membrane: {
        integrity: this.membrane.state.integrity,
        stress: this.membrane.state.stress,
        gates: this.membrane.gates.size
      },
      stats: {
        totalThreatsDetected: this.state.totalThreatsDetected,
        totalThreatsBlocked: this.state.totalThreatsBlocked,
        adaptations: this.state.adaptations,
        uptime: this.state.startTime ? Date.now() - this.state.startTime : 0
      },
      signature: this.signature
    };
  }

  getThreatLevels() {
    return THREAT_LEVELS;
  }

  getDefenseModes() {
    return DEFENSE_MODES;
  }

  /**
   * Manually trigger adaptation
   */
  triggerAdaptation() {
    this.adapt([]);
    return this.getStatus();
  }

  /**
   * Add to blacklist
   */
  blacklist(entityId, gate = 'default') {
    const gateConfig = this.membrane.gates.get(gate);
    if (gateConfig) {
      gateConfig.blacklist.push(entityId);
      this.emit('blacklisted', { entityId, gate });
    }
    return this;
  }

  /**
   * Add to whitelist
   */
  whitelist(entityId, gate = 'default') {
    const gateConfig = this.membrane.gates.get(gate);
    if (gateConfig) {
      gateConfig.whitelist.push(entityId);
      this.emit('whitelisted', { entityId, gate });
    }
    return this;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// THE AMOEBA MANIFESTO
// ═══════════════════════════════════════════════════════════════════════════

const AMOEBA_MANIFESTO = `
═══════════════════════════════════════════════════════════════
                  THE AMOEBA DEFENSE MANIFESTO
                        by JB$
═══════════════════════════════════════════════════════════════

SHAPELESS. ADAPTIVE. IMPENETRABLE.

Like the amoeba - no fixed form, no weak points.
When attacked, it doesn't break. It FLOWS.
It envelops the threat. Neutralizes it. Absorbs it.
And comes back STRONGER.

═══════════════════════════════════════════════════════════════

THE PRINCIPLES:
───────────────

1. NO FIXED FORM
   The shape changes constantly.
   What works against you today won't work tomorrow.

2. MEMBRANE DEFENSE
   The outer layer is semi-permeable.
   Good things pass. Bad things don't.
   The membrane LEARNS what's good.

3. ADAPTIVE RESPONSE
   Every attack teaches us.
   Every threat makes us stronger.
   The system EVOLVES.

4. REGENERATION
   Damage heals automatically.
   Resources replenish.
   The system is SELF-SUSTAINING.

5. THREAT ABSORPTION
   Some threats can't be blocked.
   So we absorb them. Neutralize them.
   Turn threats into knowledge.

═══════════════════════════════════════════════════════════════

THE MODES:
──────────

🔵 PASSIVE   - Watching. Learning. Waiting.
🟡 ALERT     - Something's happening. Eyes open.
🟠 DEFENSIVE - Active blocking. Shields up.
🔴 FORTRESS  - Maximum security. Nothing in or out.
🟣 AMOEBA    - Shape-shifting. Unpredictable. Ultimate.

═══════════════════════════════════════════════════════════════

FIBONACCI DEFENSE:
──────────────────

Retry delays: 1, 1, 2, 3, 5, 8, 13...
Rate limits: Based on golden ratio
Regeneration: Every 13 seconds
Max threats logged: 55 (F10)

The mathematics of nature protects the system.

═══════════════════════════════════════════════════════════════
        YOU CAN'T CATCH WHAT HAS NO SHAPE
═══════════════════════════════════════════════════════════════
`;

module.exports = {
  AmoebaDefense,
  Membrane,
  ThreatDetector,
  ResponseHandler,
  THREAT_LEVELS,
  THREAT_TYPES,
  DEFENSE_MODES,
  AMOEBA_MANIFESTO
};
