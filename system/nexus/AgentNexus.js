/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║    █████╗  ██████╗ ███████╗███╗   ██╗████████╗                            ║
 * ║   ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝                            ║
 * ║   ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║                               ║
 * ║   ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║                               ║
 * ║   ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║                               ║
 * ║   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝                               ║
 * ║                                                                           ║
 * ║   ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗                             ║
 * ║   ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝                             ║
 * ║   ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗                             ║
 * ║   ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║                             ║
 * ║   ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║                             ║
 * ║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝                             ║
 * ║                                                                           ║
 * ║   THE FUSION LAYER - Where Agents Meet Genesis                            ║
 * ║   Autonomous Business Operations Engine                                   ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const EventEmitter = require('events');
const path = require('path');

// Safe require helper
const safeRequire = (modulePath) => {
    try {
        return require(modulePath);
    } catch (e) {
        console.warn(`[AgentNexus] Module not found: ${modulePath}`);
        return null;
    }
};

// Import agents
const AgentArmy = safeRequire('../../agents');
const logger = safeRequire('../logger');

class AgentNexus extends EventEmitter {
    constructor(config = {}) {
        super();

        this.config = {
            autoStart: config.autoStart !== false,
            tickInterval: config.tickInterval || 60000, // 1 minute
            dailyCycleHour: config.dailyCycleHour || 8, // 8 AM
            maxConcurrentTasks: config.maxConcurrentTasks || 5,
            retryAttempts: config.retryAttempts || 3,
            wsPort: config.wsPort || 3003,
            ...config
        };

        // Core state
        this.state = {
            status: 'INITIALIZING',
            startTime: null,
            lastTick: null,
            cycleCount: 0,
            errors: []
        };

        // Agent army instance
        this.army = null;

        // Task management
        this.taskQueue = [];
        this.activeTasks = new Map();
        this.completedTasks = [];
        this.failedTasks = [];

        // Revenue tracking
        this.dailyRevenue = 0;
        this.pendingPayouts = [];

        // Metrics
        this.metrics = {
            tasksProcessed: 0,
            tasksSucceeded: 0,
            tasksFailed: 0,
            totalRevenue: 0,
            agentActivations: {},
            uptimeSeconds: 0
        };

        // Intervals
        this.tickTimer = null;
        this.dailyCycleTimer = null;

        console.log(`
╔══════════════════════════════════════════════════════════════╗
║              AGENT NEXUS INITIALIZING                        ║
╠══════════════════════════════════════════════════════════════╣
║  Tick Interval: ${String(this.config.tickInterval / 1000).padEnd(42)}s║
║  Max Concurrent: ${String(this.config.maxConcurrentTasks).padEnd(41)}║
║  Daily Cycle: ${String(this.config.dailyCycleHour + ':00').padEnd(44)}║
╚══════════════════════════════════════════════════════════════╝
        `);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    async initialize() {
        this.log('INFO', 'Initializing Agent Nexus...');

        try {
            // Initialize agent army
            if (AgentArmy && AgentArmy.createArmy) {
                this.army = AgentArmy.createArmy({
                    brain: { verbose: true },
                    revenue: { dailyGoal: 100, weeklyGoal: 500, monthlyGoal: 2000 }
                });
                this.log('INFO', 'Agent Army initialized with 8 agents');
            } else {
                this.log('WARN', 'Agent Army not available - running in limited mode');
            }

            // Set up event handlers
            this.setupEventHandlers();

            // Start tick loop
            if (this.config.autoStart) {
                this.start();
            }

            this.state.status = 'READY';
            this.emit('initialized');

            return this;

        } catch (error) {
            this.log('ERROR', `Initialization failed: ${error.message}`);
            this.state.status = 'ERROR';
            this.state.errors.push({ time: Date.now(), error: error.message });
            throw error;
        }
    }

    setupEventHandlers() {
        // Listen for task completion
        this.on('task:complete', (task) => {
            this.handleTaskComplete(task);
        });

        this.on('task:failed', (task, error) => {
            this.handleTaskFailed(task, error);
        });

        // Listen for revenue events
        this.on('revenue:received', (amount, source) => {
            this.handleRevenue(amount, source);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CORE LOOP
    // ═══════════════════════════════════════════════════════════════════════════

    start() {
        if (this.state.status === 'RUNNING') {
            this.log('WARN', 'Already running');
            return;
        }

        this.state.status = 'RUNNING';
        this.state.startTime = Date.now();
        this.log('INFO', 'Agent Nexus ONLINE');

        // Start tick loop
        this.tickTimer = setInterval(() => this.tick(), this.config.tickInterval);

        // Schedule daily cycle
        this.scheduleDailyCycle();

        // Run initial tick
        this.tick();

        this.emit('started');
    }

    stop() {
        this.state.status = 'STOPPED';

        if (this.tickTimer) {
            clearInterval(this.tickTimer);
            this.tickTimer = null;
        }

        if (this.dailyCycleTimer) {
            clearTimeout(this.dailyCycleTimer);
            this.dailyCycleTimer = null;
        }

        this.log('INFO', 'Agent Nexus OFFLINE');
        this.emit('stopped');
    }

    async tick() {
        if (this.state.status !== 'RUNNING') return;

        this.state.lastTick = Date.now();
        this.state.cycleCount++;
        this.metrics.uptimeSeconds = Math.floor((Date.now() - this.state.startTime) / 1000);

        try {
            // Process pending tasks
            await this.processTasks();

            // Check for idle agents
            this.checkIdleAgents();

            // Update metrics
            this.updateMetrics();

            this.emit('tick', {
                cycle: this.state.cycleCount,
                queueLength: this.taskQueue.length,
                activeTasks: this.activeTasks.size
            });

        } catch (error) {
            this.log('ERROR', `Tick error: ${error.message}`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TASK ROUTING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Route a task to the appropriate agent
     */
    async route(taskType, payload = {}) {
        const task = {
            id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: taskType,
            payload,
            status: 'queued',
            createdAt: Date.now(),
            attempts: 0,
            maxAttempts: this.config.retryAttempts
        };

        // Determine which agent handles this task
        task.agent = this.resolveAgent(taskType);

        if (!task.agent) {
            this.log('WARN', `No agent found for task type: ${taskType}`);
            return { success: false, error: 'No agent available' };
        }

        // Add to queue
        this.taskQueue.push(task);
        this.log('INFO', `Queued task: ${taskType} -> ${task.agent}`);

        this.emit('task:queued', task);
        return { success: true, taskId: task.id };
    }

    /**
     * Resolve which agent handles a task type
     */
    resolveAgent(taskType) {
        const agentMap = {
            // Sentinel - Security
            'scan_site': 'sentinel',
            'security_audit': 'sentinel',
            'vulnerability_check': 'sentinel',
            'bug_scan': 'sentinel',

            // Apollo - Freelance
            'gig_apply': 'apollo',
            'gig_research': 'apollo',
            'find_gigs': 'apollo',
            'proposal_write': 'apollo',

            // Mercury - Outreach
            'outreach': 'mercury',
            'send_pitch': 'mercury',
            'cold_email': 'mercury',
            'daily_outreach': 'mercury',

            // Athena - Content
            'content_create': 'athena',
            'write_article': 'athena',
            'generate_content': 'athena',
            'social_content': 'athena',

            // Ares - Bug Bounty Submission
            'submit_bug': 'ares',
            'bug_report': 'ares',
            'compile_report': 'ares',

            // Hermes - Client Communication
            'client_message': 'hermes',
            'send_update': 'hermes',
            'negotiate': 'hermes',

            // Hephaestus - Building
            'build': 'hephaestus',
            'deploy': 'hephaestus',
            'automate': 'hephaestus',
            'create_tool': 'hephaestus',

            // Artemis - Compliance/Validation
            'validate': 'artemis',
            'compliance_check': 'artemis',
            'verify_submission': 'artemis'
        };

        return agentMap[taskType] || null;
    }

    /**
     * Process pending tasks
     */
    async processTasks() {
        // Check if we can take more tasks
        while (
            this.taskQueue.length > 0 &&
            this.activeTasks.size < this.config.maxConcurrentTasks
        ) {
            const task = this.taskQueue.shift();
            await this.executeTask(task);
        }
    }

    /**
     * Execute a single task
     */
    async executeTask(task) {
        task.status = 'running';
        task.startedAt = Date.now();
        task.attempts++;

        this.activeTasks.set(task.id, task);
        this.log('INFO', `Executing: ${task.type} (attempt ${task.attempts})`);

        try {
            let result;

            // Execute via agent army if available
            if (this.army && this.army.agents[task.agent]) {
                const agent = this.army.agents[task.agent];

                // Call appropriate method based on task type
                result = await this.invokeAgent(agent, task);
            } else {
                // Simulated execution for testing
                result = await this.simulateTask(task);
            }

            task.status = 'completed';
            task.completedAt = Date.now();
            task.result = result;

            this.activeTasks.delete(task.id);
            this.completedTasks.push(task);
            this.metrics.tasksProcessed++;
            this.metrics.tasksSucceeded++;

            // Track agent usage
            this.metrics.agentActivations[task.agent] =
                (this.metrics.agentActivations[task.agent] || 0) + 1;

            this.emit('task:complete', task);
            return result;

        } catch (error) {
            this.log('ERROR', `Task failed: ${task.type} - ${error.message}`);

            // Retry logic
            if (task.attempts < task.maxAttempts) {
                task.status = 'queued';
                this.taskQueue.unshift(task); // Add back to front of queue
                this.log('INFO', `Retrying task ${task.id} (${task.attempts}/${task.maxAttempts})`);
            } else {
                task.status = 'failed';
                task.error = error.message;
                this.failedTasks.push(task);
                this.metrics.tasksFailed++;
                this.emit('task:failed', task, error);
            }

            this.activeTasks.delete(task.id);
        }
    }

    /**
     * Invoke an agent method
     */
    async invokeAgent(agent, task) {
        const methodMap = {
            'scan_site': 'scanTarget',
            'gig_apply': 'applyToGig',
            'gig_research': 'findGigs',
            'outreach': 'sendPitch',
            'daily_outreach': 'runDailyOutreach',
            'content_create': 'generateContent',
            'submit_bug': 'submitReport',
            'compile_report': 'compileReport',
            'client_message': 'sendMessage',
            'build': 'buildProject',
            'validate': 'validateSubmission'
        };

        const method = methodMap[task.type];

        if (method && typeof agent[method] === 'function') {
            return await agent[method](task.payload);
        }

        // Fallback to generic execute
        if (typeof agent.execute === 'function') {
            return await agent.execute(task);
        }

        throw new Error(`No handler for task type: ${task.type}`);
    }

    /**
     * Simulate task execution (for testing)
     */
    async simulateTask(task) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        return {
            success: true,
            simulated: true,
            agent: task.agent,
            type: task.type,
            message: `Simulated ${task.type} execution`
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DAILY REVENUE CYCLE
    // ═══════════════════════════════════════════════════════════════════════════

    scheduleDailyCycle() {
        const now = new Date();
        const targetHour = this.config.dailyCycleHour;

        let nextCycle = new Date(now);
        nextCycle.setHours(targetHour, 0, 0, 0);

        if (nextCycle <= now) {
            nextCycle.setDate(nextCycle.getDate() + 1);
        }

        const msUntilCycle = nextCycle - now;

        this.log('INFO', `Daily cycle scheduled for ${nextCycle.toLocaleTimeString()}`);

        this.dailyCycleTimer = setTimeout(() => {
            this.runDailyCycle();
            // Reschedule for next day
            this.scheduleDailyCycle();
        }, msUntilCycle);
    }

    async runDailyCycle() {
        this.log('INFO', '═══════════════════════════════════════════');
        this.log('INFO', '       DAILY REVENUE CYCLE STARTING        ');
        this.log('INFO', '═══════════════════════════════════════════');

        this.emit('daily:start');

        try {
            // 1. MORNING PULSE - Check platforms
            this.log('INFO', '[1/6] Morning Pulse - Scanning platforms...');
            await this.route('gig_research', { platforms: ['upwork', 'fiverr', 'toptal'] });
            await this.route('bug_scan', { mode: 'passive', targets: 5 });

            // 2. EXECUTION WINDOW - Apply and scan
            this.log('INFO', '[2/6] Execution Window - Applying to gigs...');
            for (let i = 0; i < 5; i++) {
                await this.route('gig_apply', { autoSelect: true });
            }

            // 3. COMPILE REPORTS
            this.log('INFO', '[3/6] Compiling reports from yesterday...');
            await this.route('compile_report', { period: 'yesterday' });

            // 4. OUTREACH
            this.log('INFO', '[4/6] Running daily outreach...');
            await this.route('daily_outreach', { count: 10 });

            // 5. CONTENT CREATION
            this.log('INFO', '[5/6] Generating daily content...');
            await this.route('content_create', { type: 'social', count: 3 });

            // 6. DASHBOARD UPDATE
            this.log('INFO', '[6/6] Updating dashboard...');
            const status = this.getStatus();
            this.emit('daily:complete', status);

            this.log('INFO', '═══════════════════════════════════════════');
            this.log('INFO', '       DAILY CYCLE COMPLETE                ');
            this.log('INFO', `       Tasks Queued: ${this.taskQueue.length}`);
            this.log('INFO', '═══════════════════════════════════════════');

        } catch (error) {
            this.log('ERROR', `Daily cycle error: ${error.message}`);
            this.emit('daily:error', error);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REVENUE HANDLING
    // ═══════════════════════════════════════════════════════════════════════════

    handleRevenue(amount, source) {
        this.dailyRevenue += amount;
        this.metrics.totalRevenue += amount;

        // Record in revenue tracker
        if (this.army && this.army.dashboard && this.army.dashboard.revenue) {
            const stream = this.mapSourceToStream(source);
            this.army.dashboard.revenue.recordTransaction(stream, amount, {
                source,
                description: `Auto-recorded from ${source}`
            });
        }

        this.log('INFO', `Revenue received: $${amount} from ${source}`);
        this.emit('revenue:recorded', { amount, source, total: this.metrics.totalRevenue });
    }

    mapSourceToStream(source) {
        const sourceMap = {
            'hackerone': 'bug_bounty',
            'bugcrowd': 'bug_bounty',
            'upwork': 'freelance',
            'fiverr': 'freelance',
            'toptal': 'freelance',
            'medium': 'content',
            'substack': 'content'
        };
        return sourceMap[source.toLowerCase()] || 'other';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TASK HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    handleTaskComplete(task) {
        this.log('INFO', `Task complete: ${task.type} (${task.id})`);

        // Check if task generated revenue
        if (task.result && task.result.revenue) {
            this.handleRevenue(task.result.revenue, task.result.source || task.agent);
        }
    }

    handleTaskFailed(task, error) {
        this.log('WARN', `Task failed permanently: ${task.type} - ${error.message}`);
        this.state.errors.push({
            time: Date.now(),
            taskId: task.id,
            type: task.type,
            error: error.message
        });

        // Keep last 100 errors
        if (this.state.errors.length > 100) {
            this.state.errors.shift();
        }
    }

    checkIdleAgents() {
        // Find agents that haven't been used recently
        const agentNames = ['sentinel', 'apollo', 'mercury', 'athena', 'ares', 'hermes', 'hephaestus', 'artemis'];

        for (const agent of agentNames) {
            const activations = this.metrics.agentActivations[agent] || 0;
            if (activations === 0 && this.state.cycleCount > 10) {
                this.emit('agent:idle', agent);
            }
        }
    }

    updateMetrics() {
        // Calculate derived metrics
        const successRate = this.metrics.tasksProcessed > 0
            ? (this.metrics.tasksSucceeded / this.metrics.tasksProcessed * 100).toFixed(1)
            : 0;

        this.metrics.successRate = successRate;
        this.metrics.avgTasksPerHour = this.metrics.uptimeSeconds > 0
            ? (this.metrics.tasksProcessed / (this.metrics.uptimeSeconds / 3600)).toFixed(2)
            : 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════════

    getStatus() {
        return {
            status: this.state.status,
            uptime: this.metrics.uptimeSeconds,
            cycles: this.state.cycleCount,
            queue: {
                pending: this.taskQueue.length,
                active: this.activeTasks.size,
                completed: this.completedTasks.length,
                failed: this.failedTasks.length
            },
            metrics: { ...this.metrics },
            revenue: {
                today: this.dailyRevenue,
                total: this.metrics.totalRevenue,
                pending: this.pendingPayouts.length
            },
            agents: this.army ? this.army.getStatus() : null,
            lastTick: this.state.lastTick,
            errors: this.state.errors.slice(-10)
        };
    }

    getTaskHistory(limit = 50) {
        return {
            completed: this.completedTasks.slice(-limit),
            failed: this.failedTasks.slice(-limit)
        };
    }

    getAgentStats() {
        return this.metrics.agentActivations;
    }

    // Force run daily cycle (for testing)
    async triggerDailyCycle() {
        return this.runDailyCycle();
    }

    // Queue multiple tasks
    async queueBatch(tasks) {
        const results = [];
        for (const task of tasks) {
            const result = await this.route(task.type, task.payload);
            results.push(result);
        }
        return results;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LOGGING
    // ═══════════════════════════════════════════════════════════════════════════

    log(level, message) {
        const timestamp = new Date().toISOString();
        const formatted = `[${timestamp}] [AgentNexus] [${level}] ${message}`;

        if (logger && logger[level.toLowerCase()]) {
            logger[level.toLowerCase()]('AGENT_NEXUS', message);
        } else {
            console.log(formatted);
        }

        this.emit('log', { level, message, timestamp });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════════

    destroy() {
        this.stop();
        this.removeAllListeners();
        this.taskQueue = [];
        this.activeTasks.clear();
        this.log('INFO', 'Agent Nexus destroyed');
    }
}

module.exports = AgentNexus;
