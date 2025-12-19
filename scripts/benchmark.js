#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  0RB BENCHMARK SUITE - Real metrics for real performance                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════════════════
// BENCHMARK UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

async function timeAsync(name, fn) {
  const start = process.hrtime.bigint();
  try {
    const result = await fn();
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    return { name, success: true, durationMs, result };
  } catch (error) {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    return { name, success: false, durationMs, error: error.message };
  }
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// ═══════════════════════════════════════════════════════════════════════════
// BENCHMARK SUITE
// ═══════════════════════════════════════════════════════════════════════════

class BenchmarkSuite {
  constructor() {
    this.results = [];
    this.startMemory = process.memoryUsage();
  }

  async run(name, fn) {
    console.log(`  Running: ${name}...`);
    const result = await timeAsync(name, fn);
    this.results.push(result);

    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${name}: ${formatDuration(result.durationMs)}`);

    return result;
  }

  getMemoryDelta() {
    const current = process.memoryUsage();
    return {
      heapUsed: current.heapUsed - this.startMemory.heapUsed,
      heapTotal: current.heapTotal - this.startMemory.heapTotal,
      rss: current.rss - this.startMemory.rss
    };
  }

  getSummary() {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    const totalTime = this.results.reduce((sum, r) => sum + r.durationMs, 0);
    const avgTime = totalTime / this.results.length;
    const memory = this.getMemoryDelta();

    return {
      total: this.results.length,
      successful: successful.length,
      failed: failed.length,
      totalTime: formatDuration(totalTime),
      avgTime: formatDuration(avgTime),
      memoryDelta: formatBytes(memory.heapUsed),
      results: this.results
    };
  }

  printSummary() {
    const summary = this.getSummary();

    console.log('\n' + '═'.repeat(60));
    console.log('BENCHMARK SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total Tests:     ${summary.total}`);
    console.log(`Successful:      ${summary.successful}`);
    console.log(`Failed:          ${summary.failed}`);
    console.log(`Total Time:      ${summary.totalTime}`);
    console.log(`Average Time:    ${summary.avgTime}`);
    console.log(`Memory Delta:    ${summary.memoryDelta}`);
    console.log('═'.repeat(60));

    if (summary.failed > 0) {
      console.log('\nFailed Tests:');
      summary.results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    }

    return summary;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CORE BENCHMARKS
// ═══════════════════════════════════════════════════════════════════════════

async function runCoreBenchmarks() {
  console.log('\n📊 CORE SYSTEM BENCHMARKS\n');

  const suite = new BenchmarkSuite();

  // Test: Module loading
  await suite.run('Module Import (cold)', async () => {
    delete require.cache[require.resolve('../core')];
    return require('../core');
  });

  await suite.run('Module Import (warm)', async () => {
    return require('../core');
  });

  // Test: ORB Core initialization
  const { createORB, AGENT_ARCHETYPES } = require('../core');

  await suite.run('ORB Core Initialization', async () => {
    const orb = await createORB({
      security: { enabled: false } // Faster init for benchmark
    });
    await orb.shutdown();
    return orb;
  });

  // Test: Agent spawning
  await suite.run('Agent Pool Creation', async () => {
    const orb = await createORB({ security: { enabled: false } });
    const pool = orb.agents;
    await orb.shutdown();
    return pool;
  });

  // Test: Archetype access
  await suite.run('Archetype Retrieval (all 7)', async () => {
    return Object.keys(AGENT_ARCHETYPES);
  });

  return suite.printSummary();
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY BENCHMARKS
// ═══════════════════════════════════════════════════════════════════════════

async function runUtilityBenchmarks() {
  console.log('\n📊 UTILITY BENCHMARKS\n');

  const suite = new BenchmarkSuite();
  const { utils } = require('../core');

  // Test: ID generation
  await suite.run('Generate 1000 IDs', async () => {
    const ids = [];
    for (let i = 0; i < 1000; i++) {
      ids.push(utils.generateId('test'));
    }
    return ids;
  });

  // Test: JSON parsing
  const testJSON = JSON.stringify({
    complex: {
      nested: {
        data: Array(100).fill({ key: 'value' })
      }
    }
  });

  await suite.run('Parse Complex JSON (1000x)', async () => {
    for (let i = 0; i < 1000; i++) {
      utils.parseJSON(testJSON, 'BENCH');
    }
  });

  // Test: String operations
  await suite.run('String Slugify (1000x)', async () => {
    for (let i = 0; i < 1000; i++) {
      utils.slugify('This Is A Test String With Multiple Words!');
    }
  });

  return suite.printSummary();
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTREACH BENCHMARKS
// ═══════════════════════════════════════════════════════════════════════════

async function runOutreachBenchmarks() {
  console.log('\n📊 OUTREACH ENGINE BENCHMARKS\n');

  const suite = new BenchmarkSuite();
  const { OutreachEngine, Prospect, Campaign, createEmailProvider } = require('../core');

  // Test: Engine initialization
  await suite.run('Outreach Engine Init', async () => {
    return new OutreachEngine();
  });

  const engine = new OutreachEngine();

  // Test: Prospect creation
  await suite.run('Create 100 Prospects', async () => {
    const prospects = [];
    for (let i = 0; i < 100; i++) {
      prospects.push(engine.addProspect({
        firstName: `Test${i}`,
        lastName: `User${i}`,
        email: `test${i}@example.com`,
        company: `Company ${i}`,
        industry: 'Tech'
      }));
    }
    return prospects;
  });

  // Test: Campaign creation
  await suite.run('Create Campaign with 50 Prospects', async () => {
    const campaign = engine.createCampaign({
      name: 'Benchmark Campaign',
      type: 'cold_outreach'
    });

    for (let i = 0; i < 50; i++) {
      campaign.addProspect({
        firstName: `Lead${i}`,
        email: `lead${i}@example.com`
      });
    }

    return campaign;
  });

  // Test: Message template rendering
  await suite.run('Render 100 Messages (no AI)', async () => {
    const prospect = new Prospect({
      firstName: 'John',
      lastName: 'Doe',
      company: 'Acme Inc',
      industry: 'SaaS'
    });

    const messages = [];
    for (let i = 0; i < 100; i++) {
      const msg = await engine.generateMessage('intro', 'email', prospect, {
        pain_point: 'manual data entry'
      });
      messages.push(msg);
    }
    return messages;
  });

  return suite.printSummary();
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY BENCHMARKS
// ═══════════════════════════════════════════════════════════════════════════

async function runMemoryBenchmarks() {
  console.log('\n📊 MEMORY BENCHMARKS\n');

  const formatMem = (mem) => ({
    heapUsed: formatBytes(mem.heapUsed),
    heapTotal: formatBytes(mem.heapTotal),
    rss: formatBytes(mem.rss)
  });

  console.log('Baseline memory:', formatMem(process.memoryUsage()));

  // Load core
  const core = require('../core');
  console.log('After core import:', formatMem(process.memoryUsage()));

  // Initialize ORB
  const orb = await core.createORB({ security: { enabled: false } });
  console.log('After ORB init:', formatMem(process.memoryUsage()));

  // Create 100 prospects
  const engine = new core.OutreachEngine();
  for (let i = 0; i < 100; i++) {
    engine.addProspect({ firstName: `Test${i}`, email: `test${i}@example.com` });
  }
  console.log('After 100 prospects:', formatMem(process.memoryUsage()));

  // Cleanup
  await orb.shutdown();
  global.gc && global.gc();

  console.log('After cleanup:', formatMem(process.memoryUsage()));
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    0RB SYSTEM BENCHMARK SUITE                             ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  const args = process.argv.slice(2);
  const benchmarks = args.length > 0 ? args : ['core', 'utility', 'outreach', 'memory'];

  const results = {};

  try {
    if (benchmarks.includes('core')) {
      results.core = await runCoreBenchmarks();
    }

    if (benchmarks.includes('utility')) {
      results.utility = await runUtilityBenchmarks();
    }

    if (benchmarks.includes('outreach')) {
      results.outreach = await runOutreachBenchmarks();
    }

    if (benchmarks.includes('memory')) {
      results.memory = await runMemoryBenchmarks();
    }

    // Save results
    const outputPath = path.join(__dirname, '../logs/benchmark-results.json');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(outputPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      node: process.version,
      platform: process.platform,
      results
    }, null, 2));

    console.log(`\n📁 Results saved to: ${outputPath}`);

  } catch (error) {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
  }

  console.log('\n✅ Benchmarks complete\n');
}

main();
