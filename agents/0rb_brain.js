/**
 * 0rb_brain.js
 * The Overseer - Central orchestrator and task dispatcher
 */

const agents = ['sentinel', 'apollo', 'mercury', 'athena', 'ares', 'hermes', 'hephaestus', 'artemis'];

class ORBBrain {
    constructor() {
        this.taskQueue = [];
        this.completed = [];
        this.failed = [];
        this.agentCache = new Map();
    }

    /**
     * Add task to queue
     */
    addTask(task) {
        const queued = {
            ...task,
            id: task.id || `task_${Date.now()}`,
            queuedAt: Date.now()
        };
        this.taskQueue.push(queued);
        return queued.id;
    }

    /**
     * Dispatch all queued tasks
     */
    dispatch() {
        while (this.taskQueue.length) {
            const task = this.taskQueue.shift();
            const agentName = task.agent;

            // Validate agent exists
            if (!agents.includes(agentName)) {
                console.error(`[ORB] Unknown agent: ${agentName}`);
                this.failed.push({ ...task, error: 'Unknown agent' });
                continue;
            }

            try {
                const Agent = this._getAgent(agentName);
                const agentInstance = new Agent();

                console.log(`[ORB] Dispatching to ${agentName}: ${task.type || task.id}`);

                const result = agentInstance.run ?
                    agentInstance.run(task.data) :
                    agentInstance.execute(task);

                this.completed.push({
                    ...task,
                    completedAt: Date.now(),
                    result
                });

            } catch (e) {
                console.error(`[ORB] Agent dispatch failed: ${agentName}`, e.message);
                this.failed.push({
                    ...task,
                    error: e.message,
                    failedAt: Date.now()
                });
            }
        }
    }

    /**
     * Get or load agent module
     */
    _getAgent(agentName) {
        if (!this.agentCache.has(agentName)) {
            const Agent = require(`./${agentName}`);
            this.agentCache.set(agentName, Agent);
        }
        return this.agentCache.get(agentName);
    }

    /**
     * Async dispatch with results
     */
    async dispatchAsync() {
        const results = [];

        while (this.taskQueue.length) {
            const task = this.taskQueue.shift();
            const agentName = task.agent;

            if (!agents.includes(agentName)) {
                this.failed.push({ ...task, error: 'Unknown agent' });
                continue;
            }

            try {
                const Agent = this._getAgent(agentName);
                const agentInstance = new Agent();

                console.log(`[ORB] Dispatching to ${agentName}: ${task.type || task.id}`);

                const result = await (agentInstance.execute ?
                    agentInstance.execute(task) :
                    agentInstance.run(task.data));

                const completedTask = {
                    ...task,
                    completedAt: Date.now(),
                    result
                };

                this.completed.push(completedTask);
                results.push(completedTask);

            } catch (e) {
                console.error(`[ORB] Agent dispatch failed: ${agentName}`, e.message);
                this.failed.push({
                    ...task,
                    error: e.message,
                    failedAt: Date.now()
                });
            }
        }

        return results;
    }

    /**
     * Get queue status
     */
    getStatus() {
        return {
            queued: this.taskQueue.length,
            completed: this.completed.length,
            failed: this.failed.length,
            agents: agents
        };
    }

    /**
     * Get completed tasks
     */
    getCompleted() {
        return this.completed;
    }

    /**
     * Get failed tasks
     */
    getFailed() {
        return this.failed;
    }

    /**
     * Clear history
     */
    clear() {
        this.completed = [];
        this.failed = [];
    }
}

module.exports = ORBBrain;
