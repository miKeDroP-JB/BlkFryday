// ============================================================
//  ORBOS V11.5 - MULTI-PROVIDER AI ORCHESTRATOR
//  Tap into ALL AI tools, aggregate the best outputs
// ============================================================
//
//  "The data is out there to put us over the top!"
//
//  Providers: OpenAI, Anthropic, Google, Mistral, Groq,
//             Perplexity, Cohere, Together, Replicate,
//             HuggingFace, Local models, and more...
//
// ============================================================

class MultiProviderOrchestrator {
  constructor(config = {}) {
    this.config = config;

    // ============================================================
    //  PROVIDER REGISTRY - All available AI tools
    // ============================================================

    this.providers = {
      // ================== LLM PROVIDERS ==================
      openai: {
        name: 'OpenAI',
        type: 'llm',
        models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-4o'],
        strengths: ['reasoning', 'code', 'general', 'vision'],
        costTier: 'high',
        speed: 'medium',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        enabled: !!process.env.OPENAI_API_KEY
      },

      anthropic: {
        name: 'Anthropic Claude',
        type: 'llm',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        strengths: ['reasoning', 'analysis', 'writing', 'code', 'safety'],
        costTier: 'high',
        speed: 'medium',
        endpoint: 'https://api.anthropic.com/v1/messages',
        enabled: !!process.env.ANTHROPIC_API_KEY
      },

      google: {
        name: 'Google Gemini',
        type: 'llm',
        models: ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'],
        strengths: ['multimodal', 'reasoning', 'search', 'code'],
        costTier: 'medium',
        speed: 'fast',
        endpoint: 'https://generativelanguage.googleapis.com/v1/models',
        enabled: !!process.env.GOOGLE_API_KEY
      },

      mistral: {
        name: 'Mistral AI',
        type: 'llm',
        models: ['mistral-large', 'mistral-medium', 'mistral-small', 'mixtral-8x7b'],
        strengths: ['code', 'reasoning', 'efficiency'],
        costTier: 'low',
        speed: 'fast',
        endpoint: 'https://api.mistral.ai/v1/chat/completions',
        enabled: !!process.env.MISTRAL_API_KEY
      },

      groq: {
        name: 'Groq',
        type: 'llm',
        models: ['llama-3-70b', 'mixtral-8x7b', 'llama-3-8b'],
        strengths: ['speed', 'code', 'chat'],
        costTier: 'low',
        speed: 'ultra-fast',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        enabled: !!process.env.GROQ_API_KEY
      },

      together: {
        name: 'Together AI',
        type: 'llm',
        models: ['llama-3-70b', 'codellama-70b', 'mixtral-8x22b', 'qwen-72b'],
        strengths: ['code', 'open-source', 'fine-tuning'],
        costTier: 'low',
        speed: 'fast',
        endpoint: 'https://api.together.xyz/v1/chat/completions',
        enabled: !!process.env.TOGETHER_API_KEY
      },

      perplexity: {
        name: 'Perplexity',
        type: 'llm',
        models: ['pplx-70b-online', 'pplx-7b-online', 'sonar-medium'],
        strengths: ['search', 'research', 'real-time'],
        costTier: 'medium',
        speed: 'medium',
        endpoint: 'https://api.perplexity.ai/chat/completions',
        enabled: !!process.env.PERPLEXITY_API_KEY
      },

      cohere: {
        name: 'Cohere',
        type: 'llm',
        models: ['command-r-plus', 'command-r', 'command'],
        strengths: ['rag', 'embeddings', 'search', 'enterprise'],
        costTier: 'medium',
        speed: 'fast',
        endpoint: 'https://api.cohere.ai/v1/chat',
        enabled: !!process.env.COHERE_API_KEY
      },

      // ================== CODE PROVIDERS ==================
      codestral: {
        name: 'Mistral Codestral',
        type: 'code',
        models: ['codestral-latest'],
        strengths: ['code-generation', 'completion', 'refactoring'],
        costTier: 'low',
        speed: 'fast',
        endpoint: 'https://codestral.mistral.ai/v1/fim/completions',
        enabled: !!process.env.CODESTRAL_API_KEY
      },

      deepseek: {
        name: 'DeepSeek Coder',
        type: 'code',
        models: ['deepseek-coder-33b', 'deepseek-coder-v2'],
        strengths: ['code', 'debugging', 'explanation'],
        costTier: 'low',
        speed: 'fast',
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        enabled: !!process.env.DEEPSEEK_API_KEY
      },

      // ================== IMAGE PROVIDERS ==================
      dalle: {
        name: 'DALL-E 3',
        type: 'image',
        models: ['dall-e-3', 'dall-e-2'],
        strengths: ['image-generation', 'creative'],
        costTier: 'high',
        speed: 'slow',
        endpoint: 'https://api.openai.com/v1/images/generations',
        enabled: !!process.env.OPENAI_API_KEY
      },

      stability: {
        name: 'Stability AI',
        type: 'image',
        models: ['sdxl-1.0', 'sd-3'],
        strengths: ['image-generation', 'fine-tuning'],
        costTier: 'medium',
        speed: 'medium',
        endpoint: 'https://api.stability.ai/v1/generation',
        enabled: !!process.env.STABILITY_API_KEY
      },

      replicate: {
        name: 'Replicate',
        type: 'multi',
        models: ['flux', 'llama', 'whisper', 'sdxl'],
        strengths: ['variety', 'open-source', 'custom-models'],
        costTier: 'variable',
        speed: 'variable',
        endpoint: 'https://api.replicate.com/v1/predictions',
        enabled: !!process.env.REPLICATE_API_KEY
      },

      // ================== VOICE PROVIDERS ==================
      elevenlabs: {
        name: 'ElevenLabs',
        type: 'voice',
        models: ['eleven_multilingual_v2', 'eleven_turbo_v2'],
        strengths: ['tts', 'voice-cloning', 'realtime'],
        costTier: 'medium',
        speed: 'fast',
        endpoint: 'https://api.elevenlabs.io/v1/text-to-speech',
        enabled: !!process.env.ELEVENLABS_API_KEY
      },

      whisper: {
        name: 'OpenAI Whisper',
        type: 'voice',
        models: ['whisper-1'],
        strengths: ['stt', 'transcription', 'translation'],
        costTier: 'low',
        speed: 'medium',
        endpoint: 'https://api.openai.com/v1/audio/transcriptions',
        enabled: !!process.env.OPENAI_API_KEY
      },

      // ================== EMBEDDING PROVIDERS ==================
      voyageai: {
        name: 'Voyage AI',
        type: 'embeddings',
        models: ['voyage-large-2', 'voyage-code-2'],
        strengths: ['embeddings', 'code-search', 'rag'],
        costTier: 'low',
        speed: 'fast',
        endpoint: 'https://api.voyageai.com/v1/embeddings',
        enabled: !!process.env.VOYAGE_API_KEY
      },

      // ================== LOCAL PROVIDERS ==================
      ollama: {
        name: 'Ollama (Local)',
        type: 'local',
        models: ['llama3', 'codellama', 'mistral', 'phi3'],
        strengths: ['privacy', 'free', 'customizable'],
        costTier: 'free',
        speed: 'variable',
        endpoint: 'http://localhost:11434/api/generate',
        enabled: true // Always available locally
      },

      lmstudio: {
        name: 'LM Studio (Local)',
        type: 'local',
        models: ['any-gguf'],
        strengths: ['privacy', 'free', 'any-model'],
        costTier: 'free',
        speed: 'variable',
        endpoint: 'http://localhost:1234/v1/chat/completions',
        enabled: true
      }
    };

    // Task routing rules
    this.routingRules = {
      'code': ['groq', 'deepseek', 'codestral', 'together', 'anthropic', 'openai'],
      'reasoning': ['anthropic', 'openai', 'google', 'mistral'],
      'creative': ['anthropic', 'openai', 'mistral'],
      'search': ['perplexity', 'google', 'cohere'],
      'speed': ['groq', 'mistral', 'together'],
      'cheap': ['groq', 'together', 'mistral', 'ollama'],
      'vision': ['openai', 'google', 'anthropic'],
      'image': ['dalle', 'stability', 'replicate'],
      'voice': ['elevenlabs', 'whisper'],
      'embeddings': ['voyageai', 'cohere', 'openai']
    };

    // Results aggregator
    this.aggregator = new ResultsAggregator();

    // Stats
    this.stats = {
      totalRequests: 0,
      byProvider: {},
      averageLatency: {},
      successRate: {}
    };
  }

