/**
 * DYNAMIC ENSEMBLE SIZING
 * Use more models when uncertain, fewer when confident
 *
 * "Don't waste votes on easy decisions" - Dynamic Ensemble Philosophy
 *
 * Features:
 * - Adaptive ensemble size based on task uncertainty
 * - Early stopping when consensus reached
 * - Progressive model recruitment
 * - Cost-aware ensemble scaling
 */

const { QualityPredictor } = require('./QualityPredictor');

// Ensemble sizing rules
const ENSEMBLE_RULES = {
  // Difficulty -> base ensemble size
  difficulty: {
    easy: { min: 1, max: 2 },      // Simple tasks need 1-2 models
    medium: { min: 2, max: 4 },    // Medium tasks need 2-4 models
    hard: { min: 3, max: 5 },      // Hard tasks need 3-5 models
    extreme: { min: 4, max: 6 }    // Extreme tasks need 4-6 models
  },

  // Task type -> ensemble preference
  taskType: {
    factual: { preferConsensus: true, minAgreement: 0.8 },
    creative: { preferDiversity: true, minAgreement: 0.5 },
    analysis: { preferConsensus: true, minAgreement: 0.7 },
    code: { preferQuality: true, minAgreement: 0.7 }
  }
};

// Model pool for ensemble
const MODEL_POOL = [
  { id: 'claude', provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', quality: 0.95, speed: 0.7, cost: 0.8 },
  { id: 'gpt4', provider: 'openai', model: 'gpt-4o', quality: 0.93, speed: 0.8, cost: 0.75 },
  { id: 'gemini', provider: 'google', model: 'gemini-1.5-pro', quality: 0.90, speed: 0.85, cost: 0.6 },
  { id: 'groq', provider: 'groq', model: 'llama-3.1-70b-versatile', quality: 0.82, speed: 0.98, cost: 0.2 },
  { id: 'mistral', provider: 'mistral', model: 'mistral-large-latest', quality: 0.85, speed: 0.8, cost: 0.5 },
  { id: 'deepseek', provider: 'deepseek', model: 'deepseek-coder', quality: 0.88, speed: 0.75, cost: 0.3 }
];

/**
 * Uncertainty Estimator
 * Estimates task uncertainty to determine ensemble size
 */
class UncertaintyEstimator {
  constructor() {
    this.predictor = new QualityPredictor();
  }

  /**
   * Estimate uncertainty of a task (alias for compatibility)
   */
  estimateUncertainty(task) {
    return this.estimate(task);
  }

  /**
   * Estimate uncertainty of a task
   */
  estimate(task) {
    const prediction = this.predictor.predict(task);
    const features = prediction.features;

    // Base uncertainty from difficulty
    let uncertainty = prediction.difficulty;

    // Increase for ambiguous tasks
    uncertainty += features.ambiguity * 0.2;

    // Increase for multi-step tasks
    uncertainty += features.multiStep * 0.15;

    // Increase for highly technical tasks
    if (features.technicalDepth > 0.7) {
      uncertainty += 0.1;
    }

    // Decrease for simple, clear tasks
    if (features.complexityLevel < 0.3 && features.ambiguity < 0.3) {
      uncertainty -= 0.2;
    }

    return {
      score: Math.max(0, Math.min(1, uncertainty)),
      level: this.getLevel(uncertainty),
      factors: {
        difficulty: prediction.difficulty,
        ambiguity: features.ambiguity,
        multiStep: features.multiStep,
        technical: features.technicalDepth
      }
    };
  }

  getLevel(score) {
    if (score < 0.25) return 'low';
    if (score < 0.5) return 'medium';
    if (score < 0.75) return 'high';
    return 'very_high';
  }
}

/**
 * Dynamic Ensemble Manager
 * Manages adaptive ensemble sizing and execution
 */
class DynamicEnsembleManager {
  constructor(config = {}) {
    this.estimator = new UncertaintyEstimator();
    this.modelPool = config.modelPool || MODEL_POOL;
    this.maxCost = config.maxCost || 1.0; // Normalized cost budget
    this.minAgreement = config.minAgreement || 0.7;
    this.stats = {
      totalEnsembles: 0,
      avgSize: 0,
      earlyStops: 0,
      costSaved: 0
    };
  }

  /**
   * Determine optimal ensemble size for task
   */
  determineSize(task) {
    const uncertainty = this.estimator.estimate(task);

    // Map uncertainty to ensemble size
    let targetSize;
    switch (uncertainty.level) {
      case 'low':
        targetSize = ENSEMBLE_RULES.difficulty.easy;
        break;
      case 'medium':
        targetSize = ENSEMBLE_RULES.difficulty.medium;
        break;
      case 'high':
        targetSize = ENSEMBLE_RULES.difficulty.hard;
        break;
      case 'very_high':
        targetSize = ENSEMBLE_RULES.difficulty.extreme;
        break;
      default:
        targetSize = ENSEMBLE_RULES.difficulty.medium;
    }

    // Calculate optimal size within range
    const range = targetSize.max - targetSize.min;
    const optimalSize = targetSize.min + Math.round(range * uncertainty.score);

    return {
      size: optimalSize,
      min: targetSize.min,
      max: targetSize.max,
      uncertainty,
      reasoning: this.explainSizing(uncertainty, optimalSize)
    };
  }

  /**
   * Select models for ensemble
   */
  selectModels(task, size, preferences = {}) {
    const { preferSpeed, preferQuality, preferCost } = preferences;

    // Score each model
    const scored = this.modelPool.map(model => {
      let score = 0;

      // Base score from quality
      score += model.quality * 0.4;

      // Preference adjustments
      if (preferSpeed) score += model.speed * 0.3;
      if (preferQuality) score += model.quality * 0.3;
      if (preferCost) score += (1 - model.cost) * 0.3;

      // Diversity bonus - prefer different providers
      score += 0.1;

      return { ...model, score };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Select top models, ensuring provider diversity
    const selected = [];
    const usedProviders = new Set();

    for (const model of scored) {
      if (selected.length >= size) break;

      // Prefer diverse providers
      if (usedProviders.has(model.provider) && selected.length < size - 1) {
        continue;
      }

      selected.push(model);
      usedProviders.add(model.provider);
    }

    // Fill remaining slots if needed
    while (selected.length < size) {
      const remaining = scored.filter(m => !selected.includes(m));
      if (remaining.length === 0) break;
      selected.push(remaining[0]);
    }

    return selected;
  }

  /**
   * Execute with progressive ensemble
   * Start with fewer models, add more if uncertain
   */
  async executeProgressive(task, executor, options = {}) {
    const sizing = this.determineSize(task);
    const startSize = sizing.min;
    const maxSize = sizing.size;

    this.stats.totalEnsembles++;

    const results = [];
    let currentSize = startSize;

    while (currentSize <= maxSize) {
      // Select models for current size
      const models = this.selectModels(task, currentSize, options);
      const newModels = models.filter(m =>
        !results.find(r => r.model === m.id)
      );

      // Execute new models
      const newResults = await Promise.all(
        newModels.map(async (model) => {
          const result = await executor(task, {
            provider: model.provider,
            model: model.model
          });
          return {
            model: model.id,
            provider: model.provider,
            ...result
          };
        })
      );

      results.push(...newResults);

      // Check for early stopping
      const consensus = this.checkConsensus(results);
      if (consensus.reached && currentSize >= sizing.min) {
        this.stats.earlyStops++;
        this.stats.costSaved += (maxSize - currentSize) / maxSize;
        break;
      }

      currentSize++;
    }

    // Update stats
    this.stats.avgSize = (this.stats.avgSize * (this.stats.totalEnsembles - 1) + results.length) / this.stats.totalEnsembles;

    return {
      results,
      ensembleSize: results.length,
      targetSize: sizing.size,
      consensus: this.checkConsensus(results),
      sizing
    };
  }

  /**
   * Check if consensus is reached
   */
  checkConsensus(results) {
    if (results.length < 2) {
      return { reached: false, reason: 'Not enough results' };
    }

    const successful = results.filter(r => r.success);
    if (successful.length < 2) {
      return { reached: false, reason: 'Not enough successful results' };
    }

    // Simple quality-based consensus
    const qualities = successful.map(r => r.quality || 0.7);
    const avgQuality = qualities.reduce((a, b) => a + b, 0) / qualities.length;
    const variance = qualities.reduce((sum, q) => sum + Math.pow(q - avgQuality, 2), 0) / qualities.length;

    // Low variance = consensus
    if (variance < 0.02 && avgQuality > 0.75) {
      return {
        reached: true,
        reason: 'Quality consensus reached',
        avgQuality,
        variance,
        agreement: 1 - variance * 10
      };
    }

    // Check if majority agree (simplified)
    const highQuality = successful.filter(r => (r.quality || 0.7) > 0.8);
    if (highQuality.length >= successful.length * this.minAgreement) {
      return {
        reached: true,
        reason: 'Majority high quality',
        agreement: highQuality.length / successful.length
      };
    }

    return {
      reached: false,
      reason: 'Consensus not reached',
      avgQuality,
      variance
    };
  }

  /**
   * Explain sizing decision
   */
  explainSizing(uncertainty, size) {
    const reasons = [];

    reasons.push(`Uncertainty level: ${uncertainty.level} (${(uncertainty.score * 100).toFixed(0)}%)`);
    reasons.push(`Ensemble size: ${size} models`);

    if (uncertainty.factors.ambiguity > 0.5) {
      reasons.push('Ambiguous task - using more models for coverage');
    }
    if (uncertainty.factors.technical > 0.7) {
      reasons.push('Technical task - specialized models included');
    }
    if (uncertainty.score < 0.3) {
      reasons.push('Low uncertainty - minimal ensemble sufficient');
    }

    return reasons;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      avgSize: this.stats.avgSize.toFixed(2),
      earlyStopRate: this.stats.totalEnsembles > 0
        ? ((this.stats.earlyStops / this.stats.totalEnsembles) * 100).toFixed(1) + '%'
        : '0%',
      avgCostSaved: this.stats.totalEnsembles > 0
        ? ((this.stats.costSaved / this.stats.totalEnsembles) * 100).toFixed(1) + '%'
        : '0%'
    };
  }
}

module.exports = {
  ENSEMBLE_RULES,
  MODEL_POOL,
  UncertaintyEstimator,
  DynamicEnsembleManager
};
