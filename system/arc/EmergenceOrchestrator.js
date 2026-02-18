/**
 * EmergenceOrchestrator.js
 * V4.0 – Emergence Orchestrator
 * ═══════════════════════════════════════════════════════════════════
 * Composes all existing engines: memory, composite chains, convergence,
 * infinite search into a unified solving pipeline.
 */

const { CompositeChains } = require('./CompositeChains');
const InfiniteSearch = require('./InfiniteSearch');
const Memory = require('./memory_bank');
const Distiller = require('./distiller');
const { converge } = require('./ConvergenceEngine');
const { primitives } = require('./Primitives');
const { gridsEqual } = require('./ReasoningEngine');
const { applyPipelineToGrid } = require('./utils_pipeline');
const { gridFingerprint } = require('./fingerprint');

class EmergenceOrchestrator {
  constructor(opts = {}) {
    this.maxDepth = opts.maxDepth || 4;
    this.verbose = opts.verbose || false;

    this.chainEngine = new CompositeChains(this.maxDepth, {
      maxCandidates: opts.maxCandidates || 5000,
      verbose: this.verbose
    });

    this.infiniteOpts = Object.assign({
      maxDepth: opts.maxDepth || 8,
      beamWidth: opts.beamWidth || 20,
      maxSteps: opts.maxSteps || 100000,
      timeLimitMs: opts.timeLimitMs || 1000 * 60 * 10, // 10 min default
      verbose: this.verbose
    }, opts.infinite || {});

    this.memory = Memory;
    this.distiller = Distiller;
  }

  /**
   * Solve a task using all available engines
   * @param {string} taskId - Task identifier
   * @param {Object} taskObj - Task object with train/test pairs
   * @param {Object} opts - Additional options
   * @returns {Promise<Object>} - Solution result
   */
  async solveTask(taskId, taskObj, opts = {}) {
    const start = Date.now();

    // Extract training pairs (handle various formats)
    const trainPairs = taskObj.train || taskObj.training || taskObj.trainingPairs || taskObj.pairs || [];
    const testPairs = taskObj.test || taskObj.testPairs || [];

    if (!trainPairs.length) {
      return { status: 'fail', error: 'No training pairs' };
    }

    // Normalize pairs
    const normalizedPairs = trainPairs.map(p => ({
      input: Array.isArray(p.input) ? p.input : (p.input?.data || p.input),
      output: Array.isArray(p.output) ? p.output : (p.output?.data || p.output)
    }));

    if (this.verbose) {
      console.log(`[Orchestrator] Solving ${taskId} with ${normalizedPairs.length} training pairs`);
    }

    // === Phase 1: Memory Fast Path ===
    try {
      const sig = gridFingerprint(normalizedPairs[0].input);
      const memCandidates = this.memory.getHeuristics({ max: 50, fingerprint: sig });

      for (const m of memCandidates) {
        if (!m.pipeline || m.pipeline.length === 0) continue;

        const applied = applyPipelineToGrid(m.pipeline, normalizedPairs[0].input, { primitives });
        if (!applied) continue;

        if (this._verifyPipeline(m.pipeline, normalizedPairs)) {
          if (this.verbose) console.log(`[Orchestrator] Memory hit: ${m.pipeline.join(' -> ')}`);
          return {
            status: 'ok',
            method: 'memory',
            pipeline: m.pipeline,
            out: applied,
            durationMs: Date.now() - start
          };
        }
      }
    } catch (e) {
      // Continue to next phase
    }

    // === Phase 2: Composite Chains (V3.4) ===
    try {
      const chain = this.chainEngine.findValidChain(normalizedPairs);

      if (chain) {
        const canonical = this.distiller.canonicalizePipeline(chain.chain);

        // Distill for future use
        this.distiller.distillChain({
          pipeline: canonical,
          originTaskId: taskId,
          inputGrid: normalizedPairs[0].input,
          outputGrid: normalizedPairs[0].output,
          score: 1.0,
          meta: { method: 'chain' }
        });

        if (this.verbose) console.log(`[Orchestrator] Chain found: ${canonical.join(' -> ')}`);

        return {
          status: 'ok',
          method: 'chain',
          pipeline: canonical,
          out: chain.grid,
          durationMs: Date.now() - start
        };
      }
    } catch (e) {
      if (this.verbose) console.log(`[Orchestrator] Chain search failed: ${e.message}`);
    }

    // === Phase 3: Convergence Attempt ===
    try {
      // Generate candidates for convergence
      const candidates = [];
      for (const opName of Object.keys(primitives)) {
        candidates.push({
          name: opName,
          apply: (state) => {
            const fn = primitives[opName];
            return fn ? fn(state.grid) : null;
          }
        });
      }

      const conv = converge(normalizedPairs[0].input, candidates, 8);

      if (conv && gridsEqual(conv, normalizedPairs[0].output)) {
        if (this.verbose) console.log(`[Orchestrator] Convergence matched`);
        return {
          status: 'ok',
          method: 'converge',
          pipeline: [],
          out: conv,
          durationMs: Date.now() - start
        };
      }
    } catch (e) {
      // Continue to next phase
    }

    // === Phase 4: Infinite Search (V3.6) ===
    try {
      const searcher = new InfiniteSearch(this.infiniteOpts);

      for await (const evt of searcher.search(normalizedPairs, opts)) {
        if (evt.type === 'win') {
          const pipeline = evt.pipeline;

          // Distill successful pipeline
          this.distiller.distillChain({
            pipeline,
            originTaskId: taskId,
            inputGrid: normalizedPairs[0].input,
            outputGrid: normalizedPairs[0].output,
            score: 1.0,
            meta: { source: evt.from }
          });

          if (this.verbose) console.log(`[Orchestrator] Infinite search win: ${pipeline.join(' -> ')} (${evt.from})`);

          return {
            status: 'ok',
            method: 'infinite',
            pipeline,
            out: applyPipelineToGrid(pipeline, normalizedPairs[0].input, { primitives }),
            durationMs: Date.now() - start,
            steps: evt.steps
          };
        } else if (evt.type === 'timeout') {
          return {
            status: 'timeout',
            detail: evt,
            durationMs: Date.now() - start
          };
        } else if (evt.type === 'limit') {
          return {
            status: 'limit',
            detail: evt,
            durationMs: Date.now() - start
          };
        } else if (evt.type === 'progress' && this.verbose) {
          console.log(`[Orchestrator] Progress: ${evt.steps} steps, depth ${evt.depth}`);
        }
      }
    } catch (e) {
      if (this.verbose) console.log(`[Orchestrator] Infinite search error: ${e.message}`);
    }

    return {
      status: 'fail',
      durationMs: Date.now() - start
    };
  }

  /**
   * Verify a pipeline works for all training pairs
   * @private
   */
  _verifyPipeline(pipeline, trainPairs) {
    for (const { input, output } of trainPairs) {
      const applied = applyPipelineToGrid(pipeline, input, { primitives });
      if (!applied) return false;
      if (!gridsEqual(applied, output)) return false;
    }
    return true;
  }
}

module.exports = EmergenceOrchestrator;
