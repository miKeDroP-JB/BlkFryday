/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RELATIONSHIP INTELLIGENCE SCHEMA
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * The data structure that captures everything we learn about a human.
 * Not surveillance. Understanding.
 *
 * "Help humans align. With themselves. With each other. With AI. With truth."
 *
 * Created: December 2, 2025
 * Architect: JB + Claude
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const SCHEMA_VERSION = '1.0.0';

/**
 * Trust levels between user and avatar
 */
const TrustLevel = {
  NEW: 1,           // First few sessions
  BUILDING: 2,      // Establishing patterns
  ESTABLISHED: 3,   // Consistent relationship
  DEEP: 4,          // High trust, vulnerability
  RESONANCE: 5      // Flow state achieved
};

/**
 * Confidence levels for learned patterns
 */
const ConfidenceLevel = {
  INFERRED: 'inferred',           // Deduced from behavior
  STATED: 'stated',               // User explicitly said
  CONFIRMED: 'confirmed',         // Inferred then validated
  DEMONSTRATED: 'demonstrated'    // Proven through action
};

/**
 * Complete User Relationship Schema
 */
class RelationshipSchema {
  constructor(userId) {
    this.schema_version = SCHEMA_VERSION;
    this.user_id = userId;
    this.created_at = new Date().toISOString();
    this.last_updated = new Date().toISOString();

    // Core identity
    this.identity = {
      name: null,
      preferred_name: null,
      pronouns: null,
      timezone: null,
      locale: null,
      core_values: [],           // [{value, confidence, source, examples}]
      personality_indicators: [], // [{trait, confidence, evidence}]
      communication_style: null   // direct, diplomatic, analytical, etc
    };

    // How they operate
    this.operating_style = {
      communication: {
        preferred_tone: null,     // formal, casual, mixed
        verbosity_preference: null, // concise, detailed, adaptive
        feedback_style: null,     // direct, sandwiched, socratic
        humor_receptiveness: 0.5  // 0-1 scale
      },
      work_patterns: {
        peak_hours: [],           // when they're most active
        session_length_preference: null,
        break_patterns: [],
        deadline_behavior: null   // early, just-in-time, procrastinator
      },
      decision_making: {
        style: null,              // analytical, intuitive, consultative
        risk_tolerance: 0.5,      // 0-1 scale
        needs_before_deciding: [] // data, time, validation, etc
      }
    };

    // What they know
    this.knowledge_map = {
      mastered: [],     // [{domain, confidence, last_demonstrated}]
      proficient: [],   // [{domain, confidence, gaps}]
      learning: [],     // [{domain, current_level, goals}]
      curious_about: [],// [{domain, interest_level, trigger}]
      explicitly_unknown: [] // [{domain, acknowledged_date}]
    };

    // What they're working toward
    this.goals = {
      life_level: [],    // [{goal, timeframe, values_alignment, progress}]
      quarter_level: [], // [{goal, deadline, dependencies, status}]
      week_level: [],    // [{goal, priority, blockers, next_actions}]
      session_level: []  // [{goal, context, completion_criteria}]
    };

    // Shared language
    this.lexicon = {
      terms: [],         // [{term, definition, context, first_used}]
      abbreviations: [], // [{abbr, expansion, domain}]
      inside_references: [], // [{reference, meaning, origin_session}]
      project_vocabulary: {} // {project_name: [{term, meaning}]}
    };

    // Patterns in their behavior
    this.behavioral_patterns = {
      triggers: {
        frustration: [],    // [{pattern, signs, de_escalation}]
        engagement: [],     // [{pattern, signs, amplification}]
        disengagement: [],  // [{pattern, signs, re_engagement}]
        breakthrough: []    // [{pattern, precursors, catalysts}]
      },
      preferences: {
        explanation_depth: null,  // surface, moderate, deep
        example_types: [],        // code, analogy, real_world, visual
        learning_sequence: null   // theory_first, example_first, try_first
      },
      anti_patterns: []    // [{pattern, avoid_because, alternative}]
    };

    // Relationship with each avatar
    this.avatar_relationships = {
      // Keyed by avatar name
      // {avatar: {trust_level, total_sessions, total_artifacts,
      //           learned_preferences, breakthrough_moments, friction_points}}
    };

    // Flow states achieved
    this.resonance = {
      states: [],  // [{timestamp, trigger, duration, quality, context}]
      entry_patterns: [],  // What leads to resonance
      exit_patterns: [],   // What breaks resonance
      optimal_conditions: {} // {time, topic, avatar, energy_level}
    };

    // Evolution tracking
    this.evolution = {
      schema_changes: [],  // [{timestamp, field, old_value, new_value, source}]
      confidence_adjustments: [], // [{timestamp, pattern, adjustment, reason}]
      major_updates: [],   // [{timestamp, summary, trigger}]
      recency_weights: {}  // {pattern_id: last_reinforced}
    };

    // Privacy and consent
    this.privacy = {
      data_sharing_consent: {},  // {avatar: consent_level}
      sensitive_topics: [],      // Topics to handle with care
      boundaries: [],            // Explicitly stated boundaries
      export_history: []         // [{timestamp, format, destination}]
    };
  }

  /**
   * Update the schema and track the change
   */
  update(field, value, source = 'inferred') {
    const oldValue = this._getNestedValue(field);
    this._setNestedValue(field, value);

    this.evolution.schema_changes.push({
      timestamp: new Date().toISOString(),
      field,
      old_value: oldValue,
      new_value: value,
      source
    });

    this.last_updated = new Date().toISOString();
    return this;
  }

