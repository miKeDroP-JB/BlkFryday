/**
 * CROSS-SWARM MEMORY SYSTEM
 * Agents share learnings across swarms for collective intelligence
 *
 * "Knowledge shared is knowledge multiplied" - Swarm Memory Philosophy
 *
 * Features:
 * - Shared knowledge base across all swarms
 * - Pattern propagation between swarms
 * - Collective learning from all executions
 * - Memory consolidation and pruning
 */

// Memory types
const MEMORY_TYPES = {
  FACT: 'fact',           // Learned facts
  PATTERN: 'pattern',     // Recognized patterns
  SOLUTION: 'solution',   // Problem-solution pairs
  PREFERENCE: 'preference', // User preferences
  CONTEXT: 'context',     // Session context
  SKILL: 'skill'          // Learned skills/approaches
};

// Memory priority levels
const PRIORITY = {
  CRITICAL: 10,    // Must remember (user corrections, key facts)
  HIGH: 7,         // Important (successful solutions)
  MEDIUM: 5,       // Useful (patterns, preferences)
  LOW: 3,          // Nice to have (context)
  EPHEMERAL: 1     // Temporary (session-specific)
};

/**
 * Memory Entry
 * A single piece of shared memory
 */
class MemoryEntry {
  constructor(data) {
    this.id = data.id || Math.random().toString(36).substr(2, 12);
    this.type = data.type || MEMORY_TYPES.FACT;
    this.content = data.content;
    this.metadata = {
      sourceSwarm: data.sourceSwarm,
      sourceAgent: data.sourceAgent,
      taskContext: data.taskContext,
      confidence: data.confidence || 0.8,
      ...data.metadata
    };
    this.priority = data.priority || PRIORITY.MEDIUM;
    this.accessCount = 0;
    this.usefulness = 0; // Updated based on usage
    this.createdAt = Date.now();
    this.lastAccessedAt = Date.now();
    this.expiresAt = data.expiresAt || null; // null = never expires
    this.associations = data.associations || []; // Related memory IDs
  }

  access() {
    this.accessCount++;
    this.lastAccessedAt = Date.now();
    return this;
  }

  markUseful(score = 1) {
    this.usefulness += score;
    this.priority = Math.min(PRIORITY.CRITICAL, this.priority + 0.1);
  }

  isExpired() {
    return this.expiresAt && Date.now() > this.expiresAt;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      content: this.content,
      metadata: this.metadata,
      priority: this.priority,
      accessCount: this.accessCount,
      usefulness: this.usefulness,
      createdAt: this.createdAt,
      lastAccessedAt: this.lastAccessedAt
    };
  }
}

/**
 * Swarm Memory Store
 * The shared memory store for all swarms
 */
class SwarmMemoryStore {
  constructor(config = {}) {
    this.memories = new Map();
    this.indices = {
      byType: new Map(),
      bySwarm: new Map(),
      byKeyword: new Map()
    };
    this.maxSize = config.maxSize || 10000;
    this.consolidationInterval = config.consolidationInterval || 60000;
    this.stats = {
      totalMemories: 0,
      hits: 0,
      misses: 0,
      consolidations: 0
    };

    // Start consolidation timer
    this.consolidationTimer = setInterval(
      () => this.consolidate(),
      this.consolidationInterval
    );
  }

  /**
   * Store a new memory
   */
  store(data) {
    const entry = new MemoryEntry(data);

    // Check capacity
    if (this.memories.size >= this.maxSize) {
      this.evictLowestPriority();
    }

    // Store
    this.memories.set(entry.id, entry);

    // Update indices
    this.indexMemory(entry);

    this.stats.totalMemories = this.memories.size;

    return entry.id;
  }

  /**
   * Index memory for fast retrieval
   */
  indexMemory(entry) {
    // By type
    if (!this.indices.byType.has(entry.type)) {
      this.indices.byType.set(entry.type, new Set());
    }
    this.indices.byType.get(entry.type).add(entry.id);

    // By source swarm
    if (entry.metadata.sourceSwarm) {
      if (!this.indices.bySwarm.has(entry.metadata.sourceSwarm)) {
        this.indices.bySwarm.set(entry.metadata.sourceSwarm, new Set());
      }
      this.indices.bySwarm.get(entry.metadata.sourceSwarm).add(entry.id);
    }

    // By keywords
    const keywords = this.extractKeywords(entry.content);
    for (const keyword of keywords) {
      if (!this.indices.byKeyword.has(keyword)) {
        this.indices.byKeyword.set(keyword, new Set());
      }
      this.indices.byKeyword.get(keyword).add(entry.id);
    }
  }

