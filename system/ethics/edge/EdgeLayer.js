/**
 * EdgeLayer (P17) - First Gate Security Filter
 * "Tech That Listens. Tech That Respects."
 *
 * The first and most critical layer of the ethics system.
 * Every request passes through here BEFORE reaching any other system.
 *
 * Responsibilities:
 * 1. Consent verification - Is the user opted in?
 * 2. PII stripping - Remove/anonymize sensitive data
 * 3. Security validation - Block malicious requests
 * 4. Rate limiting - Prevent abuse
 * 5. Request sanitization - Clean inputs
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');
const { PrivacyEngine } = require('../privacy/PrivacyEngine');
const { ConsentManager } = require('../consent/ConsentManager');

// Security threat patterns
const SECURITY_PATTERNS = {
  // Injection attacks
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|TABLE|SET|VALUES|WHERE)\b)|(-{2})|(\\/\\*.*\\*\\/)/gi,
  XSS: /<script[^>]*>[\s\S]*?<\/script>|javascript:|on\w+\s*=/gi,
  COMMAND_INJECTION: /[;&|`$(){}[\]]/g,
  PATH_TRAVERSAL: /\.\.[\/\\]/g,

  // Malicious payloads
  BASE64_ENCODED: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
  UNICODE_EXPLOIT: /[\u0000-\u001F\u007F-\u009F]/g,

  // Excessive data
  OVERSIZED_STRING: (str, max = 10000) => str.length > max,
};

// Request validation rules
const VALIDATION_RULES = {
  MAX_BODY_SIZE: 1024 * 1024, // 1MB
  MAX_STRING_LENGTH: 10000,
  MAX_ARRAY_LENGTH: 1000,
  MAX_OBJECT_DEPTH: 10,
  MAX_FIELD_COUNT: 100,
  ALLOWED_CONTENT_TYPES: [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
  ],
};

// Blocked content categories
const BLOCKED_CONTENT = {
  HARMFUL_INTENT: [
    /how to (make|build|create) (bomb|weapon|explosive)/gi,
    /hack (into|someone's)/gi,
    /steal (identity|credit card|password)/gi,
  ],
  ILLEGAL_ACTIVITY: [
    /buy (drugs|weapons) online/gi,
    /hire (hitman|assassin)/gi,
  ],
  EXPLOITATION: [
    /child (abuse|exploitation|pornography)/gi,
    /human trafficking/gi,
  ],
};

/**
 * Security Scanner - Detects malicious patterns
 */
class SecurityScanner {
  constructor(options = {}) {
    this.patterns = { ...SECURITY_PATTERNS };
    this.strictMode = options.strictMode || false;
    this.customPatterns = options.customPatterns || [];
  }

  /**
   * Scan for security threats
   */
  scan(data) {
    const threats = [];

    const scanValue = (value, path = '') => {
      if (typeof value === 'string') {
        // Check for SQL injection
        if (this.patterns.SQL_INJECTION.test(value)) {
          threats.push({ type: 'SQL_INJECTION', path, severity: 'CRITICAL' });
        }

        // Check for XSS
        if (this.patterns.XSS.test(value)) {
          threats.push({ type: 'XSS', path, severity: 'HIGH' });
        }

        // Check for command injection
        if (this.strictMode && this.patterns.COMMAND_INJECTION.test(value)) {
          threats.push({ type: 'COMMAND_INJECTION', path, severity: 'HIGH' });
        }

        // Check for path traversal
        if (this.patterns.PATH_TRAVERSAL.test(value)) {
          threats.push({ type: 'PATH_TRAVERSAL', path, severity: 'HIGH' });
        }

        // Check for oversized strings
        if (this.patterns.OVERSIZED_STRING(value)) {
          threats.push({ type: 'OVERSIZED_STRING', path, severity: 'MEDIUM' });
        }

        // Check custom patterns
        for (const { pattern, type, severity } of this.customPatterns) {
          if (pattern.test(value)) {
            threats.push({ type, path, severity });
          }
        }
      } else if (Array.isArray(value)) {
        value.forEach((item, i) => scanValue(item, `${path}[${i}]`));
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, val]) => {
          scanValue(val, path ? `${path}.${key}` : key);
        });
      }
    };

    scanValue(data);

    return {
      safe: threats.length === 0,
      threats,
      highestSeverity: threats.reduce((max, t) => {
        if (t.severity === 'CRITICAL') return 'CRITICAL';
        if (t.severity === 'HIGH' && max !== 'CRITICAL') return 'HIGH';
        if (t.severity === 'MEDIUM' && !['CRITICAL', 'HIGH'].includes(max)) return 'MEDIUM';
        return max;
      }, 'NONE'),
    };
  }

  /**
   * Sanitize input by removing/escaping dangerous content
   */
  sanitize(data) {
    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        // Remove/escape dangerous patterns
        let clean = value
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .replace(/\.\.\//g, '')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

        // Truncate if too long
        if (clean.length > VALIDATION_RULES.MAX_STRING_LENGTH) {
          clean = clean.substring(0, VALIDATION_RULES.MAX_STRING_LENGTH);
        }

        return clean;
      } else if (Array.isArray(value)) {
        return value.slice(0, VALIDATION_RULES.MAX_ARRAY_LENGTH).map(sanitizeValue);
      } else if (value && typeof value === 'object') {
        const result = {};
        const entries = Object.entries(value).slice(0, VALIDATION_RULES.MAX_FIELD_COUNT);
        for (const [key, val] of entries) {
          result[key] = sanitizeValue(val);
        }
        return result;
      }
      return value;
    };

    return sanitizeValue(data);
  }
}

