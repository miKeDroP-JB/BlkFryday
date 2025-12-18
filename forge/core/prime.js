/**
 * ORBITAL FORGE - LAYER 0: THE PRIME AXIOM
 * ═══════════════════════════════════════════════════════════════════
 * "Any achievable outcome can be decomposed into finite, executable nodes."
 *
 * If a thing feels "impossible", the graph is just incomplete.
 * ═══════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════
// CORE DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════════

/**
 * ExecutionNode - The atomic unit of reality transformation
 */
class ExecutionNode {
  constructor(config) {
    this.id = config.id || this.generateId();
    this.type = config.type || 'TASK';
    this.intent = config.intent;
    this.status = 'PENDING';
    this.dependencies = config.dependencies || [];
    this.outputs = config.outputs || [];
    this.metadata = {
      created: Date.now(),
      attempts: 0,
      lastAttempt: null,
      completedAt: null,
      error: null
    };
    this.executor = config.executor || null;
    this.idempotencyKey = this.computeIdempotencyKey();
  }

  generateId() {
    return `node-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  computeIdempotencyKey() {
    const data = JSON.stringify({
      intent: this.intent,
      dependencies: this.dependencies.sort()
    });
    return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
  }

  /**
   * Check if node is ready to execute (all dependencies met)
   */
  isReady(completedNodes) {
    if (this.status !== 'PENDING') return false;
    return this.dependencies.every(depId => completedNodes.has(depId));
  }

  /**
   * Mark node as executing
   */
  start() {
    this.status = 'EXECUTING';
    this.metadata.lastAttempt = Date.now();
    this.metadata.attempts++;
  }

  /**
   * Mark node as complete with output
   */
  complete(output) {
    this.status = 'COMPLETED';
    this.metadata.completedAt = Date.now();
    this.outputs.push({
      data: output,
      timestamp: Date.now()
    });
  }

  /**
   * Mark node as failed
   */
  fail(error) {
    this.status = 'FAILED';
    this.metadata.error = error.message || error;
  }

  /**
   * Reset for retry
   */
  reset() {
    this.status = 'PENDING';
    this.metadata.error = null;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      intent: this.intent,
      status: this.status,
      dependencies: this.dependencies,
      outputs: this.outputs,
      metadata: this.metadata
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXECUTION GRAPH
// ═══════════════════════════════════════════════════════════════════

/**
 * ExecutionGraph - The dependency graph of reality transformation
 */
class ExecutionGraph {
  constructor(config = {}) {
    this.id = config.id || `graph-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    this.name = config.name || 'Unnamed Graph';
    this.intent = config.intent || '';
    this.nodes = new Map();
    this.rootNodes = new Set();
    this.leafNodes = new Set();
    this.status = 'INITIALIZED';
    this.created = Date.now();
    this.metadata = {
      totalNodes: 0,
      completedNodes: 0,
      failedNodes: 0,
      startedAt: null,
      completedAt: null
    };
  }

  /**
   * Add a node to the graph
   */
  addNode(node) {
    if (!(node instanceof ExecutionNode)) {
      node = new ExecutionNode(node);
    }

    this.nodes.set(node.id, node);
    this.metadata.totalNodes++;

    // Update root/leaf tracking
    if (node.dependencies.length === 0) {
      this.rootNodes.add(node.id);
    }
    this.leafNodes.add(node.id);

    // Remove from leaf if it's a dependency of another node
    node.dependencies.forEach(depId => {
      this.leafNodes.delete(depId);
    });

    return node;
  }

  /**
   * Get all nodes ready for execution
   */
  getReadyNodes() {
    const completedIds = new Set(
      Array.from(this.nodes.values())
        .filter(n => n.status === 'COMPLETED')
        .map(n => n.id)
    );

    return Array.from(this.nodes.values())
      .filter(node => node.isReady(completedIds));
  }

  /**
   * Get execution order (topological sort)
   */
  getExecutionOrder() {
    const visited = new Set();
    const order = [];

    const visit = (nodeId) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (!node) return;

      node.dependencies.forEach(depId => visit(depId));
      order.push(nodeId);
    };

