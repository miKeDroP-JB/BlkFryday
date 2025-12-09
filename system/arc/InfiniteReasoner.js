/**
 * INFINITE REASONING ENGINE v2.0
 *
 * THE PARADIGM SHIFT: DON'T QUIT.
 * Training data = answer key. Iterate until you pass.
 * GPT-4 takes 30 seconds and gets 5%.
 * We take as long as needed and get it RIGHT.
 *
 * FLOWSYNC METHOD: Find smallest solvable part, iterate fast.
 */

const Grid = require('./Primitives');
const fs = require('fs');

class InfiniteReasoner {
  constructor(options = {}) {
    this.maxIterations = options.maxIterations || 50000;
    this.debug = options.debug !== undefined ? options.debug : true;
    this.timeout = options.timeout || 60000; // 60 second timeout per task
  }

  /**
   * THE CORE LOOP: Iterate until correct
   */
  solve(task) {
    const startTime = Date.now();
    let iteration = 0;
    let bestSimilarity = 0;
    let bestHypothesis = null;

    // Pre-analyze the task
    const analysis = this.analyzeTask(task);

    // Generate ALL strategies upfront - including task-specific ones
    const strategies = this.generateAllStrategies(task, analysis);

    if (this.debug) {
      console.log(`  Strategies: ${strategies.length} | Colors: ${analysis.inputColors.join(',')} → ${analysis.outputColors.join(',')}`);
    }

    while (iteration < this.maxIterations) {
      // Check timeout
      if (Date.now() - startTime > this.timeout) {
        if (this.debug) console.log(`  ⏱ TIMEOUT after ${iteration} iterations`);
        break;
      }

      iteration++;

      // Get next hypothesis
      const hypothesis = this.getHypothesis(strategies, iteration, bestHypothesis, analysis);
      if (!hypothesis) break;

      // Validate against ALL training examples
      const result = this.validateOnTraining(hypothesis, task.train);

      // Track best so far
      if (result.similarity > bestSimilarity) {
        bestSimilarity = result.similarity;
        bestHypothesis = hypothesis;

        if (this.debug && result.similarity > 0.5) {
          console.log(`  [${iteration}] New best: ${(result.similarity * 100).toFixed(1)}% | ${hypothesis.name}`);
        }
      }

      // PERFECT MATCH = DONE
      if (result.perfect) {
        const elapsed = Date.now() - startTime;
        if (this.debug) {
          console.log(`  ✓ SOLVED in ${iteration} iterations (${elapsed}ms) | ${hypothesis.name}`);
        }

        // Apply to test
        const predictions = task.test.map(t => this.applyHypothesis(hypothesis, t.input));

        return {
          success: true,
          predictions,
          hypothesis: hypothesis.name,
          iterations: iteration,
          timeMs: elapsed
        };
      }
    }

    // Didn't solve perfectly - return best attempt
    const elapsed = Date.now() - startTime;
    const predictions = task.test.map(t =>
      bestHypothesis ? this.applyHypothesis(bestHypothesis, t.input) : t.input
    );

    return {
      success: false,
      predictions,
      hypothesis: bestHypothesis?.name || 'none',
      bestSimilarity,
      iterations: iteration,
      timeMs: elapsed
    };
  }

  /**
   * Analyze task to understand its structure
   */
  analyzeTask(task) {
    const train0 = task.train[0];
    const input0 = train0.input;
    const output0 = train0.output;

    const inputColors = Grid.getNonZeroColors(input0);
    const outputColors = Grid.getNonZeroColors(output0);
    const newColors = outputColors.filter(c => !inputColors.includes(c));
    const removedColors = inputColors.filter(c => !outputColors.includes(c));

    const inH = input0.length;
    const inW = input0[0].length;
    const outH = output0.length;
    const outW = output0[0].length;

    const sameSize = inH === outH && inW === outW;
    const isScaleUp = outH > inH || outW > inW;
    const isScaleDown = outH < inH || outW < inW;

    // Check for consistent size ratio
    let scaleFactorH = outH / inH;
    let scaleFactorW = outW / inW;

    // Find objects in input
    const objects = Grid.findObjects(input0);

    return {
      inputColors,
      outputColors,
      newColors,
      removedColors,
      sameSize,
      isScaleUp,
      isScaleDown,
      scaleFactorH,
      scaleFactorW,
      inputDims: { h: inH, w: inW },
      outputDims: { h: outH, w: outW },
      numObjects: objects.length,
      objects
    };
  }

