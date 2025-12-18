/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RELATIONSHIP INTELLIGENCE SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * The persistent memory that makes every interaction personal.
 * The understanding that grows with every conversation.
 * The bridge between sessions, between avatars, between moments.
 *
 * This is not surveillance. This is service.
 * "Help humans align. With themselves. With each other. With AI. With truth."
 *
 * Components:
 * - PERSIST: Storage layer (schema, sessions, handoffs)
 * - CAPTURE: Signal gathering (explicit, implicit, contextual)
 * - PROCESS: Pattern recognition (aggregation, inference, confidence)
 * - SURFACE: Context injection (prompts, hints, decisions)
 * - CALIBRATE: Feedback processing (explicit, implicit, corrections)
 * - EVOLVE: Continuous learning (trust, resonance, patterns)
 * - TRANSFER: Multi-avatar handoffs (context, routing, sync)
 *
 * Created: December 2, 2025
 * Architect: JB + Claude
 * Version: 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const {
  SCHEMA_VERSION,
  TrustLevel,
  ConfidenceLevel,
  RelationshipSchema,
  SessionContext
} = require('./schema');

const {
  PersistEngine,
  MemoryBackend,
  FileBackend
} = require('./persist-engine');

const {
  SignalType,
  Signal,
  CaptureEngine
} = require('./capture-engine');

const {
  PatternCategory,
  Pattern,
  ProcessEngine
} = require('./process-engine');

const {
  RelevanceLevel,
  ContextItem,
  SurfaceEngine
} = require('./surface-engine');

const {
  FeedbackType,
  TrustEvent,
  CalibrateEngine,
  TrustEngine,
  ResonanceEngine,
  EvolveEngine
} = require('./evolve-engine');

const {
  TransferPriority,
  AvatarExpertise,
  HandoffPackage,
  TransferEngine
} = require('./transfer-engine');

/**
 * The Relationship Intelligence System - Main API
 */
class RelationshipIntelligenceSystem {
  constructor(config = {}) {
    // Configuration
    this.config = {
      storage: config.storage || 'memory',
      storagePath: config.storagePath || './data/relationships',
      maxContextTokens: config.maxContextTokens || 500,
      ...config
    };

    // Initialize storage backend
    const backend = this.config.storage === 'file'
      ? new FileBackend(this.config.storagePath)
      : new MemoryBackend();

    // Initialize all engines
    this.persist = new PersistEngine(backend);
    this.capture = new CaptureEngine();
    this.process = new ProcessEngine();
    this.surface = new SurfaceEngine(this.config.maxContextTokens);
    this.evolve = new EvolveEngine();
    this.transfer = new TransferEngine();

    // Active sessions
    this.activeSessions = new Map();  // sessionId -> SessionContext
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Start a new session with a user
   */
  async startSession(userId, avatar) {
    // Get or create schema
    const schema = await this.persist.getSchema(userId);

    // Check for pending sync from other avatars
    const pendingSync = this.transfer.getPendingSync(userId, avatar);

    // Create session context
    const session = new SessionContext(userId, avatar, schema);

    // Store active session
    this.activeSessions.set(session.session_id, session);

    // Get context for this session
    const context = this.surface.buildPromptContext(schema, {
      avatar,
      time_category: this._getTimeCategory()
    });

    return {
      session_id: session.session_id,
      schema,
      context,
      pending_sync: pendingSync,
      trust_level: schema.avatar_relationships[avatar]?.trust_level || TrustLevel.NEW,
      is_returning: schema.avatar_relationships[avatar]?.total_sessions > 0
    };
  }

  /**
   * End a session and persist learnings
   */
  async endSession(sessionId, outcomes = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }

    // End the session
    session.end(outcomes);

    // Get schema
    const schema = await this.persist.getSchema(session.user_id);

    // Process captured signals into patterns
    const patterns = this.process.process(session.signals_captured, schema);

    // Evolve the schema
    const evolution = this.evolve.evolve(session, schema, patterns);

    // Save everything
    await this.persist.saveSession(session);
    await this.persist.saveSchema(schema);

    // Remove from active sessions
    this.activeSessions.delete(sessionId);

    return {
      session_id: sessionId,
      duration_seconds: (new Date(session.session_end) - new Date(session.session_start)) / 1000,
      signals_captured: session.signals_captured.length,
      patterns_learned: patterns.length,
      evolution: evolution.changes
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGE PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Process a user message and capture signals
   */
  async processMessage(sessionId, message, metadata = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }

    // Add message to session
    session.addMessage('user', message, metadata);

    // Capture signals from the message
    const signals = this.capture.capture(message, {
      session_id: sessionId,
      avatar: session.avatar,
      message_length: message.length
    });

    // Add signals to session
    for (const signal of signals) {
      session.addSignal(signal);
    }

    // Get real-time hints
    const hints = this.surface.getHints(session.schema, message, {
      avatar: session.avatar
    });

    // Check resonance
    const resonance = this.evolve.resonance.checkResonance(
      session.signals_captured,
      session.schema,
      { avatar: session.avatar, topic: session.current_topic }
    );

    session.resonance_active = resonance.active;

    return {
      signals_captured: signals.length,
      hints,
      resonance_active: resonance.active,
      resonance_score: resonance.score
    };
  }

  /**
   * Process an assistant response
   */
  async processResponse(sessionId, response, metadata = {}) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { error: 'Session not found' };
    }

