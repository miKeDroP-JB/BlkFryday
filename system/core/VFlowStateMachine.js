/**
 * VFLOW STATE MACHINE - The Operational Core
 * ═══════════════════════════════════════════════════════════════════
 * Formalizes VFlow + Solve Loop + 3iAtlas into deterministic states:
 *
 *   IDLE → UNDERSTAND → PLAN → SOLVE → VERIFY → COMMIT
 *                                 ↓
 *                              FAILED → ADAPT → [retry]
 *
 * Every problem, verified path, and learning update flows through
 * a traceable, inspectable, adaptive system.
 *
 * "Correctness first. Speed second."
 * ═══════════════════════════════════════════════════════════════════
 */

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════
// STATE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

const STATES = {
  IDLE: 'IDLE',
  UNDERSTAND: 'UNDERSTAND',
  PLAN: 'PLAN',
  SOLVE: 'SOLVE',
  VERIFY: 'VERIFY',
  COMMIT: 'COMMIT',
  FAILED: 'FAILED',
  ADAPT: 'ADAPT',
  PAUSED: 'PAUSED',
  ERROR: 'ERROR'
};

const TRANSITIONS = {
  // From IDLE
  [STATES.IDLE]: {
    START: STATES.UNDERSTAND,
    LOAD: STATES.UNDERSTAND
  },

  // From UNDERSTAND
  [STATES.UNDERSTAND]: {
    UNDERSTOOD: STATES.PLAN,
    FAIL: STATES.FAILED,
    PAUSE: STATES.PAUSED
  },

  // From PLAN
  [STATES.PLAN]: {
    PLANNED: STATES.SOLVE,
    FAIL: STATES.FAILED,
    PAUSE: STATES.PAUSED
  },

  // From SOLVE
  [STATES.SOLVE]: {
    SOLVED: STATES.VERIFY,
    FAIL: STATES.FAILED,
    PAUSE: STATES.PAUSED
  },

  // From VERIFY
  [STATES.VERIFY]: {
    VERIFIED: STATES.COMMIT,
    REJECTED: STATES.FAILED,
    PAUSE: STATES.PAUSED
  },

  // From COMMIT
  [STATES.COMMIT]: {
    NEXT: STATES.IDLE,
    DONE: STATES.IDLE
  },

  // From FAILED
  [STATES.FAILED]: {
    ADAPT: STATES.ADAPT,
    RETRY: STATES.UNDERSTAND,
    ABORT: STATES.IDLE,
    PAUSE: STATES.PAUSED
  },

  // From ADAPT
  [STATES.ADAPT]: {
    ADAPTED: STATES.UNDERSTAND,
    EXHAUSTED: STATES.IDLE,
    PAUSE: STATES.PAUSED
  },

  // From PAUSED
  [STATES.PAUSED]: {
    RESUME: null, // Returns to previous state
    ABORT: STATES.IDLE
  },

  // From ERROR
  [STATES.ERROR]: {
    RESET: STATES.IDLE,
    RETRY: STATES.UNDERSTAND
  }
};

// ═══════════════════════════════════════════════════════════════════
// TELEMETRY
// ═══════════════════════════════════════════════════════════════════

class Telemetry {
  constructor() {
    this.events = [];
    this.maxEvents = 10000;
    this.stateHistory = [];
    this.metrics = {
      stateTransitions: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      adaptations: 0,
      totalProblems: 0,
      solvedProblems: 0
    };
  }

  record(event) {
    const entry = {
      timestamp: Date.now(),
      ...event
    };

    this.events.push(entry);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Update metrics
    if (event.type === 'state_change') {
      this.metrics.stateTransitions++;
      this.stateHistory.push({
        timestamp: entry.timestamp,
        from: event.from,
        to: event.to,
        trigger: event.trigger
      });
    }

    if (event.type === 'verification') {
      if (event.success) {
        this.metrics.successfulVerifications++;
      } else {
        this.metrics.failedVerifications++;
      }
    }

    if (event.type === 'adaptation') {
      this.metrics.adaptations++;
    }

