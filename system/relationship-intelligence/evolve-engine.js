/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * EVOLVE ENGINE - Learning & Calibration System
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * The relationship that doesn't grow dies.
 * This engine ensures continuous evolution through feedback loops.
 *
 * Components:
 * 1. CALIBRATE - Process explicit feedback
 * 2. EVOLVE - Learn from patterns over time
 * 3. TRUST - Calculate and update trust scores
 * 4. RESONANCE - Detect and nurture flow states
 *
 * "Always improving. Never finished."
 *
 * Created: December 2, 2025
 * Architect: JB + Claude
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { TrustLevel, ConfidenceLevel } = require('./schema');
const { SignalType } = require('./capture-engine');
const { PatternCategory } = require('./process-engine');

/**
 * Feedback types
 */
const FeedbackType = {
  EXPLICIT_POSITIVE: 'explicit_positive',
  EXPLICIT_NEGATIVE: 'explicit_negative',
  EXPLICIT_CORRECTION: 'explicit_correction',
  IMPLICIT_POSITIVE: 'implicit_positive',
  IMPLICIT_NEGATIVE: 'implicit_negative'
};

/**
 * Trust change events
 */
const TrustEvent = {
  VULNERABILITY_SHARED: 'vulnerability_shared',
  HELPFUL_RESPONSE: 'helpful_response',
  MISUNDERSTANDING: 'misunderstanding',
  BOUNDARY_RESPECTED: 'boundary_respected',
  BOUNDARY_VIOLATED: 'boundary_violated',
  CONSISTENCY_SHOWN: 'consistency_shown',
  RESONANCE_ACHIEVED: 'resonance_achieved'
};

/**
 * The Calibrate Engine - processes feedback
 */
class CalibrateEngine {
  constructor() {
    this.feedbackHistory = [];
    this.calibrations = new Map();  // pattern -> calibration data
  }

  /**
   * Process explicit feedback
   */
  processFeedback(feedback, schema) {
    const calibration = {
      timestamp: new Date().toISOString(),
      type: feedback.type,
      target: feedback.target,  // What they're giving feedback about
      content: feedback.content,
      applied: false
    };

    this.feedbackHistory.push(calibration);

    // Apply the calibration
    const updates = this._applyCalibration(calibration, schema);
    calibration.applied = true;
    calibration.updates = updates;

    return calibration;
  }

  /**
   * Apply a calibration to the schema
   */
  _applyCalibration(calibration, schema) {
    const updates = [];

    switch (calibration.type) {
      case FeedbackType.EXPLICIT_POSITIVE:
        // Reinforce the pattern
        if (calibration.target) {
          const existing = this.calibrations.get(calibration.target) || {
            reinforcements: 0,
            corrections: 0
          };
          existing.reinforcements++;
          this.calibrations.set(calibration.target, existing);

          // If it's about communication style
          if (calibration.target.includes('style')) {
            schema.update(
              'operating_style.communication.preferred_tone',
              calibration.content,
              ConfidenceLevel.CONFIRMED
            );
            updates.push('communication_style_confirmed');
          }
        }
        break;

      case FeedbackType.EXPLICIT_NEGATIVE:
        // Record what to avoid
        schema.behavioral_patterns.anti_patterns.push({
          pattern: calibration.target || calibration.content,
          avoid_because: 'explicit_negative_feedback',
          alternative: calibration.alternative || null,
          recorded: new Date().toISOString()
        });
        updates.push('anti_pattern_added');
        break;

      case FeedbackType.EXPLICIT_CORRECTION:
        // Update the specific field
        if (calibration.field && calibration.value) {
          schema.update(
            calibration.field,
            calibration.value,
            ConfidenceLevel.STATED
          );
          updates.push(`field_updated:${calibration.field}`);
        }

        // If it's a term correction
        if (calibration.term) {
          schema.addTerm(
            calibration.term,
            calibration.value,
            'user_correction'
          );
          updates.push('term_corrected');
        }
        break;

      case FeedbackType.IMPLICIT_POSITIVE:
        // Subtle reinforcement
        if (calibration.target) {
          const existing = this.calibrations.get(calibration.target) || {
            reinforcements: 0,
            corrections: 0
          };
          existing.reinforcements += 0.5;  // Weaker signal
          this.calibrations.set(calibration.target, existing);
        }
        break;

      case FeedbackType.IMPLICIT_NEGATIVE:
        // Subtle discouragement
        if (calibration.target) {
          const existing = this.calibrations.get(calibration.target) || {
            reinforcements: 0,
            corrections: 0
          };
          existing.corrections += 0.5;
          this.calibrations.set(calibration.target, existing);

          // If strong enough, add as anti-pattern
          if (existing.corrections >= 3) {
            schema.behavioral_patterns.anti_patterns.push({
              pattern: calibration.target,
              avoid_because: 'repeated_implicit_negative',
              recorded: new Date().toISOString()
            });
            updates.push('implicit_anti_pattern_added');
          }
        }
        break;
    }

    return updates;
  }

