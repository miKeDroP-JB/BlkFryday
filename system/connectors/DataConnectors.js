// ============================================================
//  ORBOS V11.5 - DATA SOURCE CONNECTORS
//  Aggregate data from everywhere to feed the brain
// ============================================================
//
//  Sources: APIs, Databases, Files, Web, Cloud Storage
//  All data flows through ORBOS for learning and synthesis
//
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DataConnectors {
  constructor(config = {}) {
    this.config = config;
    this.cacheDir = config.cacheDir || path.join(__dirname, '../../data/connector-cache');
    this.ensureDirectories();

    // Registered connectors
    this.connectors = new Map();

    // Register built-in connectors
    this.registerBuiltInConnectors();

    // Connection pools
    this.pools = new Map();

    // Rate limiting per source
    this.rateLimits = new Map();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  registerBuiltInConnectors() {
    // REST API Connector
    this.register('rest', new RESTConnector(this.config));

    // GraphQL Connector
    this.register('graphql', new GraphQLConnector(this.config));

    // File System Connector
    this.register('filesystem', new FileSystemConnector(this.config));

    // Git Repository Connector
    this.register('git', new GitConnector(this.config));

    // Database Connectors
    this.register('postgres', new PostgresConnector(this.config));
    this.register('mongodb', new MongoDBConnector(this.config));
    this.register('redis', new RedisConnector(this.config));

    // Cloud Storage Connectors
    this.register('s3', new S3Connector(this.config));
    this.register('gcs', new GCSConnector(this.config));

    // Documentation Connectors
    this.register('swagger', new SwaggerConnector(this.config));
    this.register('openapi', new OpenAPIConnector(this.config));

    // Code Repository Connectors
    this.register('github', new GitHubConnector(this.config));
    this.register('gitlab', new GitLabConnector(this.config));

    // AI/ML Model Connectors
    this.register('huggingface', new HuggingFaceConnector(this.config));
    this.register('ollama', new OllamaConnector(this.config));
  }

  register(name, connector) {
    this.connectors.set(name, connector);
    console.log(`[DataConnectors] Registered: ${name}`);
  }

  get(name) {
    return this.connectors.get(name);
  }

  // ============================================================
  //  UNIFIED DATA FETCH
  // ============================================================

  async fetch(source, query, options = {}) {
    const connector = this.connectors.get(source);
    if (!connector) {
      throw new Error(`Unknown connector: ${source}`);
    }

    // Check rate limit
    if (!this.checkRateLimit(source)) {
      throw new Error(`Rate limit exceeded for ${source}`);
    }

    // Check cache
    const cacheKey = this.getCacheKey(source, query);
    const cached = this.getFromCache(cacheKey, options.maxAge);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // Fetch from source
    const result = await connector.fetch(query, options);

    // Cache result
    this.setCache(cacheKey, result);

    return { ...result, fromCache: false };
  }

  async fetchAll(queries) {
    // Execute multiple queries in parallel
    const results = await Promise.allSettled(
      queries.map(q => this.fetch(q.source, q.query, q.options))
    );

    return results.map((r, i) => ({
      query: queries[i],
      success: r.status === 'fulfilled',
      data: r.status === 'fulfilled' ? r.value : null,
      error: r.status === 'rejected' ? r.reason.message : null
    }));
  }

  // ============================================================
  //  STREAM DATA
  // ============================================================

  async *stream(source, query, options = {}) {
    const connector = this.connectors.get(source);
    if (!connector || !connector.stream) {
      throw new Error(`Streaming not supported for ${source}`);
    }

    for await (const chunk of connector.stream(query, options)) {
      yield chunk;
    }
  }

  // ============================================================
  //  CACHING
  // ============================================================

  getCacheKey(source, query) {
    const hash = crypto.createHash('md5')
      .update(`${source}:${JSON.stringify(query)}`)
      .digest('hex');
    return hash;
  }

  getFromCache(key, maxAge = 3600000) {
    const cachePath = path.join(this.cacheDir, `${key}.json`);

    if (!fs.existsSync(cachePath)) return null;

    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

    if (Date.now() - cached.timestamp > maxAge) {
      fs.unlinkSync(cachePath);
      return null;
    }

    return cached.data;
  }

  setCache(key, data) {
    const cachePath = path.join(this.cacheDir, `${key}.json`);

    fs.writeFileSync(cachePath, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  }

  clearCache() {
    const files = fs.readdirSync(this.cacheDir);
    files.forEach(f => fs.unlinkSync(path.join(this.cacheDir, f)));
  }

  // ============================================================
  //  RATE LIMITING
  // ============================================================

  checkRateLimit(source) {
    const now = Date.now();
    const window = 60000; // 1 minute
    const maxRequests = 100;

    let limits = this.rateLimits.get(source);
    if (!limits) {
      limits = { requests: [], blocked: false };
      this.rateLimits.set(source, limits);
    }

    // Clean old requests
    limits.requests = limits.requests.filter(t => t > now - window);

    if (limits.requests.length >= maxRequests) {
      return false;
    }

    limits.requests.push(now);
    return true;
  }

  // ============================================================
  //  STATUS
  // ============================================================

  getStatus() {
    const status = {};

    for (const [name, connector] of this.connectors) {
      status[name] = {
        available: connector.isAvailable?.() ?? true,
        type: connector.type || 'unknown',
        features: connector.features || []
      };
    }

    return status;
  }
}

// ============================================================
//  BASE CONNECTOR CLASS
// ============================================================

class BaseConnector {
  constructor(config = {}) {
    this.config = config;
    this.type = 'base';
    this.features = [];
  }

  async fetch(query, options = {}) {
    throw new Error('fetch() not implemented');
  }

  isAvailable() {
    return true;
  }
}

// ============================================================
//  REST API CONNECTOR
// ============================================================

class RESTConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 'rest';
    this.features = ['get', 'post', 'put', 'delete', 'pagination'];
  }

  async fetch(query, options = {}) {
    const { url, method = 'GET', headers = {}, body } = query;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`REST error: ${response.status}`);
    }

    const data = await response.json();

    return {
      source: 'rest',
      url,
      data,
      status: response.status,
      timestamp: Date.now()
    };
  }

  async *stream(query, options = {}) {
    // For paginated endpoints
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.fetch({
        ...query,
        url: `${query.url}?page=${page}`
      }, options);

      yield result;

      hasMore = result.data.length > 0 && page < (options.maxPages || 10);
      page++;
    }
  }
}

