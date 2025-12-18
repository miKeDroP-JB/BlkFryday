/**
 * SPECULATIVE PARALLEL EXECUTOR
 * Run multiple approaches simultaneously, use first good result
 *
 * "Ask 10 experts at once, take the fastest good answer" - Speculative Philosophy
 *
 * Strategies:
 * - Same prompt, multiple models (diversity)
 * - Different prompts, same model (coverage)
 * - Different approaches to same problem (creativity)
 */

const { MultiModelClient, AI_PROVIDERS } = require('./MultiModelSwarm');
const { QualityEvaluator } = require('./CascadeEngine');

// Speculative execution strategies
const STRATEGIES = {
  // Same task, different models
  MODEL_DIVERSITY: {
    name: 'Model Diversity',
    description: 'Same prompt to multiple AI models simultaneously',
    providers: [
      { provider: 'groq', model: 'llama-3.1-70b-versatile' },
      { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'mistral', model: 'mistral-medium-latest' },
      { provider: 'google', model: 'gemini-1.5-flash' }
    ]
  },

  // Same model, different prompt variations
  PROMPT_DIVERSITY: {
    name: 'Prompt Diversity',
    description: 'Different prompt framings to same model',
    promptVariations: [
      { name: 'direct', template: (task) => task },
      { name: 'step_by_step', template: (task) => `${task}\n\nThink step by step.` },
      { name: 'expert', template: (task) => `As an expert, ${task}` },
      { name: 'concise', template: (task) => `${task}\n\nBe concise and direct.` },
      { name: 'detailed', template: (task) => `${task}\n\nProvide a detailed, comprehensive answer.` }
    ]
  },

  // Different approaches to problem
  APPROACH_DIVERSITY: {
    name: 'Approach Diversity',
    description: 'Different problem-solving approaches',
    approaches: [
      { name: 'analytical', prefix: 'Analyze this problem systematically: ' },
      { name: 'creative', prefix: 'Think creatively and outside the box: ' },
      { name: 'practical', prefix: 'Focus on practical, implementable solutions: ' },
      { name: 'first_principles', prefix: 'Starting from first principles: ' },
      { name: 'comparative', prefix: 'Compare different options and recommend: ' }
    ]
  },

  // Temperature diversity (same model, different temperatures)
  TEMPERATURE_DIVERSITY: {
    name: 'Temperature Diversity',
    description: 'Same prompt at different creativity levels',
    temperatures: [0.1, 0.4, 0.7, 0.9, 1.2]
  },

  // Ensemble: combine multiple strategies
  ENSEMBLE: {
    name: 'Full Ensemble',
    description: 'Combine all strategies for maximum coverage'
  }
};

/**
 * Race Result Handler
 * Manages parallel execution and returns first acceptable result
 */
class RaceHandler {
  constructor(qualityThreshold = 0.7) {
    this.qualityThreshold = qualityThreshold;
    this.evaluator = new QualityEvaluator({ minQuality: qualityThreshold });
  }

  /**
   * Race multiple promises, return first that passes quality
   */
  async raceForQuality(promises, task) {
    return new Promise((resolve) => {
      const results = [];
      let resolved = false;
      let completedCount = 0;

      // Set up timeout
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          // Return best result so far
          const best = this.getBestResult(results, task);
          resolve({
            ...best,
            timedOut: true,
            completedCount,
            totalAttempts: promises.length
          });
        }
      }, 30000); // 30 second timeout

      promises.forEach((promise, index) => {
        promise.then((result) => {
          completedCount++;

          if (resolved) return;

          if (result.success) {
            const evaluation = this.evaluator.evaluate(result, task);
            result.quality = evaluation.score;
            result.qualityReasons = evaluation.reasons;
            results.push({ ...result, index });

            // Check if good enough
            if (evaluation.score >= this.qualityThreshold) {
              resolved = true;
              clearTimeout(timeout);
              resolve({
                ...result,
                strategy: 'first_good',
                attemptIndex: index,
                completedCount,
                totalAttempts: promises.length,
                allResults: results
              });
            }
          }

          // If all completed and none passed, return best
          if (completedCount === promises.length && !resolved) {
            resolved = true;
            clearTimeout(timeout);
            const best = this.getBestResult(results, task);
            resolve({
              ...best,
              strategy: 'best_of_all',
              completedCount,
              totalAttempts: promises.length,
              allResults: results
            });
          }
        }).catch((error) => {
          completedCount++;
          results.push({ success: false, error: error.message, index });

          if (completedCount === promises.length && !resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({
              success: false,
              error: 'All attempts failed',
              allResults: results
            });
          }
        });
      });
    });
  }

  getBestResult(results, task) {
    const successful = results.filter(r => r.success);
    if (successful.length === 0) {
      return { success: false, error: 'No successful results' };
    }

    return successful.sort((a, b) => (b.quality || 0) - (a.quality || 0))[0];
  }
}

