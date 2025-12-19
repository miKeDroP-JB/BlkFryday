/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║    █████╗ ██████╗ ██╗    ███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗ ║
 * ║   ██╔══██╗██╔══██╗██║    ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗║
 * ║   ███████║██████╔╝██║    ███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝║
 * ║   ██╔══██║██╔═══╝ ██║    ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗║
 * ║   ██║  ██║██║     ██║    ███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║║
 * ║   ╚═╝  ╚═╝╚═╝     ╚═╝    ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝║
 * ║                                                                           ║
 * ║   0RB API SERVER - Remote access to the system                            ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node server/index.js           # Start server on default port
 *   PORT=8080 node server/index.js # Start on custom port
 *
 * Endpoints:
 *   GET  /health              - Health check
 *   GET  /status              - System status
 *   POST /memory/remember     - Store memory
 *   POST /memory/recall       - Recall memory by key
 *   POST /memory/search       - Semantic search
 *   POST /agent/run           - Run an agent task
 *   POST /ai/chat             - Chat with AI
 *   GET  /security/status     - HYDRA status
 *   POST /security/scan       - Security scan
 */

const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  apiKey: process.env.ORB_API_KEY || null,
  corsOrigins: (process.env.CORS_ORIGINS || '*').split(','),
  rateLimit: {
    windowMs: 60000,  // 1 minute
    maxRequests: 100
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════

const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - CONFIG.rateLimit.windowMs;

  let record = rateLimitStore.get(ip);
  if (!record || record.windowStart < windowStart) {
    record = { windowStart: now, count: 0 };
  }

  record.count++;
  rateLimitStore.set(ip, record);

  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    for (const [key, val] of rateLimitStore) {
      if (val.windowStart < windowStart) {
        rateLimitStore.delete(key);
      }
    }
  }

  return record.count <= CONFIG.rateLimit.maxRequests;
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CONFIG.corsOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
  });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  sendJSON(res, status, { error: message, status });
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.socket.remoteAddress ||
         'unknown';
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════

function authenticate(req) {
  if (!CONFIG.apiKey) return true; // No auth required

  const authHeader = req.headers['authorization'];
  const apiKeyHeader = req.headers['x-api-key'];

  if (apiKeyHeader === CONFIG.apiKey) return true;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token === CONFIG.apiKey) return true;
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// API SERVER
// ═══════════════════════════════════════════════════════════════════════════

class APIServer {
  constructor() {
    this.orb = null;
    this.server = null;
    this.routes = new Map();
    this.startTime = Date.now();
    this.requestCount = 0;

    this._setupRoutes();
  }

  _setupRoutes() {
    // Health & Status
    this.route('GET', '/health', this.handleHealth.bind(this));
    this.route('GET', '/status', this.handleStatus.bind(this));
    this.route('GET', '/metrics', this.handleMetrics.bind(this));

    // Memory
    this.route('POST', '/memory/remember', this.handleRemember.bind(this));
    this.route('POST', '/memory/recall', this.handleRecall.bind(this));
    this.route('POST', '/memory/search', this.handleSearch.bind(this));
    this.route('GET', '/memory/stats', this.handleMemoryStats.bind(this));

    // AI
    this.route('POST', '/ai/chat', this.handleChat.bind(this));
    this.route('POST', '/ai/embed', this.handleEmbed.bind(this));

    // Agents
    this.route('POST', '/agent/run', this.handleAgentRun.bind(this));
    this.route('GET', '/agent/archetypes', this.handleArchetypes.bind(this));

    // Security
    this.route('GET', '/security/status', this.handleSecurityStatus.bind(this));
    this.route('POST', '/security/scan', this.handleSecurityScan.bind(this));

    // Factory
    this.route('POST', '/factory/create', this.handleFactoryCreate.bind(this));
    this.route('GET', '/factory/blueprints', this.handleBlueprints.bind(this));
  }

  route(method, path, handler) {
    this.routes.set(`${method}:${path}`, handler);
  }

  async initialize() {
    console.log('\n⟡ 0RB API Server Initializing...\n');

    // Load core system
    try {
      const { createORB } = require('../core');
      this.orb = await createORB({
        quiet: true
      });
      console.log('  ✓ Core system loaded');
    } catch (error) {
      console.error('  ✗ Failed to load core:', error.message);
      // Continue without core - some endpoints will fail gracefully
    }

    // Create HTTP server
    this.server = http.createServer(this._handleRequest.bind(this));

    return this;
  }

