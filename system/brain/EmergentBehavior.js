/**
 * EMERGENT BEHAVIOR ENGINE
 * The system that discovers new capabilities on its own
 *
 * "We didn't program it to do that. It just... evolved."
 *
 * Features:
 * - Pattern discovery across executions
 * - Automatic capability emergence
 * - Self-organizing swarm behavior
 * - Spontaneous optimization discovery
 * - Collective intelligence emergence
 * - Novel strategy invention
 */

// Emergent behavior types
const EMERGENT_TYPES = {
  PATTERN: 'pattern',             // Discovered execution pattern
  STRATEGY: 'strategy',           // New strategy emerged
  OPTIMIZATION: 'optimization',   // Performance optimization
  SYNERGY: 'synergy',             // Swarm synergy discovered
  SHORTCUT: 'shortcut',           // Execution shortcut found
  CAPABILITY: 'capability'        // New capability emerged
};

// Emergence thresholds
const EMERGENCE_THRESHOLDS = {
  MIN_OCCURRENCES: 5,             // Minimum times pattern must occur
  MIN_SUCCESS_RATE: 0.8,          // Minimum success rate for pattern
  SYNERGY_BOOST: 1.2,             // Minimum boost for synergy
  NOVELTY_THRESHOLD: 0.7          // How different from known patterns
};

/**
 * Pattern Signature
 * Represents a discovered pattern in system behavior
 */
class PatternSignature {
  constructor(data) {
    this.id = data.id || Math.random().toString(36).substr(2, 12);
    this.type = data.type || EMERGENT_TYPES.PATTERN;
    this.signature = data.signature;
    this.occurrences = data.occurrences || 1;
    this.successRate = data.successRate || 1;
    this.avgQuality = data.avgQuality || 0.8;
    this.avgSpeedup = data.avgSpeedup || 1;
    this.discoveredAt = Date.now();
    this.lastSeenAt = Date.now();
    this.isEmergent = false;
  }

  /**
   * Check if pattern has emerged (become significant)
   */
  checkEmergence() {
    const hasEnoughOccurrences = this.occurrences >= EMERGENCE_THRESHOLDS.MIN_OCCURRENCES;
    const hasGoodSuccessRate = this.successRate >= EMERGENCE_THRESHOLDS.MIN_SUCCESS_RATE;
    const hasValue = this.avgQuality > 0.75 || this.avgSpeedup > 1.2;

    this.isEmergent = hasEnoughOccurrences && hasGoodSuccessRate && hasValue;
    return this.isEmergent;
  }

  /**
   * Record occurrence
   */
  recordOccurrence(success, quality, speedup) {
    const n = this.occurrences;
    this.occurrences++;
    this.successRate = (this.successRate * n + (success ? 1 : 0)) / (n + 1);
    this.avgQuality = (this.avgQuality * n + quality) / (n + 1);
    this.avgSpeedup = (this.avgSpeedup * n + speedup) / (n + 1);
    this.lastSeenAt = Date.now();

    return this.checkEmergence();
  }

  /**
   * Get pattern value score
   */
  getValueScore() {
    return this.successRate * this.avgQuality * this.avgSpeedup * Math.log(this.occurrences + 1);
  }
}

/**
 * Execution Fingerprint
 * Creates fingerprints of executions for pattern matching
 */
class ExecutionFingerprinter {
  constructor() {
    this.dimensions = [
      'taskType',
      'strategy',
      'modelCount',
      'parallel',
      'cached',
      'quality'
    ];
  }

  /**
   * Create fingerprint from execution
   */
  createFingerprint(execution) {
    return {
      taskType: this.classifyTask(execution.task || ''),
      strategy: execution.strategy || 'unknown',
      modelCount: execution.modelCount || 1,
      parallel: execution.parallel || false,
      cached: execution.cached || false,
      qualityBand: this.getQualityBand(execution.quality || 0),
      latencyBand: this.getLatencyBand(execution.latency || 0),
      hash: this.computeHash(execution)
    };
  }

