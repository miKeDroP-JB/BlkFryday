/**
 * ORB TERMINAL - AI-Powered Terminal Emulator
 * ============================================
 * Voice-first, AI-augmented terminal that learns and adapts
 * Integrates with ORBOS spirit modes and personalization
 *
 * "The command line, evolved."
 */

const EventEmitter = require('events');
const readline = require('readline');

// ═══════════════════════════════════════════════════════════════
// TERMINAL CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const TERMINAL_CONFIG = {
    name: 'ORB.TERM',
    version: '1.0.0',
    architect: 'JB',
    defaultSpirit: 'owl',
    aiEnabled: true,
    voiceEnabled: true,
    learningEnabled: true
};

// Spirit-themed terminal prompts
const SPIRIT_PROMPTS = {
    owl: { symbol: '🦉', color: '\x1b[35m', prompt: 'owl>' },      // Purple
    fox: { symbol: '🦊', color: '\x1b[33m', prompt: 'fox>' },      // Yellow
    dragon: { symbol: '🐉', color: '\x1b[31m', prompt: 'dragon>' }, // Red
    phoenix: { symbol: '🔥', color: '\x1b[91m', prompt: 'phoenix>' }, // Bright red
    wolf: { symbol: '🐺', color: '\x1b[34m', prompt: 'wolf>' },    // Blue
    raven: { symbol: '🐦‍⬛', color: '\x1b[90m', prompt: 'raven>' },  // Dark gray
    serpent: { symbol: '🐍', color: '\x1b[32m', prompt: 'serpent>' }, // Green
    eagle: { symbol: '🦅', color: '\x1b[97m', prompt: 'eagle>' },  // White
    lion: { symbol: '🦁', color: '\x1b[93m', prompt: 'lion>' },    // Bright yellow
    spider: { symbol: '🕷️', color: '\x1b[95m', prompt: 'spider>' }, // Magenta
    bear: { symbol: '🐻', color: '\x1b[33m', prompt: 'bear>' },    // Brown-ish
    hawk: { symbol: '🦅', color: '\x1b[36m', prompt: 'hawk>' }     // Cyan
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

// ═══════════════════════════════════════════════════════════════
// AI COMMAND PROCESSOR
// ═══════════════════════════════════════════════════════════════

class AICommandProcessor {
    constructor() {
        this.commandHistory = [];
        this.commandPatterns = new Map();
        this.predictions = [];
        this.contextStack = [];
        this.aliases = new Map();
        this.macros = new Map();

        // Initialize built-in aliases
        this.initAliases();
    }

    initAliases() {
        // Spirit shortcuts
        this.aliases.set('o', 'spirit owl');
        this.aliases.set('f', 'spirit fox');
        this.aliases.set('d', 'spirit dragon');
        this.aliases.set('sage', 'fusion TRICKSTER_SAGE');

        // System shortcuts
        this.aliases.set('s', 'status');
        this.aliases.set('h', 'help');
        this.aliases.set('c', 'clear');
        this.aliases.set('q', 'exit');

        // Power commands
        this.aliases.set('boot', 'system boot');
        this.aliases.set('wake', 'voice activate');
        this.aliases.set('learn', 'ai learn');
    }

    // Expand aliases
    expand(input) {
        const parts = input.trim().split(' ');
        const first = parts[0].toLowerCase();

        if (this.aliases.has(first)) {
            parts[0] = this.aliases.get(first);
            return parts.join(' ');
        }
        return input;
    }

    // Record command for learning
    record(command, success = true, context = {}) {
        const entry = {
            command,
            timestamp: Date.now(),
            success,
            context,
            spirit: context.spirit || 'owl'
        };

        this.commandHistory.push(entry);
        this.updatePatterns(entry);

        // Keep history manageable
        if (this.commandHistory.length > 1000) {
            this.commandHistory = this.commandHistory.slice(-500);
        }
    }

    // Update command patterns for prediction
    updatePatterns(entry) {
        const key = this.getPatternKey(entry);
        const current = this.commandPatterns.get(key) || { count: 0, successRate: 0 };

        current.count++;
        current.successRate = entry.success
            ? (current.successRate * (current.count - 1) + 1) / current.count
            : (current.successRate * (current.count - 1)) / current.count;
        current.lastUsed = entry.timestamp;

        this.commandPatterns.set(key, current);
    }

    getPatternKey(entry) {
        const hour = new Date(entry.timestamp).getHours();
        const timeBlock = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
        return `${entry.spirit}:${timeBlock}:${entry.command.split(' ')[0]}`;
    }

    // Predict next command
    predict(context = {}) {
        const hour = new Date().getHours();
        const timeBlock = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
        const spirit = context.spirit || 'owl';

        const predictions = [];

        for (const [key, data] of this.commandPatterns) {
            if (key.startsWith(`${spirit}:${timeBlock}`)) {
                predictions.push({
                    command: key.split(':')[2],
                    score: data.count * data.successRate,
                    successRate: data.successRate
                });
            }
        }

        return predictions.sort((a, b) => b.score - a.score).slice(0, 5);
    }

    // Autocomplete suggestions
    autocomplete(partial, context = {}) {
        const suggestions = [];
        const lower = partial.toLowerCase();

        // From aliases
        for (const [alias, expansion] of this.aliases) {
            if (alias.startsWith(lower)) {
                suggestions.push({ text: alias, type: 'alias', expansion });
            }
        }

        // From history
        const historyCmds = [...new Set(this.commandHistory.map(h => h.command))];
        for (const cmd of historyCmds) {
            if (cmd.toLowerCase().startsWith(lower)) {
                suggestions.push({ text: cmd, type: 'history' });
            }
        }

        return suggestions.slice(0, 10);
    }

    // Create macro from command sequence
    createMacro(name, commands) {
        this.macros.set(name, commands);
    }

    // Execute macro
    executeMacro(name) {
        return this.macros.get(name) || null;
    }
}

// ═══════════════════════════════════════════════════════════════
// VOICE TERMINAL INTERFACE
// ═══════════════════════════════════════════════════════════════

class VoiceTerminalInterface {
    constructor(terminal) {
        this.terminal = terminal;
        this.listening = false;
        this.wakeWord = 'orb';
        this.commandBuffer = [];
    }

    // Process voice input
    processVoice(transcript) {
        const lower = transcript.toLowerCase();

        // Check for wake word
        if (lower.includes(this.wakeWord)) {
            const afterWake = lower.split(this.wakeWord).pop().trim();
            if (afterWake) {
                return this.terminal.execute(afterWake);
            }
            return { type: 'listening', message: 'Listening...' };
        }

        // Direct command if already listening
        if (this.listening) {
            return this.terminal.execute(transcript);
        }

        return null;
    }

    // Convert command to speech output
    toSpeech(result) {
        if (!result) return null;

        // Convert terminal output to speakable text
        const text = typeof result === 'string'
            ? result.replace(/[═─│┌┐└┘├┤┬┴┼]/g, '').trim()
            : result.message || 'Command executed';

        return {
            text,
            spirit: this.terminal.currentSpirit,
            priority: result.priority || 'normal'
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// ORB TERMINAL - MAIN CLASS
// ═══════════════════════════════════════════════════════════════

class OrbTerminal extends EventEmitter {
    constructor(options = {}) {
        super();

        this.config = { ...TERMINAL_CONFIG, ...options };
        this.currentSpirit = options.spirit || this.config.defaultSpirit;
        this.running = false;
        this.rl = null;

        // Initialize subsystems
        this.ai = new AICommandProcessor();
        this.voice = new VoiceTerminalInterface(this);

        // Command registry
        this.commands = new Map();
        this.initBuiltinCommands();

        // Session data
        this.session = {
            startTime: null,
            commandCount: 0,
            user: null,
            context: {}
        };

        // Output buffer for piping
        this.outputBuffer = [];
    }

    // ─────────────────────────────────────────────────────────────
    // BUILT-IN COMMANDS
    // ─────────────────────────────────────────────────────────────

    initBuiltinCommands() {
        // Help
        this.register('help', {
            description: 'Show available commands',
            handler: () => this.showHelp()
        });

        // Spirit mode
        this.register('spirit', {
            description: 'Switch or show spirit mode',
            usage: 'spirit [name]',
            handler: (args) => this.handleSpirit(args)
        });

        // Fusion mode
        this.register('fusion', {
            description: 'Activate fusion mode',
            usage: 'fusion <mode>',
            handler: (args) => this.handleFusion(args)
        });

        // Status
        this.register('status', {
            description: 'Show system status',
            handler: () => this.showStatus()
        });

        // Clear
        this.register('clear', {
            description: 'Clear terminal',
            handler: () => this.clear()
        });

        // History
        this.register('history', {
            description: 'Show command history',
            handler: () => this.showHistory()
        });

        // Predict
        this.register('predict', {
            description: 'Show AI command predictions',
            handler: () => this.showPredictions()
        });

        // Voice
        this.register('voice', {
            description: 'Voice control',
            usage: 'voice [on|off|status]',
            handler: (args) => this.handleVoice(args)
        });

        // AI
        this.register('ai', {
            description: 'AI assistant commands',
            usage: 'ai [ask|learn|suggest]',
            handler: (args) => this.handleAI(args)
        });

        // Alias
        this.register('alias', {
            description: 'Manage command aliases',
            usage: 'alias [name] [command]',
            handler: (args) => this.handleAlias(args)
        });

        // Macro
        this.register('macro', {
            description: 'Record/play command macros',
            usage: 'macro [record|play|list] [name]',
            handler: (args) => this.handleMacro(args)
        });

        // System
        this.register('system', {
            description: 'System commands',
            usage: 'system [boot|shutdown|restart]',
            handler: (args) => this.handleSystem(args)
        });

        // Exec - execute shell command
        this.register('exec', {
            description: 'Execute shell command',
            usage: 'exec <command>',
            handler: (args) => this.handleExec(args)
        });

        // Exit
        this.register('exit', {
            description: 'Exit terminal',
            handler: () => this.shutdown()
        });
    }

    // Register custom command
    register(name, config) {
        this.commands.set(name.toLowerCase(), config);
    }

    // ─────────────────────────────────────────────────────────────
    // COMMAND HANDLERS
    // ─────────────────────────────────────────────────────────────

    showHelp() {
        const spirit = SPIRIT_PROMPTS[this.currentSpirit];
        const lines = [
            '',
            `${spirit.color}${BOLD}═══════════════════════════════════════${RESET}`,
            `${spirit.color}${BOLD}  ${spirit.symbol} ORB.TERM - AI TERMINAL COMMANDS${RESET}`,
            `${spirit.color}${BOLD}═══════════════════════════════════════${RESET}`,
            ''
        ];

        for (const [name, cmd] of this.commands) {
            const usage = cmd.usage || name;
            lines.push(`  ${spirit.color}${name}${RESET}${DIM} - ${cmd.description}${RESET}`);
        }

        lines.push('');
        lines.push(`${DIM}  Aliases: o(wl), f(ox), d(ragon), s(tatus), h(elp), c(lear), q(uit)${RESET}`);
        lines.push('');

        return lines.join('\n');
    }

    handleSpirit(args) {
        if (!args || args.length === 0) {
            return `Current spirit: ${SPIRIT_PROMPTS[this.currentSpirit].symbol} ${this.currentSpirit}`;
        }

        const newSpirit = args[0].toLowerCase();
        if (SPIRIT_PROMPTS[newSpirit]) {
            const oldSpirit = this.currentSpirit;
            this.currentSpirit = newSpirit;
            this.emit('spirit-change', { from: oldSpirit, to: newSpirit });

            const sp = SPIRIT_PROMPTS[newSpirit];
            return `\n${sp.color}${sp.symbol} Spirit awakened: ${BOLD}${newSpirit.toUpperCase()}${RESET}\n`;
        }

        return `Unknown spirit: ${args[0]}. Available: ${Object.keys(SPIRIT_PROMPTS).join(', ')}`;
    }

    handleFusion(args) {
        const fusions = {
            'APEX_PREDATOR': ['wolf', 'lion', 'eagle'],
            'ORACLE_PRIME': ['owl', 'raven', 'spider'],
            'PACK_ALPHA': ['wolf', 'bear', 'lion'],
            'TRICKSTER_SAGE': ['owl', 'fox', 'serpent'],
            'PHOENIX_DRAGON': ['phoenix', 'dragon'],
            'SILENT_HUNTER': ['owl', 'hawk', 'serpent']
        };

        if (!args || args.length === 0) {
            const lines = ['\nAvailable Fusions:'];
            for (const [name, spirits] of Object.entries(fusions)) {
                lines.push(`  ${name}: ${spirits.join(' + ')}`);
            }
            return lines.join('\n');
        }

        const fusion = args[0].toUpperCase();
        if (fusions[fusion]) {
            return `\n⚡ FUSION ACTIVATED: ${BOLD}${fusion}${RESET}\n   Powers: ${fusions[fusion].join(' + ')}\n`;
        }

        return `Unknown fusion: ${args[0]}`;
    }

    showStatus() {
        const spirit = SPIRIT_PROMPTS[this.currentSpirit];
        const uptime = this.session.startTime
            ? Math.floor((Date.now() - this.session.startTime) / 1000)
            : 0;

        return `
${spirit.color}${BOLD}╔═══════════════════════════════════════╗${RESET}
${spirit.color}${BOLD}║    ${spirit.symbol} ORB.TERM STATUS                 ║${RESET}
${spirit.color}${BOLD}╠═══════════════════════════════════════╣${RESET}
${spirit.color}║${RESET} Spirit:      ${spirit.symbol} ${this.currentSpirit.toUpperCase().padEnd(20)}${spirit.color}║${RESET}
${spirit.color}║${RESET} Uptime:      ${String(uptime).padEnd(20)}s ${spirit.color}║${RESET}
${spirit.color}║${RESET} Commands:    ${String(this.session.commandCount).padEnd(21)}${spirit.color}║${RESET}
${spirit.color}║${RESET} AI:          ${this.config.aiEnabled ? 'ENABLED ' : 'DISABLED'}               ${spirit.color}║${RESET}
${spirit.color}║${RESET} Voice:       ${this.voice.listening ? 'LISTENING' : 'STANDBY '}              ${spirit.color}║${RESET}
${spirit.color}║${RESET} Patterns:    ${String(this.ai.commandPatterns.size).padEnd(21)}${spirit.color}║${RESET}
${spirit.color}${BOLD}╚═══════════════════════════════════════╝${RESET}
`;
    }

    clear() {
        console.clear();
        return '';
    }

    showHistory() {
        const recent = this.ai.commandHistory.slice(-20);
        if (recent.length === 0) {
            return 'No command history yet.';
        }

        const lines = ['\nRecent Commands:'];
        recent.forEach((entry, i) => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            const status = entry.success ? '✓' : '✗';
            lines.push(`  ${i + 1}. [${time}] ${status} ${entry.command}`);
        });

        return lines.join('\n');
    }

    showPredictions() {
        const predictions = this.ai.predict({ spirit: this.currentSpirit });

        if (predictions.length === 0) {
            return 'Not enough data for predictions yet. Keep using the terminal!';
        }

        const lines = ['\n🔮 AI Predictions:'];
        predictions.forEach((p, i) => {
            const confidence = Math.round(p.successRate * 100);
            lines.push(`  ${i + 1}. ${p.command} (${confidence}% confidence)`);
        });

        return lines.join('\n');
    }

    handleVoice(args) {
        if (!args || args.length === 0) {
            return `Voice: ${this.voice.listening ? 'ACTIVE' : 'STANDBY'}`;
        }

        switch (args[0].toLowerCase()) {
            case 'on':
                this.voice.listening = true;
                return '🎤 Voice activated. Say "Orb" followed by your command.';
            case 'off':
                this.voice.listening = false;
                return '🔇 Voice deactivated.';
            default:
                return 'Usage: voice [on|off]';
        }
    }

    handleAI(args) {
        if (!args || args.length === 0) {
            return 'AI commands: ask, learn, suggest';
        }

        switch (args[0].toLowerCase()) {
            case 'learn':
                return `AI has learned from ${this.ai.commandPatterns.size} patterns.`;
            case 'suggest':
                return this.showPredictions();
            case 'ask':
                return 'AI assistant ready. What would you like to know?';
            default:
                return 'Unknown AI command';
        }
    }

    handleAlias(args) {
        if (!args || args.length === 0) {
            const lines = ['\nAliases:'];
            for (const [alias, expansion] of this.ai.aliases) {
                lines.push(`  ${alias} -> ${expansion}`);
            }
            return lines.join('\n');
        }

        if (args.length === 1) {
            const expansion = this.ai.aliases.get(args[0]);
            return expansion ? `${args[0]} -> ${expansion}` : 'Alias not found';
        }

        this.ai.aliases.set(args[0], args.slice(1).join(' '));
        return `Alias created: ${args[0]} -> ${args.slice(1).join(' ')}`;
    }

    handleMacro(args) {
        if (!args || args.length === 0) {
            return 'Usage: macro [record|play|list] [name]';
        }

        switch (args[0].toLowerCase()) {
            case 'list':
                const macros = [...this.ai.macros.keys()];
                return macros.length ? `Macros: ${macros.join(', ')}` : 'No macros defined';
            case 'play':
                if (args[1]) {
                    const commands = this.ai.executeMacro(args[1]);
                    if (commands) {
                        commands.forEach(cmd => this.execute(cmd));
                        return `Executed macro: ${args[1]}`;
                    }
                    return 'Macro not found';
                }
                return 'Usage: macro play <name>';
            default:
                return 'Unknown macro command';
        }
    }

    handleSystem(args) {
        if (!args || args.length === 0) {
            return 'System commands: boot, shutdown, restart';
        }

        switch (args[0].toLowerCase()) {
            case 'boot':
                this.emit('system-boot');
                return '⚡ System boot initiated...';
            case 'shutdown':
                return this.shutdown();
            case 'restart':
                this.emit('system-restart');
                return '🔄 System restart initiated...';
            default:
                return 'Unknown system command';
        }
    }

    handleExec(args) {
        if (!args || args.length === 0) {
            return 'Usage: exec <shell command>';
        }

        // Return the command to be executed by the caller
        return {
            type: 'exec',
            command: args.join(' ')
        };
    }

    // ─────────────────────────────────────────────────────────────
    // EXECUTION ENGINE
    // ─────────────────────────────────────────────────────────────

    execute(input) {
        if (!input || !input.trim()) return null;

        this.session.commandCount++;

        // Expand aliases
        const expanded = this.ai.expand(input);
        const parts = expanded.trim().split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        // Check for registered command
        const handler = this.commands.get(cmd);

        if (handler) {
            try {
                const result = handler.handler(args);
                this.ai.record(input, true, { spirit: this.currentSpirit });
                return result;
            } catch (err) {
                this.ai.record(input, false, { spirit: this.currentSpirit, error: err.message });
                return `Error: ${err.message}`;
            }
        }

        // Unknown command - suggest
        const suggestions = this.ai.autocomplete(cmd);
        if (suggestions.length > 0) {
            return `Unknown command: ${cmd}\nDid you mean: ${suggestions.map(s => s.text).join(', ')}?`;
        }

        return `Unknown command: ${cmd}. Type 'help' for available commands.`;
    }

    // ─────────────────────────────────────────────────────────────
    // TERMINAL LIFECYCLE
    // ─────────────────────────────────────────────────────────────

    async boot() {
        this.running = true;
        this.session.startTime = Date.now();

        const spirit = SPIRIT_PROMPTS[this.currentSpirit];

        // Boot splash
        console.log(`
${spirit.color}${BOLD}
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║     █▀█ █▀█ █▄▄ ░ ▀█▀ █▀▀ █▀█ █▀▄▀█                      ║
    ║     █▄█ █▀▄ █▄█ ░ ░█░ ██▄ █▀▄ █░▀░█                      ║
    ║                                                           ║
    ║              ${spirit.symbol} AI-POWERED TERMINAL v${this.config.version}              ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
${RESET}
    ${DIM}Architect: ${this.config.architect}${RESET}
    ${DIM}Spirit: ${spirit.symbol} ${this.currentSpirit.toUpperCase()}${RESET}
    ${DIM}AI: ${this.config.aiEnabled ? 'ENABLED' : 'DISABLED'} | Voice: ${this.config.voiceEnabled ? 'ENABLED' : 'DISABLED'}${RESET}

    ${DIM}Type 'help' for commands or speak "Orb" to activate voice${RESET}
`);

        this.emit('boot', { spirit: this.currentSpirit });

        // Start REPL
        this.startREPL();
    }

    startREPL() {
        const spirit = SPIRIT_PROMPTS[this.currentSpirit];

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: `${spirit.color}${spirit.symbol} ${spirit.prompt}${RESET} `
        });

        this.rl.prompt();

        this.rl.on('line', (line) => {
            const result = this.execute(line);

            if (result) {
                if (typeof result === 'object' && result.type === 'exec') {
                    // Execute shell command
                    const { execSync } = require('child_process');
                    try {
                        const output = execSync(result.command, { encoding: 'utf8' });
                        console.log(output);
                    } catch (err) {
                        console.log(`Exec error: ${err.message}`);
                    }
                } else {
                    console.log(result);
                }
            }

            // Update prompt in case spirit changed
            const sp = SPIRIT_PROMPTS[this.currentSpirit];
            this.rl.setPrompt(`${sp.color}${sp.symbol} ${sp.prompt}${RESET} `);
            this.rl.prompt();
        });

        this.rl.on('close', () => {
            this.shutdown();
        });
    }

    shutdown() {
        const uptime = Math.floor((Date.now() - this.session.startTime) / 1000);
        const spirit = SPIRIT_PROMPTS[this.currentSpirit];

        console.log(`
${spirit.color}${BOLD}
    ╔═══════════════════════════════════════╗
    ║     ${spirit.symbol} ORB.TERM SHUTDOWN              ║
    ╠═══════════════════════════════════════╣
    ║  Session: ${String(uptime).padEnd(10)}s             ║
    ║  Commands: ${String(this.session.commandCount).padEnd(10)}              ║
    ║  Patterns learned: ${String(this.ai.commandPatterns.size).padEnd(10)}       ║
    ╚═══════════════════════════════════════╝
${RESET}
    ${DIM}"Until next time, Architect."${RESET}
`);

        this.running = false;
        this.emit('shutdown');

        if (this.rl) {
            this.rl.close();
        }

        process.exit(0);
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
    OrbTerminal,
    AICommandProcessor,
    VoiceTerminalInterface,
    SPIRIT_PROMPTS,
    TERMINAL_CONFIG
};

// CLI Entry
if (require.main === module) {
    const spirit = process.argv[2] || process.env.ORB_SPIRIT || 'owl';
    const terminal = new OrbTerminal({ spirit });
    terminal.boot();
}
