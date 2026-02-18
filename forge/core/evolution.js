/**
 * ORBITAL FORGE - LAYER 4: EVOLUTION
 * ═══════════════════════════════════════════════════════════════════
 * Node 10: Self-Delegation & Agent Evolution - The system grows new hands
 * Node 11: Predictive Optimization - The system reads ahead
 *
 * "Agents spawn agents. Seniors train juniors. Capability propagates."
 * ═══════════════════════════════════════════════════════════════════
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════
// NODE 10: SELF-DELEGATION & AGENT EVOLUTION
// ═══════════════════════════════════════════════════════════════════

/**
 * AgentTemplate - Blueprint for creating agents
 */
class AgentTemplate {
  constructor(config) {
    this.id = config.id || `template-${crypto.randomBytes(4).toString('hex')}`;
    this.name = config.name;
    this.description = config.description || '';
    this.capabilities = config.capabilities || [];
    this.systemPrompt = config.systemPrompt || '';
    this.parameters = config.parameters || {};
    this.parentTemplate = config.parentTemplate || null;
    this.version = config.version || 1;
  }

  /**
   * Extend this template to create a specialized variant
   */
  extend(overrides) {
    return new AgentTemplate({
      ...this.toJSON(),
      ...overrides,
      id: `${this.id}-${crypto.randomBytes(2).toString('hex')}`,
      parentTemplate: this.id,
      version: 1,
      capabilities: [
        ...this.capabilities,
        ...(overrides.capabilities || [])
      ]
    });
  }

