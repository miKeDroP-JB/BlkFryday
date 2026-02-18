/**
 * UNIFIED GATEWAY - Single entry point for all Fractal Memory services
 *
 * Routes requests to appropriate services:
 * - /intent/* → Intent Grid (8030)
 * - /lexicon/* → Lexicon Engine (8031)
 * - /voice/* → Voice Loop (8032)
 * - /supervisor/* → Edge Supervisor (8033)
 * - /events/* → Event Bus (8040)
 * - /ritual/* → Ritual Engine (8020)
 * - /external/* → External Tether (8021)
 * - /orchestrate/* → Orchestrator (8000)
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8080',
    'https://0r8.ai',
    'https://app.0r8.ai',
    'https://play.0r8.ai'
  ],
  credentials: true
}));

app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

const SERVICES = {
  intent: { port: 8030, name: 'Intent Grid', codename: 'THE SIGNAL HIGHWAY' },
  lexicon: { port: 8031, name: 'Lexicon Engine', codename: 'THE LANGUAGE FORGE' },
  voice: { port: 8032, name: 'Voice Loop', codename: 'THE BREATH' },
  supervisor: { port: 8033, name: 'Edge Supervisor', codename: 'THE WATCHER' },
  events: { port: 8040, name: 'Event Bus', codename: 'THE NERVOUS SYSTEM' },
  ritual: { port: 8020, name: 'Ritual Engine', codename: 'THE HABIT LOOP' },
  external: { port: 8021, name: 'External Tether', codename: 'THE BRIDGES' },
  orchestrator: { port: 8000, name: 'Orchestrator', codename: 'THE CONDUCTOR' },
  capture: { port: 8001, name: 'Capture Service', codename: 'THE LISTENER' },
  process: { port: 8002, name: 'Process Service', codename: 'THE MIND' },
  surface: { port: 8003, name: 'Surface Service', codename: 'THE VOICE' },
  auth: { port: 8004, name: 'Auth Service', codename: 'THE GATES' }
};

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK & STATUS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'unified-gateway',
    codename: 'THE NEXUS',
    timestamp: new Date().toISOString()
  });
});

app.get('/status', async (req, res) => {
  const statuses = {};

  for (const [key, service] of Object.entries(SERVICES)) {
    try {
      const response = await fetch(`http://localhost:${service.port}/health`, {
        timeout: 2000
      });
      statuses[key] = {
        name: service.name,
        codename: service.codename,
        port: service.port,
        status: response.ok ? 'healthy' : 'unhealthy'
      };
    } catch (error) {
      statuses[key] = {
        name: service.name,
        codename: service.codename,
        port: service.port,
        status: 'unreachable'
      };
    }
  }

  const healthyCount = Object.values(statuses).filter(s => s.status === 'healthy').length;

  res.json({
    gateway: 'THE NEXUS',
    overall: healthyCount === Object.keys(SERVICES).length ? 'healthy' : 'degraded',
    healthy: healthyCount,
    total: Object.keys(SERVICES).length,
    services: statuses,
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED TRIGGER ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

app.post('/trigger', async (req, res) => {
  /**
   * Unified trigger that routes based on intent
   * Analyzes the request and dispatches to appropriate service
   */
  const { message, user_id, avatar, action, target } = req.body;

  // Determine target service based on action or content
  let targetService = 'orchestrator';

  if (action) {
    if (action === 'speak' || action === 'listen') targetService = 'voice';
    else if (action === 'ritual' || action === 'schedule') targetService = 'ritual';
    else if (action === 'webhook' || action === 'oauth') targetService = 'external';
    else if (action === 'health' || action === 'monitor') targetService = 'supervisor';
    else if (action === 'learn' || action === 'evolve') targetService = 'lexicon';
  }

  if (target && SERVICES[target]) {
    targetService = target;
  }

  const service = SERVICES[targetService];

  try {
    const response = await fetch(`http://localhost:${service.port}/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const result = await response.json();

    res.json({
      routed_to: targetService,
      service: service.name,
      codename: service.codename,
      result
    });
  } catch (error) {
    res.status(502).json({
      error: 'Service unavailable',
      service: targetService,
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// PROXY ROUTES
// ═══════════════════════════════════════════════════════════════════════════

const createServiceProxy = (service, pathPrefix) => {
  return createProxyMiddleware({
    target: `http://localhost:${service.port}`,
    changeOrigin: true,
    pathRewrite: { [`^${pathPrefix}`]: '' },
    onError: (err, req, res) => {
      res.status(502).json({
        error: 'Service unavailable',
        service: service.name,
        message: err.message
      });
    }
  });
};

// Route to services
app.use('/intent', createServiceProxy(SERVICES.intent, '/intent'));
app.use('/lexicon', createServiceProxy(SERVICES.lexicon, '/lexicon'));
app.use('/voice', createServiceProxy(SERVICES.voice, '/voice'));
app.use('/supervisor', createServiceProxy(SERVICES.supervisor, '/supervisor'));
app.use('/events', createServiceProxy(SERVICES.events, '/events'));
app.use('/ritual', createServiceProxy(SERVICES.ritual, '/ritual'));
app.use('/external', createServiceProxy(SERVICES.external, '/external'));
app.use('/orchestrate', createServiceProxy(SERVICES.orchestrator, '/orchestrate'));
app.use('/capture', createServiceProxy(SERVICES.capture, '/capture'));
app.use('/process', createServiceProxy(SERVICES.process, '/process'));
app.use('/surface', createServiceProxy(SERVICES.surface, '/surface'));
app.use('/auth', createServiceProxy(SERVICES.auth, '/auth'));

// ═══════════════════════════════════════════════════════════════════════════
// API DOCUMENTATION
// ═══════════════════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
  res.json({
    name: 'Fractal Memory Engine - Unified Gateway',
    codename: 'THE NEXUS',
    version: '1.0.0',
    description: 'Single entry point for all Fractal Memory services',
    endpoints: {
      '/health': 'Gateway health check',
      '/status': 'All services status',
      '/trigger': 'Unified trigger endpoint (auto-routes)',
      '/intent/*': 'Intent Grid (P18)',
      '/lexicon/*': 'Lexicon Engine (P19)',
      '/voice/*': 'Voice Loop (P22)',
      '/supervisor/*': 'Edge Supervisor (P23)',
      '/events/*': 'Event Bus',
      '/ritual/*': 'Ritual Engine (P20)',
      '/external/*': 'External Tether (P21)',
      '/orchestrate/*': 'Orchestrator (P9)',
      '/auth/*': 'Auth Service (P10)'
    },
    services: Object.entries(SERVICES).map(([key, s]) => ({
      key,
      name: s.name,
      codename: s.codename,
      port: s.port
    }))
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVER
// ═══════════════════════════════════════════════════════════════════════════

const PORT = process.env.GATEWAY_PORT || 8888;

app.listen(PORT, () => {
  console.log('═'.repeat(60));
  console.log('UNIFIED GATEWAY - THE NEXUS');
  console.log('Single entry point for Fractal Memory Engine');
  console.log(`Listening on port ${PORT}`);
  console.log('═'.repeat(60));
  console.log('');
  console.log('Services:');
  for (const [key, service] of Object.entries(SERVICES)) {
    console.log(`  /${key} → ${service.name} (${service.codename}) :${service.port}`);
  }
  console.log('');
});

module.exports = { app, SERVICES };
