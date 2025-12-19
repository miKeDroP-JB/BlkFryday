/**
 * PHASE 17: RATE SHAPER - "THE RHYTHM ENGINE"
 *
 * Not crude rate limiting. This is traffic orchestration.
 * - Smooths traffic
 * - Detects abuse
 * - Adjusts based on system load
 * - Applies velocity caps only when necessary
 * - Allows speed for trusted avatars
 */

import { Env } from '../index';
import { PresenceContext, ResonanceScore } from './token-guard';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface RateCheckResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
  shaped: boolean;
  reason?: string;
  velocity: VelocityState;
}

export interface VelocityState {
  current: number;        // Requests in current window
  trend: 'accelerating' | 'stable' | 'decelerating';
  burstDetected: boolean;
  smoothedRate: number;   // Exponential moving average
}

export interface UserQuota {
  tier: 'free' | 'pro' | 'enterprise' | 'founder';
  baseLimit: number;
  burstLimit: number;
  windowMs: number;
  trustMultiplier: number;
}

export interface SystemLoad {
  cpu: number;            // 0-1
  memory: number;         // 0-1
  queueDepth: number;
  avgLatency: number;
  healthy: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// TIER QUOTAS
// ═══════════════════════════════════════════════════════════════════════════

const TIER_QUOTAS: Record<string, UserQuota> = {
  free: {
    tier: 'free',
    baseLimit: 30,          // 30 requests per minute
    burstLimit: 10,         // Can burst 10 extra
    windowMs: 60000,
    trustMultiplier: 1.0
  },
  pro: {
    tier: 'pro',
    baseLimit: 120,
    burstLimit: 40,
    windowMs: 60000,
    trustMultiplier: 1.5
  },
  enterprise: {
    tier: 'enterprise',
    baseLimit: 500,
    burstLimit: 200,
    windowMs: 60000,
    trustMultiplier: 2.0
  },
  founder: {
    tier: 'founder',
    baseLimit: 1000,
    burstLimit: 500,
    windowMs: 60000,
    trustMultiplier: 3.0
  }
};

// Avatar-specific bonuses
const AVATAR_BONUSES: Record<string, number> = {
  builder: 2.0,      // Builders get 2x - they're building
  business: 1.5,     // Business users get 1.5x
  creative: 1.2,     // Creative gets slight boost
  default: 1.0
};

// ═══════════════════════════════════════════════════════════════════════════
// RATE SHAPER CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class RateShaper {
  private env: Env;

  // Smoothing factor for exponential moving average
  private readonly EMA_ALPHA = 0.3;

  // Abuse detection thresholds
  private readonly BURST_THRESHOLD = 10;    // Requests in 1 second
  private readonly ABUSE_SCORE_LIMIT = 5;   // Consecutive violations

