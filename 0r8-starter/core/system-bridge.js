/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   0R8 SYSTEM BRIDGE                                                        ║
 * ║   Connects 0r8-starter to the full 0RB SYSTEM                              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * This bridge provides access to:
 * - UnlimitedSolver (ARC-AGI solver)
 * - InfiniteStrategyGenerator
 * - VoiceBrain
 * - QuantumEngine
 * - NexusProtocol
 * - All game engines
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// System root path
const SYSTEM_PATH = '../system';

// Lazy-loaded system modules
let _system = null;
let _voiceBrain = null;
let _infiniteGenerator = null;

/**
 * Load the main system (lazy)
 */
export async function getSystem() {
    if (!_system) {
        try {
            _system = require(`${SYSTEM_PATH}/index.js`);
            console.log('[BRIDGE] Loaded 0RB SYSTEM v' + (_system.VERSION || '2.0.0'));
        } catch (e) {
            console.warn('[BRIDGE] System not available:', e.message);
            _system = { available: false };
        }
    }
    return _system;
}

/**
 * Get the UnlimitedSolver for ARC-AGI tasks
 */
export async function getSolver() {
    const sys = await getSystem();
    if (sys.UnlimitedSolver) {
        return new sys.UnlimitedSolver();
    }
    // Fallback: try direct import
    try {
        const { UnlimitedSolver } = require(`${SYSTEM_PATH}/solver/UnlimitedSolver.js`);
        return new UnlimitedSolver();
    } catch (e) {
        console.warn('[BRIDGE] Solver not available');
        return null;
    }
}

/**
 * Get the InfiniteStrategyGenerator
 */
export async function getStrategyGenerator() {
    if (!_infiniteGenerator) {
        try {
            const { InfiniteStrategyGenerator } = require(`${SYSTEM_PATH}/InfiniteStrategyGenerator.js`);
            _infiniteGenerator = new InfiniteStrategyGenerator({ verbose: false });
        } catch (e) {
            console.warn('[BRIDGE] InfiniteStrategyGenerator not available');
            return null;
        }
    }
    return _infiniteGenerator;
}

/**
 * Get the VoiceBrain processor
 */
export async function getVoiceBrain() {
    if (!_voiceBrain) {
        try {
            // Voice brain uses CommonJS, need to adapt
            const VoiceBrain = require(`${SYSTEM_PATH}/voice_brain.js`);
            _voiceBrain = VoiceBrain;
        } catch (e) {
            console.warn('[BRIDGE] VoiceBrain not available');
            return null;
        }
    }
    return _voiceBrain;
}

/**
 * Solve an ARC-AGI task
 */
export async function solveARC(task) {
    const solver = await getSolver();
    if (!solver) {
        return { error: 'Solver not available', predictions: [] };
    }

    try {
        const startTime = Date.now();
        const predictions = solver.solve(task);
        const elapsed = Date.now() - startTime;

        return {
            success: true,
            predictions,
            elapsed,
            solver: 'UnlimitedSolver'
        };
    } catch (e) {
        return { error: e.message, predictions: [] };
    }
}

/**
 * Generate infinite strategies
 */
export async function generateStrategies(config = {}) {
    const generator = await getStrategyGenerator();
    if (!generator) {
        return { error: 'Generator not available', strategies: [] };
    }

    try {
        const strategies = generator.generate(config);
        return {
            success: true,
            strategies,
            count: strategies.length
        };
    } catch (e) {
        return { error: e.message, strategies: [] };
    }
}

/**
 * Process voice command
 */
export async function processVoice(command, sessionId = 'default') {
    const brain = await getVoiceBrain();
    if (!brain) {
        return { error: 'VoiceBrain not available' };
    }

    try {
        // Create processor if needed
        const processor = brain.VoiceCommandProcessor
            ? new brain.VoiceCommandProcessor()
            : brain;

        const result = await processor.process(command, sessionId);
        return {
            success: true,
            result
        };
    } catch (e) {
        return { error: e.message };
    }
}

/**
 * Get system status
 */
export async function getSystemStatus() {
    const sys = await getSystem();

    return {
        available: sys.available !== false,
        version: sys.VERSION || '2.0.0',
        codename: sys.CODENAME || 'SOVEREIGN',
        components: {
            solver: !!sys.UnlimitedSolver,
            quantum: !!sys.QuantumEngine,
            nexus: !!sys.NexusProtocol,
            agents: !!sys.AgentManager,
            games: !!sys.GameLauncher
        }
    };
}

/**
 * Bridge export
 */
export const systemBridge = {
    getSystem,
    getSolver,
    getStrategyGenerator,
    getVoiceBrain,
    solveARC,
    generateStrategies,
    processVoice,
    getSystemStatus
};

export default systemBridge;
