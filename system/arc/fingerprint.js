/**
 * fingerprint.js
 * Grid fingerprinting for memory lookup
 */

const { generateFingerprint } = require('./TaskFingerprint');

/**
 * Generate a fingerprint hash for a grid
 * @param {number[][]} grid - Input grid
 * @returns {string} - Fingerprint hash
 */
function gridFingerprint(grid) {
  if (!grid || !grid.length) return 'empty';

  // Simple fingerprint based on dimensions, color count, and structure
  const h = grid.length;
  const w = grid[0]?.length || 0;

  const colors = new Set();
  let nonZero = 0;

  for (const row of grid) {
    for (const cell of row) {
      colors.add(cell);
      if (cell !== 0) nonZero++;
    }
  }

  const density = (nonZero / (h * w)).toFixed(2);
  const colorCount = colors.size;

  // Create hash
  const hashStr = `${h}x${w}_c${colorCount}_d${density}`;
  let hash = 0;
  for (let i = 0; i < hashStr.length; i++) {
    hash = ((hash << 5) - hash) + hashStr.charCodeAt(i);
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16).padStart(8, '0');
}

module.exports = { gridFingerprint, generateFingerprint };
