/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    QUANTUM STORAGE - PERSISTENCE LAYER                        ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  "Data exists in superposition until observed."                              ║
 * ║                                                                              ║
 * ║  Features:                                                                   ║
 * ║  • Multi-dimensional state persistence                                       ║
 * ║  • Temporal versioning (time travel through states)                          ║
 * ║  • Quantum caching (probabilistic retrieval)                                 ║
 * ║  • Cross-reality sync (parallel universe data merge)                         ║
 * ║  • Memory crystallization (long-term pattern storage)                        ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// STORAGE DIMENSIONS - Different storage layers
// ═══════════════════════════════════════════════════════════════

const STORAGE_DIMENSIONS = {
  EPHEMERAL: {
    name: 'Ephemeral',
    description: 'Temporary, session-only storage',
    persistence: 'none',
    ttl: 0
  },
  VOLATILE: {
    name: 'Volatile',
    description: 'In-memory, fast access',
    persistence: 'memory',
    ttl: 3600000 // 1 hour
  },
  CRYSTALLINE: {
    name: 'Crystalline',
    description: 'Persistent, disk-based',
    persistence: 'disk',
    ttl: -1 // Permanent
  },
  QUANTUM: {
    name: 'Quantum',
    description: 'Superposition storage - exists in all states',
    persistence: 'quantum',
    ttl: -1
  },
  ETERNAL: {
    name: 'Eternal',
    description: 'Immutable, permanent record',
    persistence: 'eternal',
    ttl: -1
  }
};

// ═══════════════════════════════════════════════════════════════
// QUANTUM STATE - Data exists in multiple states
// ═══════════════════════════════════════════════════════════════

class QuantumState {
  constructor(key, initialValue = null) {
    this.key = key;
    this.states = new Map(); // Multiple parallel values
    this.timeline = []; // Temporal versions
    this.collapsed = false;
    this.observedValue = null;
    this.metadata = {
      created: Date.now(),
      lastModified: Date.now(),
      observations: 0,
      mutations: 0
    };

    if (initialValue !== null) {
      this.superpose('primary', initialValue);
    }
  }

  /**
   * Add a value to superposition
   */
  superpose(stateId, value, probability = 1.0) {
    this.states.set(stateId, {
      value,
      probability,
      timestamp: Date.now()
    });
    this.collapsed = false;
    this.metadata.mutations++;
    this.metadata.lastModified = Date.now();

    // Add to timeline
    this.timeline.push({
      action: 'superpose',
      stateId,
      value: this.hashValue(value),
      timestamp: Date.now()
    });
  }

  /**
   * Observe (collapse) the quantum state
   */
  observe(strategy = 'highest_probability') {
    if (this.states.size === 0) {
      return null;
    }

    this.metadata.observations++;

    switch (strategy) {
      case 'highest_probability':
        this.observedValue = this.collapseByProbability();
        break;
      case 'latest':
        this.observedValue = this.collapseByTime();
        break;
      case 'random':
        this.observedValue = this.collapseRandom();
        break;
      case 'merge':
        this.observedValue = this.collapseMerge();
        break;
      default:
        this.observedValue = this.collapseByProbability();
    }

    this.collapsed = true;
    this.timeline.push({
      action: 'observe',
      strategy,
      result: this.hashValue(this.observedValue),
      timestamp: Date.now()
    });

    return this.observedValue;
  }

  collapseByProbability() {
    let highest = null;
    let highestProb = -1;
    for (const [id, state] of this.states) {
      if (state.probability > highestProb) {
        highestProb = state.probability;
        highest = state.value;
      }
    }
    return highest;
  }

  collapseByTime() {
    let latest = null;
    let latestTime = 0;
    for (const [id, state] of this.states) {
      if (state.timestamp > latestTime) {
        latestTime = state.timestamp;
        latest = state.value;
      }
    }
    return latest;
  }

  collapseRandom() {
    const states = Array.from(this.states.values());
    const idx = Math.floor(Math.random() * states.length);
    return states[idx].value;
  }

