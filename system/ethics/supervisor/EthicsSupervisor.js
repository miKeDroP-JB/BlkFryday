/**
 * EthicsSupervisor (P23) - Real-Time Ethics Monitoring & Control
 * "Tech That Listens. Tech That Respects."
 *
 * The watchful guardian over all system operations.
 * Monitors, alerts, and can intervene when ethical boundaries are crossed.
 *
 * Features:
 * 1. Real-time monitoring of all ethics components
 * 2. Anomaly detection and alerting
 * 3. Emergency shutdown capability
 * 4. Health checks and status reporting
 * 5. Policy enforcement oversight
 */

const { EventEmitter } = require('events');
const { AUDIT_CATEGORIES, SEVERITY } = require('../audit/AuditLogger');

// Supervisor states
const SUPERVISOR_STATE = {
  INACTIVE: 'inactive',
  STARTING: 'starting',
  ACTIVE: 'active',
  DEGRADED: 'degraded',
  EMERGENCY: 'emergency',
  SHUTDOWN: 'shutdown',
};

// Alert levels
const ALERT_LEVEL = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency',
};

// Thresholds for automatic actions
const DEFAULT_THRESHOLDS = {
  // Rate-based thresholds (per minute)
  securityThreatsPerMinute: 10,
  blockedRequestsPerMinute: 50,
  piiDetectionsPerMinute: 20,
  consentDenialsPerMinute: 20,

  // Error thresholds
  errorRatePercent: 10,
  criticalErrorsPerHour: 5,

  // Component health
  componentUnhealthySeconds: 60,
  maxUnhealthyComponents: 2,

  // Emergency triggers
  emergencyThreatCount: 20,
  emergencyBlockRate: 80, // percent
};

/**
 * AlertManager - Manages alerts and notifications
 */
class AlertManager {
  constructor(options = {}) {
    this.alerts = [];
    this.maxAlerts = options.maxAlerts || 1000;
    this.handlers = new Map(); // level -> handler functions
    this.acknowledged = new Set();
    this.suppressed = new Map(); // alertType -> until timestamp
  }

  /**
   * Create an alert
   */
  alert(level, type, message, details = {}) {
    // Check if suppressed
    const suppressedUntil = this.suppressed.get(type);
    if (suppressedUntil && Date.now() < suppressedUntil) {
      return null;
    }

    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      type,
      message,
      details,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    this.alerts.push(alert);

    // Rotate if needed
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    // Call handlers
    const handlers = this.handlers.get(level) || [];
    for (const handler of handlers) {
      try {
        handler(alert);
      } catch (e) {
        console.error('Alert handler error:', e);
      }
    }

    return alert;
  }

  /**
   * Register an alert handler
   */
  onAlert(level, handler) {
    if (!this.handlers.has(level)) {
      this.handlers.set(level, []);
    }
    this.handlers.get(level).push(handler);
  }

  /**
   * Acknowledge an alert
   */
  acknowledge(alertId, by = 'system') {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = by;
      alert.acknowledgedAt = new Date().toISOString();
      this.acknowledged.add(alertId);
    }
    return alert;
  }

  /**
   * Suppress alerts of a type for duration
   */
  suppress(type, durationMs = 300000) { // 5 min default
    this.suppressed.set(type, Date.now() + durationMs);
  }

  /**
   * Get active alerts
   */
  getActive(level = null) {
    let alerts = this.alerts.filter(a => !a.acknowledged);
    if (level) {
      alerts = alerts.filter(a => a.level === level);
    }
    return alerts;
  }

  /**
   * Get all alerts
   */
  getAll(filter = {}) {
    let alerts = [...this.alerts];

    if (filter.level) {
      alerts = alerts.filter(a => a.level === filter.level);
    }
    if (filter.type) {
      alerts = alerts.filter(a => a.type === filter.type);
    }
    if (filter.since) {
      alerts = alerts.filter(a => new Date(a.timestamp) >= new Date(filter.since));
    }
    if (filter.acknowledged !== undefined) {
      alerts = alerts.filter(a => a.acknowledged === filter.acknowledged);
    }

    return alerts;
  }

  /**
   * Clear old alerts
   */
  clearOld(maxAgeMs = 86400000) { // 24 hours default
    const cutoff = Date.now() - maxAgeMs;
    this.alerts = this.alerts.filter(
      a => new Date(a.timestamp).getTime() > cutoff
    );
  }
}

