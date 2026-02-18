/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   TASK QUEUE - Priority-Based Task Management                             ║
 * ║   Persistent, prioritized, and category-aware task scheduling             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

// Task priorities (higher = more urgent)
const PRIORITY = {
    CRITICAL: 100,    // Must execute immediately
    HIGH: 75,         // Revenue-generating tasks
    NORMAL: 50,       // Standard operations
    LOW: 25,          // Background tasks
    IDLE: 0           // Execute when nothing else pending
};

// Task categories
const CATEGORIES = {
    REVENUE: 'revenue',       // Money-making tasks
    SECURITY: 'security',     // Bug bounty, scanning
    OUTREACH: 'outreach',     // Client acquisition
    CONTENT: 'content',       // Content creation
    MAINTENANCE: 'maintenance', // System upkeep
    RESEARCH: 'research'      // Information gathering
};

class TaskQueue extends EventEmitter {
    constructor(config = {}) {
        super();

        this.config = {
            persistPath: config.persistPath || path.join(__dirname, '../../data/task_queue.json'),
            maxTasks: config.maxTasks || 1000,
            autoPersist: config.autoPersist !== false,
            persistInterval: config.persistInterval || 30000, // 30 seconds
            ...config
        };

        // Main queue (priority sorted)
        this.queue = [];

        // Scheduled tasks (future execution)
        this.scheduled = [];

        // Recurring tasks
        this.recurring = new Map();

        // Statistics
        this.stats = {
            totalQueued: 0,
            totalProcessed: 0,
            byCategory: {},
            byPriority: {},
            avgWaitTime: 0
        };

        // Persistence timer
        this.persistTimer = null;

        this.initialize();
    }