  collapseMerge() {
    const values = Array.from(this.states.values()).map(s => s.value);
    if (values.length === 0) return null;
    if (typeof values[0] === 'object' && !Array.isArray(values[0])) {
      return values.reduce((merged, val) => ({ ...merged, ...val }), {});
    }
    return values[values.length - 1];
  }

  /**
   * Time travel to previous state
   */
  timeTravel(timestamp) {
    const pastStates = this.timeline
      .filter(t => t.timestamp <= timestamp && t.action === 'superpose');

    if (pastStates.length === 0) return null;

    const latest = pastStates[pastStates.length - 1];
    return { stateId: latest.stateId, timestamp: latest.timestamp };
  }

  hashValue(value) {
    return crypto.createHash('md5')
      .update(JSON.stringify(value))
      .digest('hex')
      .substring(0, 8);
  }

  getStateCount() {
    return this.states.size;
  }

  getTimeline() {
    return this.timeline;
  }
}

// ═══════════════════════════════════════════════════════════════
// MEMORY CRYSTAL - Long-term pattern storage
// ═══════════════════════════════════════════════════════════════

class MemoryCrystal {
  constructor(id) {
    this.id = id;
    this.patterns = new Map();
    this.associations = new Map();
    this.strength = 1.0;
    this.created = Date.now();
    this.lastAccessed = Date.now();
    this.accessCount = 0;
  }

  /**
   * Store a pattern
   */
  crystallize(pattern, context = {}) {
    const patternId = this.hashPattern(pattern);
    const existing = this.patterns.get(patternId);

    if (existing) {
      existing.frequency++;
      existing.contexts.push(context);
      existing.lastSeen = Date.now();
    } else {
      this.patterns.set(patternId, {
        pattern,
        frequency: 1,
        contexts: [context],
        created: Date.now(),
        lastSeen: Date.now()
      });
    }

    this.lastAccessed = Date.now();
    this.accessCount++;

    return patternId;
  }

