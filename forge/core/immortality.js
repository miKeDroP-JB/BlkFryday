/**
 * ORBITAL FORGE - LAYER 1: IMMORTALITY
 * ═══════════════════════════════════════════════════════════════════
 * Node 1: Compute Immortality - Hardware stays on, software restarts
 * Node 2: State Persistence - Nothing meaningful lives in RAM only
 * Node 3: Control Surface - One command channel
 *
 * "The system remembers even when no one is watching."
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════
// NODE 1: COMPUTE IMMORTALITY
// ═══════════════════════════════════════════════════════════════════

/**
 * WatchdogTimer - Ensures system stays alive
 */
class WatchdogTimer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.interval = config.interval || 5000;
    this.maxMisses = config.maxMisses || 3;
    this.missCount = 0;
    this.timer = null;
    this.lastPet = Date.now();
    this.onDeath = config.onDeath || (() => process.exit(1));
  }

  start() {
    this.timer = setInterval(() => {
      const elapsed = Date.now() - this.lastPet;
      if (elapsed > this.interval) {
        this.missCount++;
        this.emit('miss', { count: this.missCount, elapsed });

        if (this.missCount >= this.maxMisses) {
          this.emit('death', { missCount: this.missCount });
          this.onDeath();
        }
      }
    }, this.interval);

    this.emit('started');
    return this;
  }

  pet() {
    this.lastPet = Date.now();
    this.missCount = 0;
    this.emit('pet');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit('stopped');
  }
}

/**
 * ProcessGuard - Auto-restart on crash
 */
class ProcessGuard {
  constructor(config = {}) {
    this.restartDelay = config.restartDelay || 1000;
    this.maxRestarts = config.maxRestarts || 10;
    this.restartWindow = config.restartWindow || 60000;
    this.restarts = [];
    this.handlers = new Map();
  }

  install() {
    // Catch uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('[GUARD] Uncaught Exception:', error);
      this.handleCrash('uncaughtException', error);
    });

    // Catch unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[GUARD] Unhandled Rejection:', reason);
      this.handleCrash('unhandledRejection', reason);
    });

    // Graceful shutdown signals
    ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
      process.on(signal, () => {
        console.log(`[GUARD] Received ${signal}`);
        this.gracefulShutdown(signal);
      });
    });

    console.log('[GUARD] Process guard installed');
    return this;
  }

  onCrash(handler) {
    this.handlers.set('crash', handler);
    return this;
  }

  onShutdown(handler) {
    this.handlers.set('shutdown', handler);
    return this;
  }

  handleCrash(type, error) {
    // Track restart frequency
    const now = Date.now();
    this.restarts = this.restarts.filter(t => now - t < this.restartWindow);
    this.restarts.push(now);

    if (this.restarts.length >= this.maxRestarts) {
      console.error('[GUARD] Too many restarts, giving up');
      process.exit(1);
    }

    // Call crash handler
    const handler = this.handlers.get('crash');
    if (handler) {
      handler(type, error);
    }

    // Log crash for post-mortem
    const crashLog = {
      type,
      error: error?.message || String(error),
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      restartCount: this.restarts.length
    };

    console.log('[GUARD] Crash logged:', JSON.stringify(crashLog));
  }

  gracefulShutdown(signal) {
    const handler = this.handlers.get('shutdown');
    if (handler) {
      handler(signal);
    }
    process.exit(0);
  }
}

// ═══════════════════════════════════════════════════════════════════
// NODE 2: STATE PERSISTENCE
// ═══════════════════════════════════════════════════════════════════

/**
 * AppendLog - Append-only log for durability
 */
class AppendLog {
  constructor(config = {}) {
    this.path = config.path || './forge.log';
    this.maxSize = config.maxSize || 10 * 1024 * 1024; // 10MB
    this.rotateCount = config.rotateCount || 5;
    this.buffer = [];
    this.flushInterval = config.flushInterval || 1000;
    this.flushTimer = null;
  }

  async initialize() {
    const dir = path.dirname(this.path);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Start flush timer
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);