// ============================================================
//  GRAPHQL CONNECTOR
// ============================================================

class GraphQLConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 'graphql';
    this.features = ['query', 'mutation', 'subscription'];
  }

  async fetch(query, options = {}) {
    const { endpoint, graphqlQuery, variables = {} } = query;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables
      })
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return {
      source: 'graphql',
      endpoint,
      data: data.data,
      timestamp: Date.now()
    };
  }
}

// ============================================================
//  FILE SYSTEM CONNECTOR
// ============================================================

class FileSystemConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 'filesystem';
    this.features = ['read', 'write', 'list', 'watch'];
    this.basePath = config.basePath || process.cwd();
  }

  async fetch(query, options = {}) {
    const { path: filePath, action = 'read', pattern } = query;

    const fullPath = path.resolve(this.basePath, filePath);

    switch (action) {
      case 'read':
        if (!fs.existsSync(fullPath)) {
          throw new Error(`File not found: ${fullPath}`);
        }
        const content = fs.readFileSync(fullPath, 'utf8');
        return {
          source: 'filesystem',
          path: fullPath,
          content,
          size: content.length,
          timestamp: Date.now()
        };

      case 'list':
        const files = fs.readdirSync(fullPath, { withFileTypes: true });
        return {
          source: 'filesystem',
          path: fullPath,
          files: files.map(f => ({
            name: f.name,
            isDirectory: f.isDirectory(),
            path: path.join(fullPath, f.name)
          })),
          timestamp: Date.now()
        };

      case 'glob':
        // Simple glob implementation
        const matches = this.glob(fullPath, pattern);
        return {
          source: 'filesystem',
          pattern,
          matches,
          timestamp: Date.now()
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  glob(dir, pattern) {
    // Simplified glob matching
    const matches = [];
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory()) {
        matches.push(...this.glob(fullPath, pattern));
      } else if (this.matchPattern(file.name, pattern)) {
        matches.push(fullPath);
      }
    }

    return matches;
  }

  matchPattern(filename, pattern) {
    // Simple pattern matching (*.js, *.ts, etc.)
    if (!pattern) return true;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(filename);
  }
}

// ============================================================
//  GIT CONNECTOR
// ============================================================

class GitConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 'git';
    this.features = ['clone', 'pull', 'diff', 'log', 'blame'];
  }

  async fetch(query, options = {}) {
    const { action, repoPath } = query;

    // Git operations would use child_process.exec
    // Simulated for safety
    return {
      source: 'git',
      action,
      repoPath,
      result: `Git ${action} simulated`,
      timestamp: Date.now()
    };
  }
}

// ============================================================
//  DATABASE CONNECTORS (Simulated)
// ============================================================

class PostgresConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 'postgres';
    this.features = ['query', 'transaction', 'stream'];
  }

  async fetch(query, options = {}) {
    return {
      source: 'postgres',
      query: query.sql,
      rows: [],
      rowCount: 0,
      timestamp: Date.now()
    };
  }

  isAvailable() {
    return !!process.env.DATABASE_URL;
  }
}

class MongoDBConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 'mongodb';
    this.features = ['find', 'aggregate', 'watch'];
  }

  async fetch(query, options = {}) {
    return {
      source: 'mongodb',
      collection: query.collection,
      documents: [],
      count: 0,
      timestamp: Date.now()
    };
  }

  isAvailable() {
    return !!process.env.MONGODB_URI;
  }
}

class RedisConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 'redis';
    this.features = ['get', 'set', 'pub/sub', 'stream'];
  }

  async fetch(query, options = {}) {
    return {
      source: 'redis',
      key: query.key,
      value: null,
      timestamp: Date.now()
    };
  }

  isAvailable() {
    return !!process.env.REDIS_URL;
  }
}

