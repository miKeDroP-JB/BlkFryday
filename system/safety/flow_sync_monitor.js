/**
 * FlowSync Monitor - Real-time Flow State Monitoring
 * ═══════════════════════════════════════════════════════════════════
 * Monitors solver execution flow and enforces timing constraints.
 * Integrates with SafeJumpPolicy for coordinated safety control.
 */

const SafeJumpPolicy = require('../solver/config/safe_jump_policy');

class FlowSyncMonitor {
  constructor(options = {}) {
    this.options = {
      enabled: SafeJumpPolicy.ENABLE_FLOW_SYNC_MONITOR,
      thresholdMs: SafeJumpPolicy.FLOW_SYNC_THRESHOLD_MS,
      maxConcurrent: options.maxConcurrent || 3,
      checkIntervalMs: options.checkIntervalMs || 50,
      ...options
    };

    this.flows = new Map();
    this.activeCount = 0;
    this.stats = {
      totalFlows: 0,
      completedFlows: 0,
      timedOutFlows: 0,
      blockedFlows: 0,
      avgDurationMs: 0
    };

    this.listeners = new Map();
  }

  /**
   * Start tracking a new flow
   * @param {string} flowId - Unique flow identifier
   * @param {Object} metadata - Flow metadata
   * @returns {Object} Flow handle with gate() and complete() methods
   */
  startFlow(flowId, metadata = {}) {
    if (!this.options.enabled) {
      return this.createPassthroughHandle(flowId);
    }

    // Check concurrent limit
    if (this.activeCount >= this.options.maxConcurrent) {
      this.stats.blockedFlows++;
      this.emit('flow_blocked', { flowId, reason: 'max_concurrent' });
      return { allowed: false, reason: 'max_concurrent_flows' };
    }

    const flow = {
      id: flowId,
      startTime: Date.now(),
      metadata,
      checkpoints: [],
      status: 'active'
    };

    this.flows.set(flowId, flow);
    this.activeCount++;
    this.stats.totalFlows++;

    this.emit('flow_started', { flowId, metadata });

    return {
      allowed: true,
      flowId,
      gate: (checkpointName) => this.gate(flowId, checkpointName),
      complete: (result) => this.completeFlow(flowId, result),
      abort: (reason) => this.abortFlow(flowId, reason)
    };
  }

  /**
   * Gate check - verify flow is still within timing bounds
   * @param {string} flowId - Flow to check
   * @param {string} checkpointName - Checkpoint identifier
   * @returns {Object} Gate result with timing info
   */
  gate(flowId, checkpointName = 'checkpoint') {
    if (!this.options.enabled) {
      return { allowed: true };
    }

    const flow = this.flows.get(flowId);
    if (!flow) {
      return { allowed: false, reason: 'flow_not_found' };
    }

    const elapsed = Date.now() - flow.startTime;
    const checkpoint = {
      name: checkpointName,
      time: Date.now(),
      elapsed
    };
    flow.checkpoints.push(checkpoint);

    // Check timing threshold
    if (elapsed > this.options.thresholdMs) {
      this.stats.timedOutFlows++;
      flow.status = 'timeout';
      this.emit('flow_timeout', { flowId, elapsed, threshold: this.options.thresholdMs });

      return {
        allowed: false,
        reason: 'timeout',
        elapsed,
        threshold: this.options.thresholdMs
      };
    }

    return {
      allowed: true,
      elapsed,
      remaining: this.options.thresholdMs - elapsed,
      checkpoints: flow.checkpoints.length
    };
  }

  /**
   * Mark flow as complete
   */
  completeFlow(flowId, result = {}) {
    const flow = this.flows.get(flowId);
    if (!flow) return;

    flow.status = 'completed';
    flow.endTime = Date.now();
    flow.duration = flow.endTime - flow.startTime;
    flow.result = result;

    this.activeCount--;
    this.stats.completedFlows++;

    // Update average duration
    const totalDuration = this.stats.avgDurationMs * (this.stats.completedFlows - 1) + flow.duration;
    this.stats.avgDurationMs = totalDuration / this.stats.completedFlows;

    this.emit('flow_completed', { flowId, duration: flow.duration, result });

    // Clean up old flows
    this.cleanup();
  }

  /**
   * Abort a flow
   */
  abortFlow(flowId, reason = 'aborted') {
    const flow = this.flows.get(flowId);
    if (!flow) return;

    flow.status = 'aborted';
    flow.endTime = Date.now();
    flow.abortReason = reason;

    this.activeCount--;
    this.emit('flow_aborted', { flowId, reason });

    this.cleanup();
  }

  /**
   * Create passthrough handle when monitoring is disabled
   */
  createPassthroughHandle(flowId) {
    return {
      allowed: true,
      flowId,
      gate: () => ({ allowed: true }),
      complete: () => {},
      abort: () => {}
    };
  }

  /**
   * Clean up old completed flows
   */
  cleanup() {
    const maxAge = 60000; // 1 minute
    const now = Date.now();

    for (const [flowId, flow] of this.flows) {
      if (flow.status !== 'active' && now - (flow.endTime || flow.startTime) > maxAge) {
        this.flows.delete(flowId);
      }
    }
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      ...this.stats,
      activeFlows: this.activeCount,
      trackedFlows: this.flows.size
    };
  }

  /**
   * Event emitter functionality
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    for (const cb of callbacks) {
      try {
        cb(data);
      } catch (e) {
        console.error(`FlowSync event handler error: ${e.message}`);
      }
    }
  }

  /**
   * Check if a flow can proceed (static helper)
   */
  static canProceed(flowHandle) {
    if (!flowHandle || flowHandle.allowed === false) {
      return false;
    }
    const gateResult = flowHandle.gate?.('check') || { allowed: true };
    return gateResult.allowed;
  }

  /**
   * Analyze flow metrics for gating decisions
   * @param {Object} metrics - Flow metrics (time, progressScore, microRule)
   * @returns {Object} Analysis result with elapsed, efficiency, warnings
   */
  analyze(metrics = {}) {
    const elapsed = metrics.time || 0;
    const progressScore = metrics.progressScore || 0;
    const microRule = metrics.microRule || 'unknown';

    // Calculate efficiency (progress per time unit)
    const efficiency = elapsed > 0 ? progressScore / (elapsed / 100) : 0;

    // Generate warnings
    const warnings = [];

    if (elapsed > this.options.thresholdMs * 0.8) {
      warnings.push('Approaching timeout');
    }

    if (progressScore < 0.1 && elapsed > 50) {
      warnings.push('Low progress');
    }

    if (microRule === 'unknown' && elapsed > 20) {
      warnings.push('Unclassified pattern');
    }

    return {
      elapsed,
      efficiency: Math.round(efficiency * 100) / 100,
      progressScore,
      microRule,
      warnings,
      proceed: warnings.length === 0 || progressScore > 0.15
    };
  }

  /**
   * Static analyze method for singleton usage
   */
  static analyze(metrics = {}) {
    return monitor.analyze(metrics);
  }
}

// Singleton instance
const monitor = new FlowSyncMonitor();

module.exports = monitor;
module.exports.FlowSyncMonitor = FlowSyncMonitor;
