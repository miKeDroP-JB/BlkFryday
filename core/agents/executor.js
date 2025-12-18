/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  0RB CORE - AGENT EXECUTOR                                                   ║
 * ║  Real agents. Real AI. Real execution. No more setTimeout bullshit.          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const EventEmitter = require('events');
const { AIEngine } = require('../ai/engine');
const { AGENT_ARCHETYPES, isValidArchetype } = require('./archetypes');
const { generateId } = require('../utils');

// Alias for backward compatibility
const AGENT_PROMPTS = AGENT_ARCHETYPES;

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

class Agent extends EventEmitter {
  constructor(archetype, engine, options = {}) {
    super();

    const config = AGENT_PROMPTS[archetype];
    if (!config) throw new Error(`Unknown archetype: ${archetype}`);

    this.id = generateId(`agent-${archetype.toLowerCase()}`);
    this.archetype = archetype;
    this.config = config;
    this.engine = engine;
    this.options = options;

    this.state = {
      status: 'IDLE',
      currentTask: null,
      taskHistory: [],
      memory: new Map(),
      artifacts: [],
      reputation: 1000,
      totalTokens: 0,
      totalCost: 0
    };

    console.log(`[AGENT] ${config.name} (${config.title}) awakened: ${this.id}`);
  }

  async execute(task, context = {}) {
    if (this.state.status !== 'IDLE') {
      throw new Error(`Agent ${this.id} is busy`);
    }

    this.state.status = 'WORKING';
    this.state.currentTask = task;

    const startTime = Date.now();
    this.emit('task:start', { agentId: this.id, task });

    try {
      // Build the user message with task and context
      let userMessage = `TASK: ${task.description || task}`;

      if (context.objective) {
        userMessage = `OBJECTIVE: ${context.objective}\n\n${userMessage}`;
      }

      if (context.previousOutput) {
        userMessage += `\n\nPREVIOUS AGENT OUTPUT:\n${context.previousOutput}`;
      }

      if (context.additionalContext) {
        userMessage += `\n\nADDITIONAL CONTEXT:\n${JSON.stringify(context.additionalContext, null, 2)}`;
      }

      // Execute with AI Engine
      const result = await this.engine.run(
        this.config.systemPrompt,
        userMessage,
        {
          model: this.options.model || this.config.model,
          temperature: this.options.temperature ?? this.config.temperature,
          toolNames: this.config.tools,
          conversationId: `${this.id}-${Date.now()}`
        }
      );

      const completionTime = Date.now() - startTime;

      // Update state
      const taskResult = {
        id: `task-${Date.now()}`,
        task,
        context,
        result: result.finalResponse,
        toolCalls: result.toolCalls,
        artifacts: result.artifacts,
        turns: result.turns.length,
        completionTime,
        timestamp: Date.now(),
        success: true
      };

      this.state.taskHistory.push(taskResult);
      this.state.artifacts.push(...result.artifacts);
      this.state.reputation += 10;

      // Aggregate token usage
      for (const turn of result.turns) {
        if (turn.usage) {
          this.state.totalTokens += turn.usage.total_tokens || 0;
        }
      }

      this.state.status = 'IDLE';
      this.state.currentTask = null;

      this.emit('task:complete', {
        agentId: this.id,
        task,
        result: taskResult,
        completionTime
      });

      return taskResult;

    } catch (error) {
      const taskResult = {
        task,
        error: error.message,
        timestamp: Date.now(),
        success: false
      };

      this.state.taskHistory.push(taskResult);
      this.state.reputation = Math.max(0, this.state.reputation - 5);
      this.state.status = 'IDLE';
      this.state.currentTask = null;

      this.emit('task:error', { agentId: this.id, task, error });
      throw error;
    }
  }

  getStatus() {
    return {
      id: this.id,
      archetype: this.archetype,
      name: this.config.name,
      title: this.config.title,
      domain: this.config.domain,
      status: this.state.status,
      currentTask: this.state.currentTask,
      reputation: this.state.reputation,
      totalTasks: this.state.taskHistory.length,
      successRate: this.calculateSuccessRate(),
      totalTokens: this.state.totalTokens,
      artifacts: this.state.artifacts.length
    };
  }

  calculateSuccessRate() {
    if (this.state.taskHistory.length === 0) return 1;
    const successes = this.state.taskHistory.filter(t => t.success).length;
    return successes / this.state.taskHistory.length;
  }

  getMemory(key) {
    return this.state.memory.get(key);
  }

  setMemory(key, value) {
    this.state.memory.set(key, value);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT POOL - Manages multiple agents
// ═══════════════════════════════════════════════════════════════════════════════

class AgentPool extends EventEmitter {
  constructor(engine) {
    super();
    this.engine = engine || new AIEngine();
    this.agents = new Map();
    this.archetypes = AGENT_PROMPTS;
  }

  spawn(archetype, options = {}) {
    const agent = new Agent(archetype, this.engine, options);

    this.agents.set(agent.id, agent);

    // Forward events
    agent.on('task:start', (data) => this.emit('task:start', data));
    agent.on('task:complete', (data) => this.emit('task:complete', data));
    agent.on('task:error', (data) => this.emit('task:error', data));

    this.emit('agent:spawned', { agentId: agent.id, archetype });
    return agent;
  }

  get(agentId) {
    return this.agents.get(agentId);
  }

  getByArchetype(archetype) {
    for (const agent of this.agents.values()) {
      if (agent.archetype === archetype && agent.state.status === 'IDLE') {
        return agent;
      }
    }
    return null;
  }

  list() {
    return Array.from(this.agents.values()).map(a => a.getStatus());
  }

  async assign(agentId, task, context = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);
    return agent.execute(task, context);
  }

  terminate(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      this.emit('agent:terminated', { agentId });
      return true;
    }
    return false;
  }

  getStatistics() {
    let totalAgents = this.agents.size;
    let activeAgents = 0;
    let totalTasks = 0;
    let totalTokens = 0;

    for (const agent of this.agents.values()) {
      if (agent.state.status === 'WORKING') activeAgents++;
      totalTasks += agent.state.taskHistory.length;
      totalTokens += agent.state.totalTokens;
    }

    return {
      totalAgents,
      activeAgents,
      idleAgents: totalAgents - activeAgents,
      totalTasks,
      totalTokens,
      archetypeCount: Object.keys(this.archetypes).length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Alias for backward compatibility
const AgentExecutor = AgentPool;

module.exports = {
  Agent,
  AgentPool,
  AgentExecutor,  // Alias for AgentPool
  AGENT_PROMPTS,
  AGENT_ARCHETYPES  // Also export from shared module
};
