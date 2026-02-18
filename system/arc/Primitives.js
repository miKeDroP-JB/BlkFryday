/**
 * Primitives.js
 * ═══════════════════════════════════════════════════════════════════
 * Core grid transformation primitives for ARC tasks.
 * Each primitive is a pure function: grid → grid (or null on failure)
 */

/**
 * Deep clone a grid
 */
function cloneGrid(grid) {
  if (!grid || !Array.isArray(grid)) return null;
  return grid.map(row => row.slice());
}

/**
 * Rotate grid 90° clockwise
 */
function rotate90(grid) {
  if (!grid || !grid.length) return null;
  const h = grid.length, w = grid[0].length;
  const result = Array.from({ length: w }, () => Array(h).fill(0));
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      result[c][h - 1 - r] = grid[r][c];
    }
  }
  return result;
}

/**
 * Rotate grid 180°
 */
function rotate180(grid) {
  if (!grid || !grid.length) return null;
  const h = grid.length, w = grid[0].length;
  const result = Array.from({ length: h }, () => Array(w).fill(0));
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      result[h - 1 - r][w - 1 - c] = grid[r][c];
    }
  }
  return result;
}

/**
 * Rotate grid 270° clockwise (90° counter-clockwise)
 */
function rotate270(grid) {
  if (!grid || !grid.length) return null;
  const h = grid.length, w = grid[0].length;
  const result = Array.from({ length: w }, () => Array(h).fill(0));
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      result[w - 1 - c][r] = grid[r][c];
    }
  }
  return result;
}

/**
 * Flip grid horizontally (mirror left-right)
 */
function flipHorizontal(grid) {
  if (!grid || !grid.length) return null;
  return grid.map(row => row.slice().reverse());
}

/**
 * Flip grid vertically (mirror top-bottom)
 */
function flipVertical(grid) {
  if (!grid || !grid.length) return null;
  return cloneGrid(grid).reverse();
}

/**
 * Transpose grid (swap rows and columns)
 */
function transpose(grid) {
  if (!grid || !grid.length) return null;
  const h = grid.length, w = grid[0].length;
  const result = Array.from({ length: w }, () => Array(h).fill(0));
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      result[c][r] = grid[r][c];
    }
  }
  return result;
}

/**
 * Identity (no-op, returns clone)
 */
function identity(grid) {
  return cloneGrid(grid);
}

/**
 * Invert colors (swap 0s and non-0s with max color)
 */
function invertColors(grid) {
  if (!grid || !grid.length) return null;
  let maxColor = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell > maxColor) maxColor = cell;
    }
  }
  if (maxColor === 0) return cloneGrid(grid);

  return grid.map(row => row.map(cell => cell === 0 ? maxColor : 0));
}

/**
 * Shift grid down by 1 row
 */
function shiftDown(grid) {
  if (!grid || !grid.length) return null;
  const h = grid.length, w = grid[0].length;
  const result = Array.from({ length: h }, () => Array(w).fill(0));
  for (let r = 0; r < h - 1; r++) {
    for (let c = 0; c < w; c++) {
      result[r + 1][c] = grid[r][c];
    }
  }
  return result;
}

/**
 * Shift grid up by 1 row
 */
function shiftUp(grid) {
  if (!grid || !grid.length) return null;
  const h = grid.length, w = grid[0].length;
  const result = Array.from({ length: h }, () => Array(w).fill(0));
  for (let r = 1; r < h; r++) {
    for (let c = 0; c < w; c++) {
      result[r - 1][c] = grid[r][c];
    }
  }
  return result;
}

/**
 * Shift grid right by 1 column
 */
function shiftRight(grid) {
  if (!grid || !grid.length) return null;
  const h = grid.length, w = grid[0].length;
  const result = Array.from({ length: h }, () => Array(w).fill(0));
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w - 1; c++) {
      result[r][c + 1] = grid[r][c];
    }
  }
  return result;
}

/**
 * Shift grid left by 1 column
 */
function shiftLeft(grid) {
  if (!grid || !grid.length) return null;
  const h = grid.length, w = grid[0].length;
  const result = Array.from({ length: h }, () => Array(w).fill(0));
  for (let r = 0; r < h; r++) {
    for (let c = 1; c < w; c++) {
      result[r][c - 1] = grid[r][c];
    }
  }
  return result;
}

/**
 * Gravity down - drop all non-zero cells to bottom
 */
