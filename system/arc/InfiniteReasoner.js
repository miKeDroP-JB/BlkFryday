/**
 * INFINITE REASONING ENGINE v4.4 - WITH PROGRAM SYNTHESIS
 *
 * THE PARADIGM: DON'T QUIT UNTIL 100% SOLVED.
 * Training data = answer key. Iterate FOREVER until you pass.
 * NO TIMEOUT. NO CAPS. NO GIVING UP.
 *
 * PHASE 0: Program Synthesis (DSL-based)
 * PHASE 1: Transform Search
 * PHASE 2+: Infinite Hypothesis Generation
 */

const Grid = require('./Primitives');
const ProgramSynthesis = require('./ProgramSynthesis');
const fs = require('fs');

// Helper functions to bridge API differences
const GridHelpers = {
  getUniqueColors: (grid) => Grid.getAllColors(grid),
  compare: (a, b) => {
    if (!a || !b || a.length !== b.length) return 0;
    if (a.length === 0) return 1;
    if (a[0].length !== b[0].length) return 0;
    let matches = 0;
    let total = 0;
    for (let r = 0; r < a.length; r++) {
      for (let c = 0; c < a[0].length; c++) {
        total++;
        if (a[r][c] === b[r][c]) matches++;
      }
    }
    return total > 0 ? matches / total : 0;
  },
  mapColors: (grid, mapping) => {
    return grid.map(row => row.map(cell => mapping[cell] !== undefined ? mapping[cell] : cell));
  },
  rotate90: (g) => Grid.rotate(g, 90),
  rotate180: (g) => Grid.rotate(g, 180),
  rotate270: (g) => Grid.rotate(g, 270),
  flipHorizontal: (g) => Grid.flipHorizontal(g),
  flipVertical: (g) => Grid.flipVertical(g),
  transpose: (g) => Grid.transpose(g),
  gravity: (g, dir) => Grid.gravity(g, dir),
  tile: (g, h, w) => Grid.tile(g, h, w),
  scale: (g, n) => Grid.scale(g, n),
  extractRegion: (g, r, c, h, w) => Grid.extractRegion(g, r, c, h, w),
  findBoundingBox: (g, color) => {
    let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
    for (let r = 0; r < g.length; r++) {
      for (let c = 0; c < g[0].length; c++) {
        if (g[r][c] === color) {
          minR = Math.min(minR, r);
          maxR = Math.max(maxR, r);
          minC = Math.min(minC, c);
          maxC = Math.max(maxC, c);
        }
      }
    }
    return maxR >= 0 ? { minR, maxR, minC, maxC } : null;
  },
  extractSmallestObject: (g) => Grid.extractSmallestObject(g),
  extractLargestObject: (g) => Grid.extractLargestObject(g),
  removeDuplicateRows: (g) => {
    const seen = new Set();
    return g.filter(row => {
      const key = row.join(',');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

class InfiniteReasoner {
  constructor(options = {}) {
    this.debug = options.debug !== undefined ? options.debug : true;
    this.solveMode = options.solveMode || 'unlimited'; // 'unlimited' or 'benchmark'
    this.hypothesesTried = new Set();
    this.learnedPatterns = [];
    this.synthesizer = new ProgramSynthesis();
  }

  /**
   * THE CORE LOOP: NEVER QUIT UNTIL 100% SOLVED
   */
  solve(task) {
    const startTime = Date.now();
    let iteration = 0;
    let bestSimilarity = 0;
    let bestHypothesis = null;
    let stuckCounter = 0;
    let generationDepth = 1;

    this.hypothesesTried.clear();

    // Deep analysis
    const analysis = this.analyzeTask(task);

    if (this.debug) {
      console.log(`  Colors: ${analysis.inputColors.join(',')} → ${analysis.outputColors.join(',')}`);
      console.log(`  Size: ${analysis.inputDims.h}x${analysis.inputDims.w} → ${analysis.outputDims.h}x${analysis.outputDims.w}`);
      console.log(`  Objects: ${analysis.numObjects} | New colors: ${analysis.newColors.join(',') || 'none'}`);
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 0: PROGRAM SYNTHESIS (DSL)
    // ═══════════════════════════════════════════════════════════
    if (this.debug) console.log(`  Phase 0: Program Synthesis...`);

    const synthResult = this.synthesizer.synthesize(task, analysis);
    if (synthResult.success) {
      const elapsed = Date.now() - startTime;
      if (this.debug) {
        console.log(`  ✓ SOLVED BY SYNTHESIS in ${elapsed}ms`);
        console.log(`    Program: ${synthResult.program}`);
      }

      const predictions = task.test.map(t => synthResult.apply(t.input));
      return {
        success: true,
        predictions,
        hypothesis: `SYNTH:${synthResult.program}`,
        iterations: 0,
        timeMs: elapsed
      };
    }

    if (this.debug) {
      console.log(`    Best synthesis: ${(synthResult.score * 100).toFixed(1)}% (${synthResult.program})`);
    }

    // Add synthesis result as a hypothesis to try
    if (synthResult.score > 0) {
      bestSimilarity = synthResult.score;
      bestHypothesis = {
        name: `synth_${synthResult.program}`,
        ops: [(g) => synthResult.apply(g)]
      };
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: TRANSFORM SEARCH
    // ═══════════════════════════════════════════════════════════
    let strategies = this.generateAllStrategies(task, analysis);
    let strategyIndex = 0;

    if (this.debug) console.log(`  Phase 1: ${strategies.length} base strategies`);

    // ═══════════════════════════════════════════════════════════
    // THE INFINITE LOOP - RUNS UNTIL 100% SOLVED
    // ═══════════════════════════════════════════════════════════
    while (true) {
      iteration++;

      // Get next hypothesis
      let hypothesis = null;

      if (strategyIndex < strategies.length) {
        // Still have strategies to try
        hypothesis = strategies[strategyIndex];
        strategyIndex++;
      } else {
        // Exhausted current pool - GENERATE MORE
        stuckCounter++;

        if (this.debug && stuckCounter === 1) {
          console.log(`  Phase 2: Generating new hypotheses... best=${(bestSimilarity * 100).toFixed(1)}%`);
        }

        // Generate new hypotheses based on depth
        const newHypotheses = this.generateNewHypotheses(
          task, analysis, bestHypothesis, bestSimilarity, generationDepth
        );

        if (newHypotheses.length > 0) {
          strategies = strategies.concat(newHypotheses);
          if (this.debug && stuckCounter % 10 === 1) {
            console.log(`    Depth ${generationDepth}: +${newHypotheses.length} hypotheses (total: ${strategies.length})`);
          }
        }

        // Increase depth every 100 stuck iterations
        if (stuckCounter % 100 === 0) {
          generationDepth++;
          if (this.debug) {
            console.log(`    Increasing depth to ${generationDepth}...`);
          }
        }

        // Benchmark mode: bail after reasonable effort
        if (this.solveMode === 'benchmark' && stuckCounter > 1000) {
          if (this.debug) {
            console.log(`  ✗ BENCHMARK LIMIT after ${iteration} iterations`);
            console.log(`    Best: ${(bestSimilarity * 100).toFixed(1)}% | ${bestHypothesis?.name || 'none'}`);
          }
          break;
        }

        continue;
      }

      if (!hypothesis) continue;

      // Skip duplicates
      const hypKey = hypothesis.name;
      if (this.hypothesesTried.has(hypKey)) continue;
      this.hypothesesTried.add(hypKey);

      // Validate against ALL training examples
      const result = this.validateOnTraining(hypothesis, task.train);

      // Track best
      if (result.similarity > bestSimilarity) {
        bestSimilarity = result.similarity;
        bestHypothesis = hypothesis;
        stuckCounter = 0; // Reset - we're making progress!
        generationDepth = 1;

        if (this.debug) {
          console.log(`  [${iteration}] ${(result.similarity * 100).toFixed(1)}% | ${hypothesis.name}`);
        }

        // Learn from this success
        this.learnedPatterns.push({
          pattern: hypothesis,
          similarity: result.similarity,
          analysis
        });
      }

      // ═══════════════════════════════════════════════════════
      // 100% SOLVED = DONE!
      // ═══════════════════════════════════════════════════════
      if (result.perfect) {
        const elapsed = Date.now() - startTime;
        if (this.debug) {
          console.log(`  ✓ SOLVED in ${iteration} iterations (${elapsed}ms)`);
          console.log(`    Solution: ${hypothesis.name}`);
        }

        const predictions = task.test.map(t => this.applyHypothesis(hypothesis, t.input));

        return {
          success: true,
          predictions,
          hypothesis: hypothesis.name,
          iterations: iteration,
          timeMs: elapsed
        };
      }

      // Progress indicator
      if (iteration % 10000 === 0 && this.debug) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`    ... ${iteration} iters, ${elapsed}s, best ${(bestSimilarity * 100).toFixed(1)}%, pool ${strategies.length}`);
      }
    }

    // Return best attempt
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
   * GENERATE NEW HYPOTHESES - Called when we exhaust current pool
   */
  generateNewHypotheses(task, analysis, bestHyp, bestSim, depth) {
    const newStrategies = [];
    const baseOps = this.getBaseOperations();

    // Depth 1: Compositions of best with all base ops
    if (depth >= 1 && bestHyp) {
      for (const op of baseOps) {
        // best + op
        newStrategies.push({
          name: `${bestHyp.name}_then_${op.name}`,
          ops: [...bestHyp.ops, op.fn]
        });
        // op + best
        newStrategies.push({
          name: `${op.name}_then_${bestHyp.name}`,
          ops: [op.fn, ...bestHyp.ops]
        });
      }
    }

    // Depth 2: Color permutations
    if (depth >= 2) {
      const colors = [...new Set([...analysis.inputColors, ...analysis.outputColors])];
      for (const c1 of colors) {
        for (const c2 of colors) {
          if (c1 !== c2) {
            const swap = {
              name: `swap_${c1}_${c2}`,
              ops: [(g) => GridHelpers.mapColors(g, { [c1]: c2, [c2]: c1 })]
            };
            newStrategies.push(swap);
            if (bestHyp) {
              newStrategies.push({
                name: `${swap.name}_then_${bestHyp.name}`,
                ops: [...swap.ops, ...bestHyp.ops]
              });
            }
          }
        }
      }
    }

    // Depth 3: Region extraction at all positions
    if (depth >= 3) {
      const outH = analysis.outputDims.h;
      const outW = analysis.outputDims.w;
      const inH = analysis.inputDims.h;
      const inW = analysis.inputDims.w;

      if (outH <= inH && outW <= inW) {
        for (let r = 0; r <= inH - outH; r++) {
          for (let c = 0; c <= inW - outW; c++) {
            newStrategies.push({
              name: `extract_${r}_${c}_${outH}x${outW}`,
              ops: [(g) => GridHelpers.extractRegion(g, r, c, outH, outW)]
            });
          }
        }
      }
    }

    // Depth 4: Triple compositions
    if (depth >= 4 && bestHyp) {
      for (const op1 of baseOps.slice(0, 10)) {
        for (const op2 of baseOps.slice(0, 10)) {
          newStrategies.push({
            name: `${op1.name}_${op2.name}_${bestHyp.name}`,
            ops: [op1.fn, op2.fn, ...bestHyp.ops]
          });
        }
      }
    }

    // Depth 5: Pattern-based generation from learned patterns
    if (depth >= 5 && this.learnedPatterns.length > 0) {
      for (const learned of this.learnedPatterns.slice(-10)) {
        if (learned.pattern !== bestHyp) {
          newStrategies.push({
            name: `learned_${learned.pattern.name}_combo`,
            ops: [...learned.pattern.ops, ...(bestHyp?.ops || [])]
          });
        }
      }
    }

    // Depth 6+: Random compositions with increasing complexity
    if (depth >= 6) {
      const numRandom = Math.min(depth * 10, 100);
      for (let i = 0; i < numRandom; i++) {
        const numOps = Math.floor(Math.random() * depth) + 2;
        const ops = [];
        const names = [];
        for (let j = 0; j < numOps; j++) {
          const op = baseOps[Math.floor(Math.random() * baseOps.length)];
          ops.push(op.fn);
          names.push(op.name);
        }
        newStrategies.push({
          name: `random_d${depth}_${names.join('_')}`,
          ops
        });
      }
    }

    return newStrategies;
  }

  /**
   * Get base operations library
   */
  getBaseOperations() {
    return [
      { name: 'rot90', fn: (g) => GridHelpers.rotate90(g) },
      { name: 'rot180', fn: (g) => GridHelpers.rotate180(g) },
      { name: 'rot270', fn: (g) => GridHelpers.rotate270(g) },
      { name: 'flipH', fn: (g) => GridHelpers.flipHorizontal(g) },
      { name: 'flipV', fn: (g) => GridHelpers.flipVertical(g) },
      { name: 'transpose', fn: (g) => GridHelpers.transpose(g) },
      { name: 'gravDown', fn: (g) => GridHelpers.gravity(g, 'down') },
      { name: 'gravUp', fn: (g) => GridHelpers.gravity(g, 'up') },
      { name: 'gravLeft', fn: (g) => GridHelpers.gravity(g, 'left') },
      { name: 'gravRight', fn: (g) => GridHelpers.gravity(g, 'right') },
      { name: 'dedup', fn: (g) => GridHelpers.removeDuplicateRows(g) },
      { name: 'dedupCols', fn: (g) => g },
      { name: 'unique', fn: (g) => g },
      { name: 'sortRows', fn: (g) => g },
      { name: 'invert', fn: (g) => g },
      { name: 'outline', fn: (g) => g },
      { name: 'fill', fn: (g) => g },
      { name: 'erode', fn: (g) => g },
      { name: 'dilate', fn: (g) => g },
    ];
  }

  /**
   * Deep task analysis
   */
  analyzeTask(task) {
    const train = task.train;
    const firstIn = train[0].input;
    const firstOut = train[0].output;

    const inputColors = new Set();
    const outputColors = new Set();

    train.forEach(({ input, output }) => {
      GridHelpers.getUniqueColors(input).forEach(c => inputColors.add(c));
      GridHelpers.getUniqueColors(output).forEach(c => outputColors.add(c));
    });

    const inputColorsArr = [...inputColors].sort((a, b) => a - b);
    const outputColorsArr = [...outputColors].sort((a, b) => a - b);
    const newColors = outputColorsArr.filter(c => !inputColors.has(c));

    return {
      inputDims: { h: firstIn.length, w: firstIn[0]?.length || 0 },
      outputDims: { h: firstOut.length, w: firstOut[0]?.length || 0 },
      inputColors: inputColorsArr,
      outputColors: outputColorsArr,
      newColors,
      numObjects: this.countObjects(firstIn),
      sizeChange: {
        h: firstOut.length / firstIn.length,
        w: (firstOut[0]?.length || 1) / (firstIn[0]?.length || 1)
      },
      colorMapping: this.inferColorMapping(train)
    };
  }

  countObjects(grid) {
    const visited = grid.map(row => row.map(() => false));
    let count = 0;

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (!visited[r][c] && grid[r][c] !== 0) {
          this.floodFill(grid, visited, r, c, grid[r][c]);
          count++;
        }
      }
    }
    return count;
  }

  floodFill(grid, visited, r, c, color) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return;
    if (visited[r][c] || grid[r][c] !== color) return;
    visited[r][c] = true;
    this.floodFill(grid, visited, r + 1, c, color);
    this.floodFill(grid, visited, r - 1, c, color);
    this.floodFill(grid, visited, r, c + 1, color);
    this.floodFill(grid, visited, r, c - 1, color);
  }

  inferColorMapping(train) {
    const mapping = {};
    for (const { input, output } of train) {
      for (let r = 0; r < Math.min(input.length, output.length); r++) {
        for (let c = 0; c < Math.min(input[0]?.length || 0, output[0]?.length || 0); c++) {
          const inC = input[r][c];
          const outC = output[r][c];
          if (inC !== outC) {
            if (!mapping[inC]) mapping[inC] = {};
            mapping[inC][outC] = (mapping[inC][outC] || 0) + 1;
          }
        }
      }
    }
    return mapping;
  }

  /**
   * Generate ALL base strategies
   */
  generateAllStrategies(task, analysis) {
    const strategies = [];

    // Identity
    strategies.push({ name: 'identity', ops: [(g) => g] });

    // Basic transforms
    strategies.push({ name: 'rotate90', ops: [(g) => GridHelpers.rotate90(g)] });
    strategies.push({ name: 'rotate180', ops: [(g) => GridHelpers.rotate180(g)] });
    strategies.push({ name: 'rotate270', ops: [(g) => GridHelpers.rotate270(g)] });
    strategies.push({ name: 'flipHorizontal', ops: [(g) => GridHelpers.flipHorizontal(g)] });
    strategies.push({ name: 'flipVertical', ops: [(g) => GridHelpers.flipVertical(g)] });
    strategies.push({ name: 'transpose', ops: [(g) => GridHelpers.transpose(g)] });

    // Gravity
    for (const dir of ['up', 'down', 'left', 'right']) {
      strategies.push({
        name: `gravity${dir.charAt(0).toUpperCase() + dir.slice(1)}`,
        ops: [(g) => GridHelpers.gravity(g, dir)]
      });
    }

    // Color mappings
    const allColors = [...new Set([...analysis.inputColors, ...analysis.outputColors])];
    for (const fromColor of allColors) {
      for (const toColor of allColors) {
        if (fromColor !== toColor) {
          strategies.push({
            name: `color_${fromColor}→${toColor}`,
            ops: [(g) => GridHelpers.mapColors(g, { [fromColor]: toColor })]
          });
        }
      }
    }

    // Learned color mapping
    if (Object.keys(analysis.colorMapping).length > 0) {
      const inferredMap = {};
      for (const [from, tos] of Object.entries(analysis.colorMapping)) {
        const best = Object.entries(tos).sort((a, b) => b[1] - a[1])[0];
        if (best) inferredMap[from] = parseInt(best[0]);
      }
      strategies.push({
        name: 'learnedColorMap',
        ops: [(g) => GridHelpers.mapColors(g, inferredMap)]
      });
    }

    // Tiling
    for (let n = 2; n <= 4; n++) {
      strategies.push({ name: `tile${n}x${n}`, ops: [(g) => GridHelpers.tile(g, n, n)] });
      strategies.push({ name: `tile${n}x1`, ops: [(g) => GridHelpers.tile(g, n, 1)] });
      strategies.push({ name: `tile1x${n}`, ops: [(g) => GridHelpers.tile(g, 1, n)] });
    }

    // Scaling
    for (let n = 2; n <= 4; n++) {
      strategies.push({ name: `scale${n}x`, ops: [(g) => GridHelpers.scale(g, n)] });
    }

    // Extract regions (for smaller outputs)
    if (analysis.sizeChange.h < 1 || analysis.sizeChange.w < 1) {
      const outH = analysis.outputDims.h;
      const outW = analysis.outputDims.w;

      // Corners
      strategies.push({ name: 'extractTopLeft', ops: [(g) => GridHelpers.extractRegion(g, 0, 0, outH, outW)] });
      strategies.push({ name: 'extractTopRight', ops: [(g) => GridHelpers.extractRegion(g, 0, Math.max(0, g[0].length - outW), outH, outW)] });
      strategies.push({ name: 'extractBottomLeft', ops: [(g) => GridHelpers.extractRegion(g, Math.max(0, g.length - outH), 0, outH, outW)] });
      strategies.push({ name: 'extractBottomRight', ops: [(g) => GridHelpers.extractRegion(g, Math.max(0, g.length - outH), Math.max(0, g[0].length - outW), outH, outW)] });

      // Extract by color
      for (const color of analysis.inputColors) {
        strategies.push({
          name: `extractColor_${color}`,
          ops: [(g) => {
            const bounds = GridHelpers.findBoundingBox(g, color);
            if (bounds) return GridHelpers.extractRegion(g, bounds.minR, bounds.minC, bounds.maxR - bounds.minR + 1, bounds.maxC - bounds.minC + 1);
            return g;
          }]
        });
      }

      // Extract smallest/largest object
      strategies.push({ name: 'extractSmallest', ops: [(g) => GridHelpers.extractSmallestObject(g)] });
      strategies.push({ name: 'extractLargest', ops: [(g) => GridHelpers.extractLargestObject(g)] });
    }

    // Compositions of basic ops
    const basicOps = strategies.slice(0, 20);
    for (const s1 of basicOps) {
      for (const s2 of basicOps) {
        if (s1.name !== s2.name) {
          strategies.push({
            name: `${s1.name}_then_${s2.name}`,
            ops: [...s1.ops, ...s2.ops]
          });
        }
      }
    }

    // Symmetry operations
    strategies.push({
      name: 'mirrorVertical',
      ops: [(g) => {
        const flipped = GridHelpers.flipVertical(g);
        return g; // Skip concat for now
      }]
    });

    strategies.push({
      name: 'mirrorHorizontal',
      ops: [(g) => {
        const flipped = GridHelpers.flipHorizontal(g);
        return g; // Skip concat for now
      }]
    });

    // Divider-based operations (simplified)
    for (const divColor of analysis.inputColors) {
      strategies.push({
        name: `splitByDivider_${divColor}_xor`,
        ops: [(g) => g] // Placeholder
      });
    }

    return strategies;
  }

  /**
   * Validate hypothesis on training data
   */
  validateOnTraining(hypothesis, trainExamples) {
    let totalSimilarity = 0;
    let allPerfect = true;

    for (const { input, output } of trainExamples) {
      try {
        const result = this.applyHypothesis(hypothesis, input);
        const similarity = GridHelpers.compare(result, output);
        totalSimilarity += similarity;
        if (similarity < 1.0) allPerfect = false;
      } catch (e) {
        totalSimilarity += 0;
        allPerfect = false;
      }
    }

    return {
      similarity: totalSimilarity / trainExamples.length,
      perfect: allPerfect
    };
  }

  applyHypothesis(hypothesis, input) {
    let result = input;
    for (const op of hypothesis.ops) {
      try {
        result = op(result);
      } catch (e) {
        return input;
      }
    }
    return result;
  }
}

// ═══════════════════════════════════════════════════════════
// BENCHMARK RUNNER
// ═══════════════════════════════════════════════════════════

async function runBenchmark() {
  const rawDir = './raw';
  const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.json'));

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     INFINITE REASONER v4.0 - TRUE UNLIMITED MODE          ║
║     "Don't quit until 100% solved"                        ║
╚═══════════════════════════════════════════════════════════╝
`);

  // For benchmark, use 'benchmark' mode (has escape hatch)
  // For production, use 'unlimited' mode (never quits)
  const mode = process.argv.includes('--unlimited') ? 'unlimited' : 'benchmark';
  console.log(`Mode: ${mode.toUpperCase()}\n`);

  const reasoner = new InfiniteReasoner({ debug: true, solveMode: mode });

  let solved = 0;
  let total = 0;
  let totalTime = 0;
  let totalIterations = 0;
  const results = [];

  for (const file of files) {
    const taskId = file.replace('.json', '');
    const task = JSON.parse(fs.readFileSync(`${rawDir}/${file}`, 'utf8'));

    console.log(`[${taskId}]`);

    const result = reasoner.solve(task);
    total++;
    totalTime += result.timeMs;
    totalIterations += result.iterations;

    if (result.success) {
      solved++;
      console.log('');
    }

    results.push({
      taskId,
      success: result.success,
      hypothesis: result.hypothesis,
      similarity: result.bestSimilarity || 1.0,
      iterations: result.iterations,
      timeMs: result.timeMs
    });
  }

  // Summary
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    FINAL RESULTS                          ║
╠═══════════════════════════════════════════════════════════╣
║  SOLVED: ${solved}/${total} (${((solved / total) * 100).toFixed(1)}%)${' '.repeat(38 - String(solved).length - String(total).length)}║
║  Avg time: ${Math.round(totalTime / total)}ms per task${' '.repeat(30 - String(Math.round(totalTime / total)).length)}║
║  Avg iterations: ${Math.round(totalIterations / total)} per task${' '.repeat(24 - String(Math.round(totalIterations / total)).length)}║
╠═══════════════════════════════════════════════════════════╣
║  Mode: ${mode.toUpperCase()}${' '.repeat(46 - mode.length)}║
╚═══════════════════════════════════════════════════════════╝
`);

  // Save results
  fs.mkdirSync('./results', { recursive: true });
  fs.writeFileSync('./results/infinite_results.json', JSON.stringify(results, null, 2));
  console.log('Results saved to ./results/infinite_results.json');
}

// Run if called directly
if (require.main === module) {
  runBenchmark();
}

module.exports = InfiniteReasoner;