  // ============================================================
  //  INTELLIGENT ROUTING
  // ============================================================

  selectProviders(task, options = {}) {
    const { type, priority, maxProviders = 3, excludeProviders = [] } = options;

    // Get candidates based on task type
    let candidates = this.routingRules[type] || Object.keys(this.providers);

    // Filter enabled providers
    candidates = candidates.filter(p =>
      this.providers[p]?.enabled &&
      !excludeProviders.includes(p)
    );

    // Sort by priority
    if (priority === 'speed') {
      candidates.sort((a, b) => {
        const speedOrder = { 'ultra-fast': 0, 'fast': 1, 'medium': 2, 'slow': 3, 'variable': 2 };
        return speedOrder[this.providers[a].speed] - speedOrder[this.providers[b].speed];
      });
    } else if (priority === 'cost') {
      candidates.sort((a, b) => {
        const costOrder = { 'free': 0, 'low': 1, 'medium': 2, 'high': 3, 'variable': 2 };
        return costOrder[this.providers[a].costTier] - costOrder[this.providers[b].costTier];
      });
    } else if (priority === 'quality') {
      candidates.sort((a, b) => {
        const qualityOrder = { 'high': 0, 'medium': 1, 'low': 2, 'variable': 1 };
        return qualityOrder[this.providers[a].costTier] - qualityOrder[this.providers[b].costTier];
      });
    }

    return candidates.slice(0, maxProviders);
  }

