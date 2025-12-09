/**
 * UNLIMITED SOLVER
 *
 * "Stop racing. Actually reason."
 *
 * No time limit. Keep trying until you get the RIGHT answer.
 * The training examples ARE the answer key - use them.
 */

const Grid = require('./Primitives');
const AbstractionEngine = require('./AbstractionEngine');
const ReasoningEngine = require('./ReasoningEngine');
const fs = require('fs');
const path = require('path');

class UnlimitedSolver {
  constructor() {
    this.baseEngine = new AbstractionEngine();
    this.reasoningEngine = new ReasoningEngine();
    this.maxIterations = 10000; // Faster testing
    this.debugMode = false;
  }

  /**
   * Solve until correct - no time limit
   */
  solve(task) {
    const { train, test } = task;
    const startTime = Date.now();

    // Phase 1: Try base engine
    let result = this.baseEngine.solve(task);
    if (this.verifiesOnTraining(result, train)) {
      return { ...result, iterations: 1, time: Date.now() - startTime };
    }

    // Phase 2: Try reasoning engine
    result = this.reasoningEngine.solve(task);
    if (result.success && this.verifiesOnTraining(result, train)) {
      return { ...result, iterations: 2, time: Date.now() - startTime };
    }

    // Phase 3: Exhaustive search - try EVERY combination
    let iterations = 2;

    // 3a: Try all single strategies with all parameter variations
    const strategies = this.getAllStrategiesWithParams(train);
    for (const strat of strategies) {
      iterations++;
      if (this.tryStrategy(strat, train)) {
        const predictions = test.map(t => strat.apply(t.input));
        return {
          success: true,
          strategy: strat.name,
          predictions,
          confidence: 1.0,
          iterations,
          time: Date.now() - startTime
        };
      }
      if (iterations > this.maxIterations) break;
    }

    // 3b: Try strategy PAIRS
    for (const s1 of strategies) {
      for (const s2 of strategies) {
        iterations++;
        const combined = {
          name: `${s1.name}+${s2.name}`,
          apply: (input) => s2.apply(s1.apply(input))
        };
        if (this.tryStrategy(combined, train)) {
          const predictions = test.map(t => combined.apply(t.input));
          return {
            success: true,
            strategy: combined.name,
            predictions,
            confidence: 0.95,
            iterations,
            time: Date.now() - startTime
          };
        }
        if (iterations > this.maxIterations) break;
      }
      if (iterations > this.maxIterations) break;
    }

    // 3c: Try strategy TRIPLES
    for (const s1 of strategies) {
      for (const s2 of strategies) {
        for (const s3 of strategies) {
          iterations++;
          const combined = {
            name: `${s1.name}+${s2.name}+${s3.name}`,
            apply: (input) => s3.apply(s2.apply(s1.apply(input)))
          };
          if (this.tryStrategy(combined, train)) {
            const predictions = test.map(t => combined.apply(t.input));
            return {
              success: true,
              strategy: combined.name,
              predictions,
              confidence: 0.9,
              iterations,
              time: Date.now() - startTime
            };
          }
          if (iterations > this.maxIterations) break;
        }
        if (iterations > this.maxIterations) break;
      }
      if (iterations > this.maxIterations) break;
    }

    // Phase 4: DIRECT LEARNING - analyze cell-by-cell what changed and replicate
    const directLearned = this.directLearn(train, test);
    if (directLearned) {
      return {
        success: true,
        strategy: 'directLearned',
        predictions: directLearned,
        confidence: 0.8,
        iterations,
        time: Date.now() - startTime
      };
    }

    // Phase 5: Failed after exhaustive search
    return {
      success: false,
      strategy: 'exhausted',
      predictions: test.map(t => Grid.copy(t.input)),
      confidence: 0,
      iterations,
      time: Date.now() - startTime
    };
  }

  /**
   * DIRECT LEARNING: Figure out the transformation by analyzing examples
   * Look at what changes and WHY, then apply the same logic
   */
  directLearn(train, test) {
    // Analyze each training example
    const transformations = train.map(({ input, output }) => this.analyzeTransformation(input, output));

    // Find common patterns
    const commonPattern = this.findCommonPattern(transformations);
    if (!commonPattern) return null;

    // Verify pattern works on all training
    for (const { input, output } of train) {
      const predicted = this.applyPattern(commonPattern, input);
      if (!Grid.equals(predicted, output)) {
        return null;
      }
    }

    // Apply to test
    return test.map(t => this.applyPattern(commonPattern, t.input));
  }