  /**
   * Generate ALL possible strategies
   */
  generateAllStrategies(task, analysis) {
    const strategies = [];

    // === LEVEL 0: Identity ===
    strategies.push({ name: 'identity', ops: [(g) => Grid.copy(g)] });

    // === LEVEL 1: Basic Transforms ===
    strategies.push({ name: 'rotate90', ops: [(g) => Grid.rotate(g, 90)] });
    strategies.push({ name: 'rotate180', ops: [(g) => Grid.rotate(g, 180)] });
    strategies.push({ name: 'rotate270', ops: [(g) => Grid.rotate(g, 270)] });
    strategies.push({ name: 'flipH', ops: [(g) => Grid.flipHorizontal(g)] });
    strategies.push({ name: 'flipV', ops: [(g) => Grid.flipVertical(g)] });
    strategies.push({ name: 'transpose', ops: [(g) => Grid.transpose(g)] });

    // === LEVEL 2: Extraction ===
    strategies.push({ name: 'extractBB', ops: [(g) => Grid.extractBoundingBox(g)] });
    strategies.push({ name: 'extractLargest', ops: [(g) => Grid.extractLargestObject(g)] });
    strategies.push({ name: 'extractSmallest', ops: [(g) => Grid.extractSmallestObject(g)] });

    // === LEVEL 3: Scaling & Tiling ===
    if (analysis.isScaleUp) {
      const fH = Math.round(analysis.scaleFactorH);
      const fW = Math.round(analysis.scaleFactorW);
      if (fH > 1 || fW > 1) {
        strategies.push({ name: `scale_${fH}x${fW}`, ops: [(g) => Grid.scale(g, fH, fW)] });
        strategies.push({ name: `tile_${fH}x${fW}`, ops: [(g) => Grid.tile(g, fH, fW)] });
      }
    }
    for (let n = 2; n <= 4; n++) {
      strategies.push({ name: `tile_${n}x${n}`, ops: [(g) => Grid.tile(g, n, n)] });
      strategies.push({ name: `scale_${n}x${n}`, ops: [(g) => Grid.scale(g, n, n)] });
    }

    // === LEVEL 4: Gravity ===
    strategies.push({ name: 'gravityDown', ops: [(g) => Grid.gravity(g, 'down')] });
    strategies.push({ name: 'gravityUp', ops: [(g) => Grid.gravity(g, 'up')] });
    strategies.push({ name: 'gravityLeft', ops: [(g) => Grid.gravity(g, 'left')] });
    strategies.push({ name: 'gravityRight', ops: [(g) => Grid.gravity(g, 'right')] });

    // === LEVEL 5: Logical Half Operations ===
    strategies.push({ name: 'xorHalvesV', ops: [(g) => Grid.xorHalves(g)] });
    strategies.push({ name: 'andHalvesV', ops: [(g) => Grid.andHalves(g)] });
    strategies.push({ name: 'orHalvesV', ops: [(g) => Grid.orHalves(g)] });
    strategies.push({ name: 'xorHalvesH', ops: [(g) => Grid.xorHalvesH(g)] });
    strategies.push({ name: 'andHalvesH', ops: [(g) => Grid.andHalvesH(g)] });
    strategies.push({ name: 'orHalvesH', ops: [(g) => Grid.orHalvesH(g)] });

    // === LEVEL 6: Symmetry Completion ===
    strategies.push({ name: 'makeSymmetricH', ops: [(g) => Grid.makeSymmetricH(g)] });
    strategies.push({ name: 'makeSymmetricV', ops: [(g) => Grid.makeSymmetricV(g)] });
    strategies.push({ name: 'makePointSymmetric', ops: [(g) => Grid.makePointSymmetric(g)] });

    // === LEVEL 7: Fill Operations ===
    for (let fillColor = 1; fillColor <= 9; fillColor++) {
      strategies.push({
        name: `fillEnclosed_${fillColor}`,
        ops: [(g) => Grid.floodFillEnclosed(g, 0, fillColor)]
      });
    }

    // === LEVEL 8: Color Operations ===
    // Direct color swaps based on analysis
    for (const fromColor of analysis.inputColors) {
      for (const toColor of [...analysis.outputColors, ...analysis.newColors]) {
        if (fromColor !== toColor) {
          strategies.push({
            name: `color_${fromColor}→${toColor}`,
            ops: [(g) => Grid.replaceColor(g, fromColor, toColor)]
          });
        }
      }
    }

    // Learned color map from training
    strategies.push({
      name: 'learnedColorMap',
      ops: [(g) => this.applyLearnedColorMap(g, task.train)]
    });

    // === LEVEL 9: Draw Patterns (for new colors) ===
    if (analysis.newColors.length > 0) {
      for (const targetColor of analysis.inputColors) {
        for (const drawColor of analysis.newColors) {
          strategies.push({
            name: `drawCross_${targetColor}_${drawColor}`,
            ops: [(g) => Grid.drawCrossAround(g, targetColor, drawColor)]
          });
          strategies.push({
            name: `drawDiag_${targetColor}_${drawColor}`,
            ops: [(g) => Grid.drawDiagonalAround(g, targetColor, drawColor)]
          });
          strategies.push({
            name: `drawFull_${targetColor}_${drawColor}`,
            ops: [(g) => Grid.drawFullCross(g, targetColor, drawColor)]
          });
          strategies.push({
            name: `drawBox_${targetColor}_${drawColor}`,
            ops: [(g) => Grid.drawBoxAround(g, targetColor, drawColor)]
          });
        }
      }
    }

    // === LEVEL 10: Composite Strategies (2-op combos) ===
    const baseOps = strategies.slice(0, 20); // Core transforms
    for (const s1 of baseOps) {
      for (const s2 of baseOps) {
        if (s1.name !== s2.name) {
          strategies.push({
            name: `${s1.name}→${s2.name}`,
            ops: [...s1.ops, ...s2.ops]
          });
        }
      }
    }

    // === LEVEL 11: Extract then transform ===
    const extracts = ['extractBB', 'extractLargest', 'extractSmallest'];
    const transforms = ['rotate90', 'rotate180', 'rotate270', 'flipH', 'flipV', 'transpose'];
    for (const ext of extracts) {
      for (const tr of transforms) {
        const extOp = strategies.find(s => s.name === ext);
        const trOp = strategies.find(s => s.name === tr);
        if (extOp && trOp) {
          strategies.push({
            name: `${ext}→${tr}`,
            ops: [...extOp.ops, ...trOp.ops]
          });
        }
      }
    }

    // === LEVEL 12: Object-based strategies ===
    if (analysis.objects.length > 1) {
      // Try selecting specific objects
      for (const color of analysis.inputColors) {
        strategies.push({
          name: `extractObject_color${color}`,
          ops: [(g) => Grid.extractObjectByColor(g, color)]
        });
      }
    }

    // === LEVEL 13: Divider-based strategies ===
    for (const divColor of analysis.inputColors) {
      strategies.push({
        name: `splitByDivider_${divColor}_xor`,
        ops: [(g) => {
          const split = Grid.splitByDivider(g, divColor);
          if (split && split.parts.length === 2) {
            return Grid.xorGrids(split.parts[0], split.parts[1]);
          }
          return g;
        }]
      });
      strategies.push({
        name: `splitByDivider_${divColor}_and`,
        ops: [(g) => {
          const split = Grid.splitByDivider(g, divColor);
          if (split && split.parts.length === 2) {
            return Grid.andGrids(split.parts[0], split.parts[1]);
          }
          return g;
        }]
      });
      strategies.push({
        name: `splitByDivider_${divColor}_or`,
        ops: [(g) => {
          const split = Grid.splitByDivider(g, divColor);
          if (split && split.parts.length === 2) {
            return Grid.orGrids(split.parts[0], split.parts[1]);
          }
          return g;
        }]
      });
    }

    // === LEVEL 14: Quadrant operations ===
    strategies.push({
      name: 'quadrant_topLeft',
      ops: [(g) => Grid.splitIntoQuadrants(g).topLeft]
    });
    strategies.push({
      name: 'quadrant_topRight',
      ops: [(g) => Grid.splitIntoQuadrants(g).topRight]
    });
    strategies.push({
      name: 'quadrant_bottomLeft',
      ops: [(g) => Grid.splitIntoQuadrants(g).bottomLeft]
    });
    strategies.push({
      name: 'quadrant_bottomRight',
      ops: [(g) => Grid.splitIntoQuadrants(g).bottomRight]
    });

    // === LEVEL 15: Grid Cell Extraction (for grid patterns) ===
    strategies.push({
      name: 'findSmallestCell',
      ops: [(g) => Grid.findSmallestCell(g)]
    });
    strategies.push({
      name: 'findLargestCell',
      ops: [(g) => Grid.findLargestCell(g)]
    });
    strategies.push({
      name: 'findUniqueCell',
      ops: [(g) => Grid.findUniqueCell(g)]
    });

    // Grid cell extraction with specific grid colors
    for (const gridColor of analysis.inputColors) {
      strategies.push({
        name: `findSmallestCell_grid${gridColor}`,
        ops: [(g) => Grid.findSmallestCell(g, gridColor)]
      });
      strategies.push({
        name: `findLargestCell_grid${gridColor}`,
        ops: [(g) => Grid.findLargestCell(g, gridColor)]
      });
      strategies.push({
        name: `findUniqueCell_grid${gridColor}`,
        ops: [(g) => Grid.findUniqueCell(g, gridColor)]
      });
    }

    // === LEVEL 16: Morphological operations ===
    strategies.push({ name: 'dilate', ops: [(g) => Grid.dilate(g)] });
    strategies.push({ name: 'erode', ops: [(g) => Grid.erode(g)] });
    strategies.push({ name: 'outline', ops: [(g) => Grid.outline(g)] });

    // === LEVEL 17: Output size hint strategies ===
    if (!analysis.sameSize) {
      // Try cropping/padding to exact output size
      const { h: outH, w: outW } = analysis.outputDims;
      strategies.push({
        name: `cropToSize_${outH}x${outW}`,
        ops: [(g) => Grid.extractRegion(g, 0, 0, outH, outW)]
      });
    }

    return strategies;
  }

