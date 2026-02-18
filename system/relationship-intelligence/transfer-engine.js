/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TRANSFER ENGINE - Multi-Avatar Context Transfer
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * The Pantheon speaks with many voices, but shares one memory.
 * This engine enables seamless handoffs between avatars.
 *
 * Transfer Types:
 * 1. Avatar Handoff - User switches from one avatar to another
 * 2. Context Sync - Keep all avatars updated on user state
 * 3. Expertise Routing - Route to best avatar for topic
 * 4. Collective Learning - Share patterns across avatars
 *
 * "Many voices. One understanding."
 *
 * Created: December 2, 2025
 * Architect: JB + Claude
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { TrustLevel } = require('./schema');

/**
 * Transfer priority levels
 */
const TransferPriority = {
  CRITICAL: 'critical',     // Must transfer - safety, boundaries
  HIGH: 'high',             // Should transfer - current context
  MEDIUM: 'medium',         // Nice to transfer - preferences
  LOW: 'low',               // Background - patterns
  OPTIONAL: 'optional'      // Only if space permits
};

/**
 * Avatar expertise definitions
 */
const AvatarExpertise = {
  SOLO: ['coding', 'debugging', 'architecture', 'algorithms'],
  SAGE: ['wisdom', 'philosophy', 'ethics', 'strategy'],
  SPARK: ['creativity', 'brainstorming', 'ideas', 'innovation'],
  SHIELD: ['security', 'privacy', 'protection', 'compliance'],
  SCRIBE: ['documentation', 'writing', 'communication', 'narrative'],
  SCOUT: ['research', 'analysis', 'investigation', 'discovery'],
  SYNC: ['coordination', 'project_management', 'workflow', 'integration']
};

/**
 * A handoff package
 */
