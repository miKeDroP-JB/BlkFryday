#!/usr/bin/env node
/**
 * INFINITE STRATEGY GENERATOR - MASTER RUNNER
 * ═══════════════════════════════════════════════════════════════════
 * Orchestrates the entire system:
 * - InfiniteStrategyGenerator for puzzle solving
 * - ORBBrain for task orchestration
 * - Agent Army for monetization
 *
 * Usage:
 *   node run_infinite.js [mode] [options]
 *
 * Modes:
 *   generate   - Generate strategies continuously
 *   solve      - Solve tasks from queue
 *   benchmark  - Run performance benchmark
 *   status     - Show system status
 * ═══════════════════════════════════════════════════════════════════
 */

const { InfiniteStrategyGenerator, StrategyMonetizer } = require('./system/InfiniteStrategyGenerator');
const ORBBrain = require('./agents/0rb_brain');

const VERSION = '1.0.0';
const BANNER = `
 ██╗███╗   ██╗███████╗██╗███╗   ██╗██╗████████╗███████╗
 ██║████╗  ██║██╔════╝██║████╗  ██║██║╚══██╔══╝██╔════╝
 ██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║██║   ██║   █████╗
 ██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║██║   ██║   ██╔══╝
 ██║██║ ╚████║██║     ██║██║ ╚████║██║   ██║   ███████╗
 ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚══════╝
 STRATEGY GENERATOR v${VERSION}
`;

// ═══════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════

class InfiniteOrchestrator {
  constructor(config = {}) {
    this.config = {
      verbose: config.verbose !== false,
      maxTasks: config.maxTasks || 100,
      timeoutMs: config.timeoutMs || 300000, // 5 min default
      ...config
    };

    // Core components
    this.generator = new InfiniteStrategyGenerator({
      verbose: this.config.verbose,
      taskTimeoutMs: this.config.timeoutMs,
      maxConcurrent: 4
    });

    this.brain = new ORBBrain();
    this.monetizer = new StrategyMonetizer(this.generator);

    // Event listeners
    this.setupEvents();
  }

