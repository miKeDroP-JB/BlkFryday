/**
 * AmoebaOrchestrator.js
 * V4.1 – Amoeba Mode: Self-replicating, dynamic convergence
 * ═══════════════════════════════════════════════════════════════════
 * Spawns multiple parallel branches per phase, collects feedback,
 * and dynamically evolves configuration based on performance.
 */

const InfiniteSearch = require('./InfiniteSearch');
const { CompositeChains } = require('./CompositeChains');
const { converge } = require('./ConvergenceEngine');
const Memory = require('./memory_bank');
const { applyPipelineToGrid } = require('./utils_pipeline');
const { primitives } = require('./Primitives');
const { gridsEqual } = require('./ReasoningEngine');
const { gridFingerprint } = require('./fingerprint');

// Live dashboard broadcasting (optional - gracefully handles missing server)
let broadcastMetrics, broadcastProgress, broadcastBranchEvent;
try {
  const ws = require('./amoeba_ws_server');
  broadcastMetrics = ws.broadcastMetrics;
  broadcastProgress = ws.broadcastProgress;
  broadcastBranchEvent = ws.broadcastBranchEvent;
} catch (e) {
  // WS server not running - use no-ops
  broadcastMetrics = () => {};
  broadcastProgress = () => {};
  broadcastBranchEvent = () => {};
}

class AmoebaOrchestrator {
  constructor(config = {}) {
    this.phases = ['MemoryFastPath', 'CompositeChains', 'Convergence', 'InfiniteSearch'];
    this.config = config;
    this.maxBranches = config.maxBranches || 4;
    this.branchFactor = config.branchFactor || 2;
    this.verbose = config.verbose || false;

    // Track all spawned instances
    this.instances = [];
    this.feedback = [];
    this.stats = {
      totalBranches: 0,
      successfulBranches: 0,
      phaseHits: {}
    };

    // Evolution parameters
    this.generation = 0;
    this.evolutionRate = config.evolutionRate || 0.1;

    // Per-phase parameter history for adaptive tuning
    this.phaseHistory = {};
    for (const phase of this.phases) {
      this.phaseHistory[phase] = { runs: 0, successes: 0, avgScore: 0.5 };
    }
  }

  /**
   * Adapt a parameter based on phase-specific feedback history
   * @param {string} param - Parameter name (e.g., 'branchFactor')
   * @param {number} baseValue - Default base value
   * @param {string} phase - Current phase name
   * @returns {number} - Adapted parameter value
   */
  adaptParameter(param, baseValue, phase) {
    const history = this.phaseHistory[phase] || { runs: 0, successes: 0, avgScore: 0.5 };

    // No history yet - use base
    if (history.runs < 2) {
      return baseValue;
    }

    const successRate = history.runs > 0 ? history.successes / history.runs : 0;

    switch (param) {
      case 'branchFactor': {
        // Low success rate → more branches
        // High success rate → fewer branches (efficiency)
        if (successRate < 0.2) {
          return Math.min(this.maxBranches, baseValue + 2);
        } else if (successRate > 0.7) {
          return Math.max(1, baseValue - 1);
        }
        // Medium performance - slight adjustment based on avgScore
        if (history.avgScore < 0.3) {
          return Math.min(this.maxBranches, baseValue + 1);
        }
        return baseValue;
      }

      case 'beamWidth': {
        // Scale beam width inversely with success
        if (successRate < 0.3) {
          return Math.min(50, baseValue * 1.5);
        }
        return baseValue;
      }

      case 'maxDepth': {
        // Increase depth for struggling phases
        if (history.avgScore < 0.2) {
          return Math.min(12, baseValue + 2);
        }
        return baseValue;
      }

      default:
        return baseValue;
    }
  }

