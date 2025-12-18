/**
 * SELF-EVALUATION & RETRY SYSTEM
 * AI that judges its own output and retries until satisfied
 *
 * "Don't submit work you wouldn't approve" - Self-Evaluation Philosophy
 *
 * Process:
 * 1. Generate initial response
 * 2. Self-evaluate against criteria
 * 3. If fails -> identify issues -> retry with feedback
 * 4. Repeat until passes or max retries
 */

const { MultiModelClient } = require('./MultiModelSwarm');
const { QualityEvaluator } = require('./CascadeEngine');

// Evaluation criteria by task type
const EVALUATION_CRITERIA = {
  CODE: {
    name: 'Code Quality',
    criteria: [
      { name: 'syntax', description: 'Code is syntactically correct', weight: 0.25 },
      { name: 'completeness', description: 'All required functionality is implemented', weight: 0.25 },
      { name: 'clarity', description: 'Code is readable and well-structured', weight: 0.2 },
      { name: 'efficiency', description: 'Code is reasonably efficient', weight: 0.15 },
      { name: 'documentation', description: 'Code has appropriate comments', weight: 0.15 }
    ],
    minScore: 0.7
  },
  ANALYSIS: {
    name: 'Analysis Quality',
    criteria: [
      { name: 'depth', description: 'Analysis is thorough and comprehensive', weight: 0.3 },
      { name: 'accuracy', description: 'Facts and conclusions are correct', weight: 0.25 },
      { name: 'structure', description: 'Analysis is well-organized', weight: 0.2 },
      { name: 'insights', description: 'Provides valuable insights', weight: 0.15 },
      { name: 'actionability', description: 'Conclusions are actionable', weight: 0.1 }
    ],
    minScore: 0.75
  },
  CREATIVE: {
    name: 'Creative Quality',
    criteria: [
      { name: 'originality', description: 'Content is original and creative', weight: 0.3 },
      { name: 'engagement', description: 'Content is engaging and interesting', weight: 0.25 },
      { name: 'coherence', description: 'Content flows well and makes sense', weight: 0.2 },
      { name: 'relevance', description: 'Content addresses the prompt', weight: 0.15 },
      { name: 'style', description: 'Writing style is appropriate', weight: 0.1 }
    ],
    minScore: 0.7
  },
  GENERAL: {
    name: 'General Quality',
    criteria: [
      { name: 'relevance', description: 'Response addresses the question', weight: 0.3 },
      { name: 'accuracy', description: 'Information is correct', weight: 0.25 },
      { name: 'completeness', description: 'Response is complete', weight: 0.2 },
      { name: 'clarity', description: 'Response is clear and understandable', weight: 0.15 },
      { name: 'helpfulness', description: 'Response is helpful', weight: 0.1 }
    ],
    minScore: 0.7
  }
};

// Self-evaluation prompt template
const SELF_EVAL_PROMPT = `You are a critical evaluator. Evaluate the following response against these criteria.

ORIGINAL TASK:
{task}

RESPONSE TO EVALUATE:
{response}

CRITERIA:
{criteria}

For each criterion, provide:
1. Score (0-10)
2. Brief explanation

Then provide:
- OVERALL_SCORE: (weighted average, 0-10)
- PASSES: YES or NO (must be >= {minScore}/10 to pass)
- ISSUES: List any specific problems
- SUGGESTIONS: How to improve

Format your response as JSON:
{
  "criteria_scores": {
    "criterion_name": { "score": X, "explanation": "..." },
    ...
  },
  "overall_score": X.X,
  "passes": true/false,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

// Retry prompt with feedback
const RETRY_PROMPT = `Previous attempt did not meet quality standards.

ORIGINAL TASK:
{task}

PREVIOUS RESPONSE:
{previousResponse}

ISSUES IDENTIFIED:
{issues}

SUGGESTIONS FOR IMPROVEMENT:
{suggestions}

