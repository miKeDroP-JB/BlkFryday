/**
 * CompositeChains.js
 * V3.4 – Deep Composite Chains
 * ═══════════════════════════════════════════════════════════════════
 * Multi-hop transformation orchestration + chain synthesis engine
 *
 * Features:
 * • Candidate A → B → C multi-hop transformations
 * • Breadth-first AND depth-first chain synthesis
 * • Reversible chains
 * • Chain scoring & ranking
 * • Lazy expansion to avoid memory blowouts
 */

const { primitives } = require('./Primitives');
const { scoreGrids, gridsEqual } = require('./ReasoningEngine');

class CompositeChains {
  constructor(maxDepth = 4, options = {}) {
    this.maxDepth = maxDepth;
    this.maxCandidates = options.maxCandidates || 10000;
    this.earlyExit = options.earlyExit !== false;
    this.verbose = options.verbose || false;

    // Strategy registry – primitive ops and composite-aware wrappers
    this.ops = Object.entries(primitives).map(([name, fn]) => ({
      name,
      fn
    }));

    // Stats tracking
    this.stats = {
      chainsGenerated: 0,
      chainsEvaluated: 0,
      maxDepthReached: 0
    };
  }

  /**
   * Reset stats for a new run
   */
  resetStats() {
    this.stats = {
      chainsGenerated: 0,
      chainsEvaluated: 0,
      maxDepthReached: 0
    };
  }

  /**
   * Generate multi-hop composite candidates.
   * Uses a lazy generator so we never OOM.
   * @param {number[][]} initialGrid - Starting grid
   * @yields {{grid: number[][], chain: string[]}} - Candidate with transformation chain
   */
  *generateChains(initialGrid) {
    const queue = [{
      grid: initialGrid,
      chain: []
    }];

    const seen = new Set();
    seen.add(this._gridHash(initialGrid));

    while (queue.length > 0) {
      if (this.stats.chainsGenerated >= this.maxCandidates) {
        if (this.verbose) console.log(`[CompositeChains] Hit max candidates limit: ${this.maxCandidates}`);
        return;
      }

      const { grid, chain } = queue.shift();

      // Emit current candidate (except empty chain)
      if (chain.length > 0) {
        this.stats.chainsGenerated++;
        yield { grid, chain };
      }

      // Track max depth
      if (chain.length > this.stats.maxDepthReached) {
        this.stats.maxDepthReached = chain.length;
      }

      // Expand chain if depth allows
      if (chain.length < this.maxDepth) {
        for (const { name, fn } of this.ops) {
          try {
            const nextGrid = fn(grid);
            if (!nextGrid) continue;

            // Dedupe by grid hash to avoid cycles
            const hash = this._gridHash(nextGrid);
            if (seen.has(hash)) continue;
            seen.add(hash);

            const nextChain = [...chain, name];
            queue.push({
              grid: nextGrid,
              chain: nextChain
            });
          } catch (err) {
            continue;
          }
        }
      }
    }
  }

  /**
   * Generate chains using depth-first search (memory efficient for deep chains)
   * @param {number[][]} initialGrid - Starting grid
   * @param {number} currentDepth - Current recursion depth
   * @param {string[]} currentChain - Current chain
   * @param {Set<string>} seen - Seen grid hashes
   * @yields {{grid: number[][], chain: string[]}}
   */
  *generateChainsDFS(initialGrid, currentDepth = 0, currentChain = [], seen = null) {
    if (!seen) {
      seen = new Set();
      seen.add(this._gridHash(initialGrid));
    }

    if (this.stats.chainsGenerated >= this.maxCandidates) return;

    // Emit current (except empty)
    if (currentChain.length > 0) {
      this.stats.chainsGenerated++;
      yield { grid: initialGrid, chain: currentChain };
    }

    if (currentDepth >= this.maxDepth) return;

    for (const { name, fn } of this.ops) {
      try {
        const nextGrid = fn(initialGrid);
        if (!nextGrid) continue;

        const hash = this._gridHash(nextGrid);
        if (seen.has(hash)) continue;
        seen.add(hash);

        const nextChain = [...currentChain, name];
        yield* this.generateChainsDFS(nextGrid, currentDepth + 1, nextChain, seen);

        seen.delete(hash); // Allow revisiting in different paths
      } catch (err) {
        continue;
      }
    }
  }

