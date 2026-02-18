/**
 * UNLIMITED SOLVER - INFINITE REASONING ENGINE
 * ═══════════════════════════════════════════════════════════════════
 * The solver that never stops. True infinite lazy strategy generation.
 *
 * "21% is not a ceiling. It's a starting point."
 *
 * This engine walks deeper, wider, smarter - forever.
 * Training examples ARE the answer key. Period.
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const SOLVER_VERSION = '2.0.0';
const CODENAME = 'INFINITE_HORIZON';

// ═══════════════════════════════════════════════════════════════════
// GRID UTILITIES
// ═══════════════════════════════════════════════════════════════════

class Grid {
  constructor(data) {
    if (Array.isArray(data)) {
      this.data = data.map(row => [...row]);
    } else if (typeof data === 'object' && data.rows && data.cols) {
      this.data = Array(data.rows).fill(null).map(() => Array(data.cols).fill(0));
    } else {
      this.data = [[0]];
    }
    this.rows = this.data.length;
    this.cols = this.data[0]?.length || 0;
  }

  static fromArray(arr) {
    return new Grid(arr);
  }

  clone() {
    return new Grid(this.data);
  }

  get(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return -1;
    return this.data[row][col];
  }

  set(row, col, value) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.data[row][col] = value;
    }
    return this;
  }

  equals(other) {
    if (this.rows !== other.rows || this.cols !== other.cols) return false;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.data[r][c] !== other.data[r][c]) return false;
      }
    }
    return true;
  }

  xor(other) {
    const result = this.clone();
    for (let r = 0; r < Math.min(this.rows, other.rows); r++) {
      for (let c = 0; c < Math.min(this.cols, other.cols); c++) {
        result.data[r][c] = this.data[r][c] === other.data[r][c] ? 0 : 1;
      }
    }
    return result;
  }

  diff(other) {
    const changes = [];
    for (let r = 0; r < Math.min(this.rows, other.rows); r++) {
      for (let c = 0; c < Math.min(this.cols, other.cols); c++) {
        if (this.data[r][c] !== other.data[r][c]) {
          changes.push({ row: r, col: c, from: this.data[r][c], to: other.data[r][c] });
        }
      }
    }
    return changes;
  }

  getUniqueColors() {
    const colors = new Set();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        colors.add(this.data[r][c]);
      }
    }
    return [...colors];
  }

  countColor(color) {
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.data[r][c] === color) count++;
      }
    }
    return count;
  }

  getMajorityColor(excludeZero = true) {
    const counts = {};
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const color = this.data[r][c];
        if (excludeZero && color === 0) continue;
        counts[color] = (counts[color] || 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
  }

  getObjects() {
    const visited = new Set();
    const objects = [];

    const floodFill = (startR, startC, color) => {
      const cells = [];
      const stack = [[startR, startC]];

      while (stack.length > 0) {
        const [r, c] = stack.pop();
        const key = `${r},${c}`;

        if (visited.has(key)) continue;
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
        if (this.data[r][c] !== color) continue;

        visited.add(key);
        cells.push({ row: r, col: c });

        stack.push([r-1, c], [r+1, c], [r, c-1], [r, c+1]);
      }

      return cells;
    };

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const key = `${r},${c}`;
        if (!visited.has(key) && this.data[r][c] !== 0) {
          const cells = floodFill(r, c, this.data[r][c]);
          if (cells.length > 0) {
            objects.push({
              color: this.data[r][c],
              cells,
              size: cells.length,
              bounds: this.getBounds(cells)
            });
          }
        }
      }
    }

    return objects;
  }

  getBounds(cells) {
    let minR = Infinity, maxR = -Infinity;
    let minC = Infinity, maxC = -Infinity;

    for (const { row, col } of cells) {
      minR = Math.min(minR, row);
      maxR = Math.max(maxR, row);
      minC = Math.min(minC, col);
      maxC = Math.max(maxC, col);
    }

    return { minR, maxR, minC, maxC, width: maxC - minC + 1, height: maxR - minR + 1 };
  }

  extractSubgrid(minR, minC, maxR, maxC) {
    const result = [];
    for (let r = minR; r <= maxR; r++) {
      const row = [];
      for (let c = minC; c <= maxC; c++) {
        row.push(this.get(r, c));
      }
      result.push(row);
    }
    return new Grid(result);
  }

  getBorder() {
    const border = [];
    for (let c = 0; c < this.cols; c++) {
      border.push({ row: 0, col: c, color: this.data[0][c] });
      if (this.rows > 1) {
        border.push({ row: this.rows - 1, col: c, color: this.data[this.rows - 1][c] });
      }
    }
    for (let r = 1; r < this.rows - 1; r++) {
      border.push({ row: r, col: 0, color: this.data[r][0] });
      if (this.cols > 1) {
        border.push({ row: r, col: this.cols - 1, color: this.data[r][this.cols - 1] });
      }
    }
    return border;
  }

  toArray() {
    return this.data.map(row => [...row]);
  }
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 1: INFINITE LAZY STRATEGY GENERATOR
// ═══════════════════════════════════════════════════════════════════

/**
 * The primitives - atomic operations that compose into strategies
 */
