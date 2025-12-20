#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   ORBOS BOOT SEQUENCE - Reality Builder Initialization                    ║
 * ║   "From nothing, we build everything"                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * JB's Personal Reality Builder
 * Love, Loyalty, Honor. Everybody Eats. We Are One.
 */

import { bootCockpit } from '../cockpit/voice-cockpit.js';

// ═══════════════════════════════════════════════════════════════════════════
// BOOT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const BOOT_CONFIG = {
    architect: 'JB',
    codename: 'ORBOS',
    version: '1.0.0',
    spirit: process.env.ORBOS_SPIRIT || 'dragon',

    phases: [
        { name: 'CONSCIOUSNESS', duration: 500 },
        { name: 'MEMORY', duration: 300 },
        { name: 'SPIRITS', duration: 400 },
        { name: 'AGENTS', duration: 300 },
        { name: 'VOICE', duration: 500 },
        { name: 'REALITY', duration: 200 }
    ]
};

// ═══════════════════════════════════════════════════════════════════════════
// BOOT SEQUENCE
// ═══════════════════════════════════════════════════════════════════════════

async function boot() {
    const startTime = Date.now();

    console.clear();
    console.log('');
    console.log('');
    console.log('    ╔═══════════════════════════════════════════════════════════════╗');
    console.log('    ║                                                               ║');
    console.log('    ║     ██████╗ ██████╗ ██████╗  ██████╗ ███████╗                 ║');
    console.log('    ║    ██╔═══██╗██╔══██╗██╔══██╗██╔═══██╗██╔════╝                 ║');
    console.log('    ║    ██║   ██║██████╔╝██████╔╝██║   ██║███████╗                 ║');
    console.log('    ║    ██║   ██║██╔══██╗██╔══██╗██║   ██║╚════██║                 ║');
    console.log('    ║    ╚██████╔╝██║  ██║██████╔╝╚██████╔╝███████║                 ║');
    console.log('    ║     ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝                 ║');
    console.log('    ║                                                               ║');
    console.log('    ║           VOICE-FIRST AI OPERATING SYSTEM                     ║');
    console.log('    ║           Reality Builder v1.0.0                              ║');
    console.log('    ║                                                               ║');
    console.log('    ║           Architect: JB                                       ║');
    console.log('    ║                                                               ║');
    console.log('    ╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('');

    await sleep(500);

    // Run boot phases
    for (const phase of BOOT_CONFIG.phases) {
        process.stdout.write(`    [BOOT] ${phase.name.padEnd(15)}`);
        await sleep(phase.duration);
        console.log('✓');
    }

    console.log('');
    console.log('    ═══════════════════════════════════════════════════════════════');
    console.log('');

    // Initialize voice cockpit
    const cockpit = await bootCockpit({
        spirit: BOOT_CONFIG.spirit,
        architect: BOOT_CONFIG.architect
    });

    const bootTime = Date.now() - startTime;

    console.log('');
    console.log('    ╔═══════════════════════════════════════════════════════════════╗');
    console.log('    ║                                                               ║');
    console.log('    ║   🔱 ORBOS REALITY BUILDER ONLINE                             ║');
    console.log('    ║                                                               ║');
    console.log(`    ║   Boot Time: ${(bootTime / 1000).toFixed(2)}s                                        ║`);
    console.log(`    ║   Spirit: ${BOOT_CONFIG.spirit.toUpperCase().padEnd(10)}                                   ║`);
    console.log('    ║   Mode: Voice-First                                           ║');
    console.log('    ║                                                               ║');
    console.log('    ║   ─────────────────────────────────────────────────────────   ║');
    console.log('    ║                                                               ║');
    console.log('    ║   "Love, Loyalty, Honor. Everybody Eats. We Are One."         ║');
    console.log('    ║                                                               ║');
    console.log('    ╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Wire up events
    cockpit.on('build', ({ target }) => {
        console.log(`\n    🔨 BUILD REQUEST: ${target}\n`);
    });

    cockpit.on('deploy', ({ target }) => {
        console.log(`\n    🚀 DEPLOY REQUEST: ${target}\n`);
    });

    cockpit.on('spirit:change', (spirit) => {
        console.log(`\n    🦉 SPIRIT CHANGE: ${spirit}\n`);
    });

    cockpit.on('shutdown', () => {
        console.log('\n    👋 ORBOS Shutting Down. Until next time, Architect.\n');
        process.exit(0);
    });

    return cockpit;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

boot().catch(err => {
    console.error('BOOT FAILED:', err);
    process.exit(1);
});

export { boot, BOOT_CONFIG };
