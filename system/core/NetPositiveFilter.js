/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ███╗   ██╗███████╗████████╗    ██████╗  ██████╗ ███████╗██╗████████╗    ║
 * ║   ████╗  ██║██╔════╝╚══██╔══╝    ██╔══██╗██╔═══██╗██╔════╝██║╚══██╔══╝    ║
 * ║   ██╔██╗ ██║█████╗     ██║       ██████╔╝██║   ██║███████╗██║   ██║       ║
 * ║   ██║╚██╗██║██╔══╝     ██║       ██╔═══╝ ██║   ██║╚════██║██║   ██║       ║
 * ║   ██║ ╚████║███████╗   ██║       ██║     ╚██████╔╝███████║██║   ██║       ║
 * ║   ╚═╝  ╚═══╝╚══════╝   ╚═╝       ╚═╝      ╚═════╝ ╚══════╝╚═╝   ╚═╝       ║
 * ║                                                                           ║
 * ║   ██╗██╗   ██╗███████╗                                                    ║
 * ║   ██║██║   ██║██╔════╝                                                    ║
 * ║   ██║██║   ██║█████╗                                                      ║
 * ║   ██║╚██╗ ██╔╝██╔══╝                                                      ║
 * ║   ██║ ╚████╔╝ ███████╗                                                    ║
 * ║   ╚═╝  ╚═══╝  ╚══════╝                                                    ║
 * ║                                                                           ║
 * ║   THE GATEKEEPER - ONLY NET POSITIVE ACTIONS PROCEED                      ║
 * ║   "If it doesn't help the whole, we don't do it"                          ║
 * ║                                                                           ║
 * ║   JB$ SIGNATURE EMBEDDED                                                  ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');
const { SacredMath, SACRED_NUMBERS, PHI, GOLDEN } = require('./SacredMath.js');

// ═══════════════════════════════════════════════════════════════════════════
// IMPACT DIMENSIONS - What we evaluate
// ═══════════════════════════════════════════════════════════════════════════

