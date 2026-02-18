/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   0R8 STARTER - The Core Orb Engine                                       ║
 * ║   Where consciousness meets code                                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 *   Flow: Input → Amoeba → Grimoire → Modules → FlowSync → Avatars → UI
 *
 *   The 7 Laws:
 *     1. Preserve memory integrity
 *     2. Prioritize user context
 *     3. Optimize AI module selection
 *     4. Maintain ethical boundaries
 *     5. Maximize learning from outcomes
 *     6. Automate repeatable patterns
 *     7. Replicate successful processes
 */

import { amoebaSecurity } from './core/amoeba-security.js';
import { grimoireProcess, addKnowledge, castSpell } from './core/grimoire-core.js';
import { routeModules, routeToNode, registerNode } from './core/module-router.js';
import { userStorage, sessionStorage, cache } from './core/storage-hybrid.js';
import { loadUI, switchLayout, registerLayout } from './ui/ui-loader.js';
import { updateTwinAvatar, getTwinStats } from './avatars/twin-avatar.js';
import { updateSpiritAnimal, getSpiritStats, listSpirits } from './avatars/spirit-animal.js';
import { flowSync } from './core/flowsync-node.js';
import { encryptOutput, decryptInput, generateId, generateToken } from './core/crypto-utils.js';

// Terminal imports (lazy loaded for CLI mode)
let terminalCore = null;

// Version
const VERSION = '1.0.0';

// Global metrics
const metrics = {
    requests: 0,
    errors: 0,
    startTime: Date.now()
};

/**
 * Main input handler - The primary entry point
 */
export async function handleUserInput(input, userContext = {}) {
    const requestId = generateId('req');
    const startTime = Date.now();
    metrics.requests++;

    try {
        // Ensure userContext has required fields
        userContext = {
            userId: userContext.userId || 'anonymous',
            memory: userContext.memory || [],
            preferences: userContext.preferences || {},
            recentInputs: userContext.recentInputs || [],
            ...userContext
        };

        // Track input timing
        userContext.recentInputs.push(Date.now());
        userContext.recentInputs = userContext.recentInputs.slice(-100);

        // ═══════════════════════════════════════════════════════════════════
        // Step 0: Amoeba Security - First line of defense
        // ═══════════════════════════════════════════════════════════════════
        const securityReport = await amoebaSecurity.scan(input, userContext);

        if (securityReport.blocked) {
            console.log(`[0r8] Request ${requestId} blocked by security`);
            input = securityReport.sanitized;
        }

        // ═══════════════════════════════════════════════════════════════════
        // Step 1: Grimoire Processing - Context & memory
        // ═══════════════════════════════════════════════════════════════════
        const filteredData = await grimoireProcess(input, userContext.memory);

        // Check for spells (automated actions)
        const spellResult = castSpell(input, filteredData.context);
        if (spellResult.cast) {
            console.log(`[0r8] Spell cast: ${spellResult.spell}`);
        }

        // ═══════════════════════════════════════════════════════════════════
        // Step 2: Route through AI modules
        // ═══════════════════════════════════════════════════════════════════
        const moduleResults = await routeModules(filteredData, userContext);

        // ═══════════════════════════════════════════════════════════════════
        // Step 3: FlowSync Orchestration - Apply 7 laws
        // ═══════════════════════════════════════════════════════════════════
        const lawfulResults = await flowSync.process(
            filteredData,
            securityReport,
            userContext,
            moduleResults
        );

        // ═══════════════════════════════════════════════════════════════════
        // Step 4: Update Avatars
        // ═══════════════════════════════════════════════════════════════════
        const twin = updateTwinAvatar(userContext, lawfulResults);
        const spiritAnimal = updateSpiritAnimal(userContext);

        // ═══════════════════════════════════════════════════════════════════
        // Step 5: Persist to storage
        // ═══════════════════════════════════════════════════════════════════
        userStorage.save(userContext.userId, lawfulResults, {
            tags: ['interaction', filteredData.intent?.primary || 'unknown']
        });

        // Add to user memory
        userContext.memory = [...userContext.memory, ...lawfulResults].slice(-1000);

        // ═══════════════════════════════════════════════════════════════════
        // Step 6: Render UI
        // ═══════════════════════════════════════════════════════════════════
        const uiLayout = loadUI(userContext.preferences);
        uiLayout.render({
            modules: lawfulResults,
            avatars: { twin, spiritAnimal },
            security: securityReport
        });

        // Build response
        const response = {
            requestId,
            success: true,
            lawfulResults,
            twin,
            spiritAnimal,
            securityReport,
            spell: spellResult.cast ? spellResult : null,
            intent: filteredData.intent,
            latency: Date.now() - startTime
        };

        return response;

    } catch (error) {
        metrics.errors++;
        console.error(`[0r8] Error in request ${requestId}:`, error);

        return {
            requestId,
            success: false,
            error: error.message,
            latency: Date.now() - startTime
        };
    }
}

