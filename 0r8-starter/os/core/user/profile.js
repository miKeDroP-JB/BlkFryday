/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   ORBOS USER PROFILE - The Soul of Personalization                        ║
 * ║   "The system knows you better than you know yourself"                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Captures everything about the user:
 * - Preferences, patterns, habits
 * - Interaction history
 * - Biometrics & sensor data
 * - Goals, dreams, fears
 * - Communication style
 * - Optimal times, states, contexts
 */

import { EventEmitter } from 'events';
import { writeFileSync, readFileSync, existsSync } from 'fs';

// ═══════════════════════════════════════════════════════════════════════════
// USER PROFILE SCHEMA
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_PROFILE = {
    // Identity
    id: null,
    name: null,
    codename: null,
    createdAt: null,
    lastActive: null,

    // Spirit alignment
    spirit: {
        primary: 'owl',
        secondary: 'fox',
        current: 'owl',
        history: [],
        affinities: {
            owl: 0, fox: 0, dragon: 0, phoenix: 0, wolf: 0, raven: 0,
            serpent: 0, eagle: 0, lion: 0, spider: 0, bear: 0, hawk: 0
        }
    },

    // Voice preferences
    voice: {
        wakeWord: 'orb',
        preferredVoice: null,
        speed: 1.0,
        pitch: 1.0,
        language: 'en-US',
        responseStyle: 'concise'  // concise | detailed | conversational
    },

    // Communication style (learned)
    communication: {
        formality: 0.5,          // 0 = casual, 1 = formal
        verbosity: 0.3,          // 0 = brief, 1 = verbose
        technicality: 0.8,       // 0 = simple, 1 = technical
        humor: 0.4,              // 0 = serious, 1 = playful
        directness: 0.9,         // 0 = indirect, 1 = direct
        encouragement: 0.5       // 0 = neutral, 1 = encouraging
    },

    // Work patterns (learned)
    patterns: {
        peakHours: [],           // [9, 10, 11, 14, 15, 16]
        lowHours: [],            // [12, 13, 18, 19]
        averageSessionLength: 0, // minutes
        preferredTaskSize: 'medium', // small | medium | large
        breakFrequency: 45,      // minutes
        focusStyle: 'deep'       // deep | varied | burst
    },

    // Goals & Priorities
    goals: {
        current: [],             // Active goals
        completed: [],           // Completed goals
        recurring: []            // Daily/weekly goals
    },

    // Context awareness
    context: {
        currentProject: null,
        recentFiles: [],
        recentTopics: [],
        currentMood: null,       // Detected from interaction
        energyLevel: null,       // Detected from patterns
        focusState: null         // focused | distracted | tired
    },

    // Biometrics (from sensors)
    biometrics: {
        heartRateBaseline: null,
        stressIndicators: [],
        sleepQuality: null,
        activityLevel: null
    },

    // Preferences
    preferences: {
        theme: 'dark',
        soundEnabled: true,
        notificationsEnabled: true,
        autoSave: true,
        privacyLevel: 'balanced' // minimal | balanced | maximum
    },

    // Learning data
    learning: {
        totalInteractions: 0,
        totalCommands: 0,
        successfulPredictions: 0,
        modelVersion: '1.0.0',
        lastTrainingDate: null
    },

    // Custom data (user-defined)
    custom: {}
};

