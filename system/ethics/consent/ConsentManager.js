/**
 * ConsentManager - User Consent and Opt-In Management
 * "Tech That Listens. Tech That Respects."
 *
 * Manages user consent, data usage agreements, and opt-in/opt-out tracking.
 * Nothing happens without explicit user permission.
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');

// Consent Types - What users can consent to
const CONSENT_TYPES = {
  // Core data usage
  DATA_COLLECTION: {
    id: 'data_collection',
    name: 'Data Collection',
    description: 'Allow collection of interaction data for service improvement',
    required: false,
    defaultValue: false,
  },
  DATA_PROCESSING: {
    id: 'data_processing',
    name: 'Data Processing',
    description: 'Allow processing of data by AI agents',
    required: true, // Required for core functionality
    defaultValue: true,
  },
  DATA_STORAGE: {
    id: 'data_storage',
    name: 'Data Storage',
    description: 'Allow storage of session data',
    required: false,
    defaultValue: false,
  },
  DATA_ANALYTICS: {
    id: 'data_analytics',
    name: 'Analytics',
    description: 'Allow anonymous analytics for service improvement',
    required: false,
    defaultValue: false,
  },

  // AI-specific consent
  AI_TRAINING: {
    id: 'ai_training',
    name: 'AI Training',
    description: 'Allow anonymized data to improve AI models',
    required: false,
    defaultValue: false,
  },
  AI_PERSONALIZATION: {
    id: 'ai_personalization',
    name: 'AI Personalization',
    description: 'Allow AI to personalize responses based on history',
    required: false,
    defaultValue: false,
  },

  // Communication
  EMAIL_MARKETING: {
    id: 'email_marketing',
    name: 'Marketing Emails',
    description: 'Receive marketing and promotional emails',
    required: false,
    defaultValue: false,
  },
  NOTIFICATIONS: {
    id: 'notifications',
    name: 'Notifications',
    description: 'Receive system notifications',
    required: false,
    defaultValue: true,
  },

  // Third party
  THIRD_PARTY_SHARING: {
    id: 'third_party_sharing',
    name: 'Third Party Sharing',
    description: 'Share data with third-party integrations',
    required: false,
    defaultValue: false,
  },

  // Special categories
  SENSITIVE_DATA: {
    id: 'sensitive_data',
    name: 'Sensitive Data Processing',
    description: 'Process sensitive categories of data',
    required: false,
    defaultValue: false,
    sensitive: true,
  },
};

// Consent record structure
class ConsentRecord {
  constructor(userId, type, granted, metadata = {}) {
    this.id = crypto.randomUUID();
    this.userId = userId;
    this.type = type;
    this.granted = granted;
    this.timestamp = new Date().toISOString();
    this.expiresAt = metadata.expiresAt || null;
    this.source = metadata.source || 'user_action';
    this.ipHash = metadata.ipHash || null;
    this.userAgent = metadata.userAgent || null;
    this.version = metadata.version || '1.0';
    this.signature = this._generateSignature();
  }

  _generateSignature() {
    const payload = `${this.userId}:${this.type}:${this.granted}:${this.timestamp}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  isValid() {
    if (this.expiresAt && new Date(this.expiresAt) < new Date()) {
      return false;
    }
    const expectedSig = this._generateSignature();
    return this.signature === expectedSig;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      granted: this.granted,
      timestamp: this.timestamp,
      expiresAt: this.expiresAt,
      source: this.source,
      version: this.version,
      valid: this.isValid(),
    };
  }
}

// Data Usage Agreement
class DataUsageAgreement {
  constructor(options = {}) {
    this.id = crypto.randomUUID();
    this.version = options.version || '1.0.0';
    this.effectiveDate = options.effectiveDate || new Date().toISOString();
    this.purposes = options.purposes || [];
    this.dataTypes = options.dataTypes || [];
    this.retention = options.retention || { period: '30 days', reason: 'service_delivery' };
    this.rights = options.rights || ['access', 'rectification', 'erasure', 'portability'];
    this.thirdParties = options.thirdParties || [];
    this.text = options.text || this._generateAgreementText();
  }

  _generateAgreementText() {
    return `
DATA USAGE AGREEMENT v${this.version}
Effective: ${this.effectiveDate}

PURPOSES:
${this.purposes.map(p => `- ${p}`).join('\n')}

DATA TYPES COLLECTED:
${this.dataTypes.map(d => `- ${d}`).join('\n')}

RETENTION:
Data will be retained for ${this.retention.period} for ${this.retention.reason}.

YOUR RIGHTS:
${this.rights.map(r => `- Right to ${r}`).join('\n')}

THIRD PARTIES:
${this.thirdParties.length ? this.thirdParties.map(t => `- ${t}`).join('\n') : 'No third-party sharing without explicit consent.'}
    `.trim();
  }

  getHash() {
    return crypto.createHash('sha256').update(this.text).digest('hex');
  }
}

/**
 * Main Consent Manager
 */
