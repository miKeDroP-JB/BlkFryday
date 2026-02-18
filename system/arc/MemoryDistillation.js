/**
 * MemoryDistillation.js
 * V3.5 – Memory Distillation
 * ═══════════════════════════════════════════════════════════════════
 * Auto-stores successful strategies with pattern fingerprints for
 * instant recall on similar tasks.
 *
 * Features:
 * • Task fingerprinting for pattern matching
 * • Strategy distillation and compression
 * • Similarity-based recall
 * • LRU eviction for memory management
 * • Confidence scoring based on usage history
 */

const fs = require('fs');
const path = require('path');
const { generateFingerprint, fingerprintSimilarity } = require('./TaskFingerprint');

class MemoryDistillation {
  constructor(options = {}) {
    this.memoryPath = options.memoryPath || path.join(__dirname, '../solver/memory_v3');
    this.distilledPath = path.join(this.memoryPath, 'distilled.json');
    this.maxEntries = options.maxEntries || 500;
    this.similarityThreshold = options.similarityThreshold || 0.75;
    this.verbose = options.verbose || false;

    // In-memory cache
    this.cache = new Map();
    this.distilled = [];

    // Load existing distilled memory
    this._loadDistilled();
  }

  /**
   * Load distilled memory from disk
   * @private
   */
  _loadDistilled() {
    try {
      if (fs.existsSync(this.distilledPath)) {
        const data = fs.readFileSync(this.distilledPath, 'utf8');
        this.distilled = JSON.parse(data);
        if (this.verbose) {
          console.log(`[MemoryDistillation] Loaded ${this.distilled.length} distilled strategies`);
        }
      }
    } catch (e) {
      this.distilled = [];
      if (this.verbose) {
        console.log(`[MemoryDistillation] Starting with empty distilled memory`);
      }
    }
  }

  /**
   * Save distilled memory to disk
   * @private
   */
  _saveDistilled() {
    try {
      // Ensure directory exists
      if (!fs.existsSync(this.memoryPath)) {
        fs.mkdirSync(this.memoryPath, { recursive: true });
      }

      // Sort by score before saving (best strategies first)
      this.distilled.sort((a, b) => b.score - a.score);

      // Evict if over limit
      if (this.distilled.length > this.maxEntries) {
        this.distilled = this.distilled.slice(0, this.maxEntries);
      }

      fs.writeFileSync(this.distilledPath, JSON.stringify(this.distilled, null, 2));

      if (this.verbose) {
        console.log(`[MemoryDistillation] Saved ${this.distilled.length} distilled strategies`);
      }
    } catch (e) {
      console.error(`[MemoryDistillation] Error saving: ${e.message}`);
    }
  }

  /**
   * Distill and store a successful strategy
   * @param {Object} params
   * @param {string} params.taskId - Task identifier
   * @param {Array} params.trainPairs - Training pairs used
   * @param {Object} params.strategy - Successful strategy
   * @param {string} params.source - Where solution came from (beast, composite, etc)
   * @param {number} params.solveTime - Time to solve in ms
   */
  distill({ taskId, trainPairs, strategy, source, solveTime }) {
    // Generate fingerprint for this task
    const fingerprint = generateFingerprint(trainPairs);

    // Extract strategy essence
    const essence = this._extractEssence(strategy);

    // Check if we already have this fingerprint
    const existingIdx = this.distilled.findIndex(d => d.fingerprint.hash === fingerprint.hash);

    if (existingIdx >= 0) {
      // Update existing entry
      const existing = this.distilled[existingIdx];
      existing.hitCount = (existing.hitCount || 1) + 1;
      existing.lastUsed = Date.now();
      existing.score = this._calculateScore(existing);

      if (this.verbose) {
        console.log(`[MemoryDistillation] Updated existing entry: ${fingerprint.hash} (hits: ${existing.hitCount})`);
      }
    } else {
      // Create new distilled entry
      const entry = {
        taskId,
        fingerprint,
        essence,
        source,
        solveTime,
        hitCount: 1,
        successCount: 1,
        failCount: 0,
        created: Date.now(),
        lastUsed: Date.now(),
        score: 1.0
      };

      this.distilled.push(entry);

      if (this.verbose) {
        console.log(`[MemoryDistillation] Distilled new strategy: ${fingerprint.hash} (${source})`);
      }
    }

    // Save to disk
    this._saveDistilled();

    // Update cache
    this.cache.set(fingerprint.hash, this.distilled.find(d => d.fingerprint.hash === fingerprint.hash));

    return fingerprint;
  }

