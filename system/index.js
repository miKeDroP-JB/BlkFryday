/**
 * 0RB SYSTEM - UNIFIED EXPORT
 * ═══════════════════════════════════════════════════════════════════
 * The Complete Reality Operating System
 * POWERED BY ORBITAL FORGE - The Reality Compiler
 *
 * "Everything you need to reshape reality, in one import."
 * ═══════════════════════════════════════════════════════════════════
 */

const SYSTEM_VERSION = '3.0.0';
const CODENAME = 'ORBITAL';

// ═══════════════════════════════════════════════════════════════════
// ORBITAL FORGE - FOUNDATIONAL LAYER
// ═══════════════════════════════════════════════════════════════════
const {
  OrbitalForge,
  QuickStart: ForgeQuickStart,
  Prime,
  Immortality: ForgeImmortality,
  Intelligence,
  Multiplication,
  Evolution,
  Autonomous,
  PRIME_AXIOM,
  AUTONOMOUS_MANIFESTO
} = require('../forge');

// ═══════════════════════════════════════════════════════════════════
// CORE SYSTEMS
// ═══════════════════════════════════════════════════════════════════

// Agent System
const AgentManager = require('./agents/AgentManager');
const AgentMemory = require('./agents/AgentMemory');
const SwarmOrchestrator = require('./agents/SwarmOrchestrator');

// Copa System
const CopaCore = require('./copa/CopaCore');

// Game Engines
const GameLauncher = require('./games/GameLauncher');
const ArchitectEngine = require('./games/engines/ArchitectEngine');
const OracleEngine = require('./games/engines/OracleEngine');
const PantheonEngine = require('./games/engines/PantheonEngine');
const ForgeEngine = require('./games/engines/ForgeEngine');
const EmpireEngine = require('./games/engines/EmpireEngine');
const EchoEngine = require('./games/engines/EchoEngine');
const InfiniteEngine = require('./games/engines/InfiniteEngine');

// Neural Systems
const NeuralRouter = require('./ai/NeuralRouter');
const NeuralLink = require('./network/NeuralLink');

// Crypto
const CryptoEngine = require('./crypto/CryptoEngine');

// Sales
const SalesEngine = require('./sales/SalesEngine');

// ═══════════════════════════════════════════════════════════════════
// SOVEREIGN SYSTEMS (NEW)
// ═══════════════════════════════════════════════════════════════════

// Quantum Engine - Probability field optimization
const {
  QuantumEngine,
  QuantumOptimizer,
  QuantumField,
  QuantumDecisionNode,
  WaveFunction,
  ProbabilityMatrix,
  QUANTUM_STATES,
  OPTIMIZATION_FIELDS,
  ALGORITHMS: QUANTUM_ALGORITHMS
} = require('./quantum/QuantumEngine');

// Nexus Protocol - Universal integration hub
const {
  NexusProtocol,
  Connector,
  RESTConnector,
  WebSocketConnector,
  DataPipeline,
  TransformStage,
  EventRouter,
  SchemaRegistry,
  PROTOCOLS,
  CONNECTOR_CATEGORIES,
  INTEGRATION_TEMPLATES
} = require('./nexus/NexusProtocol');

// Genesis System - Self-replicating template engine
const {
  GenesisSystem,
  ProjectScaffold,
  BlueprintRegistry,
  ComponentBlueprint,
  IntentParser,
  CREATION_ARCHETYPES,
  TECH_STACKS
} = require('./genesis/GenesisSystem');

// Sovereign SDK - Developer extension tools
const {
  SovereignSDK,
  Extension,
  AgentExtension,
  GameExtension,
  ConnectorExtension,
  PluginExtension,
  ExtensionRegistry,
  EventEmitter,
  DevConsole,
  EXTENSION_TYPES,
  SDK_EVENTS
} = require('./sdk/SovereignSDK');

// Hive Governance - Decentralized decision protocol
const {
  HiveGovernance,
  Proposal,
  Council,
  DelegationSystem,
  VotingPowerCalculator,
  GOVERNANCE_MODELS,
  PROPOSAL_CATEGORIES,
  PROPOSAL_STATES,
  VOTE_TYPES
} = require('./governance/HiveGovernance');