function gravityDown(grid) {
  if (!grid || !grid.length) return null;
  const h = grid.length, w = grid[0].length;
  const result = Array.from({ length: h }, () => Array(w).fill(0));

  for (let c = 0; c < w; c++) {
    let writeRow = h - 1;
    for (let r = h - 1; r >= 0; r--) {
      if (grid[r][c] !== 0) {
        result[writeRow][c] = grid[r][c];
        writeRow--;
      }
    }
  }
  return result;
}

/**
 * Gravity up - float all non-zero cells to top
 */
function gravityUp(grid) {
  if (!grid || !grid.length) return null;
  const h = grid.length, w = grid[0].length;
  const result = Array.from({ length: h }, () => Array(w).fill(0));

  for (let c = 0; c < w; c++) {
    let writeRow = 0;
    for (let r = 0; r < h; r++) {
      if (grid[r][c] !== 0) {
        result[writeRow][c] = grid[r][c];
        writeRow++;
      }
    }
  }
  return result;
}

/**
 * Gravity left - push all non-zero cells to left
 */
function gravityLeft(grid) {
  if (!grid || !grid.length) return null;
  return grid.map(row => {
    const nonZero = row.filter(c => c !== 0);
    const zeros = Array(row.length - nonZero.length).fill(0);
    return [...nonZero, ...zeros];
  });
}

/**
 * Gravity right - push all non-zero cells to right
 */
function gravityRight(grid) {
  if (!grid || !grid.length) return null;
  return grid.map(row => {
    const nonZero = row.filter(c => c !== 0);
    const zeros = Array(row.length - nonZero.length).fill(0);
    return [...zeros, ...nonZero];
  });
}

/**
 * Scale grid 2x
 */
function scale2x(grid) {
  if (!grid || !grid.length) return null;
  const h = grid.length, w = grid[0].length;
  const result = Array.from({ length: h * 2 }, () => Array(w * 2).fill(0));
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const val = grid[r][c];
      result[r * 2][c * 2] = val;
      result[r * 2][c * 2 + 1] = val;
      result[r * 2 + 1][c * 2] = val;
      result[r * 2 + 1][c * 2 + 1] = val;
    }
  }
  return result;
}

/**
 * Fill border with dominant non-zero color
 */
function fillBorder(grid) {
  if (!grid || !grid.length) return null;
  const h = grid.length, w = grid[0].length;
  const result = cloneGrid(grid);

  // Find dominant color
  const colorCounts = new Map();
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== 0) {
        colorCounts.set(cell, (colorCounts.get(cell) || 0) + 1);
      }
    }
  }

  let dominant = 1;
  let maxCount = 0;
  for (const [color, count] of colorCounts) {
    if (count > maxCount) {
      maxCount = count;
      dominant = color;
    }
  }

  // Fill border
  for (let c = 0; c < w; c++) {
    result[0][c] = dominant;
    result[h - 1][c] = dominant;
  }
  for (let r = 0; r < h; r++) {
    result[r][0] = dominant;
    result[r][w - 1] = dominant;
  }

  return result;
}

/**
 * Remove border (set to 0)
 */
function removeBorder(grid) {
  if (!grid || !grid.length) return null;
  const h = grid.length, w = grid[0].length;
  const result = cloneGrid(grid);

  for (let c = 0; c < w; c++) {
    result[0][c] = 0;
    result[h - 1][c] = 0;
  }
  for (let r = 0; r < h; r++) {
    result[r][0] = 0;
    result[r][w - 1] = 0;
  }

  return result;
}

/**
 * Replace most common color with second most common
 */
function swapTopColors(grid) {
  if (!grid || !grid.length) return null;

  const colorCounts = new Map();
  for (const row of grid) {
    for (const cell of row) {
      colorCounts.set(cell, (colorCounts.get(cell) || 0) + 1);
    }
  }

  const sorted = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length < 2) return cloneGrid(grid);

  const [color1] = sorted[0];
  const [color2] = sorted[1];

  return grid.map(row => row.map(cell => {
    if (cell === color1) return color2;
    if (cell === color2) return color1;
    return cell;
  }));
}

// Export all primitives as a named object
const primitives = {
  identity,
  rotate90,
  rotate180,
  rotate270,
  flipHorizontal,
  flipVertical,
  transpose,
  invertColors,
  shiftDown,
  shiftUp,
  shiftRight,
  shiftLeft,
  gravityDown,
  gravityUp,
  gravityLeft,
  gravityRight,
  scale2x,
  fillBorder,
  removeBorder,
  swapTopColors
};

module.exports = { primitives, cloneGrid };