/**
 * Speculative Executor
 * Main class for speculative parallel execution
 */
class SpeculativeExecutor {
  constructor(config = {}) {
    this.client = new MultiModelClient(config.apiKeys);
    this.raceHandler = new RaceHandler(config.qualityThreshold || 0.7);
    this.strategies = STRATEGIES;
    this.stats = {
      totalExecutions: 0,
      avgAttempts: 0,
      avgLatency: 0,
      strategySuccess: {}
    };
  }

  /**
   * Execute with model diversity strategy
   */
  async executeModelDiversity(task, options = {}) {
    const startTime = Date.now();
    const strategy = this.strategies.MODEL_DIVERSITY;

    const promises = strategy.providers.map(({ provider, model }) => {
      const messages = [
        { role: 'system', content: 'You are a helpful AI assistant. Provide accurate, high-quality responses.' },
        { role: 'user', content: task }
      ];

      return this.client.call(provider, model, messages, options).then(result => ({
        ...result,
        strategyName: 'MODEL_DIVERSITY',
        provider,
        model
      }));
    });

    const result = await this.raceHandler.raceForQuality(promises, task);
    result.totalLatency = Date.now() - startTime;
    result.strategyUsed = 'MODEL_DIVERSITY';

    this.updateStats(result);
    return result;
  }

  /**
   * Execute with prompt diversity strategy
   */
  async executePromptDiversity(task, options = {}) {
    const startTime = Date.now();
    const strategy = this.strategies.PROMPT_DIVERSITY;
    const provider = options.provider || 'anthropic';
    const model = options.model || 'claude-3-5-sonnet-20241022';

    const promises = strategy.promptVariations.map(({ name, template }) => {
      const messages = [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: template(task) }
      ];

      return this.client.call(provider, model, messages, options).then(result => ({
        ...result,
        strategyName: 'PROMPT_DIVERSITY',
        promptVariation: name,
        provider,
        model
      }));
    });

    const result = await this.raceHandler.raceForQuality(promises, task);
    result.totalLatency = Date.now() - startTime;
    result.strategyUsed = 'PROMPT_DIVERSITY';

