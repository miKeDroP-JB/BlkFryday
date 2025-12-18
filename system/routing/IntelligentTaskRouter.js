// ============================================================
//  ORBOS V11.5 - INTELLIGENT TASK ROUTER
//  The brain that decides which agents handle what
// ============================================================
//
//  Routes tasks to optimal agents/providers based on:
//  - Task type and complexity
//  - Agent specializations
//  - Provider strengths
//  - Current load and availability
//  - Historical performance
//  - Cost optimization
//
// ============================================================

const crypto = require('crypto');

class IntelligentTaskRouter {
  constructor(config = {}) {
    this.config = config;

    // Agent registry - all 1007 agents organized by swarm
    this.swarms = {
      reasoning: { agents: [], capacity: 100, specialty: ['logic', 'math', 'analysis'] },
      coding: { agents: [], capacity: 150, specialty: ['javascript', 'python', 'rust', 'go'] },
      research: { agents: [], capacity: 100, specialty: ['search', 'summarize', 'cite'] },
      creative: { agents: [], capacity: 100, specialty: ['writing', 'ideation', 'design'] },
      voice: { agents: [], capacity: 100, specialty: ['speech', 'audio', 'transcription'] },
      vision: { agents: [], capacity: 100, specialty: ['image', 'video', 'ocr'] },
      data: { agents: [], capacity: 150, specialty: ['etl', 'analytics', 'visualization'] },
      security: { agents: [], capacity: 100, specialty: ['audit', 'scan', 'encrypt'] },
      orchestration: { agents: [], capacity: 57, specialty: ['coordinate', 'schedule', 'monitor'] },
      learning: { agents: [], capacity: 50, specialty: ['train', 'fine-tune', 'optimize'] }
    };

    // Provider performance metrics
    this.providerMetrics = new Map();

    // Task patterns learned
    this.taskPatterns = new Map();

    // Routing rules
    this.rules = this.initializeRules();

    // Task queue
    this.queue = [];
    this.processing = new Map();

    // Initialize agents
    this.initializeAgents();

    console.log(`[TaskRouter] Initialized with ${this.getTotalAgents()} agents across ${Object.keys(this.swarms).length} swarms`);
  }

  initializeAgents() {
    // Create agents for each swarm based on capacity
    for (const [swarmName, swarm] of Object.entries(this.swarms)) {
      for (let i = 0; i < swarm.capacity; i++) {
        swarm.agents.push({
          id: `${swarmName}_agent_${i}`,
          swarm: swarmName,
          status: 'idle',
          tasksCompleted: 0,
          avgLatency: 0,
          successRate: 1.0,
          specialty: swarm.specialty,
          currentTask: null
        });
      }
    }
  }

  getTotalAgents() {
    return Object.values(this.swarms).reduce((sum, s) => sum + s.agents.length, 0);
  }

  initializeRules() {
    return {
      // Task type -> preferred swarms & providers
      'code-generation': {
        swarms: ['coding'],
        providers: ['codestral', 'deepseek', 'anthropic', 'openai'],
        parallel: true,
        tournament: true
      },
      'code-review': {
        swarms: ['coding', 'security'],
        providers: ['anthropic', 'openai'],
        sequential: true
      },
      'code-debug': {
        swarms: ['coding', 'reasoning'],
        providers: ['anthropic', 'openai', 'groq'],
        parallel: true
      },
      'text-generation': {
        swarms: ['creative'],
        providers: ['anthropic', 'openai', 'mistral'],
        tournament: true
      },
      'summarization': {
        swarms: ['research'],
        providers: ['anthropic', 'mistral', 'cohere'],
        single: true
      },
      'translation': {
        swarms: ['creative'],
        providers: ['google', 'anthropic', 'openai'],
        single: true
      },
      'math': {
        swarms: ['reasoning'],
        providers: ['anthropic', 'openai', 'google'],
        tournament: true
      },
      'research': {
        swarms: ['research'],
        providers: ['perplexity', 'anthropic'],
        parallel: true
      },
      'data-analysis': {
        swarms: ['data', 'reasoning'],
        providers: ['anthropic', 'openai'],
        sequential: true
      },
      'image-analysis': {
        swarms: ['vision'],
        providers: ['openai', 'anthropic', 'google'],
        single: true
      },
      'voice-processing': {
        swarms: ['voice'],
        providers: ['openai', 'elevenlabs', 'whisper'],
        single: true
      },
      'security-audit': {
        swarms: ['security', 'coding'],
        providers: ['anthropic', 'openai'],
        parallel: true
      },
      'orchestration': {
        swarms: ['orchestration'],
        providers: ['anthropic'],
        single: true
      },
      'training': {
        swarms: ['learning'],
        providers: ['together', 'replicate'],
        single: true
      }
    };
  }

