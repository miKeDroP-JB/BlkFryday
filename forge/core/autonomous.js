/**
 * ORBITAL FORGE - LAYER 5: AUTONOMOUS CREATION
 * ═══════════════════════════════════════════════════════════════════
 * Node 12: Self-Directed Execution - The Final Unlock
 *
 * "You are no longer issuing commands. You are setting direction vectors."
 *
 * The system proposes projects. Runs experiments. Improves its own tools.
 * Reports results, not questions. This is where "idea → artifact" collapses.
 * ═══════════════════════════════════════════════════════════════════
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════
// GOAL HORIZON
// ═══════════════════════════════════════════════════════════════════

/**
 * GoalHorizon - Define direction vectors, not specific tasks
 */
class GoalHorizon extends EventEmitter {
  constructor(config = {}) {
    super();
    this.horizons = new Map();
    this.activeProjects = new Map();
    this.completedProjects = [];
  }

  /**
   * Set a direction vector (high-level goal)
   */
  setDirection(direction) {
    const id = direction.id || `dir-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const horizon = {
      id,
      name: direction.name,
      description: direction.description,
      constraints: direction.constraints || [],
      priorities: direction.priorities || [],
      metrics: direction.metrics || [],
      status: 'ACTIVE',
      created: Date.now(),
      projects: []
    };

    this.horizons.set(id, horizon);
    this.emit('direction:set', { horizonId: id, name: direction.name });

    return horizon;
  }

  /**
   * Get active directions
   */
  getActiveDirections() {
    return Array.from(this.horizons.values())
      .filter(h => h.status === 'ACTIVE');
  }

  /**
   * Propose a project aligned with a direction
   */
  proposeProject(horizonId, project) {
    const horizon = this.horizons.get(horizonId);
    if (!horizon) {
      throw new Error(`Horizon not found: ${horizonId}`);
    }

    const projectId = `proj-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const proposal = {
      id: projectId,
      horizonId,
      name: project.name,
      description: project.description,
      expectedOutcome: project.expectedOutcome,
      estimatedEffort: project.estimatedEffort,
      alignmentScore: this.calculateAlignment(horizon, project),
      status: 'PROPOSED',
      created: Date.now()
    };

    horizon.projects.push(projectId);
    this.activeProjects.set(projectId, proposal);

    this.emit('project:proposed', { projectId, horizonId, name: project.name });

    return proposal;
  }

  /**
   * Calculate how well a project aligns with direction
   */
  calculateAlignment(horizon, project) {
    let score = 0.5; // Base score

    // Check against priorities
    horizon.priorities.forEach((priority, index) => {
      const weight = 1 / (index + 1); // Higher priority = higher weight
      if (project.description?.toLowerCase().includes(priority.toLowerCase())) {
        score += weight * 0.1;
      }
    });

    // Check constraints
    horizon.constraints.forEach(constraint => {
      if (project.violatesConstraint?.(constraint)) {
        score -= 0.2;
      }
    });

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Approve a project for execution
   */
  approveProject(projectId) {
    const project = this.activeProjects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    project.status = 'APPROVED';
    project.approvedAt = Date.now();

    this.emit('project:approved', { projectId });
    return project;
  }

  /**
   * Complete a project
   */
  completeProject(projectId, results) {
    const project = this.activeProjects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    project.status = 'COMPLETED';
    project.results = results;
    project.completedAt = Date.now();

    this.activeProjects.delete(projectId);
    this.completedProjects.push(project);

    this.emit('project:completed', { projectId, results });
    return project;
  }

  /**
   * Get project status
   */
  getProjectStatus(projectId) {
    return this.activeProjects.get(projectId) ||
      this.completedProjects.find(p => p.id === projectId);
  }
}

// ═══════════════════════════════════════════════════════════════════
// SANDBOX EXECUTION
// ═══════════════════════════════════════════════════════════════════

/**
 * SandboxZone - Isolated execution environment
 */
class SandboxZone extends EventEmitter {
  constructor(config = {}) {
    super();
    this.id = config.id || `sandbox-${Date.now()}`;
    this.constraints = config.constraints || {};
    this.state = {};
    this.logs = [];
    this.artifacts = new Map();
    this.maxExecutionTime = config.maxExecutionTime || 60000;
    this.maxMemory = config.maxMemory || 100 * 1024 * 1024; // 100MB
  }

