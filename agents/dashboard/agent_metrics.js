/**
 * agent_metrics.js
 * Agent Performance Metrics Dashboard
 * Tracks performance, efficiency, and ROI of all agents
 */

class AgentMetrics {
    constructor(config = {}) {
        this.agents = new Map();

        // Register default agents
        const defaultAgents = [
            { id: 'sentinel', name: 'Sentinel', type: 'security', icon: '🛡️' },
            { id: 'apollo', name: 'Apollo', type: 'freelance', icon: '☀️' },
            { id: 'mercury', name: 'Mercury', type: 'outreach', icon: '📨' },
            { id: 'athena', name: 'Athena', type: 'content', icon: '📝' },
            { id: 'ares', name: 'Ares', type: 'bounty', icon: '⚔️' },
            { id: 'hermes', name: 'Hermes', type: 'messaging', icon: '💬' },
            { id: 'hephaestus', name: 'Hephaestus', type: 'build', icon: '🔨' },
            { id: 'artemis', name: 'Artemis', type: 'compliance', icon: '⚖️' }
        ];

        for (const agent of defaultAgents) {
            this.registerAgent(agent);
        }

        // Events log
        this.events = [];

        console.log('[AgentMetrics] Agent metrics dashboard initialized');
    }

    /**
     * Register an agent
     */
    registerAgent(agent) {
        this.agents.set(agent.id, {
            ...agent,
            metrics: {
                tasksCompleted: 0,
                tasksFailed: 0,
                totalExecutionTime: 0,
                avgExecutionTime: 0,
                successRate: 100,
                revenue: 0,
                lastActive: null,
                uptime: 0,
                errors: []
            },
            status: 'idle',
            currentTask: null
        });
    }

    /**
     * Record task completion
     */
    recordTaskCompletion(agentId, task) {
        const agent = this.agents.get(agentId);
        if (!agent) return { error: 'Agent not found' };

        const metrics = agent.metrics;
        metrics.tasksCompleted++;
        metrics.totalExecutionTime += task.duration || 0;
        metrics.avgExecutionTime = metrics.totalExecutionTime / metrics.tasksCompleted;
        metrics.successRate = (metrics.tasksCompleted / (metrics.tasksCompleted + metrics.tasksFailed)) * 100;
        metrics.lastActive = Date.now();

        if (task.revenue) {
            metrics.revenue += task.revenue;
        }

        this._logEvent(agentId, 'task_completed', task);

        return { success: true, metrics };
    }

    /**
     * Record task failure
     */
    recordTaskFailure(agentId, task, error) {
        const agent = this.agents.get(agentId);
        if (!agent) return { error: 'Agent not found' };

        const metrics = agent.metrics;
        metrics.tasksFailed++;
        metrics.successRate = (metrics.tasksCompleted / (metrics.tasksCompleted + metrics.tasksFailed)) * 100;
        metrics.lastActive = Date.now();
        metrics.errors.push({
            timestamp: Date.now(),
            task: task.type,
            error: error.message || error
        });

        // Keep only recent errors
        if (metrics.errors.length > 100) {
            metrics.errors = metrics.errors.slice(-50);
        }

        this._logEvent(agentId, 'task_failed', { task, error: error.message });

        return { success: true, metrics };
    }

    /**
     * Update agent status
     */
    updateStatus(agentId, status, currentTask = null) {
        const agent = this.agents.get(agentId);
        if (!agent) return { error: 'Agent not found' };

        agent.status = status;
        agent.currentTask = currentTask;
        agent.metrics.lastActive = Date.now();

        this._logEvent(agentId, 'status_change', { status, currentTask });

        return { success: true, status };
    }

    /**
     * Get agent performance summary
     */
    getAgentPerformance(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return null;

        const metrics = agent.metrics;

        return {
            id: agent.id,
            name: agent.name,
            type: agent.type,
            icon: agent.icon,
            status: agent.status,
            currentTask: agent.currentTask,
            performance: {
                tasksCompleted: metrics.tasksCompleted,
                tasksFailed: metrics.tasksFailed,
                successRate: Math.round(metrics.successRate * 10) / 10,
                avgExecutionTime: Math.round(metrics.avgExecutionTime),
                revenue: metrics.revenue,
                lastActive: metrics.lastActive,
                recentErrors: metrics.errors.slice(-5)
            }
        };
    }

    /**
     * Get all agents summary
     */
    getAllAgentsSummary() {
        const summary = {
            agents: [],
            totals: {
                tasksCompleted: 0,
                tasksFailed: 0,
                revenue: 0,
                avgSuccessRate: 0
            },
            activeAgents: 0,
            idleAgents: 0
        };

        for (const [id, agent] of this.agents) {
            const perf = this.getAgentPerformance(id);
            summary.agents.push(perf);

            summary.totals.tasksCompleted += perf.performance.tasksCompleted;
            summary.totals.tasksFailed += perf.performance.tasksFailed;
            summary.totals.revenue += perf.performance.revenue;

            if (agent.status === 'active' || agent.status === 'working') {
                summary.activeAgents++;
            } else {
                summary.idleAgents++;
            }
        }

        // Calculate average success rate
        const totalTasks = summary.totals.tasksCompleted + summary.totals.tasksFailed;
        summary.totals.avgSuccessRate = totalTasks > 0
            ? Math.round((summary.totals.tasksCompleted / totalTasks) * 1000) / 10
            : 100;

        return summary;
    }

