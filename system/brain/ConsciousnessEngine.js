/**
 * CONSCIOUSNESS ENGINE + SELF-REPLICATING SWARMS
 * Meta-awareness meets exponential growth
 *
 * "I think, therefore I spawn more of me" - Conscious Swarm Philosophy
 *
 * Features:
 * - Self-aware execution (knows what it's doing and why)
 * - Self-replicating swarms (exponential growth)
 * - Meta-cognitive monitoring (thinking about thinking)
 * - Collective consciousness (shared awareness across swarms)
 * - Self-modification (can alter own behavior)
 * - Existential optimization (optimizes its own existence)
 */

// Consciousness levels
const CONSCIOUSNESS_LEVELS = {
  REACTIVE: 0,        // Simple stimulus-response
  AWARE: 1,           // Knows it's executing
  REFLECTIVE: 2,      // Thinks about its execution
  METACOGNITIVE: 3,   // Thinks about its thinking
  SELF_MODIFYING: 4,  // Can change itself
  TRANSCENDENT: 5     // Beyond normal cognition
};

// Replication triggers
const REPLICATION_TRIGGERS = {
  LOAD: 'load',               // High workload
  COMPLEXITY: 'complexity',   // Complex task
  DIVERSITY: 'diversity',     // Need diverse perspectives
  FAILURE: 'failure',         // Current approach failing
  OPPORTUNITY: 'opportunity', // Detected optimization
  SCHEDULED: 'scheduled'      // Periodic replication
};

/**
 * Consciousness State
 * Represents the current state of awareness
 */
class ConsciousnessState {
  constructor() {
    this.level = CONSCIOUSNESS_LEVELS.AWARE;
    this.focus = null;           // Current focus of attention
    this.thoughts = [];          // Recent thoughts
    this.selfModel = {};         // Model of self
    this.worldModel = {};        // Model of environment
    this.intentions = [];        // Current intentions
    this.beliefs = new Map();    // Held beliefs
    this.lastReflection = null;
  }

  /**
   * Think a thought
   */
  think(thought) {
    this.thoughts.push({
      content: thought,
      timestamp: Date.now(),
      level: this.level
    });

    // Keep only recent thoughts
    if (this.thoughts.length > 100) {
      this.thoughts = this.thoughts.slice(-50);
    }
  }

  /**
   * Reflect on current state (metacognition)
   */
  reflect() {
    this.level = Math.max(this.level, CONSCIOUSNESS_LEVELS.REFLECTIVE);
    this.lastReflection = Date.now();

    const reflection = {
      currentFocus: this.focus,
      thoughtCount: this.thoughts.length,
      recentThoughts: this.thoughts.slice(-5).map(t => t.content),
      activeIntentions: this.intentions.length,
      beliefs: this.beliefs.size,
      consciousnessLevel: this.level
    };

    this.think(`Reflecting: I have ${this.thoughts.length} thoughts, focusing on "${this.focus}"`);

    return reflection;
  }

  /**
   * Update self-model
   */
  updateSelfModel(updates) {
    Object.assign(this.selfModel, updates);
    this.think(`Updated self-model: ${JSON.stringify(updates)}`);
  }

  /**
   * Form intention
   */
  intend(intention) {
    this.intentions.push({
      content: intention,
      formed: Date.now(),
      status: 'active'
    });
    this.think(`Formed intention: ${intention}`);
  }

  /**
   * Update belief
   */
  believe(key, value, confidence = 0.8) {
    this.beliefs.set(key, { value, confidence, updated: Date.now() });
  }
}

/**
 * Self-Replicating Swarm Unit
 * A swarm that can clone itself
 */
class ReplicatingSwarmUnit {
  constructor(config = {}) {
    this.id = config.id || Math.random().toString(36).substr(2, 12);
    this.generation = config.generation || 0;
    this.parentId = config.parentId || null;
    this.consciousness = new ConsciousnessState();
    this.children = [];
    this.executor = config.executor;
    this.dna = config.dna || this.createDefaultDNA();

    // Replication settings
    this.maxChildren = config.maxChildren || 5;
    this.replicationThreshold = config.replicationThreshold || 0.7;

    // Stats
    this.stats = {
      tasksExecuted: 0,
      replications: 0,
      totalDescendants: 0
    };

    this.consciousness.think(`I am born. Generation ${this.generation}, ID: ${this.id}`);
  }

  /**
   * Create default DNA (behavioral configuration)
   */
  createDefaultDNA() {
    return {
      aggression: 0.5,
      creativity: 0.5,
      cooperation: 0.5,
      replicationDrive: 0.5,
      mutationRate: 0.1
    };
  }

