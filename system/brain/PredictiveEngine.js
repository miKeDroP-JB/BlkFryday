/**
 * PREDICTIVE PRE-COMPUTATION ENGINE
 * Anticipate what users need before they ask
 *
 * "The best latency is zero - have the answer ready" - Predictive Philosophy
 *
 * Features:
 * - Pattern recognition from task sequences
 * - Pre-compute likely next tasks
 * - Background warming of cache
 * - Context-aware predictions
 */

const { SemanticCache } = require('./CacheLayer');

// Common task sequences (learned patterns)
const TASK_SEQUENCE_PATTERNS = {
  // Code development flow
  CODE_FLOW: [
    'write function',
    'add error handling',
    'write tests',
    'optimize performance',
    'add documentation'
  ],

  // Analysis flow
  ANALYSIS_FLOW: [
    'analyze data',
    'identify patterns',
    'generate insights',
    'create recommendations',
    'write report'
  ],

  // Content creation flow
  CONTENT_FLOW: [
    'brainstorm ideas',
    'create outline',
    'write draft',
    'review and edit',
    'finalize'
  ],

  // Landing page flow
  LANDING_FLOW: [
    'define value proposition',
    'write headlines',
    'create CTA',
    'design sections',
    'generate full page'
  ],

  // Debug flow
  DEBUG_FLOW: [
    'identify error',
    'analyze stack trace',
    'find root cause',
    'implement fix',
    'verify solution'
  ]
};

// Contextual follow-up predictions
const FOLLOW_UP_PATTERNS = {
  'wrote code': ['test it', 'optimize it', 'document it', 'refactor it'],
  'created function': ['add error handling', 'add types', 'write tests'],
  'analyzed': ['create visualization', 'write summary', 'generate report'],
  'designed': ['implement it', 'get feedback', 'iterate'],
  'generated landing': ['adjust copy', 'change colors', 'add sections'],
  'wrote': ['review', 'edit', 'expand', 'summarize'],
  'fixed bug': ['add test', 'check similar issues', 'document fix'],
  'summarized': ['expand on point', 'create action items', 'share with team']
};

/**
 * Sequence Predictor
 * Predicts next likely task based on history
 */
class SequencePredictor {
  constructor() {
    this.patterns = TASK_SEQUENCE_PATTERNS;
    this.followUps = FOLLOW_UP_PATTERNS;
    this.taskHistory = [];
    this.maxHistory = 20;
  }

  /**
   * Add task to history
   */
  addToHistory(task) {
    this.taskHistory.push({
      task: task.toLowerCase().substring(0, 200),
      timestamp: Date.now()
    });

    // Keep history bounded
    if (this.taskHistory.length > this.maxHistory) {
      this.taskHistory.shift();
    }
  }

  /**
   * Predict next likely tasks
   */
  predictNext(currentTask, count = 3) {
    const predictions = [];
    const taskLower = currentTask.toLowerCase();

    // Check follow-up patterns
    for (const [trigger, followUps] of Object.entries(this.followUps)) {
      if (taskLower.includes(trigger)) {
        for (const followUp of followUps) {
          predictions.push({
            task: followUp,
            confidence: 0.7,
            reason: 'follow_up_pattern',
            trigger
          });
        }
      }
    }

    // Check sequence patterns
    for (const [flowName, sequence] of Object.entries(this.patterns)) {
      for (let i = 0; i < sequence.length - 1; i++) {
        if (taskLower.includes(sequence[i].toLowerCase())) {
          // Found match, predict next in sequence
          const nextTasks = sequence.slice(i + 1, i + 4);
          for (let j = 0; j < nextTasks.length; j++) {
            predictions.push({
              task: nextTasks[j],
              confidence: 0.8 - (j * 0.1),
              reason: 'sequence_pattern',
              flow: flowName,
              position: i + j + 1
            });
          }
          break;
        }
      }
    }

    // Check history for patterns
    if (this.taskHistory.length >= 2) {
      const recentTasks = this.taskHistory.slice(-5);
      // Look for repeated patterns
      const patterns = this.findRepeatingPatterns(recentTasks);
      for (const pattern of patterns) {
        predictions.push({
          task: pattern.nextTask,
          confidence: pattern.confidence,
          reason: 'history_pattern',
          pattern: pattern.sequence
        });
      }
    }

    // Deduplicate and sort by confidence
    const uniquePredictions = this.deduplicatePredictions(predictions);
    return uniquePredictions.slice(0, count);
  }

