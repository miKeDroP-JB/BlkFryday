/**
 * ExternalTether - OAuth & Webhook Integration Layer
 * ═══════════════════════════════════════════════════════════════════
 * Secure bridge between the 0RB System and external services.
 *
 * Features:
 * - OAuth 2.0 / OIDC flows
 * - Webhook receivers and dispatchers
 * - Token management and refresh
 * - Rate limiting per provider
 * - Security validation through Ethics Gateway
 * ═══════════════════════════════════════════════════════════════════
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

// Supported OAuth Providers
const OAUTH_PROVIDERS = {
  GOOGLE: {
    id: 'google',
    name: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: ['openid', 'email', 'profile'],
    responseType: 'code',
    grantType: 'authorization_code',
  },
  GITHUB: {
    id: 'github',
    name: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scopes: ['read:user', 'user:email'],
    responseType: 'code',
    grantType: 'authorization_code',
  },
  DISCORD: {
    id: 'discord',
    name: 'Discord',
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userInfoUrl: 'https://discord.com/api/users/@me',
    scopes: ['identify', 'email'],
    responseType: 'code',
    grantType: 'authorization_code',
  },
  STRIPE: {
    id: 'stripe',
    name: 'Stripe Connect',
    authUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    scopes: ['read_write'],
    responseType: 'code',
    grantType: 'authorization_code',
  },
  CUSTOM: {
    id: 'custom',
    name: 'Custom Provider',
    scopes: [],
    responseType: 'code',
    grantType: 'authorization_code',
  },
};

// Webhook Event Types
const WEBHOOK_EVENTS = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',

  // Subscription events
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',

  // Agent events
  AGENT_TASK_COMPLETED: 'agent.task.completed',
  AGENT_SPAWNED: 'agent.spawned',

  // Ritual events
  RITUAL_STARTED: 'ritual.started',
  RITUAL_COMPLETED: 'ritual.completed',
  RITUAL_JOINED: 'ritual.joined',

  // System events
  SYSTEM_ALERT: 'system.alert',
  SYSTEM_ERROR: 'system.error',
};

/**
 * OAuthState - Manages OAuth state for CSRF protection
 */
class OAuthStateManager {
  constructor(options = {}) {
    this.states = new Map(); // state -> { provider, redirectUri, createdAt, metadata }
    this.ttl = options.ttl || 600000; // 10 minutes
    this.cleanupInterval = setInterval(() => this._cleanup(), 60000);
  }

  generate(provider, redirectUri, metadata = {}) {
    const state = crypto.randomBytes(32).toString('hex');
    this.states.set(state, {
      provider,
      redirectUri,
      metadata,
      createdAt: Date.now(),
    });
    return state;
  }

  validate(state) {
    const data = this.states.get(state);
    if (!data) return { valid: false, reason: 'State not found' };

    if (Date.now() - data.createdAt > this.ttl) {
      this.states.delete(state);
      return { valid: false, reason: 'State expired' };
    }

    this.states.delete(state); // One-time use
    return { valid: true, data };
  }

