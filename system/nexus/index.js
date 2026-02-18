/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗                             ║
 * ║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝                             ║
 * ║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗                             ║
 * ║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║                             ║
 * ║   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║                             ║
 * ║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝                             ║
 * ║                                                                           ║
 * ║   LAYER 8 - The Agent-Genesis Fusion Layer                                ║
 * ║   "Where autonomous agents meet infinite possibility"                     ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const AgentNexus = require('./AgentNexus');
const TaskQueue = require('./TaskQueue');
const RevenueEngine = require('./RevenueEngine');
const NexusProtocol = require('./NexusProtocol');

/**
 * Create and initialize the complete Agent Nexus system
 */
async function createAgentNexus(config = {}) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║      █████╗  ██████╗ ███████╗███╗   ██╗████████╗    ███╗   ██╗███████╗   ║
║     ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝    ████╗  ██║██╔════╝   ║
║     ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║       ██╔██╗ ██║█████╗     ║
║     ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║       ██║╚██╗██║██╔══╝     ║
║     ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║       ██║ ╚████║███████╗   ║
║     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝       ╚═╝  ╚═══╝╚══════╝   ║
║                                                                           ║
║              BUSINESS AUTOMATION ENGINE AWAKENING                         ║
║                                                                           ║
║   ✓ 8 Autonomous Agents        ✓ Revenue Engine                          ║
║   ✓ Priority Task Queue        ✓ Genesis Integration                     ║
║   ✓ Daily Revenue Cycles       ✓ Real-time Dashboard                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
    `);

    // Initialize task queue
    const taskQueue = new TaskQueue({
        persistPath: config.taskQueuePath,
        autoPersist: true,
        ...config.taskQueue
    });

    // Initialize Agent Nexus (main orchestrator)
    const nexus = new AgentNexus({
        autoStart: false, // Start manually after revenue engine
        ...config.nexus
    });

    // Initialize Revenue Engine
    const revenue = new RevenueEngine(nexus, {
        dailyGoal: config.dailyGoal || 100,
        weeklyGoal: config.weeklyGoal || 500,
        monthlyGoal: config.monthlyGoal || 2000,
        ...config.revenue
    });

    // Wire up event handlers
    wireEvents(nexus, taskQueue, revenue);

    // Initialize nexus (connects to agent army)
    await nexus.initialize();

    // Start the orchestrator
    nexus.start();

    // Create unified interface
    const system = {
        nexus,
        taskQueue,
        revenue,

        // Convenience methods
        route: (taskType, payload) => nexus.route(taskType, payload),
        enqueue: (task) => taskQueue.enqueue(task),
        recordRevenue: (amount, source, details) => revenue.recordRevenue(amount, source, details),

        // Status
        getStatus: () => ({
            nexus: nexus.getStatus(),
            queue: taskQueue.getStats(),
            revenue: revenue.getStatus()
        }),

        // Manual triggers
        triggerDailyCycle: () => nexus.triggerDailyCycle(),
        triggerMorning: () => revenue.triggerMorning(),
        triggerAfternoon: () => revenue.triggerAfternoon(),
        triggerEvening: () => revenue.triggerEvening(),
        triggerFullDay: () => revenue.triggerFullDay(),

        // Shutdown
        shutdown: () => {
            console.log('[AgentNexus] Shutting down...');
            nexus.destroy();
            taskQueue.destroy();
            revenue.destroy();
            console.log('[AgentNexus] Shutdown complete');
        }
    };

    // Expose on global for debugging
    if (typeof global !== 'undefined') {
        global.agentNexus = system;
    }

    return system;
}

/**
 * Wire up events between components
 */
function wireEvents(nexus, taskQueue, revenue) {
    // Task queue -> Nexus
    taskQueue.on('task:enqueued', (task) => {
        nexus.emit('queue:task', task);
    });

    // Nexus -> Revenue
    nexus.on('task:complete', (task) => {
        if (task.result && task.result.revenue) {
            revenue.recordRevenue(task.result.revenue, task.result.source || task.agent);
        }
    });

    // Revenue -> Dashboard updates
    revenue.on('revenue:recorded', (record) => {
        nexus.emit('dashboard:update', { revenue: record });
    });

    revenue.on('cycle:complete', (cycle, data) => {
        nexus.emit('dashboard:update', { cycle, data });
    });

    // Log important events
    nexus.on('started', () => {
        console.log('[AgentNexus] System ONLINE - Ready for business');
    });

    revenue.on('day:reset', () => {
        console.log('[AgentNexus] New day - Daily metrics reset');
    });
}

/**
 * Quick start helper - creates and starts the full system
 */
async function quickStart(config = {}) {
    const system = await createAgentNexus(config);

    console.log('\n[AgentNexus] Quick Start Complete');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Commands:');
    console.log('    agentNexus.route("gig_research", {})  - Find gigs');
    console.log('    agentNexus.route("bug_scan", {})      - Security scan');
    console.log('    agentNexus.route("outreach", {})      - Send pitches');
    console.log('    agentNexus.triggerFullDay()           - Run full daily cycle');
    console.log('    agentNexus.getStatus()                - Get system status');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return system;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
    // Main classes
    AgentNexus,
    TaskQueue,
    RevenueEngine,
    NexusProtocol,

    // Constants
    PRIORITY: TaskQueue.PRIORITY,
    CATEGORIES: TaskQueue.CATEGORIES,

    // Factory functions
    createAgentNexus,
    quickStart,

    // Version
    version: '1.0.0'
};
