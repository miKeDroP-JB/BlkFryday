/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   ORBOS - Voice-First AI Operating System                                 ║
 * ║   JB's Reality Builder                                                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * "Love, Loyalty, Honor. Everybody Eats. We Are One."
 *
 * Core Systems:
 * - Voice Engine: Speech recognition & synthesis
 * - Voice Cockpit: Command center
 * - Spirit Modes: 12 awakened forms
 * - Agents: Bounded autonomous execution
 * - Reality Forge: Build anything
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { VoiceEngine, getVoiceEngine, VOICE_CONFIG } from './voice/engine.js';
export { VoiceCockpit, bootCockpit, getCockpit, COCKPIT_CONFIG } from './cockpit/voice-cockpit.js';
export { boot, BOOT_CONFIG } from './boot/init.js';

// ═══════════════════════════════════════════════════════════════════════════
// QUICK START
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Boot ORBOS in one line
 *
 * import { start } from './os/index.js';
 * await start();
 */
export async function start(options = {}) {
    const { boot } = await import('./boot/init.js');
    return boot(options);
}

// ═══════════════════════════════════════════════════════════════════════════
// OS METADATA
// ═══════════════════════════════════════════════════════════════════════════

export const ORBOS = {
    name: 'ORBOS',
    fullName: 'Voice-First AI Operating System',
    version: '1.0.0',
    architect: 'JB',
    philosophy: 'Love, Loyalty, Honor. Everybody Eats. We Are One.',

    capabilities: [
        'Voice-First Interface',
        '12 Spirit Modes',
        '6 Fusion Modes',
        'Bounded Agent Autonomy',
        'Multi-Node Coherence',
        'ARC-AGI Solver',
        'Reality Forge'
    ],

    spirits: [
        'owl', 'fox', 'dragon', 'phoenix', 'wolf', 'raven',
        'serpent', 'eagle', 'lion', 'spider', 'bear', 'hawk'
    ],

    pantheon: {
        apollo: 'Vision & Prophecy',
        mercury: 'Commerce & Routing',
        athena: 'Wisdom & Strategy',
        ares: 'Execution & Combat',
        hermes: 'Communication',
        hephaestus: 'Building & Crafting',
        artemis: 'Hunting & Precision',
        zeus: 'Sovereignty & Power',
        asclepius: 'Healing & Regeneration'
    }
};

export default ORBOS;