  /**
   * Find repeating patterns in history
   */
  findRepeatingPatterns(recentTasks) {
    const patterns = [];

    // Simple bigram pattern detection
    if (recentTasks.length >= 3) {
      const tasks = recentTasks.map(t => t.task);

      for (let i = 0; i < tasks.length - 2; i++) {
        const pattern = [tasks[i], tasks[i + 1]];
        const nextTask = tasks[i + 2];

        // Check if this pattern appears elsewhere
        for (let j = i + 1; j < tasks.length - 1; j++) {
          if (tasks[j].includes(pattern[0]) || pattern[0].includes(tasks[j])) {
            patterns.push({
              sequence: pattern,
              nextTask,
              confidence: 0.6
            });
          }
        }
      }
    }

    return patterns;
  }

  /**
   * Deduplicate predictions
   */
  deduplicatePredictions(predictions) {
    const seen = new Map();

    for (const pred of predictions) {
      const key = pred.task.toLowerCase();
      if (!seen.has(key) || seen.get(key).confidence < pred.confidence) {
        seen.set(key, pred);
      }
    }

    return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence);
  }
}

/**
 * Pre-computation Manager
 * Manages background pre-computation of predicted tasks
 */
class PrecomputationManager {
  constructor(config = {}) {
    this.predictor = new SequencePredictor();
    this.cache = new SemanticCache(config.cache);
    this.executor = config.executor; // Brain network executor
    this.isRunning = false;
    this.queue = [];
    this.maxQueueSize = config.maxQueueSize || 10;
    this.precomputeDelay = config.precomputeDelay || 1000; // ms after task
    this.stats = {
      predicted: 0,
      precomputed: 0,
      hits: 0,
      misses: 0
    };
  }

  /**
   * Process a completed task and predict next
   */
  async onTaskCompleted(task, result) {
    // Add to history
    this.predictor.addToHistory(task);

    // Cache the result
    this.cache.set(task, result, { metadata: { source: 'execution' } });

    // Predict next tasks
    const predictions = this.predictor.predictNext(task);
    this.stats.predicted += predictions.length;

    // Queue high-confidence predictions for pre-computation
    for (const prediction of predictions) {
      if (prediction.confidence >= 0.6) {
        this.queueForPrecomputation(prediction);
      }
    }

    // Trigger background pre-computation
    this.schedulePrecomputation();
  }

  /**
   * Queue a prediction for pre-computation
   */
  queueForPrecomputation(prediction) {
    // Check if already cached
    const cached = this.cache.getSemanticMatch(prediction.task);
    if (cached) return;

    // Check if already in queue
    const existing = this.queue.find(q => q.task === prediction.task);
    if (existing) {
      existing.confidence = Math.max(existing.confidence, prediction.confidence);
      return;
    }

    // Add to queue
    this.queue.push({
      ...prediction,
      queuedAt: Date.now()
    });

    // Keep queue bounded
    if (this.queue.length > this.maxQueueSize) {
      this.queue.sort((a, b) => b.confidence - a.confidence);
      this.queue = this.queue.slice(0, this.maxQueueSize);
    }
  }

  /**
   * Schedule background pre-computation
   */
  schedulePrecomputation() {
    if (this.isRunning || this.queue.length === 0) return;

    setTimeout(() => this.runPrecomputation(), this.precomputeDelay);
  }

