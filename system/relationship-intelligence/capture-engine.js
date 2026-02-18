/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CAPTURE ENGINE - Signal Gathering System
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Every interaction is a signal. This engine captures them without judgment,
 * preserving the raw material for understanding.
 *
 * Signal Types:
 * - Explicit: User directly states something
 * - Implicit: Behavior reveals preference
 * - Contextual: Timing/patterns suggest meaning
 * - Relational: How they interact with different avatars
 *
 * "The truth is in the small things."
 *
 * Created: December 2, 2025
 * Architect: JB + Claude
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { ConfidenceLevel } = require('./schema');

/**
 * Signal types we capture
 */
const SignalType = {
  // Explicit signals - user directly states
  STATED_PREFERENCE: 'stated_preference',
  STATED_GOAL: 'stated_goal',
  STATED_KNOWLEDGE: 'stated_knowledge',
  STATED_BOUNDARY: 'stated_boundary',

  // Implicit signals - behavior reveals
  RESPONSE_PATTERN: 'response_pattern',
  ENGAGEMENT_LEVEL: 'engagement_level',
  FRUSTRATION_MARKER: 'frustration_marker',
  SATISFACTION_MARKER: 'satisfaction_marker',

  // Contextual signals - timing/patterns
  SESSION_TIMING: 'session_timing',
  TOPIC_TRANSITION: 'topic_transition',
  DEPTH_PREFERENCE: 'depth_preference',
  PACE_PREFERENCE: 'pace_preference',

  // Relational signals - avatar interactions
  AVATAR_PREFERENCE: 'avatar_preference',
  TRUST_INDICATOR: 'trust_indicator',
  RESONANCE_MOMENT: 'resonance_moment'
};

/**
 * A captured signal
 */
