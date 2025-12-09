/**
 * EthicsGateway - Unified Ethics Layer Entry Point
 * "Tech That Listens. Tech That Respects."
 *
 * The master orchestrator that ties all ethics components together.
 * Single entry point for the entire ethics system.
 *
 * Data Flow:
 * Request → Edge Layer → Trust Filter → [Sovereign AI] → Audit
 *              ↓             ↓               ↓           ↓
 *           Privacy      Policy           Only       Transparent
 *           Engine       Engine         Compliant      Logs
 *              ↓             ↓            Data           ↓
 *           Consent      Trust                        Supervisor
 *           Manager      Scoring                     Monitoring
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

// Import all ethics components
const { PrivacyEngine } = require('./privacy/PrivacyEngine');
const { ConsentManager, CONSENT_TYPES } = require('./consent/ConsentManager');
const { EdgeLayer } = require('./edge/EdgeLayer');
const { TrustFilter, TRUST_LEVELS } = require('./filters/TrustFilter');
const { AuditLogger, AUDIT_CATEGORIES, SEVERITY } = require('./audit/AuditLogger');
const { EthicsSupervisor, ALERT_LEVEL } = require('./supervisor/EthicsSupervisor');

// Gateway configuration defaults
const DEFAULT_CONFIG = {
  enabled: true,
  strictMode: false,
  auditAllRequests: true,
  transparencyEndpoint: true,
  autoStartSupervisor: true,
};

/**
 * EthicsGateway - Main gateway class
 */
class EthicsGateway extends EventEmitter {
  constructor(options = {}) {
    super();

    this.config = { ...DEFAULT_CONFIG, ...options.config };
    this.version = '1.0.0';
    this.startedAt = null;

    // Initialize all components
    this.privacyEngine = new PrivacyEngine({
      autoAnonymize: true,
      blockCriticalPII: true,
      strictMode: this.config.strictMode,
      ...options.privacy,
    });

    this.consentManager = new ConsentManager({
      requireExplicitConsent: true,
      defaultOptOut: true,
      ...options.consent,
    });

    this.edgeLayer = new EdgeLayer({
      enabled: this.config.enabled,
      strictMode: this.config.strictMode,
      privacyEngine: this.privacyEngine,
      consentManager: this.consentManager,
      ...options.edge,
    });

    this.trustFilter = new TrustFilter({
      enabled: this.config.enabled,
      strictMode: this.config.strictMode,
      ...options.trust,
    });

    this.auditLogger = new AuditLogger({
      enabled: this.config.auditAllRequests,
      detectAnomalies: true,
      ...options.audit,
    });

    this.supervisor = new EthicsSupervisor({
      enableAutoResponse: true,
      enableEmergencyShutdown: true,
      ...options.supervisor,
    });

    // Register components with supervisor
    this.supervisor.registerComponents({
      edgeLayer: this.edgeLayer,
      trustFilter: this.trustFilter,
      privacyEngine: this.privacyEngine,
      consentManager: this.consentManager,
      auditLogger: this.auditLogger,
    });

    // Wire up events
    this._setupEventListeners();

    // Statistics
    this.stats = {
      requestsProcessed: 0,
      requestsAllowed: 0,
      requestsBlocked: 0,
      eventsFiltered: 0,
      consentChecks: 0,
      piiDetections: 0,
    };
  }

