/**
 * INFINITE STRATEGY GENERATOR
 * ═══════════════════════════════════════════════════════════════════
 * The beating heart of autonomous strategy discovery.
 * Connects UnlimitedSolver to Agent Army for monetization.
 *
 * "Generate infinite strategies. Solve infinite problems. Make infinite money."
 * ═══════════════════════════════════════════════════════════════════
 */

const { EventEmitter } = require('events');

// Core solver components
const {
  UnlimitedSolver,
  Grid,
  Strategy,
  infiniteStrategies,
  generateStrategiesOfDepth,
  getPrimitives,
  validateStrategyOnTraining,
  scoreStrategyOnTraining
} = require('./solver/UnlimitedSolver');

const SafeJumpPolicy = require('./solver/config/safe_jump_policy');

const VERSION = '1.0.0';
const CODENAME = 'INFINITE_HORIZON';

// ═══════════════════════════════════════════════════════════════════
// STRATEGY CACHE - High-performance strategy storage
// ═══════════════════════════════════════════════════════════════════

class StrategyCache {
  constructor(maxSize = 10000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  generateKey(task) {
    const trainSignature = task.train?.map(p =>
      `${p.input.length}x${p.input[0]?.length}:${p.output.length}x${p.output[0]?.length}`
    ).join('|') || 'empty';
    return `task_${trainSignature}_${JSON.stringify(task.train?.[0]?.input || [])}`.slice(0, 256);
  }

  get(task) {
    const key = this.generateKey(task);
    if (this.cache.has(key)) {
      this.hits++;
      const entry = this.cache.get(key);
      entry.accessCount++;
      entry.lastAccess = Date.now();
      return entry.strategy;
    }
    this.misses++;
    return null;
  }

  set(task, strategy, score) {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const key = this.generateKey(task);
    this.cache.set(key, {
      strategy,
      score,
      accessCount: 1,
      lastAccess: Date.now(),
      createdAt: Date.now()
    });
  }

  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.evictions++;
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
      evictions: this.evictions
    };
  }

  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }
}

// ═══════════════════════════════════════════════════════════════════
// STRATEGY PIPELINE - Continuous strategy generation
// ═══════════════════════════════════════════════════════════════════

class StrategyPipeline {
  constructor(config = {}) {
    this.config = {
      batchSize: config.batchSize || 1000,
      maxDepth: config.maxDepth || 10,
      pruneThreshold: config.pruneThreshold || 0.3,
      ...config
    };

    this.currentDepth = 1;
    this.generatedCount = 0;
    this.validCount = 0;
    this.prunedCount = 0;
  }

  *generate() {
    while (this.currentDepth <= this.config.maxDepth) {
      const strategies = generateStrategiesOfDepth(this.currentDepth);

      for (const strategy of strategies) {
        this.generatedCount++;
        yield {
          strategy,
          depth: this.currentDepth,
          index: this.generatedCount
        };
      }

      this.currentDepth++;
    }
  }

  *generateBatch(size = null) {
    const batchSize = size || this.config.batchSize;
    const batch = [];

    for (const item of this.generate()) {
      batch.push(item);
      if (batch.length >= batchSize) {
        yield batch;
        batch.length = 0;
      }
    }

    if (batch.length > 0) {
      yield batch;
    }
  }

  getStats() {
    return {
      currentDepth: this.currentDepth,
      generatedCount: this.generatedCount,
      validCount: this.validCount,
      prunedCount: this.prunedCount,
      validRate: this.validCount / this.generatedCount || 0
    };
  }

  reset() {
    this.currentDepth = 1;
    this.generatedCount = 0;
    this.validCount = 0;
    this.prunedCount = 0;
  }
}

// ═══════════════════════════════════════════════════════════════════
// INFINITE STRATEGY GENERATOR - Main Class
// ═══════════════════════════════════════════════════════════════════