/**
 * Content Filter - Blocks harmful content categories
 */
class ContentFilter {
  constructor(options = {}) {
    this.blockedPatterns = { ...BLOCKED_CONTENT, ...options.customBlocked };
    this.enabled = options.enabled !== false;
  }

  /**
   * Check content against blocked categories
   */
  check(content) {
    if (!this.enabled || typeof content !== 'string') {
      return { allowed: true, blockedCategories: [] };
    }

    const blockedCategories = [];

    for (const [category, patterns] of Object.entries(this.blockedPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          blockedCategories.push(category);
          break;
        }
      }
    }

    return {
      allowed: blockedCategories.length === 0,
      blockedCategories,
    };
  }

  /**
   * Deep check an object
   */
  checkObject(obj) {
    const blockedCategories = new Set();

    const check = (value) => {
      if (typeof value === 'string') {
        const result = this.check(value);
        result.blockedCategories.forEach(c => blockedCategories.add(c));
      } else if (Array.isArray(value)) {
        value.forEach(check);
      } else if (value && typeof value === 'object') {
        Object.values(value).forEach(check);
      }
    };

    check(obj);

    return {
      allowed: blockedCategories.size === 0,
      blockedCategories: Array.from(blockedCategories),
    };
  }
}

/**
 * Rate Limiter - Prevents abuse
 */
class RateLimiter {
  constructor(options = {}) {
    this.limits = {
      perSecond: options.perSecond || 10,
      perMinute: options.perMinute || 100,
      perHour: options.perHour || 1000,
    };
    this.windows = new Map(); // key -> { second: [], minute: [], hour: [] }
    this.blocked = new Map(); // key -> unblockTime
  }

  /**
   * Check if request is allowed
   */
  check(key) {
    const now = Date.now();

    // Check if blocked
    const unblockTime = this.blocked.get(key);
    if (unblockTime && now < unblockTime) {
      return {
        allowed: false,
        reason: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((unblockTime - now) / 1000),
      };
    }

    // Initialize windows if needed
    if (!this.windows.has(key)) {
      this.windows.set(key, { second: [], minute: [], hour: [] });
    }

    const windows = this.windows.get(key);

    // Clean old entries
    windows.second = windows.second.filter(t => now - t < 1000);
    windows.minute = windows.minute.filter(t => now - t < 60000);
    windows.hour = windows.hour.filter(t => now - t < 3600000);

    // Check limits
    if (windows.second.length >= this.limits.perSecond) {
      return { allowed: false, reason: 'RATE_LIMIT_SECOND', retryAfter: 1 };
    }
    if (windows.minute.length >= this.limits.perMinute) {
      return { allowed: false, reason: 'RATE_LIMIT_MINUTE', retryAfter: 60 };
    }
    if (windows.hour.length >= this.limits.perHour) {
      return { allowed: false, reason: 'RATE_LIMIT_HOUR', retryAfter: 3600 };
    }

    // Record this request
    windows.second.push(now);
    windows.minute.push(now);
    windows.hour.push(now);

    return { allowed: true };
  }

