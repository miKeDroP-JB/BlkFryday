/**
 * MODEL HEALTH MONITOR
 * Real-time tracking of AI provider performance and reliability
 *
 * "Know thy models - route around problems before they happen" - Health Philosophy
 *
 * Features:
 * - Real-time latency tracking per model
 * - Error rate monitoring
 * - Automatic circuit breaker
 * - Provider failover recommendations
 * - Performance trending
 */

// Health status levels
const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  DOWN: 'down',
  UNKNOWN: 'unknown'
};

// Circuit breaker states
const CIRCUIT_STATE = {
  CLOSED: 'closed',     // Normal operation
  OPEN: 'open',         // Failing, don't use
  HALF_OPEN: 'half_open' // Testing if recovered
};

// Default thresholds
const DEFAULT_THRESHOLDS = {
  latency: {
    good: 1000,      // ms
    degraded: 3000,
    unhealthy: 8000
  },
  errorRate: {
    good: 0.01,      // 1%
    degraded: 0.05,  // 5%
    unhealthy: 0.15  // 15%
  },
  circuitBreaker: {
    failureThreshold: 5,     // failures before opening
    recoveryTimeout: 30000,  // ms before trying again
    successThreshold: 3      // successes to close
  }
};

/**
 * Model Metrics
 * Tracks metrics for a single model
 */
class ModelMetrics {
  constructor(provider, model) {
    this.provider = provider;
    this.model = model;
    this.windowSize = 100; // Keep last 100 requests
    this.requests = [];
    this.totals = {
      requests: 0,
      successes: 0,
      failures: 0,
      totalLatency: 0
    };
    this.createdAt = Date.now();
    this.lastUpdatedAt = Date.now();
  }

  /**
   * Record a request result
   */
  record(result) {
    const entry = {
      timestamp: Date.now(),
      success: result.success,
      latency: result.latency || 0,
      errorType: result.error?.type || null,
      tokens: result.tokens || 0
    };

    this.requests.push(entry);

    // Update totals
    this.totals.requests++;
    if (result.success) {
      this.totals.successes++;
    } else {
      this.totals.failures++;
    }
    this.totals.totalLatency += entry.latency;
    this.lastUpdatedAt = Date.now();

    // Keep window bounded
    if (this.requests.length > this.windowSize) {
      this.requests.shift();
    }
  }

  /**
   * Get recent metrics (last N requests)
   */
  getRecent(count = 50) {
    const recent = this.requests.slice(-count);
    if (recent.length === 0) return null;

    const successes = recent.filter(r => r.success).length;
    const failures = recent.length - successes;
    const avgLatency = recent.reduce((sum, r) => sum + r.latency, 0) / recent.length;

    // Percentiles for latency
    const latencies = recent.map(r => r.latency).sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    return {
      count: recent.length,
      successes,
      failures,
      errorRate: failures / recent.length,
      avgLatency: Math.round(avgLatency),
      p50Latency: Math.round(p50),
      p95Latency: Math.round(p95),
      p99Latency: Math.round(p99),
      windowStart: recent[0].timestamp,
      windowEnd: recent[recent.length - 1].timestamp
    };
  }

  /**
   * Get all-time metrics
   */
  getAllTime() {
    return {
      totalRequests: this.totals.requests,
      successes: this.totals.successes,
      failures: this.totals.failures,
      errorRate: this.totals.requests > 0
        ? this.totals.failures / this.totals.requests
        : 0,
      avgLatency: this.totals.requests > 0
        ? Math.round(this.totals.totalLatency / this.totals.requests)
        : 0,
      uptime: Date.now() - this.createdAt
    };
  }

  /**
   * Get trend (improving, stable, degrading)
   */
  getTrend() {
    if (this.requests.length < 20) return 'insufficient_data';

    const firstHalf = this.requests.slice(0, Math.floor(this.requests.length / 2));
    const secondHalf = this.requests.slice(Math.floor(this.requests.length / 2));

    const firstErrorRate = firstHalf.filter(r => !r.success).length / firstHalf.length;
    const secondErrorRate = secondHalf.filter(r => !r.success).length / secondHalf.length;

    const firstAvgLatency = firstHalf.reduce((s, r) => s + r.latency, 0) / firstHalf.length;
    const secondAvgLatency = secondHalf.reduce((s, r) => s + r.latency, 0) / secondHalf.length;

    // Determine trend
    if (secondErrorRate < firstErrorRate * 0.8 && secondAvgLatency < firstAvgLatency * 0.9) {
      return 'improving';
    }
    if (secondErrorRate > firstErrorRate * 1.5 || secondAvgLatency > firstAvgLatency * 1.5) {
      return 'degrading';
    }
    return 'stable';
  }
}

