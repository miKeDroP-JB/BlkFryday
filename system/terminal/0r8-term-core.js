#!/usr/bin/env node
/**
 * 0RB TERMINAL CORE - The Spine
 *
 * Command interface for ORBOS agent wiring.
 * Accepts commands via stdin or interactive mode.
 */

const readline = require('readline');
const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════

const state = {
  system: { mode: null, initialized: false },
  memory: { engine: null, persistence: null, mounted: false },
  observer: { level: 'passive', mode: 'passive', bindings: [], rulesets: [] },
  monitor: { metrics: [], active: false, attachments: [] },
  agents: {},
  training: { pool: null, rules: {} },
  callpool: null
};

const bus = new EventEmitter();

// ═══════════════════════════════════════════════════════════
// COMMAND HANDLERS
// ═══════════════════════════════════════════════════════════

const handlers = {
  system: {
    init: (args) => {
      const mode = args.mode || 'development';
      state.system.mode = mode;
      state.system.initialized = true;
      log('system', `Initialized in ${mode} mode`);
      bus.emit('system:init', { mode });
      return true;
    }
  },

  memory: {
    init: (args) => {
      state.memory.engine = args.engine || 'fractal';
      state.memory.persistence = args.persistence || 'memory';
      state.memory.mounted = true;
      log('memory', `Engine: ${state.memory.engine} | Persistence: ${state.memory.persistence}`);
      bus.emit('memory:init', state.memory);
      return true;
    }
  },

  observer: {
    init: (args) => {
      state.observer.level = args.level || 'passive';
      log('observer', `Level: ${state.observer.level} | Status: idle`);
      return true;
    },
    escalate: (args) => {
      state.observer.mode = args.mode || 'dominant';
      log('observer', `Escalated to ${state.observer.mode} mode`);
      return true;
    },
    bind: (args) => {
      const target = args._positional?.[0];
      if (target && state.agents[target]) {
        state.observer.bindings.push(target);
        log('observer', `Bound to agent: ${target}`);
        return true;
      }
      log('error', `Agent not found: ${target}`);
      return false;
    },
    ruleset: (args) => {
      if (args.load) {
        state.observer.rulesets.push(args.load);
        log('observer', `Loaded ruleset: ${args.load}`);
      }
      return true;
    },
    report: () => {
      log('observer', `Mode: ${state.observer.mode} | Bindings: ${state.observer.bindings.length} | Rulesets: ${state.observer.rulesets.length}`);
      state.observer.bindings.forEach(b => log('observer', `  → ${b}: tracked`));
      return true;
    }
  },

  monitor: {
    init: (args) => {
      state.monitor.metrics = (args.metrics || 'cpu,mem').split(',');
      state.monitor.active = true;
      state.monitor.attachments = state.monitor.attachments || [];
      log('monitor', `Metrics: ${state.monitor.metrics.join(', ')} | Status: streaming`);
      return true;
    },
    attach: (args) => {
      const target = args._positional?.[0] || args.agent;
      if (!state.monitor.attachments) state.monitor.attachments = [];
      if (target) {
        state.monitor.attachments.push(target);
        log('monitor', `Attached to: ${target}`);
        if (state.agents[target]) {
          state.agents[target].monitored = true;
        }
        bus.emit('monitor:attach', { target });
        return true;
      }
      log('error', 'No target specified for monitor attach');
      return false;
    },
    detach: (args) => {
      const target = args._positional?.[0];
      if (target && state.monitor.attachments) {
        state.monitor.attachments = state.monitor.attachments.filter(a => a !== target);
        log('monitor', `Detached from: ${target}`);
        return true;
      }
      return false;
    },
    status: () => {
      log('monitor', `Active: ${state.monitor.active} | Metrics: ${state.monitor.metrics.join(', ')}`);
      log('monitor', `  CPU: idle | MEM: ${Math.floor(process.memoryUsage().heapUsed / 1024 / 1024)}MB | Anomalies: 0`);
      if (state.monitor.attachments?.length) {
        log('monitor', `  Attachments: ${state.monitor.attachments.join(', ')}`);
      }
      return true;
    }
  },

  agent: {
    create: (args) => {
      const name = args.name;
      const type = args.type || 'generic';
      if (!name) {
        log('error', 'Agent name required');
        return false;
      }
      state.agents[name] = {
        name,
        type,
        status: 'created',
        autonomy: 'bounded',
        learning: 'none',
        output: 'console',
        startedAt: null
      };
      log('agent', `Created: ${name} (type: ${type})`);
      bus.emit('agent:created', state.agents[name]);
      return true;
    },
    set: (args) => {
      const name = args._positional?.[0];
      const key = args._positional?.[1];
      const value = args._positional?.[2] || args[key];
      if (state.agents[name]) {
        state.agents[name][key] = value;
        log('agent', `${name}.${key} = ${value}`);
        return true;
      }
      log('error', `Agent not found: ${name}`);
      return false;
    },
    start: (args) => {
      const name = args._positional?.[0] || args.name;
      if (state.agents[name]) {
        state.agents[name].status = 'running';
        state.agents[name].startedAt = Date.now();
        log('agent', `Started: ${name}`);
        bus.emit('agent:started', state.agents[name]);
        return true;
      }
      log('error', `Agent not found: ${name}`);
      return false;
    },
    stop: (args) => {
      const name = args._positional?.[0] || args.name;
      if (state.agents[name]) {
        state.agents[name].status = 'stopped';
        log('agent', `Stopped: ${name}`);
        return true;
      }
      return false;
    },
    status: (args) => {
      const name = args._positional?.[0];
      if (name && state.agents[name]) {
        const a = state.agents[name];
        log('agent', `${a.name}: ${a.status} | Type: ${a.type} | Autonomy: ${a.autonomy}`);
      } else {
        Object.values(state.agents).forEach(a => {
          log('agent', `${a.name}: ${a.status} | Type: ${a.type}`);
        });
      }
      return true;
    }
  },

  training: {
    pool: (args) => {
      if (args.init) {
        state.training.pool = { mode: args.mode || 'shadow', attachments: [] };
        log('training', `Pool initialized: mode=${state.training.pool.mode}`);
      }
      if (args.attach) {
        state.training.pool.attachments.push(args.attach);
        log('training', `Attached: ${args.attach}`);
      }
      return true;
    },
    rules: (args) => {
      if (args.set) {
        const rule = args.set;
        state.training.rules[rule] = true;
        log('training', `Rule set: ${rule}`);
      }
      return true;
    }
  },

  callpool: {
    init: (args) => {
      const agentList = args.agents ? args.agents.split(',') : [];
      state.callpool = {
        agents: agentList,
        concurrency: 1,
        active: true,
        calls: { queued: 0, active: 0, completed: 0 }
      };
      log('callpool', `Initialized with agents: ${agentList.join(', ')}`);
      bus.emit('callpool:init', state.callpool);
      return true;
    },
    set: (args) => {
      const key = args._positional?.[0];
      const value = args._positional?.[1];
      if (key && value && state.callpool) {
        state.callpool[key] = isNaN(value) ? value : parseInt(value);
        log('callpool', `${key} = ${value}`);
        return true;
      }
      log('error', 'Callpool not initialized or invalid params');
      return false;
    },
    add: (args) => {
      const agent = args._positional?.[0] || args.agent;
      if (agent && state.callpool) {
        state.callpool.agents.push(agent);
        log('callpool', `Added agent: ${agent}`);
        return true;
      }
      return false;
    },
    status: () => {
      if (state.callpool) {
        log('callpool', `Agents: ${state.callpool.agents.length} | Concurrency: ${state.callpool.concurrency}`);
        log('callpool', `Calls - Queued: ${state.callpool.calls.queued} | Active: ${state.callpool.calls.active} | Completed: ${state.callpool.calls.completed}`);
        state.callpool.agents.forEach(a => log('callpool', `  → ${a}: ready`));
      }
      return true;
    }
  }
};

