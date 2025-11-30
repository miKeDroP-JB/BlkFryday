// ============================================================
//  ORBOS V11.5 - SCORING ALGORITHMS
//  Net Positive Calculations & System Importance Ranking
// ============================================================
//
//  Core Principle: Every change MUST have NET POSITIVE impact
//  Formula: NetPositive = (Gains - Costs) * Reliability * Importance
//
// ============================================================

class ScoringAlgorithms {
  constructor(config = {}) {
    this.config = config;

    // Weight configurations
    this.weights = {
      gains: {
        performance: 0.30,
        efficiency: 0.25,
        quality: 0.20,
        scalability: 0.15,
        maintainability: 0.10
      },
      costs: {
        resources: 0.35,
        complexity: 0.30,
        risk: 0.25,
        time: 0.10
      },
      importance: {
        security: 1.0,
        dataIntegrity: 0.95,
        availability: 0.90,
        performance: 0.85,
        userExperience: 0.80,
        automation: 0.75,
        analytics: 0.60,
        logging: 0.50
      }
    };

    // Thresholds
    this.thresholds = {
      minNetPositive: 0.1,      // Minimum net positive to proceed
      minReliability: 0.85,     // Minimum reliability required
      maxRisk: 0.3,             // Maximum acceptable risk
      minImprovementGain: 0.05  // Minimum improvement to be worthwhile
    };
  }

  // ============================================================
  //  NET POSITIVE SCORE
  // ============================================================

  calculateNetPositive(metrics) {
    const {
      performanceGain = 0,
      efficiencyGain = 0,
      qualityGain = 0,
      scalabilityGain = 0,
      maintainabilityGain = 0,
      resourceCost = 0,
      complexityCost = 0,
      riskCost = 0,
      timeCost = 0,
      reliability = 1,
      importance = 1
    } = metrics;

    // Calculate weighted gains
    const gains =
      performanceGain * this.weights.gains.performance +
      efficiencyGain * this.weights.gains.efficiency +
      qualityGain * this.weights.gains.quality +
      scalabilityGain * this.weights.gains.scalability +
      maintainabilityGain * this.weights.gains.maintainability;

    // Calculate weighted costs
    const costs =
      resourceCost * this.weights.costs.resources +
      complexityCost * this.weights.costs.complexity +
      riskCost * this.weights.costs.risk +
      timeCost * this.weights.costs.time;

    // Net positive formula
    const netPositive = (gains - costs) * reliability * importance;

    return {
      netPositive,
      gains,
      costs,
      reliability,
      importance,
      isPositive: netPositive > this.thresholds.minNetPositive,
      breakdown: {
        gains: {
          performance: performanceGain * this.weights.gains.performance,
          efficiency: efficiencyGain * this.weights.gains.efficiency,
          quality: qualityGain * this.weights.gains.quality,
          scalability: scalabilityGain * this.weights.gains.scalability,
          maintainability: maintainabilityGain * this.weights.gains.maintainability
        },
        costs: {
          resources: resourceCost * this.weights.costs.resources,
          complexity: complexityCost * this.weights.costs.complexity,
          risk: riskCost * this.weights.costs.risk,
          time: timeCost * this.weights.costs.time
        }
      }
    };
  }

  // ============================================================
  //  SYSTEM HEALTH SCORE
  // ============================================================

