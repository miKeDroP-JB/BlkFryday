#!/usr/bin/env node

/**
 * ARC TASK RUNNER v3 — FULL EXPLAINABILITY SUITE
 * ═══════════════════════════════════════════════════════════════════
 * Run tasks through the Meta Horizon engine with full analysis.
 *
 * Usage:
 *   node run_all_v3.js                    # Run all tasks
 *   node run_all_v3.js --task=task1.json  # Run specific task
 *   node run_all_v3.js --explain          # Show detailed explanations
 *   node run_all_v3.js --ablation         # Run ablation tests
 *   node run_all_v3.js --report           # Generate full report
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { UnlimitedSolverV3, VERSION, CODENAME, HypothesisOntology } = require('./UnlimitedSolverV3');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  taskDir: path.join(__dirname, 'tasks'),
  timeout: 60000,
  verbose: false,
  explain: false,
  ablation: false,
  generateReport: false,
  specificTask: null,
  maxComplexity: 14
};

function parseArgs() {
  const config = { ...DEFAULT_CONFIG };
  const args = process.argv.slice(2);

  for (const arg of args) {
    if (arg.startsWith('--task=')) {
      config.specificTask = arg.split('=')[1];
    } else if (arg.startsWith('--dir=')) {
      config.taskDir = arg.split('=')[1];
    } else if (arg.startsWith('--timeout=')) {
      config.timeout = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--complexity=')) {
      config.maxComplexity = parseInt(arg.split('=')[1]);
    } else if (arg === '--verbose' || arg === '-v') {
      config.verbose = true;
    } else if (arg === '--explain' || arg === '-e') {
      config.explain = true;
    } else if (arg === '--ablation' || arg === '-a') {
      config.ablation = true;
    } else if (arg === '--report' || arg === '-r') {
      config.generateReport = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  return config;
}

function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║              ARC TASK RUNNER v3 — META HORIZON                     ║
╚════════════════════════════════════════════════════════════════════╝

Usage: node run_all_v3.js [options]

Options:
  --task=<file>       Run a specific task file
  --dir=<path>        Directory containing task JSON files
  --timeout=<ms>      Timeout per task in milliseconds (default: 60000)
  --complexity=<n>    Max complexity sum to explore (default: 14)
  --verbose, -v       Show detailed output for each task
  --explain, -e       Show strategy explanations
  --ablation, -a      Run ablation tests
  --report, -r        Generate detailed JSON report
  --help, -h          Show this help message

Examples:
  node run_all_v3.js --explain            # Show explanations
  node run_all_v3.js --ablation --report  # Full analysis
  node run_all_v3.js --complexity=21      # Deep search

v3 Features:
  • 7-dimensional complexity space
  • 45+ hypothesis classes in 7 hierarchies
  • 6-stage validation pipeline
  • 7-layer cognitive memory
  • Full explainability
`);
}

// ═══════════════════════════════════════════════════════════════════
// TASK LOADING
// ═══════════════════════════════════════════════════════════════════

function loadTasks(config) {
  const tasks = [];

  if (config.specificTask) {
    const taskPath = path.isAbsolute(config.specificTask)
      ? config.specificTask
      : path.join(config.taskDir, config.specificTask);

    if (fs.existsSync(taskPath)) {
      const content = fs.readFileSync(taskPath, 'utf8');
      tasks.push({
        id: path.basename(taskPath, '.json'),
        path: taskPath,
        data: JSON.parse(content)
      });
    } else {
      console.error(`Task file not found: ${taskPath}`);
      process.exit(1);
    }
  } else {
    if (!fs.existsSync(config.taskDir)) {
      console.log(`Task directory not found: ${config.taskDir}`);
      console.log('Using tasks from v2 directory...');
      config.taskDir = path.join(__dirname, 'tasks');
    }

    if (fs.existsSync(config.taskDir)) {
      const files = fs.readdirSync(config.taskDir)
        .filter(f => f.endsWith('.json'))
        .sort();

      for (const file of files) {
        const taskPath = path.join(config.taskDir, file);
        try {
          const content = fs.readFileSync(taskPath, 'utf8');
          tasks.push({
            id: path.basename(file, '.json'),
            path: taskPath,
            data: JSON.parse(content)
          });
        } catch (e) {
          console.warn(`Warning: Could not load ${file}: ${e.message}`);
        }
      }
    }
  }

  return tasks;
}

// ═══════════════════════════════════════════════════════════════════
// RUNNER v3
// ═══════════════════════════════════════════════════════════════════

class TaskRunnerV3 {
  constructor(config) {
    this.config = config;
    this.results = [];
    this.startTime = null;
    this.endTime = null;
    this.ablationResults = [];
  }

  async run(tasks) {
    this.startTime = Date.now();
    this.printHeader(tasks.length);

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const result = await this.runTask(task, i + 1, tasks.length);
      this.results.push(result);
      this.printProgress(result, i + 1, tasks.length);

      if (this.config.explain && result.explanation) {
        this.printExplanation(result);
      }
    }

    this.endTime = Date.now();

    if (this.config.ablation) {
      await this.runAblationTests(tasks);
    }

    this.printSummary();
    this.printCapabilities();

    if (this.config.generateReport) {
      this.generateReport();
    }

    return this.results;
  }

  async runTask(task, current, total) {
    const solver = new UnlimitedSolverV3({
      maxTime: this.config.timeout,
      maxComplexity: this.config.maxComplexity,
      verbose: this.config.verbose
    });

    const startTime = Date.now();
    let result;
    let error = null;

    try {
      result = solver.solve(task.data);
    } catch (e) {
      error = e.message;
      result = { success: false, error: e.message };
    }

    const endTime = Date.now();

    return {
      taskId: task.id,
      path: task.path,
      success: result.success,
      timeMs: endTime - startTime,
      strategy: result.strategy || null,
      stats: result.stats || null,
      explanation: result.explanation || null,
      testResults: result.results || null,
      source: result.source || null,
      error
    };
  }

  async runAblationTests(tasks) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log('ABLATION TESTS');
    console.log(`${'─'.repeat(70)}\n`);

    const ontology = new HypothesisOntology();
    const hierarchies = Object.keys(ontology.hierarchies);

    for (const excludeHierarchy of hierarchies) {
      console.log(`Testing without ${excludeHierarchy}...`);

      let successes = 0;
      for (const task of tasks) {
        // Create solver that skips this hierarchy
        const solver = new UnlimitedSolverV3({
          maxTime: 10000, // Quick test
          maxComplexity: 10,
          verbose: false
        });

        // Temporarily remove hierarchy
        const removed = solver.ontology.hierarchies[excludeHierarchy];
        delete solver.ontology.hierarchies[excludeHierarchy];

        try {
          const result = solver.solve(task.data);
          if (result.success) successes++;
        } catch (e) {
          // Failed
        }

        // Restore
        solver.ontology.hierarchies[excludeHierarchy] = removed;
      }

      this.ablationResults.push({
        excludedHierarchy: excludeHierarchy,
        successCount: successes,
        totalTasks: tasks.length,
        successRate: (successes / tasks.length * 100).toFixed(1)
      });

      console.log(`  Without ${excludeHierarchy}: ${successes}/${tasks.length} (${(successes / tasks.length * 100).toFixed(1)}%)`);
    }
  }

  printHeader(taskCount) {
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║  ███╗   ███╗███████╗████████╗ █████╗     ██╗  ██╗ ██████╗ ██████╗ ██╗      ║
║  ████╗ ████║██╔════╝╚══██╔══╝██╔══██╗    ██║  ██║██╔═══██╗██╔══██╗██║      ║
║  ██╔████╔██║█████╗     ██║   ███████║    ███████║██║   ██║██████╔╝██║      ║
║  ██║╚██╔╝██║██╔══╝     ██║   ██╔══██║    ██╔══██║██║   ██║██╔══██╗██║      ║
║  ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║    ██║  ██║╚██████╔╝██║  ██║███████╗ ║
║  ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝ ║
║                                                                            ║
║              UNLIMITED SOLVER v${VERSION} — ${CODENAME}                          ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

Starting ARC Task Runner v3
${'─'.repeat(76)}
Tasks to run: ${taskCount}
Timeout per task: ${this.config.timeout}ms
Max complexity: ${this.config.maxComplexity}
${'─'.repeat(76)}
`);
  }

  printProgress(result, current, total) {
    const status = result.success ? '✓' : '✗';
    const color = result.success ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    const time = `${result.timeMs}ms`.padStart(8);

    let info = '';
    if (result.strategy) {
      const hierarchy = result.strategy.hierarchy || 'unknown';
      info = ` [${hierarchy}]`;
    } else if (result.error) {
      info = ` [${result.error.substring(0, 25)}...]`;
    }

    console.log(
      `${color}${status}${reset} [${current.toString().padStart(2)}/${total}] ` +
      `${result.taskId.padEnd(30)} ${time}${info}`
    );
  }

  printExplanation(result) {
    if (!result.explanation) return;

    console.log('\x1b[36m  └─ Explanation:\x1b[0m');
    console.log(`     ${result.explanation.summary}`);

    if (result.explanation.steps.length > 0) {
      console.log('     Steps:');
      for (const step of result.explanation.steps) {
        console.log(`       ${step.index}. ${step.description}`);
      }
    }

    if (result.explanation.patterns.length > 0) {
      console.log('     Patterns detected:');
      for (const pattern of result.explanation.patterns.slice(0, 3)) {
        console.log(`       • ${pattern}`);
      }
    }

    console.log(`     Confidence: ${(result.explanation.confidence * 100).toFixed(0)}%`);
    console.log('');
  }

  printSummary() {
    const totalTime = this.endTime - this.startTime;
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.length - successful;
    const successRate = ((successful / this.results.length) * 100).toFixed(1);

    const avgTime = this.results.length > 0
      ? (this.results.reduce((sum, r) => sum + r.timeMs, 0) / this.results.length).toFixed(0)
      : 0;

    // Analyze hierarchies used
    const hierarchyUsage = {};
    this.results.filter(r => r.strategy?.hierarchy).forEach(r => {
      const h = r.strategy.hierarchy;
      hierarchyUsage[h] = (hierarchyUsage[h] || 0) + 1;
    });

    // Analyze sources
    const sourceUsage = {};
    this.results.filter(r => r.source).forEach(r => {
      sourceUsage[r.source] = (sourceUsage[r.source] || 0) + 1;
    });

    console.log(`
${'═'.repeat(76)}
                                  SUMMARY
${'═'.repeat(76)}

Results:
  Successful:   ${successful.toString().padStart(3)} / ${this.results.length}
  Failed:       ${failed.toString().padStart(3)} / ${this.results.length}
  Success Rate: ${successRate}%

Timing:
  Total Time:   ${totalTime}ms
  Average Time: ${avgTime}ms per task

Hierarchy Usage:
${Object.entries(hierarchyUsage).map(([h, c]) => `  ${h.padEnd(20)} ${c} solutions`).join('\n') || '  (none)'}

Solution Sources:
${Object.entries(sourceUsage).map(([s, c]) => `  ${s.padEnd(20)} ${c}`).join('\n') || '  (none)'}

${'═'.repeat(76)}
`);

    if (this.ablationResults.length > 0) {
      console.log('Ablation Test Results:');
      console.log('─'.repeat(40));
      for (const ab of this.ablationResults) {
        console.log(`  Without ${ab.excludedHierarchy.padEnd(15)}: ${ab.successRate}%`);
      }
      console.log('');
    }

    if (failed > 0) {
      console.log('Failed Tasks:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.taskId}: ${r.error || 'No solution found'}`);
        });
      console.log('');
    }
  }

  printCapabilities() {
    const solver = new UnlimitedSolverV3({ verbose: false });
    const caps = solver.getCapabilities();

    console.log('Solver Capabilities:');
    console.log('─'.repeat(40));
    console.log(`  Version: ${caps.version} (${caps.codename})`);
    console.log(`  Hypothesis Classes: ${caps.hypothesisClasses}`);
    console.log(`  Hierarchies: ${caps.hierarchies.join(', ')}`);
    console.log(`  Validation Stages: ${caps.validationStages.length}`);
    console.log(`  Memory Layers: ${caps.memoryLayers.length}`);
    console.log('');
  }

  generateReport() {
    const report = {
      meta: {
        version: VERSION,
        codename: CODENAME,
        timestamp: new Date().toISOString(),
        config: this.config
      },
      summary: {
        totalTasks: this.results.length,
        successful: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
        totalTimeMs: this.endTime - this.startTime
      },
      hierarchyUsage: {},
      sourceUsage: {},
      tasks: this.results.map(r => ({
        id: r.taskId,
        success: r.success,
        timeMs: r.timeMs,
        strategy: r.strategy,
        explanation: r.explanation,
        stats: r.stats,
        error: r.error
      })),
      ablation: this.ablationResults
    };

    // Calculate usage stats
    this.results.filter(r => r.strategy?.hierarchy).forEach(r => {
      const h = r.strategy.hierarchy;
      report.hierarchyUsage[h] = (report.hierarchyUsage[h] || 0) + 1;
    });

    this.results.filter(r => r.source).forEach(r => {
      report.sourceUsage[r.source] = (report.sourceUsage[r.source] || 0) + 1;
    });

    const reportPath = path.join(
      __dirname,
      `report_v3_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report saved to: ${reportPath}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const config = parseArgs();
  const tasks = loadTasks(config);

  if (tasks.length === 0) {
    console.log('No tasks found to run.');
    process.exit(1);
  }

  const runner = new TaskRunnerV3(config);
  const results = await runner.run(tasks);

  const allPassed = results.every(r => r.success);
  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
