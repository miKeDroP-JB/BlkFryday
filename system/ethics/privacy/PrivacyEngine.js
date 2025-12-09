/**
 * PrivacyEngine - PII Detection and Data Anonymization
 * "Tech That Listens. Tech That Respects."
 *
 * Core privacy layer that detects, masks, and anonymizes sensitive data
 * before it enters the system. Zero-knowledge by default.
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');

// PII Detection Patterns - Comprehensive regex patterns for sensitive data
const PII_PATTERNS = {
  // Identity
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  PHONE_US: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
  PHONE_INTL: /\b\+?[0-9]{1,4}[-.\s]?\(?[0-9]{1,4}\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}\b/g,
  SSN: /\b(?!000|666|9\d{2})\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}\b/g,

  // Financial
  CREDIT_CARD: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
  BANK_ACCOUNT: /\b[0-9]{8,17}\b/g, // Very broad - use with context
  ROUTING_NUMBER: /\b(?:0[0-9]|1[0-2]|2[1-9]|3[0-2]|6[1-9]|7[0-2]|8[0-9])[0-9]{7}\b/g,

  // Personal
  DATE_OF_BIRTH: /\b(?:0?[1-9]|1[0-2])[-\/](?:0?[1-9]|[12][0-9]|3[01])[-\/](?:19|20)\d{2}\b/g,
  PASSPORT: /\b[A-Z]{1,2}[0-9]{6,9}\b/gi,
  DRIVERS_LICENSE: /\b[A-Z]{1,2}[0-9]{5,8}\b/gi,

  // Network/Digital
  IP_ADDRESS: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  IPV6: /\b(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}\b/gi,
  MAC_ADDRESS: /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/g,

  // Medical
  MEDICAL_RECORD: /\b[A-Z]{2,3}[-]?[0-9]{6,10}\b/gi,

  // Names (contextual - requires NLP for accuracy)
  NAME_PATTERN: /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,

  // Address patterns
  US_ZIP: /\b[0-9]{5}(?:-[0-9]{4})?\b/g,
  STREET_ADDRESS: /\b\d+\s+[A-Za-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)\b/gi,
};

// Risk levels for different PII types
const PII_RISK_LEVELS = {
  SSN: 'CRITICAL',
  CREDIT_CARD: 'CRITICAL',
  BANK_ACCOUNT: 'HIGH',
  PASSPORT: 'HIGH',
  EMAIL: 'MEDIUM',
  PHONE_US: 'MEDIUM',
  PHONE_INTL: 'MEDIUM',
  IP_ADDRESS: 'LOW',
  US_ZIP: 'LOW',
};

class PIIDetector {
  constructor(options = {}) {
    this.patterns = { ...PII_PATTERNS, ...options.customPatterns };
    this.enabledTypes = options.enabledTypes || Object.keys(PII_PATTERNS);
    this.contextAnalysis = options.contextAnalysis !== false;
  }

  /**
   * Scan text for PII and return findings
   */
  scan(text) {
    if (!text || typeof text !== 'string') {
      return { hasPII: false, findings: [], riskLevel: 'NONE' };
    }

    const findings = [];
    let maxRisk = 'NONE';

    for (const [type, pattern] of Object.entries(this.patterns)) {
      if (!this.enabledTypes.includes(type)) continue;

      const matches = text.match(pattern);
      if (matches) {
        const risk = PII_RISK_LEVELS[type] || 'MEDIUM';
        findings.push({
          type,
          count: matches.length,
          risk,
          positions: this._findPositions(text, pattern),
        });

        // Track highest risk
        if (risk === 'CRITICAL') maxRisk = 'CRITICAL';
        else if (risk === 'HIGH' && maxRisk !== 'CRITICAL') maxRisk = 'HIGH';
        else if (risk === 'MEDIUM' && !['CRITICAL', 'HIGH'].includes(maxRisk)) maxRisk = 'MEDIUM';
        else if (risk === 'LOW' && maxRisk === 'NONE') maxRisk = 'LOW';
      }
    }

    return {
      hasPII: findings.length > 0,
      findings,
      riskLevel: maxRisk,
      scannedAt: new Date().toISOString(),
    };
  }

  /**
   * Deep scan an object recursively
   */
  scanObject(obj, path = '') {
    const results = [];

    const scan = (value, currentPath) => {
      if (typeof value === 'string') {
        const scanResult = this.scan(value);
        if (scanResult.hasPII) {
          results.push({
            path: currentPath,
            ...scanResult,
          });
        }
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => scan(item, `${currentPath}[${index}]`));
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, val]) => {
          scan(val, currentPath ? `${currentPath}.${key}` : key);
        });
      }
    };

    scan(obj, path);

    return {
      hasPII: results.length > 0,
      results,
      highestRisk: results.reduce((max, r) => {
        if (r.riskLevel === 'CRITICAL') return 'CRITICAL';
        if (r.riskLevel === 'HIGH' && max !== 'CRITICAL') return 'HIGH';
        if (r.riskLevel === 'MEDIUM' && !['CRITICAL', 'HIGH'].includes(max)) return 'MEDIUM';
        if (r.riskLevel === 'LOW' && max === 'NONE') return 'LOW';
        return max;
      }, 'NONE'),
    };
  }

  _findPositions(text, pattern) {
    const positions = [];
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      positions.push({
        start: match.index,
        end: match.index + match[0].length,
        preview: '***REDACTED***',
      });
    }
    return positions;
  }
}