class ConsentManager extends EventEmitter {
  constructor(options = {}) {
    super();

    // In-memory storage (replace with database in production)
    this.consents = new Map(); // userId -> Map<consentType, ConsentRecord>
    this.agreements = new Map(); // userId -> signed agreements
    this.consentHistory = []; // Audit trail

    this.config = {
      requireExplicitConsent: options.requireExplicitConsent !== false,
      defaultOptOut: options.defaultOptOut !== false,
      consentExpiry: options.consentExpiry || null, // null = never expires
      doubleOptIn: options.doubleOptIn || false,
      minAge: options.minAge || 13,
    };

    this.consentTypes = { ...CONSENT_TYPES, ...options.customConsentTypes };

    // Current data usage agreement
    this.currentAgreement = new DataUsageAgreement(options.agreement || {
      version: '1.0.0',
      purposes: [
        'Provide AI-powered services',
        'Improve service quality',
        'Ensure system security',
      ],
      dataTypes: [
        'Interaction data (anonymized)',
        'Session information',
        'User preferences',
      ],
      retention: { period: '30 days', reason: 'service delivery and improvement' },
    });
  }

  /**
   * Request consent from a user
   */
  async requestConsent(userId, consentTypes = [], metadata = {}) {
    const requests = [];

    for (const type of consentTypes) {
      const consentDef = this.consentTypes[type];
      if (!consentDef) continue;

      requests.push({
        type,
        ...consentDef,
        currentStatus: this.hasConsent(userId, type),
      });
    }

    this.emit('consent-requested', { userId, requests, metadata });

    return {
      userId,
      requests,
      agreement: this.currentAgreement,
      agreementHash: this.currentAgreement.getHash(),
    };
  }

  /**
   * Record user's consent decision
   */
  async grantConsent(userId, consentType, granted, metadata = {}) {
    if (!this.consentTypes[consentType]) {
      throw new Error(`Unknown consent type: ${consentType}`);
    }

    // Create consent record
    const record = new ConsentRecord(userId, consentType, granted, {
      ...metadata,
      expiresAt: this.config.consentExpiry
        ? new Date(Date.now() + this.config.consentExpiry).toISOString()
        : null,
    });

    // Store consent
    if (!this.consents.has(userId)) {
      this.consents.set(userId, new Map());
    }
    this.consents.get(userId).set(consentType, record);

    // Add to history for audit trail
    this.consentHistory.push({
      action: granted ? 'GRANTED' : 'REVOKED',
      ...record.toJSON(),
    });

    this.emit(granted ? 'consent-granted' : 'consent-revoked', {
      userId,
      consentType,
      record: record.toJSON(),
    });

    return record.toJSON();
  }

  /**
   * Grant multiple consents at once
   */
  async grantBulkConsent(userId, consents, metadata = {}) {
    const results = [];

    for (const [type, granted] of Object.entries(consents)) {
      try {
        const result = await this.grantConsent(userId, type, granted, metadata);
        results.push(result);
      } catch (error) {
        results.push({ type, error: error.message });
      }
    }

    return results;
  }

  /**
   * Revoke consent
   */
  async revokeConsent(userId, consentType, metadata = {}) {
    return this.grantConsent(userId, consentType, false, {
      ...metadata,
      source: 'user_revocation',
    });
  }

  /**
   * Revoke all consents for a user
   */
  async revokeAllConsents(userId, metadata = {}) {
    const userConsents = this.consents.get(userId);
    if (!userConsents) return [];

    const results = [];
    for (const type of userConsents.keys()) {
      results.push(await this.revokeConsent(userId, type, metadata));
    }

    this.emit('all-consents-revoked', { userId, results });
    return results;
  }

  /**
   * Check if user has valid consent for a type
   */
  hasConsent(userId, consentType) {
    const userConsents = this.consents.get(userId);
    if (!userConsents) return false;

    const record = userConsents.get(consentType);
    if (!record) return false;

    return record.granted && record.isValid();
  }

