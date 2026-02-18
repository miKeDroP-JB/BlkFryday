/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   ORBOS VOICE ENGINE - Voice-First AI Interface                           ║
 * ║   "Your voice is the command line"                                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Handles:
 * - Voice input capture (Web Speech API / Whisper)
 * - Voice output synthesis (Web Speech / ElevenLabs)
 * - Intent parsing
 * - Spirit mode voice signatures
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════
// VOICE ENGINE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
    // Wake words
    wakeWords: ['orb', 'oracle', 'hey orb', 'computer', 'system'],

    // Voice settings
    voice: {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        lang: 'en-US'
    },

    // Transcription
    transcription: {
        continuous: true,
        interimResults: true,
        maxAlternatives: 3
    },

    // Spirit voice signatures
    spiritVoices: {
        owl: { pitch: 0.9, rate: 0.85, tone: 'wise' },
        fox: { pitch: 1.1, rate: 1.2, tone: 'playful' },
        dragon: { pitch: 0.7, rate: 0.8, tone: 'commanding' },
        phoenix: { pitch: 1.0, rate: 1.0, tone: 'inspiring' },
        wolf: { pitch: 0.8, rate: 1.0, tone: 'loyal' },
        raven: { pitch: 0.85, rate: 0.9, tone: 'mysterious' },
        serpent: { pitch: 0.95, rate: 0.9, tone: 'healing' },
        eagle: { pitch: 0.9, rate: 1.0, tone: 'noble' },
        lion: { pitch: 0.75, rate: 0.95, tone: 'bold' },
        spider: { pitch: 1.0, rate: 0.85, tone: 'patient' },
        bear: { pitch: 0.6, rate: 0.8, tone: 'strong' },
        hawk: { pitch: 1.05, rate: 1.1, tone: 'precise' }
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// VOICE ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class VoiceEngine extends EventEmitter {
    constructor(options = {}) {
        super();

        this.config = { ...CONFIG, ...options };
        this.isListening = false;
        this.isAwake = false;
        this.currentSpirit = 'owl';
        this.recognition = null;
        this.synthesis = null;
        this.commandQueue = [];
        this.history = [];

        // State
        this.state = {
            mode: 'standby',      // standby | listening | processing | speaking
            confidence: 0,
            lastCommand: null,
            lastResponse: null,
            sessionId: this.generateSessionId()
        };

        // Intent patterns
        this.intents = new Map();
        this.registerDefaultIntents();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ─────────────────────────────────────────────────────────────────────────

    async initialize() {
        console.log('🎤 Initializing Voice Engine...');

        // Check for browser speech APIs
        if (typeof window !== 'undefined') {
            await this.initBrowserSpeech();
        } else {
            // Node.js environment - use alternative
            await this.initNodeSpeech();
        }

        this.emit('initialized');
        return this;
    }

    async initBrowserSpeech() {
        // Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = this.config.transcription.continuous;
            this.recognition.interimResults = this.config.transcription.interimResults;
            this.recognition.maxAlternatives = this.config.transcription.maxAlternatives;
            this.recognition.lang = this.config.voice.lang;

            this.recognition.onresult = (event) => this.handleRecognitionResult(event);
            this.recognition.onerror = (event) => this.handleRecognitionError(event);
            this.recognition.onend = () => this.handleRecognitionEnd();
        }

        // Speech Synthesis
        this.synthesis = window.speechSynthesis;
    }

    async initNodeSpeech() {
        // For Node.js, we'll use WebSocket to connect to voice services
        console.log('   → Node.js mode: Voice via WebSocket/API');

        // Placeholder for Whisper/ElevenLabs integration
        this.nodeVoice = {
            transcribe: async (audio) => {
                // Would call Whisper API
                return { text: '', confidence: 0 };
            },
            synthesize: async (text, options) => {
                // Would call ElevenLabs API
                return null;
            }
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LISTENING
    // ─────────────────────────────────────────────────────────────────────────

    startListening() {
        if (this.isListening) return;

        this.isListening = true;
        this.state.mode = 'listening';

        if (this.recognition) {
            this.recognition.start();
        }

        this.emit('listening:start');
        console.log('🎤 Listening...');
    }

    stopListening() {
        if (!this.isListening) return;

        this.isListening = false;
        this.state.mode = 'standby';

        if (this.recognition) {
            this.recognition.stop();
        }

        this.emit('listening:stop');
    }

    handleRecognitionResult(event) {
        const results = event.results;
        const latest = results[results.length - 1];

        if (latest.isFinal) {
            const transcript = latest[0].transcript.trim().toLowerCase();
            const confidence = latest[0].confidence;

            this.state.confidence = confidence;

            // Check for wake word
            if (!this.isAwake) {
                if (this.isWakeWord(transcript)) {
                    this.wake();
                }
                return;
            }

            // Process command
            this.processCommand(transcript, confidence);
        } else {
            // Interim result
            const interim = latest[0].transcript;
            this.emit('transcript:interim', interim);
        }
    }

    handleRecognitionError(event) {
        console.error('🎤 Recognition error:', event.error);
        this.emit('error', { type: 'recognition', error: event.error });
    }

    handleRecognitionEnd() {
        if (this.isListening) {
            // Restart if still supposed to be listening
            this.recognition?.start();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WAKE/SLEEP
    // ─────────────────────────────────────────────────────────────────────────

    isWakeWord(text) {
        return this.config.wakeWords.some(word => text.includes(word));
    }

    wake() {
        this.isAwake = true;
        this.emit('wake');
        this.speak('I am awake. How can I help?');

        // Auto-sleep after 30 seconds of silence
        this.resetSleepTimer();
    }

    sleep() {
        this.isAwake = false;
        this.emit('sleep');
        console.log('💤 Voice engine sleeping...');
    }

    resetSleepTimer() {
        if (this.sleepTimer) clearTimeout(this.sleepTimer);
        this.sleepTimer = setTimeout(() => this.sleep(), 30000);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMMAND PROCESSING
    // ─────────────────────────────────────────────────────────────────────────

    async processCommand(text, confidence = 1) {
        this.state.mode = 'processing';
        this.state.lastCommand = text;
        this.resetSleepTimer();

        this.history.push({
            type: 'command',
            text,
            confidence,
            timestamp: Date.now()
        });

        this.emit('command', { text, confidence });

        // Parse intent
        const intent = this.parseIntent(text);

        if (intent) {
            const response = await this.executeIntent(intent, text);
            this.respond(response);
        } else {
            // Unknown command - pass to AI
            this.emit('command:unknown', { text, confidence });
            this.respond(`Processing: ${text}`);
        }
    }

    parseIntent(text) {
        for (const [pattern, handler] of this.intents) {
            const match = text.match(pattern);
            if (match) {
                return { pattern, handler, match };
            }
        }
        return null;
    }

    async executeIntent(intent, text) {
        try {
            return await intent.handler(text, intent.match);
        } catch (e) {
            console.error('Intent execution error:', e);
            return `Error: ${e.message}`;
        }
    }

    registerIntent(pattern, handler) {
        this.intents.set(pattern, handler);
    }

    registerDefaultIntents() {
        // Spirit mode switching
        this.registerIntent(/switch to (\w+) mode/i, (text, match) => {
            const spirit = match[1].toLowerCase();
            this.setSpirit(spirit);
            return `Switching to ${spirit} mode.`;
        });

        this.registerIntent(/awaken (\w+)/i, (text, match) => {
            const spirit = match[1].toLowerCase();
            this.setSpirit(spirit);
            return `${spirit} awakens.`;
        });

        // Status
        this.registerIntent(/status|how are you/i, () => {
            return `I am ${this.currentSpirit}. All systems operational.`;
        });

        // Sleep
        this.registerIntent(/sleep|go to sleep|rest/i, () => {
            setTimeout(() => this.sleep(), 1000);
            return 'Entering sleep mode.';
        });

        // Help
        this.registerIntent(/help|what can you do/i, () => {
            return 'I can switch modes, answer questions, execute commands, and more. Just speak.';
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SPEECH OUTPUT
    // ─────────────────────────────────────────────────────────────────────────

    speak(text, options = {}) {
        this.state.mode = 'speaking';
        this.state.lastResponse = text;

        const spiritVoice = this.config.spiritVoices[this.currentSpirit] || {};

        this.history.push({
            type: 'response',
            text,
            spirit: this.currentSpirit,
            timestamp: Date.now()
        });

        this.emit('speak:start', { text, spirit: this.currentSpirit });

        if (this.synthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = options.rate || spiritVoice.rate || this.config.voice.rate;
            utterance.pitch = options.pitch || spiritVoice.pitch || this.config.voice.pitch;
            utterance.volume = options.volume || this.config.voice.volume;
            utterance.lang = this.config.voice.lang;

            utterance.onend = () => {
                this.state.mode = 'listening';
                this.emit('speak:end');
            };

            this.synthesis.speak(utterance);
        } else {
            // Node.js - emit for external handling
            console.log(`🔊 [${this.currentSpirit}]: ${text}`);
            this.state.mode = 'listening';
            this.emit('speak:end');
        }

        return text;
    }

    respond(text) {
        return this.speak(text);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SPIRIT INTEGRATION
    // ─────────────────────────────────────────────────────────────────────────

    setSpirit(spirit) {
        const validSpirits = Object.keys(this.config.spiritVoices);
        if (!validSpirits.includes(spirit)) {
            console.warn(`Unknown spirit: ${spirit}`);
            return false;
        }

        this.currentSpirit = spirit;
        this.emit('spirit:change', { spirit });
        return true;
    }

    getSpirit() {
        return {
            id: this.currentSpirit,
            voice: this.config.spiritVoices[this.currentSpirit]
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    generateSessionId() {
        return `voice-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    getState() {
        return {
            ...this.state,
            isListening: this.isListening,
            isAwake: this.isAwake,
            spirit: this.currentSpirit,
            historyLength: this.history.length
        };
    }

    getHistory(limit = 50) {
        return this.history.slice(-limit);
    }

    clearHistory() {
        this.history = [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

let voiceEngineInstance = null;

export function getVoiceEngine(options = {}) {
    if (!voiceEngineInstance) {
        voiceEngineInstance = new VoiceEngine(options);
    }
    return voiceEngineInstance;
}

export { VoiceEngine, CONFIG as VOICE_CONFIG };
export default VoiceEngine;
