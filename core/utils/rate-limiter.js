/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██████╗  █████╗ ████████╗███████╗    ██╗     ██╗███╗   ███╗██╗████████╗ ║
 * ║   ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝    ██║     ██║████╗ ████║██║╚══██╔══╝ ║
 * ║   ██████╔╝███████║   ██║   █████╗      ██║     ██║██╔████╔██║██║   ██║    ║
 * ║   ██╔══██╗██╔══██║   ██║   ██╔══╝      ██║     ██║██║╚██╔╝██║██║   ██║    ║
 * ║   ██║  ██║██║  ██║   ██║   ███████╗    ███████╗██║██║ ╚═╝ ██║██║   ██║    ║
 * ║   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝    ╚══════╝╚═╝╚═╝     ╚═╝╚═╝   ╚═╝    ║
 * ║                                                                           ║
 * ║   TOKEN BUCKET RATE LIMITER - Protect your API quotas                     ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN BUCKET RATE LIMITER
// ═══════════════════════════════════════════════════════════════════════════

class TokenBucket {
  constructor(config = {}) {
    this.capacity = config.capacity || 60;          // Max tokens
    this.refillRate = config.refillRate || 1;       // Tokens per second
    this.tokens = config.tokens || this.capacity;   // Current tokens
    this.lastRefill = Date.now();
  }

  _refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // Seconds
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  tryConsume(tokens = 1) {
    this._refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  async consume(tokens = 1) {
    if (this.tryConsume(tokens)) {
      return true;
    }

    // Calculate wait time
    const needed = tokens - this.tokens;
    const waitMs = (needed / this.refillRate) * 1000;

    await new Promise(resolve => setTimeout(resolve, waitMs));
    return this.tryConsume(tokens);
  }

  getTokens() {
    this._refill();
    return Math.floor(this.tokens);
  }

  getWaitTime(tokens = 1) {
    this._refill();
    if (this.tokens >= tokens) return 0;
    const needed = tokens - this.tokens;
    return Math.ceil((needed / this.refillRate) * 1000);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITER WITH MULTIPLE BUCKETS
// ═══════════════════════════════════════════════════════════════════════════

class RateLimiter extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      // Default limits (can be overridden per-provider)
      defaultRPM: config.defaultRPM || 60,          // Requests per minute
      defaultTPM: config.defaultTPM || 100000,      // Tokens per minute
      defaultRPD: config.defaultRPD || 10000,       // Requests per day
      ...config
    };

    // Per-provider buckets
    this.buckets = new Map();

    // Stats
    this.stats = {
      totalRequests: 0,
      totalTokens: 0,
      throttled: 0,
      byProvider: {}
    };
  }

  /**
   * Configure limits for a specific provider
   */
  configureProvider(provider, limits = {}) {
    this.buckets.set(provider, {
      rpm: new TokenBucket({
        capacity: limits.rpm || this.config.defaultRPM,
        refillRate: (limits.rpm || this.config.defaultRPM) / 60
      }),
      tpm: new TokenBucket({
        capacity: limits.tpm || this.config.defaultTPM,
        refillRate: (limits.tpm || this.config.defaultTPM) / 60
      }),
      rpd: new TokenBucket({
        capacity: limits.rpd || this.config.defaultRPD,
        refillRate: (limits.rpd || this.config.defaultRPD) / 86400
      })
    });

    this.stats.byProvider[provider] = {
      requests: 0,
      tokens: 0,
      throttled: 0
    };
  }

  /**
   * Get or create buckets for a provider
   */
  _getBuckets(provider) {
    if (!this.buckets.has(provider)) {
      this.configureProvider(provider);
    }
    return this.buckets.get(provider);
  }

  /**
   * Check if request can proceed (non-blocking)
   */
  canProceed(provider, estimatedTokens = 1) {
    const buckets = this._getBuckets(provider);

    return buckets.rpm.getTokens() >= 1 &&
           buckets.tpm.getTokens() >= estimatedTokens &&
           buckets.rpd.getTokens() >= 1;
  }

