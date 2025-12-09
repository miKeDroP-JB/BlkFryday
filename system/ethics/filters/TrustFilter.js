/**
 * TrustFilter - Event Bus Compliance Filter
 * "Tech That Listens. Tech That Respects."
 *
 * Sits between the Edge Layer and internal systems.
 * Only compliant, verified, and trusted events pass downstream.
 *
 * Responsibilities:
 * 1. Source verification - Is the source trusted?
 * 2. Event validation - Is the event properly formed?
 * 3. Policy enforcement - Does it comply with policies?
 * 4. Trust scoring - Calculate trust level for routing
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');

// Trust levels for routing decisions
const TRUST_LEVELS = {
  UNTRUSTED: 0,      // Block completely
  MINIMAL: 1,        // Read-only, limited access
  LOW: 2,            // Basic operations
  MEDIUM: 3,         // Standard access
  HIGH: 4,           // Elevated access
  VERIFIED: 5,       // Full access, verified source
  SYSTEM: 6,         // Internal system events
};

// Event types and their required trust levels
const EVENT_TRUST_REQUIREMENTS = {
  // Read operations - lower trust required
  'query': TRUST_LEVELS.MINIMAL,
  'read': TRUST_LEVELS.MINIMAL,
  'list': TRUST_LEVELS.MINIMAL,
  'status': TRUST_LEVELS.MINIMAL,

  // Standard operations
  'create': TRUST_LEVELS.MEDIUM,
  'update': TRUST_LEVELS.MEDIUM,
  'interact': TRUST_LEVELS.MEDIUM,

  // Sensitive operations
  'delete': TRUST_LEVELS.HIGH,
  'admin': TRUST_LEVELS.VERIFIED,
  'config': TRUST_LEVELS.VERIFIED,

  // Agent operations
  'agent.spawn': TRUST_LEVELS.MEDIUM,
  'agent.task': TRUST_LEVELS.MEDIUM,
  'agent.terminate': TRUST_LEVELS.HIGH,

  // Data operations
  'data.export': TRUST_LEVELS.HIGH,
  'data.import': TRUST_LEVELS.VERIFIED,
  'data.delete': TRUST_LEVELS.VERIFIED,

  // System operations
  'system.config': TRUST_LEVELS.SYSTEM,
  'system.shutdown': TRUST_LEVELS.SYSTEM,
};

// Policy types for compliance checking
const POLICY_TYPES = {
  DATA_HANDLING: 'data_handling',
  USER_CONSENT: 'user_consent',
  RATE_LIMIT: 'rate_limit',
  ACCESS_CONTROL: 'access_control',
  CONTENT: 'content',
  PRIVACY: 'privacy',
};

/**
 * TrustScorer - Calculates trust scores for sources
 */
class TrustScorer {
  constructor(options = {}) {
    this.baseScores = new Map(); // sourceId -> base trust level
    this.reputationScores = new Map(); // sourceId -> reputation modifier
    this.trustHistory = []; // For audit
  }

  /**
   * Register a trusted source
   */
  registerSource(sourceId, trustLevel, metadata = {}) {
    this.baseScores.set(sourceId, {
      level: trustLevel,
      registeredAt: new Date().toISOString(),
      metadata,
    });
    this.reputationScores.set(sourceId, 0); // Start neutral
  }

  /**
   * Calculate trust score for a source
   */
  calculateScore(sourceId) {
    const baseInfo = this.baseScores.get(sourceId);
    if (!baseInfo) {
      return TRUST_LEVELS.UNTRUSTED;
    }

    const reputation = this.reputationScores.get(sourceId) || 0;
    let finalScore = baseInfo.level + reputation;

    // Clamp to valid range
    finalScore = Math.max(TRUST_LEVELS.UNTRUSTED, Math.min(TRUST_LEVELS.SYSTEM, finalScore));

    return finalScore;
  }

