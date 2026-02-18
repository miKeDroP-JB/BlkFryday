/**
 * bench_reporter.js
 * Metrics Collector + JSON/CSV Outputs
 * ═══════════════════════════════════════════════════════════════════
 * Summarizes benchmark results into various formats
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'bench_results');

/**
 * Generate summary from benchmark results
 */
function summarize() {
  const sumPath = path.join(OUT_DIR, 'bench_summary.json');

  if (!fs.existsSync(sumPath)) {
    console.log('[REPORTER] No bench_summary.json found. Run bench_runner.js first.');
    return null;
  }

  const arr = JSON.parse(fs.readFileSync(sumPath, 'utf8'));
  const total = arr.length;

  if (total === 0) {
    console.log('[REPORTER] No results to summarize.');
    return null;
  }

  const ok = arr.filter(x => x.status === 'ok').length;
  const timeout = arr.filter(x => x.status === 'timeout').length;
  const fail = arr.filter(x => x.status === 'fail').length;
  const errors = arr.filter(x => x.status === 'error' || x.status === 'parse_error').length;

  const avgTime = arr.reduce((s, i) => s + (i.durationMs || 0), 0) / total;
  const maxTime = Math.max(...arr.map(i => i.durationMs || 0));
  const minTime = Math.min(...arr.filter(i => i.durationMs > 0).map(i => i.durationMs));

  // Method breakdown
  const byMethod = {};
  for (const r of arr) {
    const method = r.method || r.status || 'unknown';
    byMethod[method] = (byMethod[method] || 0) + 1;
  }

  // Status breakdown
  const byStatus = {};
  for (const r of arr) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  }

  // Generate CSV
  const csvLines = ['id,status,method,durationMs,pipeline'];
  for (const r of arr) {
    const pipeStr = r.pipeline ? r.pipeline.join('->') : '';
    csvLines.push(`${r.id},${r.status},${r.method || ''},${r.durationMs || 0},"${pipeStr}"`);
  }
  const csv = csvLines.join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'bench_summary.csv'), csv);

  // Generate overview JSON
  const overview = {
    total,
    passed: ok,
    passRate: (ok / total * 100).toFixed(1) + '%',
    timeout,
    fail,
    errors,
    avgTimeMs: Math.round(avgTime),
    maxTimeMs: maxTime,
    minTimeMs: minTime,
    byMethod,
    byStatus,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(OUT_DIR, 'bench_overview.json'), JSON.stringify(overview, null, 2));

  // Print to console
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('                    BENCHMARK SUMMARY');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`  Total Tasks:     ${total}`);
  console.log(`  Passed:          ${ok} (${overview.passRate})`);
  console.log(`  Timeout:         ${timeout}`);
  console.log(`  Failed:          ${fail}`);
  console.log(`  Errors:          ${errors}`);
  console.log('──────────────────────────────────────────────────────────────');
  console.log(`  Avg Time:        ${Math.round(avgTime)}ms`);
  console.log(`  Max Time:        ${maxTime}ms`);
  console.log(`  Min Time:        ${minTime}ms`);
  console.log('──────────────────────────────────────────────────────────────');
  console.log('  By Method:');
  for (const [method, count] of Object.entries(byMethod)) {
    console.log(`    ${method}: ${count}`);
  }
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`\nFiles saved:`);
  console.log(`  - ${path.join(OUT_DIR, 'bench_summary.csv')}`);
  console.log(`  - ${path.join(OUT_DIR, 'bench_overview.json')}`);

  return overview;
}

// CLI entry point
if (require.main === module) {
  summarize();
}

module.exports = { summarize };