/**
 * Circuit Breaker
 * Prevents requests to failing models
 */
class CircuitBreaker {
  constructor(config = {}) {
    this.state = CIRCUIT_STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();

    this.config = {
      ...DEFAULT_THRESHOLDS.circuitBreaker,
      ...config
    };
  }

  /**
   * Check if requests should be allowed
   */
  canExecute() {
    if (this.state === CIRCUIT_STATE.CLOSED) {
      return true;
    }

    if (this.state === CIRCUIT_STATE.OPEN) {
      // Check if recovery timeout has passed
      if (Date.now() - this.lastFailureTime >= this.config.recoveryTimeout) {
        this.transition(CIRCUIT_STATE.HALF_OPEN);
        return true;
      }
      return false;
    }

    // HALF_OPEN - allow limited requests
    return true;
  }

  /**
   * Record success
   */
  recordSuccess() {
    this.failureCount = 0;

    if (this.state === CIRCUIT_STATE.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.transition(CIRCUIT_STATE.CLOSED);
      }
    }
  }

  /**
   * Record failure
   */
  recordFailure() {
    this.failureCount++;
    this.successCount = 0;
    this.lastFailureTime = Date.now();

    if (this.state === CIRCUIT_STATE.CLOSED) {
      if (this.failureCount >= this.config.failureThreshold) {
        this.transition(CIRCUIT_STATE.OPEN);
      }
    } else if (this.state === CIRCUIT_STATE.HALF_OPEN) {
      this.transition(CIRCUIT_STATE.OPEN);
    }
  }

  /**
   * Transition to new state
   */
  transition(newState) {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    this.successCount = 0;

    return { from: oldState, to: newState };
  }

  /**
   * Get breaker status
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailure: this.lastFailureTime,
      timeSinceLastChange: Date.now() - this.lastStateChange,
      canExecute: this.canExecute()
    };
  }

  /**
   * Force reset (manual intervention)
   */
  reset() {
    this.state = CIRCUIT_STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChange = Date.now();
  }
}

/**
 * Model Health Monitor
 * Central monitoring system for all models
 */
class ModelHealthMonitor {
  constructor(config = {}) {
    this.metrics = new Map(); // modelKey -> ModelMetrics
    this.circuitBreakers = new Map(); // modelKey -> CircuitBreaker
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...config.thresholds };
    this.alertCallbacks = [];
    this.healthCheckInterval = config.healthCheckInterval || 60000;
    this.healthCheckTimer = null;

