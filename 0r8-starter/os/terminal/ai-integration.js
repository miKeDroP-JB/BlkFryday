/**
 * ORB TERMINAL - AI INTEGRATION LAYER
 * ====================================
 * Deep integration with ORBOS learning and personalization systems
 * Makes the terminal smarter with every interaction
 */

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════
// NATURAL LANGUAGE COMMAND PARSER
// ═══════════════════════════════════════════════════════════════

class NLCommandParser {
    constructor() {
        // Intent patterns
        this.intents = [
            { pattern: /^(show|display|get|list)\s+(.+)/i, action: 'show' },
            { pattern: /^(run|execute|start|launch)\s+(.+)/i, action: 'run' },
            { pattern: /^(stop|kill|end|terminate)\s+(.+)/i, action: 'stop' },
            { pattern: /^(switch|change|set)\s+(to\s+)?(.+)/i, action: 'switch' },
            { pattern: /^(help|how|what)\s+(.+)/i, action: 'help' },
            { pattern: /^(create|make|build|new)\s+(.+)/i, action: 'create' },
            { pattern: /^(delete|remove|destroy)\s+(.+)/i, action: 'delete' },
            { pattern: /^(find|search|look\s+for)\s+(.+)/i, action: 'search' },
            { pattern: /^(open|edit|modify)\s+(.+)/i, action: 'open' },
            { pattern: /^(save|store|keep)\s+(.+)/i, action: 'save' }
        ];

        // Entity extractors
        this.entities = {
            spirit: /\b(owl|fox|dragon|phoenix|wolf|raven|serpent|eagle|lion|spider|bear|hawk)\b/i,
            file: /\b[\w\-\.\/]+\.(js|ts|json|md|txt|py|sh)\b/i,
            number: /\b\d+\b/,
            path: /\b(\/[\w\-\.\/]+|\w+\/[\w\-\.\/]+)\b/
        };

        // Context-aware shortcuts
        this.contextShortcuts = {
            'status': ['status', 'how am I doing', 'what\'s happening', 'system state'],
            'spirit owl': ['owl mode', 'be owl', 'switch to owl', 'owl spirit'],
            'spirit fox': ['fox mode', 'be fox', 'switch to fox', 'fox spirit'],
            'help': ['help me', 'what can you do', 'commands', 'options']
        };
    }

    // Parse natural language input
    parse(input) {
        const result = {
            raw: input,
            intent: null,
            action: null,
            entities: {},
            command: null,
            confidence: 0
        };

        // Check for exact shortcuts first
        for (const [command, phrases] of Object.entries(this.contextShortcuts)) {
            for (const phrase of phrases) {
                if (input.toLowerCase().includes(phrase.toLowerCase())) {
                    result.command = command;
                    result.confidence = 0.95;
                    return result;
                }
            }
        }

        // Try intent patterns
        for (const intent of this.intents) {
            const match = input.match(intent.pattern);
            if (match) {
                result.intent = intent.action;
                result.action = match[1];
                result.target = match[match.length - 1];
                result.confidence = 0.8;
                break;
            }
        }

        // Extract entities
        for (const [type, pattern] of Object.entries(this.entities)) {
            const match = input.match(pattern);
            if (match) {
                result.entities[type] = match[0];
            }
        }

        // Build command from parsed data
        if (result.intent && result.target) {
            result.command = this.buildCommand(result);
        }

        return result;
    }

