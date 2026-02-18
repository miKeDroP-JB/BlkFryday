/**
 * 0RB SYSTEM - AGENT MANAGER
 * The Pantheon awakens. Seven archetypes. Infinite possibilities.
 *
 * NOTE: Uses shared archetypes from /core/agents/archetypes.js
 * This ensures a single source of truth for all agent definitions.
 */

const { EventEmitter } = require('events');

// ═══════════════════════════════════════════════════════════════
// SHARED IMPORTS - Single source of truth
// ═══════════════════════════════════════════════════════════════

const { AGENT_ARCHETYPES, isValidArchetype } = require('../../core/agents/archetypes');
const { generateId } = require('../../core/utils');

// ═══════════════════════════════════════════════════════════════
// AGENT INSTANCE CLASS
// ═══════════════════════════════════════════════════════════════

class AgentInstance {
  constructor(archetype, ownerId = null) {
    this.id = generateId('agent');
    this.archetype = archetype;
    this.ownerId = ownerId;
    this.createdAt = Date.now();
    this.status = 'IDLE';
    this.currentTask = null;
    this.taskHistory = [];
    this.reputation = 1000;
    this.totalEarnings = 0;
    this.metadata = {
      ...AGENT_ARCHETYPES[archetype],
      instanceId: this.id
    };
  }

  async executeTask(task) {
    this.status = 'WORKING';
    this.currentTask = task;

    const startTime = Date.now();

    try {
      // Simulate AI processing (replace with actual API calls)
      const result = await this.processTask(task);

      const completionTime = Date.now() - startTime;

      this.taskHistory.push({
        task,
        result,
        completionTime,
        timestamp: Date.now(),
        success: true
      });

      // Update reputation based on completion
      this.reputation += 10;

      this.status = 'IDLE';
      this.currentTask = null;

      return { success: true, result, completionTime };
    } catch (error) {
      this.taskHistory.push({
        task,
        error: error.message,
        timestamp: Date.now(),
        success: false
      });

      // Reputation penalty for failure
      this.reputation = Math.max(0, this.reputation - 5);

      this.status = 'IDLE';
      this.currentTask = null;

      return { success: false, error: error.message };
    }
  }

  async processTask(task) {
    // This would integrate with actual AI APIs
    // For now, simulate processing
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          agent: this.archetype,
          task: task.description,
          output: `[${this.metadata.name}] Task completed: ${task.description}`,
          confidence: 0.95
        });
      }, 1000 + Math.random() * 2000);
    });
  }

  getStatus() {
    return {
      id: this.id,
      archetype: this.archetype,
      status: this.status,
      reputation: this.reputation,
      totalTasks: this.taskHistory.length,
      successRate: this.calculateSuccessRate(),
      currentTask: this.currentTask,
      metadata: this.metadata
    };
  }

  calculateSuccessRate() {
    if (this.taskHistory.length === 0) return 1;
    const successes = this.taskHistory.filter(t => t.success).length;
    return successes / this.taskHistory.length;
  }
}

// ═══════════════════════════════════════════════════════════════
// AGENT MANAGER CLASS
// ═══════════════════════════════════════════════════════════════

class AgentManager extends EventEmitter {
  constructor(initialAgents = {}) {
    super();
    this.agents = new Map();
    this.archetypes = AGENT_ARCHETYPES;

    // Initialize with any pre-existing agents from boot
    Object.keys(initialAgents).forEach(type => {
      this.archetypes[type] = {
        ...this.archetypes[type],
        ...initialAgents[type]
      };
    });
  }

  /**
   * Spawn a new agent instance
   */
  spawnAgent(archetype, ownerId = null) {
    if (!isValidArchetype(archetype)) {
      throw new Error(`Unknown archetype: ${archetype}`);
    }

    const agent = new AgentInstance(archetype, ownerId);
    this.agents.set(agent.id, agent);

    this.emit('agent:spawned', {
      id: agent.id,
      archetype,
      ownerId
    });

    console.log(`[AGENT MANAGER] Spawned ${archetype} agent: ${agent.id}`);

    return agent;
  }

  /**
   * Get an agent by ID
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * List all agents
   */
  listAgents() {
    const list = [];
    this.agents.forEach(agent => {
      list.push(agent.getStatus());
    });
    return list;
  }

  /**
   * List available archetypes
   */
  listArchetypes() {
    return Object.values(this.archetypes);
  }

  /**
   * Assign a task to an agent
   */
  async assignTask(agentId, task) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (agent.status !== 'IDLE') {
      throw new Error(`Agent ${agentId} is busy`);
    }

    this.emit('task:assigned', { agentId, task });

    const result = await agent.executeTask(task);

    this.emit('task:completed', { agentId, task, result });

    return result;
  }

  /**
   * Get agent statistics
   */
  getStatistics() {
    let totalAgents = this.agents.size;
    let activeAgents = 0;
    let totalTasks = 0;
    let totalReputation = 0;

    this.agents.forEach(agent => {
      if (agent.status === 'WORKING') activeAgents++;
      totalTasks += agent.taskHistory.length;
      totalReputation += agent.reputation;
    });

    return {
      totalAgents,
      activeAgents,
      idleAgents: totalAgents - activeAgents,
      totalTasksCompleted: totalTasks,
      averageReputation: totalAgents > 0 ? totalReputation / totalAgents : 0,
      archetypeCount: Object.keys(this.archetypes).length
    };
  }

  /**
   * Terminate an agent
   */
  terminateAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    this.agents.delete(agentId);

    this.emit('agent:terminated', { agentId });

    console.log(`[AGENT MANAGER] Terminated agent: ${agentId}`);

    return true;
  }
}

module.exports = {
  AgentManager,
  AgentInstance,
  AGENT_ARCHETYPES
};