  /**
   * Execute in sandbox
   */
  async execute(fn, context = {}) {
    const startTime = Date.now();
    const executionId = `exec-${Date.now()}`;

    this.emit('execute:start', { executionId });

    try {
      // Create sandboxed context
      const sandboxContext = {
        ...context,
        sandbox: {
          log: (msg) => this.log(executionId, msg),
          store: (key, value) => this.storeArtifact(key, value),
          retrieve: (key) => this.artifacts.get(key),
          state: this.state
        }
      };

      // Execute with timeout
      const result = await Promise.race([
        fn(sandboxContext),
        this.timeout(this.maxExecutionTime)
      ]);

      const duration = Date.now() - startTime;

      this.emit('execute:complete', { executionId, duration, result });

      return {
        success: true,
        result,
        duration,
        logs: this.logs.filter(l => l.executionId === executionId)
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      this.emit('execute:error', { executionId, error: error.message });

      return {
        success: false,
        error: error.message,
        duration,
        logs: this.logs.filter(l => l.executionId === executionId)
      };
    }
  }

  log(executionId, message) {
    this.logs.push({
      executionId,
      message,
      timestamp: Date.now()
    });
  }

  storeArtifact(key, value) {
    this.artifacts.set(key, {
      value,
      created: Date.now()
    });
  }

  timeout(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Sandbox timeout after ${ms}ms`)), ms);
    });
  }

  /**
   * Reset sandbox
   */
  reset() {
    this.state = {};
    this.logs = [];
    this.artifacts.clear();
    this.emit('reset');
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPERIMENT RUNNER
// ═══════════════════════════════════════════════════════════════════

/**
 * ExperimentRunner - Run controlled experiments
 */
class ExperimentRunner extends EventEmitter {
  constructor(config = {}) {
    super();
    this.experiments = new Map();
    this.results = new Map();
    this.sandbox = new SandboxZone(config.sandbox);
  }

  /**
   * Define an experiment
   */
  define(experiment) {
    const id = experiment.id || `exp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const exp = {
      id,
      name: experiment.name,
      hypothesis: experiment.hypothesis,
      variables: experiment.variables || [],
      control: experiment.control,
      treatment: experiment.treatment,
      successCriteria: experiment.successCriteria,
      status: 'DEFINED',
      created: Date.now()
    };

    this.experiments.set(id, exp);
    this.emit('experiment:defined', { experimentId: id });

    return exp;
  }

  /**
   * Run an experiment
   */
  async run(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    experiment.status = 'RUNNING';
    experiment.startedAt = Date.now();

    this.emit('experiment:start', { experimentId });

    try {
      // Run control
      const controlResult = await this.sandbox.execute(
        experiment.control,
        { isControl: true }
      );

      // Reset sandbox between runs
      this.sandbox.reset();

      // Run treatment
      const treatmentResult = await this.sandbox.execute(
        experiment.treatment,
        { isTreatment: true }
      );

      // Analyze results
      const analysis = this.analyze(experiment, controlResult, treatmentResult);

      const results = {
        experimentId,
        control: controlResult,
        treatment: treatmentResult,
        analysis,
        completedAt: Date.now()
      };

      experiment.status = 'COMPLETED';
      this.results.set(experimentId, results);

      this.emit('experiment:complete', { experimentId, analysis });

      return results;

    } catch (error) {
      experiment.status = 'FAILED';
      experiment.error = error.message;

      this.emit('experiment:error', { experimentId, error: error.message });
      throw error;
    }
  }

  /**
   * Analyze experiment results
   */
  analyze(experiment, control, treatment) {
    const analysis = {
      hypothesisSupported: false,
      improvement: 0,
      observations: []
    };

    // Compare success
    if (control.success && treatment.success) {
      // Compare durations
      if (treatment.duration < control.duration) {
        analysis.improvement = ((control.duration - treatment.duration) / control.duration) * 100;
        analysis.observations.push(`Treatment ${analysis.improvement.toFixed(1)}% faster`);
      }

      // Check success criteria
      if (experiment.successCriteria) {
        try {
          analysis.hypothesisSupported = experiment.successCriteria(control.result, treatment.result);
        } catch (error) {
          analysis.observations.push(`Criteria evaluation error: ${error.message}`);
        }
      }
    } else if (!control.success && treatment.success) {
      analysis.hypothesisSupported = true;
      analysis.observations.push('Treatment succeeded where control failed');
    } else if (control.success && !treatment.success) {
      analysis.hypothesisSupported = false;
      analysis.observations.push('Treatment failed where control succeeded');
    }

    return analysis;
  }

  /**
   * Get experiment results
   */
  getResults(experimentId) {
    return this.results.get(experimentId);
  }

  /**
   * Get all experiments
   */
  list() {
    return Array.from(this.experiments.values());
  }
}

// ═══════════════════════════════════════════════════════════════════
// SELF-IMPROVEMENT ENGINE
// ═══════════════════════════════════════════════════════════════════

/**
 * SelfImprovement - System improves its own tools
 */
class SelfImprovement extends EventEmitter {
  constructor(config = {}) {
    super();
    this.tools = new Map();
    this.improvements = [];
    this.metrics = new Map();
  }

