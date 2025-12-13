/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   BOUNDED AGENT AUTONOMY                                                   ║
 * ║   "Intelligence that feels... intentional"                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Agents CAN:
 * - Choose tools
 * - Sequence actions
 * - Ask for clarification when confidence drops
 * - Stop themselves if risk rises
 *
 * Agents CANNOT:
 * - Write to prime memory
 * - Escalate privileges
 * - Override Observer
 */

import { EventEmitter } from 'events';
import { locks } from '../core/locks/index.js';
import { observer } from '../core/observer/index.js';
import { amoebaSecurity } from '../core/amoeba-security.js';

// Agent runtime state
const agentState = {
    enabled: false,
    scope: 'none',           // none | task-level | session-level
    constraints: [],          // ['observer', 'amoeba']
    autonomy: 'none',         // none | bounded | full (full is disabled)
    agents: new Map(),
    activeTask: null,
    metrics: {
        tasksCompleted: 0,
        tasksAborted: 0,
        clarificationRequests: 0,
        selfStops: 0,
        toolsUsed: 0,
        actionsSequenced: 0
    }
};

const agentEvents = new EventEmitter();

// Autonomy boundaries
const AUTONOMY_BOUNDS = {
    bounded: {
        maxActionsPerTask: 10,
        confidenceThreshold: 0.6,    // Ask for clarification below this
        riskThreshold: 0.7,          // Self-stop above this
        allowedCapabilities: [
            'choose-tools',
            'sequence-actions',
            'request-clarification',
            'self-stop'
        ],
        forbiddenCapabilities: [
            'prime-memory-write',
            'privilege-escalation',
            'observer-override',
            'constraint-bypass'
        ]
    }
};

// Available tools for agents
const AGENT_TOOLS = {
    analyze: {
        name: 'analyze',
        description: 'Analyze input for patterns and meaning',
        risk: 0.1
    },
    transform: {
        name: 'transform',
        description: 'Transform data between formats',
        risk: 0.2
    },
    query: {
        name: 'query',
        description: 'Query shadow memory for patterns',
        risk: 0.1
    },
    respond: {
        name: 'respond',
        description: 'Generate a response',
        risk: 0.3
    },
    escalate: {
        name: 'escalate',
        description: 'Escalate to observer for human review',
        risk: 0.0
    },
    learn: {
        name: 'learn',
        description: 'Store pattern in shadow memory',
        risk: 0.4
    }
};

/**
 * Enable agent autonomy
 */
function enable(options = {}) {
    const {
        scope = 'task-level',
        constraints = ['observer', 'amoeba'],
        autonomy = 'bounded'
    } = options;

    // Validate autonomy level
    if (autonomy === 'full') {
        return {
            success: false,
            error: 'Full autonomy is disabled for safety. Use bounded.'
        };
    }

    if (!['none', 'bounded'].includes(autonomy)) {
        return {
            success: false,
            error: `Invalid autonomy level: ${autonomy}`
        };
    }

    // Validate scope
    if (!['none', 'task-level', 'session-level'].includes(scope)) {
        return {
            success: false,
            error: `Invalid scope: ${scope}`
        };
    }

    // Ensure constraints include required safety systems
    const requiredConstraints = ['observer', 'amoeba'];
    for (const required of requiredConstraints) {
        if (!constraints.includes(required)) {
            constraints.push(required);
        }
    }

    // Check that safety locks are engaged
    const lockStatus = locks.getStatus();
    if (!lockStatus.frozen) {
        return {
            success: false,
            error: 'Safety locks must be engaged before enabling agent autonomy',
            hint: 'Run: node core/locks/cli.js freeze --scope=memory,observer,amoeba'
        };
    }

    agentState.enabled = true;
    agentState.scope = scope;
    agentState.constraints = constraints;
    agentState.autonomy = autonomy;

    agentEvents.emit('enabled', {
        scope,
        constraints,
        autonomy,
        bounds: AUTONOMY_BOUNDS[autonomy]
    });

    return {
        success: true,
        scope,
        constraints,
        autonomy,
        bounds: AUTONOMY_BOUNDS[autonomy],
        capabilities: {
            allowed: AUTONOMY_BOUNDS[autonomy].allowedCapabilities,
            forbidden: AUTONOMY_BOUNDS[autonomy].forbiddenCapabilities
        }
    };
}

/**
 * Disable agent autonomy
 */
function disable() {
    agentState.enabled = false;
    agentState.scope = 'none';
    agentState.autonomy = 'none';

    // Abort any active task
    if (agentState.activeTask) {
        abortTask(agentState.activeTask.id, 'autonomy-disabled');
    }

    agentEvents.emit('disabled');

    return { success: true };
}

/**
 * Create a new agent
 */
function createAgent(agentId, config = {}) {
    if (!agentState.enabled) {
        return { success: false, error: 'Agent autonomy not enabled' };
    }

    const agent = {
        id: agentId,
        name: config.name || agentId,
        confidence: 1.0,
        risk: 0,
        state: 'idle',
        currentTask: null,
        actionCount: 0,
        toolHistory: [],
        createdAt: Date.now()
    };

    agentState.agents.set(agentId, agent);
    agentEvents.emit('agent-created', agent);

    return { success: true, agent };
}