    // Start periodic health checks
    this.startHealthChecks();
  }

  /**
   * Get model key
   */
  getModelKey(provider, model) {
    return `${provider}:${model}`;
  }

  /**
   * Ensure metrics exist for model
   */
  ensureMetrics(provider, model) {
    const key = this.getModelKey(provider, model);

    if (!this.metrics.has(key)) {
      this.metrics.set(key, new ModelMetrics(provider, model));
    }

    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(key, new CircuitBreaker());
    }

    return key;
  }

  /**
   * Record a request result
   */
  recordRequest(provider, model, result) {
    const key = this.ensureMetrics(provider, model);

    // Record in metrics
    this.metrics.get(key).record(result);

    // Update circuit breaker
    const breaker = this.circuitBreakers.get(key);
    if (result.success) {
      breaker.recordSuccess();
    } else {
      breaker.recordFailure();

      // Check for alerts
      this.checkAlerts(provider, model);
    }

    return this.getModelHealth(provider, model);
  }

  /**
   * Check if model is available
   */
  isAvailable(provider, model) {
    const key = this.getModelKey(provider, model);
    const breaker = this.circuitBreakers.get(key);

    if (!breaker) return true; // Unknown = available
    return breaker.canExecute();
  }

  /**
   * Get health status for model
   */
  getModelHealth(provider, model) {
    const key = this.getModelKey(provider, model);
    const metrics = this.metrics.get(key);
    const breaker = this.circuitBreakers.get(key);

    if (!metrics) {
      return { status: HEALTH_STATUS.UNKNOWN, provider, model };
    }

    const recent = metrics.getRecent();
    if (!recent) {
      return { status: HEALTH_STATUS.UNKNOWN, provider, model };
    }

    // Determine health status
    let status = HEALTH_STATUS.HEALTHY;

    // Check error rate
    if (recent.errorRate >= this.thresholds.errorRate.unhealthy) {
      status = HEALTH_STATUS.UNHEALTHY;
    } else if (recent.errorRate >= this.thresholds.errorRate.degraded) {
      status = HEALTH_STATUS.DEGRADED;
    }

    // Check latency (can upgrade status to worse, not better)
    if (recent.p95Latency >= this.thresholds.latency.unhealthy) {
      status = HEALTH_STATUS.UNHEALTHY;
    } else if (recent.p95Latency >= this.thresholds.latency.degraded &&
               status === HEALTH_STATUS.HEALTHY) {
      status = HEALTH_STATUS.DEGRADED;
    }

    // Check circuit breaker
    if (breaker && breaker.state === CIRCUIT_STATE.OPEN) {
      status = HEALTH_STATUS.DOWN;
    }

    return {
      status,
      provider,
      model,
      metrics: recent,
      circuitBreaker: breaker?.getStatus(),
      trend: metrics.getTrend(),
      lastUpdated: metrics.lastUpdatedAt
    };
  }

  /**
   * Get health for all models
   */
  getAllHealth() {
    const health = {};

    for (const [key, metrics] of this.metrics) {
      const [provider, model] = key.split(':');
      health[key] = this.getModelHealth(provider, model);
    }

    return health;
  }

  /**
   * Get healthy models (for routing)
   */
  getHealthyModels(minStatus = HEALTH_STATUS.DEGRADED) {
    const statusRank = {
      [HEALTH_STATUS.HEALTHY]: 4,
      [HEALTH_STATUS.DEGRADED]: 3,
      [HEALTH_STATUS.UNHEALTHY]: 2,
      [HEALTH_STATUS.DOWN]: 1,
      [HEALTH_STATUS.UNKNOWN]: 0
    };

    const minRank = statusRank[minStatus];
    const healthy = [];

    for (const [key, metrics] of this.metrics) {
      const [provider, model] = key.split(':');
      const health = this.getModelHealth(provider, model);

      if (statusRank[health.status] >= minRank && this.isAvailable(provider, model)) {
        healthy.push({
          provider,
          model,
          health: health.status,
          avgLatency: health.metrics?.avgLatency || 0,
          errorRate: health.metrics?.errorRate || 0
        });
      }
    }

    // Sort by health (best first), then by latency
    healthy.sort((a, b) => {
      const healthDiff = statusRank[b.health] - statusRank[a.health];
      if (healthDiff !== 0) return healthDiff;
      return a.avgLatency - b.avgLatency;
    });

    return healthy;
  }

  /**
   * Get failover recommendation
   */
  getFailoverRecommendation(provider, model) {
    const current = this.getModelHealth(provider, model);
    const healthyModels = this.getHealthyModels();

    // Filter out current model
    const alternatives = healthyModels.filter(
      m => !(m.provider === provider && m.model === model)
    );

    if (alternatives.length === 0) {
      return {
        recommended: null,
        reason: 'No healthy alternatives available'
      };
    }

    // Find best alternative
    const best = alternatives[0];

    return {
      recommended: best,
      reason: `${best.provider}/${best.model} is ${best.health} with ${Math.round(best.avgLatency)}ms avg latency`,
      alternatives: alternatives.slice(1, 4) // Next 3 options
    };
  }

  /**
   * Check and trigger alerts
   */
  checkAlerts(provider, model) {
    const health = this.getModelHealth(provider, model);

    if (health.status === HEALTH_STATUS.DOWN ||
        health.status === HEALTH_STATUS.UNHEALTHY) {
      const alert = {
        type: 'model_health',
        severity: health.status === HEALTH_STATUS.DOWN ? 'critical' : 'warning',
        provider,
        model,
        status: health.status,
        metrics: health.metrics,
        recommendation: this.getFailoverRecommendation(provider, model),
        timestamp: Date.now()
      };

      for (const callback of this.alertCallbacks) {
        try {
          callback(alert);
        } catch (e) {
          // Alert callback failed
        }
      }
    }
  }

  /**
   * Register alert callback
   */
  onAlert(callback) {
    this.alertCallbacks.push(callback);
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    if (this.healthCheckTimer) return;

    this.healthCheckTimer = setInterval(() => {
      for (const [key] of this.metrics) {
        const [provider, model] = key.split(':');
        this.checkAlerts(provider, model);
      }
    }, this.healthCheckInterval);
  }

  /**
   * Stop health checks
   */
  stopHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Force reset circuit breaker for model
   */
  resetCircuitBreaker(provider, model) {
    const key = this.getModelKey(provider, model);
    const breaker = this.circuitBreakers.get(key);
    if (breaker) {
      breaker.reset();
    }
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const allHealth = this.getAllHealth();
    const statusCounts = {
      [HEALTH_STATUS.HEALTHY]: 0,
      [HEALTH_STATUS.DEGRADED]: 0,
      [HEALTH_STATUS.UNHEALTHY]: 0,
      [HEALTH_STATUS.DOWN]: 0,
      [HEALTH_STATUS.UNKNOWN]: 0
    };

    let totalRequests = 0;
    let totalLatency = 0;
    let requestCount = 0;

    for (const health of Object.values(allHealth)) {
      statusCounts[health.status]++;
      if (health.metrics) {
        totalRequests += health.metrics.count;
        totalLatency += health.metrics.avgLatency * health.metrics.count;
        requestCount += health.metrics.count;
      }
    }

    return {
      modelCount: this.metrics.size,
      statusCounts,
      systemHealth: statusCounts[HEALTH_STATUS.DOWN] > 0
        ? HEALTH_STATUS.DOWN
        : statusCounts[HEALTH_STATUS.UNHEALTHY] > 0
          ? HEALTH_STATUS.UNHEALTHY
          : statusCounts[HEALTH_STATUS.DEGRADED] > 0
            ? HEALTH_STATUS.DEGRADED
            : HEALTH_STATUS.HEALTHY,
      avgLatency: requestCount > 0 ? Math.round(totalLatency / requestCount) : 0,
      totalRequests
    };
  }

  /**
   * Export metrics for persistence
   */
  exportMetrics() {
    const exported = {};

    for (const [key, metrics] of this.metrics) {
      exported[key] = {
        allTime: metrics.getAllTime(),
        recent: metrics.getRecent(),
        trend: metrics.getTrend()
      };
    }

    return exported;
  }
}