  /**
   * Extract keywords from content
   */
  extractKeywords(content) {
    if (typeof content !== 'string') {
      content = JSON.stringify(content);
    }
    return content.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 20);
  }

  /**
   * Retrieve memories by query
   */
  retrieve(query, options = {}) {
    const {
      type = null,
      swarm = null,
      limit = 10,
      minPriority = PRIORITY.LOW
    } = options;

    let candidateIds = new Set();

    // Filter by type
    if (type && this.indices.byType.has(type)) {
      candidateIds = new Set(this.indices.byType.get(type));
    } else {
      candidateIds = new Set(this.memories.keys());
    }

    // Filter by swarm if specified
    if (swarm && this.indices.bySwarm.has(swarm)) {
      const swarmIds = this.indices.bySwarm.get(swarm);
      candidateIds = new Set([...candidateIds].filter(id => swarmIds.has(id)));
    }

    // Search by keywords
    const queryKeywords = this.extractKeywords(query);
    const keywordMatches = new Map();

    for (const keyword of queryKeywords) {
      if (this.indices.byKeyword.has(keyword)) {
        for (const id of this.indices.byKeyword.get(keyword)) {
          if (candidateIds.has(id)) {
            keywordMatches.set(id, (keywordMatches.get(id) || 0) + 1);
          }
        }
      }
    }

    // Score and rank
    const results = [];
    for (const [id, matchCount] of keywordMatches) {
      const entry = this.memories.get(id);
      if (!entry || entry.isExpired() || entry.priority < minPriority) continue;

      const relevanceScore = matchCount / queryKeywords.length;
      const priorityScore = entry.priority / PRIORITY.CRITICAL;
      const usefulnessScore = Math.min(1, entry.usefulness / 10);

      const totalScore = relevanceScore * 0.5 + priorityScore * 0.3 + usefulnessScore * 0.2;

      results.push({
        entry: entry.access(),
        score: totalScore,
        matchCount
      });
    }

    // Sort and limit
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, limit);

    if (topResults.length > 0) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    return topResults.map(r => ({
      memory: r.entry.toJSON(),
      relevance: r.score
    }));
  }

  /**
   * Get memory by ID
   */
  get(id) {
    const entry = this.memories.get(id);
    if (entry && !entry.isExpired()) {
      return entry.access();
    }
    return null;
  }

  /**
   * Mark memory as useful (positive feedback)
   */
  markUseful(id, score = 1) {
    const entry = this.memories.get(id);
    if (entry) {
      entry.markUseful(score);
    }
  }

  /**
   * Associate two memories
   */
  associate(id1, id2) {
    const entry1 = this.memories.get(id1);
    const entry2 = this.memories.get(id2);

    if (entry1 && entry2) {
      if (!entry1.associations.includes(id2)) {
        entry1.associations.push(id2);
      }
      if (!entry2.associations.includes(id1)) {
        entry2.associations.push(id1);
      }
    }
  }

  /**
   * Get associated memories
   */
  getAssociated(id, limit = 5) {
    const entry = this.memories.get(id);
    if (!entry) return [];

    return entry.associations
      .slice(0, limit)
      .map(assocId => this.memories.get(assocId))
      .filter(e => e && !e.isExpired())
      .map(e => e.toJSON());
  }

  /**
   * Evict lowest priority memory
   */
  evictLowestPriority() {
    let lowest = null;
    let lowestScore = Infinity;

    for (const [id, entry] of this.memories) {
      // Score based on priority, usefulness, and recency
      const recency = (Date.now() - entry.lastAccessedAt) / (1000 * 60 * 60); // hours
      const score = entry.priority + entry.usefulness - (recency * 0.1);

      if (score < lowestScore) {
        lowestScore = score;
        lowest = id;
      }
    }

    if (lowest) {
      this.remove(lowest);
    }
  }

  /**
   * Remove memory
   */
  remove(id) {
    const entry = this.memories.get(id);
    if (!entry) return;

    // Remove from indices
    this.indices.byType.get(entry.type)?.delete(id);
    this.indices.bySwarm.get(entry.metadata.sourceSwarm)?.delete(id);

    const keywords = this.extractKeywords(entry.content);
    for (const keyword of keywords) {
      this.indices.byKeyword.get(keyword)?.delete(id);
    }

    // Remove from store
    this.memories.delete(id);
    this.stats.totalMemories = this.memories.size;
  }

  /**
   * Consolidate memories (merge similar, prune expired)
   */
  consolidate() {
    this.stats.consolidations++;

    // Remove expired
    for (const [id, entry] of this.memories) {
      if (entry.isExpired()) {
        this.remove(id);
      }
    }

    // Merge similar memories (simplified)
    // In production, this would use embedding similarity
    const byType = new Map();
    for (const [id, entry] of this.memories) {
      if (!byType.has(entry.type)) {
        byType.set(entry.type, []);
      }
      byType.get(entry.type).push(entry);
    }

    // Prune low-value memories if still over capacity
    while (this.memories.size > this.maxSize * 0.9) {
      this.evictLowestPriority();
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: (this.stats.hits + this.stats.misses) > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1) + '%'
        : '0%',
      memoryTypes: Object.fromEntries(
        [...this.indices.byType.entries()].map(([type, ids]) => [type, ids.size])
      ),
      swarmContributions: Object.fromEntries(
        [...this.indices.bySwarm.entries()].map(([swarm, ids]) => [swarm, ids.size])
      )
    };
  }

  /**
   * Shutdown
   */
  shutdown() {
    if (this.consolidationTimer) {
      clearInterval(this.consolidationTimer);
    }
  }
}

