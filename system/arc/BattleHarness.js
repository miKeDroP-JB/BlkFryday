/**
 * 0RB SYSTEM - BATTLE HARNESS
 * Comprehensive ARC-AGI stress testing framework
 *
 * Features:
 * - Full dataset evaluation
 * - Per-task metrics & logging
 * - Failure clustering & analysis
 * - Performance tracking
 * - Explainable programs
 *
 * THE SIMULATION TESTS ITSELF
 */

const fs = require('fs');
const path = require('path');
const Grid = require('./Primitives');
const AbstractionEngine = require('./AbstractionEngine');

// Try BulkLoader first (more reliable), fallback to DataLoader
let DataLoader;
try {
  DataLoader = require('./BulkLoader');
} catch (e) {
  DataLoader = require('./DataLoader');
}

class BattleHarness {
  constructor(options = {}) {
    this.engine = new AbstractionEngine();
    this.loader = new DataLoader();
    this.options = {
      outputDir: options.outputDir || path.join(__dirname, 'results'),
      verbose: options.verbose || false,
      saveFailures: options.saveFailures !== false,
      ...options
    };

    this.metrics = {
      total: 0,
      passed: 0,
      failed: 0,
      totalTestCases: 0,
      passedTestCases: 0,
      startTime: null,
      endTime: null,
      runtimes: [],
      strategyUsage: {},
      failureClusters: {},
      results: []
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // CORE EVALUATION
  // ═══════════════════════════════════════════════════════════════

  async run(options = {}) {
    const {
      sample = null,
      category = null,
      taskIds = null,
      batchSize = 50
    } = options;

    // Load data - try remote first, fallback to local RealTasks
    console.log('Loading ARC dataset...');
    try {
      await this.loader.load({ useCache: true, extended: true });
    } catch (e) {
      console.log('Remote load failed, using local tasks...');
    }

    // Select tasks - use local RealTasks if remote failed
    let tasks = this.loader.tasks;
    if (!tasks || tasks.length === 0) {
      console.log('Using local RealTasks dataset...');
      const { REAL_ARC_TASKS } = require('./RealTasks');
      tasks = REAL_ARC_TASKS;
    }

    if (taskIds) {
      tasks = taskIds.map(id => this.loader.getTask(id)).filter(Boolean);
    } else if (category) {
      tasks = this.loader.getByCategory(category);
    }

    if (sample) {
      tasks = tasks.sort(() => Math.random() - 0.5).slice(0, sample);
    }

    console.log(`\nRunning evaluation on ${tasks.length} tasks...\n`);

    this.metrics.startTime = Date.now();
    this.metrics.total = tasks.length;

    // Ensure output dir exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    // Run in batches
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      await this.runBatch(batch, i);

      // Progress report
      const pct = ((i + batch.length) / tasks.length * 100).toFixed(1);
      const passRate = (this.metrics.passedTestCases / Math.max(1, this.metrics.totalTestCases) * 100).toFixed(1);
      console.log(`\n[${pct}%] Processed ${i + batch.length}/${tasks.length} | Current pass rate: ${passRate}%\n`);
    }

    this.metrics.endTime = Date.now();

    // Generate reports
    this.generateReport();
    this.saveResults();

    return this.metrics;
  }

  async runBatch(tasks, offset) {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const globalIdx = offset + i + 1;

      try {
        const result = this.evaluateTask(task);
        this.metrics.results.push(result);

        // Update metrics
        this.metrics.totalTestCases += result.testCases;
        this.metrics.passedTestCases += result.passedCases;

        if (result.allPassed) {
          this.metrics.passed++;
        } else {
          this.metrics.failed++;
          this.clusterFailure(result);
        }

        // Track strategy usage
        if (result.strategy) {
          this.metrics.strategyUsage[result.strategy] =
            (this.metrics.strategyUsage[result.strategy] || 0) + 1;
        }

        // Track runtime
        this.metrics.runtimes.push(result.runtime);

        // Output progress
        const status = result.allPassed ? '✓' : '✗';
        if (this.options.verbose || !result.allPassed) {
          console.log(`${status} [${globalIdx}] ${task.id} | ${result.strategy} | ${result.runtime}ms`);
        }
      } catch (e) {
        console.error(`ERROR [${globalIdx}] ${task.id}: ${e.message}`);
        this.metrics.failed++;
        this.metrics.results.push({
          taskId: task.id,
          error: e.message,
          allPassed: false
        });
      }
    }
  }

