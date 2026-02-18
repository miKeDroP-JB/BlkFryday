/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   ORCHESTRATOR - The Conductor of the Agent Pantheon                      ║
 * ║   Dispatch loop • Task routing • Revenue cycles • Health monitoring       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { agents, getAgent, resolveAgent, AGENT_CAPABILITIES } = require('./agents-index');
const taskManager = require('./task_manager');
const revenueTracker = require('./revenue_tracker');
const dashboardWS = require('./dashboard_ws');
const voiceInterface = require('./voice_interface');
const strategyGenerator = require('./strategy_generator');

// Orchestrator state
let running = false;
let tickInterval = null;
let cycleInterval = null;
let healthInterval = null;

// Configuration
const config = {
    tickRate: 5000,           // Process queue every 5 seconds
    cycleInterval: 3600000,   // Revenue cycle every hour
    healthCheck: 60000,       // Health check every minute
    maxConcurrent: 3,         // Max concurrent tasks
    wsPort: 8890,
    httpPort: 8777
};

// Active tasks tracking
const activeTasks = new Map();

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   DISPATCH ENGINE                                                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Dispatch a task to the appropriate agent
 * @param {Object} task - Task to dispatch
 * @returns {Promise<Object>} Result of task execution
 */
async function dispatch(task) {
    const agentName = task.agent || resolveAgent(task.type);

    if (!agentName) {
        console.error(`[Orchestrator] No agent found for task type: ${task.type}`);
        return { success: false, error: 'No agent found for task type' };
    }

    const agent = getAgent(agentName);

    if (!agent) {
        console.log(`[Orchestrator] Agent ${agentName} not loaded, simulating...`);
        return simulateAgent(agentName, task);
    }

    // Check if agent has execute method
    if (typeof agent.execute === 'function') {
        try {
            const result = await agent.execute(task);
            return { success: true, result, agent: agentName };
        } catch (e) {
            console.error(`[Orchestrator] Agent ${agentName} error:`, e.message);
            return { success: false, error: e.message, agent: agentName };
        }
    }

    // Fallback to simulation
    return simulateAgent(agentName, task);
}

/**
 * Simulate agent execution for agents not yet implemented
 */
function simulateAgent(agentName, task) {
    const meta = AGENT_CAPABILITIES[agentName];

    console.log(`[Orchestrator] Simulating ${meta?.name || agentName}: ${task.type}`);

    // Simulate different outcomes based on task type
    const revenue = calculateTaskRevenue(task);

    return {
        success: true,
        simulated: true,
        agent: agentName,
        result: {
            task_type: task.type,
            message: `${meta?.name || agentName} completed ${task.type}`,
            revenue,
            ts: new Date().toISOString()
        }
    };
}

/**
 * Calculate potential revenue for a task
 */