  // ============================================================
  //  TASK CLASSIFICATION
  // ============================================================

  classifyTask(task) {
    const { prompt, context, hints } = task;
    const textLower = prompt.toLowerCase();

    // Classification rules based on keywords and patterns
    const classifications = [
      {
        type: 'code-generation',
        patterns: [/write.*code/i, /create.*function/i, /implement/i, /build.*component/i, /```/]
      },
      {
        type: 'code-review',
        patterns: [/review.*code/i, /check.*code/i, /audit/i, /improve.*code/i]
      },
      {
        type: 'code-debug',
        patterns: [/fix.*bug/i, /debug/i, /error/i, /not working/i, /broken/i]
      },
      {
        type: 'text-generation',
        patterns: [/write.*article/i, /create.*content/i, /blog.*post/i, /essay/i]
      },
      {
        type: 'summarization',
        patterns: [/summarize/i, /summary/i, /tldr/i, /key points/i]
      },
      {
        type: 'translation',
        patterns: [/translate/i, /convert.*language/i, /in.*language/i]
      },
      {
        type: 'math',
        patterns: [/calculate/i, /solve/i, /equation/i, /math/i, /\d+[\+\-\*\/]\d+/]
      },
      {
        type: 'research',
        patterns: [/research/i, /find.*information/i, /what.*is/i, /explain/i, /search/i]
      },
      {
        type: 'data-analysis',
        patterns: [/analyze.*data/i, /statistics/i, /trend/i, /chart/i, /visualization/i]
      },
      {
        type: 'image-analysis',
        patterns: [/image/i, /picture/i, /photo/i, /visual/i, /describe.*image/i]
      },
      {
        type: 'voice-processing',
        patterns: [/audio/i, /voice/i, /speech/i, /transcribe/i, /speak/i]
      },
      {
        type: 'security-audit',
        patterns: [/security/i, /vulnerability/i, /penetration/i, /scan/i, /secure/i]
      }
    ];

    // Score each classification
    const scores = classifications.map(c => ({
      type: c.type,
      score: c.patterns.reduce((sum, p) => sum + (p.test(textLower) ? 1 : 0), 0)
    }));

    // Get best match
    const best = scores.sort((a, b) => b.score - a.score)[0];

    // Use hints if provided
    if (hints?.taskType) {
      return hints.taskType;
    }

    return best.score > 0 ? best.type : 'research'; // Default to research
  }

  estimateComplexity(task) {
    const { prompt } = task;

    let complexity = 1;

    // Length factor
    if (prompt.length > 1000) complexity += 1;
    if (prompt.length > 3000) complexity += 1;

    // Code blocks
    const codeBlocks = (prompt.match(/```/g) || []).length / 2;
    complexity += Math.min(codeBlocks, 3);

    // Multiple requirements
    const bullets = (prompt.match(/^[-*•]\s/gm) || []).length;
    complexity += Math.min(bullets / 3, 2);

    // Numbers often mean specifics
    const numbers = (prompt.match(/\d+/g) || []).length;
    if (numbers > 5) complexity += 1;

    return Math.min(Math.ceil(complexity), 5); // 1-5 scale
  }

  // ============================================================
  //  ROUTING LOGIC
  // ============================================================

  async route(task) {
    const taskId = crypto.randomUUID();

    // Classify and analyze
    const taskType = this.classifyTask(task);
    const complexity = this.estimateComplexity(task);
    const rule = this.rules[taskType] || this.rules['research'];

    console.log(`[TaskRouter] Task ${taskId}: type=${taskType}, complexity=${complexity}`);

    // Get available agents from appropriate swarms
    const agents = this.getAvailableAgents(rule.swarms, complexity);

    if (agents.length === 0) {
      // Queue the task
      this.queue.push({ taskId, task, taskType, complexity, queuedAt: Date.now() });
      return {
        taskId,
        status: 'queued',
        position: this.queue.length
      };
    }

    // Select providers based on rule
    const providers = this.selectProviders(rule.providers, complexity);

    // Determine execution strategy
    const strategy = this.determineStrategy(rule, complexity);

    // Create routing plan
    const plan = {
      taskId,
      taskType,
      complexity,
      agents: agents.slice(0, Math.ceil(complexity * 2)),
      providers,
      strategy,
      estimatedLatency: this.estimateLatency(strategy, providers),
      estimatedCost: this.estimateCost(strategy, providers)
    };

    // Mark agents as busy
    plan.agents.forEach(agent => {
      agent.status = 'busy';
      agent.currentTask = taskId;
    });

    this.processing.set(taskId, plan);

    return plan;
  }

  getAvailableAgents(swarmNames, count) {
    const available = [];

    for (const swarmName of swarmNames) {
      const swarm = this.swarms[swarmName];
      if (!swarm) continue;

      const idle = swarm.agents.filter(a => a.status === 'idle');
      available.push(...idle);
    }

    // Sort by performance
    available.sort((a, b) => {
      const scoreA = a.successRate * 100 - a.avgLatency / 100;
      const scoreB = b.successRate * 100 - b.avgLatency / 100;
      return scoreB - scoreA;
    });

    return available.slice(0, count * 3); // Return 3x for redundancy
  }

  selectProviders(preferredProviders, complexity) {
    // Get provider metrics
    const scored = preferredProviders.map(p => {
      const metrics = this.providerMetrics.get(p) || {
        avgLatency: 1000,
        successRate: 0.95,
        cost: 0.01
      };

      return {
        provider: p,
        score: metrics.successRate * 100 - metrics.avgLatency / 100 - metrics.cost * 10,
        metrics
      };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Return top providers based on complexity
    const count = Math.min(complexity + 1, scored.length);
    return scored.slice(0, count).map(s => s.provider);
  }

  determineStrategy(rule, complexity) {
    // Determine execution strategy based on rule and complexity
    if (rule.tournament && complexity >= 3) {
      return 'tournament';
    }

    if (rule.parallel && complexity >= 2) {
      return 'parallel';
    }

    if (rule.sequential) {
      return 'chain';
    }

    if (complexity >= 4) {
      return 'swarm';
    }

    return 'single';
  }

  estimateLatency(strategy, providers) {
    const avgLatency = 1500; // ms base

    switch (strategy) {
      case 'single':
        return avgLatency;
      case 'parallel':
        return avgLatency; // All run at once
      case 'tournament':
        return avgLatency * 1.5; // Parallel + scoring
      case 'chain':
        return avgLatency * providers.length;
      case 'swarm':
        return avgLatency * 2;
      default:
        return avgLatency;
    }
  }

  estimateCost(strategy, providers) {
    const baseCost = 0.01; // $ per request

    switch (strategy) {
      case 'single':
        return baseCost;
      case 'parallel':
        return baseCost * providers.length;
      case 'tournament':
        return baseCost * providers.length * 1.2;
      case 'chain':
        return baseCost * providers.length;
      case 'swarm':
        return baseCost * providers.length * 3;
      default:
        return baseCost;
    }
  }

  // ============================================================
  //  TASK COMPLETION
  // ============================================================

  completeTask(taskId, result) {
    const plan = this.processing.get(taskId);
    if (!plan) return;

    // Update agent stats
    plan.agents.forEach(agent => {
      agent.status = 'idle';
      agent.currentTask = null;
      agent.tasksCompleted++;

      if (result.latency) {
        agent.avgLatency = (agent.avgLatency * (agent.tasksCompleted - 1) + result.latency) / agent.tasksCompleted;
      }

      if (result.success !== undefined) {
        agent.successRate = (agent.successRate * (agent.tasksCompleted - 1) + (result.success ? 1 : 0)) / agent.tasksCompleted;
      }
    });

    // Update provider metrics
    if (result.provider) {
      const metrics = this.providerMetrics.get(result.provider) || {
        requests: 0,
        totalLatency: 0,
        avgLatency: 1000,
        successCount: 0,
        successRate: 0.95
      };

      metrics.requests++;
      metrics.totalLatency += result.latency || 1000;
      metrics.avgLatency = metrics.totalLatency / metrics.requests;
      metrics.successCount += result.success ? 1 : 0;
      metrics.successRate = metrics.successCount / metrics.requests;

      this.providerMetrics.set(result.provider, metrics);
    }

    // Learn from task
    this.learnFromTask(plan, result);

    // Process queue
    this.processQueue();

    // Clean up
    this.processing.delete(taskId);

    return { taskId, completed: true };
  }

  learnFromTask(plan, result) {
    // Store task pattern for future optimization
    const pattern = {
      taskType: plan.taskType,
      complexity: plan.complexity,
      strategy: plan.strategy,
      providers: plan.providers,
      success: result.success,
      latency: result.latency,
      timestamp: Date.now()
    };

    const key = `${plan.taskType}_${plan.complexity}`;
    if (!this.taskPatterns.has(key)) {
      this.taskPatterns.set(key, []);
    }
    this.taskPatterns.get(key).push(pattern);

    // Keep only last 100 patterns per key
    const patterns = this.taskPatterns.get(key);
    if (patterns.length > 100) {
      this.taskPatterns.set(key, patterns.slice(-100));
    }
  }

  processQueue() {
    if (this.queue.length === 0) return;

    // Try to process queued tasks
    const toProcess = [...this.queue];
    this.queue = [];

    for (const item of toProcess) {
      const plan = this.route(item.task);
      if (plan.status === 'queued') {
        // Still can't process, re-queue
        this.queue.push(item);
      }
    }
  }

  // ============================================================
  //  OPTIMIZATION
  // ============================================================

  optimizeRouting() {
    // Analyze task patterns and update rules
    for (const [key, patterns] of this.taskPatterns) {
      if (patterns.length < 10) continue;

      // Find best performing strategy/provider combinations
      const successPatterns = patterns.filter(p => p.success);

      if (successPatterns.length === 0) continue;

      // Group by strategy
      const byStrategy = {};
      successPatterns.forEach(p => {
        if (!byStrategy[p.strategy]) {
          byStrategy[p.strategy] = { count: 0, totalLatency: 0 };
        }
        byStrategy[p.strategy].count++;
        byStrategy[p.strategy].totalLatency += p.latency;
      });

      // Find best strategy
      let bestStrategy = null;
      let bestScore = -Infinity;

      for (const [strategy, data] of Object.entries(byStrategy)) {
        const avgLatency = data.totalLatency / data.count;
        const score = data.count / patterns.length - avgLatency / 10000;

        if (score > bestScore) {
          bestScore = score;
          bestStrategy = strategy;
        }
      }

      console.log(`[TaskRouter] Optimization: ${key} best strategy is ${bestStrategy}`);
    }
  }

  // ============================================================
  //  STATISTICS
  // ============================================================

  getStats() {
    const swarmStats = {};

    for (const [name, swarm] of Object.entries(this.swarms)) {
      const idle = swarm.agents.filter(a => a.status === 'idle').length;
      const busy = swarm.agents.filter(a => a.status === 'busy').length;
      const totalCompleted = swarm.agents.reduce((sum, a) => sum + a.tasksCompleted, 0);

      swarmStats[name] = {
        total: swarm.agents.length,
        idle,
        busy,
        utilization: busy / swarm.agents.length,
        tasksCompleted: totalCompleted,
        specialty: swarm.specialty
      };
    }

    const providerStats = {};
    for (const [provider, metrics] of this.providerMetrics) {
      providerStats[provider] = metrics;
    }

    return {
      totalAgents: this.getTotalAgents(),
      swarms: swarmStats,
      providers: providerStats,
      queueLength: this.queue.length,
      processing: this.processing.size,
      patternsLearned: this.taskPatterns.size
    };
  }

  // ============================================================
  //  SWARM OPERATIONS
  // ============================================================

  async executeSwarm(task, agentCount = 10) {
    const taskType = this.classifyTask(task);
    const rule = this.rules[taskType];

    // Get agents from relevant swarms
    const agents = this.getAvailableAgents(rule?.swarms || ['reasoning'], agentCount);

    if (agents.length < agentCount / 2) {
      return {
        success: false,
        error: 'Insufficient agents available',
        available: agents.length,
        requested: agentCount
      };
    }

    // Create swarm task
    const swarmTask = {
      id: crypto.randomUUID(),
      originalTask: task,
      agents: agents.slice(0, agentCount),
      subtasks: this.decomposeTask(task, agentCount),
      status: 'running',
      results: [],
      startedAt: Date.now()
    };

    // Mark agents busy
    swarmTask.agents.forEach(agent => {
      agent.status = 'busy';
      agent.currentTask = swarmTask.id;
    });

    return swarmTask;
  }

  decomposeTask(task, count) {
    // Simple task decomposition
    const { prompt } = task;
    const subtasks = [];

    // Try to find natural breakpoints
    const sections = prompt.split(/\n{2,}|\d+\.\s/);

    if (sections.length >= count) {
      // Use natural sections
      for (let i = 0; i < count; i++) {
        subtasks.push({
          id: i,
          content: sections[i % sections.length],
          type: i === 0 ? 'coordinator' : 'worker'
        });
      }
    } else {
      // Create synthetic subtasks
      subtasks.push({
        id: 0,
        content: prompt,
        type: 'coordinator'
      });

      for (let i = 1; i < count; i++) {
        subtasks.push({
          id: i,
          content: `Aspect ${i}: ${prompt.slice(0, 100)}...`,
          type: 'worker'
        });
      }
    }

    return subtasks;
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { IntelligentTaskRouter };
