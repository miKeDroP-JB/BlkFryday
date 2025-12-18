/**
 * CASCADE ENGINE
 * Smart model escalation: Start cheap, escalate only when needed
 *
 * "Why use a cannon when a slingshot will do?" - Cascade Philosophy
 *
 * FLOW: Fast/Cheap → Evaluate → Good enough? → Done
 *                              → Not good enough? → Escalate
 */

const { MultiModelClient, AI_PROVIDERS } = require('./MultiModelSwarm');

// Cascade tiers from cheapest to most powerful
const CASCADE_TIERS = [
  {
    name: 'INSTANT',
    providers: [
      { provider: 'groq', model: 'llama-3.1-8b-instant' },
      { provider: 'openai', model: 'gpt-4o-mini' },
      { provider: 'anthropic', model: 'claude-3-haiku-20240307' }
    ],
    maxCostPer1k: 0.0003,
    expectedLatency: 200,
    qualityThreshold: 0.6, // Accept if quality >= 60%
    useCases: ['simple questions', 'formatting', 'extraction', 'classification']
  },
  {
    name: 'FAST',
    providers: [
      { provider: 'groq', model: 'llama-3.1-70b-versatile' },
      { provider: 'mistral', model: 'mistral-small-latest' },
      { provider: 'google', model: 'gemini-1.5-flash' }
    ],
    maxCostPer1k: 0.001,
    expectedLatency: 500,
    qualityThreshold: 0.75,
    useCases: ['summarization', 'translation', 'basic coding', 'Q&A']
  },
  {
    name: 'BALANCED',
    providers: [
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      { provider: 'google', model: 'gemini-1.5-pro' }
    ],
    maxCostPer1k: 0.005,
    expectedLatency: 1500,
    qualityThreshold: 0.85,
    useCases: ['complex reasoning', 'detailed analysis', 'code generation']
  },
  {
    name: 'POWERFUL',
    providers: [
      { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
      { provider: 'openai', model: 'gpt-4-turbo' },
      { provider: 'mistral', model: 'mistral-large-latest' }
    ],
    maxCostPer1k: 0.015,
    expectedLatency: 3000,
    qualityThreshold: 0.95,
    useCases: ['expert analysis', 'creative writing', 'complex problem solving']
  },
  {
    name: 'MAXIMUM',
    providers: [
      { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
      { provider: 'openai', model: 'gpt-4-turbo' }
    ],
    maxCostPer1k: 0.03,
    expectedLatency: 5000,
    qualityThreshold: 1.0, // Always accept at this tier
    useCases: ['mission-critical', 'research', 'highest stakes decisions']
  }
];

// Quality evaluation criteria
const QUALITY_SIGNALS = {
  // Positive signals
  COMPLETE: { weight: 0.2, pattern: /\b(therefore|in conclusion|to summarize|finally)\b/i },
  STRUCTURED: { weight: 0.15, pattern: /^(\d+\.|[-*•]|\#{1,3}\s)/m },
  DETAILED: { weight: 0.15, minLength: 200 },
  CODE_BLOCKS: { weight: 0.1, pattern: /```[\s\S]+?```/ },
  REASONING: { weight: 0.1, pattern: /\b(because|since|therefore|thus|hence)\b/i },

  // Negative signals
  UNCERTAINTY: { weight: -0.1, pattern: /\b(I'm not sure|I don't know|I cannot|I can't)\b/i },
  REFUSAL: { weight: -0.2, pattern: /\b(I cannot help|I'm unable|I won't|I refuse)\b/i },
  TOO_SHORT: { weight: -0.15, maxLength: 50 },
  REPETITIVE: { weight: -0.1, pattern: /(.{20,})\1{2,}/ },
  ERROR: { weight: -0.3, pattern: /\b(error|exception|failed|invalid)\b/i }
};

/**
 * Quality Evaluator
 * Scores response quality to decide if escalation is needed
 */
class QualityEvaluator {
  constructor(config = {}) {
    this.minQuality = config.minQuality || 0.7;
    this.signals = { ...QUALITY_SIGNALS, ...config.customSignals };
  }

  /**
   * Evaluate response quality
   * Returns score from 0.0 to 1.0
   */
  evaluate(response, task) {
    if (!response || !response.content) {
      return { score: 0, reasons: ['Empty response'] };
    }

    const content = response.content;
    let score = 0.5; // Base score
    const reasons = [];

    // Check each signal
    for (const [name, signal] of Object.entries(this.signals)) {
      let matched = false;

      if (signal.pattern && signal.pattern.test(content)) {
        matched = true;
      } else if (signal.minLength && content.length >= signal.minLength) {
        matched = true;
      } else if (signal.maxLength && content.length <= signal.maxLength) {
        matched = true;
      }

      if (matched) {
        score += signal.weight;
        reasons.push(`${signal.weight > 0 ? '+' : ''}${name}: ${signal.weight.toFixed(2)}`);
      }
    }

    // Task-specific adjustments
    const taskAdjustment = this.evaluateTaskFit(content, task);
    score += taskAdjustment.adjustment;
    reasons.push(...taskAdjustment.reasons);

    // Normalize score to 0-1 range
    score = Math.max(0, Math.min(1, score));

    return {
      score,
      reasons,
      passesThreshold: score >= this.minQuality,
      recommendation: this.getRecommendation(score)
    };
  }

  evaluateTaskFit(content, task) {
    const taskLower = task.toLowerCase();
    const contentLower = content.toLowerCase();
    let adjustment = 0;
    const reasons = [];

    // Check if response addresses key terms from task
    const keyTerms = task.split(/\s+/).filter(w => w.length > 4);
    const termCoverage = keyTerms.filter(t =>
      contentLower.includes(t.toLowerCase())
    ).length / Math.max(keyTerms.length, 1);

    if (termCoverage > 0.5) {
      adjustment += 0.1;
      reasons.push('+RELEVANT: 0.10');
    }

    // Check for code if task asks for code
    if (taskLower.includes('code') || taskLower.includes('function') || taskLower.includes('implement')) {
      if (/```[\s\S]+?```/.test(content)) {
        adjustment += 0.15;
        reasons.push('+HAS_CODE: 0.15');
      } else {
        adjustment -= 0.1;
        reasons.push('-MISSING_CODE: -0.10');
      }
    }

    // Check for list if task asks for list
    if (taskLower.includes('list') || taskLower.includes('steps') || taskLower.includes('options')) {
      if (/^(\d+\.|[-*•])/m.test(content)) {
        adjustment += 0.1;
        reasons.push('+HAS_LIST: 0.10');
      }
    }

    return { adjustment, reasons };
  }

  getRecommendation(score) {
    if (score >= 0.9) return 'EXCELLENT - Use as is';
    if (score >= 0.75) return 'GOOD - Acceptable';
    if (score >= 0.6) return 'FAIR - Consider escalation';
    if (score >= 0.4) return 'POOR - Recommend escalation';
    return 'BAD - Escalation required';
  }
}

/**
 * Cascade Engine
 * Orchestrates the cascade flow
 */
class CascadeEngine {
  constructor(config = {}) {
    this.client = new MultiModelClient(config.apiKeys);
    this.evaluator = new QualityEvaluator(config);
    this.tiers = CASCADE_TIERS;
    this.stats = {
      totalRequests: 0,
      tierUsage: { INSTANT: 0, FAST: 0, BALANCED: 0, POWERFUL: 0, MAXIMUM: 0 },
      avgTier: 0,
      totalCostSaved: 0,
      escalations: 0
    };
  }

  /**
   * Determine starting tier based on task complexity
   */
  analyzeComplexity(task) {
    const taskLower = task.toLowerCase();
    const length = task.length;

    // Complexity signals
    let complexity = 0;

    // Length-based
    if (length > 1000) complexity += 2;
    else if (length > 500) complexity += 1;

    // Keyword-based
    const complexKeywords = ['analyze', 'compare', 'explain why', 'design', 'architect', 'optimize', 'complex'];
    const simpleKeywords = ['what is', 'list', 'define', 'format', 'convert', 'translate'];

    for (const kw of complexKeywords) {
      if (taskLower.includes(kw)) complexity += 1;
    }
    for (const kw of simpleKeywords) {
      if (taskLower.includes(kw)) complexity -= 1;
    }

    // Code complexity
    if (taskLower.includes('algorithm') || taskLower.includes('system design')) complexity += 2;
    if (taskLower.includes('simple') || taskLower.includes('basic')) complexity -= 1;

    // Map complexity to starting tier
    if (complexity <= -1) return 0; // INSTANT
    if (complexity <= 1) return 1;  // FAST
    if (complexity <= 3) return 2;  // BALANCED
    return 3; // POWERFUL
  }

  /**
   * Execute with cascade - start low, escalate as needed
   */
  async execute(task, options = {}) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    // Determine starting tier
    let currentTierIndex = options.startTier !== undefined
      ? options.startTier
      : this.analyzeComplexity(task);

    const maxTier = options.maxTier !== undefined ? options.maxTier : this.tiers.length - 1;
    const attempts = [];
    let finalResult = null;

    // Cascade through tiers
    while (currentTierIndex <= maxTier) {
      const tier = this.tiers[currentTierIndex];
      this.stats.tierUsage[tier.name]++;

      // Try providers in this tier
      for (const providerConfig of tier.providers) {
        const messages = [
          { role: 'system', content: `You are a helpful AI assistant. Be concise but thorough. Tier: ${tier.name}` },
          { role: 'user', content: task }
        ];

        const result = await this.client.call(
          providerConfig.provider,
          providerConfig.model,
          messages,
          options
        );

        if (!result.success) {
          attempts.push({
            tier: tier.name,
            provider: providerConfig.provider,
            model: providerConfig.model,
            success: false,
            error: result.error
          });
          continue; // Try next provider
        }

        // Evaluate quality
        const evaluation = this.evaluator.evaluate(result, task);

        attempts.push({
          tier: tier.name,
          provider: providerConfig.provider,
          model: providerConfig.model,
          success: true,
          latency: result.latency,
          quality: evaluation.score,
          qualityReasons: evaluation.reasons
        });

        // Check if quality is acceptable for this tier
        if (evaluation.score >= tier.qualityThreshold) {
          finalResult = {
            success: true,
            content: result.content,
            tier: tier.name,
            tierIndex: currentTierIndex,
            provider: providerConfig.provider,
            model: providerConfig.model,
            quality: evaluation.score,
            qualityReasons: evaluation.reasons,
            tokens: result.tokens,
            latency: result.latency,
            attempts,
            escalated: currentTierIndex > this.analyzeComplexity(task),
            costSavings: this.calculateCostSavings(currentTierIndex, maxTier)
          };

          // Update stats
          this.stats.avgTier = (this.stats.avgTier * (this.stats.totalRequests - 1) + currentTierIndex) / this.stats.totalRequests;
          this.stats.totalCostSaved += finalResult.costSavings;

          return finalResult;
        }

        // Quality not sufficient, break to escalate
        break;
      }

      // Escalate to next tier
      currentTierIndex++;
      if (currentTierIndex <= maxTier) {
        this.stats.escalations++;
      }
    }

    // If we got here, we exhausted all tiers
    // Return best attempt
    const bestAttempt = attempts.filter(a => a.success).sort((a, b) => b.quality - a.quality)[0];

    if (bestAttempt) {
      return {
        success: true,
        content: 'Maximum tier reached',
        tier: this.tiers[maxTier].name,
        tierIndex: maxTier,
        quality: bestAttempt.quality,
        attempts,
        escalated: true,
        warning: 'Hit maximum tier without meeting quality threshold'
      };
    }

    return {
      success: false,
      error: 'All tiers exhausted without successful response',
      attempts,
      totalLatency: Date.now() - startTime
    };
  }

  /**
   * Calculate cost savings from using lower tier
   */
  calculateCostSavings(usedTier, maxTier) {
    const maxCost = this.tiers[maxTier].maxCostPer1k;
    const usedCost = this.tiers[usedTier].maxCostPer1k;
    return ((maxCost - usedCost) / maxCost) * 100;
  }

  /**
   * Force a specific tier (bypass cascade)
   */
  async executeAtTier(task, tierName, options = {}) {
    const tierIndex = this.tiers.findIndex(t => t.name === tierName);
    if (tierIndex === -1) {
      throw new Error(`Unknown tier: ${tierName}`);
    }

    return this.execute(task, { ...options, startTier: tierIndex, maxTier: tierIndex });
  }

  /**
   * Get cascade statistics
   */
  getStats() {
    const totalUsage = Object.values(this.stats.tierUsage).reduce((a, b) => a + b, 0);

    return {
      ...this.stats,
      tierDistribution: Object.fromEntries(
        Object.entries(this.stats.tierUsage).map(([k, v]) => [k, `${((v / totalUsage) * 100).toFixed(1)}%`])
      ),
      avgTierName: this.tiers[Math.round(this.stats.avgTier)]?.name || 'N/A',
      escalationRate: `${((this.stats.escalations / this.stats.totalRequests) * 100).toFixed(1)}%`,
      avgCostSavings: `${(this.stats.totalCostSaved / this.stats.totalRequests).toFixed(1)}%`
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      tierUsage: { INSTANT: 0, FAST: 0, BALANCED: 0, POWERFUL: 0, MAXIMUM: 0 },
      avgTier: 0,
      totalCostSaved: 0,
      escalations: 0
    };
  }
}

/**
 * Quick cascade helper
 */
async function cascade(task, options = {}) {
  const engine = new CascadeEngine(options);
  return engine.execute(task, options);
}

module.exports = {
  CASCADE_TIERS,
  QUALITY_SIGNALS,
  QualityEvaluator,
  CascadeEngine,
  cascade
};
