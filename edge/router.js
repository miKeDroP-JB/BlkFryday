// ============================================================
//  BRAIN NETWORK V11.5 - EDGE MULTIPLEX ROUTER
//  Multi-lane QUIC/WebTransport Traffic Controller
// ============================================================
//
//  Deployment: Cloudflare Workers / Vercel Edge / Deno Deploy
//
//  Priority Lanes:
//    HIGH: /wt/voice   - Voice packets (UDP/QUIC)
//    HIGH: /wt/control - Control/Intent signals
//    LOW:  /wt/telemetry - Logs/metrics (async queue)
//
// ============================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const startTime = Date.now();

    // Add edge timing header
    const addTimingHeader = (response) => {
      const headers = new Headers(response.headers);
      headers.set('x-edge-timing', `${Date.now() - startTime}ms`);
      headers.set('x-edge-region', env?.REGION || 'unknown');
      headers.set('x-brain-version', 'V11.5');
      return new Response(response.body, { ...response, headers });
    };

    // ============================================================
    //  MULTIPLEX ROUTING
    // ============================================================

    switch (url.pathname) {

      // HIGH PRIORITY: Voice Stream (WebTransport/QUIC)
      case '/wt/voice':
        return addTimingHeader(await handleVoiceStream(request, env, ctx));

      // HIGH PRIORITY: Control/Intent Commands
      case '/wt/control':
        return addTimingHeader(await handleControlStream(request, env, ctx));

      // LOW PRIORITY: Telemetry (fire-and-forget)
      case '/wt/telemetry':
        ctx.waitUntil(logTelemetry(request, env));
        return new Response(null, { status: 202 });

      // WebSocket Fallback (for non-WebTransport clients)
      case '/ws/fallback':
        return handleWebSocketUpgrade(request, env);

      // Health Check
      case '/health':
        return new Response(JSON.stringify({
          status: 'healthy',
          version: 'V11.5',
          region: env?.REGION || 'local',
          timestamp: Date.now()
        }), {
          headers: { 'Content-Type': 'application/json' }
        });

      // Brain Network API Proxy
      case '/api/v11/query':
        return addTimingHeader(await proxyToBrainNetwork(request, env, '/query'));

      case '/api/v11/cast':
        return addTimingHeader(await proxyToBrainNetwork(request, env, '/cast'));

      default:
        return new Response(JSON.stringify({
          gateway: 'BRAIN_NETWORK_V11.5_EDGE',
          message: 'Neon River flows here',
          endpoints: ['/wt/voice', '/wt/control', '/wt/telemetry', '/ws/fallback', '/health']
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  }
};

// ============================================================
//  VOICE STREAM HANDLER
// ============================================================

async function handleVoiceStream(request, env, ctx) {
  const headers = new Headers(request.headers);

  // Inject edge arrival timestamp for jitter calculation
  headers.set('x-edge-arrival', Date.now().toString());

  // Extract stability score from client
  const stability = parseFloat(headers.get('x-stability-score') || '1.0');

  // Congestion detection
  const congested = headers.get('x-congestion-window-limited') === 'true';

  // Route decision based on network quality
  if (stability < 0.6 || congested) {
    // Reroute to TCP fallback for unstable connections
    console.log(`[Edge] Rerouting voice to TCP fallback. Stability: ${stability}`);

    if (env?.TCP_FALLBACK) {
      return env.TCP_FALLBACK.fetch(request, { headers });
    }

    return new Response(JSON.stringify({
      error: 'connection_unstable',
      stability,
      fallback: '/ws/fallback'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Forward to voice processor
  if (env?.VOICE_PROCESSOR) {
    return env.VOICE_PROCESSOR.fetch(request, { headers });
  }

  // Local processing if no worker binding
  return processVoiceLocal(request, headers);
}

async function processVoiceLocal(request, headers) {
  try {
    const body = await request.json();

    return new Response(JSON.stringify({
      status: 'processed',
      arrival: headers.get('x-edge-arrival'),
      transcript: body.transcript || null,
      confidence: body.confidence || 0,
      processingTime: Date.now() - parseInt(headers.get('x-edge-arrival'))
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'voice_processing_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ============================================================
//  CONTROL STREAM HANDLER
// ============================================================

async function handleControlStream(request, env, ctx) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    // Validate action
    const validActions = ['cast', 'cancel', 'modify', 'query', 'mode'];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ error: 'invalid_action' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Forward to brain network
    if (env?.BRAIN_NETWORK) {
      return env.BRAIN_NETWORK.fetch(new Request(`${env.BRAIN_NETWORK_URL}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      }));
    }

    // Local acknowledgment
    return new Response(JSON.stringify({
      ack: true,
      action,
      timestamp: Date.now()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'control_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ============================================================
//  TELEMETRY HANDLER (Async - Non-blocking)
// ============================================================

async function logTelemetry(request, env) {
  try {
    const data = await request.json();

    // Enrich with edge metadata
    const enriched = {
      ...data,
      edge: {
        region: env?.REGION || 'unknown',
        timestamp: Date.now(),
        version: 'V11.5'
      }
    };

    // Send to analytics backend
    if (env?.ANALYTICS) {
      await env.ANALYTICS.writeDataPoint({
        blobs: [JSON.stringify(enriched)],
        indexes: [data.metric || 'unknown']
      });
    }

    // Log for debugging
    console.log('[Telemetry]', JSON.stringify(enriched));

  } catch (error) {
    console.error('[Telemetry Error]', error.message);
  }
}

// ============================================================
//  WEBSOCKET FALLBACK
// ============================================================

function handleWebSocketUpgrade(request, env) {
  const upgradeHeader = request.headers.get('Upgrade');

  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  // Create WebSocket pair
  const [client, server] = Object.values(new WebSocketPair());

  server.accept();

  server.addEventListener('message', async (event) => {
    try {
      const data = JSON.parse(event.data);

      // Route based on message type
      switch (data.type) {
        case 'voice':
          server.send(JSON.stringify({ type: 'voice_ack', id: data.id }));
          break;
        case 'control':
          server.send(JSON.stringify({ type: 'control_ack', id: data.id }));
          break;
        case 'ping':
          server.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        default:
          server.send(JSON.stringify({ type: 'error', message: 'unknown_type' }));
      }
    } catch (error) {
      server.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });

  return new Response(null, {
    status: 101,
    webSocket: client
  });
}

// ============================================================
//  BRAIN NETWORK PROXY
// ============================================================

async function proxyToBrainNetwork(request, env, endpoint) {
  const targetUrl = env?.BRAIN_NETWORK_URL || 'http://localhost:3000/api/v11';

  try {
    const response = await fetch(`${targetUrl}${endpoint}`, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' ? request.body : undefined
    });

    return response;

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'brain_network_unreachable',
      message: error.message
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
