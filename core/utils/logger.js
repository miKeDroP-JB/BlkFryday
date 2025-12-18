/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██╗      ██████╗  ██████╗  ██████╗ ███████╗██████╗                      ║
 * ║   ██║     ██╔═══██╗██╔════╝ ██╔════╝ ██╔════╝██╔══██╗                     ║
 * ║   ██║     ██║   ██║██║  ███╗██║  ███╗█████╗  ██████╔╝                     ║
 * ║   ██║     ██║   ██║██║   ██║██║   ██║██╔══╝  ██╔══██╗                     ║
 * ║   ███████╗╚██████╔╝╚██████╔╝╚██████╔╝███████╗██║  ██║                     ║
 * ║   ╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝                     ║
 * ║                                                                           ║
 * ║   STRUCTURED LOGGING - Track everything that matters                      ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// ═══════════════════════════════════════════════════════════════════════════
// LOG LEVELS
// ═══════════════════════════════════════════════════════════════════════════

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  HTTP: 3,
  VERBOSE: 4,
  DEBUG: 5,
  SILLY: 6
};

const LEVEL_NAMES = Object.fromEntries(
  Object.entries(LOG_LEVELS).map(([k, v]) => [v, k.toLowerCase()])
);

const LEVEL_COLORS = {
  error: '\x1b[31m',   // Red
  warn: '\x1b[33m',    // Yellow
  info: '\x1b[36m',    // Cyan
  http: '\x1b[35m',    // Magenta
  verbose: '\x1b[37m', // White
  debug: '\x1b[34m',   // Blue
  silly: '\x1b[90m'    // Gray
};

const RESET = '\x1b[0m';

// ═══════════════════════════════════════════════════════════════════════════
// LOG ENTRY
// ═══════════════════════════════════════════════════════════════════════════

class LogEntry {
  constructor(level, message, meta = {}) {
    this.timestamp = new Date().toISOString();
    this.level = level;
    this.message = message;
    this.meta = meta;
  }

  toJSON() {
    return {
      timestamp: this.timestamp,
      level: this.level,
      message: this.message,
      ...this.meta
    };
  }