  // ============================================================
  //  PARALLEL EXECUTION
  // ============================================================

  async executeParallel(task, options = {}) {
    const providers = this.selectProviders(task, options);
    console.log(`[Orchestrator] Running on ${providers.length} providers:`, providers);

    const startTime = Date.now();
    const results = await Promise.allSettled(
      providers.map(providerId => this.callProvider(providerId, task, options))
    );

    const successful = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    const failed = results
      .filter(r => r.status === 'rejected')
      .map(r => r.reason);

    // Aggregate results
    const aggregated = this.aggregator.aggregate(successful, {
      strategy: options.aggregation || 'best',
      task
    });

    this.stats.totalRequests++;

    return {
      aggregated,
      individual: successful,
      failed: failed.length,
      providers: providers.length,
      latency: Date.now() - startTime
    };
  }

  // ============================================================
  //  TOURNAMENT MODE - Best of N
  // ============================================================

  async executeTournament(task, options = {}) {
    const providers = this.selectProviders(task, { ...options, maxProviders: 5 });
    console.log(`[Orchestrator] Tournament mode with ${providers.length} providers`);

    // Round 1: All providers
    const round1 = await Promise.allSettled(
      providers.map(p => this.callProvider(p, task, options))
    );

    const round1Results = round1
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    // Score results
    const scored = round1Results.map(result => ({
      ...result,
      score: this.scoreResult(result, task)
    })).sort((a, b) => b.score - a.score);

    // Top 2 go to finals
    const finalists = scored.slice(0, 2);

    if (finalists.length < 2) {
      return { winner: finalists[0], tournament: scored };
    }

    // Round 2: Refine top answers
    const refinedPrompt = `
Given these two answers to the task "${task}", combine the best parts into a superior answer:

Answer 1 (${finalists[0].provider}):
${finalists[0].content}

Answer 2 (${finalists[1].provider}):
${finalists[1].content}

Create a refined, improved response:
`;

    const refined = await this.callProvider(
      this.selectProviders(task, { type: 'reasoning', maxProviders: 1 })[0],
      refinedPrompt,
      options
    );

    return {
      winner: refined,
      finalists,
      tournament: scored
    };
  }

  // ============================================================
  //  CHAIN OF THOUGHT - Sequential refinement
  // ============================================================

