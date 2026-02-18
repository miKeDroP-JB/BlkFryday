/**
 * Convergence Engine
 * ═══════════════════════════════════════════════════════════════════
 * Iterative stabilization loop for noisy transforms.
 * Repeatedly applies candidates, scoring with composite metrics,
 * until convergence (no improvement) or max cycles reached.
 */

const { scoreMapping, scoreSymmetry, scoreDiagonal, compositeScore } = require('./scoring');
const logger = require('../logger');

/**
 * Deep clone a grid
 * @param {number[][]} grid - Input grid
 * @returns {number[][]} - Cloned grid
 */
function deepClone(grid) {
  if (!grid || !Array.isArray(grid)) return grid;
  return grid.map(row => row.slice());
}

/**
 * Check if two grids are identical
 * @param {number[][]} a - First grid
 * @param {number[][]} b - Second grid
 * @returns {boolean} - True if grids match exactly
 */
function gridsEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let y = 0; y < a.length; y++) {
    if (a[y].length !== b[y].length) return false;
    for (let x = 0; x < a[y].length; x++) {
      if (a[y][x] !== b[y][x]) return false;
    }
  }
  return true;
}

/**
 * Converge a grid through iterative candidate application
 *
 * @param {number[][]} inputGrid - Starting grid
 * @param {Array<{name: string, apply: Function}>} candidateSet - Transform candidates
 * @param {number} maxCycles - Maximum convergence iterations (default: 12)
 * @returns {{grid: number[][], cycles: number, improved: boolean, history: Array}}
 */
function converge(inputGrid, candidateSet, maxCycles = 12) {
  if (!inputGrid || !candidateSet || candidateSet.length === 0) {
    return {
      grid: inputGrid,
      cycles: 0,
      improved: false,
      history: []
    };
  }

  let grid = deepClone(inputGrid);
  const history = [];
  let totalImprovement = 0;

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    let best = null;
    let bestScore = -Infinity;
    let bestCandidate = null;

    for (const cand of candidateSet) {
      try {
        // Create state object for candidate application
        const state = {
          grid: grid,
          clone: () => deepClone(grid)
        };

        const transformed = cand.apply(state);
        if (!transformed) continue;

        // Handle both raw grid returns and state object returns
        const resultGrid = Array.isArray(transformed) ? transformed : (transformed.grid || transformed);
        if (!resultGrid || !Array.isArray(resultGrid)) continue;

        // Compute composite score
        const s1 = scoreMapping(grid, resultGrid);
        const s2 = scoreSymmetry(grid, resultGrid);
        const s3 = scoreDiagonal(grid, resultGrid);
        const composite = s1 + s2 + s3;

        if (composite > bestScore) {
          bestScore = composite;
          best = resultGrid;
          bestCandidate = cand.name;
        }
      } catch (e) {
        // Skip failed candidates silently
        continue;
      }
    }

    if (!best) {
      logger.log('CONVERGE_NO_CANDIDATE', { cycle, reason: 'no_valid_transform' });
      break;
    }

    // Check for improvement threshold
    const mappingDelta = scoreMapping(grid, best);

    // If improvement is negligible, converge early
    if (mappingDelta < 0.001) {
      logger.log('CONVERGE_PLATEAU', { cycle, delta: mappingDelta });
      break;
    }

    // If the grid didn't change, we've converged
    if (gridsEqual(grid, best)) {
      logger.log('CONVERGE_STABLE', { cycle, reason: 'no_change' });
      break;
    }

    // Record history
    history.push({
      cycle,
      candidate: bestCandidate,
      score: bestScore,
      mappingDelta
    });

    totalImprovement += (1 - mappingDelta);
    grid = best;

    logger.log('CONVERGE_STEP', {
      cycle,
      candidate: bestCandidate,
      score: bestScore.toFixed(4)
    });
  }

  return {
    grid,
    cycles: history.length,
    improved: history.length > 0,
    history,
    totalImprovement
  };
}

/**
 * Converge with target matching - stops early if output matches expected
 *
 * @param {number[][]} inputGrid - Starting grid
 * @param {Array} candidateSet - Transform candidates
 * @param {number[][]} expectedOutput - Target output to match
 * @param {number} maxCycles - Maximum iterations
 * @returns {{grid: number[][], matched: boolean, cycles: number}}
 */
function convergeToTarget(inputGrid, candidateSet, expectedOutput, maxCycles = 12) {
  if (!inputGrid || !candidateSet || candidateSet.length === 0) {
    return { grid: inputGrid, matched: false, cycles: 0 };
  }

  let grid = deepClone(inputGrid);

  // Check if already matches
  if (gridsEqual(grid, expectedOutput)) {
    return { grid, matched: true, cycles: 0 };
  }

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    let bestMatch = null;
    let bestMatchScore = -1;

    for (const cand of candidateSet) {
      try {
        const state = { grid, clone: () => deepClone(grid) };
        const transformed = cand.apply(state);
        if (!transformed) continue;

        const resultGrid = Array.isArray(transformed) ? transformed : (transformed.grid || transformed);
        if (!resultGrid || !Array.isArray(resultGrid)) continue;

        // Check for exact match
        if (gridsEqual(resultGrid, expectedOutput)) {
          logger.log('CONVERGE_MATCH', { cycle, candidate: cand.name });
          return { grid: resultGrid, matched: true, cycles: cycle + 1 };
        }

        // Score against target
        const targetScore = scoreMapping(resultGrid, expectedOutput);
        if (targetScore > bestMatchScore) {
          bestMatchScore = targetScore;
          bestMatch = resultGrid;
        }
      } catch (e) {
        continue;
      }
    }

    if (!bestMatch || bestMatchScore < 0.001) break;
    grid = bestMatch;
  }

  return { grid, matched: false, cycles: maxCycles };
}

module.exports = {
  converge,
  convergeToTarget,
  deepClone,
  gridsEqual
};