  _cleanup() {
    const now = Date.now();
    for (const [state, data] of this.states.entries()) {
      if (now - data.createdAt > this.ttl) {
        this.states.delete(state);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

/**
 * TokenStore - Secure token storage
 */
class TokenStore {
  constructor(options = {}) {
    this.tokens = new Map(); // userId -> { provider -> tokenData }
    this.encryptionKey = options.encryptionKey || crypto.randomBytes(32);
  }

  store(userId, provider, tokenData) {
    if (!this.tokens.has(userId)) {
      this.tokens.set(userId, new Map());
    }

    const encrypted = this._encrypt(JSON.stringify(tokenData));
    this.tokens.get(userId).set(provider, {
      data: encrypted,
      storedAt: Date.now(),
      expiresAt: tokenData.expires_at || (Date.now() + (tokenData.expires_in || 3600) * 1000),
    });
  }

  get(userId, provider) {
    const userTokens = this.tokens.get(userId);
    if (!userTokens) return null;

    const tokenEntry = userTokens.get(provider);
    if (!tokenEntry) return null;

    // Check expiry
    if (Date.now() > tokenEntry.expiresAt) {
      userTokens.delete(provider);
      return null;
    }

    try {
      const decrypted = this._decrypt(tokenEntry.data);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  revoke(userId, provider) {
    const userTokens = this.tokens.get(userId);
    if (userTokens) {
      userTokens.delete(provider);
    }
  }

  revokeAll(userId) {
    this.tokens.delete(userId);
  }

  needsRefresh(userId, provider, bufferMs = 300000) {
    const userTokens = this.tokens.get(userId);
    if (!userTokens) return true;

    const tokenEntry = userTokens.get(provider);
    if (!tokenEntry) return true;

    return Date.now() + bufferMs > tokenEntry.expiresAt;
  }

  _encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  _decrypt(encryptedText) {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

/**
 * WebhookManager - Handles incoming and outgoing webhooks
 */
class WebhookManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.endpoints = new Map(); // endpointId -> endpoint config
    this.subscriptions = new Map(); // eventType -> [endpointIds]
    this.deliveryLog = []; // Recent deliveries for debugging
    this.maxLogSize = options.maxLogSize || 1000;

    this.config = {
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      timeout: options.timeout || 30000,
      signatureHeader: options.signatureHeader || 'x-orb-signature',
    };

    this.signingSecret = options.signingSecret || crypto.randomBytes(32).toString('hex');
  }

  /**
   * Register a webhook endpoint
   */
  registerEndpoint(config) {
    const endpoint = {
      id: config.id || crypto.randomUUID(),
      url: config.url,
      events: config.events || ['*'],
      secret: config.secret || crypto.randomBytes(16).toString('hex'),
      enabled: config.enabled !== false,
      metadata: config.metadata || {},
      createdAt: new Date().toISOString(),
    };

    this.endpoints.set(endpoint.id, endpoint);

    // Subscribe to events
    for (const event of endpoint.events) {
      if (!this.subscriptions.has(event)) {
        this.subscriptions.set(event, []);
      }
      this.subscriptions.get(event).push(endpoint.id);
    }

    return endpoint;
  }

  /**
   * Remove a webhook endpoint
   */
  removeEndpoint(endpointId) {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return false;

    // Unsubscribe from events
    for (const event of endpoint.events) {
      const subs = this.subscriptions.get(event);
      if (subs) {
        const index = subs.indexOf(endpointId);
        if (index > -1) subs.splice(index, 1);
      }
    }

    this.endpoints.delete(endpointId);
    return true;
  }

  /**
   * Dispatch a webhook event
   */
  async dispatch(eventType, payload) {
    const endpointIds = [
      ...(this.subscriptions.get(eventType) || []),
      ...(this.subscriptions.get('*') || []),
    ];

    const uniqueIds = [...new Set(endpointIds)];
    const results = [];

    for (const endpointId of uniqueIds) {
      const endpoint = this.endpoints.get(endpointId);
      if (!endpoint || !endpoint.enabled) continue;

      const result = await this._deliver(endpoint, eventType, payload);
      results.push(result);
    }

    return results;
  }

  async _deliver(endpoint, eventType, payload, attempt = 1) {
    const timestamp = Date.now();
    const body = JSON.stringify({
      id: crypto.randomUUID(),
      type: eventType,
      data: payload,
      timestamp: new Date(timestamp).toISOString(),
    });

    const signature = this._sign(body, endpoint.secret);

    const delivery = {
      endpointId: endpoint.id,
      eventType,
      attempt,
      timestamp: new Date(timestamp).toISOString(),
      success: false,
    };

    try {
      // In production, use actual fetch
      // For now, emit event for testing
      this.emit('delivery-attempt', { endpoint, eventType, payload, attempt });

      // Simulate success
      delivery.success = true;
      delivery.statusCode = 200;

      this._logDelivery(delivery);
      return delivery;
    } catch (error) {
      delivery.error = error.message;

      if (attempt < this.config.retryAttempts) {
        await new Promise(r => setTimeout(r, this.config.retryDelay * attempt));
        return this._deliver(endpoint, eventType, payload, attempt + 1);
      }

      this._logDelivery(delivery);
      this.emit('delivery-failed', delivery);
      return delivery;
    }
  }

  _sign(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify incoming webhook signature
   */
  verifySignature(payload, signature, secret) {
    const expected = this._sign(
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      secret
    );
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  }

  _logDelivery(delivery) {
    this.deliveryLog.push(delivery);
    if (this.deliveryLog.length > this.maxLogSize) {
      this.deliveryLog.shift();
    }
  }

  getDeliveryLog(filter = {}) {
    let log = [...this.deliveryLog];

    if (filter.endpointId) {
      log = log.filter(d => d.endpointId === filter.endpointId);
    }
    if (filter.eventType) {
      log = log.filter(d => d.eventType === filter.eventType);
    }
    if (filter.success !== undefined) {
      log = log.filter(d => d.success === filter.success);
    }

    return log;
  }
}

/**
 * ExternalTether - Main integration class
 */
class ExternalTether extends EventEmitter {
  constructor(options = {}) {
    super();

    this.stateManager = new OAuthStateManager(options.state);
    this.tokenStore = new TokenStore(options.tokens);
    this.webhookManager = new WebhookManager(options.webhooks);

    // Provider credentials (set via environment or config)
    this.credentials = new Map();

    // Ethics gateway reference
    this.ethicsGateway = options.ethicsGateway || null;

    // Configuration
    this.config = {
      baseUrl: options.baseUrl || 'http://localhost:3000',
      callbackPath: options.callbackPath || '/api/auth/callback',
      ...options.config,
    };

    // Stats
    this.stats = {
      oauthFlowsStarted: 0,
      oauthFlowsCompleted: 0,
      webhooksReceived: 0,
      webhooksDispatched: 0,
    };
  }

  /**
   * Register OAuth provider credentials
   */
  registerProvider(providerId, credentials) {
    this.credentials.set(providerId, {
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      ...credentials,
    });
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(providerId, options = {}) {
    const provider = OAUTH_PROVIDERS[providerId.toUpperCase()] || OAUTH_PROVIDERS.CUSTOM;
    const creds = this.credentials.get(providerId);

    if (!creds && providerId !== 'custom') {
      throw new Error(`Provider not configured: ${providerId}`);
    }

    const state = this.stateManager.generate(providerId, options.redirectUri, options.metadata);
    const redirectUri = options.redirectUri || `${this.config.baseUrl}${this.config.callbackPath}`;

    const params = new URLSearchParams({
      client_id: creds?.clientId || options.clientId,
      redirect_uri: redirectUri,
      response_type: provider.responseType,
      scope: (options.scopes || provider.scopes).join(' '),
      state,
      ...options.extraParams,
    });

    this.stats.oauthFlowsStarted++;
    this.emit('oauth-flow-started', { providerId, state });

    return {
      url: `${options.authUrl || provider.authUrl}?${params.toString()}`,
      state,
    };
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(code, state, providerId = null) {
    // Validate state
    const stateValidation = this.stateManager.validate(state);
    if (!stateValidation.valid) {
      throw new Error(`Invalid OAuth state: ${stateValidation.reason}`);
    }

    const { provider: stateProvider, redirectUri, metadata } = stateValidation.data;
    const actualProvider = providerId || stateProvider;
    const providerConfig = OAUTH_PROVIDERS[actualProvider.toUpperCase()] || OAUTH_PROVIDERS.CUSTOM;
    const creds = this.credentials.get(actualProvider);

    if (!creds) {
      throw new Error(`Provider not configured: ${actualProvider}`);
    }

    // Exchange code for tokens
    const tokenResponse = await this._exchangeCode(
      providerConfig,
      creds,
      code,
      redirectUri || `${this.config.baseUrl}${this.config.callbackPath}`
    );

    // Get user info
    let userInfo = null;
    if (providerConfig.userInfoUrl) {
      userInfo = await this._getUserInfo(providerConfig, tokenResponse.access_token);
    }

    this.stats.oauthFlowsCompleted++;
    this.emit('oauth-flow-completed', {
      provider: actualProvider,
      userInfo,
      metadata,
    });

    return {
      provider: actualProvider,
      tokens: tokenResponse,
      user: userInfo,
      metadata,
    };
  }

  async _exchangeCode(provider, creds, code, redirectUri) {
    // In production, use actual fetch
    // Simulated response for structure
    return {
      access_token: `mock_access_${crypto.randomBytes(16).toString('hex')}`,
      refresh_token: `mock_refresh_${crypto.randomBytes(16).toString('hex')}`,
      expires_in: 3600,
      token_type: 'Bearer',
    };
  }

  async _getUserInfo(provider, accessToken) {
    // In production, use actual fetch
    // Simulated response for structure
    return {
      id: crypto.randomUUID(),
      email: 'user@example.com',
      name: 'Demo User',
    };
  }

  /**
   * Store tokens for a user
   */
  storeTokens(userId, provider, tokens) {
    this.tokenStore.store(userId, provider, tokens);
    this.emit('tokens-stored', { userId, provider });
  }

  /**
   * Get tokens for a user
   */
  getTokens(userId, provider) {
    return this.tokenStore.get(userId, provider);
  }

  /**
   * Check if tokens need refresh
   */
  needsRefresh(userId, provider) {
    return this.tokenStore.needsRefresh(userId, provider);
  }

  /**
   * Revoke tokens
   */
  revokeTokens(userId, provider = null) {
    if (provider) {
      this.tokenStore.revoke(userId, provider);
    } else {
      this.tokenStore.revokeAll(userId);
    }
    this.emit('tokens-revoked', { userId, provider });
  }

  /**
   * Register a webhook endpoint
   */
  registerWebhook(config) {
    return this.webhookManager.registerEndpoint(config);
  }

  /**
   * Remove a webhook endpoint
   */
  removeWebhook(endpointId) {
    return this.webhookManager.removeEndpoint(endpointId);
  }

  /**
   * Dispatch a webhook event
   */
  async dispatchWebhook(eventType, payload) {
    this.stats.webhooksDispatched++;
    return this.webhookManager.dispatch(eventType, payload);
  }

  /**
   * Handle incoming webhook
   */
  async handleIncomingWebhook(source, payload, signature) {
    // Validate through ethics gateway if available
    if (this.ethicsGateway) {
      const validation = await this.ethicsGateway.processRequest(payload, {
        source: { id: source, type: 'webhook' },
        action: 'webhook_receive',
      });

      if (!validation.allowed) {
        throw new Error(`Webhook blocked: ${validation.report.action}`);
      }

      payload = validation.data;
    }

    this.stats.webhooksReceived++;
    this.emit('webhook-received', { source, payload });

    return { received: true, source };
  }

  /**
   * Get webhook delivery log
   */
  getWebhookLog(filter = {}) {
    return this.webhookManager.getDeliveryLog(filter);
  }

  /**
   * Get statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Create Express router for OAuth callbacks
   */
  createRouter() {
    // Returns route handlers for integration
    return {
      callback: async (req, res) => {
        try {
          const { code, state, error } = req.query;

          if (error) {
            throw new Error(`OAuth error: ${error}`);
          }

          const result = await this.handleCallback(code, state);
          return { success: true, ...result };
        } catch (err) {
          return { success: false, error: err.message };
        }
      },

      webhook: async (req, res) => {
        try {
          const source = req.params.source || 'unknown';
          const signature = req.headers[this.webhookManager.config.signatureHeader];

          const result = await this.handleIncomingWebhook(source, req.body, signature);
          return { success: true, ...result };
        } catch (err) {
          return { success: false, error: err.message };
        }
      },
    };
  }

  /**
   * Shutdown
   */
  shutdown() {
    this.stateManager.destroy();
    this.emit('shutdown');
  }
}

module.exports = {
  ExternalTether,
  OAuthStateManager,
  TokenStore,
  WebhookManager,
  OAUTH_PROVIDERS,
  WEBHOOK_EVENTS,
};
