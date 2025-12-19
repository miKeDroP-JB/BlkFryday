/**
 * INTELLIGENT CACHE LAYER
 * Smart caching for AI responses with semantic similarity
 *
 * "The fastest API call is the one you don't make" - Cache Philosophy
 *
 * Features:
 * - Exact match caching
 * - Semantic similarity matching
 * - TTL-based expiration
 * - LRU eviction
 * - Cache warming
 * - Statistics tracking
 */

const crypto = require('crypto');

// Cache configuration
const CACHE_CONFIG = {
  MAX_SIZE: 10000,           // Maximum cache entries
  DEFAULT_TTL: 3600000,      // 1 hour in ms
  SEMANTIC_THRESHOLD: 0.85,  // Similarity threshold for semantic matches
  CLEANUP_INTERVAL: 300000,  // 5 minutes
  MAX_RESPONSE_SIZE: 100000  // Max response size to cache (100KB)
};

/**
 * Simple hash function for cache keys
 */
function hashKey(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Levenshtein distance for string similarity
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate string similarity (0-1)
 */
function stringSimilarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Tokenize text for semantic comparison
 */
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

/**
 * Jaccard similarity for token sets
 */
function jaccardSimilarity(tokens1, tokens2) {
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

/**
 * Cache Entry
 */
class CacheEntry {
  constructor(key, value, options = {}) {
    this.key = key;
    this.value = value;
    this.hash = hashKey(key);
    this.tokens = tokenize(key);
    this.createdAt = Date.now();
    this.lastAccessedAt = Date.now();
    this.accessCount = 0;
    this.ttl = options.ttl || CACHE_CONFIG.DEFAULT_TTL;
    this.metadata = options.metadata || {};
  }

  isExpired() {
    return Date.now() > this.createdAt + this.ttl;
  }

  access() {
    this.lastAccessedAt = Date.now();
    this.accessCount++;
    return this.value;
  }
}

/**
 * LRU Cache with semantic matching
 */
class SemanticCache {
  constructor(config = {}) {
    this.maxSize = config.maxSize || CACHE_CONFIG.MAX_SIZE;
    this.defaultTTL = config.defaultTTL || CACHE_CONFIG.DEFAULT_TTL;
    this.semanticThreshold = config.semanticThreshold || CACHE_CONFIG.SEMANTIC_THRESHOLD;

    // Storage
    this.cache = new Map();
    this.keyIndex = new Map(); // hash -> key for quick lookup

    // Stats
    this.stats = {
      hits: 0,
      misses: 0,
      semanticHits: 0,
      evictions: 0,
      totalSaved: 0 // Estimated time saved in ms
    };

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), CACHE_CONFIG.CLEANUP_INTERVAL);
  }

  /**
   * Set a cache entry
   */
  set(key, value, options = {}) {
    // Check size limit
    if (value && JSON.stringify(value).length > CACHE_CONFIG.MAX_RESPONSE_SIZE) {
      return false; // Don't cache oversized responses
    }

    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry = new CacheEntry(key, value, {
      ttl: options.ttl || this.defaultTTL,
      metadata: options.metadata
    });

    this.cache.set(key, entry);
    this.keyIndex.set(entry.hash, key);

    return true;
  }

  /**
   * Get exact match
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.isExpired()) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    this.stats.totalSaved += entry.metadata.latency || 1000;
    return entry.access();
  }

  /**
   * Get with semantic matching
   */
  getSemanticMatch(key, threshold = this.semanticThreshold) {
    // First try exact match
    const exact = this.get(key);
    if (exact) return { value: exact, matchType: 'exact', similarity: 1 };

    // Try semantic matching
    const queryTokens = tokenize(key);
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const [cachedKey, entry] of this.cache) {
      if (entry.isExpired()) continue;

      // Quick string similarity check first
      const stringSim = stringSimilarity(key.substring(0, 100), cachedKey.substring(0, 100));
      if (stringSim < 0.5) continue; // Skip if clearly different

      // Full semantic similarity
      const similarity = jaccardSimilarity(queryTokens, entry.tokens);

      if (similarity > bestSimilarity && similarity >= threshold) {
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }

    if (bestMatch) {
      this.stats.semanticHits++;
      this.stats.totalSaved += bestMatch.metadata.latency || 1000;
      return {
        value: bestMatch.access(),
        matchType: 'semantic',
        similarity: bestSimilarity,
        originalKey: bestMatch.key
      };
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Check if key exists (without accessing)
   */
  has(key) {
    const entry = this.cache.get(key);
    return entry && !entry.isExpired();
  }

  /**
   * Delete entry
   */
  delete(key) {
    const entry = this.cache.get(key);
    if (entry) {
      this.keyIndex.delete(entry.hash);
      this.cache.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let oldest = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldest = key;
      }
    }

    if (oldest) {
      this.delete(oldest);
      this.stats.evictions++;
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    for (const [key, entry] of this.cache) {
      if (entry.isExpired()) {
        this.delete(key);
      }
    }
  }

  /**
   * Clear all entries
   */
  clear() {
    this.cache.clear();
    this.keyIndex.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.semanticHits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0 ? ((this.stats.hits + this.stats.semanticHits) / totalRequests * 100).toFixed(1) + '%' : '0%',
      exactHitRate: totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(1) + '%' : '0%',
      semanticHitRate: totalRequests > 0 ? (this.stats.semanticHits / totalRequests * 100).toFixed(1) + '%' : '0%',
      estimatedTimeSaved: `${(this.stats.totalSaved / 1000).toFixed(1)}s`
    };
  }

  /**
   * Warm cache with common queries
   */
  async warmCache(queries, executor) {
    const results = [];
    for (const query of queries) {
      if (!this.has(query)) {
        try {
          const result = await executor(query);
          this.set(query, result, { metadata: { warmed: true } });
          results.push({ query, status: 'warmed' });
        } catch (error) {
          results.push({ query, status: 'error', error: error.message });
        }
      } else {
        results.push({ query, status: 'already_cached' });
      }
    }
    return results;
  }

  /**
   * Destroy cache (cleanup interval)
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

/**
 * Cached AI Client wrapper
 */
class CachedAIClient {
  constructor(client, cacheConfig = {}) {
    this.client = client;
    this.cache = new SemanticCache(cacheConfig);
    this.enableSemanticMatching = cacheConfig.enableSemanticMatching !== false;
  }

  /**
   * Make cached AI call
   */
  async call(provider, model, messages, options = {}) {
    // Create cache key from messages
    const cacheKey = this.createCacheKey(provider, model, messages, options);

    // Try cache first
    if (this.enableSemanticMatching) {
      const cached = this.cache.getSemanticMatch(cacheKey);
      if (cached) {
        return {
          ...cached.value,
          fromCache: true,
          cacheMatchType: cached.matchType,
          cacheSimilarity: cached.similarity
        };
      }
    } else {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true, cacheMatchType: 'exact' };
      }
    }

    // Make actual call
    const startTime = Date.now();
    const result = await this.client.call(provider, model, messages, options);
    const latency = Date.now() - startTime;

    // Cache successful results
    if (result.success) {
      this.cache.set(cacheKey, result, {
        metadata: { latency, provider, model }
      });
    }

    return { ...result, fromCache: false };
  }

  /**
   * Create consistent cache key
   */
  createCacheKey(provider, model, messages, options) {
    // Only use the user message content for caching (ignore system prompts for similarity)
    const userContent = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n');

    return `${provider}:${model}:${userContent}`;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Warm cache
   */
  async warmCache(queries, provider, model) {
    return this.cache.warmCache(queries, async (query) => {
      const messages = [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: query }
      ];
      return this.client.call(provider, model, messages, {});
    });
  }
}

module.exports = {
  CACHE_CONFIG,
  hashKey,
  stringSimilarity,
  jaccardSimilarity,
  tokenize,
  CacheEntry,
  SemanticCache,
  CachedAIClient
};