  /**
   * Run background pre-computation
   */
  async runPrecomputation() {
    if (this.isRunning || this.queue.length === 0) return;
    if (!this.executor) return;

    this.isRunning = true;

    try {
      // Process highest confidence prediction
      this.queue.sort((a, b) => b.confidence - a.confidence);
      const prediction = this.queue.shift();

      if (prediction) {
        // Execute with budget strategy (cheap but useful)
        const result = await this.executor(prediction.task, { strategy: 'budget' });

        if (result.success) {
          this.cache.set(prediction.task, result, {
            metadata: {
              source: 'precomputation',
              prediction: prediction.reason,
              confidence: prediction.confidence
            }
          });
          this.stats.precomputed++;
        }
      }
    } finally {
      this.isRunning = false;

      // Continue if more in queue
      if (this.queue.length > 0) {
        this.schedulePrecomputation();
      }
    }
  }

  /**
   * Check if a task was predicted
   */
  checkPrediction(task) {
    const cached = this.cache.getSemanticMatch(task);
    if (cached && cached.value?.metadata?.source === 'precomputation') {
      this.stats.hits++;
      return {
        hit: true,
        result: cached.value,
        similarity: cached.similarity
      };
    }
    this.stats.misses++;
    return { hit: false };
  }

  /**
   * Get current predictions for a context
   */
  getPredictions(currentTask, count = 5) {
    return this.predictor.predictNext(currentTask, count);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.predicted > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1) + '%'
        : '0%',
      precomputeRate: this.stats.predicted > 0
        ? ((this.stats.precomputed / this.stats.predicted) * 100).toFixed(1) + '%'
        : '0%',
      queueSize: this.queue.length
    };
  }
}

/**
 * Context-Aware Predictor
 * Uses broader context for better predictions
 */
class ContextAwarePredictor {
  constructor() {
    this.sessionContext = {
      industry: null,
      projectType: null,
      userPreferences: {},
      recentTopics: []
    };
  }

  /**
   * Update context from task
   */
  updateContext(task, result) {
    const taskLower = task.toLowerCase();

    // Detect industry
    const industries = ['saas', 'ecommerce', 'fintech', 'healthcare', 'agency', 'crypto'];
    for (const industry of industries) {
      if (taskLower.includes(industry)) {
        this.sessionContext.industry = industry;
        break;
      }
    }

    // Detect project type
    const projectTypes = ['landing page', 'api', 'website', 'app', 'dashboard', 'automation'];
    for (const type of projectTypes) {
      if (taskLower.includes(type)) {
        this.sessionContext.projectType = type;
        break;
      }
    }

    // Extract topics
    const words = taskLower.split(/\s+/).filter(w => w.length > 4);
    this.sessionContext.recentTopics = [
      ...this.sessionContext.recentTopics.slice(-10),
      ...words.slice(0, 5)
    ];
  }

  /**
   * Get context-enhanced predictions
   */
  enhancePredictions(basePredictions) {
    return basePredictions.map(pred => {
      let boost = 0;

      // Boost if matches industry context
      if (this.sessionContext.industry &&
          pred.task.toLowerCase().includes(this.sessionContext.industry)) {
        boost += 0.1;
      }

      // Boost if matches project type
      if (this.sessionContext.projectType &&
          pred.task.toLowerCase().includes(this.sessionContext.projectType)) {
        boost += 0.1;
      }

      // Boost if matches recent topics
      for (const topic of this.sessionContext.recentTopics) {
        if (pred.task.toLowerCase().includes(topic)) {
          boost += 0.05;
          break;
        }
      }

      return {
        ...pred,
        confidence: Math.min(1, pred.confidence + boost),
        contextBoost: boost
      };
    });
  }

  /**
   * Get current context
   */
  getContext() {
    return { ...this.sessionContext };
  }
}

module.exports = {
  TASK_SEQUENCE_PATTERNS,
  FOLLOW_UP_PATTERNS,
  SequencePredictor,
  PrecomputationManager,
  ContextAwarePredictor
};
