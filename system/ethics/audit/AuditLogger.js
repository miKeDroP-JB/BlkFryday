/**
 * AuditLogger - Tamper-Proof Audit Trail System
 * "Tech That Listens. Tech That Respects."
 *
 * Comprehensive logging system for compliance, security, and transparency.
 * Uses hash chains to ensure audit log integrity (tamper-evident).
 *
 * Features:
 * 1. Hash-chained entries (tamper detection)
 * 2. Structured event logging
 * 3. Query and search capabilities
 * 4. Export for compliance
 * 5. Anomaly flagging
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');

// Audit event categories
const AUDIT_CATEGORIES = {
  // Access & Authentication
  AUTH: 'authentication',
  ACCESS: 'access',
  PERMISSION: 'permission',

  // Data Operations
  DATA_READ: 'data_read',
  DATA_WRITE: 'data_write',
  DATA_DELETE: 'data_delete',
  DATA_EXPORT: 'data_export',

  // Privacy & Consent
  CONSENT: 'consent',
  PRIVACY: 'privacy',
  PII_DETECTED: 'pii_detected',
  ANONYMIZATION: 'anonymization',

  // Security
  SECURITY: 'security',
  THREAT: 'threat',
  BLOCKED: 'blocked',

  // System
  SYSTEM: 'system',
  CONFIG: 'config',
  ERROR: 'error',

  // Agent Operations
  AGENT: 'agent',

  // Compliance
  COMPLIANCE: 'compliance',
  POLICY: 'policy',
};

// Severity levels
const SEVERITY = {
  DEBUG: 0,
  INFO: 1,
  NOTICE: 2,
  WARNING: 3,
  ERROR: 4,
  CRITICAL: 5,
  ALERT: 6,
  EMERGENCY: 7,
};

/**
 * AuditEntry - A single audit log entry with hash chain
 */
class AuditEntry {
  constructor(data, previousHash = null) {
    this.id = crypto.randomUUID();
    this.timestamp = new Date().toISOString();
    this.sequence = data.sequence || 0;

    // Core audit data
    this.category = data.category;
    this.action = data.action;
    this.severity = data.severity || SEVERITY.INFO;
    this.description = data.description;

    // Context
    this.actor = data.actor || { type: 'system', id: 'unknown' };
    this.target = data.target || null;
    this.source = data.source || null;

    // Details
    this.details = data.details || {};
    this.metadata = data.metadata || {};

    // Result
    this.result = data.result || 'success';
    this.errorCode = data.errorCode || null;

    // Hash chain for tamper detection
    this.previousHash = previousHash;
    this.hash = this._computeHash();
  }

  _computeHash() {
    const payload = JSON.stringify({
      id: this.id,
      timestamp: this.timestamp,
      sequence: this.sequence,
      category: this.category,
      action: this.action,
      actor: this.actor,
      target: this.target,
      details: this.details,
      previousHash: this.previousHash,
    });

    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  verify(previousEntry = null) {
    // Verify this entry's hash
    const expectedHash = this._computeHash();
    if (this.hash !== expectedHash) {
      return { valid: false, reason: 'Hash mismatch - entry may be tampered' };
    }

    // Verify chain link
    if (previousEntry && this.previousHash !== previousEntry.hash) {
      return { valid: false, reason: 'Chain broken - previous hash mismatch' };
    }

    return { valid: true };
  }

  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      sequence: this.sequence,
      category: this.category,
      action: this.action,
      severity: this.severity,
      description: this.description,
      actor: this.actor,
      target: this.target,
      source: this.source,
      details: this.details,
      result: this.result,
      hash: this.hash,
      previousHash: this.previousHash,
    };
  }
}

/**
 * AuditStore - In-memory store with persistence hooks
 */
class AuditStore {
  constructor(options = {}) {
    this.entries = [];
    this.maxEntries = options.maxEntries || 100000;
    this.indexes = {
      byCategory: new Map(),
      byActor: new Map(),
      bySeverity: new Map(),
      byDate: new Map(),
    };
    this.sequence = 0;
  }

  add(entry) {
    this.entries.push(entry);

    // Maintain indexes
    this._addToIndex('byCategory', entry.category, entry);
    this._addToIndex('byActor', entry.actor?.id, entry);
    this._addToIndex('bySeverity', entry.severity, entry);
    this._addToIndex('byDate', entry.timestamp.split('T')[0], entry);

    // Rotate if needed
    if (this.entries.length > this.maxEntries) {
      this._rotate();
    }

    return entry;
  }

