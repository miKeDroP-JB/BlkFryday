/**
 * ORBITAL FORGE - THE REALITY COMPILER
 * ═══════════════════════════════════════════════════════════════════
 *
 *    ██████╗ ██████╗ ██████╗ ██╗████████╗ █████╗ ██╗
 *   ██╔═══██╗██╔══██╗██╔══██╗██║╚══██╔══╝██╔══██╗██║
 *   ██║   ██║██████╔╝██████╔╝██║   ██║   ███████║██║
 *   ██║   ██║██╔══██╗██╔══██╗██║   ██║   ██╔══██║██║
 *   ╚██████╔╝██║  ██║██████╔╝██║   ██║   ██║  ██║███████╗
 *    ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝
 *
 *   ███████╗ ██████╗ ██████╗  ██████╗ ███████╗
 *   ██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
 *   █████╗  ██║   ██║██████╔╝██║  ███╗█████╗
 *   ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝
 *   ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
 *   ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
 *
 *   "Intent in. World out." 🜂
 *
 * ═══════════════════════════════════════════════════════════════════
 */

const { EventEmitter } = require('events');

// ═══════════════════════════════════════════════════════════════════
// LAYER IMPORTS
// ═══════════════════════════════════════════════════════════════════

// Layer 0: Prime Axiom
const {
  ExecutionNode,
  ExecutionGraph,
  NODE_TYPES,
  NODE_STATUS,
  GRAPH_STATUS,
  PRIME_AXIOM,
  validateGraph,
  mergeGraphs
} = require('./core/prime');

// Layer 1: Immortality
const {
  WatchdogTimer,
  ProcessGuard,
  AppendLog,
  StateStore,
  GraphStore,
  CommandParser,
  IntentRouter,
  ControlHub,
  Immortality
} = require('./core/immortality');

// Layer 2: Intelligence Execution
const {
  DecompositionEngine,
  ExecutionEngine,
  FeedbackEngine,
  IntelligenceLayer
} = require('./core/execution');

// Layer 3: Multiplication
const {
  ParallelPool,
  WorkerOrchestrator,
  Checkpoint,
  ResumableExecution,
  SwarmAgent,
  SwarmMaster,
  MultiplicationLayer
} = require('./core/multiplication');

// Layer 4: Evolution
const {
  AgentTemplate,
  SkillRegistry,
  PerformanceTracker,
  AgentEvolution,
  PatternRecognizer,
  PredictiveCache,
  PlanReorderer,
  PredictiveOptimizer,
  EvolutionLayer
} = require('./core/evolution');

// Layer 5: Autonomous Creation
const {
  GoalHorizon,
  SandboxZone,
  ExperimentRunner,
  SelfImprovement,
  AutonomousDirector,
  AutonomousLayer,
  AUTONOMOUS_MANIFESTO
} = require('./core/autonomous');

// ═══════════════════════════════════════════════════════════════════
// VERSION & METADATA
// ═══════════════════════════════════════════════════════════════════

const FORGE_VERSION = '1.0.0';
const FORGE_CODENAME = 'ORBITAL_FORGE';

// ═══════════════════════════════════════════════════════════════════
// ORBITAL FORGE - UNIFIED SYSTEM
// ═══════════════════════════════════════════════════════════════════

/**
 * OrbitalForge - The complete reality compiler
 *
 * Reality bends when intent becomes a graph, and the graph is executed
 * by systems that do not forget, do not tire, do not wait for permission,
 * and do not require belief.
 */
