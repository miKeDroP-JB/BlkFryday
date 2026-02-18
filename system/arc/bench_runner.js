/**
 * bench_runner.js
 * Full Bench Runner for V3.6/V4.0 Engines
 * ═══════════════════════════════════════════════════════════════════
 * Runs across raw/ tasks, collects stats, saves artifacts
 */

const fs = require('fs');
const path = require('path');
const EmergenceOrchestrator = require('./EmergenceOrchestrator');

const RAW_DIR = path.join(__dirname, 'raw');
const OUT_DIR = path.join(__dirname, 'bench_results');

// Ensure directories exist
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(RAW_DIR, { recursive: true });

/**
 * Run full benchmark across all tasks
 * @param {Object} opts - Options
 * @returns {Promise<Array>} - Results array
 */
async function runFullBench(opts = {}) {
  const orchestrator = new EmergenceOrchestrator(Object.assign({
    maxDepth: 4,
    verbose: opts.verbose || false
  }, opts));

  // Get task files
  let files = [];
  try {
    files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.json'));
  } catch (e) {
    console.log(`[BENCH] No raw/ directory or no JSON files found. Creating sample task...`);

    // Create a sample task for testing
    const sampleTask = {
      train: [
        { input: [[1, 2], [3, 4]], output: [[3, 4], [1, 2]] },
        { input: [[5, 6], [7, 8]], output: [[7, 8], [5, 6]] }
      ],
      test: [
        { input: [[9, 0], [1, 2]], output: [[1, 2], [9, 0]] }
      ]
    };

    fs.writeFileSync(path.join(RAW_DIR, 'sample_flipV.json'), JSON.stringify(sampleTask, null, 2));
    files = ['sample_flipV.json'];
  }

  console.log(`[BENCH] Found ${files.length} tasks in ${RAW_DIR}`);

  const results = [];
  const timeLimitMs = opts.timeLimitMs || 1000 * 60 * 10; // 10 min default

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const id = path.basename(f, '.json');

    let task;
    try {
      task = JSON.parse(fs.readFileSync(path.join(RAW_DIR, f), 'utf8'));
    } catch (e) {
      console.log(`[BENCH] Failed to parse ${f}: ${e.message}`);
      results.push({ id, status: 'parse_error', error: e.message });
      continue;
    }

    console.log(`[BENCH] [${i + 1}/${files.length}] Running ${id}...`);

    const start = Date.now();
    let res;

    try {
      res = await orchestrator.solveTask(id, task, { timeLimitMs });
    } catch (e) {
      res = { status: 'error', error: e.message };
    }

    const dur = Date.now() - start;
    const ok = res && res.status === 'ok';

    const entry = {
      id,
      status: res.status,
      method: res.method || null,
      pipeline: res.pipeline || null,
      durationMs: dur,
      steps: res.steps || null,
      meta: res.detail || null
    };

    results.push(entry);

    // Save artifact
    if (!ok) {
      fs.writeFileSync(
        path.join(OUT_DIR, `${id}_fail.json`),
        JSON.stringify({ id, task, res }, null, 2)
      );
      console.log(`  ✗ FAIL (${res.status}) - ${dur}ms`);
    } else {
      fs.writeFileSync(
        path.join(OUT_DIR, `${id}_sol.json`),
        JSON.stringify({ id, pipeline: res.pipeline, method: res.method }, null, 2)
      );
      console.log(`  ✓ OK (${res.method}) - ${dur}ms`);
    }

    // Brief cooldown between tasks
    await new Promise(r => setTimeout(r, 100));
  }

  // Save summary
  fs.writeFileSync(
    path.join(OUT_DIR, 'bench_summary.json'),
    JSON.stringify(results, null, 2)
  );

  // Print summary
  const okCount = results.filter(r => r.status === 'ok').length;
  const avgTime = results.reduce((s, r) => s + (r.durationMs || 0), 0) / results.length;

  console.log(`\n[BENCH] Complete!`);
  console.log(`  Total: ${results.length}`);
  console.log(`  Passed: ${okCount} (${(okCount / results.length * 100).toFixed(1)}%)`);
  console.log(`  Avg Time: ${avgTime.toFixed(0)}ms`);
  console.log(`  Results saved to: ${OUT_DIR}`);

  return results;
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const timeLimit = parseInt(args[0] || '600000', 10);
  const verbose = args.includes('--verbose') || args.includes('-v');

  console.log(`[BENCH] Starting with timeLimit=${timeLimit}ms, verbose=${verbose}`);

  runFullBench({ timeLimitMs: timeLimit, verbose })
    .then(r => {
      process.exit(0);
    })
    .catch(e => {
      console.error(`[BENCH] Fatal error: ${e.message}`);
      process.exit(2);
    });
}

module.exports = { runFullBench };
