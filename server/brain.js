/**
 * 0RB BRAIN SERVER - LOCAL XEON DEPLOYMENT
 * ═══════════════════════════════════════════════════════════════════
 * The neural core that powers the entire system
 * Runs on local Xeon servers for maximum performance
 * ═══════════════════════════════════════════════════════════════════
 */

const http = require('http');
const { WebSocketServer } = require('ws');
const url = require('url');

// Load the 0RB System
const OrbSystem = require('../system');

// Configuration
const PORT = process.env.BRAIN_PORT || 8420;
const WS_PORT = process.env.WS_PORT || 8421;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',');
const AUTH_TOKEN = process.env.BRAIN_AUTH_TOKEN || 'orb-brain-default-token';

class BrainServer {
  constructor() {
    this.systems = null;
    this.httpServer = null;
    this.wsServer = null;
    this.clients = new Map();
    this.taskQueue = [];
    this.results = new Map();
  }

  async initialize() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    0RB BRAIN SERVER                               ║
║                 "The Neural Core Awakens"                         ║
╠═══════════════════════════════════════════════════════════════════╣
║  HTTP API:    http://0.0.0.0:${PORT}                              ║
║  WebSocket:   ws://0.0.0.0:${WS_PORT}                             ║
╚═══════════════════════════════════════════════════════════════════╝
    `);

    // Initialize 0RB System
    console.log('Initializing 0RB System...');
    this.systems = await OrbSystem.initializeSystem({
      agentsConfig: { mode: 'production' },
      sdkConfig: { mode: 'production' }
    });

    // Load ARC solver
    try {
      this.arcSolver = require('../system/arc/InfiniteReasoner');
      console.log('✓ ARC Solver loaded');
    } catch (e) {
      console.log('⚠ ARC Solver not available');
    }

    // Initialize VFlow Voice-First System
    try {
      const { createVFlowSystem, PRESETS } = require('../system/VFlowSystem');
      this.vflow = createVFlowSystem(PRESETS.balanced);

      // Wire VFlow events to WebSocket broadcasts
      this.vflow.on('hud:update', (snapshot) => {
        this.broadcast('vflow:hud', snapshot);
      });
      this.vflow.on('state:change', (change) => {
        this.broadcast('vflow:state', change);
      });
      this.vflow.on('verified', (result) => {
        this.broadcast('vflow:verified', result);
      });

      console.log('✓ VFlow Voice-First System loaded');
    } catch (e) {
      console.log('⚠ VFlow not available:', e.message);
    }

    // Start servers
    await this.startHttpServer();
    await this.startWebSocketServer();

    console.log('\n BRAIN SERVER ONLINE\n');
  }

  async startHttpServer() {
    this.httpServer = http.createServer((req, res) => {
      // CORS
      const origin = req.headers.origin;
      if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Auth check
      const authHeader = req.headers.authorization;
      if (authHeader !== `Bearer ${AUTH_TOKEN}`) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      this.handleRequest(req, res);
    });

    return new Promise((resolve) => {
      this.httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`HTTP Server listening on port ${PORT}`);
        resolve();
      });
    });
  }

  async startWebSocketServer() {
    this.wsServer = new WebSocketServer({ port: WS_PORT });

    this.wsServer.on('connection', (ws, req) => {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      this.clients.set(clientId, ws);

      console.log(`Client connected: ${clientId}`);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(clientId, message, ws);
        } catch (e) {
          ws.send(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
      });

      // Send welcome
      ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        version: OrbSystem.VERSION,
        systems: Object.keys(this.systems).filter(k => this.systems[k])
      }));
    });

    console.log(`WebSocket Server listening on port ${WS_PORT}`);
  }

  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;

    try {
      let body = '';
      if (req.method === 'POST') {
        body = await new Promise((resolve) => {
          let data = '';
          req.on('data', chunk => data += chunk);
          req.on('end', () => resolve(data));
        });
      }

      const result = await this.routeRequest(path, req.method, body ? JSON.parse(body) : {}, parsedUrl.query);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  async routeRequest(path, method, body, query) {
    // Status endpoint
    if (path === '/status' || path === '/') {
      return {
        status: 'online',
        version: OrbSystem.VERSION,
        codename: OrbSystem.CODENAME,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        systems: {
          agents: !!this.systems.agents,
          copa: !!this.systems.copa,
          games: !!this.systems.games,
          quantum: !!this.systems.quantum,
          nexus: !!this.systems.nexus,
          genesis: !!this.systems.genesis,
          governance: !!this.systems.governance,
          vflow: !!this.vflow,
          arc: !!this.arcSolver
        }
      };
    }

    // Agent endpoints
    if (path.startsWith('/agents')) {
      return this.handleAgentRequest(path, method, body);
    }

    // Chat/AI endpoint
    if (path === '/chat') {
      return this.handleChatRequest(body);
    }

    // ARC solver endpoint
    if (path === '/arc/solve') {
      return this.handleArcRequest(body);
    }

    // Game endpoints
    if (path.startsWith('/games')) {
      return this.handleGameRequest(path, method, body);
    }

    // Quantum endpoints
    if (path.startsWith('/quantum')) {
      return this.handleQuantumRequest(path, method, body);
    }

    // Genesis endpoints
    if (path.startsWith('/genesis')) {
      return this.handleGenesisRequest(path, method, body);
    }

    // Copa endpoints
    if (path.startsWith('/copa')) {
      return this.handleCopaRequest(path, method, body);
    }

    // VFlow Voice-First endpoints
    if (path.startsWith('/vflow')) {
      return this.handleVFlowRequest(path, method, body);
    }

    return { error: 'Unknown endpoint', path };
  }

  async handleVFlowRequest(path, method, body) {
    if (!this.vflow) {
      return { error: 'VFlow system not initialized' };
    }

    // Voice input - primary interface
    if (path === '/vflow/voice' && method === 'POST') {
      const { input } = body;
      const result = this.vflow.voice(input);
      return { success: true, result, hud: this.vflow.getHUD() };
    }

    // Get current HUD state
    if (path === '/vflow/hud' && method === 'GET') {
      return { hud: this.vflow.getHUD() };
    }

    // Get Atlas visualization
    if (path === '/vflow/atlas' && method === 'GET') {
      return { atlas: this.vflow.getAtlasVisualization() };
    }

    // Get full system snapshot
    if (path === '/vflow/snapshot' && method === 'GET') {
      return { snapshot: this.vflow.getSnapshot() };
    }

    // Solve a problem
    if (path === '/vflow/solve' && method === 'POST') {
      const result = await this.vflow.solve(body.problem);
      return { success: true, result };
    }

    // Control endpoints
    if (path === '/vflow/pause' && method === 'POST') {
      const result = this.vflow.pause();
      return { success: true, paused: result };
    }

    if (path === '/vflow/resume' && method === 'POST') {
      const result = this.vflow.resume();
      return { success: true, resumed: result };
    }

    if (path === '/vflow/stop' && method === 'POST') {
      const result = this.vflow.stop();
      return { success: true, stopped: result };
    }

    if (path === '/vflow/reset' && method === 'POST') {
      const result = this.vflow.reset();
      return { success: true, reset: result };
    }

    // Configuration
    if (path === '/vflow/configure' && method === 'POST') {
      const config = this.vflow.configure(body);
      return { success: true, config };
    }

    // Metrics/telemetry
    if (path === '/vflow/metrics' && method === 'GET') {
      return { metrics: this.vflow.getMetrics() };
    }

    if (path === '/vflow/timeline' && method === 'GET') {
      return { timeline: this.vflow.getTimeline(body?.limit || 100) };
    }

    return { error: 'Unknown VFlow endpoint', path };
  }

  async handleAgentRequest(path, method, body) {
    if (!this.systems.agents) {
      return { error: 'Agent system not initialized' };
    }

    if (path === '/agents' && method === 'GET') {
      return { agents: this.systems.agents.listAgents?.() || [] };
    }

    if (path === '/agents/create' && method === 'POST') {
      const agent = await this.systems.agents.createAgent?.(body);
      return { success: true, agent };
    }

    if (path === '/agents/task' && method === 'POST') {
      const result = await this.systems.agents.assignTask?.(body.agentId, body.task);
      return { success: true, result };
    }

    return { error: 'Unknown agent endpoint' };
  }

  async handleChatRequest(body) {
    if (!this.systems.neural) {
      return { error: 'Neural system not initialized' };
    }

    const { message, context, model } = body;
    const response = await this.systems.neural.route?.(message, { context, model });
    return { response };
  }

  async handleArcRequest(body) {
    if (!this.arcSolver) {
      return { error: 'ARC solver not loaded' };
    }

    const { task, mode } = body;
    const reasoner = new this.arcSolver({ solveMode: mode || 'benchmark' });
    const result = reasoner.solve(task);
    return result;
  }

  async handleGameRequest(path, method, body) {
    if (!this.systems.games) {
      return { error: 'Game system not initialized' };
    }

    if (path === '/games' && method === 'GET') {
      return {
        games: ['architect', 'oracle', 'pantheon', 'forge', 'empire', 'echo', 'infinite']
      };
    }

    if (path === '/games/launch' && method === 'POST') {
      const { game } = body;
      const engine = this.systems.games[game];
      if (!engine) return { error: `Unknown game: ${game}` };
      return { success: true, gameId: `${game}_${Date.now()}` };
    }

    return { error: 'Unknown game endpoint' };
  }

  async handleQuantumRequest(path, method, body) {
    if (!this.systems.quantum) {
      return { error: 'Quantum system not initialized' };
    }

    if (path === '/quantum/optimize' && method === 'POST') {
      const result = await this.systems.quantum.optimize?.(body);
      return { success: true, result };
    }

    if (path === '/quantum/decide' && method === 'POST') {
      const result = await this.systems.quantum.quantumDecide?.(body.options, body.context);
      return { success: true, result };
    }

    return { error: 'Unknown quantum endpoint' };
  }

  async handleGenesisRequest(path, method, body) {
    if (!this.systems.genesis) {
      return { error: 'Genesis system not initialized' };
    }

    if (path === '/genesis/create' && method === 'POST') {
      const result = await this.systems.genesis.createFromIntent?.(body.intent);
      return { success: true, result };
    }

    if (path === '/genesis/blueprints' && method === 'GET') {
      return { blueprints: this.systems.genesis.listBlueprints?.() || [] };
    }

    return { error: 'Unknown genesis endpoint' };
  }

  async handleCopaRequest(path, method, body) {
    if (!this.systems.copa) {
      return { error: 'Copa system not initialized' };
    }

    if (path === '/copa/simulate' && method === 'POST') {
      const result = await this.systems.copa.runSimulation?.(body);
      return { success: true, result };
    }

    if (path === '/copa/industries' && method === 'GET') {
      return { industries: this.systems.copa.getIndustries?.() || [] };
    }

    return { error: 'Unknown copa endpoint' };
  }

  handleWebSocketMessage(clientId, message, ws) {
    const { type, payload } = message;

    switch (type) {
      case 'subscribe':
        // Subscribe to system events
        ws.subscriptions = ws.subscriptions || new Set();
        ws.subscriptions.add(payload.channel);
        ws.send(JSON.stringify({ type: 'subscribed', channel: payload.channel }));
        break;

      case 'task':
        // Queue a task
        const taskId = `task_${Date.now()}`;
        this.taskQueue.push({ taskId, clientId, payload });
        this.processTask(taskId, payload).then(result => {
          ws.send(JSON.stringify({ type: 'task_result', taskId, result }));
        });
        ws.send(JSON.stringify({ type: 'task_queued', taskId }));
        break;

      case 'stream':
        // Start streaming response
        this.handleStreamRequest(clientId, payload, ws);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${type}` }));
    }
  }

  async processTask(taskId, payload) {
    // Route task to appropriate system
    const { system, action, data } = payload;

    switch (system) {
      case 'agent':
        return this.handleAgentRequest(`/agents/${action}`, 'POST', data);
      case 'quantum':
        return this.handleQuantumRequest(`/quantum/${action}`, 'POST', data);
      case 'genesis':
        return this.handleGenesisRequest(`/genesis/${action}`, 'POST', data);
      default:
        return { error: `Unknown system: ${system}` };
    }
  }

  async handleStreamRequest(clientId, payload, ws) {
    // For streaming AI responses
    const { message, context } = payload;

    ws.send(JSON.stringify({ type: 'stream_start' }));

    // Simulate streaming (replace with actual streaming implementation)
    const words = `Processing: ${message}`.split(' ');
    for (const word of words) {
      ws.send(JSON.stringify({ type: 'stream_chunk', content: word + ' ' }));
      await new Promise(r => setTimeout(r, 100));
    }

    ws.send(JSON.stringify({ type: 'stream_end' }));
  }

  broadcast(channel, data) {
    this.clients.forEach((ws, clientId) => {
      if (ws.subscriptions?.has(channel)) {
        ws.send(JSON.stringify({ type: 'broadcast', channel, data }));
      }
    });
  }
}

// Start the server
const brain = new BrainServer();
brain.initialize().catch(console.error);

module.exports = BrainServer;