function getPrimitives() {
  return [
    // Color operations
    { name: 'fillColor', type: 'color', params: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { name: 'replaceColor', type: 'colorPair', params: [] },
    { name: 'swapColors', type: 'colorPair', params: [] },

    // Geometric transforms
    { name: 'rotate90', type: 'rotation', params: [1, 2, 3] },
    { name: 'flipHorizontal', type: 'flip', params: [] },
    { name: 'flipVertical', type: 'flip', params: [] },
    { name: 'flipDiagonal', type: 'flip', params: [] },
    { name: 'transpose', type: 'transform', params: [] },

    // Scaling
    { name: 'scale', type: 'scale', params: [2, 3, 4] },
    { name: 'shrink', type: 'scale', params: [2, 3, 4] },
    { name: 'tile', type: 'tile', params: [2, 3, 4] },

    // Pattern operations
    { name: 'repeatPattern', type: 'pattern', params: [2, 3, 4] },
    { name: 'mirrorHorizontal', type: 'mirror', params: [] },
    { name: 'mirrorVertical', type: 'mirror', params: [] },

    // Object operations
    { name: 'extractObjects', type: 'object', params: [] },
    { name: 'moveObject', type: 'movement', params: ['up', 'down', 'left', 'right'] },
    { name: 'removeObject', type: 'object', params: [] },
    { name: 'duplicateObject', type: 'object', params: [] },

    // Spatial operations
    { name: 'gravityDown', type: 'gravity', params: [] },
    { name: 'gravityUp', type: 'gravity', params: [] },
    { name: 'gravityLeft', type: 'gravity', params: [] },
    { name: 'gravityRight', type: 'gravity', params: [] },

    // Border operations
    { name: 'extractBorder', type: 'border', params: [] },
    { name: 'fillBorder', type: 'border', params: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] },
    { name: 'removeBorder', type: 'border', params: [] },

    // Size operations
    { name: 'cropToObjects', type: 'crop', params: [] },
    { name: 'padGrid', type: 'pad', params: [1, 2, 3] },

    // Counting operations
    { name: 'countBasedFill', type: 'counting', params: [] },
    { name: 'majorityFill', type: 'counting', params: [] },

    // Continuation operations
    { name: 'predictNextRow', type: 'continuation', params: [] },
    { name: 'predictNextColumn', type: 'continuation', params: [] },
    { name: 'repeatShape', type: 'continuation', params: [] },
    { name: 'propagateObject', type: 'continuation', params: [] },

    // Alignment operations
    { name: 'alignCenter', type: 'alignment', params: [] },
    { name: 'alignCorners', type: 'alignment', params: [] },

    // Identity (for base case)
    { name: 'identity', type: 'identity', params: [] }
  ];
}

/**
 * Generate all strategies of a specific depth
 * Depth = number of primitive operations chained together
 */
function* generateStrategiesOfDepth(depth) {
  const primitives = getPrimitives();

  // At depth 1, also yield parameterized color mappings
  if (depth === 1) {
    // All possible color replacements (0-9 to 0-9)
    for (let from = 0; from <= 9; from++) {
      for (let to = 0; to <= 9; to++) {
        if (from !== to) {
          yield new Strategy([{
            name: 'replaceColor',
            type: 'colorPair',
            fromColor: from,
            toColor: to
          }]);
        }
      }
    }

    // All possible color swaps
    for (let c1 = 0; c1 <= 9; c1++) {
      for (let c2 = c1 + 1; c2 <= 9; c2++) {
        yield new Strategy([{
          name: 'swapColors',
          type: 'colorPair',
          color1: c1,
          color2: c2
        }]);
      }
    }
  }

  const combos = combineRecursively(primitives, depth);
  for (const combo of combos) {
    yield new Strategy(combo);
  }
}

/**
 * Recursive combination generator
 */
function combineRecursively(primitives, depth) {
  if (depth === 1) {
    return primitives.map(p => [p]);
  }

  const results = [];
  const subCombos = combineRecursively(primitives, depth - 1);

  for (const p of primitives) {
    for (const sub of subCombos) {
      // Prune obviously redundant combinations
      if (!isRedundantCombination(p, sub)) {
        results.push([p, ...sub]);
      }
    }
  }

  return results;
}

/**
 * Prune redundant combinations to reduce search space
 */
function isRedundantCombination(primitive, existing) {
  // Don't chain identity with itself
  if (primitive.name === 'identity' && existing.some(e => e.name === 'identity')) {
    return true;
  }

  // Don't double-flip
  if (primitive.name === 'flipHorizontal' && existing[0]?.name === 'flipHorizontal') {
    return true;
  }
  if (primitive.name === 'flipVertical' && existing[0]?.name === 'flipVertical') {
    return true;
  }

  // Four 90-degree rotations = identity
  const rotations = existing.filter(e => e.name === 'rotate90').length;
  if (primitive.name === 'rotate90' && rotations >= 3) {
    return true;
  }

  return false;
}

/**
 * THE INFINITE STRATEGY GENERATOR
 * This is the heart of the paradigm shift.
 * It never stops. It walks deeper, wider, smarter - forever.
 */
function* infiniteStrategies() {
  let depth = 1;
  const maxDepthPerCycle = 1000; // Report progress every 1000 depths

  while (true) {
    yield* generateStrategiesOfDepth(depth);

    if (depth % maxDepthPerCycle === 0) {
      console.log(`[INFINITE] Reached depth ${depth}, continuing...`);
    }

    depth++;
  }
}

// ═══════════════════════════════════════════════════════════════════
// STRATEGY IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════