  async _handleRequest(req, res) {
    const startTime = Date.now();
    const clientIP = getClientIP(req);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      sendJSON(res, 200, { ok: true });
      return;
    }

    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      sendError(res, 429, 'Rate limit exceeded');
      return;
    }

    // Authentication
    if (!authenticate(req)) {
      sendError(res, 401, 'Unauthorized');
      return;
    }

    // Parse URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const routeKey = `${req.method}:${path}`;

    // Find handler
    const handler = this.routes.get(routeKey);

    if (!handler) {
      sendError(res, 404, `Not found: ${path}`);
      return;
    }

    // Execute handler
    try {
      this.requestCount++;
      const body = req.method === 'POST' ? await parseBody(req) : {};
      const query = Object.fromEntries(url.searchParams);

      const result = await handler({ body, query, req, res });

      const duration = Date.now() - startTime;
      console.log(`  ${req.method} ${path} - ${res.statusCode || 200} (${duration}ms)`);

      if (!res.writableEnded) {
        sendJSON(res, 200, { success: true, data: result });
      }
    } catch (error) {
      console.error(`  ✗ ${req.method} ${path} - Error:`, error.message);
      sendError(res, 500, error.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  async handleHealth() {
    return {
      status: 'healthy',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString()
    };
  }

  async handleStatus() {
    if (!this.orb) {
      return { error: 'Core not initialized', partial: true };
    }
    return this.orb.getStatus();
  }

  async handleMetrics() {
    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      requests: this.requestCount,
      memory: process.memoryUsage(),
      orbStatus: this.orb?.getStatus() || null
    };
  }

  async handleRemember({ body }) {
    if (!this.orb) throw new Error('Core not initialized');

    const { key, value, type, tags } = body;
    if (!key || !value) throw new Error('key and value required');

    await this.orb.remember(key, value, { type, tags });
    return { stored: key };
  }

  async handleRecall({ body }) {
    if (!this.orb) throw new Error('Core not initialized');

    const { key } = body;
    if (!key) throw new Error('key required');

    const value = await this.orb.recall(key);
    return { key, value };
  }

  async handleSearch({ body }) {
    if (!this.orb) throw new Error('Core not initialized');

    const { query, limit = 5, threshold = 0.5 } = body;
    if (!query) throw new Error('query required');

    const results = await this.orb.search(query, limit, threshold);
    return { query, results };
  }

  async handleMemoryStats() {
    if (!this.orb?.memory) throw new Error('Memory not initialized');
    return this.orb.memory.getStats();
  }

  async handleChat({ body }) {
    if (!this.orb?.ai) throw new Error('AI not initialized');

    const { message, model, temperature } = body;
    if (!message) throw new Error('message required');

    const response = await this.orb.ai.chat([
      { role: 'user', content: message }
    ], { model, temperature });

    return { response };
  }

  async handleEmbed({ body }) {
    if (!this.orb?.embedder) throw new Error('Embedder not initialized');

    const { text } = body;
    if (!text) throw new Error('text required');

    const embedding = await this.orb.embedder.embed(text);
    return {
      text,
      dimensions: embedding.length,
      embedding: embedding.slice(0, 10) // Return first 10 for preview
    };
  }

  async handleAgentRun({ body }) {
    if (!this.orb) throw new Error('Core not initialized');

    const { archetype, task, context } = body;
    if (!archetype || !task) throw new Error('archetype and task required');

    const result = await this.orb.runAgent(archetype, task, context);
    return result;
  }

  async handleArchetypes() {
    const { AGENT_ARCHETYPES } = require('../core');
    return Object.entries(AGENT_ARCHETYPES).map(([key, val]) => ({
      id: key,
      name: val.name,
      title: val.title,
      domain: val.domain,
      tools: val.tools
    }));
  }

  async handleSecurityStatus() {
    if (!this.orb?.security) throw new Error('Security not initialized');
    return this.orb.security.getStatus();
  }

  async handleSecurityScan({ body }) {
    if (!this.orb?.security) throw new Error('Security not initialized');

    const { input, type = 'prompt' } = body;
    if (!input) throw new Error('input required');

    const result = type === 'code'
      ? this.orb.security.scanCode(input)
      : this.orb.security.analyzePrompt(input);

    return result;
  }

  async handleFactoryCreate({ body }) {
    if (!this.orb?.factory) throw new Error('Factory not initialized');

    const { blueprint, name, config } = body;
    if (!blueprint) throw new Error('blueprint required');

    const company = await this.orb.factory.createCompany(blueprint, {
      name,
      ...config
    });

    return {
      id: company.id,
      name: company.name,
      blueprint: company.config.blueprint,
      status: company.status
    };
  }

  async handleBlueprints() {
    const { COMPANY_BLUEPRINTS } = require('../core');
    return Object.entries(COMPANY_BLUEPRINTS).map(([key, val]) => ({
      id: key,
      name: val.name,
      description: val.description,
      requiredAgents: val.requiredAgents
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVER LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  async start() {
    return new Promise((resolve) => {
      this.server.listen(CONFIG.port, CONFIG.host, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ⟡ 0RB API SERVER RUNNING                                                ║
║                                                                           ║
║   URL: http://${CONFIG.host}:${CONFIG.port.toString().padEnd(50)}║
║   Auth: ${(CONFIG.apiKey ? 'API Key required' : 'No authentication').padEnd(56)}║
║                                                                           ║
║   Endpoints:                                                              ║
║     GET  /health              Health check                                ║
║     GET  /status              System status                               ║
║     POST /memory/remember     Store memory                                ║
║     POST /memory/search       Semantic search                             ║
║     POST /ai/chat             Chat with AI                                ║
║     POST /agent/run           Run agent task                              ║
║     GET  /security/status     HYDRA status                                ║
║                                                                           ║
║   Press Ctrl+C to stop                                                    ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
        resolve(this);
      });
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.orb) {
        this.orb.shutdown();
      }
      this.server.close(() => {
        console.log('\n⟡ Server stopped');
        resolve();
      });
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const server = new APIServer();
  await server.initialize();
  await server.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n⟡ Shutting down...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
  });
}

// Export for testing
module.exports = { APIServer, CONFIG };

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
