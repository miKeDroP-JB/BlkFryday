/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   FLOWSYNC ORCHESTRATOR - Multi-Node Coherence                            ║
 * ║   "Flocking behavior, not hive mind"                                      ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Nodes behave like a nervous system:
 * - Share signals, not state
 * - Confidence, risk, and entropy propagate
 * - No memory cross-contamination
 */

import { EventEmitter } from 'events';
import { flowSync } from './flowsync-node.js';
import { observer } from './observer/index.js';
import { locks } from './locks/index.js';
import { amoebaSecurity } from './amoeba-security.js';

// Orchestration state
const orchestratorState = {
    mode: 'isolated',  // isolated | coherent | swarm
    observerDominance: false,
    memoryPolicy: 'shadow-only',
    nodes: new Map(),
    signals: [],
    entropy: 0.5,
    coherenceScore: 0,
    metrics: {
        signalsSent: 0,
        signalsReceived: 0,
        coherenceEvents: 0,
        entropyAdjustments: 0
    }
};

const orchestratorEvents = new EventEmitter();

// Signal types for inter-node communication
const SIGNAL_TYPES = {
    CONFIDENCE: 'confidence',      // Node confidence level changed
    RISK: 'risk',                  // Risk level detected
    ENTROPY: 'entropy',            // Entropy/uncertainty shift
    ESCALATION: 'escalation',      // Issue needs escalation
    LEARNING: 'learning',          // Pattern learned
    CORRECTION: 'correction'       // Self-correction applied
};

/**
 * Register a node with the orchestrator
 */
function registerNode(nodeId, nodeConfig = {}) {
    const node = {
        id: nodeId,
        name: nodeConfig.name || nodeId,
        confidence: 1.0,
        risk: 0,
        entropy: 0.5,
        lastSignal: null,
        signalHistory: [],
        active: true,
        registeredAt: Date.now()
    };

    orchestratorState.nodes.set(nodeId, node);
    orchestratorEvents.emit('node-registered', node);

    return node;
}

/**
 * Emit a signal from a node
 */
