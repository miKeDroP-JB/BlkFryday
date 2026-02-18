#!/usr/bin/env node

/**
 * ARC TASK RUNNER - UNLIMITED SOLVER TEST SUITE
 * ═══════════════════════════════════════════════════════════════════
 * Run all 53 tasks through the infinite reasoning engine.
 *
 * Usage:
 *   node run_all.js                    # Run all tasks
 *   node run_all.js --task=task1.json  # Run specific task
 *   node run_all.js --dir=./tasks      # Specify task directory
 *   node run_all.js --timeout=60000    # Set timeout per task (ms)
 *   node run_all.js --verbose          # Show detailed output
 *   node run_all.js --report           # Generate detailed report
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { UnlimitedSolver, VERSION, CODENAME } = require('./UnlimitedSolver');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  taskDir: path.join(__dirname, 'tasks'),
  timeout: 60000, // 1 minute per task
  verbose: false,
  generateReport: false,
  specificTask: null
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
    } else if (arg === '--verbose' || arg === '-v') {
      config.verbose = true;
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
║                   ARC TASK RUNNER - HELP                           ║
╚════════════════════════════════════════════════════════════════════╝

Usage: node run_all.js [options]

Options:
  --task=<file>     Run a specific task file
  --dir=<path>      Directory containing task JSON files
  --timeout=<ms>    Timeout per task in milliseconds (default: 60000)
  --verbose, -v     Show detailed output for each task
  --report, -r      Generate detailed JSON report
  --help, -h        Show this help message

Examples:
  node run_all.js                           # Run all tasks
  node run_all.js --timeout=120000          # 2 min timeout per task
  node run_all.js --task=007bbfb7.json      # Run specific task
  node run_all.js --verbose --report        # Full output + report

Task Format (JSON):
  {
    "train": [
      { "input": [[...]], "output": [[...]] },
      ...
    ],
    "test": [
      { "input": [[...]], "output": [[...]] }
    ]
  }
`);
}

// ═══════════════════════════════════════════════════════════════════
// TASK LOADING
// ═══════════════════════════════════════════════════════════════════

function loadTasks(config) {
  const tasks = [];

  if (config.specificTask) {
    // Load specific task
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
    // Load all tasks from directory
    if (!fs.existsSync(config.taskDir)) {
      console.log(`Task directory not found: ${config.taskDir}`);
      console.log('Creating sample tasks for demonstration...');
      createSampleTasks(config.taskDir);
    }

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

  return tasks;
}

function createSampleTasks(dir) {
  fs.mkdirSync(dir, { recursive: true });

  // Sample Task 1: Simple color replacement
  const task1 = {
    train: [
      { input: [[1, 0], [0, 1]], output: [[2, 0], [0, 2]] },
      { input: [[1, 1], [0, 0]], output: [[2, 2], [0, 0]] }
    ],
    test: [
      { input: [[0, 1], [1, 0]], output: [[0, 2], [2, 0]] }
    ]
  };

  // Sample Task 2: Flip horizontal
  const task2 = {
    train: [
      { input: [[1, 2, 3]], output: [[3, 2, 1]] },
      { input: [[4, 5], [6, 7]], output: [[5, 4], [7, 6]] }
    ],
    test: [
      { input: [[1, 2], [3, 4]], output: [[2, 1], [4, 3]] }
    ]
  };

  // Sample Task 3: Scale 2x
  const task3 = {
    train: [
      { input: [[1]], output: [[1, 1], [1, 1]] },
      { input: [[2, 3]], output: [[2, 2, 3, 3], [2, 2, 3, 3]] }
    ],
    test: [
      { input: [[4]], output: [[4, 4], [4, 4]] }
    ]
  };

  // Sample Task 4: Rotate 90
  const task4 = {
    train: [
      { input: [[1, 2], [3, 4]], output: [[3, 1], [4, 2]] },
      { input: [[5, 6], [7, 8]], output: [[7, 5], [8, 6]] }
    ],
    test: [
      { input: [[1, 0], [0, 1]], output: [[0, 1], [1, 0]] }
    ]
  };

  // Sample Task 5: Gravity down
  const task5 = {
    train: [
      { input: [[1, 0], [0, 0]], output: [[0, 0], [1, 0]] },
      { input: [[2, 2], [0, 0]], output: [[0, 0], [2, 2]] }
    ],
    test: [
      { input: [[3, 0, 3], [0, 0, 0], [0, 0, 0]], output: [[0, 0, 0], [0, 0, 0], [3, 0, 3]] }
    ]
  };

  fs.writeFileSync(path.join(dir, 'sample_color_replace.json'), JSON.stringify(task1, null, 2));
  fs.writeFileSync(path.join(dir, 'sample_flip_horizontal.json'), JSON.stringify(task2, null, 2));
  fs.writeFileSync(path.join(dir, 'sample_scale_2x.json'), JSON.stringify(task3, null, 2));
  fs.writeFileSync(path.join(dir, 'sample_rotate_90.json'), JSON.stringify(task4, null, 2));
  fs.writeFileSync(path.join(dir, 'sample_gravity_down.json'), JSON.stringify(task5, null, 2));

  console.log(`Created ${5} sample tasks in ${dir}`);
}

// ═══════════════════════════════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════════════════════════════

class TaskRunner {
  constructor(config) {
    this.config = config;
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }

  async run(tasks) {
    this.startTime = Date.now();
    this.printHeader(tasks.length);

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const result = await this.runTask(task, i + 1, tasks.length);
      this.results.push(result);
      this.printProgress(result, i + 1, tasks.length);
    }

    this.endTime = Date.now();
    this.printSummary();

    if (this.config.generateReport) {
      this.generateReport();
    }

    return this.results;
  }

  async runTask(task, current, total) {
    const solver = new UnlimitedSolver({
      maxTime: this.config.timeout,
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
      testResults: result.results || null,
      error
    };
  }

  printHeader(taskCount) {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║     ██╗   ██╗███╗   ██╗██╗     ██╗███╗   ███╗██╗████████╗███████╗  ║
║     ██║   ██║████╗  ██║██║     ██║████╗ ████║██║╚══██╔══╝██╔════╝  ║
║     ██║   ██║██╔██╗ ██║██║     ██║██╔████╔██║██║   ██║   █████╗    ║
║     ██║   ██║██║╚██╗██║██║     ██║██║╚██╔╝██║██║   ██║   ██╔══╝    ║
║     ╚██████╔╝██║ ╚████║███████╗██║██║ ╚═╝ ██║██║   ██║   ███████╗  ║
║      ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝╚═╝     ╚═╝╚═╝   ╚═╝   ╚══════╝  ║
║                                                                    ║
║                    SOLVER v${VERSION} - ${CODENAME}                      ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝

Starting ARC Task Runner
${'─'.repeat(68)}
Tasks to run: ${taskCount}
Timeout per task: ${this.config.timeout}ms
${'─'.repeat(68)}
`);
  }

  printProgress(result, current, total) {
    const status = result.success ? '✓' : '✗';
    const color = result.success ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    const time = `${result.timeMs}ms`.padStart(8);

    const strategyInfo = result.strategy
      ? ` [depth: ${result.strategy.depth}]`
      : result.error
        ? ` [error: ${result.error.substring(0, 30)}...]`
        : '';

    console.log(
      `${color}${status}${reset} [${current.toString().padStart(2)}/${total}] ` +
      `${result.taskId.padEnd(30)} ${time}${strategyInfo}`
    );

    if (this.config.verbose && result.success && result.strategy) {
      console.log(`   Strategy: ${result.strategy.name}`);
      if (result.stats) {
        console.log(`   Strategies tried: ${result.stats.strategiesTried}`);
      }
    }
  }

  printSummary() {
    const totalTime = this.endTime - this.startTime;
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.length - successful;
    const successRate = ((successful / this.results.length) * 100).toFixed(1);

    const avgTime = this.results.length > 0
      ? (this.results.reduce((sum, r) => sum + r.timeMs, 0) / this.results.length).toFixed(0)
      : 0;

    const maxDepth = Math.max(
      ...this.results.filter(r => r.strategy).map(r => r.strategy.depth),
      0
    );

    const patternClasses = new Set();
    this.results
      .filter(r => r.strategy)
      .forEach(r => {
        const name = r.strategy.name;
        const types = name.split(' -> ').map(n => n.split(':')[0]);
        types.forEach(t => patternClasses.add(t));
      });

    console.log(`
${'═'.repeat(68)}
                              SUMMARY
${'═'.repeat(68)}

Results:
  Successful:  ${successful.toString().padStart(3)} / ${this.results.length}
  Failed:      ${failed.toString().padStart(3)} / ${this.results.length}
  Success Rate: ${successRate}%

Timing:
  Total Time:   ${totalTime}ms
  Average Time: ${avgTime}ms per task

Strategy Analysis:
  Deepest Strategy:  ${maxDepth} operations
  Pattern Classes:   ${patternClasses.size} unique

Pattern Classes Used:
${Array.from(patternClasses).map(p => `  - ${p}`).join('\n') || '  (none)'}

${'═'.repeat(68)}
`);

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
      tasks: this.results.map(r => ({
        id: r.taskId,
        success: r.success,
        timeMs: r.timeMs,
        strategy: r.strategy,
        stats: r.stats,
        error: r.error
      }))
    };

    const reportPath = path.join(
      __dirname,
      `report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
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

  const runner = new TaskRunner(config);
  const results = await runner.run(tasks);

  // Exit with error code if any tasks failed
  const allPassed = results.every(r => r.success);
  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