  /**
   * Extract the essential parts of a strategy for storage
   * @private
   */
  _extractEssence(strategy) {
    const essence = {
      name: strategy.name || 'unknown',
      hierarchy: strategy.hierarchy || 'unknown',
      type: 'unknown'
    };

    // Detect strategy type and extract key info
    if (strategy.chainSteps) {
      essence.type = 'composite';
      essence.chain = strategy.chainSteps;
    } else if (strategy.name?.startsWith('beast:')) {
      essence.type = 'beast';
      essence.transform = strategy.name.replace('beast:', '');
    } else if (strategy.name?.startsWith('composite:')) {
      essence.type = 'composite';
      essence.chain = strategy.name.replace('composite:', '').split('_');
    } else {
      essence.type = strategy.hierarchy || 'general';
    }

    return essence;
  }

  /**
   * Calculate score for ranking
   * @private
   */
  _calculateScore(entry) {
    const hitWeight = Math.log2(entry.hitCount + 1);
    const successRate = entry.successCount / Math.max(1, entry.successCount + entry.failCount);
    const recency = 1 / (1 + (Date.now() - entry.lastUsed) / (1000 * 60 * 60 * 24)); // Decay over days

    return (hitWeight * 0.4) + (successRate * 0.4) + (recency * 0.2);
  }

  /**
   * Recall strategies for a new task based on fingerprint similarity
   * @param {Array} trainPairs - Training pairs of new task
   * @returns {Array} - Matching distilled strategies, sorted by relevance
   */
  recall(trainPairs) {
    const queryFingerprint = generateFingerprint(trainPairs);
    const matches = [];

    // Check cache first
    if (this.cache.has(queryFingerprint.hash)) {
      const cached = this.cache.get(queryFingerprint.hash);
      matches.push({ ...cached, similarity: 1.0 });
    }

    // Search distilled memory
    for (const entry of this.distilled) {
      // Skip if already in cache match
      if (entry.fingerprint.hash === queryFingerprint.hash) continue;

      const similarity = fingerprintSimilarity(queryFingerprint, entry.fingerprint);

      if (similarity >= this.similarityThreshold) {
        matches.push({
          ...entry,
          similarity
        });
      }
    }

    // Sort by combined score (similarity * entry score)
    matches.sort((a, b) => {
      const scoreA = a.similarity * a.score;
      const scoreB = b.similarity * b.score;
      return scoreB - scoreA;
    });

    if (this.verbose && matches.length > 0) {
      console.log(`[MemoryDistillation] Found ${matches.length} matching strategies for ${queryFingerprint.hash}`);
    }

    return matches;
  }

  /**
   * Get the best matching strategy for a task
   * @param {Array} trainPairs - Training pairs
   * @returns {Object|null} - Best matching strategy essence or null
   */
  recallBest(trainPairs) {
    const matches = this.recall(trainPairs);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Record success/failure for a recalled strategy
   * @param {string} fingerprintHash - Fingerprint hash
   * @param {boolean} success - Whether it worked
   */
  recordOutcome(fingerprintHash, success) {
    const entry = this.distilled.find(d => d.fingerprint.hash === fingerprintHash);
    if (entry) {
      if (success) {
        entry.successCount = (entry.successCount || 0) + 1;
      } else {
        entry.failCount = (entry.failCount || 0) + 1;
      }
      entry.score = this._calculateScore(entry);
      this._saveDistilled();
    }
  }

  /**
   * Get statistics about distilled memory
   * @returns {Object} - Stats
   */
  getStats() {
    const byType = {};
    const bySource = {};

    for (const entry of this.distilled) {
      const type = entry.essence?.type || 'unknown';
      const source = entry.source || 'unknown';

      byType[type] = (byType[type] || 0) + 1;
      bySource[source] = (bySource[source] || 0) + 1;
    }

    return {
      totalEntries: this.distilled.length,
      byType,
      bySource,
      cacheSize: this.cache.size
    };
  }

  /**
   * Clear all distilled memory
   */
  clear() {
    this.distilled = [];
    this.cache.clear();
    this._saveDistilled();
  }

  /**
   * Export distilled memory for analysis
   * @returns {Array} - Copy of distilled entries
   */
  export() {
    return JSON.parse(JSON.stringify(this.distilled));
  }
}

module.exports = { MemoryDistillation };
