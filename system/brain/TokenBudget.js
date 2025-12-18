/**
 * TOKEN BUDGET MANAGER
 * Smart cost control with intelligent budget allocation
 *
 * "Every token counts - spend wisely" - Budget Philosophy
 *
 * Features:
 * - Real-time budget tracking
 * - Intelligent allocation across strategies
 * - Cost prediction before execution
 * - Automatic tier downgrade when over budget
 * - Priority queue for expensive tasks
 */

// Cost per 1K tokens by provider/model (in dollars)
const TOKEN_COSTS = {
  anthropic: {
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 }
  },
  openai: {
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 }
  },
  groq: {
    'llama-3.1-8b-instant': { input: 0.00005, output: 0.00008 },
    'llama-3.1-70b-versatile': { input: 0.00059, output: 0.00079 }
  },
  mistral: {
    'mistral-small-latest': { input: 0.0002, output: 0.0006 },
    'mistral-large-latest': { input: 0.008, output: 0.024 }
  },
  google: {
    'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 }
  },
  deepseek: {
    'deepseek-chat': { input: 0.00014, output: 0.00028 },
    'deepseek-coder': { input: 0.00014, output: 0.00028 }
  }
};

// Average tokens by task type
const TASK_TOKEN_ESTIMATES = {
  simple: { input: 100, output: 200 },
  medium: { input: 300, output: 600 },
  complex: { input: 800, output: 1500 },
  code: { input: 500, output: 1200 },
  creative: { input: 400, output: 2000 },
  analysis: { input: 600, output: 1000 }
};

/**
 * Cost Calculator
 * Calculates and estimates API costs
 */
class CostCalculator {
  constructor() {
    this.costs = TOKEN_COSTS;
    this.taskEstimates = TASK_TOKEN_ESTIMATES;
  }

  /**
   * Calculate actual cost from usage
   */
  calculateCost(provider, model, inputTokens, outputTokens) {
    const providerCosts = this.costs[provider];
    if (!providerCosts) return 0;

    const modelCosts = providerCosts[model];
    if (!modelCosts) {
      // Find closest match
      const models = Object.keys(providerCosts);
      for (const m of models) {
        if (model.includes(m.split('-')[0])) {
          return this.calculateCost(provider, m, inputTokens, outputTokens);
        }
      }
      return 0;
    }

    const inputCost = (inputTokens / 1000) * modelCosts.input;
    const outputCost = (outputTokens / 1000) * modelCosts.output;

    return inputCost + outputCost;
  }

  /**
   * Estimate cost before execution
   */
  estimateCost(provider, model, taskType = 'medium') {
    const estimate = this.taskEstimates[taskType] || this.taskEstimates.medium;
    return this.calculateCost(provider, model, estimate.input, estimate.output);
  }

  /**
   * Get cheapest model for task
   */
  getCheapestModel(taskType, minQuality = 0.7) {
    const qualityRanks = {
      anthropic: { 'claude-3-haiku-20240307': 0.75, 'claude-3-5-sonnet-20241022': 0.92 },
      openai: { 'gpt-4o-mini': 0.78, 'gpt-4o': 0.92 },
      groq: { 'llama-3.1-8b-instant': 0.65, 'llama-3.1-70b-versatile': 0.82 },
      mistral: { 'mistral-small-latest': 0.72, 'mistral-large-latest': 0.85 },
      google: { 'gemini-1.5-flash': 0.78, 'gemini-1.5-pro': 0.88 },
      deepseek: { 'deepseek-chat': 0.76, 'deepseek-coder': 0.82 }
    };

    const options = [];

    for (const [provider, models] of Object.entries(this.costs)) {
      for (const [model, costs] of Object.entries(models)) {
        const quality = qualityRanks[provider]?.[model] || 0.7;
        if (quality >= minQuality) {
          options.push({
            provider,
            model,
            quality,
            estimatedCost: this.estimateCost(provider, model, taskType)
          });
        }
      }
    }

    options.sort((a, b) => a.estimatedCost - b.estimatedCost);
    return options[0];
  }