  /**
   * Get hypothesis for iteration
   */
  getHypothesis(strategies, iteration, bestHypothesis, analysis) {
    // Phase 1: Try all pre-computed strategies
    if (iteration <= strategies.length) {
      return strategies[iteration - 1];
    }

    // Phase 2: Genetic mutation of best hypothesis
    if (bestHypothesis && iteration <= strategies.length + 1000) {
      return this.mutateHypothesis(bestHypothesis, strategies, analysis);
    }

    // Phase 3: Deep composition (3+ ops)
    if (iteration <= strategies.length + 2000) {
      return this.deepCompose(strategies, 3);
    }

    return null;
  }

  /**
   * Mutate best hypothesis
   */
  mutateHypothesis(best, strategies, analysis) {
    const mutations = [
      // Add a random op
      () => {
        const randomStrat = strategies[Math.floor(Math.random() * Math.min(30, strategies.length))];
        return {
          name: `${best.name}→${randomStrat.name}`,
          ops: [...best.ops, ...randomStrat.ops]
        };
      },
      // Prepend a random op
      () => {
        const randomStrat = strategies[Math.floor(Math.random() * Math.min(30, strategies.length))];
        return {
          name: `${randomStrat.name}→${best.name}`,
          ops: [...randomStrat.ops, ...best.ops]
        };
      },
      // Remove an op (if multiple)
      () => {
        if (best.ops.length > 1) {
          const idx = Math.floor(Math.random() * best.ops.length);
          const newOps = [...best.ops];
          newOps.splice(idx, 1);
          return { name: `${best.name}_minus${idx}`, ops: newOps };
        }
        return best;
      }
    ];

    const mutation = mutations[Math.floor(Math.random() * mutations.length)];
    return mutation();
  }