  constructor(env: Env) {
    this.env = env;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN CHECK
  // ═══════════════════════════════════════════════════════════════════════

  async check(
    userId: string,
    options: {
      tier?: string;
      avatar?: string;
      presence?: PresenceContext;
      resonance?: ResonanceScore;
    } = {}
  ): Promise<RateCheckResult> {
    const tier = options.tier || 'free';
    const avatar = options.avatar || 'default';
    const quota = this.getEffectiveQuota(tier, avatar, options.presence, options.resonance);

    // Get current state
    const state = await this.getUserState(userId);

    // Check system load
    const systemLoad = await this.getSystemLoad();

    // Apply load-based adjustment
    const adjustedLimit = this.applyLoadAdjustment(quota, systemLoad);

    // Calculate velocity
    const velocity = this.calculateVelocity(state);

    // Check if allowed
    const now = Date.now();
    const windowStart = now - quota.windowMs;

    // Clean old entries
    const recentRequests = state.requests.filter((t: number) => t > windowStart);
    const currentCount = recentRequests.length;

    // Determine if burst is happening
    const lastSecondRequests = recentRequests.filter((t: number) => t > now - 1000);
    const burstDetected = lastSecondRequests.length >= this.BURST_THRESHOLD;

    // Calculate effective limit (base + burst allowance if not abusing)
    let effectiveLimit = adjustedLimit.baseLimit;
    if (!burstDetected && state.abuseScore < this.ABUSE_SCORE_LIMIT) {
      effectiveLimit += adjustedLimit.burstLimit;
    }

    // Trust bonus from resonance
    if (options.resonance && options.resonance.composite > 0.7) {
      effectiveLimit = Math.floor(effectiveLimit * 1.2);
    }

    const allowed = currentCount < effectiveLimit;
    const remaining = Math.max(0, effectiveLimit - currentCount);

    // Calculate reset time
    const oldestRequest = recentRequests[0] || now;
    const resetAt = oldestRequest + quota.windowMs;

    // Calculate retry after if not allowed
    let retryAfter = 0;
    if (!allowed) {
      retryAfter = Math.ceil((resetAt - now) / 1000);
    }

    // Update state
    if (allowed) {
      recentRequests.push(now);
      state.requests = recentRequests;
      state.lastRequest = now;
      state.smoothedRate = this.updateEMA(state.smoothedRate, currentCount + 1);

      // Decrease abuse score on good behavior
      state.abuseScore = Math.max(0, state.abuseScore - 0.1);
    } else {
      // Increase abuse score on violation
      state.abuseScore = Math.min(10, state.abuseScore + 1);
    }

    state.burstDetected = burstDetected;
    await this.saveUserState(userId, state);

    // Detect abuse pattern
    if (state.abuseScore >= this.ABUSE_SCORE_LIMIT) {
      await this.flagAbuse(userId, state);
    }

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter,
      shaped: systemLoad.healthy === false || burstDetected,
      reason: !allowed
        ? (burstDetected ? 'BURST_DETECTED' : 'RATE_LIMIT_EXCEEDED')
        : undefined,
      velocity: {
        current: currentCount,
        trend: this.detectTrend(state),
        burstDetected,
        smoothedRate: state.smoothedRate
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // QUOTA CALCULATION
  // ═══════════════════════════════════════════════════════════════════════

  private getEffectiveQuota(
    tier: string,
    avatar: string,
    presence?: PresenceContext,
    resonance?: ResonanceScore
  ): UserQuota {
    const baseQuota = TIER_QUOTAS[tier] || TIER_QUOTAS.free;
    const avatarBonus = AVATAR_BONUSES[avatar] || 1.0;

    // Trust multiplier from presence
    let trustMultiplier = baseQuota.trustMultiplier;
    if (presence && presence.trustLevel > 0.8) {
      trustMultiplier *= 1.3;
    }

    // Resonance bonus
    let resonanceMultiplier = 1.0;
    if (resonance && resonance.composite > 0.8) {
      resonanceMultiplier = 1.2;
    }

    const totalMultiplier = avatarBonus * trustMultiplier * resonanceMultiplier;

    return {
      ...baseQuota,
      baseLimit: Math.floor(baseQuota.baseLimit * totalMultiplier),
      burstLimit: Math.floor(baseQuota.burstLimit * totalMultiplier)
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SYSTEM LOAD
  // ═══════════════════════════════════════════════════════════════════════

  private async getSystemLoad(): Promise<SystemLoad> {
    // Try to get system load from edge KV (updated by core)
    const loadStr = await this.env.RATE_LIMIT.get('system:load');

    if (loadStr) {
      return JSON.parse(loadStr);
    }

    // Default healthy state
    return {
      cpu: 0.3,
      memory: 0.4,
      queueDepth: 0,
      avgLatency: 50,
      healthy: true
    };
  }

  private applyLoadAdjustment(quota: UserQuota, load: SystemLoad): UserQuota {
    // If system is overloaded, reduce limits
    if (!load.healthy || load.cpu > 0.8 || load.memory > 0.85) {
      const reduction = Math.max(0.5, 1 - (load.cpu * 0.3 + load.memory * 0.2));
      return {
        ...quota,
        baseLimit: Math.floor(quota.baseLimit * reduction),
        burstLimit: Math.floor(quota.burstLimit * reduction * 0.5)
      };
    }

    // If system has headroom, allow slight increase
    if (load.cpu < 0.3 && load.memory < 0.4) {
      return {
        ...quota,
        baseLimit: Math.floor(quota.baseLimit * 1.1),
        burstLimit: Math.floor(quota.burstLimit * 1.2)
      };
    }

    return quota;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // VELOCITY TRACKING
  // ═══════════════════════════════════════════════════════════════════════

  private calculateVelocity(state: UserRateState): VelocityState {
    const now = Date.now();
    const lastMinute = state.requests.filter((t: number) => t > now - 60000);
    const lastTenSeconds = state.requests.filter((t: number) => t > now - 10000);

    return {
      current: lastMinute.length,
      trend: this.detectTrend(state),
      burstDetected: lastTenSeconds.length > this.BURST_THRESHOLD,
      smoothedRate: state.smoothedRate
    };
  }

  private detectTrend(state: UserRateState): 'accelerating' | 'stable' | 'decelerating' {
    const now = Date.now();
    const last30s = state.requests.filter((t: number) => t > now - 30000).length;
    const prev30s = state.requests.filter((t: number) => t > now - 60000 && t <= now - 30000).length;

    if (last30s > prev30s * 1.5) return 'accelerating';
    if (last30s < prev30s * 0.5) return 'decelerating';
    return 'stable';
  }

  private updateEMA(current: number, newValue: number): number {
    return this.EMA_ALPHA * newValue + (1 - this.EMA_ALPHA) * current;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  private async getUserState(userId: string): Promise<UserRateState> {
    const key = `rate:${userId}`;
    const stateStr = await this.env.RATE_LIMIT.get(key);

    if (stateStr) {
      return JSON.parse(stateStr);
    }

    return {
      requests: [],
      lastRequest: 0,
      smoothedRate: 0,
      abuseScore: 0,
      burstDetected: false
    };
  }

  private async saveUserState(userId: string, state: UserRateState): Promise<void> {
    const key = `rate:${userId}`;

    // Only keep last 2 minutes of requests
    const cutoff = Date.now() - 120000;
    state.requests = state.requests.filter((t: number) => t > cutoff);

    await this.env.RATE_LIMIT.put(key, JSON.stringify(state), {
      expirationTtl: 300 // 5 minutes
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ABUSE DETECTION
  // ═══════════════════════════════════════════════════════════════════════

  private async flagAbuse(userId: string, state: UserRateState): Promise<void> {
    const abuseKey = `abuse:${userId}:${Date.now()}`;
    await this.env.RATE_LIMIT.put(abuseKey, JSON.stringify({
      timestamp: new Date().toISOString(),
      abuseScore: state.abuseScore,
      requestCount: state.requests.length,
      smoothedRate: state.smoothedRate
    }), { expirationTtl: 86400 * 7 }); // Keep for 7 days

    console.warn(`[RATE_SHAPER] Abuse flagged for user ${userId}, score: ${state.abuseScore}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TRAFFIC SMOOTHING
  // ═══════════════════════════════════════════════════════════════════════

  async smooth(userId: string): Promise<number> {
    /**
     * Returns milliseconds to delay before processing.
     * Used for traffic smoothing during high load.
     */
    const state = await this.getUserState(userId);
    const load = await this.getSystemLoad();

    // No smoothing if system is healthy and user is behaving
    if (load.healthy && state.abuseScore < 2) {
      return 0;
    }

    // Calculate delay based on velocity and load
    let delay = 0;

    // Add delay for accelerating traffic
    if (this.detectTrend(state) === 'accelerating') {
      delay += 100; // 100ms base delay
    }

    // Add delay for system load
    if (load.cpu > 0.7) {
      delay += Math.floor((load.cpu - 0.7) * 1000); // Up to 300ms
    }

    // Add delay for abuse score
    delay += Math.floor(state.abuseScore * 50); // Up to 500ms

    return Math.min(delay, 2000); // Cap at 2 seconds
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface UserRateState {
  requests: number[];
  lastRequest: number;
  smoothedRate: number;
  abuseScore: number;
  burstDetected: boolean;
}