class Signal {
  constructor(type, value, metadata = {}) {
    this.id = `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.type = type;
    this.value = value;
    this.timestamp = new Date().toISOString();
    this.confidence = metadata.confidence || ConfidenceLevel.INFERRED;
    this.source = metadata.source || 'automatic';
    this.context = metadata.context || {};
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      value: this.value,
      timestamp: this.timestamp,
      confidence: this.confidence,
      source: this.source,
      context: this.context
    };
  }
}

/**
 * The Capture Engine
 */
class CaptureEngine {
  constructor() {
    this.signalBuffer = [];
    this.bufferSize = 1000;
    this.patterns = new Map();  // Pattern detectors

    // Register built-in pattern detectors
    this._registerBuiltInDetectors();
  }

  /**
   * Register built-in pattern detectors
   */
  _registerBuiltInDetectors() {
    // Frustration detector
    this.registerDetector('frustration', (message) => {
      const frustrationMarkers = [
        /\b(ugh|argh|wtf|tf|dammit|damn)\b/i,
        /\b(frustrated|annoying|annoyed|confused)\b/i,
        /\b(doesn't work|not working|broken|wrong)\b/i,
        /[!?]{2,}/,
        /\.{3,}/
      ];

      const matches = frustrationMarkers.filter(m => m.test(message)).length;
      if (matches > 0) {
        return new Signal(SignalType.FRUSTRATION_MARKER, {
          intensity: Math.min(matches / 3, 1),
          markers_found: matches
        }, {
          confidence: matches > 1 ? ConfidenceLevel.DEMONSTRATED : ConfidenceLevel.INFERRED,
          source: 'frustration_detector'
        });
      }
      return null;
    });

    // Engagement detector
    this.registerDetector('engagement', (message, context) => {
      const length = message.length;
      const hasQuestions = /\?/.test(message);
      const hasDetails = length > 200;
      const hasExamples = /for example|such as|like when/i.test(message);

      const engagementScore =
        (hasQuestions ? 0.3 : 0) +
        (hasDetails ? 0.3 : 0) +
        (hasExamples ? 0.4 : 0);

      if (engagementScore > 0) {
        return new Signal(SignalType.ENGAGEMENT_LEVEL, {
          score: engagementScore,
          indicators: { hasQuestions, hasDetails, hasExamples }
        }, {
          confidence: ConfidenceLevel.INFERRED,
          source: 'engagement_detector'
        });
      }
      return null;
    });

    // Preference statement detector
    this.registerDetector('preference', (message) => {
      const preferencePatterns = [
        /I (?:prefer|like|want|need|love|hate)\s+(.+?)(?:\.|$)/gi,
        /(?:please|always|never)\s+(.+?)(?:\.|$)/gi,
        /(?:don't|do not)\s+(.+?)(?:\.|$)/gi
      ];

      const preferences = [];
      for (const pattern of preferencePatterns) {
        let match;
        while ((match = pattern.exec(message)) !== null) {
          preferences.push(match[1].trim());
        }
      }

      if (preferences.length > 0) {
        return new Signal(SignalType.STATED_PREFERENCE, {
          preferences: preferences
        }, {
          confidence: ConfidenceLevel.STATED,
          source: 'preference_detector'
        });
      }
      return null;
    });

    // Knowledge indicator detector
    this.registerDetector('knowledge', (message) => {
      const expertMarkers = [
        /I(?:'ve| have) (?:been|worked|built)/i,
        /in my experience/i,
        /I know (?:how to|about)/i,
        /I'm familiar with/i
      ];

      const noviceMarkers = [
        /I(?:'m| am) (?:new to|learning|trying to understand)/i,
        /how (?:do|does|can) I/i,
        /what (?:is|are|does)/i,
        /I don't (?:know|understand)/i
      ];

      const expertMatches = expertMarkers.filter(m => m.test(message)).length;
      const noviceMatches = noviceMarkers.filter(m => m.test(message)).length;

      if (expertMatches > 0 || noviceMatches > 0) {
        return new Signal(SignalType.STATED_KNOWLEDGE, {
          expert_indicators: expertMatches,
          novice_indicators: noviceMatches,
          inferred_level: expertMatches > noviceMatches ? 'experienced' : 'learning'
        }, {
          confidence: ConfidenceLevel.STATED,
          source: 'knowledge_detector'
        });
      }
      return null;
    });

    // Satisfaction detector
    this.registerDetector('satisfaction', (message) => {
      const positiveMarkers = [
        /\b(thanks|thank you|perfect|great|awesome|excellent|love it)\b/i,
        /\b(this is exactly|that's what I needed|you got it)\b/i,
        /\b(brilliant|amazing|wonderful)\b/i,
        /👍|🎉|✅|💯|🔥/
      ];

      const matches = positiveMarkers.filter(m => m.test(message)).length;
      if (matches > 0) {
        return new Signal(SignalType.SATISFACTION_MARKER, {
          intensity: Math.min(matches / 2, 1),
          markers_found: matches
        }, {
          confidence: ConfidenceLevel.DEMONSTRATED,
          source: 'satisfaction_detector'
        });
      }
      return null;
    });

    // Goal statement detector
    this.registerDetector('goals', (message) => {
      const goalPatterns = [
        /I(?:'m| am) (?:trying|working|hoping) to\s+(.+?)(?:\.|$)/gi,
        /(?:my|the) goal is\s+(.+?)(?:\.|$)/gi,
        /I want to\s+(.+?)(?:\.|$)/gi,
        /I need to\s+(.+?)(?:\.|$)/gi
      ];

      const goals = [];
      for (const pattern of goalPatterns) {
        let match;
        while ((match = pattern.exec(message)) !== null) {
          goals.push(match[1].trim());
        }
      }

      if (goals.length > 0) {
        return new Signal(SignalType.STATED_GOAL, {
          goals: goals
        }, {
          confidence: ConfidenceLevel.STATED,
          source: 'goal_detector'
        });
      }
      return null;
    });

    // Boundary detector
    this.registerDetector('boundaries', (message) => {
      const boundaryPatterns = [
        /(?:don't|do not|please don't|never)\s+(?:ask|tell|share|mention)\s+(.+?)(?:\.|$)/gi,
        /(?:that's|this is)\s+(?:private|personal|sensitive)/i,
        /I(?:'d| would) rather not\s+(.+?)(?:\.|$)/gi
      ];

      const boundaries = [];
      for (const pattern of boundaryPatterns) {
        let match;
        while ((match = pattern.exec(message)) !== null) {
          boundaries.push(match[1]?.trim() || 'unspecified');
        }
      }

      if (boundaries.length > 0) {
        return new Signal(SignalType.STATED_BOUNDARY, {
          boundaries: boundaries
        }, {
          confidence: ConfidenceLevel.STATED,
          source: 'boundary_detector'
        });
      }
      return null;
    });
  }

  /**
   * Register a custom pattern detector
   */
  registerDetector(name, detector) {
    this.patterns.set(name, detector);
  }

  /**
   * Capture signals from a message
   */
  capture(message, context = {}) {
    const signals = [];

    // Run all pattern detectors
    for (const [name, detector] of this.patterns) {
      try {
        const signal = detector(message, context);
        if (signal) {
          signal.context = { ...signal.context, ...context, detector: name };
          signals.push(signal);
          this._addToBuffer(signal);
        }
      } catch (e) {
        console.error(`Detector ${name} failed:`, e.message);
      }
    }

    return signals;
  }

  /**
   * Capture a timing signal
   */
  captureTimingSignal(sessionStart, sessionEnd, context = {}) {
    const start = new Date(sessionStart);
    const end = new Date(sessionEnd);
    const duration = (end - start) / 1000 / 60;  // minutes
    const hour = start.getHours();
    const dayOfWeek = start.getDay();

    const signal = new Signal(SignalType.SESSION_TIMING, {
      start_hour: hour,
      day_of_week: dayOfWeek,
      duration_minutes: duration,
      time_category: this._categorizeTime(hour)
    }, {
      confidence: ConfidenceLevel.DEMONSTRATED,
      source: 'timing_capture',
      context
    });

    this._addToBuffer(signal);
    return signal;
  }

  /**
   * Capture topic transition
   */
  captureTopicTransition(fromTopic, toTopic, transitionType, context = {}) {
    const signal = new Signal(SignalType.TOPIC_TRANSITION, {
      from: fromTopic,
      to: toTopic,
      type: transitionType  // 'natural', 'abrupt', 'user_initiated', 'avatar_suggested'
    }, {
      confidence: ConfidenceLevel.DEMONSTRATED,
      source: 'topic_tracker',
      context
    });

    this._addToBuffer(signal);
    return signal;
  }

  /**
   * Capture a resonance moment
   */
  captureResonance(trigger, quality, context = {}) {
    const signal = new Signal(SignalType.RESONANCE_MOMENT, {
      trigger,
      quality,  // 0-1
      indicators: context.indicators || []
    }, {
      confidence: ConfidenceLevel.DEMONSTRATED,
      source: 'resonance_detector',
      context
    });

    this._addToBuffer(signal);
    return signal;
  }

  /**
   * Capture avatar preference signal
   */
  captureAvatarPreference(avatar, preference, reason = null) {
    const signal = new Signal(SignalType.AVATAR_PREFERENCE, {
      avatar,
      preference,  // 'positive', 'negative', 'neutral'
      reason
    }, {
      confidence: reason ? ConfidenceLevel.STATED : ConfidenceLevel.INFERRED,
      source: 'avatar_preference'
    });

    this._addToBuffer(signal);
    return signal;
  }

  /**
   * Capture trust indicator
   */
  captureTrustIndicator(avatar, indicator, direction) {
    const signal = new Signal(SignalType.TRUST_INDICATOR, {
      avatar,
      indicator,  // e.g., 'shared_personal', 'requested_help', 'gave_feedback'
      direction  // 'increase', 'decrease', 'neutral'
    }, {
      confidence: ConfidenceLevel.DEMONSTRATED,
      source: 'trust_tracker'
    });

    this._addToBuffer(signal);
    return signal;
  }

  /**
   * Add signal to buffer
   */
  _addToBuffer(signal) {
    this.signalBuffer.push(signal);

    // Trim buffer if too large
    if (this.signalBuffer.length > this.bufferSize) {
      this.signalBuffer = this.signalBuffer.slice(-this.bufferSize);
    }
  }

  /**
   * Get all buffered signals
   */
  getBufferedSignals() {
    return [...this.signalBuffer];
  }

  /**
   * Get signals by type
   */
  getSignalsByType(type) {
    return this.signalBuffer.filter(s => s.type === type);
  }

  /**
   * Get signals since timestamp
   */
  getSignalsSince(timestamp) {
    const since = new Date(timestamp);
    return this.signalBuffer.filter(s => new Date(s.timestamp) >= since);
  }

  /**
   * Clear buffer (after processing)
   */
  clearBuffer() {
    const signals = [...this.signalBuffer];
    this.signalBuffer = [];
    return signals;
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
   * Get capture statistics
   */
  getStats() {
    const byType = {};
    for (const signal of this.signalBuffer) {
      byType[signal.type] = (byType[signal.type] || 0) + 1;
    }

    return {
      total_signals: this.signalBuffer.length,
      buffer_capacity: this.bufferSize,
      signals_by_type: byType,
      registered_detectors: Array.from(this.patterns.keys())
    };
  }
}

module.exports = {
  SignalType,
  Signal,
  CaptureEngine
};
