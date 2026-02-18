// ============================================================
//  NOISE-INJECTED SELF-SAMPLING
// ============================================================
//
//  "Self-variance training with controlled entropy"
//
//  The system:
//  1. Rewrites its own solution with micro-noise
//  2. Measures error deltas
//  3. Reinforces the dominant successful branches
//  4. Compresses them into the holo-memory
//
//  This creates a self-growing attractor basin that becomes
//  incredibly fast at pattern-matching.
//
// ============================================================

const { EventEmitter } = require('events');
const crypto = require('crypto');

// Golden ratio for noise scaling
const PHI = 1.618033988749895;

// ============================================================
//  NOISE GENERATORS
// ============================================================

const NoiseGenerators = {
  // Gaussian noise (normal distribution)
  gaussian(mean = 0, stdDev = 0.1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
  },

  // Uniform noise
  uniform(min = -0.1, max = 0.1) {
    return min + Math.random() * (max - min);
  },

  // Phi-scaled noise (golden ratio harmonics)
  phi(intensity = 0.1) {
    const base = Math.random() * 2 - 1;
    return base * intensity / PHI;
  },

  // Fractal noise (self-similar at multiple scales)
  fractal(octaves = 4, persistence = 0.5) {
    let total = 0;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += (Math.random() * 2 - 1) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
    }

    return total / maxValue;
  },

  // Entropy-based noise (uses crypto for true randomness)
  entropy(bytes = 4) {
    const buffer = crypto.randomBytes(bytes);
    let value = 0;
    for (let i = 0; i < bytes; i++) {
      value = (value * 256 + buffer[i]) / 256;
    }
    return (value * 2 - 1) * 0.1;
  }
};

// ============================================================
//  PATTERN MUTATOR
// ============================================================

class PatternMutator {
  constructor(config = {}) {
    this.noiseType = config.noiseType || 'phi';
    this.intensity = config.intensity || 0.05;
    this.mutationRate = config.mutationRate || 0.3;
  }