  /**
   * Recall a pattern
   */
  recall(query) {
    const queryHash = this.hashPattern(query);

    // Exact match
    if (this.patterns.has(queryHash)) {
      const pattern = this.patterns.get(queryHash);
      pattern.lastSeen = Date.now();
      return pattern;
    }

    // Fuzzy match (find similar patterns)
    const matches = [];
    for (const [id, pattern] of this.patterns) {
      const similarity = this.calculateSimilarity(query, pattern.pattern);
      if (similarity > 0.5) {
        matches.push({ ...pattern, similarity });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Associate patterns
   */
  associate(pattern1, pattern2, strength = 1.0) {
    const id1 = this.hashPattern(pattern1);
    const id2 = this.hashPattern(pattern2);
    const assocKey = `${id1}-${id2}`;

    this.associations.set(assocKey, {
      patterns: [id1, id2],
      strength,
      created: Date.now()
    });
  }

  /**
   * Get associated patterns
   */
  getAssociations(pattern) {
    const patternId = this.hashPattern(pattern);
    const associated = [];

    for (const [key, assoc] of this.associations) {
      if (assoc.patterns.includes(patternId)) {
        const otherId = assoc.patterns.find(id => id !== patternId);
        const otherPattern = this.patterns.get(otherId);
        if (otherPattern) {
          associated.push({ ...otherPattern, associationStrength: assoc.strength });
        }
      }
    }

    return associated;
  }

  hashPattern(pattern) {
    return crypto.createHash('md5')
      .update(JSON.stringify(pattern))
      .digest('hex');
  }

  calculateSimilarity(a, b) {
    const strA = JSON.stringify(a);
    const strB = JSON.stringify(b);
    const maxLen = Math.max(strA.length, strB.length);
    let matches = 0;

    for (let i = 0; i < Math.min(strA.length, strB.length); i++) {
      if (strA[i] === strB[i]) matches++;
    }

    return matches / maxLen;
  }

  getStats() {
    return {
      id: this.id,
      patterns: this.patterns.size,
      associations: this.associations.size,
      strength: this.strength,
      accessCount: this.accessCount,
      age: Date.now() - this.created
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// QUANTUM STORAGE ENGINE
// ═══════════════════════════════════════════════════════════════

class QuantumStorage extends EventEmitter {
  constructor(config = {}) {
    super();
    this.dimensions = STORAGE_DIMENSIONS;
    this.states = new Map(); // QuantumState instances
    this.crystals = new Map(); // MemoryCrystal instances
    this.volatile = new Map(); // In-memory cache
    this.config = {
      storagePath: config.storagePath || './data/quantum',
      maxVolatileSize: config.maxVolatileSize || 10000,
      autoPersist: config.autoPersist !== false,
      persistInterval: config.persistInterval || 60000
    };
    this.stats = {
      reads: 0,
      writes: 0,
      collapses: 0,
      crystallizations: 0
    };
    this.initialized = false;
  }

  /**
   * Initialize storage
   */
  async initialize() {
    console.log('[QUANTUM STORAGE] Initializing...');

    // Create storage directory
    try {
      await fs.mkdir(this.config.storagePath, { recursive: true });
    } catch (e) {
      // Directory may already exist
    }

    // Load persisted data
    await this.loadPersistedData();

    // Start auto-persist interval
    if (this.config.autoPersist) {
      this.persistInterval = setInterval(
        () => this.persistAll(),
        this.config.persistInterval
      );
    }

    this.initialized = true;
    this.emit('initialized');
    console.log('[QUANTUM STORAGE] Ready');

    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // QUANTUM OPERATIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Store data in quantum superposition
   */
  async quantumSet(key, value, options = {}) {
    const {
      dimension = 'VOLATILE',
      stateId = 'primary',
      probability = 1.0
    } = options;

    let state = this.states.get(key);
    if (!state) {
      state = new QuantumState(key);
      this.states.set(key, state);
    }

    state.superpose(stateId, value, probability);
    this.stats.writes++;

    // Also store in volatile cache for fast access
    this.volatile.set(key, value);

    this.emit('quantum:set', { key, stateId, dimension });

    return state;
  }

  /**
   * Retrieve data (collapse quantum state)
   */
  async quantumGet(key, options = {}) {
    const { strategy = 'highest_probability' } = options;

    // Check volatile cache first
    if (this.volatile.has(key)) {
      this.stats.reads++;
      return this.volatile.get(key);
    }

    // Check quantum states
    const state = this.states.get(key);
    if (state) {
      this.stats.reads++;
      this.stats.collapses++;
      return state.observe(strategy);
    }

    return null;
  }

  /**
   * Get state without collapsing
   */
  peek(key) {
    const state = this.states.get(key);
    if (!state) return null;

    return {
      key,
      stateCount: state.getStateCount(),
      collapsed: state.collapsed,
      observedValue: state.observedValue,
      metadata: state.metadata
    };
  }

  /**
   * Add parallel state
   */
  addParallelState(key, stateId, value, probability = 0.5) {
    let state = this.states.get(key);
    if (!state) {
      state = new QuantumState(key);
      this.states.set(key, state);
    }

    state.superpose(stateId, value, probability);
    return state;
  }

  /**
   * Merge parallel states
   */
  mergeStates(key) {
    const state = this.states.get(key);
    if (!state) return null;

    return state.observe('merge');
  }

  // ═══════════════════════════════════════════════════════════
  // CRYSTAL OPERATIONS (Long-term memory)
  // ═══════════════════════════════════════════════════════════

  /**
   * Crystallize a pattern for long-term storage
   */
  crystallize(crystalId, pattern, context = {}) {
    let crystal = this.crystals.get(crystalId);
    if (!crystal) {
      crystal = new MemoryCrystal(crystalId);
      this.crystals.set(crystalId, crystal);
    }

    const patternId = crystal.crystallize(pattern, context);
    this.stats.crystallizations++;

    this.emit('crystal:store', { crystalId, patternId });

    return patternId;
  }

  /**
   * Recall from crystal memory
   */
  recall(crystalId, query) {
    const crystal = this.crystals.get(crystalId);
    if (!crystal) return null;

    return crystal.recall(query);
  }

  /**
   * Get or create a crystal
   */
  getCrystal(crystalId) {
    if (!this.crystals.has(crystalId)) {
      this.crystals.set(crystalId, new MemoryCrystal(crystalId));
    }
    return this.crystals.get(crystalId);
  }

  // ═══════════════════════════════════════════════════════════
  // SIMPLE KEY-VALUE OPERATIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Simple set (volatile dimension)
   */
  set(key, value) {
    this.volatile.set(key, value);
    this.stats.writes++;
    return true;
  }

  /**
   * Simple get (volatile dimension)
   */
  get(key) {
    this.stats.reads++;
    return this.volatile.get(key);
  }

  /**
   * Check if key exists
   */
  has(key) {
    return this.volatile.has(key) || this.states.has(key);
  }

  /**
   * Delete key
   */
  delete(key) {
    this.volatile.delete(key);
    this.states.delete(key);
    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════

  /**
   * Persist all data to disk
   */
  async persistAll() {
    const data = {
      states: {},
      crystals: {},
      volatile: Object.fromEntries(this.volatile),
      timestamp: Date.now()
    };

    // Serialize states
    for (const [key, state] of this.states) {
      data.states[key] = {
        key: state.key,
        states: Object.fromEntries(state.states),
        collapsed: state.collapsed,
        observedValue: state.observedValue,
        metadata: state.metadata
      };
    }

    // Serialize crystals
    for (const [id, crystal] of this.crystals) {
      data.crystals[id] = {
        id: crystal.id,
        patterns: Object.fromEntries(crystal.patterns),
        associations: Object.fromEntries(crystal.associations),
        stats: crystal.getStats()
      };
    }

    const filePath = path.join(this.config.storagePath, 'quantum-state.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    this.emit('persisted', { path: filePath });
    console.log('[QUANTUM STORAGE] Data persisted');
  }

  /**
   * Load persisted data
   */
  async loadPersistedData() {
    const filePath = path.join(this.config.storagePath, 'quantum-state.json');

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Restore volatile
      this.volatile = new Map(Object.entries(data.volatile || {}));

      // Restore states
      for (const [key, stateData] of Object.entries(data.states || {})) {
        const state = new QuantumState(key);
        state.states = new Map(Object.entries(stateData.states));
        state.collapsed = stateData.collapsed;
        state.observedValue = stateData.observedValue;
        state.metadata = stateData.metadata;
        this.states.set(key, state);
      }

      // Restore crystals
      for (const [id, crystalData] of Object.entries(data.crystals || {})) {
        const crystal = new MemoryCrystal(id);
        crystal.patterns = new Map(Object.entries(crystalData.patterns));
        crystal.associations = new Map(Object.entries(crystalData.associations));
        this.crystals.set(id, crystal);
      }

      console.log(`[QUANTUM STORAGE] Loaded ${this.states.size} states, ${this.crystals.size} crystals`);
    } catch (e) {
      // No persisted data or error loading
      console.log('[QUANTUM STORAGE] No previous state found, starting fresh');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════

  /**
   * Get storage stats
   */
  getStats() {
    return {
      ...this.stats,
      quantumStates: this.states.size,
      crystals: this.crystals.size,
      volatileEntries: this.volatile.size,
      initialized: this.initialized
    };
  }

  /**
   * Clear all storage
   */
  clear() {
    this.states.clear();
    this.crystals.clear();
    this.volatile.clear();
    this.stats = { reads: 0, writes: 0, collapses: 0, crystallizations: 0 };
  }

  /**
   * Shutdown
   */
  async shutdown() {
    if (this.persistInterval) {
      clearInterval(this.persistInterval);
    }
    await this.persistAll();
    this.emit('shutdown');
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  QuantumStorage,
  QuantumState,
  MemoryCrystal,
  STORAGE_DIMENSIONS
};