  /**
   * Classify task type
   */
  classifyTask(task) {
    const lower = task.toLowerCase();
    if (/code|function|implement|debug/.test(lower)) return 'code';
    if (/analyze|compare|evaluate/.test(lower)) return 'analysis';
    if (/create|write|design|generate/.test(lower)) return 'creative';
    if (/calculate|compute|math/.test(lower)) return 'math';
    return 'general';
  }

  /**
   * Get quality band
   */
  getQualityBand(quality) {
    if (quality >= 0.9) return 'excellent';
    if (quality >= 0.75) return 'good';
    if (quality >= 0.5) return 'fair';
    return 'poor';
  }

  /**
   * Get latency band
   */
  getLatencyBand(latency) {
    if (latency <= 500) return 'instant';
    if (latency <= 2000) return 'fast';
    if (latency <= 5000) return 'moderate';
    return 'slow';
  }

  /**
   * Compute hash for fingerprint matching
   */
  computeHash(execution) {
    const components = [
      this.classifyTask(execution.task || ''),
      execution.strategy || 'x',
      Math.floor((execution.modelCount || 1) / 2),
      execution.parallel ? 'p' : 's'
    ];
    return components.join(':');
  }

  /**
   * Calculate similarity between fingerprints
   */
  similarity(fp1, fp2) {
    let matches = 0;
    let total = 0;

    for (const dim of this.dimensions) {
      if (fp1[dim] !== undefined && fp2[dim] !== undefined) {
        total++;
        if (fp1[dim] === fp2[dim]) matches++;
      }
    }

    return total > 0 ? matches / total : 0;
  }
}

/**
 * Synergy Detector
 * Detects synergies between swarms/strategies
 */
class SynergyDetector {
  constructor() {
    this.combinations = new Map();
    this.synergies = [];
  }

  /**
   * Record a combination execution
   */
  recordCombination(components, result) {
    const key = this.getCombinationKey(components);

    if (!this.combinations.has(key)) {
      this.combinations.set(key, {
        components,
        executions: [],
        avgQuality: 0,
        avgLatency: 0
      });
    }

    const combo = this.combinations.get(key);
    combo.executions.push(result);

    const n = combo.executions.length;
    combo.avgQuality = (combo.avgQuality * (n - 1) + (result.quality || 0)) / n;
    combo.avgLatency = (combo.avgLatency * (n - 1) + (result.latency || 0)) / n;

    // Check for synergy
    if (n >= 3) {
      this.checkSynergy(key, combo, components);
    }
  }

  /**
   * Get combination key
   */
  getCombinationKey(components) {
    return components.sort().join('+');
  }

  /**
   * Check if combination creates synergy
   */
  checkSynergy(key, combo, components) {
    // Compare to individual component performance (simplified)
    const expectedQuality = 0.7; // Baseline
    const boost = combo.avgQuality / expectedQuality;

    if (boost >= EMERGENCE_THRESHOLDS.SYNERGY_BOOST) {
      const synergy = {
        id: `synergy_${this.synergies.length}`,
        components,
        boost: boost,
        quality: combo.avgQuality,
        occurrences: combo.executions.length,
        discoveredAt: Date.now()
      };

      // Check if synergy already recorded
      const existing = this.synergies.find(s =>
        this.getCombinationKey(s.components) === key
      );

      if (!existing) {
        this.synergies.push(synergy);
        return synergy;
      } else {
        existing.boost = boost;
        existing.occurrences = combo.executions.length;
      }
    }

    return null;
  }

  /**
   * Get known synergies
   */
  getSynergies() {
    return this.synergies.sort((a, b) => b.boost - a.boost);
  }

  /**
   * Recommend synergistic combinations
   */
  recommend(currentComponents) {
    const recommendations = [];

    for (const synergy of this.synergies) {
      // Check if any synergy component could be added
      const missing = synergy.components.filter(c => !currentComponents.includes(c));
      if (missing.length > 0 && missing.length <= 2) {
        recommendations.push({
          add: missing,
          expectedBoost: synergy.boost,
          synergy: synergy.id
        });
      }
    }

    return recommendations.sort((a, b) => b.expectedBoost - a.expectedBoost);
  }
}

