/**
 * ORBITAL FORGE - LAYER 2: INTELLIGENCE EXECUTION
 * ═══════════════════════════════════════════════════════════════════
 * Node 4: Decomposition Engine - Vague desire dies, structure is born
 * Node 5: Execution Engine - Progress is mechanical
 * Node 6: Feedback & Repair - The system heals itself
 *
 * "Steps become actions. Actions are idempotent. Failures are localized."
 * ═══════════════════════════════════════════════════════════════════
 */

const { EventEmitter } = require('events');
const { ExecutionNode, ExecutionGraph, NODE_TYPES, NODE_STATUS } = require('./prime');

// ═══════════════════════════════════════════════════════════════════
// NODE 4: DECOMPOSITION ENGINE
// ═══════════════════════════════════════════════════════════════════

/**
 * DecompositionEngine - Transform intent into executable graph
 *
 * Input: "Do X"
 * Output: dependency graph, atomic steps, parallelizable paths
 */
class DecompositionEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.maxDepth = config.maxDepth || 10;
    this.templates = new Map();
    this.decomposers = [];
    this.trivialityThreshold = config.trivialityThreshold || 5; // minutes
  }

  /**
   * Register a decomposition template
   */
  registerTemplate(pattern, template) {
    this.templates.set(pattern, template);
    return this;
  }

  /**
   * Register a decomposer function
   */
  registerDecomposer(fn) {
    this.decomposers.push(fn);
    return this;
  }

  /**
   * Decompose an intent into an execution graph
   */
  async decompose(intent, context = {}) {
    console.log(`[DECOMPOSE] Starting: "${intent}"`);
    this.emit('start', { intent });

    const graph = new ExecutionGraph({
      name: `Decomposition: ${intent.slice(0, 50)}`,
      intent
    });

    try {
      // Check for matching template first
      const template = this.findTemplate(intent);
      if (template) {
        return this.applyTemplate(template, intent, context);
      }

      // Recursive decomposition
      const rootNode = await this.decomposeRecursive(intent, context, 0);
      this.buildGraph(graph, rootNode);

      // Optimize graph
      this.optimize(graph);

      this.emit('complete', { graph, nodeCount: graph.nodes.size });
      console.log(`[DECOMPOSE] Complete: ${graph.nodes.size} nodes`);

      return graph;
    } catch (error) {
      this.emit('error', { intent, error });
      throw error;
    }
  }

  /**
   * Recursive decomposition - "What must be true before this?"
   */
  async decomposeRecursive(intent, context, depth) {
    // Check depth limit
    if (depth >= this.maxDepth) {
      return this.createLeafNode(intent, 'MAX_DEPTH');
    }

    // Check if intent is trivial
    if (this.isTrivial(intent)) {
      return this.createLeafNode(intent, 'TRIVIAL');
    }

    // Try decomposers
    for (const decomposer of this.decomposers) {
      const result = await decomposer(intent, context);
      if (result && result.steps && result.steps.length > 0) {
        // Recursively decompose each step
        const children = await Promise.all(
          result.steps.map(step =>
            this.decomposeRecursive(step.intent || step, context, depth + 1)
          )
        );

        return {
          intent,
          type: result.type || NODE_TYPES.COMPOSITE,
          children,
          parallel: result.parallel || false
        };
      }
    }

    // Default decomposition - ask LLM or return as leaf
    return this.defaultDecompose(intent, context, depth);
  }

  /**
   * Default decomposition strategy
   */
  async defaultDecompose(intent, context, depth) {
    // Built-in simple heuristics
    const patterns = [
      {
        match: /^(create|build|make)\s+(.+)/i,
        decompose: (m) => ({
          steps: [
            { intent: `Plan ${m[2]}` },
            { intent: `Implement ${m[2]}` },
            { intent: `Verify ${m[2]}` }
          ]
        })
      },
      {
        match: /^(research|investigate|analyze)\s+(.+)/i,
        decompose: (m) => ({
          steps: [
            { intent: `Gather information about ${m[2]}` },
            { intent: `Analyze findings about ${m[2]}` },
            { intent: `Synthesize conclusions about ${m[2]}` }
          ],
          parallel: false
        })
      },
      {
        match: /^(deploy|launch|release)\s+(.+)/i,
        decompose: (m) => ({
          steps: [
            { intent: `Prepare ${m[2]} for deployment` },
            { intent: `Execute deployment of ${m[2]}` },
            { intent: `Verify deployment of ${m[2]}` }
          ]
        })
      }
    ];

    for (const pattern of patterns) {
      const match = intent.match(pattern.match);
      if (match) {
        const result = pattern.decompose(match);
        const children = await Promise.all(
          result.steps.map(step =>
            this.decomposeRecursive(step.intent, context, depth + 1)
          )
        );

        return {
          intent,
          type: NODE_TYPES.COMPOSITE,
          children,
          parallel: result.parallel || false
        };
      }
    }

    // If no pattern matches, treat as atomic
    return this.createLeafNode(intent, 'ATOMIC');
  }

  /**
   * Create a leaf node (atomic task)
   */
  createLeafNode(intent, reason) {
    return {
      intent,
      type: NODE_TYPES.TASK,
      children: [],
      reason
    };
  }

  /**
   * Check if intent is trivial (doesn't need decomposition)
   */
  isTrivial(intent) {
    // Heuristics for trivial tasks
    const trivialPatterns = [
      /^(log|print|echo|output|display)\s+/i,
      /^(set|assign|update)\s+\w+\s+(to|=)/i,
      /^(read|get|fetch)\s+\w+$/i,
      /^(wait|sleep|delay)\s+/i,
      /^(check|verify|validate)\s+\w+$/i
    ];

    return trivialPatterns.some(p => p.test(intent));
  }

  /**
   * Find matching template
   */
  findTemplate(intent) {
    for (const [pattern, template] of this.templates) {
      if (typeof pattern === 'string' && intent.includes(pattern)) {
        return template;
      }
      if (pattern instanceof RegExp && pattern.test(intent)) {
        return template;
      }
    }
    return null;
  }

  /**
   * Apply a template to create graph
   */
  applyTemplate(template, intent, context) {
    const graph = new ExecutionGraph({
      name: `Template: ${template.name}`,
      intent
    });

    // Clone template nodes with context
    template.nodes.forEach(nodeConfig => {
      const node = new ExecutionNode({
        ...nodeConfig,
        intent: this.interpolate(nodeConfig.intent, { intent, ...context })
      });
      graph.addNode(node);
    });

    return graph;
  }

  /**
   * Interpolate variables in string
   */
  interpolate(str, vars) {
    return str.replace(/\$\{(\w+)\}/g, (match, key) => vars[key] || match);
  }

  /**
   * Build graph from decomposition tree
   */
  buildGraph(graph, tree, parentIds = []) {
    const node = new ExecutionNode({
      type: tree.type,
      intent: tree.intent,
      dependencies: parentIds
    });

    graph.addNode(node);

    if (tree.children && tree.children.length > 0) {
      if (tree.parallel) {
        // Children execute in parallel, all depend on this node
        tree.children.forEach(child => {
          this.buildGraph(graph, child, [node.id]);
        });
      } else {
        // Children execute sequentially
        let prevIds = [node.id];
        tree.children.forEach(child => {
          const childNode = this.buildGraph(graph, child, prevIds);
          prevIds = [childNode.id];
        });
      }
    }

    return node;
  }

  /**
   * Optimize graph (remove redundancies, identify parallelism)
   */
  optimize(graph) {
    // Find independent nodes that can run in parallel
    const waves = graph.getParallelWaves();

    // Tag nodes with wave info for executor
    waves.forEach((wave, index) => {
      wave.forEach(nodeId => {
        const node = graph.nodes.get(nodeId);
        if (node) {
          node.metadata.wave = index;
          node.metadata.parallelizable = wave.length > 1;
        }
      });
    });

    return graph;
  }
}