  /**
   * Infer feedback from interaction outcomes
   */
  inferFeedback(signals, response, schema) {
    const inferred = [];

    // Check for satisfaction after response
    const satisfaction = signals.find(s => s.type === SignalType.SATISFACTION_MARKER);
    if (satisfaction && satisfaction.value.intensity > 0.7) {
      inferred.push({
        type: FeedbackType.IMPLICIT_POSITIVE,
        target: 'last_response_approach',
        content: 'High satisfaction detected'
      });
    }

    // Check for frustration after response
    const frustration = signals.find(s => s.type === SignalType.FRUSTRATION_MARKER);
    if (frustration && frustration.value.intensity > 0.6) {
      inferred.push({
        type: FeedbackType.IMPLICIT_NEGATIVE,
        target: 'last_response_approach',
        content: 'Frustration detected'
      });
    }

    // Check for immediate follow-up question (might indicate confusion)
    const isFollowUpQuestion = response && /^(what|how|why|but|wait)\b/i.test(response);
    if (isFollowUpQuestion) {
      inferred.push({
        type: FeedbackType.IMPLICIT_NEGATIVE,
        target: 'explanation_clarity',
        content: 'User needed clarification'
      });
    }

    // Process all inferred feedback
    for (const feedback of inferred) {
      this.processFeedback(feedback, schema);
    }

    return inferred;
  }

  /**
   * Get calibration statistics
   */
  getStats() {
    let totalReinforcements = 0;
    let totalCorrections = 0;

    for (const [pattern, data] of this.calibrations) {
      totalReinforcements += data.reinforcements;
      totalCorrections += data.corrections;
    }

    return {
      total_feedback_items: this.feedbackHistory.length,
      patterns_calibrated: this.calibrations.size,
      total_reinforcements: totalReinforcements,
      total_corrections: totalCorrections
    };
  }
}

/**
 * The Trust Engine - calculates and updates trust
 */
class TrustEngine {
  constructor() {
    this.trustHistory = [];
    this.weights = {
      [TrustEvent.VULNERABILITY_SHARED]: 0.3,
      [TrustEvent.HELPFUL_RESPONSE]: 0.1,
      [TrustEvent.MISUNDERSTANDING]: -0.15,
      [TrustEvent.BOUNDARY_RESPECTED]: 0.2,
      [TrustEvent.BOUNDARY_VIOLATED]: -0.4,
      [TrustEvent.CONSISTENCY_SHOWN]: 0.1,
      [TrustEvent.RESONANCE_ACHIEVED]: 0.25
    };
  }

  /**
   * Record a trust event
   */
  recordEvent(avatar, event, context = {}) {
    const record = {
      timestamp: new Date().toISOString(),
      avatar,
      event,
      weight: this.weights[event] || 0,
      context
    };

    this.trustHistory.push(record);
    return record;
  }