class DataAnonymizer {
  constructor(options = {}) {
    this.salt = options.salt || crypto.randomBytes(32).toString('hex');
    this.preserveFormat = options.preserveFormat !== false;
    this.consistentHashing = options.consistentHashing !== false;
    this.hashCache = new Map(); // For consistent anonymization
  }

  /**
   * Anonymize a string value
   */
  anonymize(value, type = 'GENERIC') {
    if (!value) return value;

    // Use consistent hashing for same inputs
    if (this.consistentHashing) {
      const cacheKey = `${type}:${value}`;
      if (this.hashCache.has(cacheKey)) {
        return this.hashCache.get(cacheKey);
      }
    }

    let anonymized;
    switch (type) {
      case 'EMAIL':
        anonymized = this._anonymizeEmail(value);
        break;
      case 'PHONE_US':
      case 'PHONE_INTL':
        anonymized = this._anonymizePhone(value);
        break;
      case 'SSN':
        anonymized = this._anonymizeSSN(value);
        break;
      case 'CREDIT_CARD':
        anonymized = this._anonymizeCreditCard(value);
        break;
      case 'IP_ADDRESS':
        anonymized = this._anonymizeIP(value);
        break;
      case 'NAME_PATTERN':
        anonymized = this._anonymizeName(value);
        break;
      default:
        anonymized = this._genericAnonymize(value);
    }

    if (this.consistentHashing) {
      this.hashCache.set(`${type}:${value}`, anonymized);
    }

    return anonymized;
  }

  /**
   * Strip all PII from text, replacing with placeholders
   */
  stripPII(text, detector) {
    if (!text || typeof text !== 'string') return text;

    let result = text;
    const replacements = [];

    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
      result = result.replace(pattern, (match) => {
        const anonymized = this.anonymize(match, type);
        replacements.push({ original: '***LOGGED_SEPARATELY***', anonymized, type });
        return anonymized;
      });
    }

    return { text: result, replacements };
  }

  /**
   * Anonymize an entire object, preserving structure
   */
  anonymizeObject(obj, detector) {
    const anonymize = (value, key = '') => {
      if (typeof value === 'string') {
        const { text } = this.stripPII(value, detector);
        return text;
      } else if (Array.isArray(value)) {
        return value.map((item, i) => anonymize(item, `${key}[${i}]`));
      } else if (value && typeof value === 'object') {
        const result = {};
        for (const [k, v] of Object.entries(value)) {
          result[k] = anonymize(v, k);
        }
        return result;
      }
      return value;
    };

    return anonymize(obj);
  }

  _hash(value) {
    return crypto.createHmac('sha256', this.salt)
      .update(value)
      .digest('hex')
      .substring(0, 8);
  }

  _anonymizeEmail(email) {
    const [local, domain] = email.split('@');
    const hash = this._hash(email);
    return `user_${hash}@anonymized.local`;
  }

  _anonymizePhone(phone) {
    const hash = this._hash(phone);
    return `+1-XXX-XXX-${hash.substring(0, 4).toUpperCase()}`;
  }

  _anonymizeSSN(ssn) {
    return 'XXX-XX-XXXX';
  }

  _anonymizeCreditCard(cc) {
    const last4 = cc.replace(/\D/g, '').slice(-4);
    return `XXXX-XXXX-XXXX-${last4}`;
  }

  _anonymizeIP(ip) {
    const hash = this._hash(ip);
    return `10.0.${parseInt(hash.substring(0, 2), 16) % 256}.${parseInt(hash.substring(2, 4), 16) % 256}`;
  }

  _anonymizeName(name) {
    const hash = this._hash(name);
    return `User_${hash.toUpperCase()}`;
  }

  _genericAnonymize(value) {
    const hash = this._hash(value);
    return `[ANON:${hash}]`;
  }

  /**
   * Clear hash cache (for privacy - prevents correlation attacks)
   */
  clearCache() {
    this.hashCache.clear();
  }
}

class DataMinimizer {
  constructor(options = {}) {
    this.allowedFields = options.allowedFields || [];
    this.blockedFields = options.blockedFields || [
      'password', 'secret', 'token', 'key', 'apiKey', 'api_key',
      'ssn', 'creditCard', 'credit_card', 'bankAccount', 'bank_account',
      'privateKey', 'private_key', 'accessToken', 'access_token',
    ];
    this.maxDepth = options.maxDepth || 10;
  }