class HandoffPackage {
  constructor(fromAvatar, toAvatar, schema) {
    this.id = `handoff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.timestamp = new Date().toISOString();
    this.from_avatar = fromAvatar;
    this.to_avatar = toAvatar;
    this.user_id = schema.user_id;

    // Layers of context
    this.critical = {};     // Must be known
    this.context = {};      // Current session state
    this.preferences = {};  // User preferences
    this.history = {};      // Relevant past
    this.hints = [];        // Suggestions for receiving avatar
  }

  /**
   * Build prompt context string
   */
  toPromptContext() {
    const lines = [
      `--- Handoff from ${this.from_avatar} ---`,
      ''
    ];

    // Critical items first
    if (Object.keys(this.critical).length > 0) {
      lines.push('CRITICAL:');
      for (const [key, value] of Object.entries(this.critical)) {
        lines.push(`  ${key}: ${value}`);
      }
      lines.push('');
    }

    // Current context
    if (Object.keys(this.context).length > 0) {
      lines.push('Current Context:');
      for (const [key, value] of Object.entries(this.context)) {
        lines.push(`  ${key}: ${value}`);
      }
      lines.push('');
    }

    // Preferences
    if (Object.keys(this.preferences).length > 0) {
      lines.push('User Preferences:');
      for (const [key, value] of Object.entries(this.preferences)) {
        lines.push(`  ${key}: ${value}`);
      }
      lines.push('');
    }

    // Hints
    if (this.hints.length > 0) {
      lines.push('Suggestions:');
      for (const hint of this.hints) {
        lines.push(`  - ${hint}`);
      }
      lines.push('');
    }

    lines.push('--- End Handoff ---');
    return lines.join('\n');
  }
}

/**
 * The Transfer Engine
 */
class TransferEngine {
  constructor() {
    this.handoffHistory = [];
    this.syncState = new Map();  // avatar -> last sync time
    this.routingRules = new Map();  // topic -> preferred avatar

    // Initialize default routing
    this._initializeRouting();
  }

  /**
   * Initialize default routing rules
   */
  _initializeRouting() {
    for (const [avatar, topics] of Object.entries(AvatarExpertise)) {
      for (const topic of topics) {
        this.routingRules.set(topic.toLowerCase(), avatar);
      }
    }
  }

  /**
   * Create a handoff package
   */
  createHandoff(fromAvatar, toAvatar, schema, session = null) {
    const pkg = new HandoffPackage(fromAvatar, toAvatar, schema);

    // Build critical layer
    this._buildCriticalLayer(pkg, schema);

    // Build context layer
    this._buildContextLayer(pkg, schema, session);

    // Build preferences layer
    this._buildPreferencesLayer(pkg, schema);

    // Build history layer
    this._buildHistoryLayer(pkg, schema, fromAvatar);

    // Build hints
    this._buildHints(pkg, schema, fromAvatar, toAvatar);

    // Record handoff
    this.handoffHistory.push({
      id: pkg.id,
      timestamp: pkg.timestamp,
      from: fromAvatar,
      to: toAvatar,
      user_id: schema.user_id
    });

    return pkg;
  }

  /**
   * Build critical layer - safety and boundaries
   */
  _buildCriticalLayer(pkg, schema) {
    // Boundaries are always critical
    if (schema.privacy.boundaries.length > 0) {
      pkg.critical.boundaries = schema.privacy.boundaries.join('; ');
    }

    // Sensitive topics
    if (schema.privacy.sensitive_topics.length > 0) {
      pkg.critical.sensitive_topics = schema.privacy.sensitive_topics.join(', ');
    }

    // Anti-patterns
    const antiPatterns = schema.behavioral_patterns.anti_patterns;
    if (antiPatterns.length > 0) {
      pkg.critical.avoid = antiPatterns.map(a => a.pattern).join('; ');
    }

    // Trust level
    const fromRel = schema.avatar_relationships[pkg.from_avatar];
    if (fromRel) {
      pkg.critical.trust_level = this._trustLevelName(fromRel.trust_level);
    }
  }

  /**
   * Build context layer - current session state
   */
  _buildContextLayer(pkg, schema, session) {
    // Current goals
    if (schema.goals.session_level.length > 0) {
      pkg.context.current_goal = schema.goals.session_level[0].goal;
    }

    // Week goals for broader context
    if (schema.goals.week_level.length > 0) {
      pkg.context.week_goal = schema.goals.week_level[0].goal;
    }

    // If we have session data
    if (session) {
      if (session.current_topic) {
        pkg.context.topic = session.current_topic;
      }
      if (session.resonance_active) {
        pkg.context.resonance = 'User was in flow state';
      }
      if (session.artifacts_created.length > 0) {
        pkg.context.recent_work = `Created ${session.artifacts_created.length} artifacts`;
      }
    }

    // User's name
    if (schema.identity.preferred_name) {
      pkg.context.name = schema.identity.preferred_name;
    }
  }

  /**
   * Build preferences layer
   */
  _buildPreferencesLayer(pkg, schema) {
    const comm = schema.operating_style.communication;

    if (comm.verbosity_preference) {
      pkg.preferences.verbosity = comm.verbosity_preference;
    }

    if (comm.preferred_tone) {
      pkg.preferences.tone = comm.preferred_tone;
    }

    if (comm.feedback_style) {
      pkg.preferences.feedback = comm.feedback_style;
    }

    // Learning preferences
    const prefs = schema.behavioral_patterns.preferences;
    if (prefs.learning_sequence) {
      pkg.preferences.learning = prefs.learning_sequence;
    }

    if (prefs.explanation_depth) {
      pkg.preferences.depth = prefs.explanation_depth;
    }
  }

  /**
   * Build history layer - relevant past interactions
   */
  _buildHistoryLayer(pkg, schema, fromAvatar) {
    const fromRel = schema.avatar_relationships[fromAvatar];

    if (fromRel) {
      pkg.history.sessions_together = fromRel.total_sessions;
      pkg.history.artifacts_created = fromRel.total_artifacts;

      // Breakthrough moments
      if (fromRel.breakthrough_moments?.length > 0) {
        const recent = fromRel.breakthrough_moments.slice(-3);
        pkg.history.breakthroughs = recent.map(b => b.type).join(', ');
      }

      // Handoff notes from previous avatar
      if (fromRel.handoff_notes?.length > 0) {
        const recentNotes = fromRel.handoff_notes.slice(-3);
        pkg.history.notes = recentNotes.map(n =>
          `${n.to}: ${n.context || 'general handoff'}`
        ).join('; ');
      }
    }

    // Check if user has history with receiving avatar
    const toRel = schema.avatar_relationships[pkg.to_avatar];
    if (toRel) {
      pkg.history.previous_sessions_with_receiver = toRel.total_sessions;
      pkg.history.receiver_trust = this._trustLevelName(toRel.trust_level);
    }
  }

  /**
   * Build hints for receiving avatar
   */
  _buildHints(pkg, schema, fromAvatar, toAvatar) {
    // If resonance patterns exist
    if (schema.resonance.entry_patterns.length > 0) {
      pkg.hints.push(`Flow triggers: ${schema.resonance.entry_patterns.slice(0, 2).join(', ')}`);
    }

    // If there are frustration patterns
    const frustration = schema.behavioral_patterns.triggers.frustration;
    if (frustration.length > 0 && frustration[0].de_escalation) {
      pkg.hints.push(`If frustrated: ${frustration[0].de_escalation}`);
    }

    // Relevant shared terms
    if (schema.lexicon.terms.length > 0) {
      const terms = schema.lexicon.terms.slice(-5).map(t => t.term);
      pkg.hints.push(`Shared vocabulary: ${terms.join(', ')}`);
    }

    // Avatar-specific hints
    if (toAvatar === 'SAGE') {
      pkg.hints.push('User may seek wisdom/perspective');
    } else if (toAvatar === 'SPARK') {
      pkg.hints.push('User may want creative exploration');
    } else if (toAvatar === 'SOLO') {
      pkg.hints.push('User likely needs hands-on coding help');
    }
  }

  /**
   * Find best avatar for a topic
   */
  routeToAvatar(topic, schema, availableAvatars = null) {
    const topicLower = topic.toLowerCase();

    // Check routing rules
    for (const [keyword, avatar] of this.routingRules) {
      if (topicLower.includes(keyword)) {
        if (!availableAvatars || availableAvatars.includes(avatar)) {
          return { avatar, reason: `Expert in ${keyword}` };
        }
      }
    }

    // Check user's avatar preferences
    let bestAvatar = null;
    let bestScore = -1;

    for (const [avatar, rel] of Object.entries(schema.avatar_relationships)) {
      if (availableAvatars && !availableAvatars.includes(avatar)) continue;

      const score = (rel.trust_level || 0) + (rel.total_sessions || 0) * 0.1;
      if (score > bestScore) {
        bestScore = score;
        bestAvatar = avatar;
      }
    }

    if (bestAvatar) {
      return { avatar: bestAvatar, reason: 'Highest trust relationship' };
    }

    // Default to SOLO for technical, SAGE for general
    const defaultAvatar = this._isLikelyTechnical(topic) ? 'SOLO' : 'SAGE';
    return { avatar: defaultAvatar, reason: 'Default routing' };
  }

  /**
   * Sync context to all avatars
   */
  syncToAll(schema, update) {
    const syncPackage = {
      timestamp: new Date().toISOString(),
      user_id: schema.user_id,
      update
    };

    // Mark sync time for all known avatars
    for (const avatar of Object.keys(schema.avatar_relationships)) {
      this.syncState.set(`${schema.user_id}:${avatar}`, syncPackage);
    }

    return syncPackage;
  }

  /**
   * Get pending sync for an avatar
   */
  getPendingSync(userId, avatar) {
    const key = `${userId}:${avatar}`;
    const sync = this.syncState.get(key);

    if (sync) {
      // Clear after reading
      this.syncState.delete(key);
      return sync;
    }

    return null;
  }

  /**
   * Learn from handoff outcomes
   */
  learnFromHandoff(handoffId, outcome) {
    const handoff = this.handoffHistory.find(h => h.id === handoffId);
    if (!handoff) return;

    handoff.outcome = outcome;

    // Adjust routing if handoff wasn't smooth
    if (outcome.smooth === false && outcome.better_target) {
      // Add new routing rule
      if (outcome.topic) {
        this.routingRules.set(outcome.topic.toLowerCase(), outcome.better_target);
      }
    }
  }

  /**
   * Check if topic is likely technical
   */
  _isLikelyTechnical(topic) {
    const technicalKeywords = [
      'code', 'bug', 'error', 'function', 'api', 'database',
      'server', 'client', 'deploy', 'test', 'debug', 'refactor'
    ];

    const topicLower = topic.toLowerCase();
    return technicalKeywords.some(kw => topicLower.includes(kw));
  }

  /**
   * Convert trust level to name
   */
  _trustLevelName(level) {
    const names = {
      [TrustLevel.NEW]: 'new',
      [TrustLevel.BUILDING]: 'building',
      [TrustLevel.ESTABLISHED]: 'established',
      [TrustLevel.DEEP]: 'deep',
      [TrustLevel.RESONANCE]: 'resonance'
    };
    return names[level] || 'unknown';
  }

  /**
   * Get transfer statistics
   */
  getStats() {
    const byPair = {};
    for (const handoff of this.handoffHistory) {
      const pair = `${handoff.from}->${handoff.to}`;
      byPair[pair] = (byPair[pair] || 0) + 1;
    }

    return {
      total_handoffs: this.handoffHistory.length,
      handoffs_by_pair: byPair,
      routing_rules: this.routingRules.size,
      pending_syncs: this.syncState.size
    };
  }

  /**
   * Export handoff history
   */
  exportHistory(limit = 100) {
    return this.handoffHistory.slice(-limit);
  }
}

module.exports = {
  TransferPriority,
  AvatarExpertise,
  HandoffPackage,
  TransferEngine
};
