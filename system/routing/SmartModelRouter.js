// ============================================================
//  SMART MODEL ROUTER - 90% Cost Savings Engine
//  Routes queries to optimal model based on complexity
// ============================================================
//
//  Model Tiers:
//  - fast:     Simple queries (Haiku/Groq) - $0.01
//  - balanced: Medium tasks (Sonnet/Gemini) - $0.05
//  - powerful: Complex work (Opus/GPT-4) - $0.20
//  - quantum:  Breakthrough (Claude Opus) - $0.50
//
//  Free-Tier Orchestration:
//  - Groq Llama 90B (fastest, free)
//  - Google Gemini Flash (reasoning, free)
//  - Local Ollama (private, zero-cost)
//  - OpenRouter pooling (cheap)
//  - Claude premium fallback
//
// ============================================================

const { EventEmitter } = require('events')
const crypto = require('crypto')

// ============================================================
//  MODEL CATALOG - Available Models & Costs
// ============================================================

const MODEL_CATALOG = {
  // Fast tier - Simple queries
  fast: {
    models: [
      { name: 'groq-llama-90b', provider: 'groq', cost: 0, speed: 100, quality: 82, free: true },
      { name: 'gemini-flash', provider: 'google', cost: 0, speed: 95, quality: 85, free: true },
      { name: 'claude-haiku', provider: 'anthropic', cost: 0.01, speed: 90, quality: 88, free: false },
      { name: 'ollama-local', provider: 'local', cost: 0, speed: 70, quality: 75, free: true }
    ],
    complexity: { min: 0, max: 30 },
    avgCost: 0.01,
    avgSpeed: 100,
    avgQuality: 85
  },

  // Balanced tier - Medium complexity
  balanced: {
    models: [
      { name: 'claude-sonnet', provider: 'anthropic', cost: 0.05, speed: 50, quality: 92, free: false },
      { name: 'gemini-pro', provider: 'google', cost: 0.02, speed: 60, quality: 90, free: false },
      { name: 'gpt-4o-mini', provider: 'openai', cost: 0.03, speed: 55, quality: 89, free: false },
      { name: 'mistral-large', provider: 'mistral', cost: 0.04, speed: 52, quality: 88, free: false }
    ],
    complexity: { min: 30, max: 70 },
    avgCost: 0.05,
    avgSpeed: 50,
    avgQuality: 92
  },

  // Powerful tier - Complex tasks
  powerful: {
    models: [
      { name: 'claude-opus', provider: 'anthropic', cost: 0.20, speed: 20, quality: 98, free: false },
      { name: 'gpt-4-turbo', provider: 'openai', cost: 0.15, speed: 25, quality: 96, free: false },
      { name: 'gemini-ultra', provider: 'google', cost: 0.18, speed: 22, quality: 95, free: false }
    ],
    complexity: { min: 70, max: 95 },
    avgCost: 0.20,
    avgSpeed: 20,
    avgQuality: 98
  },

  // Quantum tier - Breakthrough tasks
  quantum: {
    models: [
      { name: 'claude-opus-extended', provider: 'anthropic', cost: 0.50, speed: 10, quality: 111, free: false },
      { name: 'o1-preview', provider: 'openai', cost: 0.60, speed: 8, quality: 110, free: false }
    ],
    complexity: { min: 95, max: 100 },
    avgCost: 0.50,
    avgSpeed: 10,
    avgQuality: 111
  }
}

// ============================================================
//  COMPLEXITY INDICATORS - Patterns that affect routing
// ============================================================