  /**
   * Acquire permission to make a request (blocking if needed)
   */
  async acquire(provider, estimatedTokens = 1) {
    const buckets = this._getBuckets(provider);

    // Check all limits
    const rpmWait = buckets.rpm.getWaitTime(1);
    const tpmWait = buckets.tpm.getWaitTime(estimatedTokens);
    const rpdWait = buckets.rpd.getWaitTime(1);

    const maxWait = Math.max(rpmWait, tpmWait, rpdWait);

    if (maxWait > 0) {
      this.stats.throttled++;
      this.stats.byProvider[provider].throttled++;

      this.emit('throttled', {
        provider,
        waitMs: maxWait,
        reason: rpmWait > 0 ? 'rpm' : tpmWait > 0 ? 'tpm' : 'rpd'
      });

      await new Promise(resolve => setTimeout(resolve, maxWait));
    }

    // Consume tokens
    buckets.rpm.tryConsume(1);
    buckets.tpm.tryConsume(estimatedTokens);
    buckets.rpd.tryConsume(1);

    this.stats.totalRequests++;
    this.stats.byProvider[provider].requests++;
  }

  /**
   * Record actual token usage after request completes
   */
  recordUsage(provider, actualTokens) {
    this.stats.totalTokens += actualTokens;
    this.stats.byProvider[provider].tokens += actualTokens;
  }

  /**
   * Get current rate limit status
   */
  getStatus(provider) {
    if (!provider) {
      return {
        stats: this.stats,
        providers: Object.fromEntries(
          Array.from(this.buckets.entries()).map(([p, b]) => [
            p,
            {
              rpm: b.rpm.getTokens(),
              tpm: b.tpm.getTokens(),
              rpd: b.rpd.getTokens()
            }
          ])
        )
      };
    }

    const buckets = this._getBuckets(provider);
    return {
      rpm: {
        available: buckets.rpm.getTokens(),
        capacity: buckets.rpm.capacity
      },
      tpm: {
        available: buckets.tpm.getTokens(),
        capacity: buckets.tpm.capacity
      },
      rpd: {
        available: buckets.rpd.getTokens(),
        capacity: buckets.rpd.capacity
      },
      stats: this.stats.byProvider[provider]
    };
  }

  /**
   * Reset limits (useful for testing)
   */
  reset(provider) {
    if (provider) {
      this.buckets.delete(provider);
      if (this.stats.byProvider[provider]) {
        this.stats.byProvider[provider] = { requests: 0, tokens: 0, throttled: 0 };
      }
    } else {
      this.buckets.clear();
      this.stats = {
        totalRequests: 0,
        totalTokens: 0,
        throttled: 0,
        byProvider: {}
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER-SPECIFIC RATE LIMITS (based on common API limits)
// ═══════════════════════════════════════════════════════════════════════════

const PROVIDER_LIMITS = {
  openai: {
    rpm: 500,           // GPT-4 tier 1
    tpm: 30000,         // Tokens per minute
    rpd: 10000          // Requests per day
  },
  anthropic: {
    rpm: 50,            // Default tier
    tpm: 40000,         // Tokens per minute
    rpd: 5000
  },
  groq: {
    rpm: 30,            // Free tier
    tpm: 6000,
    rpd: 14400
  },
  ollama: {
    rpm: 1000,          // Local - high limit
    tpm: 1000000,
    rpd: 100000
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

function createRateLimiter(config = {}) {
  const limiter = new RateLimiter(config);

  // Pre-configure known providers
  for (const [provider, limits] of Object.entries(PROVIDER_LIMITS)) {
    limiter.configureProvider(provider, limits);
  }

  return limiter;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  TokenBucket,
  RateLimiter,
  PROVIDER_LIMITS,
  createRateLimiter
};