  async executeChain(task, options = {}) {
    const steps = options.steps || [
      { type: 'reasoning', prompt: 'Analyze this task and create a plan:' },
      { type: 'code', prompt: 'Implement the solution:' },
      { type: 'reasoning', prompt: 'Review and improve:' }
    ];

    const chain = [];
    let context = task;

    for (const step of steps) {
      const provider = this.selectProviders(task, { type: step.type, maxProviders: 1 })[0];
      const prompt = `${step.prompt}\n\nContext: ${context}`;

      const result = await this.callProvider(provider, prompt, options);
      chain.push({
        step: step.type,
        provider,
        result
      });

      context = result.content;
    }

    return {
      final: chain[chain.length - 1].result,
      chain
    };
  }

  // ============================================================
  //  SWARM MODE - All 1007 agents across all providers
  // ============================================================

  async executeSwarm(task, options = {}) {
    console.log('[Orchestrator] SWARM MODE - Deploying across all providers');

    const enabledProviders = Object.entries(this.providers)
      .filter(([_, p]) => p.enabled && p.type === 'llm')
      .map(([id, _]) => id);

    // Split task into subtasks for swarm
    const subtasks = this.decomposeTask(task);

    // Assign providers to subtasks
    const assignments = subtasks.map((subtask, i) => ({
      subtask,
      provider: enabledProviders[i % enabledProviders.length]
    }));

    // Execute all in parallel
    const results = await Promise.allSettled(
      assignments.map(({ subtask, provider }) =>
        this.callProvider(provider, subtask, options)
      )
    );

    // Aggregate swarm results
    const successful = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    return {
      swarmSize: assignments.length,
      successful: successful.length,
      results: successful,
      aggregated: this.aggregator.combineSubtasks(successful)
    };
  }

  decomposeTask(task) {
    // Simple decomposition - in production would use LLM
    const aspects = [
      'core implementation',
      'edge cases',
      'optimization',
      'documentation',
      'testing strategy'
    ];

    return aspects.map(aspect =>
      `For the task: "${task}"\n\nFocus on: ${aspect}`
    );
  }

  // ============================================================
  //  PROVIDER CALL
  // ============================================================

  async callProvider(providerId, task, options = {}) {
    const provider = this.providers[providerId];
    if (!provider) throw new Error(`Unknown provider: ${providerId}`);

    const startTime = Date.now();

    try {
      let result;

      switch (providerId) {
        case 'openai':
          result = await this.callOpenAI(task, options);
          break;
        case 'anthropic':
          result = await this.callAnthropic(task, options);
          break;
        case 'groq':
          result = await this.callGroq(task, options);
          break;
        case 'mistral':
          result = await this.callMistral(task, options);
          break;
        case 'together':
          result = await this.callTogether(task, options);
          break;
        case 'perplexity':
          result = await this.callPerplexity(task, options);
          break;
        case 'google':
          result = await this.callGoogle(task, options);
          break;
        case 'ollama':
          result = await this.callOllama(task, options);
          break;
        default:
          result = await this.callGenericOpenAI(provider, task, options);
      }

      const latency = Date.now() - startTime;

      // Track stats
      this.stats.byProvider[providerId] = (this.stats.byProvider[providerId] || 0) + 1;
      this.stats.averageLatency[providerId] = latency;

      return {
        provider: providerId,
        content: result.content,
        model: result.model,
        latency,
        tokens: result.tokens || 0
      };

    } catch (error) {
      console.error(`[${providerId}] Error:`, error.message);
      throw error;
    }
  }

  // ============================================================
  //  PROVIDER IMPLEMENTATIONS
  // ============================================================

