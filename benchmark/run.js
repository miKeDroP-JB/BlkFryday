#!/usr/bin/env node
// ============================================================
//  ORBOS BENCHMARK RUNNER
//  Execute the full benchmark suite
// ============================================================
//
//  Usage:
//    node benchmark/run.js                    # Run all tests
//    node benchmark/run.js --quick            # Quick run (fewer samples)
//    node benchmark/run.js --test glyph       # Run specific test
//    node benchmark/run.js --adapter ORBOS    # Run specific adapter
//
// ============================================================

const path = require('path');
const fs = require('fs').promises;

// Import components
const { BenchmarkOrchestrator, TEST_TYPES } = require('./orchestrator/BenchmarkOrchestrator');
const { ORBOSAdapter } = require('./adapters/ORBOSAdapter');
const { GPTAdapter, ClaudeAdapter, BaselineAdapter } = require('./adapters/ExternalAdapters');
const { ALL_TESTS, HIGH_ALTITUDE_PROMPT } = require('./tests/TestSuites');
const { CompositeScorer, Statistics } = require('./evaluator/Scorer');

// ============================================================
//  BANNER
// ============================================================

const BANNER = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║             🏁 ORBOS V11.5 BENCHMARK HARNESS 🏁                              ║
║                                                                              ║
║                 "Prove. Quantify. Demolish Competition."                     ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Tests:                                                                      ║
║  • Glyph Compression Microbench    • Cross-Domain One-Shot                   ║
║  • Recursive Self-Improvement      • Multi-Agent Coordination                ║
║  • Hallucination Adversarial       • Tool Use & API Invocation               ║
║  • Latency Benchmark                                                         ║
║                                                                              ║
║  Metrics:                                                                    ║
║  • Latency (p50, p95, p99)         • AGI Adjacency Score (0-100)             ║
║  • Effect Size (Cohen's d)         • 95% Confidence Intervals                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

// ============================================================
//  CONFIGURATION
// ============================================================

const CONFIG = {
  quick: {
    samples: 10,
    tests: ['exp1_glyph_microbench', 'exp_latency']
  },
  standard: {
    samples: 30,
    tests: null  // All tests
  },
  full: {
    samples: 100,
    tests: null
  }
};

// ============================================================
//  PARSE ARGUMENTS
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: 'standard',
    tests: null,
    adapters: null,
    verbose: false,
    saveReport: true
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--quick':
        options.mode = 'quick';
        break;
      case '--full':
        options.mode = 'full';
        break;
      case '--test':
        options.tests = args[++i]?.split(',');
        break;
      case '--adapter':
        options.adapters = args[++i]?.split(',');
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--no-save':
        options.saveReport = false;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
ORBOS Benchmark Runner

Usage:
  node benchmark/run.js [options]

Options:
  --quick           Quick run with fewer samples (10 per test)
  --full            Full run with maximum samples (100 per test)
  --test <tests>    Run specific tests (comma-separated)
  --adapter <names> Run specific adapters (comma-separated)
  --verbose, -v     Verbose output
  --no-save         Don't save report to file
  --help, -h        Show this help

Available Tests:
  exp1_glyph_microbench
  exp2_cross_domain_one_shot
  exp3_recursive_improvement
  exp4_multi_agent_coordination
  exp5_hallucination_adversarial
  exp6_tool_use
  exp_latency

Available Adapters:
  ORBOS, GPT, Claude, Baseline
`);
}

// ============================================================
//  MAIN RUNNER
// ============================================================

async function runBenchmarks(options = {}) {
  console.log(BANNER);

  const config = CONFIG[options.mode] || CONFIG.standard;
  const startTime = Date.now();

  // Initialize orchestrator
  const orchestrator = new BenchmarkOrchestrator();

  // Register adapters
  console.log('\n📌 Registering adapters...\n');

  const adapters = {
    ORBOS: new ORBOSAdapter({ useGlyphs: true }),
    GPT: new GPTAdapter({ model: 'gpt-4' }),
    Claude: new ClaudeAdapter({ model: 'claude-3-opus' }),
    Baseline: new BaselineAdapter()
  };

  const adaptersToUse = options.adapters || ['ORBOS', 'GPT', 'Claude', 'Baseline'];

  for (const name of adaptersToUse) {
    if (adapters[name]) {
      await adapters[name].initialize();
      orchestrator.registerAdapter(name, adapters[name]);
    }
  }

  // Register tests
  console.log('\n📋 Registering tests...\n');

  const testsToRun = options.tests
    ? ALL_TESTS.filter(t => options.tests.some(id => t.id.includes(id)))
    : (config.tests ? ALL_TESTS.filter(t => config.tests.includes(t.id)) : ALL_TESTS);

  for (const test of testsToRun) {
    // Apply sample count from config
    const testWithSamples = {
      ...test,
      samples: config.samples || test.samples
    };
    orchestrator.registerTest(testWithSamples);
  }

  // Run benchmarks
  console.log('\n' + '═'.repeat(78));
  console.log('                         RUNNING BENCHMARKS');
  console.log('═'.repeat(78) + '\n');

  const results = await orchestrator.runAll(adaptersToUse);

  // Print summary
  orchestrator.printSummary();

  // Save report
  if (options.saveReport) {
    const reportPath = await orchestrator.saveReport();
    console.log(`\n📁 Full report saved: ${reportPath}`);
  }

  // Print timing
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱️  Total runtime: ${totalTime}s\n`);

  // Return results for programmatic use
  return {
    results,
    report: orchestrator.generateReport(),
    timing: totalTime
  };
}