/**
 * Quick process - Skip UI rendering for API usage
 */
export async function quickProcess(input, userContext = {}) {
    const securityReport = await amoebaSecurity.scan(input, userContext);
    if (securityReport.blocked) input = securityReport.sanitized;

    const filteredData = await grimoireProcess(input, userContext.memory || []);
    const moduleResults = await routeModules(filteredData, userContext);
    const lawfulResults = await flowSync.process(filteredData, securityReport, userContext, moduleResults);

    return {
        results: lawfulResults,
        security: securityReport,
        intent: filteredData.intent
    };
}

/**
 * Direct module invocation
 */
export async function invokeModule(moduleName, input, userContext = {}) {
    return routeToNode(moduleName, input, userContext);
}

/**
 * Get system status
 */
export function getStatus() {
    return {
        version: VERSION,
        uptime: Date.now() - metrics.startTime,
        requests: metrics.requests,
        errors: metrics.errors,
        errorRate: metrics.requests > 0 ? metrics.errors / metrics.requests : 0,
        flowSync: flowSync.getMetrics(),
        security: amoebaSecurity.getMetrics()
    };
}

/**
 * Get user dashboard data
 */
export function getDashboard(userId) {
    return {
        twin: getTwinStats(userId),
        spirit: getSpiritStats(userId),
        storage: userStorage.stats(userId),
        spirits: listSpirits()
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════════

export {
    // Core
    amoebaSecurity,
    grimoireProcess,
    addKnowledge,
    flowSync,

    // Modules
    routeModules,
    routeToNode,
    registerNode,

    // Storage
    userStorage,
    sessionStorage,
    cache,

    // UI
    loadUI,
    switchLayout,
    registerLayout,

    // Avatars
    updateTwinAvatar,
    updateSpiritAnimal,
    getTwinStats,
    getSpiritStats,
    listSpirits,

    // Crypto
    encryptOutput,
    decryptInput,
    generateId,
    generateToken,

    // Version
    VERSION
};

// Note: startTerminal and getTerminalCommands are exported directly below

/**
 * Start 0r8.term - The AI-Native Terminal
 * "The terminal that thinks before you do"
 */
export async function startTerminal(userContext = {}) {
    if (!terminalCore) {
        const module = await import('./terminal/0r8-term-core.js');
        terminalCore = module;
    }
    return terminalCore.start0r8Term(userContext);
}

/**
 * Get terminal commands (for programmatic access)
 */
export async function getTerminalCommands() {
    if (!terminalCore) {
        const module = await import('./terminal/0r8-term-core.js');
        terminalCore = module;
    }
    return terminalCore.COMMANDS;
}

export default {
    handleUserInput,
    quickProcess,
    invokeModule,
    getStatus,
    getDashboard,
    startTerminal,
    getTerminalCommands,
    VERSION
};
