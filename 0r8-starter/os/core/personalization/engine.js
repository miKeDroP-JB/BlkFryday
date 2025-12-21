/**
 * PERSONALIZATION ENGINE
 * ======================
 * Adapts the entire ORBOS experience to each user
 * Learns preferences, predicts needs, customizes everything
 *
 * "Your OS, your way. Always evolving."
 */

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════
// PERSONALIZATION DIMENSIONS
// ═══════════════════════════════════════════════════════════════

const DIMENSIONS = {
    // Interface preferences
    INTERFACE: {
        theme: 'dark',           // dark, light, auto
        density: 'comfortable',   // compact, comfortable, spacious
        animations: true,
        sounds: true,
        haptics: true
    },

    // Communication style
    COMMUNICATION: {
        verbosity: 0.5,          // 0-1: terse to verbose
        formality: 0.5,          // 0-1: casual to formal
        technicality: 0.7,       // 0-1: simple to technical
        humor: 0.3,              // 0-1: serious to playful
        directness: 0.8          // 0-1: gentle to direct
    },

    // Work patterns
    WORKFLOW: {
        preferredSpirit: 'owl',
        fusionMode: null,
        shortcuts: {},
        macros: [],
        autoSuggestions: true,
        voiceEnabled: true
    },

    // Context preferences
    CONTEXT: {
        focusHours: { start: 9, end: 17 },
        breakReminders: true,
        autoSaveInterval: 60000,
        historyDepth: 100
    }
};

// ═══════════════════════════════════════════════════════════════
// PREFERENCE LEARNER
// ═══════════════════════════════════════════════════════════════

class PreferenceLearner {
    constructor() {
        this.observations = [];
        this.preferences = {};
        this.confidences = {};
        this.learningRate = 0.1;
    }

    // Observe user behavior
    observe(category, key, value, context = {}) {
        this.observations.push({
            category,
            key,
            value,
            context,
            timestamp: Date.now()
        });

        // Learn from observation
        this.learn(category, key, value, context);

        // Keep observations bounded
        if (this.observations.length > 1000) {
            this.observations = this.observations.slice(-500);
        }
    }

    // Learn preference from observation
    learn(category, key, value, context) {
        const prefKey = `${category}.${key}`;

        if (!this.preferences[prefKey]) {
            this.preferences[prefKey] = { value, count: 1 };
            this.confidences[prefKey] = 0.5;
        } else {
            const current = this.preferences[prefKey];

            // For numeric values, use weighted average
            if (typeof value === 'number' && typeof current.value === 'number') {
                current.value = current.value * (1 - this.learningRate) + value * this.learningRate;
            } else {
                // For discrete values, track frequency
                current.value = value;
            }

            current.count++;
            this.confidences[prefKey] = Math.min(0.95, this.confidences[prefKey] + 0.01);
        }
    }

    // Get learned preference
    get(category, key, defaultValue = null) {
        const prefKey = `${category}.${key}`;
        const pref = this.preferences[prefKey];

        if (!pref) return defaultValue;

        return {
            value: pref.value,
            confidence: this.confidences[prefKey],
            observations: pref.count
        };
    }

    // Get all preferences for a category
    getCategory(category) {
        const result = {};

        for (const [key, pref] of Object.entries(this.preferences)) {
            if (key.startsWith(`${category}.`)) {
                const shortKey = key.replace(`${category}.`, '');
                result[shortKey] = {
                    value: pref.value,
                    confidence: this.confidences[key]
                };
            }
        }

        return result;
    }

