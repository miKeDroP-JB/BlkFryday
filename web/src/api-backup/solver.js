/**
 * SOLVER DASHBOARD API
 * ═══════════════════════════════════════════════════════════════════
 * Real-time monitoring and control of UnlimitedSolver safety parameters
 * ═══════════════════════════════════════════════════════════════════
 */

const SafeJumpPolicy = require('../../system/solver/config/safe_jump_policy');

// Runtime state (mutable copy of policy)
let runtimePolicy = { ...SafeJumpPolicy };
let solverInstances = new Map();
let metricsHistory = [];

export default function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'PATCH':
      return handlePatch(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}

/**
 * GET - Retrieve current policy, stats, and metrics
 */
function handleGet(req, res) {
  const { action } = req.query;

  switch (action) {
    case 'policy':
      return res.status(200).json({
        policy: runtimePolicy,
        defaults: SafeJumpPolicy,
        modified: JSON.stringify(runtimePolicy) !== JSON.stringify(SafeJumpPolicy)
      });

    case 'metrics':
      return res.status(200).json({
        history: metricsHistory.slice(-100), // Last 100 entries
        activeSolvers: solverInstances.size,
        summary: computeMetricsSummary()
      });

    case 'instances':
      const instances = [];
      solverInstances.forEach((instance, id) => {
        instances.push({
          id,
          startTime: instance.startTime,
          strategiesTried: instance.stats?.strategiesTried || 0,
          status: instance.status
        });
      });
      return res.status(200).json({ instances });

    default:
      return res.status(200).json({
        policy: runtimePolicy,
        activeSolvers: solverInstances.size,
        metricsCount: metricsHistory.length
      });
  }
}

/**
 * POST - Execute solver actions
 */
function handlePost(req, res) {
  const { action, taskData, config } = req.body;

  switch (action) {
    case 'start':
      // Would integrate with actual solver - placeholder
      const instanceId = `solver_${Date.now()}`;
      solverInstances.set(instanceId, {
        startTime: Date.now(),
        status: 'running',
        config: { ...runtimePolicy, ...config }
      });
      return res.status(200).json({ instanceId, message: 'Solver started' });

    case 'stop':
      const { instanceId: stopId } = req.body;
      if (solverInstances.has(stopId)) {
        solverInstances.get(stopId).status = 'stopped';
        solverInstances.delete(stopId);
        return res.status(200).json({ message: 'Solver stopped' });
      }
      return res.status(404).json({ error: 'Instance not found' });

    case 'reset-policy':
      runtimePolicy = { ...SafeJumpPolicy };
      return res.status(200).json({ message: 'Policy reset to defaults', policy: runtimePolicy });

    case 'record-metric':
      const { metric } = req.body;
      metricsHistory.push({
        ...metric,
        timestamp: Date.now()
      });
      return res.status(200).json({ message: 'Metric recorded' });

    default:
      return res.status(400).json({ error: 'Unknown action' });
  }
}

/**
 * PATCH - Update policy parameters in real-time
 */
function handlePatch(req, res) {
  const updates = req.body;
  const validKeys = Object.keys(SafeJumpPolicy);
  const applied = {};
  const rejected = {};

  for (const [key, value] of Object.entries(updates)) {
    if (validKeys.includes(key) && typeof value !== 'function') {
      // Validate bounds
      if (key === 'MAX_COMPLEXITY_JUMP' && (value < 1 || value > 10)) {
        rejected[key] = 'Must be between 1 and 10';
        continue;
      }
      if (key === 'MAX_CHAIN_LENGTH' && (value < 1 || value > 20)) {
        rejected[key] = 'Must be between 1 and 20';
        continue;
      }
      if (key === 'MAX_STRATEGIES_PER_GENERATION' && (value < 10 || value > 10000)) {
        rejected[key] = 'Must be between 10 and 10000';
        continue;
      }

      runtimePolicy[key] = value;
      applied[key] = value;

      // Propagate to active instances
      solverInstances.forEach((instance) => {
        if (instance.safety) {
          instance.safety.config[key] = value;
        }
      });
    } else {
      rejected[key] = 'Invalid key or function type';
    }
  }

  return res.status(200).json({
    message: 'Policy updated',
    applied,
    rejected: Object.keys(rejected).length > 0 ? rejected : undefined,
    currentPolicy: runtimePolicy
  });
}

/**
 * Compute summary metrics
 */
function computeMetricsSummary() {
  if (metricsHistory.length === 0) {
    return { totalRuns: 0 };
  }

  const recent = metricsHistory.slice(-50);
  return {
    totalRuns: metricsHistory.length,
    recentAvgTime: recent.reduce((sum, m) => sum + (m.timeMs || 0), 0) / recent.length,
    recentSuccessRate: recent.filter(m => m.success).length / recent.length,
    hierarchyUsage: recent.reduce((acc, m) => {
      if (m.hierarchy) {
        acc[m.hierarchy] = (acc[m.hierarchy] || 0) + 1;
      }
      return acc;
    }, {})
  };
}

/**
 * Export for programmatic access
 */
export const SolverDashboard = {
  getPolicy: () => ({ ...runtimePolicy }),

  setPolicy: (key, value) => {
    if (key in SafeJumpPolicy && typeof value !== 'function') {
      runtimePolicy[key] = value;
      return true;
    }
    return false;
  },

  resetPolicy: () => {
    runtimePolicy = { ...SafeJumpPolicy };
  },

  recordMetric: (metric) => {
    metricsHistory.push({ ...metric, timestamp: Date.now() });
  },

  getMetrics: () => [...metricsHistory],

  // Real-time adjustment helpers
  adjustComplexityJump: (delta) => {
    const newVal = Math.max(1, Math.min(10, runtimePolicy.MAX_COMPLEXITY_JUMP + delta));
    runtimePolicy.MAX_COMPLEXITY_JUMP = newVal;
    return newVal;
  },

  adjustChainLength: (delta) => {
    const newVal = Math.max(1, Math.min(20, runtimePolicy.MAX_CHAIN_LENGTH + delta));
    runtimePolicy.MAX_CHAIN_LENGTH = newVal;
    return newVal;
  },

  adjustStrategiesPerGen: (delta) => {
    const newVal = Math.max(10, Math.min(10000, runtimePolicy.MAX_STRATEGIES_PER_GENERATION + delta));
    runtimePolicy.MAX_STRATEGIES_PER_GENERATION = newVal;
    return newVal;
  },

  setVerbose: (enabled) => {
    runtimePolicy.LOG_LEVEL = enabled ? 'verbose' : 'info';
    runtimePolicy.LOG_STRATEGY_PROGRESS = enabled;
  }
};
