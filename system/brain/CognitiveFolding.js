// ============================================================
//  COGNITIVE FOLDING
// ============================================================
//
//  "Fold the loop over itself and run two versions in parallel"
//
//  Architecture:
//  - SPECULATIVE branch: Leaps ahead with creative solutions
//  - GROUNDED branch: Applies real constraints and validation
//  - ERROR-CANCELING RESOLVER: Binds them together
//
//  The speculative version leaps ahead.
//  The grounded version drags it back to sanity.
//  Their tug-of-war produces better results than either alone.
//
//  "Nature does this constantly. There's a reason evolution
//   prefers two minds fighting inside one skull."
//
// ============================================================

const { EventEmitter } = require('events');

// Golden ratio for balance
const PHI = 1.618033988749895;

// ============================================================
//  SPECULATIVE BRANCH
// ============================================================

class SpeculativeBranch {
  constructor(config = {}) {
    this.creativity = config.creativity || 0.8;  // How far to leap
    this.riskTolerance = config.riskTolerance || 0.7;
    this.explorationDepth = config.explorationDepth || 5;
  }

  // Generate speculative solution
  async process(input, context = {}) {
    const startTime = Date.now();

    // Speculative processing: explore beyond constraints
    const solution = {
      type: 'speculative',
      input: this.hashInput(input),
      explorations: [],
      bestPath: null,
      confidence: 0
    };

    // Explore multiple paths
    for (let i = 0; i < this.explorationDepth; i++) {
      const exploration = this.explore(input, context, i);
      solution.explorations.push(exploration);

      if (exploration.score > solution.confidence) {
        solution.confidence = exploration.score;
        solution.bestPath = exploration;
      }
    }

    // Apply creativity amplification
    if (solution.bestPath) {
      solution.bestPath = this.amplifyCreativity(solution.bestPath);
    }

    solution.processingTime = Date.now() - startTime;
    return solution;
  }

  // Explore a single path
  explore(input, context, depth) {
    const path = {
      depth,
      mutations: [],
      score: 0,
      leap: null
    };

    // Start with input pattern
    let current = typeof input === 'object' ? { ...input } : { value: input };

    // Apply creative mutations
    for (let i = 0; i < 3 + depth; i++) {
      const mutation = this.mutate(current, this.creativity * (1 + depth * 0.1));
      path.mutations.push(mutation);
      current = mutation.result;
    }

    // Score based on novelty and coherence
    path.score = this.scoreExploration(path, context);

    // Record the creative leap
    path.leap = {
      from: this.hashInput(input),
      to: this.hashInput(current),
      distance: path.mutations.length,
      novelty: Math.random() * this.creativity // Simulated novelty
    };

    return path;
  }

  // Apply creative mutation
  mutate(pattern, creativity) {
    const mutation = {
      type: this.selectMutationType(creativity),
      original: pattern,
      result: { ...pattern }
    };

    switch (mutation.type) {
      case 'expand':
        // Add new properties
        mutation.result._speculative = {
          expanded: true,
          creativity,
          timestamp: Date.now()
        };
        break;

      case 'combine':
        // Combine with random pattern
        mutation.result._combined = true;
        break;

      case 'invert':
        // Invert assumptions
        if (mutation.result.score) {
          mutation.result.score = 1 - mutation.result.score;
        }
        mutation.result._inverted = true;
        break;

      case 'leap':
        // Make a creative leap
        mutation.result._leap = {
          magnitude: creativity * PHI,
          direction: Math.random() > 0.5 ? 'forward' : 'lateral'
        };
        break;
    }

    return mutation;
  }

  selectMutationType(creativity) {
    const types = ['expand', 'combine', 'invert', 'leap'];
    const weights = [0.3, 0.25, 0.15, 0.3 * creativity];
    const total = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;

    for (let i = 0; i < types.length; i++) {
      random -= weights[i];
      if (random <= 0) return types[i];
    }
    return types[0];
  }