    // Build executable command from parsed NL
    buildCommand(parsed) {
        switch (parsed.intent) {
            case 'show':
                if (parsed.entities.spirit) return `spirit`;
                if (parsed.target.includes('status')) return 'status';
                if (parsed.target.includes('history')) return 'history';
                if (parsed.target.includes('prediction')) return 'predict';
                return `show ${parsed.target}`;

            case 'switch':
                if (parsed.entities.spirit) return `spirit ${parsed.entities.spirit}`;
                return parsed.raw;

            case 'run':
                if (parsed.entities.file) return `exec node ${parsed.entities.file}`;
                return `exec ${parsed.target}`;

            case 'help':
                return 'help';

            case 'search':
                return `exec grep -r "${parsed.target}" .`;

            default:
                return null;
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// ADAPTIVE RESPONSE GENERATOR
// ═══════════════════════════════════════════════════════════════

class AdaptiveResponseGenerator {
    constructor() {
        this.userProfile = {
            verbosity: 0.5,        // 0 = terse, 1 = verbose
            technicality: 0.7,    // 0 = simple, 1 = technical
            formality: 0.3,       // 0 = casual, 1 = formal
            emoji: 0.5            // 0 = none, 1 = lots
        };

        this.spiritPersonalities = {
            owl: { verbosity: 0.7, technicality: 0.8, formality: 0.6, emoji: 0.2 },
            fox: { verbosity: 0.5, technicality: 0.6, formality: 0.2, emoji: 0.7 },
            dragon: { verbosity: 0.3, technicality: 0.9, formality: 0.5, emoji: 0.3 },
            phoenix: { verbosity: 0.6, technicality: 0.7, formality: 0.4, emoji: 0.8 },
            wolf: { verbosity: 0.4, technicality: 0.5, formality: 0.7, emoji: 0.2 },
            raven: { verbosity: 0.8, technicality: 0.9, formality: 0.8, emoji: 0.1 },
            serpent: { verbosity: 0.2, technicality: 0.8, formality: 0.4, emoji: 0.3 },
            eagle: { verbosity: 0.5, technicality: 0.6, formality: 0.8, emoji: 0.2 },
            lion: { verbosity: 0.6, technicality: 0.5, formality: 0.7, emoji: 0.4 },
            spider: { verbosity: 0.7, technicality: 0.9, formality: 0.3, emoji: 0.4 },
            bear: { verbosity: 0.3, technicality: 0.4, formality: 0.5, emoji: 0.5 },
            hawk: { verbosity: 0.4, technicality: 0.7, formality: 0.6, emoji: 0.2 }
        };
    }

    // Adapt response based on user profile and spirit
    adapt(response, spirit = 'owl') {
        const spiritStyle = this.spiritPersonalities[spirit] || this.spiritPersonalities.owl;

        // Blend user preference with spirit personality
        const style = {
            verbosity: (this.userProfile.verbosity + spiritStyle.verbosity) / 2,
            technicality: (this.userProfile.technicality + spiritStyle.technicality) / 2,
            formality: (this.userProfile.formality + spiritStyle.formality) / 2,
            emoji: (this.userProfile.emoji + spiritStyle.emoji) / 2
        };

        let adapted = response;

        // Adjust verbosity
        if (style.verbosity < 0.3 && adapted.length > 100) {
            // Shorten response
            const sentences = adapted.split(/[.!?]+/).filter(s => s.trim());
            adapted = sentences.slice(0, Math.ceil(sentences.length / 2)).join('. ') + '.';
        }

        // Add spirit flair
        if (style.emoji > 0.5) {
            adapted = this.addSpiritEmoji(adapted, spirit);
        }

        return adapted;
    }

    addSpiritEmoji(text, spirit) {
        const spiritEmoji = {
            owl: '🦉', fox: '🦊', dragon: '🐉', phoenix: '🔥',
            wolf: '🐺', raven: '🐦‍⬛', serpent: '🐍', eagle: '🦅',
            lion: '🦁', spider: '🕷️', bear: '🐻', hawk: '🦅'
        };

        return `${spiritEmoji[spirit] || '⚡'} ${text}`;
    }

    // Update user profile based on feedback
    updateProfile(feedback) {
        for (const [key, value] of Object.entries(feedback)) {
            if (this.userProfile.hasOwnProperty(key)) {
                // Smooth update
                this.userProfile[key] = this.userProfile[key] * 0.8 + value * 0.2;
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT MANAGER
// ═══════════════════════════════════════════════════════════════

class ContextManager {
    constructor() {
        this.shortTermMemory = [];  // Last 10 commands
        this.workingContext = {};    // Current task context
        this.sessionGoals = [];      // What user is trying to achieve
        this.recentFiles = [];       // Recently accessed files
        this.recentErrors = [];      // Recent errors for debugging help
    }

    // Add to context
    push(item) {
        this.shortTermMemory.push({
            ...item,
            timestamp: Date.now()
        });

        // Keep only last 10
        if (this.shortTermMemory.length > 10) {
            this.shortTermMemory.shift();
        }

        // Track patterns
        this.analyzePattern(item);
    }

    // Analyze patterns in context
    analyzePattern(item) {
        // Detect file patterns
        if (item.type === 'file') {
            this.recentFiles.push(item.path);
            if (this.recentFiles.length > 20) this.recentFiles.shift();
        }

        // Detect error patterns
        if (item.type === 'error') {
            this.recentErrors.push(item);
            if (this.recentErrors.length > 5) this.recentErrors.shift();
        }

        // Infer goals
        this.inferGoals(item);
    }

    // Infer what user is trying to do
    inferGoals(item) {
        const patterns = {
            debugging: ['error', 'bug', 'fix', 'debug', 'trace'],
            building: ['build', 'compile', 'create', 'make', 'new'],
            testing: ['test', 'spec', 'check', 'verify', 'validate'],
            deploying: ['deploy', 'push', 'release', 'ship', 'publish'],
            exploring: ['find', 'search', 'look', 'show', 'list']
        };

        const command = item.command || '';

        for (const [goal, keywords] of Object.entries(patterns)) {
            if (keywords.some(k => command.includes(k))) {
                if (!this.sessionGoals.includes(goal)) {
                    this.sessionGoals.push(goal);
                }
            }
        }
    }

    // Get relevant context for AI
    getContext() {
        return {
            recentCommands: this.shortTermMemory.slice(-5),
            currentGoals: this.sessionGoals,
            recentFiles: this.recentFiles.slice(-5),
            hasErrors: this.recentErrors.length > 0,
            workingContext: this.workingContext
        };
    }

    // Suggest next action
    suggestNext() {
        const context = this.getContext();

        if (context.hasErrors) {
            return 'It looks like you encountered errors. Would you like help debugging?';
        }

        if (context.currentGoals.includes('testing')) {
            return 'Running tests... Need to run specific test suites?';
        }

        if (context.currentGoals.includes('deploying')) {
            return 'Ready to deploy? I can help with the deployment process.';
        }

        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// INTELLIGENT AUTOCOMPLETE
// ═══════════════════════════════════════════════════════════════

class IntelligentAutocomplete {
    constructor(contextManager) {
        this.context = contextManager;
        this.cache = new Map();
    }

    // Get completions for partial input
    complete(partial, cursorPosition) {
        const results = [];

        // Command completions
        const commands = [
            'help', 'status', 'spirit', 'fusion', 'voice',
            'ai', 'predict', 'history', 'alias', 'macro',
            'system', 'exec', 'clear', 'exit'
        ];

        for (const cmd of commands) {
            if (cmd.startsWith(partial.toLowerCase())) {
                results.push({
                    text: cmd,
                    type: 'command',
                    priority: 10
                });
            }
        }

        // Spirit completions
        const spirits = ['owl', 'fox', 'dragon', 'phoenix', 'wolf', 'raven', 'serpent', 'eagle', 'lion', 'spider', 'bear', 'hawk'];
        if (partial.startsWith('spirit ')) {
            const spiritPart = partial.slice(7);
            for (const spirit of spirits) {
                if (spirit.startsWith(spiritPart)) {
                    results.push({
                        text: `spirit ${spirit}`,
                        type: 'spirit',
                        priority: 8
                    });
                }
            }
        }

        // File completions from context
        for (const file of this.context.recentFiles) {
            if (file.includes(partial)) {
                results.push({
                    text: file,
                    type: 'file',
                    priority: 5
                });
            }
        }

        // Sort by priority
        return results.sort((a, b) => b.priority - a.priority).slice(0, 10);
    }
}

// ═══════════════════════════════════════════════════════════════
// TERMINAL AI ASSISTANT
// ═══════════════════════════════════════════════════════════════

class TerminalAIAssistant extends EventEmitter {
    constructor() {
        super();

        this.nlParser = new NLCommandParser();
        this.responseGen = new AdaptiveResponseGenerator();
        this.contextManager = new ContextManager();
        this.autocomplete = new IntelligentAutocomplete(this.contextManager);

        this.conversationMode = false;
        this.conversationHistory = [];
    }

    // Process input with AI assistance
    process(input, options = {}) {
        const spirit = options.spirit || 'owl';

        // Record in context
        this.contextManager.push({
            command: input,
            spirit,
            type: 'command'
        });

        // Try NL parsing
        const parsed = this.nlParser.parse(input);

        if (parsed.command && parsed.confidence > 0.7) {
            return {
                type: 'command',
                original: input,
                command: parsed.command,
                confidence: parsed.confidence,
                message: `Understood: "${input}" → ${parsed.command}`
            };
        }

        // Fall back to direct command
        return {
            type: 'direct',
            command: input,
            confidence: 1.0
        };
    }

    // Get completion suggestions
    getSuggestions(partial) {
        return this.autocomplete.complete(partial);
    }

    // Adapt response to user
    adaptResponse(response, spirit) {
        return this.responseGen.adapt(response, spirit);
    }

    // Get proactive suggestion
    getProactiveSuggestion() {
        return this.contextManager.suggestNext();
    }

    // Enter conversation mode
    startConversation() {
        this.conversationMode = true;
        this.conversationHistory = [];
        return 'AI conversation mode activated. Type "exit" to return to command mode.';
    }

    // Exit conversation mode
    endConversation() {
        this.conversationMode = false;
        return 'Returning to command mode.';
    }

    // Process conversation turn
    chat(message, spirit = 'owl') {
        if (!this.conversationMode) {
            return this.process(message, { spirit });
        }

        if (message.toLowerCase() === 'exit') {
            return { type: 'exit', message: this.endConversation() };
        }

        // Add to history
        this.conversationHistory.push({
            role: 'user',
            content: message
        });

        // Generate contextual response
        const response = this.generateResponse(message, spirit);

        this.conversationHistory.push({
            role: 'assistant',
            content: response
        });

        return {
            type: 'chat',
            message: this.responseGen.adapt(response, spirit)
        };
    }

    // Generate conversational response
    generateResponse(message, spirit) {
        const lower = message.toLowerCase();

        // Simple response patterns
        if (lower.includes('hello') || lower.includes('hi')) {
            return `Greetings, Architect. How may I assist you today?`;
        }

        if (lower.includes('how are you')) {
            return `Systems optimal. ${spirit.charAt(0).toUpperCase() + spirit.slice(1)} spirit fully awakened.`;
        }

        if (lower.includes('what can you do')) {
            return 'I can help with system commands, spirit modes, code execution, file navigation, and more. Just ask!';
        }

        if (lower.includes('help') || lower.includes('stuck')) {
            const suggestion = this.contextManager.suggestNext();
            return suggestion || 'What would you like help with? I can assist with commands, debugging, or navigation.';
        }

        return 'I understand. Would you like me to execute a specific command or provide more information?';
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
    NLCommandParser,
    AdaptiveResponseGenerator,
    ContextManager,
    IntelligentAutocomplete,
    TerminalAIAssistant
};