class InfiniteStrategyGenerator extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      // Generation settings
      maxConcurrent: config.maxConcurrent || 4,
      batchSize: config.batchSize || 1000,
      maxDepth: config.maxDepth || 15,

      // Time budgets
      taskTimeoutMs: config.taskTimeoutMs || 60000,
      globalTimeoutMs: config.globalTimeoutMs || 3600000, // 1 hour

      // Quality settings
      minAccuracy: config.minAccuracy || 0.95,
      cacheSize: config.cacheSize || 10000,

      // Safety
      safetyPolicy: config.safetyPolicy || SafeJumpPolicy,

      // Verbose
      verbose: config.verbose !== false,

      ...config
    };

    // Core components
    this.cache = new StrategyCache(this.config.cacheSize);
    this.pipeline = new StrategyPipeline({
      batchSize: this.config.batchSize,
      maxDepth: this.config.maxDepth
    });

    // State
    this.running = false;
    this.paused = false;
    this.taskQueue = [];
    this.results = [];
    this.activeWorkers = 0;

    // Stats
    this.stats = {
      tasksProcessed: 0,
      tasksSolved: 0,
      strategiesGenerated: 0,
      strategiesValidated: 0,
      cacheHits: 0,
      totalTimeMs: 0,
      startTime: null
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Task Management
  // ─────────────────────────────────────────────────────────────

  addTask(task) {
    const wrappedTask = {
      id: task.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      data: task,
      status: 'pending',
      addedAt: Date.now(),
      priority: task.priority || 0
    };

    this.taskQueue.push(wrappedTask);
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    this.emit('taskAdded', wrappedTask);
    return wrappedTask.id;
  }

  addTasks(tasks) {
    return tasks.map(t => this.addTask(t));
  }

  // ─────────────────────────────────────────────────────────────
  // Core Generation Loop
  // ─────────────────────────────────────────────────────────────

  async start() {
    if (this.running) {
      return { error: 'Already running' };
    }

    this.running = true;
    this.paused = false;
    this.stats.startTime = Date.now();

    this.emit('started', { timestamp: this.stats.startTime });

    if (this.config.verbose) {
      console.log('\n' + '═'.repeat(60));
      console.log('INFINITE STRATEGY GENERATOR - ACTIVATED');
      console.log(`Tasks in queue: ${this.taskQueue.length}`);
      console.log(`Max concurrent: ${this.config.maxConcurrent}`);
      console.log('═'.repeat(60) + '\n');
    }

    // Main processing loop
    while (this.running && this.taskQueue.length > 0) {
      if (this.paused) {
        await this.sleep(100);
        continue;
      }

      // Check global timeout
      if (Date.now() - this.stats.startTime > this.config.globalTimeoutMs) {
        this.emit('globalTimeout', { elapsed: Date.now() - this.stats.startTime });
        break;
      }

      // Process tasks up to max concurrent
      const batch = [];
      while (batch.length < this.config.maxConcurrent && this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        task.status = 'processing';
        batch.push(task);
      }

      // Process batch
      const results = await Promise.all(batch.map(t => this.processTask(t)));
      this.results.push(...results);

      // Emit progress
      this.emit('batchComplete', {
        batch: results.map(r => ({ id: r.id, success: r.success })),
        remaining: this.taskQueue.length
      });
    }

    this.running = false;
    this.stats.totalTimeMs = Date.now() - this.stats.startTime;

    this.emit('completed', {
      stats: this.getStats(),
      results: this.results
    });

    return {
      success: true,
      stats: this.getStats(),
      results: this.results
    };
  }

  async processTask(wrappedTask) {
    const startTime = Date.now();
    const task = wrappedTask.data;

    this.emit('taskStarted', { id: wrappedTask.id });

    try {
      // Check cache first
      const cachedStrategy = this.cache.get(task);
      if (cachedStrategy) {
        this.stats.cacheHits++;
        const result = this.applyStrategy(cachedStrategy, task);

        return {
          id: wrappedTask.id,
          success: true,
          fromCache: true,
          strategy: cachedStrategy.name,
          result,
          timeMs: Date.now() - startTime
        };
      }

      // Run solver
      const solver = new UnlimitedSolver({
        maxTime: this.config.taskTimeoutMs,
        verbose: false
      });

      const solution = solver.solve(task);
      this.stats.tasksProcessed++;
      this.stats.strategiesGenerated += solver.stats.strategiesTried;

      if (solution.success) {
        this.stats.tasksSolved++;

        // Cache the successful strategy
        this.cache.set(task, solution.strategy, { accuracy: 1.0 });

        this.emit('taskSolved', {
          id: wrappedTask.id,
          strategy: solution.strategy.name,
          depth: solution.strategy.depth
        });

        return {
          id: wrappedTask.id,
          success: true,
          fromCache: false,
          strategy: solution.strategy,
          results: solution.results,
          stats: solution.stats,
          timeMs: Date.now() - startTime
        };
      }

      return {
        id: wrappedTask.id,
        success: false,
        message: solution.message,
        stats: solution.stats,
        timeMs: Date.now() - startTime
      };

    } catch (error) {
      this.emit('taskError', { id: wrappedTask.id, error: error.message });

      return {
        id: wrappedTask.id,
        success: false,
        error: error.message,
        timeMs: Date.now() - startTime
      };
    }
  }

  applyStrategy(strategy, task) {
    const results = [];

    for (const testPair of task.test || []) {
      const inputGrid = Grid.fromArray(testPair.input);
      const predicted = strategy.apply(inputGrid);

      results.push({
        input: testPair.input,
        predicted: predicted.toArray()
      });
    }

    return results;
  }

  // ─────────────────────────────────────────────────────────────
  // Control Methods
  // ─────────────────────────────────────────────────────────────

  pause() {
    this.paused = true;
    this.emit('paused');
  }

  resume() {
    this.paused = false;
    this.emit('resumed');
  }

  stop() {
    this.running = false;
    this.emit('stopped');
  }

  reset() {
    this.stop();
    this.taskQueue = [];
    this.results = [];
    this.cache.clear();
    this.pipeline.reset();
    this.stats = {
      tasksProcessed: 0,
      tasksSolved: 0,
      strategiesGenerated: 0,
      strategiesValidated: 0,
      cacheHits: 0,
      totalTimeMs: 0,
      startTime: null
    };
    this.emit('reset');
  }

  // ─────────────────────────────────────────────────────────────
  // Batch Generation (for pre-generating strategies)
  // ─────────────────────────────────────────────────────────────

  *generateStrategies(count = 10000) {
    let generated = 0;

    for (const strategy of infiniteStrategies()) {
      yield strategy;
      generated++;
      this.stats.strategiesGenerated++;

      if (generated >= count) break;
    }
  }

  generateStrategyBatch(count = 1000) {
    const strategies = [];

    for (const strategy of this.generateStrategies(count)) {
      strategies.push({
        name: strategy.name,
        depth: strategy.depth,
        chain: strategy.chain.map(p => p.name)
      });
    }

    return strategies;
  }

  // ─────────────────────────────────────────────────────────────
  // Stats & Monitoring
  // ─────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this.stats,
      cache: this.cache.getStats(),
      pipeline: this.pipeline.getStats(),
      queue: {
        pending: this.taskQueue.filter(t => t.status === 'pending').length,
        processing: this.taskQueue.filter(t => t.status === 'processing').length,
        total: this.taskQueue.length
      },
      results: {
        total: this.results.length,
        successful: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length
      },
      running: this.running,
      paused: this.paused,
      solveRate: this.stats.tasksSolved / this.stats.tasksProcessed || 0,
      avgTimePerTask: this.stats.totalTimeMs / this.stats.tasksProcessed || 0
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Utility
  // ─────────────────────────────────────────────────────────────

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════
// STRATEGY MONETIZATION CONNECTOR
// Connects strategy generation to business opportunities
// ═══════════════════════════════════════════════════════════════════

class StrategyMonetizer {
  constructor(generator) {
    this.generator = generator;
    this.opportunities = [];
    this.revenue = {
      total: 0,
      byCategory: {},
      history: []
    };

    // Listen to generator events
    this.generator.on('taskSolved', this.onTaskSolved.bind(this));
  }

  onTaskSolved(event) {
    // Track successful strategies for monetization
    this.opportunities.push({
      strategyName: event.strategy,
      depth: event.depth,
      timestamp: Date.now(),
      monetized: false
    });
  }

  calculateValue(strategy) {
    // Higher depth = more complex = more valuable
    const baseValue = 10;
    const depthMultiplier = 1 + (strategy.depth * 0.5);
    const uniquenessBonus = this.isUnique(strategy) ? 2 : 1;

    return baseValue * depthMultiplier * uniquenessBonus;
  }

  isUnique(strategy) {
    // Check if this is a novel strategy
    return !this.opportunities.some(o =>
      o.strategyName === strategy.name && o.monetized
    );
  }

  async monetize(opportunity) {
    const value = this.calculateValue(opportunity);
    opportunity.monetized = true;
    opportunity.value = value;

    this.revenue.total += value;
    this.revenue.history.push({
      timestamp: Date.now(),
      amount: value,
      strategy: opportunity.strategyName
    });

    return { success: true, value };
  }

  getReport() {
    return {
      totalRevenue: this.revenue.total,
      opportunitiesFound: this.opportunities.length,
      opportunitiesMonetized: this.opportunities.filter(o => o.monetized).length,
      pendingOpportunities: this.opportunities.filter(o => !o.monetized).length,
      recentHistory: this.revenue.history.slice(-10)
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // Main generator
  InfiniteStrategyGenerator,

  // Supporting classes
  StrategyCache,
  StrategyPipeline,
  StrategyMonetizer,

  // Re-export solver components
  UnlimitedSolver,
  Grid,
  Strategy,
  infiniteStrategies,
  getPrimitives,

  // Meta
  VERSION,
  CODENAME
};