  /**
   * Compare costs across providers
   */
  compareCosts(taskType = 'medium') {
    const comparison = [];

    for (const [provider, models] of Object.entries(this.costs)) {
      for (const [model, costs] of Object.entries(models)) {
        comparison.push({
          provider,
          model,
          estimatedCost: this.estimateCost(provider, model, taskType),
          inputCostPer1k: costs.input,
          outputCostPer1k: costs.output
        });
      }
    }

    comparison.sort((a, b) => a.estimatedCost - b.estimatedCost);
    return comparison;
  }
}

/**
 * Budget Tracker
 * Tracks spending against budget
 */
class BudgetTracker {
  constructor(config = {}) {
    this.budget = config.budget || 100; // Daily budget in dollars
    this.period = config.period || 'daily';
    this.spent = 0;
    this.reserved = 0;
    this.history = [];
    this.periodStart = Date.now();
    this.alerts = [];
  }

  /**
   * Reserve budget for upcoming task
   */
  reserve(amount) {
    if (this.getAvailable() < amount) {
      return {
        success: false,
        reason: 'Insufficient budget',
        available: this.getAvailable(),
        requested: amount
      };
    }

    this.reserved += amount;
    return {
      success: true,
      reserved: amount,
      available: this.getAvailable()
    };
  }

  /**
   * Record actual spending
   */
  spend(amount, metadata = {}) {
    this.spent += amount;
    this.reserved = Math.max(0, this.reserved - amount);

    this.history.push({
      amount,
      timestamp: Date.now(),
      ...metadata
    });

    // Check alerts
    this.checkAlerts();

    return {
      spent: amount,
      totalSpent: this.spent,
      remaining: this.getRemaining()
    };
  }

  /**
   * Release reserved budget (task cancelled)
   */
  release(amount) {
    this.reserved = Math.max(0, this.reserved - amount);
  }

  /**
   * Get available budget (not spent or reserved)
   */
  getAvailable() {
    return Math.max(0, this.budget - this.spent - this.reserved);
  }

  /**
   * Get remaining budget (not spent)
   */
  getRemaining() {
    return Math.max(0, this.budget - this.spent);
  }

  /**
   * Get usage percentage
   */
  getUsagePercent() {
    return (this.spent / this.budget) * 100;
  }

  /**
   * Check and trigger alerts
   */
  checkAlerts() {
    const usage = this.getUsagePercent();

    if (usage >= 90 && !this.alerts.includes('90%')) {
      this.alerts.push('90%');
      this.onAlert?.('Budget at 90%', { usage, remaining: this.getRemaining() });
    } else if (usage >= 75 && !this.alerts.includes('75%')) {
      this.alerts.push('75%');
      this.onAlert?.('Budget at 75%', { usage, remaining: this.getRemaining() });
    } else if (usage >= 50 && !this.alerts.includes('50%')) {
      this.alerts.push('50%');
      this.onAlert?.('Budget at 50%', { usage, remaining: this.getRemaining() });
    }
  }

  /**
   * Reset for new period
   */
  reset() {
    this.spent = 0;
    this.reserved = 0;
    this.alerts = [];
    this.periodStart = Date.now();
  }

  /**
   * Get spending summary
   */
  getSummary() {
    const byProvider = {};
    const byModel = {};
    const byHour = {};

    for (const entry of this.history) {
      // By provider
      if (entry.provider) {
        byProvider[entry.provider] = (byProvider[entry.provider] || 0) + entry.amount;
      }

      // By model
      if (entry.model) {
        byModel[entry.model] = (byModel[entry.model] || 0) + entry.amount;
      }

      // By hour
      const hour = new Date(entry.timestamp).getHours();
      byHour[hour] = (byHour[hour] || 0) + entry.amount;
    }

    return {
      budget: this.budget,
      spent: this.spent,
      reserved: this.reserved,
      available: this.getAvailable(),
      remaining: this.getRemaining(),
      usagePercent: this.getUsagePercent().toFixed(1) + '%',
      transactionCount: this.history.length,
      avgCostPerTask: this.history.length > 0
        ? (this.spent / this.history.length).toFixed(4)
        : 0,
      byProvider,
      byModel,
      byHour
    };
  }
}

/**
 * Token Budget Manager
 * Manages budget across entire system
 */
