/**
 * MULTI-MODEL SWARM SYSTEM
 * Each swarm can use different AI providers for diversity and specialization
 *
 * "Different models think differently. Use them all." - Brain Network Philosophy
 */

// AI Provider configurations
const AI_PROVIDERS = {
  CLAUDE: {
    name: 'Claude',
    provider: 'anthropic',
    models: {
      fast: 'claude-3-haiku-20240307',
      balanced: 'claude-3-5-sonnet-20241022',
      powerful: 'claude-sonnet-4-20250514'
    },
    strengths: ['reasoning', 'analysis', 'safety', 'nuance'],
    costPer1kTokens: { fast: 0.00025, balanced: 0.003, powerful: 0.015 },
    speedMultiplier: { fast: 3, balanced: 1.5, powerful: 1 }
  },

  GROQ: {
    name: 'Groq',
    provider: 'groq',
    models: {
      fast: 'llama-3.1-8b-instant',
      balanced: 'llama-3.1-70b-versatile',
      powerful: 'llama-3.2-90b-text-preview'
    },
    strengths: ['speed', 'throughput', 'cost-efficiency'],
    costPer1kTokens: { fast: 0.00005, balanced: 0.0006, powerful: 0.0009 },
    speedMultiplier: { fast: 10, balanced: 8, powerful: 5 } // Groq is FAST
  },

  OPENAI: {
    name: 'OpenAI',
    provider: 'openai',
    models: {
      fast: 'gpt-4o-mini',
      balanced: 'gpt-4o',
      powerful: 'gpt-4-turbo'
    },
    strengths: ['general', 'coding', 'instruction-following'],
    costPer1kTokens: { fast: 0.00015, balanced: 0.005, powerful: 0.01 },
    speedMultiplier: { fast: 2.5, balanced: 1.2, powerful: 0.8 }
  },

  GEMINI: {
    name: 'Gemini',
    provider: 'google',
    models: {
      fast: 'gemini-1.5-flash',
      balanced: 'gemini-1.5-pro',
      powerful: 'gemini-1.5-pro-latest'
    },
    strengths: ['multimodal', 'long-context', 'factual'],
    costPer1kTokens: { fast: 0.000075, balanced: 0.00125, powerful: 0.00125 },
    speedMultiplier: { fast: 4, balanced: 2, powerful: 1.5 }
  },

  MISTRAL: {
    name: 'Mistral',
    provider: 'mistral',
    models: {
      fast: 'mistral-small-latest',
      balanced: 'mistral-medium-latest',
      powerful: 'mistral-large-latest'
    },
    strengths: ['efficiency', 'multilingual', 'coding'],
    costPer1kTokens: { fast: 0.0002, balanced: 0.0027, powerful: 0.008 },
    speedMultiplier: { fast: 3, balanced: 2, powerful: 1.2 }
  },

  DEEPSEEK: {
    name: 'DeepSeek',
    provider: 'deepseek',
    models: {
      fast: 'deepseek-chat',
      balanced: 'deepseek-coder',
      powerful: 'deepseek-reasoner'
    },
    strengths: ['coding', 'math', 'reasoning', 'cost'],
    costPer1kTokens: { fast: 0.00014, balanced: 0.00014, powerful: 0.00055 },
    speedMultiplier: { fast: 2, balanced: 2, powerful: 1 }
  }
};

// Swarm-to-Provider optimal mappings
const SWARM_SPECIALIZATIONS = {
  ALPHA: {
    primary: 'CLAUDE',
    secondary: 'OPENAI',
    role: 'Strategic Command',
    bestFor: ['planning', 'architecture', 'complex reasoning']
  },
  BETA: {
    primary: 'GROQ',
    secondary: 'MISTRAL',
    role: 'Speed Execution',
    bestFor: ['rapid iteration', 'bulk processing', 'real-time']
  },
  GAMMA: {
    primary: 'OPENAI',
    secondary: 'CLAUDE',
    role: 'Code Generation',
    bestFor: ['programming', 'debugging', 'code review']
  },
  DELTA: {
    primary: 'GEMINI',
    secondary: 'CLAUDE',
    role: 'Research & Analysis',
    bestFor: ['long documents', 'research', 'multimodal']
  },
  EPSILON: {
    primary: 'MISTRAL',
    secondary: 'DEEPSEEK',
    role: 'Efficient Processing',
    bestFor: ['translation', 'summarization', 'extraction']
  },
  ZETA: {
    primary: 'DEEPSEEK',
    secondary: 'OPENAI',
    role: 'Technical Compute',
    bestFor: ['math', 'algorithms', 'data analysis']
  },
  ETA: {
    primary: 'CLAUDE',
    secondary: 'GEMINI',
    role: 'Creative Generation',
    bestFor: ['writing', 'ideation', 'storytelling']
  },
  THETA: {
    primary: 'GROQ',
    secondary: 'OPENAI',
    role: 'High Throughput',
    bestFor: ['batch jobs', 'parallel tasks', 'scale']
  },
  IOTA: {
    primary: 'OPENAI',
    secondary: 'MISTRAL',
    role: 'Integration Hub',
    bestFor: ['API design', 'formatting', 'structure']
  },
  KAPPA: {
    primary: 'GEMINI',
    secondary: 'DEEPSEEK',
    role: 'Knowledge Synthesis',
    bestFor: ['fact-checking', 'aggregation', 'learning']
  }
};

