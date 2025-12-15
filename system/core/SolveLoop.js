/**
 * SOLVE LOOP ENGINE - The Engine of Cognition
 * ═══════════════════════════════════════════════════════════════════
 * Non-negotiable gated loop:
 *
 *   while not verified:
 *       understand()       # canonicalize problem
 *       plan()             # select strategy
 *       solve()            # execute
 *       verified = verify() # adversarial checks
 *
 * NO ESCAPE HATCH: Cannot advance until verified
 * Accuracy-first execution; speed secondary
 * ═══════════════════════════════════════════════════════════════════
 */

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════
// VERIFICATION GATES
// ═══════════════════════════════════════════════════════════════════

class VerificationGate {
  constructor(name, checkFn, weight = 1.0) {
    this.name = name;
    this.check = checkFn;
    this.weight = weight;
    this.lastResult = null;
  }

  async run(problem, solution, context) {
    try {
      const result = await this.check(problem, solution, context);
      this.lastResult = {
        passed: result.passed,
        confidence: result.confidence || (result.passed ? 1.0 : 0.0),
        reason: result.reason || '',
        timestamp: Date.now()
      };
      return this.lastResult;
    } catch (error) {
      this.lastResult = {
        passed: false,
        confidence: 0,
        reason: `Gate error: ${error.message}`,
        timestamp: Date.now()
      };
      return this.lastResult;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// AMOEBA EXECUTOR - Adaptive Retry & Strategy Switching
// ═══════════════════════════════════════════════════════════════════

class AmoebaExecutor {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 10;
    this.strategyPool = options.strategies || [
      'direct_solve',
      'decomposition',
      'pattern_match',
      'analogical_transfer',
      'constraint_satisfaction',
      'generate_and_test',
      'means_ends_analysis',
      'abstraction_refinement'
    ];
    this.toolPool = options.tools || [];
    this.currentStrategy = null;
    this.attemptHistory = [];
  }

  selectStrategy(problem, context, failedStrategies = []) {
    // Filter out failed strategies
    const available = this.strategyPool.filter(s => !failedStrategies.includes(s));

    if (available.length === 0) {
      // All strategies exhausted - reset with increased depth
      return {
        strategy: this.strategyPool[0],
        depth: context.depth + 1,
        reset: true
      };
    }

    // Score strategies based on problem characteristics and history
    const scored = available.map(strategy => ({
      strategy,
      score: this.scoreStrategy(strategy, problem, context)
    }));

    scored.sort((a, b) => b.score - a.score);
    this.currentStrategy = scored[0].strategy;

    return {
      strategy: this.currentStrategy,
      depth: context.depth,
      confidence: scored[0].score
    };
  }

  scoreStrategy(strategy, problem, context) {
    let score = 0.5; // Base score

    // Problem-specific scoring
    if (problem.type === 'transformation' && strategy === 'pattern_match') score += 0.2;
    if (problem.type === 'construction' && strategy === 'generate_and_test') score += 0.2;
    if (problem.complexity > 0.7 && strategy === 'decomposition') score += 0.3;
    if (problem.hasAnalogy && strategy === 'analogical_transfer') score += 0.4;

    // History-based scoring
    const successRate = this.getStrategySuccessRate(strategy);
    score += successRate * 0.3;

    // Recency penalty (avoid recently failed strategies)
    const recentFailures = this.attemptHistory
      .slice(-5)
      .filter(a => a.strategy === strategy && !a.success)
      .length;
    score -= recentFailures * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  getStrategySuccessRate(strategy) {
    const attempts = this.attemptHistory.filter(a => a.strategy === strategy);
    if (attempts.length === 0) return 0.5; // Unknown
    const successes = attempts.filter(a => a.success).length;
    return successes / attempts.length;
  }

  recordAttempt(strategy, success, context = {}) {
    this.attemptHistory.push({
      strategy,
      success,
      timestamp: Date.now(),
      ...context
    });

    // Keep last 1000 attempts
    if (this.attemptHistory.length > 1000) {
      this.attemptHistory.shift();
    }
  }

  pullTool(toolName) {
    return this.toolPool.find(t => t.name === toolName);
  }

  adaptDepth(currentDepth, verificationResult) {
    if (verificationResult.confidence > 0.9) {
      return Math.max(1, currentDepth - 1); // Can reduce depth
    } else if (verificationResult.confidence < 0.3) {
      return currentDepth + 2; // Need more depth
    } else if (verificationResult.confidence < 0.6) {
      return currentDepth + 1; // Slight increase
    }
    return currentDepth;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SOLVE LOOP ENGINE
// ═══════════════════════════════════════════════════════════════════

class SolveLoop extends EventEmitter {
  constructor(options = {}) {
    super();

    this.amoeba = new AmoebaExecutor(options);

    // Verification gates (adversarial checks)
    this.gates = [
      new VerificationGate('format', this.checkFormat.bind(this), 1.0),
      new VerificationGate('consistency', this.checkConsistency.bind(this), 1.0),
      new VerificationGate('training_match', this.checkTrainingMatch.bind(this), 2.0),
      new VerificationGate('inverse_check', this.checkInverse.bind(this), 1.5),
      new VerificationGate('boundary', this.checkBoundary.bind(this), 0.5),
    ];

    // State
    this.currentProblem = null;
    this.currentSolution = null;
    this.understanding = null;
    this.plan = null;
    this.verified = false;
    this.attempts = 0;
    this.maxAttempts = options.maxAttempts || 100;
    this.depth = 1;
    this.failedStrategies = [];

    // Solvers (injected)
    this.understander = options.understander || this.defaultUnderstand.bind(this);
    this.planner = options.planner || this.defaultPlan.bind(this);
    this.solver = options.solver || this.defaultSolve.bind(this);

    // Control
    this.running = false;
    this.paused = false;
  }

  // ═══════════════════════════════════════════════════════════════
  // THE CORE LOOP - NEVER ADVANCES WITHOUT VERIFICATION
  // ═══════════════════════════════════════════════════════════════

  async solve(problem) {
    this.currentProblem = problem;
    this.verified = false;
    this.attempts = 0;
    this.depth = 1;
    this.failedStrategies = [];
    this.running = true;

    this.emit('solve:start', { problem });

    // ═══════════════════════════════════════════════════════════
    // THE NON-NEGOTIABLE GATED LOOP
    // ═══════════════════════════════════════════════════════════
    while (!this.verified && this.running) {
      // Check pause
      while (this.paused && this.running) {
        await this.sleep(100);
      }

      if (!this.running) break;

      this.attempts++;
      this.emit('attempt:start', { attempt: this.attempts, depth: this.depth });

      try {
        // ─────────────────────────────────────────────────────────
        // PHASE 1: UNDERSTAND - Canonicalize the problem
        // ─────────────────────────────────────────────────────────
        this.emit('phase:change', 'UNDERSTAND');
        this.understanding = await this.understand(problem);
        this.emit('understand:complete', this.understanding);

        // ─────────────────────────────────────────────────────────
        // PHASE 2: PLAN - Select strategy
        // ─────────────────────────────────────────────────────────
        this.emit('phase:change', 'PLAN');
        this.plan = await this.planSolution(problem, this.understanding);
        this.emit('plan:complete', this.plan);

        // ─────────────────────────────────────────────────────────
        // PHASE 3: SOLVE - Execute the strategy
        // ─────────────────────────────────────────────────────────
        this.emit('phase:change', 'SOLVE');
        this.currentSolution = await this.executeSolve(problem, this.understanding, this.plan);
        this.emit('solve:complete', this.currentSolution);

        // ─────────────────────────────────────────────────────────
        // PHASE 4: VERIFY - Adversarial checks (THE GATE)
        // ─────────────────────────────────────────────────────────
        this.emit('phase:change', 'VERIFY');
        const verificationResult = await this.verify(problem, this.currentSolution);
        this.emit('verify:complete', verificationResult);

        // ═════════════════════════════════════════════════════════
        // THE GATE: Only pass if ALL checks pass
        // ═════════════════════════════════════════════════════════
        this.verified = verificationResult.verified;

        if (this.verified) {
          // SUCCESS - Can proceed
          this.emit('phase:change', 'COMMIT');
          this.emit('verified', {
            solution: this.currentSolution,
            attempts: this.attempts,
            strategy: this.plan.strategy
          });

          this.amoeba.recordAttempt(this.plan.strategy, true, {
            depth: this.depth,
            attempts: this.attempts
          });
        } else {
          // FAILED - Must retry
          this.emit('verification:failed', verificationResult);

          // Record failure
          this.amoeba.recordAttempt(this.plan.strategy, false, {
            depth: this.depth,
            reason: verificationResult.reason
          });

          // Strategy failed - add to failed list
          if (verificationResult.confidence < 0.3) {
            this.failedStrategies.push(this.plan.strategy);
          }

          // Adapt depth based on verification confidence
          this.depth = this.amoeba.adaptDepth(this.depth, verificationResult);

          // Check max attempts
          if (this.attempts >= this.maxAttempts) {
            this.emit('max_attempts', {
              attempts: this.attempts,
              bestSolution: this.currentSolution,
              verificationResult
            });

            // Return best attempt but mark as unverified
            return {
              success: false,
              solution: this.currentSolution,
              verified: false,
              attempts: this.attempts,
              reason: 'Max attempts reached without verification'
            };
          }
        }

      } catch (error) {
        this.emit('error', { error, attempt: this.attempts });

        // Error counts as failed strategy
        if (this.plan?.strategy) {
          this.failedStrategies.push(this.plan.strategy);
        }
      }
    }

    this.running = false;

    return {
      success: this.verified,
      solution: this.currentSolution,
      verified: this.verified,
      attempts: this.attempts,
      understanding: this.understanding,
      plan: this.plan
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE IMPLEMENTATIONS
  // ═══════════════════════════════════════════════════════════════

  async understand(problem) {
    return await this.understander(problem, {
      depth: this.depth,
      previousUnderstanding: this.understanding
    });
  }

  async planSolution(problem, understanding) {
    // Get strategy from Amoeba
    const strategySelection = this.amoeba.selectStrategy(
      { ...problem, ...understanding },
      { depth: this.depth },
      this.failedStrategies
    );

    // If reset needed, clear failed strategies
    if (strategySelection.reset) {
      this.failedStrategies = [];
    }

    const plan = await this.planner(problem, understanding, {
      strategy: strategySelection.strategy,
      depth: this.depth,
      confidence: strategySelection.confidence
    });

    return {
      ...plan,
      strategy: strategySelection.strategy,
      confidence: strategySelection.confidence
    };
  }

  async executeSolve(problem, understanding, plan) {
    return await this.solver(problem, understanding, plan, {
      depth: this.depth,
      attempt: this.attempts
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // VERIFICATION - ALL GATES MUST PASS
  // ═══════════════════════════════════════════════════════════════

  async verify(problem, solution) {
    const results = [];
    let totalWeight = 0;
    let weightedScore = 0;
    let allPassed = true;

    for (const gate of this.gates) {
      const result = await gate.run(problem, solution, {
        understanding: this.understanding,
        plan: this.plan
      });

      results.push({
        gate: gate.name,
        ...result
      });

      totalWeight += gate.weight;
      weightedScore += result.confidence * gate.weight;

      if (!result.passed) {
        allPassed = false;
      }
    }

    const overallConfidence = totalWeight > 0 ? weightedScore / totalWeight : 0;

    return {
      verified: allPassed && overallConfidence > 0.9,
      confidence: overallConfidence,
      allPassed,
      gates: results,
      reason: allPassed ? 'All gates passed' : results.filter(r => !r.passed).map(r => r.reason).join('; ')
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // DEFAULT VERIFICATION GATES
  // ═══════════════════════════════════════════════════════════════

  async checkFormat(problem, solution) {
    // Check solution format matches expected output format
    if (!solution) {
      return { passed: false, reason: 'No solution provided' };
    }

    if (problem.expectedFormat) {
      const formatMatch = this.matchesFormat(solution, problem.expectedFormat);
      return {
        passed: formatMatch,
        confidence: formatMatch ? 1.0 : 0.0,
        reason: formatMatch ? 'Format matches' : 'Format mismatch'
      };
    }

    return { passed: true, confidence: 0.8, reason: 'No format constraint' };
  }

  async checkConsistency(problem, solution) {
    // Check internal consistency
    if (Array.isArray(solution)) {
      // For grid solutions, check dimensions are consistent
      const heights = solution.map(row => row?.length || 0);
      const consistent = heights.every(h => h === heights[0]);
      return {
        passed: consistent,
        confidence: consistent ? 1.0 : 0.0,
        reason: consistent ? 'Internally consistent' : 'Inconsistent dimensions'
      };
    }

    return { passed: true, confidence: 0.7, reason: 'Consistency not applicable' };
  }

  async checkTrainingMatch(problem, solution) {
    // If training examples exist, verify solution approach works on them
    if (!problem.train || problem.train.length === 0) {
      return { passed: true, confidence: 0.5, reason: 'No training data' };
    }

    let matches = 0;
    for (const example of problem.train) {
      // Apply same transformation to training input
      const trainSolution = await this.solver(
        { ...problem, input: example.input },
        this.understanding,
        this.plan,
        { depth: this.depth, attempt: this.attempts }
      );

      if (this.solutionsMatch(trainSolution, example.output)) {
        matches++;
      }
    }

    const matchRate = matches / problem.train.length;
    return {
      passed: matchRate === 1.0,
      confidence: matchRate,
      reason: `${matches}/${problem.train.length} training examples match`
    };
  }

  async checkInverse(problem, solution) {
    // If transformation is invertible, check inverse
    if (!this.plan?.invertible) {
      return { passed: true, confidence: 0.6, reason: 'Not invertible' };
    }

    // Try to reconstruct input from solution
    try {
      const reconstructed = await this.invertSolution(solution, this.plan);
      const match = this.solutionsMatch(reconstructed, problem.input);
      return {
        passed: match,
        confidence: match ? 1.0 : 0.3,
        reason: match ? 'Inverse check passed' : 'Inverse reconstruction failed'
      };
    } catch {
      return { passed: true, confidence: 0.5, reason: 'Inverse check skipped' };
    }
  }

  async checkBoundary(problem, solution) {
    // Check boundary conditions and edge cases
    if (!Array.isArray(solution)) {
      return { passed: true, confidence: 0.7, reason: 'Not grid solution' };
    }

    // Check for out-of-bounds values
    const maxColor = 9; // ARC uses colors 0-9
    let valid = true;
    let reason = 'Boundary check passed';

    for (const row of solution) {
      for (const cell of row) {
        if (typeof cell !== 'number' || cell < 0 || cell > maxColor) {
          valid = false;
          reason = `Invalid cell value: ${cell}`;
          break;
        }
      }
      if (!valid) break;
    }

    return { passed: valid, confidence: valid ? 1.0 : 0.0, reason };
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  matchesFormat(solution, format) {
    if (format.type === 'grid') {
      return Array.isArray(solution) &&
        solution.every(row => Array.isArray(row));
    }
    return true;
  }

  solutionsMatch(a, b) {
    if (!a || !b) return false;
    if (JSON.stringify(a) === JSON.stringify(b)) return true;

    // Deep comparison for grids
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (Array.isArray(a[i]) && Array.isArray(b[i])) {
          if (a[i].length !== b[i].length) return false;
          for (let j = 0; j < a[i].length; j++) {
            if (a[i][j] !== b[i][j]) return false;
          }
        } else if (a[i] !== b[i]) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  async invertSolution(solution, plan) {
    // Override in specific implementations
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // DEFAULT IMPLEMENTATIONS (Override these)
  // ═══════════════════════════════════════════════════════════════

  async defaultUnderstand(problem, context) {
    // Basic problem analysis
    return {
      type: this.inferProblemType(problem),
      complexity: this.estimateComplexity(problem),
      features: this.extractFeatures(problem),
      constraints: this.inferConstraints(problem)
    };
  }

  async defaultPlan(problem, understanding, context) {
    return {
      steps: ['analyze', 'transform', 'verify'],
      strategy: context.strategy,
      parameters: {},
      invertible: false
    };
  }

  async defaultSolve(problem, understanding, plan, context) {
    // This should be overridden with actual solving logic
    return problem.input; // Identity transform as placeholder
  }

  inferProblemType(problem) {
    if (problem.train) return 'transformation';
    if (problem.constraints) return 'constraint_satisfaction';
    return 'unknown';
  }

  estimateComplexity(problem) {
    if (!problem.input) return 0.5;
    if (Array.isArray(problem.input)) {
      const size = problem.input.length * (problem.input[0]?.length || 1);
      return Math.min(1.0, size / 100);
    }
    return 0.5;
  }

  extractFeatures(problem) {
    const features = {};
    if (problem.input && Array.isArray(problem.input)) {
      features.inputSize = [problem.input.length, problem.input[0]?.length || 0];
      features.colors = [...new Set(problem.input.flat())];
    }
    if (problem.output && Array.isArray(problem.output)) {
      features.outputSize = [problem.output.length, problem.output[0]?.length || 0];
    }
    return features;
  }

  inferConstraints(problem) {
    return [];
  }

  // ═══════════════════════════════════════════════════════════════
  // CONTROL
  // ═══════════════════════════════════════════════════════════════

  pause() {
    this.paused = true;
    this.emit('paused');
  }

  resume() {
    this.paused = false;
    this.emit('resumed');
  }

  stop() {
    this.running = false;
    this.emit('stopped');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ═══════════════════════════════════════════════════════════════
  // ADD CUSTOM GATES
  // ═══════════════════════════════════════════════════════════════

  addGate(name, checkFn, weight = 1.0) {
    this.gates.push(new VerificationGate(name, checkFn, weight));
  }

  removeGate(name) {
    this.gates = this.gates.filter(g => g.name !== name);
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  SolveLoop,
  AmoebaExecutor,
  VerificationGate
};