  scoreExploration(path, context) {
    let score = 0.5; // Base score

    // Bonus for depth
    score += path.depth * 0.05;

    // Bonus for mutations
    score += path.mutations.length * 0.02;

    // Context-based scoring
    if (context.preferNovelty) score += 0.1;
    if (context.riskReward) score *= 1.2;

    return Math.min(1, score);
  }

  amplifyCreativity(path) {
    return {
      ...path,
      amplified: true,
      creativityBoost: PHI - 1 // ~0.618
    };
  }

  hashInput(input) {
    return typeof input === 'string' ? input.slice(0, 20) :
           JSON.stringify(input).slice(0, 20);
  }
}

// ============================================================
//  GROUNDED BRANCH
// ============================================================

class GroundedBranch {
  constructor(config = {}) {
    this.strictness = config.strictness || 0.9;
    this.constraints = config.constraints || [];
    this.validationDepth = config.validationDepth || 3;
  }

  // Generate grounded solution
  async process(input, context = {}) {
    const startTime = Date.now();

    const solution = {
      type: 'grounded',
      input: this.hashInput(input),
      validations: [],
      constraintResults: [],
      finalPattern: null,
      confidence: 0
    };

    // Apply all constraints
    let current = typeof input === 'object' ? { ...input } : { value: input };

    for (const constraint of this.constraints) {
      const result = this.applyConstraint(current, constraint);
      solution.constraintResults.push(result);

      if (result.passed) {
        current = result.constrained;
      } else {
        solution.violations = solution.violations || [];
        solution.violations.push(result);
      }
    }

    // Validate the result
    for (let i = 0; i < this.validationDepth; i++) {
      const validation = this.validate(current, context, i);
      solution.validations.push(validation);
    }

    // Calculate confidence based on validations
    solution.confidence = this.calculateConfidence(solution);
    solution.finalPattern = current;
    solution.processingTime = Date.now() - startTime;

    return solution;
  }

  // Apply a constraint
  applyConstraint(pattern, constraint) {
    const result = {
      constraint: constraint.name || 'unnamed',
      passed: true,
      constrained: { ...pattern }
    };

    switch (constraint.type) {
      case 'range':
        // Ensure values are in range
        if (pattern.score !== undefined) {
          result.constrained.score = Math.max(
            constraint.min || 0,
            Math.min(constraint.max || 1, pattern.score)
          );
        }
        break;

      case 'required':
        // Ensure required fields exist
        if (!pattern[constraint.field]) {
          result.passed = false;
          result.violation = `Missing required field: ${constraint.field}`;
        }
        break;

      case 'type':
        // Ensure correct type
        if (typeof pattern[constraint.field] !== constraint.expectedType) {
          result.passed = false;
          result.violation = `Type mismatch for ${constraint.field}`;
        }
        break;

      case 'custom':
        // Custom constraint function
        if (constraint.validate && !constraint.validate(pattern)) {
          result.passed = false;
          result.violation = constraint.message || 'Custom constraint failed';
        }
        break;
    }

    return result;
  }

  // Validate pattern
  validate(pattern, context, depth) {
    return {
      depth,
      isValid: true,
      checks: [
        { name: 'structure', passed: typeof pattern === 'object' },
        { name: 'non-empty', passed: Object.keys(pattern).length > 0 },
        { name: 'grounded', passed: !pattern._speculative }
      ]
    };
  }

  // Calculate overall confidence
  calculateConfidence(solution) {
    const validationScore = solution.validations.filter(v => v.isValid).length /
                           Math.max(1, solution.validations.length);

    const constraintScore = solution.constraintResults.filter(c => c.passed).length /
                           Math.max(1, solution.constraintResults.length);

    return (validationScore * 0.4 + constraintScore * 0.6) * this.strictness;
  }

  hashInput(input) {
    return typeof input === 'string' ? input.slice(0, 20) :
           JSON.stringify(input).slice(0, 20);
  }
}

// ============================================================
//  ERROR-CANCELING RESOLVER
// ============================================================