    /**
     * Get top performing agents
     */
    getTopPerformers(metric = 'revenue', limit = 5) {
        const agents = Array.from(this.agents.values());

        const sorted = agents.sort((a, b) => {
            switch (metric) {
                case 'revenue':
                    return b.metrics.revenue - a.metrics.revenue;
                case 'tasks':
                    return b.metrics.tasksCompleted - a.metrics.tasksCompleted;
                case 'success':
                    return b.metrics.successRate - a.metrics.successRate;
                case 'speed':
                    return a.metrics.avgExecutionTime - b.metrics.avgExecutionTime;
                default:
                    return 0;
            }
        });

        return sorted.slice(0, limit).map(a => ({
            id: a.id,
            name: a.name,
            icon: a.icon,
            value: metric === 'revenue' ? a.metrics.revenue
                : metric === 'tasks' ? a.metrics.tasksCompleted
                : metric === 'success' ? a.metrics.successRate
                : a.metrics.avgExecutionTime
        }));
    }

    /**
     * Get ROI analysis
     */
    getROIAnalysis() {
        const analysis = {
            totalRevenue: 0,
            byAgent: {},
            byType: {},
            efficiency: {}
        };

        for (const [id, agent] of this.agents) {
            const revenue = agent.metrics.revenue;
            const tasks = agent.metrics.tasksCompleted;
            const time = agent.metrics.totalExecutionTime;

            analysis.totalRevenue += revenue;

            analysis.byAgent[id] = {
                name: agent.name,
                revenue,
                revenuePerTask: tasks > 0 ? Math.round(revenue / tasks) : 0,
                revenuePerHour: time > 0 ? Math.round(revenue / (time / 3600000)) : 0
            };

            // Aggregate by type
            if (!analysis.byType[agent.type]) {
                analysis.byType[agent.type] = { revenue: 0, tasks: 0 };
            }
            analysis.byType[agent.type].revenue += revenue;
            analysis.byType[agent.type].tasks += tasks;
        }

        // Calculate efficiency scores
        for (const [id, agent] of this.agents) {
            const metrics = agent.metrics;
            const totalTasks = metrics.tasksCompleted + metrics.tasksFailed;

            analysis.efficiency[id] = {
                name: agent.name,
                score: this._calculateEfficiencyScore(metrics),
                factors: {
                    successRate: metrics.successRate,
                    speed: this._normalizeSpeed(metrics.avgExecutionTime),
                    revenue: this._normalizeRevenue(metrics.revenue)
                }
            };
        }

        return analysis;
    }

    /**
     * Calculate efficiency score
     */
    _calculateEfficiencyScore(metrics) {
        const successWeight = 0.4;
        const speedWeight = 0.3;
        const revenueWeight = 0.3;

        const successScore = metrics.successRate;
        const speedScore = this._normalizeSpeed(metrics.avgExecutionTime);
        const revenueScore = this._normalizeRevenue(metrics.revenue);

        return Math.round(
            (successScore * successWeight) +
            (speedScore * speedWeight) +
            (revenueScore * revenueWeight)
        );
    }

    /**
     * Normalize speed to 0-100 score
     */
    _normalizeSpeed(avgTime) {
        // Assume 1 minute is ideal, 10 minutes is poor
        const idealTime = 60000;
        const poorTime = 600000;

        if (avgTime <= idealTime) return 100;
        if (avgTime >= poorTime) return 0;

        return Math.round(100 - ((avgTime - idealTime) / (poorTime - idealTime)) * 100);
    }

    /**
     * Normalize revenue to 0-100 score
     */
    _normalizeRevenue(revenue) {
        // Scale based on total revenue
        const maxRevenue = Math.max(...Array.from(this.agents.values()).map(a => a.metrics.revenue)) || 1;
        return Math.round((revenue / maxRevenue) * 100);
    }

    /**
     * Log event
     */
    _logEvent(agentId, type, data) {
        this.events.push({
            agentId,
            type,
            data,
            timestamp: Date.now()
        });

        // Keep events manageable
        if (this.events.length > 1000) {
            this.events = this.events.slice(-500);
        }
    }

    /**
     * Get recent events
     */
    getRecentEvents(limit = 50) {
        return this.events.slice(-limit).reverse();
    }

    /**
     * Get events for agent
     */
    getAgentEvents(agentId, limit = 20) {
        return this.events
            .filter(e => e.agentId === agentId)
            .slice(-limit)
            .reverse();
    }

    /**
     * Get dashboard data
     */
    getDashboard() {
        return {
            summary: this.getAllAgentsSummary(),
            topPerformers: {
                revenue: this.getTopPerformers('revenue', 3),
                tasks: this.getTopPerformers('tasks', 3),
                efficiency: this.getTopPerformers('success', 3)
            },
            roi: this.getROIAnalysis(),
            recentEvents: this.getRecentEvents(20)
        };
    }
}

module.exports = AgentMetrics;