// ═══════════════════════════════════════════════════════════════════════════
// USER PROFILE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class UserProfile extends EventEmitter {
    constructor(userId = 'default') {
        super();
        this.userId = userId;
        this.profile = null;
        this.storagePath = null;
        this.isDirty = false;
        this.autoSaveInterval = null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ─────────────────────────────────────────────────────────────────────────

    async initialize(storagePath = './data/profiles') {
        this.storagePath = `${storagePath}/${this.userId}.json`;

        if (existsSync(this.storagePath)) {
            await this.load();
        } else {
            this.profile = this.createDefault();
            await this.save();
        }

        // Auto-save every 60 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.isDirty) this.save();
        }, 60000);

        this.emit('initialized', this.profile);
        return this;
    }

    createDefault() {
        return {
            ...DEFAULT_PROFILE,
            id: this.userId,
            createdAt: Date.now(),
            lastActive: Date.now()
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PERSISTENCE
    // ─────────────────────────────────────────────────────────────────────────

    async load() {
        try {
            const data = readFileSync(this.storagePath, 'utf-8');
            this.profile = JSON.parse(data);
            this.emit('loaded', this.profile);
        } catch (e) {
            console.error('Failed to load profile:', e.message);
            this.profile = this.createDefault();
        }
    }

    async save() {
        try {
            // Ensure directory exists
            const dir = this.storagePath.substring(0, this.storagePath.lastIndexOf('/'));
            if (!existsSync(dir)) {
                const { mkdirSync } = await import('fs');
                mkdirSync(dir, { recursive: true });
            }

            writeFileSync(this.storagePath, JSON.stringify(this.profile, null, 2));
            this.isDirty = false;
            this.emit('saved');
        } catch (e) {
            console.error('Failed to save profile:', e.message);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GETTERS
    // ─────────────────────────────────────────────────────────────────────────

    get(path) {
        const keys = path.split('.');
        let value = this.profile;
        for (const key of keys) {
            if (value === undefined) return undefined;
            value = value[key];
        }
        return value;
    }

    getSpirit() {
        return this.profile.spirit;
    }

    getVoice() {
        return this.profile.voice;
    }

    getCommunication() {
        return this.profile.communication;
    }

    getPatterns() {
        return this.profile.patterns;
    }

    getContext() {
        return this.profile.context;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SETTERS
    // ─────────────────────────────────────────────────────────────────────────

    set(path, value) {
        const keys = path.split('.');
        let obj = this.profile;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }

        obj[keys[keys.length - 1]] = value;
        this.isDirty = true;
        this.emit('updated', { path, value });
    }

    setSpirit(spirit, isSecondary = false) {
        if (isSecondary) {
            this.profile.spirit.secondary = spirit;
        } else {
            this.profile.spirit.primary = spirit;
            this.profile.spirit.current = spirit;
        }

        // Update affinity
        this.profile.spirit.affinities[spirit] =
            (this.profile.spirit.affinities[spirit] || 0) + 1;

        this.profile.spirit.history.push({
            spirit,
            timestamp: Date.now()
        });

        this.isDirty = true;
        this.emit('spirit:changed', spirit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LEARNING UPDATES
    // ─────────────────────────────────────────────────────────────────────────

    recordInteraction(data) {
        this.profile.learning.totalInteractions++;
        this.profile.lastActive = Date.now();

        // Update context
        if (data.topic) {
            this.profile.context.recentTopics.unshift(data.topic);
            this.profile.context.recentTopics =
                this.profile.context.recentTopics.slice(0, 20);
        }

        if (data.file) {
            this.profile.context.recentFiles.unshift(data.file);
            this.profile.context.recentFiles =
                this.profile.context.recentFiles.slice(0, 20);
        }

        this.isDirty = true;
        this.emit('interaction', data);
    }

    recordCommand(command, success = true) {
        this.profile.learning.totalCommands++;

        if (success) {
            this.profile.learning.successfulPredictions++;
        }

        this.isDirty = true;
    }

    updateCommunicationStyle(metrics) {
        // Blend new metrics with existing (weighted average)
        const blend = 0.1; // 10% new, 90% old

        for (const [key, value] of Object.entries(metrics)) {
            if (this.profile.communication[key] !== undefined) {
                this.profile.communication[key] =
                    this.profile.communication[key] * (1 - blend) + value * blend;
            }
        }

        this.isDirty = true;
    }

    updatePatterns(patterns) {
        Object.assign(this.profile.patterns, patterns);
        this.isDirty = true;
    }

    updateBiometrics(data) {
        Object.assign(this.profile.biometrics, data);
        this.isDirty = true;
        this.emit('biometrics', data);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONTEXT AWARENESS
    // ─────────────────────────────────────────────────────────────────────────

    setCurrentProject(project) {
        this.profile.context.currentProject = project;
        this.isDirty = true;
    }

    setMood(mood) {
        this.profile.context.currentMood = mood;
        this.isDirty = true;
    }

    setEnergyLevel(level) {
        this.profile.context.energyLevel = level;
        this.isDirty = true;
    }

    setFocusState(state) {
        this.profile.context.focusState = state;
        this.isDirty = true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GOALS
    // ─────────────────────────────────────────────────────────────────────────

    addGoal(goal) {
        this.profile.goals.current.push({
            ...goal,
            id: `goal-${Date.now()}`,
            createdAt: Date.now(),
            progress: 0
        });
        this.isDirty = true;
    }

    completeGoal(goalId) {
        const idx = this.profile.goals.current.findIndex(g => g.id === goalId);
        if (idx > -1) {
            const goal = this.profile.goals.current.splice(idx, 1)[0];
            goal.completedAt = Date.now();
            this.profile.goals.completed.push(goal);
            this.isDirty = true;
            this.emit('goal:completed', goal);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXPORT
    // ─────────────────────────────────────────────────────────────────────────

    export() {
        return { ...this.profile };
    }

    toJSON() {
        return this.export();
    }

    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        if (this.isDirty) {
            this.save();
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

let profileInstance = null;

export async function getUserProfile(userId = 'default') {
    if (!profileInstance || profileInstance.userId !== userId) {
        profileInstance = new UserProfile(userId);
        await profileInstance.initialize();
    }
    return profileInstance;
}

export { UserProfile, DEFAULT_PROFILE };
export default UserProfile;