    // Add response to session
    session.addMessage('assistant', response, metadata);

    // Track artifacts if mentioned
    if (metadata.artifacts) {
      session.artifacts_created.push(...metadata.artifacts);
    }

    return { recorded: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT RETRIEVAL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get full context for prompt augmentation
   */
  async getContext(userId, options = {}) {
    const schema = await this.persist.getSchema(userId);
    return this.surface.buildPromptContext(schema, options);
  }

  /**
   * Get approach recommendation for current interaction
   */
  async getApproach(userId, options = {}) {
    const schema = await this.persist.getSchema(userId);
    return this.surface.getApproachRecommendation(schema, options);
  }

  /**
   * Recall relevant past context
   */
  async recall(userId, topic) {
    const schema = await this.persist.getSchema(userId);
    const sessions = await this.persist.getRecentSessions(userId, 10);
    return this.surface.recallRelevant(schema, topic, sessions);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPLICIT UPDATES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Update user preferences explicitly
   */
  async updatePreference(userId, field, value) {
    const schema = await this.persist.getSchema(userId);
    schema.update(field, value, ConfidenceLevel.STATED);
    await this.persist.saveSchema(schema);
    return { updated: field, value };
  }

  /**
   * Add a term to shared lexicon
   */
  async addTerm(userId, term, definition, context = null) {
    const schema = await this.persist.getSchema(userId);
    schema.addTerm(term, definition, context);
    await this.persist.saveSchema(schema);
    return { added: term };
  }

  /**
   * Set a goal
   */
  async setGoal(userId, level, goal, metadata = {}) {
    const schema = await this.persist.getSchema(userId);
    const goalEntry = {
      goal,
      set_at: new Date().toISOString(),
      ...metadata
    };

    schema.goals[level].unshift(goalEntry);
    await this.persist.saveSchema(schema);
    return { level, goal: goalEntry };
  }

  /**
   * Process explicit feedback
   */
  async processFeedback(userId, type, target, content) {
    const schema = await this.persist.getSchema(userId);
    const result = this.evolve.processFeedback(type, target, content, schema);
    await this.persist.saveSchema(schema);
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AVATAR HANDOFFS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handoff from one avatar to another
   */
  async handoff(userId, fromAvatar, toAvatar) {
    const schema = await this.persist.getSchema(userId);

    // Find active session if any
    let activeSession = null;
    for (const session of this.activeSessions.values()) {
      if (session.user_id === userId && session.avatar === fromAvatar) {
        activeSession = session;
        break;
      }
    }

    // Create handoff package
    const pkg = this.transfer.createHandoff(fromAvatar, toAvatar, schema, activeSession);

    // Record trust event
    this.evolve.trust.recordEvent(fromAvatar, TrustEvent.CONSISTENCY_SHOWN, {
      action: 'handoff',
      to: toAvatar
    });

    // Update schema with handoff
    schema.updateAvatarRelationship(fromAvatar, {
      handoff_notes: [
        ...(schema.avatar_relationships[fromAvatar]?.handoff_notes || []),
        { to: toAvatar, timestamp: pkg.timestamp, topic: activeSession?.current_topic }
      ]
    });

    await this.persist.saveSchema(schema);

    return {
      handoff_id: pkg.id,
      context: pkg.toPromptContext(),
      package: pkg
    };
  }

  /**
   * Route to best avatar for topic
   */
  async routeToAvatar(userId, topic, availableAvatars = null) {
    const schema = await this.persist.getSchema(userId);
    return this.transfer.routeToAvatar(topic, schema, availableAvatars);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRUST & RESONANCE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get trust level for an avatar
   */
  async getTrustLevel(userId, avatar) {
    const schema = await this.persist.getSchema(userId);
    return this.evolve.trust.calculateTrust(schema, avatar);
  }

  /**
   * Record a trust event
   */
  async recordTrustEvent(userId, avatar, event, context = {}) {
    const schema = await this.persist.getSchema(userId);
    this.evolve.trust.recordEvent(avatar, event, context);
    const update = this.evolve.trust.updateTrust(schema, avatar);
    await this.persist.saveSchema(schema);
    return update;
  }

  /**
   * Get optimal conditions for resonance
   */
  async getResonanceConditions(userId) {
    const schema = await this.persist.getSchema(userId);
    return this.evolve.resonance.getOptimalConditions(schema);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Export all user data
   */
  async exportUserData(userId) {
    return await this.persist.exportUserData(userId);
  }

  /**
   * Delete all user data
   */
  async deleteUserData(userId) {
    return await this.persist.deleteUserData(userId);
  }

  /**
   * Get schema directly
   */
  async getSchema(userId) {
    return await this.persist.getSchema(userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATISTICS & MONITORING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get comprehensive system statistics
   */
  async getStats() {
    const persistStats = await this.persist.getStats();

    return {
      persist: persistStats,
      capture: this.capture.getStats(),
      process: this.process.getStats(),
      surface: this.surface.getStats(),
      evolve: this.evolve.getStats(),
      transfer: this.transfer.getStats(),
      active_sessions: this.activeSessions.size
    };
  }

  /**
   * Get active sessions
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.values()).map(s => ({
      session_id: s.session_id,
      user_id: s.user_id,
      avatar: s.avatar,
      started: s.session_start,
      messages: s.messages.length,
      signals: s.signals_captured.length,
      resonance_active: s.resonance_active
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get current time category
   */
  _getTimeCategory() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
}

// Export everything
module.exports = {
  // Main system
  RelationshipIntelligenceSystem,

  // Schema
  SCHEMA_VERSION,
  TrustLevel,
  ConfidenceLevel,
  RelationshipSchema,
  SessionContext,

  // Persist
  PersistEngine,
  MemoryBackend,
  FileBackend,

  // Capture
  SignalType,
  Signal,
  CaptureEngine,

  // Process
  PatternCategory,
  Pattern,
  ProcessEngine,

  // Surface
  RelevanceLevel,
  ContextItem,
  SurfaceEngine,

  // Evolve
  FeedbackType,
  TrustEvent,
  CalibrateEngine,
  TrustEngine,
  ResonanceEngine,
  EvolveEngine,

  // Transfer
  TransferPriority,
  AvatarExpertise,
  HandoffPackage,
  TransferEngine
};