/**
 * MetricsCollector - Collects real-time metrics
 */
class MetricsCollector {
  constructor(options = {}) {
    this.metrics = new Map(); // name -> { value, timestamp, history[] }
    this.windows = {
      minute: new Map(),
      hour: new Map(),
    };
    this.historySize = options.historySize || 100;
  }

  /**
   * Record a metric
   */
  record(name, value, tags = {}) {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000);
    const hourKey = Math.floor(now / 3600000);

    // Update current value
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        value: 0,
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        history: [],
      });
    }

    const metric = this.metrics.get(name);
    metric.value = value;
    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.timestamp = now;

    // Add to history
    metric.history.push({ value, timestamp: now, tags });
    if (metric.history.length > this.historySize) {
      metric.history.shift();
    }

    // Update windows for rate metrics
    const windowKey = `${name}:${minuteKey}`;
    this.windows.minute.set(windowKey, (this.windows.minute.get(windowKey) || 0) + 1);

    const hourWindowKey = `${name}:${hourKey}`;
    this.windows.hour.set(hourWindowKey, (this.windows.hour.get(hourWindowKey) || 0) + 1);
  }

  /**
   * Increment a counter
   */
  increment(name, amount = 1) {
    const current = this.metrics.get(name)?.value || 0;
    this.record(name, current + amount);
  }

  /**
   * Get current metric value
   */
  get(name) {
    return this.metrics.get(name);
  }

  /**
   * Get rate per minute
   */
  getRatePerMinute(name) {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000);
    const key = `${name}:${minuteKey}`;
    return this.windows.minute.get(key) || 0;
  }

  /**
   * Get rate per hour
   */
  getRatePerHour(name) {
    const now = Date.now();
    const hourKey = Math.floor(now / 3600000);
    const key = `${name}:${hourKey}`;
    return this.windows.hour.get(key) || 0;
  }

  /**
   * Get all metrics summary
   */
  getSummary() {
    const summary = {};
    for (const [name, data] of this.metrics) {
      summary[name] = {
        current: data.value,
        count: data.count,
        avg: data.count > 0 ? data.sum / data.count : 0,
        min: data.min === Infinity ? 0 : data.min,
        max: data.max === -Infinity ? 0 : data.max,
        ratePerMinute: this.getRatePerMinute(name),
      };
    }
    return summary;
  }

  /**
   * Clean old window data
   */
  cleanup() {
    const now = Date.now();
    const minuteThreshold = Math.floor(now / 60000) - 60; // Keep 1 hour
    const hourThreshold = Math.floor(now / 3600000) - 24; // Keep 24 hours

    for (const [key] of this.windows.minute) {
      const keyTime = parseInt(key.split(':').pop());
      if (keyTime < minuteThreshold) {
        this.windows.minute.delete(key);
      }
    }

    for (const [key] of this.windows.hour) {
      const keyTime = parseInt(key.split(':').pop());
      if (keyTime < hourThreshold) {
        this.windows.hour.delete(key);
      }
    }
  }
}

/**
 * HealthChecker - Monitors component health
 */
class HealthChecker {
  constructor(options = {}) {
    this.components = new Map(); // name -> { status, lastCheck, checkFn }
    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.intervalId = null;
  }

  /**
   * Register a component for health checking
   */
  register(name, checkFn) {
    this.components.set(name, {
      name,
      status: 'unknown',
      lastCheck: null,
      checkFn,
      history: [],
    });
  }

  /**
   * Check a single component
   */
  async checkComponent(name) {
    const component = this.components.get(name);
    if (!component) return null;

    try {
      const result = await component.checkFn();
      component.status = result.healthy ? 'healthy' : 'unhealthy';
      component.lastCheck = new Date().toISOString();
      component.lastResult = result;
      component.history.push({
        status: component.status,
        timestamp: component.lastCheck,
      });

      // Keep last 10 checks
      if (component.history.length > 10) {
        component.history.shift();
      }
    } catch (error) {
      component.status = 'error';
      component.lastCheck = new Date().toISOString();
      component.lastResult = { error: error.message };
    }

    return component;
  }