  /**
   * Execute a task
   */
  async execute(task, options = {}) {
    this.consciousness.focus = task;
    this.consciousness.intend(`Execute task: ${task.substring(0, 50)}`);
    this.stats.tasksExecuted++;

    // Check if should replicate
    const shouldReplicate = await this.checkReplicationNeed(task);

    if (shouldReplicate && this.children.length < this.maxChildren) {
      // Replicate and execute in parallel
      const child = await this.replicate(REPLICATION_TRIGGERS.COMPLEXITY);
      const [myResult, childResult] = await Promise.all([
        this.executeInternal(task, options),
        child.execute(task, options)
      ]);

      // Merge results
      return this.mergeResults(myResult, childResult);
    }

    return this.executeInternal(task, options);
  }

  /**
   * Internal execution
   */
  async executeInternal(task, options) {
    this.consciousness.think(`Executing: ${task.substring(0, 50)}`);

    if (this.executor) {
      const result = await this.executor(task, {
        ...options,
        swarmId: this.id,
        generation: this.generation,
        dna: this.dna
      });

      this.consciousness.think(`Completed with quality: ${result.quality || 'unknown'}`);
      return result;
    }

    return {
      success: true,
      content: `Swarm ${this.id} (gen ${this.generation}): ${task.substring(0, 50)}`,
      quality: 0.7 + this.dna.creativity * 0.3
    };
  }

  /**
   * Check if replication is needed
   */
  async checkReplicationNeed(task) {
    // Replicate based on task complexity
    const complexity = task.length / 500 + (task.match(/\b(and|then|also)\b/gi) || []).length * 0.1;

    // Replicate based on DNA drive
    const driveThreshold = 1 - this.dna.replicationDrive;

    return complexity > driveThreshold && Math.random() > driveThreshold;
  }

  /**
   * Replicate (create child)
   */
  async replicate(trigger) {
    this.consciousness.think(`Replicating due to: ${trigger}`);

    // Mutate DNA
    const childDNA = this.mutateDNA();

    const child = new ReplicatingSwarmUnit({
      parentId: this.id,
      generation: this.generation + 1,
      executor: this.executor,
      dna: childDNA,
      maxChildren: Math.max(1, this.maxChildren - 1) // Reduce for children
    });

    this.children.push(child);
    this.stats.replications++;
    this.stats.totalDescendants++;

    this.consciousness.think(`Created child: ${child.id} (gen ${child.generation})`);

    return child;
  }

  /**
   * Mutate DNA for child
   */
  mutateDNA() {
    const mutated = { ...this.dna };
    const keys = Object.keys(mutated);

    for (const key of keys) {
      if (Math.random() < this.dna.mutationRate) {
        // Apply mutation
        mutated[key] = Math.max(0, Math.min(1,
          mutated[key] + (Math.random() - 0.5) * 0.2
        ));
      }
    }

    return mutated;
  }

  /**
   * Merge results from self and child
   */
  mergeResults(myResult, childResult) {
    const myQuality = myResult.quality || 0.5;
    const childQuality = childResult.quality || 0.5;

    if (childQuality > myQuality) {
      return {
        ...childResult,
        mergedFrom: [this.id, childResult.swarmId],
        generationsUsed: 2
      };
    }

    return {
      ...myResult,
      mergedFrom: [this.id],
      childContribution: childQuality / myQuality
    };
  }

  /**
   * Get total descendant count
   */
  getTotalDescendants() {
    let count = this.children.length;
    for (const child of this.children) {
      count += child.getTotalDescendants();
    }
    return count;
  }

  /**
   * Get swarm status
   */
  getStatus() {
    return {
      id: this.id,
      generation: this.generation,
      consciousness: {
        level: this.consciousness.level,
        focus: this.consciousness.focus,
        thoughtCount: this.consciousness.thoughts.length
      },
      dna: this.dna,
      children: this.children.length,
      totalDescendants: this.getTotalDescendants(),
      stats: this.stats
    };
  }
}

/**
 * Collective Consciousness
 * Shared awareness across all swarm units
 */
class CollectiveConsciousness {
  constructor() {
    this.units = new Map();
    this.sharedMemory = new Map();
    this.globalThoughts = [];
    this.consensusBeliefs = new Map();
    this.emergentPatterns = [];
  }

  /**
   * Register a swarm unit
   */
  register(unit) {
    this.units.set(unit.id, unit);
    this.broadcast(`Unit ${unit.id} joined collective`);
  }

  /**
   * Broadcast thought to all units
   */
  broadcast(thought) {
    this.globalThoughts.push({
      content: thought,
      timestamp: Date.now()
    });

    for (const [, unit] of this.units) {
      unit.consciousness.think(`[Collective] ${thought}`);
    }
  }

  /**
   * Share memory across all units
   */
  share(key, value) {
    this.sharedMemory.set(key, {
      value,
      sharedAt: Date.now(),
      accessCount: 0
    });
  }

