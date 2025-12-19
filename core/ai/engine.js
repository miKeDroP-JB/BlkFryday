/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  0RB CORE - AI ENGINE                                                        ║
 * ║  The brain that actually thinks. Tool use. Multi-turn. Autonomous.           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const EventEmitter = require('events');
const { ProviderManager } = require('./providers');

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS - What agents can actually DO
// ═══════════════════════════════════════════════════════════════════════════════

const CORE_TOOLS = {
  // Web & Research
  web_search: {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for current information',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          num_results: { type: 'number', description: 'Number of results (default 5)' }
        },
        required: ['query']
      }
    }
  },

  web_scrape: {
    type: 'function',
    function: {
      name: 'web_scrape',
      description: 'Extract content from a webpage',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to scrape' },
          selector: { type: 'string', description: 'CSS selector to extract (optional)' }
        },
        required: ['url']
      }
    }
  },

  // File Operations
  read_file: {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read contents of a file',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' }
        },
        required: ['path']
      }
    }
  },

  write_file: {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write content to a file',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          content: { type: 'string', description: 'Content to write' }
        },
        required: ['path', 'content']
      }
    }
  },

  // Code Execution
  execute_code: {
    type: 'function',
    function: {
      name: 'execute_code',
      description: 'Execute code in a sandboxed environment',
      parameters: {
        type: 'object',
        properties: {
          language: { type: 'string', enum: ['javascript', 'python', 'bash'], description: 'Programming language' },
          code: { type: 'string', description: 'Code to execute' }
        },
        required: ['language', 'code']
      }
    }
  },

  // Data Processing
  json_transform: {
    type: 'function',
    function: {
      name: 'json_transform',
      description: 'Transform JSON data with a JQ-like query',
      parameters: {
        type: 'object',
        properties: {
          data: { type: 'object', description: 'Input JSON data' },
          query: { type: 'string', description: 'Transformation query' }
        },
        required: ['data', 'query']
      }
    }
  },

  // Communication
  send_email: {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send an email',
      parameters: {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email' },
          subject: { type: 'string', description: 'Email subject' },
          body: { type: 'string', description: 'Email body (HTML or plain text)' },
          from_name: { type: 'string', description: 'Sender name' }
        },
        required: ['to', 'subject', 'body']
      }
    }
  },

  // API Calls
  http_request: {
    type: 'function',
    function: {
      name: 'http_request',
      description: 'Make an HTTP request to an API',
      parameters: {
        type: 'object',
        properties: {
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
          url: { type: 'string', description: 'Request URL' },
          headers: { type: 'object', description: 'Request headers' },
          body: { type: 'object', description: 'Request body for POST/PUT/PATCH' }
        },
        required: ['method', 'url']
      }
    }
  },

  // Database
  database_query: {
    type: 'function',
    function: {
      name: 'database_query',
      description: 'Execute a database query',
      parameters: {
        type: 'object',
        properties: {
          connection: { type: 'string', description: 'Database connection name' },
          query: { type: 'string', description: 'SQL query' },
          params: { type: 'array', description: 'Query parameters' }
        },
        required: ['connection', 'query']
      }
    }
  },

  // Agent Coordination
  delegate_task: {
    type: 'function',
    function: {
      name: 'delegate_task',
      description: 'Delegate a subtask to another agent',
      parameters: {
        type: 'object',
        properties: {
          agent_type: { type: 'string', description: 'Target agent archetype' },
          task: { type: 'string', description: 'Task description' },
          context: { type: 'object', description: 'Additional context' }
        },
        required: ['agent_type', 'task']
      }
    }
  },

  // Memory
  memory_store: {
    type: 'function',
    function: {
      name: 'memory_store',
      description: 'Store information in long-term memory',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Memory key' },
          value: { type: 'string', description: 'Value to store' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Tags for retrieval' }
        },
        required: ['key', 'value']
      }
    }
  },

  memory_retrieve: {
    type: 'function',
    function: {
      name: 'memory_retrieve',
      description: 'Retrieve information from long-term memory',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Max results' }
        },
        required: ['query']
      }
    }
  },

  // Output
  create_artifact: {
    type: 'function',
    function: {
      name: 'create_artifact',
      description: 'Create a deliverable artifact (document, code, etc)',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['document', 'code', 'image', 'data', 'report'] },
          name: { type: 'string', description: 'Artifact name' },
          content: { type: 'string', description: 'Artifact content' },
          format: { type: 'string', description: 'File format (md, js, json, etc)' }
        },
        required: ['type', 'name', 'content']
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL EXECUTOR - Actually runs the tools
// ═══════════════════════════════════════════════════════════════════════════════

