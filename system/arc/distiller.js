/**
 * distiller.js
 * Strategy distillation for V3.6+ engines
 */

const fs = require('fs');
const path = require('path');
const { MemoryDistillation } = require('./MemoryDistillation');

const distillation = new MemoryDistillation();

/**
 * Canonicalize a pipeline (normalize operation names)
 * @param {string[]} pipeline - Raw pipeline
 * @returns {string[]} - Canonicalized pipeline
 */
function canonicalizePipeline(pipeline) {
  if (!pipeline || !Array.isArray(pipeline)) return [];

  // Remove redundant operations
  const canonical = [];
  for (let i = 0; i < pipeline.length; i++) {
    const op = pipeline[i];

    // Skip identity operations
    if (op === 'identity') continue;

    // Collapse redundant rotations
    if (canonical.length > 0) {
      const last = canonical[canonical.length - 1];

      // rotate90 + rotate90 = rotate180
      if (last === 'rotate90' && op === 'rotate90') {
        canonical[canonical.length - 1] = 'rotate180';
        continue;
      }

      // rotate180 + rotate180 = identity (remove both)
      if (last === 'rotate180' && op === 'rotate180') {
        canonical.pop();
        continue;
      }

      // flipHorizontal + flipHorizontal = identity
      if (last === 'flipHorizontal' && op === 'flipHorizontal') {
        canonical.pop();
        continue;
      }

      // flipVertical + flipVertical = identity
      if (last === 'flipVertical' && op === 'flipVertical') {
        canonical.pop();
        continue;
      }
    }

    canonical.push(op);
  }

  return canonical;
}

/**
 * Distill a chain into memory
 * @param {Object} params - Distillation parameters
 */
function distillChain(params) {
  const { pipeline, originTaskId, inputGrid, outputGrid, score, meta } = params;

  const canonical = canonicalizePipeline(pipeline);

  // Store in distillation memory
  distillation.distill({
    taskId: originTaskId || 'unknown',
    trainPairs: [{ input: inputGrid, output: outputGrid }],
    strategy: {
      name: `chain:${canonical.join('_')}`,
      hierarchy: 'composite',
      chainSteps: canonical
    },
    source: meta?.method || 'distiller',
    solveTime: meta?.solveTime || 0
  });

  return canonical;
}

/**
 * Get distilled strategies
 * @param {Object} opts - Query options
 * @returns {Array} - Matching strategies
 */
function getDistilled(opts = {}) {
  return distillation.export();
}

module.exports = {
  canonicalizePipeline,
  distillChain,
  getDistilled,
  distillation
};
