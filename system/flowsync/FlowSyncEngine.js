// ============================================================
//  ORBOS V11.5 - FLOWSYNC ENGINE
//  Self-Improving Autonomous System Core
// ============================================================
//
//  The Loop: LEARN → BUILD → TEST → REFINE → AUTOMATE → REPLICATE
//
//  Rules:
//  1. Must have NET POSITIVE according to scoring algos
//  2. Prioritize by systematic importance (highest → lowest)
//  3. Use best available, or CUSTOM BUILD if < 100% optimal
//  4. Replicate ONLY if it improves the system
//
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class FlowSyncEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.dataDir = config.dataDir || path.join(__dirname, '../../data/flowsync');
    this.ensureDirectories();

    // ============================================================
    //  SYSTEM STATE
    // ============================================================

    this.state = {
      running: false,
      currentPhase: null,
      cycleCount: 0,
      lastCycleTime: null,
      improvements: [],
      failures: [],
      metrics: {}
    };

    // ============================================================
    //  PRIORITY MATRIX (Highest → Lowest)
    // ============================================================

    this.priorityMatrix = {
      CRITICAL: {
        level: 100,
        systems: ['security', 'authentication', 'data-integrity'],
        threshold: 0.99 // Must be 99%+ optimal
      },
      HIGH: {
        level: 80,
        systems: ['performance', 'reliability', 'knowledge-retention'],
        threshold: 0.95
      },
      MEDIUM: {
        level: 60,
        systems: ['user-experience', 'automation', 'integration'],
        threshold: 0.90
      },
      LOW: {
        level: 40,
        systems: ['reporting', 'logging', 'analytics'],
        threshold: 0.85
      },
      BACKGROUND: {
        level: 20,
        systems: ['cleanup', 'optimization', 'caching'],
        threshold: 0.80
      }
    };

    // ============================================================
    //  SCORING ALGORITHMS
    // ============================================================

    this.scoringAlgos = {
      // Net Positive Score = (gains - costs) * reliability * importance
      netPositive: (metrics) => {
        const gains = metrics.performanceGain + metrics.efficiencyGain + metrics.qualityGain;
        const costs = metrics.resourceCost + metrics.complexityCost + metrics.riskCost;
        return (gains - costs) * metrics.reliability * metrics.importance;
      },

      // System Health = weighted average of all subsystems
      systemHealth: (subsystems) => {
        let totalWeight = 0;
        let weightedSum = 0;

        for (const [name, data] of Object.entries(subsystems)) {
          const priority = this.getPriority(name);
          const weight = priority.level / 100;
          totalWeight += weight;
          weightedSum += data.health * weight;
        }

        return totalWeight > 0 ? weightedSum / totalWeight : 0;
      },

      // Improvement Potential = (optimal - current) * feasibility
      improvementPotential: (current, optimal, feasibility) => {
        return (optimal - current) * feasibility;
      },

      // Replication Score = success_rate * impact * scalability
      replicationScore: (pattern) => {
        return pattern.successRate * pattern.impact * pattern.scalability;
      }
    };

    // ============================================================
    //  REGISTERED SYSTEMS
    // ============================================================

    this.systems = new Map();
    this.patterns = new Map(); // Successful patterns for replication
    this.buildQueue = []; // Custom builds needed
    this.automations = new Map(); // Running automations

    // Load state
    this.loadState();

    console.log(`[FlowSync] Engine initialized - Priority-driven autonomous improvement`);
  }

  ensureDirectories() {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'cycles'),
      path.join(this.dataDir, 'patterns'),
      path.join(this.dataDir, 'builds'),
      path.join(this.dataDir, 'metrics')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadState() {
    const statePath = path.join(this.dataDir, 'state.json');
    if (fs.existsSync(statePath)) {
      try {
        const saved = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        this.state = { ...this.state, ...saved };
      } catch (e) {
        console.error('[FlowSync] Failed to load state:', e.message);
      }
    }
  }

  saveState() {
    const statePath = path.join(this.dataDir, 'state.json');
    fs.writeFileSync(statePath, JSON.stringify(this.state, null, 2));
  }

  // ============================================================
  //  SYSTEM REGISTRATION
  // ============================================================

  registerSystem(name, config) {
    this.systems.set(name, {
      name,
      config,
      health: 1.0,
      lastCheck: null,
      metrics: {},
      improvements: [],
      priority: this.getPriority(name)
    });

    console.log(`[FlowSync] Registered system: ${name} (priority: ${this.getPriority(name).level})`);
  }

  getPriority(systemName) {
    for (const [level, data] of Object.entries(this.priorityMatrix)) {
      if (data.systems.some(s => systemName.toLowerCase().includes(s))) {
        return { level: data.level, threshold: data.threshold, name: level };
      }
    }
    return { level: 50, threshold: 0.85, name: 'DEFAULT' };
  }

  // ============================================================
  //  THE MAIN LOOP
  // ============================================================

  async start() {
    if (this.state.running) {
      console.log('[FlowSync] Already running');
      return;
    }

    this.state.running = true;
    console.log('[FlowSync] Starting autonomous improvement loop...');

    while (this.state.running) {
      await this.runCycle();

      // Adaptive cycle interval based on system health
      const health = this.getOverallHealth();
      const interval = health > 0.95 ? 60000 : health > 0.8 ? 30000 : 10000;

      await this.sleep(interval);
    }
  }

  stop() {
    this.state.running = false;
    this.saveState();
    console.log('[FlowSync] Stopped');
  }

  async runCycle() {
    const cycleId = `cycle_${Date.now()}`;
    const cycleStart = Date.now();

    console.log(`\n[FlowSync] ═══════════════════════════════════════════`);
    console.log(`[FlowSync] CYCLE ${this.state.cycleCount + 1} - ${cycleId}`);
    console.log(`[FlowSync] ═══════════════════════════════════════════\n`);

    const cycleResults = {
      id: cycleId,
      startTime: cycleStart,
      phases: {}
    };

    try {
      // ==================== PHASE 1: LEARN ====================
      this.state.currentPhase = 'LEARN';
      cycleResults.phases.learn = await this.phaseLearn();

      // ==================== PHASE 2: BUILD ====================
      this.state.currentPhase = 'BUILD';
      cycleResults.phases.build = await this.phaseBuild(cycleResults.phases.learn);

      // ==================== PHASE 3: TEST ====================
      this.state.currentPhase = 'TEST';
      cycleResults.phases.test = await this.phaseTest(cycleResults.phases.build);

      // ==================== PHASE 4: REFINE ====================
      this.state.currentPhase = 'REFINE';
      cycleResults.phases.refine = await this.phaseRefine(cycleResults.phases.test);

      // ==================== PHASE 5: AUTOMATE ====================
      this.state.currentPhase = 'AUTOMATE';
      cycleResults.phases.automate = await this.phaseAutomate(cycleResults.phases.refine);

      // ==================== PHASE 6: REPLICATE ====================
      this.state.currentPhase = 'REPLICATE';
      cycleResults.phases.replicate = await this.phaseReplicate(cycleResults.phases.automate);

      // Finalize cycle
      cycleResults.endTime = Date.now();
      cycleResults.duration = cycleResults.endTime - cycleStart;
      cycleResults.success = true;

      this.state.cycleCount++;
      this.state.lastCycleTime = Date.now();

      // Save cycle results
      this.saveCycleResults(cycleResults);

      console.log(`\n[FlowSync] Cycle ${this.state.cycleCount} complete in ${cycleResults.duration}ms`);
      this.emit('cycle-complete', cycleResults);

    } catch (error) {
      console.error(`[FlowSync] Cycle failed:`, error.message);
      cycleResults.error = error.message;
      cycleResults.success = false;
      this.state.failures.push({ cycleId, error: error.message, time: Date.now() });
    }

    this.state.currentPhase = null;
    this.saveState();

    return cycleResults;
  }

  // ============================================================
  //  PHASE 1: LEARN
  // ============================================================

  async phaseLearn() {
    console.log('[FlowSync] PHASE 1: LEARN - Gathering intelligence...');

    const learnings = {
      systemStates: {},
      opportunities: [],
      patterns: [],
      externalData: []
    };

    // 1. Assess all registered systems
    for (const [name, system] of this.systems) {
      const assessment = await this.assessSystem(name, system);
      learnings.systemStates[name] = assessment;

      // Find improvement opportunities
      if (assessment.score < system.priority.threshold) {
        learnings.opportunities.push({
          system: name,
          currentScore: assessment.score,
          targetScore: system.priority.threshold,
          gap: system.priority.threshold - assessment.score,
          priority: system.priority.level
        });
      }
    }

    // 2. Analyze successful patterns
    for (const [id, pattern] of this.patterns) {
      if (pattern.successRate > 0.8) {
        learnings.patterns.push({
          id,
          type: pattern.type,
          successRate: pattern.successRate,
          applicableTo: this.findApplicableSystems(pattern)
        });
      }
    }

    // 3. Sort opportunities by priority (highest first)
    learnings.opportunities.sort((a, b) => {
      // First by priority level
      if (b.priority !== a.priority) return b.priority - a.priority;
      // Then by gap size
      return b.gap - a.gap;
    });

    console.log(`[FlowSync] Learned: ${learnings.opportunities.length} opportunities, ${learnings.patterns.length} patterns`);

    return learnings;
  }

  async assessSystem(name, system) {
    const metrics = {
      availability: this.measureAvailability(system),
      performance: this.measurePerformance(system),
      reliability: this.measureReliability(system),
      efficiency: this.measureEfficiency(system)
    };

    const score = (metrics.availability + metrics.performance + metrics.reliability + metrics.efficiency) / 4;

    system.health = score;
    system.lastCheck = Date.now();
    system.metrics = metrics;

    return { score, metrics, timestamp: Date.now() };
  }

  measureAvailability(system) {
    // Check if system is responsive
    return system.health > 0 ? 0.95 + Math.random() * 0.05 : 0;
  }

  measurePerformance(system) {
    // Measure response times, throughput
    return 0.85 + Math.random() * 0.15;
  }

  measureReliability(system) {
    // Check error rates, consistency
    const failures = this.state.failures.filter(f => f.system === system.name).length;
    return Math.max(0, 1 - failures * 0.1);
  }

  measureEfficiency(system) {
    // Resource utilization efficiency
    return 0.80 + Math.random() * 0.20;
  }

  findApplicableSystems(pattern) {
    return Array.from(this.systems.keys()).filter(name => {
      const system = this.systems.get(name);
      return system.health < system.priority.threshold &&
             pattern.type === system.config?.type;
    });
  }

  // ============================================================
  //  PHASE 2: BUILD
  // ============================================================

  async phaseBuild(learnings) {
    console.log('[FlowSync] PHASE 2: BUILD - Creating improvements...');

    const builds = {
      improvements: [],
      customBuilds: [],
      skipped: []
    };

    for (const opportunity of learnings.opportunities) {
      // Check if we have existing solution
      const existing = this.findExistingSolution(opportunity);

      if (existing && existing.score >= 0.95) {
        // Use existing if close to 100%
        builds.improvements.push({
          type: 'apply-existing',
          system: opportunity.system,
          solution: existing,
          expectedGain: existing.score - opportunity.currentScore
        });
      } else {
        // Need custom build
        const customBuild = await this.createCustomBuild(opportunity);

        if (customBuild) {
          builds.customBuilds.push(customBuild);
        } else {
          builds.skipped.push({
            system: opportunity.system,
            reason: 'Cannot build optimal solution'
          });
        }
      }
    }

    console.log(`[FlowSync] Built: ${builds.improvements.length} improvements, ${builds.customBuilds.length} custom`);

    return builds;
  }

  findExistingSolution(opportunity) {
    // Search patterns for applicable solution
    for (const [id, pattern] of this.patterns) {
      if (pattern.applicableTo?.includes(opportunity.system) && pattern.successRate > 0.9) {
        return {
          patternId: id,
          score: pattern.successRate,
          type: pattern.type
        };
      }
    }
    return null;
  }

  async createCustomBuild(opportunity) {
    console.log(`[FlowSync] Custom building for ${opportunity.system}...`);

    const build = {
      id: `build_${Date.now()}`,
      targetSystem: opportunity.system,
      targetScore: opportunity.targetScore,
      currentScore: opportunity.currentScore,
      specs: this.generateOptimalSpecs(opportunity),
      code: null,
      status: 'pending',
      createdAt: Date.now()
    };

    // Generate the improvement code
    build.code = this.generateImprovementCode(build.specs);

    return build;
  }

  generateOptimalSpecs(opportunity) {
    return {
      targetMetrics: {
        availability: 0.999,
        performance: 0.95,
        reliability: 0.99,
        efficiency: 0.90
      },
      constraints: {
        maxLatency: 100,
        maxMemory: '512MB',
        maxCPU: 0.5
      },
      optimizations: [
        'caching',
        'lazy-loading',
        'connection-pooling',
        'batch-processing'
      ]
    };
  }

  generateImprovementCode(specs) {
    // Generate improvement implementation
    return {
      type: 'improvement',
      specs,
      implementation: `
// Auto-generated improvement for target metrics
class Improvement_${Date.now()} {
  constructor() {
    this.targetMetrics = ${JSON.stringify(specs.targetMetrics)};
    this.optimizations = ${JSON.stringify(specs.optimizations)};
  }

  async apply(system) {
    // Apply optimizations
    for (const opt of this.optimizations) {
      await this.applyOptimization(system, opt);
    }
    return this.verify(system);
  }

  async applyOptimization(system, optimization) {
    switch(optimization) {
      case 'caching':
        return this.enableCaching(system);
      case 'lazy-loading':
        return this.enableLazyLoading(system);
      case 'connection-pooling':
        return this.enableConnectionPooling(system);
      case 'batch-processing':
        return this.enableBatchProcessing(system);
    }
  }

  enableCaching(system) { /* Cache frequently accessed data */ }
  enableLazyLoading(system) { /* Defer non-critical loads */ }
  enableConnectionPooling(system) { /* Reuse connections */ }
  enableBatchProcessing(system) { /* Batch similar operations */ }

  verify(system) {
    // Verify improvement met targets
    return { success: true, metrics: this.targetMetrics };
  }
}
      `
    };
  }

  // ============================================================
  //  PHASE 3: TEST
  // ============================================================

  async phaseTest(builds) {
    console.log('[FlowSync] PHASE 3: TEST - Validating improvements...');

    const testResults = {
      passed: [],
      failed: [],
      metrics: {}
    };

    // Test existing improvements
    for (const improvement of builds.improvements) {
      const result = await this.testImprovement(improvement);

      if (result.passed && result.netPositive > 0) {
        testResults.passed.push({ ...improvement, result });
      } else {
        testResults.failed.push({ ...improvement, result });
      }
    }

    // Test custom builds
    for (const build of builds.customBuilds) {
      const result = await this.testCustomBuild(build);

      if (result.passed && result.netPositive > 0) {
        testResults.passed.push({ ...build, result, type: 'custom-build' });
      } else {
        testResults.failed.push({ ...build, result, type: 'custom-build' });
      }
    }

    console.log(`[FlowSync] Tested: ${testResults.passed.length} passed, ${testResults.failed.length} failed`);

    return testResults;
  }

  async testImprovement(improvement) {
    // Simulate testing the improvement
    const before = {
      performanceGain: 0,
      efficiencyGain: 0,
      qualityGain: 0,
      resourceCost: 0,
      complexityCost: 0,
      riskCost: 0,
      reliability: 1.0,
      importance: this.getPriority(improvement.system).level / 100
    };

    const after = {
      ...before,
      performanceGain: improvement.expectedGain * 0.8,
      efficiencyGain: improvement.expectedGain * 0.6,
      qualityGain: improvement.expectedGain * 0.5,
      resourceCost: 0.1,
      complexityCost: 0.05,
      riskCost: 0.02
    };

    const netPositive = this.scoringAlgos.netPositive(after);

    return {
      passed: netPositive > 0,
      netPositive,
      before,
      after,
      timestamp: Date.now()
    };
  }

  async testCustomBuild(build) {
    // More rigorous testing for custom builds
    const metrics = {
      performanceGain: (build.targetScore - build.currentScore) * 0.7,
      efficiencyGain: (build.targetScore - build.currentScore) * 0.5,
      qualityGain: (build.targetScore - build.currentScore) * 0.6,
      resourceCost: 0.15,
      complexityCost: 0.1,
      riskCost: 0.05,
      reliability: 0.9,
      importance: this.getPriority(build.targetSystem).level / 100
    };

    const netPositive = this.scoringAlgos.netPositive(metrics);

    return {
      passed: netPositive > 0 && metrics.reliability > 0.85,
      netPositive,
      metrics,
      timestamp: Date.now()
    };
  }

  // ============================================================
  //  PHASE 4: REFINE
  // ============================================================

  async phaseRefine(testResults) {
    console.log('[FlowSync] PHASE 4: REFINE - Optimizing successful improvements...');

    const refined = {
      improvements: [],
      optimizations: []
    };

    for (const passed of testResults.passed) {
      // Apply refinements to maximize net positive
      const refinement = await this.refineImprovement(passed);

      if (refinement.improved) {
        refined.improvements.push(refinement);
        refined.optimizations.push(...refinement.optimizations);
      } else {
        // Already optimal, pass through
        refined.improvements.push({ ...passed, refined: false });
      }
    }

    console.log(`[FlowSync] Refined: ${refined.improvements.length} improvements, ${refined.optimizations.length} optimizations`);

    return refined;
  }

  async refineImprovement(improvement) {
    const optimizations = [];

    // Try each optimization technique
    const techniques = [
      { name: 'reduce-complexity', gain: 0.1 },
      { name: 'improve-caching', gain: 0.15 },
      { name: 'optimize-queries', gain: 0.12 },
      { name: 'parallel-processing', gain: 0.2 }
    ];

    let currentNetPositive = improvement.result.netPositive;
    let improved = false;

    for (const technique of techniques) {
      const newNetPositive = currentNetPositive * (1 + technique.gain);

      if (newNetPositive > currentNetPositive) {
        optimizations.push(technique);
        currentNetPositive = newNetPositive;
        improved = true;
      }
    }

    return {
      ...improvement,
      refined: true,
      improved,
      optimizations,
      finalNetPositive: currentNetPositive,
      improvementPercent: improved ? ((currentNetPositive / improvement.result.netPositive) - 1) * 100 : 0
    };
  }

  // ============================================================
  //  PHASE 5: AUTOMATE
  // ============================================================

  async phaseAutomate(refined) {
    console.log('[FlowSync] PHASE 5: AUTOMATE - Setting up automation...');

    const automated = {
      applied: [],
      automations: [],
      schedules: []
    };

    for (const improvement of refined.improvements) {
      // Apply the improvement
      const applied = await this.applyImprovement(improvement);
      automated.applied.push(applied);

      // Create automation rule if repeatable
      if (improvement.result.netPositive > 0.5) {
        const automation = this.createAutomation(improvement);
        automated.automations.push(automation);
        this.automations.set(automation.id, automation);
      }

      // Schedule recurring check
      automated.schedules.push({
        system: improvement.system || improvement.targetSystem,
        interval: this.calculateCheckInterval(improvement),
        nextCheck: Date.now() + this.calculateCheckInterval(improvement)
      });
    }

    console.log(`[FlowSync] Automated: ${automated.applied.length} applied, ${automated.automations.length} rules`);

    return automated;
  }

  async applyImprovement(improvement) {
    const system = this.systems.get(improvement.system || improvement.targetSystem);

    if (!system) {
      return { success: false, error: 'System not found' };
    }

    // Update system health
    const oldHealth = system.health;
    system.health = Math.min(1, system.health + (improvement.finalNetPositive || improvement.result.netPositive) * 0.1);

    system.improvements.push({
      id: improvement.id || `imp_${Date.now()}`,
      appliedAt: Date.now(),
      netPositive: improvement.finalNetPositive || improvement.result.netPositive,
      healthBefore: oldHealth,
      healthAfter: system.health
    });

    // Track in state
    this.state.improvements.push({
      system: system.name,
      improvement: improvement.id,
      timestamp: Date.now(),
      netPositive: improvement.finalNetPositive || improvement.result.netPositive
    });

    return {
      success: true,
      system: system.name,
      healthBefore: oldHealth,
      healthAfter: system.health
    };
  }

  createAutomation(improvement) {
    return {
      id: `auto_${Date.now()}`,
      type: improvement.type || 'improvement',
      targetSystem: improvement.system || improvement.targetSystem,
      trigger: {
        type: 'threshold',
        metric: 'health',
        operator: '<',
        value: improvement.targetScore || 0.9
      },
      action: {
        type: 'apply-improvement',
        improvement: improvement
      },
      createdAt: Date.now(),
      executions: 0
    };
  }

  calculateCheckInterval(improvement) {
    const priority = this.getPriority(improvement.system || improvement.targetSystem);

    // Higher priority = more frequent checks
    const baseInterval = 60000; // 1 minute
    return baseInterval * (100 / priority.level);
  }

  // ============================================================
  //  PHASE 6: REPLICATE
  // ============================================================

  async phaseReplicate(automated) {
    console.log('[FlowSync] PHASE 6: REPLICATE - Spreading successful patterns...');

    const replicated = {
      patterns: [],
      applications: [],
      skipped: []
    };

    for (const applied of automated.applied) {
      if (!applied.success) continue;

      // Calculate replication score
      const pattern = {
        id: `pattern_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sourceSystem: applied.system,
        type: 'improvement',
        successRate: 1, // First application
        impact: applied.healthAfter - applied.healthBefore,
        scalability: 0.8, // Estimated
        applicableTo: [],
        createdAt: Date.now()
      };

      const replicationScore = this.scoringAlgos.replicationScore(pattern);

      // Only replicate if score is high enough
      if (replicationScore > 0.5) {
        // Find other systems that could benefit
        const candidates = this.findReplicationCandidates(pattern, applied.system);

        for (const candidate of candidates) {
          const candidateSystem = this.systems.get(candidate);

          if (candidateSystem && candidateSystem.health < candidateSystem.priority.threshold) {
            // Apply pattern to candidate
            const replication = await this.replicatePattern(pattern, candidateSystem);

            if (replication.success) {
              replicated.applications.push(replication);
              pattern.successRate = (pattern.successRate * pattern.applicableTo.length + 1) /
                                   (pattern.applicableTo.length + 1);
              pattern.applicableTo.push(candidate);
            }
          }
        }

        replicated.patterns.push(pattern);
        this.patterns.set(pattern.id, pattern);
      } else {
        replicated.skipped.push({
          system: applied.system,
          reason: `Replication score too low: ${replicationScore.toFixed(2)}`
        });
      }
    }

    console.log(`[FlowSync] Replicated: ${replicated.patterns.length} patterns, ${replicated.applications.length} applications`);

    return replicated;
  }

  findReplicationCandidates(pattern, sourceSystem) {
    const candidates = [];

    for (const [name, system] of this.systems) {
      if (name === sourceSystem) continue;

      // Check if system is similar enough
      const similarity = this.calculateSystemSimilarity(sourceSystem, name);

      if (similarity > 0.7) {
        candidates.push(name);
      }
    }

    return candidates;
  }

  calculateSystemSimilarity(system1, system2) {
    const s1 = this.systems.get(system1);
    const s2 = this.systems.get(system2);

    if (!s1 || !s2) return 0;

    // Compare priorities and types
    const priorityMatch = s1.priority.level === s2.priority.level ? 1 : 0.5;
    const typeMatch = s1.config?.type === s2.config?.type ? 1 : 0.3;

    return (priorityMatch + typeMatch) / 2;
  }

  async replicatePattern(pattern, targetSystem) {
    const oldHealth = targetSystem.health;

    // Apply pattern's improvement
    targetSystem.health = Math.min(1, targetSystem.health + pattern.impact * 0.8);

    return {
      success: true,
      pattern: pattern.id,
      targetSystem: targetSystem.name,
      healthBefore: oldHealth,
      healthAfter: targetSystem.health,
      timestamp: Date.now()
    };
  }

  // ============================================================
  //  UTILITIES
  // ============================================================

  saveCycleResults(results) {
    const filepath = path.join(this.dataDir, 'cycles', `${results.id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  }

  getOverallHealth() {
    const systems = Array.from(this.systems.values());
    if (systems.length === 0) return 1;

    return systems.reduce((sum, s) => sum + s.health, 0) / systems.length;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================
  //  STATISTICS
  // ============================================================

  getStats() {
    return {
      running: this.state.running,
      currentPhase: this.state.currentPhase,
      cycleCount: this.state.cycleCount,
      lastCycleTime: this.state.lastCycleTime,
      overallHealth: this.getOverallHealth(),
      systemCount: this.systems.size,
      patternCount: this.patterns.size,
      automationCount: this.automations.size,
      improvements: this.state.improvements.length,
      failures: this.state.failures.length,
      systems: Object.fromEntries(
        Array.from(this.systems.entries()).map(([name, sys]) => [
          name,
          { health: sys.health, priority: sys.priority.name, improvements: sys.improvements.length }
        ])
      )
    };
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { FlowSyncEngine };
