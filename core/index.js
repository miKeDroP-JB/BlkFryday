/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║    ██████╗ ██████╗ ██████╗ ██████╗     ██╗   ██╗███╗   ██╗██╗███████╗██╗ ║
 * ║   ██╔═══██╗██╔══██╗██╔══██╗ ██╔══██╗    ██║   ██║████╗  ██║██║██╔════╝██║ ║
 * ║   ██║   ██║██████╔╝██████╔╝ ██████╔╝    ██║   ██║██╔██╗ ██║██║█████╗  ██║ ║
 * ║   ██║   ██║██╔══██╗██╔══██╗ ██╔══██╗    ██║   ██║██║╚██╗██║██║██╔══╝  ██║ ║
 * ║   ╚██████╔╝██║  ██║██████╔╝ ██████╔╝    ╚██████╔╝██║ ╚████║██║██║     ██║ ║
 * ║    ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝      ╚═════╝ ╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝ ║
 * ║                                                                           ║
 * ║   THE UNIFIED SYSTEM - EVERYTHING CONNECTED                               ║
 * ║   AI + Agents + Crypto + Factory = Infinite Leverage                      ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORE AI INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════════════════

const {
  BaseProvider,
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
  GroqProvider,
  ProviderRegistry
} = require('./ai/providers');

const { AIEngine, ToolExecutor } = require('./ai/engine');

// ═══════════════════════════════════════════════════════════════════════════
// AGENT EXECUTION SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const {
  Agent,
  AgentExecutor,
  AGENT_ARCHETYPES,
  AGENT_PROMPTS
} = require('./agents/executor');

// ═══════════════════════════════════════════════════════════════════════════
// COMPANY FACTORY - THE META-SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const {
  CompanyFactory,
  COMPANY_BLUEPRINTS,
  WORKFLOW_PHASES
} = require('./factory/company-builder');

// ═══════════════════════════════════════════════════════════════════════════
// CRYPTO/WEB3 INFRASTRUCTURE
// ═══════════════════════════════════════════════════════════════════════════

const {
  Web3Engine,
  ContractManager,
  WalletConnector,
  TransactionManager,
  CONTRACT_ABIS,
  NETWORK_CONFIG
} = require('./crypto/web3-engine');

// ═══════════════════════════════════════════════════════════════════════════
// ORCHESTRATION LAYER
// ═══════════════════════════════════════════════════════════════════════════

const { EventEmitter } = require('events');

/**
 * ORB Core - The unified system controller
 * This is the "one ring to rule them all" - connects every subsystem
 */
