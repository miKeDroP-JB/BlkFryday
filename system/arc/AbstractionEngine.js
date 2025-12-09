/**
 * ARC-AGI ABSTRACTION ENGINE
 * The core reasoning module for abstract pattern recognition
 *
 * "The alchemists weren't trying to make gold.
 *  They were trying to understand the source code of reality."
 *
 * THE SIMULATION LEARNS TO THINK
 */

const Grid = require('./Primitives');

class AbstractionEngine {
  constructor() {
    this.strategies = [
      // Direct transformations
      'identity',
      'extractBoundingBox',
      'rotate90',
      'rotate180',
      'rotate270',
      'flipHorizontal',
      'flipVertical',
      'transpose',

      // Object-based
      'extractLargestObject',
      'extractSmallestObject',
      'extractByColor',

      // Color operations
      'swapColors',
      'replaceBackground',
      'mostCommonToOutput',

      // Pattern operations
      'tilePattern',
      'scaleUp',
      'scaleDown',
      'fillEnclosed',

      // Composite strategies
      'extractThenRotate',
      'extractThenFlip',
      'objectsToPattern',
    ];

    this.debugMode = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN SOLVER
  // ═══════════════════════════════════════════════════════════════

  solve(task) {
    const { train, test } = task;

    // Phase 1: Analyze training examples
    const analysis = this.analyzeExamples(train);

    // Phase 2: Try each strategy
    for (const strategy of this.strategies) {
      const hypothesis = this.testStrategy(strategy, train, analysis);
      if (hypothesis.valid) {
        // Apply to test inputs
        const predictions = test.map(t => this.applyStrategy(strategy, t.input, analysis));
        return {
          success: true,
          strategy,
          predictions,
          confidence: hypothesis.confidence
        };
      }
    }

    // Phase 3: Try program synthesis (DSL search)
    const synthesized = this.synthesizeProgram(train, analysis);
    if (synthesized) {
      const predictions = test.map(t => this.runProgram(synthesized.program, t.input));
      return {
        success: true,
        strategy: 'synthesized',
        program: synthesized.program,
        predictions,
        confidence: synthesized.confidence
      };
    }

    // Phase 4: Fallback - best guess
    return {
      success: false,
      strategy: 'fallback',
      predictions: test.map(t => this.bestGuess(t.input, train, analysis)),
      confidence: 0.1
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // ANALYSIS
  // ═══════════════════════════════════════════════════════════════

  analyzeExamples(examples) {
    const analysis = {
      inputSizes: [],
      outputSizes: [],
      sizeRelation: null,
      inputColors: new Set(),
      outputColors: new Set(),
      colorMapping: {},
      objectCounts: [],
      commonPatterns: []
    };

    for (const { input, output } of examples) {
      const inDim = Grid.dimensions(input);
      const outDim = Grid.dimensions(output);

      analysis.inputSizes.push(inDim);
      analysis.outputSizes.push(outDim);

      Grid.getColors(input).forEach(c => analysis.inputColors.add(c));
      Grid.getColors(output).forEach(c => analysis.outputColors.add(c));

      analysis.objectCounts.push({
        input: Grid.findConnectedComponents(input).length,
        output: Grid.findConnectedComponents(output).length
      });
    }

    // Detect size relationship
    analysis.sizeRelation = this.detectSizeRelation(analysis);

    // Detect color mapping
    analysis.colorMapping = this.detectColorMapping(examples);

    return analysis;
  }

  detectSizeRelation(analysis) {
    const { inputSizes, outputSizes } = analysis;

    // Same size?
    if (inputSizes.every((s, i) =>
      s.height === outputSizes[i].height && s.width === outputSizes[i].width)) {
      return 'same';
    }

    // Output is cropped?
    if (outputSizes.every((s, i) =>
      s.height <= inputSizes[i].height && s.width <= inputSizes[i].width)) {
      return 'crop';
    }

    // Output is scaled?
    const scales = inputSizes.map((s, i) => ({
      h: outputSizes[i].height / s.height,
      w: outputSizes[i].width / s.width
    }));
    if (scales.every(s => s.h === scales[0].h && s.w === scales[0].w && Number.isInteger(s.h))) {
      return { type: 'scale', factor: scales[0].h };
    }

    // Constant output size?
    if (outputSizes.every(s =>
      s.height === outputSizes[0].height && s.width === outputSizes[0].width)) {
      return { type: 'constant', size: outputSizes[0] };
    }

    return 'variable';
  }

  detectColorMapping(examples) {
    const mapping = {};
    for (const { input, output } of examples) {
      const inColors = Grid.getNonZeroColors(input);
      const outColors = Grid.getNonZeroColors(output);

      // Simple 1:1 mapping check
      if (inColors.length === outColors.length) {
        inColors.forEach((c, i) => {
          mapping[c] = outColors[i];
        });
      }
    }
    return mapping;
  }

  // ═══════════════════════════════════════════════════════════════
  // STRATEGY TESTING
  // ═══════════════════════════════════════════════════════════════

  testStrategy(strategy, examples, analysis) {
    let correct = 0;

    for (const { input, output } of examples) {
      const predicted = this.applyStrategy(strategy, input, analysis);
      if (Grid.equals(predicted, output)) {
        correct++;
      }
    }

    return {
      valid: correct === examples.length,
      confidence: correct / examples.length
    };
  }

  applyStrategy(strategy, input, analysis) {
    switch (strategy) {
      case 'identity':
        return Grid.copy(input);

      case 'extractBoundingBox':
        return Grid.extractBoundingBox(input);

      case 'rotate90':
        return Grid.rotate90(input);

      case 'rotate180':
        return Grid.rotate180(input);

      case 'rotate270':
        return Grid.rotate270(input);

      case 'flipHorizontal':
        return Grid.flipHorizontal(input);

      case 'flipVertical':
        return Grid.flipVertical(input);

      case 'transpose':
        return Grid.transpose(input);

      case 'extractLargestObject':
        return this.extractLargestObject(input);

      case 'extractSmallestObject':
        return this.extractSmallestObject(input);

      case 'extractByColor':
        return this.extractByMostCommonColor(input);

      case 'fillEnclosed':
        const mainColor = Grid.getMostCommonColor(input);
        return Grid.fillEnclosed(input, mainColor, mainColor);

      case 'scaleUp':
        if (typeof analysis.sizeRelation === 'object' && analysis.sizeRelation.type === 'scale') {
          return Grid.scale(input, analysis.sizeRelation.factor);
        }
        return Grid.scale(input, 2);

      case 'extractThenRotate':
        return Grid.rotate90(Grid.extractBoundingBox(input));

      case 'extractThenFlip':
        return Grid.flipHorizontal(Grid.extractBoundingBox(input));

      case 'swapColors':
        return this.applyColorSwap(input, analysis);

      default:
        return Grid.copy(input);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // OBJECT EXTRACTION HELPERS
  // ═══════════════════════════════════════════════════════════════

  extractLargestObject(grid) {
    const components = Grid.findConnectedComponents(grid);
    if (components.length === 0) return [[]];

    let largest = components[0];
    for (const comp of components) {
      if (comp.cells.length > largest.cells.length) {
        largest = comp;
      }
    }
    return Grid.extractObject(grid, largest);
  }

  extractSmallestObject(grid) {
    const components = Grid.findConnectedComponents(grid);
    if (components.length === 0) return [[]];

    let smallest = components[0];
    for (const comp of components) {
      if (comp.cells.length < smallest.cells.length) {
        smallest = comp;
      }
    }
    return Grid.extractObject(grid, smallest);
  }

  extractByMostCommonColor(grid) {
    const color = Grid.getMostCommonColor(grid);
    const filtered = grid.map(row => row.map(c => c === color ? c : 0));
    return Grid.extractBoundingBox(filtered);
  }

  applyColorSwap(grid, analysis) {
    let result = Grid.copy(grid);
    for (const [from, to] of Object.entries(analysis.colorMapping)) {
      result = Grid.replaceColor(result, parseInt(from), to);
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // PROGRAM SYNTHESIS (DSL)
  // ═══════════════════════════════════════════════════════════════

  synthesizeProgram(examples, analysis) {
    // Build a DSL program from primitives
    const dsl = [
      { op: 'extract', fn: g => Grid.extractBoundingBox(g) },
      { op: 'rotate90', fn: g => Grid.rotate90(g) },
      { op: 'rotate180', fn: g => Grid.rotate180(g) },
      { op: 'flipH', fn: g => Grid.flipHorizontal(g) },
      { op: 'flipV', fn: g => Grid.flipVertical(g) },
      { op: 'transpose', fn: g => Grid.transpose(g) },
    ];

    // Try single operations
    for (const { op, fn } of dsl) {
      if (this.programSolvesAll([fn], examples)) {
        return { program: [op], confidence: 1.0 };
      }
    }

    // Try pairs of operations
    for (const op1 of dsl) {
      for (const op2 of dsl) {
        const program = [op1.fn, op2.fn];
        if (this.programSolvesAll(program, examples)) {
          return { program: [op1.op, op2.op], confidence: 0.9 };
        }
      }
    }

    // Try triples
    for (const op1 of dsl) {
      for (const op2 of dsl) {
        for (const op3 of dsl) {
          const program = [op1.fn, op2.fn, op3.fn];
          if (this.programSolvesAll(program, examples)) {
            return { program: [op1.op, op2.op, op3.op], confidence: 0.8 };
          }
        }
      }
    }

    return null;
  }

  programSolvesAll(program, examples) {
    for (const { input, output } of examples) {
      let result = input;
      for (const fn of program) {
        result = fn(result);
      }
      if (!Grid.equals(result, output)) {
        return false;
      }
    }
    return true;
  }

  runProgram(programOps, input) {
    const ops = {
      'extract': g => Grid.extractBoundingBox(g),
      'rotate90': g => Grid.rotate90(g),
      'rotate180': g => Grid.rotate180(g),
      'flipH': g => Grid.flipHorizontal(g),
      'flipV': g => Grid.flipVertical(g),
      'transpose': g => Grid.transpose(g),
    };

    let result = input;
    for (const op of programOps) {
      if (ops[op]) {
        result = ops[op](result);
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // FALLBACK
  // ═══════════════════════════════════════════════════════════════

  bestGuess(input, examples, analysis) {
    // Use most similar training example
    let bestSim = -1;
    let bestOutput = input;

    for (const { input: trainIn, output: trainOut } of examples) {
      const sim = Grid.similarity(input, trainIn);
      if (sim > bestSim) {
        bestSim = sim;
        bestOutput = trainOut;
      }
    }

    // If input is similar size to a training input, try same transformation
    if (analysis.sizeRelation === 'crop') {
      return Grid.extractBoundingBox(input);
    }

    return bestOutput;
  }

  // ═══════════════════════════════════════════════════════════════
  // EVALUATION
  // ═══════════════════════════════════════════════════════════════

  evaluate(tasks) {
    let correct = 0;
    let total = 0;
    const results = [];

    for (const task of tasks) {
      const result = this.solve(task);

      for (let i = 0; i < task.test.length; i++) {
        total++;
        const predicted = result.predictions[i];
        const expected = task.test[i].output;

        if (Grid.equals(predicted, expected)) {
          correct++;
          results.push({ taskId: task.id, testIndex: i, correct: true, strategy: result.strategy });
        } else {
          results.push({ taskId: task.id, testIndex: i, correct: false, strategy: result.strategy });
        }
      }
    }

    return {
      accuracy: total > 0 ? correct / total : 0,
      correct,
      total,
      results
    };
  }
}

module.exports = AbstractionEngine;