  /**
   * Check multiple consents at once
   */
  hasAllConsents(userId, consentTypes) {
    return consentTypes.every(type => this.hasConsent(userId, type));
  }

  /**
   * Check if any of the specified consents are granted
   */
  hasAnyConsent(userId, consentTypes) {
    return consentTypes.some(type => this.hasConsent(userId, type));
  }

  /**
   * Get all consents for a user
   */
  getUserConsents(userId) {
    const userConsents = this.consents.get(userId);
    if (!userConsents) return {};

    const result = {};
    for (const [type, record] of userConsents.entries()) {
      result[type] = record.toJSON();
    }
    return result;
  }

  /**
   * Verify consent before processing
   * Returns: { allowed: boolean, missing: string[], granted: string[] }
   */
  verifyConsent(userId, requiredConsents = []) {
    const missing = [];
    const granted = [];

    for (const type of requiredConsents) {
      if (this.hasConsent(userId, type)) {
        granted.push(type);
      } else {
        missing.push(type);
      }
    }

    const allowed = missing.length === 0;

    if (!allowed) {
      this.emit('consent-verification-failed', { userId, missing, granted });
    }

    return { allowed, missing, granted };
  }

  /**
   * Sign data usage agreement
   */
  async signAgreement(userId, agreementHash, signature, metadata = {}) {
    if (agreementHash !== this.currentAgreement.getHash()) {
      throw new Error('Agreement hash mismatch - agreement may have been updated');
    }

    const signedAgreement = {
      userId,
      agreementId: this.currentAgreement.id,
      agreementVersion: this.currentAgreement.version,
      agreementHash,
      signature,
      signedAt: new Date().toISOString(),
      ipHash: metadata.ipHash || null,
      userAgent: metadata.userAgent || null,
    };

    if (!this.agreements.has(userId)) {
      this.agreements.set(userId, []);
    }
    this.agreements.get(userId).push(signedAgreement);

    this.emit('agreement-signed', signedAgreement);
    return signedAgreement;
  }

  /**
   * Check if user has signed current agreement
   */
  hasSignedCurrentAgreement(userId) {
    const userAgreements = this.agreements.get(userId);
    if (!userAgreements || userAgreements.length === 0) return false;

    const currentHash = this.currentAgreement.getHash();
    return userAgreements.some(a => a.agreementHash === currentHash);
  }

  /**
   * Get consent history for a user (for audit/compliance)
   */
  getConsentHistory(userId) {
    return this.consentHistory.filter(h => h.userId === userId);
  }

  /**
   * Export user data (for data portability rights)
   */
  exportUserData(userId) {
    return {
      consents: this.getUserConsents(userId),
      agreements: this.agreements.get(userId) || [],
      history: this.getConsentHistory(userId),
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Delete all user data (for right to erasure)
   */
  async deleteUserData(userId) {
    this.consents.delete(userId);
    this.agreements.delete(userId);

    // Keep anonymized audit trail for compliance
    this.consentHistory = this.consentHistory.map(h => {
      if (h.userId === userId) {
        return { ...h, userId: '[DELETED]', deletedAt: new Date().toISOString() };
      }
      return h;
    });

    this.emit('user-data-deleted', { userId, deletedAt: new Date().toISOString() });
    return { success: true, userId };
  }

  /**
   * Create consent verification middleware
   */
  createMiddleware(requiredConsents = ['DATA_PROCESSING']) {
    return (req, res, next) => {
      const userId = req.user?.id || req.headers['x-user-id'];

      if (!userId) {
        return res.status(401).json({
          error: 'User identification required for consent verification',
          code: 'USER_ID_REQUIRED',
        });
      }

      const verification = this.verifyConsent(userId, requiredConsents);

      if (!verification.allowed) {
        return res.status(403).json({
          error: 'Required consents not granted',
          code: 'CONSENT_REQUIRED',
          missing: verification.missing,
          consentUrl: '/consent', // Where to grant consent
        });
      }

      req.consentVerification = verification;
      next();
    };
  }

  /**
   * Get available consent types
   */
  getConsentTypes() {
    return Object.entries(this.consentTypes).map(([key, value]) => ({
      key,
      ...value,
    }));
  }

  /**
   * Get current agreement
   */
  getCurrentAgreement() {
    return {
      ...this.currentAgreement,
      hash: this.currentAgreement.getHash(),
    };
  }
}

module.exports = {
  ConsentManager,
  ConsentRecord,
  DataUsageAgreement,
  CONSENT_TYPES,
};
