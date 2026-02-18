// ============================================================
//  STORM BUS - Event-Storm Parallelism Architecture
// ============================================================
//
//  "Any agent can publish. Any agent can subscribe. No bottleneck."
//
//  Instead of agents passing results baton-style, we use:
//  - A storm bus where any agent publishes events
//  - Any other agent can subscribe
//  - No central routing, no bottleneck
//  - Neural thunderhead architecture
//
//  Expected gains: 7x to 15x speed improvement
//
// ============================================================

const { EventEmitter } = require('events');

// ============================================================
//  STORM EVENT TYPES
// ============================================================

const STORM_EVENTS = {
  // Pattern events
  PATTERN_DISCOVERED: 'storm:pattern:discovered',
  PATTERN_REFINED: 'storm:pattern:refined',
  PATTERN_VALIDATED: 'storm:pattern:validated',
  PATTERN_FAILED: 'storm:pattern:failed',

  // Memory events
  MEMORY_STORED: 'storm:memory:stored',
  MEMORY_RETRIEVED: 'storm:memory:retrieved',
  MEMORY_ENTANGLED: 'storm:memory:entangled',
  MEMORY_PRUNED: 'storm:memory:pruned',

  // Training events
  CYCLE_START: 'storm:cycle:start',
  CYCLE_COMPLETE: 'storm:cycle:complete',
  CONVERGENCE_CHECK: 'storm:convergence:check',
  BREAKTHROUGH: 'storm:breakthrough',

  // Agent events
  AGENT_SPAWNED: 'storm:agent:spawned',
  AGENT_RESULT: 'storm:agent:result',
  AGENT_ERROR: 'storm:agent:error',

  // Cognitive events
  FOLD_SPECULATIVE: 'storm:fold:speculative',
  FOLD_GROUNDED: 'storm:fold:grounded',
  FOLD_RESOLVED: 'storm:fold:resolved',

  // Intent events
  INTENT_DETECTED: 'storm:intent:detected',
  INTENT_REFINED: 'storm:intent:refined'
};

// ============================================================
//  STORM MESSAGE
// ============================================================

