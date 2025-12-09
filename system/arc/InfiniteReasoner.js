/**
 * INFINITE REASONING ENGINE v3.0 - UNLIMITED MODE
 *
 * THE PARADIGM: DON'T QUIT UNTIL SOLVED.
 * Training data = answer key. Iterate until you pass.
 * NO TIMEOUT. NO GIVING UP. SOLVE IT OR DIE TRYING.
 *
 * FLOWSYNC: Agents debate, question, hypothesize until solved.
 */

const Grid = require('./Primitives');
const fs = require('fs');

class InfiniteReasoner {
  constructor(options = {}) {
    this.debug = options.debug !== undefined ? options.debug : true;
    this.maxIterations = options.maxIterations || Infinity; // NO LIMIT
    this.debateRounds = 0;
    this.hypothesesTried = new Set();
  }

  /**
   * THE CORE LOOP: NEVER QUIT UNTIL SOLVED
   */
  solve(task) {
    const startTime = Date.now();
    let iteration = 0;
    let bestSimilarity = 0;
    let bestHypothesis = null;
    let debatePhase = 0;

    this.hypothesesTried.clear();

    // Pre-analyze the task deeply
    const analysis = this.analyzeTask(task);

    if (this.debug) {
      console.log(`  Colors: ${analysis.inputColors.join(',')} → ${analysis.outputColors.join(',')}`);
      console.log(`  Size: ${analysis.inputDims.h}x${analysis.inputDims.w} → ${analysis.outputDims.h}x${analysis.outputDims.w}`);
      console.log(`  Objects: ${analysis.numObjects} | New colors: ${analysis.newColors.join(',') || 'none'}`);
    }

    // PHASE 1: Try all base strategies
    let strategies = this.generateAllStrategies(task, analysis);
    if (this.debug) console.log(`  Phase 1: ${strategies.length} base strategies`);

    while (true) {
      iteration++;

      // Get next hypothesis
      let hypothesis = null;

      if (iteration <= strategies.length) {
        hypothesis = strategies[iteration - 1];
      } else {
        // DEBATE PHASE: Generate new hypotheses based on what we learned
        debatePhase++;

        if (debatePhase === 1) {
          // First debate: Analyze failures and generate targeted hypotheses
          if (this.debug) console.log(`  Phase 2: Debating... best so far ${(bestSimilarity * 100).toFixed(1)}%`);
          const newStrategies = this.debateAndGenerate(task, analysis, bestHypothesis, bestSimilarity);
          strategies = strategies.concat(newStrategies);
          if (this.debug) console.log(`    Generated ${newStrategies.length} new hypotheses`);
          continue; // Go back to try new strategies from iteration counter
        } else if (debatePhase <= 10) {
          // Subsequent debates: Mutate best hypothesis aggressively
          hypothesis = this.aggressiveMutate(bestHypothesis, strategies, analysis, debatePhase);
        } else if (debatePhase <= 100) {
          // Deep search: Random composition
          hypothesis = this.deepCompose(strategies, Math.min(debatePhase - 8, 6));
        } else if (debatePhase <= 1000) {
          // Ultra-deep: Try everything
          hypothesis = this.desperationMode(task, analysis, bestHypothesis, debatePhase);
        } else {
          // Truly exhausted - this task needs new primitives
          if (this.debug) {
            console.log(`  ✗ EXHAUSTED after ${iteration} iterations, ${debatePhase} debate rounds`);
            console.log(`    Best: ${(bestSimilarity * 100).toFixed(1)}% | ${bestHypothesis?.name || 'none'}`);
          }
          break;
        }
      }

      if (!hypothesis) continue;

      // Skip if we've tried this exact hypothesis
      const hypKey = hypothesis.name;
      if (this.hypothesesTried.has(hypKey)) continue;
      this.hypothesesTried.add(hypKey);

      // Validate against ALL training examples
      const result = this.validateOnTraining(hypothesis, task.train);

      // Track best so far
      if (result.similarity > bestSimilarity) {
        bestSimilarity = result.similarity;
        bestHypothesis = hypothesis;
        debatePhase = 0; // Reset debate when we find improvement

        if (this.debug) {
          console.log(`  [${iteration}] ${(result.similarity * 100).toFixed(1)}% | ${hypothesis.name}`);
        }
      }

      // PERFECT MATCH = SOLVED!
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

      // Progress indicator for long searches
      if (iteration % 10000 === 0 && this.debug) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`    ... ${iteration} iterations, ${elapsed}s, best ${(bestSimilarity * 100).toFixed(1)}%`);
      }
    }

    // Return best attempt (shouldn't reach here in unlimited mode for solvable tasks)
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
   * DEBATE PHASE: Analyze why we failed and generate new hypotheses
   */
  debateAndGenerate(task, analysis, bestHypothesis, bestSimilarity) {
    const newStrategies = [];

    // Question 1: What's different between input and output?
    const sizeRatioH = analysis.outputDims.h / analysis.inputDims.h;
    const sizeRatioW = analysis.outputDims.w / analysis.inputDims.w;

    // If output is smaller, try more extraction methods
    if (sizeRatioH < 1 || sizeRatioW < 1) {
      // Try extracting at different positions
      for (let r = 0; r < analysis.inputDims.h - analysis.outputDims.h + 1; r++) {
        for (let c = 0; c < analysis.inputDims.w - analysis.outputDims.w + 1; c++) {
          newStrategies.push({
            name: `extract_at_${r}_${c}`,
            ops: [(g) => Grid.extractRegion(g, r, c, analysis.outputDims.h, analysis.outputDims.w)]
          });
        }
      }
    }

    // Question 2: What colors changed?
    for (const inColor of analysis.inputColors) {
      for (const outColor of analysis.outputColors) {
        if (inColor !== outColor) {
          // Try color replacement combined with other ops
          newStrategies.push({
            name: `color${inColor}to${outColor}_then_extractBB`,
            ops: [
              (g) => Grid.replaceColor(g, inColor, outColor),
              (g) => Grid.extractBoundingBox(g)
            ]
          });
        }
      }
    }

    // Question 3: Are there patterns we missed?
    // Try each object extraction with transforms
    for (const color of analysis.inputColors) {
      for (const transform of ['rotate90', 'rotate180', 'rotate270', 'flipH', 'flipV']) {
        newStrategies.push({
          name: `obj_${color}_${transform}`,
          ops: [
            (g) => Grid.extractObjectByColor(g, color),
            (g) => this.applyTransform(g, transform)
          ]
        });
      }
    }

    // Question 4: What if best hypothesis is close but needs tweaking?
    if (bestHypothesis && bestSimilarity > 0.5) {
      // Try best hypothesis with additional transforms
      const tweaks = ['rotate90', 'rotate180', 'rotate270', 'flipH', 'flipV', 'transpose'];
      for (const tweak of tweaks) {
        newStrategies.push({
          name: `${bestHypothesis.name}_then_${tweak}`,
          ops: [...bestHypothesis.ops, (g) => this.applyTransform(g, tweak)]
        });
        newStrategies.push({
          name: `${tweak}_then_${bestHypothesis.name}`,
          ops: [(g) => this.applyTransform(g, tweak), ...bestHypothesis.ops]
        });
      }
    }

    // Question 5: Grid-based patterns
    for (const gridColor of analysis.inputColors) {
      newStrategies.push({
        name: `cells_${gridColor}_unique`,
        ops: [(g) => Grid.findUniqueCell(g, gridColor)]
      });
      newStrategies.push({
        name: `cells_${gridColor}_smallest_extractBB`,
        ops: [
          (g) => Grid.findSmallestCell(g, gridColor),
          (g) => Grid.extractBoundingBox(g)
        ]
      });
    }

    return newStrategies;
  }

  /**
   * Aggressive mutation of best hypothesis
   */
  aggressiveMutate(best, strategies, analysis, round) {
    if (!best) {
      return strategies[Math.floor(Math.random() * strategies.length)];
    }

    const baseOps = strategies.slice(0, 30);
    const mutations = [];

    // Add random op at end
    mutations.push(() => {
      const rnd = baseOps[Math.floor(Math.random() * baseOps.length)];
      return {
        name: `${best.name}→${rnd.name}`,
        ops: [...best.ops, ...rnd.ops]
      };
    });

    // Add random op at start
    mutations.push(() => {
      const rnd = baseOps[Math.floor(Math.random() * baseOps.length)];
      return {
        name: `${rnd.name}→${best.name}`,
        ops: [...rnd.ops, ...best.ops]
      };
    });

    // Replace middle op
    mutations.push(() => {
      if (best.ops.length > 1) {
        const rnd = baseOps[Math.floor(Math.random() * baseOps.length)];
        const idx = Math.floor(Math.random() * best.ops.length);
        const newOps = [...best.ops];
        newOps[idx] = rnd.ops[0];
        return { name: `${best.name}_mutate${idx}`, ops: newOps };
      }
      return best;
    });

    // Insert op in middle
    mutations.push(() => {
      const rnd = baseOps[Math.floor(Math.random() * baseOps.length)];
      const idx = Math.floor(Math.random() * (best.ops.length + 1));
      const newOps = [...best.ops.slice(0, idx), ...rnd.ops, ...best.ops.slice(idx)];
      return { name: `${best.name}_insert_${rnd.name}`, ops: newOps };
    });

    const mutation = mutations[Math.floor(Math.random() * mutations.length)];
    return mutation();
  }

  /**
   * Deep composition - random chains
   */
  deepCompose(strategies, depth) {
    const baseOps = strategies.slice(0, 25);
    let result = { name: '', ops: [] };

    for (let i = 0; i < depth; i++) {
      const s = baseOps[Math.floor(Math.random() * baseOps.length)];
      result.name += (result.name ? '→' : '') + s.name;
      result.ops.push(...s.ops);
    }

    return result;
  }

  /**
   * Desperation mode - try wild combinations
   */
  desperationMode(task, analysis, bestHypothesis, round) {
    // Try increasingly wild combinations
    const allOps = [
      (g) => Grid.rotate(g, 90),
      (g) => Grid.rotate(g, 180),
      (g) => Grid.rotate(g, 270),
      (g) => Grid.flipHorizontal(g),
      (g) => Grid.flipVertical(g),
      (g) => Grid.transpose(g),
      (g) => Grid.extractBoundingBox(g),
      (g) => Grid.extractLargestObject(g),
      (g) => Grid.extractSmallestObject(g),
      (g) => Grid.gravity(g, 'down'),
      (g) => Grid.gravity(g, 'up'),
      (g) => Grid.gravity(g, 'left'),
      (g) => Grid.gravity(g, 'right'),
      (g) => Grid.dilate(g),
      (g) => Grid.erode(g),
      (g) => Grid.makeSymmetricH(g),
      (g) => Grid.makeSymmetricV(g),
      (g) => Grid.findSmallestCell(g),
      (g) => Grid.findLargestCell(g),
    ];

    // Random chain of 2-5 ops
    const chainLen = 2 + Math.floor(Math.random() * 4);
    const ops = [];
    let name = '';

    for (let i = 0; i < chainLen; i++) {
      const idx = Math.floor(Math.random() * allOps.length);
      ops.push(allOps[idx]);
      name += (name ? '→' : '') + `op${idx}`;
    }

    return { name: `desperation_${round}_${name}`, ops };
  }

  /**
   * Apply a named transform
   */
  applyTransform(grid, name) {
    switch (name) {
      case 'rotate90': return Grid.rotate(grid, 90);
      case 'rotate180': return Grid.rotate(grid, 180);
      case 'rotate270': return Grid.rotate(grid, 270);
      case 'flipH': return Grid.flipHorizontal(grid);
      case 'flipV': return Grid.flipVertical(grid);
      case 'transpose': return Grid.transpose(grid);
      default: return grid;
    }
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

    let scaleFactorH = outH / inH;
    let scaleFactorW = outW / inW;

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

    strategies.push({
      name: 'learnedColorMap',
      ops: [(g) => this.applyLearnedColorMap(g, task.train)]
    });

    // === LEVEL 9: Draw Patterns ===
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
    const baseOps = strategies.slice(0, 20);
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
    strategies.push({ name: 'quadrant_topLeft', ops: [(g) => Grid.splitIntoQuadrants(g).topLeft] });
    strategies.push({ name: 'quadrant_topRight', ops: [(g) => Grid.splitIntoQuadrants(g).topRight] });
    strategies.push({ name: 'quadrant_bottomLeft', ops: [(g) => Grid.splitIntoQuadrants(g).bottomLeft] });
    strategies.push({ name: 'quadrant_bottomRight', ops: [(g) => Grid.splitIntoQuadrants(g).bottomRight] });

    // === LEVEL 15: Grid Cell Extraction ===
    strategies.push({ name: 'findSmallestCell', ops: [(g) => Grid.findSmallestCell(g)] });
    strategies.push({ name: 'findLargestCell', ops: [(g) => Grid.findLargestCell(g)] });
    strategies.push({ name: 'findUniqueCell', ops: [(g) => Grid.findUniqueCell(g)] });

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
      const { h: outH, w: outW } = analysis.outputDims;
      strategies.push({
        name: `cropToSize_${outH}x${outW}`,
        ops: [(g) => Grid.extractRegion(g, 0, 0, outH, outW)]
      });
    }

    return strategies;
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
// BATTLE HARNESS - UNLIMITED MODE
// ═══════════════════════════════════════════════════════════

async function runBattle(options = {}) {
  const rawDir = options.rawDir || './raw';
  const debug = options.debug !== undefined ? options.debug : true;

  const reasoner = new InfiniteReasoner({ debug });

  const taskFiles = fs.readdirSync(rawDir).filter(f => f.endsWith('.json')).sort();

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     INFINITE REASONING ENGINE v3.0 - UNLIMITED            ║');
  console.log('║     "NEVER QUIT. SOLVE IT OR DIE TRYING."                 ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║     Tasks: ${taskFiles.length.toString().padEnd(45)}║`);
  console.log('║     Mode: UNLIMITED TIME PER TASK                         ║');
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
    }

    results.push({ taskId, ...result });
  }

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

  try {
    fs.mkdirSync('./results', { recursive: true });
    fs.writeFileSync('./results/infinite_results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to ./results/infinite_results.json');
  } catch (e) {
    console.log('Could not save results:', e.message);
  }

  return { solved, total: taskFiles.length, pct: parseFloat(pct), results };
}

module.exports = { InfiniteReasoner, runBattle };

if (require.main === module) {
  runBattle({ debug: true }).catch(console.error);
}