class TokenBudgetManager {
  constructor(config = {}) {
    this.calculator = new CostCalculator();
    this.tracker = new BudgetTracker(config);
    this.priorityQueue = [];
    this.costSavingsMode = false;
  }

  /**
   * Request budget for task
   */
  requestBudget(task, options = {}) {
    const {
      provider = 'groq',
      model = 'llama-3.1-70b-versatile',
      taskType = 'medium',
      priority = 'normal'
    } = options;

    const estimatedCost = this.calculator.estimateCost(provider, model, taskType);

    // Check if we should downgrade model
    if (this.tracker.getAvailable() < estimatedCost) {
      // Try to find cheaper alternative
      const cheaper = this.calculator.getCheapestModel(taskType, 0.6);
      if (cheaper && cheaper.estimatedCost < this.tracker.getAvailable()) {
        return {
          approved: true,
          downgraded: true,
          original: { provider, model, cost: estimatedCost },
          alternative: cheaper,
          reason: 'Budget constrained - using cheaper model'
        };
      }

      // Queue high priority tasks
      if (priority === 'high') {
        this.priorityQueue.push({
          task,
          options,
          estimatedCost,
          queuedAt: Date.now()
        });
        return {
          approved: false,
          queued: true,
          position: this.priorityQueue.length,
          reason: 'Budget exhausted - task queued for next period'
        };
      }

      return {
        approved: false,
        reason: 'Insufficient budget',
        available: this.tracker.getAvailable(),
        required: estimatedCost
      };
    }

    // Reserve budget
    const reservation = this.tracker.reserve(estimatedCost);
    if (!reservation.success) {
      return {
        approved: false,
        reason: reservation.reason
      };
    }

    return {
      approved: true,
      provider,
      model,
      estimatedCost,
      reservationId: Date.now().toString(36)
    };
  }

  /**
   * Record actual cost after execution
   */
  recordCost(reservationId, actualCost, metadata = {}) {
    this.tracker.spend(actualCost, metadata);

    // Enable cost savings mode if over 80% usage
    if (this.tracker.getUsagePercent() > 80) {
      this.costSavingsMode = true;
    }

    return {
      spent: actualCost,
      totalSpent: this.tracker.spent,
      remaining: this.tracker.getRemaining()
    };
  }

  /**
   * Get optimal strategy given budget
   */
  getOptimalStrategy(taskType, qualityRequirement = 0.7) {
    const available = this.tracker.getAvailable();

    // Map available budget to strategy
    if (available < 0.01) {
      return { strategy: 'budget', reason: 'Minimal budget remaining' };
    }

    if (this.costSavingsMode || available < this.tracker.budget * 0.2) {
      return { strategy: 'efficient', reason: 'Cost savings mode active' };
    }

    if (qualityRequirement > 0.9) {
      return { strategy: 'quality', reason: 'High quality requirement' };
    }

    return { strategy: 'balanced', reason: 'Standard operation' };
  }

  /**
   * Process priority queue (call on budget reset)
   */
  processPriorityQueue() {
    const processed = [];

    while (this.priorityQueue.length > 0) {
      const item = this.priorityQueue[0];
      const request = this.requestBudget(item.task, item.options);

      if (request.approved) {
        this.priorityQueue.shift();
        processed.push(item);
      } else {
        break;
      }
    }

    return processed;
  }

  /**
   * Reset budget for new period
   */
  resetPeriod() {
    this.tracker.reset();
    this.costSavingsMode = false;

    // Process queued items
    const processed = this.processPriorityQueue();

    return {
      reset: true,
      queuedItemsProcessed: processed.length,
      remainingQueue: this.priorityQueue.length
    };
  }

  /**
   * Get budget status
   */
  getStatus() {
    return {
      ...this.tracker.getSummary(),
      costSavingsMode: this.costSavingsMode,
      queueSize: this.priorityQueue.length,
      optimalStrategy: this.getOptimalStrategy('medium').strategy
    };
  }
}

module.exports = {
  TOKEN_COSTS,
  TASK_TOKEN_ESTIMATES,
  CostCalculator,
  BudgetTracker,
  TokenBudgetManager
};
