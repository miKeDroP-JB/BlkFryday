/**
 * 0rb_brain.js
 * The Overseer - Central orchestrator and task prioritizer
 * Coordinates all other agents, manages workflow, optimizes for revenue
 */

class OrbBrain {
    constructor(config = {}) {
        this.name = '0RB';
        this.version = '1.0.0';

        // Agent registry
        this.agents = new Map();

        // Task queue
        this.taskQueue = [];
        this.activeTask = null;
        this.completedTasks = [];

        // Priorities (revenue-weighted)
        this.priorities = {
            bug_bounty: config.bugBountyPriority || 0.4,
            freelance: config.freelancePriority || 0.35,
            content: config.contentPriority || 0.15,
            outreach: config.outreachPriority || 0.1
        };

        // State
        this.state = {
            running: false,
            cycleCount: 0,
            totalRevenue: 0,
            pendingTasks: 0,
            completedToday: 0
        };

        // Metrics
        this.metrics = {
            tasksProcessed: 0,
            avgTaskTime: 0,
            successRate: 0,
            revenuePerHour: 0
        };

        console.log('[0RB] 🧠 Overseer initialized');
    }

    /**
     * Register an agent
     */
    registerAgent(name, agent) {
        this.agents.set(name, {
            instance: agent,
            status: 'idle',
            tasksCompleted: 0,
            lastActive: null
        });
        console.log(`[0RB] Registered agent: ${name}`);
    }

    /**
     * Queue a task
     */
    queueTask(task) {
        const prioritized = {
            ...task,
            id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            priority: this._calculatePriority(task),
            queuedAt: Date.now(),
            status: 'queued'
        };

        this.taskQueue.push(prioritized);
        this._sortQueue();
        this.state.pendingTasks = this.taskQueue.length;

        console.log(`[0RB] Queued task: ${prioritized.id} (priority: ${prioritized.priority.toFixed(2)})`);
        return prioritized.id;
    }

    /**
     * Calculate task priority
     */
    _calculatePriority(task) {
        let priority = 0;

        // Base priority from type
        if (task.type === 'bug_bounty') priority += this.priorities.bug_bounty;
        else if (task.type === 'freelance') priority += this.priorities.freelance;
        else if (task.type === 'content') priority += this.priorities.content;
        else if (task.type === 'outreach') priority += this.priorities.outreach;

        // Revenue multiplier
        if (task.estimatedRevenue) {
            priority *= (1 + task.estimatedRevenue / 1000);
        }

        // Urgency multiplier
        if (task.deadline) {
            const hoursUntil = (task.deadline - Date.now()) / (1000 * 60 * 60);
            if (hoursUntil < 24) priority *= 2;
            else if (hoursUntil < 72) priority *= 1.5;
        }

        return priority;
    }

