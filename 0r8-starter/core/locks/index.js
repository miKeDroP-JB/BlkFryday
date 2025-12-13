/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   SAFETY LOCKS - Runtime Invariant Protection                             ║
 * ║   "The system bends, not breaks"                                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Freeze invariants before public exposure:
 * - Memory becomes append-only
 * - Observer authority escalates above all nodes
 * - Amoeba switches to proactive mutation mode
 */

import { EventEmitter } from 'events';

// Lock state
const lockState = {
    frozen: false,
    frozenAt: null,
    scopes: {
        memory: false,
        observer: false,
        amoeba: false
    },
    authority: {
        observer: 1,  // Normal priority
        nodes: 1,
        amoeba: 1
    },
    mode: {
        memory: 'read-write',
        amoeba: 'reactive'
    },
    writeLog: [],
    violations: []
};

const lockEvents = new EventEmitter();

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    red: '\x1b[31m'
};

/**
 * Freeze specified scopes
 */
function freeze(scopes = ['memory', 'observer', 'amoeba']) {
    const results = {
        frozen: [],
        skipped: [],
        timestamp: Date.now()
    };

    for (const scope of scopes) {
        if (lockState.scopes[scope] !== undefined) {
            if (!lockState.scopes[scope]) {
                lockState.scopes[scope] = true;
                results.frozen.push(scope);

                // Apply scope-specific transformations
                switch (scope) {
                    case 'memory':
                        lockState.mode.memory = 'append-only';
                        break;
                    case 'observer':
                        lockState.authority.observer = 10;  // Maximum priority
                        lockState.authority.nodes = 1;
                        break;
                    case 'amoeba':
                        lockState.mode.amoeba = 'proactive';
                        break;
                }
            } else {
                results.skipped.push(scope);
            }
        }
    }

    if (results.frozen.length > 0) {
        lockState.frozen = true;
        lockState.frozenAt = Date.now();
        lockEvents.emit('freeze', results);
    }

    return results;
}

/**
 * Unfreeze specified scopes (requires authority)
 */
function unfreeze(scopes = ['memory', 'observer', 'amoeba'], authToken = null) {
    // In production, validate authToken
    const results = {
        unfrozen: [],
        denied: [],
        timestamp: Date.now()
    };

    for (const scope of scopes) {
        if (lockState.scopes[scope]) {
            lockState.scopes[scope] = false;
            results.unfrozen.push(scope);

            // Reset scope-specific settings
            switch (scope) {
                case 'memory':
                    lockState.mode.memory = 'read-write';
                    break;
                case 'observer':
                    lockState.authority.observer = 1;
                    lockState.authority.nodes = 1;
                    break;
                case 'amoeba':
                    lockState.mode.amoeba = 'reactive';
                    break;
            }
        }
    }

    // Check if anything is still frozen
    lockState.frozen = Object.values(lockState.scopes).some(v => v);

    if (results.unfrozen.length > 0) {
        lockEvents.emit('unfreeze', results);
    }

    return results;
}

/**
 * Check if memory write is allowed
 */
function canWriteMemory(operation = 'write') {
    if (!lockState.scopes.memory) {
        return { allowed: true, mode: 'read-write' };
    }

    // Append-only mode
    if (operation === 'append' || operation === 'create') {
        return { allowed: true, mode: 'append-only' };
    }

    // Log violation
    lockState.violations.push({
        type: 'memory-write',
        operation,
        timestamp: Date.now()
    });

    lockEvents.emit('violation', {
        scope: 'memory',
        operation,
        message: 'Write operation denied: memory is append-only'
    });

    return { allowed: false, mode: 'append-only', reason: 'Memory is frozen in append-only mode' };
}

/**
 * Get observer authority level
 */
function getObserverAuthority() {
    return {
        level: lockState.authority.observer,
        elevated: lockState.scopes.observer,
        canOverride: lockState.authority.observer > lockState.authority.nodes
    };
}

/**
 * Get amoeba mode
 */
function getAmoebaMode() {
    return {
        mode: lockState.mode.amoeba,
        proactive: lockState.mode.amoeba === 'proactive'
    };
}

/**
 * Log a write operation (for audit)
 */
function logWrite(source, operation, data) {
    const entry = {
        source,
        operation,
        dataSize: JSON.stringify(data).length,
        timestamp: Date.now(),
        allowed: canWriteMemory(operation).allowed
    };

    lockState.writeLog.push(entry);

    // Keep log manageable
    if (lockState.writeLog.length > 1000) {
        lockState.writeLog = lockState.writeLog.slice(-500);
    }

    return entry;
}

/**
 * Get current lock status
 */
function getStatus() {
    return {
        frozen: lockState.frozen,
        frozenAt: lockState.frozenAt,
        uptime: lockState.frozenAt ? Date.now() - lockState.frozenAt : 0,
        scopes: { ...lockState.scopes },
        authority: { ...lockState.authority },
        mode: { ...lockState.mode },
        violations: lockState.violations.length,
        recentViolations: lockState.violations.slice(-5),
        writeLogSize: lockState.writeLog.length
    };
}

/**
 * Subscribe to lock events
 */
function subscribe(event, callback) {
    lockEvents.on(event, callback);
    return () => lockEvents.off(event, callback);
}

/**
 * Emergency reset (requires special authority)
 */
function emergencyReset(authToken = null) {
    // In production, validate authToken with hardware key or similar
    lockState.frozen = false;
    lockState.frozenAt = null;
    lockState.scopes = { memory: false, observer: false, amoeba: false };
    lockState.authority = { observer: 1, nodes: 1, amoeba: 1 };
    lockState.mode = { memory: 'read-write', amoeba: 'reactive' };

    lockEvents.emit('emergency-reset', { timestamp: Date.now() });

    return { reset: true, timestamp: Date.now() };
}

export const locks = {
    freeze,
    unfreeze,
    canWriteMemory,
    getObserverAuthority,
    getAmoebaMode,
    logWrite,
    getStatus,
    subscribe,
    emergencyReset
};

export default locks;