/**
 * Start a task with an agent
 */
async function startTask(agentId, task) {
    const agent = agentState.agents.get(agentId);
    if (!agent) {
        return { success: false, error: 'Agent not found' };
    }

    if (!agentState.enabled) {
        return { success: false, error: 'Agent autonomy not enabled' };
    }

    if (agentState.scope === 'task-level' && agentState.activeTask) {
        return { success: false, error: 'Another task is already active' };
    }

    // Security scan
    const securityReport = await amoebaSecurity.scan(
        task.input || '',
        { agentId, taskType: task.type }
    );

    if (securityReport.blocked) {
        return {
            success: false,
            error: 'Task blocked by security',
            threats: securityReport.threats
        };
    }

    const taskObj = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        agentId,
        type: task.type || 'general',
        input: task.input,
        tools: task.tools || Object.keys(AGENT_TOOLS),
        state: 'running',
        actions: [],
        startedAt: Date.now(),
        confidence: 1.0,
        risk: securityReport.riskScore
    };

    agent.state = 'working';
    agent.currentTask = taskObj.id;
    agent.risk = securityReport.riskScore;
    agentState.activeTask = taskObj;

    agentEvents.emit('task-started', taskObj);

    return {
        success: true,
        task: taskObj,
        securityReport: {
            riskScore: securityReport.riskScore,
            passed: !securityReport.blocked
        }
    };
}

/**
 * Agent chooses a tool
 */
function chooseTool(agentId, toolName, reason = '') {
    const agent = agentState.agents.get(agentId);
    if (!agent || !agent.currentTask) {
        return { success: false, error: 'No active task' };
    }

    const task = agentState.activeTask;
    if (!task || task.agentId !== agentId) {
        return { success: false, error: 'Task mismatch' };
    }

    // Check if tool is allowed
    if (!task.tools.includes(toolName)) {
        return { success: false, error: `Tool ${toolName} not allowed for this task` };
    }

    const tool = AGENT_TOOLS[toolName];
    if (!tool) {
        return { success: false, error: `Unknown tool: ${toolName}` };
    }

    // Check bounds
    const bounds = AUTONOMY_BOUNDS[agentState.autonomy];
    if (task.actions.length >= bounds.maxActionsPerTask) {
        // Self-stop due to action limit
        selfStop(agentId, 'action-limit-reached');
        return {
            success: false,
            error: 'Action limit reached',
            selfStopped: true
        };
    }

    // Update risk
    task.risk = Math.min(1, task.risk + tool.risk * 0.1);
    agent.risk = task.risk;

    // Check risk threshold
    if (task.risk >= bounds.riskThreshold) {
        selfStop(agentId, 'risk-threshold-exceeded');
        return {
            success: false,
            error: 'Risk threshold exceeded',
            selfStopped: true
        };
    }

    // Record action
    const action = {
        type: 'choose-tool',
        tool: toolName,
        reason,
        timestamp: Date.now(),
        risk: tool.risk
    };

    task.actions.push(action);
    agent.toolHistory.push(toolName);
    agent.actionCount++;
    agentState.metrics.toolsUsed++;

    agentEvents.emit('tool-chosen', { agentId, tool: toolName, reason });

    return {
        success: true,
        tool,
        actionCount: task.actions.length,
        maxActions: bounds.maxActionsPerTask,
        currentRisk: task.risk
    };
}

/**
 * Agent sequences actions
 */
function sequenceActions(agentId, actions = []) {
    const agent = agentState.agents.get(agentId);
    if (!agent || !agent.currentTask) {
        return { success: false, error: 'No active task' };
    }

    const task = agentState.activeTask;
    const bounds = AUTONOMY_BOUNDS[agentState.autonomy];

    // Check action limit
    const totalActions = task.actions.length + actions.length;
    if (totalActions > bounds.maxActionsPerTask) {
        return {
            success: false,
            error: `Action sequence would exceed limit (${bounds.maxActionsPerTask})`
        };
    }

    // Calculate cumulative risk
    let cumulativeRisk = task.risk;
    for (const action of actions) {
        const tool = AGENT_TOOLS[action.tool];
        if (tool) {
            cumulativeRisk += tool.risk * 0.1;
        }
    }

    if (cumulativeRisk >= bounds.riskThreshold) {
        return {
            success: false,
            error: 'Sequence risk too high',
            projectedRisk: cumulativeRisk,
            threshold: bounds.riskThreshold
        };
    }

    // Record sequence
    for (const action of actions) {
        task.actions.push({
            type: 'sequenced-action',
            ...action,
            timestamp: Date.now()
        });
    }

    agentState.metrics.actionsSequenced += actions.length;

    agentEvents.emit('actions-sequenced', { agentId, count: actions.length });

    return {
        success: true,
        sequencedCount: actions.length,
        totalActions: task.actions.length,
        projectedRisk: cumulativeRisk
    };
}

/**
 * Agent requests clarification
 */
