// ============================================================
//  ORBOS V11.5 - PRIORITY EXECUTOR
//  Execute system functions by importance (highest → lowest)
// ============================================================
//
//  Execution Order: CRITICAL → HIGH → MEDIUM → LOW → BACKGROUND
//  Amoeba Principle: Adapt execution order based on conditions
//
// ============================================================

const { EventEmitter } = require('events');

class PriorityExecutor extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;

    // ============================================================
    //  PRIORITY LEVELS
    // ============================================================

    this.priorityLevels = {
      CRITICAL: { level: 100, color: 'red', timeout: 1000, retries: 3 },
      HIGH: { level: 80, color: 'orange', timeout: 5000, retries: 2 },
      MEDIUM: { level: 60, color: 'yellow', timeout: 10000, retries: 1 },
      LOW: { level: 40, color: 'blue', timeout: 30000, retries: 0 },
      BACKGROUND: { level: 20, color: 'gray', timeout: 60000, retries: 0 }
    };

    // ============================================================
    //  EXECUTION QUEUES
    // ============================================================

    this.queues = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
      BACKGROUND: []
    };

    // ============================================================
    //  STATE
    // ============================================================

    this.state = {
      running: false,
      currentPriority: null,
      executing: null,
      stats: {
        executed: 0,
        succeeded: 0,
        failed: 0,
        retried: 0,
        timeouts: 0
      }
    };

    // Active executions (for parallel)
    this.activeExecutions = new Map();
    this.maxConcurrent = config.maxConcurrent || 5;

    // Resource pool (Amoeba: cells assigned to execution)
    this.resourcePool = {
      total: config.resourceCells || 20,
      available: config.resourceCells || 20,
      allocations: new Map()
    };
  }

  // ============================================================
  //  TASK SUBMISSION
  // ============================================================

  submit(task, priority = 'MEDIUM') {
    const taskWrapper = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      task,
      priority,
      submittedAt: Date.now(),
      status: 'queued',
      attempts: 0,
      result: null,
      error: null
    };

    // Validate priority
    if (!this.queues[priority]) {
      priority = 'MEDIUM';
    }

    this.queues[priority].push(taskWrapper);

    this.emit('task-submitted', {
      id: taskWrapper.id,
      priority,
      queuePosition: this.queues[priority].length
    });

    // If not running, start processing
    if (!this.state.running) {
      this.start();
    }

    return taskWrapper.id;
  }

  submitCritical(task) {
    return this.submit(task, 'CRITICAL');
  }

  submitHigh(task) {
    return this.submit(task, 'HIGH');
  }

  submitBackground(task) {
    return this.submit(task, 'BACKGROUND');
  }

  // ============================================================
  //  EXECUTION ENGINE
  // ============================================================

  async start() {
    if (this.state.running) return;

    this.state.running = true;
    console.log('[PriorityExecutor] Starting execution engine...');

    while (this.state.running) {
      await this.executionCycle();
      await this.sleep(100); // Small delay between cycles
    }
  }

  stop() {
    this.state.running = false;
    console.log('[PriorityExecutor] Stopping...');
  }

  async executionCycle() {
    // Process queues in priority order
    for (const priority of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'BACKGROUND']) {
      const queue = this.queues[priority];
      if (queue.length === 0) continue;

      this.state.currentPriority = priority;

      // Check resource availability
      const available = this.resourcePool.available;
      const needed = this.getResourcesNeeded(priority);

      if (available < needed) {
        // Wait or preempt lower priority (Amoeba: flow around obstacle)
        if (priority === 'CRITICAL' || priority === 'HIGH') {
          await this.preemptLowerPriority(priority, needed);
        } else {
          continue; // Skip, wait for resources
        }
      }

      // Execute tasks from this priority level
      while (queue.length > 0 && this.resourcePool.available >= needed) {
        const taskWrapper = queue.shift();
        await this.executeTask(taskWrapper, priority);
      }

      // Critical and High priorities block lower until cleared
      if ((priority === 'CRITICAL' || priority === 'HIGH') && queue.length > 0) {
        break;
      }
    }

    this.state.currentPriority = null;
  }

  async executeTask(taskWrapper, priority) {
    const config = this.priorityLevels[priority];
    const resourcesNeeded = this.getResourcesNeeded(priority);

    // Allocate resources
    this.allocateResources(taskWrapper.id, resourcesNeeded);

    taskWrapper.status = 'executing';
    taskWrapper.startedAt = Date.now();
    taskWrapper.attempts++;

    this.state.executing = taskWrapper.id;
    this.activeExecutions.set(taskWrapper.id, taskWrapper);

    try {
      // Execute with timeout
      const result = await Promise.race([
        this.runTask(taskWrapper.task),
        this.timeout(config.timeout, taskWrapper.id)
      ]);

      taskWrapper.result = result;
      taskWrapper.status = 'completed';
      taskWrapper.completedAt = Date.now();
      taskWrapper.duration = taskWrapper.completedAt - taskWrapper.startedAt;

      this.state.stats.executed++;
      this.state.stats.succeeded++;

      this.emit('task-completed', {
        id: taskWrapper.id,
        priority,
        duration: taskWrapper.duration,
        result
      });

    } catch (error) {
      taskWrapper.error = error.message;

      if (error.message === 'TIMEOUT') {
        this.state.stats.timeouts++;
      }

      // Retry logic
      if (taskWrapper.attempts < config.retries) {
        taskWrapper.status = 'retry';
        this.queues[priority].unshift(taskWrapper); // Put back at front
        this.state.stats.retried++;

        this.emit('task-retry', {
          id: taskWrapper.id,
          attempt: taskWrapper.attempts,
          maxRetries: config.retries
        });
      } else {
        taskWrapper.status = 'failed';
        this.state.stats.failed++;

        this.emit('task-failed', {
          id: taskWrapper.id,
          priority,
          error: error.message,
          attempts: taskWrapper.attempts
        });
      }

    } finally {
      // Release resources
      this.releaseResources(taskWrapper.id);
      this.activeExecutions.delete(taskWrapper.id);
      this.state.executing = null;
    }
  }

  async runTask(task) {
    if (typeof task === 'function') {
      return await task();
    }

    if (task.execute && typeof task.execute === 'function') {
      return await task.execute();
    }

    if (task.run && typeof task.run === 'function') {
      return await task.run();
    }

    // Task is just data, return it
    return task;
  }

  timeout(ms, taskId) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), ms);
    });
  }

  // ============================================================
  //  RESOURCE MANAGEMENT (Amoeba Cells)
  // ============================================================

  getResourcesNeeded(priority) {
    // Higher priority = more resources
    const resourceMap = {
      CRITICAL: 5,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
      BACKGROUND: 1
    };
    return resourceMap[priority] || 1;
  }

  allocateResources(taskId, count) {
    if (this.resourcePool.available < count) {
      throw new Error('Insufficient resources');
    }

    this.resourcePool.available -= count;
    this.resourcePool.allocations.set(taskId, count);
  }

  releaseResources(taskId) {
    const count = this.resourcePool.allocations.get(taskId) || 0;
    this.resourcePool.available += count;
    this.resourcePool.allocations.delete(taskId);
  }

  async preemptLowerPriority(targetPriority, needed) {
    // Amoeba: Shapeshift resources from lower priority tasks
    console.log(`[PriorityExecutor] Preempting for ${targetPriority} (need ${needed})`);

    const lowerPriorities = {
      CRITICAL: ['HIGH', 'MEDIUM', 'LOW', 'BACKGROUND'],
      HIGH: ['MEDIUM', 'LOW', 'BACKGROUND']
    };

    const toPreempt = lowerPriorities[targetPriority] || [];

    for (const lower of toPreempt) {
      if (this.resourcePool.available >= needed) break;

      // Find active tasks at this priority
      for (const [taskId, task] of this.activeExecutions) {
        if (task.priority === lower) {
          // Pause/suspend this task
          const released = this.resourcePool.allocations.get(taskId) || 0;
          this.releaseResources(taskId);

          // Re-queue the task
          task.status = 'preempted';
          this.queues[lower].unshift(task);
          this.activeExecutions.delete(taskId);

          console.log(`[PriorityExecutor] Preempted ${taskId} (released ${released})`);

          if (this.resourcePool.available >= needed) break;
        }
      }
    }
  }

  // ============================================================
  //  ADAPTIVE EXECUTION (Amoeba Principles)
  // ============================================================

  adaptPriorities(conditions) {
    // Shapeshift: Adjust priority levels based on system conditions

    if (conditions.underAttack) {
      // Elevate security tasks
      this.promoteTasks('security', 'CRITICAL');
    }

    if (conditions.lowResources) {
      // Defer background tasks
      this.deferPriority('BACKGROUND');
    }

    if (conditions.highLoad) {
      // Batch similar tasks
      this.batchSimilarTasks();
    }
  }

  promoteTasks(tag, newPriority) {
    // Find tasks with tag and move to higher priority
    for (const [priority, queue] of Object.entries(this.queues)) {
      if (priority === newPriority) continue;

      const toPromote = queue.filter(t => t.task.tags?.includes(tag));

      for (const task of toPromote) {
        const idx = queue.indexOf(task);
        queue.splice(idx, 1);
        task.priority = newPriority;
        this.queues[newPriority].push(task);
      }
    }
  }

  deferPriority(priority) {
    // Move tasks to later execution
    const queue = this.queues[priority];

    for (const task of queue) {
      task.deferredUntil = Date.now() + 60000; // Defer 1 minute
    }
  }

  batchSimilarTasks() {
    // Group similar tasks for batch execution
    for (const [priority, queue] of Object.entries(this.queues)) {
      const batches = new Map();

      for (const task of queue) {
        const batchKey = task.task.type || 'default';
        if (!batches.has(batchKey)) {
          batches.set(batchKey, []);
        }
        batches.get(batchKey).push(task);
      }

      // Replace queue with batched tasks
      this.queues[priority] = [];
      for (const [key, batch] of batches) {
        if (batch.length > 1) {
          // Create batch task
          this.queues[priority].push({
            id: `batch_${Date.now()}`,
            task: { type: 'batch', tasks: batch },
            priority,
            submittedAt: Date.now(),
            status: 'queued',
            attempts: 0
          });
        } else {
          this.queues[priority].push(...batch);
        }
      }
    }
  }

  // ============================================================
  //  STATISTICS
  // ============================================================

  getStats() {
    return {
      state: this.state,
      queues: {
        CRITICAL: this.queues.CRITICAL.length,
        HIGH: this.queues.HIGH.length,
        MEDIUM: this.queues.MEDIUM.length,
        LOW: this.queues.LOW.length,
        BACKGROUND: this.queues.BACKGROUND.length
      },
      resources: {
        total: this.resourcePool.total,
        available: this.resourcePool.available,
        allocated: this.resourcePool.total - this.resourcePool.available
      },
      activeExecutions: this.activeExecutions.size
    };
  }

  getQueueDepth() {
    return Object.values(this.queues).reduce((sum, q) => sum + q.length, 0);
  }

  // ============================================================
  //  UTILITIES
  // ============================================================

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { PriorityExecutor };