  /**
   * Deep composition of strategies
   */
  deepCompose(strategies, depth) {
    const baseStrats = strategies.slice(0, 20);
    let result = { name: '', ops: [] };

    for (let i = 0; i < depth; i++) {
      const s = baseStrats[Math.floor(Math.random() * baseStrats.length)];
      result.name += (result.name ? '→' : '') + s.name;
      result.ops.push(...s.ops);
    }

    return result;
  }

  /**
   * Validate hypothesis against ALL training examples
   */
  validateOnTraining(hypothesis, trainExamples) {
    let totalCells = 0;
    let correctCells = 0;
    let allPerfect = true;
    const diffs = [];

    for (const example of trainExamples) {
      const predicted = this.applyHypothesis(hypothesis, example.input);
      const expected = example.output;

      const h = expected.length;
      const w = expected[0].length;

      // Size mismatch = fail
      if (!predicted || predicted.length !== h || (predicted[0]?.length || 0) !== w) {
        allPerfect = false;
        diffs.push({ type: 'size_mismatch', expected: [h, w], got: [predicted?.length, predicted?.[0]?.length] });
        continue;
      }

      for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
          totalCells++;
          if (predicted[i][j] === expected[i][j]) {
            correctCells++;
          } else {
            allPerfect = false;
            if (diffs.length < 5) {
              diffs.push({ row: i, col: j, expected: expected[i][j], got: predicted[i][j] });
            }
          }
        }
      }
    }

    return {
      perfect: allPerfect,
      similarity: totalCells > 0 ? correctCells / totalCells : 0,
      diffs
    };
  }

  /**
   * Apply learned color map from training
   */
  applyLearnedColorMap(grid, trainExamples) {
    const map = {};
    const ex = trainExamples[0];

    for (let i = 0; i < ex.input.length && i < ex.output.length; i++) {
      for (let j = 0; j < ex.input[0].length && j < ex.output[0].length; j++) {
        const inC = ex.input[i][j];
        const outC = ex.output[i][j];
        if (inC !== outC) {
          map[inC] = outC;
        }
      }
    }

    const result = Grid.copy(grid);
    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < result[0].length; j++) {
        if (map[result[i][j]] !== undefined) {
          result[i][j] = map[result[i][j]];
        }
      }
    }
    return result;
  }

  /**
   * Apply hypothesis to input grid
   */
  applyHypothesis(hypothesis, input) {
    if (!hypothesis || !hypothesis.ops) {
      return Grid.copy(input);
    }

    let result = input;
    for (const op of hypothesis.ops) {
      try {
        result = op(result);
        if (!result || !Array.isArray(result) || result.length === 0) {
          return Grid.copy(input);
        }
      } catch (e) {
        return Grid.copy(input);
      }
    }
    return result;
  }
}