class ToolExecutor extends EventEmitter {
  constructor(config = {}) {
    super();
    this.tools = new Map();
    this.handlers = new Map();
    this.config = config;

    // Register default handlers
    this.registerDefaultHandlers();
  }

  registerTool(name, definition, handler) {
    this.tools.set(name, definition);
    this.handlers.set(name, handler);
  }

  registerDefaultHandlers() {
    // Web search (using DuckDuckGo or similar)
    this.handlers.set('web_search', async ({ query, num_results = 5 }) => {
      // In production, integrate with search API
      return { results: [], message: `Search for: ${query} (integrate search API)` };
    });

    // Web scrape
    this.handlers.set('web_scrape', async ({ url, selector }) => {
      try {
        const response = await fetch(url);
        const html = await response.text();
        return { content: html.substring(0, 5000), url };
      } catch (error) {
        return { error: error.message };
      }
    });

    // Read file
    this.handlers.set('read_file', async ({ path }) => {
      const fs = require('fs').promises;
      try {
        const content = await fs.readFile(path, 'utf-8');
        return { content, path };
      } catch (error) {
        return { error: error.message };
      }
    });

    // Write file
    this.handlers.set('write_file', async ({ path, content }) => {
      const fs = require('fs').promises;
      try {
        await fs.writeFile(path, content);
        return { success: true, path };
      } catch (error) {
        return { error: error.message };
      }
    });

    // Execute code (sandboxed)
    this.handlers.set('execute_code', async ({ language, code }) => {
      // SECURITY: In production, use proper sandboxing
      if (language === 'javascript') {
        try {
          const result = eval(code);
          return { result: String(result) };
        } catch (error) {
          return { error: error.message };
        }
      }
      return { error: `Language ${language} execution not implemented` };
    });

    // HTTP request
    this.handlers.set('http_request', async ({ method, url, headers, body }) => {
      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined
        });
        const data = await response.json();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });

    // Create artifact
    this.handlers.set('create_artifact', async ({ type, name, content, format }) => {
      // Store artifact for retrieval
      const artifact = { type, name, content, format, createdAt: new Date().toISOString() };
      this.emit('artifact:created', artifact);
      return { success: true, artifact };
    });

    // Delegate task (handled by engine)
    this.handlers.set('delegate_task', async (params) => {
      this.emit('delegate', params);
      return { delegated: true, ...params };
    });

    // Memory operations (in-memory for now, add vector DB later)
    const memoryStore = new Map();

    this.handlers.set('memory_store', async ({ key, value, tags }) => {
      memoryStore.set(key, { value, tags, timestamp: Date.now() });
      return { stored: true, key };
    });

    this.handlers.set('memory_retrieve', async ({ query, limit = 5 }) => {
      const results = [];
      for (const [key, data] of memoryStore) {
        if (key.includes(query) || data.value.includes(query)) {
          results.push({ key, ...data });
        }
        if (results.length >= limit) break;
      }
      return { results };
    });
  }

  async execute(toolName, args) {
    const handler = this.handlers.get(toolName);
    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const startTime = Date.now();
    this.emit('tool:start', { tool: toolName, args });

    try {
      const result = await handler(args);
      const duration = Date.now() - startTime;
      this.emit('tool:complete', { tool: toolName, result, duration });
      return result;
    } catch (error) {
      this.emit('tool:error', { tool: toolName, error });
      throw error;
    }
  }

  getToolDefinitions(toolNames = null) {
    if (!toolNames) {
      return Object.values(CORE_TOOLS);
    }
    return toolNames.map(name => CORE_TOOLS[name]).filter(Boolean);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI ENGINE - The orchestrator
// ═══════════════════════════════════════════════════════════════════════════════

class AIEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxTurns: config.maxTurns || 10,
      maxToolCalls: config.maxToolCalls || 20,
      defaultProvider: config.defaultProvider || 'openai',
      defaultModel: config.defaultModel || 'gpt-4o-mini',
      ...config
    };

    this.providers = config.providers || ProviderManager.autoInit();
    this.toolExecutor = new ToolExecutor(config);
    this.conversations = new Map();
    this.artifacts = [];

    // Forward tool events
    this.toolExecutor.on('artifact:created', (artifact) => {
      this.artifacts.push(artifact);
      this.emit('artifact', artifact);
    });

    this.toolExecutor.on('delegate', (params) => {
      this.emit('delegate', params);
    });

    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                     AI ENGINE INITIALIZED                             ║