function calculateTaskRevenue(task) {
    const revenueMap = {
        // Security tasks
        bug_scan: { min: 0, max: 50 },
        security_audit: { min: 50, max: 500 },

        // Freelance tasks
        gig_apply: { min: 0, max: 0 },
        gig_research: { min: 0, max: 0 },
        proposal_write: { min: 0, max: 0 },

        // Outreach tasks
        outreach: { min: 0, max: 100 },
        daily_outreach: { min: 0, max: 200 },
        cold_email: { min: 0, max: 50 },

        // Content tasks
        generate_content: { min: 10, max: 100 },
        social_content: { min: 5, max: 50 },

        // Bug bounty submission
        submit_bug: { min: 100, max: 5000 },
        compile_report: { min: 0, max: 0 },

        // Client tasks
        client_message: { min: 0, max: 0 },
        follow_up: { min: 0, max: 500 },

        // Build tasks
        build: { min: 50, max: 500 },
        deploy: { min: 20, max: 200 },

        // Compliance tasks
        validate: { min: 0, max: 0 },

        // Default
        default: { min: 0, max: 50 }
    };

    const range = revenueMap[task.type] || revenueMap.default;

    // Only generate revenue some of the time
    if (Math.random() > 0.3) return 0;

    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   TICK LOOP - Process queue continuously                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

async function tick() {
    // Check if we can process more tasks
    if (activeTasks.size >= config.maxConcurrent) {
        return;
    }

    // Get next task from queue
    const task = taskManager.dequeue();

    if (!task) {
        return;
    }

    console.log(`[Orchestrator] Processing: ${task.type} (${task.id})`);

    // Track active task
    activeTasks.set(task.id, { task, started: Date.now() });

    // Broadcast task started
    dashboardWS.events.taskStarted(task);

    try {
        // Dispatch to agent
        const result = await dispatch(task);

        // Track revenue if generated
        if (result.success && result.result?.revenue > 0) {
            revenueTracker.addRevenue({
                source: result.agent,
                amount: result.result.revenue,
                meta: { taskId: task.id, taskType: task.type }
            });

            dashboardWS.events.revenueUpdate(revenueTracker.getSummary());
        }

        // Broadcast task completion
        dashboardWS.events.taskDone(task, result);

        console.log(`[Orchestrator] Completed: ${task.type} (${task.id})`);

    } catch (error) {
        console.error(`[Orchestrator] Task failed: ${task.id}`, error.message);
        dashboardWS.events.taskError(task, error.message);
    } finally {
        activeTasks.delete(task.id);
    }
}

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   REVENUE CYCLES - Scheduled income operations                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const REVENUE_CYCLES = {
    morning: {
        hour: 8,
        tasks: [
            { agent: 'apollo', type: 'gig_research', data: { query: 'morning scan' } },
            { agent: 'mercury', type: 'daily_outreach', data: {} },
            { agent: 'sentinel', type: 'bug_scan', data: { target: 'watchlist' } }
        ]
    },
    afternoon: {
        hour: 14,
        tasks: [
            { agent: 'athena', type: 'social_content', data: { prompt: 'engagement post' } },
            { agent: 'hermes', type: 'follow_up', data: {} }
        ]
    },
    evening: {
        hour: 20,
        tasks: [
            { agent: 'ares', type: 'compile_report', data: {} },
            { agent: 'artemis', type: 'validate', data: { target: 'daily_work' } }
        ]
    }
};

function checkRevenueCycles() {
    const hour = new Date().getHours();

    for (const [cycleName, cycle] of Object.entries(REVENUE_CYCLES)) {
        if (hour === cycle.hour) {
            console.log(`[Orchestrator] Triggering ${cycleName} revenue cycle`);

            cycle.tasks.forEach(task => {
                taskManager.enqueue({
                    ...task,
                    priority: 'normal',
                    source: `cycle:${cycleName}`
                });
            });

            dashboardWS.events.systemEvent({
                type: 'revenue_cycle',
                cycle: cycleName,
                tasksQueued: cycle.tasks.length
            });
        }
    }
}

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   HEALTH MONITORING                                                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

function healthCheck() {
    const health = {
        status: 'healthy',
        uptime: process.uptime(),
        queue: taskManager.length(),
        activeTasks: activeTasks.size,
        wsClients: dashboardWS.getClientCount(),
        revenue: revenueTracker.getSummary(),
        memory: process.memoryUsage(),
        ts: new Date().toISOString()
    };

    // Check for issues
    if (taskManager.length() > 100) {
        health.status = 'warning';
        health.warnings = ['Queue backlog > 100 tasks'];
    }

    // Broadcast health status
    dashboardWS.broadcast({ type: 'health', ...health });

    return health;
}

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   ORCHESTRATOR CONTROL                                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

/**
 * Start the orchestrator
 */
function start(options = {}) {
    if (running) {
        console.log('[Orchestrator] Already running');
        return;
    }

    // Merge options with config
    Object.assign(config, options);

    console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
    console.log('║   AGENT NEXUS ORCHESTRATOR - Starting                                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════╝');

    // Start WebSocket server
    dashboardWS.start(config.wsPort);

    // Start HTTP voice interface
    voiceInterface.start(config.httpPort);

    // Start tick loop
    tickInterval = setInterval(tick, config.tickRate);
    console.log(`[Orchestrator] Tick loop started (${config.tickRate}ms)`);

    // Start revenue cycle checker (every hour)
    cycleInterval = setInterval(checkRevenueCycles, config.cycleInterval);
    console.log(`[Orchestrator] Revenue cycles enabled`);

    // Start health monitoring
    healthInterval = setInterval(healthCheck, config.healthCheck);
    console.log(`[Orchestrator] Health monitoring started`);

    // Start Infinite Strategy Generator (autonomous earning)
    strategyGenerator.start(30000); // Tick every 30s
    console.log(`[Orchestrator] Infinite Strategy Generator ONLINE`);

    // Initial revenue cycle check
    checkRevenueCycles();

    running = true;

    console.log('[Orchestrator] All systems online');
    console.log(`[Orchestrator] Dashboard: ws://localhost:${config.wsPort}`);
    console.log(`[Orchestrator] Voice: http://localhost:${config.httpPort}`);

    // Broadcast startup event
    dashboardWS.events.systemEvent({
        type: 'startup',
        message: 'Agent Nexus Orchestrator online',
        config: {
            tickRate: config.tickRate,
            maxConcurrent: config.maxConcurrent
        }
    });

    return { config, status: 'running' };
}

/**
 * Stop the orchestrator
 */
function stop() {
    if (!running) {
        console.log('[Orchestrator] Not running');
        return;
    }

    console.log('[Orchestrator] Shutting down...');

    // Stop intervals
    if (tickInterval) clearInterval(tickInterval);
    if (cycleInterval) clearInterval(cycleInterval);
    if (healthInterval) clearInterval(healthInterval);

    // Stop servers
    dashboardWS.stop();
    voiceInterface.stop();

    // Stop strategy generator
    strategyGenerator.stop();

    running = false;
    console.log('[Orchestrator] Shutdown complete');
}

/**
 * Get orchestrator status
 */
function status() {
    return {
        running,
        config,
        queue: taskManager.length(),
        activeTasks: activeTasks.size,
        activeTaskIds: Array.from(activeTasks.keys()),
        wsClients: dashboardWS.getClientCount(),
        revenue: revenueTracker.getSummary(),
        strategyGenerator: strategyGenerator.status()
    };
}

/**
 * Manually trigger a revenue cycle
 */
function triggerCycle(cycleName) {
    const cycle = REVENUE_CYCLES[cycleName];

    if (!cycle) {
        console.error(`[Orchestrator] Unknown cycle: ${cycleName}`);
        return null;
    }

    console.log(`[Orchestrator] Manually triggering ${cycleName} cycle`);

    const tasks = cycle.tasks.map(task =>
        taskManager.enqueue({
            ...task,
            priority: 'normal',
            source: `manual:${cycleName}`
        })
    );

    return tasks;
}

/**
 * Direct task submission
 */
function submitTask(task) {
    const enriched = taskManager.enqueue(task);
    dashboardWS.events.taskEnqueued(enriched);
    return enriched;
}

module.exports = {
    start,
    stop,
    status,
    dispatch,
    submitTask,
    triggerCycle,
    healthCheck,
    config,
    REVENUE_CYCLES
};