  /**
   * Calculate current trust level for an avatar
   */
  calculateTrust(schema, avatar) {
    const relationship = schema.avatar_relationships[avatar];
    if (!relationship) {
      return TrustLevel.NEW;
    }

    // Get recent trust events for this avatar
    const recentEvents = this.trustHistory.filter(
      e => e.avatar === avatar &&
           Date.now() - new Date(e.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000  // 30 days
    );

    // Calculate trust score
    let trustScore = relationship.total_sessions * 0.05;  // Base: more sessions = more trust
    trustScore = Math.min(trustScore, 0.5);  // Cap at 0.5 from sessions alone

    // Add event weights
    for (const event of recentEvents) {
      trustScore += event.weight;
    }

    // Add breakthrough moments
    trustScore += (relationship.breakthrough_moments?.length || 0) * 0.1;

    // Subtract friction points
    trustScore -= (relationship.friction_points?.length || 0) * 0.1;

    // Clamp and convert to trust level
    trustScore = Math.max(0, Math.min(1, trustScore));

    if (trustScore >= 0.9) return TrustLevel.RESONANCE;
    if (trustScore >= 0.7) return TrustLevel.DEEP;
    if (trustScore >= 0.4) return TrustLevel.ESTABLISHED;
    if (trustScore >= 0.2) return TrustLevel.BUILDING;
    return TrustLevel.NEW;
  }

  /**
   * Update trust level in schema
   */
  updateTrust(schema, avatar) {
    const newLevel = this.calculateTrust(schema, avatar);
    const oldLevel = schema.avatar_relationships[avatar]?.trust_level || TrustLevel.NEW;

    if (newLevel !== oldLevel) {
      schema.updateAvatarRelationship(avatar, {
        trust_level: newLevel
      });

      return {
        changed: true,
        from: oldLevel,
        to: newLevel,
        direction: newLevel > oldLevel ? 'increased' : 'decreased'
      };
    }

    return { changed: false, level: newLevel };
  }

  /**
   * Get trust history for avatar
   */
  getHistory(avatar, limit = 50) {
    return this.trustHistory
      .filter(e => e.avatar === avatar)
      .slice(-limit);
  }
}

/**
 * The Resonance Engine - detects flow states
 */
class ResonanceEngine {
  constructor() {
    this.resonanceIndicators = [];
    this.activeResonance = null;
  }

  /**
   * Check if resonance conditions are present
   */
  checkResonance(signals, schema, context = {}) {
    const indicators = {
      high_engagement: false,
      positive_sentiment: false,
      deep_focus: false,
      mutual_understanding: false,
      creative_flow: false
    };

    // Check engagement level
    const engagement = signals.filter(s => s.type === SignalType.ENGAGEMENT_LEVEL);
    if (engagement.some(s => s.value.score > 0.8)) {
      indicators.high_engagement = true;
    }

    // Check positive sentiment
    const satisfaction = signals.filter(s => s.type === SignalType.SATISFACTION_MARKER);
    if (satisfaction.some(s => s.value.intensity > 0.7)) {
      indicators.positive_sentiment = true;
    }

    // Check focus (no topic jumping)
    const transitions = signals.filter(s => s.type === SignalType.TOPIC_TRANSITION);
    if (transitions.length === 0 || transitions.every(t => t.value.type === 'natural')) {
      indicators.deep_focus = true;
    }

    // Check mutual understanding (no corrections, smooth flow)
    const frustration = signals.filter(s => s.type === SignalType.FRUSTRATION_MARKER);
    if (frustration.length === 0 || frustration.every(f => f.value.intensity < 0.3)) {
      indicators.mutual_understanding = true;
    }

    // Creative flow - lots of ideas, building on each other
    // (Would need more sophisticated detection in production)
    if (indicators.high_engagement && indicators.mutual_understanding) {
      indicators.creative_flow = true;
    }

    // Calculate resonance score
    const indicatorCount = Object.values(indicators).filter(Boolean).length;
    const resonanceScore = indicatorCount / 5;

    // Record if resonance is active
    if (resonanceScore >= 0.6) {
      if (!this.activeResonance) {
        this.activeResonance = {
          started: new Date().toISOString(),
          indicators: { ...indicators },
          peak_score: resonanceScore
        };
      } else {
        this.activeResonance.peak_score = Math.max(
          this.activeResonance.peak_score,
          resonanceScore
        );
      }
    } else if (this.activeResonance) {
      // Resonance ended
      const completed = {
        ...this.activeResonance,
        ended: new Date().toISOString(),
        duration_seconds: (Date.now() - new Date(this.activeResonance.started).getTime()) / 1000
      };
      this.resonanceIndicators.push(completed);
      this.activeResonance = null;

      // Record in schema
      schema.recordResonance(
        context.trigger || 'flow_detected',
        completed.duration_seconds,
        completed.peak_score,
        context
      );

      return { active: false, just_ended: completed };
    }

    return {
      active: resonanceScore >= 0.6,
      score: resonanceScore,
      indicators,
      session: this.activeResonance
    };
  }