// ═══════════════════════════════════════════════════════════════════
// NODE 5: EXECUTION ENGINE
// ═══════════════════════════════════════════════════════════════════

/**
 * ExecutionEngine - Steps become actions
 *
 * Actions are idempotent. Failures are localized.
 */
class ExecutionEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.executors = new Map();
    this.maxConcurrency = config.maxConcurrency || 5;
    this.defaultTimeout = config.defaultTimeout || 60000;
    this.activeExecutions = new Map();
  }

  /**
   * Register an executor for a node type
   */
  registerExecutor(type, executor) {
    this.executors.set(type, executor);
    return this;
  }

  /**
   * Execute an entire graph
   */
  async executeGraph(graph, context = {}) {
    console.log(`[EXECUTE] Starting graph: ${graph.id}`);
    this.emit('graph:start', { graphId: graph.id });

    graph.status = 'RUNNING';
    graph.metadata.startedAt = Date.now();

    try {
      // Execute in waves
      const waves = graph.getParallelWaves();

      for (let waveIndex = 0; waveIndex < waves.length; waveIndex++) {
        const wave = waves[waveIndex];
        console.log(`[EXECUTE] Wave ${waveIndex + 1}/${waves.length}: ${wave.length} nodes`);

        await this.executeWave(graph, wave, context);

        // Check for failures
        const failed = wave.filter(nodeId => {
          const node = graph.nodes.get(nodeId);
          return node && node.status === 'FAILED';
        });

        if (failed.length > 0) {
          console.log(`[EXECUTE] Wave had ${failed.length} failures`);
          // Continue with nodes that don't depend on failed ones
        }
      }

      // Determine final status
      const progress = graph.getProgress();
      graph.status = progress.failed > 0 ? 'PARTIAL' : 'COMPLETED';
      graph.metadata.completedAt = Date.now();

      this.emit('graph:complete', {
        graphId: graph.id,
        status: graph.status,
        progress
      });

      return {
        success: progress.failed === 0,
        graph,
        progress
      };

    } catch (error) {
      graph.status = 'FAILED';
      this.emit('graph:error', { graphId: graph.id, error });
      throw error;
    }
  }

  /**
   * Execute a wave of nodes (parallel execution)
   */
  async executeWave(graph, nodeIds, context) {
    const promises = nodeIds.map(async nodeId => {
      const node = graph.nodes.get(nodeId);
      if (!node) return;

      // Skip if dependencies failed
      const depsFailed = node.dependencies.some(depId => {
        const dep = graph.nodes.get(depId);
        return dep && dep.status === 'FAILED';
      });

      if (depsFailed) {
        node.status = 'BLOCKED';
        return;
      }

      return this.executeNode(node, graph, context);
    });

    // Respect concurrency limit
    const results = [];
    for (let i = 0; i < promises.length; i += this.maxConcurrency) {
      const batch = promises.slice(i, i + this.maxConcurrency);
      const batchResults = await Promise.allSettled(batch);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Execute a single node
   */
  async executeNode(node, graph, context) {
    console.log(`[EXECUTE] Node: ${node.id} - "${node.intent}"`);
    this.emit('node:start', { nodeId: node.id, intent: node.intent });

    node.start();

    // Collect dependency outputs
    const dependencyOutputs = node.dependencies.map(depId => {
      const dep = graph.nodes.get(depId);
      return dep?.outputs[0]?.data;
    }).filter(Boolean);

    try {
      // Get executor
      const executor = this.executors.get(node.type) || this.executors.get('default');

      if (!executor) {
        throw new Error(`No executor for type: ${node.type}`);
      }

      // Execute with timeout
      const result = await Promise.race([
        executor(node, { ...context, dependencyOutputs }),
        this.timeout(node.metadata.timeout || this.defaultTimeout)
      ]);

      node.complete(result);

      this.emit('node:complete', {
        nodeId: node.id,
        result,
        duration: Date.now() - node.metadata.lastAttempt
      });

      return result;

    } catch (error) {
      node.fail(error);

      this.emit('node:error', {
        nodeId: node.id,
        error: error.message,
        attempts: node.metadata.attempts
      });

      throw error;
    }
  }

  /**
   * Create timeout promise
   */
  timeout(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    });
  }

  /**
   * Register default executors
   */
  registerDefaults() {
    // Default task executor - just resolves
    this.registerExecutor('default', async (node, context) => {
      return {
        executed: true,
        intent: node.intent,
        timestamp: Date.now()
      };
    });

    // Task executor
    this.registerExecutor(NODE_TYPES.TASK, async (node, context) => {
      // In production, this would delegate to AI/agents
      return {
        executed: true,
        intent: node.intent,
        output: `Completed: ${node.intent}`,
        timestamp: Date.now()
      };
    });

    // Agent executor
    this.registerExecutor(NODE_TYPES.AGENT, async (node, context) => {
      const agent = context.agents?.[node.executor];
      if (agent) {
        return agent.execute(node.intent, context);
      }
      return { executed: true, intent: node.intent };
    });

    return this;
  }
}

