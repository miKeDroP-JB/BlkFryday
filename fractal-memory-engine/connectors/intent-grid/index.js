/**
 * INTENT GRID ADAPTER - Bridges SwarmOrchestrator to Fractal Memory Engine
 *
 * Standard API contract:
 * - POST /trigger - Execute intent routing
 * - GET /status - Get current state
 * - POST /feedback - Feed results back
 * - GET /observe - Metrics stream
 */

const express = require('express');
const { EventEmitter } = require('events');
const WebSocket = require('ws');

// Import existing components
const SwarmOrchestrator = require('../../../system/agents/SwarmOrchestrator');
const NeuralRouter = require('../../../system/ai/NeuralRouter');

const app = express();
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════
// INTENT GRID SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class IntentGridService extends EventEmitter {
  constructor() {
    super();
    this.swarm = new SwarmOrchestrator();
    this.router = new NeuralRouter();
    this.activeIntents = new Map();
    this.metrics = {
      totalIntents: 0,
      successfulRoutes: 0,
      failedRoutes: 0,
      avgLatencyMs: 0
    };
  }

  /**
   * Route an intent through the grid
   */
  async routeIntent(intent) {
    const startTime = Date.now();
    const intentId = `int_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    this.activeIntents.set(intentId, {
      id: intentId,
      input: intent,
      status: 'routing',
      startedAt: new Date().toISOString()
    });

    this.metrics.totalIntents++;

    try {
      // Step 1: Parse intent into shards
      const shards = await this.parseIntentShards(intent);

      // Step 2: Route each shard to appropriate agent
      const routingPlan = await this.router.route({
        task: intent.message,
        context: intent.context,
        shards
      });

      // Step 3: Execute through swarm
      const pattern = this.selectSwarmPattern(routingPlan);
      const result = await this.swarm.execute({
        pattern,
        agents: routingPlan.agents,
        task: intent.message,
        context: intent.context
      });

      // Update metrics
      const latency = Date.now() - startTime;
      this.updateMetrics(latency, true);

      this.activeIntents.set(intentId, {
        ...this.activeIntents.get(intentId),
        status: 'completed',
        result,
        latencyMs: latency,
        completedAt: new Date().toISOString()
      });

      this.emit('intent:completed', { intentId, result, latency });

      return {
        intentId,
        status: 'completed',
        result,
        latencyMs: latency,
        routingPlan
      };

    } catch (error) {
      this.updateMetrics(Date.now() - startTime, false);

      this.activeIntents.set(intentId, {
        ...this.activeIntents.get(intentId),
        status: 'failed',
        error: error.message,
        completedAt: new Date().toISOString()
      });

      this.emit('intent:failed', { intentId, error: error.message });

      throw error;
    }
  }

  /**
   * Parse intent into micro-objectives (shards)
   */
  async parseIntentShards(intent) {
    const shards = [];
    const message = intent.message.toLowerCase();

    // Intent classification
    if (message.includes('create') || message.includes('build') || message.includes('make')) {
      shards.push({ type: 'creation', priority: 1 });
    }
    if (message.includes('analyze') || message.includes('review') || message.includes('check')) {
      shards.push({ type: 'analysis', priority: 2 });
    }
    if (message.includes('send') || message.includes('notify') || message.includes('share')) {
      shards.push({ type: 'communication', priority: 3 });
    }
    if (message.includes('remember') || message.includes('save') || message.includes('store')) {
      shards.push({ type: 'memory', priority: 2 });
    }
    if (message.includes('schedule') || message.includes('plan') || message.includes('remind')) {
      shards.push({ type: 'scheduling', priority: 2 });
    }

    // Default shard if none detected
    if (shards.length === 0) {
      shards.push({ type: 'general', priority: 3 });
    }

    return shards;
  }

  /**
   * Select swarm pattern based on routing plan
   */
  selectSwarmPattern(routingPlan) {
    const agentCount = routingPlan.agents?.length || 1;

    if (agentCount === 1) return 'CHAIN';
    if (routingPlan.requiresConsensus) return 'COUNCIL';
    if (routingPlan.parallel) return 'PARALLEL';
    if (routingPlan.complex) return 'HIVEMIND';

    return 'HIERARCHY';
  }

  updateMetrics(latency, success) {
    if (success) {
      this.metrics.successfulRoutes++;
    } else {
      this.metrics.failedRoutes++;
    }

    // Rolling average
    const total = this.metrics.successfulRoutes + this.metrics.failedRoutes;
    this.metrics.avgLatencyMs = (
      (this.metrics.avgLatencyMs * (total - 1) + latency) / total
    );
  }

  getStatus() {
    return {
      service: 'intent-grid',
      codename: 'THE SIGNAL HIGHWAY',
      status: 'operational',
      activeIntents: this.activeIntents.size,
      metrics: this.metrics
    };
  }

  getIntent(intentId) {
    return this.activeIntents.get(intentId);
  }
}

const intentGrid = new IntentGridService();

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'intent-grid',
    codename: 'THE SIGNAL HIGHWAY'
  });
});

// POST /trigger - Execute intent routing
app.post('/trigger', async (req, res) => {
  try {
    const intent = {
      message: req.body.message,
      userId: req.body.user_id,
      avatar: req.body.avatar,
      context: req.body.context || {},
      metadata: req.body.metadata || {}
    };

    const result = await intentGrid.routeIntent(intent);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /status - Get current state
app.get('/status', (req, res) => {
  res.json(intentGrid.getStatus());
});

// GET /status/:intentId - Get specific intent status
app.get('/status/:intentId', (req, res) => {
  const intent = intentGrid.getIntent(req.params.intentId);
  if (!intent) {
    return res.status(404).json({ error: 'Intent not found' });
  }
  res.json(intent);
});

// POST /feedback - Feed results back for learning
app.post('/feedback', async (req, res) => {
  const { intentId, feedback, outcome } = req.body;

  // Store feedback for learning
  intentGrid.emit('feedback', { intentId, feedback, outcome });

  res.json({ status: 'received', intentId });
});

// GET /observe - Metrics stream (SSE)
app.get('/observe', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendMetrics = () => {
    res.write(`data: ${JSON.stringify(intentGrid.getStatus())}\n\n`);
  };

  // Send initial state
  sendMetrics();

  // Send updates every 5 seconds
  const interval = setInterval(sendMetrics, 5000);

  // Listen for events
  const onComplete = (data) => {
    res.write(`event: intent:completed\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const onFailed = (data) => {
    res.write(`event: intent:failed\ndata: ${JSON.stringify(data)}\n\n`);
  };

  intentGrid.on('intent:completed', onComplete);
  intentGrid.on('intent:failed', onFailed);

  req.on('close', () => {
    clearInterval(interval);
    intentGrid.off('intent:completed', onComplete);
    intentGrid.off('intent:failed', onFailed);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET FOR REAL-TIME EVENTS
// ═══════════════════════════════════════════════════════════════════════════

const server = app.listen(8030, () => {
  console.log('═'.repeat(60));
  console.log('INTENT GRID - THE SIGNAL HIGHWAY');
  console.log('Multi-agent intent routing service');
  console.log('Listening on port 8030');
  console.log('═'.repeat(60));
});

const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  const onComplete = (data) => {
    ws.send(JSON.stringify({ event: 'intent:completed', data }));
  };
  const onFailed = (data) => {
    ws.send(JSON.stringify({ event: 'intent:failed', data }));
  };

  intentGrid.on('intent:completed', onComplete);
  intentGrid.on('intent:failed', onFailed);

  ws.on('close', () => {
    intentGrid.off('intent:completed', onComplete);
    intentGrid.off('intent:failed', onFailed);
  });
});

module.exports = { app, intentGrid, IntentGridService };