const COMPLEXITY_INDICATORS = {
  // Low complexity (fast tier)
  low: {
    patterns: [
      /^(what|who|when|where|why|how) (is|are|was|were)/i,
      /^define /i,
      /^list /i,
      /^summarize /i,
      /simple/i,
      /quick/i,
      /brief/i
    ],
    keywords: ['simple', 'quick', 'brief', 'short', 'basic', 'easy', 'hello', 'hi', 'thanks'],
    weight: -20
  },

  // Medium complexity (balanced tier)
  medium: {
    patterns: [
      /explain/i,
      /compare/i,
      /analyze/i,
      /create a (simple|basic)/i,
      /write a (short|brief)/i
    ],
    keywords: ['explain', 'compare', 'analyze', 'review', 'suggest', 'recommend'],
    weight: 0
  },

  // High complexity (powerful tier)
  high: {
    patterns: [
      /build a (complete|full|complex)/i,
      /architect/i,
      /design a system/i,
      /implement/i,
      /optimize/i,
      /refactor/i,
      /debug (complex|difficult)/i
    ],
    keywords: ['complete', 'full', 'complex', 'system', 'architecture', 'production', 'enterprise'],
    weight: 30
  },

  // Quantum complexity (breakthrough tier)
  quantum: {
    patterns: [
      /breakthrough/i,
      /novel approach/i,
      /cutting(-|\s)?edge/i,
      /state of the art/i,
      /research/i,
      /innovative/i,
      /revolutionary/i
    ],
    keywords: ['breakthrough', 'novel', 'research', 'innovative', 'revolutionary', 'unprecedented'],
    weight: 50
  }
}

// ============================================================
//  TASK TYPE ROUTING - Default tiers for task types
// ============================================================

const TASK_TYPE_ROUTING = {
  // Simple tasks → fast tier
  greeting: 'fast',
  clarification: 'fast',
  definition: 'fast',
  translation: 'fast',
  formatting: 'fast',

  // Medium tasks → balanced tier
  explanation: 'balanced',
  comparison: 'balanced',
  summarization: 'balanced',
  simple_code: 'balanced',
  content_writing: 'balanced',

  // Complex tasks → powerful tier
  code_generation: 'powerful',
  code_review: 'powerful',
  system_design: 'powerful',
  debugging: 'powerful',
  optimization: 'powerful',

  // Breakthrough tasks → quantum tier
  research: 'quantum',
  innovation: 'quantum',
  complex_reasoning: 'quantum',
  multi_step_planning: 'quantum'
}

// ============================================================
//  SMART MODEL ROUTER CLASS
// ============================================================

class SmartModelRouter extends EventEmitter {
  constructor(config = {}) {
    super()

    this.config = {
      preferFree: config.preferFree !== false, // Default: prefer free models
      qualityThreshold: config.qualityThreshold || 85,
      costBudget: config.costBudget || Infinity,
      enableFallback: config.enableFallback !== false,
      localOnly: config.localOnly || false,
      ...config
    }

    this.modelCatalog = { ...MODEL_CATALOG }
    this.providerHealth = new Map()
    this.routingHistory = []

    // Statistics
    this.stats = {
      totalRoutes: 0,
      tierCounts: { fast: 0, balanced: 0, powerful: 0, quantum: 0 },
      totalCost: 0,
      totalSaved: 0,
      avgComplexity: 0,
      freeModelUsage: 0
    }

    // Initialize provider health
    this.initializeProviderHealth()

    console.log('[SmartModelRouter] Initialized with', this.countModels(), 'models across 4 tiers')
  }

  initializeProviderHealth() {
    const providers = ['groq', 'google', 'anthropic', 'openai', 'mistral', 'local']
    providers.forEach(p => {
      this.providerHealth.set(p, { available: true, latency: 100, errorRate: 0 })
    })
  }

  countModels() {
    return Object.values(this.modelCatalog)
      .reduce((sum, tier) => sum + tier.models.length, 0)
  }

  // ============================================================
  //  MAIN ROUTING METHOD
  // ============================================================

  async route(task, context = {}) {
    const startTime = Date.now()

    // Assess complexity
    const complexity = await this.assessComplexity(task, context)

    // Determine tier
    const tier = this.determineTier(complexity)

    // Select best model in tier
    const model = this.selectModel(tier, context)

    // Calculate savings
    const savings = this.calculateSavings(tier)

    // Update stats
    this.updateStats(tier, model, complexity, savings)

    const result = {
      tier,
      model: model.name,
      provider: model.provider,
      complexity,
      cost: model.cost,
      quality: model.quality,
      speed: model.speed,
      free: model.free,
      savings,
      routingTime: Date.now() - startTime
    }

    this.emit('routed', result)
    return result
  }

