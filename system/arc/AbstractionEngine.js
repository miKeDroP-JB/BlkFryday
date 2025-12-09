/**
 * ARC-AGI ABSTRACTION ENGINE v2.0
 * Championship-grade reasoning module
 *
 * "They said it couldn't be done. We did it anyway."
 *
 * THE SIMULATION BECOMES SOVEREIGN
 */

const Grid = require('./Primitives');

class AbstractionEngine {
  constructor() {
    // Expanded strategy list - ordered by specificity
    this.strategies = [
      // === IDENTITY & BASIC TRANSFORMS ===
      'identity',
      'rotate90',
      'rotate180',
      'rotate270',
      'flipHorizontal',
      'flipVertical',
      'transpose',

      // === EXTRACTION ===
      'extractBoundingBox',
      'extractLargestObject',
      'extractSmallestObject',

      // === CONCATENATION & MIRRORING ===
      'mirrorHorizontal',
      'mirrorVertical',
      'tileHorizontal',
      'tileVertical',

      // === GRAVITY & SHIFTING ===
      'shiftDown',
      'gravityDown',

      // === PATTERN OPERATIONS ===
      'deduplicate',
      'deduplicateHorizontal',
      'deduplicateVertical',
      'selfTile',

      // === COLOR OPERATIONS ===
      'swapColors',
      'learnedColorMapping',
      'replaceColorWithMarker',
      'colorLargestComponent',

      // === SPLIT & COMPARE ===
      'xorHalves',

      // === MARKER OPERATIONS ===
      'expandAroundMarkers',
      'fillLShapeCorner',

      // === COMPOSITE STRATEGIES ===
      'extractThenRotate',
      'extractThenFlip',
      'extractThenTranspose',
    ];

    this.debugMode = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN SOLVER
  // ═══════════════════════════════════════════════════════════════

  solve(task) {
    const { train, test } = task;

    // Phase 1: Deep analysis of training examples
    const analysis = this.analyzeExamples(train);

    // Phase 2: Smart strategy selection based on analysis
    const prioritizedStrategies = this.prioritizeStrategies(analysis);

    // Phase 3: Try each strategy in priority order
    for (const strategy of prioritizedStrategies) {
      const hypothesis = this.testStrategy(strategy, train, analysis);
      if (hypothesis.valid) {
        const predictions = test.map(t => this.applyStrategy(strategy, t.input, analysis));
        return {
          success: true,
          strategy,
          predictions,
          confidence: hypothesis.confidence
        };
      }
    }

    // Phase 4: Program synthesis (expanded DSL)
    const synthesized = this.synthesizeProgram(train, analysis);
    if (synthesized) {
      const predictions = test.map(t => this.runProgram(synthesized.program, t.input, analysis));
      return {
        success: true,
        strategy: 'synthesized',
        program: synthesized.program,
        predictions,
        confidence: synthesized.confidence
      };
    }

    // Phase 5: Learned transformation from examples
    const learned = this.learnTransformation(train, analysis);
    if (learned) {
      const predictions = test.map(t => learned.transform(t.input));
      return {
        success: true,
        strategy: 'learned',
        predictions,
        confidence: learned.confidence
      };
    }

    // Phase 6: Fallback
    return {
      success: false,
      strategy: 'fallback',
      predictions: test.map(t => this.bestGuess(t.input, train, analysis)),
      confidence: 0.1
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // DEEP ANALYSIS
  // ═══════════════════════════════════════════════════════════════

  analyzeExamples(examples) {
    const analysis = {
      inputSizes: [],
      outputSizes: [],
      sizeRelation: null,
      inputColors: new Set(),
      outputColors: new Set(),
      colorMapping: {},
      learnedColorMapping: {},
      objectCounts: [],
      hasMarker: false,
      markerColor: null,
      hasSeparator: false,
      separatorCol: -1,
      isDoubleWidth: false,
      isDoubleHeight: false,
      isHalfWidth: false,
      isHalfHeight: false,
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

      // Learn color mapping from this example
      const mapping = Grid.learnColorMapping(input, output);
      Object.assign(analysis.learnedColorMapping, mapping);
    }

    // Detect size relationships
    analysis.sizeRelation = this.detectSizeRelation(analysis);
    analysis.isDoubleWidth = analysis.outputSizes.every((s, i) =>
      s.width === analysis.inputSizes[i].width * 2 && s.height === analysis.inputSizes[i].height);
    analysis.isDoubleHeight = analysis.outputSizes.every((s, i) =>
      s.height === analysis.inputSizes[i].height * 2 && s.width === analysis.inputSizes[i].width);
    analysis.isHalfWidth = analysis.outputSizes.every((s, i) =>
      s.width * 2 === analysis.inputSizes[i].width && s.height === analysis.inputSizes[i].height);
    analysis.isHalfHeight = analysis.outputSizes.every((s, i) =>
      s.height * 2 === analysis.inputSizes[i].height && s.width === analysis.inputSizes[i].width);

    // Detect markers
    for (const { input } of examples) {
      const marker = Grid.findMarker(input);
      if (marker) {
        analysis.hasMarker = true;
        analysis.markerColor = marker.color;
        break;
      }
    }

    // Detect separators
    for (const { input } of examples) {
      const { left, right } = Grid.splitVerticalHalves(input);
      if (left[0]?.length > 0 && right[0]?.length > 0) {
        analysis.hasSeparator = true;
        break;
      }
    }

    // Legacy color mapping
    analysis.colorMapping = this.detectColorMapping(examples);

    return analysis;
  }

  detectSizeRelation(analysis) {
    const { inputSizes, outputSizes } = analysis;

    if (inputSizes.every((s, i) =>
      s.height === outputSizes[i].height && s.width === outputSizes[i].width)) {
      return 'same';
    }

    if (outputSizes.every((s, i) =>
      s.height <= inputSizes[i].height && s.width <= inputSizes[i].width)) {
      return 'crop';
    }

    const scales = inputSizes.map((s, i) => ({
      h: outputSizes[i].height / s.height,
      w: outputSizes[i].width / s.width
    }));
    if (scales.every(s => s.h === scales[0].h && s.w === scales[0].w && Number.isInteger(s.h))) {
      return { type: 'scale', factor: scales[0].h };
    }

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

      if (inColors.length === outColors.length) {
        inColors.forEach((c, i) => {
          mapping[c] = outColors[i];
        });
      }
    }
    return mapping;
  }

  // ═══════════════════════════════════════════════════════════════
  // SMART STRATEGY PRIORITIZATION
  // ═══════════════════════════════════════════════════════════════

  prioritizeStrategies(analysis) {
    const prioritized = [];

    // Size-based hints
    if (analysis.sizeRelation === 'same') {
      prioritized.push('identity', 'rotate180', 'flipHorizontal', 'flipVertical',
        'transpose', 'swapColors', 'learnedColorMapping', 'colorLargestComponent',
        'fillLShapeCorner', 'replaceColorWithMarker');
    }

    if (analysis.isDoubleWidth) {
      prioritized.push('mirrorHorizontal', 'tileHorizontal');
    }

    if (analysis.isDoubleHeight) {
      prioritized.push('mirrorVertical', 'tileVertical');
    }

    if (analysis.isHalfWidth) {
      prioritized.push('deduplicateHorizontal', 'deduplicate');
    }

    if (analysis.isHalfHeight) {
      prioritized.push('deduplicateVertical', 'deduplicate');
    }

    if (analysis.sizeRelation === 'crop') {
      prioritized.push('extractBoundingBox', 'extractLargestObject', 'deduplicate');
    }

    if (analysis.hasMarker) {
      prioritized.push('replaceColorWithMarker', 'expandAroundMarkers');
    }

    if (analysis.hasSeparator) {
      prioritized.push('xorHalves');
    }

    // Add remaining strategies
    for (const s of this.strategies) {
      if (!prioritized.includes(s)) {
        prioritized.push(s);
      }
    }

    return prioritized;
  }

  // ═══════════════════════════════════════════════════════════════
  // STRATEGY TESTING & APPLICATION
  // ═══════════════════════════════════════════════════════════════

  testStrategy(strategy, examples, analysis) {
    let correct = 0;

    for (const { input, output } of examples) {
      try {
        const predicted = this.applyStrategy(strategy, input, analysis);
        if (Grid.equals(predicted, output)) {
          correct++;
        }
      } catch (e) {
        // Strategy failed
      }
    }

    return {
      valid: correct === examples.length,
      confidence: correct / examples.length
    };
  }

  applyStrategy(strategy, input, analysis) {
    switch (strategy) {
      // Basic transforms
      case 'identity': return Grid.copy(input);
      case 'rotate90': return Grid.rotate90(input);
      case 'rotate180': return Grid.rotate180(input);
      case 'rotate270': return Grid.rotate270(input);
      case 'flipHorizontal': return Grid.flipHorizontal(input);
      case 'flipVertical': return Grid.flipVertical(input);
      case 'transpose': return Grid.transpose(input);

      // Extraction
      case 'extractBoundingBox': return Grid.extractBoundingBox(input);
      case 'extractLargestObject': return this.extractLargestObject(input);
      case 'extractSmallestObject': return this.extractSmallestObject(input);

      // Concatenation & Mirroring
      case 'mirrorHorizontal': return Grid.mirrorHorizontal(input);
      case 'mirrorVertical': return Grid.mirrorVertical(input);
      case 'tileHorizontal': return Grid.tileHorizontal(input, 2);
      case 'tileVertical': return Grid.tileVertical(input, 2);

      // Gravity & Shifting
      case 'shiftDown': return Grid.shiftDown(input, 1);
      case 'gravityDown': return Grid.gravityDown(input);

      // Pattern operations
      case 'deduplicate': return Grid.deduplicate(input);
      case 'deduplicateHorizontal': return Grid.deduplicateHorizontal(input);
      case 'deduplicateVertical': return Grid.deduplicateVertical(input);
      case 'selfTile': return Grid.selfTile(input);

      // Color operations
      case 'swapColors': return this.applyColorSwap(input, analysis);
      case 'learnedColorMapping': return Grid.applyColorMapping(input, analysis.learnedColorMapping);
      case 'replaceColorWithMarker': return Grid.replaceColorWithMarker(input);
      case 'colorLargestComponent': return Grid.colorLargestComponent(input, 8);

      // Split & Compare
      case 'xorHalves': {
        const { left, right } = Grid.splitVerticalHalves(input);
        return Grid.xor(left, right, 2);
      }

      // Marker operations
      case 'expandAroundMarkers': return Grid.expandAroundPoints(input, 5, 1, 1);
      case 'fillLShapeCorner': return Grid.fillLShapeCorner(input, 8, 1);

      // Composite
      case 'extractThenRotate': return Grid.rotate90(Grid.extractBoundingBox(input));
      case 'extractThenFlip': return Grid.flipHorizontal(Grid.extractBoundingBox(input));
      case 'extractThenTranspose': return Grid.transpose(Grid.extractBoundingBox(input));

      default: return Grid.copy(input);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // OBJECT HELPERS
  // ═══════════════════════════════════════════════════════════════

  extractLargestObject(grid) {
    const components = Grid.findConnectedComponents(grid);
    if (components.length === 0) return [[]];
    let largest = components[0];
    for (const comp of components) {
      if (comp.cells.length > largest.cells.length) largest = comp;
    }
    return Grid.extractObject(grid, largest);
  }

  extractSmallestObject(grid) {
    const components = Grid.findConnectedComponents(grid);
    if (components.length === 0) return [[]];
    let smallest = components[0];
    for (const comp of components) {
      if (comp.cells.length < smallest.cells.length) smallest = comp;
    }
    return Grid.extractObject(grid, smallest);
  }

  applyColorSwap(grid, analysis) {
    let result = Grid.copy(grid);
    for (const [from, to] of Object.entries(analysis.colorMapping)) {
      result = Grid.replaceColor(result, parseInt(from), to);
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPANDED PROGRAM SYNTHESIS
  // ═══════════════════════════════════════════════════════════════

  synthesizeProgram(examples, analysis) {
    const dsl = [
      { op: 'extract', fn: g => Grid.extractBoundingBox(g) },
      { op: 'rotate90', fn: g => Grid.rotate90(g) },
      { op: 'rotate180', fn: g => Grid.rotate180(g) },
      { op: 'rotate270', fn: g => Grid.rotate270(g) },
      { op: 'flipH', fn: g => Grid.flipHorizontal(g) },
      { op: 'flipV', fn: g => Grid.flipVertical(g) },
      { op: 'transpose', fn: g => Grid.transpose(g) },
      { op: 'mirrorH', fn: g => Grid.mirrorHorizontal(g) },
      { op: 'mirrorV', fn: g => Grid.mirrorVertical(g) },
      { op: 'tileH', fn: g => Grid.tileHorizontal(g, 2) },
      { op: 'tileV', fn: g => Grid.tileVertical(g, 2) },
      { op: 'dedup', fn: g => Grid.deduplicate(g) },
      { op: 'dedupH', fn: g => Grid.deduplicateHorizontal(g) },
      { op: 'dedupV', fn: g => Grid.deduplicateVertical(g) },
      { op: 'gravity', fn: g => Grid.gravityDown(g) },
      { op: 'shiftD', fn: g => Grid.shiftDown(g, 1) },
      { op: 'colorMap', fn: g => Grid.applyColorMapping(g, analysis.learnedColorMapping) },
    ];

    // Single ops
    for (const { op, fn } of dsl) {
      if (this.programSolvesAll([fn], examples)) {
        return { program: [op], confidence: 1.0 };
      }
    }

    // Pairs
    for (const op1 of dsl) {
      for (const op2 of dsl) {
        if (this.programSolvesAll([op1.fn, op2.fn], examples)) {
          return { program: [op1.op, op2.op], confidence: 0.95 };
        }
      }
    }

    // Triples
    for (const op1 of dsl) {
      for (const op2 of dsl) {
        for (const op3 of dsl) {
          if (this.programSolvesAll([op1.fn, op2.fn, op3.fn], examples)) {
            return { program: [op1.op, op2.op, op3.op], confidence: 0.9 };
          }
        }
      }
    }

    return null;
  }

  programSolvesAll(program, examples) {
    for (const { input, output } of examples) {
      let result = input;
      try {
        for (const fn of program) {
          result = fn(result);
        }
        if (!Grid.equals(result, output)) return false;
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  runProgram(programOps, input, analysis) {
    const ops = {
      'extract': g => Grid.extractBoundingBox(g),
      'rotate90': g => Grid.rotate90(g),
      'rotate180': g => Grid.rotate180(g),
      'rotate270': g => Grid.rotate270(g),
      'flipH': g => Grid.flipHorizontal(g),
      'flipV': g => Grid.flipVertical(g),
      'transpose': g => Grid.transpose(g),
      'mirrorH': g => Grid.mirrorHorizontal(g),
      'mirrorV': g => Grid.mirrorVertical(g),
      'tileH': g => Grid.tileHorizontal(g, 2),
      'tileV': g => Grid.tileVertical(g, 2),
      'dedup': g => Grid.deduplicate(g),
      'dedupH': g => Grid.deduplicateHorizontal(g),
      'dedupV': g => Grid.deduplicateVertical(g),
      'gravity': g => Grid.gravityDown(g),
      'shiftD': g => Grid.shiftDown(g, 1),
      'colorMap': g => Grid.applyColorMapping(g, analysis.learnedColorMapping),
    };

    let result = input;
    for (const op of programOps) {
      if (ops[op]) result = ops[op](result);
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // LEARNED TRANSFORMATIONS
  // ═══════════════════════════════════════════════════════════════

  learnTransformation(examples, analysis) {
    // Try to learn a consistent transformation from examples
    // This is a fallback that tries common patterns

    // Check if it's a simple color replacement task
    if (analysis.sizeRelation === 'same' && Object.keys(analysis.learnedColorMapping).length > 0) {
      const transform = (input) => Grid.applyColorMapping(input, analysis.learnedColorMapping);
      if (this.programSolvesAll([transform], examples)) {
        return { transform, confidence: 0.85 };
      }
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // FALLBACK
  // ═══════════════════════════════════════════════════════════════

  bestGuess(input, examples, analysis) {
    let bestSim = -1;
    let bestOutput = input;

    for (const { input: trainIn, output: trainOut } of examples) {
      const sim = Grid.similarity(input, trainIn);
      if (sim > bestSim) {
        bestSim = sim;
        bestOutput = trainOut;
      }
    }

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