  /**
   * Minimize data to only what's needed
   */
  minimize(obj, allowedFields = this.allowedFields) {
    if (allowedFields.length === 0) {
      // If no whitelist, just block sensitive fields
      return this.blockSensitive(obj);
    }

    const result = {};
    for (const field of allowedFields) {
      if (field in obj) {
        result[field] = obj[field];
      }
    }
    return this.blockSensitive(result);
  }

  /**
   * Block known sensitive fields
   */
  blockSensitive(obj, depth = 0) {
    if (depth > this.maxDepth) return '[MAX_DEPTH_EXCEEDED]';
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => this.blockSensitive(item, depth + 1));
    }

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (this.blockedFields.some(blocked => lowerKey.includes(blocked.toLowerCase()))) {
        result[key] = '[BLOCKED]';
      } else if (value && typeof value === 'object') {
        result[key] = this.blockSensitive(value, depth + 1);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}

/**
 * Main Privacy Engine - Orchestrates all privacy operations
 */
class PrivacyEngine extends EventEmitter {
  constructor(options = {}) {
    super();

    this.detector = new PIIDetector(options.detector);
    this.anonymizer = new DataAnonymizer(options.anonymizer);
    this.minimizer = new DataMinimizer(options.minimizer);

    this.config = {
      autoAnonymize: options.autoAnonymize !== false,
      blockCriticalPII: options.blockCriticalPII !== false,
      logDetections: options.logDetections !== false,
      strictMode: options.strictMode || false,
    };

    this.stats = {
      scanned: 0,
      piiDetected: 0,
      blocked: 0,
      anonymized: 0,
    };
  }

  /**
   * Process incoming data through privacy pipeline
   * Returns: { allowed: boolean, data: processed_data, report: privacy_report }
   */
  async process(data, context = {}) {
    this.stats.scanned++;
    const startTime = Date.now();

    // Step 1: Detect PII
    const detection = typeof data === 'string'
      ? this.detector.scan(data)
      : this.detector.scanObject(data);

    if (detection.hasPII) {
      this.stats.piiDetected++;
      this.emit('pii-detected', { detection, context });

      // Step 2: Block if critical PII and strict mode
      if (this.config.blockCriticalPII &&
          ['CRITICAL', 'HIGH'].includes(detection.highestRisk || detection.riskLevel)) {
        if (this.config.strictMode) {
          this.stats.blocked++;
          this.emit('data-blocked', { reason: 'critical-pii', detection, context });

          return {
            allowed: false,
            data: null,
            report: {
              action: 'BLOCKED',
              reason: 'Critical PII detected',
              riskLevel: detection.highestRisk || detection.riskLevel,
              processingTime: Date.now() - startTime,
            },
          };
        }
      }

      // Step 3: Anonymize if auto-anonymize enabled
      if (this.config.autoAnonymize) {
        this.stats.anonymized++;
        const anonymizedData = typeof data === 'string'
          ? this.anonymizer.stripPII(data, this.detector).text
          : this.anonymizer.anonymizeObject(data, this.detector);

        this.emit('data-anonymized', { original: '[LOGGED_SEPARATELY]', anonymized: anonymizedData, context });

        return {
          allowed: true,
          data: anonymizedData,
          report: {
            action: 'ANONYMIZED',
            piiFound: detection.findings || detection.results,
            riskLevel: detection.highestRisk || detection.riskLevel,
            processingTime: Date.now() - startTime,
          },
        };
      }
    }

    // No PII or processing not needed
    return {
      allowed: true,
      data: this.minimizer.blockSensitive(data),
      report: {
        action: detection.hasPII ? 'PASSED_WITH_PII' : 'CLEAN',
        riskLevel: detection.highestRisk || detection.riskLevel || 'NONE',
        processingTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Quick check if data contains PII (no processing)
   */
  hasPII(data) {
    const detection = typeof data === 'string'
      ? this.detector.scan(data)
      : this.detector.scanObject(data);
    return detection.hasPII;
  }

  /**
   * Get privacy statistics
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.scanned > 0
        ? (this.stats.piiDetected / this.stats.scanned * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = { scanned: 0, piiDetected: 0, blocked: 0, anonymized: 0 };
  }

  /**
   * Create a request sanitizer middleware
   */
  createMiddleware() {
    return async (req, res, next) => {
      try {
        // Process body
        if (req.body) {
          const result = await this.process(req.body, {
            path: req.path,
            method: req.method,
            ip: req.ip,
          });

          if (!result.allowed) {
            return res.status(400).json({
              error: 'Request blocked due to sensitive data',
              code: 'PII_BLOCKED',
            });
          }

          req.body = result.data;
          req.privacyReport = result.report;
        }

        // Process query params
        if (req.query && Object.keys(req.query).length > 0) {
          const queryResult = await this.process(req.query, {
            path: req.path,
            type: 'query',
          });
          req.query = queryResult.data;
        }

        next();
      } catch (error) {
        this.emit('error', error);
        next(error);
      }
    };
  }
}

// Export classes
module.exports = {
  PrivacyEngine,
  PIIDetector,
  DataAnonymizer,
  DataMinimizer,
  PII_PATTERNS,
  PII_RISK_LEVELS,
};