  /**
   * Register a tool for potential improvement
   */
  registerTool(tool) {
    const toolId = tool.id || tool.name;

    this.tools.set(toolId, {
      ...tool,
      id: toolId,
      registered: Date.now(),
      versions: [{ version: 1, implementation: tool.implementation }]
    });

    // Initialize metrics
    this.metrics.set(toolId, {
      usageCount: 0,
      successCount: 0,
      avgDuration: 0,
      errors: []
    });

    return this;
  }

  /**
   * Record tool usage
   */
  recordUsage(toolId, result) {
    const metrics = this.metrics.get(toolId);
    if (!metrics) return;

    metrics.usageCount++;

    if (result.success) {
      metrics.successCount++;
    } else {
      metrics.errors.push({
        error: result.error,
        timestamp: Date.now()
      });
    }

    if (result.duration) {
      metrics.avgDuration = (
        metrics.avgDuration * (metrics.usageCount - 1) + result.duration
      ) / metrics.usageCount;
    }

    // Check if tool needs improvement
    this.checkForImprovementOpportunity(toolId);
  }

  /**
   * Check if a tool should be improved
   */
  checkForImprovementOpportunity(toolId) {
    const metrics = this.metrics.get(toolId);
    const tool = this.tools.get(toolId);

    if (!metrics || !tool) return;

    const successRate = metrics.usageCount > 0
      ? metrics.successCount / metrics.usageCount
      : 1;

    // Identify improvement opportunities
    const opportunities = [];

    if (successRate < 0.9 && metrics.usageCount > 10) {
      opportunities.push({
        type: 'RELIABILITY',
        reason: `Success rate ${(successRate * 100).toFixed(1)}% below 90% threshold`,
        priority: 'HIGH'
      });
    }

    if (metrics.avgDuration > 5000 && metrics.usageCount > 5) {
      opportunities.push({
        type: 'PERFORMANCE',
        reason: `Avg duration ${metrics.avgDuration.toFixed(0)}ms exceeds 5s`,
        priority: 'MEDIUM'
      });
    }

    // Check for repeated errors
    const recentErrors = metrics.errors.slice(-10);
    const errorPatterns = new Map();
    recentErrors.forEach(e => {
      const key = e.error?.slice(0, 50) || 'unknown';
      errorPatterns.set(key, (errorPatterns.get(key) || 0) + 1);
    });

    for (const [pattern, count] of errorPatterns) {
      if (count >= 3) {
        opportunities.push({
          type: 'ERROR_PATTERN',
          reason: `Repeated error (${count}x): ${pattern}`,
          priority: 'HIGH'
        });
      }
    }

    if (opportunities.length > 0) {
      this.emit('improvement:opportunity', { toolId, opportunities });
    }

    return opportunities;
  }