  // Mutate a pattern with controlled noise
  mutate(pattern) {
    const mutated = JSON.parse(JSON.stringify(pattern)); // Deep clone
    const noise = NoiseGenerators[this.noiseType](this.intensity);

    // Mutate numeric values
    this.walkAndMutate(mutated, noise);

    // Track mutation
    mutated._mutationId = `mut_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    mutated._noiseApplied = noise;
    mutated._originalId = pattern.id || pattern.name || 'unknown';

    return mutated;
  }

  // Walk object and mutate numeric values
  walkAndMutate(obj, noise) {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('_')) continue; // Skip metadata

      const value = obj[key];

      if (typeof value === 'number' && Math.random() < this.mutationRate) {
        // Apply noise to numeric values
        obj[key] = value * (1 + noise);
      } else if (typeof value === 'object' && value !== null) {
        this.walkAndMutate(value, noise * 0.8); // Decrease noise depth
      }
    }
  }

  // Create multiple variants
  createVariants(pattern, count = 5) {
    const variants = [];
    for (let i = 0; i < count; i++) {
      // Vary intensity for diversity
      const originalIntensity = this.intensity;
      this.intensity = this.intensity * (0.5 + Math.random());
      variants.push(this.mutate(pattern));
      this.intensity = originalIntensity;
    }
    return variants;
  }
}

// ============================================================
//  ERROR DELTA CALCULATOR
// ============================================================

class ErrorDeltaCalculator {
  constructor() {
    this.history = [];
  }

  // Calculate delta between original and mutated pattern performance
  calculate(original, mutated, evaluator) {
    const originalScore = evaluator(original);
    const mutatedScore = evaluator(mutated);

    const delta = {
      original: originalScore,
      mutated: mutatedScore,
      improvement: mutatedScore - originalScore,
      ratio: mutatedScore / Math.max(originalScore, 0.001),
      noiseApplied: mutated._noiseApplied || 0,
      timestamp: Date.now()
    };

    this.history.push(delta);

    // Keep history bounded
    if (this.history.length > 10000) {
      this.history = this.history.slice(-5000);
    }

    return delta;
  }

  // Get successful mutations (improvements)
  getSuccessful(threshold = 0) {
    return this.history.filter(d => d.improvement > threshold);
  }

  // Get average improvement
  getAverageImprovement() {
    if (this.history.length === 0) return 0;
    return this.history.reduce((sum, d) => sum + d.improvement, 0) / this.history.length;
  }

  // Find optimal noise level
  findOptimalNoise() {
    const successful = this.getSuccessful();
    if (successful.length === 0) return 0.05;

    // Average noise of successful mutations
    return successful.reduce((sum, d) => sum + Math.abs(d.noiseApplied), 0) / successful.length;
  }
}

// ============================================================
//  BRANCH REINFORCER
// ============================================================

class BranchReinforcer {
  constructor(holoMemory) {
    this.holoMemory = holoMemory;
    this.branches = new Map(); // Track pattern branches
    this.attractorBasin = new Map(); // Successful pattern clusters
  }

  // Record a successful branch
  reinforce(pattern, delta) {
    const branchId = pattern._originalId || pattern.id || pattern.name;

    if (!this.branches.has(branchId)) {
      this.branches.set(branchId, {
        original: branchId,
        successCount: 0,
        totalImprovement: 0,
        bestVariant: null,
        bestScore: 0,
        variants: []
      });
    }

    const branch = this.branches.get(branchId);
    branch.successCount++;
    branch.totalImprovement += delta.improvement;

    if (delta.mutated > branch.bestScore) {
      branch.bestScore = delta.mutated;
      branch.bestVariant = pattern;
    }

    branch.variants.push({
      noise: delta.noiseApplied,
      improvement: delta.improvement,
      timestamp: delta.timestamp
    });

    // Limit variants history
    if (branch.variants.length > 100) {
      branch.variants = branch.variants.slice(-50);
    }

    // Add to attractor basin if consistently successful
    if (branch.successCount >= 3 && branch.totalImprovement > 0) {
      this.attractorBasin.set(branchId, branch);

      // Compress into holo-memory
      if (this.holoMemory && branch.bestVariant) {
        this.holoMemory.store(
          `attractor_${branchId}`,
          branch.bestVariant,
          {
            type: 'attractor',
            successCount: branch.successCount,
            avgImprovement: branch.totalImprovement / branch.successCount
          }
        );
      }
    }
  }

  // Get dominant branches
  getDominantBranches(limit = 10) {
    return Array.from(this.branches.values())
      .sort((a, b) => b.totalImprovement - a.totalImprovement)
      .slice(0, limit);
  }

  // Get attractor patterns
  getAttractors() {
    return Array.from(this.attractorBasin.values());
  }
}

// ============================================================
//  NOISE SAMPLER (Main Class)
// ============================================================

class NoiseSampler extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      variantCount: config.variantCount || 5,
      noiseType: config.noiseType || 'phi',
      intensity: config.intensity || 0.05,
      mutationRate: config.mutationRate || 0.3,
      reinforceThreshold: config.reinforceThreshold || 0.01,
      ...config
    };

    this.mutator = new PatternMutator(this.config);
    this.deltaCalculator = new ErrorDeltaCalculator();
    this.reinforcer = null; // Set when holoMemory is provided

    this.stats = {
      samplesProcessed: 0,
      successfulMutations: 0,
      totalImprovement: 0,
      attractorsFormed: 0
    };
  }

  // Connect to holo-memory
  connectHoloMemory(holoMemory) {
    this.reinforcer = new BranchReinforcer(holoMemory);
    return this;
  }

  // ============================================================
  //  MAIN SAMPLING LOOP
  // ============================================================

  // Sample a pattern with noise injection
  sample(pattern, evaluator) {
    this.stats.samplesProcessed++;

    // Create variants
    const variants = this.mutator.createVariants(pattern, this.config.variantCount);

    // Evaluate each variant
    const results = variants.map(variant => {
      const delta = this.deltaCalculator.calculate(pattern, variant, evaluator);
      return { variant, delta };
    });

    // Find best variant
    const best = results.reduce((a, b) =>
      b.delta.improvement > a.delta.improvement ? b : a
    );

    // Reinforce if improvement exceeds threshold
    if (best.delta.improvement > this.config.reinforceThreshold) {
      this.stats.successfulMutations++;
      this.stats.totalImprovement += best.delta.improvement;

      if (this.reinforcer) {
        this.reinforcer.reinforce(best.variant, best.delta);
        this.stats.attractorsFormed = this.reinforcer.attractorBasin.size;
      }

      this.emit('mutation:success', {
        original: pattern,
        variant: best.variant,
        improvement: best.delta.improvement
      });

      return {
        success: true,
        pattern: best.variant,
        improvement: best.delta.improvement,
        allResults: results
      };
    }

    // No improvement - return original
    return {
      success: false,
      pattern,
      improvement: 0,
      allResults: results
    };
  }

  // ============================================================
  //  BATCH SAMPLING
  // ============================================================

  // Process multiple patterns
  sampleBatch(patterns, evaluator) {
    const results = {
      improved: [],
      unchanged: [],
      totalImprovement: 0
    };

    for (const pattern of patterns) {
      const result = this.sample(pattern, evaluator);

      if (result.success) {
        results.improved.push(result);
        results.totalImprovement += result.improvement;
      } else {
        results.unchanged.push(result);
      }
    }

    this.emit('batch:complete', {
      processed: patterns.length,
      improved: results.improved.length,
      totalImprovement: results.totalImprovement
    });

    return results;
  }

  // ============================================================
  //  ADAPTIVE NOISE
  // ============================================================

  // Auto-tune noise based on success history
  adaptNoise() {
    const optimal = this.deltaCalculator.findOptimalNoise();
    this.mutator.intensity = optimal;
    this.config.intensity = optimal;

    this.emit('noise:adapted', { newIntensity: optimal });
    return optimal;
  }

  // ============================================================
  //  STATS & EXPORT
  // ============================================================

  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.samplesProcessed > 0 ?
        this.stats.successfulMutations / this.stats.samplesProcessed : 0,
      avgImprovement: this.stats.successfulMutations > 0 ?
        this.stats.totalImprovement / this.stats.successfulMutations : 0,
      currentIntensity: this.config.intensity,
      dominantBranches: this.reinforcer ? this.reinforcer.getDominantBranches(5) : []
    };
  }

  // Export attractors for training data
  exportAttractors() {
    if (!this.reinforcer) return [];

    return this.reinforcer.getAttractors().map(branch => ({
      id: branch.original,
      pattern: branch.bestVariant,
      score: branch.bestScore,
      successCount: branch.successCount,
      avgImprovement: branch.totalImprovement / branch.successCount
    }));
  }
}

// ============================================================
//  EXPORTS
// ============================================================

module.exports = {
  NoiseSampler,
  PatternMutator,
  ErrorDeltaCalculator,
  BranchReinforcer,
  NoiseGenerators
};