// ═══════════════════════════════════════════════════════════════════
// NODE 6: FEEDBACK & REPAIR
// ═══════════════════════════════════════════════════════════════════

/**
 * FeedbackEngine - Failures are signals, not setbacks
 *
 * Broken nodes get isolated and fixed.
 */
class FeedbackEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.backoffMultiplier = config.backoffMultiplier || 2;
    this.errorPatterns = new Map();
    this.repairStrategies = new Map();
    this.metrics = {
      totalFailures: 0,
      repaired: 0,
      escalated: 0
    };
  }

  /**
   * Register error pattern and repair strategy
   */
  registerRepair(pattern, strategy) {
    if (typeof pattern === 'string') {
      pattern = new RegExp(pattern, 'i');
    }
    this.repairStrategies.set(pattern, strategy);
    return this;
  }

  /**
   * Handle node failure
   */
  async handleFailure(node, error, graph, executor) {
    this.metrics.totalFailures++;
    this.emit('failure', { nodeId: node.id, error: error.message });

    console.log(`[REPAIR] Handling failure: ${node.id} - ${error.message}`);

    // Check retry count
    if (node.metadata.attempts >= this.maxRetries) {
      return this.escalate(node, error, 'MAX_RETRIES');
    }

    // Try to find matching repair strategy
    const strategy = this.findStrategy(error);
    if (strategy) {
      try {
        const repaired = await strategy(node, error, { graph, executor });
        if (repaired) {
          this.metrics.repaired++;
          this.emit('repaired', { nodeId: node.id });
          return { repaired: true, node };
        }
      } catch (repairError) {
        console.log(`[REPAIR] Strategy failed: ${repairError.message}`);
      }
    }

    // Default: retry with backoff
    return this.retry(node, graph, executor);
  }

  /**
   * Find matching repair strategy
   */
  findStrategy(error) {
    const message = error.message || String(error);

    for (const [pattern, strategy] of this.repairStrategies) {
      if (pattern.test(message)) {
        return strategy;
      }
    }

    return null;
  }

  /**
   * Retry node execution
   */
  async retry(node, graph, executor) {
    const delay = this.retryDelay *
      Math.pow(this.backoffMultiplier, node.metadata.attempts - 1);

    console.log(`[REPAIR] Retrying ${node.id} in ${delay}ms`);
    this.emit('retry', { nodeId: node.id, delay, attempt: node.metadata.attempts });

    await new Promise(resolve => setTimeout(resolve, delay));

    node.reset();

    try {
      await executor.executeNode(node, graph, {});
      this.metrics.repaired++;
      return { repaired: true, node };
    } catch (error) {
      return this.handleFailure(node, error, graph, executor);
    }
  }

  /**
   * Escalate unrecoverable failure
   */
  escalate(node, error, reason) {
    this.metrics.escalated++;
    this.emit('escalate', { nodeId: node.id, error: error.message, reason });

    console.log(`[REPAIR] Escalating: ${node.id} - ${reason}`);

    return {
      repaired: false,
      escalated: true,
      reason,
      node
    };
  }

  /**
   * Register default repair strategies
   */
  registerDefaults() {
    // Network errors - retry
    this.registerRepair(/network|timeout|ECONNREFUSED/i, async (node) => {
      console.log('[REPAIR] Network error - will retry');
      return false; // Let default retry handle it
    });

    // Rate limit - wait and retry
    this.registerRepair(/rate.?limit|429|too.?many/i, async (node, error) => {
      console.log('[REPAIR] Rate limited - waiting 60s');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return false;
    });

    // Authentication - escalate immediately
    this.registerRepair(/auth|401|403|permission/i, async (node, error) => {
      console.log('[REPAIR] Auth error - escalating');
      return false;
    });

    return this;
  }

  /**
   * Get repair metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      repairRate: this.metrics.totalFailures > 0
        ? (this.metrics.repaired / this.metrics.totalFailures * 100).toFixed(1) + '%'
        : 'N/A'
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// INTELLIGENCE EXECUTION COMPOSITE
// ═══════════════════════════════════════════════════════════════════

/**
 * IntelligenceLayer - Complete Layer 2 system
 */