class ErrorCancelingResolver {
  constructor(config = {}) {
    this.balanceRatio = config.balanceRatio || PHI / (1 + PHI); // ~0.618
    this.conflictStrategy = config.conflictStrategy || 'weighted';
  }

  // Resolve speculative and grounded solutions
  resolve(speculative, grounded) {
    const resolution = {
      timestamp: Date.now(),
      speculative: {
        confidence: speculative.confidence,
        processingTime: speculative.processingTime
      },
      grounded: {
        confidence: grounded.confidence,
        processingTime: grounded.processingTime
      },
      merged: null,
      errors: [],
      quality: 0
    };

    // Identify conflicts
    const conflicts = this.findConflicts(speculative, grounded);
    resolution.conflicts = conflicts;

    // Merge based on strategy
    switch (this.conflictStrategy) {
      case 'weighted':
        resolution.merged = this.weightedMerge(speculative, grounded);
        break;

      case 'speculative-bias':
        resolution.merged = this.speculativeBiasMerge(speculative, grounded);
        break;

      case 'grounded-bias':
        resolution.merged = this.groundedBiasMerge(speculative, grounded);
        break;

      case 'adaptive':
        resolution.merged = this.adaptiveMerge(speculative, grounded, conflicts);
        break;
    }

    // Calculate final quality
    resolution.quality = this.calculateQuality(resolution);

    // Error cancellation
    resolution.canceledErrors = this.cancelErrors(speculative, grounded);

    return resolution;
  }

  // Find conflicts between branches
  findConflicts(speculative, grounded) {
    const conflicts = [];

    // Confidence conflict
    if (Math.abs(speculative.confidence - grounded.confidence) > 0.3) {
      conflicts.push({
        type: 'confidence_divergence',
        speculative: speculative.confidence,
        grounded: grounded.confidence,
        delta: speculative.confidence - grounded.confidence
      });
    }

    // Processing time conflict (one took much longer)
    const timeRatio = speculative.processingTime / Math.max(1, grounded.processingTime);
    if (timeRatio > 3 || timeRatio < 0.33) {
      conflicts.push({
        type: 'processing_asymmetry',
        ratio: timeRatio
      });
    }

    return conflicts;
  }

  // Weighted merge using golden ratio
  weightedMerge(speculative, grounded) {
    const specWeight = this.balanceRatio; // ~0.618
    const groundWeight = 1 - specWeight;  // ~0.382

    return {
      type: 'weighted_merge',
      pattern: this.mergePatterns(
        speculative.bestPath?.mutations?.slice(-1)[0]?.result || {},
        grounded.finalPattern || {},
        specWeight,
        groundWeight
      ),
      confidence: (speculative.confidence * specWeight +
                  grounded.confidence * groundWeight),
      weights: { speculative: specWeight, grounded: groundWeight }
    };
  }

  // Speculative-biased merge
  speculativeBiasMerge(speculative, grounded) {
    return {
      type: 'speculative_bias',
      pattern: speculative.bestPath?.mutations?.slice(-1)[0]?.result || {},
      grounding: grounded.finalPattern,
      confidence: speculative.confidence * 0.8 + grounded.confidence * 0.2
    };
  }

  // Grounded-biased merge
  groundedBiasMerge(speculative, grounded) {
    return {
      type: 'grounded_bias',
      pattern: grounded.finalPattern || {},
      speculation: speculative.bestPath,
      confidence: grounded.confidence * 0.8 + speculative.confidence * 0.2
    };
  }

  // Adaptive merge based on conflict analysis
  adaptiveMerge(speculative, grounded, conflicts) {
    // If many conflicts, favor grounded
    if (conflicts.length > 2) {
      return this.groundedBiasMerge(speculative, grounded);
    }

    // If speculative has higher confidence, favor it
    if (speculative.confidence > grounded.confidence + 0.2) {
      return this.speculativeBiasMerge(speculative, grounded);
    }

    // Default to weighted
    return this.weightedMerge(speculative, grounded);
  }

