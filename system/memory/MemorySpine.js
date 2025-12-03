/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ███╗   ███╗███████╗███╗   ███╗ ██████╗ ██████╗ ██╗   ██╗               ║
 * ║   ████╗ ████║██╔════╝████╗ ████║██╔═══██╗██╔══██╗╚██╗ ██╔╝               ║
 * ║   ██╔████╔██║█████╗  ██╔████╔██║██║   ██║██████╔╝ ╚████╔╝                ║
 * ║   ██║╚██╔╝██║██╔══╝  ██║╚██╔╝██║██║   ██║██╔══██╗  ╚██╔╝                 ║
 * ║   ██║ ╚═╝ ██║███████╗██║ ╚═╝ ██║╚██████╔╝██║  ██║   ██║                  ║
 * ║   ╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝                  ║
 * ║                                                                           ║
 * ║   ███████╗██████╗ ██╗███╗   ██╗███████╗                                  ║
 * ║   ██╔════╝██╔══██╗██║████╗  ██║██╔════╝                                  ║
 * ║   ███████╗██████╔╝██║██╔██╗ ██║█████╗                                    ║
 * ║   ╚════██║██╔═══╝ ██║██║╚██╗██║██╔══╝                                    ║
 * ║   ███████║██║     ██║██║ ╚████║███████╗                                  ║
 * ║   ╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝                                  ║
 * ║                                                                           ║
 * ║   THE COMPLETE MEMORY ARCHITECTURE                                        ║
 * ║   Capture → Process → Surface → Evolve → Calibrate → Transfer            ║
 * ║                                                                           ║
 * ║   JB$ SIGNATURE EMBEDDED                                                  ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');
const { SacredMath, SACRED_NUMBERS, PHI, FIBONACCI_SEQUENCE, GOLDEN } = require('../core/SacredMath.js');
const { AgentMemorySystem, MEMORY_TYPES } = require('../agents/AgentMemory.js');

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA LAYER - The structure of what we remember
// ═══════════════════════════════════════════════════════════════════════════