// ═══════════════════════════════════════════════════════════
// PARSER
// ═══════════════════════════════════════════════════════════

function parseCommand(line) {
  const parts = line.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return null;

  const domain = parts[0];
  const action = parts[1];
  const args = { _positional: [] };

  for (let i = 2; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('--')) {
      const [key, val] = part.slice(2).split('=');
      if (val !== undefined) {
        args[key] = val;
      } else if (parts[i + 1] && !parts[i + 1].startsWith('--')) {
        args[key] = parts[i + 1];
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._positional.push(part);
    }
  }

  return { domain, action, args };
}

function execute(line) {
  const cmd = parseCommand(line);
  if (!cmd) return;

  const { domain, action, args } = cmd;

  if (handlers[domain] && handlers[domain][action]) {
    try {
      handlers[domain][action](args);
    } catch (e) {
      log('error', `Command failed: ${e.message}`);
    }
  } else {
    log('error', `Unknown command: ${domain} ${action}`);
  }
}

// ═══════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════

function log(domain, msg) {
  const ts = new Date().toISOString().slice(11, 23);
  const prefix = {
    system: '\x1b[36m[SYS]\x1b[0m',
    memory: '\x1b[35m[MEM]\x1b[0m',
    observer: '\x1b[33m[OBS]\x1b[0m',
    monitor: '\x1b[32m[MON]\x1b[0m',
    agent: '\x1b[34m[AGT]\x1b[0m',
    training: '\x1b[95m[TRN]\x1b[0m',
    callpool: '\x1b[96m[CPL]\x1b[0m',
    error: '\x1b[31m[ERR]\x1b[0m'
  }[domain] || `[${domain.toUpperCase()}]`;

  console.log(`${ts} ${prefix} ${msg}`);
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

console.log(`
╔═══════════════════════════════════════════════════════════╗
║              0RB TERMINAL CORE v1.0                       ║
║              "The Spine"                                  ║
╚═══════════════════════════════════════════════════════════╝
`);

log('system', 'core ready');
log('system', 'io listening');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: process.stdin.isTTY
});

rl.on('line', (line) => {
  if (line.trim()) {
    execute(line);
  }
});

rl.on('close', () => {
  log('system', 'io closed');
  process.exit(0);
});

// Keep alive for piped input
if (!process.stdin.isTTY) {
  process.stdin.resume();
}