  async callOpenAI(task, options = {}) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4-turbo',
        messages: [{ role: 'user', content: task }],
        max_tokens: options.maxTokens || 4000
      })
    });

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      tokens: data.usage?.total_tokens
    };
  }

  async callAnthropic(task, options = {}) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: options.model || 'claude-3-sonnet-20240229',
        max_tokens: options.maxTokens || 4000,
        messages: [{ role: 'user', content: task }]
      })
    });

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || '',
      model: data.model,
      tokens: data.usage?.input_tokens + data.usage?.output_tokens
    };
  }

  async callGroq(task, options = {}) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: options.model || 'llama-3.1-70b-versatile',
        messages: [{ role: 'user', content: task }],
        max_tokens: options.maxTokens || 4000
      })
    });

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      tokens: data.usage?.total_tokens
    };
  }

  async callMistral(task, options = {}) {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: options.model || 'mistral-large-latest',
        messages: [{ role: 'user', content: task }]
      })
    });

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      tokens: data.usage?.total_tokens
    };
  }

  async callTogether(task, options = {}) {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`
      },
      body: JSON.stringify({
        model: options.model || 'meta-llama/Llama-3-70b-chat-hf',
        messages: [{ role: 'user', content: task }]
      })
    });

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      tokens: data.usage?.total_tokens
    };
  }

  async callPerplexity(task, options = {}) {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: options.model || 'llama-3.1-sonar-large-128k-online',
        messages: [{ role: 'user', content: task }]
      })
    });

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      tokens: data.usage?.total_tokens
    };
  }

  async callGoogle(task, options = {}) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: task }] }]
        })
      }
    );

    const data = await response.json();
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      model: 'gemini-pro',
      tokens: 0
    };
  }

  async callOllama(task, options = {}) {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model || 'llama3',
          prompt: task,
          stream: false
        })
      });

      const data = await response.json();
      return {
        content: data.response || '',
        model: data.model,
        tokens: data.eval_count || 0
      };
    } catch (error) {
      throw new Error('Ollama not running locally');
    }
  }

  async callGenericOpenAI(provider, task, options = {}) {
    // Generic OpenAI-compatible endpoint
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env[`${provider.name.toUpperCase()}_API_KEY`]}`
      },
      body: JSON.stringify({
        model: options.model || provider.models[0],
        messages: [{ role: 'user', content: task }]
      })
    });

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      tokens: data.usage?.total_tokens
    };
  }

  // ============================================================
  //  SCORING
  // ============================================================

  scoreResult(result, task) {
    let score = 50; // Base score

    // Length bonus (up to 20 points)
    score += Math.min(20, result.content.length / 100);

    // Latency bonus (up to 15 points)
    score += Math.max(0, 15 - result.latency / 1000);

    // Code detection bonus
    if (task.toLowerCase().includes('code') && result.content.includes('```')) {
      score += 15;
    }

    return score;
  }

  // ============================================================
  //  STATUS
  // ============================================================

  getStatus() {
    const enabled = Object.entries(this.providers)
      .filter(([_, p]) => p.enabled)
      .map(([id, p]) => ({ id, name: p.name, type: p.type }));

    return {
      totalProviders: Object.keys(this.providers).length,
      enabledProviders: enabled.length,
      enabled,
      stats: this.stats
    };
  }
}

// ============================================================
//  RESULTS AGGREGATOR
// ============================================================

class ResultsAggregator {
  aggregate(results, options = {}) {
    if (results.length === 0) return null;
    if (results.length === 1) return results[0];

    switch (options.strategy) {
      case 'best':
        return this.selectBest(results, options.task);
      case 'merge':
        return this.mergeResults(results);
      case 'vote':
        return this.voteResults(results);
      default:
        return this.selectBest(results, options.task);
    }
  }

  selectBest(results, task) {
    // Simple heuristic: longest response with code if code task
    const isCodeTask = task?.toLowerCase().includes('code');

    return results.reduce((best, current) => {
      const hasCode = current.content.includes('```');
      const bestHasCode = best.content.includes('```');

      if (isCodeTask && hasCode && !bestHasCode) return current;
      if (isCodeTask && !hasCode && bestHasCode) return best;

      return current.content.length > best.content.length ? current : best;
    });
  }

  mergeResults(results) {
    // Combine unique insights from all results
    const combined = results.map(r =>
      `[${r.provider}]:\n${r.content}`
    ).join('\n\n---\n\n');

    return {
      provider: 'aggregated',
      content: combined,
      sources: results.map(r => r.provider)
    };
  }

  voteResults(results) {
    // Find consensus among results
    // Simplified: return most common response pattern
    return this.selectBest(results);
  }

  combineSubtasks(results) {
    return {
      provider: 'swarm',
      content: results.map(r => r.content).join('\n\n'),
      contributors: results.map(r => r.provider)
    };
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { MultiProviderOrchestrator, ResultsAggregator };
