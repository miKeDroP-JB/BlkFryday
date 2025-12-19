/**
 * PHASE 17: TOKEN GUARD - "THE GATEKEEPER"
 *
 * Not just "valid token" but "valid presence"
 * Adaptive, avatar-aware, historical resonance-based authentication
 * Entry gatekeeper for the Christmas release
 */

import { Env } from '../index';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TokenValidationResult {
  valid: boolean;
  userId?: string;
  code?: string;
  claims?: TokenClaims;
  presence?: PresenceContext;
  resonance?: ResonanceScore;
}

export interface TokenClaims {
  sub: string;
  email?: string;
  tier?: 'free' | 'pro' | 'enterprise' | 'founder';
  avatar?: string;
  exp: number;
  iat: number;
  scope?: string[];
}

export interface PresenceContext {
  sessionId: string;
  activeAvatar: string;
  lastSeen: string;
  deviceFingerprint: string;
  geoRegion: string;
  trustLevel: number;
}

export interface ResonanceScore {
  historical: number;      // 0-1: How consistent is this user's pattern?
  behavioral: number;      // 0-1: Does this request match their behavior?
  temporal: number;        // 0-1: Is the timing natural?
  composite: number;       // Weighted average
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN GUARD CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class TokenGuard {
  private env: Env;

  // Trusted issuers
  private readonly TRUSTED_ISSUERS = [
    'https://0r8.ai',
    'https://auth.0r8.ai',
    'https://securetoken.google.com/orb-genesis'
  ];

  // Public paths (no auth required)
  private readonly PUBLIC_PATHS = [
    '/health',
    '/public/',
    '/.well-known/',
    '/edge/status'
  ];

  constructor(env: Env) {
    this.env = env;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN VALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  async validate(request: Request): Promise<TokenValidationResult> {
    const url = new URL(request.url);

    // Skip auth for public endpoints
    if (this.isPublicPath(url.pathname)) {
      return { valid: true, userId: 'anonymous' };
    }

    // Extract token from multiple sources
    const token = this.extractToken(request);
    if (!token) {
      return { valid: false, code: 'MISSING_AUTH' };
    }

    // Determine token type and validate
    if (token.startsWith('Bearer ')) {
      return this.validateJWT(token.slice(7), request);
    }

    if (token.startsWith('ApiKey ') || token.startsWith('fme_')) {
      const apiKey = token.startsWith('ApiKey ') ? token.slice(7) : token;
      return this.validateApiKey(apiKey, request);
    }

    // Firebase ID token (starts with eyJ)
    if (token.startsWith('eyJ')) {
      return this.validateJWT(token, request);
    }

    return { valid: false, code: 'INVALID_AUTH_FORMAT' };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // JWT VALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  private async validateJWT(token: string, request: Request): Promise<TokenValidationResult> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, code: 'INVALID_TOKEN_FORMAT' };
      }

      // Decode header and payload
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1])) as TokenClaims;

      // Validate structure
      if (!payload.sub) {
        return { valid: false, code: 'MISSING_SUBJECT' };
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, code: 'TOKEN_EXPIRED' };
      }

      // Check not-before (iat - issued at)
      if (payload.iat) {
        const maxAge = 86400 * 30; // 30 days
        const maxFuture = 60; // 1 minute clock skew allowed

        if (payload.iat > now + maxFuture) {
          return { valid: false, code: 'TOKEN_FROM_FUTURE' };
        }
        if (now - payload.iat > maxAge) {
          return { valid: false, code: 'TOKEN_TOO_OLD' };
        }
      }

      // Build presence context
      const presence = await this.buildPresenceContext(payload.sub, request);

      // Calculate resonance score
      const resonance = await this.calculateResonance(payload.sub, request, presence);

      // Avatar-aware validation
      const avatarValid = await this.validateAvatarAccess(payload.sub, payload.avatar, request);
      if (!avatarValid) {
        return { valid: false, code: 'AVATAR_ACCESS_DENIED' };
      }

      // Low resonance = suspicious
      if (resonance.composite < 0.3) {
        // Don't reject, but flag for additional verification
        await this.flagSuspiciousAccess(payload.sub, resonance, request);
      }

      return {
        valid: true,
        userId: payload.sub,
        claims: payload,
        presence,
        resonance
      };

    } catch (error) {
      console.error('JWT validation error:', error);
      return { valid: false, code: 'TOKEN_DECODE_ERROR' };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // API KEY VALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  private async validateApiKey(apiKey: string, request: Request): Promise<TokenValidationResult> {
    // Format: fme_{env}_{hash}
    if (!apiKey.startsWith('fme_')) {
      return { valid: false, code: 'INVALID_API_KEY_FORMAT' };
    }

    // Check edge cache first
    const cacheKey = `apikey:${this.hashApiKey(apiKey)}`;
    const cached = await this.env.RATE_LIMIT.get(cacheKey);

    if (cached) {
      const keyData = JSON.parse(cached) as {
        userId: string;
        valid: boolean;
        tier: string;
        scopes: string[];
        revokedAt?: string;
      };

      if (!keyData.valid || keyData.revokedAt) {
        return { valid: false, code: 'API_KEY_REVOKED' };
      }

      const presence = await this.buildPresenceContext(keyData.userId, request);
      const resonance = await this.calculateResonance(keyData.userId, request, presence);

      return {
        valid: true,
        userId: keyData.userId,
        claims: {
          sub: keyData.userId,
          tier: keyData.tier as TokenClaims['tier'],
          scope: keyData.scopes,
          exp: 0,
          iat: 0
        },
        presence,
        resonance
      };
    }

    // Not in cache - accept tentatively (core will fully validate)
    // Extract user hint from key
    const keyParts = apiKey.split('_');
    const userId = `apikey:${keyParts[2]?.slice(0, 8) || 'unknown'}`;

    return {
      valid: true,
      userId,
      claims: {
        sub: userId,
        tier: 'free',
        exp: 0,
        iat: 0
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRESENCE CONTEXT
  // ═══════════════════════════════════════════════════════════════════════

  private async buildPresenceContext(userId: string, request: Request): Promise<PresenceContext> {
    // Get CF properties
    const cf = request.cf as {
      colo?: string;
      country?: string;
      city?: string;
    } | undefined;

    // Get or create session
    const sessionId = request.headers.get('X-Session-ID') || crypto.randomUUID();

    // Get active avatar from edge cache
    const activeAvatar = await this.env.AVATAR_STATE.get(`avatars:${userId}:active`) || 'default';

    // Build device fingerprint from headers
    const fingerprint = this.generateDeviceFingerprint(request);

    // Calculate trust level based on history
    const trustLevel = await this.calculateTrustLevel(userId, fingerprint);

    const presence: PresenceContext = {
      sessionId,
      activeAvatar,
      lastSeen: new Date().toISOString(),
      deviceFingerprint: fingerprint,
      geoRegion: cf?.country || 'unknown',
      trustLevel
    };

    // Cache presence for quick access
    await this.env.CONTEXT_CACHE.put(
      `presence:${userId}`,
      JSON.stringify(presence),
      { expirationTtl: 300 }
    );

    return presence;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RESONANCE SCORING
  // ═══════════════════════════════════════════════════════════════════════

  private async calculateResonance(
    userId: string,
    request: Request,
    presence: PresenceContext
  ): Promise<ResonanceScore> {
    // Get historical patterns
    const historyKey = `resonance:${userId}:history`;
    const historyStr = await this.env.RATE_LIMIT.get(historyKey);
    const history = historyStr ? JSON.parse(historyStr) : {
      avgRequestsPerHour: 10,
      commonRegions: [],
      commonDevices: [],
      activeHours: [],
      lastPatterns: []
    };

    // Calculate historical resonance (does this match their typical pattern?)
    const historicalScore = this.calculateHistoricalResonance(history, presence);

    // Calculate behavioral resonance (does this request make sense?)
    const behavioralScore = this.calculateBehavioralResonance(request, history);

    // Calculate temporal resonance (is the timing natural?)
    const temporalScore = this.calculateTemporalResonance(history);

    // Composite with weights
    const composite = (
      historicalScore * 0.4 +
      behavioralScore * 0.35 +
      temporalScore * 0.25
    );

    // Update history for learning
    await this.updateResonanceHistory(userId, history, presence, request);

    return {
      historical: historicalScore,
      behavioral: behavioralScore,
      temporal: temporalScore,
      composite
    };
  }

  private calculateHistoricalResonance(history: any, presence: PresenceContext): number {
    let score = 0.5; // Neutral start

    // Known region?
    if (history.commonRegions.includes(presence.geoRegion)) {
      score += 0.2;
    }

    // Known device?
    if (history.commonDevices.includes(presence.deviceFingerprint)) {
      score += 0.25;
    }

    // Trust level factor
    score += presence.trustLevel * 0.15;

    return Math.min(1, Math.max(0, score));
  }

  private calculateBehavioralResonance(request: Request, history: any): number {
    let score = 0.6; // Slightly optimistic start

    const url = new URL(request.url);
    const path = url.pathname;

    // Check if path matches typical patterns
    if (history.lastPatterns && history.lastPatterns.length > 0) {
      const pathParts = path.split('/').filter(Boolean);
      const matchingPatterns = history.lastPatterns.filter((p: string) =>
        pathParts.some(part => p.includes(part))
      );
      score += matchingPatterns.length * 0.1;
    }

    return Math.min(1, Math.max(0, score));
  }

  private calculateTemporalResonance(history: any): number {
    const currentHour = new Date().getUTCHours();

    // If we have active hours data
    if (history.activeHours && history.activeHours.length > 0) {
      const isActiveHour = history.activeHours.includes(currentHour);
      return isActiveHour ? 0.9 : 0.5;
    }

    // Default: slightly favor business hours
    const isBusinessHour = currentHour >= 8 && currentHour <= 22;
    return isBusinessHour ? 0.7 : 0.5;
  }

  private async updateResonanceHistory(
    userId: string,
    history: any,
    presence: PresenceContext,
    request: Request
  ): Promise<void> {
    const url = new URL(request.url);

    // Update regions
    if (!history.commonRegions.includes(presence.geoRegion)) {
      history.commonRegions.push(presence.geoRegion);
      if (history.commonRegions.length > 10) history.commonRegions.shift();
    }

    // Update devices
    if (!history.commonDevices.includes(presence.deviceFingerprint)) {
      history.commonDevices.push(presence.deviceFingerprint);
      if (history.commonDevices.length > 5) history.commonDevices.shift();
    }

    // Update active hours
    const currentHour = new Date().getUTCHours();
    if (!history.activeHours.includes(currentHour)) {
      history.activeHours.push(currentHour);
    }

    // Update patterns
    history.lastPatterns.push(url.pathname);
    if (history.lastPatterns.length > 20) history.lastPatterns.shift();

    // Save
    await this.env.RATE_LIMIT.put(
      `resonance:${userId}:history`,
      JSON.stringify(history),
      { expirationTtl: 86400 * 30 } // 30 days
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // AVATAR ACCESS VALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  private async validateAvatarAccess(
    userId: string,
    requestedAvatar: string | undefined,
    request: Request
  ): Promise<boolean> {
    if (!requestedAvatar) return true;

    // Get user's available avatars
    const avatarsStr = await this.env.AVATAR_STATE.get(`avatars:${userId}:list`);
    if (!avatarsStr) return true; // No restrictions

    const avatars = JSON.parse(avatarsStr);
    const avatarIds = Object.keys(avatars);

    // Default avatars always allowed
    const defaultAvatars = ['default', 'business', 'creative', 'builder'];
    if (defaultAvatars.includes(requestedAvatar)) return true;

    // Check if user has access
    return avatarIds.includes(requestedAvatar);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  private isPublicPath(pathname: string): boolean {
    return this.PUBLIC_PATHS.some(p => pathname.startsWith(p));
  }

  private extractToken(request: Request): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('Authorization');
    if (authHeader) return authHeader;

    // Try X-API-Key header
    const apiKeyHeader = request.headers.get('X-API-Key');
    if (apiKeyHeader) return apiKeyHeader;

    // Try query param (for WebSocket upgrades)
    const url = new URL(request.url);
    const tokenParam = url.searchParams.get('token');
    if (tokenParam) return tokenParam;

    return null;
  }

  private generateDeviceFingerprint(request: Request): string {
    const components = [
      request.headers.get('User-Agent') || '',
      request.headers.get('Accept-Language') || '',
      request.headers.get('Accept-Encoding') || '',
      (request.cf as any)?.asn || ''
    ].join('|');

    // Simple hash
    let hash = 0;
    for (let i = 0; i < components.length; i++) {
      const char = components.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private async calculateTrustLevel(userId: string, fingerprint: string): Promise<number> {
    const trustKey = `trust:${userId}`;
    const trustStr = await this.env.RATE_LIMIT.get(trustKey);

    if (!trustStr) return 0.5; // Neutral for new users

    const trustData = JSON.parse(trustStr);
    return trustData.level || 0.5;
  }

  private hashApiKey(apiKey: string): string {
    let hash = 0;
    for (let i = 0; i < apiKey.length; i++) {
      const char = apiKey.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private async flagSuspiciousAccess(
    userId: string,
    resonance: ResonanceScore,
    request: Request
  ): Promise<void> {
    const flagKey = `suspicious:${userId}:${Date.now()}`;
    await this.env.RATE_LIMIT.put(flagKey, JSON.stringify({
      timestamp: new Date().toISOString(),
      resonance,
      path: new URL(request.url).pathname,
      ip: request.headers.get('CF-Connecting-IP'),
      userAgent: request.headers.get('User-Agent')
    }), { expirationTtl: 86400 * 7 }); // Keep for 7 days
  }
}