  /**
   * Adjust reputation based on behavior
   */
  adjustReputation(sourceId, adjustment, reason) {
    const current = this.reputationScores.get(sourceId) || 0;
    const newScore = Math.max(-3, Math.min(3, current + adjustment)); // -3 to +3 range

    this.reputationScores.set(sourceId, newScore);
    this.trustHistory.push({
      sourceId,
      adjustment,
      reason,
      newReputation: newScore,
      timestamp: new Date().toISOString(),
    });

    return newScore;
  }

  /**
   * Report good behavior
   */
  reportGoodBehavior(sourceId, reason = 'compliant_behavior') {
    return this.adjustReputation(sourceId, 0.1, reason);
  }

  /**
   * Report bad behavior
   */
  reportBadBehavior(sourceId, reason = 'policy_violation') {
    return this.adjustReputation(sourceId, -0.5, reason);
  }

  /**
   * Check if source meets minimum trust level
   */
  meetsLevel(sourceId, requiredLevel) {
    return this.calculateScore(sourceId) >= requiredLevel;
  }
}

/**
 * PolicyEngine - Enforces compliance policies
 */
class PolicyEngine {
  constructor(options = {}) {
    this.policies = new Map();
    this.violations = [];

    // Register default policies
    this._registerDefaultPolicies();
  }

  _registerDefaultPolicies() {
    // Data handling policy
    this.registerPolicy({
      id: 'data-anonymization',
      type: POLICY_TYPES.DATA_HANDLING,
      name: 'Data Anonymization Required',
      check: (event) => {
        // Check that PII has been processed
        return event.metadata?.privacyProcessed === true;
      },
      severity: 'HIGH',
    });

    // Consent policy
    this.registerPolicy({
      id: 'consent-verified',
      type: POLICY_TYPES.USER_CONSENT,
      name: 'User Consent Verified',
      check: (event) => {
        // Check consent was verified at edge
        return event.metadata?.consentVerified === true ||
               event.metadata?.bypassConsent === true; // System events
      },
      severity: 'CRITICAL',
    });

    // Content policy
    this.registerPolicy({
      id: 'content-safe',
      type: POLICY_TYPES.CONTENT,
      name: 'Content Safety Check',
      check: (event) => {
        // Ensure content filter passed
        return event.metadata?.contentFiltered === true ||
               event.metadata?.systemEvent === true;
      },
      severity: 'HIGH',
    });

    // Privacy policy
    this.registerPolicy({
      id: 'privacy-compliant',
      type: POLICY_TYPES.PRIVACY,
      name: 'Privacy Compliance',
      check: (event) => {
        // Check for privacy compliance markers
        return event.metadata?.privacyCompliant !== false;
      },
      severity: 'CRITICAL',
    });
  }

  /**
   * Register a policy
   */
  registerPolicy(policy) {
    this.policies.set(policy.id, {
      ...policy,
      enabled: policy.enabled !== false,
      registeredAt: new Date().toISOString(),
    });
  }

