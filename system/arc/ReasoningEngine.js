/**
 * REASONING ENGINE
 *
 * The missing layer between primitives and solutions.
 * Instead of blindly trying strategies, we THINK:
 *
 * 1. OBSERVE - What changed between input and output?
 * 2. LOCATE  - Where are the changes relative to existing features?
 * 3. HYPOTHESIZE - What rule could explain this?
 * 4. VERIFY - Does it work on all training examples?
 * 5. APPLY - Use on test
 *
 * Speed comes AFTER correctness.
 */

const Grid = require('./Primitives');

class ReasoningEngine {
  constructor() {
    this.debugMode = false;
  }

  /**
   * Main entry point - solve a task through reasoning
   */
  solve(task) {
    const { train, test } = task;

    if (this.debugMode) {
      console.log('\n=== REASONING ENGINE ACTIVATED ===\n');
    }

    // Step 1: OBSERVE - Analyze what changed in each training example
    const observations = train.map((ex, i) => this.observe(ex.input, ex.output, i));

    if (this.debugMode) {
      console.log('Observations:', JSON.stringify(observations, null, 2));
    }

    // Step 2: SYNTHESIZE - Find common patterns across all observations
    const hypothesis = this.synthesizeHypothesis(observations, train);

    if (this.debugMode) {
      console.log('Hypothesis:', hypothesis);
    }

    if (!hypothesis) {
      return { success: false, strategy: 'reasoning_failed' };
    }

    // Step 3: VERIFY - Test hypothesis on all training examples
    const verified = this.verifyHypothesis(hypothesis, train);

    if (!verified) {
      return { success: false, strategy: 'verification_failed' };
    }

    // Step 4: APPLY - Use hypothesis on test input
    const predictions = test.map(t => this.applyHypothesis(hypothesis, t.input));

    return {
      success: true,
      strategy: hypothesis.type,
      hypothesis: hypothesis,
      predictions: predictions
    };
  }

  /**
   * OBSERVE: What changed between input and output?
   */
  observe(input, output, exampleIndex) {
    const observation = {
      index: exampleIndex,
      inputSize: { h: input.length, w: input[0].length },
      outputSize: { h: output.length, w: output[0].length },
      sizeChange: this.describeSizeChange(input, output),
      inputColors: Grid.getNonZeroColors(input),
      outputColors: Grid.getNonZeroColors(output),
      newColors: [],
      removedColors: [],
      changes: [],
      patterns: []
    };

    // What colors are new in output?
    observation.newColors = observation.outputColors.filter(
      c => !observation.inputColors.includes(c)
    );

    // What colors were removed?
    observation.removedColors = observation.inputColors.filter(
      c => !observation.outputColors.includes(c)
    );

    // If same size, analyze cell-by-cell changes
    if (observation.sizeChange === 'same') {
      observation.changes = this.findCellChanges(input, output);
      observation.patterns = this.detectChangePatterns(input, output, observation.changes);
    }

    return observation;
  }

  /**
   * Find what cells changed between input and output
   */
  findCellChanges(input, output) {
    const changes = [];

    for (let i = 0; i < input.length; i++) {
      for (let j = 0; j < input[0].length; j++) {
        if (input[i][j] !== output[i][j]) {
          changes.push({
            row: i,
            col: j,
            from: input[i][j],
            to: output[i][j]
          });
        }
      }
    }

    return changes;
  }