  calculateSystemHealth(subsystems) {
    if (!subsystems || Object.keys(subsystems).length === 0) {
      return { health: 0, details: {} };
    }

    let totalWeight = 0;
    let weightedSum = 0;
    const details = {};

    for (const [name, data] of Object.entries(subsystems)) {
      const importance = this.getSystemImportance(name);
      const weight = importance;

      totalWeight += weight;
      weightedSum += (data.health || 0) * weight;

      details[name] = {
        health: data.health || 0,
        importance,
        contribution: (data.health || 0) * weight
      };
    }

    const health = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      health,
      totalWeight,
      details,
      grade: this.healthToGrade(health)
    };
  }

  getSystemImportance(systemName) {
    const nameLower = systemName.toLowerCase();

    for (const [key, value] of Object.entries(this.weights.importance)) {
      if (nameLower.includes(key.toLowerCase())) {
        return value;
      }
    }

    return 0.5; // Default importance
  }

  healthToGrade(health) {
    if (health >= 0.95) return 'A+';
    if (health >= 0.90) return 'A';
    if (health >= 0.85) return 'B+';
    if (health >= 0.80) return 'B';
    if (health >= 0.75) return 'C+';
    if (health >= 0.70) return 'C';
    if (health >= 0.60) return 'D';
    return 'F';
  }

  // ============================================================
  //  IMPROVEMENT POTENTIAL
  // ============================================================

  calculateImprovementPotential(current, target, feasibility = 1) {
    const gap = target - current;
    const potential = gap * feasibility;

    return {
      current,
      target,
      gap,
      feasibility,
      potential,
      worthwhile: potential > this.thresholds.minImprovementGain,
      estimatedEffort: this.estimateEffort(gap, feasibility),
      roi: potential / this.estimateEffort(gap, feasibility)
    };
  }

  estimateEffort(gap, feasibility) {
    // Base effort increases with gap, decreases with feasibility
    const baseEffort = gap * 10; // 10 units per 0.1 gap
    return baseEffort / feasibility;
  }

  // ============================================================
  //  REPLICATION SCORE
  // ============================================================

  calculateReplicationScore(pattern) {
    const {
      successRate = 0,
      impact = 0,
      scalability = 0,
      complexity = 0,
      applicability = 0
    } = pattern;

    // Replication score factors
    const successWeight = 0.35;
    const impactWeight = 0.30;
    const scalabilityWeight = 0.20;
    const applicabilityWeight = 0.15;

    // Complexity penalty
    const complexityPenalty = complexity * 0.2;

    const score =
      successRate * successWeight +
      impact * impactWeight +
      scalability * scalabilityWeight +
      applicability * applicabilityWeight -
      complexityPenalty;

    return {
      score,
      shouldReplicate: score > 0.5,
      factors: {
        success: successRate * successWeight,
        impact: impact * impactWeight,
        scalability: scalability * scalabilityWeight,
        applicability: applicability * applicabilityWeight,
        complexityPenalty
      }
    };
  }

  // ============================================================
  //  PRIORITY RANKING
  // ============================================================

  rankByPriority(items, getMetrics) {
    const scored = items.map((item, index) => {
      const metrics = getMetrics(item);
      const netPositive = this.calculateNetPositive(metrics);

      return {
        item,
        originalIndex: index,
        netPositive: netPositive.netPositive,
        importance: metrics.importance || 0.5,
        urgency: metrics.urgency || 0.5,
        priorityScore: this.calculatePriorityScore(netPositive.netPositive, metrics)
      };
    });

    // Sort by priority score (highest first)
    scored.sort((a, b) => b.priorityScore - a.priorityScore);

    return scored;
  }

  calculatePriorityScore(netPositive, metrics) {
    const {
      importance = 0.5,
      urgency = 0.5,
      dependency = 0,
      risk = 0
    } = metrics;

    // Priority = NetPositive * Importance * Urgency * (1 - Risk) + Dependencies
    return netPositive * importance * urgency * (1 - risk) + dependency * 0.2;
  }

  // ============================================================
  //  COMPARISON ALGORITHMS
  // ============================================================

  compareOptions(options) {
    const scores = options.map((option, index) => {
      const netPositive = this.calculateNetPositive(option.metrics);

      return {
        option,
        index,
        netPositive: netPositive.netPositive,
        isPositive: netPositive.isPositive,
        breakdown: netPositive.breakdown
      };
    });

    // Sort by net positive (highest first)
    scores.sort((a, b) => b.netPositive - a.netPositive);

    const best = scores[0];
    const worst = scores[scores.length - 1];

    return {
      ranking: scores,
      best: best?.option,
      bestScore: best?.netPositive,
      worst: worst?.option,
      worstScore: worst?.netPositive,
      allPositive: scores.every(s => s.isPositive),
      recommendation: this.generateRecommendation(scores)
    };
  }

  generateRecommendation(scores) {
    const positive = scores.filter(s => s.isPositive);
    const negative = scores.filter(s => !s.isPositive);

    if (positive.length === 0) {
      return {
        action: 'REJECT_ALL',
        reason: 'No options have positive net impact',
        alternative: 'Consider custom build or redesign'
      };
    }

    if (positive.length === 1) {
      return {
        action: 'SELECT',
        selected: positive[0].option,
        reason: 'Only option with positive net impact'
      };
    }

    const best = positive[0];
    const secondBest = positive[1];
    const margin = best.netPositive - secondBest.netPositive;

    if (margin > 0.2) {
      return {
        action: 'SELECT',
        selected: best.option,
        reason: `Clear winner with ${(margin * 100).toFixed(1)}% margin`
      };
    }

    return {
      action: 'EVALUATE_FURTHER',
      candidates: [best.option, secondBest.option],
      reason: 'Close scores - consider additional factors'
    };
  }

  // ============================================================
  //  THRESHOLD CHECKS
  // ============================================================

  meetsThresholds(metrics) {
    const netPositive = this.calculateNetPositive(metrics);

    const checks = {
      netPositive: netPositive.netPositive >= this.thresholds.minNetPositive,
      reliability: (metrics.reliability || 1) >= this.thresholds.minReliability,
      risk: (metrics.riskCost || 0) <= this.thresholds.maxRisk
    };

    return {
      passed: Object.values(checks).every(Boolean),
      checks,
      netPositiveScore: netPositive.netPositive,
      failures: Object.entries(checks)
        .filter(([_, passed]) => !passed)
        .map(([name]) => name)
    };
  }

  // ============================================================
  //  TREND ANALYSIS
  // ============================================================

  analyzeTrend(history) {
    if (!history || history.length < 2) {
      return { trend: 'insufficient_data', slope: 0 };
    }

    // Simple linear regression
    const n = history.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    history.forEach((point, i) => {
      sumX += i;
      sumY += point.value;
      sumXY += i * point.value;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgValue = sumY / n;

    let trend;
    if (slope > 0.01) trend = 'improving';
    else if (slope < -0.01) trend = 'declining';
    else trend = 'stable';

    return {
      trend,
      slope,
      averageValue: avgValue,
      latestValue: history[history.length - 1].value,
      changePercent: history.length > 1
        ? ((history[history.length - 1].value - history[0].value) / history[0].value) * 100
        : 0,
      prediction: {
        nextValue: avgValue + slope * n,
        confidence: Math.max(0, 1 - Math.abs(slope) * 10)
      }
    };
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { ScoringAlgorithms };
