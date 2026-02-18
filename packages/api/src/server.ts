import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import type { AgentJobData } from '@blk/shared';

// Configuration
const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const databaseUrl = process.env.DATABASE_URL || 'postgresql://blkf:blkfpass@localhost:5432/blkf';

// Connections
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const queue = new Queue<AgentJobData>('agents', { connection });
const pool = new Pool({ connectionString: databaseUrl });

// Fastify instance
const fastify = Fastify({ logger: true });

// Register plugins
fastify.register(fastifyCors, { origin: true });
fastify.register(fastifyWebsocket);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// System status
fastify.get('/api/v1/status', async () => {
  const queueCounts = await queue.getJobCounts();
  return {
    status: 'online',
    queue: queueCounts,
    timestamp: new Date().toISOString(),
  };
});

// List available agents
fastify.get('/api/v1/agents', async () => {
  // In production, this would scan the plugins directory
  return {
    agents: [
      { name: 'sample-agent', version: '0.0.1', status: 'available' },
    ],
  };
});

// Start an agent run
fastify.post<{
  Params: { agentName: string };
  Body: { config?: Record<string, unknown>; payload?: unknown };
}>('/api/v1/agents/:agentName/run', async (request, reply) => {
  const { agentName } = request.params;
  const { config, payload } = request.body || {};
  const runId = uuidv4();

  // Insert run record
  await pool.query(
    `INSERT INTO agent_runs (id, agent_name, run_id, status, created_at, updated_at, meta)
     VALUES (gen_random_uuid(), $1, $2, 'queued', NOW(), NOW(), $3)`,
    [agentName, runId, JSON.stringify({ config, payload })]
  );

  // Add to queue
  await queue.add('run', { agentName, runId, config, payload });

  return reply.code(202).send({
    runId,
    agentName,
    status: 'queued',
    createdAt: new Date().toISOString(),
  });
});

// Get run status
fastify.get<{ Params: { runId: string } }>('/api/v1/runs/:runId', async (request, reply) => {
  const { runId } = request.params;

  const result = await pool.query(
    'SELECT * FROM agent_runs WHERE run_id = $1',
    [runId]
  );

  if (result.rows.length === 0) {
    return reply.code(404).send({ error: 'Run not found' });
  }

  const run = result.rows[0];

  // Get latest events
  const events = await pool.query(
    'SELECT payload FROM agent_events WHERE run_id = $1 ORDER BY id DESC LIMIT 10',
    [runId]
  );

  return {
    runId: run.run_id,
    agentName: run.agent_name,
    status: run.status,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    recentEvents: events.rows.map(r => r.payload),
  };
});

// Get run events
fastify.get<{
  Params: { runId: string };
  Querystring: { after?: string };
}>('/api/v1/runs/:runId/events', async (request, reply) => {
  const { runId } = request.params;
  const afterId = parseInt(request.query.after || '0', 10);

  const result = await pool.query(
    'SELECT id, payload FROM agent_events WHERE run_id = $1 AND id > $2 ORDER BY id ASC',
    [runId, afterId]
  );

  return {
    events: result.rows.map(r => ({ id: r.id, ...r.payload })),
    lastId: result.rows.length > 0 ? result.rows[result.rows.length - 1].id : afterId,
  };
});

// WebSocket for real-time events
fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection) => {
    const socket = connection.socket;
    let pollInterval: NodeJS.Timeout | null = null;

    socket.on('message', async (msg) => {
      try {
        const data = JSON.parse(msg.toString());

        if (data.type === 'subscribe' && data.runId) {
          // Subscribe to run events
          let lastId = 0;

          // Clear any existing interval
          if (pollInterval) clearInterval(pollInterval);

          // Poll for new events (in production, use LISTEN/NOTIFY)
          pollInterval = setInterval(async () => {
            try {
              const result = await pool.query(
                'SELECT id, payload FROM agent_events WHERE run_id = $1 AND id > $2 ORDER BY id ASC',
                [data.runId, lastId]
              );

              for (const row of result.rows) {
                lastId = row.id;
                socket.send(JSON.stringify({
                  type: 'event',
                  event: row.payload,
                }));
              }
            } catch (err) {
              console.error('Poll error:', err);
            }
          }, 300);

          socket.send(JSON.stringify({
            type: 'subscribed',
            runId: data.runId,
          }));
        } else if (data.type === 'unsubscribe') {
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          socket.send(JSON.stringify({ type: 'unsubscribed' }));
        }
      } catch (err) {
        socket.send(JSON.stringify({
          type: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        }));
      }
    });

    socket.on('close', () => {
      if (pollInterval) clearInterval(pollInterval);
    });
  });
});

// Start server
const start = async () => {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                 0RB API SERVER                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    await fastify.listen({ port: PORT, host: HOST });
    console.log(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
