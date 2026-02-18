/**
 * memory_bank.js
 * Memory bank interface for V3.6+ engines
 */

const fs = require('fs');
const path = require('path');

const MEMORY_PATH = path.join(__dirname, '../solver/memory_v3');
const DISTILLED_PATH = path.join(MEMORY_PATH, 'distilled.json');
const HEURISTICS_PATH = path.join(MEMORY_PATH, 'heuristics.json');

/**
 * Get heuristics from memory bank
 * @param {Object} opts - Options { max, fingerprint }
 * @returns {Array} - Array of heuristic entries
 */
function getHeuristics(opts = {}) {
  const max = opts.max || 50;
  const fingerprint = opts.fingerprint || null;

  // Try distilled memory first
  let entries = [];

  try {
    if (fs.existsSync(DISTILLED_PATH)) {
      const distilled = JSON.parse(fs.readFileSync(DISTILLED_PATH, 'utf8'));
      entries = distilled.map(d => ({
        pipeline: d.essence?.chain || [],
        effective_score: d.score || 0.5,
        fingerprint: d.fingerprint?.hash,
        source: 'distilled'
      })).filter(e => e.pipeline.length > 0);
    }
  } catch (e) {
    // Ignore
  }

  // Try heuristics file
  try {
    if (fs.existsSync(HEURISTICS_PATH)) {
      const heuristics = JSON.parse(fs.readFileSync(HEURISTICS_PATH, 'utf8'));
      entries = entries.concat(heuristics.map(h => ({
        pipeline: h.pipeline || h.chain?.split('->') || [],
        effective_score: h.score || h.effective_score || 0.5,
        fingerprint: h.fingerprint,
        source: 'heuristics'
      })));
    }
  } catch (e) {
    // Ignore
  }

  // Filter by fingerprint similarity if provided
  if (fingerprint) {
    entries = entries.filter(e => {
      if (!e.fingerprint) return true;
      // Simple prefix match
      return e.fingerprint.substring(0, 4) === fingerprint.substring(0, 4);
    });
  }

  // Sort by score and limit
  entries.sort((a, b) => b.effective_score - a.effective_score);
  return entries.slice(0, max);
}

/**
 * Store a heuristic
 * @param {Object} entry - Heuristic entry
 */
function storeHeuristic(entry) {
  let heuristics = [];

  try {
    if (fs.existsSync(HEURISTICS_PATH)) {
      heuristics = JSON.parse(fs.readFileSync(HEURISTICS_PATH, 'utf8'));
    }
  } catch (e) {
    heuristics = [];
  }

  heuristics.push({
    pipeline: entry.pipeline,
    score: entry.score || 1.0,
    fingerprint: entry.fingerprint,
    timestamp: Date.now()
  });

  // Keep max 1000 entries
  if (heuristics.length > 1000) {
    heuristics = heuristics.slice(-1000);
  }

  fs.writeFileSync(HEURISTICS_PATH, JSON.stringify(heuristics, null, 2));
}

module.exports = { getHeuristics, storeHeuristic };