  toString(colorize = true) {
    const color = colorize ? (LEVEL_COLORS[this.level] || '') : '';
    const reset = colorize ? RESET : '';
    const levelStr = `[${this.level.toUpperCase()}]`.padEnd(9);
    const metaStr = Object.keys(this.meta).length > 0
      ? ` ${JSON.stringify(this.meta)}`
      : '';

    return `${this.timestamp} ${color}${levelStr}${reset} ${this.message}${metaStr}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORTS
// ═══════════════════════════════════════════════════════════════════════════

class ConsoleTransport {
  constructor(config = {}) {
    this.colorize = config.colorize !== false;
    this.level = config.level || 'info';
  }

  log(entry) {
    const output = entry.toString(this.colorize);

    if (entry.level === 'error') {
      console.error(output);
    } else if (entry.level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  }
}

class FileTransport {
  constructor(config = {}) {
    this.filename = config.filename || 'logs/app.log';
    this.level = config.level || 'info';
    this.maxSize = config.maxSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = config.maxFiles || 5;
    this.json = config.json !== false;

    this._ensureDir();
  }

  _ensureDir() {
    const dir = path.dirname(this.filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  _rotate() {
    try {
      const stats = fs.statSync(this.filename);
      if (stats.size >= this.maxSize) {
        // Rotate files
        for (let i = this.maxFiles - 1; i >= 1; i--) {
          const oldFile = `${this.filename}.${i}`;
          const newFile = `${this.filename}.${i + 1}`;
          if (fs.existsSync(oldFile)) {
            if (i === this.maxFiles - 1) {
              fs.unlinkSync(oldFile);
            } else {
              fs.renameSync(oldFile, newFile);
            }
          }
        }
        fs.renameSync(this.filename, `${this.filename}.1`);
      }
    } catch (e) {
      // File doesn't exist yet
    }
  }

  log(entry) {
    this._rotate();

    const line = this.json
      ? JSON.stringify(entry.toJSON())
      : entry.toString(false);

    fs.appendFileSync(this.filename, line + '\n');
  }
}

class MemoryTransport {
  constructor(config = {}) {
    this.maxEntries = config.maxEntries || 1000;
    this.level = config.level || 'debug';
    this.entries = [];
  }

  log(entry) {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  getEntries(filter = {}) {
    let results = this.entries;

    if (filter.level) {
      const levelNum = LOG_LEVELS[filter.level.toUpperCase()];
      results = results.filter(e =>
        LOG_LEVELS[e.level.toUpperCase()] <= levelNum
      );
    }

    if (filter.since) {
      results = results.filter(e =>
        new Date(e.timestamp) >= new Date(filter.since)
      );
    }

    if (filter.search) {
      const regex = new RegExp(filter.search, 'i');
      results = results.filter(e =>
        regex.test(e.message) || regex.test(JSON.stringify(e.meta))
      );
    }

    return results.slice(-(filter.limit || 100));
  }

  clear() {
    this.entries = [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGGER
// ═══════════════════════════════════════════════════════════════════════════

class Logger extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      level: config.level || process.env.LOG_LEVEL || 'info',
      name: config.name || 'orb',
      ...config
    };

    this.transports = [];
    this.levelNum = LOG_LEVELS[this.config.level.toUpperCase()] || LOG_LEVELS.INFO;

    // Add default transports
    if (config.console !== false) {
      this.addTransport(new ConsoleTransport({
        colorize: config.colorize !== false,
        level: this.config.level
      }));
    }

    if (config.file) {
      this.addTransport(new FileTransport(
        typeof config.file === 'string'
          ? { filename: config.file }
          : config.file
      ));
    }

    if (config.memory) {
      this.memoryTransport = new MemoryTransport(config.memory);
      this.addTransport(this.memoryTransport);
    }
  }

  addTransport(transport) {
    this.transports.push(transport);
    return this;
  }

  _shouldLog(level) {
    const levelNum = LOG_LEVELS[level.toUpperCase()];
    return levelNum <= this.levelNum;
  }

  _log(level, message, meta = {}) {
    if (!this._shouldLog(level)) return;

    const entry = new LogEntry(level, message, {
      logger: this.config.name,
      ...meta
    });

    for (const transport of this.transports) {
      const transportLevel = LOG_LEVELS[transport.level?.toUpperCase()] || LOG_LEVELS.INFO;
      if (LOG_LEVELS[level.toUpperCase()] <= transportLevel) {
        transport.log(entry);
      }
    }

    this.emit('log', entry);
    return entry;
  }

  error(message, meta) { return this._log('error', message, meta); }
  warn(message, meta) { return this._log('warn', message, meta); }
  info(message, meta) { return this._log('info', message, meta); }
  http(message, meta) { return this._log('http', message, meta); }
  verbose(message, meta) { return this._log('verbose', message, meta); }
  debug(message, meta) { return this._log('debug', message, meta); }
  silly(message, meta) { return this._log('silly', message, meta); }

  /**
   * Create a child logger with additional context
   */
  child(meta = {}) {
    const childLogger = Object.create(this);
    childLogger._log = (level, message, childMeta = {}) => {
      return this._log(level, message, { ...meta, ...childMeta });
    };
    return childLogger;
  }

  /**
   * Log with timing
   */
  time(label) {
    const start = Date.now();
    return {
      end: (message, meta = {}) => {
        const duration = Date.now() - start;
        this.info(message || label, { ...meta, duration: `${duration}ms` });
        return duration;
      }
    };
  }

  /**
   * Get recent logs from memory transport
   */
  getRecentLogs(filter = {}) {
    if (this.memoryTransport) {
      return this.memoryTransport.getEntries(filter);
    }
    return [];
  }

  /**
   * Set log level dynamically
   */
  setLevel(level) {
    this.config.level = level;
    this.levelNum = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT LOGGER INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let defaultLogger = null;

function getLogger(config = {}) {
  if (!defaultLogger) {
    defaultLogger = new Logger({
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || 'logs/orb.log',
      memory: { maxEntries: 500 },
      ...config
    });
  }
  return defaultLogger;
}

function createLogger(config = {}) {
  return new Logger(config);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  Logger,
  LogEntry,
  LOG_LEVELS,
  ConsoleTransport,
  FileTransport,
  MemoryTransport,
  getLogger,
  createLogger
};