    this.updateStats(result);
    return result;
  }

  /**
   * Execute with approach diversity strategy
   */
  async executeApproachDiversity(task, options = {}) {
    const startTime = Date.now();
    const strategy = this.strategies.APPROACH_DIVERSITY;
    const provider = options.provider || 'anthropic';
    const model = options.model || 'claude-3-5-sonnet-20241022';

    const promises = strategy.approaches.map(({ name, prefix }) => {
      const messages = [
        { role: 'system', content: `You approach problems with a ${name} mindset.` },
        { role: 'user', content: prefix + task }
      ];

      return this.client.call(provider, model, messages, options).then(result => ({
        ...result,
        strategyName: 'APPROACH_DIVERSITY',
        approach: name,
        provider,
        model
      }));
    });

    const result = await this.raceHandler.raceForQuality(promises, task);
    result.totalLatency = Date.now() - startTime;
    result.strategyUsed = 'APPROACH_DIVERSITY';

    this.updateStats(result);
    return result;
  }

  /**
   * Execute with temperature diversity
   */
  async executeTemperatureDiversity(task, options = {}) {
    const startTime = Date.now();
    const strategy = this.strategies.TEMPERATURE_DIVERSITY;
    const provider = options.provider || 'anthropic';
    const model = options.model || 'claude-3-5-sonnet-20241022';

    const promises = strategy.temperatures.map((temp) => {
      const messages = [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: task }
      ];

      return this.client.call(provider, model, messages, { ...options, temperature: temp }).then(result => ({
        ...result,
        strategyName: 'TEMPERATURE_DIVERSITY',
        temperature: temp,
        provider,
        model
      }));
    });

    const result = await this.raceHandler.raceForQuality(promises, task);
    result.totalLatency = Date.now() - startTime;
    result.strategyUsed = 'TEMPERATURE_DIVERSITY';

    this.updateStats(result);
    return result;
  }

  /**
   * Execute with full ensemble (all strategies combined)
   */
  async executeEnsemble(task, options = {}) {
    const startTime = Date.now();

    // Combine all strategies
    const allPromises = [];

    // Model diversity
    for (const { provider, model } of this.strategies.MODEL_DIVERSITY.providers.slice(0, 3)) {
      const messages = [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: task }
      ];
      allPromises.push(
        this.client.call(provider, model, messages, options).then(r => ({
          ...r, strategy: 'MODEL', provider, model
        }))
      );
    }

    // Prompt diversity (with fastest model)
    for (const { name, template } of this.strategies.PROMPT_DIVERSITY.promptVariations.slice(0, 3)) {
      const messages = [
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: template(task) }
      ];
      allPromises.push(
        this.client.call('groq', 'llama-3.1-70b-versatile', messages, options).then(r => ({
          ...r, strategy: 'PROMPT', variation: name
        }))
      );
    }

    // Approach diversity
    for (const { name, prefix } of this.strategies.APPROACH_DIVERSITY.approaches.slice(0, 2)) {
      const messages = [
        { role: 'system', content: `You approach problems with a ${name} mindset.` },
        { role: 'user', content: prefix + task }
      ];
      allPromises.push(
        this.client.call('groq', 'llama-3.1-70b-versatile', messages, options).then(r => ({
          ...r, strategy: 'APPROACH', approach: name
        }))
      );
    }

    const result = await this.raceHandler.raceForQuality(allPromises, task);
    result.totalLatency = Date.now() - startTime;
    result.strategyUsed = 'ENSEMBLE';
    result.totalParallelCalls = allPromises.length;

    this.updateStats(result);
    return result;
  }

  /**
   * Auto-select best strategy based on task
   */
  async execute(task, options = {}) {
    const taskLower = task.toLowerCase();

    // Strategy selection heuristics
    if (options.strategy) {
      return this.executeStrategy(options.strategy, task, options);
    }

    // Creative tasks benefit from temperature diversity
    if (taskLower.includes('creative') || taskLower.includes('brainstorm') || taskLower.includes('ideas')) {
      return this.executeTemperatureDiversity(task, options);
    }

    // Complex analysis benefits from approach diversity
    if (taskLower.includes('analyze') || taskLower.includes('compare') || taskLower.includes('evaluate')) {
      return this.executeApproachDiversity(task, options);
    }

    // Code tasks benefit from model diversity
    if (taskLower.includes('code') || taskLower.includes('function') || taskLower.includes('implement')) {
      return this.executeModelDiversity(task, options);
    }

    // Default: model diversity (best general performance)
    return this.executeModelDiversity(task, options);
  }

  async executeStrategy(strategyName, task, options) {
    switch (strategyName) {
      case 'MODEL_DIVERSITY':
        return this.executeModelDiversity(task, options);
      case 'PROMPT_DIVERSITY':
        return this.executePromptDiversity(task, options);
      case 'APPROACH_DIVERSITY':
        return this.executeApproachDiversity(task, options);
      case 'TEMPERATURE_DIVERSITY':
        return this.executeTemperatureDiversity(task, options);
      case 'ENSEMBLE':
        return this.executeEnsemble(task, options);
      default:
        return this.executeModelDiversity(task, options);
    }
  }

  updateStats(result) {
    this.stats.totalExecutions++;

    if (result.completedCount) {
      this.stats.avgAttempts = (this.stats.avgAttempts * (this.stats.totalExecutions - 1) + result.completedCount) / this.stats.totalExecutions;
    }

    if (result.totalLatency) {
      this.stats.avgLatency = (this.stats.avgLatency * (this.stats.totalExecutions - 1) + result.totalLatency) / this.stats.totalExecutions;
    }

    const strategy = result.strategyUsed || 'unknown';
    this.stats.strategySuccess[strategy] = this.stats.strategySuccess[strategy] || { total: 0, success: 0 };
    this.stats.strategySuccess[strategy].total++;
    if (result.success) {
      this.stats.strategySuccess[strategy].success++;
    }
  }

  getStats() {
    return {
      ...this.stats,
      avgAttempts: this.stats.avgAttempts.toFixed(2),
      avgLatency: `${this.stats.avgLatency.toFixed(0)}ms`,
      strategySuccessRates: Object.fromEntries(
        Object.entries(this.stats.strategySuccess).map(([k, v]) =>
          [k, `${((v.success / v.total) * 100).toFixed(1)}%`]
        )
      )
    };
  }
}

/**
 * Quick speculative execution helper
 */
async function speculate(task, options = {}) {
  const executor = new SpeculativeExecutor(options);
  return executor.execute(task, options);
}

module.exports = {
  STRATEGIES,
  RaceHandler,
  SpeculativeExecutor,
  speculate
};