    return this;
  }

  append(entry) {
    const record = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      data: entry
    };

    this.buffer.push(JSON.stringify(record) + '\n');

    if (this.buffer.length >= 100) {
      this.flush();
    }

    return record.id;
  }

  flush() {
    if (this.buffer.length === 0) return;

    const data = this.buffer.join('');
    this.buffer = [];

    try {
      fs.appendFileSync(this.path, data);
      this.checkRotation();
    } catch (error) {
      console.error('[LOG] Flush failed:', error);
      // Re-add to buffer for retry
      this.buffer.unshift(data);
    }
  }

  checkRotation() {
    try {
      const stats = fs.statSync(this.path);
      if (stats.size > this.maxSize) {
        this.rotate();
      }
    } catch (error) {
      // File doesn't exist yet
    }
  }

  rotate() {
    // Rotate existing files
    for (let i = this.rotateCount - 1; i >= 0; i--) {
      const src = i === 0 ? this.path : `${this.path}.${i}`;
      const dst = `${this.path}.${i + 1}`;

      if (fs.existsSync(src)) {
        if (i === this.rotateCount - 1) {
          fs.unlinkSync(src);
        } else {
          fs.renameSync(src, dst);
        }
      }
    }

    console.log('[LOG] Rotated logs');
  }

  *read() {
    if (!fs.existsSync(this.path)) return;

    const content = fs.readFileSync(this.path, 'utf-8');
    const lines = content.split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        yield JSON.parse(line);
      } catch (error) {
        console.error('[LOG] Parse error:', error);
      }
    }
  }

  close() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

/**
 * StateStore - Persistent state storage with snapshots
 */
class StateStore extends EventEmitter {
  constructor(config = {}) {
    super();
    this.path = config.path || './forge-state.json';
    this.snapshotInterval = config.snapshotInterval || 30000;
    this.state = {};
    this.dirty = false;
    this.snapshotTimer = null;
    this.version = 0;
  }

  async initialize() {
    // Load existing state
    if (fs.existsSync(this.path)) {
      try {
        const data = fs.readFileSync(this.path, 'utf-8');
        const loaded = JSON.parse(data);
        this.state = loaded.state || {};
        this.version = loaded.version || 0;
        console.log(`[STATE] Loaded state v${this.version}`);
      } catch (error) {
        console.error('[STATE] Failed to load state:', error);
        this.state = {};
      }
    }

    // Start snapshot timer
    this.snapshotTimer = setInterval(() => {
      if (this.dirty) {
        this.snapshot();
      }
    }, this.snapshotInterval);

    return this;
  }

  get(key, defaultValue = null) {
    return key in this.state ? this.state[key] : defaultValue;
  }

  set(key, value) {
    this.state[key] = value;
    this.dirty = true;
    this.emit('change', { key, value });
    return this;
  }

  delete(key) {
    delete this.state[key];
    this.dirty = true;
    this.emit('delete', { key });
    return this;
  }

  has(key) {
    return key in this.state;
  }

  keys() {
    return Object.keys(this.state);
  }

  snapshot() {
    this.version++;
    const data = {
      version: this.version,
      timestamp: Date.now(),
      state: this.state
    };

    try {
      // Write to temp file first, then rename (atomic)
      const tmpPath = `${this.path}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
      fs.renameSync(tmpPath, this.path);

      this.dirty = false;
      this.emit('snapshot', { version: this.version });
      console.log(`[STATE] Snapshot v${this.version} saved`);
    } catch (error) {
      console.error('[STATE] Snapshot failed:', error);
    }
  }

  close() {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }
    if (this.dirty) {
      this.snapshot();
    }
  }
}

/**
 * GraphStore - Persistent graph storage
 */
class GraphStore {
  constructor(config = {}) {
    this.basePath = config.basePath || './forge-graphs';
  }

  async initialize() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
    return this;
  }

  getPath(graphId) {
    return path.join(this.basePath, `${graphId}.json`);
  }

  save(graph) {
    const data = typeof graph.toJSON === 'function' ? graph.toJSON() : graph;
    const filePath = this.getPath(data.id);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[GRAPHS] Saved: ${data.id}`);

    return data.id;
  }

  load(graphId) {
    const filePath = this.getPath(graphId);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return data;
  }

  list() {
    if (!fs.existsSync(this.basePath)) return [];

    return fs.readdirSync(this.basePath)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }

