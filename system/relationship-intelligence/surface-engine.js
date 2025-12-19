/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SURFACE ENGINE - Context Injection System
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * The bridge between what we know and what we do.
 * This engine surfaces the right context at the right moment.
 *
 * Surface Types:
 * 1. Prompt Augmentation - Context added to prompts
 * 2. Real-time Hints - Suggestions during conversation
 * 3. Decision Support - Recommendations for approach
 * 4. Memory Recall - Relevant past interactions
 *
 * "Know the human. Serve the human."
 *
 * Created: December 2, 2025
 * Architect: JB + Claude
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { TrustLevel } = require('./schema');

/**
 * Context relevance levels
 */
const RelevanceLevel = {
  CRITICAL: 'critical',     // Must include - affects interaction
  HIGH: 'high',             // Should include - improves quality
  MEDIUM: 'medium',         // Nice to have - adds personalization
  LOW: 'low',               // Background - subtle influence
  OPTIONAL: 'optional'      // Only if space permits
};

/**
 * A surfaced context item
 */
class ContextItem {
  constructor(type, content, relevance = RelevanceLevel.MEDIUM) {
    this.id = `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.type = type;
    this.content = content;
    this.relevance = relevance;
    this.timestamp = new Date().toISOString();
  }

  toPromptFormat() {
    return `[${this.type}]: ${this.content}`;
  }
}

/**
 * The Surface Engine
 */
class SurfaceEngine {
  constructor(maxContextTokens = 500) {
    this.maxTokens = maxContextTokens;
    this.surfacers = new Map();  // Registered context surfacers

    // Register built-in surfacers
    this._registerBuiltInSurfacers();
  }

  /**
   * Register built-in context surfacers
   */
  _registerBuiltInSurfacers() {
    // Identity surfacer
    this.registerSurfacer('identity', (schema, context) => {
      const items = [];

      if (schema.identity.preferred_name) {
        items.push(new ContextItem(
          'name',
          `User prefers to be called "${schema.identity.preferred_name}"`,
          RelevanceLevel.HIGH
        ));
      }

      if (schema.identity.pronouns) {
        items.push(new ContextItem(
          'pronouns',
          `Use ${schema.identity.pronouns} pronouns`,
          RelevanceLevel.HIGH
        ));
      }

      if (schema.identity.communication_style) {
        items.push(new ContextItem(
          'style',
          `Communication style: ${schema.identity.communication_style}`,
          RelevanceLevel.MEDIUM
        ));
      }

      return items;
    });

    // Trust surfacer
    this.registerSurfacer('trust', (schema, context) => {
      const items = [];
      const avatar = context.avatar;

      if (avatar && schema.avatar_relationships[avatar]) {
        const rel = schema.avatar_relationships[avatar];
        const trustLevel = rel.trust_level;

        if (trustLevel === TrustLevel.NEW) {
          items.push(new ContextItem(
            'trust',
            'New relationship - be welcoming, establish rapport',
            RelevanceLevel.HIGH
          ));
        } else if (trustLevel === TrustLevel.DEEP) {
          items.push(new ContextItem(
            'trust',
            'Deep trust established - can be direct, reference shared history',
            RelevanceLevel.MEDIUM
          ));
        } else if (trustLevel === TrustLevel.RESONANCE) {
          items.push(new ContextItem(
            'trust',
            'Resonance achieved - flow state possible, intuitive connection',
            RelevanceLevel.MEDIUM
          ));
        }

        // Reference session count
        if (rel.total_sessions > 10) {
          items.push(new ContextItem(
            'history',
            `${rel.total_sessions} previous sessions together`,
            RelevanceLevel.LOW
          ));
        }
      }

      return items;
    });

    // Communication preferences surfacer
    this.registerSurfacer('communication', (schema, context) => {
      const items = [];
      const comm = schema.operating_style.communication;

      if (comm.verbosity_preference) {
        items.push(new ContextItem(
          'verbosity',
          `User prefers ${comm.verbosity_preference} responses`,
          RelevanceLevel.MEDIUM
        ));
      }

      if (comm.feedback_style) {
        items.push(new ContextItem(
          'feedback',
          `Give feedback in ${comm.feedback_style} style`,
          RelevanceLevel.MEDIUM
        ));
      }

      if (comm.humor_receptiveness > 0.7) {
        items.push(new ContextItem(
          'humor',
          'User appreciates appropriate humor',
          RelevanceLevel.LOW
        ));
      } else if (comm.humor_receptiveness < 0.3) {
        items.push(new ContextItem(
          'humor',
          'Keep responses professional, avoid humor',
          RelevanceLevel.MEDIUM
        ));
      }

      return items;
    });

    // Goals surfacer
    this.registerSurfacer('goals', (schema, context) => {
      const items = [];

      // Session goals are most relevant
      const sessionGoals = schema.goals.session_level;
      if (sessionGoals.length > 0) {
        items.push(new ContextItem(
          'current_goal',
          `Current focus: ${sessionGoals[0].goal}`,
          RelevanceLevel.CRITICAL
        ));
      }

      // Week-level for broader context
      const weekGoals = schema.goals.week_level;
      if (weekGoals.length > 0) {
        items.push(new ContextItem(
          'week_goal',
          `This week: ${weekGoals[0].goal}`,
          RelevanceLevel.MEDIUM
        ));
      }

      return items;
    });

    // Knowledge surfacer
    this.registerSurfacer('knowledge', (schema, context) => {
      const items = [];
      const topic = context.topic;

      if (topic) {
        // Check if user has expertise in this topic
        const mastered = schema.knowledge_map.mastered.find(
          k => k.domain.toLowerCase().includes(topic.toLowerCase())
        );
        const learning = schema.knowledge_map.learning.find(
          k => k.domain.toLowerCase().includes(topic.toLowerCase())
        );

        if (mastered) {
          items.push(new ContextItem(
            'expertise',
            `User is expert in ${mastered.domain} - can skip basics`,
            RelevanceLevel.HIGH
          ));
        } else if (learning) {
          items.push(new ContextItem(
            'learning',
            `User is learning ${learning.domain} - explain thoroughly`,
            RelevanceLevel.HIGH
          ));
        }
      }

      return items;
    });

    // Behavioral surfacer
    this.registerSurfacer('behavioral', (schema, context) => {
      const items = [];
      const prefs = schema.behavioral_patterns.preferences;

      if (prefs.explanation_depth) {
        items.push(new ContextItem(
          'depth',
          `Explanation depth: ${prefs.explanation_depth}`,
          RelevanceLevel.MEDIUM
        ));
      }

      if (prefs.example_types && prefs.example_types.length > 0) {
        items.push(new ContextItem(
          'examples',
          `Preferred examples: ${prefs.example_types.join(', ')}`,
          RelevanceLevel.LOW
        ));
      }

      if (prefs.learning_sequence) {
        items.push(new ContextItem(
          'sequence',
          `Learning approach: ${prefs.learning_sequence}`,
          RelevanceLevel.MEDIUM
        ));
      }

      // Anti-patterns are critical
      const antiPatterns = schema.behavioral_patterns.anti_patterns;
      if (antiPatterns.length > 0) {
        items.push(new ContextItem(
          'avoid',
          `AVOID: ${antiPatterns.map(a => a.pattern).join(', ')}`,
          RelevanceLevel.CRITICAL
        ));
      }

      return items;
    });

    // Lexicon surfacer
    this.registerSurfacer('lexicon', (schema, context) => {
      const items = [];
      const topic = context.topic;

      // Surface relevant terms
      const relevantTerms = schema.lexicon.terms.filter(t => {
        if (!topic) return false;
        return t.term.toLowerCase().includes(topic.toLowerCase()) ||
               t.context?.toLowerCase().includes(topic.toLowerCase());
      });

      if (relevantTerms.length > 0) {
        items.push(new ContextItem(
          'shared_terms',
          `Shared vocabulary: ${relevantTerms.map(t => `"${t.term}"`).join(', ')}`,
          RelevanceLevel.LOW
        ));
      }

      // Inside references
      if (schema.lexicon.inside_references.length > 0) {
        items.push(new ContextItem(
          'references',
          `Inside references available - check for opportunities`,
          RelevanceLevel.OPTIONAL
        ));
      }

      return items;
    });

    // Resonance surfacer
    this.registerSurfacer('resonance', (schema, context) => {
      const items = [];

      if (schema.resonance.entry_patterns.length > 0) {
        items.push(new ContextItem(
          'resonance_triggers',
          `Flow triggers: ${schema.resonance.entry_patterns.slice(0, 3).join(', ')}`,
          RelevanceLevel.LOW
        ));
      }

      const optimal = schema.resonance.optimal_conditions;
      if (optimal.time && context.time_category === optimal.time) {
        items.push(new ContextItem(
          'optimal_time',
          'Currently in optimal time window for deep work',
          RelevanceLevel.MEDIUM
        ));
      }

      return items;
    });

    // Privacy surfacer
    this.registerSurfacer('privacy', (schema, context) => {
      const items = [];

      // Sensitive topics are critical
      if (schema.privacy.sensitive_topics.length > 0) {
        items.push(new ContextItem(
          'sensitive',
          `Handle with care: ${schema.privacy.sensitive_topics.join(', ')}`,
          RelevanceLevel.CRITICAL
        ));
      }

      // Explicit boundaries are critical
      if (schema.privacy.boundaries.length > 0) {
        items.push(new ContextItem(
          'boundaries',
          `User boundaries: ${schema.privacy.boundaries.join(', ')}`,
          RelevanceLevel.CRITICAL
        ));
      }

      return items;
    });
  }

  /**
   * Register a context surfacer
   */
  registerSurfacer(name, surfacer) {
    this.surfacers.set(name, surfacer);
  }

  /**
   * Surface context for a prompt
   */
  surface(schema, context = {}) {
    const allItems = [];

    // Run all surfacers
    for (const [name, surfacer] of this.surfacers) {
      try {
        const items = surfacer(schema, context);
        allItems.push(...items);
      } catch (e) {
        console.error(`Surfacer ${name} failed:`, e.message);
      }
    }

    // Sort by relevance
    const relevanceOrder = {
      [RelevanceLevel.CRITICAL]: 0,
      [RelevanceLevel.HIGH]: 1,
      [RelevanceLevel.MEDIUM]: 2,
      [RelevanceLevel.LOW]: 3,
      [RelevanceLevel.OPTIONAL]: 4
    };

    allItems.sort((a, b) =>
      relevanceOrder[a.relevance] - relevanceOrder[b.relevance]
    );

    return allItems;
  }

  /**
   * Build a prompt augmentation string
   */
  buildPromptContext(schema, context = {}) {
    const items = this.surface(schema, context);

    // Filter to fit token budget (rough estimate: 4 chars per token)
    let totalChars = 0;
    const includedItems = [];

    for (const item of items) {
      const itemChars = item.toPromptFormat().length;
      if (totalChars + itemChars < this.maxTokens * 4) {
        includedItems.push(item);
        totalChars += itemChars;
      } else if (item.relevance === RelevanceLevel.CRITICAL) {
        // Always include critical items
        includedItems.push(item);
        totalChars += itemChars;
      }
    }

    if (includedItems.length === 0) {
      return null;
    }

    // Build the context block
    const lines = [
      '--- User Context ---',
      ...includedItems.map(i => i.toPromptFormat()),
      '--- End Context ---'
    ];

    return lines.join('\n');
  }

  /**
   * Get real-time hints for current interaction
   */
  getHints(schema, message, context = {}) {
    const hints = [];

    // Check for frustration markers in message
    const frustrationMarkers = [
      /\b(ugh|argh|wtf|frustrated)\b/i,
      /[!?]{2,}/,
      /\.{3,}/
    ];

    const isFrustrated = frustrationMarkers.some(m => m.test(message));
    if (isFrustrated) {
      hints.push({
        type: 'de_escalate',
        message: 'User may be frustrated - acknowledge and slow down',
        priority: 'high'
      });

      // Check if we know their de-escalation preferences
      const triggers = schema.behavioral_patterns.triggers.frustration;
      if (triggers.length > 0 && triggers[0].de_escalation) {
        hints.push({
          type: 'de_escalate_method',
          message: `Try: ${triggers[0].de_escalation}`,
          priority: 'high'
        });
      }
    }

    // Check for engagement signals
    if (message.length > 200 && /\?/.test(message)) {
      hints.push({
        type: 'engagement',
        message: 'High engagement detected - match their energy',
        priority: 'medium'
      });
    }

    // Check for topic expertise
    const topics = this._extractTopics(message);
    for (const topic of topics) {
      const mastered = schema.knowledge_map.mastered.find(
        k => k.domain.toLowerCase().includes(topic.toLowerCase())
      );
      if (mastered) {
        hints.push({
          type: 'expertise',
          message: `User has expertise in ${mastered.domain}`,
          priority: 'medium'
        });
      }
    }

    // Check for goal alignment
    const currentGoal = schema.goals.session_level[0];
    if (currentGoal) {
      const mentionsGoal = message.toLowerCase().includes(
        currentGoal.goal.toLowerCase().split(' ')[0]
      );
      if (mentionsGoal) {
        hints.push({
          type: 'goal_aligned',
          message: `On track with goal: ${currentGoal.goal}`,
          priority: 'low'
        });
      }
    }

    return hints;
  }

  /**
   * Get decision support for approach
   */
  getApproachRecommendation(schema, context = {}) {
    const recommendation = {
      tone: 'balanced',
      verbosity: 'moderate',
      depth: 'moderate',
      formality: 'professional',
      specifics: []
    };

    // Tone based on trust level
    const avatar = context.avatar;
    const trust = schema.avatar_relationships[avatar]?.trust_level || TrustLevel.NEW;

    if (trust >= TrustLevel.DEEP) {
      recommendation.tone = 'warm';
      recommendation.formality = 'casual';
    } else if (trust === TrustLevel.NEW) {
      recommendation.tone = 'welcoming';
      recommendation.formality = 'professional';
    }

    // Verbosity from preferences
    const verbosity = schema.operating_style.communication.verbosity_preference;
    if (verbosity) {
      recommendation.verbosity = verbosity;
    }

    // Depth from preferences
    const depth = schema.behavioral_patterns.preferences.explanation_depth;
    if (depth) {
      recommendation.depth = depth;
    }

    // Specific recommendations
    if (schema.behavioral_patterns.anti_patterns.length > 0) {
      recommendation.specifics.push(
        `Avoid: ${schema.behavioral_patterns.anti_patterns[0].pattern}`
      );
    }

    if (schema.identity.communication_style === 'direct') {
      recommendation.specifics.push('Be direct, skip pleasantries');
    }

    if (schema.operating_style.communication.humor_receptiveness > 0.7) {
      recommendation.specifics.push('Humor welcome');
    }

    return recommendation;
  }

  /**
   * Recall relevant past interactions
   */
  recallRelevant(schema, topic, recentSessions = []) {
    const recalls = [];

    // Check lexicon for relevant terms
    const terms = schema.lexicon.terms.filter(t =>
      t.term.toLowerCase().includes(topic.toLowerCase()) ||
      t.context?.toLowerCase().includes(topic.toLowerCase())
    );

    for (const term of terms.slice(0, 3)) {
      recalls.push({
        type: 'shared_term',
        content: `"${term.term}" - ${term.definition}`,
        first_used: term.first_used
      });
    }

    // Check for topic in recent sessions
    for (const session of recentSessions) {
      if (session.current_topic?.toLowerCase().includes(topic.toLowerCase())) {
        recalls.push({
          type: 'previous_discussion',
          content: `Discussed ${session.current_topic} on ${session.session_start}`,
          session_id: session.session_id
        });
      }

      // Check insights
      const relevantInsights = session.insights_generated?.filter(i =>
        JSON.stringify(i).toLowerCase().includes(topic.toLowerCase())
      ) || [];

      for (const insight of relevantInsights.slice(0, 2)) {
        recalls.push({
          type: 'previous_insight',
          content: insight,
          session_id: session.session_id
        });
      }
    }

    return recalls;
  }

  /**
   * Extract topics from message
   */
  _extractTopics(message) {
    // Simple topic extraction - could be enhanced with NLP
    const words = message.split(/\s+/);
    const topics = [];

    // Look for capitalized words (potential proper nouns/topics)
    for (const word of words) {
      if (word.length > 3 && /^[A-Z]/.test(word)) {
        topics.push(word.replace(/[^a-zA-Z]/g, ''));
      }
    }

    // Look for quoted terms
    const quoted = message.match(/"([^"]+)"/g) || [];
    topics.push(...quoted.map(q => q.replace(/"/g, '')));

    return [...new Set(topics)];
  }

  /**
   * Get surfacing statistics
   */
  getStats() {
    return {
      registered_surfacers: Array.from(this.surfacers.keys()),
      max_tokens: this.maxTokens
    };
  }
}

module.exports = {
  RelevanceLevel,
  ContextItem,
  SurfaceEngine
};