  /**
   * Detect PATTERNS in changes - the key reasoning step
   */
  detectChangePatterns(input, output, changes) {
    const patterns = [];

    if (changes.length === 0) {
      patterns.push({ type: 'identity', confidence: 1.0 });
      return patterns;
    }

    // Check for OBJECT MOVEMENT first (whole objects that moved)
    const movementPattern = this.detectObjectMovement(input, output);
    if (movementPattern) {
      patterns.push(movementPattern);
    }

    // Group changes by what they became (the 'to' color)
    const changesByNewColor = {};
    for (const change of changes) {
      if (!changesByNewColor[change.to]) {
        changesByNewColor[change.to] = [];
      }
      changesByNewColor[change.to].push(change);
    }

    // For each new color, analyze WHERE those changes occurred
    for (const [newColor, colorChanges] of Object.entries(changesByNewColor)) {
      const newColorInt = parseInt(newColor);

      // Check if changes are AROUND certain input colors
      const aroundAnalysis = this.analyzeChangesAround(input, colorChanges);

      if (aroundAnalysis.pattern) {
        patterns.push({
          type: 'draw_around',
          targetColor: aroundAnalysis.aroundColor,
          drawColor: newColorInt,
          shape: aroundAnalysis.pattern, // 'cross', 'diagonal', 'square', etc.
          confidence: aroundAnalysis.confidence
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze if changes occur AROUND cells of a specific color
   */
  analyzeChangesAround(input, changes) {
    // For each input color, check if changes are adjacent to it
    const inputColors = Grid.getNonZeroColors(input);

    for (const targetColor of inputColors) {
      // Find all cells of this color
      const targetCells = [];
      for (let i = 0; i < input.length; i++) {
        for (let j = 0; j < input[0].length; j++) {
          if (input[i][j] === targetColor) {
            targetCells.push({ row: i, col: j });
          }
        }
      }

      // Check if changes are in cross pattern around target cells
      let crossMatches = 0;
      let diagonalMatches = 0;

      for (const change of changes) {
        for (const target of targetCells) {
          const dr = change.row - target.row;
          const dc = change.col - target.col;

          // Cross pattern: directly adjacent (not diagonal)
          if ((Math.abs(dr) === 1 && dc === 0) || (dr === 0 && Math.abs(dc) === 1)) {
            crossMatches++;
          }

          // Diagonal pattern: corner adjacent
          if (Math.abs(dr) === 1 && Math.abs(dc) === 1) {
            diagonalMatches++;
          }
        }
      }

      // Expected matches for cross: 4 per target cell (up, down, left, right)
      // Expected matches for diagonal: 4 per target cell (corners)
      const expectedCross = targetCells.length * 4;
      const expectedDiagonal = targetCells.length * 4;

      if (crossMatches > 0 && crossMatches >= changes.length * 0.7) {
        return {
          pattern: 'cross',
          aroundColor: targetColor,
          confidence: crossMatches / Math.max(expectedCross, changes.length)
        };
      }

      if (diagonalMatches > 0 && diagonalMatches >= changes.length * 0.7) {
        return {
          pattern: 'diagonal',
          aroundColor: targetColor,
          confidence: diagonalMatches / Math.max(expectedDiagonal, changes.length)
        };
      }
    }

    return { pattern: null };
  }

  /**
   * Detect if an object moved from one place to another
   */
  detectObjectMovement(input, output) {
    const inputColors = Grid.getNonZeroColors(input);
    const outputColors = Grid.getNonZeroColors(output);

    // Colors must be the same (object moved, not added/removed)
    if (inputColors.length !== outputColors.length) return null;
    if (!inputColors.every(c => outputColors.includes(c))) return null;

    // For each color, find its bounding box in input and output
    for (const movingColor of inputColors) {
      const inputBB = this.getBoundingBoxForColor(input, movingColor);
      const outputBB = this.getBoundingBoxForColor(output, movingColor);

      if (!inputBB || !outputBB) continue;

      // Check if the shape is the same but position changed
      const inputShape = this.extractShape(input, inputBB, movingColor);
      const outputShape = this.extractShape(output, outputBB, movingColor);

      if (!this.shapesEqual(inputShape, outputShape)) continue;

      // Position changed - this object moved!
      if (inputBB.minRow !== outputBB.minRow || inputBB.minCol !== outputBB.minCol) {
        // Find the anchor color (color that didn't move)
        for (const anchorColor of inputColors) {
          if (anchorColor === movingColor) continue;

          const anchorInputBB = this.getBoundingBoxForColor(input, anchorColor);
          const anchorOutputBB = this.getBoundingBoxForColor(output, anchorColor);

          // Anchor didn't move
          if (anchorInputBB && anchorOutputBB &&
              anchorInputBB.minRow === anchorOutputBB.minRow &&
              anchorInputBB.minCol === anchorOutputBB.minCol) {

            // Check if object moved TOWARD anchor
            const inputDist = Math.abs(inputBB.maxRow - anchorInputBB.minRow);
            const outputDist = Math.abs(outputBB.maxRow - anchorOutputBB.minRow);

            if (outputDist < inputDist || outputDist <= 1) {
              return {
                type: 'move_to_anchor',
                movingColor: movingColor,
                anchorColor: anchorColor,
                confidence: 1.0
              };
            }
          }
        }
      }
    }

    return null;
  }

  getBoundingBoxForColor(grid, color) {
    let minRow = Infinity, maxRow = -1, minCol = Infinity, maxCol = -1;
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length; j++) {
        if (grid[i][j] === color) {
          minRow = Math.min(minRow, i);
          maxRow = Math.max(maxRow, i);
          minCol = Math.min(minCol, j);
          maxCol = Math.max(maxCol, j);
        }
      }
    }
    if (maxRow === -1) return null;
    return { minRow, maxRow, minCol, maxCol };
  }

  extractShape(grid, bb, color) {
    const shape = [];
    for (let i = bb.minRow; i <= bb.maxRow; i++) {
      const row = [];
      for (let j = bb.minCol; j <= bb.maxCol; j++) {
        row.push(grid[i][j] === color ? 1 : 0);
      }
      shape.push(row);
    }
    return shape;
  }

  shapesEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].length !== b[i].length) return false;
      for (let j = 0; j < a[i].length; j++) {
        if (a[i][j] !== b[i][j]) return false;
      }
    }
    return true;
  }

  /**
   * SYNTHESIZE: Combine observations into a unified hypothesis
   */
  synthesizeHypothesis(observations, train) {
    // Check if all observations have the same patterns
    if (observations.length === 0) return null;

    // Collect all detected patterns
    const allPatterns = observations.flatMap(o => o.patterns);

    if (allPatterns.length === 0) {
      // No patterns detected, fall back to size-based strategies
      return this.synthesizeSizeBasedHypothesis(observations, train);
    }

    // Group patterns by type
    const movePatterns = allPatterns.filter(p => p.type === 'move_to_anchor');
    const drawAroundPatterns = allPatterns.filter(p => p.type === 'draw_around');

    // Check for consistent move_to_anchor pattern
    if (movePatterns.length > 0) {
      // All observations should have the same moving and anchor colors
      const firstMove = movePatterns[0];
      const consistent = movePatterns.every(p =>
        p.movingColor === firstMove.movingColor &&
        p.anchorColor === firstMove.anchorColor
      );

      if (consistent && movePatterns.length >= observations.length * 0.5) {
        return {
          type: 'move_to_anchor',
          movingColor: firstMove.movingColor,
          anchorColor: firstMove.anchorColor
        };
      }
    }

    if (drawAroundPatterns.length > 0) {
      // Check if there's a consistent mapping: inputColor -> (shape, drawColor)
      const colorToPattern = {};

      for (const pattern of drawAroundPatterns) {
        const key = pattern.targetColor;
        if (!colorToPattern[key]) {
          colorToPattern[key] = { shape: pattern.shape, drawColor: pattern.drawColor, count: 0 };
        }
        if (colorToPattern[key].shape === pattern.shape &&
            colorToPattern[key].drawColor === pattern.drawColor) {
          colorToPattern[key].count++;
        }
      }

      // Build the hypothesis
      const rules = [];
      for (const [targetColor, info] of Object.entries(colorToPattern)) {
        if (info.count >= observations.length * 0.5) { // At least half of examples show this
          rules.push({
            targetColor: parseInt(targetColor),
            shape: info.shape,
            drawColor: info.drawColor
          });
        }
      }

      if (rules.length > 0) {
        return {
          type: 'multi_draw_around',
          rules: rules
        };
      }
    }

    return null;
  }

  /**
   * Fallback: synthesize hypothesis based on size changes
   */
  synthesizeSizeBasedHypothesis(observations, train) {
    const sizeChange = observations[0]?.sizeChange;

    if (sizeChange === 'same') {
      // Try identity or simple transforms
      return { type: 'try_basic_transforms' };
    }

    if (sizeChange === 'shrink') {
      return { type: 'try_extraction' };
    }

    if (sizeChange === 'grow') {
      return { type: 'try_tiling' };
    }

    return null;
  }

  /**
   * VERIFY: Test hypothesis on all training examples
   */
  verifyHypothesis(hypothesis, train) {
    for (const example of train) {
      const predicted = this.applyHypothesis(hypothesis, example.input);
      if (!Grid.equals(predicted, example.output)) {
        if (this.debugMode) {
          console.log('Hypothesis failed on training example');
        }
        return false;
      }
    }
    return true;
  }

  /**
   * APPLY: Execute hypothesis on an input grid
   */
  applyHypothesis(hypothesis, input) {
    switch (hypothesis.type) {
      case 'multi_draw_around':
        return this.applyMultiDrawAround(input, hypothesis.rules);

      case 'move_to_anchor':
        return this.applyMoveToAnchor(input, hypothesis.movingColor, hypothesis.anchorColor);

      case 'try_basic_transforms':
        // Fall through to basic engine
        return Grid.copy(input);

      case 'try_extraction':
        return Grid.extractBoundingBox(input);

      case 'try_tiling':
        return Grid.copy(input); // Placeholder

      default:
        return Grid.copy(input);
    }
  }

  /**
   * Move an object to be adjacent to anchor
   */
  applyMoveToAnchor(input, movingColor, anchorColor) {
    const { height, width } = Grid.dimensions(input);

    // Find bounding boxes
    const movingBB = this.getBoundingBoxForColor(input, movingColor);
    const anchorBB = this.getBoundingBoxForColor(input, anchorColor);

    if (!movingBB || !anchorBB) return Grid.copy(input);

    // Determine direction: where is object relative to anchor?
    const movingCenterRow = (movingBB.minRow + movingBB.maxRow) / 2;
    const movingCenterCol = (movingBB.minCol + movingBB.maxCol) / 2;
    const anchorCenterRow = (anchorBB.minRow + anchorBB.maxRow) / 2;
    const anchorCenterCol = (anchorBB.minCol + anchorBB.maxCol) / 2;

    let deltaRow = 0, deltaCol = 0;

    // Check if already vertically adjacent
    const verticallyAdjacent = (movingBB.maxRow >= anchorBB.minRow - 1 && movingBB.minRow <= anchorBB.maxRow + 1);
    // Check if already horizontally adjacent
    const horizontallyAdjacent = (movingBB.maxCol >= anchorBB.minCol - 1 && movingBB.minCol <= anchorBB.maxCol + 1);

    // Move to be adjacent based on relative position (only if not already adjacent)
    if (!verticallyAdjacent) {
      if (movingCenterRow < anchorCenterRow) {
        // Object is ABOVE anchor - move down to be just above
        deltaRow = anchorBB.minRow - movingBB.maxRow - 1;
      } else if (movingCenterRow > anchorCenterRow) {
        // Object is BELOW anchor - move up to be just below
        deltaRow = anchorBB.maxRow - movingBB.minRow + 1;
      }
    }

    if (!horizontallyAdjacent) {
      if (movingCenterCol < anchorCenterCol) {
        // Object is LEFT of anchor - move right to be adjacent
        deltaCol = anchorBB.minCol - movingBB.maxCol - 1;
      } else if (movingCenterCol > anchorCenterCol) {
        // Object is RIGHT of anchor - move left to be adjacent
        deltaCol = anchorBB.maxCol - movingBB.minCol + 1;
      }
    }

    // Create result
    const result = Grid.copy(input);

    // Clear old position
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (input[i][j] === movingColor) {
          result[i][j] = 0;
        }
      }
    }

    // Place at new position
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (input[i][j] === movingColor) {
          const newRow = i + deltaRow;
          const newCol = j + deltaCol;
          if (newRow >= 0 && newRow < height && newCol >= 0 && newCol < width) {
            result[newRow][newCol] = movingColor;
          }
        }
      }
    }

    return result;
  }

  /**
   * Apply multiple draw-around rules
   */
  applyMultiDrawAround(input, rules) {
    let result = Grid.copy(input);
    const { height, width } = Grid.dimensions(result);

    for (const rule of rules) {
      // Find all cells of target color
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          if (input[i][j] === rule.targetColor) {
            // Draw pattern around this cell
            if (rule.shape === 'cross') {
              // Up, down, left, right
              if (i > 0 && result[i-1][j] === 0) result[i-1][j] = rule.drawColor;
              if (i < height-1 && result[i+1][j] === 0) result[i+1][j] = rule.drawColor;
              if (j > 0 && result[i][j-1] === 0) result[i][j-1] = rule.drawColor;
              if (j < width-1 && result[i][j+1] === 0) result[i][j+1] = rule.drawColor;
            } else if (rule.shape === 'diagonal') {
              // Corners
              if (i > 0 && j > 0 && result[i-1][j-1] === 0) result[i-1][j-1] = rule.drawColor;
              if (i > 0 && j < width-1 && result[i-1][j+1] === 0) result[i-1][j+1] = rule.drawColor;
              if (i < height-1 && j > 0 && result[i+1][j-1] === 0) result[i+1][j-1] = rule.drawColor;
              if (i < height-1 && j < width-1 && result[i+1][j+1] === 0) result[i+1][j+1] = rule.drawColor;
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Describe how size changed
   */
  describeSizeChange(input, output) {
    const inH = input.length, inW = input[0].length;
    const outH = output.length, outW = output[0].length;

    if (inH === outH && inW === outW) return 'same';
    if (outH < inH || outW < inW) return 'shrink';
    if (outH > inH || outW > inW) return 'grow';
    return 'different';
  }
}

module.exports = ReasoningEngine;
