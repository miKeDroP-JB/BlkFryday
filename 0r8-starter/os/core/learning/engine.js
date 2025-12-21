/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   ORBOS LEARNING ENGINE - Continuous Self-Improvement                     ║
 * ║   "Every interaction makes the system smarter"                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * The Learning Engine:
 * - Captures every interaction
 * - Extracts patterns and insights
 * - Builds predictive models
 * - Continuously improves responses
 * - Adapts to user behavior
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════
// LEARNING CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const LEARNING_CONFIG = {
    // Pattern detection
    minPatternOccurrences: 3,
    patternDecayRate: 0.95,        // Patterns fade over time
    maxPatterns: 1000,

    // Prediction
    predictionConfidenceThreshold: 0.7,
    predictionHistorySize: 100,

    // Training
    trainingBatchSize: 50,
    trainingInterval: 3600000,     // 1 hour

    // Memory
    shortTermMemorySize: 100,
    longTermMemorySize: 10000,

    // Feature weights
    featureWeights: {
        recency: 0.3,
        frequency: 0.25,
        success: 0.25,
        context: 0.2
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// LEARNING ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class LearningEngine extends EventEmitter {
    constructor(config = {}) {
        super();

        this.config = { ...LEARNING_CONFIG, ...config };

        // Memory stores
        this.shortTermMemory = [];
        this.longTermMemory = [];
        this.patterns = new Map();
        this.predictions = new Map();

        // Statistics
        this.stats = {
            totalLearnings: 0,
            patternsDetected: 0,
            predictionsMade: 0,
            predictionsCorrect: 0,
            lastTrainingTime: null
        };

        // Models
        this.models = {
            commandPredictor: null,
            intentClassifier: null,
            contextPredictor: null,
            moodDetector: null
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CORE LEARNING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Learn from an interaction
     */
    learn(interaction) {
        const learning = {
            id: `learn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            ...interaction
        };

        // Add to short-term memory
        this.shortTermMemory.push(learning);
        if (this.shortTermMemory.length > this.config.shortTermMemorySize) {
            this.consolidateMemory();
        }

        // Extract features
        const features = this.extractFeatures(learning);

        // Detect patterns
        this.detectPatterns(features);

        // Update models
        this.updateModels(learning, features);

        this.stats.totalLearnings++;
        this.emit('learned', learning);

        return learning;
    }

    /**
     * Extract features from an interaction
     */
    extractFeatures(interaction) {
        const features = {
            // Temporal features
            hour: new Date(interaction.timestamp).getHours(),
            dayOfWeek: new Date(interaction.timestamp).getDay(),
            timeSinceLast: this.getTimeSinceLast(),

            // Content features
            commandType: interaction.type || 'unknown',
            commandLength: (interaction.input || '').length,
            hasEntities: this.detectEntities(interaction.input).length > 0,

            // Context features
            spirit: interaction.spirit || 'owl',
            mood: interaction.mood || 'neutral',
            focusState: interaction.focusState || 'normal',

            // Outcome features
            success: interaction.success !== false,
            responseTime: interaction.responseTime || 0,
            userSatisfaction: interaction.satisfaction || 0.5
        };

        return features;
    }

    /**
     * Detect entities in text
     */
    detectEntities(text) {
        if (!text) return [];

        const entities = [];

        // File patterns
        const files = text.match(/[\w-]+\.(js|ts|py|json|md|txt|html|css)/gi);
        if (files) entities.push(...files.map(f => ({ type: 'file', value: f })));

        // URLs
        const urls = text.match(/https?:\/\/[^\s]+/gi);
        if (urls) entities.push(...urls.map(u => ({ type: 'url', value: u })));

        // Numbers
        const numbers = text.match(/\b\d+\b/g);
        if (numbers) entities.push(...numbers.map(n => ({ type: 'number', value: n })));

        return entities;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PATTERN DETECTION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Detect and track patterns
     */
    detectPatterns(features) {
        // Command patterns
        this.trackPattern('command', features.commandType);

        // Time patterns
        this.trackPattern('hour', features.hour);
        this.trackPattern('dayOfWeek', features.dayOfWeek);

        // Spirit patterns
        this.trackPattern('spirit', features.spirit);

        // Compound patterns
        const compound = `${features.hour}-${features.commandType}`;
        this.trackPattern('hourCommand', compound);

        // Sequence patterns
        this.detectSequencePatterns();
    }

    /**
     * Track a pattern occurrence
     */
    trackPattern(category, value) {
        const key = `${category}:${value}`;

        if (!this.patterns.has(key)) {
            this.patterns.set(key, {
                category,
                value,
                count: 0,
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                confidence: 0
            });
        }

        const pattern = this.patterns.get(key);
        pattern.count++;
        pattern.lastSeen = Date.now();
        pattern.confidence = Math.min(1, pattern.count / 10);

        if (pattern.count === this.config.minPatternOccurrences) {
            this.stats.patternsDetected++;
            this.emit('pattern:detected', pattern);
        }
    }

    /**
     * Detect sequence patterns (A → B → C)
     */
    detectSequencePatterns() {
        if (this.shortTermMemory.length < 3) return;

        const recent = this.shortTermMemory.slice(-3);
        const sequence = recent.map(r => r.type || 'unknown').join('→');

        this.trackPattern('sequence', sequence);
    }

    /**
     * Get pattern strength
     */
    getPatternStrength(category, value) {
        const key = `${category}:${value}`;
        const pattern = this.patterns.get(key);
        return pattern ? pattern.confidence : 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PREDICTION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Predict next likely action
     */
    predictNext(context = {}) {
        const predictions = [];

        // Time-based predictions
        const hour = new Date().getHours();
        const hourPatterns = this.getPatternsForCategory('hourCommand')
            .filter(p => p.value.startsWith(`${hour}-`))
            .sort((a, b) => b.confidence - a.confidence);

        for (const pattern of hourPatterns.slice(0, 3)) {
            const command = pattern.value.split('-')[1];
            predictions.push({
                type: 'command',
                value: command,
                confidence: pattern.confidence * 0.8,
                source: 'time-pattern'
            });
        }

        // Sequence-based predictions
        if (this.shortTermMemory.length >= 2) {
            const recent = this.shortTermMemory.slice(-2);
            const prefix = recent.map(r => r.type || 'unknown').join('→');

            const sequencePatterns = this.getPatternsForCategory('sequence')
                .filter(p => p.value.startsWith(prefix))
                .sort((a, b) => b.confidence - a.confidence);

            for (const pattern of sequencePatterns.slice(0, 3)) {
                const next = pattern.value.split('→').pop();
                predictions.push({
                    type: 'command',
                    value: next,
                    confidence: pattern.confidence * 0.9,
                    source: 'sequence-pattern'
                });
            }
        }

        // Context-based predictions
        if (context.project) {
            const projectPatterns = this.getPatternsForCategory('project')
                .filter(p => p.value === context.project);
            // Add project-specific predictions
        }

        // Sort by confidence and dedupe
        const seen = new Set();
        const topPredictions = predictions
            .filter(p => {
                if (seen.has(p.value)) return false;
                seen.add(p.value);
                return true;
            })
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);

        this.stats.predictionsMade++;
        this.emit('prediction', topPredictions);

        return topPredictions;
    }

    /**
     * Record prediction outcome
     */
    recordPredictionOutcome(prediction, wasCorrect) {
        if (wasCorrect) {
            this.stats.predictionsCorrect++;
        }

        // Update pattern confidence based on outcome
        const key = `${prediction.source}:${prediction.value}`;
        const pattern = this.patterns.get(key);
        if (pattern) {
            const adjustment = wasCorrect ? 0.1 : -0.05;
            pattern.confidence = Math.max(0, Math.min(1, pattern.confidence + adjustment));
        }
    }

    getPatternsForCategory(category) {
        const patterns = [];
        for (const [key, pattern] of this.patterns) {
            if (pattern.category === category) {
                patterns.push(pattern);
            }
        }
        return patterns;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MODEL UPDATES
    // ─────────────────────────────────────────────────────────────────────────

    updateModels(interaction, features) {
        // Simple online learning - update running averages
        // In production, this would update neural network weights

        // Update command predictor
        this.updateCommandPredictor(interaction, features);

        // Update mood detector
        this.updateMoodDetector(interaction, features);
    }

    updateCommandPredictor(interaction, features) {
        // Track command frequencies per context
        const key = `${features.hour}-${features.spirit}`;
        if (!this.models.commandPredictor) {
            this.models.commandPredictor = new Map();
        }

        if (!this.models.commandPredictor.has(key)) {
            this.models.commandPredictor.set(key, new Map());
        }

        const contextCommands = this.models.commandPredictor.get(key);
        const cmd = features.commandType;
        contextCommands.set(cmd, (contextCommands.get(cmd) || 0) + 1);
    }

    updateMoodDetector(interaction, features) {
        // Track mood indicators
        // In production, this would use sentiment analysis
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MEMORY MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    consolidateMemory() {
        // Move important items to long-term memory
        const toConsolidate = this.shortTermMemory.splice(0,
            this.shortTermMemory.length - this.config.shortTermMemorySize / 2
        );

        // Extract key learnings
        for (const item of toConsolidate) {
            if (item.success && item.satisfaction > 0.7) {
                this.longTermMemory.push({
                    ...item,
                    consolidatedAt: Date.now()
                });
            }
        }

        // Trim long-term memory
        if (this.longTermMemory.length > this.config.longTermMemorySize) {
            this.longTermMemory = this.longTermMemory.slice(-this.config.longTermMemorySize);
        }

        // Decay old patterns
        this.decayPatterns();

        this.emit('memory:consolidated');
    }

    decayPatterns() {
        const now = Date.now();
        const decayThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

        for (const [key, pattern] of this.patterns) {
            const age = now - pattern.lastSeen;
            if (age > decayThreshold) {
                pattern.confidence *= this.config.patternDecayRate;

                if (pattern.confidence < 0.1) {
                    this.patterns.delete(key);
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    getTimeSinceLast() {
        if (this.shortTermMemory.length === 0) return 0;
        const last = this.shortTermMemory[this.shortTermMemory.length - 1];
        return Date.now() - last.timestamp;
    }

    getStats() {
        return {
            ...this.stats,
            shortTermMemorySize: this.shortTermMemory.length,
            longTermMemorySize: this.longTermMemory.length,
            patternCount: this.patterns.size,
            predictionAccuracy: this.stats.predictionsMade > 0
                ? this.stats.predictionsCorrect / this.stats.predictionsMade
                : 0
        };
    }

    export() {
        return {
            patterns: Array.from(this.patterns.entries()),
            stats: this.stats,
            shortTermMemory: this.shortTermMemory,
            longTermMemory: this.longTermMemory.slice(-100)
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

let engineInstance = null;

export function getLearningEngine(config = {}) {
    if (!engineInstance) {
        engineInstance = new LearningEngine(config);
    }
    return engineInstance;
}

export { LearningEngine, LEARNING_CONFIG };
export default LearningEngine;