  evaluateTask(task) {
    const startTime = Date.now();

    // Run solver
    const solution = this.engine.solve(task);

    const runtime = Date.now() - startTime;

    // Evaluate each test case
    const testResults = [];
    let passedCases = 0;

    for (let i = 0; i < task.test.length; i++) {
      const expected = task.test[i].output;
      const predicted = solution.predictions[i];

      const correct = Grid.equals(predicted, expected);
      if (correct) passedCases++;

      testResults.push({
        index: i,
        correct,
        expected,
        predicted,
        similarity: correct ? 1.0 : this.computeSimilarity(expected, predicted)
      });
    }

    return {
      taskId: task.id,
      category: task.category,
      strategy: solution.strategy,
      confidence: solution.confidence,
      program: solution.program || null,
      runtime,
      testCases: task.test.length,
      passedCases,
      allPassed: passedCases === task.test.length,
      testResults,
      analysis: this.analyzeTask(task)
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // ANALYSIS & METRICS
  // ═══════════════════════════════════════════════════════════════

  analyzeTask(task) {
    const train = task.train[0];
    const inDim = Grid.dimensions(train.input);
    const outDim = Grid.dimensions(train.output);

    return {
      inputSize: `${inDim.width}x${inDim.height}`,
      outputSize: `${outDim.width}x${outDim.height}`,
      sizeChange: this.getSizeChange(inDim, outDim),
      inputColors: Grid.getNonZeroColors(train.input).length,
      outputColors: Grid.getNonZeroColors(train.output).length,
      complexity: this.estimateComplexity(task)
    };
  }

  getSizeChange(inDim, outDim) {
    if (inDim.width === outDim.width && inDim.height === outDim.height) return 'same';
    if (outDim.width < inDim.width || outDim.height < inDim.height) return 'shrink';
    if (outDim.width > inDim.width || outDim.height > inDim.height) return 'grow';
    return 'change';
  }

  estimateComplexity(task) {
    const train = task.train[0];
    const inSize = train.input.length * (train.input[0]?.length || 0);
    const outSize = train.output.length * (train.output[0]?.length || 0);
    const colorCount = Grid.getNonZeroColors(train.input).length;
    const numExamples = task.train.length;

    // Simple heuristic
    return Math.round((inSize + outSize) * colorCount / numExamples);
  }

  computeSimilarity(expected, predicted) {
    if (!expected || !predicted) return 0;
    if (expected.length !== predicted.length) return 0;

    let matches = 0;
    let total = 0;

    for (let i = 0; i < expected.length; i++) {
      if (!expected[i] || !predicted[i]) continue;
      if (expected[i].length !== predicted[i].length) return 0;

      for (let j = 0; j < expected[i].length; j++) {
        total++;
        if (expected[i][j] === predicted[i][j]) matches++;
      }
    }

    return total > 0 ? matches / total : 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // FAILURE CLUSTERING
  // ═══════════════════════════════════════════════════════════════

  clusterFailure(result) {
    // Generate cluster signature based on failure characteristics
    const signature = this.getFailureSignature(result);

    if (!this.metrics.failureClusters[signature]) {
      this.metrics.failureClusters[signature] = {
        count: 0,
        tasks: [],
        description: this.describeCluster(signature)
      };
    }

    this.metrics.failureClusters[signature].count++;
    this.metrics.failureClusters[signature].tasks.push(result.taskId);
  }

  getFailureSignature(result) {
    const parts = [];

    // Size change
    parts.push(`size:${result.analysis?.sizeChange || 'unknown'}`);

    // Color count
    const colors = result.analysis?.inputColors || 0;
    if (colors <= 2) parts.push('colors:few');
    else if (colors <= 4) parts.push('colors:medium');
    else parts.push('colors:many');

    // Strategy attempted
    parts.push(`strat:${result.strategy || 'none'}`);

    // Similarity (how close we got)
    const avgSim = result.testResults
      .reduce((sum, r) => sum + (r.similarity || 0), 0) / result.testResults.length;

    if (avgSim >= 0.8) parts.push('sim:high');
    else if (avgSim >= 0.5) parts.push('sim:medium');
    else if (avgSim >= 0.2) parts.push('sim:low');
    else parts.push('sim:none');

    return parts.join('|');
  }

  describeCluster(signature) {
    const parts = signature.split('|');
    const descriptions = [];

    for (const part of parts) {
      const [key, val] = part.split(':');
      switch (key) {
        case 'size':
          descriptions.push(`Output ${val}s relative to input`);
          break;
        case 'colors':
          descriptions.push(`${val} color count`);
          break;
        case 'strat':
          descriptions.push(`Tried ${val} strategy`);
          break;
        case 'sim':
          descriptions.push(`${val} similarity to expected`);
          break;
      }
    }

    return descriptions.join(', ');
  }

  // ═══════════════════════════════════════════════════════════════
  // REPORTING
  // ═══════════════════════════════════════════════════════════════

  generateReport() {
    const totalTime = this.metrics.endTime - this.metrics.startTime;
    const avgRuntime = this.metrics.runtimes.reduce((a, b) => a + b, 0) / this.metrics.runtimes.length;
    const passRate = (this.metrics.passedTestCases / this.metrics.totalTestCases * 100).toFixed(2);
    const taskPassRate = (this.metrics.passed / this.metrics.total * 100).toFixed(2);

    console.log('\n' + '═'.repeat(70));
    console.log('                    0RB SYSTEM - BATTLE REPORT');
    console.log('═'.repeat(70));

    console.log(`
OVERALL METRICS
───────────────────────────────────────────────────────────────────────
Tasks Evaluated:     ${this.metrics.total}
Tasks Passed:        ${this.metrics.passed} (${taskPassRate}%)
Tasks Failed:        ${this.metrics.failed}

Test Cases Total:    ${this.metrics.totalTestCases}
Test Cases Passed:   ${this.metrics.passedTestCases} (${passRate}%)

Total Runtime:       ${(totalTime / 1000).toFixed(2)}s
Avg Task Runtime:    ${avgRuntime.toFixed(2)}ms
Min Runtime:         ${Math.min(...this.metrics.runtimes)}ms
Max Runtime:         ${Math.max(...this.metrics.runtimes)}ms
`);

    // Strategy usage
    console.log('STRATEGY USAGE');
    console.log('───────────────────────────────────────────────────────────────────────');
    const sortedStrategies = Object.entries(this.metrics.strategyUsage)
      .sort((a, b) => b[1] - a[1]);
    for (const [strat, count] of sortedStrategies) {
      const pct = (count / this.metrics.total * 100).toFixed(1);
      console.log(`  ${strat.padEnd(30)} ${count.toString().padStart(4)} (${pct}%)`);
    }

    // Failure clusters
    console.log('\nFAILURE CLUSTERS (Top 10)');
    console.log('───────────────────────────────────────────────────────────────────────');
    const sortedClusters = Object.entries(this.metrics.failureClusters)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    for (const [sig, cluster] of sortedClusters) {
      console.log(`\n  [${cluster.count} tasks] ${cluster.description}`);
      console.log(`    Tasks: ${cluster.tasks.slice(0, 5).join(', ')}${cluster.tasks.length > 5 ? '...' : ''}`);
    }

    console.log('\n' + '═'.repeat(70));

    // Benchmark comparison
    console.log(`
BENCHMARK COMPARISON
───────────────────────────────────────────────────────────────────────
0RB System:          ${passRate}%
GPT-4:               ~5%
Claude 3.5 Sonnet:   ~21%
ARC Prize 2024:      55.5%
OpenAI o3:           87.5%
Human Average:       ~85%
───────────────────────────────────────────────────────────────────────
`);

    if (parseFloat(passRate) > 55.5) {
      console.log('🔥 BEATING ARC PRIZE 2024 WINNER!');
    }
    if (parseFloat(passRate) > 87.5) {
      console.log('⚡ SURPASSING OPENAI O3!');
    }
    if (parseFloat(passRate) > 85) {
      console.log('🧠 EXCEEDING HUMAN AVERAGE!');
    }

    console.log('═'.repeat(70) + '\n');
  }

  saveResults() {
    const resultsFile = path.join(this.options.outputDir, 'battle_results.json');
    const summaryFile = path.join(this.options.outputDir, 'summary.json');

    // Save full results
    fs.writeFileSync(resultsFile, JSON.stringify(this.metrics.results, null, 2));

    // Save summary
    const summary = {
      timestamp: new Date().toISOString(),
      total: this.metrics.total,
      passed: this.metrics.passed,
      failed: this.metrics.failed,
      passRate: this.metrics.passedTestCases / this.metrics.totalTestCases,
      avgRuntime: this.metrics.runtimes.reduce((a, b) => a + b, 0) / this.metrics.runtimes.length,
      strategyUsage: this.metrics.strategyUsage,
      failureClusters: Object.fromEntries(
        Object.entries(this.metrics.failureClusters)
          .map(([k, v]) => [k, { count: v.count, tasks: v.tasks }])
      )
    };

    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

    console.log(`Results saved to ${this.options.outputDir}/`);

    // Save failure details if requested
    if (this.options.saveFailures) {
      const failuresDir = path.join(this.options.outputDir, 'failures');
      if (!fs.existsSync(failuresDir)) {
        fs.mkdirSync(failuresDir, { recursive: true });
      }

      const failures = this.metrics.results.filter(r => !r.allPassed);
      for (const failure of failures) {
        const failFile = path.join(failuresDir, `${failure.taskId}.json`);
        fs.writeFileSync(failFile, JSON.stringify(failure, null, 2));
      }

      console.log(`Failure details saved to ${failuresDir}/`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════

  getTopFailures(n = 10) {
    return this.metrics.results
      .filter(r => !r.allPassed)
      .sort((a, b) => (b.testResults[0]?.similarity || 0) - (a.testResults[0]?.similarity || 0))
      .slice(0, n);
  }

  getFailuresByCluster(signature) {
    const cluster = this.metrics.failureClusters[signature];
    if (!cluster) return [];
    return cluster.tasks.map(id => this.metrics.results.find(r => r.taskId === id));
  }
}

module.exports = BattleHarness;

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  const options = {
    sample: null,
    category: null,
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  // Parse arguments
  if (args.includes('--sample')) {
    options.sample = parseInt(args[args.indexOf('--sample') + 1]) || 50;
  }

  if (args.includes('--training')) {
    options.category = 'training';
  }

  if (args.includes('--evaluation')) {
    options.category = 'evaluation';
  }

  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║           0RB SYSTEM - BATTLE HARNESS ACTIVATED                       ║
║                   THE SIMULATION TESTS ITSELF                         ║
╚═══════════════════════════════════════════════════════════════════════╝
`);

  const harness = new BattleHarness({ verbose: options.verbose });
  harness.run(options).then(() => {
    console.log('Battle complete.');
  }).catch(console.error);
}
