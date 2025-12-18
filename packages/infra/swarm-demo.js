#!/usr/bin/env node
/**
 * 0RB Agent Swarm Demo
 *
 * Spawns multiple concurrent agent runs to demonstrate
 * the scalability of the worker system.
 *
 * Usage:
 *   node swarm-demo.js [count] [api-url]
 *
 * Examples:
 *   node swarm-demo.js 50
 *   node swarm-demo.js 100 http://localhost:4000
 */

const API_URL = process.argv[3] || process.env.API_URL || 'http://localhost:4000';
const AGENT_COUNT = parseInt(process.argv[2] || '50', 10);

const AGENT_NAMES = ['sample-agent'];

async function spawnAgent(index) {
  const agentName = AGENT_NAMES[index % AGENT_NAMES.length];
  const startTime = Date.now();

  try {
    const response = await fetch(`${API_URL}/api/v1/agents/${agentName}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: { swarmIndex: index },
        payload: { message: `Swarm agent #${index}` }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const elapsed = Date.now() - startTime;

    return {
      success: true,
      index,
      runId: data.runId,
      elapsed,
      agentName
    };
  } catch (error) {
    return {
      success: false,
      index,
      error: error.message,
      elapsed: Date.now() - startTime
    };
  }
}

async function pollStatus(runId, timeout = 60000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`${API_URL}/api/v1/runs/${runId}`);
      const data = await response.json();

      if (data.status === 'completed' || data.status === 'failed') {
        return data;
      }

      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return { status: 'timeout', runId };
}

async function getSystemStatus() {
  try {
    const response = await fetch(`${API_URL}/api/v1/status`);
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

function printBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                     0RB AGENT SWARM DEMO                         ║
║                                                                  ║
║  Spawning ${String(AGENT_COUNT).padStart(3)} agents to demonstrate system scalability    ║
╚══════════════════════════════════════════════════════════════════╝
`);
}

function printProgress(completed, total, successes, failures) {
  const percent = Math.round((completed / total) * 100);
  const barWidth = 40;
  const filled = Math.round((completed / total) * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

  process.stdout.write(
    `\r[${bar}] ${percent}% | ✓ ${successes} | ✗ ${failures} | ${completed}/${total}`
  );
}

async function runSwarm() {
  printBanner();

  console.log(`API Target: ${API_URL}`);
  console.log(`Agent Count: ${AGENT_COUNT}\n`);

  // Check API health first
  console.log('Checking API health...');
  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error('API not healthy');
    }
    console.log('✓ API is healthy\n');
  } catch (error) {
    console.error(`✗ API not reachable at ${API_URL}`);
    console.error('  Make sure the API server is running');
    process.exit(1);
  }

  // Initial status
  const initialStatus = await getSystemStatus();
  console.log('Initial queue status:', JSON.stringify(initialStatus.queue || {}, null, 2));
  console.log('');

  // Spawn all agents
  console.log('Spawning agents...');
  const spawnStart = Date.now();

  const spawnPromises = [];
  for (let i = 0; i < AGENT_COUNT; i++) {
    spawnPromises.push(spawnAgent(i));
  }

  const results = [];
  let completed = 0;
  let successes = 0;
  let failures = 0;

  for (const promise of spawnPromises) {
    const result = await promise;
    results.push(result);
    completed++;
    if (result.success) successes++;
    else failures++;
    printProgress(completed, AGENT_COUNT, successes, failures);
  }

  console.log('\n');

  const spawnDuration = Date.now() - spawnStart;
  const successfulSpawns = results.filter(r => r.success);
  const failedSpawns = results.filter(r => !r.success);

  console.log(`Spawn complete in ${spawnDuration}ms`);
  console.log(`  Successful: ${successfulSpawns.length}`);
  console.log(`  Failed: ${failedSpawns.length}`);

  if (failedSpawns.length > 0) {
    console.log('\nFailed spawns:');
    failedSpawns.slice(0, 5).forEach(f => {
      console.log(`  Agent #${f.index}: ${f.error}`);
    });
    if (failedSpawns.length > 5) {
      console.log(`  ... and ${failedSpawns.length - 5} more`);
    }
  }

  // Wait for completion
  if (successfulSpawns.length > 0) {
    console.log('\nWaiting for agents to complete...');

    const pollStart = Date.now();
    const runIds = successfulSpawns.map(r => r.runId);

    let completedRuns = 0;
    let successfulRuns = 0;
    let failedRuns = 0;

    for (const runId of runIds) {
      const status = await pollStatus(runId, 120000);
      completedRuns++;
      if (status.status === 'completed') successfulRuns++;
      else failedRuns++;
      printProgress(completedRuns, runIds.length, successfulRuns, failedRuns);
    }

    console.log('\n');

    const pollDuration = Date.now() - pollStart;
    console.log(`All runs processed in ${pollDuration}ms`);
    console.log(`  Completed: ${successfulRuns}`);
    console.log(`  Failed/Timeout: ${failedRuns}`);
  }

  // Final status
  console.log('\nFinal queue status:');
  const finalStatus = await getSystemStatus();
  console.log(JSON.stringify(finalStatus.queue || {}, null, 2));

  // Stats
  const avgSpawnTime = results.reduce((sum, r) => sum + r.elapsed, 0) / results.length;
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                        SWARM STATS                               ║
╠══════════════════════════════════════════════════════════════════╣
║  Total Agents:     ${String(AGENT_COUNT).padEnd(44)}║
║  Spawn Success:    ${String(successfulSpawns.length).padEnd(44)}║
║  Spawn Failed:     ${String(failedSpawns.length).padEnd(44)}║
║  Avg Spawn Time:   ${String(Math.round(avgSpawnTime) + 'ms').padEnd(44)}║
║  Total Duration:   ${String(spawnDuration + 'ms').padEnd(44)}║
╚══════════════════════════════════════════════════════════════════╝
`);
}

// Run it
runSwarm().catch(err => {
  console.error('Swarm error:', err);
  process.exit(1);
});