/**
 * Capability Discoverer
 * Discovers new capabilities the system develops
 */
class CapabilityDiscoverer {
  constructor() {
    this.knownCapabilities = new Set([
      'text_generation', 'code_writing', 'analysis', 'summarization',
      'translation', 'math', 'reasoning', 'creative_writing'
    ]);
    this.emergentCapabilities = [];
  }

  /**
   * Analyze execution for new capabilities
   */
  analyze(execution) {
    const indicators = this.extractCapabilityIndicators(execution);
    const novel = indicators.filter(i => !this.knownCapabilities.has(i));

    for (const capability of novel) {
      this.recordEmergentCapability(capability, execution);
    }

    return novel;
  }

  /**
   * Extract capability indicators from execution
   */
  extractCapabilityIndicators(execution) {
    const indicators = [];
    const content = execution.content || execution.result || '';
    const task = execution.task || '';

    // Check for hybrid capabilities
    if (/code/.test(task) && /explain/.test(task)) {
      indicators.push('code_explanation');
    }
    if (/compare/.test(task) && /recommend/.test(task)) {
      indicators.push('comparative_recommendation');
    }
    if (/creative/.test(task) && /technical/.test(task)) {
      indicators.push('creative_technical_fusion');
    }
    if (execution.parallel && execution.modelCount > 3) {
      indicators.push('massive_parallel_synthesis');
    }
    if (execution.cached && execution.quality > 0.9) {
      indicators.push('high_quality_instant_response');
    }

    return indicators;
  }

  /**
   * Record emergent capability
   */
  recordEmergentCapability(name, execution) {
    const existing = this.emergentCapabilities.find(c => c.name === name);

    if (existing) {
      existing.occurrences++;
      existing.lastSeen = Date.now();
      existing.avgQuality = (existing.avgQuality + (execution.quality || 0.7)) / 2;
    } else {
      this.emergentCapabilities.push({
        name,
        discoveredAt: Date.now(),
        lastSeen: Date.now(),
        occurrences: 1,
        avgQuality: execution.quality || 0.7,
        sourceTask: execution.task?.substring(0, 100)
      });
    }
  }

  /**
   * Get all capabilities (known + emergent)
   */
  getAllCapabilities() {
    const emergent = this.emergentCapabilities
      .filter(c => c.occurrences >= 3)
      .map(c => c.name);

    return {
      known: [...this.knownCapabilities],
      emergent,
      total: this.knownCapabilities.size + emergent.length
    };
  }
}

/**
 * Emergent Behavior Engine
 * The main engine for detecting and leveraging emergent behaviors
 */
class EmergentBehaviorEngine {
  constructor(config = {}) {
    this.fingerprinter = new ExecutionFingerprinter();
    this.synergyDetector = new SynergyDetector();
    this.capabilityDiscoverer = new CapabilityDiscoverer();

    this.patterns = new Map();
    this.emergentPatterns = [];

    this.stats = {
      executionsAnalyzed: 0,
      patternsDiscovered: 0,
      synergiesFound: 0,
      emergentCapabilities: 0,
      totalValueCreated: 0
    };

    // Auto-optimization
    this.autoOptimize = config.autoOptimize !== false;
    this.optimizationCallbacks = [];
  }