  /**
   * Get optimal conditions for resonance
   */
  getOptimalConditions(schema) {
    const states = schema.resonance.states;
    if (states.length < 2) {
      return null;
    }

    // Analyze patterns in successful resonance states
    const conditions = {
      times: [],
      topics: [],
      avatars: [],
      precursors: []
    };

    for (const state of states) {
      if (state.context?.time_category) {
        conditions.times.push(state.context.time_category);
      }
      if (state.context?.topic) {
        conditions.topics.push(state.context.topic);
      }
      if (state.context?.avatar) {
        conditions.avatars.push(state.context.avatar);
      }
      if (state.trigger) {
        conditions.precursors.push(state.trigger);
      }
    }

    // Find most common
    const findMostCommon = arr => {
      if (arr.length === 0) return null;
      const counts = {};
      arr.forEach(v => counts[v] = (counts[v] || 0) + 1);
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    };

    return {
      optimal_time: findMostCommon(conditions.times),
      optimal_topics: [...new Set(conditions.topics)].slice(0, 5),
      optimal_avatar: findMostCommon(conditions.avatars),
      common_triggers: [...new Set(conditions.precursors)].slice(0, 5)
    };
  }

  /**
   * Get resonance statistics
   */
  getStats() {
    const completed = this.resonanceIndicators.length;
    const totalDuration = this.resonanceIndicators.reduce(
      (sum, r) => sum + r.duration_seconds, 0
    );

    return {
      total_resonance_sessions: completed,
      total_resonance_minutes: totalDuration / 60,
      currently_active: !!this.activeResonance,
      average_duration: completed > 0 ? totalDuration / completed : 0
    };
  }
}

/**
 * The Evolve Engine - continuous learning
 */
class EvolveEngine {
  constructor() {
    this.calibrate = new CalibrateEngine();
    this.trust = new TrustEngine();
    this.resonance = new ResonanceEngine();
    this.evolutionLog = [];
  }

