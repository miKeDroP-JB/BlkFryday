/**
 * REAL-TIME STREAMING ENGINE
 * Stream AI responses as they're generated for instant perceived speed
 *
 * "First byte is worth a thousand waits" - Streaming Philosophy
 *
 * Features:
 * - Server-Sent Events (SSE) streaming
 * - Multi-model race streaming
 * - Progress indicators
 * - Chunk aggregation
 * - Error recovery
 */

// Stream event types
const STREAM_EVENTS = {
  START: 'start',
  CHUNK: 'chunk',
  PROGRESS: 'progress',
  COMPLETE: 'complete',
  ERROR: 'error',
  METADATA: 'metadata'
};

// Provider-specific streaming configurations
const STREAMING_CONFIG = {
  anthropic: {
    supportsStreaming: true,
    endpoint: 'https://api.anthropic.com/v1/messages',
    streamParam: 'stream',
    parseChunk: (chunk) => {
      if (chunk.type === 'content_block_delta') {
        return chunk.delta?.text || '';
      }
      return '';
    }
  },
  openai: {
    supportsStreaming: true,
    endpoint: 'https://api.openai.com/v1/chat/completions',
    streamParam: 'stream',
    parseChunk: (chunk) => {
      return chunk.choices?.[0]?.delta?.content || '';
    }
  },
  groq: {
    supportsStreaming: true,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    streamParam: 'stream',
    parseChunk: (chunk) => {
      return chunk.choices?.[0]?.delta?.content || '';
    }
  },
  mistral: {
    supportsStreaming: true,
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    streamParam: 'stream',
    parseChunk: (chunk) => {
      return chunk.choices?.[0]?.delta?.content || '';
    }
  },
  google: {
    supportsStreaming: true,
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    streamParam: 'alt=sse',
    parseChunk: (chunk) => {
      return chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  }
};

/**
 * Stream Chunk
 * Represents a single chunk of streamed content
 */
class StreamChunk {
  constructor(data) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.timestamp = Date.now();
    this.content = data.content || '';
    this.type = data.type || STREAM_EVENTS.CHUNK;
    this.provider = data.provider;
    this.model = data.model;
    this.metadata = data.metadata || {};
  }

  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      type: this.type,
      content: this.content,
      provider: this.provider,
      model: this.model,
      ...this.metadata
    };
  }

  toSSE() {
    return `event: ${this.type}\ndata: ${JSON.stringify(this.toJSON())}\n\n`;
  }
}

/**
 * Stream Aggregator
 * Collects and aggregates stream chunks
 */
class StreamAggregator {
  constructor() {
    this.chunks = [];
    this.fullContent = '';
    this.startTime = null;
    this.endTime = null;
    this.provider = null;
    this.model = null;
  }

  addChunk(chunk) {
    if (!this.startTime) {
      this.startTime = Date.now();
      this.provider = chunk.provider;
      this.model = chunk.model;
    }

    this.chunks.push(chunk);
    this.fullContent += chunk.content;
  }

  complete() {
    this.endTime = Date.now();
  }

  getResult() {
    return {
      success: true,
      content: this.fullContent,
      provider: this.provider,
      model: this.model,
      chunkCount: this.chunks.length,
      totalLatency: this.endTime ? this.endTime - this.startTime : Date.now() - this.startTime,
      firstChunkLatency: this.chunks.length > 0 ? this.chunks[0].timestamp - this.startTime : null,
      avgChunkSize: this.fullContent.length / this.chunks.length
    };
  }
}

/**
 * Streaming Client
 * Handles streaming from various AI providers
 */
class StreamingClient {
  constructor(apiKeys = {}) {
    this.apiKeys = {
      anthropic: apiKeys.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
      groq: apiKeys.GROQ_API_KEY || process.env.GROQ_API_KEY,
      openai: apiKeys.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      google: apiKeys.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY,
      mistral: apiKeys.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY
    };
  }

  /**
   * Stream from Anthropic
   */
  async *streamAnthropic(model, messages, options = {}) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKeys.anthropic,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens || 4096,
        stream: true,
        messages: messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role,
          content: m.content
        })),
        system: messages.find(m => m.role === 'system')?.content
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              yield new StreamChunk({
                content: parsed.delta?.text || '',
                type: STREAM_EVENTS.CHUNK,
                provider: 'anthropic',
                model
              });
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * Stream from OpenAI-compatible APIs (OpenAI, Groq, Mistral)
   */
  async *streamOpenAICompatible(provider, endpoint, model, messages, options = {}) {
    const apiKey = this.apiKeys[provider];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield new StreamChunk({
                content,
                type: STREAM_EVENTS.CHUNK,
                provider,
                model
              });
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * Stream from any supported provider
   */
  async *stream(provider, model, messages, options = {}) {
    yield new StreamChunk({
      type: STREAM_EVENTS.START,
      provider,
      model,
      metadata: { timestamp: Date.now() }
    });

    try {
      switch (provider) {
        case 'anthropic':
          yield* this.streamAnthropic(model, messages, options);
          break;
        case 'openai':
          yield* this.streamOpenAICompatible(provider, 'https://api.openai.com/v1/chat/completions', model, messages, options);
          break;
        case 'groq':
          yield* this.streamOpenAICompatible(provider, 'https://api.groq.com/openai/v1/chat/completions', model, messages, options);
          break;
        case 'mistral':
          yield* this.streamOpenAICompatible(provider, 'https://api.mistral.ai/v1/chat/completions', model, messages, options);
          break;
        default:
          throw new Error(`Streaming not supported for provider: ${provider}`);
      }

      yield new StreamChunk({
        type: STREAM_EVENTS.COMPLETE,
        provider,
        model,
        metadata: { timestamp: Date.now() }
      });
    } catch (error) {
      yield new StreamChunk({
        type: STREAM_EVENTS.ERROR,
        provider,
        model,
        content: error.message,
        metadata: { timestamp: Date.now() }
      });
    }
  }

  /**
   * Stream with aggregation
   */
  async streamWithAggregation(provider, model, messages, options = {}) {
    const aggregator = new StreamAggregator();

    for await (const chunk of this.stream(provider, model, messages, options)) {
      if (chunk.type === STREAM_EVENTS.CHUNK) {
        aggregator.addChunk(chunk);
      } else if (chunk.type === STREAM_EVENTS.COMPLETE) {
        aggregator.complete();
      }
    }

    return aggregator.getResult();
  }
}