class OrbitalForge extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.version = FORGE_VERSION;
    this.codename = FORGE_CODENAME;
    this.status = 'INITIALIZING';

    // Initialize layers (lazy - only when accessed or explicitly initialized)
    this._layers = {
      immortality: null,
      intelligence: null,
      multiplication: null,
      evolution: null,
      autonomous: null
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialize the Orbital Forge
   */
  async initialize(options = {}) {
    console.log(`
  ╔═══════════════════════════════════════════════════════════════════╗
  ║                                                                   ║
  ║     ██████╗ ██████╗ ██████╗ ██╗████████╗ █████╗ ██╗               ║
  ║    ██╔═══██╗██╔══██╗██╔══██╗██║╚══██╔══╝██╔══██║██║               ║
  ║    ██║   ██║██████╔╝██████╔╝██║   ██║   ███████║██║               ║
  ║    ██║   ██║██╔══██╗██╔══██╗██║   ██║   ██╔══██║██║               ║
  ║    ╚██████╔╝██║  ██║██████╔╝██║   ██║   ██║  ██║███████╗          ║
  ║     ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝          ║
  ║                                                                   ║
  ║    ███████╗ ██████╗ ██████╗  ██████╗ ███████╗                     ║
  ║    ██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝                     ║
  ║    █████╗  ██║   ██║██████╔╝██║  ███╗█████╗                       ║
  ║    ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝                       ║
  ║    ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗                     ║
  ║    ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝                     ║
  ║                                                                   ║
  ║              THE REALITY EXECUTION BLUEPRINT                      ║
  ║                   Version ${FORGE_VERSION} - ${FORGE_CODENAME}                     ║
  ║                                                                   ║
  ╚═══════════════════════════════════════════════════════════════════╝
    `);

    // Initialize layers based on options
    if (options.immortality !== false) {
      this._layers.immortality = new Immortality(this.config.immortality);
      await this._layers.immortality.initialize();
      console.log('✓ Layer 1: Immortality initialized');
    }

    if (options.intelligence !== false) {
      this._layers.intelligence = new IntelligenceLayer(this.config.intelligence);
      this._layers.intelligence.initialize();
      console.log('✓ Layer 2: Intelligence Execution initialized');
    }

    if (options.multiplication !== false) {
      this._layers.multiplication = new MultiplicationLayer(this.config.multiplication);
      await this._layers.multiplication.initialize();
      console.log('✓ Layer 3: Multiplication initialized');
    }

    if (options.evolution !== false) {
      this._layers.evolution = new EvolutionLayer(this.config.evolution);
      this._layers.evolution.initialize();
      console.log('✓ Layer 4: Evolution initialized');
    }

    if (options.autonomous !== false) {
      this._layers.autonomous = new AutonomousLayer(this.config.autonomous);
      this._layers.autonomous.initialize();
      console.log('✓ Layer 5: Autonomous Creation initialized');
    }

    this.status = 'ONLINE';
    console.log('\n🜂 ORBITAL FORGE ONLINE - Reality compiler operational\n');

    return this;
  }

  // ═══════════════════════════════════════════════════════════════
  // LAYER ACCESS
  // ═══════════════════════════════════════════════════════════════

  get immortality() {
    return this._layers.immortality;
  }

  get intelligence() {
    return this._layers.intelligence;
  }

  get multiplication() {
    return this._layers.multiplication;
  }

  get evolution() {
    return this._layers.evolution;
  }

  get autonomous() {
    return this._layers.autonomous;
  }

  // ═══════════════════════════════════════════════════════════════
  // HIGH-LEVEL API
  // ═══════════════════════════════════════════════════════════════

  /**
   * Execute an intent - the primary entry point
   *
   * "Do X" -> decompose -> execute -> report
   */
  async execute(intent, context = {}) {
    if (!this._layers.intelligence) {
      throw new Error('Intelligence layer not initialized');
    }

    console.log(`\n[FORGE] ═══════════════════════════════════════`);
    console.log(`[FORGE] EXECUTING: "${intent}"`);
    console.log(`[FORGE] ═══════════════════════════════════════\n`);

    // Persist intent
    if (this._layers.immortality) {
      this._layers.immortality.log.append({
        type: 'INTENT',
        intent,
        timestamp: Date.now()
      });
    }

    // Decompose and execute
    const result = await this._layers.intelligence.execute(intent, context);

    // Learn from execution
    if (this._layers.evolution && result.graph) {
      // Record patterns for prediction
      this._layers.evolution.optimizer.record({
        type: 'EXECUTION',
        action: intent.split(' ')[0],
        success: result.result.failed === 0,
        duration: Date.now()
      });
    }

    // Persist result
    if (this._layers.immortality) {
      this._layers.immortality.state.set(`execution:${result.graph.id}`, {
        intent,
        progress: result.result,
        timestamp: Date.now()
      });
    }

    return result;
  }

  /**
   * Create and persist an execution graph
   */
  createGraph(config) {
    const graph = new ExecutionGraph(config);

    if (this._layers.immortality) {
      this._layers.immortality.graphs.save(graph);
    }

    return graph;
  }

  /**
   * Load a persisted graph
   */
  loadGraph(graphId) {
    if (!this._layers.immortality) {
      throw new Error('Immortality layer not initialized');
    }

    const data = this._layers.immortality.graphs.load(graphId);
    if (!data) return null;

    return ExecutionGraph.fromJSON(data);
  }

  /**
   * Set a direction vector for autonomous operation
   */
  setDirection(direction) {
    if (!this._layers.autonomous) {
      throw new Error('Autonomous layer not initialized');
    }

    return this._layers.autonomous.setDirection(direction);
  }

  /**
   * Start an autonomous improvement cycle
   */
  async runAutonomousCycle(horizonId) {
    if (!this._layers.autonomous) {
      throw new Error('Autonomous layer not initialized');
    }

    return this._layers.autonomous.startCycle(horizonId);
  }

  /**
   * Process a command
   */
  async command(input, context = {}) {
    if (this._layers.immortality?.control) {
      return this._layers.immortality.control.process(input, context);
    }

    // Fallback to direct execution
    return this.execute(input, context);
  }

  /**
   * Get forge status
   */
  getStatus() {
    const status = {
      version: this.version,
      codename: this.codename,
      status: this.status,
      layers: {}
    };

    if (this._layers.immortality) {
      status.layers.immortality = this._layers.immortality.getStatus();
    }

    if (this._layers.multiplication) {
      status.layers.multiplication = this._layers.multiplication.getMetrics();
    }

    if (this._layers.evolution) {
      status.layers.evolution = this._layers.evolution.getStats();
    }

    if (this._layers.autonomous) {
      status.layers.autonomous = this._layers.autonomous.getStatus();
    }

    return status;
  }

  /**
   * Shutdown gracefully
   */
  async shutdown() {
    console.log('[FORGE] Initiating shutdown...');

    if (this._layers.immortality) {
      this._layers.immortality.close();
    }

    if (this._layers.multiplication) {
      await this._layers.multiplication.close();
    }

    this.status = 'OFFLINE';
    console.log('[FORGE] Shutdown complete');
  }
}