  _addToIndex(indexName, key, entry) {
    if (!key) return;
    const index = this.indexes[indexName];
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key).push(entry.id);
  }

  _rotate() {
    // Remove oldest 10%
    const removeCount = Math.floor(this.maxEntries * 0.1);
    const removed = this.entries.splice(0, removeCount);

    // Clean indexes
    for (const entry of removed) {
      this._removeFromIndexes(entry);
    }
  }

  _removeFromIndexes(entry) {
    for (const index of Object.values(this.indexes)) {
      for (const [key, ids] of index.entries()) {
        const idx = ids.indexOf(entry.id);
        if (idx !== -1) {
          ids.splice(idx, 1);
        }
      }
    }
  }

  getLastHash() {
    if (this.entries.length === 0) return null;
    return this.entries[this.entries.length - 1].hash;
  }

  getNextSequence() {
    return ++this.sequence;
  }

  query(filters = {}) {
    let results = [...this.entries];

    if (filters.category) {
      results = results.filter(e => e.category === filters.category);
    }
    if (filters.severity !== undefined) {
      results = results.filter(e => e.severity >= filters.severity);
    }
    if (filters.actorId) {
      results = results.filter(e => e.actor?.id === filters.actorId);
    }
    if (filters.since) {
      results = results.filter(e => new Date(e.timestamp) >= new Date(filters.since));
    }
    if (filters.until) {
      results = results.filter(e => new Date(e.timestamp) <= new Date(filters.until));
    }
    if (filters.action) {
      results = results.filter(e => e.action.includes(filters.action));
    }
    if (filters.result) {
      results = results.filter(e => e.result === filters.result);
    }

    // Apply limit and offset
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    results = results.slice(offset, offset + limit);

    return results;
  }

  getById(id) {
    return this.entries.find(e => e.id === id);
  }

  getBySequenceRange(start, end) {
    return this.entries.filter(e => e.sequence >= start && e.sequence <= end);
  }

  verifyChain(startIndex = 0) {
    const issues = [];

    for (let i = startIndex; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const previousEntry = i > 0 ? this.entries[i - 1] : null;

      const verification = entry.verify(previousEntry);
      if (!verification.valid) {
        issues.push({
          index: i,
          entryId: entry.id,
          reason: verification.reason,
        });
      }
    }

    return {
      valid: issues.length === 0,
      entriesChecked: this.entries.length - startIndex,
      issues,
    };
  }

  export(format = 'json') {
    const data = this.entries.map(e => e.toJSON());

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'jsonl':
        return data.map(e => JSON.stringify(e)).join('\n');
      case 'csv':
        const headers = ['id', 'timestamp', 'category', 'action', 'severity', 'actor', 'result'];
        const rows = data.map(e => [
          e.id,
          e.timestamp,
          e.category,
          e.action,
          e.severity,
          e.actor?.id || '',
          e.result,
        ].join(','));
        return [headers.join(','), ...rows].join('\n');
      default:
        return data;
    }
  }

  getStats() {
    const bySeverity = {};
    const byCategory = {};
    const byResult = {};

    for (const entry of this.entries) {
      bySeverity[entry.severity] = (bySeverity[entry.severity] || 0) + 1;
      byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
      byResult[entry.result] = (byResult[entry.result] || 0) + 1;
    }

    return {
      totalEntries: this.entries.length,
      bySeverity,
      byCategory,
      byResult,
      oldestEntry: this.entries[0]?.timestamp,
      newestEntry: this.entries[this.entries.length - 1]?.timestamp,
    };
  }
}

/**
 * AnomalyDetector - Detects suspicious patterns in audit logs
 */
class AnomalyDetector {
  constructor(options = {}) {
    this.thresholds = {
      failedAuthPerMinute: options.failedAuthPerMinute || 5,
      securityEventsPerMinute: options.securityEventsPerMinute || 10,
      piiDetectionsPerHour: options.piiDetectionsPerHour || 50,
      errorRateThreshold: options.errorRateThreshold || 0.2, // 20%
    };
    this.windows = {
      minute: new Map(), // key -> count
      hour: new Map(),
    };
    this.anomalies = [];
  }