    initialize() {
        // Load persisted queue
        this.load();

        // Start auto-persist
        if (this.config.autoPersist) {
            this.persistTimer = setInterval(() => this.persist(), this.config.persistInterval);
        }

        // Process scheduled tasks
        setInterval(() => this.checkScheduled(), 10000); // Every 10 seconds

        console.log('[TaskQueue] Initialized with', this.queue.length, 'pending tasks');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QUEUE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Add a task to the queue
     */
    enqueue(task) {
        const queuedTask = {
            id: task.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: task.type,
            payload: task.payload || {},
            priority: task.priority || PRIORITY.NORMAL,
            category: task.category || CATEGORIES.MAINTENANCE,
            agent: task.agent || null,
            createdAt: Date.now(),
            scheduledFor: task.scheduledFor || null,
            deadline: task.deadline || null,
            retries: 0,
            maxRetries: task.maxRetries || 3,
            metadata: task.metadata || {}
        };

        // Check if scheduled for future
        if (queuedTask.scheduledFor && queuedTask.scheduledFor > Date.now()) {
            this.scheduled.push(queuedTask);
            this.scheduled.sort((a, b) => a.scheduledFor - b.scheduledFor);
            this.emit('task:scheduled', queuedTask);
            return queuedTask;
        }

        // Add to main queue
        this.queue.push(queuedTask);
        this.sortQueue();

        // Update stats
        this.stats.totalQueued++;
        this.stats.byCategory[queuedTask.category] =
            (this.stats.byCategory[queuedTask.category] || 0) + 1;

        // Enforce max size
        if (this.queue.length > this.config.maxTasks) {
            const removed = this.queue.pop(); // Remove lowest priority
            this.emit('task:dropped', removed);
        }

        this.emit('task:enqueued', queuedTask);
        return queuedTask;
    }

    /**
     * Get next task from queue
     */
    dequeue() {
        if (this.queue.length === 0) {
            return null;
        }

        const task = this.queue.shift();
        task.dequeuedAt = Date.now();
        task.waitTime = task.dequeuedAt - task.createdAt;

        // Update average wait time
        this.stats.avgWaitTime = (
            (this.stats.avgWaitTime * this.stats.totalProcessed + task.waitTime) /
            (this.stats.totalProcessed + 1)
        );
        this.stats.totalProcessed++;

        this.emit('task:dequeued', task);
        return task;
    }

    /**
     * Peek at next task without removing
     */
    peek() {
        return this.queue[0] || null;
    }

    /**
     * Get multiple tasks
     */
    dequeueMany(count) {
        const tasks = [];
        for (let i = 0; i < count && this.queue.length > 0; i++) {
            tasks.push(this.dequeue());
        }
        return tasks;
    }

    /**
     * Sort queue by priority and deadline
     */
    sortQueue() {
        this.queue.sort((a, b) => {
            // First by priority (descending)
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }

            // Then by deadline (ascending, null = no deadline)
            if (a.deadline && b.deadline) {
                return a.deadline - b.deadline;
            }
            if (a.deadline) return -1;
            if (b.deadline) return 1;

            // Finally by creation time (FIFO for same priority)
            return a.createdAt - b.createdAt;
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SCHEDULED TASKS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Check and move scheduled tasks to main queue
     */
    checkScheduled() {
        const now = Date.now();
        const ready = [];

        while (this.scheduled.length > 0 && this.scheduled[0].scheduledFor <= now) {
            const task = this.scheduled.shift();
            task.scheduledFor = null; // Clear scheduled time
            ready.push(task);
        }

        // Add ready tasks to main queue
        for (const task of ready) {
            this.queue.push(task);
            this.emit('task:ready', task);
        }

        if (ready.length > 0) {
            this.sortQueue();
        }
    }

    /**
     * Schedule a task for future execution
     */
    schedule(task, executeAt) {
        task.scheduledFor = typeof executeAt === 'number' ? executeAt : new Date(executeAt).getTime();
        return this.enqueue(task);
    }

    /**
     * Schedule a task with delay
     */
    delay(task, delayMs) {
        return this.schedule(task, Date.now() + delayMs);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RECURRING TASKS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Add a recurring task
     */
    addRecurring(id, task, intervalMs) {
        if (this.recurring.has(id)) {
            this.removeRecurring(id);
        }

        const recurring = {
            task: { ...task },
            interval: intervalMs,
            lastRun: null,
            timer: setInterval(() => {
                const newTask = { ...recurring.task, id: `${id}_${Date.now()}` };
                this.enqueue(newTask);
                recurring.lastRun = Date.now();
            }, intervalMs)
        };

        this.recurring.set(id, recurring);

        // Run immediately
        const initialTask = { ...task, id: `${id}_${Date.now()}` };
        this.enqueue(initialTask);

        this.emit('recurring:added', { id, interval: intervalMs });
        return id;
    }

    /**
     * Remove a recurring task
     */
    removeRecurring(id) {
        const recurring = this.recurring.get(id);
        if (recurring) {
            clearInterval(recurring.timer);
            this.recurring.delete(id);
            this.emit('recurring:removed', id);
            return true;
        }
        return false;
    }

    /**
     * List all recurring tasks
     */
    listRecurring() {
        const list = [];
        for (const [id, recurring] of this.recurring) {
            list.push({
                id,
                task: recurring.task,
                interval: recurring.interval,
                lastRun: recurring.lastRun
            });
        }
        return list;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QUERY & MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Find task by ID
     */
    find(taskId) {
        return this.queue.find(t => t.id === taskId) ||
               this.scheduled.find(t => t.id === taskId);
    }

    /**
     * Remove task by ID
     */
    remove(taskId) {
        let idx = this.queue.findIndex(t => t.id === taskId);
        if (idx !== -1) {
            const removed = this.queue.splice(idx, 1)[0];
            this.emit('task:removed', removed);
            return removed;
        }

        idx = this.scheduled.findIndex(t => t.id === taskId);
        if (idx !== -1) {
            const removed = this.scheduled.splice(idx, 1)[0];
            this.emit('task:removed', removed);
            return removed;
        }

        return null;
    }

    /**
     * Get tasks by category
     */
    getByCategory(category) {
        return this.queue.filter(t => t.category === category);
    }

    /**
     * Get tasks by priority
     */
    getByPriority(priority) {
        return this.queue.filter(t => t.priority === priority);
    }

    /**
     * Get tasks by agent
     */
    getByAgent(agent) {
        return this.queue.filter(t => t.agent === agent);
    }

    /**
     * Clear all tasks
     */
    clear() {
        const count = this.queue.length;
        this.queue = [];
        this.scheduled = [];
        this.emit('queue:cleared', count);
        return count;
    }

    /**
     * Requeue a failed task
     */
    requeue(task) {
        task.retries++;
        if (task.retries <= task.maxRetries) {
            // Lower priority on retry
            task.priority = Math.max(0, task.priority - 10);
            this.enqueue(task);
            return true;
        }
        return false;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PERSISTENCE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Save queue to disk
     */
    persist() {
        try {
            const data = {
                queue: this.queue,
                scheduled: this.scheduled,
                recurring: Array.from(this.recurring.entries()).map(([id, r]) => ({
                    id,
                    task: r.task,
                    interval: r.interval,
                    lastRun: r.lastRun
                })),
                stats: this.stats,
                savedAt: Date.now()
            };

            const dir = path.dirname(this.config.persistPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(this.config.persistPath, JSON.stringify(data, null, 2));
            this.emit('queue:persisted');

        } catch (error) {
            console.error('[TaskQueue] Persist error:', error.message);
        }
    }

    /**
     * Load queue from disk
     */
    load() {
        try {
            if (!fs.existsSync(this.config.persistPath)) {
                return;
            }

            const data = JSON.parse(fs.readFileSync(this.config.persistPath, 'utf8'));

            this.queue = data.queue || [];
            this.scheduled = data.scheduled || [];
            this.stats = { ...this.stats, ...data.stats };

            // Restore recurring tasks
            if (data.recurring) {
                for (const r of data.recurring) {
                    this.addRecurring(r.id, r.task, r.interval);
                }
            }

            // Re-sort queue
            this.sortQueue();

            this.emit('queue:loaded', {
                tasks: this.queue.length,
                scheduled: this.scheduled.length,
                recurring: this.recurring.size
            });

        } catch (error) {
            console.error('[TaskQueue] Load error:', error.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get queue length
     */
    get length() {
        return this.queue.length;
    }

    /**
     * Check if queue is empty
     */
    get isEmpty() {
        return this.queue.length === 0;
    }

    /**
     * Get queue statistics
     */
    getStats() {
        return {
            ...this.stats,
            current: {
                queued: this.queue.length,
                scheduled: this.scheduled.length,
                recurring: this.recurring.size
            },
            byPriority: {
                critical: this.queue.filter(t => t.priority === PRIORITY.CRITICAL).length,
                high: this.queue.filter(t => t.priority === PRIORITY.HIGH).length,
                normal: this.queue.filter(t => t.priority === PRIORITY.NORMAL).length,
                low: this.queue.filter(t => t.priority === PRIORITY.LOW).length,
                idle: this.queue.filter(t => t.priority === PRIORITY.IDLE).length
            }
        };
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.persistTimer) {
            clearInterval(this.persistTimer);
        }

        // Clean up recurring timers
        for (const [id] of this.recurring) {
            this.removeRecurring(id);
        }

        // Final persist
        this.persist();

        this.removeAllListeners();
    }
}

// Export
module.exports = TaskQueue;
module.exports.PRIORITY = PRIORITY;
module.exports.CATEGORIES = CATEGORIES;
