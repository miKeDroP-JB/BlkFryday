/**
 * QUALITY PREDICTION ENGINE
 * Predict output quality BEFORE making expensive API calls
 *
 * "Know the outcome before spending the tokens" - Quality Prediction Philosophy
 *
 * Features:
 * - Estimate quality based on task features
 * - Predict which model tier is needed
 * - Skip expensive models when cheap ones suffice
 * - Route difficult tasks to powerful models
 */

// Task difficulty features
const DIFFICULTY_FEATURES = {
  LENGTH: { weight: 0.15, maxValue: 2000 },
  COMPLEXITY_KEYWORDS: { weight: 0.25 },
  TECHNICAL_DEPTH: { weight: 0.2 },
  AMBIGUITY: { weight: 0.15 },
  DOMAIN_SPECIFICITY: { weight: 0.15 },
  MULTI_STEP: { weight: 0.1 }
};

// Complexity keywords
const COMPLEXITY_KEYWORDS = {
  high: ['analyze', 'synthesize', 'evaluate', 'design', 'architect', 'optimize', 'complex', 'comprehensive'],
  medium: ['explain', 'compare', 'implement', 'create', 'develop', 'modify'],
  low: ['list', 'define', 'what is', 'simple', 'basic', 'format', 'convert']
};

// Technical domains (harder to get right)
const TECHNICAL_DOMAINS = [
  'machine learning', 'cryptography', 'distributed systems', 'compiler',
  'quantum', 'neural network', 'blockchain', 'security', 'algorithm',
  'database optimization', 'concurrent', 'threading'
];

// Ambiguity indicators
const AMBIGUITY_INDICATORS = [
  'something like', 'maybe', 'or something', 'whatever', 'kind of',
  'not sure', 'might be', 'possibly', 'somehow'
];

/**
 * Feature Extractor
 * Extracts features from task for quality prediction
 */
class FeatureExtractor {
  /**
   * Extract all features from task
   */
  extract(task) {
    return {
      length: this.extractLength(task),
      complexityLevel: this.extractComplexity(task),
      technicalDepth: this.extractTechnicalDepth(task),
      ambiguity: this.extractAmbiguity(task),
      domainSpecificity: this.extractDomainSpecificity(task),
      multiStep: this.extractMultiStep(task),
      raw: {
        wordCount: task.split(/\s+/).length,
        sentenceCount: task.split(/[.!?]+/).length,
        questionCount: (task.match(/\?/g) || []).length,
        hasCode: /```|function|class|import|const|let|var/.test(task)
      }
    };
  }

  extractLength(task) {
    // Normalize length to 0-1
    return Math.min(1, task.length / DIFFICULTY_FEATURES.LENGTH.maxValue);
  }

  extractComplexity(task) {
    const taskLower = task.toLowerCase();
    let score = 0.5; // baseline

    for (const keyword of COMPLEXITY_KEYWORDS.high) {
      if (taskLower.includes(keyword)) score += 0.15;
    }
    for (const keyword of COMPLEXITY_KEYWORDS.medium) {
      if (taskLower.includes(keyword)) score += 0.05;
    }
    for (const keyword of COMPLEXITY_KEYWORDS.low) {
      if (taskLower.includes(keyword)) score -= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  extractTechnicalDepth(task) {
    const taskLower = task.toLowerCase();
    let score = 0;

    for (const domain of TECHNICAL_DOMAINS) {
      if (taskLower.includes(domain)) {
        score += 0.2;
      }
    }

    // Code-related tasks are technical
    if (/```|function|class|algorithm|api|database/.test(taskLower)) {
      score += 0.3;
    }

    return Math.min(1, score);
  }

  extractAmbiguity(task) {
    const taskLower = task.toLowerCase();
    let score = 0;

    for (const indicator of AMBIGUITY_INDICATORS) {
      if (taskLower.includes(indicator)) {
        score += 0.15;
      }
    }

    // Short tasks are often more ambiguous
    if (task.length < 50) score += 0.2;

    // Questions are usually clearer
    if (task.includes('?')) score -= 0.1;

    return Math.max(0, Math.min(1, score));
  }

  extractDomainSpecificity(task) {
    const taskLower = task.toLowerCase();
    let score = 0.3; // baseline

    // Industry-specific terms
    const specificDomains = [
      'saas', 'b2b', 'enterprise', 'hipaa', 'gdpr', 'fintech', 'defi',
      'kubernetes', 'docker', 'terraform', 'aws', 'gcp', 'azure'
    ];

    for (const domain of specificDomains) {
      if (taskLower.includes(domain)) score += 0.15;
    }

    return Math.min(1, score);
  }

  extractMultiStep(task) {
    const taskLower = task.toLowerCase();
    let steps = 0;

    // Count conjunctions and step indicators
    steps += (task.match(/\band\b/gi) || []).length * 0.1;
    steps += (task.match(/\bthen\b/gi) || []).length * 0.15;
    steps += (task.match(/\bafter\b/gi) || []).length * 0.15;
    steps += (task.match(/\d+\./g) || []).length * 0.2;
    steps += (task.match(/first|second|third|finally/gi) || []).length * 0.15;

    return Math.min(1, steps);
  }
}

/**
 * Quality Predictor
 * Predicts output quality and recommends model tier
 */
class QualityPredictor {
  constructor(config = {}) {
    this.extractor = new FeatureExtractor();
    this.historicalData = []; // For calibration
    this.maxHistory = config.maxHistory || 1000;
  }

