/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  0RB CORE - AI PROVIDERS                                                     ║
 * ║  Real connections to real AI. No more simulation bullshit.                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const PROVIDERS = {
  OPENAI: {
    name: 'OpenAI',
    models: {
      'gpt-4-turbo-preview': { context: 128000, inputCost: 0.01, outputCost: 0.03 },
      'gpt-4o': { context: 128000, inputCost: 0.005, outputCost: 0.015 },
      'gpt-4o-mini': { context: 128000, inputCost: 0.00015, outputCost: 0.0006 },
      'gpt-4': { context: 8192, inputCost: 0.03, outputCost: 0.06 },
      'gpt-3.5-turbo': { context: 16385, inputCost: 0.0005, outputCost: 0.0015 },
      'o1-preview': { context: 128000, inputCost: 0.015, outputCost: 0.06 },
      'o1-mini': { context: 128000, inputCost: 0.003, outputCost: 0.012 }
    },
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true
  },
  ANTHROPIC: {
    name: 'Anthropic',
    models: {
      'claude-3-5-sonnet-20241022': { context: 200000, inputCost: 0.003, outputCost: 0.015 },
      'claude-3-opus-20240229': { context: 200000, inputCost: 0.015, outputCost: 0.075 },
      'claude-3-sonnet-20240229': { context: 200000, inputCost: 0.003, outputCost: 0.015 },
      'claude-3-haiku-20240307': { context: 200000, inputCost: 0.00025, outputCost: 0.00125 }
    },
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: true
  },
  OLLAMA: {
    name: 'Ollama (Local)',
    models: {
      'llama3.1:70b': { context: 128000, inputCost: 0, outputCost: 0 },
      'llama3.1:8b': { context: 128000, inputCost: 0, outputCost: 0 },
      'llama3.2:3b': { context: 128000, inputCost: 0, outputCost: 0 },
      'codellama:34b': { context: 16000, inputCost: 0, outputCost: 0 },
      'mixtral:8x7b': { context: 32000, inputCost: 0, outputCost: 0 },
      'qwen2.5:72b': { context: 128000, inputCost: 0, outputCost: 0 },
      'deepseek-coder:33b': { context: 16000, inputCost: 0, outputCost: 0 }
    },
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: false
  },
  GROQ: {
    name: 'Groq (Fast)',
    models: {
      'llama-3.1-70b-versatile': { context: 128000, inputCost: 0.00059, outputCost: 0.00079 },
      'llama-3.1-8b-instant': { context: 128000, inputCost: 0.00005, outputCost: 0.00008 },
      'mixtral-8x7b-32768': { context: 32768, inputCost: 0.00024, outputCost: 0.00024 }
    },
    supportsTools: true,
    supportsStreaming: true,
    supportsVision: false
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// BASE PROVIDER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class BaseProvider extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.metrics = {
      requests: 0,
      tokens: { input: 0, output: 0 },
      cost: 0,
      errors: 0,
      latency: []
    };
  }

  async complete(messages, options = {}) {
    throw new Error('complete() must be implemented by subclass');
  }

  async stream(messages, options = {}) {
    throw new Error('stream() must be implemented by subclass');
  }

  updateMetrics(usage, latency, model) {
    this.metrics.requests++;
    this.metrics.tokens.input += usage?.prompt_tokens || 0;
    this.metrics.tokens.output += usage?.completion_tokens || 0;
    this.metrics.latency.push(latency);
    if (this.metrics.latency.length > 100) this.metrics.latency.shift();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPENAI PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.defaultModel = config.model || 'gpt-4o-mini';
  }

  async complete(messages, options = {}) {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 4096,
          tools: options.tools,
          tool_choice: options.toolChoice,
          response_format: options.responseFormat
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      this.updateMetrics(data.usage, latency, model);
      this.emit('complete', { model, latency, usage: data.usage });

      return {
        content: data.choices[0].message.content,
        toolCalls: data.choices[0].message.tool_calls,
        finishReason: data.choices[0].finish_reason,
        usage: data.usage,
        model,
        latency
      };
    } catch (error) {
      this.metrics.errors++;
      this.emit('error', { error, model });
      throw error;
    }
  }

  async *stream(messages, options = {}) {
    const model = options.model || this.defaultModel;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices[0]?.delta?.content;
            if (content) yield content;
          } catch (e) { /* skip parse errors */ }
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANTHROPIC PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

class AnthropicProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    this.defaultModel = config.model || 'claude-3-5-sonnet-20241022';
  }

  async complete(messages, options = {}) {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    // Convert OpenAI format to Anthropic format
    const systemMessage = messages.find(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: options.maxTokens ?? 4096,
          system: systemMessage?.content,
          messages: otherMessages,
          temperature: options.temperature ?? 0.7,
          tools: options.tools ? this.convertToolsToAnthropic(options.tools) : undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      const usage = {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens
      };

      this.updateMetrics(usage, latency, model);
      this.emit('complete', { model, latency, usage });

      // Extract text content
      const textContent = data.content.find(c => c.type === 'text');
      const toolUse = data.content.filter(c => c.type === 'tool_use');

      return {
        content: textContent?.text || '',
        toolCalls: toolUse.length > 0 ? toolUse.map(t => ({
          id: t.id,
          type: 'function',
          function: { name: t.name, arguments: JSON.stringify(t.input) }
        })) : undefined,
        finishReason: data.stop_reason,
        usage,
        model,
        latency
      };
    } catch (error) {
      this.metrics.errors++;
      this.emit('error', { error, model });
      throw error;
    }
  }

  convertToolsToAnthropic(tools) {
    return tools.map(t => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters
    }));
  }

  async *stream(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const systemMessage = messages.find(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens ?? 4096,
        system: systemMessage?.content,
        messages: otherMessages,
        temperature: options.temperature ?? 0.7,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta?.text) {
              yield data.delta.text;
            }
          } catch (e) { /* skip parse errors */ }
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OLLAMA PROVIDER (LOCAL)
// ═══════════════════════════════════════════════════════════════════════════════

class OllamaProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.defaultModel = config.model || 'llama3.1:8b';
  }

  async complete(messages, options = {}) {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 4096
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      const usage = {
        prompt_tokens: data.prompt_eval_count || 0,
        completion_tokens: data.eval_count || 0,
        total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      };

      this.updateMetrics(usage, latency, model);
      this.emit('complete', { model, latency, usage });

      return {
        content: data.message.content,
        finishReason: data.done_reason || 'stop',
        usage,
        model,
        latency
      };
    } catch (error) {
      this.metrics.errors++;
      this.emit('error', { error, model });
      throw error;
    }
  }

  async *stream(messages, options = {}) {
    const model = options.model || this.defaultModel;

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 4096
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            yield data.message.content;
          }
        } catch (e) { /* skip parse errors */ }
      }
    }
  }

  async listModels() {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    if (!response.ok) throw new Error('Failed to list models');
    const data = await response.json();
    return data.models || [];
  }

  async pullModel(model) {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model })
    });
    return response.ok;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROQ PROVIDER (FAST)
// ═══════════════════════════════════════════════════════════════════════════════

class GroqProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY;
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.defaultModel = config.model || 'llama-3.1-70b-versatile';
  }

  async complete(messages, options = {}) {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 4096
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      this.updateMetrics(data.usage, latency, model);
      this.emit('complete', { model, latency, usage: data.usage });

      return {
        content: data.choices[0].message.content,
        finishReason: data.choices[0].finish_reason,
        usage: data.usage,
        model,
        latency
      };
    } catch (error) {
      this.metrics.errors++;
      this.emit('error', { error, model });
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

class ProviderManager extends EventEmitter {
  constructor() {
    super();
    this.providers = new Map();
    this.defaultProvider = null;
  }

  register(name, provider) {
    this.providers.set(name, provider);
    if (!this.defaultProvider) this.defaultProvider = name;
    console.log(`[PROVIDERS] Registered: ${name}`);
    return this;
  }

  get(name) {
    return this.providers.get(name);
  }

  setDefault(name) {
    if (this.providers.has(name)) {
      this.defaultProvider = name;
    }
    return this;
  }

  async complete(messages, options = {}) {
    const providerName = options.provider || this.defaultProvider;
    const provider = this.providers.get(providerName);
    if (!provider) throw new Error(`Provider not found: ${providerName}`);
    return provider.complete(messages, options);
  }

  async *stream(messages, options = {}) {
    const providerName = options.provider || this.defaultProvider;
    const provider = this.providers.get(providerName);
    if (!provider) throw new Error(`Provider not found: ${providerName}`);
    yield* provider.stream(messages, options);
  }

  getMetrics() {
    const metrics = {};
    for (const [name, provider] of this.providers) {
      metrics[name] = provider.metrics;
    }
    return metrics;
  }

  static autoInit() {
    const manager = new ProviderManager();

    // Auto-register available providers
    if (process.env.OPENAI_API_KEY) {
      manager.register('openai', new OpenAIProvider());
      console.log('[PROVIDERS] OpenAI: READY');
    }

    if (process.env.ANTHROPIC_API_KEY) {
      manager.register('anthropic', new AnthropicProvider());
      console.log('[PROVIDERS] Anthropic: READY');
    }

    if (process.env.GROQ_API_KEY) {
      manager.register('groq', new GroqProvider());
      console.log('[PROVIDERS] Groq: READY');
    }

    // Always try to register Ollama (local)
    manager.register('ollama', new OllamaProvider());
    console.log('[PROVIDERS] Ollama: READY (local)');

    return manager;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  ProviderManager,
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
  GroqProvider,
  PROVIDERS
};