/**
 * Multi-Model Stream Racer
 * Race multiple streams, emit from fastest
 */
class StreamRacer {
  constructor(config = {}) {
    this.client = new StreamingClient(config.apiKeys);
    this.models = config.models || [
      { provider: 'groq', model: 'llama-3.1-70b-versatile' },
      { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
      { provider: 'openai', model: 'gpt-4o' }
    ];
  }

  /**
   * Race multiple streams, use first one that starts producing
   */
  async *raceStreams(messages, options = {}) {
    const streams = this.models.map(m =>
      this.client.stream(m.provider, m.model, messages, options)
    );

    let winner = null;
    let winnerIndex = -1;
    const firstChunkPromises = streams.map(async (stream, index) => {
      const iterator = stream[Symbol.asyncIterator]();

      // Get start event
      await iterator.next();

      // Get first content chunk
      const firstChunk = await iterator.next();

      return { index, iterator, firstChunk };
    });

    // Race for first chunk
    const results = await Promise.race(
      firstChunkPromises.map((p, i) =>
        p.then(r => ({ ...r, originalIndex: i }))
      )
    );

    winner = results.iterator;
    winnerIndex = results.index;

    yield new StreamChunk({
      type: STREAM_EVENTS.METADATA,
      content: '',
      provider: this.models[winnerIndex].provider,
      model: this.models[winnerIndex].model,
      metadata: {
        event: 'race_winner',
        winnerModel: this.models[winnerIndex].model
      }
    });

    // Yield first chunk
    if (results.firstChunk.value) {
      yield results.firstChunk.value;
    }

    // Continue with winner stream
    while (true) {
      const { done, value } = await winner.next();
      if (done) break;
      yield value;
    }
  }

  /**
   * Race with callback for each chunk
   */
  async raceWithCallback(messages, onChunk, options = {}) {
    const aggregator = new StreamAggregator();

    for await (const chunk of this.raceStreams(messages, options)) {
      if (chunk.type === STREAM_EVENTS.CHUNK) {
        aggregator.addChunk(chunk);
        if (onChunk) onChunk(chunk);
      } else if (chunk.type === STREAM_EVENTS.COMPLETE) {
        aggregator.complete();
      }
    }

    return aggregator.getResult();
  }
}

/**
 * SSE Response Builder
 * Builds Server-Sent Events responses for HTTP streaming
 */
class SSEResponseBuilder {
  constructor() {
    this.encoder = new TextEncoder();
  }

  /**
   * Create a readable stream for SSE
   */
  createStream(asyncGenerator) {
    const encoder = this.encoder;

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of asyncGenerator) {
            controller.enqueue(encoder.encode(chunk.toSSE()));
          }
          controller.close();
        } catch (error) {
          const errorChunk = new StreamChunk({
            type: STREAM_EVENTS.ERROR,
            content: error.message
          });
          controller.enqueue(encoder.encode(errorChunk.toSSE()));
          controller.close();
        }
      }
    });
  }

  /**
   * Create SSE headers
   */
  getHeaders() {
    return {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    };
  }
}

/**
 * Progress Tracker
 * Tracks and emits progress updates during streaming
 */
class ProgressTracker {
  constructor(estimatedTokens = 1000) {
    this.estimatedTokens = estimatedTokens;
    this.receivedTokens = 0;
    this.startTime = Date.now();
  }

  update(chunkContent) {
    // Rough token estimate (4 chars per token)
    this.receivedTokens += Math.ceil(chunkContent.length / 4);
  }

  getProgress() {
    const progress = Math.min(100, (this.receivedTokens / this.estimatedTokens) * 100);
    const elapsed = Date.now() - this.startTime;
    const tokensPerSecond = this.receivedTokens / (elapsed / 1000);
    const estimatedRemaining = (this.estimatedTokens - this.receivedTokens) / tokensPerSecond;

    return {
      progress: Math.round(progress),
      receivedTokens: this.receivedTokens,
      estimatedTokens: this.estimatedTokens,
      elapsed,
      tokensPerSecond: Math.round(tokensPerSecond),
      estimatedRemaining: Math.round(estimatedRemaining * 1000)
    };
  }

  createProgressChunk() {
    return new StreamChunk({
      type: STREAM_EVENTS.PROGRESS,
      content: '',
      metadata: this.getProgress()
    });
  }
}

module.exports = {
  STREAM_EVENTS,
  STREAMING_CONFIG,
  StreamChunk,
  StreamAggregator,
  StreamingClient,
  StreamRacer,
  SSEResponseBuilder,
  ProgressTracker
};