  analyzeTransformation(input, output) {
    const h = input.length, w = input[0].length;
    const outH = output.length, outW = output[0].length;

    // Size analysis
    const sameSize = h === outH && w === outW;
    const scaleH = outH / h, scaleW = outW / w;

    // Cell change analysis
    const changes = [];
    if (sameSize) {
      for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
          if (input[i][j] !== output[i][j]) {
            changes.push({
              r: i, c: j,
              from: input[i][j],
              to: output[i][j],
              neighbors: this.getNeighborSignature(input, i, j)
            });
          }
        }
      }
    }

    return { sameSize, scaleH, scaleW, changes };
  }

  getNeighborSignature(grid, r, c) {
    const h = grid.length, w = grid[0].length;
    const sig = [];
    const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < h && nc >= 0 && nc < w) {
        sig.push(grid[nr][nc]);
      } else {
        sig.push(-1);
      }
    }
    return sig.join(',');
  }

  findCommonPattern(transformations) {
    if (transformations.length === 0) return null;

    // Check if all have same-size transforms
    if (!transformations.every(t => t.sameSize)) return null;

    // Collect all change rules
    const changeRules = {};
    for (const t of transformations) {
      for (const change of t.changes) {
        const key = `${change.from}_${change.neighbors}`;
        if (!changeRules[key]) {
          changeRules[key] = { to: change.to, count: 0 };
        }
        if (changeRules[key].to === change.to) {
          changeRules[key].count++;
        }
      }
    }

    // Only keep rules that apply consistently
    const rules = [];
    for (const [key, rule] of Object.entries(changeRules)) {
      if (rule.count >= transformations.length) {
        const [from, neighbors] = key.split('_');
        rules.push({
          from: parseInt(from),
          neighborSig: neighbors,
          to: rule.to
        });
      }
    }

    if (rules.length === 0) return null;

    return { type: 'neighborRule', rules };
  }

  applyPattern(pattern, input) {
    if (pattern.type === 'neighborRule') {
      const result = Grid.copy(input);
      const h = input.length, w = input[0].length;

      for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
          const sig = this.getNeighborSignature(input, i, j);
          for (const rule of pattern.rules) {
            if (input[i][j] === rule.from && sig === rule.neighborSig) {
              result[i][j] = rule.to;
              break;
            }
          }
        }
      }

      return result;
    }

    return Grid.copy(input);
  }

  verifiesOnTraining(result, train) {
    if (!result.predictions) return false;
    // For training verification, we apply to training inputs
    const analysis = this.baseEngine.analyzeExamples(train);
    for (let i = 0; i < train.length; i++) {
      try {
        const predicted = this.baseEngine.applyStrategy(result.strategy, train[i].input, analysis);
        if (!Grid.equals(predicted, train[i].output)) {
          return false;
        }
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  tryStrategy(strategy, train) {
    for (const { input, output } of train) {
      try {
        const predicted = strategy.apply(input);
        if (!Grid.equals(predicted, output)) {
          return false;
        }
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  getAllStrategiesWithParams(train) {
    const strategies = [];
    const analysis = this.baseEngine.analyzeExamples(train);
    const colors = Array.from(analysis.inputColors).filter(c => c !== 0);
    const outputColors = Array.from(analysis.outputColors).filter(c => c !== 0);
    const allColors = [...new Set([...colors, ...outputColors])];

    // Basic transforms
    strategies.push({ name: 'identity', apply: g => Grid.copy(g) });
    strategies.push({ name: 'rotate90', apply: g => Grid.rotate90(g) });
    strategies.push({ name: 'rotate180', apply: g => Grid.rotate180(g) });
    strategies.push({ name: 'rotate270', apply: g => Grid.rotate270(g) });
    strategies.push({ name: 'flipH', apply: g => Grid.flipHorizontal(g) });
    strategies.push({ name: 'flipV', apply: g => Grid.flipVertical(g) });
    strategies.push({ name: 'transpose', apply: g => Grid.transpose(g) });
    strategies.push({ name: 'extract', apply: g => Grid.extractBoundingBox(g) });
    strategies.push({ name: 'mirrorH', apply: g => Grid.mirrorHorizontal(g) });
    strategies.push({ name: 'mirrorV', apply: g => Grid.mirrorVertical(g) });
    strategies.push({ name: 'gravity', apply: g => Grid.gravityDown(g) });

    // POINT SYMMETRY - complete the pattern
    strategies.push({ name: 'pointSymmetry', apply: g => this.applyPointSymmetry(g) });

    // HORIZONTAL REFLECTION - reflect shape horizontally with new color
    for (const c of allColors) {
      strategies.push({ name: `reflectH_${c}`, apply: g => this.applyHorizontalReflection(g, c) });
    }

    // Color-parameterized strategies
    for (const c1 of colors) {
      strategies.push({ name: `floodFill_${c1}`, apply: g => Grid.floodFillEnclosed(g, c1, 4) });

      for (const c2 of [1,2,3,4,5,6,7,8,9]) {
        strategies.push({ name: `cross_${c1}_${c2}`, apply: g => Grid.drawCrossAround(g, c1, c2) });
        strategies.push({ name: `diag_${c1}_${c2}`, apply: g => this.drawDiagonalAround(g, c1, c2) });
        strategies.push({ name: `colorMap_${c1}_${c2}`, apply: g => Grid.replaceColor(g, c1, c2) });
      }

      for (const c2 of colors) {
        if (c1 !== c2) {
          strategies.push({ name: `move_${c1}_to_${c2}`, apply: g => Grid.moveObjectToAnchor(g, c1, c2) });
        }
      }
    }

    // Scale operations
    strategies.push({ name: 'scale2x', apply: g => Grid.scale(g, 2) });
    strategies.push({ name: 'scale3x', apply: g => Grid.scale(g, 3) });
    strategies.push({ name: 'downscale2x', apply: g => Grid.downscale(g, 2) });

    // Tile operations
    strategies.push({ name: 'tileH2', apply: g => Grid.tileHorizontal(g, 2) });
    strategies.push({ name: 'tileV2', apply: g => Grid.tileVertical(g, 2) });
    strategies.push({ name: 'tileH3', apply: g => Grid.tileHorizontal(g, 3) });
    strategies.push({ name: 'tileV3', apply: g => Grid.tileVertical(g, 3) });

    // Dedupe
    strategies.push({ name: 'dedupH', apply: g => Grid.deduplicateHorizontal(g) });
    strategies.push({ name: 'dedupV', apply: g => Grid.deduplicateVertical(g) });

    // LEARNED: apply the EXACT transformation learned from training
    const learnedRules = this.learnCellRules(train);
    if (learnedRules) {
      strategies.push({ name: 'learnedCellRules', apply: g => this.applyCellRules(g, learnedRules) });
    }

    // NEIGHBOR BASED: what if output depends on neighbors?
    strategies.push({ name: 'neighborSum', apply: g => this.applyNeighborRule(g, 'sum') });
    strategies.push({ name: 'neighborMax', apply: g => this.applyNeighborRule(g, 'max') });

    return strategies;
  }

  learnCellRules(train) {
    // Learn what transformation happens to each cell
    // Return a rule like: "if neighbor count > 2, output color X"
    const rules = [];

    for (const { input, output } of train) {
      if (input.length !== output.length || input[0].length !== output[0].length) continue;

      for (let i = 0; i < input.length; i++) {
        for (let j = 0; j < input[0].length; j++) {
          const inVal = input[i][j];
          const outVal = output[i][j];
          if (inVal !== outVal) {
            // Something changed - figure out why
            const neighbors = this.getNeighborCount(input, i, j);
            rules.push({
              from: inVal,
              to: outVal,
              neighborCount: neighbors.count,
              neighborColors: neighbors.colors
            });
          }
        }
      }
    }

    if (rules.length === 0) return null;

    // Find most common rule
    const ruleMap = {};
    for (const r of rules) {
      const key = `${r.from}->${r.to}`;
      ruleMap[key] = (ruleMap[key] || 0) + 1;
    }

    let bestRule = null;
    let bestCount = 0;
    for (const [key, count] of Object.entries(ruleMap)) {
      if (count > bestCount) {
        bestCount = count;
        const [from, to] = key.split('->').map(Number);
        bestRule = { from, to };
      }
    }

    return bestRule;
  }

  applyCellRules(grid, rule) {
    const result = Grid.copy(grid);
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length; j++) {
        if (grid[i][j] === rule.from) {
          result[i][j] = rule.to;
        }
      }
    }
    return result;
  }

  getNeighborCount(grid, r, c) {
    const h = grid.length, w = grid[0].length;
    let count = 0;
    const colors = new Set();
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < h && nc >= 0 && nc < w && grid[nr][nc] !== 0) {
        count++;
        colors.add(grid[nr][nc]);
      }
    }
    return { count, colors: Array.from(colors) };
  }

  applyNeighborRule(grid, mode) {
    const result = Grid.copy(grid);
    const h = grid.length, w = grid[0].length;

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const n = this.getNeighborCount(grid, i, j);
        if (mode === 'sum' && n.count >= 4 && grid[i][j] === 0) {
          result[i][j] = n.colors[0] || 1;
        } else if (mode === 'max' && n.count >= 3 && grid[i][j] === 0) {
          result[i][j] = Math.max(...n.colors, 0);
        }
      }
    }
    return result;
  }

  applyPointSymmetry(grid) {
    const result = Grid.copy(grid);
    const h = grid.length, w = grid[0].length;

    // Find all non-zero cells
    const nonZero = [];
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (grid[i][j] !== 0) nonZero.push({ r: i, c: j, v: grid[i][j] });
      }
    }
    if (nonZero.length === 0) return result;

    // Find center
    const centerR = nonZero.reduce((s, p) => s + p.r, 0) / nonZero.length;
    const centerC = nonZero.reduce((s, p) => s + p.c, 0) / nonZero.length;

    // Mirror each cell about center
    for (const { r, c, v } of nonZero) {
      const symR = Math.round(2 * centerR - r);
      const symC = Math.round(2 * centerC - c);
      if (symR >= 0 && symR < h && symC >= 0 && symC < w && result[symR][symC] === 0) {
        result[symR][symC] = v;
      }
    }
    return result;
  }

  applyHorizontalReflection(grid, newColor) {
    const result = Grid.copy(grid);
    const h = grid.length, w = grid[0].length;

    // Find leftmost column with content
    let leftCol = w;
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (grid[i][j] !== 0 && j < leftCol) leftCol = j;
      }
    }
    if (leftCol === w) return result;

    // For each non-zero cell, add a horizontally reflected copy to the left
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (grid[i][j] !== 0) {
          const mirrorJ = 2 * leftCol - j - 1;
          if (mirrorJ >= 0 && mirrorJ < w && result[i][mirrorJ] === 0) {
            result[i][mirrorJ] = newColor;
          }
        }
      }
    }
    return result;
  }

  drawDiagonalAround(grid, targetColor, drawColor) {
    const result = Grid.copy(grid);
    const h = grid.length, w = grid[0].length;

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (grid[i][j] === targetColor) {
          // Draw on diagonals
          if (i > 0 && j > 0 && result[i-1][j-1] === 0) result[i-1][j-1] = drawColor;
          if (i > 0 && j < w-1 && result[i-1][j+1] === 0) result[i-1][j+1] = drawColor;
          if (i < h-1 && j > 0 && result[i+1][j-1] === 0) result[i+1][j-1] = drawColor;
          if (i < h-1 && j < w-1 && result[i+1][j+1] === 0) result[i+1][j+1] = drawColor;
        }
      }
    }
    return result;
  }

  /**
   * Run on all local tasks
   */
  async runAll() {
    const rawDir = path.join(__dirname, 'raw');
    const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.json'));

    console.log('╔════════════════════════════════════════╗');
    console.log('║    UNLIMITED SOLVER - NO TIME LIMIT    ║');
    console.log('║     Keep trying until CORRECT          ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    console.log(`Tasks: ${files.length}`);
    console.log('');

    let solved = 0;
    let totalIterations = 0;
    let totalTime = 0;

    for (const file of files) {
      const taskId = file.replace('.json', '');
      const taskData = JSON.parse(fs.readFileSync(path.join(rawDir, file)));
      const task = { id: taskId, ...taskData };

      const result = this.solve(task);
      totalIterations += result.iterations;
      totalTime += result.time;

      // Verify against actual test output
      let correct = true;
      for (let i = 0; i < task.test.length; i++) {
        if (!Grid.equals(result.predictions[i], task.test[i].output)) {
          correct = false;
          break;
        }
      }

      if (correct) {
        solved++;
        console.log(`✓ ${taskId} | ${result.strategy} | ${result.iterations} iters | ${result.time}ms`);
      } else {
        console.log(`✗ ${taskId} | ${result.strategy} | ${result.iterations} iters | ${result.time}ms`);
      }
    }

    console.log('');
    console.log('════════════════════════════════════════');
    console.log(`SOLVED: ${solved}/${files.length} (${(solved/files.length*100).toFixed(1)}%)`);
    console.log(`Total iterations: ${totalIterations}`);
    console.log(`Total time: ${(totalTime/1000).toFixed(1)}s`);
    console.log(`Avg time per task: ${(totalTime/files.length).toFixed(0)}ms`);
    console.log('════════════════════════════════════════');

    return { solved, total: files.length };
  }
}

// Run if called directly
if (require.main === module) {
  const solver = new UnlimitedSolver();
  solver.runAll();
}

module.exports = UnlimitedSolver;