function emitSignal(sourceNodeId, signalType, payload = {}) {
    if (orchestratorState.mode === 'isolated') {
        // In isolated mode, signals are not propagated
        return { propagated: false, reason: 'Isolated mode' };
    }

    const signal = {
        id: `sig-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        source: sourceNodeId,
        type: signalType,
        payload,
        timestamp: Date.now(),
        propagated: false
    };

    orchestratorState.signals.push(signal);
    orchestratorState.metrics.signalsSent++;

    // Observer dominance check
    if (orchestratorState.observerDominance) {
        // Observer can veto signals
        const observerAuth = locks.getObserverAuthority();
        if (observerAuth.level < 5 && signalType === SIGNAL_TYPES.ESCALATION) {
            // Low priority observer cannot block escalations
        } else if (payload.risk > 0.7) {
            // High risk signals trigger observer intervention
            observer.log('warn', `High risk signal from ${sourceNodeId}`, payload);
        }
    }

    // Propagate signal to other nodes
    if (orchestratorState.mode === 'coherent') {
        propagateSignal(signal);
    }

    orchestratorEvents.emit('signal', signal);

    return { propagated: true, signal };
}

/**
 * Propagate a signal to all connected nodes
 */
function propagateSignal(signal) {
    const sourceNode = orchestratorState.nodes.get(signal.source);

    for (const [nodeId, node] of orchestratorState.nodes) {
        if (nodeId === signal.source) continue;
        if (!node.active) continue;

        // Apply signal effects (signals, not state)
        switch (signal.type) {
            case SIGNAL_TYPES.CONFIDENCE:
                // Confidence changes influence nearby nodes slightly
                node.confidence = node.confidence * 0.9 + signal.payload.confidence * 0.1;
                break;

            case SIGNAL_TYPES.RISK:
                // Risk signals are additive (danger spreads)
                node.risk = Math.min(1, node.risk + signal.payload.risk * 0.2);
                break;

            case SIGNAL_TYPES.ENTROPY:
                // Entropy averages across nodes
                node.entropy = (node.entropy + signal.payload.entropy) / 2;
                break;

            case SIGNAL_TYPES.ESCALATION:
                // Escalations trigger alerts
                orchestratorEvents.emit('escalation', {
                    source: signal.source,
                    target: nodeId,
                    payload: signal.payload
                });
                break;

            case SIGNAL_TYPES.LEARNING:
                // Learning signals are logged but don't modify state
                // This prevents memory cross-contamination
                node.signalHistory.push({
                    type: 'learning-observed',
                    source: signal.source,
                    timestamp: Date.now()
                });
                break;

            case SIGNAL_TYPES.CORRECTION:
                // Corrections increase overall coherence
                orchestratorState.coherenceScore += 0.01;
                break;
        }

        node.lastSignal = signal;
        orchestratorState.metrics.signalsReceived++;
    }

    signal.propagated = true;
    orchestratorState.metrics.coherenceEvents++;
}

/**
 * Set orchestration mode
 */
function setMode(mode, options = {}) {
    const validModes = ['isolated', 'coherent', 'swarm'];

    if (!validModes.includes(mode)) {
        return { success: false, error: `Invalid mode: ${mode}` };
    }

    const previousMode = orchestratorState.mode;
    orchestratorState.mode = mode;

    // Apply mode-specific settings
    if (options.observer === 'dominant') {
        orchestratorState.observerDominance = true;
        // Ensure locks are engaged
        if (!locks.getStatus().frozen) {
            locks.freeze(['observer']);
        }
    }

    if (options.memory) {
        orchestratorState.memoryPolicy = options.memory;
    }

    orchestratorEvents.emit('mode-change', {
        from: previousMode,
        to: mode,
        options
    });

    return {
        success: true,
        mode,
        previousMode,
        observerDominance: orchestratorState.observerDominance,
        memoryPolicy: orchestratorState.memoryPolicy
    };
}

/**
 * Get overall system entropy
 */
function getEntropy() {
    let totalEntropy = 0;
    let count = 0;

    for (const [, node] of orchestratorState.nodes) {
        if (node.active) {
            totalEntropy += node.entropy;
            count++;
        }
    }

    orchestratorState.entropy = count > 0 ? totalEntropy / count : 0.5;

    return {
        system: orchestratorState.entropy,
        nodes: Array.from(orchestratorState.nodes.values()).map(n => ({
            id: n.id,
            entropy: n.entropy
        }))
    };
}

/**
 * Get coherence score
 */
function getCoherence() {
    // Calculate coherence based on signal alignment
    let alignedSignals = 0;
    const recentSignals = orchestratorState.signals.slice(-100);

    for (const signal of recentSignals) {
        if (signal.propagated) alignedSignals++;
    }

    const signalCoherence = recentSignals.length > 0
        ? alignedSignals / recentSignals.length
        : 1;

    // Factor in node confidence variance
    const confidences = Array.from(orchestratorState.nodes.values())
        .filter(n => n.active)
        .map(n => n.confidence);

    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / (confidences.length || 1);
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / (confidences.length || 1);

    // Lower variance = higher coherence
    const confidenceCoherence = 1 - Math.min(1, variance);

    orchestratorState.coherenceScore = (signalCoherence * 0.6 + confidenceCoherence * 0.4);

    return {
        score: orchestratorState.coherenceScore,
        signalCoherence,
        confidenceCoherence,
        activeNodes: orchestratorState.nodes.size
    };
}

/**
 * Get orchestrator status
 */
function getStatus() {
    return {
        mode: orchestratorState.mode,
        observerDominance: orchestratorState.observerDominance,
        memoryPolicy: orchestratorState.memoryPolicy,
        nodes: orchestratorState.nodes.size,
        activeNodes: Array.from(orchestratorState.nodes.values()).filter(n => n.active).length,
        entropy: getEntropy(),
        coherence: getCoherence(),
        metrics: { ...orchestratorState.metrics },
        signalQueueSize: orchestratorState.signals.length
    };
}

/**
 * Process through FlowSync with orchestration
 */
async function orchestrate(input, userContext = {}) {
    // Register implicit nodes if not present
    const nodeId = userContext.nodeId || 'default';
    if (!orchestratorState.nodes.has(nodeId)) {
        registerNode(nodeId, { name: userContext.nodeName || nodeId });
    }

    const node = orchestratorState.nodes.get(nodeId);

    // Security scan
    const securityReport = await amoebaSecurity.scan(input.original || input, userContext);

    // Update node risk based on security
    node.risk = securityReport.riskScore;
    if (securityReport.riskScore > 0.3) {
        emitSignal(nodeId, SIGNAL_TYPES.RISK, {
            risk: securityReport.riskScore,
            anomalies: securityReport.anomalies
        });
    }

    // Check memory policy
    if (orchestratorState.memoryPolicy === 'shadow-only') {
        const writeCheck = locks.canWriteMemory('write');
        if (!writeCheck.allowed) {
            userContext.memoryMode = 'shadow';
        }
    }

    // Process through FlowSync
    const results = await flowSync.process(
        { original: input.original || input, filtered: input.filtered || input },
        securityReport,
        userContext,
        input.moduleResults || []
    );

    // Emit learning signal
    if (results.length > 0) {
        emitSignal(nodeId, SIGNAL_TYPES.LEARNING, {
            patterns: results.length,
            lawful: results.filter(r => r.lawful).length
        });
    }

    // Update node confidence
    const successRate = results.filter(r => r.lawful).length / (results.length || 1);
    node.confidence = node.confidence * 0.8 + successRate * 0.2;

    emitSignal(nodeId, SIGNAL_TYPES.CONFIDENCE, {
        confidence: node.confidence
    });

    return {
        results,
        orchestration: {
            mode: orchestratorState.mode,
            nodeId,
            confidence: node.confidence,
            risk: node.risk,
            coherence: getCoherence().score
        }
    };
}

/**
 * Subscribe to orchestrator events
 */
function subscribe(event, callback) {
    orchestratorEvents.on(event, callback);
    return () => orchestratorEvents.off(event, callback);
}

export const orchestrator = {
    registerNode,
    emitSignal,
    setMode,
    getEntropy,
    getCoherence,
    getStatus,
    orchestrate,
    subscribe,
    SIGNAL_TYPES
};

export default orchestrator;
