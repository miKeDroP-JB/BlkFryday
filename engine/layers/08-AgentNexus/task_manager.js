/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   TASK MANAGER - Persistent Queue System                                  ║
 * ║   Enqueue, dequeue, and persist tasks to JSON                             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');

// Paths
const logsDir = path.join(__dirname, 'logs');
const queueFile = path.join(logsDir, 'task_queue.json');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize queue file if not exists
if (!fs.existsSync(queueFile)) {
    fs.writeFileSync(queueFile, '[]');
}

/**
 * Read the current queue from disk
 */
function readQueue() {
    try {
        const data = fs.readFileSync(queueFile, 'utf8');
        return JSON.parse(data || '[]');
    } catch (e) {
        console.error('[TaskManager] Error reading queue:', e.message);
        return [];
    }
}

/**
 * Write queue to disk
 */
function writeQueue(queue) {
    try {
        fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));
    } catch (e) {
        console.error('[TaskManager] Error writing queue:', e.message);
    }
}

/**
 * Add a task to the queue
 * @param {Object} task - Task object with agent, type, data
 * @returns {Object} The enqueued task with id and timestamp
 */
function enqueue(task) {
    const queue = readQueue();

    const enrichedTask = {
        id: task.id || `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        agent: task.agent,
        type: task.type,
        data: task.data || {},
        priority: task.priority || 'normal',
        created_at: new Date().toISOString(),
        status: 'queued'
    };

    queue.push(enrichedTask);
    writeQueue(queue);

    console.log(`[TaskManager] Enqueued: ${enrichedTask.type} -> ${enrichedTask.agent}`);
    return enrichedTask;
}

/**
 * Remove and return the next task from the queue
 * @returns {Object|null} The next task or null if queue is empty
 */
function dequeue() {
    const queue = readQueue();

    if (queue.length === 0) {
        return null;
    }

    // Sort by priority (high > normal > low)
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    queue.sort((a, b) => {
        const pa = priorityOrder[a.priority] ?? 1;
        const pb = priorityOrder[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        return new Date(a.created_at) - new Date(b.created_at);
    });

    const task = queue.shift();
    task.popped_at = new Date().toISOString();
    task.status = 'processing';

    writeQueue(queue);

    console.log(`[TaskManager] Dequeued: ${task.type} (${task.id})`);
    return task;
}

/**
 * Peek at the next task without removing it
 */
function peek() {
    const queue = readQueue();
    return queue[0] || null;
}

/**
 * Get all tasks in the queue
 */
function list() {
    return readQueue();
}

/**
 * Get queue length
 */
function length() {
    return readQueue().length;
}

/**
 * Clear all tasks from the queue
 */
function clear() {
    writeQueue([]);
    console.log('[TaskManager] Queue cleared');
}

/**
 * Remove a specific task by ID
 */
function remove(taskId) {
    const queue = readQueue();
    const idx = queue.findIndex(t => t.id === taskId);

    if (idx === -1) {
        return null;
    }

    const removed = queue.splice(idx, 1)[0];
    writeQueue(queue);
    console.log(`[TaskManager] Removed: ${taskId}`);
    return removed;
}

/**
 * Update a task's status
 */
function updateStatus(taskId, status, result = null) {
    const queue = readQueue();
    const task = queue.find(t => t.id === taskId);

    if (task) {
        task.status = status;
        task.updated_at = new Date().toISOString();
        if (result) task.result = result;
        writeQueue(queue);
    }

    return task;
}

/**
 * Get tasks by agent
 */
function getByAgent(agentName) {
    return readQueue().filter(t => t.agent === agentName);
}

/**
 * Get tasks by type
 */
function getByType(taskType) {
    return readQueue().filter(t => t.type === taskType);
}

/**
 * Batch enqueue multiple tasks
 */
function enqueueBatch(tasks) {
    return tasks.map(t => enqueue(t));
}

module.exports = {
    enqueue,
    dequeue,
    peek,
    list,
    length,
    clear,
    remove,
    updateStatus,
    getByAgent,
    getByType,
    enqueueBatch,
    queueFile
};