  // Merge two patterns with weights
  mergePatterns(p1, p2, w1, w2) {
    const merged = { ...p1 };

    for (const key of Object.keys(p2)) {
      if (merged[key] === undefined) {
        merged[key] = p2[key];
      } else if (typeof merged[key] === 'number' && typeof p2[key] === 'number') {
        // Weighted average for numbers
        merged[key] = merged[key] * w1 + p2[key] * w2;
      }
    }

    merged._merged = true;
    merged._weights = { speculative: w1, grounded: w2 };

    return merged;
  }

  // Calculate final quality
  calculateQuality(resolution) {
    const baseQuality = resolution.merged?.confidence || 0;
    const conflictPenalty = resolution.conflicts.length * 0.05;
    const errorBonus = resolution.canceledErrors?.length * 0.02 || 0;

    return Math.max(0, Math.min(1, baseQuality - conflictPenalty + errorBonus));
  }

  // Identify errors that cancel out
  cancelErrors(speculative, grounded) {
    const canceled = [];

    // If speculative went too far, grounded pulls back
    if (speculative.bestPath?.leap?.magnitude > 1) {
      canceled.push({
        type: 'over_speculation',
        canceledBy: 'grounding_constraints'
      });
    }

    // If grounded was too conservative, speculative expands
    if (grounded.confidence < 0.5 && speculative.confidence > 0.7) {
      canceled.push({
        type: 'over_caution',
        canceledBy: 'speculative_exploration'
      });
    }

    return canceled;
  }
}

// ============================================================
//  COGNITIVE FOLDING ENGINE (Main Class)
// ============================================================

class CognitiveFolding extends EventEmitter {
  constructor(config = {}) {
    super();

    this.speculative = new SpeculativeBranch(config.speculative || {});
    this.grounded = new GroundedBranch({
      constraints: config.constraints || [
        { type: 'range', min: 0, max: 1, name: 'score_range' }
      ],
      ...config.grounded
    });
    this.resolver = new ErrorCancelingResolver(config.resolver || {});

    this.stats = {
      folds: 0,
      avgQuality: 0,
      speculativeWins: 0,
      groundedWins: 0,
      perfectMerges: 0
    };
  }

  // ============================================================
  //  MAIN FOLD OPERATION
  // ============================================================

  async fold(input, context = {}) {
    const foldStart = Date.now();
    this.stats.folds++;

    // Run both branches in parallel
    const [speculative, grounded] = await Promise.all([
      this.speculative.process(input, context),
      this.grounded.process(input, context)
    ]);

    // Resolve with error cancellation
    const resolution = this.resolver.resolve(speculative, grounded);

    // Update stats
    this.updateStats(resolution);

    // Emit result
    this.emit('fold:complete', {
      input: typeof input === 'string' ? input : 'object',
      resolution,
      totalTime: Date.now() - foldStart
    });

    return resolution;
  }

  // Batch fold multiple inputs
  async foldBatch(inputs, context = {}) {
    const results = await Promise.all(
      inputs.map(input => this.fold(input, context))
    );

    return {
      results,
      avgQuality: results.reduce((sum, r) => sum + r.quality, 0) / results.length,
      bestResult: results.reduce((best, r) => r.quality > best.quality ? r : best)
    };
  }

  // Update statistics
  updateStats(resolution) {
    this.stats.avgQuality = (this.stats.avgQuality * 0.9) + (resolution.quality * 0.1);

    if (resolution.merged?.type === 'speculative_bias') {
      this.stats.speculativeWins++;
    } else if (resolution.merged?.type === 'grounded_bias') {
      this.stats.groundedWins++;
    }

    if (resolution.quality > 0.9) {
      this.stats.perfectMerges++;
    }
  }

  // Get statistics
  getStats() {
    return {
      ...this.stats,
      balance: this.stats.speculativeWins /
               Math.max(1, this.stats.speculativeWins + this.stats.groundedWins)
    };
  }
}

// ============================================================
//  EXPORTS
// ============================================================

module.exports = {
  CognitiveFolding,
  SpeculativeBranch,
  GroundedBranch,
  ErrorCancelingResolver
};