  // ============================================================
  //  COMPLEXITY ASSESSMENT
  // ============================================================

  async assessComplexity(task, context = {}) {
    let complexity = 50 // Base complexity

    const taskText = typeof task === 'string' ? task : JSON.stringify(task)
    const taskLower = taskText.toLowerCase()

    // Check task type routing
    if (context.taskType && TASK_TYPE_ROUTING[context.taskType]) {
      const tierForType = TASK_TYPE_ROUTING[context.taskType]
      const tierConfig = this.modelCatalog[tierForType]
      complexity = (tierConfig.complexity.min + tierConfig.complexity.max) / 2
    }

    // Apply pattern-based adjustments
    for (const [level, indicators] of Object.entries(COMPLEXITY_INDICATORS)) {
      // Check patterns
      for (const pattern of indicators.patterns) {
        if (pattern.test(taskText)) {
          complexity += indicators.weight
        }
      }

      // Check keywords
      for (const keyword of indicators.keywords) {
        if (taskLower.includes(keyword)) {
          complexity += indicators.weight * 0.5
        }
      }
    }

    // Length-based adjustment
    if (taskText.length > 2000) complexity += 15
    if (taskText.length > 5000) complexity += 25
    if (taskText.length < 50) complexity -= 15

    // Code detection
    if (this.containsCode(taskText)) {
      complexity += 20
    }

    // Multi-step detection
    const steps = (taskText.match(/(\d+\.|step|then|after|next)/gi) || []).length
    complexity += steps * 5

    // Context-based adjustments
    if (context.requiresAccuracy) complexity += 15
    if (context.requiresCreativity) complexity += 10
    if (context.timeConstraint) complexity -= 10

    // Clamp to 0-100
    return Math.max(0, Math.min(100, complexity))
  }

