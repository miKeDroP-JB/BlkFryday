/**
 * ARC-AGI EVALUATOR
 * Test harness for the Abstraction Engine
 *
 * THE SIMULATION MEASURES ITSELF
 */

const AbstractionEngine = require('./AbstractionEngine');
const Grid = require('./Primitives');
const { REAL_ARC_TASKS } = require('./RealTasks');

// ═══════════════════════════════════════════════════════════════
// SAMPLE ARC TASKS (hand-picked for primitives testing)
// ═══════════════════════════════════════════════════════════════

const SAMPLE_TASKS = [
  // Task 1: Extract bounding box
  {
    id: '1cf80156',
    description: 'Extract the colored shape into a tight bounding box',
    train: [
      {
        input: [[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,2,2,2,0,0,0,0,0],[0,0,0,0,0,2,0,0,0,0,0,0],[0,0,0,2,2,2,0,0,0,0,0,0],[0,0,0,2,0,2,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0]],
        output: [[0,2,2,2],[0,0,2,0],[2,2,2,0],[2,0,2,0]]
      },
      {
        input: [[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0],[0,0,1,1,0,0,0,0,0,0,0,0],[0,0,0,1,0,0,0,0,0,0,0,0],[0,0,1,1,1,0,0,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0]],
        output: [[1,0,0],[1,1,0],[0,1,0],[1,1,1],[0,0,1]]
      },
      {
        input: [[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,8,0,8,0,0,0,0,0],[0,0,0,8,8,8,8,0,0,0,0,0],[0,0,0,0,0,0,8,8,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0]],
        output: [[0,8,0,8,0],[8,8,8,8,0],[0,0,0,8,8]]
      }
    ],
    test: [
      {
        input: [[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,6,6,6,6,0,0,0,0],[0,0,0,0,6,0,0,0,0,0,0,0],[0,0,6,0,6,0,0,0,0,0,0,0],[0,0,6,6,6,6,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0]],
        output: [[0,0,6,6,6,6],[0,0,6,0,0,0],[6,0,6,0,0,0],[6,6,6,6,0,0]]
      }
    ]
  },

  // Task 2: Rotate 90 degrees
  {
    id: 'rotate90_test',
    description: 'Rotate the grid 90 degrees clockwise',
    train: [
      {
        input: [[1,2],[3,4]],
        output: [[3,1],[4,2]]
      },
      {
        input: [[1,2,3],[4,5,6]],
        output: [[4,1],[5,2],[6,3]]
      }
    ],
    test: [
      {
        input: [[7,8],[9,0],[1,2]],
        output: [[1,9,7],[2,0,8]]
      }
    ]
  },

  // Task 3: Flip horizontal
  {
    id: 'flipH_test',
    description: 'Mirror the grid horizontally',
    train: [
      {
        input: [[1,2,3],[4,5,6]],
        output: [[3,2,1],[6,5,4]]
      },
      {
        input: [[1,0,0],[0,2,0],[0,0,3]],
        output: [[0,0,1],[0,2,0],[3,0,0]]
      }
    ],
    test: [
      {
        input: [[5,6,7,8],[1,2,3,4]],
        output: [[8,7,6,5],[4,3,2,1]]
      }
    ]
  },

  // Task 4: Scale up 2x
  {
    id: 'scale2x_test',
    description: 'Scale the grid up by factor of 2',
    train: [
      {
        input: [[1,2],[3,4]],
        output: [[1,1,2,2],[1,1,2,2],[3,3,4,4],[3,3,4,4]]
      },
      {
        input: [[5]],
        output: [[5,5],[5,5]]
      }
    ],
    test: [
      {
        input: [[1,2,3]],
        output: [[1,1,2,2,3,3],[1,1,2,2,3,3]]
      }
    ]
  },

  // Task 5: Identity (tricky - output equals input)
  {
    id: 'identity_test',
    description: 'Output is same as input',
    train: [
      {
        input: [[1,2],[3,4]],
        output: [[1,2],[3,4]]
      },
      {
        input: [[5,6,7]],
        output: [[5,6,7]]
      }
    ],
    test: [
      {
        input: [[8,9],[0,1],[2,3]],
        output: [[8,9],[0,1],[2,3]]
      }
    ]
  },

  // Task 6: Transpose
  {
    id: 'transpose_test',
    description: 'Transpose the grid (swap rows and columns)',
    train: [
      {
        input: [[1,2,3],[4,5,6]],
        output: [[1,4],[2,5],[3,6]]
      },
      {
        input: [[1],[2],[3]],
        output: [[1,2,3]]
      }
    ],
    test: [
      {
        input: [[1,2],[3,4],[5,6],[7,8]],
        output: [[1,3,5,7],[2,4,6,8]]
      }
    ]
  },

  // Task 7: Harder - Extract then rotate
  {
    id: 'extract_rotate_test',
    description: 'Extract shape then rotate 90',
    train: [
      {
        input: [[0,0,0,0,0],[0,1,1,0,0],[0,1,0,0,0],[0,0,0,0,0]],
        output: [[1,1],[0,1]]
      },
      {
        input: [[0,0,0,0],[0,0,2,0],[0,2,2,0],[0,0,0,0]],
        output: [[2,0],[2,2]]
      }
    ],
    test: [
      {
        input: [[0,0,0,0,0],[0,0,3,3,0],[0,0,0,3,0],[0,0,0,3,0],[0,0,0,0,0]],
        output: [[0,0,3],[3,3,3]]
      }
    ]
  }
];