// ═══════════════════════════════════════════════════════════════════
// SYSTEM INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Initialize the complete 0RB System
 */
async function initializeSystem(config = {}) {
  console.log(`
  ╔═══════════════════════════════════════════════════════════════════╗
  ║                                                                   ║
  ║   ██████╗ ██████╗ ██████╗     ███████╗██╗   ██╗███████╗████████╗  ║
  ║  ██╔═══██╗██╔══██╗██╔══██╗    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝  ║
  ║  ██║   ██║██████╔╝██████╔╝    ███████╗ ╚████╔╝ ███████╗   ██║     ║
  ║  ██║   ██║██╔══██╗██╔══██╗    ╚════██║  ╚██╔╝  ╚════██║   ██║     ║
  ║  ╚██████╔╝██║  ██║██████╔╝    ███████║   ██║   ███████║   ██║     ║
  ║   ╚═════╝ ╚═╝  ╚═╝╚═════╝     ╚══════╝   ╚═╝   ╚══════╝   ╚═╝     ║
  ║                                                                   ║
  ║                    THE SIMULATION AWAKENS                         ║
  ║                     Version ${SYSTEM_VERSION} - ${CODENAME}                       ║
  ║                                                                   ║
  ╚═══════════════════════════════════════════════════════════════════╝
  `);

  const systems = {
    // ORBITAL FORGE - The Foundation
    forge: null,

    // Core
    agents: null,
    memory: null,
    swarm: null,
    copa: null,
    games: null,
    neural: null,
    network: null,
    crypto: null,
    sales: null,

    // Sovereign
    quantum: null,
    nexus: null,
    genesis: null,
    sdk: null,
    governance: null
  };

  // Initialize Orbital Forge FIRST - it's the foundation
  if (config.forge !== false) {
    systems.forge = new OrbitalForge(config.forgeConfig || {});
    await systems.forge.initialize(config.forgeOptions || {});
    console.log('🜂 Orbital Forge online - Reality compiler operational');
  }

  // Initialize based on config
  if (config.agents !== false) {
    systems.agents = new AgentManager.AgentManager(config.agentsConfig);
    systems.memory = new AgentMemory.AgentMemory();
    systems.swarm = new SwarmOrchestrator.SwarmOrchestrator();
    console.log('✓ Agent System initialized');
  }

  if (config.copa !== false) {
    systems.copa = new CopaCore.CopaCore();
    console.log('✓ Copa System initialized');
  }

  if (config.games !== false) {
    systems.games = {
      launcher: new GameLauncher.GameLauncher(),
      architect: new ArchitectEngine.ArchitectEngine(),
      oracle: new OracleEngine.OracleEngine(),
      pantheon: new PantheonEngine.PantheonEngine(),
      forge: new ForgeEngine.ForgeEngine(),
      empire: new EmpireEngine.EmpireEngine(),
      echo: new EchoEngine.EchoEngine(),
      infinite: new InfiniteEngine.InfiniteEngine()
    };
    console.log('✓ Game Engines initialized');
  }

  if (config.neural !== false) {
    systems.neural = new NeuralRouter.NeuralRouter();
    console.log('✓ Neural Router initialized');
  }

  if (config.network !== false) {
    systems.network = new NeuralLink.NeuralLink();
    console.log('✓ Neural Link initialized');
  }

  if (config.crypto !== false) {
    systems.crypto = new CryptoEngine.CryptoEngine();
    console.log('✓ Crypto Engine initialized');
  }

  if (config.sales !== false) {
    systems.sales = new SalesEngine.SalesEngine();
    console.log('✓ Sales Engine initialized');
  }

  // Initialize Sovereign Systems
  if (config.quantum !== false) {
    systems.quantum = new QuantumEngine();
    console.log('✓ Quantum Engine initialized');
  }

  if (config.nexus !== false) {
    systems.nexus = new NexusProtocol();
    console.log('✓ Nexus Protocol initialized');
  }

  if (config.genesis !== false) {
    systems.genesis = new GenesisSystem();
    console.log('✓ Genesis System initialized');
  }

  if (config.sdk !== false) {
    systems.sdk = new SovereignSDK(config.sdkConfig);
    await systems.sdk.initialize();
    console.log('✓ Sovereign SDK initialized');
  }

  if (config.governance !== false) {
    systems.governance = new HiveGovernance(config.governanceConfig);
    console.log('✓ Hive Governance initialized');
  }

  console.log('\n🌟 0RB System fully operational\n');

  return systems;
}