// ═══════════════════════════════════════════════════════════════════
// QUICK START CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════

const QuickStart = {
  /**
   * Full system - all layers
   */
  async full(config = {}) {
    const forge = new OrbitalForge(config);
    await forge.initialize();
    return forge;
  },

  /**
   * Minimal - just core execution
   */
  async minimal(config = {}) {
    const forge = new OrbitalForge(config);
    await forge.initialize({
      immortality: false,
      multiplication: false,
      evolution: false,
      autonomous: false
    });
    return forge;
  },

  /**
   * Development - with persistence but no autonomy
   */
  async development(config = {}) {
    const forge = new OrbitalForge(config);
    await forge.initialize({
      autonomous: false
    });
    return forge;
  },

  /**
   * Production - full system with supervised autonomy
   */
  async production(config = {}) {
    const forge = new OrbitalForge({
      ...config,
      autonomous: {
        ...(config.autonomous || {}),
        director: {
          autonomyLevel: 'SUPERVISED',
          humanVeto: true
        }
      }
    });
    await forge.initialize();
    return forge;
  }
};

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // Main
  OrbitalForge,
  QuickStart,

  // Metadata
  VERSION: FORGE_VERSION,
  CODENAME: FORGE_CODENAME,
  PRIME_AXIOM,
  AUTONOMOUS_MANIFESTO,

  // Layer 0: Prime Axiom
  Prime: {
    ExecutionNode,
    ExecutionGraph,
    NODE_TYPES,
    NODE_STATUS,
    GRAPH_STATUS,
    validateGraph,
    mergeGraphs
  },

  // Layer 1: Immortality
  Immortality: {
    WatchdogTimer,
    ProcessGuard,
    AppendLog,
    StateStore,
    GraphStore,
    CommandParser,
    IntentRouter,
    ControlHub,
    Immortality
  },

  // Layer 2: Intelligence Execution
  Intelligence: {
    DecompositionEngine,
    ExecutionEngine,
    FeedbackEngine,
    IntelligenceLayer
  },

  // Layer 3: Multiplication
  Multiplication: {
    ParallelPool,
    WorkerOrchestrator,
    Checkpoint,
    ResumableExecution,
    SwarmAgent,
    SwarmMaster,
    MultiplicationLayer
  },

  // Layer 4: Evolution
  Evolution: {
    AgentTemplate,
    SkillRegistry,
    PerformanceTracker,
    AgentEvolution,
    PatternRecognizer,
    PredictiveCache,
    PlanReorderer,
    PredictiveOptimizer,
    EvolutionLayer
  },

  // Layer 5: Autonomous Creation
  Autonomous: {
    GoalHorizon,
    SandboxZone,
    ExperimentRunner,
    SelfImprovement,
    AutonomousDirector,
    AutonomousLayer
  }
};