  delete(graphId) {
    const filePath = this.getPath(graphId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// NODE 3: CONTROL SURFACE
// ═══════════════════════════════════════════════════════════════════

/**
 * CommandParser - Parse and normalize commands
 */
class CommandParser {
  constructor() {
    this.handlers = new Map();
    this.aliases = new Map();
    this.middleware = [];
  }

  /**
   * Register command handler
   */
  register(command, handler, config = {}) {
    this.handlers.set(command, {
      handler,
      description: config.description || '',
      usage: config.usage || command,
      aliases: config.aliases || []
    });

    // Register aliases
    (config.aliases || []).forEach(alias => {
      this.aliases.set(alias, command);
    });

    return this;
  }

  /**
   * Add middleware
   */
  use(fn) {
    this.middleware.push(fn);
    return this;
  }

  /**
   * Parse and execute command
   */
  async execute(input, context = {}) {
    // Normalize input
    const normalized = this.normalize(input);
    if (!normalized) return { error: 'Empty command' };

    const { command, args, raw } = normalized;

    // Resolve alias
    const resolvedCommand = this.aliases.get(command) || command;

    // Get handler
    const registration = this.handlers.get(resolvedCommand);
    if (!registration) {
      return {
        error: `Unknown command: ${command}`,
        suggestions: this.findSimilar(command)
      };
    }

    // Build context
    const ctx = {
      command: resolvedCommand,
      args,
      raw,
      ...context
    };

    // Run middleware
    for (const mw of this.middleware) {
      try {
        await mw(ctx);
      } catch (error) {
        return { error: `Middleware error: ${error.message}` };
      }
    }

    // Execute handler
    try {
      const result = await registration.handler(args, ctx);
      return { success: true, result };
    } catch (error) {
      return { error: error.message, stack: error.stack };
    }
  }

  /**
   * Normalize input to command structure
   */
  normalize(input) {
    if (!input || typeof input !== 'string') return null;

    const trimmed = input.trim();
    if (!trimmed) return null;

    // Parse command and arguments
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    return {
      command,
      args,
      raw: trimmed
    };
  }

  /**
   * Find similar commands (for suggestions)
   */
  findSimilar(input) {
    const commands = Array.from(this.handlers.keys());
    return commands.filter(cmd =>
      cmd.includes(input) || input.includes(cmd)
    ).slice(0, 3);
  }

  /**
   * Get help for commands
   */
  getHelp(command = null) {
    if (command) {
      const reg = this.handlers.get(command);
      if (!reg) return null;
      return {
        command,
        description: reg.description,
        usage: reg.usage,
        aliases: reg.aliases
      };
    }

    return Array.from(this.handlers.entries()).map(([cmd, reg]) => ({
      command: cmd,
      description: reg.description,
      usage: reg.usage
    }));
  }
}

/**
 * IntentRouter - Route intents to appropriate handlers
 */
class IntentRouter extends EventEmitter {
  constructor() {
    super();
    this.routes = new Map();
    this.defaultRoute = null;
    this.interceptors = [];
  }

  /**
   * Register route for intent pattern
   */
  route(pattern, handler) {
    if (typeof pattern === 'string') {
      pattern = new RegExp(pattern, 'i');
    }
    this.routes.set(pattern, handler);
    return this;
  }

  /**
   * Set default handler
   */
  default(handler) {
    this.defaultRoute = handler;
    return this;
  }

  /**
   * Add interceptor
   */
  intercept(fn) {
    this.interceptors.push(fn);
    return this;
  }

  /**
   * Route an intent
   */
  async dispatch(intent, context = {}) {
    this.emit('dispatch', { intent, context });

    // Run interceptors
    for (const interceptor of this.interceptors) {
      const result = await interceptor(intent, context);
      if (result === false) {
        return { intercepted: true };
      }
      if (result) {
        context = { ...context, ...result };
      }
    }

    // Find matching route
    for (const [pattern, handler] of this.routes) {
      const match = intent.match(pattern);
      if (match) {
        this.emit('match', { pattern, intent, match });
        return handler(intent, { ...context, match });
      }
    }

    // Default route
    if (this.defaultRoute) {
      return this.defaultRoute(intent, context);
    }

    return { error: 'No route matched', intent };
  }
}

/**
 * ControlHub - Unified control surface
 */
class ControlHub extends EventEmitter {
  constructor(config = {}) {
    super();
    this.parser = new CommandParser();
    this.router = new IntentRouter();
    this.channels = new Map();
    this.history = [];
    this.maxHistory = config.maxHistory || 1000;
  }

  /**
   * Register a command
   */
  command(name, handler, config) {
    this.parser.register(name, handler, config);
    return this;
  }

  /**
   * Register an intent route
   */
  intent(pattern, handler) {
    this.router.route(pattern, handler);
    return this;
  }

  /**
   * Add input channel
   */
  addChannel(name, channel) {
    this.channels.set(name, channel);

    // Subscribe to channel events
    if (channel.on) {
      channel.on('input', (input) => {
        this.process(input, { channel: name });
      });
    }

    return this;
  }

  /**
   * Process input from any channel
   */
  async process(input, context = {}) {
    // Record in history
    this.history.push({
      input,
      context,
      timestamp: Date.now()
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.emit('input', { input, context });

    // Try as command first
    if (typeof input === 'string' && input.startsWith('/')) {
      const result = await this.parser.execute(input.slice(1), context);
      this.emit('output', { type: 'command', input, result });
      return result;
    }

    // Route as intent
    const result = await this.router.dispatch(input, context);
    this.emit('output', { type: 'intent', input, result });
    return result;
  }

  /**
   * Get command history
   */
  getHistory(limit = 50) {
    return this.history.slice(-limit);
  }
}

// ═══════════════════════════════════════════════════════════════════
// IMMORTALITY COMPOSITE
// ═══════════════════════════════════════════════════════════════════

/**
 * Immortality - Complete Layer 1 system
 */
class Immortality extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;

    // Node 1: Compute
    this.watchdog = new WatchdogTimer(config.watchdog);
    this.guard = new ProcessGuard(config.guard);

    // Node 2: Persistence
    this.log = new AppendLog({ path: config.logPath || './data/forge.log' });
    this.state = new StateStore({ path: config.statePath || './data/state.json' });
    this.graphs = new GraphStore({ basePath: config.graphsPath || './data/graphs' });

    // Node 3: Control
    this.control = new ControlHub(config.control);
  }

  async initialize() {
    console.log('[IMMORTALITY] Initializing Layer 1...');

    // Install process guard
    this.guard.install();
    this.guard.onCrash((type, error) => {
      this.log.append({ type: 'crash', error: error?.message });
      this.state.snapshot();
    });
    this.guard.onShutdown((signal) => {
      this.log.append({ type: 'shutdown', signal });
      this.close();
    });

    // Initialize persistence
    await this.log.initialize();
    await this.state.initialize();
    await this.graphs.initialize();

    // Start watchdog
    this.watchdog.start();

    // Heartbeat loop
    setInterval(() => {
      this.watchdog.pet();
      this.emit('heartbeat');
    }, this.config.heartbeatInterval || 1000);

    // Register default commands
    this.control
      .command('status', () => this.getStatus(), { description: 'Get system status' })
      .command('state', (args) => {
        if (args[0]) return this.state.get(args[0]);
        return this.state.keys();
      }, { description: 'Get/list state' })
      .command('graphs', () => this.graphs.list(), { description: 'List graphs' });

    console.log('[IMMORTALITY] Layer 1 online');
    this.log.append({ type: 'init', message: 'Immortality layer initialized' });

    return this;
  }

  getStatus() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      stateVersion: this.state.version,
      graphCount: this.graphs.list().length,
      historyLength: this.control.history.length
    };
  }

  close() {
    console.log('[IMMORTALITY] Shutting down...');
    this.watchdog.stop();
    this.log.close();
    this.state.close();
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // Node 1: Compute Immortality
  WatchdogTimer,
  ProcessGuard,

  // Node 2: State Persistence
  AppendLog,
  StateStore,
  GraphStore,

  // Node 3: Control Surface
  CommandParser,
  IntentRouter,
  ControlHub,

  // Composite
  Immortality
};