Please provide an improved response that addresses these issues. Focus on:
{focusAreas}`;

/**
 * Self Evaluator
 * Evaluates and scores AI responses
 */
class SelfEvaluator {
  constructor(config = {}) {
    this.client = new MultiModelClient(config.apiKeys);
    this.evaluatorModel = config.evaluatorModel || {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022'
    };
  }

  /**
   * Detect task type from content
   */
  detectTaskType(task) {
    const taskLower = task.toLowerCase();

    if (taskLower.includes('code') || taskLower.includes('function') ||
        taskLower.includes('implement') || taskLower.includes('program')) {
      return 'CODE';
    }

    if (taskLower.includes('analyze') || taskLower.includes('evaluate') ||
        taskLower.includes('compare') || taskLower.includes('assess')) {
      return 'ANALYSIS';
    }

    if (taskLower.includes('write') || taskLower.includes('create') ||
        taskLower.includes('story') || taskLower.includes('creative')) {
      return 'CREATIVE';
    }

    return 'GENERAL';
  }

  /**
   * Build evaluation prompt
   */
  buildEvalPrompt(task, response, taskType) {
    const criteria = EVALUATION_CRITERIA[taskType];
    const criteriaText = criteria.criteria
      .map(c => `- ${c.name} (${c.weight * 100}%): ${c.description}`)
      .join('\n');

    return SELF_EVAL_PROMPT
      .replace('{task}', task)
      .replace('{response}', response)
      .replace('{criteria}', criteriaText)
      .replace('{minScore}', (criteria.minScore * 10).toString());
  }

  /**
   * Evaluate a response
   */
  async evaluate(task, response, options = {}) {
    const taskType = options.taskType || this.detectTaskType(task);
    const criteria = EVALUATION_CRITERIA[taskType];

    const evalPrompt = this.buildEvalPrompt(task, response, taskType);

    const result = await this.client.call(
      this.evaluatorModel.provider,
      this.evaluatorModel.model,
      [
        { role: 'system', content: 'You are a strict quality evaluator. Always respond with valid JSON.' },
        { role: 'user', content: evalPrompt }
      ],
      { temperature: 0.2 } // Low temperature for consistent evaluation
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        passes: false
      };
    }

    // Parse evaluation
    try {
      // Extract JSON from response
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in evaluation');

      const evaluation = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        taskType,
        criteriaUsed: criteria.name,
        scores: evaluation.criteria_scores,
        overallScore: evaluation.overall_score / 10, // Normalize to 0-1
        passes: evaluation.passes || evaluation.overall_score >= criteria.minScore * 10,
        issues: evaluation.issues || [],
        suggestions: evaluation.suggestions || [],
        minRequired: criteria.minScore
      };
    } catch (error) {
      // Fallback to basic quality evaluator
      const basicEval = new QualityEvaluator({ minQuality: criteria.minScore });
      const basicResult = basicEval.evaluate({ content: response }, task);

      return {
        success: true,
        taskType,
        criteriaUsed: 'Basic',
        overallScore: basicResult.score,
        passes: basicResult.passesThreshold,
        issues: basicResult.score < criteria.minScore ? ['Basic quality check failed'] : [],
        suggestions: ['Try again with more detail'],
        minRequired: criteria.minScore,
        fallback: true
      };
    }
  }
}

/**
 * Self-Correcting Executor
 * Generates, evaluates, and retries until quality is met
 */
class SelfCorrectingExecutor {
  constructor(config = {}) {
    this.client = new MultiModelClient(config.apiKeys);
    this.evaluator = new SelfEvaluator(config);
    this.maxRetries = config.maxRetries || 3;
    this.generatorModel = config.generatorModel || {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022'
    };
    this.stats = {
      totalExecutions: 0,
      firstTrySuccess: 0,
      retriesNeeded: 0,
      avgRetries: 0,
      failedAfterRetries: 0
    };
  }

  /**
   * Build retry prompt with feedback
   */
  buildRetryPrompt(task, previousResponse, evaluation) {
    const focusAreas = evaluation.issues.slice(0, 3).join(', ') || 'overall quality';

    return RETRY_PROMPT
      .replace('{task}', task)
      .replace('{previousResponse}', previousResponse.substring(0, 2000))
      .replace('{issues}', evaluation.issues.join('\n- ') || 'General quality issues')
      .replace('{suggestions}', evaluation.suggestions.join('\n- ') || 'Improve overall quality')
      .replace('{focusAreas}', focusAreas);
  }

  /**
   * Execute with self-evaluation and retry
   */
  async execute(task, options = {}) {
    const startTime = Date.now();
    this.stats.totalExecutions++;

    const attempts = [];
    let currentResponse = null;
    let currentEvaluation = null;
    let retryCount = 0;

    // Initial generation
    const initialResult = await this.client.call(
      this.generatorModel.provider,
      this.generatorModel.model,
      [
        { role: 'system', content: 'You are a helpful AI assistant. Provide high-quality, thorough responses.' },
        { role: 'user', content: task }
      ],
      options
    );

    if (!initialResult.success) {
      return {
        success: false,
        error: initialResult.error,
        attempts: [{ attempt: 0, error: initialResult.error }]
      };
    }

    currentResponse = initialResult.content;
    attempts.push({
      attempt: 0,
      response: currentResponse.substring(0, 500) + '...',
      latency: initialResult.latency
    });

    // Evaluate initial response
    currentEvaluation = await this.evaluator.evaluate(task, currentResponse, options);
    attempts[0].evaluation = {
      score: currentEvaluation.overallScore,
      passes: currentEvaluation.passes,
      issues: currentEvaluation.issues
    };

    // Check if first try passed
    if (currentEvaluation.passes) {
      this.stats.firstTrySuccess++;
      return {
        success: true,
        content: currentResponse,
        evaluation: currentEvaluation,
        attempts,
        retries: 0,
        totalLatency: Date.now() - startTime
      };
    }

    // Retry loop
    while (retryCount < this.maxRetries && !currentEvaluation.passes) {
      retryCount++;
      this.stats.retriesNeeded++;

      // Build retry prompt with feedback
      const retryPrompt = this.buildRetryPrompt(task, currentResponse, currentEvaluation);

      // Generate improved response
      const retryResult = await this.client.call(
        this.generatorModel.provider,
        this.generatorModel.model,
        [
          { role: 'system', content: 'You are improving a previous response based on feedback. Focus on the identified issues.' },
          { role: 'user', content: retryPrompt }
        ],
        options
      );

      if (!retryResult.success) {
        attempts.push({
          attempt: retryCount,
          error: retryResult.error
        });
        continue;
      }

      currentResponse = retryResult.content;

      // Evaluate retry
      currentEvaluation = await this.evaluator.evaluate(task, currentResponse, options);

      attempts.push({
        attempt: retryCount,
        response: currentResponse.substring(0, 500) + '...',
        latency: retryResult.latency,
        evaluation: {
          score: currentEvaluation.overallScore,
          passes: currentEvaluation.passes,
          issues: currentEvaluation.issues
        }
      });

      if (currentEvaluation.passes) {
        break;
      }
    }

    // Update stats
    this.stats.avgRetries = this.stats.retriesNeeded / this.stats.totalExecutions;
    if (!currentEvaluation.passes) {
      this.stats.failedAfterRetries++;
    }

    return {
      success: currentEvaluation.passes,
      content: currentResponse,
      evaluation: currentEvaluation,
      attempts,
      retries: retryCount,
      totalLatency: Date.now() - startTime,
      improvement: attempts.length > 1
        ? ((attempts[attempts.length - 1].evaluation?.score || 0) - (attempts[0].evaluation?.score || 0)) * 100
        : 0
    };
  }

  /**
   * Get executor statistics
   */
  getStats() {
    return {
      ...this.stats,
      firstTryRate: this.stats.totalExecutions > 0
        ? `${((this.stats.firstTrySuccess / this.stats.totalExecutions) * 100).toFixed(1)}%`
        : '0%',
      avgRetries: this.stats.avgRetries.toFixed(2),
      failureRate: this.stats.totalExecutions > 0
        ? `${((this.stats.failedAfterRetries / this.stats.totalExecutions) * 100).toFixed(1)}%`
        : '0%'
    };
  }
}

/**
 * Quick self-correcting execution helper
 */
async function selfCorrect(task, options = {}) {
  const executor = new SelfCorrectingExecutor(options);
  return executor.execute(task, options);
}

module.exports = {
  EVALUATION_CRITERIA,
  SelfEvaluator,
  SelfCorrectingExecutor,
  selfCorrect
};