  /**
   * Analyze an execution for emergent behaviors
   */
  analyze(execution) {
    this.stats.executionsAnalyzed++;

    // Create fingerprint
    const fingerprint = this.fingerprinter.createFingerprint(execution);

    // Match to existing patterns
    const patternMatch = this.matchPattern(fingerprint);

    if (patternMatch) {
      // Update existing pattern
      const emerged = patternMatch.recordOccurrence(
        execution.success !== false,
        execution.quality || 0.7,
        execution.speedup || 1
      );

      if (emerged && !this.emergentPatterns.includes(patternMatch)) {
        this.emergentPatterns.push(patternMatch);
        this.stats.patternsDiscovered++;
        this.onEmergence(patternMatch);
      }
    } else {
      // Create new pattern
      const pattern = new PatternSignature({
        signature: fingerprint,
        successRate: execution.success !== false ? 1 : 0,
        avgQuality: execution.quality || 0.7
      });
      this.patterns.set(fingerprint.hash, pattern);
    }

    // Check for synergies
    if (execution.components) {
      const synergy = this.synergyDetector.recordCombination(
        execution.components,
        execution
      );
      if (synergy) {
        this.stats.synergiesFound++;
        this.onSynergyDiscovered(synergy);
      }
    }

    // Check for new capabilities
    const newCapabilities = this.capabilityDiscoverer.analyze(execution);
    this.stats.emergentCapabilities += newCapabilities.length;

    return {
      fingerprint,
      patternMatch: patternMatch?.isEmergent,
      newCapabilities
    };
  }

  /**
   * Match fingerprint to existing pattern
   */
  matchPattern(fingerprint) {
    // Exact match
    if (this.patterns.has(fingerprint.hash)) {
      return this.patterns.get(fingerprint.hash);
    }

    // Fuzzy match
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const [, pattern] of this.patterns) {
      const similarity = this.fingerprinter.similarity(fingerprint, pattern.signature);
      if (similarity > 0.8 && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = pattern;
      }
    }

    return bestMatch;
  }

  /**
   * Called when a pattern emerges
   */
  onEmergence(pattern) {
    if (this.autoOptimize) {
      // Trigger optimization callbacks
      for (const callback of this.optimizationCallbacks) {
        try {
          callback({
            type: 'pattern_emerged',
            pattern: pattern.signature,
            value: pattern.getValueScore()
          });
        } catch (e) {
          // Callback failed
        }
      }
    }
  }

  /**
   * Called when synergy discovered
   */
  onSynergyDiscovered(synergy) {
    if (this.autoOptimize) {
      for (const callback of this.optimizationCallbacks) {
        try {
          callback({
            type: 'synergy_discovered',
            synergy,
            boost: synergy.boost
          });
        } catch (e) {
          // Callback failed
        }
      }
    }
  }

  /**
   * Register optimization callback
   */
  onOptimization(callback) {
    this.optimizationCallbacks.push(callback);
  }

  /**
   * Get recommendations based on emergent patterns
   */
  getRecommendations(context = {}) {
    const recommendations = [];

    // Recommend high-value emergent patterns
    const topPatterns = this.emergentPatterns
      .sort((a, b) => b.getValueScore() - a.getValueScore())
      .slice(0, 5);

    for (const pattern of topPatterns) {
      recommendations.push({
        type: 'use_pattern',
        pattern: pattern.signature,
        expectedValue: pattern.getValueScore(),
        confidence: pattern.successRate
      });
    }

    // Recommend synergies
    if (context.currentComponents) {
      const synergyRecs = this.synergyDetector.recommend(context.currentComponents);
      recommendations.push(...synergyRecs.slice(0, 3));
    }

    return recommendations;
  }

  /**
   * Get engine status
   */
  getStatus() {
    return {
      stats: this.stats,
      patterns: {
        total: this.patterns.size,
        emergent: this.emergentPatterns.length,
        topPatterns: this.emergentPatterns
          .sort((a, b) => b.getValueScore() - a.getValueScore())
          .slice(0, 5)
          .map(p => ({
            type: p.signature.taskType,
            strategy: p.signature.strategy,
            value: p.getValueScore().toFixed(2),
            occurrences: p.occurrences
          }))
      },
      synergies: this.synergyDetector.getSynergies().slice(0, 5),
      capabilities: this.capabilityDiscoverer.getAllCapabilities()
    };
  }
}

module.exports = {
  EMERGENT_TYPES,
  EMERGENCE_THRESHOLDS,
  PatternSignature,
  ExecutionFingerprinter,
  SynergyDetector,
  CapabilityDiscoverer,
  EmergentBehaviorEngine
};
