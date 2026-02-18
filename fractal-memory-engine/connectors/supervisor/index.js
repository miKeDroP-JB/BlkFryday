/**
 * EDGE SUPERVISOR ADAPTER - Bridges HYDRA Sentinel to Fractal Memory Engine
 *
 * Standard API contract:
 * - POST /trigger - Run health check
 * - GET /status - Get system health
 * - POST /feedback - Report issues
 * - GET /observe - Stream health metrics
 *
 * THE WATCHER - Meta-layer that keeps the system from degrading
 */

const express = require('express');
const { EventEmitter } = require('events');

// Import existing components
const HydraSentinel = require('../../../core/security/hydra-sentinel');

const app = express();
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════
// EDGE SUPERVISOR SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class EdgeSupervisorService extends EventEmitter {
  constructor() {
    super();
    this.sentinel = new HydraSentinel();
    this.healthChecks = new Map();
    this.alerts = [];
    this.autoRepairEnabled = true;

    this.metrics = {
      checksRun: 0,
      issuesDetected: 0,
      autoRepairs: 0,
      uptime: Date.now()
    };

    // Health check intervals
    this.checkIntervals = {
      agents: 60000,      // 1 minute
      memory: 300000,     // 5 minutes
      resonance: 600000,  // 10 minutes
      avatars: 300000     // 5 minutes
    };

    this._initHealthChecks();
  }

  _initHealthChecks() {
    // Agent health check
    this.healthChecks.set('agents', {
      name: 'Agent Health',
      lastRun: null,
      lastStatus: 'unknown',
      issues: []
    });

    // Memory health check
    this.healthChecks.set('memory', {
      name: 'Memory Health',
      lastRun: null,
      lastStatus: 'unknown',
      issues: []
    });

    // Resonance health check
    this.healthChecks.set('resonance', {
      name: 'Resonance Links',
      lastRun: null,
      lastStatus: 'unknown',
      issues: []
    });

    // Avatar health check
    this.healthChecks.set('avatars', {
      name: 'Avatar State',
      lastRun: null,
      lastStatus: 'unknown',
      issues: []
    });
  }

  /**
   * Run comprehensive health check
   */
  async runHealthCheck(category = 'all') {
    const startTime = Date.now();
    const results = {};

    const categoriesToCheck = category === 'all'
      ? ['agents', 'memory', 'resonance', 'avatars']
      : [category];

    for (const cat of categoriesToCheck) {
      results[cat] = await this._checkCategory(cat);
    }

    this.metrics.checksRun++;

    // Aggregate status
    const overallStatus = this._aggregateStatus(results);

    // Auto-repair if enabled and issues found
    if (this.autoRepairEnabled && overallStatus !== 'healthy') {
      await this._attemptAutoRepair(results);
    }

    this.emit('health:checked', {
      category,
      results,
      overallStatus,
      latencyMs: Date.now() - startTime
    });

    return {
      status: overallStatus,
      results,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime
    };
  }

  async _checkCategory(category) {
    const check = this.healthChecks.get(category);
    if (!check) return { status: 'unknown', issues: [] };

    const issues = [];
    let status = 'healthy';

    switch (category) {
      case 'agents':
        // Check for agent loops, stuck agents, timeouts
        const agentIssues = await this._checkAgents();
        issues.push(...agentIssues);
        break;

      case 'memory':
        // Check for memory bloat, stale references, corruption
        const memoryIssues = await this._checkMemory();
        issues.push(...memoryIssues);
        break;

      case 'resonance':
        // Check for broken resonance links, stale connections
        const resonanceIssues = await this._checkResonance();
        issues.push(...resonanceIssues);
        break;

      case 'avatars':
        // Check for avatar state consistency, drift
        const avatarIssues = await this._checkAvatars();
        issues.push(...avatarIssues);
        break;
    }

    if (issues.length > 0) {
      status = issues.some(i => i.severity === 'critical') ? 'critical' : 'degraded';
      this.metrics.issuesDetected += issues.length;
    }

    check.lastRun = new Date().toISOString();
    check.lastStatus = status;
    check.issues = issues;

    return { status, issues, lastRun: check.lastRun };
  }

  async _checkAgents() {
    const issues = [];

    // Simulated checks - in production, query actual agent services
    // Check for stuck agents
    // Check for infinite loops
    // Check for timeout patterns

    return issues;
  }

  async _checkMemory() {
    const issues = [];

    // Check memory usage
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;

    if (heapUsedMB > 500) {
      issues.push({
        type: 'memory_bloat',
        severity: 'warning',
        message: `Heap usage high: ${heapUsedMB.toFixed(2)}MB`,
        autoRepairable: true
      });
    }

    return issues;
  }

  async _checkResonance() {
    const issues = [];

    // Check for broken resonance links
    // Check for stale patterns
    // Check for hallucination clusters

    return issues;
  }

  async _checkAvatars() {
    const issues = [];

    // Check avatar state consistency
    // Check for drift between edge and core
    // Check filter profile integrity

    return issues;
  }

  _aggregateStatus(results) {
    const statuses = Object.values(results).map(r => r.status);

    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('degraded')) return 'degraded';
    if (statuses.includes('unknown')) return 'unknown';
    return 'healthy';
  }

  async _attemptAutoRepair(results) {
    for (const [category, result] of Object.entries(results)) {
      for (const issue of result.issues) {
        if (issue.autoRepairable) {
          await this._repair(category, issue);
        }
      }
    }
  }

  async _repair(category, issue) {
    console.log(`[SUPERVISOR] Auto-repairing: ${category} - ${issue.type}`);

    switch (issue.type) {
      case 'memory_bloat':
        // Trigger garbage collection hint
        if (global.gc) global.gc();
        break;

      case 'stale_reference':
        // Clear stale references
        break;

      case 'avatar_drift':
        // Resync avatar state
        break;
    }

    this.metrics.autoRepairs++;
    this.emit('health:repaired', { category, issue });
  }

  /**
   * Report an issue manually
   */
  reportIssue(issue) {
    const alert = {
      id: `alert_${Date.now()}`,
      ...issue,
      reportedAt: new Date().toISOString(),
      status: 'open'
    };

    this.alerts.push(alert);
    this.emit('alert:created', alert);

    return alert;
  }

  /**
   * Get current health status
   */
  getStatus() {
    const checks = {};
    for (const [key, check] of this.healthChecks) {
      checks[key] = {
        name: check.name,
        status: check.lastStatus,
        lastRun: check.lastRun,
        issueCount: check.issues.length
      };
    }

    return {
      service: 'edge-supervisor',
      codename: 'THE WATCHER',
      status: this._aggregateStatus(
        Object.fromEntries(
          Array.from(this.healthChecks.entries()).map(([k, v]) => [k, { status: v.lastStatus }])
        )
      ),
      autoRepairEnabled: this.autoRepairEnabled,
      checks,
      openAlerts: this.alerts.filter(a => a.status === 'open').length,
      metrics: {
        ...this.metrics,
        uptimeSeconds: Math.floor((Date.now() - this.metrics.uptime) / 1000)
      }
    };
  }

  /**
   * Get health for specific system
   */
  getHealth(system) {
    const check = this.healthChecks.get(system);
    if (!check) return null;

    return {
      system,
      name: check.name,
      status: check.lastStatus,
      lastRun: check.lastRun,
      issues: check.issues
    };
  }
}

