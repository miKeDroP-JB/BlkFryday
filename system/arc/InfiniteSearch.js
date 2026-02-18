/**
 * InfiniteSearch.js
 * V3.6 – Controlled Infinite Search Engine
 * ═══════════════════════════════════════════════════════════════════
 * Beam + depth-first hybrid with timeout, step-limit, memory checkpoints
 * Never halts until match found or limits reached
 */

const { CompositeChains } = require('./CompositeChains');
const { converge } = require('./ConvergenceEngine');
const Memory = require('./memory_bank');
const { applyPipelineToGrid } = require('./utils_pipeline');
const { gridFingerprint } = require('./fingerprint');
const { gridsEqual } = require('./ReasoningEngine');
const { primitives } = require('./Primitives');
const fs = require('fs');
const path = require('path');

class InfiniteSearch {
  constructor(opts = {}) {
    this.maxDepth = opts.maxDepth || 8;
    this.beamWidth = opts.beamWidth || 20;
    this.maxSteps = opts.maxSteps || 1e6;
    this.stepDelay = opts.stepDelay || 0; // ms between batches
    this.timeLimitMs = opts.timeLimitMs || 1000 * 60 * 30; // default 30m
    this.checkpointDir = path.join(__dirname, 'checkpoints', 'infinite');
    this.verbose = opts.verbose || false;

    try {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    } catch (e) {
      // Ignore
    }

    this.composite = new CompositeChains(this.maxDepth);
    this.opNames = Object.keys(primitives);
  }

  /**
   * Generator that yields results as search progresses
   * @param {Array} trainPairs - Training pairs
   * @param {Object} options - Search options
   * @yields {{type: string, payload: any}}
   */
  async *search(trainPairs, options = {}) {
    const start = Date.now();
    let steps = 0;

    if (this.verbose) {
      console.log(`[InfiniteSearch] Starting search with ${this.opNames.length} operations, maxDepth=${this.maxDepth}`);
    }

    // Phase 1: Seed from memory heuristics (fast wins)
    try {
      const sig = gridFingerprint(trainPairs[0].input);
      const seeds = Memory.getHeuristics({ max: this.beamWidth, fingerprint: sig });

      for (const s of seeds) {
        steps++;
        const pipeline = s.pipeline;
        if (!pipeline || pipeline.length === 0) continue;

        const applied = applyPipelineToGrid(pipeline, trainPairs[0].input, { primitives });
        if (!applied) continue;

        // Verify across all training pairs
        if (this._passesAll(pipeline, trainPairs)) {
          yield { type: 'win', pipeline, from: 'memory', steps };
          return;
        }

        yield { type: 'candidate', pipeline, score: s.effective_score, from: 'memory' };
      }
    } catch (e) {
      // Ignore memory errors
    }

    // Phase 2: Beam search over composite chains (BFS-first)
    let beam = [{ grid: trainPairs[0].input, pipeline: [] }];

    for (let depth = 1; depth <= this.maxDepth; depth++) {
      const nextBeam = [];

      for (const node of beam) {
        for (const op of this.opNames) {
          steps++;
          const newPipe = node.pipeline.concat(op);

          let g;
          try {
            g = applyPipelineToGrid(newPipe, trainPairs[0].input, { primitives });
          } catch (err) {
            continue;
          }
          if (!g) continue;

          // Yield candidate
          yield { type: 'candidate', pipeline: newPipe, depth, steps };

          // Check if this solves all training pairs
          if (this._passesAll(newPipe, trainPairs)) {
            // Run convergence to stabilize
            try {
              const candidates = [{
                name: newPipe.join('_'),
                apply: (state) => applyPipelineToGrid(newPipe, state.grid, { primitives })
              }];
              const stabilized = converge(trainPairs[0].input, candidates, 6);

              if (this._passesAllGrid(stabilized, trainPairs[0].output)) {
                yield { type: 'win', pipeline: newPipe, from: 'beam', steps, depth };
                return;
              }
            } catch (e) {
              // Fall through
            }

            // Direct win without convergence
            yield { type: 'win', pipeline: newPipe, from: 'beam', steps, depth };
            return;
          }

          nextBeam.push({ grid: g, pipeline: newPipe });

          // Prune to beam width
          if (nextBeam.length > this.beamWidth * 2) {
            nextBeam.length = this.beamWidth;
          }

          // Checkpoint every 1000 steps
          if (steps % 1000 === 0) {
            this._checkpoint(`beam_d${depth}_s${steps}`, { depth, steps, time: Date.now() - start });

            // Check timeout
            if (Date.now() - start > this.timeLimitMs) {
              yield { type: 'timeout', steps, timeElapsedMs: Date.now() - start };
              return;
            }

            yield { type: 'progress', steps, depth, timeElapsedMs: Date.now() - start };
          }

          // Check step limit
          if (steps >= this.maxSteps) {
            yield { type: 'limit', steps };
            return;
          }
        }
      }

      beam = nextBeam.slice(0, this.beamWidth);

      if (this.stepDelay) {
        await new Promise(r => setTimeout(r, this.stepDelay));
      }
    }

    // Phase 3: DFS expansion for deeper chains
    if (this.verbose) {
      console.log(`[InfiniteSearch] Beam search complete, switching to DFS`);
    }

    const stack = [...beam];

    while (stack.length > 0) {
      const node = stack.pop();

      for (const op of this.opNames) {
        steps++;
        const newPipe = node.pipeline.concat(op);

        let g;
        try {
          g = applyPipelineToGrid(newPipe, trainPairs[0].input, { primitives });
        } catch (err) {
          continue;
        }
        if (!g) continue;

        if (this._passesAll(newPipe, trainPairs)) {
          yield { type: 'win', pipeline: newPipe, from: 'dfs', steps };
          return;
        }

        // Only expand if under extended depth limit
        if (newPipe.length < this.maxDepth * 2) {
          stack.push({ grid: g, pipeline: newPipe });
        }

        // Checkpoint
        if (steps % 1000 === 0) {
          this._checkpoint(`dfs_s${steps}`, { steps, time: Date.now() - start });

          if (Date.now() - start > this.timeLimitMs) {
            yield { type: 'timeout', steps, timeElapsedMs: Date.now() - start };
            return;
          }
        }

        if (steps >= this.maxSteps) {
          yield { type: 'limit', steps };
          return;
        }
      }
    }

    // No solution found
    yield { type: 'none', steps, timeElapsedMs: Date.now() - start };
  }

  /**
   * Check if pipeline produces correct output for all training pairs
   * @private
   */
  _passesAll(pipeline, trainPairs) {
    for (const { input, output } of trainPairs) {
      const applied = applyPipelineToGrid(pipeline, input, { primitives });
      if (!applied) return false;
      if (!gridsEqual(applied, output)) return false;
    }
    return true;
  }

  /**
   * Check if a grid matches expected output
   * @private
   */
  _passesAllGrid(grid, expectedOutput) {
    return gridsEqual(grid, expectedOutput);
  }

  /**
   * Write checkpoint file
   * @private
   */
  _checkpoint(name, data) {
    try {
      fs.writeFileSync(
        path.join(this.checkpointDir, `${name}.json`),
        JSON.stringify(data, null, 2)
      );
    } catch (e) {
      // Ignore checkpoint errors
    }
  }
}

module.exports = InfiniteSearch;