function requestClarification(agentId, question, context = {}) {
    const agent = agentState.agents.get(agentId);
    if (!agent) {
        return { success: false, error: 'Agent not found' };
    }

    const task = agentState.activeTask;
    const bounds = AUTONOMY_BOUNDS[agentState.autonomy];

    // Update confidence
    if (task) {
        task.confidence = Math.max(0, task.confidence - 0.1);
    }
    agent.confidence = task?.confidence || agent.confidence - 0.1;

    const clarification = {
        id: `clar-${Date.now()}`,
        agentId,
        taskId: task?.id,
        question,
        context,
        confidence: agent.confidence,
        timestamp: Date.now(),
        status: 'pending'
    };

    agentState.metrics.clarificationRequests++;

    // Log to observer
    observer.log('info', `Agent ${agentId} requests clarification`, {
        question,
        confidence: agent.confidence
    });

    agentEvents.emit('clarification-requested', clarification);

    return {
        success: true,
        clarification,
        agentConfidence: agent.confidence,
        belowThreshold: agent.confidence < bounds.confidenceThreshold
    };
}

/**
 * Agent self-stops
 */
function selfStop(agentId, reason = 'manual') {
    const agent = agentState.agents.get(agentId);
    if (!agent) {
        return { success: false, error: 'Agent not found' };
    }

    const task = agentState.activeTask;

    if (task && task.agentId === agentId) {
        task.state = 'stopped';
        task.stoppedAt = Date.now();
        task.stopReason = reason;
        agentState.activeTask = null;
    }

    agent.state = 'stopped';
    agent.currentTask = null;

    agentState.metrics.selfStops++;

    // Log to observer
    observer.log('warn', `Agent ${agentId} self-stopped`, {
        reason,
        risk: agent.risk,
        confidence: agent.confidence
    });

    agentEvents.emit('agent-stopped', { agentId, reason });

    return {
        success: true,
        agentId,
        reason,
        task: task ? {
            id: task.id,
            actionsCompleted: task.actions.length,
            risk: task.risk
        } : null
    };
}

/**
 * Abort a task
 */
function abortTask(taskId, reason = 'manual') {
    const task = agentState.activeTask;
    if (!task || task.id !== taskId) {
        return { success: false, error: 'Task not found' };
    }

    task.state = 'aborted';
    task.abortedAt = Date.now();
    task.abortReason = reason;

    const agent = agentState.agents.get(task.agentId);
    if (agent) {
        agent.state = 'idle';
        agent.currentTask = null;
    }

    agentState.activeTask = null;
    agentState.metrics.tasksAborted++;

    agentEvents.emit('task-aborted', { taskId, reason });

    return { success: true, task };
}

/**
 * Complete a task
 */
function completeTask(agentId, result = {}) {
    const agent = agentState.agents.get(agentId);
    if (!agent || !agent.currentTask) {
        return { success: false, error: 'No active task' };
    }

    const task = agentState.activeTask;
    if (!task || task.agentId !== agentId) {
        return { success: false, error: 'Task mismatch' };
    }

    task.state = 'completed';
    task.completedAt = Date.now();
    task.result = result;

    agent.state = 'idle';
    agent.currentTask = null;

    agentState.activeTask = null;
    agentState.metrics.tasksCompleted++;

    agentEvents.emit('task-completed', { taskId: task.id, result });

    return {
        success: true,
        task: {
            id: task.id,
            duration: task.completedAt - task.startedAt,
            actionsExecuted: task.actions.length,
            finalRisk: task.risk,
            result
        }
    };
}

/**
 * Check if capability is allowed
 */
function canDo(capability) {
    if (!agentState.enabled) return false;

    const bounds = AUTONOMY_BOUNDS[agentState.autonomy];
    if (!bounds) return false;

    if (bounds.forbiddenCapabilities.includes(capability)) {
        return false;
    }

    return bounds.allowedCapabilities.includes(capability);
}

/**
 * Get agent status
 */
function getStatus() {
    return {
        enabled: agentState.enabled,
        scope: agentState.scope,
        constraints: agentState.constraints,
        autonomy: agentState.autonomy,
        bounds: AUTONOMY_BOUNDS[agentState.autonomy] || null,
        activeTask: agentState.activeTask ? {
            id: agentState.activeTask.id,
            agentId: agentState.activeTask.agentId,
            state: agentState.activeTask.state,
            actions: agentState.activeTask.actions.length,
            risk: agentState.activeTask.risk
        } : null,
        agents: Array.from(agentState.agents.values()).map(a => ({
            id: a.id,
            state: a.state,
            confidence: a.confidence,
            risk: a.risk
        })),
        metrics: { ...agentState.metrics }
    };
}

/**
 * Subscribe to agent events
 */
function subscribe(event, callback) {
    agentEvents.on(event, callback);
    return () => agentEvents.off(event, callback);
}

export const agents = {
    enable,
    disable,
    createAgent,
    startTask,
    chooseTool,
    sequenceActions,
    requestClarification,
    selfStop,
    abortTask,
    completeTask,
    canDo,
    getStatus,
    subscribe,
    TOOLS: AGENT_TOOLS,
    BOUNDS: AUTONOMY_BOUNDS
};

export default agents;
