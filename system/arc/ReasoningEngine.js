/**
 * ReasoningEngine.js
 * ═══════════════════════════════════════════════════════════════════
 * Grid comparison and scoring utilities for ARC reasoning.
 */

/**
 * Check if two grids are exactly equal
 * @param {number[][]} a - First grid
 * @param {number[][]} b - Second grid
 * @returns {boolean} - True if grids match exactly
 */
function gridsEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let r = 0; r < a.length; r++) {
    if (!a[r] || !b[r]) return false;
    if (a[r].length !== b[r].length) return false;
    for (let c = 0; c < a[r].length; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

/**
 * Score similarity between two grids (0 to 1)
 * @param {number[][]} a - First grid
 * @param {number[][]} b - Second grid
 * @returns {number} - Similarity score (1.0 = perfect match)
 */
function scoreGrids(a, b) {
  if (!a || !b) return 0;
  if (a.length !== b.length) return 0;

  let matches = 0;
  let total = 0;

  for (let r = 0; r < a.length; r++) {
    if (!a[r] || !b[r]) return 0;
    if (a[r].length !== b[r].length) return 0;

    for (let c = 0; c < a[r].length; c++) {
      total++;
      if (a[r][c] === b[r][c]) matches++;
    }
  }

  return total > 0 ? matches / total : 0;
}

/**
 * Get grid dimensions
 * @param {number[][]} grid - Input grid
 * @returns {{height: number, width: number}} - Dimensions
 */
function gridDimensions(grid) {
  if (!grid || !grid.length) return { height: 0, width: 0 };
  return { height: grid.length, width: grid[0]?.length || 0 };
}

/**
 * Check if grid dimensions match
 * @param {number[][]} a - First grid
 * @param {number[][]} b - Second grid
 * @returns {boolean} - True if dimensions match
 */
function dimensionsMatch(a, b) {
  const dimA = gridDimensions(a);
  const dimB = gridDimensions(b);
  return dimA.height === dimB.height && dimA.width === dimB.width;
}

/**
 * Count unique colors in a grid
 * @param {number[][]} grid - Input grid
 * @returns {number} - Number of unique colors
 */
function countColors(grid) {
  if (!grid || !grid.length) return 0;
  const colors = new Set();
  for (const row of grid) {
    for (const cell of row) {
      colors.add(cell);
    }
  }
  return colors.size;
}

/**
 * Get color histogram for a grid
 * @param {number[][]} grid - Input grid
 * @returns {Map<number, number>} - Color counts
 */
function colorHistogram(grid) {
  const counts = new Map();
  if (!grid || !grid.length) return counts;

  for (const row of grid) {
    for (const cell of row) {
      counts.set(cell, (counts.get(cell) || 0) + 1);
    }
  }
  return counts;
}

/**
 * Compare color distributions between grids
 * @param {number[][]} a - First grid
 * @param {number[][]} b - Second grid
 * @returns {number} - Distribution similarity (0 to 1)
 */
function colorDistributionSimilarity(a, b) {
  const histA = colorHistogram(a);
  const histB = colorHistogram(b);

  const allColors = new Set([...histA.keys(), ...histB.keys()]);
  let totalA = 0, totalB = 0;

  for (const count of histA.values()) totalA += count;
  for (const count of histB.values()) totalB += count;

  if (totalA === 0 || totalB === 0) return 0;

  let similarity = 0;
  for (const color of allColors) {
    const ratioA = (histA.get(color) || 0) / totalA;
    const ratioB = (histB.get(color) || 0) / totalB;
    similarity += Math.min(ratioA, ratioB);
  }

  return similarity;
}

module.exports = {
  gridsEqual,
  scoreGrids,
  gridDimensions,
  dimensionsMatch,
  countColors,
  colorHistogram,
  colorDistributionSimilarity
};