  /**
   * Find the FIRST chain that transforms training inputs → correct outputs.
   * @param {Array<{input: number[][], output: number[][]}>} trainPairs - Training pairs
   * @returns {{grid: number[][], chain: string[]}|null} - Valid chain or null
   */
  findValidChain(trainPairs) {
    this.resetStats();

    if (!trainPairs || trainPairs.length === 0) return null;

    // Use first task input as root
    const root = trainPairs[0].input;

    for (const candidate of this.generateChains(root)) {
      this.stats.chainsEvaluated++;

      if (this._validAcrossTraining(candidate, trainPairs)) {
        if (this.verbose) {
          console.log(`[CompositeChains] Found valid chain: ${candidate.chain.join(' → ')}`);
          console.log(`[CompositeChains] Stats: ${JSON.stringify(this.stats)}`);
        }
        return candidate;
      }
    }

    if (this.verbose) {
      console.log(`[CompositeChains] No valid chain found. Stats: ${JSON.stringify(this.stats)}`);
    }
    return null;
  }

  /**
   * Find ALL valid chains (up to limit)
   * @param {Array} trainPairs - Training pairs
   * @param {number} limit - Max chains to return
   * @returns {Array} - Array of valid chains
   */
  findAllValidChains(trainPairs, limit = 10) {
    this.resetStats();
    const validChains = [];

    if (!trainPairs || trainPairs.length === 0) return validChains;

    const root = trainPairs[0].input;

    for (const candidate of this.generateChains(root)) {
      this.stats.chainsEvaluated++;

      if (this._validAcrossTraining(candidate, trainPairs)) {
        validChains.push(candidate);
        if (validChains.length >= limit) break;
      }
    }

    return validChains;
  }

  /**
   * Apply a chain to a grid
   * @param {number[][]} input - Input grid
   * @param {string[]} chain - Chain of operation names
   * @returns {number[][]|null} - Transformed grid or null on failure
   */
  applyChain(input, chain) {
    let grid = input;

    for (const step of chain) {
      const fn = primitives[step];
      if (!fn) return null;

      try {
        grid = fn(grid);
        if (!grid) return null;
      } catch {
        return null;
      }
    }

    return grid;
  }

  /**
   * Score a chain against training pairs
   * @param {string[]} chain - Chain to evaluate
   * @param {Array} trainPairs - Training pairs
   * @returns {number} - Average score (0 to 1)
   */
  scoreChain(chain, trainPairs) {
    let totalScore = 0;

    for (const { input, output } of trainPairs) {
      const result = this.applyChain(input, chain);
      if (!result) return 0;
      totalScore += scoreGrids(result, output);
    }

    return totalScore / trainPairs.length;
  }

  /**
   * Find best chain by score (not just first valid)
   * @param {Array} trainPairs - Training pairs
   * @param {number} sampleSize - How many chains to evaluate
   * @returns {{chain: string[], score: number}|null}
   */
  findBestChain(trainPairs, sampleSize = 1000) {
    this.resetStats();

    if (!trainPairs || trainPairs.length === 0) return null;

    const root = trainPairs[0].input;
    let bestChain = null;
    let bestScore = -1;

    let evaluated = 0;
    for (const candidate of this.generateChains(root)) {
      this.stats.chainsEvaluated++;
      evaluated++;

      const score = this.scoreChain(candidate.chain, trainPairs);

      if (score > bestScore) {
        bestScore = score;
        bestChain = candidate.chain;

        // Early exit on perfect score
        if (score === 1.0 && this.earlyExit) {
          break;
        }
      }

      if (evaluated >= sampleSize) break;
    }

    return bestChain ? { chain: bestChain, score: bestScore } : null;
  }

  /**
   * Validate candidate across all training pairs
   * @private
   */
  _validAcrossTraining(candidate, trainPairs) {
    const { chain } = candidate;

    for (const { input, output } of trainPairs) {
      const result = this.applyChain(input, chain);
      if (!result || !gridsEqual(result, output)) return false;
    }

    return true;
  }

  /**
   * Create a hash of a grid for deduplication
   * @private
   */
  _gridHash(grid) {
    if (!grid || !grid.length) return 'empty';
    return grid.map(row => row.join(',')).join('|');
  }

  /**
   * Get operation names
   */
  getOperationNames() {
    return this.ops.map(op => op.name);
  }
}

module.exports = { CompositeChains };