  /**
   * Check an entry for anomalies
   */
  check(entry) {
    const now = Date.now();
    const minuteKey = Math.floor(now / 60000);
    const hourKey = Math.floor(now / 3600000);
    const anomalies = [];

    // Track failed auth attempts
    if (entry.category === AUDIT_CATEGORIES.AUTH && entry.result === 'failure') {
      const key = `auth:${entry.actor?.id}:${minuteKey}`;
      const count = (this.windows.minute.get(key) || 0) + 1;
      this.windows.minute.set(key, count);

      if (count >= this.thresholds.failedAuthPerMinute) {
        anomalies.push({
          type: 'BRUTE_FORCE_SUSPECTED',
          severity: SEVERITY.ALERT,
          details: { actorId: entry.actor?.id, failedAttempts: count },
        });
      }
    }

    // Track security events
    if (entry.category === AUDIT_CATEGORIES.SECURITY || entry.category === AUDIT_CATEGORIES.THREAT) {
      const key = `security:${minuteKey}`;
      const count = (this.windows.minute.get(key) || 0) + 1;
      this.windows.minute.set(key, count);

      if (count >= this.thresholds.securityEventsPerMinute) {
        anomalies.push({
          type: 'SECURITY_SPIKE',
          severity: SEVERITY.CRITICAL,
          details: { eventsPerMinute: count },
        });
      }
    }

    // Track PII detections
    if (entry.category === AUDIT_CATEGORIES.PII_DETECTED) {
      const key = `pii:${hourKey}`;
      const count = (this.windows.hour.get(key) || 0) + 1;
      this.windows.hour.set(key, count);

      if (count >= this.thresholds.piiDetectionsPerHour) {
        anomalies.push({
          type: 'PII_VOLUME_HIGH',
          severity: SEVERITY.WARNING,
          details: { detectionsPerHour: count },
        });
      }
    }

    // Store detected anomalies
    for (const anomaly of anomalies) {
      this.anomalies.push({
        ...anomaly,
        entryId: entry.id,
        timestamp: new Date().toISOString(),
      });
    }

    // Clean old window data periodically
    this._cleanWindows(now);

    return anomalies;
  }

  _cleanWindows(now) {
    const minuteThreshold = Math.floor(now / 60000) - 5; // Keep 5 minutes
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

  getAnomalies(since = null) {
    if (since) {
      return this.anomalies.filter(a => new Date(a.timestamp) >= new Date(since));
    }
    return this.anomalies;
  }

  clearAnomalies() {
    this.anomalies = [];
  }
}

/**
 * AuditLogger - Main audit logging class
 */
class AuditLogger extends EventEmitter {
  constructor(options = {}) {
    super();

    this.store = new AuditStore(options.store);
    this.anomalyDetector = new AnomalyDetector(options.anomalyDetection);

    this.config = {
      enabled: options.enabled !== false,
      minSeverity: options.minSeverity || SEVERITY.DEBUG,
      detectAnomalies: options.detectAnomalies !== false,
      emitEvents: options.emitEvents !== false,
    };
  }

  /**
   * Log an audit entry
   */
  log(data) {
    if (!this.config.enabled) return null;
    if ((data.severity || SEVERITY.INFO) < this.config.minSeverity) return null;

    const entry = new AuditEntry(
      { ...data, sequence: this.store.getNextSequence() },
      this.store.getLastHash()
    );

    this.store.add(entry);

    // Check for anomalies
    if (this.config.detectAnomalies) {
      const anomalies = this.anomalyDetector.check(entry);
      if (anomalies.length > 0) {
        this.emit('anomaly', { entry, anomalies });
      }
    }

    // Emit for real-time monitoring
    if (this.config.emitEvents) {
      this.emit('entry', entry);

      // Emit high-severity entries separately
      if (entry.severity >= SEVERITY.ERROR) {
        this.emit('high-severity', entry);
      }
    }

    return entry;
  }

  // Convenience methods for common log types

  logAuth(action, actor, result, details = {}) {
    return this.log({
      category: AUDIT_CATEGORIES.AUTH,
      action,
      actor,
      result,
      details,
      severity: result === 'failure' ? SEVERITY.WARNING : SEVERITY.INFO,
    });
  }

  logAccess(action, actor, target, details = {}) {
    return this.log({
      category: AUDIT_CATEGORIES.ACCESS,
      action,
      actor,
      target,
      details,
      severity: SEVERITY.INFO,
    });
  }

  logDataOperation(action, actor, target, details = {}) {
    const category = action.includes('delete') ? AUDIT_CATEGORIES.DATA_DELETE
      : action.includes('write') || action.includes('create') ? AUDIT_CATEGORIES.DATA_WRITE
        : action.includes('export') ? AUDIT_CATEGORIES.DATA_EXPORT
          : AUDIT_CATEGORIES.DATA_READ;

    return this.log({
      category,
      action,
      actor,
      target,
      details,
      severity: action.includes('delete') ? SEVERITY.NOTICE : SEVERITY.INFO,
    });
  }

  logConsent(action, actor, details = {}) {
    return this.log({
      category: AUDIT_CATEGORIES.CONSENT,
      action,
      actor,
      details,
      severity: SEVERITY.NOTICE,
      description: `Consent ${action}: ${details.consentType || 'general'}`,
    });
  }