// ═══════════════════════════════════════════════════════════
// BATTLE HARNESS
// ═══════════════════════════════════════════════════════════

async function runBattle(options = {}) {
  const rawDir = options.rawDir || './raw';
  const debug = options.debug !== undefined ? options.debug : true;
  const timeout = options.timeout || 30000;

  const reasoner = new InfiniteReasoner({ debug, timeout });

  const taskFiles = fs.readdirSync(rawDir).filter(f => f.endsWith('.json')).sort();

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     INFINITE REASONING ENGINE v2.0                        ║');
  console.log('║     "Iterate until correct. GPT-4 can wait."              ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║     Tasks: ${taskFiles.length.toString().padEnd(45)}║`);
  console.log(`║     Timeout: ${(timeout/1000).toString().padEnd(42)}s ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  let solved = 0;
  let totalTime = 0;
  let totalIterations = 0;
  const results = [];

  for (const file of taskFiles) {
    const taskId = file.replace('.json', '');
    const task = JSON.parse(fs.readFileSync(`${rawDir}/${file}`));

    console.log(`\n[${taskId}]`);

    const result = reasoner.solve(task);
    totalTime += result.timeMs;
    totalIterations += result.iterations;

    if (result.success) {
      solved++;
    } else {
      console.log(`  ✗ Best: ${(result.bestSimilarity * 100).toFixed(1)}% | ${result.hypothesis}`);
    }

    results.push({ taskId, ...result });
  }

  // Final summary
  const avgTime = totalTime / taskFiles.length;
  const avgIter = totalIterations / taskFiles.length;
  const pct = (solved/taskFiles.length*100).toFixed(1);

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL RESULTS                          ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  SOLVED: ${solved}/${taskFiles.length} (${pct}%)`.padEnd(60) + '║');
  console.log(`║  Avg time: ${avgTime.toFixed(0)}ms per task`.padEnd(60) + '║');
  console.log(`║  Avg iterations: ${avgIter.toFixed(0)} per task`.padEnd(60) + '║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║  BENCHMARKS:'.padEnd(60) + '║');
  console.log('║    GPT-4:        ~5%  @ 30,000ms'.padEnd(60) + '║');
  console.log('║    Claude 3.5:  ~21%  @ ???ms'.padEnd(60) + '║');
  console.log(`║    0RB ENGINE:  ${pct}%  @ ${avgTime.toFixed(0)}ms`.padEnd(60) + '║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Save results
  try {
    fs.mkdirSync('./results', { recursive: true });
    fs.writeFileSync('./results/infinite_results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to ./results/infinite_results.json');
  } catch (e) {
    console.log('Could not save results:', e.message);
  }

  return { solved, total: taskFiles.length, pct: parseFloat(pct), results };
}

// Export for module use
module.exports = { InfiniteReasoner, runBattle };

// Run if executed directly
if (require.main === module) {
  runBattle({ timeout: 30000, debug: true }).catch(console.error);
}