// ============================================================
//  CLOUD STORAGE CONNECTORS (Simulated)
// ============================================================

class S3Connector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 's3';
    this.features = ['get', 'put', 'list', 'stream'];
  }

  async fetch(query, options = {}) {
    return {
      source: 's3',
      bucket: query.bucket,
      key: query.key,
      data: null,
      timestamp: Date.now()
    };
  }

  isAvailable() {
    return !!process.env.AWS_ACCESS_KEY_ID;
  }
}

class GCSConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 'gcs';
    this.features = ['get', 'put', 'list', 'stream'];
  }

  async fetch(query, options = {}) {
    return {
      source: 'gcs',
      bucket: query.bucket,
      object: query.object,
      data: null,
      timestamp: Date.now()
    };
  }

  isAvailable() {
    return !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
}

// ============================================================
//  DOCUMENTATION CONNECTORS
// ============================================================

class SwaggerConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 'swagger';
    this.features = ['parse', 'endpoints', 'schemas'];
  }

  async fetch(query, options = {}) {
    const { url } = query;

    const response = await fetch(url);
    const spec = await response.json();

    return {
      source: 'swagger',
      url,
      endpoints: this.extractEndpoints(spec),
      schemas: spec.definitions || spec.components?.schemas || {},
      timestamp: Date.now()
    };
  }

  extractEndpoints(spec) {
    const endpoints = [];
    const paths = spec.paths || {};

    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, details] of Object.entries(methods)) {
        endpoints.push({
          path,
          method: method.toUpperCase(),
          summary: details.summary,
          tags: details.tags || []
        });
      }
    }

    return endpoints;
  }
}

class OpenAPIConnector extends SwaggerConnector {
  constructor(config) {
    super(config);
    this.type = 'openapi';
  }
}

// ============================================================
//  CODE REPOSITORY CONNECTORS
// ============================================================

class GitHubConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 'github';
    this.features = ['repos', 'search', 'issues', 'prs', 'code'];
    this.baseUrl = 'https://api.github.com';
  }

  async fetch(query, options = {}) {
    const { action, owner, repo, path: filePath } = query;

    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    let url;
    switch (action) {
      case 'repo':
        url = `${this.baseUrl}/repos/${owner}/${repo}`;
        break;
      case 'contents':
        url = `${this.baseUrl}/repos/${owner}/${repo}/contents/${filePath || ''}`;
        break;
      case 'search':
        url = `${this.baseUrl}/search/code?q=${encodeURIComponent(query.q)}`;
        break;
      default:
        throw new Error(`Unknown GitHub action: ${action}`);
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return {
      source: 'github',
      action,
      data: await response.json(),
      timestamp: Date.now()
    };
  }

  isAvailable() {
    return true; // Works without token, just rate limited
  }
}

class GitLabConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 'gitlab';
    this.features = ['projects', 'search', 'issues', 'mrs'];
  }

  async fetch(query, options = {}) {
    return {
      source: 'gitlab',
      data: null,
      timestamp: Date.now()
    };
  }

  isAvailable() {
    return !!process.env.GITLAB_TOKEN;
  }
}

// ============================================================
//  AI/ML CONNECTORS
// ============================================================

class HuggingFaceConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 'huggingface';
    this.features = ['models', 'datasets', 'inference'];
    this.baseUrl = 'https://huggingface.co/api';
  }

  async fetch(query, options = {}) {
    const { action, model, input } = query;

    switch (action) {
      case 'models':
        const response = await fetch(`${this.baseUrl}/models?search=${query.search || ''}`);
        return {
          source: 'huggingface',
          models: await response.json(),
          timestamp: Date.now()
        };

      case 'inference':
        // Would need HF_TOKEN for inference API
        return {
          source: 'huggingface',
          model,
          result: 'Inference simulated',
          timestamp: Date.now()
        };

      default:
        throw new Error(`Unknown HuggingFace action: ${action}`);
    }
  }

  isAvailable() {
    return true;
  }
}

class OllamaConnector extends BaseConnector {
  constructor(config) {
    super(config);
    this.type = 'ollama';
    this.features = ['generate', 'chat', 'embeddings'];
    this.baseUrl = config.ollamaUrl || 'http://localhost:11434';
  }

  async fetch(query, options = {}) {
    const { action, model, prompt } = query;

    try {
      switch (action) {
        case 'generate':
          const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt, stream: false })
          });

          return {
            source: 'ollama',
            model,
            response: await response.json(),
            timestamp: Date.now()
          };

        case 'models':
          const models = await fetch(`${this.baseUrl}/api/tags`);
          return {
            source: 'ollama',
            models: await models.json(),
            timestamp: Date.now()
          };

        default:
          throw new Error(`Unknown Ollama action: ${action}`);
      }
    } catch (error) {
      throw new Error(`Ollama error: ${error.message}`);
    }
  }

  async isAvailable() {
    try {
      await fetch(`${this.baseUrl}/api/tags`);
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = {
  DataConnectors,
  BaseConnector,
  RESTConnector,
  GraphQLConnector,
  FileSystemConnector,
  GitConnector,
  GitHubConnector,
  HuggingFaceConnector,
  OllamaConnector
};