  /**
   * Predict quality for different model tiers
   */
  predict(task) {
    const features = this.extractor.extract(task);

    // Calculate difficulty score (0-1, higher = harder)
    const difficulty = this.calculateDifficulty(features);

    // Predict quality for each tier
    const predictions = {
      instant: this.predictForTier(difficulty, 'instant'),
      fast: this.predictForTier(difficulty, 'fast'),
      balanced: this.predictForTier(difficulty, 'balanced'),
      powerful: this.predictForTier(difficulty, 'powerful')
    };

    // Recommend tier based on quality threshold
    const recommendation = this.recommendTier(predictions, features);

    return {
      features,
      difficulty,
      predictions,
      recommendation,
      confidence: this.calculateConfidence(features)
    };
  }

  /**
   * Calculate task difficulty from features
   */
  calculateDifficulty(features) {
    let difficulty = 0;

    difficulty += features.length * DIFFICULTY_FEATURES.LENGTH.weight;
    difficulty += features.complexityLevel * DIFFICULTY_FEATURES.COMPLEXITY_KEYWORDS.weight;
    difficulty += features.technicalDepth * DIFFICULTY_FEATURES.TECHNICAL_DEPTH.weight;
    difficulty += features.ambiguity * DIFFICULTY_FEATURES.AMBIGUITY.weight;
    difficulty += features.domainSpecificity * DIFFICULTY_FEATURES.DOMAIN_SPECIFICITY.weight;
    difficulty += features.multiStep * DIFFICULTY_FEATURES.MULTI_STEP.weight;

    return Math.max(0, Math.min(1, difficulty));
  }

  /**
   * Predict quality for a specific tier
   */
  predictForTier(difficulty, tier) {
    // Base quality by tier
    const baseQuality = {
      instant: 0.6,
      fast: 0.72,
      balanced: 0.85,
      powerful: 0.95
    };

    // Quality degrades with difficulty
    const degradation = {
      instant: difficulty * 0.35,
      fast: difficulty * 0.25,
      balanced: difficulty * 0.15,
      powerful: difficulty * 0.08
    };

    const predicted = baseQuality[tier] - degradation[tier];

    return {
      tier,
      predictedQuality: Math.max(0.3, Math.min(0.99, predicted)),
      degradation: degradation[tier]
    };
  }

  /**
   * Recommend optimal tier
   */
  recommendTier(predictions, features) {
    const qualityThreshold = 0.75; // Minimum acceptable quality

    // Find cheapest tier that meets threshold
    const tiers = ['instant', 'fast', 'balanced', 'powerful'];

    for (const tier of tiers) {
      if (predictions[tier].predictedQuality >= qualityThreshold) {
        return {
          tier,
          reason: `Predicted quality ${(predictions[tier].predictedQuality * 100).toFixed(0)}% exceeds threshold`,
          costSavings: this.calculateCostSavings(tier)
        };
      }
    }

    // Default to powerful if nothing meets threshold
    return {
      tier: 'powerful',
      reason: 'Task difficulty requires powerful model',
      costSavings: 0
    };
  }

  /**
   * Calculate cost savings from using lower tier
   */
  calculateCostSavings(tier) {
    const savings = {
      instant: 95,
      fast: 85,
      balanced: 50,
      powerful: 0
    };
    return savings[tier] || 0;
  }

