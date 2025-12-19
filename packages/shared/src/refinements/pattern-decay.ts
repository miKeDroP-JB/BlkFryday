/**
 * Auto-Tune λ Per User + Adaptive Decay Per Pattern Type
 * Fixes: Pattern decay thresholds, adaptive decay
 */

export type PatternType = 'knowledge' | 'lexicon' | 'behavior' | 'preference' | 'context';

export interface PatternEntry {
  id: string;
  type: PatternType;
  value: unknown;
  weight: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  decayRate?: number; // Override per-pattern
}

export interface UserDecayProfile {
  userId: string;
  baseλ: number;
  typeMultipliers: Record<PatternType, number>;
  activityFactor: number;
  lastCalibration: number;
}

// Default decay rates by pattern type (half-life in hours)
const DEFAULT_HALF_LIVES: Record<PatternType, number> = {
  knowledge: 720,    // 30 days - facts decay slowly
  lexicon: 168,      // 7 days - vocabulary moderately
  behavior: 48,      // 2 days - behaviors change faster
  preference: 336,   // 14 days - preferences semi-stable
  context: 4,        // 4 hours - context is ephemeral
};

export class AdaptivePatternDecay {
  private profiles: Map<string, UserDecayProfile> = new Map();
  private patterns: Map<string, PatternEntry[]> = new Map();
  private calibrationInterval = 3600000; // 1 hour

  constructor(private config: {
    minλ?: number;
    maxλ?: number;
    activityWindow?: number;
  } = {}) {
    this.config.minλ = config.minλ ?? 0.001;
    this.config.maxλ = config.maxλ ?? 0.5;
    this.config.activityWindow = config.activityWindow ?? 86400000; // 24h
  }

  getOrCreateProfile(userId: string): UserDecayProfile {
    if (!this.profiles.has(userId)) {
      this.profiles.set(userId, {
        userId,
        baseλ: 0.05,
        typeMultipliers: {
          knowledge: 0.5,
          lexicon: 1.0,
          behavior: 2.0,
          preference: 0.75,
          context: 5.0,
        },
        activityFactor: 1.0,
        lastCalibration: Date.now(),
      });
    }
    return this.profiles.get(userId)!;
  }

  /**
   * Auto-tune λ based on user activity patterns
   */
  calibrateUser(userId: string, recentActivity: {
    sessionsLast24h: number;
    avgSessionLength: number;
    patternHits: number;
    patternMisses: number;
  }): void {
    const profile = this.getOrCreateProfile(userId);

    // Activity factor: more active users = slower decay
    const activityScore = Math.min(recentActivity.sessionsLast24h / 10, 1);
    profile.activityFactor = 0.5 + (activityScore * 0.5);

    // Hit/miss ratio affects base λ
    const hitRate = recentActivity.patternHits /
      (recentActivity.patternHits + recentActivity.patternMisses + 1);

    // High hit rate = patterns are useful, decay slower
    // Low hit rate = patterns are stale, decay faster
    const λAdjustment = 1.5 - hitRate; // 0.5 to 1.5 multiplier

    profile.baseλ = Math.max(
      this.config.minλ!,
      Math.min(this.config.maxλ!, profile.baseλ * λAdjustment)
    );

    profile.lastCalibration = Date.now();
  }

  /**
   * Calculate current weight with adaptive decay
   */
  calculateWeight(entry: PatternEntry, userId: string): number {
    const profile = this.getOrCreateProfile(userId);
    const now = Date.now();

    // Time since last access in hours
    const hoursSinceAccess = (now - entry.lastAccessed) / 3600000;

    // Get effective λ for this pattern type
    const typeMultiplier = profile.typeMultipliers[entry.type];
    const effectiveλ = (entry.decayRate ?? profile.baseλ) *
      typeMultiplier *
      profile.activityFactor;

    // Exponential decay: w(t) = w₀ * e^(-λt)
    const decayedWeight = entry.weight * Math.exp(-effectiveλ * hoursSinceAccess);

    // Access frequency boost (recency + frequency)
    const frequencyBoost = Math.log(entry.accessCount + 1) / 10;

    return Math.min(1, decayedWeight + frequencyBoost);
  }

  /**
   * Prune patterns below threshold
   */
  prunePatterns(userId: string, threshold = 0.01): PatternEntry[] {
    const userPatterns = this.patterns.get(userId) ?? [];
    const pruned: PatternEntry[] = [];

    const remaining = userPatterns.filter(entry => {
      const weight = this.calculateWeight(entry, userId);
      if (weight < threshold) {
        pruned.push(entry);
        return false;
      }
      return true;
    });

    this.patterns.set(userId, remaining);
    return pruned;
  }

  /**
   * Access pattern (updates recency + count)
   */
  accessPattern(userId: string, patternId: string): void {
    const userPatterns = this.patterns.get(userId) ?? [];
    const pattern = userPatterns.find(p => p.id === patternId);
    if (pattern) {
      pattern.lastAccessed = Date.now();
      pattern.accessCount++;
    }
  }

  /**
   * Add new pattern
   */
  addPattern(userId: string, entry: Omit<PatternEntry, 'createdAt' | 'lastAccessed' | 'accessCount'>): void {
    if (!this.patterns.has(userId)) {
      this.patterns.set(userId, []);
    }
    this.patterns.get(userId)!.push({
      ...entry,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
    });
  }

  getDecayStats(userId: string): {
    profile: UserDecayProfile;
    patternCount: number;
    avgWeight: number;
    byType: Record<PatternType, number>;
  } {
    const profile = this.getOrCreateProfile(userId);
    const patterns = this.patterns.get(userId) ?? [];

    const byType: Record<PatternType, number> = {
      knowledge: 0, lexicon: 0, behavior: 0, preference: 0, context: 0
    };

    let totalWeight = 0;
    for (const p of patterns) {
      const w = this.calculateWeight(p, userId);
      totalWeight += w;
      byType[p.type]++;
    }

    return {
      profile,
      patternCount: patterns.length,
      avgWeight: patterns.length > 0 ? totalWeight / patterns.length : 0,
      byType,
    };
  }
}