  /**
   * Run the amoeba orchestrator on a task
   * @param {Object} taskObj - Task with train/test pairs
   * @returns {Promise<Array>} - Results from all branches
   */
  async run(taskObj) {
    console.log('🧬 Amoeba Orchestrator started...');
    this.generation++;

    const trainPairs = taskObj.train || taskObj.training || [];
    if (!trainPairs.length) {
      return [{ status: 'fail', error: 'No training pairs' }];
    }

    // Normalize pairs
    const normalizedPairs = trainPairs.map(p => ({
      input: Array.isArray(p.input) ? p.input : p.input?.data,
      output: Array.isArray(p.output) ? p.output : p.output?.data
    }));

    let currentInputs = [{ pairs: normalizedPairs, path: [], score: 0 }];

    for (const phase of this.phases) {
      if (this.verbose) console.log(`🔹 Phase: ${phase}`);

      // Broadcast phase start
      broadcastProgress({
        generation: this.generation,
        phase,
        status: 'started',
        totalPhases: this.phases.length,
        currentPhase: this.phases.indexOf(phase) + 1
      });

      const nextInputs = [];

      // Adapt branchFactor for this phase based on history
      const adaptedBranchFactor = this.adaptParameter('branchFactor', this.branchFactor, phase);

      for (const inp of currentInputs) {
        // Spawn branches using adapted factor
        const branches = Math.min(this.maxBranches, adaptedBranchFactor);

        for (let i = 0; i < branches; i++) {
          this.stats.totalBranches++;

          // Broadcast branch spawn
          broadcastBranchEvent({
            event: 'spawn',
            phase,
            branchId: i,
            totalBranches: this.stats.totalBranches
          });

          try {
            const result = await this.executePhase(phase, inp, i);

            if (result) {
              // Check for win condition
              if (result.status === 'win') {
                console.log(`✨ WIN in ${phase} (branch ${i}): ${result.pipeline?.join(' -> ') || 'direct'}`);
                this.stats.successfulBranches++;
                this.stats.phaseHits[phase] = (this.stats.phaseHits[phase] || 0) + 1;

                // Broadcast win
                broadcastMetrics({
                  phase,
                  branchId: i,
                  status: 'win',
                  pipeline: result.pipeline,
                  totalBranches: this.stats.totalBranches,
                  successfulBranches: this.stats.successfulBranches
                });

                return [result];
              }

              // Broadcast branch completion with metrics
              broadcastMetrics({
                phase,
                branchId: i,
                status: 'completed',
                score: result.score || 0,
                totalBranches: this.stats.totalBranches,
                successRate: this.stats.successfulBranches / this.stats.totalBranches
              });

              nextInputs.push(result);
              this.instances.push({ phase, branch: i, result });
            }
          } catch (e) {
            if (this.verbose) console.log(`  ⚠️ Branch ${i} failed: ${e.message}`);

            // Broadcast branch failure
            broadcastBranchEvent({
              event: 'failed',
              phase,
              branchId: i,
              error: e.message
            });
          }
        }
      }

      currentInputs = nextInputs.length > 0 ? nextInputs : currentInputs;
      this.collectFeedback(currentInputs, phase);

      // Broadcast phase completion
      broadcastProgress({
        generation: this.generation,
        phase,
        status: 'completed',
        branchesCompleted: nextInputs.length,
        branchFactor: this.branchFactor
      });

      // Early exit if no progress
      if (nextInputs.length === 0 && phase !== 'InfiniteSearch') {
        if (this.verbose) console.log(`  ℹ️ No progress in ${phase}, continuing...`);
      }
    }

    console.log('✅ Amoeba Orchestrator completed.');
    return currentInputs;
  }