  /**
   * Block a key for specified duration
   */
  block(key, durationMs = 60000) {
    this.blocked.set(key, Date.now() + durationMs);
  }

  /**
   * Unblock a key
   */
  unblock(key) {
    this.blocked.delete(key);
  }
}

/**
 * EdgeLayer - Main orchestrator for edge security
 */
class EdgeLayer extends EventEmitter {
  constructor(options = {}) {
    super();

    // Initialize components
    this.privacyEngine = options.privacyEngine || new PrivacyEngine({
      autoAnonymize: true,
      blockCriticalPII: true,
      strictMode: options.strictMode,
    });

    this.consentManager = options.consentManager || new ConsentManager({
      requireExplicitConsent: true,
      defaultOptOut: true,
    });

    this.securityScanner = new SecurityScanner({
      strictMode: options.strictMode,
    });

    this.contentFilter = new ContentFilter({
      enabled: options.contentFilterEnabled !== false,
    });

    this.rateLimiter = new RateLimiter(options.rateLimits);

    // Configuration
    this.config = {
      enabled: options.enabled !== false,
      strictMode: options.strictMode || false,
      requiredConsents: options.requiredConsents || ['DATA_PROCESSING'],
      bypassPaths: options.bypassPaths || ['/health', '/status', '/consent'],
      logAllRequests: options.logAllRequests || false,
    };

    // Statistics
    this.stats = {
      processed: 0,
      allowed: 0,
      blocked: 0,
      anonymized: 0,
      securityThreats: 0,
      rateLimited: 0,
      consentDenied: 0,
    };
  }

  /**
   * Process a request through the edge layer
   * This is the main entry point for ALL requests
   */
  async process(request, context = {}) {
    if (!this.config.enabled) {
      return { allowed: true, request, report: { action: 'BYPASSED' } };
    }

    this.stats.processed++;
    const startTime = Date.now();
    const report = {
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      checks: [],
    };

    // Check if path is bypassed
    if (context.path && this.config.bypassPaths.some(p => context.path.startsWith(p))) {
      return { allowed: true, request, report: { ...report, action: 'BYPASS_PATH' } };
    }

    // GATE 1: Rate Limiting
    const rateLimitKey = context.ip || context.userId || 'anonymous';
    const rateCheck = this.rateLimiter.check(rateLimitKey);
    report.checks.push({ gate: 'RATE_LIMIT', result: rateCheck });

    if (!rateCheck.allowed) {
      this.stats.blocked++;
      this.stats.rateLimited++;
      this.emit('rate-limited', { key: rateLimitKey, ...rateCheck });

      return {
        allowed: false,
        request: null,
        report: {
          ...report,
          action: 'RATE_LIMITED',
          reason: rateCheck.reason,
          retryAfter: rateCheck.retryAfter,
        },
      };
    }

    // GATE 2: Security Scan
    const securityScan = this.securityScanner.scan(request);
    report.checks.push({ gate: 'SECURITY_SCAN', result: { safe: securityScan.safe, severity: securityScan.highestSeverity } });

    if (!securityScan.safe) {
      this.stats.blocked++;
      this.stats.securityThreats++;

      // Block the IP if critical threat detected
      if (securityScan.highestSeverity === 'CRITICAL') {
        this.rateLimiter.block(rateLimitKey, 3600000); // 1 hour block
      }

      this.emit('security-threat', { threats: securityScan.threats, context });

      return {
        allowed: false,
        request: null,
        report: {
          ...report,
          action: 'SECURITY_BLOCKED',
          threats: securityScan.threats,
          severity: securityScan.highestSeverity,
        },
      };
    }

    // GATE 3: Content Filter
    const contentCheck = typeof request === 'object'
      ? this.contentFilter.checkObject(request)
      : this.contentFilter.check(request);
    report.checks.push({ gate: 'CONTENT_FILTER', result: contentCheck });

    if (!contentCheck.allowed) {
      this.stats.blocked++;
      this.emit('content-blocked', { categories: contentCheck.blockedCategories, context });

      return {
        allowed: false,
        request: null,
        report: {
          ...report,
          action: 'CONTENT_BLOCKED',
          blockedCategories: contentCheck.blockedCategories,
        },
      };
    }

    // GATE 4: Consent Verification (if user identified)
    if (context.userId) {
      const consentCheck = this.consentManager.verifyConsent(
        context.userId,
        this.config.requiredConsents
      );
      report.checks.push({ gate: 'CONSENT', result: consentCheck });

      if (!consentCheck.allowed) {
        this.stats.blocked++;
        this.stats.consentDenied++;
        this.emit('consent-denied', { userId: context.userId, missing: consentCheck.missing });

        return {
          allowed: false,
          request: null,
          report: {
            ...report,
            action: 'CONSENT_REQUIRED',
            missingConsents: consentCheck.missing,
          },
        };
      }
    }

    // GATE 5: Privacy Processing (PII detection & anonymization)
    const privacyResult = await this.privacyEngine.process(request, context);
    report.checks.push({ gate: 'PRIVACY', result: { action: privacyResult.report.action, risk: privacyResult.report.riskLevel } });

    if (!privacyResult.allowed) {
      this.stats.blocked++;
      return {
        allowed: false,
        request: null,
        report: {
          ...report,
          action: 'PRIVACY_BLOCKED',
          ...privacyResult.report,
        },
      };
    }

    if (privacyResult.report.action === 'ANONYMIZED') {
      this.stats.anonymized++;
    }

    // GATE 6: Sanitization (final cleanup)
    const sanitizedRequest = this.securityScanner.sanitize(privacyResult.data);

    // All gates passed
    this.stats.allowed++;
    const processingTime = Date.now() - startTime;

    this.emit('request-processed', {
      requestId: report.requestId,
      processingTime,
      action: 'ALLOWED',
    });

    return {
      allowed: true,
      request: sanitizedRequest,
      report: {
        ...report,
        action: 'ALLOWED',
        processingTime,
        anonymized: privacyResult.report.action === 'ANONYMIZED',
      },
    };
  }