const supervisor = new EdgeSupervisorService();

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'edge-supervisor',
    codename: 'THE WATCHER'
  });
});

// POST /trigger - Run health check
app.post('/trigger', async (req, res) => {
  try {
    const category = req.body.category || 'all';
    const result = await supervisor.runHealthCheck(category);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /status - Get overall status
app.get('/status', (req, res) => {
  res.json(supervisor.getStatus());
});

// GET /system/health/:system - Get specific system health
app.get('/system/health/:system', (req, res) => {
  const health = supervisor.getHealth(req.params.system);
  if (!health) {
    return res.status(404).json({ error: 'System not found' });
  }
  res.json(health);
});

// GET /system/health/agents
app.get('/system/health/agents', (req, res) => {
  res.json(supervisor.getHealth('agents') || { status: 'unknown' });
});

// GET /system/health/memory
app.get('/system/health/memory', (req, res) => {
  res.json(supervisor.getHealth('memory') || { status: 'unknown' });
});

// GET /system/health/resonance
app.get('/system/health/resonance', (req, res) => {
  res.json(supervisor.getHealth('resonance') || { status: 'unknown' });
});

// GET /system/health/avatars
app.get('/system/health/avatars', (req, res) => {
  res.json(supervisor.getHealth('avatars') || { status: 'unknown' });
});

// POST /feedback - Report an issue
app.post('/feedback', (req, res) => {
  const alert = supervisor.reportIssue({
    category: req.body.category,
    type: req.body.type,
    severity: req.body.severity || 'warning',
    message: req.body.message,
    context: req.body.context || {}
  });
  res.json({ status: 'reported', alert });
});

// POST /auto-repair - Toggle auto-repair
app.post('/auto-repair', (req, res) => {
  supervisor.autoRepairEnabled = req.body.enabled !== false;
  res.json({ autoRepairEnabled: supervisor.autoRepairEnabled });
});

// GET /alerts - Get open alerts
app.get('/alerts', (req, res) => {
  const status = req.query.status || 'open';
  const alerts = supervisor.alerts.filter(a =>
    status === 'all' || a.status === status
  );
  res.json({ alerts, total: alerts.length });
});

// GET /observe - Stream health metrics (SSE)
app.get('/observe', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendStatus = () => {
    res.write(`data: ${JSON.stringify(supervisor.getStatus())}\n\n`);
  };

  sendStatus();
  const interval = setInterval(sendStatus, 15000); // Every 15 seconds

  const onChecked = (data) => {
    res.write(`event: health:checked\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const onAlert = (data) => {
    res.write(`event: alert:created\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const onRepaired = (data) => {
    res.write(`event: health:repaired\ndata: ${JSON.stringify(data)}\n\n`);
  };

  supervisor.on('health:checked', onChecked);
  supervisor.on('alert:created', onAlert);
  supervisor.on('health:repaired', onRepaired);

  req.on('close', () => {
    clearInterval(interval);
    supervisor.off('health:checked', onChecked);
    supervisor.off('alert:created', onAlert);
    supervisor.off('health:repaired', onRepaired);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULED HEALTH CHECKS
// ═══════════════════════════════════════════════════════════════════════════

// Run health checks on schedule
setInterval(() => supervisor.runHealthCheck('agents'), 60000);
setInterval(() => supervisor.runHealthCheck('memory'), 300000);
setInterval(() => supervisor.runHealthCheck('resonance'), 600000);
setInterval(() => supervisor.runHealthCheck('avatars'), 300000);

// ═══════════════════════════════════════════════════════════════════════════
// SERVER
// ═══════════════════════════════════════════════════════════════════════════

app.listen(8033, () => {
  console.log('═'.repeat(60));
  console.log('EDGE SUPERVISOR - THE WATCHER');
  console.log('Meta-layer health monitoring service');
  console.log('Listening on port 8033');
  console.log('═'.repeat(60));

  // Initial health check
  supervisor.runHealthCheck('all');
});

module.exports = { app, supervisor, EdgeSupervisorService };