class IntelligenceLayer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.decomposer = new DecompositionEngine(config.decomposition);
    this.executor = new ExecutionEngine(config.execution);
    this.feedback = new FeedbackEngine(config.feedback);

    // Wire up error handling
    this.executor.on('node:error', async ({ nodeId, error }) => {
      const node = this.currentGraph?.nodes.get(nodeId);
      if (node) {
        await this.feedback.handleFailure(
          node,
          new Error(error),
          this.currentGraph,
          this.executor
        );
      }
    });

    this.currentGraph = null;
  }

  /**
   * Initialize with default handlers
   */
  initialize() {
    this.executor.registerDefaults();
    this.feedback.registerDefaults();
    return this;
  }

  /**
   * Execute an intent from start to finish
   */
  async execute(intent, context = {}) {
    console.log(`\n[INTELLIGENCE] ═══════════════════════════════════════`);
    console.log(`[INTELLIGENCE] Intent: "${intent}"`);
    console.log(`[INTELLIGENCE] ═══════════════════════════════════════\n`);

    // Phase 1: Decompose
    const graph = await this.decomposer.decompose(intent, context);
    this.currentGraph = graph;
    this.emit('decomposed', { graph });

    // Phase 2: Execute
    const result = await this.executor.executeGraph(graph, context);
    this.emit('executed', { result });

    // Phase 3: Report
    const report = {
      intent,
      graph: graph.toJSON(),
      result: result.progress,
      metrics: this.feedback.getMetrics()
    };

    console.log(`\n[INTELLIGENCE] ═══════════════════════════════════════`);
    console.log(`[INTELLIGENCE] Complete: ${result.progress.percentage}%`);
    console.log(`[INTELLIGENCE] ═══════════════════════════════════════\n`);

    return report;
  }

  /**
   * Register a decomposer
   */
  addDecomposer(fn) {
    this.decomposer.registerDecomposer(fn);
    return this;
  }

  /**
   * Register an executor
   */
  addExecutor(type, fn) {
    this.executor.registerExecutor(type, fn);
    return this;
  }

  /**
   * Register a repair strategy
   */
  addRepair(pattern, fn) {
    this.feedback.registerRepair(pattern, fn);
    return this;
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // Node 4: Decomposition
  DecompositionEngine,

  // Node 5: Execution
  ExecutionEngine,

  // Node 6: Feedback & Repair
  FeedbackEngine,

  // Composite
  IntelligenceLayer
};