    /**
     * Sort queue by priority
     */
    _sortQueue() {
        this.taskQueue.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Start the orchestration loop
     */
    start() {
        if (this.state.running) return;
        this.state.running = true;
        console.log('[0RB] 🚀 Starting orchestration loop');
        this._runCycle();
    }

    /**
     * Stop orchestration
     */
    stop() {
        this.state.running = false;
        console.log('[0RB] ⏹️ Orchestration stopped');
    }

    /**
     * Main orchestration cycle
     */
    async _runCycle() {
        if (!this.state.running) return;

        this.state.cycleCount++;

        try {
            // Process next task if available
            if (this.taskQueue.length > 0 && !this.activeTask) {
                await this._processNextTask();
            }

            // Check agent health
            this._checkAgentHealth();

            // Update metrics
            this._updateMetrics();

        } catch (e) {
            console.error('[0RB] Cycle error:', e.message);
        }

        // Schedule next cycle
        setTimeout(() => this._runCycle(), 1000);
    }

    /**
     * Process next task in queue
     */
    async _processNextTask() {
        const task = this.taskQueue.shift();
        if (!task) return;

        this.activeTask = task;
        task.status = 'processing';
        task.startedAt = Date.now();

        console.log(`[0RB] Processing: ${task.id} (${task.type})`);

        // Route to appropriate agent
        const agent = this._selectAgent(task);

        if (agent) {
            try {
                const agentEntry = this.agents.get(agent);
                agentEntry.status = 'working';
                agentEntry.lastActive = Date.now();

                // Execute task
                const result = await agentEntry.instance.execute(task);

                // Complete task
                task.status = 'completed';
                task.completedAt = Date.now();
                task.result = result;

                agentEntry.status = 'idle';
                agentEntry.tasksCompleted++;

                this.completedTasks.push(task);
                this.state.completedToday++;
                this.metrics.tasksProcessed++;

                // Track revenue
                if (result && result.revenue) {
                    this.state.totalRevenue += result.revenue;
                }

                console.log(`[0RB] ✅ Completed: ${task.id}`);

            } catch (e) {
                task.status = 'failed';
                task.error = e.message;
                console.error(`[0RB] ❌ Failed: ${task.id}`, e.message);
            }
        } else {
            task.status = 'no_agent';
            console.warn(`[0RB] No agent for task type: ${task.type}`);
        }

        this.activeTask = null;
        this.state.pendingTasks = this.taskQueue.length;
    }

    /**
     * Select agent for task
     */
    _selectAgent(task) {
        const agentMap = {
            'bug_scan': 'sentinel',
            'bug_submit': 'ares',
            'freelance_apply': 'apollo',
            'freelance_deliver': 'apollo',
            'outreach': 'mercury',
            'pitch': 'mercury',
            'content': 'athena',
            'media': 'athena',
            'build': 'hephaestus',
            'compliance': 'artemis',
            'message': 'hermes'
        };

        const agentName = agentMap[task.type] || agentMap[task.category];
        return this.agents.has(agentName) ? agentName : null;
    }

    /**
     * Check agent health
     */
    _checkAgentHealth() {
        this.agents.forEach((agent, name) => {
            // Check for stale agents
            if (agent.status === 'working' && agent.lastActive) {
                const elapsed = Date.now() - agent.lastActive;
                if (elapsed > 60000) { // 1 minute
                    console.warn(`[0RB] Agent ${name} may be stuck`);
                    agent.status = 'idle';
                }
            }
        });
    }

    /**
     * Update metrics
     */
    _updateMetrics() {
        if (this.completedTasks.length > 0) {
            // Calculate average task time
            const totalTime = this.completedTasks.reduce((sum, t) => {
                return sum + (t.completedAt - t.startedAt);
            }, 0);
            this.metrics.avgTaskTime = totalTime / this.completedTasks.length;

            // Calculate success rate
            const successful = this.completedTasks.filter(t => t.status === 'completed').length;
            this.metrics.successRate = successful / this.completedTasks.length;

            // Calculate revenue per hour
            const hours = (Date.now() - this.completedTasks[0].queuedAt) / (1000 * 60 * 60);
            if (hours > 0) {
                this.metrics.revenuePerHour = this.state.totalRevenue / hours;
            }
        }
    }

    /**
     * Get dashboard data
     */
    getDashboard() {
        return {
            state: this.state,
            metrics: this.metrics,
            agents: Array.from(this.agents.entries()).map(([name, agent]) => ({
                name,
                status: agent.status,
                tasksCompleted: agent.tasksCompleted
            })),
            queueLength: this.taskQueue.length,
            activeTask: this.activeTask?.id || null
        };
    }

    /**
     * Daily summary
     */
    getDailySummary() {
        const today = this.completedTasks.filter(t => {
            const taskDate = new Date(t.completedAt).toDateString();
            return taskDate === new Date().toDateString();
        });

        return {
            date: new Date().toDateString(),
            tasksCompleted: today.length,
            revenue: today.reduce((sum, t) => sum + (t.result?.revenue || 0), 0),
            successRate: today.filter(t => t.status === 'completed').length / (today.length || 1),
            topPerformer: this._getTopPerformer()
        };
    }

    _getTopPerformer() {
        let top = null;
        let maxTasks = 0;

        this.agents.forEach((agent, name) => {
            if (agent.tasksCompleted > maxTasks) {
                maxTasks = agent.tasksCompleted;
                top = name;
            }
        });

        return top;
    }
}

module.exports = OrbBrain;