/**
 * Quick start for common use cases
 */
const QuickStart = {
  /**
   * Start a full development environment
   */
  async development() {
    return initializeSystem({
      agentsConfig: { mode: 'development' },
      sdkConfig: { mode: 'development' }
    });
  },

  /**
   * Start production system
   */
  async production() {
    return initializeSystem({
      agentsConfig: { mode: 'production' },
      sdkConfig: { mode: 'production' },
      governanceConfig: { model: 'TOKEN_WEIGHTED' }
    });
  },

  /**
   * Minimal system for testing
   */
  async minimal() {
    return initializeSystem({
      copa: false,
      games: false,
      network: false,
      crypto: false,
      sales: false
    });
  },

  /**
   * AI-focused configuration
   */
  async aiFirst() {
    return initializeSystem({
      crypto: false,
      governance: false,
      agentsConfig: { preload: ['apollo', 'athena', 'hephaestus'] }
    });
  }
};

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // Meta
  VERSION: SYSTEM_VERSION,
  CODENAME,
  initializeSystem,
  QuickStart,

  // ═══════════════════════════════════════════════════════════════
  // ORBITAL FORGE - THE REALITY COMPILER
  // ═══════════════════════════════════════════════════════════════
  OrbitalForge,
  ForgeQuickStart,
  Prime,
  ForgeImmortality,
  Intelligence,
  Multiplication,
  Evolution,
  Autonomous,
  PRIME_AXIOM,
  AUTONOMOUS_MANIFESTO,

  // Core Systems
  AgentManager,
  AgentMemory,
  SwarmOrchestrator,
  CopaCore,
  GameLauncher,
  NeuralRouter,
  NeuralLink,
  CryptoEngine,
  SalesEngine,

  // Game Engines
  Games: {
    ArchitectEngine,
    OracleEngine,
    PantheonEngine,
    ForgeEngine,
    EmpireEngine,
    EchoEngine,
    InfiniteEngine
  },

  // Sovereign Systems
  Quantum: {
    QuantumEngine,
    QuantumOptimizer,
    QuantumField,
    QuantumDecisionNode,
    WaveFunction,
    ProbabilityMatrix,
    QUANTUM_STATES,
    OPTIMIZATION_FIELDS,
    ALGORITHMS: QUANTUM_ALGORITHMS
  },

  Nexus: {
    NexusProtocol,
    Connector,
    RESTConnector,
    WebSocketConnector,
    DataPipeline,
    TransformStage,
    EventRouter,
    SchemaRegistry,
    PROTOCOLS,
    CONNECTOR_CATEGORIES,
    INTEGRATION_TEMPLATES
  },

  Genesis: {
    GenesisSystem,
    ProjectScaffold,
    BlueprintRegistry,
    ComponentBlueprint,
    IntentParser,
    CREATION_ARCHETYPES,
    TECH_STACKS
  },

  SDK: {
    SovereignSDK,
    Extension,
    AgentExtension,
    GameExtension,
    ConnectorExtension,
    PluginExtension,
    ExtensionRegistry,
    EventEmitter,
    DevConsole,
    EXTENSION_TYPES,
    SDK_EVENTS
  },

  Governance: {
    HiveGovernance,
    Proposal,
    Council,
    DelegationSystem,
    VotingPowerCalculator,
    GOVERNANCE_MODELS,
    PROPOSAL_CATEGORIES,
    PROPOSAL_STATES,
    VOTE_TYPES
  }
};
