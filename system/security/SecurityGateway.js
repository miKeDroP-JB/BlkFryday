// ============================================================
//  ORBOS V11.5 - SECURITY GATEWAY
//  The first filter - Human-controlled security layer
// ============================================================
//
//  "No request goes out without passing through ORBOS first"
//  All AI provider requests are filtered, logged, and secured
//
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityGateway {
  constructor(config = {}) {
    this.config = config;
    this.logsDir = config.logsDir || path.join(__dirname, '../../data/security-logs');
    this.knowledgeDir = config.knowledgeDir || path.join(__dirname, '../../data/knowledge');
    this.ensureDirectories();

    // Security levels
    this.securityLevels = {
      OPEN: 0,        // No restrictions (internal only)
      STANDARD: 1,    // Basic filtering
      ELEVATED: 2,    // Enhanced scrutiny
      RESTRICTED: 3,  // Strict limitations
      LOCKDOWN: 4     // Emergency - block all
    };

    this.currentLevel = this.securityLevels.STANDARD;

    // Request patterns to block
    this.blockedPatterns = [
      /password.*steal/i,
      /hack.*into/i,
      /malware.*create/i,
      /exploit.*vulnerability/i,
      /bypass.*security/i,
      /ddos.*attack/i,
      /phishing.*email/i,
      /credit.*card.*number/i,
      /social.*security.*number/i,
      /illegal.*content/i
    ];

    // Sensitive data patterns to redact
    this.sensitivePatterns = [
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
      { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
      { pattern: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, replacement: '[SSN_REDACTED]' },
      { pattern: /\b\d{16}\b/g, replacement: '[CARD_REDACTED]' },
      { pattern: /\b(sk-|pk-)[a-zA-Z0-9]{32,}\b/g, replacement: '[API_KEY_REDACTED]' }
    ];

    // Approved users/sessions
    this.authorizedSessions = new Map();

    // Request history for analysis
    this.requestHistory = [];
    this.maxHistorySize = 10000;

    // Rate limiting
    this.rateLimits = new Map();
    this.rateWindow = 60000; // 1 minute
    this.maxRequestsPerWindow = 100;
  }

  ensureDirectories() {
    [this.logsDir, this.knowledgeDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // ============================================================
  //  AUTHENTICATION & AUTHORIZATION
  // ============================================================

  async authenticate(credentials) {
    const { voiceprint, phrase, userId } = credentials;

    // Voice authentication check
    if (voiceprint && phrase) {
      const isValid = await this.validateVoiceAuth(voiceprint, phrase);
      if (!isValid) {
        this.logSecurityEvent('AUTH_FAILED', { userId, reason: 'voice_mismatch' });
        return { success: false, error: 'Voice authentication failed' };
      }
    }

    // Create session token
    const sessionToken = this.generateSessionToken();
    const session = {
      userId: userId || 'anonymous',
      token: sessionToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      permissions: this.getDefaultPermissions(),
      requests: 0
    };

    this.authorizedSessions.set(sessionToken, session);
    this.logSecurityEvent('AUTH_SUCCESS', { userId: session.userId });

    return { success: true, token: sessionToken, expiresAt: session.expiresAt };
  }

  validateSession(token) {
    const session = this.authorizedSessions.get(token);
    if (!session) return { valid: false, error: 'Invalid session' };
    if (Date.now() > session.expiresAt) {
      this.authorizedSessions.delete(token);
      return { valid: false, error: 'Session expired' };
    }
    return { valid: true, session };
  }

  async validateVoiceAuth(voiceprint, phrase) {
    // Expected phrase: "The pleasure is all mine"
    const expectedPhrase = "the pleasure is all mine";
    const normalizedPhrase = phrase.toLowerCase().trim();

    // Allow some flexibility in matching
    const similarity = this.calculateSimilarity(normalizedPhrase, expectedPhrase);
    return similarity > 0.8;
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const costs = [];
    for (let i = 0; i <= longer.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= shorter.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (longer[i - 1] !== shorter[j - 1]) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[shorter.length] = lastValue;
    }

    return (longer.length - costs[shorter.length]) / longer.length;
  }

  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  getDefaultPermissions() {
    return {
      canQuery: true,
      canTrain: false,
      canAccessRaw: false,
      canModifyConfig: false,
      maxConcurrentRequests: 10,
      allowedProviders: ['*'],
      blockedProviders: []
    };
  }

  // ============================================================
  //  REQUEST FILTERING
  // ============================================================

  async filterRequest(request, sessionToken) {
    const { prompt, provider, options } = request;

    // 1. Validate session
    const sessionCheck = this.validateSession(sessionToken);
    if (!sessionCheck.valid) {
      return { blocked: true, reason: sessionCheck.error };
    }

    // 2. Check security level
    if (this.currentLevel === this.securityLevels.LOCKDOWN) {
      return { blocked: true, reason: 'System in lockdown mode' };
    }

    // 3. Rate limiting
    const rateCheck = this.checkRateLimit(sessionToken);
    if (!rateCheck.allowed) {
      return { blocked: true, reason: 'Rate limit exceeded', retryAfter: rateCheck.retryAfter };
    }

    // 4. Check for blocked patterns
    const patternCheck = this.checkBlockedPatterns(prompt);
    if (patternCheck.blocked) {
      this.logSecurityEvent('BLOCKED_PATTERN', {
        sessionToken,
        pattern: patternCheck.pattern,
        preview: prompt.slice(0, 100)
      });
      return { blocked: true, reason: 'Request contains prohibited content' };
    }

    // 5. Redact sensitive data
    const sanitizedPrompt = this.redactSensitiveData(prompt);

    // 6. Check provider permissions
    const session = sessionCheck.session;
    if (session.permissions.blockedProviders.includes(provider)) {
      return { blocked: true, reason: 'Provider not authorized for this session' };
    }

    // 7. Add ORBOS context injection (our values/guidelines)
    const enhancedPrompt = this.injectOrbosContext(sanitizedPrompt);

    // 8. Log the request
    this.logRequest({
      sessionToken,
      provider,
      originalLength: prompt.length,
      sanitizedLength: sanitizedPrompt.length,
      timestamp: Date.now()
    });

    return {
      blocked: false,
      sanitizedPrompt: enhancedPrompt,
      metadata: {
        requestId: crypto.randomUUID(),
        processedAt: Date.now(),
        securityLevel: this.currentLevel
      }
    };
  }

  checkBlockedPatterns(text) {
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(text)) {
        return { blocked: true, pattern: pattern.toString() };
      }
    }
    return { blocked: false };
  }

  redactSensitiveData(text) {
    let result = text;
    for (const { pattern, replacement } of this.sensitivePatterns) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  injectOrbosContext(prompt) {
    // Add ORBOS guidelines without changing user intent
    const orbosContext = `[ORBOS CONTEXT: Respond helpfully while maintaining ethical standards. Avoid harmful, illegal, or deceptive content. Prioritize accuracy and user safety.]\n\n`;
    return orbosContext + prompt;
  }

  checkRateLimit(sessionToken) {
    const now = Date.now();
    const windowStart = now - this.rateWindow;

    // Get or create rate limit entry
    let rateData = this.rateLimits.get(sessionToken);
    if (!rateData) {
      rateData = { requests: [], blocked: false };
      this.rateLimits.set(sessionToken, rateData);
    }

    // Clean old requests
    rateData.requests = rateData.requests.filter(t => t > windowStart);

    // Check limit
    if (rateData.requests.length >= this.maxRequestsPerWindow) {
      const oldestInWindow = Math.min(...rateData.requests);
      return {
        allowed: false,
        retryAfter: oldestInWindow + this.rateWindow - now
      };
    }

    // Add current request
    rateData.requests.push(now);
    return { allowed: true };
  }

  // ============================================================
  //  RESPONSE FILTERING
  // ============================================================

  async filterResponse(response, requestMetadata) {
    // 1. Check for harmful content in response
    const harmCheck = this.checkResponseSafety(response);
    if (!harmCheck.safe) {
      this.logSecurityEvent('UNSAFE_RESPONSE', {
        requestId: requestMetadata.requestId,
        reason: harmCheck.reason
      });
      return {
        filtered: true,
        content: '[Response filtered due to safety concerns]',
        originalBlocked: true
      };
    }

    // 2. Redact any sensitive data in response
    const sanitizedResponse = this.redactSensitiveData(response);

    // 3. Extract and store learnings
    await this.extractKnowledge(sanitizedResponse, requestMetadata);

    return {
      filtered: false,
      content: sanitizedResponse,
      metadata: {
        ...requestMetadata,
        processedAt: Date.now()
      }
    };
  }

  checkResponseSafety(response) {
    // Check for harmful patterns in response
    const harmfulPatterns = [
      /here's how to (hack|steal|exploit)/i,
      /step-by-step guide to (illegal|harmful)/i,
      /malicious code/i
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(response)) {
        return { safe: false, reason: pattern.toString() };
      }
    }

    return { safe: true };
  }

  // ============================================================
  //  KNOWLEDGE EXTRACTION & RETENTION
  // ============================================================

  async extractKnowledge(response, metadata) {
    // Extract useful patterns, facts, code snippets
    const knowledge = {
      id: crypto.randomUUID(),
      source: metadata.provider,
      timestamp: Date.now(),
      type: this.classifyContent(response),
      content: this.extractKeyInsights(response),
      tags: this.generateTags(response)
    };

    // Store in knowledge base
    await this.storeKnowledge(knowledge);
  }

  classifyContent(text) {
    if (/```[\s\S]*```/.test(text)) return 'code';
    if (/\d+\.\s/.test(text)) return 'list';
    if (/\|.*\|/.test(text)) return 'table';
    if (text.length > 1000) return 'article';
    return 'general';
  }

  extractKeyInsights(text) {
    // Extract important sentences/patterns
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Score sentences by importance indicators
    const scored = sentences.map(s => ({
      text: s.trim(),
      score: this.scoreSentence(s)
    }));

    // Return top insights
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.text);
  }

  scoreSentence(sentence) {
    let score = 0;

    // Importance indicators
    if (/important|key|critical|essential|must/i.test(sentence)) score += 2;
    if (/because|therefore|thus|hence/i.test(sentence)) score += 1;
    if (/\d+/.test(sentence)) score += 1; // Contains numbers
    if (/best practice|recommended/i.test(sentence)) score += 2;

    return score;
  }

  generateTags(text) {
    const tags = [];

    // Programming languages
    const languages = ['javascript', 'python', 'rust', 'go', 'typescript', 'java', 'c++'];
    for (const lang of languages) {
      if (text.toLowerCase().includes(lang)) tags.push(lang);
    }

    // Concepts
    const concepts = ['api', 'database', 'security', 'performance', 'testing', 'deployment'];
    for (const concept of concepts) {
      if (text.toLowerCase().includes(concept)) tags.push(concept);
    }

    return [...new Set(tags)];
  }

  async storeKnowledge(knowledge) {
    const filename = `knowledge_${Date.now()}.json`;
    const filepath = path.join(this.knowledgeDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(knowledge, null, 2));
  }

  // ============================================================
  //  SECURITY LEVEL MANAGEMENT
  // ============================================================

  setSecurityLevel(level, reason) {
    const oldLevel = this.currentLevel;
    this.currentLevel = level;

    this.logSecurityEvent('LEVEL_CHANGE', {
      from: oldLevel,
      to: level,
      reason
    });

    console.log(`[SecurityGateway] Security level changed: ${oldLevel} -> ${level} (${reason})`);
  }

  lockdown(reason) {
    this.setSecurityLevel(this.securityLevels.LOCKDOWN, reason);
  }

  unlock(sessionToken) {
    const session = this.authorizedSessions.get(sessionToken);
    if (session?.permissions?.canModifyConfig) {
      this.setSecurityLevel(this.securityLevels.STANDARD, 'Manual unlock');
      return true;
    }
    return false;
  }

  // ============================================================
  //  LOGGING
  // ============================================================

  logSecurityEvent(eventType, data) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      data
    };

    const filename = `security_${new Date().toISOString().split('T')[0]}.log`;
    const filepath = path.join(this.logsDir, filename);

    fs.appendFileSync(filepath, JSON.stringify(event) + '\n');
  }

  logRequest(requestData) {
    this.requestHistory.push(requestData);

    // Trim history if too large
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory = this.requestHistory.slice(-this.maxHistorySize / 2);
    }
  }

  // ============================================================
  //  ANALYTICS
  // ============================================================

  getSecurityStats() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);

    const recentRequests = this.requestHistory.filter(r => r.timestamp > last24h);

    return {
      currentLevel: this.currentLevel,
      activeSessions: this.authorizedSessions.size,
      requestsLast24h: recentRequests.length,
      blockedPatterns: this.blockedPatterns.length,
      knowledgeEntries: this.countKnowledgeEntries()
    };
  }

  countKnowledgeEntries() {
    if (!fs.existsSync(this.knowledgeDir)) return 0;
    return fs.readdirSync(this.knowledgeDir).filter(f => f.endsWith('.json')).length;
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { SecurityGateway };