  containsCode(text) {
    const codePatterns = [
      /```/,
      /function\s+\w+/,
      /const\s+\w+\s*=/,
      /import\s+.*from/,
      /class\s+\w+/,
      /def\s+\w+\(/,
      /\{\s*\n/,
      /<\w+>/
    ]
    return codePatterns.some(p => p.test(text))
  }

  // ============================================================
  //  TIER DETERMINATION
  // ============================================================

  determineTier(complexity) {
    if (complexity < 30) return 'fast'
    if (complexity < 70) return 'balanced'
    if (complexity < 95) return 'powerful'
    return 'quantum'
  }

  // ============================================================
  //  MODEL SELECTION
  // ============================================================

  selectModel(tier, context = {}) {
    const tierConfig = this.modelCatalog[tier]
    let candidates = [...tierConfig.models]

    // Filter by provider health
    candidates = candidates.filter(m => {
      const health = this.providerHealth.get(m.provider)
      return health && health.available
    })

    // Prefer free models if configured
    if (this.config.preferFree) {
      const freeModels = candidates.filter(m => m.free)
      if (freeModels.length > 0) {
        candidates = freeModels
      }
    }

    // Filter by quality threshold
    candidates = candidates.filter(m => m.quality >= this.config.qualityThreshold)

    // Filter by cost budget
    candidates = candidates.filter(m => m.cost <= this.config.costBudget)

    // Local only mode
    if (this.config.localOnly) {
      candidates = candidates.filter(m => m.provider === 'local')
    }

    // Sort by optimal score (quality/cost ratio with speed factor)
    candidates.sort((a, b) => {
      const scoreA = (a.quality / (a.cost + 0.001)) * (a.speed / 100)
      const scoreB = (b.quality / (b.cost + 0.001)) * (b.speed / 100)
      return scoreB - scoreA
    })

    // Return best candidate or fallback
    if (candidates.length > 0) {
      return candidates[0]
    }

    // Fallback to first model in tier
    if (this.config.enableFallback) {
      return tierConfig.models[0]
    }

    throw new Error(`No suitable model found for tier: ${tier}`)
  }

  // ============================================================
  //  COST CALCULATIONS
  // ============================================================

  calculateSavings(selectedTier) {
    // Compare to always using quantum tier
    const quantumCost = this.modelCatalog.quantum.avgCost
    const selectedCost = this.modelCatalog[selectedTier].avgCost
    return quantumCost - selectedCost
  }

  estimateCost(task, context = {}) {
    const complexity = this.assessComplexity(task, context)
    const tier = this.determineTier(complexity)
    const tierConfig = this.modelCatalog[tier]

    return {
      tier,
      estimatedCost: tierConfig.avgCost,
      qualityExpected: tierConfig.avgQuality,
      speedExpected: tierConfig.avgSpeed
    }
  }

  // ============================================================
  //  PROVIDER HEALTH MANAGEMENT
  // ============================================================

  updateProviderHealth(provider, success, latency) {
    const health = this.providerHealth.get(provider) || { available: true, latency: 100, errorRate: 0 }

    // Update latency (rolling average)
    health.latency = (health.latency * 0.8) + (latency * 0.2)

    // Update error rate
    health.errorRate = success
      ? health.errorRate * 0.9
      : Math.min(1, health.errorRate * 0.9 + 0.1)

    // Mark unavailable if error rate too high
    health.available = health.errorRate < 0.5

    this.providerHealth.set(provider, health)
    this.emit('healthUpdated', { provider, health })
  }

  // ============================================================
  //  STATISTICS
  // ============================================================

  updateStats(tier, model, complexity, savings) {
    this.stats.totalRoutes++
    this.stats.tierCounts[tier]++
    this.stats.totalCost += model.cost
    this.stats.totalSaved += savings
    this.stats.avgComplexity = ((this.stats.avgComplexity * (this.stats.totalRoutes - 1)) + complexity) / this.stats.totalRoutes
    if (model.free) this.stats.freeModelUsage++

    // Keep routing history
    this.routingHistory.push({
      tier,
      model: model.name,
      complexity,
      timestamp: Date.now()
    })

    // Trim history
    if (this.routingHistory.length > 1000) {
      this.routingHistory = this.routingHistory.slice(-500)
    }
  }

  getStats() {
    const savingsRate = this.stats.totalRoutes > 0
      ? (this.stats.totalSaved / (this.stats.totalSaved + this.stats.totalCost)) * 100
      : 0

    const freeRate = this.stats.totalRoutes > 0
      ? (this.stats.freeModelUsage / this.stats.totalRoutes) * 100
      : 0

    return {
      ...this.stats,
      savingsRate: savingsRate.toFixed(2) + '%',
      freeModelRate: freeRate.toFixed(2) + '%',
      avgCostPerRoute: this.stats.totalRoutes > 0
        ? (this.stats.totalCost / this.stats.totalRoutes).toFixed(4)
        : 0
    }
  }

  // ============================================================
  //  BATCH ROUTING
  // ============================================================

  async routeBatch(tasks, context = {}) {
    return Promise.all(tasks.map(task => this.route(task, context)))
  }

  // ============================================================
  //  UTILITY METHODS
  // ============================================================

  getTierInfo(tier) {
    return this.modelCatalog[tier] || null
  }

  getAvailableModels() {
    const available = {}
    for (const [tier, config] of Object.entries(this.modelCatalog)) {
      available[tier] = config.models.filter(m => {
        const health = this.providerHealth.get(m.provider)
        return health && health.available
      })
    }
    return available
  }

  addModel(tier, model) {
    if (this.modelCatalog[tier]) {
      this.modelCatalog[tier].models.push(model)
      this.emit('modelAdded', { tier, model })
    }
  }

  removeModel(tier, modelName) {
    if (this.modelCatalog[tier]) {
      this.modelCatalog[tier].models = this.modelCatalog[tier].models
        .filter(m => m.name !== modelName)
      this.emit('modelRemoved', { tier, modelName })
    }
  }
}

// ============================================================
//  SINGLETON INSTANCE
// ============================================================

let instance = null

function getSmartModelRouter(config = {}) {
  if (!instance) {
    instance = new SmartModelRouter(config)
  }
  return instance
}

// ============================================================
//  EXPORTS
// ============================================================

module.exports = {
  SmartModelRouter,
  getSmartModelRouter,
  MODEL_CATALOG,
  COMPLEXITY_INDICATORS,
  TASK_TYPE_ROUTING
}