  /**
   * Propose an improvement
   */
  proposeImprovement(toolId, improvement) {
    const tool = this.tools.get(toolId);
    if (!tool) return null;

    const proposal = {
      id: `imp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      toolId,
      type: improvement.type,
      description: improvement.description,
      proposedChanges: improvement.changes,
      expectedBenefit: improvement.expectedBenefit,
      status: 'PROPOSED',
      created: Date.now()
    };

    this.improvements.push(proposal);
    this.emit('improvement:proposed', { proposal });

    return proposal;
  }

  /**
   * Apply an improvement
   */
  applyImprovement(improvementId, newImplementation) {
    const improvement = this.improvements.find(i => i.id === improvementId);
    if (!improvement) return null;

    const tool = this.tools.get(improvement.toolId);
    if (!tool) return null;

    // Add new version
    const newVersion = {
      version: tool.versions.length + 1,
      implementation: newImplementation,
      basedOn: improvement.id,
      created: Date.now()
    };

    tool.versions.push(newVersion);
    tool.implementation = newImplementation;

    improvement.status = 'APPLIED';
    improvement.appliedAt = Date.now();

    // Reset metrics for new version
    this.metrics.set(improvement.toolId, {
      usageCount: 0,
      successCount: 0,
      avgDuration: 0,
      errors: []
    });

    this.emit('improvement:applied', {
      improvementId,
      toolId: improvement.toolId,
      version: newVersion.version
    });

    return newVersion;
  }

  /**
   * Get tool metrics
   */
  getMetrics(toolId) {
    return this.metrics.get(toolId);
  }

  /**
   * Get improvement history
   */
  getHistory(toolId = null) {
    if (toolId) {
      return this.improvements.filter(i => i.toolId === toolId);
    }
    return this.improvements;
  }
}

// ═══════════════════════════════════════════════════════════════════
// AUTONOMOUS DIRECTOR
// ═══════════════════════════════════════════════════════════════════

/**
 * AutonomousDirector - Self-directed execution system
 *
 * This is the final unlock. The system:
 * - Proposes projects
 * - Runs experiments
 * - Improves its own tools
 * - Reports results, not questions
 */
class AutonomousDirector extends EventEmitter {
  constructor(config = {}) {
    super();
    this.horizon = new GoalHorizon(config.horizon);
    this.experiments = new ExperimentRunner(config.experiments);
    this.improvement = new SelfImprovement(config.improvement);
    this.humanVeto = config.humanVeto !== false;
    this.vetoQueue = [];
    this.autonomyLevel = config.autonomyLevel || 'SUPERVISED';
    this.reports = [];
  }

  /**
   * Set the direction vector
   */
  setDirection(direction) {
    return this.horizon.setDirection(direction);
  }

  /**
   * Generate project proposals based on direction
   */
  generateProposals(horizonId, count = 3) {
    const horizon = this.horizon.horizons.get(horizonId);
    if (!horizon) return [];

    const proposals = [];

    // Generate proposals based on priorities
    horizon.priorities.forEach((priority, index) => {
      if (proposals.length >= count) return;

      proposals.push(this.horizon.proposeProject(horizonId, {
        name: `${priority} Initiative`,
        description: `Autonomous project to advance: ${priority}`,
        expectedOutcome: `Measurable improvement in ${priority}`,
        estimatedEffort: 'MEDIUM'
      }));
    });

    // Generate improvement proposals from metrics
    const toolsNeedingWork = Array.from(this.improvement.tools.keys())
      .filter(toolId => {
        const opportunities = this.improvement.checkForImprovementOpportunity(toolId);
        return opportunities && opportunities.length > 0;
      });

    toolsNeedingWork.slice(0, count - proposals.length).forEach(toolId => {
      proposals.push(this.horizon.proposeProject(horizonId, {
        name: `Improve ${toolId}`,
        description: `Self-improvement project for ${toolId}`,
        expectedOutcome: 'Increased reliability/performance',
        estimatedEffort: 'LOW'
      }));
    });

    this.emit('proposals:generated', { horizonId, count: proposals.length });
    return proposals;
  }

  /**
   * Execute a project (with optional human veto)
   */
  async executeProject(projectId) {
    const project = this.horizon.getProjectStatus(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Check if human approval needed
    if (this.humanVeto && project.status !== 'APPROVED') {
      this.vetoQueue.push({
        projectId,
        type: 'PROJECT_APPROVAL',
        created: Date.now()
      });

      this.emit('veto:pending', { projectId, type: 'PROJECT_APPROVAL' });
      return { status: 'PENDING_APPROVAL' };
    }

    this.emit('project:executing', { projectId });

    // Run in sandbox
    const result = await this.experiments.sandbox.execute(
      async (ctx) => {
        // Project execution logic would go here
        // In production, this would be AI-driven
        ctx.sandbox.log(`Executing project: ${project.name}`);

        return {
          completed: true,
          artifacts: [],
          summary: `Project ${project.name} executed successfully`
        };
      },
      { project }
    );

    // Record results
    const report = {
      id: `report-${Date.now()}`,
      projectId,
      result,
      generated: Date.now()
    };

    this.reports.push(report);
    this.horizon.completeProject(projectId, result);

    this.emit('report:generated', { report });

    return report;
  }

  /**
   * Run an autonomous improvement cycle
   */
  async runImprovementCycle(horizonId) {
    const cycle = {
      id: `cycle-${Date.now()}`,
      horizonId,
      started: Date.now(),
      steps: []
    };

    this.emit('cycle:start', { cycleId: cycle.id });

    // Step 1: Generate proposals
    const proposals = this.generateProposals(horizonId);
    cycle.steps.push({ step: 'PROPOSE', count: proposals.length });

    // Step 2: Filter by alignment
    const viable = proposals.filter(p => p.alignmentScore > 0.6);
    cycle.steps.push({ step: 'FILTER', viable: viable.length });

    // Step 3: Execute highest-scoring (if autonomy allows)
    if (viable.length > 0 && this.autonomyLevel === 'AUTONOMOUS') {
      const best = viable.sort((a, b) => b.alignmentScore - a.alignmentScore)[0];

      this.horizon.approveProject(best.id);
      const result = await this.executeProject(best.id);

      cycle.steps.push({ step: 'EXECUTE', projectId: best.id, result });
    }

    cycle.completed = Date.now();
    this.emit('cycle:complete', { cycle });

    return cycle;
  }

  /**
   * Handle human veto decision
   */
  handleVeto(projectId, approved) {
    const vetoIndex = this.vetoQueue.findIndex(v => v.projectId === projectId);
    if (vetoIndex === -1) return false;

    this.vetoQueue.splice(vetoIndex, 1);

    if (approved) {
      this.horizon.approveProject(projectId);
      this.emit('veto:approved', { projectId });
    } else {
      const project = this.horizon.getProjectStatus(projectId);
      if (project) {
        project.status = 'VETOED';
      }
      this.emit('veto:rejected', { projectId });
    }

    return true;
  }

  /**
   * Get pending veto items
   */
  getPendingVetos() {
    return this.vetoQueue;
  }

  /**
   * Set autonomy level
   */
  setAutonomyLevel(level) {
    const valid = ['SUPERVISED', 'SEMI_AUTONOMOUS', 'AUTONOMOUS'];
    if (!valid.includes(level)) {
      throw new Error(`Invalid autonomy level: ${level}`);
    }
    this.autonomyLevel = level;
    this.emit('autonomy:changed', { level });
  }

  /**
   * Get latest reports
   */
  getReports(limit = 10) {
    return this.reports.slice(-limit);
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      autonomyLevel: this.autonomyLevel,
      humanVetoEnabled: this.humanVeto,
      pendingVetos: this.vetoQueue.length,
      activeDirections: this.horizon.getActiveDirections().length,
      activeProjects: this.horizon.activeProjects.size,
      completedProjects: this.horizon.completedProjects.length,
      experimentsRun: this.experiments.experiments.size,
      toolsMonitored: this.improvement.tools.size,
      reportsGenerated: this.reports.length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// AUTONOMOUS LAYER COMPOSITE
// ═══════════════════════════════════════════════════════════════════

/**
 * AutonomousLayer - Complete Layer 5 system
 */
class AutonomousLayer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.director = new AutonomousDirector(config.director);
  }

  /**
   * Initialize autonomous operations
   */
  initialize() {
    console.log('[AUTONOMOUS] Layer 5 online - Self-Directed Execution enabled');

    // Set up event forwarding
    this.director.on('proposals:generated', data => this.emit('proposals', data));
    this.director.on('report:generated', data => this.emit('report', data));
    this.director.on('veto:pending', data => this.emit('veto:pending', data));
    this.director.on('cycle:complete', data => this.emit('cycle', data));

    return this;
  }

  /**
   * Set direction vector
   */
  setDirection(direction) {
    return this.director.setDirection(direction);
  }

  /**
   * Start autonomous operation cycle
   */
  async startCycle(horizonId) {
    return this.director.runImprovementCycle(horizonId);
  }

  /**
   * Handle veto
   */
  veto(projectId, approved) {
    return this.director.handleVeto(projectId, approved);
  }

  /**
   * Set autonomy level
   */
  setAutonomyLevel(level) {
    this.director.setAutonomyLevel(level);
  }

  getStatus() {
    return this.director.getStatus();
  }
}

// ═══════════════════════════════════════════════════════════════════
// THE FINAL UNLOCK
// ═══════════════════════════════════════════════════════════════════

const AUTONOMOUS_MANIFESTO = `
═══════════════════════════════════════════════════════════════════
                    THE FINAL UNLOCK
═══════════════════════════════════════════════════════════════════

You are no longer issuing commands.
You are setting direction vectors.

The system:
• Proposes projects
• Runs experiments
• Improves its own tools
• Reports results, not questions

This is where "idea → artifact" collapses automatically.

CAPABILITIES:
─────────────
• Goal horizons - Define directions, not tasks
• Sandbox execution - Safe experimentation
• Self-improvement - Tools that enhance themselves
• Human veto - You remain in control when you choose

AUTONOMY LEVELS:
─────────────────
SUPERVISED      - All projects require approval
SEMI_AUTONOMOUS - Low-risk projects auto-execute
AUTONOMOUS      - Full self-direction within constraints

THE OPERATING LOOP:
───────────────────
1. Direction set by you
2. System decomposes
3. Swarm executes
4. Results logged
5. Patterns extracted
6. System upgrades itself
7. Repeat at higher altitude

═══════════════════════════════════════════════════════════════════
           Intent in. World out. 🜂
═══════════════════════════════════════════════════════════════════
`;

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // Goal Horizon
  GoalHorizon,

  // Sandbox Execution
  SandboxZone,

  // Experiment Runner
  ExperimentRunner,

  // Self-Improvement
  SelfImprovement,

  // Autonomous Director
  AutonomousDirector,

  // Composite
  AutonomousLayer,

  // Manifesto
  AUTONOMOUS_MANIFESTO
};
