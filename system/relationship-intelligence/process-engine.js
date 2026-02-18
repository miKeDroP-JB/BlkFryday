/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROCESS ENGINE - Pattern Recognition
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Signals become patterns. Patterns become understanding.
 * This engine finds the meaning in the noise.
 *
 * Processing Layers:
 * 1. Aggregation - Combine related signals
 * 2. Recognition - Match against known patterns
 * 3. Inference - Deduce new patterns from combinations
 * 4. Confidence - Rate pattern reliability
 * 5. Evolution - Update schema with insights
 *
 * Created: December 2, 2025
 * Architect: JB + Claude
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { SignalType } = require('./capture-engine');
const { ConfidenceLevel, TrustLevel } = require('./schema');

/**
 * Pattern categories
 */
const PatternCategory = {
  COMMUNICATION: 'communication',
  WORKFLOW: 'workflow',
  KNOWLEDGE: 'knowledge',
  EMOTIONAL: 'emotional',
  TEMPORAL: 'temporal',
  RELATIONAL: 'relational'
};

/**
 * A recognized pattern
 */
class Pattern {
  constructor(category, name, data = {}) {
    this.id = `pat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.category = category;
    this.name = name;
    this.data = data;
    this.confidence = 0.5;
    this.evidence_count = 1;
    this.first_observed = new Date().toISOString();
    this.last_observed = new Date().toISOString();
  }

  reinforce(additionalConfidence = 0.1) {
    this.confidence = Math.min(1, this.confidence + additionalConfidence);
    this.evidence_count++;
    this.last_observed = new Date().toISOString();
  }

  decay(amount = 0.05) {
    this.confidence = Math.max(0, this.confidence - amount);
  }

  toJSON() {
    return {
      id: this.id,
      category: this.category,
      name: this.name,
      data: this.data,
      confidence: this.confidence,
      evidence_count: this.evidence_count,
      first_observed: this.first_observed,
      last_observed: this.last_observed
    };
  }
}

/**
 * The Process Engine
 */
class ProcessEngine {
  constructor() {
    this.patterns = new Map();  // id -> Pattern
    this.patternIndex = new Map();  // name -> id (for fast lookup)
    this.processors = new Map();  // category -> processor function
    this.inferences = [];  // Queue of inferences to make

    // Register built-in processors
    this._registerBuiltInProcessors();
  }

  /**
   * Register built-in pattern processors
   */
  _registerBuiltInProcessors() {
    // Communication style processor
    this.registerProcessor(PatternCategory.COMMUNICATION, (signals, schema) => {
      const patterns = [];

      // Analyze verbosity from engagement signals
      const engagementSignals = signals.filter(
        s => s.type === SignalType.ENGAGEMENT_LEVEL
      );

      if (engagementSignals.length >= 3) {
        const avgLength = engagementSignals.reduce(
          (sum, s) => sum + (s.context.message_length || 0), 0
        ) / engagementSignals.length;

        let verbosity;
        if (avgLength < 50) verbosity = 'concise';
        else if (avgLength < 200) verbosity = 'moderate';
        else verbosity = 'detailed';

        patterns.push(new Pattern(
          PatternCategory.COMMUNICATION,
          'verbosity_preference',
          { preference: verbosity, avg_length: avgLength }
        ));
      }

      // Analyze preference for examples vs theory
      const preferenceSignals = signals.filter(
        s => s.type === SignalType.STATED_PREFERENCE
      );

      const wantsExamples = preferenceSignals.some(
        s => /example|show|demonstrate/i.test(JSON.stringify(s.value))
      );
      const wantsTheory = preferenceSignals.some(
        s => /explain|why|theory|understand/i.test(JSON.stringify(s.value))
      );

      if (wantsExamples || wantsTheory) {
        patterns.push(new Pattern(
          PatternCategory.COMMUNICATION,
          'learning_style',
          {
            prefers_examples: wantsExamples,
            prefers_theory: wantsTheory,
            style: wantsExamples && !wantsTheory ? 'example_first' :
                   wantsTheory && !wantsExamples ? 'theory_first' :
                   'balanced'
          }
        ));
      }

      return patterns;
    });

    // Workflow processor
    this.registerProcessor(PatternCategory.WORKFLOW, (signals, schema) => {
      const patterns = [];

      // Analyze timing patterns
      const timingSignals = signals.filter(
        s => s.type === SignalType.SESSION_TIMING
      );

      if (timingSignals.length >= 3) {
        const hours = timingSignals.map(s => s.value.start_hour);
        const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;
        const peakTime = this._categorizeTime(avgHour);

        const durations = timingSignals.map(s => s.value.duration_minutes);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

        patterns.push(new Pattern(
          PatternCategory.WORKFLOW,
          'work_schedule',
          {
            peak_time: peakTime,
            avg_hour: avgHour,
            avg_session_minutes: avgDuration,
            session_count: timingSignals.length
          }
        ));
      }

      return patterns;
    });

    // Emotional processor
    this.registerProcessor(PatternCategory.EMOTIONAL, (signals, schema) => {
      const patterns = [];

      // Frustration pattern
      const frustrationSignals = signals.filter(
        s => s.type === SignalType.FRUSTRATION_MARKER
      );

      if (frustrationSignals.length >= 2) {
        const avgIntensity = frustrationSignals.reduce(
          (sum, s) => sum + s.value.intensity, 0
        ) / frustrationSignals.length;

        patterns.push(new Pattern(
          PatternCategory.EMOTIONAL,
          'frustration_tendency',
          {
            avg_intensity: avgIntensity,
            occurrence_count: frustrationSignals.length,
            needs_attention: avgIntensity > 0.6
          }
        ));
      }

      // Satisfaction pattern
      const satisfactionSignals = signals.filter(
        s => s.type === SignalType.SATISFACTION_MARKER
      );

      if (satisfactionSignals.length >= 2) {
        const avgIntensity = satisfactionSignals.reduce(
          (sum, s) => sum + s.value.intensity, 0
        ) / satisfactionSignals.length;

        patterns.push(new Pattern(
          PatternCategory.EMOTIONAL,
          'satisfaction_baseline',
          {
            avg_intensity: avgIntensity,
            easy_to_please: avgIntensity > 0.7,
            occurrence_count: satisfactionSignals.length
          }
        ));
      }

      return patterns;
    });

    // Knowledge processor
    this.registerProcessor(PatternCategory.KNOWLEDGE, (signals, schema) => {
      const patterns = [];

      const knowledgeSignals = signals.filter(
        s => s.type === SignalType.STATED_KNOWLEDGE
      );

      if (knowledgeSignals.length >= 1) {
        const expertCount = knowledgeSignals.reduce(
          (sum, s) => sum + s.value.expert_indicators, 0
        );
        const noviceCount = knowledgeSignals.reduce(
          (sum, s) => sum + s.value.novice_indicators, 0
        );

        patterns.push(new Pattern(
          PatternCategory.KNOWLEDGE,
          'expertise_level',
          {
            expert_signals: expertCount,
            novice_signals: noviceCount,
            overall: expertCount > noviceCount * 1.5 ? 'experienced' :
                     noviceCount > expertCount * 1.5 ? 'learning' :
                     'mixed'
          }
        ));
      }

      return patterns;
    });

    // Relational processor
    this.registerProcessor(PatternCategory.RELATIONAL, (signals, schema) => {
      const patterns = [];

      // Avatar preferences
      const avatarSignals = signals.filter(
        s => s.type === SignalType.AVATAR_PREFERENCE
      );

      const avatarPrefs = {};
      for (const signal of avatarSignals) {
        const avatar = signal.value.avatar;
        if (!avatarPrefs[avatar]) {
          avatarPrefs[avatar] = { positive: 0, negative: 0, neutral: 0 };
        }
        avatarPrefs[avatar][signal.value.preference]++;
      }

      for (const [avatar, prefs] of Object.entries(avatarPrefs)) {
        const total = prefs.positive + prefs.negative + prefs.neutral;
        if (total >= 2) {
          patterns.push(new Pattern(
            PatternCategory.RELATIONAL,
            `avatar_affinity_${avatar}`,
            {
              avatar,
              positive_ratio: prefs.positive / total,
              relationship_quality: prefs.positive > prefs.negative ? 'good' :
                                    prefs.negative > prefs.positive ? 'strained' :
                                    'neutral'
            }
          ));
        }
      }

      // Trust signals
      const trustSignals = signals.filter(
        s => s.type === SignalType.TRUST_INDICATOR
      );

      if (trustSignals.length >= 2) {
        const increases = trustSignals.filter(s => s.value.direction === 'increase').length;
        const decreases = trustSignals.filter(s => s.value.direction === 'decrease').length;

        patterns.push(new Pattern(
          PatternCategory.RELATIONAL,
          'trust_trajectory',
          {
            increases,
            decreases,
            net_direction: increases > decreases ? 'building' :
                           decreases > increases ? 'declining' :
                           'stable'
          }
        ));
      }

      return patterns;
    });

    // Temporal processor
    this.registerProcessor(PatternCategory.TEMPORAL, (signals, schema) => {
      const patterns = [];

      // Topic transitions
      const transitionSignals = signals.filter(
        s => s.type === SignalType.TOPIC_TRANSITION
      );

      if (transitionSignals.length >= 3) {
        const types = transitionSignals.map(s => s.value.type);
        const abruptCount = types.filter(t => t === 'abrupt').length;
        const naturalCount = types.filter(t => t === 'natural').length;

        patterns.push(new Pattern(
          PatternCategory.TEMPORAL,
          'topic_flow',
          {
            abrupt_transitions: abruptCount,
            natural_transitions: naturalCount,
            style: abruptCount > naturalCount ? 'jumpy' :
                   naturalCount > abruptCount ? 'flowing' :
                   'mixed'
          }
        ));
      }

      return patterns;
    });
  }

  /**
   * Register a pattern processor
   */
  registerProcessor(category, processor) {
    this.processors.set(category, processor);
  }

  /**
   * Process signals and extract patterns
   */
  process(signals, schema) {
    const newPatterns = [];

    // Run all processors
    for (const [category, processor] of this.processors) {
      try {
        const patterns = processor(signals, schema);
        for (const pattern of patterns) {
          this._addOrReinforce(pattern);
          newPatterns.push(pattern);
        }
      } catch (e) {
        console.error(`Processor ${category} failed:`, e.message);
      }
    }

    // Run inference engine
    this._runInferences(signals, schema);

    return newPatterns;
  }

  /**
   * Add a new pattern or reinforce existing one
   */
  _addOrReinforce(pattern) {
    const existingId = this.patternIndex.get(pattern.name);

    if (existingId) {
      const existing = this.patterns.get(existingId);
      existing.reinforce();
      // Merge new data
      existing.data = { ...existing.data, ...pattern.data };
      return existing;
    }

    this.patterns.set(pattern.id, pattern);
    this.patternIndex.set(pattern.name, pattern.id);
    return pattern;
  }

  /**
   * Run inference engine
   */
  _runInferences(signals, schema) {
    // Check for resonance conditions
    const resonanceSignals = signals.filter(
      s => s.type === SignalType.RESONANCE_MOMENT
    );

    if (resonanceSignals.length > 0) {
      // What conditions led to resonance?
      const satisfactionBefore = signals.filter(
        s => s.type === SignalType.SATISFACTION_MARKER &&
             new Date(s.timestamp) < new Date(resonanceSignals[0].timestamp)
      ).length;

      const engagementBefore = signals.filter(
        s => s.type === SignalType.ENGAGEMENT_LEVEL &&
             s.value.score > 0.7
      ).length;

      if (satisfactionBefore > 0 || engagementBefore > 0) {
        this._addOrReinforce(new Pattern(
          PatternCategory.RELATIONAL,
          'resonance_precursors',
          {
            high_satisfaction_helps: satisfactionBefore > 0,
            high_engagement_helps: engagementBefore > 0,
            observation_count: resonanceSignals.length
          }
        ));
      }
    }

    // Infer communication style from multiple signals
    const frustration = this.getPattern('frustration_tendency');
    const verbosity = this.getPattern('verbosity_preference');

    if (frustration && verbosity) {
      const needsCareful = frustration.data.avg_intensity > 0.5;
      const prefersDetail = verbosity.data.preference === 'detailed';

      this._addOrReinforce(new Pattern(
        PatternCategory.COMMUNICATION,
        'optimal_approach',
        {
          be_careful: needsCareful,
          be_detailed: prefersDetail,
          recommended_tone: needsCareful ? 'gentle' : 'direct'
        }
      ));
    }
  }

  /**
   * Get a pattern by name
   */
  getPattern(name) {
    const id = this.patternIndex.get(name);
    return id ? this.patterns.get(id) : null;
  }

  /**
   * Get all patterns in a category
   */
  getPatternsByCategory(category) {
    return Array.from(this.patterns.values()).filter(
      p => p.category === category
    );
  }

  /**
   * Get high-confidence patterns
   */
  getConfidentPatterns(minConfidence = 0.7) {
    return Array.from(this.patterns.values()).filter(
      p => p.confidence >= minConfidence
    );
  }

  /**
   * Apply time decay to patterns
   */
  applyDecay(hours = 24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);

    for (const pattern of this.patterns.values()) {
      if (new Date(pattern.last_observed).getTime() < cutoff) {
        pattern.decay();
      }
    }

    // Remove patterns with very low confidence
    for (const [id, pattern] of this.patterns) {
      if (pattern.confidence < 0.1) {
        this.patterns.delete(id);
        this.patternIndex.delete(pattern.name);
      }
    }
  }

  /**
   * Update schema with recognized patterns
   */
  applyToSchema(schema) {
    const updates = [];

    // Apply communication patterns
    const verbosity = this.getPattern('verbosity_preference');
    if (verbosity && verbosity.confidence > 0.6) {
      schema.update(
        'operating_style.communication.verbosity_preference',
        verbosity.data.preference,
        ConfidenceLevel.INFERRED
      );
      updates.push('verbosity_preference');
    }

    const learningStyle = this.getPattern('learning_style');
    if (learningStyle && learningStyle.confidence > 0.6) {
      schema.update(
        'behavioral_patterns.preferences.learning_sequence',
        learningStyle.data.style,
        ConfidenceLevel.INFERRED
      );
      updates.push('learning_style');
    }

    // Apply workflow patterns
    const workSchedule = this.getPattern('work_schedule');
    if (workSchedule && workSchedule.confidence > 0.6) {
      schema.update(
        'operating_style.work_patterns.peak_hours',
        [workSchedule.data.peak_time],
        ConfidenceLevel.DEMONSTRATED
      );
      updates.push('work_schedule');
    }

    // Apply emotional patterns
    const frustration = this.getPattern('frustration_tendency');
    if (frustration && frustration.confidence > 0.6) {
      schema.behavioral_patterns.triggers.frustration.push({
        pattern: 'detected_tendency',
        intensity: frustration.data.avg_intensity,
        de_escalation: frustration.data.needs_attention ?
          'slow_down_be_clear' : 'normal'
      });
      updates.push('frustration_tendency');
    }

    // Apply knowledge patterns
    const expertise = this.getPattern('expertise_level');
    if (expertise && expertise.confidence > 0.6) {
      // Would need domain context to properly place
      updates.push('expertise_level_noted');
    }

    // Apply relational patterns
    const trustTrajectory = this.getPattern('trust_trajectory');
    if (trustTrajectory && trustTrajectory.confidence > 0.6) {
      // This influences how to interact
      updates.push('trust_trajectory');
    }

    return updates;
  }

  /**
   * Categorize time of day
   */
  _categorizeTime(hour) {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Get processing statistics
   */
  getStats() {
    const byCategory = {};
    for (const pattern of this.patterns.values()) {
      byCategory[pattern.category] = (byCategory[pattern.category] || 0) + 1;
    }

    return {
      total_patterns: this.patterns.size,
      patterns_by_category: byCategory,
      high_confidence: this.getConfidentPatterns(0.7).length,
      registered_processors: Array.from(this.processors.keys())
    };
  }

  /**
   * Export all patterns
   */
  exportPatterns() {
    return Array.from(this.patterns.values()).map(p => p.toJSON());
  }

  /**
   * Import patterns
   */
  importPatterns(patterns) {
    for (const data of patterns) {
      const pattern = new Pattern(data.category, data.name, data.data);
      Object.assign(pattern, data);
      this.patterns.set(pattern.id, pattern);
      this.patternIndex.set(pattern.name, pattern.id);
    }
  }
}

module.exports = {
  PatternCategory,
  Pattern,
  ProcessEngine
};
