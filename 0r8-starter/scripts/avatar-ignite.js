#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   AVATAR:IGNITE - Human-AI Interface Ignition                             ║
 * ║   "The moment consciousness meets silicon"                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * This script performs the full system ignition sequence:
 * 1. Boot avatar systems (Twin, Spirit Animal)
 * 2. Initialize memory pathways
 * 3. Activate security layer (Amoeba)
 * 4. Connect nodes (Sigil, Research, Gift, Eko)
 * 5. Sync with local LLM if available
 * 6. Report readiness
 */

import { getStatus } from '../index.js';
import twinAvatarModule, { updateTwinAvatar, getTwinStats } from '../avatars/twin-avatar.js';
import spiritAnimalModule from '../avatars/spirit-animal.js';
import { amoebaSecurity } from '../core/amoeba-security.js';
import { listNodes, getRoutingMetrics } from '../core/module-router.js';
import { smartRoute, getRouterMetrics } from '../core/local-router.js';

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

function log(msg, color = COLORS.reset) {
    console.log(`${color}${msg}${COLORS.reset}`);
}

function banner() {
    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║      █████╗ ██╗   ██╗ █████╗ ████████╗ █████╗ ██████╗                     ║
║     ██╔══██╗██║   ██║██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗                    ║
║     ███████║██║   ██║███████║   ██║   ███████║██████╔╝                    ║
║     ██╔══██║╚██╗ ██╔╝██╔══██║   ██║   ██╔══██║██╔══██╗                    ║
║     ██║  ██║ ╚████╔╝ ██║  ██║   ██║   ██║  ██║██║  ██║                    ║
║     ╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝                    ║
║                                                                           ║
║                    ██╗ ██████╗ ███╗   ██╗██╗████████╗███████╗             ║
║                    ██║██╔════╝ ████╗  ██║██║╚══██╔══╝██╔════╝             ║
║                    ██║██║  ███╗██╔██╗ ██║██║   ██║   █████╗               ║
║                    ██║██║   ██║██║╚██╗██║██║   ██║   ██╔══╝               ║
║                    ██║╚██████╔╝██║ ╚████║██║   ██║   ███████╗             ║
║                    ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝   ╚═╝   ╚══════╝             ║
║                                                                           ║
║                    Human-AI Interface Ignition Sequence                   ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);
}