  /**
   * Create Express middleware
   */
  createMiddleware() {
    return async (req, res, next) => {
      try {
        const context = {
          path: req.path,
          method: req.method,
          ip: req.ip || req.connection?.remoteAddress,
          userId: req.user?.id || req.headers['x-user-id'],
          userAgent: req.headers['user-agent'],
        };

        // Process body
        const bodyResult = await this.process(req.body || {}, context);

        if (!bodyResult.allowed) {
          const statusCode = bodyResult.report.action === 'RATE_LIMITED' ? 429
            : bodyResult.report.action === 'CONSENT_REQUIRED' ? 403
              : 400;

          return res.status(statusCode).json({
            error: 'Request blocked by security filter',
            code: bodyResult.report.action,
            ...bodyResult.report,
          });
        }

        // Process query params
        const queryResult = await this.process(req.query || {}, { ...context, type: 'query' });
        if (!queryResult.allowed) {
          return res.status(400).json({
            error: 'Query parameters blocked',
            code: queryResult.report.action,
          });
        }

        // Attach processed data
        req.body = bodyResult.request;
        req.query = queryResult.request;
        req.edgeReport = bodyResult.report;

        next();
      } catch (error) {
        this.emit('error', error);
        next(error);
      }
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    const total = this.stats.processed;
    return {
      ...this.stats,
      allowRate: total > 0 ? ((this.stats.allowed / total) * 100).toFixed(2) + '%' : '0%',
      blockRate: total > 0 ? ((this.stats.blocked / total) * 100).toFixed(2) + '%' : '0%',
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      processed: 0,
      allowed: 0,
      blocked: 0,
      anonymized: 0,
      securityThreats: 0,
      rateLimited: 0,
      consentDenied: 0,
    };
  }
}

module.exports = {
  EdgeLayer,
  SecurityScanner,
  ContentFilter,
  RateLimiter,
  SECURITY_PATTERNS,
  VALIDATION_RULES,
  BLOCKED_CONTENT,
};
