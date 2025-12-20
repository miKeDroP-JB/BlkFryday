/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   ORBOS VOICE COCKPIT - The Command Center                                ║
 * ║   "Speak and the system obeys"                                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * The voice-first cockpit that ties together:
 * - Voice Engine (input/output)
 * - Spirit Modes (personality)
 * - AI Agents (execution)
 * - System Commands (control)
 */

import { EventEmitter } from 'events';
import { getVoiceEngine } from '../voice/engine.js';

// ═══════════════════════════════════════════════════════════════════════════
// COCKPIT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const COCKPIT_CONFIG = {
    name: 'ORBOS Voice Cockpit',
    version: '1.0.0',
    architect: 'JB',

    // Visual modes
    visualModes: ['minimal', 'hud', 'immersive', 'vr'],

    // Audio feedback
    sounds: {
        wake: 'wake.mp3',
        sleep: 'sleep.mp3',
        command: 'command.mp3',
        error: 'error.mp3',
        success: 'success.mp3'
    },

    // Command categories
    categories: {
        system: ['status', 'shutdown', 'restart', 'help'],
        spirit: ['awaken', 'switch', 'fusion'],
        agent: ['deploy', 'recall', 'status'],
        build: ['create', 'generate', 'compile'],
        query: ['search', 'find', 'analyze']
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// VOICE COCKPIT CLASS
// ═══════════════════════════════════════════════════════════════════════════

class VoiceCockpit extends EventEmitter {
    constructor(options = {}) {
        super();

        this.config = { ...COCKPIT_CONFIG, ...options };
        this.voiceEngine = null;
        this.visualMode = 'hud';
        this.isActive = false;

        // State
        this.state = {
            phase: 'idle',           // idle | booting | ready | active | processing
            spirit: 'owl',
            agents: [],
            lastCommand: null,
            commandCount: 0,
            sessionStart: null
        };

        // Command handlers
        this.commands = new Map();
        this.registerCoreCommands();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ─────────────────────────────────────────────────────────────────────────

    async boot() {
        console.log('');
        console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
        console.log('║   🎤 ORBOS VOICE COCKPIT - BOOTING                                        ║');
        console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
        console.log('');

        this.state.phase = 'booting';
        this.state.sessionStart = Date.now();

        // Phase 1: Initialize voice engine
        console.log('🔊 [1/4] Initializing Voice Engine...');
        this.voiceEngine = getVoiceEngine();
        await this.voiceEngine.initialize();
        this.wireVoiceEvents();

        // Phase 2: Load spirit modes
        console.log('🦉 [2/4] Loading Spirit Modes...');
        await this.loadSpiritModes();

        // Phase 3: Initialize agents
        console.log('🤖 [3/4] Initializing Agents...');
        await this.initializeAgents();

        // Phase 4: Start listening
        console.log('👂 [4/4] Activating Voice Listener...');
        this.voiceEngine.startListening();

        this.state.phase = 'ready';
        this.isActive = true;

        console.log('');
        console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
        console.log('║   ✅ VOICE COCKPIT READY                                                  ║');
        console.log('║                                                                           ║');
        console.log('║   Say "Hey Orb" or "Oracle" to wake                                       ║');
        console.log('║   Commands: status, help, [spirit] mode, build, deploy                    ║');
        console.log('║                                                                           ║');
        console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
        console.log('');

        this.emit('ready');
        return this;
    }

    wireVoiceEvents() {
        // Wake
        this.voiceEngine.on('wake', () => {
            this.state.phase = 'active';
            this.emit('wake');
            console.log('🔱 ORBOS Awake');
        });

        // Sleep
        this.voiceEngine.on('sleep', () => {
            this.state.phase = 'ready';
            this.emit('sleep');
        });

        // Command
        this.voiceEngine.on('command', async ({ text, confidence }) => {
            this.state.lastCommand = text;
            this.state.commandCount++;
            await this.handleCommand(text, confidence);
        });

        // Unknown command
        this.voiceEngine.on('command:unknown', async ({ text }) => {
            // Pass to AI for processing
            const response = await this.processWithAI(text);
            this.voiceEngine.speak(response);
        });

        // Spirit change
        this.voiceEngine.on('spirit:change', ({ spirit }) => {
            this.state.spirit = spirit;
            this.emit('spirit:change', spirit);
        });
    }

    async loadSpiritModes() {
        try {
            const spiritModes = await import('../../avatars/spirit-modes.js');
            this.spiritModes = spiritModes;
            console.log('   → 12 Spirit Modes loaded');
        } catch (e) {
            console.log('   → Spirit Modes: Using defaults');
            this.spiritModes = null;
        }
    }

    async initializeAgents() {
        // Core agents
        this.state.agents = ['FOX', 'OWL', 'DRAGON', 'PHOENIX', 'WOLF'];
        console.log(`   → ${this.state.agents.length} agents ready`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMMAND HANDLING
    // ─────────────────────────────────────────────────────────────────────────

    async handleCommand(text, confidence) {
        this.state.phase = 'processing';

        // Check registered commands
        for (const [pattern, handler] of this.commands) {
            const match = text.match(pattern);
            if (match) {
                const response = await handler(text, match, this);
                this.voiceEngine.speak(response);
                this.state.phase = 'active';
                return;
            }
        }

        // No match - pass to AI
        const response = await this.processWithAI(text);
        this.voiceEngine.speak(response);
        this.state.phase = 'active';
    }

    registerCommand(pattern, handler) {
        this.commands.set(pattern, handler);
    }

    registerCoreCommands() {
        // Status
        this.registerCommand(/^status$/i, (text, match, cockpit) => {
            const uptime = Math.floor((Date.now() - cockpit.state.sessionStart) / 1000);
            return `System online. Spirit: ${cockpit.state.spirit}. Uptime: ${uptime} seconds. Commands processed: ${cockpit.state.commandCount}.`;
        });

        // Help
        this.registerCommand(/^help$/i, () => {
            return 'Available commands: status, help, switch to [spirit] mode, build [thing], deploy [thing], analyze [thing], shutdown.';
        });

        // Spirit switching
        this.registerCommand(/switch to (\w+)/i, (text, match, cockpit) => {
            const spirit = match[1].toLowerCase();
            cockpit.voiceEngine.setSpirit(spirit);
            return `Switching to ${spirit} mode. ${spirit} awakens.`;
        });

        this.registerCommand(/(\w+) mode/i, (text, match, cockpit) => {
            const spirit = match[1].toLowerCase();
            if (['owl', 'fox', 'dragon', 'phoenix', 'wolf', 'raven', 'serpent', 'eagle', 'lion', 'spider', 'bear', 'hawk'].includes(spirit)) {
                cockpit.voiceEngine.setSpirit(spirit);
                return `${spirit} mode activated.`;
            }
            return `Unknown mode: ${spirit}`;
        });

        // Build commands
        this.registerCommand(/build (.+)/i, async (text, match, cockpit) => {
            const target = match[1];
            cockpit.emit('build', { target });
            return `Building ${target}. Stand by.`;
        });

        // Deploy commands
        this.registerCommand(/deploy (.+)/i, async (text, match, cockpit) => {
            const target = match[1];
            cockpit.emit('deploy', { target });
            return `Deploying ${target}. Initiating deployment sequence.`;
        });

        // Analyze
        this.registerCommand(/analyze (.+)/i, async (text, match, cockpit) => {
            const target = match[1];
            cockpit.emit('analyze', { target });
            return `Analyzing ${target}. Processing.`;
        });

        // Shutdown
        this.registerCommand(/shutdown|power off/i, (text, match, cockpit) => {
            setTimeout(() => cockpit.shutdown(), 2000);
            return 'Initiating shutdown sequence. Goodbye, Architect.';
        });

        // Agent commands
        this.registerCommand(/deploy agent (\w+)/i, (text, match, cockpit) => {
            const agent = match[1].toUpperCase();
            cockpit.state.agents.push(agent);
            return `Agent ${agent} deployed and ready.`;
        });

        // Fusion modes
        this.registerCommand(/activate (.+) fusion/i, (text, match, cockpit) => {
            const fusion = match[1].toUpperCase().replace(/\s+/g, '_');
            cockpit.emit('fusion', { mode: fusion });
            return `Fusion mode ${fusion} activated. Power levels rising.`;
        });
    }

    async processWithAI(text) {
        // This would connect to the AI brain
        this.emit('ai:process', { text });

        // Placeholder response
        return `Processing: "${text}". I'll work on that.`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VISUAL MODES
    // ─────────────────────────────────────────────────────────────────────────

    setVisualMode(mode) {
        if (this.config.visualModes.includes(mode)) {
            this.visualMode = mode;
            this.emit('visual:mode', mode);
            return true;
        }
        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONTROL
    // ─────────────────────────────────────────────────────────────────────────

    shutdown() {
        console.log('🔌 Shutting down Voice Cockpit...');
        this.voiceEngine?.stopListening();
        this.isActive = false;
        this.state.phase = 'idle';
        this.emit('shutdown');
    }

    getState() {
        return {
            ...this.state,
            isActive: this.isActive,
            visualMode: this.visualMode,
            voice: this.voiceEngine?.getState()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

let cockpitInstance = null;

export async function bootCockpit(options = {}) {
    if (!cockpitInstance) {
        cockpitInstance = new VoiceCockpit(options);
        await cockpitInstance.boot();
    }
    return cockpitInstance;
}

export function getCockpit() {
    return cockpitInstance;
}

export { VoiceCockpit, COCKPIT_CONFIG };
export default VoiceCockpit;
