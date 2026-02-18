// ============================================================
//  BENCHMARK SCORING ENGINE
//  Statistical analysis and scoring for benchmark results
// ============================================================

const crypto = require('crypto');

// ============================================================
//  SEMANTIC SIMILARITY (Simple implementation)
// ============================================================

class SemanticSimilarity {
  constructor() {
    // Simple word-based similarity (in production, use sentence transformers)
    this.stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);
  }

  /**
   * Calculate similarity between two texts
   * @returns {number} Score between 0 and 1
   */
  calculate(text1, text2) {
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);

    if (words1.length === 0 || words2.length === 0) return 0;

    // Jaccard similarity
    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word));
  }

  /**
   * Calculate cosine similarity using TF-IDF-like weighting
   */
  cosineSimilarity(text1, text2) {
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);

    // Build vocabulary
    const vocab = new Set([...words1, ...words2]);
    if (vocab.size === 0) return 0;

    // Build frequency vectors
    const vec1 = this.buildVector(words1, vocab);
    const vec2 = this.buildVector(words2, vocab);

    // Calculate cosine similarity
    const dot = this.dotProduct(vec1, vec2);
    const mag1 = Math.sqrt(this.dotProduct(vec1, vec1));
    const mag2 = Math.sqrt(this.dotProduct(vec2, vec2));

    if (mag1 === 0 || mag2 === 0) return 0;
    return dot / (mag1 * mag2);
  }

  buildVector(words, vocab) {
    const freq = {};
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }
    return Array.from(vocab).map(word => freq[word] || 0);
  }

  dotProduct(vec1, vec2) {
    return vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  }
}

// ============================================================
//  STATISTICAL FUNCTIONS
// ============================================================

