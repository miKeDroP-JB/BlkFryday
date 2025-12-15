/**
 * VFLOW INTEGRATED SYSTEM
 * ═══════════════════════════════════════════════════════════════════
 * The complete verified cognition system:
 *
 * [Voice Cockpit / HUD]     ← command + observation
 *          │
 *          ▼
 *    Solve Loop Engine      ← action + retry
 * (Understand → Plan → Solve → Verify)
 *          │
 *          ▼
 *   3iAtlas Map & Learning  ← navigation + learning
 *          │
 *          ▼
 * Code-Level State Machine  ← enforce correctness + traceability
 * (Commit / Retry / Adapt)
 *
 * "Every problem, verified path, and learning update flows through
 * a traceable, inspectable, adaptive system."
 * ═══════════════════════════════════════════════════════════════════
 */

const { VoiceCockpit } = require('./cockpit/VoiceCockpit');
const { SolveLoop } = require('./core/SolveLoop');
const { ThreeIAtlas } = require('./atlas/ThreeIAtlas');
const { VFlowStateMachine, VFlowConfig } = require('./core/VFlowStateMachine');
const EventEmitter = require('events');

class VFlowSystem extends EventEmitter {
  constructor(options = {}) {
    super();

    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  ██╗   ██╗███████╗██╗      ██████╗ ██╗    ██╗                    ║
║  ██║   ██║██╔════╝██║     ██╔═══██╗██║    ██║                    ║
║  ██║   ██║█████╗  ██║     ██║   ██║██║ █╗ ██║                    ║
║  ╚██╗ ██╔╝██╔══╝  ██║     ██║   ██║██║███╗██║                    ║
║   ╚████╔╝ ██║     ███████╗╚██████╔╝╚███╔███╔╝                    ║
║    ╚═══╝  ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝                     ║
║                                                                   ║
║              VERIFIED COGNITION SYSTEM v1.0                       ║
║          "Correctness first. Speed second."                       ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
    `);

    // Initialize components
    this.initializeComponents(options);

    // Connect components
    this.wireComponents();

    console.log('✓ VFlow System initialized');
    console.log('  - Voice Cockpit: Ready');
    console.log('  - Solve Loop: Ready');
    console.log('  - 3iAtlas: Ready');
    console.log('  - State Machine: Ready');
    console.log('');
  }

  initializeComponents(options) {
    // 1. 3iAtlas - Cognitive terrain map
    this.atlas = new ThreeIAtlas({
      persistPath: options.atlasPath || './data/atlas.json',
      autoSave: options.autoSave !== false,
      ...options.atlas
    });

    // Try to load existing atlas
    this.atlas.load().then(loaded => {
      if (loaded) {
        console.log('  3iAtlas: Loaded existing map');
      }
    }).catch(() => { });

    // 2. Solve Loop - Gated verification engine
    this.solveLoop = new SolveLoop({
      maxAttempts: options.maxAttempts || 100,
      understander: options.understander,
      planner: options.planner,
      solver: options.solver,
      ...options.solveLoop
    });

    // 3. State Machine - VFlow controller
    this.stateMachine = new VFlowStateMachine({
      config: options.config || {},
      solveLoop: this.solveLoop,
      atlas: this.atlas,
      ...options.stateMachine
    });

    // 4. Voice Cockpit - HUD and control
    this.cockpit = new VoiceCockpit({
      stateMachine: this.stateMachine,
      solveLoop: this.solveLoop,
      atlas: this.atlas,
      ...options.cockpit
    });
  }

  wireComponents() {
    // Connect state machine to solve loop
    this.stateMachine.connectSolveLoop(this.solveLoop);
    this.stateMachine.connectAtlas(this.atlas);
    this.stateMachine.connectCockpit(this.cockpit);

    // Connect cockpit to solve loop
    this.cockpit.connectSolveLoop(this.solveLoop);
    this.cockpit.connectStateMachine(this.stateMachine);

    // Forward events
    this.solveLoop.on('phase:change', (phase) => {
      this.emit('phase:change', phase);
    });

    this.solveLoop.on('verified', (result) => {
      this.emit('verified', result);
    });

    this.stateMachine.on('state:change', (change) => {
      this.emit('state:change', change);
    });

    this.stateMachine.on('error', (error) => {
      this.emit('error', error);
    });

    this.cockpit.on('hud:update', (snapshot) => {
      this.emit('hud:update', snapshot);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN API
  // ═══════════════════════════════════════════════════════════════

  /**
   * Solve a problem with verified cognition
   */
  async solve(problem) {
    console.log(`\n[VFlow] Solving problem: ${problem.id || 'unknown'}`);

    // Start the state machine
    const result = await this.stateMachine.start(problem);

    console.log(`[VFlow] Result: ${result.success ? 'VERIFIED ✓' : 'FAILED ✗'}`);
    console.log(`  Retries: ${result.retries}`);
    console.log(`  Adaptations: ${result.adaptations}`);
    console.log(`  Time: ${result.timeMs}ms`);

    return result;
  }

  /**
   * Process voice input
   */
  voice(input) {
    return this.cockpit.processVoiceInput(input);
  }

  /**
   * Get current HUD state
   */
  getHUD() {
    return this.cockpit.getHUDState();
  }

  /**
   * Get 3iAtlas visualization data
   */
  getAtlasVisualization() {
    return this.atlas.toVisualization();
  }

  /**
   * Get system snapshot
   */
  getSnapshot() {
    return {
      stateMachine: this.stateMachine.getSnapshot(),
      hud: this.cockpit.getHUDState(),
      atlas: this.atlas.getStats(),
      position: this.stateMachine.position
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // CONTROL
  // ═══════════════════════════════════════════════════════════════

  pause() {
    return this.stateMachine.pause();
  }

  resume() {
    return this.stateMachine.resume();
  }

  stop() {
    return this.stateMachine.abort();
  }

  reset() {
    return this.stateMachine.reset();
  }

  // ═══════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════

  configure(options) {
    if (options.verificationStrictness !== undefined) {
      this.stateMachine.config.verificationStrictness = options.verificationStrictness;
    }
    if (options.maxRetries !== undefined) {
      this.stateMachine.config.maxRetries = options.maxRetries;
    }
    if (options.strategyWeights) {
      Object.assign(this.stateMachine.config.strategyWeights, options.strategyWeights);
    }
    return this.stateMachine.config.toJSON();
  }

  // ═══════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════════

  async saveAtlas(path) {
    return this.atlas.save(path);
  }

  async loadAtlas(path) {
    return this.atlas.load(path);
  }

  // ═══════════════════════════════════════════════════════════════
  // TELEMETRY
  // ═══════════════════════════════════════════════════════════════

  getMetrics() {
    return {
      ...this.stateMachine.telemetry.getMetrics(),
      atlas: this.atlas.getStats()
    };
  }

  getTimeline(limit = 100) {
    return this.stateMachine.telemetry.getStateTimeline(limit);
  }

  exportTelemetry() {
    return {
      stateMachine: this.stateMachine.telemetry.export(),
      atlas: this.atlas.getStats()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════

function createVFlowSystem(options = {}) {
  return new VFlowSystem(options);
}

// ═══════════════════════════════════════════════════════════════════
// PRESETS
// ═══════════════════════════════════════════════════════════════════

const PRESETS = {
  strict: {
    config: {
      verificationStrictness: 0.99,
      requiredConfidence: 0.99,
      maxRetries: 50
    }
  },

  balanced: {
    config: {
      verificationStrictness: 0.9,
      requiredConfidence: 0.95,
      maxRetries: 20
    }
  },

  fast: {
    config: {
      verificationStrictness: 0.8,
      requiredConfidence: 0.85,
      maxRetries: 10,
      phaseTimeout: 10000
    }
  },

  unlimited: {
    config: {
      verificationStrictness: 0.95,
      requiredConfidence: 0.99,
      maxRetries: 1000,
      totalTimeout: 0, // No timeout
      phaseTimeout: 0
    }
  }
};

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  VFlowSystem,
  createVFlowSystem,
  PRESETS
};
