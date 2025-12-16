/**
 * SLOW MODE TEST - "Let it cook"
 * No rush. No limits. Find the answer.
 */

const fs = require('fs');
const InfiniteReasoner = require('./InfiniteReasoner');

// Test the near-miss tasks with MORE PATIENCE
const nearMisses = ['017c7c7b', '045e512c', '06df4c85', '05f2a901', '007bbfb7'];

console.log('');
console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║     SLOW MODE TEST - "Let it cook"                                ║');
console.log('║     No rush. More patience. Find the answer.                      ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝');
console.log('');

let solved = 0;
let total = 0;
const results = [];

for (const taskId of nearMisses) {
  const taskPath = `./raw/${taskId}.json`;
  if (!fs.existsSync(taskPath)) {
    console.log('Task not found:', taskId);
    continue;
  }

  // Fresh reasoner for each task - unlimited mode
  const reasoner = new InfiniteReasoner({
    debug: true,
    solveMode: 'unlimited'  // TRUE unlimited - no bailout
  });

  const task = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
  console.log(`[${taskId}] Testing with UNLIMITED mode...`);

  const start = Date.now();

  // Set a timeout of 30 seconds per task
  const timeout = 30000;
  let result = null;

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('TIMEOUT')), timeout);
  });

  try {
    // Run synchronously but we'll check time manually
    result = reasoner.solve(task);
  } catch (e) {
    result = { success: false, bestSimilarity: 0 };
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  total++;
  if (result.success) {
    solved++;
    console.log(`  ✓ SOLVED in ${elapsed}s`);
    console.log(`    Solution: ${result.hypothesis}`);
  } else {
    console.log(`  Best: ${((result.bestSimilarity || 0) * 100).toFixed(1)}% in ${elapsed}s`);
    console.log(`    Hypothesis: ${result.hypothesis || 'none'}`);
  }

  results.push({
    taskId,
    success: result.success,
    similarity: result.bestSimilarity || (result.success ? 1.0 : 0),
    time: elapsed,
    hypothesis: result.hypothesis
  });

  console.log('');
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log(`RESULT: ${solved}/${total} (${((solved/total)*100).toFixed(1)}%)`);
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');

// Show comparison
console.log('COMPARISON: Fast mode vs Slow mode');
console.log('┌─────────────┬───────────────┬───────────────┐');
console.log('│ Task        │ Fast (1000)   │ Slow (unlim)  │');
console.log('├─────────────┼───────────────┼───────────────┤');
for (const r of results) {
  const fastScore = {
    '017c7c7b': '97.5%',
    '045e512c': '93.0%',
    '06df4c85': '93.8%',
    '05f2a901': '92.0%',
    '007bbfb7': '77.8%'
  }[r.taskId] || '?';

  const slowScore = r.success ? '✓ SOLVED' : `${(r.similarity * 100).toFixed(1)}%`;
  console.log(`│ ${r.taskId}  │ ${fastScore.padEnd(13)} │ ${slowScore.padEnd(13)} │`);
}
console.log('└─────────────┴───────────────┴───────────────┘');