/**
 * Multi-Model API Client
 * Unified interface for all AI providers
 */
class MultiModelClient {
  constructor(apiKeys = {}) {
    this.apiKeys = {
      anthropic: apiKeys.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
      groq: apiKeys.GROQ_API_KEY || process.env.GROQ_API_KEY,
      openai: apiKeys.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      google: apiKeys.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY,
      mistral: apiKeys.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY,
      deepseek: apiKeys.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY
    };

    this.endpoints = {
      anthropic: 'https://api.anthropic.com/v1/messages',
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      openai: 'https://api.openai.com/v1/chat/completions',
      google: 'https://generativelanguage.googleapis.com/v1beta/models',
      mistral: 'https://api.mistral.ai/v1/chat/completions',
      deepseek: 'https://api.deepseek.com/v1/chat/completions'
    };
  }

  /**
   * Call any AI provider with unified interface
   */
  async call(provider, model, messages, options = {}) {
    const startTime = Date.now();

    try {
      let response;

      switch (provider) {
        case 'anthropic':
          response = await this.callAnthropic(model, messages, options);
          break;
        case 'groq':
          response = await this.callGroq(model, messages, options);
          break;
        case 'openai':
          response = await this.callOpenAI(model, messages, options);
          break;
        case 'google':
          response = await this.callGemini(model, messages, options);
          break;
        case 'mistral':
          response = await this.callMistral(model, messages, options);
          break;
        case 'deepseek':
          response = await this.callDeepSeek(model, messages, options);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      const latency = Date.now() - startTime;

      return {
        success: true,
        content: response.content,
        provider,
        model,
        latency,
        tokens: response.tokens || { input: 0, output: 0 }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider,
        model,
        latency: Date.now() - startTime
      };
    }
  }

  async callAnthropic(model, messages, options) {
    const response = await fetch(this.endpoints.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKeys.anthropic,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens || 4096,
        messages: messages.map(m => ({
          role: m.role === 'system' ? 'user' : m.role,
          content: m.content
        })),
        system: messages.find(m => m.role === 'system')?.content
      })
    });

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || '',
      tokens: { input: data.usage?.input_tokens, output: data.usage?.output_tokens }
    };
  }

  async callGroq(model, messages, options) {
    const response = await fetch(this.endpoints.groq, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.groq}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      })
    });

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      tokens: { input: data.usage?.prompt_tokens, output: data.usage?.completion_tokens }
    };
  }

  async callOpenAI(model, messages, options) {
    const response = await fetch(this.endpoints.openai, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.openai}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      })
    });

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      tokens: { input: data.usage?.prompt_tokens, output: data.usage?.completion_tokens }
    };
  }

  async callGemini(model, messages, options) {
    const url = `${this.endpoints.google}/${model}:generateContent?key=${this.apiKeys.google}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        generationConfig: {
          maxOutputTokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7
        }
      })
    });

    const data = await response.json();
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      tokens: { input: data.usageMetadata?.promptTokenCount, output: data.usageMetadata?.candidatesTokenCount }
    };
  }

  async callMistral(model, messages, options) {
    const response = await fetch(this.endpoints.mistral, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.mistral}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      })
    });

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      tokens: { input: data.usage?.prompt_tokens, output: data.usage?.completion_tokens }
    };
  }

  async callDeepSeek(model, messages, options) {
    const response = await fetch(this.endpoints.deepseek, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.deepseek}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      })
    });

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      tokens: { input: data.usage?.prompt_tokens, output: data.usage?.completion_tokens }
    };
  }
}

/**
 * Multi-Model Swarm
 * A swarm that can leverage multiple AI providers
 */
class MultiModelSwarm {
  constructor(swarmId, config = {}) {
    this.swarmId = swarmId;
    this.specialization = SWARM_SPECIALIZATIONS[swarmId] || SWARM_SPECIALIZATIONS.ALPHA;
    this.client = new MultiModelClient(config.apiKeys);
    this.agents = [];
    this.size = config.size || 100;

    // Initialize agents with provider diversity
    this.initializeAgents();
  }

  initializeAgents() {
    const primaryProvider = AI_PROVIDERS[this.specialization.primary];
    const secondaryProvider = AI_PROVIDERS[this.specialization.secondary];

    for (let i = 0; i < this.size; i++) {
      // 70% primary, 30% secondary for diversity
      const isPrimary = i < this.size * 0.7;
      const provider = isPrimary ? primaryProvider : secondaryProvider;
      const providerKey = isPrimary ? this.specialization.primary : this.specialization.secondary;

      // Distribute across model tiers
      let tier;
      if (i % 10 < 6) tier = 'fast';      // 60% fast
      else if (i % 10 < 9) tier = 'balanced'; // 30% balanced
      else tier = 'powerful';                  // 10% powerful

      this.agents.push({
        id: `${this.swarmId}-${i}`,
        provider: providerKey,
        providerConfig: provider,
        model: provider.models[tier],
        tier,
        strengths: provider.strengths,
        costMultiplier: provider.costPer1kTokens[tier],
        speedMultiplier: provider.speedMultiplier[tier],
        energy: 100,
        taskCount: 0
      });
    }
  }

  /**
   * Get best agents for a task based on requirements
   */
  getBestAgentsForTask(task, count = 10) {
    const taskStrengths = this.analyzeTaskStrengths(task);

    return this.agents
      .filter(a => a.energy > 20)
      .map(agent => ({
        ...agent,
        score: this.scoreAgentForTask(agent, taskStrengths)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  analyzeTaskStrengths(task) {
    const taskLower = task.toLowerCase();
    const strengths = [];

    if (taskLower.includes('code') || taskLower.includes('program') || taskLower.includes('function')) {
      strengths.push('coding');
    }
    if (taskLower.includes('fast') || taskLower.includes('quick') || taskLower.includes('speed')) {
      strengths.push('speed');
    }
    if (taskLower.includes('analyze') || taskLower.includes('reason') || taskLower.includes('explain')) {
      strengths.push('reasoning', 'analysis');
    }
    if (taskLower.includes('creative') || taskLower.includes('write') || taskLower.includes('story')) {
      strengths.push('creative', 'writing');
    }
    if (taskLower.includes('math') || taskLower.includes('calculate') || taskLower.includes('number')) {
      strengths.push('math');
    }
    if (taskLower.includes('translate') || taskLower.includes('language')) {
      strengths.push('multilingual');
    }

    return strengths.length > 0 ? strengths : ['general'];
  }

  scoreAgentForTask(agent, taskStrengths) {
    let score = 50; // Base score

    // Match strengths
    for (const strength of taskStrengths) {
      if (agent.strengths.includes(strength)) {
        score += 20;
      }
    }

    // Factor in speed
    score += agent.speedMultiplier * 5;

    // Factor in energy
    score += agent.energy * 0.2;

    // Penalize expensive models slightly (cost efficiency)
    score -= agent.costMultiplier * 100;

    return score;
  }

  /**
   * Execute task with multi-model diversity
   */
  async execute(task, options = {}) {
    const agents = this.getBestAgentsForTask(task, options.agentCount || 5);
    const startTime = Date.now();

    // Parallel execution across different models
    const results = await Promise.all(
      agents.map(async (agent) => {
        const messages = [
          { role: 'system', content: `You are agent ${agent.id} in the ${this.swarmId} swarm. Your strengths: ${agent.strengths.join(', ')}. Execute efficiently.` },
          { role: 'user', content: task }
        ];

        const result = await this.client.call(
          agent.providerConfig.provider,
          agent.model,
          messages,
          options
        );

        // Drain energy
        agent.energy = Math.max(0, agent.energy - 10);
        agent.taskCount++;

        return {
          agentId: agent.id,
          provider: agent.provider,
          model: agent.model,
          tier: agent.tier,
          ...result
        };
      })
    );

    // Aggregate results
    const successfulResults = results.filter(r => r.success);

    return {
      swarmId: this.swarmId,
      task,
      totalAgents: agents.length,
      successfulResponses: successfulResults.length,
      results: successfulResults,
      diversity: this.calculateDiversity(successfulResults),
      totalLatency: Date.now() - startTime,
      avgLatency: successfulResults.reduce((sum, r) => sum + r.latency, 0) / successfulResults.length
    };
  }

  calculateDiversity(results) {
    const providers = new Set(results.map(r => r.provider));
    const models = new Set(results.map(r => r.model));

    return {
      providerCount: providers.size,
      modelCount: models.size,
      diversityScore: (providers.size * 0.3 + models.size * 0.7) / results.length * 100
    };
  }

  /**
   * Regenerate energy for all agents
   */
  regenerateEnergy(amount = 10) {
    for (const agent of this.agents) {
      agent.energy = Math.min(100, agent.energy + amount);
    }
  }

  getStatus() {
    const avgEnergy = this.agents.reduce((sum, a) => sum + a.energy, 0) / this.agents.length;
    const totalTasks = this.agents.reduce((sum, a) => sum + a.taskCount, 0);

    const providerBreakdown = {};
    for (const agent of this.agents) {
      providerBreakdown[agent.provider] = (providerBreakdown[agent.provider] || 0) + 1;
    }

    return {
      swarmId: this.swarmId,
      role: this.specialization.role,
      bestFor: this.specialization.bestFor,
      size: this.size,
      avgEnergy: Math.round(avgEnergy),
      totalTasks,
      providerBreakdown,
      primaryProvider: this.specialization.primary,
      secondaryProvider: this.specialization.secondary
    };
  }
}

/**
 * Multi-Model Network
 * Orchestrates all swarms with different AI providers
 */
class MultiModelNetwork {
  constructor(config = {}) {
    this.swarms = {};
    this.config = config;

    // Initialize all swarms
    for (const swarmId of Object.keys(SWARM_SPECIALIZATIONS)) {
      this.swarms[swarmId] = new MultiModelSwarm(swarmId, config);
    }
  }

  /**
   * Route task to best swarm(s) based on requirements
   */
  routeTask(task) {
    const taskLower = task.toLowerCase();
    const matches = [];

    for (const [swarmId, spec] of Object.entries(SWARM_SPECIALIZATIONS)) {
      let score = 0;
      for (const capability of spec.bestFor) {
        if (taskLower.includes(capability.split(' ')[0])) {
          score += 10;
        }
      }
      if (score > 0) matches.push({ swarmId, score });
    }

    // Sort by score, default to ALPHA if no matches
    matches.sort((a, b) => b.score - a.score);
    return matches.length > 0 ? matches.map(m => m.swarmId) : ['ALPHA'];
  }

  /**
   * Execute across multiple swarms for diversity
   */
  async executeMultiSwarm(task, options = {}) {
    const targetSwarms = options.swarms || this.routeTask(task);
    const startTime = Date.now();

    const results = await Promise.all(
      targetSwarms.slice(0, 3).map(swarmId =>
        this.swarms[swarmId].execute(task, options)
      )
    );

    return {
      task,
      swarmsUsed: targetSwarms.slice(0, 3),
      results,
      totalLatency: Date.now() - startTime,
      totalResponses: results.reduce((sum, r) => sum + r.successfulResponses, 0),
      crossSwarmDiversity: new Set(results.flatMap(r => r.results.map(x => x.provider))).size
    };
  }

  getNetworkStatus() {
    const swarmStatuses = {};
    let totalAgents = 0;
    let totalTasks = 0;

    for (const [swarmId, swarm] of Object.entries(this.swarms)) {
      const status = swarm.getStatus();
      swarmStatuses[swarmId] = status;
      totalAgents += status.size;
      totalTasks += status.totalTasks;
    }

    return {
      totalSwarms: Object.keys(this.swarms).length,
      totalAgents,
      totalTasks,
      swarms: swarmStatuses,
      providersAvailable: Object.keys(AI_PROVIDERS)
    };
  }
}

module.exports = {
  AI_PROVIDERS,
  SWARM_SPECIALIZATIONS,
  MultiModelClient,
  MultiModelSwarm,
  MultiModelNetwork
};