// ============================================================
//  COMPARISON REPORT
// ============================================================

async function generateComparisonReport(results) {
  const scorer = new CompositeScorer();
  const report = [];

  const adapters = Object.keys(results);

  // Pairwise comparisons
  for (let i = 0; i < adapters.length; i++) {
    for (let j = i + 1; j < adapters.length; j++) {
      const adapter1 = adapters[i];
      const adapter2 = adapters[j];

      console.log(`\n📊 Comparison: ${adapter1} vs ${adapter2}`);
      console.log('─'.repeat(50));

      for (const testId of Object.keys(results[adapter1])) {
        const result1 = results[adapter1][testId];
        const result2 = results[adapter2][testId];

        if (!result1?.stats?.score || !result2?.stats?.score) continue;

        const score1 = result1.stats.score.mean;
        const score2 = result2.stats.score.mean;
        const winner = score1 > score2 ? adapter1 : score2 > score1 ? adapter2 : 'tie';
        const effectSize = Statistics.cohensD(
          result1.samples.map(s => s.score).filter(s => s != null),
          result2.samples.map(s => s.score).filter(s => s != null)
        );

        console.log(`  ${testId.padEnd(35)} ${winner.padEnd(10)} (d=${effectSize.toFixed(2)})`);

        report.push({
          test: testId,
          adapter1,
          adapter2,
          score1,
          score2,
          winner,
          effectSize,
          effectInterpretation: Statistics.interpretEffectSize(effectSize)
        });
      }
    }
  }

  return report;
}

// ============================================================
//  CLI EXECUTION
// ============================================================

async function main() {
  const options = parseArgs();

  try {
    const { results, report, timing } = await runBenchmarks(options);

    // Generate comparison report
    console.log('\n' + '═'.repeat(78));
    console.log('                       PAIRWISE COMPARISONS');
    console.log('═'.repeat(78));

    await generateComparisonReport(results);

    // Final summary
    console.log('\n' + '═'.repeat(78));
    console.log('                         BENCHMARK COMPLETE');
    console.log('═'.repeat(78));

    // Show AGI scores
    console.log('\n🎯 AGI ADJACENCY SCORES:\n');
    for (const [adapter, score] of Object.entries(report.agiScores)) {
      const bar = '█'.repeat(Math.floor(score / 2)).padEnd(50, '░');
      console.log(`  ${adapter.padEnd(10)} ${bar} ${score.toFixed(1)}/100`);
    }

    console.log('\n✅ All benchmarks completed successfully.\n');

  } catch (error) {
    console.error('\n❌ Benchmark failed:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for programmatic use
module.exports = {
  runBenchmarks,
  generateComparisonReport,
  CONFIG
};