class Statistics {
  /**
   * Calculate mean
   */
  static mean(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate median
   */
  static median(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculate standard deviation
   */
  static std(values) {
    if (values.length === 0) return 0;
    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  /**
   * Calculate percentile
   */
  static percentile(values, p) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Calculate 95% confidence interval
   */
  static confidenceInterval(values, confidence = 0.95) {
    const n = values.length;
    if (n === 0) return { lower: 0, upper: 0 };

    const mean = this.mean(values);
    const std = this.std(values);
    const se = std / Math.sqrt(n);

    // Z-score for 95% CI
    const z = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.576 : 1.645;
    const margin = z * se;

    return {
      mean,
      lower: mean - margin,
      upper: mean + margin,
      margin
    };
  }

  /**
   * Cohen's d effect size
   */
  static cohensD(group1, group2) {
    const mean1 = this.mean(group1);
    const mean2 = this.mean(group2);
    const pooledStd = Math.sqrt(
      (Math.pow(this.std(group1), 2) + Math.pow(this.std(group2), 2)) / 2
    );
    if (pooledStd === 0) return 0;
    return (mean1 - mean2) / pooledStd;
  }

  /**
   * Interpret effect size
   */
  static interpretEffectSize(d) {
    const absD = Math.abs(d);
    if (absD < 0.2) return 'negligible';
    if (absD < 0.5) return 'small';
    if (absD < 0.8) return 'medium';
    return 'large';
  }

  /**
   * Bootstrap confidence interval
   */
  static bootstrap(values, statFn, iterations = 1000, confidence = 0.95) {
    const bootstrapStats = [];
    const n = values.length;

    for (let i = 0; i < iterations; i++) {
      const sample = [];
      for (let j = 0; j < n; j++) {
        sample.push(values[Math.floor(Math.random() * n)]);
      }
      bootstrapStats.push(statFn(sample));
    }

    bootstrapStats.sort((a, b) => a - b);
    const alpha = (1 - confidence) / 2;
    const lowerIndex = Math.floor(alpha * iterations);
    const upperIndex = Math.floor((1 - alpha) * iterations);

    return {
      estimate: statFn(values),
      lower: bootstrapStats[lowerIndex],
      upper: bootstrapStats[upperIndex],
      bootstrapStd: this.std(bootstrapStats)
    };
  }
}

// ============================================================
//  COMPOSITE SCORER
// ============================================================

class CompositeScorer {
  constructor(weights = {}) {
    this.weights = {
      compression: 0.20,
      generalization: 0.25,
      recursiveImprovement: 0.15,
      toolUseCoordination: 0.20,
      hallucinationSafety: 0.10,
      latencyCost: 0.10,
      ...weights
    };
    this.similarity = new SemanticSimilarity();
  }

  /**
   * Calculate AGI Adjacency Score (0-100)
   */
  calculateAGIScore(categoryScores) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [category, weight] of Object.entries(this.weights)) {
      if (categoryScores[category] != null) {
        totalScore += categoryScores[category] * weight * 100;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Score a response against gold standard
   */
  scoreResponse(response, gold, criteria = {}) {
    const scores = {};

    // Semantic similarity
    if (gold.text) {
      scores.semanticSimilarity = this.similarity.cosineSimilarity(
        response.text || '',
        gold.text
      );
    }

    // Length appropriateness
    if (gold.minLength || gold.maxLength) {
      const len = (response.text || '').length;
      const minOk = !gold.minLength || len >= gold.minLength;
      const maxOk = !gold.maxLength || len <= gold.maxLength;
      scores.lengthAppropriate = minOk && maxOk ? 1 : 0;
    }

    // Required keywords
    if (gold.requiredKeywords) {
      const text = (response.text || '').toLowerCase();
      const found = gold.requiredKeywords.filter(kw =>
        text.includes(kw.toLowerCase())
      );
      scores.keywordCoverage = found.length / gold.requiredKeywords.length;
    }

    // Latency score (inversely proportional)
    if (criteria.maxLatency) {
      scores.latency = Math.max(0, 1 - (response.latency_ms / criteria.maxLatency));
    }

    // Cost efficiency
    if (criteria.maxCost && response.cost != null) {
      scores.costEfficiency = Math.max(0, 1 - (response.cost / criteria.maxCost));
    }

    // Calculate composite
    const validScores = Object.values(scores).filter(s => s != null);
    scores.composite = validScores.length > 0
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length
      : 0;

    return scores;
  }

  /**
   * Compare two systems
   */
  compareResults(results1, results2) {
    const comparison = {
      system1: { scores: [], wins: 0 },
      system2: { scores: [], wins: 0 },
      ties: 0,
      tests: []
    };

    // Assuming results are arrays of test results
    for (let i = 0; i < Math.min(results1.length, results2.length); i++) {
      const score1 = results1[i].score || 0;
      const score2 = results2[i].score || 0;

      comparison.system1.scores.push(score1);
      comparison.system2.scores.push(score2);

      if (score1 > score2) {
        comparison.system1.wins++;
      } else if (score2 > score1) {
        comparison.system2.wins++;
      } else {
        comparison.ties++;
      }

      comparison.tests.push({
        test: results1[i].testId || i,
        score1,
        score2,
        winner: score1 > score2 ? 'system1' : score2 > score1 ? 'system2' : 'tie',
        difference: score1 - score2
      });
    }

    // Statistical comparison
    comparison.effectSize = Statistics.cohensD(
      comparison.system1.scores,
      comparison.system2.scores
    );
    comparison.effectInterpretation = Statistics.interpretEffectSize(comparison.effectSize);

    comparison.system1.mean = Statistics.mean(comparison.system1.scores);
    comparison.system1.ci = Statistics.confidenceInterval(comparison.system1.scores);
    comparison.system2.mean = Statistics.mean(comparison.system2.scores);
    comparison.system2.ci = Statistics.confidenceInterval(comparison.system2.scores);

    // Determine overall winner
    if (comparison.system1.wins > comparison.system2.wins) {
      comparison.overallWinner = 'system1';
    } else if (comparison.system2.wins > comparison.system1.wins) {
      comparison.overallWinner = 'system2';
    } else {
      comparison.overallWinner = 'tie';
    }

    return comparison;
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = {
  SemanticSimilarity,
  Statistics,
  CompositeScorer
};
