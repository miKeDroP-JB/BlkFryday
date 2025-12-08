/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  0RB CORE - SHARED UTILITIES                                                  ║
 * ║  Common functions used across the system - DRY principle                      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// JSON PARSING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parse JSON from AI response content
 * Handles various formats including markdown code blocks
 *
 * @param {string} content - Raw content from AI response
 * @param {string} context - Context for logging (e.g., 'ATLAS', 'IRIS')
 * @returns {Object} Parsed JSON or { raw: content } if parsing fails
 */
function parseJSON(content, context = 'PARSER') {
  if (!content) return { raw: '' };

  try {
    // Try direct parse first
    return JSON.parse(content);
  } catch (e) {
    // Try to extract JSON from markdown code blocks
    try {
      const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        return JSON.parse(jsonBlockMatch[1]);
      }
    } catch (e2) {
      // Continue to next method
    }

    // Try to find JSON object in content
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e3) {
      console.warn(`[${context}] Failed to parse JSON:`, e3.message);
    }

    // Try to find JSON array in content
    try {
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
    } catch (e4) {
      // Final fallback
    }

    return { raw: content };
  }
}

/**
 * Safely stringify JSON with circular reference handling
 *
 * @param {*} obj - Object to stringify
 * @param {number} spaces - Indentation spaces
 * @returns {string} JSON string
 */
function safeStringify(obj, spaces = 2) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  }, spaces);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ID GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a unique ID with optional prefix
 *
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
function generateId(prefix = '') {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Generate a short unique ID (8 chars)
 *
 * @returns {string} Short unique ID
 */
function generateShortId() {
  return crypto.randomBytes(4).toString('hex');
}

/**
 * Generate a UUID v4
 *
 * @returns {string} UUID
 */
function generateUUID() {
  return crypto.randomUUID();
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATE/TIME UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format timestamp to ISO string
 *
 * @param {number} timestamp - Unix timestamp in ms
 * @returns {string} ISO date string
 */
function formatTimestamp(timestamp = Date.now()) {
  return new Date(timestamp).toISOString();
}

/**
 * Get human-readable relative time
 *
 * @param {number} timestamp - Unix timestamp in ms
 * @returns {string} Relative time string
 */
function relativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

/**
 * Format duration in milliseconds to human readable
 *
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate email address format
 *
 * @param {string} email - Email address
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Ethereum address
 *
 * @param {string} address - Ethereum address
 * @returns {boolean} True if valid
 */
function isValidEthAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate URL format
 *
 * @param {string} url - URL string
 * @returns {boolean} True if valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Truncate string with ellipsis
 *
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncate(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 *
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert string to slug format
 *
 * @param {string} str - String to convert
 * @returns {string} Slugified string
 */
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASYNC UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sleep for specified milliseconds
 *
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 *
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<*>} Result of function
 */
async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry = null
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);

      if (onRetry) {
        onRetry(error, attempt, delay);
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Execute with timeout
 *
 * @param {Function} fn - Async function
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise<*>} Result or timeout error
 */
async function withTimeout(fn, ms) {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// OBJECT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Deep merge objects
 *
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Pick specified keys from object
 *
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to pick
 * @returns {Object} New object with picked keys
 */
function pick(obj, keys) {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

/**
 * Omit specified keys from object
 *
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to omit
 * @returns {Object} New object without omitted keys
 */
function omit(obj, keys) {
  const keysSet = new Set(keys);
  return Object.keys(obj).reduce((result, key) => {
    if (!keysSet.has(key)) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════════

const {
  TokenBucket,
  RateLimiter,
  PROVIDER_LIMITS,
  createRateLimiter
} = require('./rate-limiter');

// ═══════════════════════════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════════════════════════

const {
  Logger,
  LOG_LEVELS,
  ConsoleTransport,
  FileTransport,
  MemoryTransport,
  getLogger,
  createLogger
} = require('./logger');

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // JSON
  parseJSON,
  safeStringify,

  // ID Generation
  generateId,
  generateShortId,
  generateUUID,

  // Date/Time
  formatTimestamp,
  relativeTime,
  formatDuration,

  // Validation
  isValidEmail,
  isValidEthAddress,
  isValidUrl,

  // Strings
  truncate,
  capitalize,
  slugify,

  // Async
  sleep,
  retry,
  withTimeout,

  // Objects
  deepMerge,
  pick,
  omit,

  // Rate Limiting
  TokenBucket,
  RateLimiter,
  PROVIDER_LIMITS,
  createRateLimiter,

  // Logging
  Logger,
  LOG_LEVELS,
  ConsoleTransport,
  FileTransport,
  MemoryTransport,
  getLogger,
  createLogger
};