  setupEvents() {
    this.generator.on('started', () => {
      if (this.config.verbose) console.log('[ORCHESTRATOR] Generator started');
    });

    this.generator.on('taskSolved', (event) => {
      if (this.config.verbose) {
        console.log(`[SOLVED] ${event.id} via ${event.strategy} (depth: ${event.depth})`);
      }

      // Queue monetization task
      this.brain.addTask({
        agent: 'apollo', // Revenue agent
        type: 'monetize_strategy',
        data: event
      });
    });

    this.generator.on('completed', (event) => {
      if (this.config.verbose) {
        console.log('\n[ORCHESTRATOR] Generation complete');
        console.log(`  Tasks: ${event.stats.tasksProcessed}`);
        console.log(`  Solved: ${event.stats.tasksSolved}`);
        console.log(`  Time: ${event.stats.totalTimeMs}ms`);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Mode: Generate Strategies
  // ─────────────────────────────────────────────────────────────

  async runGenerate(count = 10000) {
    console.log(`\n[GENERATE] Creating ${count} strategies...`);

    const startTime = Date.now();
    const strategies = this.generator.generateStrategyBatch(count);

    console.log(`[GENERATE] Generated ${strategies.length} strategies in ${Date.now() - startTime}ms`);
    console.log(`[GENERATE] Depth range: 1-${Math.max(...strategies.map(s => s.depth))}`);

    return strategies;
  }

  // ─────────────────────────────────────────────────────────────
  // Mode: Solve Tasks
  // ─────────────────────────────────────────────────────────────

  async runSolve(tasks) {
    console.log(`\n[SOLVE] Processing ${tasks.length} tasks...`);

    // Add all tasks
    for (const task of tasks) {
      this.generator.addTask(task);
    }

    // Run generator
    const result = await this.generator.start();

    // Dispatch any queued brain tasks (monetization, etc)
    if (this.brain.taskQueue.length > 0) {
      console.log(`\n[BRAIN] Processing ${this.brain.taskQueue.length} follow-up tasks...`);
      this.brain.dispatch();
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // Mode: Benchmark
  // ─────────────────────────────────────────────────────────────

  async runBenchmark() {
    console.log('\n[BENCHMARK] Running performance tests...\n');

    const results = {};

    // Test 1: Strategy generation speed
    console.log('1. Strategy Generation Speed');
    const genStart = Date.now();
    let genCount = 0;
    for (const _ of this.generator.generateStrategies(100000)) {
      genCount++;
    }
    const genTime = Date.now() - genStart;
    results.generation = {
      count: genCount,
      timeMs: genTime,
      perSecond: Math.round(genCount / (genTime / 1000))
    };
    console.log(`   ${results.generation.perSecond.toLocaleString()} strategies/sec`);

    // Test 2: Simple task solving
    console.log('\n2. Simple Task Solving');
    const simpleTasks = this.generateTestTasks('simple', 10);
    const simpleStart = Date.now();

    this.generator.reset();
    for (const task of simpleTasks) {
      this.generator.addTask(task);
    }
    const simpleResult = await this.generator.start();
    const simpleTime = Date.now() - simpleStart;

    results.simpleSolve = {
      tasks: simpleTasks.length,
      solved: simpleResult.stats.tasksSolved,
      timeMs: simpleTime,
      avgTimeMs: Math.round(simpleTime / simpleTasks.length)
    };
    console.log(`   Solved ${results.simpleSolve.solved}/${simpleTasks.length} in ${simpleTime}ms`);

    // Test 3: Cache efficiency
    console.log('\n3. Cache Efficiency');
    this.generator.reset();

    // Add same tasks twice
    for (const task of simpleTasks) {
      this.generator.addTask(task);
    }
    await this.generator.start();

    // Second run should hit cache
    for (const task of simpleTasks) {
      this.generator.addTask(task);
    }
    const cacheStart = Date.now();
    await this.generator.start();
    const cacheTime = Date.now() - cacheStart;

    const cacheStats = this.generator.cache.getStats();
    results.cache = {
      hitRate: (cacheStats.hitRate * 100).toFixed(1) + '%',
      hits: cacheStats.hits,
      timeMs: cacheTime
    };
    console.log(`   Hit rate: ${results.cache.hitRate}`);

    // Test 4: Memory usage
    console.log('\n4. Memory Usage');
    const memUsage = process.memoryUsage();
    results.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
    };
    console.log(`   Heap: ${results.memory.heapUsed} / ${results.memory.heapTotal}`);

    console.log('\n' + '═'.repeat(50));
    console.log('BENCHMARK COMPLETE');
    console.log('═'.repeat(50));

    return results;
  }

  generateTestTasks(type, count) {
    const tasks = [];

    for (let i = 0; i < count; i++) {
      if (type === 'simple') {
        // Simple flip task
        tasks.push({
          id: `test_${type}_${i}`,
          train: [
            {
              input: [[1, 2], [3, 4]],
              output: [[2, 1], [4, 3]]
            },
            {
              input: [[5, 6], [7, 8]],
              output: [[6, 5], [8, 7]]
            }
          ],
          test: [
            {
              input: [[9, 0], [1, 2]],
              output: [[0, 9], [2, 1]]
            }
          ]
        });
      }
    }

    return tasks;
  }

  // ─────────────────────────────────────────────────────────────
  // Mode: Status
  // ─────────────────────────────────────────────────────────────

  getStatus() {
    return {
      generator: this.generator.getStats(),
      brain: this.brain.getStatus(),
      monetizer: this.monetizer.getReport()
    };
  }

  printStatus() {
    const status = this.getStatus();

    console.log('\n' + '═'.repeat(50));
    console.log('SYSTEM STATUS');
    console.log('═'.repeat(50));

    console.log('\nGenerator:');
    console.log(`  Running: ${status.generator.running}`);
    console.log(`  Tasks processed: ${status.generator.tasksProcessed}`);
    console.log(`  Tasks solved: ${status.generator.tasksSolved}`);
    console.log(`  Solve rate: ${(status.generator.solveRate * 100).toFixed(1)}%`);
    console.log(`  Cache hits: ${status.generator.cacheHits}`);

    console.log('\nBrain:');
    console.log(`  Queued: ${status.brain.queued}`);
    console.log(`  Completed: ${status.brain.completed}`);
    console.log(`  Failed: ${status.brain.failed}`);
    console.log(`  Agents: ${status.brain.agents.join(', ')}`);

    console.log('\nMonetizer:');
    console.log(`  Total revenue: $${status.monetizer.totalRevenue.toFixed(2)}`);
    console.log(`  Opportunities: ${status.monetizer.opportunitiesFound}`);
    console.log(`  Monetized: ${status.monetizer.opportunitiesMonetized}`);

    console.log('\n' + '═'.repeat(50));

    return status;
  }
}

// ═══════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'status';

  console.log(BANNER);

  const orchestrator = new InfiniteOrchestrator({
    verbose: !args.includes('--quiet')
  });

  switch (mode) {
    case 'generate': {
      const count = parseInt(args[1]) || 10000;
      await orchestrator.runGenerate(count);
      break;
    }

    case 'benchmark':
      await orchestrator.runBenchmark();
      break;

    case 'solve': {
      // Demo solve with test tasks
      const tasks = orchestrator.generateTestTasks('simple', 5);
      await orchestrator.runSolve(tasks);
      break;
    }

    case 'status':
    default:
      orchestrator.printStatus();
      break;
  }

  // Final status
  console.log('\n[COMPLETE]');
  process.exit(0);
}

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('[ERROR]', err.message);
    process.exit(1);
  });
}

module.exports = { InfiniteOrchestrator };