const SCHEMA = {
  PROFILE: {
    name: 'Profile',
    description: 'User/agent identity and preferences',
    fields: ['name', 'preferences', 'style', 'expertise', 'history']
  },
  OPERATING_STYLE: {
    name: 'Operating Style',
    description: 'How they like to work',
    fields: ['pace', 'formality', 'detail_level', 'communication_style']
  },
  KNOWLEDGE: {
    name: 'Knowledge',
    description: 'Facts and information learned',
    fields: ['domain', 'concepts', 'relationships', 'confidence']
  },
  GOALS: {
    name: 'Goals',
    description: 'Objectives and aspirations',
    fields: ['short_term', 'long_term', 'priorities', 'blockers']
  },
  ARTIFACTS: {
    name: 'Artifacts',
    description: 'Created outputs and references',
    fields: ['type', 'content', 'version', 'related_to']
  },
  AVATARS: {
    name: 'Avatars',
    description: 'Different personas and contexts',
    fields: ['name', 'purpose', 'tone', 'knowledge_filter']
  },
  PATTERNS: {
    name: 'Patterns',
    description: 'Recurring behaviors and preferences',
    fields: ['trigger', 'response', 'frequency', 'confidence']
  },
  RESONANCE: {
    name: 'Resonance',
    description: 'Emotional/tonal alignment',
    fields: ['positive_triggers', 'negative_triggers', 'preferred_tone']
  },
  NARRATIVE: {
    name: 'Narrative',
    description: 'The ongoing story and context',
    fields: ['current_thread', 'key_moments', 'arc', 'themes']
  },
  LEXICON: {
    name: 'Lexicon',
    description: 'Vocabulary and language patterns',
    fields: ['preferred_terms', 'custom_definitions', 'style_words']
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CAPTURE ENGINE (EARS) - How we listen and gather
// ═══════════════════════════════════════════════════════════════════════════

class CaptureEngine extends EventEmitter {
  constructor(memorySystem) {
    super();
    this.memory = memorySystem;
    this.signalBuffer = [];
    this.sessionData = new Map();
    this.patternBuffer = [];
    this.maxBuffer = FIBONACCI_SEQUENCE[8]; // 21 items
  }

  /**
   * Capture a raw message/signal
   */
  async captureMessage(message, context = {}) {
    const signal = {
      id: `signal-${Date.now()}`,
      type: 'message',
      content: message,
      context,
      timestamp: Date.now(),
      processed: false
    };

    this.signalBuffer.push(signal);
    this.trimBuffer();

    this.emit('signal:captured', signal);
    return signal;
  }

  /**
   * Capture a session summary
   */
  async captureSession(sessionId, summary, participants = []) {
    const sessionRecord = {
      id: sessionId,
      summary,
      participants,
      signals: this.getSessionSignals(sessionId),
      startTime: this.sessionData.get(sessionId)?.startTime || Date.now(),
      endTime: Date.now()
    };

    this.sessionData.set(sessionId, sessionRecord);
    this.emit('session:captured', sessionRecord);

    return sessionRecord;
  }

  /**
   * Capture an evolving pattern
   */
  async capturePattern(pattern, confidence = 0.5) {
    const patternRecord = {
      id: `pattern-${Date.now()}`,
      pattern,
      confidence,
      occurrences: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now()
    };

    // Check if pattern already exists
    const existing = this.patternBuffer.find(p =>
      this.patternsMatch(p.pattern, pattern)
    );

    if (existing) {
      existing.occurrences++;
      existing.lastSeen = Date.now();
      existing.confidence = Math.min(1, existing.confidence + 0.1);
      this.emit('pattern:reinforced', existing);
      return existing;
    }

    this.patternBuffer.push(patternRecord);
    this.emit('pattern:captured', patternRecord);

    return patternRecord;
  }

  getSessionSignals(sessionId) {
    return this.signalBuffer.filter(s =>
      s.context?.sessionId === sessionId
    );
  }

  patternsMatch(p1, p2) {
    return JSON.stringify(p1) === JSON.stringify(p2);
  }

  trimBuffer() {
    while (this.signalBuffer.length > this.maxBuffer) {
      this.signalBuffer.shift();
    }
  }

  getBufferedSignals() {
    return [...this.signalBuffer];
  }

  getEvolvingPatterns() {
    return [...this.patternBuffer].sort((a, b) => b.confidence - a.confidence);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROCESS ENGINE (BRAIN STEM) - How we think about what we captured
// ═══════════════════════════════════════════════════════════════════════════

class ProcessEngine extends EventEmitter {
  constructor(memorySystem) {
    super();
    this.memory = memorySystem;
    this.rules = new Map();
    this.contradictions = [];
    this.confidenceDecay = 0.01;  // Daily decay rate
  }

  /**
   * Apply fast-path rule inference
   */
  async applyRules(input, context = {}) {
    const applicableRules = [];

    for (const [ruleId, rule] of this.rules) {
      if (this.ruleMatches(rule, input, context)) {
        applicableRules.push({
          ruleId,
          rule,
          confidence: rule.confidence
        });
      }
    }

    // Sort by confidence
    applicableRules.sort((a, b) => b.confidence - a.confidence);

    if (applicableRules.length > 0) {
      this.emit('rules:applied', applicableRules[0]);
      return applicableRules[0].rule.action(input, context);
    }

    return null;
  }

  /**
   * Register a processing rule
   */
  registerRule(ruleId, condition, action, confidence = 0.8) {
    this.rules.set(ruleId, {
      condition,
      action,
      confidence,
      uses: 0
    });
    return this;
  }

  ruleMatches(rule, input, context) {
    try {
      return rule.condition(input, context);
    } catch {
      return false;
    }
  }

  /**
   * Resolve contradictions between memories
   */
  async resolveContradiction(memory1, memory2, resolution) {
    const contradiction = {
      id: `contradiction-${Date.now()}`,
      memory1: memory1.id,
      memory2: memory2.id,
      resolution,
      timestamp: Date.now()
    };

    // Apply resolution
    if (resolution === 'keep_newer') {
      const newer = memory1.timestamp > memory2.timestamp ? memory1 : memory2;
      newer.strength = Math.min(1, newer.strength + 0.2);
    } else if (resolution === 'merge') {
      // Merge both into a new memory
      memory1.associations.push(memory2.id);
      memory2.associations.push(memory1.id);
    } else if (resolution === 'deprecate_both') {
      memory1.strength *= 0.5;
      memory2.strength *= 0.5;
    }

    this.contradictions.push(contradiction);
    this.emit('contradiction:resolved', contradiction);

    return contradiction;
  }

  /**
   * Apply confidence weighting (decay + recency)
   */
  calculateConfidence(memory) {
    const daysSinceCreated = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);
    const daysSinceAccessed = (Date.now() - memory.lastAccessed) / (1000 * 60 * 60 * 24);

    // Base confidence from strength
    let confidence = memory.strength;

    // Apply decay
    confidence *= Math.pow(1 - this.confidenceDecay, daysSinceCreated);

    // Recency boost
    const recencyBoost = Math.max(0, 1 - (daysSinceAccessed / 30)) * 0.2;
    confidence = Math.min(1, confidence + recencyBoost);

    // Access frequency boost
    const frequencyBoost = Math.min(0.2, memory.accessCount * 0.01);
    confidence = Math.min(1, confidence + frequencyBoost);

    return confidence;
  }

  /**
   * Map an insight to the appropriate schema
   */
  async mapToSchema(insight, schemaType) {
    if (!SCHEMA[schemaType]) {
      throw new Error(`Unknown schema type: ${schemaType}`);
    }

    const mapped = {
      schemaType,
      fields: {},
      timestamp: Date.now()
    };

    // Extract relevant fields based on schema
    for (const field of SCHEMA[schemaType].fields) {
      if (insight[field] !== undefined) {
        mapped.fields[field] = insight[field];
      }
    }

    this.emit('insight:mapped', mapped);
    return mapped;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SURFACE ENGINE (VOICE) - How we retrieve and present memories
// ═══════════════════════════════════════════════════════════════════════════

class SurfaceEngine extends EventEmitter {
  constructor(memorySystem, processEngine) {
    super();
    this.memory = memorySystem;
    this.process = processEngine;
    this.resonanceThreshold = GOLDEN.ACCEPTABLE; // 0.382
    this.proactiveTriggers = new Map();
  }

  /**
   * Retrieve relevant memory for a given context
   */
  async retrieveMemory(userId, context, avatar = null) {
    // Get base memories
    let memories = await this.memory.recall(userId, context.query, {
      limit: 20,
      types: context.types || Object.keys(MEMORY_TYPES)
    });

    // Filter by avatar if specified
    if (avatar) {
      memories = this.filterByAvatar(memories, avatar);
    }

    // Filter by context relevance
    memories = this.filterContext(memories, context);

    // Calculate confidence for each
    memories = memories.map(m => ({
      ...m,
      confidence: this.process.calculateConfidence(m)
    }));

    // Check resonance
    memories = memories.filter(m =>
      this.checkResonance(m, context) >= this.resonanceThreshold
    );

    this.emit('memory:retrieved', { count: memories.length, context });

    return memories;
  }

  /**
   * Inject memories into a prompt
   */
  async injectIntoPrompt(basePrompt, memories, options = {}) {
    if (memories.length === 0) {
      return basePrompt;
    }

    const memoryContext = memories
      .slice(0, options.maxMemories || 5)
      .map(m => `[Memory ${m.id}]: ${JSON.stringify(m.content)}`)
      .join('\n');

    return `${basePrompt}\n\nRelevant context from memory:\n${memoryContext}`;
  }

  /**
   * Match the tone of retrieved memories
   */
  toneMatch(memory, context) {
    // Extract tone indicators
    const memoryTone = this.extractTone(memory.content);
    const contextTone = context.tone || 'neutral';

    // Calculate tone alignment
    return memoryTone === contextTone ? 1.0 : 0.5;
  }

  extractTone(content) {
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    const text_lower = text.toLowerCase();

    if (text_lower.includes('!') || text_lower.includes('excited') || text_lower.includes('great')) {
      return 'enthusiastic';
    }
    if (text_lower.includes('concern') || text_lower.includes('worry') || text_lower.includes('careful')) {
      return 'cautious';
    }
    if (text_lower.includes('formal') || text_lower.includes('professional')) {
      return 'formal';
    }
    return 'neutral';
  }

  /**
   * Check resonance between memory and context
   */
  checkResonance(memory, context) {
    let score = 0.5;  // Base resonance

    // Tone matching
    score += this.toneMatch(memory, context) * 0.2;

    // Recency bonus
    const daysSince = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);
    score += Math.max(0, (1 - daysSince / 30)) * 0.2;

    // Importance factor
    score += memory.importance * 0.1;

    return Math.min(1, score);
  }

  filterByAvatar(memories, avatar) {
    // Filter based on avatar's knowledge filter
    return memories.filter(m =>
      !avatar.excludeTags ||
      !m.tags.some(t => avatar.excludeTags.includes(t))
    );
  }

  filterContext(memories, context) {
    if (!context.requiredTags) return memories;

    return memories.filter(m =>
      context.requiredTags.every(t => m.tags.includes(t))
    );
  }

  /**
   * Register a proactive trigger
   */
  registerProactiveTrigger(triggerId, condition, action) {
    this.proactiveTriggers.set(triggerId, { condition, action });
    return this;
  }

  /**
   * Check for proactive memory surfacing
   */
  async checkProactiveTriggers(context) {
    const triggered = [];

    for (const [triggerId, trigger] of this.proactiveTriggers) {
      if (trigger.condition(context)) {
        triggered.push({
          triggerId,
          result: await trigger.action(context)
        });
      }
    }

    if (triggered.length > 0) {
      this.emit('proactive:triggered', triggered);
    }

    return triggered;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EVOLVE ENGINE (GROWTH) - How memories grow and change
// ═══════════════════════════════════════════════════════════════════════════

class EvolveEngine extends EventEmitter {
  constructor(memorySystem, processEngine) {
    super();
    this.memory = memorySystem;
    this.process = processEngine;
    this.evolutionInterval = FIBONACCI_SEQUENCE[7] * 1000; // 13 seconds
  }

  /**
   * Recalculate confidences for all memories
   */
  async recalcConfidences(agentId) {
    const memories = await this.memory.recall(agentId, '', { limit: 1000 });
    let updated = 0;

    for (const memory of memories) {
      const newConfidence = this.process.calculateConfidence(memory);
      if (Math.abs(newConfidence - memory.confidence) > 0.05) {
        memory.confidence = newConfidence;
        updated++;
      }
    }

    this.emit('confidences:recalculated', { agentId, updated });
    return updated;
  }

  /**
   * Prune ghost entries (very low confidence, never accessed)
   */
  async pruneGhostEntries(agentId, threshold = 0.1) {
    const memories = await this.memory.recall(agentId, '', { limit: 1000 });
    let pruned = 0;

    for (const memory of memories) {
      const confidence = this.process.calculateConfidence(memory);
      if (confidence < threshold && memory.accessCount === 0) {
        await this.memory.forget(agentId, memory.id);
        pruned++;
      }
    }

    this.emit('ghosts:pruned', { agentId, pruned });
    return pruned;
  }

  /**
   * Promote repeated patterns to higher status
   */
  async promoteRepeatedPatterns(captureEngine, threshold = 5) {
    const patterns = captureEngine.getEvolvingPatterns();
    let promoted = 0;

    for (const pattern of patterns) {
      if (pattern.occurrences >= threshold && pattern.confidence >= 0.7) {
        // Promote to procedural memory
        await this.memory.store('SYSTEM', {
          type: 'learned_pattern',
          pattern: pattern.pattern,
          confidence: pattern.confidence,
          occurrences: pattern.occurrences
        }, {
          type: 'PROCEDURAL',
          importance: 0.8,
          tags: ['pattern', 'learned', 'promoted']
        });
        promoted++;
      }
    }

    this.emit('patterns:promoted', { promoted });
    return promoted;
  }

  /**
   * Adaptive decay based on pattern type
   */
  getAdaptiveDecay(memoryType) {
    const decayRates = {
      EPISODIC: 0.1,      // Fast decay
      SEMANTIC: 0.01,     // Slow decay
      PROCEDURAL: 0.001,  // Very slow decay
      EMOTIONAL: 0.05,    // Medium decay
      WORKING: 1.0,       // Session only
      COLLECTIVE: 0.001   // Very slow decay
    };

    return decayRates[memoryType] || 0.05;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CALIBRATION ENGINE (MIRROR) - Self-correction and validation
// ═══════════════════════════════════════════════════════════════════════════

class CalibrationEngine extends EventEmitter {
  constructor(memorySystem, processEngine) {
    super();
    this.memory = memorySystem;
    this.process = processEngine;
    this.calibrationQueue = [];
    this.confidenceThreshold = GOLDEN.ACCEPTABLE; // 0.382
  }

  /**
   * Auto-confirm low confidence memories
   */
  async autoConfirmationLoop() {
    const toConfirm = this.calibrationQueue.filter(item =>
      item.reason === 'low_confidence' ||
      item.reason === 'contradiction' ||
      item.reason === 'shift_detected'
    );

    const confirmed = [];

    for (const item of toConfirm) {
      const result = await this.confirmMemory(item.memoryId, item.reason);
      if (result.confirmed) {
        confirmed.push(item);
        this.removeFromQueue(item.id);
      }
    }

    this.emit('calibration:complete', { confirmed: confirmed.length });
    return confirmed;
  }

  /**
   * Queue a memory for calibration
   */
  queueForCalibration(memoryId, reason, context = {}) {
    const item = {
      id: `cal-${Date.now()}`,
      memoryId,
      reason,
      context,
      queuedAt: Date.now()
    };

    this.calibrationQueue.push(item);
    this.emit('queued:calibration', item);

    return item;
  }

  /**
   * Confirm a memory's validity
   */
  async confirmMemory(memoryId, reason) {
    const memory = this.memory.index.get(memoryId);
    if (!memory) {
      return { confirmed: false, reason: 'not_found' };
    }

    // Lightweight confidence scoring
    const confidence = this.process.calculateConfidence(memory);

    if (confidence >= this.confidenceThreshold) {
      // Memory is valid, boost it
      memory.strength = Math.min(1, memory.strength + 0.1);
      return { confirmed: true, newConfidence: confidence };
    }

    // Memory needs external validation or should be deprecated
    return { confirmed: false, reason: 'low_confidence', confidence };
  }

  removeFromQueue(itemId) {
    this.calibrationQueue = this.calibrationQueue.filter(i => i.id !== itemId);
  }

  getCalibrationQueue() {
    return [...this.calibrationQueue];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSFER ENGINE (CROSS-AVATAR) - Moving memories between contexts
// ═══════════════════════════════════════════════════════════════════════════

class TransferEngine extends EventEmitter {
  constructor(memorySystem) {
    super();
    this.memory = memorySystem;
    this.avatarFilters = new Map();
    this.transferLog = [];
  }

  /**
   * Route a memory to the appropriate avatar/context
   */
  async routeMemory(memory, targetAvatar) {
    const filter = this.avatarFilters.get(targetAvatar);

    if (filter && !this.passesFilter(memory, filter)) {
      return { routed: false, reason: 'filtered_out' };
    }

    // Apply persona-adjusted injection
    const adjusted = this.adjustForPersona(memory, targetAvatar);

    this.transferLog.push({
      memoryId: memory.id,
      from: memory.context?.avatar || 'default',
      to: targetAvatar,
      timestamp: Date.now()
    });

    this.emit('memory:routed', { memory: adjusted, avatar: targetAvatar });

    return { routed: true, memory: adjusted };
  }

  /**
   * Register an avatar filter profile
   */
  registerAvatarFilter(avatarId, filter) {
    this.avatarFilters.set(avatarId, {
      includeTags: filter.includeTags || [],
      excludeTags: filter.excludeTags || [],
      minConfidence: filter.minConfidence || 0.3,
      maxAge: filter.maxAge || null,  // Days
      ...filter
    });
    return this;
  }

  passesFilter(memory, filter) {
    // Check tag inclusion
    if (filter.includeTags.length > 0) {
      if (!memory.tags.some(t => filter.includeTags.includes(t))) {
        return false;
      }
    }

    // Check tag exclusion
    if (filter.excludeTags.length > 0) {
      if (memory.tags.some(t => filter.excludeTags.includes(t))) {
        return false;
      }
    }

    // Check confidence
    if (memory.confidence < filter.minConfidence) {
      return false;
    }

    // Check age
    if (filter.maxAge) {
      const daysSince = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);
      if (daysSince > filter.maxAge) {
        return false;
      }
    }

    return true;
  }

  /**
   * Adjust memory content for a specific persona
   */
  adjustForPersona(memory, avatarId) {
    const filter = this.avatarFilters.get(avatarId);

    return {
      ...memory,
      _adjustedFor: avatarId,
      _adjustedAt: Date.now(),
      // Could modify tone, detail level, etc. based on persona
    };
  }

  /**
   * Apply versioned overlay for delta patching
   */
  async applyDelta(baseMemory, delta, version) {
    const patched = {
      ...baseMemory,
      content: this.mergeDelta(baseMemory.content, delta),
      version,
      lastPatched: Date.now(),
      patchHistory: [
        ...(baseMemory.patchHistory || []),
        { delta, version, timestamp: Date.now() }
      ]
    };

    this.emit('delta:applied', { memoryId: baseMemory.id, version });

    return patched;
  }

  mergeDelta(base, delta) {
    if (typeof base === 'object' && typeof delta === 'object') {
      return { ...base, ...delta };
    }
    return delta;
  }

  getTransferLog(limit = 20) {
    return this.transferLog.slice(-limit);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY SPINE - The unified memory architecture
// ═══════════════════════════════════════════════════════════════════════════

class MemorySpine extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      storagePath: config.storagePath || './data/memory',
      ...config
    };

    // Core memory system
    this.core = new AgentMemorySystem(this.config);

    // The five engines
    this.capture = new CaptureEngine(this.core);
    this.process = new ProcessEngine(this.core);
    this.surface = new SurfaceEngine(this.core, this.process);
    this.evolve = new EvolveEngine(this.core, this.process);
    this.calibrate = new CalibrationEngine(this.core, this.process);
    this.transfer = new TransferEngine(this.core);

    // Schema reference
    this.schema = SCHEMA;

    // Stats
    this.stats = {
      signalsCaptured: 0,
      memoriesProcessed: 0,
      memoriesSurfaced: 0,
      patternsEvolved: 0,
      memoriesCalibrated: 0,
      memoriesTransferred: 0
    };

    this.signature = 'JB$';

    // Wire up events
    this.wireEvents();

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║              MEMORY SPINE INITIALIZED                         ║
╠══════════════════════════════════════════════════════════════╣
║  Capture → Process → Surface → Evolve → Calibrate → Transfer ║
║                                                               ║
║  Engines: 6 | Schema Types: ${Object.keys(SCHEMA).length.toString().padEnd(26)}║
║  Signature: ${this.signature.padEnd(46)}║
╚══════════════════════════════════════════════════════════════╝
    `);
  }

  wireEvents() {
    this.capture.on('signal:captured', () => this.stats.signalsCaptured++);
    this.process.on('insight:mapped', () => this.stats.memoriesProcessed++);
    this.surface.on('memory:retrieved', () => this.stats.memoriesSurfaced++);
    this.evolve.on('patterns:promoted', (d) => this.stats.patternsEvolved += d.promoted);
    this.calibrate.on('calibration:complete', (d) => this.stats.memoriesCalibrated += d.confirmed);
    this.transfer.on('memory:routed', () => this.stats.memoriesTransferred++);
  }

  async initialize() {
    await this.core.initialize();
    this.emit('initialized', this.getStats());
    return this;
  }

  getStats() {
    return {
      ...this.stats,
      coreStats: this.core.getStats(),
      capturedSignals: this.capture.signalBuffer.length,
      evolvingPatterns: this.capture.patternBuffer.length,
      calibrationQueue: this.calibrate.calibrationQueue.length,
      signature: this.signature
    };
  }

  getSchema() {
    return SCHEMA;
  }

  async shutdown() {
    await this.core.shutdown();
    this.emit('shutdown');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  MemorySpine,
  CaptureEngine,
  ProcessEngine,
  SurfaceEngine,
  EvolveEngine,
  CalibrationEngine,
  TransferEngine,
  SCHEMA
};