  /**
   * Calculate prediction confidence
   */
  calculateConfidence(features) {
    // Lower confidence for ambiguous or unusual tasks
    let confidence = 0.8;

    if (features.ambiguity > 0.5) confidence -= 0.2;
    if (features.domainSpecificity > 0.7) confidence -= 0.1;
    if (features.multiStep > 0.6) confidence -= 0.1;

    // Higher confidence if we have historical data
    if (this.historicalData.length > 100) confidence += 0.1;

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  /**
   * Record actual result for calibration
   */
  recordResult(task, tier, actualQuality) {
    const prediction = this.predict(task);

    this.historicalData.push({
      task: task.substring(0, 200),
      tier,
      predictedQuality: prediction.predictions[tier].predictedQuality,
      actualQuality,
      error: Math.abs(prediction.predictions[tier].predictedQuality - actualQuality),
      timestamp: Date.now()
    });

    // Keep history bounded
    if (this.historicalData.length > this.maxHistory) {
      this.historicalData.shift();
    }
  }

  /**
   * Get calibration statistics
   */
  getCalibrationStats() {
    if (this.historicalData.length === 0) {
      return { message: 'No calibration data yet' };
    }

    const avgError = this.historicalData.reduce((sum, d) => sum + d.error, 0) / this.historicalData.length;
    const tierStats = {};

    for (const tier of ['instant', 'fast', 'balanced', 'powerful']) {
      const tierData = this.historicalData.filter(d => d.tier === tier);
      if (tierData.length > 0) {
        tierStats[tier] = {
          count: tierData.length,
          avgError: (tierData.reduce((sum, d) => sum + d.error, 0) / tierData.length).toFixed(3),
          avgPredicted: (tierData.reduce((sum, d) => sum + d.predictedQuality, 0) / tierData.length).toFixed(3),
          avgActual: (tierData.reduce((sum, d) => sum + d.actualQuality, 0) / tierData.length).toFixed(3)
        };
      }
    }

    return {
      totalRecords: this.historicalData.length,
      avgError: avgError.toFixed(3),
      byTier: tierStats
    };
  }
}

/**
 * Smart Router
 * Routes tasks to appropriate tier based on predictions
 */
class SmartRouter {
  constructor(config = {}) {
    this.predictor = new QualityPredictor(config);
    this.qualityThreshold = config.qualityThreshold || 0.75;
    this.costWeight = config.costWeight || 0.3; // How much to prioritize cost
  }

  /**
   * Route task to optimal tier
   */
  route(task, constraints = {}) {
    const prediction = this.predictor.predict(task);
    const { minQuality = this.qualityThreshold, maxCost = Infinity } = constraints;

    // Adjust recommendation based on constraints
    let recommended = prediction.recommendation.tier;

    // If quality constraint is higher, may need to upgrade
    if (minQuality > this.qualityThreshold) {
      const tiers = ['instant', 'fast', 'balanced', 'powerful'];
      for (const tier of tiers) {
        if (prediction.predictions[tier].predictedQuality >= minQuality) {
          recommended = tier;
          break;
        }
      }
    }

    return {
      tier: recommended,
      prediction,
      constraints,
      reasoning: this.explainRouting(prediction, recommended, constraints)
    };
  }

  /**
   * Explain routing decision
   */
  explainRouting(prediction, tier, constraints) {
    const reasons = [];

    reasons.push(`Task difficulty: ${(prediction.difficulty * 100).toFixed(0)}%`);
    reasons.push(`Predicted quality at ${tier}: ${(prediction.predictions[tier].predictedQuality * 100).toFixed(0)}%`);

    if (prediction.features.technicalDepth > 0.5) {
      reasons.push('Technical content detected - higher tier beneficial');
    }
    if (prediction.features.ambiguity > 0.5) {
      reasons.push('Ambiguous task - may need clarification');
    }
    if (tier !== 'powerful') {
      reasons.push(`Cost savings: ${prediction.recommendation.costSavings}%`);
    }

    return reasons;
  }

  /**
   * Record result for learning
   */
  recordResult(task, tier, quality) {
    this.predictor.recordResult(task, tier, quality);
  }
}

module.exports = {
  DIFFICULTY_FEATURES,
  COMPLEXITY_KEYWORDS,
  FeatureExtractor,
  QualityPredictor,
  SmartRouter
};
