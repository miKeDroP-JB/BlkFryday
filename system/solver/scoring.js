/**
 * Convergence Scoring Functions
 * ═══════════════════════════════════════════════════════════════════
 * Composite scoring for candidate evaluation during convergence passes.
 * Scores mapping accuracy, symmetry preservation, and diagonal patterns.
 */

/**
 * Score cell-by-cell mapping accuracy between two grids
 * @param {number[][]} a - First grid
 * @param {number[][]} b - Second grid
 * @returns {number} - Score between 0 and 1
 */
function scoreMapping(a, b) {
  if (!a || !b || !a.length || !b.length) return 0;
  if (a.length !== b.length || a[0].length !== b[0].length) return 0;

  let score = 0;
  const total = a.length * a[0].length;

  for (let y = 0; y < a.length; y++) {
    for (let x = 0; x < a[0].length; x++) {
      if (a[y][x] === b[y][x]) score += 1;
    }
  }

  return score / total;
}

/**
 * Check if grid b is a vertical mirror of grid a
 */
function isMirrorVertical(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const h = a.length, w = a[0]?.length || 0;
  if (w !== (b[0]?.length || 0)) return false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (a[y][x] !== b[y][w - 1 - x]) return false;
    }
  }
  return true;
}

/**
 * Check if grid b is a horizontal mirror of grid a
 */
function isMirrorHorizontal(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const h = a.length, w = a[0]?.length || 0;
  if (w !== (b[0]?.length || 0)) return false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (a[y][x] !== b[h - 1 - y][x]) return false;
    }
  }
  return true;
}

/**
 * Check if grid b is any mirror of grid a
 */
function isMirror(a, b) {
  return isMirrorVertical(a, b) || isMirrorHorizontal(a, b);
}

/**
 * Check if grid b is a 90° rotation of grid a
 */
function isRot90(a, b) {
  if (!a || !b) return false;
  const h = a.length, w = a[0]?.length || 0;
  if (b.length !== w || (b[0]?.length || 0) !== h) return false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (a[y][x] !== b[x][h - 1 - y]) return false;
    }
  }
  return true;
}

/**
 * Check if grid b is a 180° rotation of grid a
 */
function isRot180(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const h = a.length, w = a[0]?.length || 0;
  if (w !== (b[0]?.length || 0)) return false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (a[y][x] !== b[h - 1 - y][w - 1 - x]) return false;
    }
  }
  return true;
}

/**
 * Check if grid b is any rotation of grid a
 */
function isRot(a, b) {
  return isRot90(a, b) || isRot180(a, b);
}

/**
 * Score symmetry relationship between grids
 * @param {number[][]} a - First grid
 * @param {number[][]} b - Second grid
 * @returns {number} - Symmetry bonus score
 */
function scoreSymmetry(a, b) {
  let s = 0;
  if (isMirror(a, b)) s += 0.5;
  if (isRot(a, b)) s += 0.3;
  return s;
}

/**
 * Detect diagonal pattern match between grids
 */
function detectDiagonalMatch(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const h = a.length, w = a[0]?.length || 0;
  if (w !== (b[0]?.length || 0)) return false;

  // Check main diagonal preservation
  let mainDiagMatch = 0;
  let antiDiagMatch = 0;
  const diagLen = Math.min(h, w);

  for (let i = 0; i < diagLen; i++) {
    if (a[i][i] === b[i][i]) mainDiagMatch++;
    if (a[i][w - 1 - i] === b[i][w - 1 - i]) antiDiagMatch++;
  }

  // Check if transpose relationship exists
  let transposeMatch = true;
  if (h === w) {
    for (let y = 0; y < h && transposeMatch; y++) {
      for (let x = 0; x < w && transposeMatch; x++) {
        if (a[y][x] !== b[x][y]) transposeMatch = false;
      }
    }
  } else {
    transposeMatch = false;
  }

  return (mainDiagMatch >= diagLen * 0.8) ||
         (antiDiagMatch >= diagLen * 0.8) ||
         transposeMatch;
}

/**
 * Score diagonal pattern relationships
 * @param {number[][]} a - First grid
 * @param {number[][]} b - Second grid
 * @returns {number} - Diagonal bonus score
 */
function scoreDiagonal(a, b) {
  return detectDiagonalMatch(a, b) ? 0.4 : 0;
}

/**
 * Compute composite convergence score
 * @param {number[][]} original - Original grid
 * @param {number[][]} transformed - Transformed grid
 * @returns {number} - Composite score
 */
function compositeScore(original, transformed) {
  const mapping = scoreMapping(original, transformed);
  const symmetry = scoreSymmetry(original, transformed);
  const diagonal = scoreDiagonal(original, transformed);
  return mapping + symmetry + diagonal;
}

module.exports = {
  scoreMapping,
  scoreSymmetry,
  scoreDiagonal,
  compositeScore,
  isMirror,
  isMirrorVertical,
  isMirrorHorizontal,
  isRot,
  isRot90,
  isRot180,
  detectDiagonalMatch
};
