/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ███████╗███╗   ███╗██████╗ ███████╗██████╗ ██████╗ ██╗███╗   ██╗ ██████╗║
 * ║   ██╔════╝████╗ ████║██╔══██╗██╔════╝██╔══██╗██╔══██╗██║████╗  ██║██╔════╝║
 * ║   █████╗  ██╔████╔██║██████╔╝█████╗  ██║  ██║██║  ██║██║██╔██╗ ██║██║  ███║
 * ║   ██╔══╝  ██║╚██╔╝██║██╔══██╗██╔══╝  ██║  ██║██║  ██║██║██║╚██╗██║██║   ██║
 * ║   ███████╗██║ ╚═╝ ██║██████╔╝███████╗██████╔╝██████╔╝██║██║ ╚████║╚██████╔╝║
 * ║   ╚══════╝╚═╝     ╚═╝╚═════╝ ╚══════╝╚═════╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝║
 * ║                                                                           ║
 * ║   EMBEDDING PROVIDERS - Vector representations for semantic search        ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// EMBEDDING CACHE
// ═══════════════════════════════════════════════════════════════════════════

class EmbeddingCache {
  constructor(maxSize = 10000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  _hash(text) {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  get(text) {
    const hash = this._hash(text);
    const entry = this.cache.get(hash);
    if (entry) {
      entry.lastAccess = Date.now();
      return entry.embedding;
    }
    return null;
  }

  set(text, embedding) {
    const hash = this._hash(text);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      let oldest = null;
      let oldestTime = Infinity;
      for (const [key, value] of this.cache) {
        if (value.lastAccess < oldestTime) {
          oldest = key;
          oldestTime = value.lastAccess;
        }
      }
      if (oldest) this.cache.delete(oldest);
    }

    this.cache.set(hash, {
      embedding,
      lastAccess: Date.now()
    });
  }

  size() {
    return this.cache.size;
  }

  clear() {
    this.cache.clear();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BASE EMBEDDING PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

class BaseEmbeddingProvider {
  constructor(config = {}) {
    this.name = 'base';
    this.dimensions = config.dimensions || 1536;
    this.cache = new EmbeddingCache(config.cacheSize || 10000);
    this.stats = {
      requests: 0,
      cacheHits: 0,
      tokens: 0
    };
  }

  async embed(text) {
    throw new Error('embed() must be implemented by subclass');
  }

  async embedBatch(texts) {
    // Default: sequential embedding
    return Promise.all(texts.map(t => this.embed(t)));
  }

  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size(),
      hitRate: this.stats.requests > 0
        ? (this.stats.cacheHits / this.stats.requests * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OPENAI EMBEDDING PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

class OpenAIEmbeddingProvider extends BaseEmbeddingProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'openai';
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.model = config.model || 'text-embedding-3-small';
    this.dimensions = config.dimensions || 1536;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  async embed(text) {
    this.stats.requests++;

    // Check cache first
    const cached = this.cache.get(text);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
        dimensions: this.dimensions
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI embedding failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    this.stats.tokens += data.usage?.total_tokens || 0;

    // Cache the result
    this.cache.set(text, embedding);

    return embedding;
  }

  async embedBatch(texts) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Check cache for all texts
    const results = new Array(texts.length);
    const uncached = [];
    const uncachedIndices = [];

    for (let i = 0; i < texts.length; i++) {
      this.stats.requests++;
      const cached = this.cache.get(texts[i]);
      if (cached) {
        this.stats.cacheHits++;
        results[i] = cached;
      } else {
        uncached.push(texts[i]);
        uncachedIndices.push(i);
      }
    }

    // Fetch uncached embeddings in batch
    if (uncached.length > 0) {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          input: uncached,
          dimensions: this.dimensions
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`OpenAI batch embedding failed: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      this.stats.tokens += data.usage?.total_tokens || 0;

      // Map results back and cache
      for (let i = 0; i < data.data.length; i++) {
        const embedding = data.data[i].embedding;
        const originalIndex = uncachedIndices[i];
        results[originalIndex] = embedding;
        this.cache.set(texts[originalIndex], embedding);
      }
    }

    return results;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OLLAMA EMBEDDING PROVIDER (Local)
// ═══════════════════════════════════════════════════════════════════════════

class OllamaEmbeddingProvider extends BaseEmbeddingProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'ollama';
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'nomic-embed-text';
    this.dimensions = config.dimensions || 768;
  }

  async embed(text) {
    this.stats.requests++;

    // Check cache first
    const cached = this.cache.get(text);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        prompt: text
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding failed: ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.embedding;

    // Cache the result
    this.cache.set(text, embedding);

    return embedding;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SIMPLE LOCAL EMBEDDING (TF-IDF style, no external API)
// ═══════════════════════════════════════════════════════════════════════════

class LocalEmbeddingProvider extends BaseEmbeddingProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'local';
    this.dimensions = config.dimensions || 384;
    this.vocabulary = new Map();
    this.idf = new Map();
    this.documentCount = 0;
  }

  _tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  _updateVocabulary(tokens) {
    const seen = new Set();
    for (const token of tokens) {
      if (!this.vocabulary.has(token)) {
        this.vocabulary.set(token, this.vocabulary.size % this.dimensions);
      }
      if (!seen.has(token)) {
        seen.add(token);
        this.idf.set(token, (this.idf.get(token) || 0) + 1);
      }
    }
    this.documentCount++;
  }

  async embed(text) {
    this.stats.requests++;

    // Check cache first
    const cached = this.cache.get(text);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    const tokens = this._tokenize(text);
    this._updateVocabulary(tokens);

    // Create TF-IDF vector
    const vector = new Array(this.dimensions).fill(0);
    const tf = new Map();

    // Calculate term frequency
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    // Apply TF-IDF
    for (const [token, count] of tf) {
      const idx = this.vocabulary.get(token);
      if (idx !== undefined) {
        const termFreq = count / tokens.length;
        const docFreq = this.idf.get(token) || 1;
        const idf = Math.log(this.documentCount / docFreq + 1);
        vector[idx] += termFreq * idf;
      }
    }

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }

    // Cache the result
    this.cache.set(text, vector);

    return vector;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EMBEDDING REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

class EmbeddingRegistry {
  constructor() {
    this.providers = new Map();
    this.defaultProvider = null;
  }

  register(name, provider) {
    this.providers.set(name, provider);
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
  }

  get(name) {
    return this.providers.get(name || this.defaultProvider);
  }

  setDefault(name) {
    if (this.providers.has(name)) {
      this.defaultProvider = name;
    }
  }

  /**
   * Auto-register providers from environment
   */
  registerFromEnv() {
    // Always register local as fallback
    this.register('local', new LocalEmbeddingProvider());

    // OpenAI if key available
    if (process.env.OPENAI_API_KEY) {
      this.register('openai', new OpenAIEmbeddingProvider());
      this.setDefault('openai');
    }

    // Ollama if configured
    if (process.env.OLLAMA_HOST || process.env.USE_OLLAMA) {
      this.register('ollama', new OllamaEmbeddingProvider({
        baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434'
      }));
    }

    return this;
  }

  list() {
    return Array.from(this.providers.keys());
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

function createEmbeddingProvider(type = 'auto', config = {}) {
  switch (type) {
    case 'openai':
      return new OpenAIEmbeddingProvider(config);
    case 'ollama':
      return new OllamaEmbeddingProvider(config);
    case 'local':
      return new LocalEmbeddingProvider(config);
    case 'auto':
      // Auto-select best available
      if (process.env.OPENAI_API_KEY) {
        return new OpenAIEmbeddingProvider(config);
      } else if (process.env.OLLAMA_HOST) {
        return new OllamaEmbeddingProvider(config);
      } else {
        return new LocalEmbeddingProvider(config);
      }
    default:
      throw new Error(`Unknown embedding provider: ${type}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  BaseEmbeddingProvider,
  OpenAIEmbeddingProvider,
  OllamaEmbeddingProvider,
  LocalEmbeddingProvider,
  EmbeddingRegistry,
  EmbeddingCache,
  createEmbeddingProvider
};