  /**
   * Setup internal event listeners
   */
  _setupEventListeners() {
    // Edge Layer events
    this.edgeLayer.on('request-processed', (data) => {
      this.stats.requestsProcessed++;
      this.stats.requestsAllowed++;

      if (this.config.auditAllRequests) {
        this.auditLogger.logAccess('request_processed', {
          type: 'user',
          id: data.userId || 'anonymous',
        }, null, {
          requestId: data.requestId,
          processingTime: data.processingTime,
        });
      }
    });

    this.edgeLayer.on('security-threat', (data) => {
      this.stats.requestsBlocked++;
      this.auditLogger.logThreat(
        data.threats[0]?.type || 'unknown',
        data.context,
        { threats: data.threats }
      );
    });

    this.edgeLayer.on('consent-denied', (data) => {
      this.stats.consentChecks++;
      this.auditLogger.logConsent('denied', {
        type: 'user',
        id: data.userId,
      }, { missing: data.missing });
    });

    // Privacy Engine events
    this.privacyEngine.on('pii-detected', (data) => {
      this.stats.piiDetections++;
      this.auditLogger.logPIIDetection({
        types: data.detection.findings?.map(f => f.type) || [],
        riskLevel: data.detection.riskLevel,
      });
    });

    // Trust Filter events
    this.trustFilter.on('event-passed', (data) => {
      this.stats.eventsFiltered++;
    });

    this.trustFilter.on('policy-violation', (data) => {
      this.auditLogger.logPolicy(
        'violation_detected',
        data.violations[0]?.policyId,
        'violation',
        { violations: data.violations }
      );
    });

    // Supervisor events
    this.supervisor.on('emergency', (data) => {
      this.emit('emergency', data);
      this.auditLogger.log({
        category: AUDIT_CATEGORIES.SYSTEM,
        action: 'emergency_activated',
        severity: SEVERITY.EMERGENCY,
        details: data,
        description: `EMERGENCY: ${data.reason}`,
      });
    });

    this.supervisor.on('emergency-shutdown', (data) => {
      this.emit('shutdown', data);
    });
  }

  /**
   * Start the ethics gateway
   */
  async start() {
    this.startedAt = new Date().toISOString();

    // Start supervisor if configured
    if (this.config.autoStartSupervisor) {
      await this.supervisor.start();
    }

    this.emit('started', { startedAt: this.startedAt });

    this.auditLogger.log({
      category: AUDIT_CATEGORIES.SYSTEM,
      action: 'gateway_started',
      severity: SEVERITY.INFO,
      description: 'Ethics Gateway started',
    });

    return this;
  }

  /**
   * Stop the ethics gateway
   */
  async stop() {
    this.supervisor.stop();
    this.emit('stopped');

    this.auditLogger.log({
      category: AUDIT_CATEGORIES.SYSTEM,
      action: 'gateway_stopped',
      severity: SEVERITY.INFO,
      description: 'Ethics Gateway stopped',
    });
  }