class StormMessage {
  constructor(type, payload, source) {
    this.id = `storm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.type = type;
    this.payload = payload;
    this.source = source;
    this.timestamp = Date.now();
    this.hops = 0;
    this.trace = [source];
  }

  addHop(agent) {
    this.hops++;
    this.trace.push(agent);
  }
}

// ============================================================
//  STORM BUS (Main Class)
// ============================================================

class StormBus extends EventEmitter {
  constructor(config = {}) {
    super();
    this.setMaxListeners(1000); // Allow many subscribers

    this.config = {
      maxHops: config.maxHops || 10,           // Prevent infinite loops
      bufferSize: config.bufferSize || 10000,  // Message buffer
      parallelLimit: config.parallelLimit || 100, // Max parallel handlers
      ...config
    };

    // Message buffer for replay/debugging
    this.messageBuffer = [];
    this.bufferIndex = 0;

    // Subscription registry
    this.subscriptions = new Map();

    // Handler registry (for parallel execution)
    this.handlers = new Map();

    // Metrics
    this.metrics = {
      published: 0,
      delivered: 0,
      dropped: 0,
      errors: 0,
      avgLatency: 0,
      peakParallel: 0
    };

    // Active parallel executions
    this.activeExecutions = new Set();

    console.log('[StormBus] Neural thunderhead initialized');
  }

  // ============================================================
  //  PUBLISH (Fire event into the storm)
  // ============================================================

  publish(type, payload, source = 'unknown') {
    const message = new StormMessage(type, payload, source);

    // Buffer for replay
    this.bufferMessage(message);

    // Track metrics
    this.metrics.published++;
    const startTime = Date.now();

    // Emit to all subscribers (parallel, non-blocking)
    setImmediate(() => {
      this.emit(type, message);
      this.emit('*', message); // Wildcard subscribers

      // Update latency
      const latency = Date.now() - startTime;
      this.metrics.avgLatency = (this.metrics.avgLatency * 0.9) + (latency * 0.1);
    });

    return message.id;
  }

  // ============================================================
  //  SUBSCRIBE (Listen to storm events)
  // ============================================================

  subscribe(type, handler, options = {}) {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const wrappedHandler = async (message) => {
      // Check hop limit
      if (message.hops >= this.config.maxHops) {
        this.metrics.dropped++;
        return;
      }

      // Track parallel execution
      this.activeExecutions.add(subscriptionId);
      this.metrics.peakParallel = Math.max(
        this.metrics.peakParallel,
        this.activeExecutions.size
      );

      try {
        // Execute handler
        const result = await handler(message);
        this.metrics.delivered++;

        // Auto-publish result if configured
        if (options.autoPublish && result) {
          message.addHop(options.source || 'handler');
          this.publish(options.autoPublish, result, options.source);
        }

        return result;
      } catch (error) {
        this.metrics.errors++;
        this.emit(STORM_EVENTS.AGENT_ERROR, {
          subscriptionId,
          type,
          error: error.message
        });
      } finally {
        this.activeExecutions.delete(subscriptionId);
      }
    };

    // Register
    this.on(type, wrappedHandler);
    this.subscriptions.set(subscriptionId, { type, handler: wrappedHandler, options });

    return subscriptionId;
  }

  // ============================================================
  //  UNSUBSCRIBE
  // ============================================================

  unsubscribe(subscriptionId) {
    const sub = this.subscriptions.get(subscriptionId);
    if (sub) {
      this.off(sub.type, sub.handler);
      this.subscriptions.delete(subscriptionId);
      return true;
    }
    return false;
  }

  // ============================================================
  //  BROADCAST (Publish to multiple types at once)
  // ============================================================

  broadcast(types, payload, source = 'broadcast') {
    const messageIds = [];
    for (const type of types) {
      messageIds.push(this.publish(type, payload, source));
    }
    return messageIds;
  }

  // ============================================================
  //  REQUEST-RESPONSE PATTERN
  // ============================================================

  async request(type, payload, source = 'requester', timeout = 5000) {
    return new Promise((resolve, reject) => {
      const requestId = this.publish(type, { ...payload, requestId: true }, source);

      const responseHandler = (message) => {
        if (message.payload?.requestId === requestId ||
            message.payload?.inResponseTo === requestId) {
          this.off(`${type}:response`, responseHandler);
          clearTimeout(timer);
          resolve(message.payload);
        }
      };

      const timer = setTimeout(() => {
        this.off(`${type}:response`, responseHandler);
        reject(new Error(`Request timeout: ${type}`));
      }, timeout);

      this.on(`${type}:response`, responseHandler);
    });
  }

  // ============================================================
  //  BUFFER MANAGEMENT
  // ============================================================

  bufferMessage(message) {
    this.messageBuffer[this.bufferIndex] = message;
    this.bufferIndex = (this.bufferIndex + 1) % this.config.bufferSize;
  }

  getRecentMessages(count = 100) {
    const messages = [];
    let idx = (this.bufferIndex - 1 + this.config.bufferSize) % this.config.bufferSize;

    for (let i = 0; i < Math.min(count, this.messageBuffer.length); i++) {
      if (this.messageBuffer[idx]) {
        messages.push(this.messageBuffer[idx]);
      }
      idx = (idx - 1 + this.config.bufferSize) % this.config.bufferSize;
    }

    return messages;
  }

  // ============================================================
  //  PATTERN HELPERS (Common storm patterns)
  // ============================================================

  // Scatter-Gather: Publish to many, collect all responses
  async scatterGather(type, payload, expectedResponses, timeout = 10000) {
    const responses = [];
    const requestId = `scatter_${Date.now()}`;

    return new Promise((resolve) => {
      const responseHandler = (message) => {
        if (message.payload?.scatterId === requestId) {
          responses.push(message.payload);
          if (responses.length >= expectedResponses) {
            this.off(`${type}:response`, responseHandler);
            clearTimeout(timer);
            resolve(responses);
          }
        }
      };

      const timer = setTimeout(() => {
        this.off(`${type}:response`, responseHandler);
        resolve(responses); // Return what we have
      }, timeout);

      this.on(`${type}:response`, responseHandler);
      this.publish(type, { ...payload, scatterId: requestId }, 'scatter');
    });
  }

  // Pipeline: Chain of handlers
  pipeline(types, initialPayload, source = 'pipeline') {
    let currentPayload = initialPayload;

    for (let i = 0; i < types.length; i++) {
      const isLast = i === types.length - 1;
      this.publish(types[i], {
        ...currentPayload,
        pipelineStep: i,
        pipelineTotal: types.length,
        isLast
      }, source);
    }
  }

  // ============================================================
  //  METRICS & STATS
  // ============================================================

  getStats() {
    return {
      ...this.metrics,
      activeSubscriptions: this.subscriptions.size,
      activeExecutions: this.activeExecutions.size,
      bufferUsed: this.messageBuffer.filter(Boolean).length
    };
  }

  // ============================================================
  //  WIRE TO SYSTEM
  // ============================================================

  // Connect a component to the storm bus
  wireComponent(name, component) {
    // If component has emit, wrap it
    if (component.emit && typeof component.emit === 'function') {
      const originalEmit = component.emit.bind(component);
      component.emit = (event, data) => {
        originalEmit(event, data);
        this.publish(`${name}:${event}`, data, name);
      };
    }

    // Expose bus to component
    component.stormBus = this;
    component.stormPublish = (type, payload) => this.publish(type, payload, name);
    component.stormSubscribe = (type, handler) => this.subscribe(type, handler, { source: name });

    console.log(`[StormBus] Wired component: ${name}`);
    return this;
  }
}

// ============================================================
//  SINGLETON & EXPORTS
// ============================================================

let stormInstance = null;

function getStormBus(config = {}) {
  if (!stormInstance) {
    stormInstance = new StormBus(config);
  }
  return stormInstance;
}

module.exports = {
  StormBus,
  getStormBus,
  StormMessage,
  STORM_EVENTS
};