  /**
   * Instantiate agent from template
   */
  instantiate(config = {}) {
    return {
      id: config.id || `agent-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      templateId: this.id,
      name: config.name || this.name,
      capabilities: [...this.capabilities, ...(config.additionalCapabilities || [])],
      systemPrompt: config.systemPrompt || this.systemPrompt,
      parameters: { ...this.parameters, ...config.parameters },
      status: 'READY',
      created: Date.now()
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      capabilities: this.capabilities,
      systemPrompt: this.systemPrompt,
      parameters: this.parameters,
      parentTemplate: this.parentTemplate,
      version: this.version
    };
  }
}

/**
 * SkillRegistry - Track and propagate skills
 */
class SkillRegistry extends EventEmitter {
  constructor() {
    super();
    this.skills = new Map();
    this.dependencies = new Map();
  }

  /**
   * Register a skill
   */
  register(skill) {
    const skillId = skill.id || skill.name;
    this.skills.set(skillId, {
      ...skill,
      id: skillId,
      registered: Date.now()
    });

    // Track dependencies
    if (skill.requires) {
      this.dependencies.set(skillId, skill.requires);
    }

    this.emit('registered', { skillId });
    return this;
  }

  /**
   * Get skill by ID
   */
  get(skillId) {
    return this.skills.get(skillId);
  }

  /**
   * Get all skills an agent can use given its base skills
   */
  getAvailable(baseSkills) {
    const available = new Set(baseSkills);

    // Recursively add skills whose dependencies are met
    let added = true;
    while (added) {
      added = false;
      for (const [skillId, deps] of this.dependencies) {
        if (!available.has(skillId)) {
          if (deps.every(d => available.has(d))) {
            available.add(skillId);
            added = true;
          }
        }
      }
    }

    return Array.from(available).map(id => this.skills.get(id)).filter(Boolean);
  }

  /**
   * Get skill tree
   */
  getTree() {
    const tree = {};

    for (const [skillId, deps] of this.dependencies) {
      tree[skillId] = {
        skill: this.skills.get(skillId),
        requires: deps,
        enablesCount: Array.from(this.dependencies.values())
          .filter(d => d.includes(skillId)).length
      };
    }

    return tree;
  }
}

/**
 * PerformanceTracker - Score agent performance
 */
class PerformanceTracker extends EventEmitter {
  constructor(config = {}) {
    super();
    this.scores = new Map();
    this.history = new Map();
    this.windowSize = config.windowSize || 100;
  }

  /**
   * Record task completion
   */
  record(agentId, taskType, metrics) {
    if (!this.history.has(agentId)) {
      this.history.set(agentId, []);
    }

    const entry = {
      taskType,
      ...metrics,
      timestamp: Date.now()
    };

    const history = this.history.get(agentId);
    history.push(entry);

    // Trim to window size
    if (history.length > this.windowSize) {
      history.shift();
    }

    // Update scores
    this.updateScores(agentId);
    this.emit('recorded', { agentId, entry });
  }

  /**
   * Update agent scores based on history
   */
  updateScores(agentId) {
    const history = this.history.get(agentId) || [];
    if (history.length === 0) return;

    const scores = {
      successRate: 0,
      avgDuration: 0,
      avgQuality: 0,
      reliability: 0,
      taskCounts: {}
    };

    const successes = history.filter(h => h.success).length;
    scores.successRate = successes / history.length;

    const durations = history.map(h => h.duration).filter(Boolean);
    scores.avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const qualities = history.map(h => h.quality).filter(Boolean);
    scores.avgQuality = qualities.length > 0
      ? qualities.reduce((a, b) => a + b, 0) / qualities.length
      : 0;

    // Reliability = consistency of success
    const recentWindow = history.slice(-20);
    const recentSuccesses = recentWindow.filter(h => h.success).length;
    scores.reliability = recentSuccesses / recentWindow.length;

    // Count by task type
    history.forEach(h => {
      scores.taskCounts[h.taskType] = (scores.taskCounts[h.taskType] || 0) + 1;
    });

    // Composite score
    scores.composite = (
      scores.successRate * 0.4 +
      scores.avgQuality * 0.3 +
      scores.reliability * 0.3
    );

    this.scores.set(agentId, scores);
    this.emit('updated', { agentId, scores });
  }

  /**
   * Get agent scores
   */
  getScores(agentId) {
    return this.scores.get(agentId);
  }

  /**
   * Rank agents by performance
   */
  rank(agentIds = null) {
    const toRank = agentIds || Array.from(this.scores.keys());

    return toRank
      .map(id => ({ id, scores: this.scores.get(id) }))
      .filter(a => a.scores)
      .sort((a, b) => b.scores.composite - a.scores.composite);
  }

  /**
   * Get top performers for task type
   */
  topForTask(taskType, limit = 5) {
    const ranked = this.rank();

    return ranked
      .filter(a => (a.scores.taskCounts[taskType] || 0) > 0)
      .slice(0, limit);
  }
}

/**
 * AgentEvolution - Agents spawn and evolve
 */
class AgentEvolution extends EventEmitter {
  constructor(config = {}) {
    super();
    this.templates = new Map();
    this.skills = new SkillRegistry();
    this.performance = new PerformanceTracker(config.performance);
    this.agents = new Map();
    this.generations = new Map();
    this.maxGeneration = 0;
  }

  /**
   * Register a base template
   */
  registerTemplate(template) {
    if (!(template instanceof AgentTemplate)) {
      template = new AgentTemplate(template);
    }
    this.templates.set(template.id, template);
    this.emit('template:registered', { templateId: template.id });
    return template;
  }

  /**
   * Spawn an agent from template
   */
  spawn(templateId, config = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const agent = template.instantiate(config);
    const generation = (config.generation || 0) + 1;

    agent.generation = generation;
    this.maxGeneration = Math.max(this.maxGeneration, generation);

    this.agents.set(agent.id, agent);

    if (!this.generations.has(generation)) {
      this.generations.set(generation, []);
    }
    this.generations.get(generation).push(agent.id);

    this.emit('agent:spawned', { agentId: agent.id, templateId, generation });
    return agent;
  }

  /**
   * Agent spawns child agent (inheritance)
   */
  spawnChild(parentAgentId, config = {}) {
    const parent = this.agents.get(parentAgentId);
    if (!parent) {
      throw new Error(`Parent agent not found: ${parentAgentId}`);
    }

    // Create extended template from parent
    const parentTemplate = this.templates.get(parent.templateId);
    const childTemplate = parentTemplate.extend({
      name: `${parentTemplate.name} (Gen ${parent.generation + 1})`,
      ...config.templateOverrides
    });

    this.registerTemplate(childTemplate);

    // Spawn from extended template
    const child = this.spawn(childTemplate.id, {
      ...config,
      generation: parent.generation,
      parentId: parentAgentId
    });

    // Inherit learned skills based on parent performance
    const parentScores = this.performance.getScores(parentAgentId);
    if (parentScores) {
      child.inheritedScores = parentScores;
    }

    this.emit('agent:inherited', {
      childId: child.id,
      parentId: parentAgentId,
      generation: child.generation
    });

    return child;
  }

  /**
   * Evolve template based on top performers
   */
  evolveTemplate(templateId, options = {}) {
    const template = this.templates.get(templateId);
    if (!template) return null;

    // Find top performing agents using this template
    const templateAgents = Array.from(this.agents.values())
      .filter(a => a.templateId === templateId);

    const topPerformers = templateAgents
      .map(a => ({ agent: a, scores: this.performance.getScores(a.id) }))
      .filter(a => a.scores)
      .sort((a, b) => b.scores.composite - a.scores.composite)
      .slice(0, 3);

    if (topPerformers.length === 0) return null;

    // Extract common traits from top performers
    const commonCapabilities = new Set(template.capabilities);
    topPerformers.forEach(({ agent }) => {
      agent.capabilities.forEach(c => commonCapabilities.add(c));
    });

    // Create evolved template
    const evolved = new AgentTemplate({
      ...template.toJSON(),
      id: `${template.id}-evolved-${template.version + 1}`,
      parentTemplate: template.id,
      version: template.version + 1,
      capabilities: Array.from(commonCapabilities),
      parameters: {
        ...template.parameters,
        evolutionSource: topPerformers.map(t => t.agent.id)
      }
    });

    this.registerTemplate(evolved);
    this.emit('template:evolved', {
      originalId: templateId,
      evolvedId: evolved.id,
      version: evolved.version
    });

    return evolved;
  }

  /**
   * Get evolution lineage
   */
  getLineage(agentId) {
    const lineage = [];
    let current = this.agents.get(agentId);

    while (current) {
      lineage.unshift({
        agentId: current.id,
        generation: current.generation,
        templateId: current.templateId
      });

      current = current.parentId ? this.agents.get(current.parentId) : null;
    }

    return lineage;
  }

  /**
   * Get generation statistics
   */
  getGenerationStats() {
    const stats = {};

    for (const [gen, agentIds] of this.generations) {
      const agents = agentIds.map(id => this.agents.get(id)).filter(Boolean);
      const scores = agents
        .map(a => this.performance.getScores(a.id))
        .filter(Boolean);

      stats[gen] = {
        count: agents.length,
        avgComposite: scores.length > 0
          ? scores.reduce((a, b) => a + b.composite, 0) / scores.length
          : 0,
        avgSuccessRate: scores.length > 0
          ? scores.reduce((a, b) => a + b.successRate, 0) / scores.length
          : 0
      };
    }

    return stats;
  }
}

// ═══════════════════════════════════════════════════════════════════
// NODE 11: PREDICTIVE OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════

/**
 * PatternRecognizer - Detect patterns in execution history
 */
class PatternRecognizer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.history = [];
    this.patterns = new Map();
    this.windowSize = config.windowSize || 1000;
    this.minOccurrences = config.minOccurrences || 3;
  }

  /**
   * Record an event
   */
  record(event) {
    this.history.push({
      ...event,
      timestamp: Date.now()
    });

    // Trim history
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    // Analyze patterns periodically
    if (this.history.length % 50 === 0) {
      this.analyze();
    }
  }

  /**
   * Analyze history for patterns
   */
  analyze() {
    // Sequence patterns
    this.findSequencePatterns();

    // Temporal patterns
    this.findTemporalPatterns();

    // Failure patterns
    this.findFailurePatterns();

    this.emit('analyzed', { patternCount: this.patterns.size });
  }

  /**
   * Find sequence patterns (A always followed by B)
   */
  findSequencePatterns() {
    const sequences = new Map();

    for (let i = 0; i < this.history.length - 1; i++) {
      const current = this.history[i];
      const next = this.history[i + 1];

      const key = `${current.type}:${current.action} -> ${next.type}:${next.action}`;
      sequences.set(key, (sequences.get(key) || 0) + 1);
    }

    // Filter to significant patterns
    for (const [key, count] of sequences) {
      if (count >= this.minOccurrences) {
        this.patterns.set(`seq:${key}`, {
          type: 'SEQUENCE',
          pattern: key,
          occurrences: count,
          confidence: count / this.history.length
        });
      }
    }
  }

  /**
   * Find temporal patterns (peak times, etc.)
   */
  findTemporalPatterns() {
    const hourBuckets = new Array(24).fill(0);

    this.history.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourBuckets[hour]++;
    });

    const total = this.history.length;
    const peakHours = hourBuckets
      .map((count, hour) => ({ hour, count, ratio: count / total }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    if (peakHours[0] && peakHours[0].ratio > 0.1) {
      this.patterns.set('temporal:peak', {
        type: 'TEMPORAL',
        pattern: 'peak_hours',
        hours: peakHours,
        confidence: peakHours[0].ratio
      });
    }
  }

  /**
   * Find failure patterns
   */
  findFailurePatterns() {
    const failures = this.history.filter(e => e.status === 'FAILED');
    const failureReasons = new Map();

    failures.forEach(f => {
      const reason = f.error || f.type;
      failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
    });

    for (const [reason, count] of failureReasons) {
      if (count >= this.minOccurrences) {
        this.patterns.set(`failure:${reason}`, {
          type: 'FAILURE',
          pattern: reason,
          occurrences: count,
          failureRate: count / this.history.length
        });
      }
    }
  }

  /**
   * Predict next likely event
   */
  predict(currentEvent) {
    const predictions = [];

    for (const [key, pattern] of this.patterns) {
      if (pattern.type === 'SEQUENCE') {
        const [from] = pattern.pattern.split(' -> ');
        if (`${currentEvent.type}:${currentEvent.action}` === from) {
          const [, to] = pattern.pattern.split(' -> ');
          predictions.push({
            prediction: to,
            confidence: pattern.confidence,
            source: 'SEQUENCE'
          });
        }
      }
    }

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get patterns
   */
  getPatterns() {
    return Array.from(this.patterns.values());
  }
}

/**
 * PredictiveCache - Pre-warm based on predictions
 */
class PredictiveCache extends EventEmitter {
  constructor(config = {}) {
    super();
    this.cache = new Map();
    this.maxSize = config.maxSize || 100;
    this.predictions = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Pre-warm cache with predicted needs
   */
  async prewarm(predictions, loader) {
    const prewarmed = [];

    for (const prediction of predictions) {
      if (prediction.confidence > 0.3 && !this.cache.has(prediction.key)) {
        try {
          const data = await loader(prediction.key);
          this.set(prediction.key, data);
          prewarmed.push(prediction.key);
        } catch (error) {
          // Ignore prewarm failures
        }
      }
    }

    if (prewarmed.length > 0) {
      this.emit('prewarmed', { keys: prewarmed });
    }

    return prewarmed;
  }

  /**
   * Get from cache
   */
  get(key) {
    if (this.cache.has(key)) {
      this.hits++;
      const item = this.cache.get(key);
      item.lastAccess = Date.now();
      return item.data;
    }

    this.misses++;
    return null;
  }

  /**
   * Set in cache
   */
  set(key, data) {
    // Evict if full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      created: Date.now(),
      lastAccess: Date.now()
    });
  }

  /**
   * Evict least recently used
   */
  evictLRU() {
    let oldest = null;
    let oldestKey = null;

    for (const [key, item] of this.cache) {
      if (!oldest || item.lastAccess < oldest.lastAccess) {
        oldest = item;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.emit('evicted', { key: oldestKey });
    }
  }

  /**
   * Get hit rate
   */
  getHitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: (this.getHitRate() * 100).toFixed(1) + '%'
    };
  }
}

/**
 * PlanReorderer - Optimize execution order
 */
class PlanReorderer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.executionHistory = [];
    this.dependencyGraph = new Map();
  }

  /**
   * Record execution timing
   */
  recordExecution(nodeId, duration, dependencies) {
    this.executionHistory.push({
      nodeId,
      duration,
      dependencies,
      timestamp: Date.now()
    });

    // Update dependency graph with timing info
    this.dependencyGraph.set(nodeId, {
      avgDuration: this.calculateAvgDuration(nodeId),
      dependencies
    });
  }

  /**
   * Calculate average duration for node type
   */
  calculateAvgDuration(nodeId) {
    const executions = this.executionHistory.filter(e => e.nodeId === nodeId);
    if (executions.length === 0) return 0;

    return executions.reduce((a, b) => a + b.duration, 0) / executions.length;
  }

  /**
   * Reorder plan for optimal execution
   */
  reorder(nodes) {
    // Build dependency-aware schedule
    const scheduled = [];
    const remaining = new Set(nodes.map(n => n.id));
    const completed = new Set();

    while (remaining.size > 0) {
      // Find ready nodes (dependencies met)
      const ready = nodes.filter(n =>
        remaining.has(n.id) &&
        (n.dependencies || []).every(d => completed.has(d))
      );

      if (ready.length === 0) {
        // Circular dependency or error
        break;
      }

      // Sort ready nodes by estimated duration (longest first for better parallelism)
      ready.sort((a, b) => {
        const aDur = this.dependencyGraph.get(a.id)?.avgDuration || 0;
        const bDur = this.dependencyGraph.get(b.id)?.avgDuration || 0;
        return bDur - aDur;
      });

      // Schedule this batch
      scheduled.push(ready.map(n => n.id));

      ready.forEach(n => {
        remaining.delete(n.id);
        completed.add(n.id);
      });
    }

    this.emit('reordered', { batches: scheduled.length });
    return scheduled;
  }

  /**
   * Estimate total execution time
   */
  estimateTime(schedule) {
    let totalTime = 0;

    for (const batch of schedule) {
      // Batch time = longest task in batch
      const batchTime = Math.max(...batch.map(nodeId =>
        this.dependencyGraph.get(nodeId)?.avgDuration || 0
      ));
      totalTime += batchTime;
    }

    return totalTime;
  }
}

/**
 * PredictiveOptimizer - Complete predictive system
 */
class PredictiveOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.patterns = new PatternRecognizer(config.patterns);
    this.cache = new PredictiveCache(config.cache);
    this.reorderer = new PlanReorderer(config.reorderer);
  }

  /**
   * Optimize execution based on predictions
   */
  async optimize(plan, context = {}) {
    // Analyze patterns
    this.patterns.analyze();

    // Predict next needs
    const predictions = this.patterns.predict({
      type: plan.type,
      action: plan.intent
    });

    // Pre-warm cache
    if (context.loader) {
      await this.cache.prewarm(
        predictions.map(p => ({ key: p.prediction, confidence: p.confidence })),
        context.loader
      );
    }

    // Reorder plan
    const schedule = this.reorderer.reorder(plan.nodes || []);
    const estimatedTime = this.reorderer.estimateTime(schedule);

    return {
      schedule,
      estimatedTime,
      predictions,
      cacheStats: this.cache.getStats()
    };
  }

  /**
   * Record execution for learning
   */
  record(event) {
    this.patterns.record(event);

    if (event.nodeId && event.duration) {
      this.reorderer.recordExecution(
        event.nodeId,
        event.duration,
        event.dependencies
      );
    }
  }

  getStats() {
    return {
      patterns: this.patterns.getPatterns(),
      cache: this.cache.getStats()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EVOLUTION LAYER COMPOSITE
// ═══════════════════════════════════════════════════════════════════

/**
 * EvolutionLayer - Complete Layer 4 system
 */
class EvolutionLayer extends EventEmitter {
  constructor(config = {}) {
    super();

    // Node 10: Agent Evolution
    this.evolution = new AgentEvolution(config.evolution);

    // Node 11: Predictive Optimization
    this.optimizer = new PredictiveOptimizer(config.optimizer);
  }

  /**
   * Initialize with base templates
   */
  initialize(baseTemplates = []) {
    baseTemplates.forEach(template => {
      this.evolution.registerTemplate(template);
    });

    console.log('[EVOLUTION] Layer 4 online');
    return this;
  }

  /**
   * Spawn optimized agent
   */
  spawnOptimized(templateId, taskType, config = {}) {
    // Get top performers for task type
    const topPerformers = this.evolution.performance.topForTask(taskType, 1);

    if (topPerformers.length > 0) {
      // Spawn child of top performer
      return this.evolution.spawnChild(topPerformers[0].id, config);
    }

    // Spawn from template
    return this.evolution.spawn(templateId, config);
  }

  /**
   * Record and learn from execution
   */
  learn(agentId, taskType, result) {
    // Record performance
    this.evolution.performance.record(agentId, taskType, result);

    // Record for predictions
    this.optimizer.record({
      type: 'TASK',
      action: taskType,
      agentId,
      ...result
    });

    // Check if template should evolve
    const agent = this.evolution.agents.get(agentId);
    if (agent) {
      const generationStats = this.evolution.getGenerationStats();
      const currentGen = generationStats[agent.generation];

      // Evolve if current generation significantly outperforms
      if (currentGen && currentGen.avgComposite > 0.8) {
        this.evolution.evolveTemplate(agent.templateId);
      }
    }
  }

  getStats() {
    return {
      agents: this.evolution.agents.size,
      templates: this.evolution.templates.size,
      maxGeneration: this.evolution.maxGeneration,
      generationStats: this.evolution.getGenerationStats(),
      optimizer: this.optimizer.getStats()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // Node 10: Agent Evolution
  AgentTemplate,
  SkillRegistry,
  PerformanceTracker,
  AgentEvolution,

  // Node 11: Predictive Optimization
  PatternRecognizer,
  PredictiveCache,
  PlanReorderer,
  PredictiveOptimizer,

  // Composite
  EvolutionLayer
};