  /**
   * Check event against all policies
   */
  checkCompliance(event) {
    const results = [];
    const violations = [];

    for (const [id, policy] of this.policies.entries()) {
      if (!policy.enabled) continue;

      try {
        const passed = policy.check(event);
        const result = {
          policyId: id,
          policyName: policy.name,
          passed,
          severity: policy.severity,
        };
        results.push(result);

        if (!passed) {
          violations.push(result);
          this.violations.push({
            ...result,
            event: { type: event.type, id: event.id },
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        results.push({
          policyId: id,
          policyName: policy.name,
          passed: false,
          severity: 'CRITICAL',
          error: error.message,
        });
        violations.push({ policyId: id, error: error.message });
      }
    }

    return {
      compliant: violations.length === 0,
      results,
      violations,
      criticalViolations: violations.filter(v => v.severity === 'CRITICAL'),
    };
  }

  /**
   * Get violation history
   */
  getViolations(filter = {}) {
    let filtered = [...this.violations];

    if (filter.policyId) {
      filtered = filtered.filter(v => v.policyId === filter.policyId);
    }
    if (filter.severity) {
      filtered = filtered.filter(v => v.severity === filter.severity);
    }
    if (filter.since) {
      filtered = filtered.filter(v => new Date(v.timestamp) >= new Date(filter.since));
    }

    return filtered;
  }
}

/**
 * EventValidator - Validates event structure and content
 */
class EventValidator {
  constructor(options = {}) {
    this.schemas = new Map();
    this.strictMode = options.strictMode || false;
  }

  /**
   * Register event schema
   */
  registerSchema(eventType, schema) {
    this.schemas.set(eventType, schema);
  }

  /**
   * Validate event structure
   */
  validate(event) {
    const errors = [];

    // Required fields
    if (!event.id) errors.push('Missing event id');
    if (!event.type) errors.push('Missing event type');
    if (!event.timestamp) errors.push('Missing timestamp');
    if (!event.source) errors.push('Missing source');

    // Validate timestamp format
    if (event.timestamp && isNaN(Date.parse(event.timestamp))) {
      errors.push('Invalid timestamp format');
    }

    // Validate against schema if registered
    const schema = this.schemas.get(event.type);
    if (schema) {
      const schemaErrors = this._validateSchema(event.payload, schema);
      errors.push(...schemaErrors);
    } else if (this.strictMode) {
      errors.push(`No schema registered for event type: ${event.type}`);
    }

    // Check payload size
    const payloadSize = JSON.stringify(event.payload || {}).length;
    if (payloadSize > 1024 * 1024) { // 1MB limit
      errors.push('Event payload exceeds size limit');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  _validateSchema(data, schema) {
    const errors = [];

    // Basic schema validation
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    if (schema.properties) {
      for (const [field, rules] of Object.entries(schema.properties)) {
        if (field in data) {
          if (rules.type && typeof data[field] !== rules.type) {
            errors.push(`Field ${field} should be ${rules.type}`);
          }
          if (rules.maxLength && data[field].length > rules.maxLength) {
            errors.push(`Field ${field} exceeds max length`);
          }
        }
      }
    }

    return errors;
  }
}

/**
 * TrustFilter - Main filter class
 */
class TrustFilter extends EventEmitter {
  constructor(options = {}) {
    super();

    this.trustScorer = new TrustScorer(options.trustScorer);
    this.policyEngine = new PolicyEngine(options.policyEngine);
    this.eventValidator = new EventValidator(options.eventValidator);

    this.config = {
      enabled: options.enabled !== false,
      strictMode: options.strictMode || false,
      defaultTrustLevel: options.defaultTrustLevel || TRUST_LEVELS.MEDIUM,
      blockOnViolation: options.blockOnViolation !== false,
    };

    // Register internal sources as trusted
    this.trustScorer.registerSource('system', TRUST_LEVELS.SYSTEM, { internal: true });
    this.trustScorer.registerSource('edge-layer', TRUST_LEVELS.VERIFIED, { internal: true });

    this.stats = {
      processed: 0,
      passed: 0,
      blocked: 0,
      policyViolations: 0,
      trustViolations: 0,
    };
  }

  /**
   * Filter an event - main entry point
   */
  async filter(event) {
    if (!this.config.enabled) {
      return { allowed: true, event, report: { action: 'BYPASSED' } };
    }

    this.stats.processed++;
    const startTime = Date.now();
    const report = {
      eventId: event.id || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      checks: [],
    };

    // STEP 1: Validate event structure
    const validation = this.eventValidator.validate(event);
    report.checks.push({ step: 'VALIDATION', result: validation });

    if (!validation.valid) {
      this.stats.blocked++;
      this.emit('event-invalid', { event, errors: validation.errors });

      return {
        allowed: false,
        event: null,
        report: {
          ...report,
          action: 'INVALID_EVENT',
          errors: validation.errors,
        },
      };
    }

    // STEP 2: Check source trust level
    const sourceId = event.source?.id || event.source || 'unknown';
    const trustLevel = this.trustScorer.calculateScore(sourceId);
    const requiredLevel = EVENT_TRUST_REQUIREMENTS[event.type] || this.config.defaultTrustLevel;

    report.checks.push({
      step: 'TRUST_CHECK',
      result: { sourceId, trustLevel, requiredLevel, passed: trustLevel >= requiredLevel },
    });

    if (trustLevel < requiredLevel) {
      this.stats.blocked++;
      this.stats.trustViolations++;
      this.trustScorer.reportBadBehavior(sourceId, 'insufficient_trust');
      this.emit('trust-violation', { sourceId, trustLevel, requiredLevel, event });

      return {
        allowed: false,
        event: null,
        report: {
          ...report,
          action: 'TRUST_INSUFFICIENT',
          trustLevel,
          requiredLevel,
        },
      };
    }

    // STEP 3: Check policy compliance
    const compliance = this.policyEngine.checkCompliance(event);
    report.checks.push({
      step: 'POLICY_CHECK',
      result: { compliant: compliance.compliant, violationCount: compliance.violations.length },
    });

    if (!compliance.compliant && this.config.blockOnViolation) {
      this.stats.blocked++;
      this.stats.policyViolations += compliance.violations.length;
      this.trustScorer.reportBadBehavior(sourceId, 'policy_violation');
      this.emit('policy-violation', { violations: compliance.violations, event });

      // Critical violations always block
      if (compliance.criticalViolations.length > 0) {
        return {
          allowed: false,
          event: null,
          report: {
            ...report,
            action: 'POLICY_VIOLATION',
            violations: compliance.violations,
            critical: true,
          },
        };
      }
    }

    // STEP 4: Enrich event with trust metadata
    const enrichedEvent = {
      ...event,
      metadata: {
        ...event.metadata,
        trustLevel,
        trustVerified: true,
        policyCompliant: compliance.compliant,
        filteredAt: new Date().toISOString(),
        filterVersion: '1.0',
      },
    };

    // Good behavior - slight reputation boost
    this.trustScorer.reportGoodBehavior(sourceId);

    this.stats.passed++;
    const processingTime = Date.now() - startTime;

    this.emit('event-passed', {
      eventId: report.eventId,
      trustLevel,
      processingTime,
    });

    return {
      allowed: true,
      event: enrichedEvent,
      report: {
        ...report,
        action: 'ALLOWED',
        trustLevel,
        processingTime,
      },
    };
  }

  /**
   * Register a trusted source
   */
  registerSource(sourceId, trustLevel, metadata = {}) {
    this.trustScorer.registerSource(sourceId, trustLevel, metadata);
    this.emit('source-registered', { sourceId, trustLevel });
  }

  /**
   * Register a custom policy
   */
  registerPolicy(policy) {
    this.policyEngine.registerPolicy(policy);
    this.emit('policy-registered', { policyId: policy.id });
  }

  /**
   * Register an event schema
   */
  registerSchema(eventType, schema) {
    this.eventValidator.registerSchema(eventType, schema);
  }

  /**
   * Get trust level for a source
   */
  getTrustLevel(sourceId) {
    return this.trustScorer.calculateScore(sourceId);
  }

  /**
   * Get policy violations
   */
  getViolations(filter = {}) {
    return this.policyEngine.getViolations(filter);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      passRate: this.stats.processed > 0
        ? ((this.stats.passed / this.stats.processed) * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  /**
   * Create event wrapper for downstream systems
   */
  createEventWrapper() {
    return {
      emit: async (type, payload, source) => {
        const event = {
          id: crypto.randomUUID(),
          type,
          payload,
          source,
          timestamp: new Date().toISOString(),
          metadata: {
            privacyProcessed: true,
            consentVerified: true,
            contentFiltered: true,
          },
        };

        const result = await this.filter(event);

        if (result.allowed) {
          this.emit('downstream', result.event);
          return { success: true, eventId: event.id };
        } else {
          return { success: false, reason: result.report.action };
        }
      },
    };
  }
}

module.exports = {
  TrustFilter,
  TrustScorer,
  PolicyEngine,
  EventValidator,
  TRUST_LEVELS,
  EVENT_TRUST_REQUIREMENTS,
  POLICY_TYPES,
};