  /**
   * Evolve the schema based on a session
   */
  evolve(session, schema, patterns) {
    const evolution = {
      timestamp: new Date().toISOString(),
      session_id: session.session_id,
      changes: []
    };

    // 1. Update avatar relationship
    const avatar = session.avatar;
    schema.updateAvatarRelationship(avatar, {
      total_sessions: (schema.avatar_relationships[avatar]?.total_sessions || 0) + 1,
      total_artifacts: (schema.avatar_relationships[avatar]?.total_artifacts || 0) +
                       session.artifacts_created.length
    });
    evolution.changes.push('session_count_updated');

    // 2. Process captured signals
    if (session.signals_captured.length > 0) {
      const lastSignal = session.signals_captured[session.signals_captured.length - 1];

      // Infer feedback from signals
      const inferred = this.calibrate.inferFeedback(
        session.signals_captured,
        null,
        schema
      );

      if (inferred.length > 0) {
        evolution.changes.push(`inferred_${inferred.length}_feedback_items`);
      }
    }

    // 3. Apply patterns to schema
    if (patterns && patterns.length > 0) {
      for (const pattern of patterns) {
        // Check if pattern is confident enough
        if (pattern.confidence >= 0.6) {
          this._applyPattern(pattern, schema);
          evolution.changes.push(`pattern_applied:${pattern.name}`);
        }
      }
    }

    // 4. Update trust
    const trustUpdate = this.trust.updateTrust(schema, avatar);
    if (trustUpdate.changed) {
      evolution.changes.push(`trust_${trustUpdate.direction}:${trustUpdate.from}->${trustUpdate.to}`);

      // Record as breakthrough if trust increased to DEEP or RESONANCE
      if (trustUpdate.direction === 'increased' &&
          (trustUpdate.to === TrustLevel.DEEP || trustUpdate.to === TrustLevel.RESONANCE)) {
        schema.updateAvatarRelationship(avatar, {
          breakthrough_moments: [
            ...(schema.avatar_relationships[avatar]?.breakthrough_moments || []),
            {
              type: 'trust_milestone',
              level: trustUpdate.to,
              timestamp: new Date().toISOString()
            }
          ]
        });
      }
    }

    // 5. Check resonance
    const resonanceCheck = this.resonance.checkResonance(
      session.signals_captured,
      schema,
      { avatar, topic: session.current_topic }
    );

    if (resonanceCheck.just_ended) {
      evolution.changes.push(`resonance_recorded:${resonanceCheck.just_ended.duration_seconds}s`);

      // This is a trust event
      this.trust.recordEvent(avatar, TrustEvent.RESONANCE_ACHIEVED, resonanceCheck.just_ended);
    }

    // 6. Update optimal conditions
    const optimal = this.resonance.getOptimalConditions(schema);
    if (optimal) {
      schema.resonance.optimal_conditions = optimal;
    }

    // Record evolution
    this.evolutionLog.push(evolution);
    schema.evolution.major_updates.push({
      timestamp: new Date().toISOString(),
      summary: evolution.changes.join(', '),
      trigger: 'session_end'
    });

    return evolution;
  }

  /**
   * Apply a pattern to schema
   */
  _applyPattern(pattern, schema) {
    switch (pattern.category) {
      case PatternCategory.COMMUNICATION:
        if (pattern.name === 'verbosity_preference') {
          schema.operating_style.communication.verbosity_preference =
            pattern.data.preference;
        }
        if (pattern.name === 'learning_style') {
          schema.behavioral_patterns.preferences.learning_sequence =
            pattern.data.style;
        }
        break;

      case PatternCategory.WORKFLOW:
        if (pattern.name === 'work_schedule') {
          schema.operating_style.work_patterns.peak_hours = [pattern.data.peak_time];
        }
        break;

      case PatternCategory.EMOTIONAL:
        if (pattern.name === 'frustration_tendency') {
          const existing = schema.behavioral_patterns.triggers.frustration;
          if (!existing.some(t => t.pattern === 'detected_tendency')) {
            existing.push({
              pattern: 'detected_tendency',
              intensity: pattern.data.avg_intensity,
              de_escalation: pattern.data.needs_attention ? 'slow_careful' : 'normal'
            });
          }
        }
        break;
    }
  }

  /**
   * Process explicit user feedback
   */
  processFeedback(type, target, content, schema) {
    return this.calibrate.processFeedback(
      { type, target, content },
      schema
    );
  }

  /**
   * Record a trust event
   */
  recordTrustEvent(avatar, event, context = {}) {
    return this.trust.recordEvent(avatar, event, context);
  }

  /**
   * Get combined statistics
   */
  getStats() {
    return {
      calibration: this.calibrate.getStats(),
      trust: {
        events_recorded: this.trust.trustHistory.length
      },
      resonance: this.resonance.getStats(),
      evolution: {
        total_evolutions: this.evolutionLog.length,
        recent: this.evolutionLog.slice(-5)
      }
    };
  }
}

module.exports = {
  FeedbackType,
  TrustEvent,
  CalibrateEngine,
  TrustEngine,
  ResonanceEngine,
  EvolveEngine
};