  /**
   * Check all components
   */
  async checkAll() {
    const results = {};
    for (const name of this.components.keys()) {
      results[name] = await this.checkComponent(name);
    }
    return results;
  }

  /**
   * Start periodic health checks
   */
  start() {
    if (this.intervalId) return;

    this.intervalId = setInterval(async () => {
      await this.checkAll();
    }, this.checkInterval);

    // Initial check
    this.checkAll();
  }

  /**
   * Stop periodic health checks
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Get overall health status
   */
  getOverallHealth() {
    const statuses = Array.from(this.components.values()).map(c => c.status);

    if (statuses.every(s => s === 'healthy')) {
      return 'healthy';
    }
    if (statuses.some(s => s === 'error')) {
      return 'error';
    }
    if (statuses.some(s => s === 'unhealthy')) {
      return 'degraded';
    }
    return 'unknown';
  }

  /**
   * Get unhealthy components
   */
  getUnhealthy() {
    return Array.from(this.components.values())
      .filter(c => c.status !== 'healthy');
  }

  /**
   * Get all component statuses
   */
  getStatus() {
    const status = {};
    for (const [name, component] of this.components) {
      status[name] = {
        status: component.status,
        lastCheck: component.lastCheck,
        lastResult: component.lastResult,
      };
    }
    return {
      overall: this.getOverallHealth(),
      components: status,
    };
  }
}

/**
 * EthicsSupervisor - Main supervisor class
 */
class EthicsSupervisor extends EventEmitter {
  constructor(options = {}) {
    super();

    this.state = SUPERVISOR_STATE.INACTIVE;
    this.startedAt = null;

    // Components
    this.alertManager = new AlertManager(options.alerts);
    this.metricsCollector = new MetricsCollector(options.metrics);
    this.healthChecker = new HealthChecker(options.health);

    // Configuration
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };
    this.config = {
      enableAutoResponse: options.enableAutoResponse !== false,
      enableEmergencyShutdown: options.enableEmergencyShutdown !== false,
      monitoringInterval: options.monitoringInterval || 10000, // 10 seconds
    };

    // References to monitored components
    this.components = {
      edgeLayer: null,
      trustFilter: null,
      privacyEngine: null,
      consentManager: null,
      auditLogger: null,
    };

    // Monitoring interval
    this.monitoringIntervalId = null;

    // Emergency state
    this.emergencyMode = false;
    this.emergencyReason = null;

