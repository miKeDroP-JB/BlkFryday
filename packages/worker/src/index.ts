import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { spawnAgentSandbox } from './sandbox';
import type { AgentEvent, AgentJobData } from '@blk/shared';
import { writeEventToDb, updateRunStatus } from './persistence';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║              0RB WORKER - AGENT EXECUTOR                   ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log(`Connecting to Redis: ${redisUrl}`);

const worker = new Worker<AgentJobData>(
  'agents',
  async (job) => {
    const { agentName, runId, config, payload } = job.data;
    console.log(`\n[WORKER] Picked job: ${agentName} (run: ${runId})`);

    try {
      // Update status to running
      await updateRunStatus(runId, 'running');

      // Spawn plugin in sandboxed child process
      await spawnAgentSandbox(
        { agentName, runId, config, payload },
        async (event: AgentEvent) => {
          // Persist event to database
          await writeEventToDb(event);
          console.log(`  [EVENT] ${runId}: ${event.status} (${event.progress || 0}%)`);
        }
      );

      // Update final status
      await updateRunStatus(runId, 'completed');
      console.log(`[WORKER] Completed: ${runId}`);
    } catch (error) {
      console.error(`[WORKER] Failed: ${runId}`, error);
      await updateRunStatus(runId, 'failed');
      throw error;
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  }
);

worker.on('completed', (job) => {
  console.log(`[WORKER] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[WORKER] Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[WORKER] Error:', err);
});

process.on('SIGTERM', async () => {
  console.log('[WORKER] Shutting down...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[WORKER] Interrupted, shutting down...');
  await worker.close();
  process.exit(0);
});

console.log('[WORKER] Listening for jobs on queue: agents');
