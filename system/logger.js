/**
 * Logger - Unified Logging System
 * ═══════════════════════════════════════════════════════════════════
 * Structured logging with levels, categories, and output control.
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.options = {
      level: options.level || 'INFO',
      output: options.output || 'console', // 'console', 'file', 'both'
      logFile: options.logFile || path.join(__dirname, 'logs', 'solver.log'),
      timestamps: options.timestamps !== false,
      colors: options.colors !== false,
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      ...options
    };

    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      CRITICAL: 4
    };

    this.colors = {
      DEBUG: '\x1b[36m',    // Cyan
      INFO: '\x1b[32m',     // Green
      WARN: '\x1b[33m',     // Yellow
      ERROR: '\x1b[31m',    // Red
      CRITICAL: '\x1b[35m', // Magenta
      RESET: '\x1b[0m'
    };

    this.categories = new Map();
    this.buffer = [];
    this.bufferSize = 100;

    // Ensure log directory exists
    if (this.options.output !== 'console') {
      const logDir = path.dirname(this.options.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  /**
   * Main logging method
   * @param {string} category - Log category (e.g., "SAFE_JUMP_BLOCK")
   * @param {*} data - Data to log (string, object, etc.)
   * @param {string} level - Log level (default: INFO)
   */
  log(category, data, level = 'INFO') {
    if (this.levels[level] < this.levels[this.options.level]) {
      return;
    }

    const timestamp = this.options.timestamps ? new Date().toISOString() : '';
    const entry = {
      timestamp,
      level,
      category,
      data: typeof data === 'object' ? JSON.stringify(data) : data
    };

    // Track category stats
    if (!this.categories.has(category)) {
      this.categories.set(category, { count: 0, lastSeen: null });
    }
    const catStats = this.categories.get(category);
    catStats.count++;
    catStats.lastSeen = timestamp;

    // Buffer for batch writing
    this.buffer.push(entry);
    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }

    // Format and output
    const formatted = this.format(entry);

    if (this.options.output === 'console' || this.options.output === 'both') {
      console.log(formatted);
    }

    if (this.options.output === 'file' || this.options.output === 'both') {
      this.writeToFile(entry);
    }
  }

  format(entry) {
    const { timestamp, level, category, data } = entry;
    const colorCode = this.options.colors ? this.colors[level] : '';
    const reset = this.options.colors ? this.colors.RESET : '';

    const ts = timestamp ? `[${timestamp}] ` : '';
    return `${ts}${colorCode}[${level}]${reset} [${category}] ${data}`;
  }

  writeToFile(entry) {
    const line = `${entry.timestamp}\t${entry.level}\t${entry.category}\t${entry.data}\n`;
    fs.appendFileSync(this.options.logFile, line);
  }

  flush() {
    // Flush buffer (for batch file writes if needed)
    this.buffer = [];
  }

  // Convenience methods
  debug(category, data) { this.log(category, data, 'DEBUG'); }
  info(category, data) { this.log(category, data, 'INFO'); }
  warn(category, data) { this.log(category, data, 'WARN'); }
  error(category, data) { this.log(category, data, 'ERROR'); }
  critical(category, data) { this.log(category, data, 'CRITICAL'); }

  /**
   * Get category statistics
   */
  getStats() {
    const stats = {};
    for (const [category, data] of this.categories) {
      stats[category] = data;
    }
    return stats;
  }

  /**
   * Set log level dynamically
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.options.level = level;
    }
  }
}

// Default singleton instance
const defaultLogger = new Logger({
  level: process.env.LOG_LEVEL || 'INFO',
  output: process.env.LOG_OUTPUT || 'console'
});

module.exports = defaultLogger;
module.exports.Logger = Logger;