  /**
   * Execute a single phase
   * @param {string} phase - Phase name
   * @param {Object} input - Input state
   * @param {number} branchId - Branch identifier
   * @returns {Promise<Object>} - Phase result
   */
  async executePhase(phase, input, branchId) {
    const { pairs, path } = input;
    const firstInput = pairs[0].input;
    const firstOutput = pairs[0].output;

    switch (phase) {
      case 'MemoryFastPath': {
        const sig = gridFingerprint(firstInput);
        const candidates = Memory.getHeuristics({ max: 10, fingerprint: sig });

        // Try each candidate with some variation based on branchId
        const candIdx = branchId % Math.max(1, candidates.length);
        const cand = candidates[candIdx];

        if (cand?.pipeline?.length > 0) {
          const applied = applyPipelineToGrid(cand.pipeline, firstInput, { primitives });
          if (applied && gridsEqual(applied, firstOutput)) {
            return { status: 'win', pipeline: cand.pipeline, phase, branchId };
          }
          return { pairs, path: [...path, `mem:${candIdx}`], score: cand.effective_score || 0.5 };
        }
        return { pairs, path: [...path, 'mem:miss'], score: 0 };
      }

      case 'CompositeChains': {
        const chainEngine = new CompositeChains(4 + branchId, {
          maxCandidates: 1000 * (branchId + 1)
        });

        const chain = chainEngine.findValidChain(pairs);
        if (chain) {
          return { status: 'win', pipeline: chain.chain, phase, branchId, grid: chain.grid };
        }

        // Return partial progress
        return { pairs, path: [...path, `chain:${branchId}`], score: 0.3 };
      }

      case 'Convergence': {
        const candidates = Object.keys(primitives).slice(0, 10 + branchId * 5).map(op => ({
          name: op,
          apply: (state) => primitives[op](state.grid)
        }));

        const conv = converge(firstInput, candidates, 6 + branchId * 2);
        if (conv && gridsEqual(conv, firstOutput)) {
          return { status: 'win', pipeline: [], phase, branchId, grid: conv };
        }

        return { pairs, path: [...path, `conv:${branchId}`], score: 0.4 };
      }

      case 'InfiniteSearch': {
        const searcher = new InfiniteSearch({
          maxDepth: 4 + branchId,
          beamWidth: 10 + branchId * 5,
          maxSteps: 10000 * (branchId + 1),
          timeLimitMs: 1000 * 60 * (branchId + 1)
        });

        for await (const evt of searcher.search(pairs)) {
          if (evt.type === 'win') {
            return { status: 'win', pipeline: evt.pipeline, phase, branchId, from: evt.from };
          }
          if (evt.type === 'timeout' || evt.type === 'limit') {
            break;
          }
        }

        return { pairs, path: [...path, `inf:${branchId}`], score: 0.2 };
      }

      default:
        return { pairs, path, score: 0 };
    }
  }

  /**
   * Collect feedback and potentially evolve configuration
   * @param {Array} results - Results from current phase
   * @param {string} phase - Current phase name
   */
  collectFeedback(results, phase) {
    this.feedback.push(...results);

    // Analyze and evolve
    const avgScore = results.reduce((s, r) => s + (r.score || 0), 0) / results.length;
    const prevBranchFactor = this.branchFactor;

    // Update per-phase history for adaptive tuning
    if (phase && this.phaseHistory[phase]) {
      const hasWin = results.some(r => r.status === 'win');
      this.phaseHistory[phase].runs++;
      if (hasWin) this.phaseHistory[phase].successes++;
      // Exponential moving average for score
      this.phaseHistory[phase].avgScore =
        0.7 * this.phaseHistory[phase].avgScore + 0.3 * avgScore;
    }

    if (this.verbose) {
      console.log(`📈 Feedback: ${results.length} entries, avg score: ${avgScore.toFixed(3)}`);
    }

    // Dynamic evolution: adjust branch factor based on performance
    if (avgScore < 0.2 && this.branchFactor < this.maxBranches) {
      this.branchFactor = Math.min(this.branchFactor + 1, this.maxBranches);
      if (this.verbose) console.log(`  🧬 Evolved: branchFactor → ${this.branchFactor}`);
    } else if (avgScore > 0.7 && this.branchFactor > 1) {
      this.branchFactor = Math.max(this.branchFactor - 1, 1);
      if (this.verbose) console.log(`  🧬 Evolved: branchFactor → ${this.branchFactor}`);
    }

    // Broadcast evolution event if config changed
    if (this.branchFactor !== prevBranchFactor) {
      broadcastBranchEvent({
        event: 'evolved',
        generation: this.generation,
        prevBranchFactor,
        newBranchFactor: this.branchFactor,
        avgScore,
        feedbackCount: results.length
      });
    }

    // Broadcast feedback metrics
    broadcastMetrics({
      type: 'feedback',
      generation: this.generation,
      feedbackCount: results.length,
      avgScore,
      branchFactor: this.branchFactor,
      totalFeedback: this.feedback.length
    });
  }

  /**
   * Get orchestrator statistics
   * @returns {Object} - Stats
   */
  getStats() {
    return {
      ...this.stats,
      generation: this.generation,
      currentBranchFactor: this.branchFactor,
      feedbackEntries: this.feedback.length,
      instances: this.instances.length
    };
  }

  /**
   * Reset orchestrator state
   */
  reset() {
    this.instances = [];
    this.feedback = [];
    this.stats = { totalBranches: 0, successfulBranches: 0, phaseHits: {} };
  }
}

module.exports = { AmoebaOrchestrator };