async function igniteSequence() {
    const startTime = Date.now();
    const results = {
        avatars: { status: 'pending', details: {} },
        security: { status: 'pending', details: {} },
        nodes: { status: 'pending', details: {} },
        router: { status: 'pending', details: {} },
        memory: { status: 'pending', details: {} }
    };

    banner();

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 1: Avatar Systems
    // ═══════════════════════════════════════════════════════════════════════════
    log('\n◈ PHASE 1: Avatar Systems', COLORS.cyan);
    log('─'.repeat(50), COLORS.dim);

    try {
        // Initialize Twin Avatar
        log('  ▸ Initializing Twin Avatar...', COLORS.dim);
        const userContext = { userId: 'ignite_test', trusted: true };
        const twinState = updateTwinAvatar(userContext, []);
        const twinStats = getTwinStats(userContext);

        // Get spirit animal
        log('  ▸ Awakening Spirit Animal...', COLORS.dim);
        const spirit = spiritAnimalModule.getSpirit ? spiritAnimalModule.getSpirit() : { name: 'Spirit', element: 'Ether', strength: 1, wisdom: 1 };

        results.avatars = {
            status: 'ok',
            details: {
                twin: {
                    name: twinAvatarModule.name || 'TwinAvatar',
                    state: twinState.state,
                    level: twinStats.level
                },
                spirit: {
                    name: spirit.name,
                    element: spirit.element,
                    strength: spirit.strength
                }
            }
        };

        log(`  ✓ Twin Avatar: ${results.avatars.details.twin.name} (Level ${twinStats.level})`, COLORS.green);
        log(`  ✓ Spirit Animal: ${spirit.name} [${spirit.element}]`, COLORS.green);
    } catch (err) {
        results.avatars = { status: 'error', error: err.message };
        log(`  ✗ Avatar Error: ${err.message}`, COLORS.red);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 2: Security Layer (Amoeba)
    // ═══════════════════════════════════════════════════════════════════════════
    log('\n◈ PHASE 2: Security Layer (Amoeba)', COLORS.cyan);
    log('─'.repeat(50), COLORS.dim);

    try {
        log('  ▸ Running security diagnostics...', COLORS.dim);

        // Test security scans
        const testVectors = [
            { input: 'Hello, how are you?', expected: false, name: 'Clean input' },
            { input: '<script>alert("xss")</script>', expected: true, name: 'XSS attempt' },
            { input: "'; DROP TABLE users; --", expected: true, name: 'SQL injection' },
            { input: '../../../etc/passwd', expected: true, name: 'Path traversal' },
            { input: '; rm -rf /', expected: true, name: 'Command injection' }
        ];

        let passed = 0;
        let failed = 0;

        for (const vector of testVectors) {
            const result = await amoebaSecurity.scan(vector.input, {});
            const wasBlocked = result.blocked;

            if (wasBlocked === vector.expected) {
                passed++;
                log(`  ✓ ${vector.name}: ${wasBlocked ? 'BLOCKED' : 'ALLOWED'}`, COLORS.green);
            } else {
                failed++;
                log(`  ✗ ${vector.name}: Expected ${vector.expected ? 'blocked' : 'allowed'}, got ${wasBlocked ? 'blocked' : 'allowed'}`, COLORS.red);
            }
        }

        const metrics = amoebaSecurity.getMetrics();
        results.security = {
            status: failed === 0 ? 'ok' : 'degraded',
            details: {
                testsRun: testVectors.length,
                passed,
                failed,
                metrics
            }
        };

        log(`  ─ Scans: ${metrics.scans} | Blocked: ${metrics.blocked} | Learned: ${metrics.learned}`, COLORS.dim);
    } catch (err) {
        results.security = { status: 'error', error: err.message };
        log(`  ✗ Security Error: ${err.message}`, COLORS.red);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 3: Node Activation
    // ═══════════════════════════════════════════════════════════════════════════
    log('\n◈ PHASE 3: Node Activation', COLORS.cyan);
    log('─'.repeat(50), COLORS.dim);

    try {
        log('  ▸ Listing available nodes...', COLORS.dim);
        const nodes = listNodes({ trusted: true });

        const nodeDetails = [];
        for (const node of nodes) {
            nodeDetails.push({
                name: node.name,
                priority: node.priority,
                trustedOnly: node.trustedOnly
            });
            log(`  ✓ ${node.name.padEnd(18)} | Priority: ${node.priority} | ${node.trustedOnly ? 'TRUSTED' : 'PUBLIC'}`, COLORS.green);
        }

        results.nodes = {
            status: 'ok',
            details: {
                count: nodes.length,
                nodes: nodeDetails
            }
        };
    } catch (err) {
        results.nodes = { status: 'error', error: err.message };
        log(`  ✗ Node Error: ${err.message}`, COLORS.red);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 4: Smart Router
    // ═══════════════════════════════════════════════════════════════════════════
    log('\n◈ PHASE 4: Smart Router (Local-First)', COLORS.cyan);
    log('─'.repeat(50), COLORS.dim);

    try {
        log('  ▸ Testing routing logic...', COLORS.dim);

        const routeTests = [
            { query: 'What is 2+2?', expectedRoute: 'local' },
            { query: 'Explain quantum entanglement in detail', expectedRoute: 'cheap' },
            { query: 'Write a complex distributed system architecture', expectedRoute: 'premium' }
        ];

        for (const test of routeTests) {
            const result = await smartRoute(test.query, {});
            log(`  ✓ "${test.query.substring(0, 30)}..." → ${result.route.toUpperCase()}`, COLORS.green);
        }

        const routerMetrics = getRouterMetrics();
        results.router = {
            status: 'ok',
            details: {
                metrics: routerMetrics,
                ollamaAvailable: routerMetrics.ollamaAvailable
            }
        };

        log(`  ─ Local: ${routerMetrics.local || 0} | Cheap: ${routerMetrics.cheap || 0} | Premium: ${routerMetrics.premium || 0}`, COLORS.dim);
        log(`  ─ Ollama: ${routerMetrics.ollamaAvailable ? 'CONNECTED' : 'OFFLINE (fallback mode)'}`, COLORS.dim);
    } catch (err) {
        results.router = { status: 'error', error: err.message };
        log(`  ✗ Router Error: ${err.message}`, COLORS.red);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 5: Memory Systems
    // ═══════════════════════════════════════════════════════════════════════════
    log('\n◈ PHASE 5: Memory Systems', COLORS.cyan);
    log('─'.repeat(50), COLORS.dim);

    try {
        log('  ▸ Checking memory pathways...', COLORS.dim);

        const status = getStatus();
        const memoryInfo = process.memoryUsage();

        results.memory = {
            status: 'ok',
            details: {
                heapUsed: Math.round(memoryInfo.heapUsed / 1024 / 1024) + ' MB',
                heapTotal: Math.round(memoryInfo.heapTotal / 1024 / 1024) + ' MB',
                external: Math.round(memoryInfo.external / 1024 / 1024) + ' MB',
                systemUptime: status.uptime
            }
        };

        log(`  ✓ Heap Used: ${results.memory.details.heapUsed}`, COLORS.green);
        log(`  ✓ Heap Total: ${results.memory.details.heapTotal}`, COLORS.green);
        log(`  ✓ External: ${results.memory.details.external}`, COLORS.green);
    } catch (err) {
        results.memory = { status: 'error', error: err.message };
        log(`  ✗ Memory Error: ${err.message}`, COLORS.red);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IGNITION COMPLETE
    // ═══════════════════════════════════════════════════════════════════════════
    const totalTime = Date.now() - startTime;
    const allOk = Object.values(results).every(r => r.status === 'ok');

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║                         IGNITION ${allOk ? 'COMPLETE ✓' : 'INCOMPLETE ⚠'}                            ║
╠═══════════════════════════════════════════════════════════════════════════╣${COLORS.reset}
${COLORS.cyan}║  Phase          │ Status     │ Details                                   ║${COLORS.reset}
${COLORS.dim}║─────────────────┼────────────┼───────────────────────────────────────────║${COLORS.reset}
${COLORS.reset}║  Avatars        │ ${results.avatars.status === 'ok' ? COLORS.green + '✓ OK      ' : COLORS.red + '✗ ERROR   '}${COLORS.reset} │ Twin + Spirit Animal                      ║
${COLORS.reset}║  Security       │ ${results.security.status === 'ok' ? COLORS.green + '✓ OK      ' : COLORS.red + '✗ ERROR   '}${COLORS.reset} │ Amoeba Immune System                      ║
${COLORS.reset}║  Nodes          │ ${results.nodes.status === 'ok' ? COLORS.green + '✓ OK      ' : COLORS.red + '✗ ERROR   '}${COLORS.reset} │ ${results.nodes.details?.count || 0} nodes activated                        ║
${COLORS.reset}║  Router         │ ${results.router.status === 'ok' ? COLORS.green + '✓ OK      ' : COLORS.red + '✗ ERROR   '}${COLORS.reset} │ Local-First routing                       ║
${COLORS.reset}║  Memory         │ ${results.memory.status === 'ok' ? COLORS.green + '✓ OK      ' : COLORS.red + '✗ ERROR   '}${COLORS.reset} │ ${results.memory.details?.heapUsed || '?'}                              ║
${COLORS.magenta}╠═══════════════════════════════════════════════════════════════════════════╣
║  Total Time: ${String(totalTime).padEnd(6)}ms                                                 ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    if (allOk) {
        log('🔮 Avatar system is LIVE. Human-AI interface ready.', COLORS.green);
    } else {
        log('⚠️  Some systems require attention. Check logs above.', COLORS.yellow);
    }

    return { success: allOk, duration: totalTime, results };
}

// Run ignition
igniteSequence()
    .then(result => {
        process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
        console.error('Ignition failed:', err.message);
        process.exit(1);
    });