class Strategy {
  constructor(primitiveChain) {
    this.chain = primitiveChain;
    this.name = primitiveChain.map(p => p.name).join(' -> ');
    this.depth = primitiveChain.length;
    this.id = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  apply(inputGrid) {
    let grid = inputGrid instanceof Grid ? inputGrid.clone() : Grid.fromArray(inputGrid);

    for (const primitive of this.chain) {
      grid = this.applyPrimitive(grid, primitive);
    }

    return grid;
  }

  applyPrimitive(grid, primitive) {
    const { name, params } = primitive;

    switch (name) {
      // Identity
      case 'identity':
        return grid.clone();

      // Rotations
      case 'rotate90':
        return this.rotate90(grid, params?.[0] || 1);

      // Flips
      case 'flipHorizontal':
        return this.flipHorizontal(grid);
      case 'flipVertical':
        return this.flipVertical(grid);
      case 'flipDiagonal':
        return this.flipDiagonal(grid);
      case 'transpose':
        return this.transpose(grid);

      // Color operations
      case 'fillColor':
        return this.fillWithColor(grid, primitive.currentParam || 0);
      case 'replaceColor':
        return this.replaceColor(grid, primitive.fromColor || 0, primitive.toColor || 1);
      case 'swapColors':
        return this.swapColors(grid, primitive.color1 || 0, primitive.color2 || 1);

      // Scaling
      case 'scale':
        return this.scale(grid, params?.[0] || 2);
      case 'shrink':
        return this.shrink(grid, params?.[0] || 2);
      case 'tile':
        return this.tile(grid, params?.[0] || 2);

      // Mirrors
      case 'mirrorHorizontal':
        return this.mirrorHorizontal(grid);
      case 'mirrorVertical':
        return this.mirrorVertical(grid);

      // Gravity
      case 'gravityDown':
        return this.applyGravity(grid, 'down');
      case 'gravityUp':
        return this.applyGravity(grid, 'up');
      case 'gravityLeft':
        return this.applyGravity(grid, 'left');
      case 'gravityRight':
        return this.applyGravity(grid, 'right');

      // Border
      case 'extractBorder':
        return this.extractBorder(grid);
      case 'fillBorder':
        return this.fillBorder(grid, primitive.currentParam || 1);
      case 'removeBorder':
        return this.removeBorder(grid);

      // Cropping
      case 'cropToObjects':
        return this.cropToObjects(grid);
      case 'padGrid':
        return this.padGrid(grid, params?.[0] || 1);

      // Counting
      case 'countBasedFill':
        return this.countBasedFill(grid);
      case 'majorityFill':
        return this.majorityFill(grid);

      // Continuation
      case 'predictNextRow':
        return this.predictNextRow(grid);
      case 'predictNextColumn':
        return this.predictNextColumn(grid);
      case 'repeatShape':
        return this.repeatShape(grid);
      case 'propagateObject':
        return this.propagateObject(grid);

      // Alignment
      case 'alignCenter':
        return this.alignCenter(grid);
      case 'alignCorners':
        return this.alignCorners(grid);

      // Object operations
      case 'extractObjects':
        return this.extractLargestObject(grid);

      default:
        return grid.clone();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Primitive Implementations
  // ─────────────────────────────────────────────────────────────

  rotate90(grid, times = 1) {
    let result = grid.clone();
    for (let t = 0; t < times; t++) {
      const newData = [];
      for (let c = 0; c < result.cols; c++) {
        const newRow = [];
        for (let r = result.rows - 1; r >= 0; r--) {
          newRow.push(result.data[r][c]);
        }
        newData.push(newRow);
      }
      result = new Grid(newData);
    }
    return result;
  }

  flipHorizontal(grid) {
    return new Grid(grid.data.map(row => [...row].reverse()));
  }

  flipVertical(grid) {
    return new Grid([...grid.data].reverse());
  }

  flipDiagonal(grid) {
    return this.transpose(this.flipHorizontal(grid));
  }

  transpose(grid) {
    const newData = [];
    for (let c = 0; c < grid.cols; c++) {
      const newRow = [];
      for (let r = 0; r < grid.rows; r++) {
        newRow.push(grid.data[r][c]);
      }
      newData.push(newRow);
    }
    return new Grid(newData);
  }

  fillWithColor(grid, color) {
    const result = grid.clone();
    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        result.data[r][c] = color;
      }
    }
    return result;
  }

  replaceColor(grid, fromColor, toColor) {
    const result = grid.clone();
    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        if (result.data[r][c] === fromColor) {
          result.data[r][c] = toColor;
        }
      }
    }
    return result;
  }

  swapColors(grid, color1, color2) {
    const result = grid.clone();
    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        if (result.data[r][c] === color1) {
          result.data[r][c] = color2;
        } else if (result.data[r][c] === color2) {
          result.data[r][c] = color1;
        }
      }
    }
    return result;
  }

  scale(grid, factor) {
    const newData = [];
    for (let r = 0; r < grid.rows; r++) {
      for (let fr = 0; fr < factor; fr++) {
        const newRow = [];
        for (let c = 0; c < grid.cols; c++) {
          for (let fc = 0; fc < factor; fc++) {
            newRow.push(grid.data[r][c]);
          }
        }
        newData.push(newRow);
      }
    }
    return new Grid(newData);
  }

  shrink(grid, factor) {
    const newRows = Math.floor(grid.rows / factor);
    const newCols = Math.floor(grid.cols / factor);
    const newData = [];

    for (let r = 0; r < newRows; r++) {
      const newRow = [];
      for (let c = 0; c < newCols; c++) {
        newRow.push(grid.data[r * factor][c * factor]);
      }
      newData.push(newRow);
    }

    return new Grid(newData);
  }

  tile(grid, times) {
    const newData = [];
    for (let tr = 0; tr < times; tr++) {
      for (let r = 0; r < grid.rows; r++) {
        const newRow = [];
        for (let tc = 0; tc < times; tc++) {
          newRow.push(...grid.data[r]);
        }
        newData.push(newRow);
      }
    }
    return new Grid(newData);
  }

  mirrorHorizontal(grid) {
    const newData = grid.data.map(row => [...row, ...row.slice().reverse()]);
    return new Grid(newData);
  }

  mirrorVertical(grid) {
    const newData = [...grid.data, ...grid.data.slice().reverse()];
    return new Grid(newData);
  }

  applyGravity(grid, direction) {
    const result = grid.clone();

    if (direction === 'down') {
      for (let c = 0; c < result.cols; c++) {
        const column = [];
        for (let r = 0; r < result.rows; r++) {
          if (result.data[r][c] !== 0) column.push(result.data[r][c]);
        }
        const zeros = result.rows - column.length;
        for (let r = 0; r < zeros; r++) result.data[r][c] = 0;
        for (let r = 0; r < column.length; r++) result.data[zeros + r][c] = column[r];
      }
    } else if (direction === 'up') {
      for (let c = 0; c < result.cols; c++) {
        const column = [];
        for (let r = 0; r < result.rows; r++) {
          if (result.data[r][c] !== 0) column.push(result.data[r][c]);
        }
        const zeros = result.rows - column.length;
        for (let r = 0; r < column.length; r++) result.data[r][c] = column[r];
        for (let r = column.length; r < result.rows; r++) result.data[r][c] = 0;
      }
    } else if (direction === 'left') {
      for (let r = 0; r < result.rows; r++) {
        const row = result.data[r].filter(v => v !== 0);
        const zeros = result.cols - row.length;
        result.data[r] = [...row, ...Array(zeros).fill(0)];
      }
    } else if (direction === 'right') {
      for (let r = 0; r < result.rows; r++) {
        const row = result.data[r].filter(v => v !== 0);
        const zeros = result.cols - row.length;
        result.data[r] = [...Array(zeros).fill(0), ...row];
      }
    }

    return result;
  }

  extractBorder(grid) {
    const newData = [];
    for (let r = 0; r < grid.rows; r++) {
      const newRow = [];
      for (let c = 0; c < grid.cols; c++) {
        if (r === 0 || r === grid.rows - 1 || c === 0 || c === grid.cols - 1) {
          newRow.push(grid.data[r][c]);
        } else {
          newRow.push(0);
        }
      }
      newData.push(newRow);
    }
    return new Grid(newData);
  }

  fillBorder(grid, color) {
    const result = grid.clone();
    for (let c = 0; c < result.cols; c++) {
      result.data[0][c] = color;
      result.data[result.rows - 1][c] = color;
    }
    for (let r = 0; r < result.rows; r++) {
      result.data[r][0] = color;
      result.data[r][result.cols - 1] = color;
    }
    return result;
  }

  removeBorder(grid) {
    if (grid.rows <= 2 || grid.cols <= 2) return grid.clone();

    const newData = [];
    for (let r = 1; r < grid.rows - 1; r++) {
      newData.push(grid.data[r].slice(1, -1));
    }
    return new Grid(newData);
  }

  cropToObjects(grid) {
    const objects = grid.getObjects();
    if (objects.length === 0) return grid.clone();

    let minR = Infinity, maxR = -Infinity;
    let minC = Infinity, maxC = -Infinity;

    for (const obj of objects) {
      minR = Math.min(minR, obj.bounds.minR);
      maxR = Math.max(maxR, obj.bounds.maxR);
      minC = Math.min(minC, obj.bounds.minC);
      maxC = Math.max(maxC, obj.bounds.maxC);
    }

    return grid.extractSubgrid(minR, minC, maxR, maxC);
  }

  padGrid(grid, padding) {
    const newRows = grid.rows + 2 * padding;
    const newCols = grid.cols + 2 * padding;
    const newData = Array(newRows).fill(null).map(() => Array(newCols).fill(0));

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        newData[r + padding][c + padding] = grid.data[r][c];
      }
    }

    return new Grid(newData);
  }

  countBasedFill(grid) {
    const colorCounts = {};
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const color = grid.data[r][c];
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    }

    const maxColor = Object.entries(colorCounts)
      .filter(([c]) => parseInt(c) !== 0)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

    return this.replaceColor(grid, 0, parseInt(maxColor));
  }

  majorityFill(grid) {
    const majorityColor = parseInt(grid.getMajorityColor(true));
    const result = grid.clone();

    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        if (result.data[r][c] === 0) {
          result.data[r][c] = majorityColor;
        }
      }
    }

    return result;
  }

  predictNextRow(grid) {
    if (grid.rows < 2) return grid.clone();

    // Look for pattern in rows
    const pattern = this.findRowPattern(grid);
    if (pattern) {
      const nextRow = pattern.predict(grid.rows);
      const newData = [...grid.data, nextRow];
      return new Grid(newData);
    }

    // Default: duplicate last row
    return new Grid([...grid.data, [...grid.data[grid.rows - 1]]]);
  }

  predictNextColumn(grid) {
    if (grid.cols < 2) return grid.clone();

    // Transpose, predict row, transpose back
    const transposed = this.transpose(grid);
    const predicted = this.predictNextRow(transposed);
    return this.transpose(predicted);
  }

  findRowPattern(grid) {
    // Check for repeating patterns
    for (let period = 1; period <= Math.floor(grid.rows / 2); period++) {
      let isPattern = true;
      for (let r = period; r < grid.rows; r++) {
        if (!this.rowsEqual(grid.data[r], grid.data[r % period])) {
          isPattern = false;
          break;
        }
      }
      if (isPattern) {
        return {
          period,
          predict: (row) => [...grid.data[row % period]]
        };
      }
    }
    return null;
  }

  rowsEqual(row1, row2) {
    if (row1.length !== row2.length) return false;
    return row1.every((v, i) => v === row2[i]);
  }

  repeatShape(grid) {
    const objects = grid.getObjects();
    if (objects.length === 0) return grid.clone();

    const largestObj = objects.sort((a, b) => b.size - a.size)[0];
    const { bounds } = largestObj;

    // Extract and tile the shape
    const shape = grid.extractSubgrid(bounds.minR, bounds.minC, bounds.maxR, bounds.maxC);
    return this.tile(shape, 2);
  }

  propagateObject(grid) {
    const objects = grid.getObjects();
    if (objects.length === 0) return grid.clone();

    const result = grid.clone();
    const obj = objects[0];

    // Propagate first object to fill grid
    for (const cell of obj.cells) {
      const relR = cell.row - obj.bounds.minR;
      const relC = cell.col - obj.bounds.minC;

      // Tile across grid
      for (let tr = 0; tr < Math.ceil(grid.rows / obj.bounds.height); tr++) {
        for (let tc = 0; tc < Math.ceil(grid.cols / obj.bounds.width); tc++) {
          const newR = tr * obj.bounds.height + relR;
          const newC = tc * obj.bounds.width + relC;
          if (newR < grid.rows && newC < grid.cols) {
            result.data[newR][newC] = obj.color;
          }
        }
      }
    }

    return result;
  }

  alignCenter(grid) {
    const objects = grid.getObjects();
    if (objects.length === 0) return grid.clone();

    const result = new Grid({ rows: grid.rows, cols: grid.cols });
    const centerR = Math.floor(grid.rows / 2);
    const centerC = Math.floor(grid.cols / 2);

    for (const obj of objects) {
      const objCenterR = Math.floor((obj.bounds.minR + obj.bounds.maxR) / 2);
      const objCenterC = Math.floor((obj.bounds.minC + obj.bounds.maxC) / 2);
      const offsetR = centerR - objCenterR;
      const offsetC = centerC - objCenterC;

      for (const cell of obj.cells) {
        const newR = cell.row + offsetR;
        const newC = cell.col + offsetC;
        if (newR >= 0 && newR < grid.rows && newC >= 0 && newC < grid.cols) {
          result.data[newR][newC] = obj.color;
        }
      }
    }

    return result;
  }

  alignCorners(grid) {
    const objects = grid.getObjects();
    if (objects.length === 0) return grid.clone();

    const result = new Grid({ rows: grid.rows, cols: grid.cols });

    // Place objects in corners
    const corners = [
      [0, 0],
      [0, grid.cols - 1],
      [grid.rows - 1, 0],
      [grid.rows - 1, grid.cols - 1]
    ];

    objects.slice(0, 4).forEach((obj, i) => {
      const [cornerR, cornerC] = corners[i];
      const offsetR = cornerR - obj.bounds.minR;
      const offsetC = cornerC - obj.bounds.minC;

      for (const cell of obj.cells) {
        const newR = cell.row + offsetR;
        const newC = cell.col + offsetC;
        if (newR >= 0 && newR < grid.rows && newC >= 0 && newC < grid.cols) {
          result.data[newR][newC] = obj.color;
        }
      }
    });

    return result;
  }

  extractLargestObject(grid) {
    const objects = grid.getObjects();
    if (objects.length === 0) return grid.clone();

    const largest = objects.sort((a, b) => b.size - a.size)[0];
    return grid.extractSubgrid(
      largest.bounds.minR,
      largest.bounds.minC,
      largest.bounds.maxR,
      largest.bounds.maxC
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 2: TRAINING VALIDATION LOCKSTEP
// ═══════════════════════════════════════════════════════════════════

/**
 * Training examples ARE the answer key.
 * A strategy must pass ALL training pairs or it's worthless.
 */
function validateStrategyOnTraining(strategy, trainingPairs) {
  for (const { input, output } of trainingPairs) {
    const inputGrid = input instanceof Grid ? input : Grid.fromArray(input);
    const expectedOutput = output instanceof Grid ? output : Grid.fromArray(output);

    try {
      const predicted = strategy.apply(inputGrid);
      if (!predicted.equals(expectedOutput)) {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
  return true;
}

/**
 * Check how well a strategy matches training (for partial credit / near-miss tracking)
 */
function scoreStrategyOnTraining(strategy, trainingPairs) {
  let totalCells = 0;
  let correctCells = 0;
  let perfectPairs = 0;

  for (const { input, output } of trainingPairs) {
    const inputGrid = input instanceof Grid ? input : Grid.fromArray(input);
    const expectedOutput = output instanceof Grid ? output : Grid.fromArray(output);

    try {
      const predicted = strategy.apply(inputGrid);

      if (predicted.equals(expectedOutput)) {
        perfectPairs++;
      }

      // Count cell-level accuracy
      const minRows = Math.min(predicted.rows, expectedOutput.rows);
      const minCols = Math.min(predicted.cols, expectedOutput.cols);

      for (let r = 0; r < minRows; r++) {
        for (let c = 0; c < minCols; c++) {
          totalCells++;
          if (predicted.data[r][c] === expectedOutput.data[r][c]) {
            correctCells++;
          }
        }
      }
    } catch (e) {
      totalCells += expectedOutput.rows * expectedOutput.cols;
    }
  }

  return {
    perfectPairs,
    totalPairs: trainingPairs.length,
    cellAccuracy: totalCells > 0 ? correctCells / totalCells : 0,
    isComplete: perfectPairs === trainingPairs.length
  };
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 3: EXTENDED HYPOTHESIS CLASSES
// ═══════════════════════════════════════════════════════════════════

class ReasoningEngine {
  constructor() {
    this.hypothesisClasses = this.initializeHypothesisClasses();
  }

  initializeHypothesisClasses() {
    return {
      // Continuation patterns
      continuation: {
        predictNextRow: (grid) => new Strategy([{ name: 'predictNextRow', type: 'continuation' }]).apply(grid),
        predictNextColumn: (grid) => new Strategy([{ name: 'predictNextColumn', type: 'continuation' }]).apply(grid),
        repeatShape: (grid) => new Strategy([{ name: 'repeatShape', type: 'continuation' }]).apply(grid),
        propagateObject: (grid) => new Strategy([{ name: 'propagateObject', type: 'continuation' }]).apply(grid)
      },

      // Counting-based transforms
      counting: {
        ifObjectCountTransform: (grid, n, transform) => {
          const objects = grid.getObjects();
          if (objects.length === n) {
            return transform(grid);
          }
          return grid.clone();
        },
        majorityColorFill: (grid) => new Strategy([{ name: 'majorityFill', type: 'counting' }]).apply(grid),
        mirrorBasedOnObjectCount: (grid) => {
          const objects = grid.getObjects();
          if (objects.length % 2 === 0) {
            return new Strategy([{ name: 'mirrorHorizontal', type: 'mirror' }]).apply(grid);
          }
          return new Strategy([{ name: 'mirrorVertical', type: 'mirror' }]).apply(grid);
        }
      },

      // Difference learning
      difference: {
        extractDiffMask: (input, output) => {
          const inputGrid = input instanceof Grid ? input : Grid.fromArray(input);
          const outputGrid = output instanceof Grid ? output : Grid.fromArray(output);
          return inputGrid.xor(outputGrid);
        },
        learnTransformationFromDiff: (input, output) => {
          const inputGrid = input instanceof Grid ? input : Grid.fromArray(input);
          const outputGrid = output instanceof Grid ? output : Grid.fromArray(output);
          const diff = inputGrid.diff(outputGrid);
          return {
            changes: diff,
            colorMappings: this.extractColorMappings(diff),
            spatialPattern: this.extractSpatialPattern(diff)
          };
        }
      },

      // Border extraction / enclosure detection
      border: {
        detectBorderColor: (grid) => {
          const border = grid.getBorder();
          const colorCounts = {};
          for (const { color } of border) {
            colorCounts[color] = (colorCounts[color] || 0) + 1;
          }
          return Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
        },
        replaceBorder: (grid, newColor) => new Strategy([{ name: 'fillBorder', type: 'border', currentParam: newColor }]).apply(grid),
        expandFromBorder: (grid) => {
          const result = grid.clone();
          const borderColor = parseInt(this.hypothesisClasses.border.detectBorderColor(grid));

          // Flood fill from border
          for (let r = 1; r < result.rows - 1; r++) {
            for (let c = 1; c < result.cols - 1; c++) {
              if (result.data[r][c] === 0) {
                result.data[r][c] = borderColor;
              }
            }
          }
          return result;
        }
      },

      // Spatial logic
      spatial: {
        gravityLeft: (grid) => new Strategy([{ name: 'gravityLeft', type: 'gravity' }]).apply(grid),
        gravityUp: (grid) => new Strategy([{ name: 'gravityUp', type: 'gravity' }]).apply(grid),
        gravityRight: (grid) => new Strategy([{ name: 'gravityRight', type: 'gravity' }]).apply(grid),
        gravityDown: (grid) => new Strategy([{ name: 'gravityDown', type: 'gravity' }]).apply(grid),
        objectAlignCenter: (grid) => new Strategy([{ name: 'alignCenter', type: 'alignment' }]).apply(grid),
        objectAlignCorners: (grid) => new Strategy([{ name: 'alignCorners', type: 'alignment' }]).apply(grid)
      }
    };
  }

  extractColorMappings(changes) {
    const mappings = {};
    for (const change of changes) {
      const key = change.from;
      if (!mappings[key]) {
        mappings[key] = new Set();
      }
      mappings[key].add(change.to);
    }
    return mappings;
  }

  extractSpatialPattern(changes) {
    if (changes.length === 0) return null;

    // Analyze spatial distribution of changes
    const rows = changes.map(c => c.row);
    const cols = changes.map(c => c.col);

    return {
      rowSpread: Math.max(...rows) - Math.min(...rows),
      colSpread: Math.max(...cols) - Math.min(...cols),
      center: {
        row: rows.reduce((a, b) => a + b, 0) / rows.length,
        col: cols.reduce((a, b) => a + b, 0) / cols.length
      },
      count: changes.length
    };
  }

  /**
   * Generate specialized strategies based on hypothesis classes
   */
  *generateHypothesisStrategies() {
    // Yield continuation-based strategies
    for (const [name, fn] of Object.entries(this.hypothesisClasses.continuation)) {
      yield { name: `continuation:${name}`, apply: fn };
    }

    // Yield counting-based strategies
    yield { name: 'counting:majorityColorFill', apply: this.hypothesisClasses.counting.majorityColorFill };
    yield { name: 'counting:mirrorBasedOnCount', apply: this.hypothesisClasses.counting.mirrorBasedOnObjectCount };

    // Yield spatial strategies
    for (const [name, fn] of Object.entries(this.hypothesisClasses.spatial)) {
      yield { name: `spatial:${name}`, apply: fn };
    }

    // Yield border strategies
    yield { name: 'border:expandFromBorder', apply: this.hypothesisClasses.border.expandFromBorder };
  }
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 4: MEMORY-BASED SELF-BOOSTING
// ═══════════════════════════════════════════════════════════════════

class SolverMemory {
  constructor(basePath = './memory') {
    this.basePath = basePath;
    this.successful = [];
    this.partial = [];
    this.mappings = {};
    this.loaded = false;
  }

  ensureDirectory() {
    try {
      if (!fs.existsSync(this.basePath)) {
        fs.mkdirSync(this.basePath, { recursive: true });
      }
    } catch (e) {
      // Running in environment without fs access
    }
  }

  load() {
    if (this.loaded) return;

    this.ensureDirectory();

    try {
      const successfulPath = path.join(this.basePath, 'successful.json');
      if (fs.existsSync(successfulPath)) {
        this.successful = JSON.parse(fs.readFileSync(successfulPath, 'utf8'));
      }

      const partialPath = path.join(this.basePath, 'partial.json');
      if (fs.existsSync(partialPath)) {
        this.partial = JSON.parse(fs.readFileSync(partialPath, 'utf8'));
      }

      const mappingsPath = path.join(this.basePath, 'mappings.json');
      if (fs.existsSync(mappingsPath)) {
        this.mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
      }
    } catch (e) {
      // Memory files don't exist yet or fs not available
    }

    this.loaded = true;
  }

  save() {
    this.ensureDirectory();

    try {
      fs.writeFileSync(
        path.join(this.basePath, 'successful.json'),
        JSON.stringify(this.successful, null, 2)
      );
      fs.writeFileSync(
        path.join(this.basePath, 'partial.json'),
        JSON.stringify(this.partial, null, 2)
      );
      fs.writeFileSync(
        path.join(this.basePath, 'mappings.json'),
        JSON.stringify(this.mappings, null, 2)
      );
    } catch (e) {
      // fs not available
    }
  }

  recordSuccess(taskId, strategy, score) {
    this.load();

    this.successful.push({
      taskId,
      strategyName: strategy.name,
      strategyChain: strategy.chain.map(p => p.name),
      depth: strategy.depth,
      score,
      timestamp: Date.now()
    });

    // Update pattern mappings
    this.updateMappings(strategy);
    this.save();
  }

  recordPartial(taskId, strategy, score) {
    this.load();

    if (score.cellAccuracy > 0.5) { // Only track near-misses
      this.partial.push({
        taskId,
        strategyName: strategy.name,
        strategyChain: strategy.chain.map(p => p.name),
        depth: strategy.depth,
        score,
        timestamp: Date.now()
      });
      this.save();
    }
  }

  updateMappings(strategy) {
    for (const primitive of strategy.chain) {
      const type = primitive.type;
      if (!this.mappings[type]) {
        this.mappings[type] = { count: 0, successRate: 0 };
      }
      this.mappings[type].count++;
      this.mappings[type].successRate =
        (this.mappings[type].successRate * (this.mappings[type].count - 1) + 1) / this.mappings[type].count;
    }
  }

  /**
   * Bias strategy generation based on past success
   */
  getPriorityPrimitives() {
    this.load();

    const sorted = Object.entries(this.mappings)
      .filter(([_, stats]) => stats.count > 0)
      .sort((a, b) => b[1].successRate - a[1].successRate);

    return sorted.map(([type]) => type);
  }

  /**
   * Get strategies that worked for similar tasks
   */
  getSimilarSuccesses(taskFeatures) {
    this.load();

    // Simple similarity: same grid dimensions
    return this.successful.filter(s => {
      // TODO: implement proper task similarity matching
      return true;
    }).slice(0, 10);
  }
}

// ═══════════════════════════════════════════════════════════════════
// THE UNLIMITED SOLVER - MAIN ENGINE
// ═══════════════════════════════════════════════════════════════════

class UnlimitedSolver {
  constructor(config = {}) {
    this.config = {
      maxDepth: config.maxDepth || Infinity,
      maxTime: config.maxTime || 300000, // 5 minutes default
      verbose: config.verbose !== false,
      memoryPath: config.memoryPath || path.join(__dirname, 'memory'),
      ...config
    };

    this.memory = new SolverMemory(this.config.memoryPath);
    this.reasoningEngine = new ReasoningEngine();
    this.stats = {
      strategiesTried: 0,
      maxDepthReached: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * THE CORE SOLVING LOOP
   * This is where the magic happens.
   * Training examples ARE the answer key.
   */
  solve(task) {
    const { train: trainingPairs, test: testPairs } = this.parseTask(task);

    if (trainingPairs.length === 0) {
      throw new Error('No training pairs provided');
    }

    this.stats.startTime = Date.now();
    this.stats.strategiesTried = 0;

    if (this.config.verbose) {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`UNLIMITED SOLVER - INFINITE REASONING ENGINE`);
      console.log(`Training pairs: ${trainingPairs.length}`);
      console.log(`Test pairs: ${testPairs.length}`);
      console.log(`${'═'.repeat(60)}\n`);
    }

    // First: try strategies from memory (learned from past)
    const memoryStrategy = this.tryMemoryStrategies(trainingPairs);
    if (memoryStrategy) {
      return this.applyToTest(memoryStrategy, testPairs);
    }

    // Second: try hypothesis-based strategies
    const hypothesisStrategy = this.tryHypothesisStrategies(trainingPairs);
    if (hypothesisStrategy) {
      this.memory.recordSuccess(task.id || 'unknown', hypothesisStrategy, { perfectPairs: trainingPairs.length });
      return this.applyToTest(hypothesisStrategy, testPairs);
    }

    // Third: THE INFINITE SEARCH
    // Walk deeper, wider, smarter - forever (until we find it or timeout)
    for (const strategy of infiniteStrategies()) {
      this.stats.strategiesTried++;
      this.stats.maxDepthReached = Math.max(this.stats.maxDepthReached, strategy.depth);

      // Check timeout
      if (Date.now() - this.stats.startTime > this.config.maxTime) {
        if (this.config.verbose) {
          console.log(`\nTimeout reached after ${this.stats.strategiesTried} strategies`);
          console.log(`Max depth explored: ${this.stats.maxDepthReached}`);
        }
        break;
      }

      // Check depth limit
      if (strategy.depth > this.config.maxDepth) {
        break;
      }

      // Progress logging
      if (this.config.verbose && this.stats.strategiesTried % 10000 === 0) {
        console.log(`[${this.stats.strategiesTried}] Depth ${strategy.depth}: ${strategy.name.substring(0, 60)}...`);
      }

      // THE VALIDATION: Training examples ARE the answer key
      if (validateStrategyOnTraining(strategy, trainingPairs)) {
        this.stats.endTime = Date.now();

        if (this.config.verbose) {
          console.log(`\n${'═'.repeat(60)}`);
          console.log(`SOLUTION FOUND!`);
          console.log(`Strategy: ${strategy.name}`);
          console.log(`Depth: ${strategy.depth}`);
          console.log(`Strategies tried: ${this.stats.strategiesTried}`);
          console.log(`Time: ${this.stats.endTime - this.stats.startTime}ms`);
          console.log(`${'═'.repeat(60)}\n`);
        }

        this.memory.recordSuccess(task.id || 'unknown', strategy, { perfectPairs: trainingPairs.length });
        return this.applyToTest(strategy, testPairs);
      }

      // Track near-misses for learning
      const score = scoreStrategyOnTraining(strategy, trainingPairs);
      if (score.cellAccuracy > 0.8) {
        this.memory.recordPartial(task.id || 'unknown', strategy, score);
      }
    }

    // No solution found
    this.stats.endTime = Date.now();
    return {
      success: false,
      stats: this.stats,
      message: 'No valid strategy found within constraints'
    };
  }

  parseTask(task) {
    const train = (task.train || []).map(pair => ({
      input: pair.input,
      output: pair.output
    }));

    const test = (task.test || []).map(pair => ({
      input: pair.input,
      output: pair.output
    }));

    return { train, test };
  }

  tryMemoryStrategies(trainingPairs) {
    const pastSuccesses = this.memory.getSimilarSuccesses({});

    for (const success of pastSuccesses) {
      try {
        const strategy = new Strategy(
          success.strategyChain.map(name => ({ name, type: 'memory' }))
        );

        if (validateStrategyOnTraining(strategy, trainingPairs)) {
          if (this.config.verbose) {
            console.log(`Found solution from memory: ${success.strategyName}`);
          }
          return strategy;
        }
      } catch (e) {
        // Strategy from memory didn't work
      }
    }

    return null;
  }

  tryHypothesisStrategies(trainingPairs) {
    for (const hypothesis of this.reasoningEngine.generateHypothesisStrategies()) {
      this.stats.strategiesTried++;

      try {
        const wrappedStrategy = {
          name: hypothesis.name,
          depth: 1,
          chain: [{ name: hypothesis.name, type: 'hypothesis' }],
          apply: hypothesis.apply
        };

        let valid = true;
        for (const { input, output } of trainingPairs) {
          const inputGrid = input instanceof Grid ? input : Grid.fromArray(input);
          const expectedOutput = output instanceof Grid ? output : Grid.fromArray(output);

          const predicted = hypothesis.apply(inputGrid);
          if (!predicted.equals(expectedOutput)) {
            valid = false;
            break;
          }
        }

        if (valid) {
          if (this.config.verbose) {
            console.log(`Found solution via hypothesis: ${hypothesis.name}`);
          }
          return wrappedStrategy;
        }
      } catch (e) {
        // Hypothesis didn't work
      }
    }

    return null;
  }

  applyToTest(strategy, testPairs) {
    const results = [];

    for (const { input, output } of testPairs) {
      const inputGrid = input instanceof Grid ? input : Grid.fromArray(input);
      const expectedOutput = output ? (output instanceof Grid ? output : Grid.fromArray(output)) : null;

      const predicted = strategy.apply(inputGrid);

      results.push({
        input: inputGrid.toArray(),
        predicted: predicted.toArray(),
        expected: expectedOutput?.toArray() || null,
        correct: expectedOutput ? predicted.equals(expectedOutput) : null
      });
    }

    return {
      success: true,
      strategy: {
        name: strategy.name,
        depth: strategy.depth
      },
      results,
      stats: this.stats
    };
  }

  /**
   * Quick solve with sensible defaults
   */
  static quickSolve(task, timeout = 60000) {
    const solver = new UnlimitedSolver({
      maxTime: timeout,
      verbose: false
    });
    return solver.solve(task);
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // Main solver
  UnlimitedSolver,

  // Core classes
  Grid,
  Strategy,
  ReasoningEngine,
  SolverMemory,

  // Generators
  infiniteStrategies,
  generateStrategiesOfDepth,
  getPrimitives,

  // Validation
  validateStrategyOnTraining,
  scoreStrategyOnTraining,

  // Meta
  VERSION: SOLVER_VERSION,
  CODENAME
};
