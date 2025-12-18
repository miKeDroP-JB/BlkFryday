#!/usr/bin/env node
// ============================================================
//  QUICK BENCHMARK TEST
//  Runs without full ORBOS stack for fast validation
// ============================================================

const { BenchmarkOrchestrator } = require('./orchestrator/BenchmarkOrchestrator');
const { GPTAdapter, ClaudeAdapter, BaselineAdapter } = require('./adapters/ExternalAdapters');
const { GlyphMicrobench, LatencyBenchmark, CrossDomainOneShot } = require('./tests/TestSuites');
const { Statistics } = require('./evaluator/Scorer');

async function quickTest() {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                  🏁 QUICK BENCHMARK TEST                         ║
║              (Mock adapters - no API calls)                      ║
╚══════════════════════════════════════════════════════════════════╝
`);

  const orchestrator = new BenchmarkOrchestrator();

  // Register mock adapters only
  const adapters = {
    GPT: new GPTAdapter({}),
    Claude: new ClaudeAdapter({}),
    Baseline: new BaselineAdapter()
  };

  console.log('📌 Registering adapters...');
  for (const [name, adapter] of Object.entries(adapters)) {
    await adapter.initialize();
    orchestrator.registerAdapter(name, adapter);
  }

  // Register tests with reduced samples
  console.log('\n📋 Registering tests...');
  const tests = [
    { ...LatencyBenchmark, samples: 5 },
    { ...GlyphMicrobench, samples: 5 },
    { ...CrossDomainOneShot, samples: 3 }
  ];

  for (const test of tests) {
    orchestrator.registerTest(test);
  }

  // Run benchmarks
  console.log('\n' + '═'.repeat(60));
  console.log('                    RUNNING TESTS');
  console.log('═'.repeat(60) + '\n');

  const results = await orchestrator.runAll();

  // Print summary
  orchestrator.printSummary();

  // Generate comparison
  console.log('\n📊 PAIRWISE COMPARISONS:\n');
  console.log('─'.repeat(60));

  const adapterList = Object.keys(results);
  for (let i = 0; i < adapterList.length; i++) {
    for (let j = i + 1; j < adapterList.length; j++) {
      const a1 = adapterList[i];
      const a2 = adapterList[j];

      for (const testId of Object.keys(results[a1])) {
        const r1 = results[a1][testId];
        const r2 = results[a2][testId];

        if (r1?.stats?.score?.mean != null && r2?.stats?.score?.mean != null) {
          const s1 = r1.stats.score.mean;
          const s2 = r2.stats.score.mean;
          const winner = s1 > s2 ? a1 : s2 > s1 ? a2 : 'tie';
          const effect = Statistics.cohensD(
            r1.samples.map(s => s.score).filter(Boolean),
            r2.samples.map(s => s.score).filter(Boolean)
          );

          console.log(`  ${testId.substring(0, 25).padEnd(25)} | ${winner.padEnd(8)} | d=${effect.toFixed(2)}`);
        }
      }
    }
  }

  // AGI Scores
  console.log('\n\n🎯 AGI ADJACENCY SCORES:\n');
  const report = orchestrator.generateReport();
  for (const [adapter, score] of Object.entries(report.agiScores)) {
    const bar = '█'.repeat(Math.floor(score / 2)).padEnd(50, '░');
    console.log(`  ${adapter.padEnd(10)} ${bar} ${score.toFixed(1)}`);
  }

  // Save report
  const reportPath = await orchestrator.saveReport('quicktest_report.json');
  console.log(`\n📁 Report: ${reportPath}`);

  console.log('\n✅ Quick test complete!\n');

  return results;
}

quickTest().catch(console.error);