╠══════════════════════════════════════════════════════════════════════╣
║  Provider: ${(this.config.defaultProvider || 'auto').padEnd(56)}║
║  Model: ${(this.config.defaultModel || 'auto').padEnd(59)}║
║  Max Turns: ${String(this.config.maxTurns).padEnd(55)}║
║  Tools: ${String(Object.keys(CORE_TOOLS).length).padEnd(59)}║
╚══════════════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * Single completion - one turn, no tool use
   */
  async complete(prompt, options = {}) {
    const messages = typeof prompt === 'string'
      ? [{ role: 'user', content: prompt }]
      : prompt;

    return this.providers.complete(messages, {
      provider: options.provider || this.config.defaultProvider,
      model: options.model || this.config.defaultModel,
      ...options
    });
  }

  /**
   * Agentic completion - multi-turn with tool use until done
   */
  async run(systemPrompt, userMessage, options = {}) {
    const conversationId = options.conversationId || `conv-${Date.now()}`;
    const tools = options.tools !== false
      ? this.toolExecutor.getToolDefinitions(options.toolNames)
      : undefined;

    let messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    const results = {
      conversationId,
      turns: [],
      toolCalls: [],
      artifacts: [],
      finalResponse: null
    };

    let turn = 0;
    let totalToolCalls = 0;

    while (turn < this.config.maxTurns) {
      turn++;
      this.emit('turn:start', { conversationId, turn });

      const response = await this.providers.complete(messages, {
        provider: options.provider || this.config.defaultProvider,
        model: options.model || this.config.defaultModel,
        tools,
        temperature: options.temperature,
        maxTokens: options.maxTokens
      });

      results.turns.push({
        turn,
        response: response.content,
        toolCalls: response.toolCalls,
        latency: response.latency
      });

      // No tool calls - we're done
      if (!response.toolCalls || response.toolCalls.length === 0) {
        results.finalResponse = response.content;
        this.emit('turn:complete', { conversationId, turn, final: true });
        break;
      }

      // Execute tool calls
      messages.push({
        role: 'assistant',
        content: response.content,
        tool_calls: response.toolCalls
      });

      for (const toolCall of response.toolCalls) {
        if (totalToolCalls >= this.config.maxToolCalls) {
          results.finalResponse = 'Max tool calls reached';
          break;
        }

        totalToolCalls++;
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        this.emit('tool:execute', { conversationId, turn, tool: toolName, args: toolArgs });

        try {
          const toolResult = await this.toolExecutor.execute(toolName, toolArgs);
          results.toolCalls.push({ tool: toolName, args: toolArgs, result: toolResult });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
        } catch (error) {
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: error.message })
          });
        }
      }

      this.emit('turn:complete', { conversationId, turn, final: false });
    }

    // Store conversation
    this.conversations.set(conversationId, { messages, results });

    // Collect artifacts from this run
    results.artifacts = this.artifacts.filter(a =>
      new Date(a.createdAt) > new Date(Date.now() - 60000)
    );

    this.emit('run:complete', results);
    return results;
  }

  /**
   * Stream a completion
   */
  async *stream(prompt, options = {}) {
    const messages = typeof prompt === 'string'
      ? [{ role: 'user', content: prompt }]
      : prompt;

    yield* this.providers.stream(messages, {
      provider: options.provider || this.config.defaultProvider,
      model: options.model || this.config.defaultModel,
      ...options
    });
  }

  /**
   * Continue a conversation
   */
  async continue(conversationId, userMessage, options = {}) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    conversation.messages.push({ role: 'user', content: userMessage });

    const response = await this.providers.complete(conversation.messages, {
      provider: options.provider || this.config.defaultProvider,
      model: options.model || this.config.defaultModel,
      ...options
    });

    conversation.messages.push({ role: 'assistant', content: response.content });
    return response;
  }

  /**
   * Register a custom tool
   */
  registerTool(name, definition, handler) {
    this.toolExecutor.registerTool(name, definition, handler);
    CORE_TOOLS[name] = definition;
  }

  getMetrics() {
    return {
      providers: this.providers.getMetrics(),
      conversations: this.conversations.size,
      artifacts: this.artifacts.length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  AIEngine,
  ToolExecutor,
  CORE_TOOLS
};