/**
 * Swarm Memory Interface
 * Interface for swarms to interact with shared memory
 */
class SwarmMemoryInterface {
  constructor(swarmId, store) {
    this.swarmId = swarmId;
    this.store = store;
  }

  /**
   * Remember something
   */
  remember(content, options = {}) {
    return this.store.store({
      type: options.type || MEMORY_TYPES.FACT,
      content,
      sourceSwarm: this.swarmId,
      sourceAgent: options.agentId,
      taskContext: options.taskContext,
      confidence: options.confidence,
      priority: options.priority,
      expiresAt: options.ttl ? Date.now() + options.ttl : null,
      metadata: options.metadata
    });
  }

  /**
   * Recall relevant memories
   */
  recall(query, options = {}) {
    return this.store.retrieve(query, {
      ...options,
      swarm: options.ownSwarmOnly ? this.swarmId : null
    });
  }

  /**
   * Learn a pattern
   */
  learnPattern(pattern, context) {
    return this.remember(pattern, {
      type: MEMORY_TYPES.PATTERN,
      taskContext: context,
      priority: PRIORITY.MEDIUM
    });
  }

  /**
   * Store a solution
   */
  storeSolution(problem, solution, quality) {
    return this.remember({ problem, solution, quality }, {
      type: MEMORY_TYPES.SOLUTION,
      priority: quality > 0.8 ? PRIORITY.HIGH : PRIORITY.MEDIUM
    });
  }

  /**
   * Get solutions for similar problems
   */
  getSolutions(problem, limit = 5) {
    return this.store.retrieve(problem, {
      type: MEMORY_TYPES.SOLUTION,
      limit
    });
  }

  /**
   * Mark memory as helpful
   */
  markHelpful(memoryId) {
    this.store.markUseful(memoryId);
  }
}

/**
 * Collective Intelligence Coordinator
 * Coordinates learning across all swarms
 */
class CollectiveIntelligence {
  constructor() {
    this.store = new SwarmMemoryStore();
    this.interfaces = new Map();
    this.learningEvents = [];
  }

  /**
   * Create interface for a swarm
   */
  createInterface(swarmId) {
    if (!this.interfaces.has(swarmId)) {
      this.interfaces.set(swarmId, new SwarmMemoryInterface(swarmId, this.store));
    }
    return this.interfaces.get(swarmId);
  }

  /**
   * Broadcast learning to all swarms
   */
  broadcastLearning(learning) {
    this.learningEvents.push({
      ...learning,
      timestamp: Date.now()
    });

    // Store as high-priority memory
    this.store.store({
      type: MEMORY_TYPES.SKILL,
      content: learning,
      priority: PRIORITY.HIGH,
      sourceSwarm: learning.sourceSwarm
    });
  }

  /**
   * Get collective knowledge summary
   */
  getKnowledgeSummary() {
    return {
      totalMemories: this.store.stats.totalMemories,
      swarmContributions: this.store.getStats().swarmContributions,
      recentLearnings: this.learningEvents.slice(-20),
      memoryStats: this.store.getStats()
    };
  }

  /**
   * Shutdown
   */
  shutdown() {
    this.store.shutdown();
  }
}

module.exports = {
  MEMORY_TYPES,
  PRIORITY,
  MemoryEntry,
  SwarmMemoryStore,
  SwarmMemoryInterface,
  CollectiveIntelligence
};