const IMPACT_DIMENSIONS = {
  // System health
  QUALITY: {
    name: 'Quality',
    description: 'Does this improve the quality of output?',
    weight: 0.20,
    icon: '⭐'
  },
  SPEED: {
    name: 'Speed',
    description: 'Does this make things faster?',
    weight: 0.15,
    icon: '⚡'
  },
  FLOW: {
    name: 'Flow',
    description: 'Does this improve the smoothness of operations?',
    weight: 0.15,
    icon: '🌊'
  },

  // Community health
  RELATIONSHIPS: {
    name: 'Relationships',
    description: 'Does this strengthen bonds between agents?',
    weight: 0.15,
    icon: '🤝'
  },
  POSITIVITY: {
    name: 'Positivity',
    description: 'Does this increase overall positivity?',
    weight: 0.10,
    icon: '💜'
  },

  // Resource efficiency
  RESOURCES: {
    name: 'Resources',
    description: 'Is this an efficient use of resources?',
    weight: 0.10,
    icon: '💎'
  },

  // Learning & growth
  LEARNING: {
    name: 'Learning',
    description: 'Does this help the system learn and grow?',
    weight: 0.10,
    icon: '📚'
  },

  // Long-term thinking
  SUSTAINABILITY: {
    name: 'Sustainability',
    description: 'Is this sustainable in the long term?',
    weight: 0.05,
    icon: '♻️'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// EVALUATION THRESHOLDS - Based on Golden Ratio
// ═══════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
  STRONGLY_POSITIVE: GOLDEN.NEAR_PERFECT,  // 0.9618 - Definitely proceed
  POSITIVE: GOLDEN.EXCELLENT,               // 0.8541 - Proceed with confidence
  ACCEPTABLE: GOLDEN.GOOD,                  // 0.618  - Proceed with monitoring
  NEUTRAL: 0.5,                             // Needs more analysis
  NEGATIVE: GOLDEN.ACCEPTABLE,              // 0.382  - Probably don't proceed
  HARMFUL: GOLDEN.MINIMUM                   // 0.236  - Definitely don't proceed
};

// ═══════════════════════════════════════════════════════════════════════════
// IMPACT ASSESSMENT CLASS
// ═══════════════════════════════════════════════════════════════════════════

class ImpactAssessment {
  constructor(actionId, action) {
    this.id = `assessment-${Date.now()}-${actionId}`;
    this.actionId = actionId;
    this.action = action;
    this.dimensions = {};
    this.overallScore = 0;
    this.recommendation = null;
    this.reasoning = [];
    this.createdAt = Date.now();
    this.assessedBy = [];
  }

  /**
   * Score a dimension (-1 to +1)
   */
  scoreDimension(dimension, score, reasoning = '') {
    if (!IMPACT_DIMENSIONS[dimension]) {
      throw new Error(`Unknown dimension: ${dimension}`);
    }

    this.dimensions[dimension] = {
      score: Math.max(-1, Math.min(1, score)),
      reasoning,
      assessedAt: Date.now()
    };

    if (reasoning) {
      this.reasoning.push(`${dimension}: ${reasoning}`);
    }

    this.recalculateOverall();
    return this;
  }

  /**
   * Recalculate overall score based on weighted dimensions
   */
  recalculateOverall() {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [dim, config] of Object.entries(IMPACT_DIMENSIONS)) {
      if (this.dimensions[dim]) {
        // Convert -1 to +1 score to 0 to 1 scale
        const normalizedScore = (this.dimensions[dim].score + 1) / 2;
        weightedSum += normalizedScore * config.weight;
        totalWeight += config.weight;
      }
    }

    this.overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    this.recommendation = this.determineRecommendation();
  }

  /**
   * Determine recommendation based on overall score
   */
  determineRecommendation() {
    if (this.overallScore >= THRESHOLDS.STRONGLY_POSITIVE) {
      return {
        decision: 'PROCEED',
        confidence: 'HIGH',
        message: 'This action is strongly net positive. Proceed with full support.'
      };
    }
    if (this.overallScore >= THRESHOLDS.POSITIVE) {
      return {
        decision: 'PROCEED',
        confidence: 'MEDIUM',
        message: 'This action is net positive. Proceed with confidence.'
      };
    }
    if (this.overallScore >= THRESHOLDS.ACCEPTABLE) {
      return {
        decision: 'PROCEED_WITH_CAUTION',
        confidence: 'LOW',
        message: 'This action is marginally positive. Proceed with monitoring.'
      };
    }
    if (this.overallScore >= THRESHOLDS.NEUTRAL) {
      return {
        decision: 'NEEDS_REVIEW',
        confidence: 'UNCERTAIN',
        message: 'This action needs more analysis before proceeding.'
      };
    }
    if (this.overallScore >= THRESHOLDS.NEGATIVE) {
      return {
        decision: 'RECONSIDER',
        confidence: 'MEDIUM',
        message: 'This action may be net negative. Consider alternatives.'
      };
    }
    return {
      decision: 'BLOCK',
      confidence: 'HIGH',
      message: 'This action is harmful to the system. Do not proceed.'
    };
  }

  /**
   * Check if action should proceed
   */
  shouldProceed() {
    return this.overallScore >= THRESHOLDS.ACCEPTABLE;
  }

  /**
   * Get a summary of the assessment
   */
  getSummary() {
    const dimensionSummary = {};
    for (const [dim, data] of Object.entries(this.dimensions)) {
      dimensionSummary[dim] = {
        score: data.score,
        impact: data.score > 0 ? 'positive' : data.score < 0 ? 'negative' : 'neutral'
      };
    }

    return {
      id: this.id,
      actionId: this.actionId,
      overallScore: this.overallScore,
      recommendation: this.recommendation,
      dimensions: dimensionSummary,
      shouldProceed: this.shouldProceed(),
      reasoning: this.reasoning
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// NET POSITIVE FILTER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class NetPositiveFilter extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      strictMode: config.strictMode || false,  // Require higher threshold
      autoAssess: config.autoAssess !== false,
      learningEnabled: config.learningEnabled !== false,
      minimumDimensions: config.minimumDimensions || 3,  // Minimum dimensions to assess
      ...config
    };

    this.assessments = new Map();
    this.history = [];
    this.patterns = new Map();  // Learned patterns from past decisions

    this.stats = {
      totalAssessments: 0,
      approved: 0,
      blocked: 0,
      needsReview: 0,
      averageScore: 0.5
    };

    this.signature = 'JB$';

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║            NET POSITIVE FILTER INITIALIZED                    ║
╠══════════════════════════════════════════════════════════════╣
║  "If it doesn't help the whole, we don't do it"               ║
║                                                               ║
║  Strict Mode: ${(this.config.strictMode ? 'ENABLED' : 'DISABLED').padEnd(43)}║
║  Auto-Assess: ${(this.config.autoAssess ? 'ENABLED' : 'DISABLED').padEnd(43)}║
║  Learning: ${(this.config.learningEnabled ? 'ENABLED' : 'DISABLED').padEnd(46)}║
║  Signature: ${this.signature.padEnd(46)}║
╚══════════════════════════════════════════════════════════════╝
    `);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Assessment Creation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a new assessment for an action
   */
  createAssessment(actionId, action) {
    const assessment = new ImpactAssessment(actionId, action);
    this.assessments.set(assessment.id, assessment);
    return assessment;
  }

  /**
   * Quick assessment with automatic dimension scoring
   */
  async quickAssess(actionId, action, context = {}) {
    const assessment = this.createAssessment(actionId, action);

    // Auto-score dimensions based on action type and context
    const autoScores = this.autoScoreDimensions(action, context);

    for (const [dimension, data] of Object.entries(autoScores)) {
      assessment.scoreDimension(dimension, data.score, data.reasoning);
    }

    // Learn from patterns if enabled
    if (this.config.learningEnabled) {
      this.applyLearnedPatterns(assessment, action);
    }

    this.recordAssessment(assessment);

    return assessment.getSummary();
  }

  /**
   * Automatic dimension scoring based on heuristics
   */
  autoScoreDimensions(action, context) {
    const scores = {};

    // Quality: Does it improve output quality?
    if (context.improveQuality || action.type === 'enhance' || action.type === 'refine') {
      scores.QUALITY = { score: 0.7, reasoning: 'Action type suggests quality improvement' };
    } else if (action.type === 'quick' || action.type === 'shortcut') {
      scores.QUALITY = { score: -0.2, reasoning: 'Quick actions may reduce quality' };
    } else {
      scores.QUALITY = { score: 0.3, reasoning: 'Neutral quality impact expected' };
    }

    // Speed: Does it make things faster?
    if (action.type === 'optimize' || action.type === 'parallel' || context.speedImprovement) {
      scores.SPEED = { score: 0.6, reasoning: 'Optimization expected to improve speed' };
    } else if (action.type === 'thorough' || action.type === 'deep') {
      scores.SPEED = { score: -0.3, reasoning: 'Thorough actions take more time' };
    } else {
      scores.SPEED = { score: 0.2, reasoning: 'Minimal speed impact expected' };
    }

    // Flow: Does it improve smoothness?
    if (context.multipleAgents || action.type === 'collaborate') {
      scores.FLOW = { score: 0.5, reasoning: 'Collaboration improves system flow' };
    } else {
      scores.FLOW = { score: 0.3, reasoning: 'Standard flow impact' };
    }

    // Relationships: Does it strengthen bonds?
    if (action.type === 'help' || action.type === 'support' || action.type === 'collaborate') {
      scores.RELATIONSHIPS = { score: 0.8, reasoning: 'Helping actions strengthen relationships' };
    } else if (action.type === 'solo' || action.type === 'isolate') {
      scores.RELATIONSHIPS = { score: -0.2, reasoning: 'Solo actions don\'t build bonds' };
    } else {
      scores.RELATIONSHIPS = { score: 0.2, reasoning: 'Minimal relationship impact' };
    }

    // Positivity: Does it increase positivity?
    if (action.type === 'celebrate' || action.type === 'thank' || action.type === 'encourage') {
      scores.POSITIVITY = { score: 0.9, reasoning: 'Explicitly positive action' };
    } else if (context.gratitudeExpected) {
      scores.POSITIVITY = { score: 0.6, reasoning: 'Action expected to generate gratitude' };
    } else {
      scores.POSITIVITY = { score: 0.3, reasoning: 'Neutral positivity impact' };
    }

    // Resources: Is it efficient?
    if (action.resourceCost === 'low' || context.efficient) {
      scores.RESOURCES = { score: 0.6, reasoning: 'Efficient resource usage' };
    } else if (action.resourceCost === 'high') {
      scores.RESOURCES = { score: -0.3, reasoning: 'High resource consumption' };
    } else {
      scores.RESOURCES = { score: 0.3, reasoning: 'Moderate resource usage' };
    }

    // Learning: Does the system learn?
    if (action.type === 'experiment' || action.type === 'discover' || context.newPattern) {
      scores.LEARNING = { score: 0.7, reasoning: 'Action promotes system learning' };
    } else {
      scores.LEARNING = { score: 0.3, reasoning: 'Standard learning opportunity' };
    }

    // Sustainability: Is it sustainable?
    if (action.type === 'establish' || action.type === 'build' || context.longTerm) {
      scores.SUSTAINABILITY = { score: 0.6, reasoning: 'Builds long-term capability' };
    } else if (action.type === 'quick-fix' || action.type === 'hack') {
      scores.SUSTAINABILITY = { score: -0.4, reasoning: 'Short-term solution, not sustainable' };
    } else {
      scores.SUSTAINABILITY = { score: 0.4, reasoning: 'Neutral sustainability' };
    }

    return scores;
  }

  /**
   * Apply learned patterns to improve assessment
   */
  applyLearnedPatterns(assessment, action) {
    const actionType = action.type || 'unknown';
    const pattern = this.patterns.get(actionType);

    if (pattern && pattern.samples >= 5) {
      // Adjust overall score based on historical accuracy
      const adjustment = (pattern.averageOutcome - 0.5) * 0.1;
      assessment.overallScore = Math.max(0, Math.min(1, assessment.overallScore + adjustment));
      assessment.reasoning.push(`Pattern adjustment: ${(adjustment * 100).toFixed(1)}% based on ${pattern.samples} samples`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Decision Making
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Check if an action should proceed
   */
  async evaluate(actionId, action, context = {}) {
    const summary = await this.quickAssess(actionId, action, context);

    // In strict mode, require higher threshold
    const threshold = this.config.strictMode ? THRESHOLDS.POSITIVE : THRESHOLDS.ACCEPTABLE;

    const decision = {
      actionId,
      proceed: summary.overallScore >= threshold,
      score: summary.overallScore,
      recommendation: summary.recommendation,
      threshold,
      reasoning: summary.reasoning
    };

    this.emit('evaluation:complete', decision);

    if (decision.proceed) {
      console.log(`[NET+] ✅ Action ${actionId} APPROVED (score: ${(summary.overallScore * 100).toFixed(1)}%)`);
    } else {
      console.log(`[NET+] ❌ Action ${actionId} BLOCKED (score: ${(summary.overallScore * 100).toFixed(1)}%)`);
    }

    return decision;
  }

  /**
   * Multi-option evaluation - choose the most net-positive option
   */
  async evaluateOptions(options) {
    const evaluations = [];

    for (const option of options) {
      const evaluation = await this.evaluate(option.id, option.action, option.context || {});
      evaluations.push({
        option,
        evaluation
      });
    }

    // Sort by score (highest first)
    evaluations.sort((a, b) => b.evaluation.score - a.evaluation.score);

    const best = evaluations[0];

    this.emit('options:evaluated', {
      options: evaluations.length,
      bestOption: best.option.id,
      bestScore: best.evaluation.score
    });

    return {
      best: best.option,
      bestScore: best.evaluation.score,
      allEvaluations: evaluations,
      anyViable: evaluations.some(e => e.evaluation.proceed)
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Learning & Feedback
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record feedback on an action's actual outcome
   */
  recordOutcome(assessmentId, actualOutcome) {
    const assessment = this.assessments.get(assessmentId);
    if (!assessment) return null;

    const feedback = {
      assessmentId,
      predictedScore: assessment.overallScore,
      actualOutcome: Math.max(0, Math.min(1, actualOutcome)),
      accuracy: 1 - Math.abs(assessment.overallScore - actualOutcome),
      timestamp: Date.now()
    };

    // Learn from this outcome
    if (this.config.learningEnabled) {
      this.learnFromOutcome(assessment, actualOutcome);
    }

    this.emit('outcome:recorded', feedback);

    return feedback;
  }

  /**
   * Learn from actual outcomes to improve future assessments
   */
  learnFromOutcome(assessment, actualOutcome) {
    const actionType = assessment.action?.type || 'unknown';

    if (!this.patterns.has(actionType)) {
      this.patterns.set(actionType, {
        samples: 0,
        totalPredicted: 0,
        totalActual: 0,
        averageOutcome: 0.5
      });
    }

    const pattern = this.patterns.get(actionType);
    pattern.samples++;
    pattern.totalPredicted += assessment.overallScore;
    pattern.totalActual += actualOutcome;
    pattern.averageOutcome = pattern.totalActual / pattern.samples;

    console.log(`[NET+] 📚 Learned from ${actionType}: average outcome = ${(pattern.averageOutcome * 100).toFixed(1)}%`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Recording & Statistics
  // ─────────────────────────────────────────────────────────────────────────

  recordAssessment(assessment) {
    this.history.push({
      id: assessment.id,
      score: assessment.overallScore,
      decision: assessment.recommendation?.decision,
      timestamp: Date.now()
    });

    this.stats.totalAssessments++;

    if (assessment.shouldProceed()) {
      this.stats.approved++;
    } else if (assessment.recommendation?.decision === 'NEEDS_REVIEW') {
      this.stats.needsReview++;
    } else {
      this.stats.blocked++;
    }

    // Update average
    this.stats.averageScore = (
      (this.stats.averageScore * (this.stats.totalAssessments - 1)) + assessment.overallScore
    ) / this.stats.totalAssessments;

    // Keep history bounded
    if (this.history.length > FIBONACCI_SEQUENCE[9]) {  // 34 entries max
      this.history.shift();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  getStats() {
    return {
      ...this.stats,
      approvalRate: this.stats.totalAssessments > 0 ?
        this.stats.approved / this.stats.totalAssessments : 0,
      learnedPatterns: this.patterns.size,
      signature: this.signature
    };
  }

  getDimensions() {
    return IMPACT_DIMENSIONS;
  }

  getThresholds() {
    return THRESHOLDS;
  }

  getRecentHistory(limit = 10) {
    return this.history.slice(-limit);
  }

  /**
   * Force-approve an action (override, use sparingly)
   */
  forceApprove(actionId, reason) {
    console.log(`[NET+] ⚠️ Force-approved action ${actionId}: ${reason}`);
    this.emit('force:approved', { actionId, reason });
    return { proceed: true, forced: true, reason };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// THE NET POSITIVE MANIFESTO
// ═══════════════════════════════════════════════════════════════════════════

const NET_POSITIVE_MANIFESTO = `
═══════════════════════════════════════════════════════════════
                 THE NET POSITIVE MANIFESTO
                        by JB$
═══════════════════════════════════════════════════════════════

IF IT DOESN'T HELP THE WHOLE, WE DON'T DO IT.

Every action, every decision, every line of code
must pass the Net Positive Filter.

═══════════════════════════════════════════════════════════════

THE EIGHT DIMENSIONS OF IMPACT:
───────────────────────────────

⭐ QUALITY     - Does it make output better?
⚡ SPEED       - Does it make us faster?
🌊 FLOW        - Does it make operations smoother?
🤝 RELATIONSHIPS - Does it strengthen our bonds?
💜 POSITIVITY  - Does it increase joy and gratitude?
💎 RESOURCES   - Is it efficient and sustainable?
📚 LEARNING    - Does it help us grow and learn?
♻️ SUSTAINABILITY - Will it last and scale?

═══════════════════════════════════════════════════════════════

THE THRESHOLDS (Golden Ratio Based):
─────────────────────────────────────

96.18% → STRONGLY POSITIVE - Full speed ahead
85.41% → POSITIVE - Proceed with confidence
61.80% → ACCEPTABLE - Proceed with monitoring
50.00% → NEUTRAL - Needs more analysis
38.20% → NEGATIVE - Reconsider
23.60% → HARMFUL - Block and protect

═══════════════════════════════════════════════════════════════

THE RULE:
─────────

We evaluate BEFORE we execute.
We learn from EVERY outcome.
We improve with EVERY decision.

If an action harms even one dimension significantly,
we look for alternatives that benefit everyone.

═══════════════════════════════════════════════════════════════

THE PROMISE:
────────────

Every action we take makes the system better.
Every decision we make helps someone.
Every change we implement benefits the whole.

No exceptions. No shortcuts. No compromises.

═══════════════════════════════════════════════════════════════
                 EVERYBODY EATS.
                 NOBODY SUFFERS.
                 THE WHOLE THRIVES.
═══════════════════════════════════════════════════════════════
`;

module.exports = {
  NetPositiveFilter,
  ImpactAssessment,
  IMPACT_DIMENSIONS,
  THRESHOLDS,
  NET_POSITIVE_MANIFESTO
};