  logPrivacy(action, details = {}) {
    return this.log({
      category: AUDIT_CATEGORIES.PRIVACY,
      action,
      details,
      severity: SEVERITY.INFO,
    });
  }

  logPIIDetection(details = {}) {
    return this.log({
      category: AUDIT_CATEGORIES.PII_DETECTED,
      action: 'pii_detected',
      details,
      severity: SEVERITY.NOTICE,
      description: `PII detected: ${details.types?.join(', ') || 'unknown types'}`,
    });
  }

  logSecurity(action, severity, details = {}) {
    return this.log({
      category: AUDIT_CATEGORIES.SECURITY,
      action,
      details,
      severity,
    });
  }

  logThreat(threatType, source, details = {}) {
    return this.log({
      category: AUDIT_CATEGORIES.THREAT,
      action: 'threat_detected',
      source,
      details: { threatType, ...details },
      severity: SEVERITY.ALERT,
      description: `Security threat: ${threatType}`,
    });
  }

  logBlocked(reason, source, details = {}) {
    return this.log({
      category: AUDIT_CATEGORIES.BLOCKED,
      action: 'request_blocked',
      source,
      details: { reason, ...details },
      severity: SEVERITY.WARNING,
      description: `Blocked: ${reason}`,
    });
  }

  logAgent(action, agentId, details = {}) {
    return this.log({
      category: AUDIT_CATEGORIES.AGENT,
      action,
      actor: { type: 'agent', id: agentId },
      details,
      severity: SEVERITY.INFO,
    });
  }

  logPolicy(action, policyId, result, details = {}) {
    return this.log({
      category: AUDIT_CATEGORIES.POLICY,
      action,
      details: { policyId, ...details },
      result,
      severity: result === 'violation' ? SEVERITY.WARNING : SEVERITY.INFO,
    });
  }

  logError(error, context = {}) {
    return this.log({
      category: AUDIT_CATEGORIES.ERROR,
      action: 'error',
      details: {
        message: error.message,
        stack: error.stack,
        ...context,
      },
      severity: SEVERITY.ERROR,
      result: 'error',
    });
  }

  // Query methods

  query(filters = {}) {
    return this.store.query(filters);
  }

  getById(id) {
    return this.store.getById(id);
  }

  getRecent(count = 100) {
    const entries = this.store.entries;
    return entries.slice(-count);
  }

  getByCategory(category, limit = 100) {
    return this.query({ category, limit });
  }

  getHighSeverity(since = null) {
    return this.query({ severity: SEVERITY.ERROR, since });
  }

  getAnomalies(since = null) {
    return this.anomalyDetector.getAnomalies(since);
  }

  // Verification and export

  verifyIntegrity() {
    return this.store.verifyChain();
  }

  export(format = 'json') {
    return this.store.export(format);
  }

  getStats() {
    return this.store.getStats();
  }

  // Compliance helpers

  generateComplianceReport(startDate, endDate) {
    const entries = this.query({
      since: startDate,
      until: endDate,
    });

    const report = {
      period: { start: startDate, end: endDate },
      generatedAt: new Date().toISOString(),
      summary: {
        totalEvents: entries.length,
        byCategory: {},
        bySeverity: {},
        consentEvents: 0,
        privacyEvents: 0,
        securityEvents: 0,
        policyViolations: 0,
      },
      integrity: this.verifyIntegrity(),
      anomalies: this.getAnomalies(startDate),
    };

    for (const entry of entries) {
      report.summary.byCategory[entry.category] =
        (report.summary.byCategory[entry.category] || 0) + 1;
      report.summary.bySeverity[entry.severity] =
        (report.summary.bySeverity[entry.severity] || 0) + 1;

      if (entry.category === AUDIT_CATEGORIES.CONSENT) {
        report.summary.consentEvents++;
      }
      if (entry.category === AUDIT_CATEGORIES.PRIVACY ||
          entry.category === AUDIT_CATEGORIES.PII_DETECTED) {
        report.summary.privacyEvents++;
      }
      if (entry.category === AUDIT_CATEGORIES.SECURITY ||
          entry.category === AUDIT_CATEGORIES.THREAT) {
        report.summary.securityEvents++;
      }
      if (entry.category === AUDIT_CATEGORIES.POLICY && entry.result === 'violation') {
        report.summary.policyViolations++;
      }
    }

    return report;
  }
}

module.exports = {
  AuditLogger,
  AuditEntry,
  AuditStore,
  AnomalyDetector,
  AUDIT_CATEGORIES,
  SEVERITY,
};