  /**
   * Add or update avatar relationship
   */
  updateAvatarRelationship(avatar, updates) {
    if (!this.avatar_relationships[avatar]) {
      this.avatar_relationships[avatar] = {
        trust_level: TrustLevel.NEW,
        total_sessions: 0,
        total_artifacts: 0,
        first_interaction: new Date().toISOString(),
        last_interaction: null,
        learned_preferences: [],
        breakthrough_moments: [],
        friction_points: [],
        handoff_notes: []
      };
    }

    Object.assign(this.avatar_relationships[avatar], updates);
    this.avatar_relationships[avatar].last_interaction = new Date().toISOString();
    return this;
  }

  /**
   * Record a resonance state
   */
  recordResonance(trigger, duration, quality, context) {
    this.resonance.states.push({
      timestamp: new Date().toISOString(),
      trigger,
      duration,
      quality,
      context,
      how_to_reenter: context // Store for future reference
    });

    // Update entry patterns
    if (!this.resonance.entry_patterns.includes(trigger)) {
      this.resonance.entry_patterns.push(trigger);
    }

    return this;
  }

  /**
   * Add to shared lexicon
   */
  addTerm(term, definition, context) {
    const existing = this.lexicon.terms.find(t => t.term === term);
    if (existing) {
      existing.definition = definition;
      existing.last_used = new Date().toISOString();
    } else {
      this.lexicon.terms.push({
        term,
        definition,
        context,
        first_used: new Date().toISOString(),
        last_used: new Date().toISOString(),
        usage_count: 1
      });
    }
    return this;
  }

  /**
   * Update knowledge map
   */
  updateKnowledge(domain, level, confidence = 0.7) {
    // Remove from other levels
    ['mastered', 'proficient', 'learning', 'curious_about'].forEach(l => {
      this.knowledge_map[l] = this.knowledge_map[l].filter(k => k.domain !== domain);
    });

    // Add to appropriate level
    this.knowledge_map[level].push({
      domain,
      confidence,
      last_demonstrated: new Date().toISOString()
    });

    return this;
  }

  /**
   * Serialize for storage
   */
  toJSON() {
    // Create a plain object copy to avoid circular references
    const plain = {
      schema_version: this.schema_version,
      user_id: this.user_id,
      created_at: this.created_at,
      last_updated: this.last_updated,
      identity: this.identity,
      operating_style: this.operating_style,
      knowledge_map: this.knowledge_map,
      goals: this.goals,
      lexicon: this.lexicon,
      behavioral_patterns: this.behavioral_patterns,
      avatar_relationships: this.avatar_relationships,
      resonance: this.resonance,
      evolution: this.evolution,
      privacy: this.privacy
    };
    return JSON.stringify(plain, null, 2);
  }

  /**
   * Deserialize from storage
   */
  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    const schema = new RelationshipSchema(data.user_id);
    Object.assign(schema, data);
    return schema;
  }

  // Helper methods
  _getNestedValue(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this);
  }

  _setNestedValue(path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const obj = keys.reduce((o, k) => o[k] = o[k] || {}, this);
    obj[last] = value;
  }
}

/**
 * Session context for active interactions
 */
class SessionContext {
  constructor(userId, avatar, schema) {
    this.session_id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.user_id = userId;
    this.avatar = avatar;
    // Store reference for runtime use (not serialized)
    this._schema = schema;
    this.session_start = new Date().toISOString();
    this.session_end = null;

    // Session-specific state
    this.messages = [];
    this.signals_captured = [];
    this.insights_generated = [];
    this.artifacts_created = [];
    this.calibrations_triggered = [];

    // Current state
    this.current_goal = null;
    this.current_topic = null;
    this.resonance_active = false;
    this.trust_at_start = schema.avatar_relationships[avatar]?.trust_level || TrustLevel.NEW;
  }

  // Getter for runtime access to schema
  get schema() {
    return this._schema;
  }

  addMessage(role, content, metadata = {}) {
    this.messages.push({
      timestamp: new Date().toISOString(),
      role,
      content,
      ...metadata
    });
  }

  addSignal(signal) {
    this.signals_captured.push({
      timestamp: new Date().toISOString(),
      ...signal
    });
  }

  addInsight(insight) {
    this.insights_generated.push({
      timestamp: new Date().toISOString(),
      ...insight
    });
  }

  end(outcomes = {}) {
    this.session_end = new Date().toISOString();
    this.outcomes = outcomes;
    return this;
  }

  /**
   * Serialize for storage (excludes schema reference)
   */
  toJSON() {
    return {
      session_id: this.session_id,
      user_id: this.user_id,
      avatar: this.avatar,
      session_start: this.session_start,
      session_end: this.session_end,
      messages: this.messages,
      signals_captured: this.signals_captured,
      insights_generated: this.insights_generated,
      artifacts_created: this.artifacts_created,
      calibrations_triggered: this.calibrations_triggered,
      current_goal: this.current_goal,
      current_topic: this.current_topic,
      resonance_active: this.resonance_active,
      trust_at_start: this.trust_at_start,
      outcomes: this.outcomes
    };
  }
}

module.exports = {
  SCHEMA_VERSION,
  TrustLevel,
  ConfidenceLevel,
  RelationshipSchema,
  SessionContext
};