    Array.from(this.nodes.keys()).forEach(id => visit(id));
    return order;
  }

  /**
   * Get parallelizable waves (nodes that can execute together)
   */
  getParallelWaves() {
    const waves = [];
    const completed = new Set();
    const remaining = new Set(this.nodes.keys());

    while (remaining.size > 0) {
      const wave = [];

      for (const nodeId of remaining) {
        const node = this.nodes.get(nodeId);
        const depsComplete = node.dependencies.every(d => completed.has(d));
        if (depsComplete) {
          wave.push(nodeId);
        }
      }

      if (wave.length === 0) {
        // Circular dependency detected
        console.warn('[GRAPH] Circular dependency detected in remaining nodes');
        break;
      }

      wave.forEach(id => {
        remaining.delete(id);
        completed.add(id);
      });

      waves.push(wave);
    }

    return waves;
  }

  /**
   * Calculate graph progress
   */
  getProgress() {
    const total = this.metadata.totalNodes;
    const completed = Array.from(this.nodes.values())
      .filter(n => n.status === 'COMPLETED').length;
    const failed = Array.from(this.nodes.values())
      .filter(n => n.status === 'FAILED').length;
    const executing = Array.from(this.nodes.values())
      .filter(n => n.status === 'EXECUTING').length;
    const pending = total - completed - failed - executing;

    return {
      total,
      completed,
      failed,
      executing,
      pending,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  /**
   * Check if graph is complete
   */
  isComplete() {
    return Array.from(this.nodes.values())
      .every(n => n.status === 'COMPLETED' || n.status === 'FAILED');
  }

  /**
   * Serialize graph for persistence
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      intent: this.intent,
      status: this.status,
      created: this.created,
      metadata: this.metadata,
      nodes: Array.from(this.nodes.values()).map(n => n.toJSON()),
      rootNodes: Array.from(this.rootNodes),
      leafNodes: Array.from(this.leafNodes)
    };
  }

  /**
   * Restore graph from serialized data
   */
  static fromJSON(data) {
    const graph = new ExecutionGraph({
      id: data.id,
      name: data.name,
      intent: data.intent
    });

    graph.status = data.status;
    graph.created = data.created;
    graph.metadata = data.metadata;
    graph.rootNodes = new Set(data.rootNodes);
    graph.leafNodes = new Set(data.leafNodes);

    data.nodes.forEach(nodeData => {
      const node = new ExecutionNode(nodeData);
      node.status = nodeData.status;
      node.metadata = nodeData.metadata;
      node.outputs = nodeData.outputs;
      graph.nodes.set(node.id, node);
    });

    return graph;
  }
}

// ═══════════════════════════════════════════════════════════════════
// NODE TYPES
// ═══════════════════════════════════════════════════════════════════

const NODE_TYPES = {
  // Atomic operations
  TASK: 'TASK',           // Simple executable task
  DECISION: 'DECISION',   // Branch point based on condition
  PARALLEL: 'PARALLEL',   // Fork into parallel paths
  JOIN: 'JOIN',           // Merge parallel paths

  // Control flow
  LOOP: 'LOOP',           // Iteration construct
  CONDITION: 'CONDITION', // Conditional execution
  CHECKPOINT: 'CHECKPOINT', // Progress persistence point

  // Delegation
  AGENT: 'AGENT',         // Delegated to AI agent
  SWARM: 'SWARM',         // Delegated to agent swarm
  HUMAN: 'HUMAN',         // Requires human input

  // Meta
  COMPOSITE: 'COMPOSITE', // Contains sub-graph
  TEMPLATE: 'TEMPLATE'    // Reusable pattern
};

// ═══════════════════════════════════════════════════════════════════
// STATUS STATES
// ═══════════════════════════════════════════════════════════════════

const NODE_STATUS = {
  PENDING: 'PENDING',       // Not yet started
  READY: 'READY',           // Dependencies met, ready to execute
  EXECUTING: 'EXECUTING',   // Currently running
  COMPLETED: 'COMPLETED',   // Successfully finished
  FAILED: 'FAILED',         // Failed (may retry)
  BLOCKED: 'BLOCKED',       // Blocked by failed dependency
  CANCELLED: 'CANCELLED',   // Manually cancelled
  SKIPPED: 'SKIPPED'        // Skipped (condition not met)
};

const GRAPH_STATUS = {
  INITIALIZED: 'INITIALIZED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

// ═══════════════════════════════════════════════════════════════════
// PRIME AXIOM UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate that a graph is well-formed
 */
function validateGraph(graph) {
  const errors = [];
  const nodeIds = new Set(graph.nodes.keys());

  // Check for missing dependencies
  for (const node of graph.nodes.values()) {
    for (const depId of node.dependencies) {
      if (!nodeIds.has(depId)) {
        errors.push(`Node ${node.id} has missing dependency: ${depId}`);
      }
    }
  }

  // Check for cycles
  const waves = graph.getParallelWaves();
  const covered = waves.flat();
  if (covered.length < graph.nodes.size) {
    errors.push('Graph contains circular dependencies');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Merge two graphs (B becomes subgraph of A)
 */
function mergeGraphs(graphA, graphB, connectionPoint) {
  const merged = new ExecutionGraph({
    name: `${graphA.name} + ${graphB.name}`,
    intent: `${graphA.intent} → ${graphB.intent}`
  });

  // Add all nodes from A
  for (const node of graphA.nodes.values()) {
    merged.addNode(new ExecutionNode(node.toJSON()));
  }

  // Add all nodes from B, updating dependencies
  for (const node of graphB.nodes.values()) {
    const newNode = new ExecutionNode(node.toJSON());

    // Connect B's root nodes to connection point
    if (graphB.rootNodes.has(node.id)) {
      newNode.dependencies.push(connectionPoint);
    }

    merged.addNode(newNode);
  }

  return merged;
}

// ═══════════════════════════════════════════════════════════════════
// THE PRIME AXIOM
// ═══════════════════════════════════════════════════════════════════

const PRIME_AXIOM = `
═══════════════════════════════════════════════════════════════════
                    THE PRIME AXIOM
═══════════════════════════════════════════════════════════════════

Any achievable outcome can be decomposed into finite, executable nodes.

If a thing feels "impossible", the graph is just incomplete.

THE DECOMPOSITION PROTOCOL:
───────────────────────────
1. State the outcome precisely
2. Ask: "What must be true immediately before this?"
3. For each precondition, recurse
4. Stop when actions are trivially executable
5. Connect the graph

THE NODE PROPERTIES:
───────────────────────────
• Atomic - Cannot be split further without loss of meaning
• Idempotent - Safe to retry without side effects
• Observable - Status is always knowable
• Bounded - Has clear completion criteria

THE GRAPH PROPERTIES:
───────────────────────────
• Acyclic - No circular dependencies (or explicitly handled)
• Complete - All dependencies are satisfied
• Parallelizable - Independent paths execute simultaneously
• Persistent - Progress survives restarts

REALITY = COLLAPSED(GRAPH)

═══════════════════════════════════════════════════════════════════
`;

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // Classes
  ExecutionNode,
  ExecutionGraph,

  // Constants
  NODE_TYPES,
  NODE_STATUS,
  GRAPH_STATUS,
  PRIME_AXIOM,

  // Utilities
  validateGraph,
  mergeGraphs
};