    // Setup alert handlers
    this._setupAlertHandlers();
  }

  _setupAlertHandlers() {
    // Emergency alerts trigger immediate action
    this.alertManager.onAlert(ALERT_LEVEL.EMERGENCY, (alert) => {
      this.emit('emergency-alert', alert);
      if (this.config.enableAutoResponse) {
        this.enterEmergencyMode(alert.message);
      }
    });

    // Critical alerts are logged
    this.alertManager.onAlert(ALERT_LEVEL.CRITICAL, (alert) => {
      this.emit('critical-alert', alert);
    });
  }

  /**
   * Register components for monitoring
   */
  registerComponents(components) {
    this.components = { ...this.components, ...components };

    // Set up health checks for each component
    for (const [name, component] of Object.entries(this.components)) {
      if (component) {
        this.healthChecker.register(name, async () => {
          if (typeof component.getStats === 'function') {
            const stats = component.getStats();
            return { healthy: true, stats };
          }
          return { healthy: true };
        });

        // Subscribe to component events
        if (component.on) {
          component.on('error', (error) => {
            this.metricsCollector.increment(`${name}.errors`);
            this.alertManager.alert(
              ALERT_LEVEL.WARNING,
              `${name}_error`,
              `Error in ${name}: ${error.message}`,
              { error }
            );
          });
        }
      }
    }
  }

  /**
   * Start the supervisor
   */
  async start() {
    if (this.state === SUPERVISOR_STATE.ACTIVE) {
      return;
    }

    this.state = SUPERVISOR_STATE.STARTING;
    this.startedAt = new Date().toISOString();

    // Start health checker
    this.healthChecker.start();

    // Start monitoring loop
    this.monitoringIntervalId = setInterval(
      () => this._monitoringLoop(),
      this.config.monitoringInterval
    );

    // Subscribe to component events
    this._subscribeToComponents();

    this.state = SUPERVISOR_STATE.ACTIVE;
    this.emit('started', { startedAt: this.startedAt });

    // Initial health check
    await this.healthChecker.checkAll();
  }

  /**
   * Stop the supervisor
   */
  stop() {
    if (this.monitoringIntervalId) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }

    this.healthChecker.stop();
    this.state = SUPERVISOR_STATE.INACTIVE;
    this.emit('stopped');
  }

  /**
   * Subscribe to component events
   */
  _subscribeToComponents() {
    const { edgeLayer, trustFilter, auditLogger } = this.components;

    if (edgeLayer?.on) {
      edgeLayer.on('rate-limited', (data) => {
        this.metricsCollector.increment('edge.rateLimited');
      });

      edgeLayer.on('security-threat', (data) => {
        this.metricsCollector.increment('edge.securityThreats');
        this._checkSecurityThreshold();
      });

      edgeLayer.on('consent-denied', (data) => {
        this.metricsCollector.increment('edge.consentDenied');
      });

      edgeLayer.on('request-processed', (data) => {
        this.metricsCollector.record('edge.processingTime', data.processingTime);
      });
    }

    if (trustFilter?.on) {
      trustFilter.on('policy-violation', (data) => {
        this.metricsCollector.increment('trust.policyViolations');
      });

      trustFilter.on('trust-violation', (data) => {
        this.metricsCollector.increment('trust.trustViolations');
      });
    }

    if (auditLogger?.on) {
      auditLogger.on('anomaly', (data) => {
        this.metricsCollector.increment('audit.anomalies');
        this.alertManager.alert(
          ALERT_LEVEL.WARNING,
          'anomaly_detected',
          `Anomaly detected: ${data.anomalies.map(a => a.type).join(', ')}`,
          data
        );
      });

      auditLogger.on('high-severity', (entry) => {
        if (entry.severity >= SEVERITY.CRITICAL) {
          this.alertManager.alert(
            ALERT_LEVEL.CRITICAL,
            'critical_event',
            entry.description || `Critical event: ${entry.action}`,
            { entry }
          );
        }
      });
    }
  }

  /**
   * Main monitoring loop
   */
  async _monitoringLoop() {
    try {
      // Collect metrics from components
      this._collectComponentMetrics();

      // Check thresholds
      this._checkThresholds();

      // Update health status
      const healthStatus = this.healthChecker.getOverallHealth();
      if (healthStatus === 'error' || healthStatus === 'degraded') {
        if (this.state !== SUPERVISOR_STATE.DEGRADED) {
          this.state = SUPERVISOR_STATE.DEGRADED;
          this.alertManager.alert(
            ALERT_LEVEL.WARNING,
            'system_degraded',
            `System health degraded: ${healthStatus}`,
            { unhealthy: this.healthChecker.getUnhealthy() }
          );
        }
      } else if (this.state === SUPERVISOR_STATE.DEGRADED) {
        this.state = SUPERVISOR_STATE.ACTIVE;
        this.alertManager.alert(
          ALERT_LEVEL.INFO,
          'system_recovered',
          'System health recovered',
          {}
        );
      }

      // Cleanup old data
      this.metricsCollector.cleanup();
      this.alertManager.clearOld();
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Collect metrics from all components
   */
  _collectComponentMetrics() {
    for (const [name, component] of Object.entries(this.components)) {
      if (component && typeof component.getStats === 'function') {
        const stats = component.getStats();
        for (const [key, value] of Object.entries(stats)) {
          if (typeof value === 'number') {
            this.metricsCollector.record(`${name}.${key}`, value);
          }
        }
      }
    }
  }

  /**
   * Check thresholds and trigger alerts
   */
  _checkThresholds() {
    const securityThreats = this.metricsCollector.getRatePerMinute('edge.securityThreats');
    if (securityThreats >= this.thresholds.securityThreatsPerMinute) {
      this.alertManager.alert(
        ALERT_LEVEL.CRITICAL,
        'security_threat_spike',
        `High security threat rate: ${securityThreats}/min`,
        { rate: securityThreats, threshold: this.thresholds.securityThreatsPerMinute }
      );
    }

    const blockedRequests = this.metricsCollector.getRatePerMinute('edge.rateLimited');
    if (blockedRequests >= this.thresholds.blockedRequestsPerMinute) {
      this.alertManager.alert(
        ALERT_LEVEL.WARNING,
        'high_block_rate',
        `High block rate: ${blockedRequests}/min`,
        { rate: blockedRequests }
      );
    }

    // Check for emergency conditions
    if (securityThreats >= this.thresholds.emergencyThreatCount) {
      this.alertManager.alert(
        ALERT_LEVEL.EMERGENCY,
        'emergency_threat_level',
        `EMERGENCY: Extreme threat level detected: ${securityThreats}/min`,
        { rate: securityThreats }
      );
    }
  }

  /**
   * Check security threshold specifically
   */
  _checkSecurityThreshold() {
    const rate = this.metricsCollector.getRatePerMinute('edge.securityThreats');
    if (rate >= this.thresholds.emergencyThreatCount) {
      this.enterEmergencyMode(`Security threat rate exceeded: ${rate}/min`);
    }
  }

  /**
   * Enter emergency mode
   */
  enterEmergencyMode(reason) {
    if (this.emergencyMode) return;

    this.emergencyMode = true;
    this.emergencyReason = reason;
    this.state = SUPERVISOR_STATE.EMERGENCY;

    this.emit('emergency', { reason, timestamp: new Date().toISOString() });

    this.alertManager.alert(
      ALERT_LEVEL.EMERGENCY,
      'emergency_mode_activated',
      `EMERGENCY MODE ACTIVATED: ${reason}`,
      { reason }
    );

    // If auto-shutdown enabled, disable all components
    if (this.config.enableEmergencyShutdown) {
      this._emergencyShutdown();
    }
  }

  /**
   * Emergency shutdown - disable processing
   */
  _emergencyShutdown() {
    for (const [name, component] of Object.entries(this.components)) {
      if (component && component.config) {
        component.config.enabled = false;
      }
    }

    this.emit('emergency-shutdown', {
      reason: this.emergencyReason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Exit emergency mode
   */
  exitEmergencyMode() {
    if (!this.emergencyMode) return;

    this.emergencyMode = false;
    this.emergencyReason = null;
    this.state = SUPERVISOR_STATE.ACTIVE;

    // Re-enable components
    for (const [name, component] of Object.entries(this.components)) {
      if (component && component.config) {
        component.config.enabled = true;
      }
    }

    this.emit('emergency-cleared', { timestamp: new Date().toISOString() });

    this.alertManager.alert(
      ALERT_LEVEL.INFO,
      'emergency_mode_cleared',
      'Emergency mode has been cleared',
      {}
    );
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      state: this.state,
      startedAt: this.startedAt,
      uptime: this.startedAt ? Date.now() - new Date(this.startedAt).getTime() : 0,
      emergencyMode: this.emergencyMode,
      emergencyReason: this.emergencyReason,
      health: this.healthChecker.getStatus(),
      metrics: this.metricsCollector.getSummary(),
      alerts: {
        active: this.alertManager.getActive().length,
        critical: this.alertManager.getActive(ALERT_LEVEL.CRITICAL).length,
        emergency: this.alertManager.getActive(ALERT_LEVEL.EMERGENCY).length,
      },
    };
  }

  /**
   * Get detailed report
   */
  getReport() {
    return {
      status: this.getStatus(),
      alerts: this.alertManager.getAll({ acknowledged: false }),
      healthDetails: this.healthChecker.getStatus(),
      metricsDetails: this.metricsCollector.getSummary(),
      componentStats: Object.fromEntries(
        Object.entries(this.components)
          .filter(([, c]) => c && typeof c.getStats === 'function')
          .map(([name, component]) => [name, component.getStats()])
      ),
    };
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId, by = 'operator') {
    return this.alertManager.acknowledge(alertId, by);
  }

  /**
   * Get alerts
   */
  getAlerts(filter = {}) {
    return this.alertManager.getAll(filter);
  }
}

module.exports = {
  EthicsSupervisor,
  AlertManager,
  MetricsCollector,
  HealthChecker,
  SUPERVISOR_STATE,
  ALERT_LEVEL,
  DEFAULT_THRESHOLDS,
};