/**
 * Smart Router with Health Awareness
 * Routes requests based on model health
 */
class HealthAwareRouter {
  constructor(healthMonitor) {
    this.monitor = healthMonitor;
    this.preferences = new Map(); // task type -> preferred models
  }

  /**
   * Route request to best available model
   */
  route(options = {}) {
    const {
      preferredProvider = null,
      preferredModel = null,
      taskType = 'general',
      requireHealthy = false
    } = options;

    // Try preferred first if healthy
    if (preferredProvider && preferredModel) {
      if (this.monitor.isAvailable(preferredProvider, preferredModel)) {
        const health = this.monitor.getModelHealth(preferredProvider, preferredModel);
        if (!requireHealthy || health.status === HEALTH_STATUS.HEALTHY) {
          return {
            provider: preferredProvider,
            model: preferredModel,
            health: health.status,
            isPreferred: true
          };
        }
      }
    }

    // Get healthy alternatives
    const healthy = this.monitor.getHealthyModels(
      requireHealthy ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.DEGRADED
    );

    if (healthy.length === 0) {
      return {
        provider: null,
        model: null,
        health: HEALTH_STATUS.DOWN,
        error: 'No healthy models available'
      };
    }

    const selected = healthy[0];
    return {
      provider: selected.provider,
      model: selected.model,
      health: selected.health,
      isPreferred: false,
      isFallback: true
    };
  }

  /**
   * Set preference for task type
   */
  setPreference(taskType, provider, model) {
    this.preferences.set(taskType, { provider, model });
  }

  /**
   * Get routing stats
   */
  getStats() {
    return {
      preferences: Object.fromEntries(this.preferences),
      healthSummary: this.monitor.getSummary()
    };
  }
}

module.exports = {
  HEALTH_STATUS,
  CIRCUIT_STATE,
  DEFAULT_THRESHOLDS,
  ModelMetrics,
  CircuitBreaker,
  ModelHealthMonitor,
  HealthAwareRouter
};
