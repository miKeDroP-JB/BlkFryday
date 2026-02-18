/**
 * Quick Evaluate - Ultra-Light Scoring
 * ═══════════════════════════════════════════════════════════════════
 * Color entropy reduction + shape consolidation scoring.
 * Fast heuristic for candidate filtering without full validation.
 */

/**
 * Score a transform based on entropy reduction
 * @param {Object} prevState - Previous state with grid
 * @param {Object} nextState - Next state with grid
 * @returns {number} Score in range [-1, 1], positive = improvement
 */
function quickEvaluate(prevState, nextState) {
  const prevE = entropy(prevState.grid);
  const nextE = entropy(nextState.grid);
  const delta = prevE - nextE;
  // map delta to confidence-like score
  return Math.max(-1, Math.min(1, delta));
}

/**
 * Calculate Shannon entropy of a grid
 * @param {Array<Array<number>>} grid - 2D grid of values
 * @returns {number} Entropy value
 */
function entropy(grid) {
  const hist = new Map();
  let total = 0;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      total++;
      const v = grid[r][c];
      hist.set(v, (hist.get(v) || 0) + 1);
    }
  }

  let H = 0;
  for (const [, n] of hist) {
    const p = n / total;
    H -= p * Math.log2(p);
  }

  return H;
}

/**
 * Extended evaluation with additional metrics
 * @param {Object} prevState - Previous state
 * @param {Object} nextState - Next state
 * @returns {Object} Detailed evaluation metrics
 */
function quickEvaluateExtended(prevState, nextState) {
  const prevE = entropy(prevState.grid);
  const nextE = entropy(nextState.grid);
  const entropyDelta = prevE - nextE;

  // Shape consolidation: fewer unique connected regions = better
  const prevRegions = countRegions(prevState.grid);
  const nextRegions = countRegions(nextState.grid);
  const regionDelta = prevRegions - nextRegions;

  // Color concentration
  const prevConc = colorConcentration(prevState.grid);
  const nextConc = colorConcentration(nextState.grid);
  const concDelta = nextConc - prevConc;

  const combined = (entropyDelta * 0.4) + (regionDelta * 0.3) + (concDelta * 0.3);

  return {
    score: Math.max(-1, Math.min(1, combined)),
    entropy: { prev: prevE, next: nextE, delta: entropyDelta },
    regions: { prev: prevRegions, next: nextRegions, delta: regionDelta },
    concentration: { prev: prevConc, next: nextConc, delta: concDelta }
  };
}

/**
 * Count connected regions in grid (simple flood-fill count)
 */
function countRegions(grid) {
  const h = grid.length, w = grid[0].length;
  const visited = Array.from({ length: h }, () => Array(w).fill(false));
  let count = 0;

  function flood(r, c, val) {
    if (r < 0 || r >= h || c < 0 || c >= w) return;
    if (visited[r][c] || grid[r][c] !== val) return;
    visited[r][c] = true;
    flood(r+1, c, val);
    flood(r-1, c, val);
    flood(r, c+1, val);
    flood(r, c-1, val);
  }

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (!visited[r][c] && grid[r][c] !== 0) {
        flood(r, c, grid[r][c]);
        count++;
      }
    }
  }

  return count;
}

/**
 * Measure color concentration (how dominant is the top color)
 */
function colorConcentration(grid) {
  const hist = new Map();
  let total = 0;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] !== 0) {
        total++;
        const v = grid[r][c];
        hist.set(v, (hist.get(v) || 0) + 1);
      }
    }
  }

  if (total === 0) return 0;

  let maxCount = 0;
  for (const [, n] of hist) {
    if (n > maxCount) maxCount = n;
  }

  return maxCount / total;
}

module.exports = {
  quickEvaluate,
  quickEvaluateExtended,
  entropy,
  countRegions,
  colorConcentration
};
