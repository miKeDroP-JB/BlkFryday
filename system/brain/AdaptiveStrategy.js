/**
 * ADAPTIVE STRATEGY LEARNING
 * The system learns which strategy works best for each task type
 *
 * "Don't guess the best approach - KNOW it from experience" - Adaptive Philosophy
 *
 * Features:
 * - Track outcomes by task type + strategy combination
 * - Build performance profiles over time
 * - Predict best strategy before execution
 * - Continuous learning from results
 */

// Task type signatures for classification
const TASK_SIGNATURES = {
  CODE: {
    keywords: ['code', 'function', 'implement', 'debug', 'fix', 'program', 'script', 'api', 'class', 'method'],
    patterns: [/```/, /function\s+\w+/, /class\s+\w+/, /import\s+/, /const\s+\w+\s*=/],
    weight: 1.0
  },
  ANALYSIS: {
    keywords: ['analyze', 'compare', 'evaluate', 'assess', 'review', 'examine', 'study', 'investigate'],
    patterns: [/why\s+/, /how\s+does/, /what\s+causes/, /explain\s+/],
    weight: 1.0
  },
  CREATIVE: {
    keywords: ['create', 'write', 'generate', 'design', 'brainstorm', 'ideate', 'imagine', 'story', 'creative'],
    patterns: [/write\s+a/, /create\s+a/, /design\s+a/],
    weight: 1.0
  },
  FACTUAL: {
    keywords: ['what is', 'define', 'list', 'name', 'who', 'when', 'where', 'fact', 'true'],
    patterns: [/^what\s+is/, /^who\s+is/, /^when\s+did/],
    weight: 1.0
  },
  MATH: {
    keywords: ['calculate', 'compute', 'solve', 'equation', 'formula', 'number', 'math', 'algorithm'],
    patterns: [/\d+\s*[\+\-\*\/]\s*\d+/, /solve\s+for/, /calculate\s+/],
    weight: 1.0
  },
  TRANSLATION: {
    keywords: ['translate', 'convert', 'transform', 'language', 'spanish', 'french', 'chinese', 'localize'],
    patterns: [/translate\s+to/, /in\s+\w+\s+language/],
    weight: 1.0
  },
  SUMMARIZATION: {
    keywords: ['summarize', 'summary', 'brief', 'tldr', 'key points', 'main ideas', 'condense'],
    patterns: [/summarize\s+/, /give\s+me\s+a\s+summary/],
    weight: 1.0
  },
  EXTRACTION: {
    keywords: ['extract', 'find', 'identify', 'locate', 'pull out', 'get', 'parse'],
    patterns: [/extract\s+/, /find\s+all/, /identify\s+the/],
    weight: 1.0
  }
};

// Strategy performance profiles (learned over time)
const DEFAULT_STRATEGY_PROFILES = {
  CODE: { optimal: 'quality', backup: 'balanced', speedTolerance: 0.7 },
  ANALYSIS: { optimal: 'consensus', backup: 'quality', speedTolerance: 0.5 },
  CREATIVE: { optimal: 'evolve', backup: 'quality', speedTolerance: 0.3 },
  FACTUAL: { optimal: 'consensus', backup: 'efficient', speedTolerance: 0.8 },
  MATH: { optimal: 'quality', backup: 'consensus', speedTolerance: 0.6 },
  TRANSLATION: { optimal: 'efficient', backup: 'speed', speedTolerance: 0.9 },
  SUMMARIZATION: { optimal: 'efficient', backup: 'speed', speedTolerance: 0.85 },
  EXTRACTION: { optimal: 'speed', backup: 'efficient', speedTolerance: 0.95 },
  UNKNOWN: { optimal: 'balanced', backup: 'efficient', speedTolerance: 0.7 }
};

/**
 * Task Classifier
 * Classifies tasks into types for strategy optimization
 */
class TaskClassifier {
  constructor() {
    this.signatures = TASK_SIGNATURES;
    this.classificationHistory = [];
  }

  /**
   * Classify a task into a type
   */
  classify(task) {
    const taskLower = task.toLowerCase();
    const scores = {};

    for (const [type, signature] of Object.entries(this.signatures)) {
      let score = 0;

      // Keyword matching
      for (const keyword of signature.keywords) {
        if (taskLower.includes(keyword)) {
          score += 10;
        }
      }

      // Pattern matching
      for (const pattern of signature.patterns) {
        if (pattern.test(task)) {
          score += 15;
        }
      }

      // Apply weight
      scores[type] = score * signature.weight;
    }

    // Find best match
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const bestMatch = sorted[0];
    const secondMatch = sorted[1];

    // Confidence based on score gap
    const confidence = bestMatch[1] > 0
      ? Math.min(1, (bestMatch[1] - (secondMatch?.[1] || 0)) / bestMatch[1] + 0.5)
      : 0.3;

    const classification = {
      type: bestMatch[1] > 0 ? bestMatch[0] : 'UNKNOWN',
      confidence,
      scores,
      allMatches: sorted.filter(([_, score]) => score > 0)
    };

    this.classificationHistory.push({
      task: task.substring(0, 100),
      classification,
      timestamp: Date.now()
    });

    return classification;
  }

  /**
   * Get classification statistics
   */
  getStats() {
    const typeCounts = {};
    for (const entry of this.classificationHistory) {
      typeCounts[entry.classification.type] = (typeCounts[entry.classification.type] || 0) + 1;
    }
    return {
      total: this.classificationHistory.length,
      byType: typeCounts
    };
  }
}

/**
 * Strategy Performance Tracker
 * Tracks which strategies work best for which task types
 */
class StrategyPerformanceTracker {
  constructor() {
    this.performances = new Map(); // taskType -> strategy -> metrics
    this.profiles = { ...DEFAULT_STRATEGY_PROFILES };
  }

  /**
   * Record a strategy execution result
   */
  record(taskType, strategy, result) {
    const key = taskType;
    if (!this.performances.has(key)) {
      this.performances.set(key, new Map());
    }

    const typePerf = this.performances.get(key);
    if (!typePerf.has(strategy)) {
      typePerf.set(strategy, {
        executions: 0,
        totalQuality: 0,
        totalLatency: 0,
        successes: 0,
        failures: 0
      });
    }

    const metrics = typePerf.get(strategy);
    metrics.executions++;
    metrics.totalQuality += result.quality || 0;
    metrics.totalLatency += result.latency || 0;
    if (result.success) {
      metrics.successes++;
    } else {
      metrics.failures++;
    }

    // Update profiles based on learnings
    this.updateProfiles();
  }

  /**
   * Get best strategy for task type based on historical data
   */
  getBestStrategy(taskType, constraints = {}) {
    const typePerf = this.performances.get(taskType);

    if (!typePerf || typePerf.size < 5) {
      // Not enough data, use defaults
      return this.profiles[taskType]?.optimal || 'balanced';
    }

    // Score each strategy
    const strategyScores = [];
    for (const [strategy, metrics] of typePerf) {
      if (metrics.executions < 3) continue;

      const avgQuality = metrics.totalQuality / metrics.executions;
      const avgLatency = metrics.totalLatency / metrics.executions;
      const successRate = metrics.successes / metrics.executions;

      // Composite score (weighted)
      let score = avgQuality * 0.5 + successRate * 0.3;

      // Penalize slow strategies if speed matters
      if (constraints.maxLatency && avgLatency > constraints.maxLatency) {
        score *= 0.5;
      }

      // Bonus for meeting quality threshold
      if (constraints.minQuality && avgQuality >= constraints.minQuality) {
        score *= 1.2;
      }

      strategyScores.push({
        strategy,
        score,
        avgQuality,
        avgLatency,
        successRate,
        executions: metrics.executions
      });
    }

    if (strategyScores.length === 0) {
      return this.profiles[taskType]?.optimal || 'balanced';
    }

    strategyScores.sort((a, b) => b.score - a.score);
    return strategyScores[0].strategy;
  }

  /**
   * Update profiles based on accumulated data
   */
  updateProfiles() {
    for (const [taskType, strategies] of this.performances) {
      if (strategies.size < 3) continue;

      let bestStrategy = null;
      let bestScore = 0;

      for (const [strategy, metrics] of strategies) {
        if (metrics.executions < 5) continue;

        const avgQuality = metrics.totalQuality / metrics.executions;
        const successRate = metrics.successes / metrics.executions;
        const score = avgQuality * successRate;

        if (score > bestScore) {
          bestScore = score;
          bestStrategy = strategy;
        }
      }

      if (bestStrategy && this.profiles[taskType]) {
        this.profiles[taskType].optimal = bestStrategy;
      }
    }
  }

  /**
   * Get performance report
   */
  getReport() {
    const report = {};

    for (const [taskType, strategies] of this.performances) {
      report[taskType] = {};

      for (const [strategy, metrics] of strategies) {
        report[taskType][strategy] = {
          executions: metrics.executions,
          avgQuality: (metrics.totalQuality / metrics.executions).toFixed(3),
          avgLatency: Math.round(metrics.totalLatency / metrics.executions),
          successRate: ((metrics.successes / metrics.executions) * 100).toFixed(1) + '%'
        };
      }
    }

    return report;
  }

  /**
   * Export learned profiles
   */
  exportProfiles() {
    return JSON.stringify(this.profiles, null, 2);
  }

  /**
   * Import profiles
   */
  importProfiles(profilesJson) {
    const imported = JSON.parse(profilesJson);
    this.profiles = { ...this.profiles, ...imported };
  }
}

/**
 * Adaptive Strategy Selector
 * Combines classification and performance tracking
 */
class AdaptiveStrategySelector {
  constructor(config = {}) {
    this.classifier = new TaskClassifier();
    this.tracker = new StrategyPerformanceTracker();
    this.learningRate = config.learningRate || 0.1;
    this.explorationRate = config.explorationRate || 0.1; // Try new strategies occasionally
  }

  /**
   * Select best strategy for a task
   */
  selectStrategy(task, constraints = {}) {
    // Classify the task
    const classification = this.classifier.classify(task);

    // Explore occasionally (try different strategies to learn)
    if (Math.random() < this.explorationRate) {
      const strategies = ['speed', 'quality', 'efficient', 'balanced', 'evolve', 'consensus'];
      const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
      return {
        strategy: randomStrategy,
        taskType: classification.type,
        confidence: classification.confidence,
        reason: 'exploration',
        isExploration: true
      };
    }

    // Get best strategy based on learnings
    const strategy = this.tracker.getBestStrategy(classification.type, constraints);

    return {
      strategy,
      taskType: classification.type,
      confidence: classification.confidence,
      reason: 'learned_optimal',
      isExploration: false
    };
  }

  /**
   * Record execution result for learning
   */
  recordResult(taskType, strategy, result) {
    this.tracker.record(taskType, strategy, result);
  }

  /**
   * Get learning statistics
   */
  getStats() {
    return {
      classifications: this.classifier.getStats(),
      performances: this.tracker.getReport(),
      currentProfiles: this.tracker.profiles
    };
  }
}

module.exports = {
  TASK_SIGNATURES,
  DEFAULT_STRATEGY_PROFILES,
  TaskClassifier,
  StrategyPerformanceTracker,
  AdaptiveStrategySelector
};
