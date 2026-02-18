/**
 * utils_pipeline.js
 * Pipeline application utility for V3.6+ engines
 */

/**
 * Apply a pipeline of operations to a grid
 * @param {string[]} pipeline - Array of operation names
 * @param {number[][]} grid - Input grid
 * @param {Object} Primitives - Primitives module
 * @returns {number[][]|null} - Resulting grid or null on failure
 */
function applyPipelineToGrid(pipeline, grid, Primitives) {
  let g = grid;
  for (const step of pipeline) {
    const fn = (Primitives && Primitives[step]) ||
               (Primitives.primitives && Primitives.primitives[step]);
    if (typeof fn !== 'function') return null;
    g = fn(g);
    if (!g) return null;
  }
  return g;
}

module.exports = { applyPipelineToGrid };
