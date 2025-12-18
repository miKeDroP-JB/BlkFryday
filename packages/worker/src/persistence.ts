import { Pool } from 'pg';
import type { AgentEvent } from '@blk/shared';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://blkf:blkfpass@localhost:5432/blkf',
});

/**
 * Write an agent event to the database
 */
export async function writeEventToDb(event: AgentEvent): Promise<void> {
  const query = `
    INSERT INTO agent_events (run_id, event_time, payload)
    VALUES ($1, NOW(), $2)
  `;
  await pool.query(query, [event.runId, JSON.stringify(event)]);
}

/**
 * Update the status of an agent run
 */
export async function updateRunStatus(runId: string, status: string): Promise<void> {
  const query = `
    UPDATE agent_runs
    SET status = $1, updated_at = NOW()
    WHERE run_id = $2
  `;
  await pool.query(query, [status, runId]);
}

/**
 * Get recent events for a run
 */
export async function getRunEvents(runId: string, afterId: number = 0): Promise<{ id: number; payload: AgentEvent }[]> {
  const query = `
    SELECT id, payload
    FROM agent_events
    WHERE run_id = $1 AND id > $2
    ORDER BY id ASC
  `;
  const result = await pool.query(query, [runId, afterId]);
  return result.rows.map(row => ({
    id: row.id,
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
  }));
}

export { pool };