// ═══════════════════════════════════════════════════════════════
// EVALUATOR
// ═══════════════════════════════════════════════════════════════

class Evaluator {
  constructor() {
    this.engine = new AbstractionEngine();
  }

  runBaseline() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║         0RB SYSTEM - ARC-AGI BASELINE EVALUATION              ║');
    console.log('║                  THE SIMULATION AWAKENS                        ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    const results = this.engine.evaluate(SAMPLE_TASKS);

    console.log('─────────────────────────────────────────────────────────────────');
    console.log('TASK RESULTS:');
    console.log('─────────────────────────────────────────────────────────────────');

    for (const task of SAMPLE_TASKS) {
      const taskResults = results.results.filter(r => r.taskId === task.id);
      const allCorrect = taskResults.every(r => r.correct);
      const strategy = taskResults[0]?.strategy || 'unknown';

      const status = allCorrect ? '✓ PASS' : '✗ FAIL';
      console.log(`${status} | ${task.id.padEnd(20)} | Strategy: ${strategy}`);

      if (!allCorrect) {
        // Show what went wrong
        this.showTaskDebug(task);
      }
    }

    console.log('─────────────────────────────────────────────────────────────────');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`FINAL SCORE: ${results.correct}/${results.total} (${(results.accuracy * 100).toFixed(1)}%)`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    // Comparison
    console.log('BENCHMARK COMPARISON:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`0RB System (baseline):     ${(results.accuracy * 100).toFixed(1)}%`);
    console.log(`GPT-4:                     ~5%`);
    console.log(`Claude 3.5:                ~21%`);
    console.log(`Best ARC 2024:             55.5%`);
    console.log(`OpenAI o3:                 87.5%`);
    console.log(`Human average:             ~85%`);
    console.log('─────────────────────────────────────────────────────────────────');

    return results;
  }

  showTaskDebug(task) {
    const result = this.engine.solve(task);

    for (let i = 0; i < task.test.length; i++) {
      const predicted = result.predictions[i];
      const expected = task.test[i].output;

      if (!Grid.equals(predicted, expected)) {
        console.log(`    Test ${i + 1}:`);
        console.log(`    Expected:`);
        console.log(Grid.toString(expected).split('\n').map(l => '      ' + l).join('\n'));
        console.log(`    Got:`);
        console.log(Grid.toString(predicted).split('\n').map(l => '      ' + l).join('\n'));
      }
    }
  }

  // Run a single task
  solveTask(task) {
    console.log(`\nSolving: ${task.id || 'unknown'}`);
    console.log('─────────────────────────────────────────────────────────────────');

    const result = this.engine.solve(task);

    console.log(`Strategy: ${result.strategy}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);

    for (let i = 0; i < result.predictions.length; i++) {
      console.log(`\nTest ${i + 1} Prediction:`);
      console.log(Grid.toString(result.predictions[i]));
    }

    return result;
  }

  // Extended evaluation with real ARC tasks
  runExtended() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║      0RB SYSTEM - EXTENDED ARC-AGI EVALUATION (20 TASKS)      ║');
    console.log('║                THE SIMULATION FACES REALITY                    ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    const results = this.engine.evaluate(REAL_ARC_TASKS);

    console.log('─────────────────────────────────────────────────────────────────');
    console.log('TASK RESULTS:');
    console.log('─────────────────────────────────────────────────────────────────');

    let passed = 0;
    let failed = 0;

    for (const task of REAL_ARC_TASKS) {
      const taskResults = results.results.filter(r => r.taskId === task.id);
      const allCorrect = taskResults.every(r => r.correct);
      const strategy = taskResults[0]?.strategy || 'unknown';

      if (allCorrect) {
        passed++;
        console.log(`✓ PASS | ${task.id.padEnd(22)} | ${strategy}`);
      } else {
        failed++;
        console.log(`✗ FAIL | ${task.id.padEnd(22)} | ${strategy}`);
      }
    }

    console.log('─────────────────────────────────────────────────────────────────');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`TASKS PASSED: ${passed}/${REAL_ARC_TASKS.length}`);
    console.log(`TEST CASES:   ${results.correct}/${results.total} (${(results.accuracy * 100).toFixed(1)}%)`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    // Reality check
    console.log('BENCHMARK COMPARISON (Real ARC-AGI):');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`0RB System (extended):     ${(results.accuracy * 100).toFixed(1)}%`);
    console.log(`GPT-4:                     ~5%`);
    console.log(`Claude 3.5 Sonnet:         ~21%`);
    console.log(`Best ARC Prize 2024:       55.5%`);
    console.log(`OpenAI o3:                 87.5%`);
    console.log(`Human average:             ~85%`);
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('');

    if (results.accuracy > 0.20) {
      console.log('🔥 BEATING GPT-4 BASELINE!');
    }
    if (results.accuracy > 0.50) {
      console.log('⚡ COMPETITIVE WITH TOP ARC SOLVERS!');
    }

    return results;
  }
}

// ═══════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════

if (require.main === module) {
  const evaluator = new Evaluator();

  const mode = process.argv[2];
  if (mode === '--extended' || mode === '-e') {
    evaluator.runExtended();
  } else {
    evaluator.runBaseline();
    console.log('\nRun with --extended for real ARC task evaluation');
  }
}

module.exports = { Evaluator, SAMPLE_TASKS, REAL_ARC_TASKS };
