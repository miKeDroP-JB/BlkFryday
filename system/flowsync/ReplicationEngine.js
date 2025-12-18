// ============================================================
//  ORBOS V11.5 - REPLICATION ENGINE
//  Spread successful patterns across the system
// ============================================================
//
//  Rule: ONLY replicate if it IMPROVES the system
//  Amoeba Principle: Split & replicate successful cells
//
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class ReplicationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.dataDir = config.dataDir || path.join(__dirname, '../../data/replication');
    this.ensureDirectories();

    // ============================================================
    //  PATTERN REGISTRY
    // ============================================================

    this.patterns = new Map(); // Successful patterns
    this.candidates = new Map(); // Patterns being evaluated
    this.failed = new Map(); // Patterns that failed replication

    // ============================================================
    //  REPLICATION CRITERIA
    // ============================================================

    this.criteria = {
      minSuccessRate: 0.85, // 85% success rate required
      minSampleSize: 5, // At least 5 applications before replicating
      minNetPositive: 0.1, // Must show positive improvement
      maxRisk: 0.2, // Maximum risk tolerance
      cooldownPeriod: 3600000 // 1 hour between replications of same pattern
    };

    // ============================================================
    //  TARGET SYSTEMS
    // ============================================================

    this.targets = new Map(); // Systems that can receive replications

    // ============================================================
    //  STATE
    // ============================================================

    this.state = {
      running: false,
      replications: 0,
      successes: 0,
      failures: 0,
      rollbacks: 0
    };

    // Load existing patterns
    this.loadPatterns();

    console.log(`[ReplicationEngine] Initialized with ${this.patterns.size} patterns`);
  }

  ensureDirectories() {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'patterns'),
      path.join(this.dataDir, 'replications'),
      path.join(this.dataDir, 'rollbacks')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadPatterns() {
    const patternsDir = path.join(this.dataDir, 'patterns');
    if (!fs.existsSync(patternsDir)) return;

    const files = fs.readdirSync(patternsDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      try {
        const pattern = JSON.parse(fs.readFileSync(path.join(patternsDir, file), 'utf8'));
        this.patterns.set(pattern.id, pattern);
      } catch (e) {
        console.error(`[ReplicationEngine] Failed to load ${file}`);
      }
    }
  }

  // ============================================================
  //  PATTERN REGISTRATION
  // ============================================================

  registerPattern(pattern) {
    const id = pattern.id || `pattern_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const registered = {
      id,
      name: pattern.name,
      type: pattern.type,
      source: pattern.source,
      implementation: pattern.implementation,
      config: pattern.config || {},
      metrics: {
        applications: 0,
        successes: 0,
        failures: 0,
        successRate: 0,
        avgImprovement: 0,
        improvements: []
      },
      replication: {
        count: 0,
        targets: [],
        lastReplicated: null
      },
      createdAt: Date.now(),
      status: 'candidate'
    };

    this.candidates.set(id, registered);

    console.log(`[ReplicationEngine] Registered pattern: ${id} (${pattern.name})`);

    return id;
  }

  // ============================================================
  //  PATTERN APPLICATION & TRACKING
  // ============================================================

  async applyPattern(patternId, target, options = {}) {
    const pattern = this.patterns.get(patternId) || this.candidates.get(patternId);

    if (!pattern) {
      throw new Error(`Pattern not found: ${patternId}`);
    }

    console.log(`[ReplicationEngine] Applying ${patternId} to ${target.name}`);

    const application = {
      id: `app_${Date.now()}`,
      patternId,
      target: target.name,
      startedAt: Date.now(),
      beforeMetrics: this.captureMetrics(target),
      status: 'applying'
    };

    try {
      // Apply the pattern
      const result = await this.executeApplication(pattern, target, options);

      application.afterMetrics = this.captureMetrics(target);
      application.improvement = this.calculateImprovement(
        application.beforeMetrics,
        application.afterMetrics
      );
      application.status = 'completed';
      application.completedAt = Date.now();

      // Update pattern metrics
      pattern.metrics.applications++;

      if (application.improvement > 0) {
        pattern.metrics.successes++;
        pattern.metrics.improvements.push(application.improvement);
        pattern.metrics.avgImprovement =
          pattern.metrics.improvements.reduce((a, b) => a + b, 0) /
          pattern.metrics.improvements.length;
      } else {
        pattern.metrics.failures++;
      }

      pattern.metrics.successRate =
        pattern.metrics.successes / pattern.metrics.applications;

      // Check if candidate should be promoted
      this.evaluateCandidate(patternId);

      this.emit('pattern-applied', application);

      return application;

    } catch (error) {
      application.status = 'failed';
      application.error = error.message;
      pattern.metrics.applications++;
      pattern.metrics.failures++;
      pattern.metrics.successRate =
        pattern.metrics.successes / pattern.metrics.applications;

      throw error;
    }
  }

  async executeApplication(pattern, target, options) {
    // Execute the pattern's implementation
    if (typeof pattern.implementation === 'function') {
      return await pattern.implementation(target, pattern.config, options);
    }

    if (pattern.implementation?.apply) {
      return await pattern.implementation.apply(target, pattern.config);
    }

    // Code-based implementation
    if (pattern.implementation?.code) {
      // Safely evaluate pattern code (in production, use sandboxed execution)
      return { applied: true, code: pattern.implementation.code };
    }

    return { applied: true };
  }

  captureMetrics(target) {
    return {
      health: target.health || 0,
      performance: target.performance || 0,
      reliability: target.reliability || 0,
      efficiency: target.efficiency || 0,
      timestamp: Date.now()
    };
  }

  calculateImprovement(before, after) {
    const weights = {
      health: 0.3,
      performance: 0.3,
      reliability: 0.25,
      efficiency: 0.15
    };

    let improvement = 0;

    for (const [metric, weight] of Object.entries(weights)) {
      const diff = (after[metric] || 0) - (before[metric] || 0);
      improvement += diff * weight;
    }

    return improvement;
  }

  evaluateCandidate(patternId) {
    const pattern = this.candidates.get(patternId);
    if (!pattern) return;

    // Check if meets criteria for promotion
    if (
      pattern.metrics.applications >= this.criteria.minSampleSize &&
      pattern.metrics.successRate >= this.criteria.minSuccessRate &&
      pattern.metrics.avgImprovement >= this.criteria.minNetPositive
    ) {
      // Promote to full pattern
      pattern.status = 'verified';
      this.candidates.delete(patternId);
      this.patterns.set(patternId, pattern);

      // Save pattern
      this.savePattern(pattern);

      console.log(`[ReplicationEngine] Pattern ${patternId} PROMOTED to verified`);
      this.emit('pattern-promoted', pattern);
    }
  }

  // ============================================================
  //  REPLICATION LOGIC
  // ============================================================

  async replicate(patternId, targetSystems = []) {
    const pattern = this.patterns.get(patternId);

    if (!pattern) {
      throw new Error(`Pattern not found or not verified: ${patternId}`);
    }

    // Check cooldown
    if (
      pattern.replication.lastReplicated &&
      Date.now() - pattern.replication.lastReplicated < this.criteria.cooldownPeriod
    ) {
      console.log(`[ReplicationEngine] Pattern ${patternId} in cooldown`);
      return { replicated: false, reason: 'cooldown' };
    }

    console.log(`[ReplicationEngine] REPLICATING ${patternId} to ${targetSystems.length} targets`);

    const results = {
      patternId,
      startedAt: Date.now(),
      targets: [],
      successes: 0,
      failures: 0
    };

    for (const target of targetSystems) {
      // Check if already replicated to this target
      if (pattern.replication.targets.includes(target.name)) {
        results.targets.push({
          name: target.name,
          status: 'skipped',
          reason: 'already-replicated'
        });
        continue;
      }

      // Evaluate compatibility
      const compatibility = this.checkCompatibility(pattern, target);

      if (!compatibility.compatible) {
        results.targets.push({
          name: target.name,
          status: 'skipped',
          reason: compatibility.reason
        });
        continue;
      }

      // Apply pattern
      try {
        const application = await this.applyPattern(patternId, target, {
          replication: true
        });

        if (application.improvement > 0) {
          results.successes++;
          results.targets.push({
            name: target.name,
            status: 'success',
            improvement: application.improvement
          });

          // Track successful replication
          pattern.replication.targets.push(target.name);
          pattern.replication.count++;

        } else {
          results.failures++;
          results.targets.push({
            name: target.name,
            status: 'failed',
            reason: 'no-improvement'
          });

          // Rollback
          await this.rollback(application, target);
        }

      } catch (error) {
        results.failures++;
        results.targets.push({
          name: target.name,
          status: 'error',
          error: error.message
        });
      }
    }

    pattern.replication.lastReplicated = Date.now();
    results.completedAt = Date.now();

    // Update state
    this.state.replications += results.targets.length;
    this.state.successes += results.successes;
    this.state.failures += results.failures;

    // Save updated pattern
    this.savePattern(pattern);

    // Log replication
    this.saveReplication(results);

    this.emit('replication-complete', results);

    return results;
  }

  checkCompatibility(pattern, target) {
    // Check if pattern can be applied to target

    // Type compatibility
    if (pattern.type && target.type && pattern.type !== target.type) {
      // Check for compatible types
      const compatibleTypes = {
        'performance': ['optimizer', 'cache', 'speed'],
        'reliability': ['failover', 'backup', 'health'],
        'security': ['defense', 'auth', 'encryption']
      };

      const compatible = compatibleTypes[pattern.type]?.includes(target.type);
      if (!compatible) {
        return { compatible: false, reason: 'type-mismatch' };
      }
    }

    // Resource check
    if (pattern.config?.requiredResources > target.availableResources) {
      return { compatible: false, reason: 'insufficient-resources' };
    }

    // Risk check
    if (pattern.config?.riskLevel > this.criteria.maxRisk) {
      return { compatible: false, reason: 'risk-too-high' };
    }

    return { compatible: true };
  }

  async rollback(application, target) {
    console.log(`[ReplicationEngine] Rolling back ${application.id} on ${target.name}`);

    const rollback = {
      id: `rollback_${Date.now()}`,
      applicationId: application.id,
      target: target.name,
      beforeMetrics: application.afterMetrics,
      timestamp: Date.now()
    };

    try {
      // Restore previous state
      // In production, this would restore actual configuration/code

      rollback.status = 'completed';
      this.state.rollbacks++;

    } catch (error) {
      rollback.status = 'failed';
      rollback.error = error.message;
    }

    // Save rollback
    this.saveRollback(rollback);

    this.emit('rollback', rollback);

    return rollback;
  }

  // ============================================================
  //  AUTONOMOUS REPLICATION (Amoeba Splitting)
  // ============================================================

  async startAutonomousReplication() {
    this.state.running = true;
    console.log('[ReplicationEngine] Starting autonomous replication...');

    while (this.state.running) {
      await this.autonomousCycle();
      await this.sleep(60000); // Check every minute
    }
  }

  stopAutonomousReplication() {
    this.state.running = false;
  }

  async autonomousCycle() {
    // Find patterns ready for replication
    const readyPatterns = Array.from(this.patterns.values())
      .filter(p =>
        p.status === 'verified' &&
        p.metrics.successRate >= this.criteria.minSuccessRate &&
        (!p.replication.lastReplicated ||
         Date.now() - p.replication.lastReplicated >= this.criteria.cooldownPeriod)
      )
      .sort((a, b) => b.metrics.avgImprovement - a.metrics.avgImprovement);

    if (readyPatterns.length === 0) return;

    // Find targets for top pattern
    const topPattern = readyPatterns[0];
    const eligibleTargets = this.findEligibleTargets(topPattern);

    if (eligibleTargets.length > 0) {
      await this.replicate(topPattern.id, eligibleTargets.slice(0, 3));
    }
  }

  findEligibleTargets(pattern) {
    return Array.from(this.targets.values())
      .filter(target => {
        const compatibility = this.checkCompatibility(pattern, target);
        return compatibility.compatible &&
               !pattern.replication.targets.includes(target.name);
      })
      .sort((a, b) => {
        // Prioritize targets with lower health
        return (a.health || 1) - (b.health || 1);
      });
  }

  // ============================================================
  //  TARGET MANAGEMENT
  // ============================================================

  registerTarget(target) {
    const id = target.id || target.name;

    this.targets.set(id, {
      ...target,
      registeredAt: Date.now(),
      appliedPatterns: [],
      metrics: {
        health: target.health || 1,
        performance: target.performance || 1,
        reliability: target.reliability || 1,
        efficiency: target.efficiency || 1
      }
    });

    console.log(`[ReplicationEngine] Registered target: ${id}`);
  }

  updateTargetMetrics(targetId, metrics) {
    const target = this.targets.get(targetId);
    if (target) {
      target.metrics = { ...target.metrics, ...metrics };
    }
  }

  // ============================================================
  //  PERSISTENCE
  // ============================================================

  savePattern(pattern) {
    const filepath = path.join(this.dataDir, 'patterns', `${pattern.id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(pattern, null, 2));
  }

  saveReplication(replication) {
    const filepath = path.join(this.dataDir, 'replications', `${replication.patternId}_${replication.startedAt}.json`);
    fs.writeFileSync(filepath, JSON.stringify(replication, null, 2));
  }

  saveRollback(rollback) {
    const filepath = path.join(this.dataDir, 'rollbacks', `${rollback.id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(rollback, null, 2));
  }

  // ============================================================
  //  STATISTICS
  // ============================================================

  getStats() {
    return {
      state: this.state,
      patterns: {
        verified: this.patterns.size,
        candidates: this.candidates.size,
        failed: this.failed.size
      },
      targets: this.targets.size,
      topPatterns: Array.from(this.patterns.values())
        .sort((a, b) => b.metrics.avgImprovement - a.metrics.avgImprovement)
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.name,
          successRate: p.metrics.successRate,
          avgImprovement: p.metrics.avgImprovement,
          replications: p.replication.count
        }))
    };
  }

  // ============================================================
  //  UTILITIES
  // ============================================================

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { ReplicationEngine };