  /**
   * Process a request through the entire ethics pipeline
   * This is the MAIN entry point for all requests
   */
  async processRequest(request, context = {}) {
    if (!this.config.enabled) {
      return {
        allowed: true,
        data: request,
        report: { action: 'ETHICS_DISABLED' },
      };
    }

    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      // STEP 1: Edge Layer - First gate
      const edgeResult = await this.edgeLayer.process(request, {
        ...context,
        requestId,
      });

      if (!edgeResult.allowed) {
        return {
          allowed: false,
          data: null,
          report: {
            requestId,
            stage: 'EDGE',
            ...edgeResult.report,
          },
        };
      }

      // STEP 2: Trust Filter - Event validation
      const event = {
        id: requestId,
        type: context.action || 'request',
        payload: edgeResult.request,
        source: context.source || { id: context.userId || 'anonymous' },
        timestamp: new Date().toISOString(),
        metadata: {
          privacyProcessed: true,
          consentVerified: context.userId ? true : false,
          contentFiltered: true,
          ...edgeResult.report,
        },
      };

      const trustResult = await this.trustFilter.filter(event);

      if (!trustResult.allowed) {
        return {
          allowed: false,
          data: null,
          report: {
            requestId,
            stage: 'TRUST',
            ...trustResult.report,
          },
        };
      }

      // STEP 3: Success - Return processed data
      const processingTime = Date.now() - startTime;

      return {
        allowed: true,
        data: trustResult.event.payload,
        report: {
          requestId,
          stage: 'COMPLETE',
          processingTime,
          anonymized: edgeResult.report.anonymized || false,
          trustLevel: trustResult.report.trustLevel,
          policyCompliant: true,
        },
      };
    } catch (error) {
      this.auditLogger.logError(error, { requestId, context });
      this.emit('error', error);

      return {
        allowed: false,
        data: null,
        report: {
          requestId,
          stage: 'ERROR',
          error: error.message,
        },
      };
    }
  }

  /**
   * Process an outgoing response through privacy filters
   */
  async processResponse(response, context = {}) {
    // Ensure no PII leaks in responses
    const privacyResult = await this.privacyEngine.process(response, {
      ...context,
      direction: 'outbound',
    });

    if (this.config.auditAllRequests) {
      this.auditLogger.logDataOperation('response_sent', {
        type: 'system',
        id: 'gateway',
      }, context.target, {
        anonymized: privacyResult.report.action === 'ANONYMIZED',
      });
    }

    return {
      data: privacyResult.data,
      report: privacyResult.report,
    };
  }

  /**
   * Register a user's consent
   */
  async registerConsent(userId, consents, metadata = {}) {
    const results = await this.consentManager.grantBulkConsent(userId, consents, metadata);

    for (const result of results) {
      if (result.granted !== undefined) {
        this.auditLogger.logConsent(
          result.granted ? 'granted' : 'revoked',
          { type: 'user', id: userId },
          { consentType: result.type }
        );
      }
    }

    return results;
  }

  /**
   * Check user consent status
   */
  checkConsent(userId, requiredConsents) {
    return this.consentManager.verifyConsent(userId, requiredConsents);
  }

  /**
   * Get user's consent status
   */
  getUserConsents(userId) {
    return this.consentManager.getUserConsents(userId);
  }

  /**
   * Handle user data deletion request (right to erasure)
   */
  async deleteUserData(userId) {
    // Delete from consent manager
    await this.consentManager.deleteUserData(userId);

    // Log the deletion
    this.auditLogger.logDataOperation('user_data_deleted', {
      type: 'system',
      id: 'gateway',
    }, { type: 'user', id: userId }, {
      reason: 'user_request',
    });

    this.emit('user-data-deleted', { userId });

    return { success: true, userId };
  }

  /**
   * Export user data (right to portability)
   */
  async exportUserData(userId) {
    const consentData = this.consentManager.exportUserData(userId);

    this.auditLogger.logDataOperation('user_data_exported', {
      type: 'system',
      id: 'gateway',
    }, { type: 'user', id: userId });

    return {
      userId,
      exportedAt: new Date().toISOString(),
      consent: consentData,
    };
  }

  /**
   * Register a trusted source
   */
  registerTrustedSource(sourceId, trustLevel, metadata = {}) {
    this.trustFilter.registerSource(sourceId, trustLevel, metadata);

    this.auditLogger.log({
      category: AUDIT_CATEGORIES.CONFIG,
      action: 'source_registered',
      details: { sourceId, trustLevel },
    });
  }

  /**
   * Get transparency dashboard data
   */
  getTransparencyData(userId = null) {
    const data = {
      system: {
        version: this.version,
        startedAt: this.startedAt,
        status: this.supervisor.getStatus(),
      },
      stats: this.getStats(),
      dataUsageAgreement: this.consentManager.getCurrentAgreement(),
      consentTypes: this.consentManager.getConsentTypes(),
    };

    if (userId) {
      data.userConsents = this.getUserConsents(userId);
    }

    return data;
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      startedAt: this.startedAt,
      supervisor: this.supervisor.getStatus(),
      components: {
        edgeLayer: this.edgeLayer.getStats(),
        trustFilter: this.trustFilter.getStats(),
        privacyEngine: this.privacyEngine.getStats(),
        auditLogger: this.auditLogger.getStats(),
      },
    };
  }

  /**
   * Get aggregated statistics
   */
  getStats() {
    return {
      ...this.stats,
      edge: this.edgeLayer.getStats(),
      trust: this.trustFilter.getStats(),
      privacy: this.privacyEngine.getStats(),
      audit: this.auditLogger.getStats(),
    };
  }

  /**
   * Get audit logs
   */
  getAuditLogs(filter = {}) {
    return this.auditLogger.query(filter);
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(startDate, endDate) {
    return this.auditLogger.generateComplianceReport(startDate, endDate);
  }

  /**
   * Get alerts
   */
  getAlerts(filter = {}) {
    return this.supervisor.getAlerts(filter);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId, by = 'operator') {
    return this.supervisor.acknowledgeAlert(alertId, by);
  }

  /**
   * Create Express middleware for the gateway
   */
  createMiddleware() {
    return async (req, res, next) => {
      const context = {
        path: req.path,
        method: req.method,
        ip: req.ip || req.connection?.remoteAddress,
        userId: req.user?.id || req.headers['x-user-id'],
        userAgent: req.headers['user-agent'],
        action: `${req.method.toLowerCase()}_${req.path.replace(/\//g, '_')}`,
        source: { id: req.user?.id || 'anonymous', type: 'user' },
      };

      // Process request
      const result = await this.processRequest(req.body || {}, context);

      if (!result.allowed) {
        const statusCode = result.report.stage === 'EDGE' ?
          (result.report.action === 'RATE_LIMITED' ? 429 :
            result.report.action === 'CONSENT_REQUIRED' ? 403 : 400) :
          400;

        return res.status(statusCode).json({
          error: 'Request blocked by ethics filter',
          code: result.report.action,
          requestId: result.report.requestId,
        });
      }

      // Attach processed data
      req.body = result.data;
      req.ethicsReport = result.report;

      // Wrap response to filter outgoing data
      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        const filtered = await this.processResponse(data, context);
        return originalJson(filtered.data);
      };

      next();
    };
  }

  /**
   * Create transparency API routes
   */
  createTransparencyRoutes() {
    const routes = {
      // Get transparency dashboard data
      'GET /transparency': async (req) => {
        const userId = req.user?.id || req.headers['x-user-id'];
        return this.getTransparencyData(userId);
      },

      // Get current data usage agreement
      'GET /transparency/agreement': async () => {
        return this.consentManager.getCurrentAgreement();
      },

      // Get user's consent status
      'GET /transparency/consent': async (req) => {
        const userId = req.user?.id || req.headers['x-user-id'];
        if (!userId) {
          throw new Error('User ID required');
        }
        return this.getUserConsents(userId);
      },

      // Update user consent
      'POST /transparency/consent': async (req) => {
        const userId = req.user?.id || req.headers['x-user-id'];
        if (!userId) {
          throw new Error('User ID required');
        }
        return this.registerConsent(userId, req.body.consents, req.body.metadata);
      },

      // Request data export
      'POST /transparency/export': async (req) => {
        const userId = req.user?.id || req.headers['x-user-id'];
        if (!userId) {
          throw new Error('User ID required');
        }
        return this.exportUserData(userId);
      },

      // Request data deletion
      'DELETE /transparency/data': async (req) => {
        const userId = req.user?.id || req.headers['x-user-id'];
        if (!userId) {
          throw new Error('User ID required');
        }
        return this.deleteUserData(userId);
      },

      // Get system status (admin only)
      'GET /transparency/status': async () => {
        return this.getStatus();
      },
    };

    return routes;
  }
}

// Factory function for easy creation
function createEthicsGateway(options = {}) {
  const gateway = new EthicsGateway(options);
  return gateway;
}

module.exports = {
  EthicsGateway,
  createEthicsGateway,

  // Re-export components for direct access
  PrivacyEngine,
  ConsentManager,
  EdgeLayer,
  TrustFilter,
  AuditLogger,
  EthicsSupervisor,

  // Re-export constants
  CONSENT_TYPES,
  TRUST_LEVELS,
  AUDIT_CATEGORIES,
  SEVERITY,
  ALERT_LEVEL,
};