    if (event.type === 'problem_start') {
      this.metrics.totalProblems++;
    }

    if (event.type === 'problem_solved') {
      this.metrics.solvedProblems++;
    }

    return entry;
  }

  getEvents(filter = {}) {
    let result = this.events;

    if (filter.type) {
      result = result.filter(e => e.type === filter.type);
    }
    if (filter.since) {
      result = result.filter(e => e.timestamp >= filter.since);
    }
    if (filter.limit) {
      result = result.slice(-filter.limit);
    }

    return result;
  }

  getMetrics() {
    return {
      ...this.metrics,
      verificationRate: this.metrics.successfulVerifications /
        (this.metrics.successfulVerifications + this.metrics.failedVerifications) || 0,
      solveRate: this.metrics.solvedProblems / this.metrics.totalProblems || 0
    };
  }

  getStateTimeline(limit = 100) {
    return this.stateHistory.slice(-limit);
  }

  export() {
    return {
      events: this.events,
      stateHistory: this.stateHistory,
      metrics: this.getMetrics(),
      exportedAt: Date.now()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

class VFlowConfig {
  constructor(options = {}) {
    // Retry parameters
    this.maxRetries = options.maxRetries || 10;
    this.retryBackoff = options.retryBackoff || 1.5;
    this.maxRetryDelay = options.maxRetryDelay || 5000;

    // Verification strictness (0-1, higher = stricter)
    this.verificationStrictness = options.verificationStrictness || 0.9;
    this.requiredConfidence = options.requiredConfidence || 0.95;

    // Strategy preferences (weights)
    this.strategyWeights = options.strategyWeights || {
      direct_solve: 1.0,
      decomposition: 0.9,
      pattern_match: 0.85,
      analogical_transfer: 0.8,
      constraint_satisfaction: 0.75,
      generate_and_test: 0.7,
      means_ends_analysis: 0.65,
      abstraction_refinement: 0.6
    };

    // Adaptation parameters
    this.imaginationExpansionRate = options.imaginationExpansionRate || 0.1;
    this.insightFocusRate = options.insightFocusRate || 0.1;
    this.intelligenceBoostRate = options.intelligenceBoostRate || 0.1;

    // Timeouts
    this.phaseTimeout = options.phaseTimeout || 30000; // 30 seconds per phase
    this.totalTimeout = options.totalTimeout || 300000; // 5 minutes total

    // Telemetry
    this.telemetryEnabled = options.telemetryEnabled !== false;
    this.verboseLogging = options.verboseLogging || false;
  }

  update(changes) {
    Object.assign(this, changes);
  }

  toJSON() {
    return { ...this };
  }
}

// ═══════════════════════════════════════════════════════════════════
// VFLOW STATE MACHINE
// ═══════════════════════════════════════════════════════════════════

class VFlowStateMachine extends EventEmitter {
  constructor(options = {}) {
    super();

    // State
    this.currentState = STATES.IDLE;
    this.previousState = null;
    this.stateData = {};

    // Configuration
    this.config = new VFlowConfig(options.config);

    // Telemetry
    this.telemetry = new Telemetry();

    // Problem context
    this.currentProblem = null;
    this.currentSolution = null;
    this.understanding = null;
    this.plan = null;
    this.verificationResult = null;

    // Retry tracking
    this.retryCount = 0;
    this.failedStrategies = [];
    this.adaptations = [];

    // 3iAtlas position
    this.position = {
      insight: 0.5,
      intelligence: 0.5,
      imagination: 0.5
    };

    // Connected components (injected)
    this.solveLoop = options.solveLoop || null;
    this.atlas = options.atlas || null;
    this.cockpit = options.cockpit || null;

    // Phase handlers
    this.handlers = {
      [STATES.UNDERSTAND]: options.understander || this.defaultUnderstand.bind(this),
      [STATES.PLAN]: options.planner || this.defaultPlan.bind(this),
      [STATES.SOLVE]: options.solver || this.defaultSolve.bind(this),
      [STATES.VERIFY]: options.verifier || this.defaultVerify.bind(this),
      [STATES.COMMIT]: options.committer || this.defaultCommit.bind(this),
      [STATES.ADAPT]: options.adapter || this.defaultAdapt.bind(this)
    };

    // Timers
    this.phaseTimer = null;
    this.totalTimer = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // STATE TRANSITIONS
  // ═══════════════════════════════════════════════════════════════

  canTransition(trigger) {
    const allowed = TRANSITIONS[this.currentState];
    return allowed && allowed[trigger] !== undefined;
  }

  transition(trigger, data = {}) {
    if (!this.canTransition(trigger)) {
      this.emit('transition:denied', {
        from: this.currentState,
        trigger,
        reason: 'Invalid transition'
      });
      return false;
    }

    const targetState = TRANSITIONS[this.currentState][trigger];

    // Handle PAUSED special case (returns to previous)
    if (this.currentState === STATES.PAUSED && trigger === 'RESUME') {
      return this.transitionTo(this.previousState, 'RESUME', data);
    }

    if (targetState) {
      return this.transitionTo(targetState, trigger, data);
    }

    return false;
  }

  transitionTo(newState, trigger, data = {}) {
    const fromState = this.currentState;

    // Record previous state
    if (fromState !== STATES.PAUSED) {
      this.previousState = fromState;
    }

    this.currentState = newState;
    this.stateData = data;

    // Telemetry
    if (this.config.telemetryEnabled) {
      this.telemetry.record({
        type: 'state_change',
        from: fromState,
        to: newState,
        trigger,
        data
      });
    }

    // Emit events
    this.emit('state:exit', { state: fromState, trigger });
    this.emit('state:enter', { state: newState, trigger, data });
    this.emit('state:change', {
      from: fromState,
      to: newState,
      trigger,
      data,
      position: this.position
    });

    // Update cockpit
    if (this.cockpit) {
      this.cockpit.updateFromSolveLoop({
        problem: { phase: newState },
        position: this.position,
        feed: { panel: 'center', message: `State: ${newState}` }
      });
    }

    if (this.config.verboseLogging) {
      console.log(`[VFlow] ${fromState} → ${newState} (${trigger})`);
    }

    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN EXECUTION FLOW
  // ═══════════════════════════════════════════════════════════════

  async start(problem) {
    if (this.currentState !== STATES.IDLE) {
      throw new Error(`Cannot start: currently in ${this.currentState}`);
    }

    // Initialize
    this.currentProblem = problem;
    this.retryCount = 0;
    this.failedStrategies = [];
    this.adaptations = [];

    // Record start
    this.telemetry.record({
      type: 'problem_start',
      problemId: problem.id || 'unknown'
    });

    // Set timeout
    if (this.config.totalTimeout) {
      this.totalTimer = setTimeout(() => {
        this.handleTimeout();
      }, this.config.totalTimeout);
    }

    // Start the flow
    this.transition('START', { problem });

    // Execute flow
    return this.executeFlow();
  }

  async executeFlow() {
    const startTime = Date.now();

    while (this.currentState !== STATES.IDLE &&
      this.currentState !== STATES.PAUSED &&
      this.currentState !== STATES.ERROR) {

      try {
        await this.executeCurrentPhase();
      } catch (error) {
        this.handleError(error);
        break;
      }
    }

    // Cleanup
    if (this.totalTimer) {
      clearTimeout(this.totalTimer);
      this.totalTimer = null;
    }

    const result = {
      success: this.currentState === STATES.IDLE && this.verificationResult?.verified,
      solution: this.currentSolution,
      verified: this.verificationResult?.verified || false,
      understanding: this.understanding,
      plan: this.plan,
      verification: this.verificationResult,
      retries: this.retryCount,
      adaptations: this.adaptations.length,
      timeMs: Date.now() - startTime,
      telemetry: this.telemetry.getMetrics()
    };

    if (result.success) {
      this.telemetry.record({
        type: 'problem_solved',
        problemId: this.currentProblem?.id,
        retries: this.retryCount
      });
    }

    return result;
  }

  async executeCurrentPhase() {
    const handler = this.handlers[this.currentState];

    if (!handler) {
      // No handler - auto-transition based on state
      return this.autoTransition();
    }

    // Set phase timeout
    if (this.config.phaseTimeout) {
      this.phaseTimer = setTimeout(() => {
        this.handlePhaseTimeout();
      }, this.config.phaseTimeout);
    }

    try {
      const result = await handler(this.currentProblem, this.stateData);
      await this.handlePhaseResult(result);
    } finally {
      if (this.phaseTimer) {
        clearTimeout(this.phaseTimer);
        this.phaseTimer = null;
      }
    }
  }

  async handlePhaseResult(result) {
    switch (this.currentState) {
      case STATES.UNDERSTAND:
        this.understanding = result;
        this.updatePosition({ insight: 0.1 }); // Understanding increases insight
        this.transition('UNDERSTOOD', { understanding: result });
        break;

      case STATES.PLAN:
        this.plan = result;
        this.updatePosition({ intelligence: 0.05 }); // Planning uses intelligence
        this.transition('PLANNED', { plan: result });
        break;

      case STATES.SOLVE:
        this.currentSolution = result;
        this.updatePosition({ imagination: 0.05 }); // Solving uses imagination
        this.transition('SOLVED', { solution: result });
        break;

      case STATES.VERIFY:
        this.verificationResult = result;
        this.telemetry.record({
          type: 'verification',
          success: result.verified
        });

        if (result.verified && result.confidence >= this.config.requiredConfidence) {
          this.transition('VERIFIED', { verification: result });
        } else {
          this.transition('REJECTED', { verification: result });
        }
        break;

      case STATES.COMMIT:
        // Record in atlas
        if (this.atlas) {
          this.atlas.recordSolution({
            problemId: this.currentProblem?.id || 'unknown',
            success: true,
            strategy: this.plan?.strategy,
            steps: this.plan?.steps || [],
            totalTime: Date.now() - this.stateData.startTime,
            position: this.position
          });
        }
        this.transition('DONE', { committed: true });
        break;

      case STATES.FAILED:
        this.retryCount++;
        if (this.retryCount < this.config.maxRetries) {
          this.transition('ADAPT', { retryCount: this.retryCount });
        } else {
          this.transition('ABORT', { reason: 'Max retries exceeded' });
        }
        break;

      case STATES.ADAPT:
        this.adaptations.push(result);
        this.telemetry.record({
          type: 'adaptation',
          strategy: result.newStrategy,
          position: result.newPosition
        });

        if (result.canContinue) {
          this.updatePosition(result.positionDelta || {});
          if (this.plan?.strategy) {
            this.failedStrategies.push(this.plan.strategy);
          }
          this.transition('ADAPTED', { adaptation: result });
        } else {
          this.transition('EXHAUSTED', { reason: 'All strategies exhausted' });
        }
        break;
    }
  }

  autoTransition() {
    // Handle states that don't need handlers
    switch (this.currentState) {
      case STATES.COMMIT:
        this.transition('DONE');
        break;
      case STATES.FAILED:
        this.transition('ADAPT');
        break;
      default:
        // Stay in current state
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DEFAULT PHASE HANDLERS
  // ═══════════════════════════════════════════════════════════════

  async defaultUnderstand(problem, context) {
    // Canonicalize the problem
    return {
      type: this.inferType(problem),
      features: this.extractFeatures(problem),
      constraints: this.inferConstraints(problem),
      complexity: this.estimateComplexity(problem)
    };
  }

  async defaultPlan(problem, context) {
    // Select strategy based on understanding and history
    const understanding = this.understanding;

    let strategy = 'direct_solve';
    let confidence = 0.5;

    // Check atlas for recommendations
    if (this.atlas) {
      const recommendations = this.atlas.recommendStrategy(understanding?.features || {});
      if (recommendations.length > 0) {
        // Filter out failed strategies
        const available = recommendations.filter(r =>
          !this.failedStrategies.includes(r.strategy)
        );
        if (available.length > 0) {
          strategy = available[0].strategy;
          confidence = available[0].score;
        }
      }
    }

    return {
      strategy,
      confidence,
      steps: this.generateSteps(strategy, understanding),
      parameters: this.getStrategyParameters(strategy)
    };
  }

  async defaultSolve(problem, context) {
    // Execute the plan
    if (this.solveLoop) {
      // Use the connected solve loop
      return this.solveLoop.executeSolve(problem, this.understanding, this.plan);
    }

    // Default: return input (identity)
    return problem.input;
  }

  async defaultVerify(problem, context) {
    // Adversarial verification
    if (this.solveLoop) {
      return this.solveLoop.verify(problem, this.currentSolution);
    }

    // Basic verification
    const solution = this.currentSolution;
    let confidence = 0.5;
    let verified = false;

    if (problem.output && solution) {
      // Compare to expected output
      const match = JSON.stringify(solution) === JSON.stringify(problem.output);
      confidence = match ? 1.0 : 0.0;
      verified = match;
    }

    return {
      verified,
      confidence,
      gates: [{ name: 'output_match', passed: verified }],
      reason: verified ? 'Output matches expected' : 'Output mismatch'
    };
  }

  async defaultCommit(problem, context) {
    // Commit the verified solution
    return {
      committed: true,
      solution: this.currentSolution,
      timestamp: Date.now()
    };
  }

  async defaultAdapt(problem, context) {
    // Adapt strategy based on failure
    const failureReason = context.verification?.reason || 'unknown';

    // Calculate position adjustment
    let positionDelta = {};

    if (failureReason.includes('pattern')) {
      // Need more insight
      positionDelta.insight = this.config.insightFocusRate;
    } else if (failureReason.includes('logic') || failureReason.includes('reasoning')) {
      // Need more intelligence
      positionDelta.intelligence = this.config.intelligenceBoostRate;
    } else {
      // Try more imagination
      positionDelta.imagination = this.config.imaginationExpansionRate;
    }

    // Find next strategy
    const allStrategies = Object.keys(this.config.strategyWeights);
    const available = allStrategies.filter(s => !this.failedStrategies.includes(s));

    if (available.length === 0) {
      return {
        canContinue: false,
        reason: 'All strategies exhausted',
        positionDelta
      };
    }

    // Sort by weight
    available.sort((a, b) =>
      this.config.strategyWeights[b] - this.config.strategyWeights[a]
    );

    return {
      canContinue: true,
      newStrategy: available[0],
      positionDelta,
      reason: `Switching to ${available[0]}`
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════

  inferType(problem) {
    if (problem.train) return 'transformation';
    if (problem.constraints) return 'constraint_satisfaction';
    if (problem.goal) return 'goal_seeking';
    return 'unknown';
  }

  extractFeatures(problem) {
    const features = {};
    if (problem.input && Array.isArray(problem.input)) {
      features.inputSize = [problem.input.length, problem.input[0]?.length || 0];
      features.colors = [...new Set(problem.input.flat())];
    }
    return features;
  }

  inferConstraints(problem) {
    return problem.constraints || [];
  }

  estimateComplexity(problem) {
    if (!problem.input) return 0.5;
    const size = Array.isArray(problem.input) ?
      problem.input.length * (problem.input[0]?.length || 1) : 1;
    return Math.min(1, size / 100);
  }

  generateSteps(strategy, understanding) {
    const steps = {
      direct_solve: ['analyze', 'transform', 'output'],
      decomposition: ['identify_parts', 'solve_parts', 'combine'],
      pattern_match: ['find_patterns', 'apply_pattern', 'verify'],
      analogical_transfer: ['find_similar', 'transfer_solution', 'adapt'],
      constraint_satisfaction: ['extract_constraints', 'propagate', 'backtrack'],
      generate_and_test: ['generate_candidate', 'test', 'refine'],
      means_ends_analysis: ['identify_difference', 'select_operator', 'apply'],
      abstraction_refinement: ['abstract', 'solve_abstract', 'refine']
    };
    return steps[strategy] || ['solve'];
  }

  getStrategyParameters(strategy) {
    return {
      depth: Math.max(1, this.retryCount + 1),
      strictness: this.config.verificationStrictness
    };
  }

  updatePosition(delta) {
    this.position = {
      insight: Math.max(0, Math.min(1, this.position.insight + (delta.insight || 0))),
      intelligence: Math.max(0, Math.min(1, this.position.intelligence + (delta.intelligence || 0))),
      imagination: Math.max(0, Math.min(1, this.position.imagination + (delta.imagination || 0)))
    };

    if (this.atlas) {
      this.atlas.moveTo(this.position);
    }

    this.emit('position:change', this.position);
  }

  // ═══════════════════════════════════════════════════════════════
  // ERROR HANDLING
  // ═══════════════════════════════════════════════════════════════

  handleError(error) {
    this.telemetry.record({
      type: 'error',
      state: this.currentState,
      error: error.message
    });

    this.transitionTo(STATES.ERROR, 'ERROR', { error });
    this.emit('error', error);
  }

  handleTimeout() {
    this.telemetry.record({
      type: 'timeout',
      state: this.currentState
    });

    this.transition('ABORT', { reason: 'Total timeout exceeded' });
  }

  handlePhaseTimeout() {
    this.telemetry.record({
      type: 'phase_timeout',
      state: this.currentState
    });

    this.transition('FAIL', { reason: 'Phase timeout exceeded' });
  }

  // ═══════════════════════════════════════════════════════════════
  // CONTROL
  // ═══════════════════════════════════════════════════════════════

  pause() {
    if (this.canTransition('PAUSE')) {
      this.transition('PAUSE');
      return true;
    }
    return false;
  }

  resume() {
    if (this.currentState === STATES.PAUSED) {
      this.transition('RESUME');
      return true;
    }
    return false;
  }

  abort() {
    if (this.canTransition('ABORT')) {
      this.transition('ABORT', { reason: 'User abort' });
      return true;
    }
    return false;
  }

  reset() {
    this.currentState = STATES.IDLE;
    this.previousState = null;
    this.stateData = {};
    this.currentProblem = null;
    this.currentSolution = null;
    this.understanding = null;
    this.plan = null;
    this.verificationResult = null;
    this.retryCount = 0;
    this.failedStrategies = [];
    this.adaptations = [];
    this.position = { insight: 0.5, intelligence: 0.5, imagination: 0.5 };

    this.emit('reset');
    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // INTROSPECTION
  // ═══════════════════════════════════════════════════════════════

  getState() {
    return {
      current: this.currentState,
      previous: this.previousState,
      data: this.stateData,
      position: this.position,
      retries: this.retryCount,
      failedStrategies: [...this.failedStrategies],
      adaptations: [...this.adaptations]
    };
  }

  getSnapshot() {
    return {
      state: this.getState(),
      problem: this.currentProblem,
      solution: this.currentSolution,
      understanding: this.understanding,
      plan: this.plan,
      verification: this.verificationResult,
      config: this.config.toJSON(),
      telemetry: this.telemetry.getMetrics()
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // CONNECT COMPONENTS
  // ═══════════════════════════════════════════════════════════════

  connectSolveLoop(solveLoop) {
    this.solveLoop = solveLoop;
  }

  connectAtlas(atlas) {
    this.atlas = atlas;
  }

  connectCockpit(cockpit) {
    this.cockpit = cockpit;

    // Wire cockpit commands
    cockpit.on('solve:start', () => this.start(this.currentProblem));
    cockpit.on('system:pause', () => this.pause());
    cockpit.on('system:resume', () => this.resume());
    cockpit.on('system:stop', () => this.abort());
    cockpit.on('problem:reset', () => this.reset());
    cockpit.on('strategy:switch', (strategy) => {
      if (this.plan) this.plan.strategy = strategy;
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  VFlowStateMachine,
  VFlowConfig,
  Telemetry,
  STATES,
  TRANSITIONS
};
