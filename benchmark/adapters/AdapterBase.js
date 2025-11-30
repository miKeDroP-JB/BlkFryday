// ============================================================
//  BENCHMARK ADAPTER BASE
//  Abstract interface for all test adapters
// ============================================================

class AdapterBase {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.initialized = false;
    this.stats = {
      calls: 0,
      totalTokens: 0,
      totalLatency: 0,
      errors: 0
    };
  }

  /**
   * Initialize the adapter (connect to API, warm up, etc.)
   */
  async initialize() {
    this.initialized = true;
    return true;
  }

  /**
   * Warm up the adapter before benchmarking
   */
  async warmup() {
    // Override in subclass
    return true;
  }

  /**
   * Call the underlying system
   * @param {string} prompt - The input prompt
   * @param {object} options - Additional options (timeout, etc.)
   * @returns {object} Standardized response: { text, tokens, cost, latency_ms, metadata }
   */
  async call(prompt, options = {}) {
    throw new Error('call() must be implemented by subclass');
  }

  /**
   * Get adapter statistics
   */
  getStats() {
    return {
      ...this.stats,
      avgLatency: this.stats.calls > 0 ? this.stats.totalLatency / this.stats.calls : 0,
      avgTokens: this.stats.calls > 0 ? this.stats.totalTokens / this.stats.calls : 0,
      errorRate: this.stats.calls > 0 ? this.stats.errors / this.stats.calls : 0
    };
  }

  /**
   * Record a call for statistics
   */
  recordCall(response) {
    this.stats.calls++;
    this.stats.totalTokens += response.tokens || 0;
    this.stats.totalLatency += response.latency_ms || 0;
    if (response.error) {
      this.stats.errors++;
    }
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      calls: 0,
      totalTokens: 0,
      totalLatency: 0,
      errors: 0
    };
  }
}

module.exports = { AdapterBase };