class ORBCore extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      // AI Configuration
      ai: {
        defaultProvider: config.ai?.defaultProvider || 'openai',
        maxTurns: config.ai?.maxTurns || 10,
        temperature: config.ai?.temperature || 0.7,
        ...config.ai
      },

      // Crypto Configuration
      crypto: {
        network: config.crypto?.network || 'base',
        autoConnect: config.crypto?.autoConnect || false,
        ...config.crypto
      },

      // Agent Configuration
      agents: {
        maxConcurrent: config.agents?.maxConcurrent || 5,
        defaultArchetype: config.agents?.defaultArchetype || 'APOLLO',
        ...config.agents
      },

      // Factory Configuration
      factory: {
        defaultBlueprint: config.factory?.defaultBlueprint || 'SAAS',
        outputDir: config.factory?.outputDir || './output',
        ...config.factory
      }
    };

    // System state
    this.state = {
      initialized: false,
      subsystems: {
        ai: false,
        agents: false,
        crypto: false,
        factory: false
      }
    };

    // Subsystem instances
    this.ai = null;
    this.agents = null;
    this.crypto = null;
    this.factory = null;

    // Active sessions
    this.sessions = new Map();
  }

  /**
   * Initialize the entire system
   */
  async initialize() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          ⟡ ORB CORE - SYSTEM INITIALIZATION ⟡              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
      // Initialize AI Engine
      console.log('⟡ Initializing AI Engine...');
      this.ai = new AIEngine({
        defaultProvider: this.config.ai.defaultProvider,
        maxTurns: this.config.ai.maxTurns
      });
      this.state.subsystems.ai = true;
      console.log('  ✓ AI Engine ready');

      // Initialize Agent Executor
      console.log('⟡ Initializing Agent Executor...');
      this.agents = new AgentExecutor({
        engine: this.ai,
        maxConcurrent: this.config.agents.maxConcurrent
      });
      this.state.subsystems.agents = true;
      console.log('  ✓ Agent Executor ready');

      // Initialize Crypto/Web3 Engine
      console.log('⟡ Initializing Web3 Engine...');
      this.crypto = new Web3Engine({
        network: this.config.crypto.network
      });
      if (this.config.crypto.autoConnect) {
        await this.crypto.connect();
      }
      this.state.subsystems.crypto = true;
      console.log('  ✓ Web3 Engine ready');

      // Initialize Company Factory
      console.log('⟡ Initializing Company Factory...');
      this.factory = new CompanyFactory({
        agents: this.agents,
        outputDir: this.config.factory.outputDir
      });
      this.state.subsystems.factory = true;
      console.log('  ✓ Company Factory ready');

      // Wire up cross-system events
      this._wireEvents();

      this.state.initialized = true;

      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║               ⟡ ALL SYSTEMS OPERATIONAL ⟡                  ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      this.emit('core:initialized', { subsystems: this.state.subsystems });

      return this;

    } catch (error) {
      console.error('⟡ INITIALIZATION FAILED:', error.message);
      this.emit('core:error', error);
      throw error;
    }
  }

  /**
   * Wire cross-system events
   */
  _wireEvents() {
    // Agent completion -> Log & potentially mint NFT
    this.agents.on('agent:complete', async (result) => {
      console.log(`[ORB CORE] Agent ${result.archetype} completed task`);

      // Could automatically record on-chain
      if (this.crypto.isConnected) {
        // this.crypto.recordTaskCompletion(result);
      }
    });

    // Factory phase completion -> Emit progress
    this.factory.on('phase:complete', (phase) => {
      console.log(`[ORB CORE] Factory phase complete: ${phase.name}`);
      this.emit('build:progress', phase);
    });

    // Crypto transactions -> Log
    this.crypto.on('transaction:confirmed', (tx) => {
      console.log(`[ORB CORE] Transaction confirmed: ${tx.hash}`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HIGH-LEVEL API - THE USER-FACING METHODS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Run an AI task with the best available model
   */
  async think(prompt, options = {}) {
    if (!this.state.subsystems.ai) {
      throw new Error('AI subsystem not initialized');
    }

    return this.ai.run(
      options.systemPrompt || 'You are an expert AI assistant.',
      prompt,
      options
    );
  }

  /**
   * Execute a task with a specific agent archetype
   */
  async deploy(archetype, task, context = {}) {
    if (!this.state.subsystems.agents) {
      throw new Error('Agent subsystem not initialized');
    }

    return this.agents.execute(archetype, task, context);
  }

  /**
   * Deploy a swarm of agents to tackle a complex goal
   */
  async swarm(goal, options = {}) {
    if (!this.state.subsystems.agents) {
      throw new Error('Agent subsystem not initialized');
    }

    const agents = options.agents || ['APOLLO', 'ATHENA', 'HERMES'];
    const results = [];

    for (const archetype of agents) {
      const result = await this.deploy(archetype, goal, {
        previousResults: results,
        ...options.context
      });
      results.push({ archetype, result });
    }

    return results;
  }

  /**
   * Build an entire company/product from a single objective
   */
  async build(objective, options = {}) {
    if (!this.state.subsystems.factory) {
      throw new Error('Factory subsystem not initialized');
    }

    const blueprint = options.blueprint || this.config.factory.defaultBlueprint;

    return this.factory.build(blueprint, objective, options);
  }

  /**
   * Connect crypto wallet
   */
  async connectWallet(options = {}) {
    if (!this.state.subsystems.crypto) {
      throw new Error('Crypto subsystem not initialized');
    }

    return this.crypto.connectWallet(options);
  }

  /**
   * Mint an agent NFT
   */
  async mintAgent(archetype, options = {}) {
    if (!this.state.subsystems.crypto) {
      throw new Error('Crypto subsystem not initialized');
    }

    return this.crypto.contracts.agentNFT.mint(archetype, options);
  }

  /**
   * Stake tokens
   */
  async stake(amount, options = {}) {
    if (!this.state.subsystems.crypto) {
      throw new Error('Crypto subsystem not initialized');
    }

    return this.crypto.contracts.staking.stake(amount, options);
  }

  /**
   * List agent for rental
   */
  async listForRent(tokenId, dailyRate, options = {}) {
    if (!this.state.subsystems.crypto) {
      throw new Error('Crypto subsystem not initialized');
    }

    return this.crypto.contracts.marketplace.listForRent(tokenId, dailyRate, options);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONVENIENCE METHODS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get full system status
   */
  getStatus() {
    return {
      initialized: this.state.initialized,
      subsystems: {
        ai: {
          active: this.state.subsystems.ai,
          provider: this.ai?.currentProvider || null
        },
        agents: {
          active: this.state.subsystems.agents,
          available: Object.keys(AGENT_ARCHETYPES)
        },
        crypto: {
          active: this.state.subsystems.crypto,
          connected: this.crypto?.isConnected || false,
          network: this.config.crypto.network
        },
        factory: {
          active: this.state.subsystems.factory,
          blueprints: Object.keys(COMPANY_BLUEPRINTS)
        }
      },
      activeSessions: this.sessions.size
    };
  }

  /**
   * Create an isolated session for parallel work
   */
  createSession(id) {
    const session = {
      id: id || `session-${Date.now()}`,
      created: Date.now(),
      tasks: [],
      results: []
    };
    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Shutdown the system gracefully
   */
  async shutdown() {
    console.log('\n⟡ Shutting down ORB Core...');

    // Close crypto connections
    if (this.crypto?.isConnected) {
      await this.crypto.disconnect();
    }

    // Clear sessions
    this.sessions.clear();

    // Reset state
    this.state.initialized = false;
    Object.keys(this.state.subsystems).forEach(k => {
      this.state.subsystems[k] = false;
    });

    console.log('⟡ ORB Core shutdown complete\n');

    this.emit('core:shutdown');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUICK START FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Quick-start the entire system with sensible defaults
 */
async function createORB(config = {}) {
  const orb = new ORBCore(config);
  await orb.initialize();
  return orb;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Main orchestrator
  ORBCore,
  createORB,

  // AI Layer
  AIEngine,
  ToolExecutor,
  ProviderRegistry,
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
  GroqProvider,

  // Agent Layer
  Agent,
  AgentExecutor,
  AGENT_ARCHETYPES,
  AGENT_PROMPTS,

  // Factory Layer
  CompanyFactory,
  COMPANY_BLUEPRINTS,
  WORKFLOW_PHASES,

  // Crypto Layer
  Web3Engine,
  ContractManager,
  WalletConnector,
  TransactionManager,
  CONTRACT_ABIS,
  NETWORK_CONFIG
};