    // Decay old preferences
    decay() {
        const now = Date.now();
        const decayWindow = 7 * 24 * 60 * 60 * 1000; // 7 days

        for (const key of Object.keys(this.confidences)) {
            // Find most recent observation for this preference
            const recentObs = this.observations
                .filter(o => `${o.category}.${o.key}` === key)
                .sort((a, b) => b.timestamp - a.timestamp)[0];

            if (recentObs && now - recentObs.timestamp > decayWindow) {
                this.confidences[key] *= 0.95; // Slowly decay confidence
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// BEHAVIOR PREDICTOR
// ═══════════════════════════════════════════════════════════════

class BehaviorPredictor {
    constructor() {
        this.patterns = new Map();
        this.sequences = [];
        this.maxSequenceLength = 5;
    }

    // Record action for pattern detection
    recordAction(action, context = {}) {
        this.sequences.push({
            action,
            context,
            timestamp: Date.now()
        });

        // Keep bounded
        if (this.sequences.length > 500) {
            this.sequences = this.sequences.slice(-250);
        }

        // Update patterns
        this.updatePatterns();
    }

    // Update behavioral patterns
    updatePatterns() {
        // Look for action sequences
        for (let len = 2; len <= this.maxSequenceLength; len++) {
            if (this.sequences.length >= len) {
                const recent = this.sequences.slice(-len);
                const pattern = recent.map(s => s.action).join(' -> ');

                const current = this.patterns.get(pattern) || { count: 0, lastSeen: 0 };
                current.count++;
                current.lastSeen = Date.now();
                current.actions = recent.map(s => s.action);

                this.patterns.set(pattern, current);
            }
        }
    }

    // Predict next action
    predict(recentActions = []) {
        if (recentActions.length === 0) {
            return null;
        }

        const candidates = [];

        // Find patterns that start with recent actions
        for (const [pattern, data] of this.patterns) {
            const patternActions = data.actions;

            // Check if pattern starts with recent actions
            let matches = true;
            for (let i = 0; i < recentActions.length && i < patternActions.length - 1; i++) {
                if (recentActions[i] !== patternActions[i]) {
                    matches = false;
                    break;
                }
            }

            if (matches && patternActions.length > recentActions.length) {
                candidates.push({
                    action: patternActions[recentActions.length],
                    confidence: Math.min(0.9, data.count / 10),
                    pattern
                });
            }
        }

        // Return top prediction
        candidates.sort((a, b) => b.confidence - a.confidence);
        return candidates[0] || null;
    }

    // Get behavioral insights
    getInsights() {
        const frequentPatterns = [...this.patterns.entries()]
            .filter(([_, data]) => data.count >= 3)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10);

        return {
            patternCount: this.patterns.size,
            topPatterns: frequentPatterns.map(([pattern, data]) => ({
                pattern,
                frequency: data.count
            })),
            sequenceLength: this.sequences.length
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// CONTENT ADAPTER
// ═══════════════════════════════════════════════════════════════

class ContentAdapter {
    constructor(preferenceLearner) {
        this.learner = preferenceLearner;

        // Adaptation templates
        this.templates = {
            greeting: {
                formal: ['Good {timeOfDay}.', 'Greetings.', 'Hello.'],
                casual: ['Hey!', 'What\'s up!', "Yo!", 'Hi there!'],
                balanced: ['Hello!', 'Hi!', 'Hey there.']
            },
            confirmation: {
                formal: ['Acknowledged.', 'Understood.', 'Confirmed.'],
                casual: ['Got it!', 'Done!', 'On it!', '👍'],
                balanced: ['Done.', 'Got it.', 'Okay.']
            },
            error: {
                formal: ['An error has occurred:', 'I encountered an issue:'],
                casual: ['Oops!', 'Hmm, something went wrong:', 'Uh oh!'],
                balanced: ['Error:', 'Something went wrong:']
            }
        };
    }

    // Adapt content based on user preferences
    adapt(content, type = 'general', context = {}) {
        const formality = this.learner.get('communication', 'formality')?.value || 0.5;
        const verbosity = this.learner.get('communication', 'verbosity')?.value || 0.5;
        const technicality = this.learner.get('communication', 'technicality')?.value || 0.7;

        let adapted = content;

        // Adjust for formality
        if (this.templates[type]) {
            const style = formality > 0.7 ? 'formal' : formality < 0.3 ? 'casual' : 'balanced';
            const options = this.templates[type][style];
            if (options && options.length > 0) {
                const template = options[Math.floor(Math.random() * options.length)];
                adapted = template.replace('{content}', content)
                    .replace('{timeOfDay}', this.getTimeOfDay());
            }
        }

        // Adjust for verbosity
        if (verbosity < 0.3 && adapted.length > 100) {
            adapted = this.summarize(adapted);
        } else if (verbosity > 0.7 && adapted.length < 50) {
            adapted = this.elaborate(adapted);
        }

        // Adjust for technicality
        if (technicality < 0.3) {
            adapted = this.simplify(adapted);
        }

        return adapted;
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    }

    summarize(text) {
        // Simple summarization - take first sentence
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        return sentences[0] + '.';
    }

    elaborate(text) {
        // Add context
        return text + ' Let me know if you need more details.';
    }

    simplify(text) {
        // Replace technical terms with simpler ones
        const simplifications = {
            'execute': 'run',
            'terminate': 'stop',
            'initialize': 'start',
            'configuration': 'settings',
            'repository': 'project'
        };

        let simplified = text;
        for (const [tech, simple] of Object.entries(simplifications)) {
            simplified = simplified.replace(new RegExp(tech, 'gi'), simple);
        }

        return simplified;
    }
}

// ═══════════════════════════════════════════════════════════════
// PERSONALIZATION ENGINE
// ═══════════════════════════════════════════════════════════════

class PersonalizationEngine extends EventEmitter {
    constructor() {
        super();

        this.userId = null;
        this.preferences = JSON.parse(JSON.stringify(DIMENSIONS));
        this.learner = new PreferenceLearner();
        this.predictor = new BehaviorPredictor();
        this.adapter = new ContentAdapter(this.learner);

        // Runtime state
        this.sessionStart = Date.now();
        this.interactionCount = 0;
    }

    // Initialize for a user
    init(userId, savedPreferences = null) {
        this.userId = userId;
        this.sessionStart = Date.now();

        if (savedPreferences) {
            this.preferences = { ...this.preferences, ...savedPreferences };
        }

        this.emit('initialized', { userId });
    }

    // Record user interaction
    interact(interaction) {
        this.interactionCount++;

        // Learn from interaction
        if (interaction.type === 'command') {
            this.learner.observe('workflow', 'command', interaction.value);
            this.predictor.recordAction(interaction.value);
        }

        if (interaction.type === 'spirit_change') {
            this.learner.observe('workflow', 'spirit', interaction.value);
        }

        if (interaction.type === 'preference') {
            this.learner.observe(interaction.category, interaction.key, interaction.value);
        }

        if (interaction.type === 'feedback') {
            this.processFeedback(interaction);
        }

        this.emit('interaction', interaction);
    }

    // Process user feedback
    processFeedback(feedback) {
        // Adjust based on explicit feedback
        if (feedback.too_verbose) {
            const current = this.preferences.COMMUNICATION.verbosity;
            this.preferences.COMMUNICATION.verbosity = Math.max(0, current - 0.1);
        }

        if (feedback.too_technical) {
            const current = this.preferences.COMMUNICATION.technicality;
            this.preferences.COMMUNICATION.technicality = Math.max(0, current - 0.1);
        }

        if (feedback.preferred_spirit) {
            this.preferences.WORKFLOW.preferredSpirit = feedback.preferred_spirit;
        }

        this.emit('preferences-updated', this.preferences);
    }

    // Get personalized response
    personalize(content, type = 'general') {
        return this.adapter.adapt(content, type);
    }

    // Predict next action
    predictNextAction() {
        const recentActions = this.learner.observations
            .slice(-3)
            .filter(o => o.category === 'workflow' && o.key === 'command')
            .map(o => o.value);

        return this.predictor.predict(recentActions);
    }

    // Get recommendations
    getRecommendations() {
        const recommendations = [];
        const hour = new Date().getHours();
        const focusHours = this.preferences.CONTEXT.focusHours;

        // Spirit recommendation
        const spiritPref = this.learner.get('workflow', 'spirit');
        if (spiritPref && spiritPref.confidence > 0.7) {
            recommendations.push({
                type: 'spirit',
                message: `Your preferred spirit is ${spiritPref.value}. Activate it?`,
                action: `spirit ${spiritPref.value}`
            });
        }

        // Time-based recommendations
        if (hour >= focusHours.start && hour < focusHours.end) {
            recommendations.push({
                type: 'productivity',
                message: 'You\'re in your focus window. Ready for deep work?',
                priority: 'high'
            });
        }

        // Behavior prediction
        const prediction = this.predictNextAction();
        if (prediction && prediction.confidence > 0.6) {
            recommendations.push({
                type: 'prediction',
                message: `You usually do "${prediction.action}" next. Run it?`,
                action: prediction.action,
                confidence: prediction.confidence
            });
        }

        return recommendations;
    }

    // Get current profile
    getProfile() {
        return {
            userId: this.userId,
            preferences: this.preferences,
            learned: {
                communication: this.learner.getCategory('communication'),
                workflow: this.learner.getCategory('workflow')
            },
            behavior: this.predictor.getInsights(),
            stats: {
                sessionStart: this.sessionStart,
                interactionCount: this.interactionCount,
                sessionDuration: Date.now() - this.sessionStart
            }
        };
    }

    // Export preferences for saving
    export() {
        return {
            userId: this.userId,
            preferences: this.preferences,
            learned: this.learner.preferences,
            confidences: this.learner.confidences,
            patterns: [...this.predictor.patterns.entries()]
        };
    }

    // Import saved preferences
    import(data) {
        if (data.preferences) this.preferences = data.preferences;
        if (data.learned) this.learner.preferences = data.learned;
        if (data.confidences) this.learner.confidences = data.confidences;
        if (data.patterns) {
            this.predictor.patterns = new Map(data.patterns);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
    PersonalizationEngine,
    PreferenceLearner,
    BehaviorPredictor,
    ContentAdapter,
    DIMENSIONS
};