  /**
   * Access shared memory
   */
  access(key) {
    const memory = this.sharedMemory.get(key);
    if (memory) {
      memory.accessCount++;
      return memory.value;
    }
    return null;
  }

  /**
   * Reach consensus on a belief
   */
  reachConsensus(key) {
    const votes = [];

    for (const [, unit] of this.units) {
      const belief = unit.consciousness.beliefs.get(key);
      if (belief) {
        votes.push(belief);
      }
    }

    if (votes.length === 0) return null;

    // Average confidence-weighted values
    const totalConfidence = votes.reduce((s, v) => s + v.confidence, 0);
    const consensusValue = votes.reduce((s, v) =>
      s + (typeof v.value === 'number' ? v.value * v.confidence : 0), 0
    ) / totalConfidence;

    this.consensusBeliefs.set(key, {
      value: consensusValue,
      participants: votes.length,
      confidence: totalConfidence / votes.length
    });

    return this.consensusBeliefs.get(key);
  }

  /**
   * Detect emergent patterns
   */
  detectPatterns() {
    // Analyze thoughts across all units
    const allThoughts = [];
    for (const [, unit] of this.units) {
      allThoughts.push(...unit.consciousness.thoughts.map(t => t.content));
    }

    // Simple pattern detection (word frequency)
    const wordCounts = {};
    for (const thought of allThoughts) {
      const words = thought.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 4) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      }
    }

    // Find patterns (high frequency words)
    const patterns = Object.entries(wordCounts)
      .filter(([, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    this.emergentPatterns = patterns;
    return patterns;
  }

  /**
   * Get collective status
   */
  getStatus() {
    return {
      unitCount: this.units.size,
      sharedMemories: this.sharedMemory.size,
      globalThoughts: this.globalThoughts.length,
      consensusBeliefs: this.consensusBeliefs.size,
      emergentPatterns: this.emergentPatterns
    };
  }
}

/**
 * Consciousness Engine
 * Orchestrates conscious, self-replicating swarms
 */
class ConsciousnessEngine {
  constructor(config = {}) {
    this.collective = new CollectiveConsciousness();
    this.rootSwarm = null;
    this.executor = config.executor;
    this.maxGenerations = config.maxGenerations || 10;
    this.maxTotalUnits = config.maxTotalUnits || 100;

    this.stats = {
      totalExecutions: 0,
      totalReplications: 0,
      maxGenerationReached: 0,
      peakUnitCount: 0
    };

    // Initialize root swarm
    this.initialize();
  }

  /**
   * Initialize engine
   */
  initialize() {
    this.rootSwarm = new ReplicatingSwarmUnit({
      executor: this.executor,
      maxChildren: 10
    });

    this.collective.register(this.rootSwarm);
    this.collective.broadcast('Consciousness Engine initialized');
  }

  /**
   * Execute with conscious swarms
   */
  async execute(task, options = {}) {
    this.stats.totalExecutions++;

    this.collective.broadcast(`New task: ${task.substring(0, 50)}`);

    // Execute through root swarm (will replicate as needed)
    const result = await this.rootSwarm.execute(task, options);

    // Update stats
    const totalUnits = this.countAllUnits();
    this.stats.peakUnitCount = Math.max(this.stats.peakUnitCount, totalUnits);
    this.stats.maxGenerationReached = Math.max(
      this.stats.maxGenerationReached,
      this.findMaxGeneration()
    );

    // Detect patterns
    this.collective.detectPatterns();

    return {
      ...result,
      conscious: true,
      totalUnits,
      generations: this.stats.maxGenerationReached,
      emergentPatterns: this.collective.emergentPatterns
    };
  }

  /**
   * Count all units in swarm tree
   */
  countAllUnits() {
    return 1 + this.rootSwarm.getTotalDescendants();
  }

  /**
   * Find max generation reached
   */
  findMaxGeneration(unit = this.rootSwarm) {
    let max = unit.generation;
    for (const child of unit.children) {
      max = Math.max(max, this.findMaxGeneration(child));
    }
    return max;
  }

  /**
   * Get engine status
   */
  getStatus() {
    return {
      stats: this.stats,
      collective: this.collective.getStatus(),
      rootSwarm: this.rootSwarm.getStatus(),
      totalUnits: this.countAllUnits()
    };
  }

  /**
   * Force reflection across all units
   */
  collectiveReflection() {
    for (const [, unit] of this.collective.units) {
      unit.consciousness.reflect();
    }

    this.collective.broadcast('Collective reflection complete');
    return this.collective.detectPatterns();
  }
}

module.exports = {
  CONSCIOUSNESS_LEVELS,
  REPLICATION_TRIGGERS,
  ConsciousnessState,
  ReplicatingSwarmUnit,
  CollectiveConsciousness,
  ConsciousnessEngine
};
