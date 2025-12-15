/**
 * 3iATLAS - Cognitive Terrain Map & Learning System
 * ═══════════════════════════════════════════════════════════════════
 * The three axes of cognition:
 *   I - Insight     (pattern recognition, understanding)
 *   I - Intelligence (logical reasoning, computation)
 *   I - Imagination  (creative exploration, hypothesis generation)
 *
 * This system:
 *   - Records movement along I-I-I axes
 *   - Updates conceptual terrain on each verified solution
 *   - Expands coverage and identifies shortcuts/heuristics
 *   - Records dead-ends for future avoidance
 *   - Uses hypergraph to represent cognitive terrain
 *
 * "System remembers not just solutions but navigation pathways"
 * ═══════════════════════════════════════════════════════════════════
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════
// COGNITIVE NODE - A point in the 3iAtlas
// ═══════════════════════════════════════════════════════════════════

class CognitiveNode {
  constructor(id, data = {}) {
    this.id = id;
    this.type = data.type || 'concept'; // 'problem', 'concept', 'strategy', 'solution'

    // Position in 3i space
    this.position = {
      insight: data.insight || 0.5,
      intelligence: data.intelligence || 0.5,
      imagination: data.imagination || 0.5
    };

    // Node metadata
    this.label = data.label || id;
    this.description = data.description || '';
    this.features = data.features || {};

    // Learning statistics
    this.visits = 0;
    this.successes = 0;
    this.failures = 0;
    this.lastVisit = null;
    this.createdAt = Date.now();

    // Connections tracked separately in graph
    this.tags = new Set(data.tags || []);
  }

  visit(success = null) {
    this.visits++;
    this.lastVisit = Date.now();

    if (success === true) this.successes++;
    else if (success === false) this.failures++;

    return this;
  }

  getSuccessRate() {
    const total = this.successes + this.failures;
    return total > 0 ? this.successes / total : 0.5;
  }

  getConfidence() {
    // Confidence increases with more data
    const dataPoints = this.successes + this.failures;
    const certainty = Math.min(1, dataPoints / 10);
    return this.getSuccessRate() * certainty + 0.5 * (1 - certainty);
  }

  distanceTo(other) {
    const di = this.position.insight - other.position.insight;
    const dn = this.position.intelligence - other.position.intelligence;
    const dm = this.position.imagination - other.position.imagination;
    return Math.sqrt(di * di + dn * dn + dm * dm);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      label: this.label,
      description: this.description,
      features: this.features,
      visits: this.visits,
      successes: this.successes,
      failures: this.failures,
      lastVisit: this.lastVisit,
      createdAt: this.createdAt,
      tags: [...this.tags]
    };
  }

  static fromJSON(data) {
    const node = new CognitiveNode(data.id, data);
    node.visits = data.visits || 0;
    node.successes = data.successes || 0;
    node.failures = data.failures || 0;
    node.lastVisit = data.lastVisit;
    node.createdAt = data.createdAt || Date.now();
    return node;
  }
}

// ═══════════════════════════════════════════════════════════════════
// COGNITIVE EDGE - A transition in the 3iAtlas
// ═══════════════════════════════════════════════════════════════════

class CognitiveEdge {
  constructor(fromId, toId, data = {}) {
    this.id = `${fromId}->${toId}`;
    this.from = fromId;
    this.to = toId;
    this.type = data.type || 'transition'; // 'transition', 'strategy', 'reasoning', 'shortcut'

    // Edge metadata
    this.label = data.label || '';
    this.strategy = data.strategy || null;
    this.cost = data.cost || 1.0; // Cognitive cost

    // Learning statistics
    this.traversals = 0;
    this.successes = 0;
    this.failures = 0;
    this.totalTime = 0;

    // Weights (learned)
    this.weight = data.weight || 0.5; // Success probability
    this.confidence = data.confidence || 0.5; // How confident in this weight
  }

  traverse(success, timeMs = 0) {
    this.traversals++;
    this.totalTime += timeMs;

    if (success) {
      this.successes++;
    } else {
      this.failures++;
    }

    // Update weight (exponential moving average)
    const alpha = 0.1;
    const successRate = this.successes / (this.successes + this.failures);
    this.weight = this.weight * (1 - alpha) + successRate * alpha;

    // Update confidence
    this.confidence = Math.min(1, this.traversals / 20);

    return this;
  }

  getAverageTime() {
    return this.traversals > 0 ? this.totalTime / this.traversals : 0;
  }

  getEfficiency() {
    // Higher is better: success rate / cost
    return this.weight / this.cost;
  }

  isShortcut() {
    return this.type === 'shortcut' || this.getEfficiency() > 0.8;
  }

  isDeadEnd() {
    return this.confidence > 0.7 && this.weight < 0.2;
  }

  toJSON() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      type: this.type,
      label: this.label,
      strategy: this.strategy,
      cost: this.cost,
      traversals: this.traversals,
      successes: this.successes,
      failures: this.failures,
      totalTime: this.totalTime,
      weight: this.weight,
      confidence: this.confidence
    };
  }

  static fromJSON(data) {
    const edge = new CognitiveEdge(data.from, data.to, data);
    edge.traversals = data.traversals || 0;
    edge.successes = data.successes || 0;
    edge.failures = data.failures || 0;
    edge.totalTime = data.totalTime || 0;
    edge.weight = data.weight || 0.5;
    edge.confidence = data.confidence || 0.5;
    return edge;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 3iATLAS - The Cognitive Terrain Map
// ═══════════════════════════════════════════════════════════════════

class ThreeIAtlas extends EventEmitter {
  constructor(options = {}) {
    super();

    // Graph structure
    this.nodes = new Map();
    this.edges = new Map();
    this.adjacency = new Map(); // nodeId -> Set of edgeIds

    // Current position in atlas
    this.currentPosition = {
      insight: 0.5,
      intelligence: 0.5,
      imagination: 0.5
    };
    this.currentNode = null;

    // Trajectory tracking
    this.trajectory = [];
    this.maxTrajectory = options.maxTrajectory || 10000;

    // Learning parameters
    this.explorationBonus = options.explorationBonus || 0.1;
    this.shortcutThreshold = options.shortcutThreshold || 0.8;
    this.deadEndThreshold = options.deadEndThreshold || 0.2;

    // Persistence
    this.persistPath = options.persistPath || null;
    this.autoSave = options.autoSave || false;
    this.saveInterval = options.saveInterval || 60000; // 1 minute

    if (this.autoSave && this.persistPath) {
      this.startAutoSave();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // NODE OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  addNode(id, data = {}) {
    if (this.nodes.has(id)) {
      return this.nodes.get(id);
    }

    const node = new CognitiveNode(id, data);
    this.nodes.set(id, node);
    this.adjacency.set(id, new Set());

    this.emit('node:added', node);
    return node;
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  findNearestNodes(position, count = 5) {
    const distances = [];

    for (const node of this.nodes.values()) {
      const dist = Math.sqrt(
        Math.pow(node.position.insight - position.insight, 2) +
        Math.pow(node.position.intelligence - position.intelligence, 2) +
        Math.pow(node.position.imagination - position.imagination, 2)
      );
      distances.push({ node, distance: dist });
    }

    distances.sort((a, b) => a.distance - b.distance);
    return distances.slice(0, count);
  }

  findNodesByTag(tag) {
    const results = [];
    for (const node of this.nodes.values()) {
      if (node.tags.has(tag)) {
        results.push(node);
      }
    }
    return results;
  }

  // ═══════════════════════════════════════════════════════════════
  // EDGE OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  addEdge(fromId, toId, data = {}) {
    // Ensure nodes exist
    if (!this.nodes.has(fromId)) {
      this.addNode(fromId, { type: 'auto' });
    }
    if (!this.nodes.has(toId)) {
      this.addNode(toId, { type: 'auto' });
    }

    const edgeId = `${fromId}->${toId}`;

    if (this.edges.has(edgeId)) {
      return this.edges.get(edgeId);
    }

    const edge = new CognitiveEdge(fromId, toId, data);
    this.edges.set(edgeId, edge);
    this.adjacency.get(fromId).add(edgeId);

    this.emit('edge:added', edge);
    return edge;
  }

  getEdge(fromId, toId) {
    return this.edges.get(`${fromId}->${toId}`);
  }

  getOutgoingEdges(nodeId) {
    const edgeIds = this.adjacency.get(nodeId) || new Set();
    return [...edgeIds].map(id => this.edges.get(id));
  }

  getIncomingEdges(nodeId) {
    const incoming = [];
    for (const edge of this.edges.values()) {
      if (edge.to === nodeId) {
        incoming.push(edge);
      }
    }
    return incoming;
  }

  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════

  moveTo(position) {
    const previous = { ...this.currentPosition };
    this.currentPosition = {
      insight: Math.max(0, Math.min(1, position.insight)),
      intelligence: Math.max(0, Math.min(1, position.intelligence)),
      imagination: Math.max(0, Math.min(1, position.imagination))
    };

    this.trajectory.push({
      timestamp: Date.now(),
      from: previous,
      to: this.currentPosition
    });

    if (this.trajectory.length > this.maxTrajectory) {
      this.trajectory.shift();
    }

    this.emit('position:change', this.currentPosition);
    return this.currentPosition;
  }

  moveToNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return null;

    this.currentNode = node;
    node.visit();

    return this.moveTo(node.position);
  }

  traverseEdge(edgeId, success, timeMs = 0) {
    const edge = this.edges.get(edgeId);
    if (!edge) return null;

    edge.traverse(success, timeMs);

    // Visit destination node
    const toNode = this.nodes.get(edge.to);
    if (toNode) {
      toNode.visit(success);
      this.currentNode = toNode;
      this.moveTo(toNode.position);
    }

    this.emit('edge:traversed', { edge, success, timeMs });
    return edge;
  }

  // ═══════════════════════════════════════════════════════════════
  // LEARNING FROM VERIFIED SOLUTIONS
  // ═══════════════════════════════════════════════════════════════

  recordSolution(solutionPath) {
    /**
     * solutionPath = {
     *   problemId: string,
     *   success: boolean,
     *   strategy: string,
     *   steps: [{ nodeId, action, result }],
     *   totalTime: number,
     *   position: { insight, intelligence, imagination }
     * }
     */

    const { problemId, success, strategy, steps, totalTime, position } = solutionPath;

    // Ensure problem node exists
    const problemNode = this.addNode(problemId, {
      type: 'problem',
      label: problemId,
      ...position
    });
    problemNode.visit(success);

    // Record each step as edge traversal
    let prevNodeId = problemId;
    const stepTime = steps.length > 0 ? totalTime / steps.length : 0;

    for (const step of steps) {
      const stepNodeId = step.nodeId || `${problemId}_step_${steps.indexOf(step)}`;

      // Create step node if needed
      this.addNode(stepNodeId, {
        type: 'concept',
        label: step.action,
        ...step.position
      });

      // Create/update edge
      const edge = this.addEdge(prevNodeId, stepNodeId, {
        type: 'reasoning',
        strategy,
        label: step.action
      });
      edge.traverse(step.result !== 'failed', stepTime);

      prevNodeId = stepNodeId;
    }

    // Create solution node
    const solutionId = `${problemId}_solution`;
    const solutionNode = this.addNode(solutionId, {
      type: 'solution',
      label: `Solution: ${problemId}`,
      ...position
    });
    solutionNode.visit(success);

    // Final edge to solution
    const finalEdge = this.addEdge(prevNodeId, solutionId, {
      type: success ? 'shortcut' : 'transition',
      strategy,
      label: success ? 'solved' : 'attempted'
    });
    finalEdge.traverse(success, stepTime);

    // Identify shortcuts
    if (success && steps.length <= 3) {
      this.identifyShortcut(problemId, solutionId, strategy);
    }

    // Record dead-ends
    if (!success) {
      this.recordDeadEnd(problemId, strategy, steps);
    }

    this.emit('solution:recorded', solutionPath);

    if (this.autoSave) {
      this.save();
    }
  }

  identifyShortcut(fromId, toId, strategy) {
    const directEdge = this.getEdge(fromId, toId);

    if (directEdge) {
      directEdge.type = 'shortcut';
      this.emit('shortcut:found', directEdge);
    } else {
      const shortcut = this.addEdge(fromId, toId, {
        type: 'shortcut',
        strategy,
        label: 'Direct path',
        cost: 0.5
      });
      shortcut.weight = 0.9;
      this.emit('shortcut:created', shortcut);
    }
  }

  recordDeadEnd(problemId, strategy, steps) {
    // Mark the last step as a dead end
    if (steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      const deadEndId = lastStep.nodeId || `${problemId}_dead_${strategy}`;

      const deadEndNode = this.getNode(deadEndId);
      if (deadEndNode) {
        deadEndNode.tags.add('dead_end');
        deadEndNode.tags.add(`dead_${strategy}`);
      }
    }

    this.emit('dead_end:recorded', { problemId, strategy });
  }

  // ═══════════════════════════════════════════════════════════════
  // PATH FINDING (for strategy selection)
  // ═══════════════════════════════════════════════════════════════

  findBestPath(fromId, toId) {
    // Dijkstra with success probability as weight
    const distances = new Map();
    const previous = new Map();
    const unvisited = new Set(this.nodes.keys());

    for (const id of this.nodes.keys()) {
      distances.set(id, Infinity);
    }
    distances.set(fromId, 0);

    while (unvisited.size > 0) {
      // Find minimum distance node
      let current = null;
      let minDist = Infinity;
      for (const id of unvisited) {
        const d = distances.get(id);
        if (d < minDist) {
          minDist = d;
          current = id;
        }
      }

      if (current === null || current === toId) break;
      unvisited.delete(current);

      // Update neighbors
      const edges = this.getOutgoingEdges(current);
      for (const edge of edges) {
        if (!unvisited.has(edge.to)) continue;

        // Cost = inverse of success probability (lower = better)
        const cost = 1 - edge.weight + edge.cost * 0.1;
        const alt = distances.get(current) + cost;

        if (alt < distances.get(edge.to)) {
          distances.set(edge.to, alt);
          previous.set(edge.to, { nodeId: current, edgeId: edge.id });
        }
      }
    }

    // Reconstruct path
    const path = [];
    let current = toId;
    while (previous.has(current)) {
      const { nodeId, edgeId } = previous.get(current);
      path.unshift({ from: nodeId, to: current, edge: edgeId });
      current = nodeId;
    }

    return {
      path,
      distance: distances.get(toId),
      reachable: distances.get(toId) !== Infinity
    };
  }

  findShortcuts(fromId) {
    const shortcuts = [];
    const edges = this.getOutgoingEdges(fromId);

    for (const edge of edges) {
      if (edge.isShortcut()) {
        shortcuts.push(edge);
      }
    }

    return shortcuts.sort((a, b) => b.getEfficiency() - a.getEfficiency());
  }

  getDeadEnds(problemId) {
    const deadEnds = [];

    for (const node of this.nodes.values()) {
      if (node.tags.has('dead_end') && node.id.startsWith(problemId)) {
        deadEnds.push(node);
      }
    }

    return deadEnds;
  }

  // ═══════════════════════════════════════════════════════════════
  // STRATEGY RECOMMENDATION
  // ═══════════════════════════════════════════════════════════════

  recommendStrategy(problemFeatures) {
    // Find similar problems
    const similar = this.findSimilarProblems(problemFeatures);

    // Aggregate strategy success rates
    const strategyScores = new Map();

    for (const { node, similarity } of similar) {
      const outgoing = this.getOutgoingEdges(node.id);

      for (const edge of outgoing) {
        if (edge.strategy) {
          const current = strategyScores.get(edge.strategy) || { score: 0, count: 0 };
          current.score += edge.weight * similarity;
          current.count++;
          strategyScores.set(edge.strategy, current);
        }
      }
    }

    // Rank strategies
    const ranked = [];
    for (const [strategy, { score, count }] of strategyScores) {
      ranked.push({
        strategy,
        score: score / count,
        confidence: Math.min(1, count / 5)
      });
    }

    ranked.sort((a, b) => b.score - a.score);

    // Add exploration bonus for unvisited strategies
    const seenStrategies = new Set(ranked.map(r => r.strategy));
    const allStrategies = [
      'direct_solve', 'decomposition', 'pattern_match',
      'analogical_transfer', 'constraint_satisfaction',
      'generate_and_test', 'means_ends_analysis', 'abstraction_refinement'
    ];

    for (const strategy of allStrategies) {
      if (!seenStrategies.has(strategy)) {
        ranked.push({
          strategy,
          score: 0.5 + this.explorationBonus,
          confidence: 0,
          exploration: true
        });
      }
    }

    return ranked;
  }

  findSimilarProblems(features) {
    const similar = [];

    for (const node of this.nodes.values()) {
      if (node.type !== 'problem') continue;

      const similarity = this.computeSimilarity(features, node.features);
      if (similarity > 0.3) {
        similar.push({ node, similarity });
      }
    }

    similar.sort((a, b) => b.similarity - a.similarity);
    return similar.slice(0, 10);
  }

  computeSimilarity(features1, features2) {
    if (!features1 || !features2) return 0;

    let matches = 0;
    let total = 0;

    // Compare input sizes
    if (features1.inputSize && features2.inputSize) {
      total++;
      if (features1.inputSize[0] === features2.inputSize[0] &&
        features1.inputSize[1] === features2.inputSize[1]) {
        matches++;
      }
    }

    // Compare color counts
    if (features1.colors && features2.colors) {
      total++;
      const overlap = features1.colors.filter(c => features2.colors.includes(c)).length;
      matches += overlap / Math.max(features1.colors.length, features2.colors.length);
    }

    // Add more feature comparisons as needed

    return total > 0 ? matches / total : 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // VISUALIZATION DATA
  // ═══════════════════════════════════════════════════════════════

  toVisualization() {
    const nodes = [];
    const edges = [];

    for (const node of this.nodes.values()) {
      nodes.push({
        id: node.id,
        label: node.label,
        x: node.position.insight,
        y: node.position.intelligence,
        z: node.position.imagination,
        type: node.type,
        size: Math.log(node.visits + 1) + 1,
        color: this.getNodeColor(node)
      });
    }

    for (const edge of this.edges.values()) {
      edges.push({
        id: edge.id,
        source: edge.from,
        target: edge.to,
        label: edge.label,
        weight: edge.weight,
        type: edge.type,
        color: this.getEdgeColor(edge)
      });
    }

    return {
      nodes,
      edges,
      currentPosition: this.currentPosition,
      trajectory: this.trajectory.slice(-100)
    };
  }

  getNodeColor(node) {
    const colors = {
      problem: '#3b82f6',   // blue
      concept: '#10b981',   // green
      strategy: '#f59e0b',  // amber
      solution: '#8b5cf6',  // purple
      auto: '#6b7280'       // gray
    };
    return colors[node.type] || colors.auto;
  }

  getEdgeColor(edge) {
    if (edge.isDeadEnd()) return '#ef4444';  // red
    if (edge.isShortcut()) return '#10b981'; // green
    return `rgba(59, 130, 246, ${edge.weight})`; // blue with opacity
  }

  // ═══════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════════

  async save(filePath = null) {
    const savePath = filePath || this.persistPath;
    if (!savePath) return false;

    const data = {
      version: '1.0',
      savedAt: Date.now(),
      currentPosition: this.currentPosition,
      nodes: [...this.nodes.values()].map(n => n.toJSON()),
      edges: [...this.edges.values()].map(e => e.toJSON())
    };

    try {
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(savePath, JSON.stringify(data, null, 2));
      this.emit('saved', savePath);
      return true;
    } catch (error) {
      this.emit('error', { action: 'save', error });
      return false;
    }
  }

  async load(filePath = null) {
    const loadPath = filePath || this.persistPath;
    if (!loadPath || !fs.existsSync(loadPath)) return false;

    try {
      const data = JSON.parse(fs.readFileSync(loadPath, 'utf8'));

      // Clear existing data
      this.nodes.clear();
      this.edges.clear();
      this.adjacency.clear();

      // Load nodes
      for (const nodeData of data.nodes) {
        const node = CognitiveNode.fromJSON(nodeData);
        this.nodes.set(node.id, node);
        this.adjacency.set(node.id, new Set());
      }

      // Load edges
      for (const edgeData of data.edges) {
        const edge = CognitiveEdge.fromJSON(edgeData);
        this.edges.set(edge.id, edge);
        this.adjacency.get(edge.from)?.add(edge.id);
      }

      // Restore position
      if (data.currentPosition) {
        this.currentPosition = data.currentPosition;
      }

      this.emit('loaded', loadPath);
      return true;
    } catch (error) {
      this.emit('error', { action: 'load', error });
      return false;
    }
  }

  startAutoSave() {
    this.saveTimer = setInterval(() => {
      this.save();
    }, this.saveInterval);
  }

  stopAutoSave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // STATISTICS
  // ═══════════════════════════════════════════════════════════════

  getStats() {
    const nodesByType = {};
    let totalVisits = 0;
    let totalSuccesses = 0;

    for (const node of this.nodes.values()) {
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
      totalVisits += node.visits;
      totalSuccesses += node.successes;
    }

    const edgesByType = {};
    let shortcuts = 0;
    let deadEnds = 0;

    for (const edge of this.edges.values()) {
      edgesByType[edge.type] = (edgesByType[edge.type] || 0) + 1;
      if (edge.isShortcut()) shortcuts++;
      if (edge.isDeadEnd()) deadEnds++;
    }

    return {
      nodes: this.nodes.size,
      edges: this.edges.size,
      nodesByType,
      edgesByType,
      totalVisits,
      overallSuccessRate: totalVisits > 0 ? totalSuccesses / totalVisits : 0,
      shortcuts,
      deadEnds,
      trajectoryLength: this.trajectory.length,
      currentPosition: this.currentPosition
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  ThreeIAtlas,
  CognitiveNode,
  CognitiveEdge
};
