/**
 * ORBOS CORE - INDEX
 * ==================
 * Central hub for all ORBOS core systems
 *
 * Systems:
 * - User Profile: Stores user preferences and patterns
 * - Learning Engine: Pattern detection and prediction
 * - Sensor Hub: Data integration from all sources
 * - Personalization: Adapts experience to each user
 * - Evolution: Self-improvement loop
 */

const { UserProfile, DEFAULT_PROFILE } = require('./user/profile');
const { LearningEngine, PatternMatcher } = require('./learning/engine');
const { SensorHub, SENSOR_TYPES } = require('./sensors/hub');
const { PersonalizationEngine, DIMENSIONS } = require('./personalization/engine');
const { SelfImprovementLoop, METRICS } = require('./evolution/loop');

// ═══════════════════════════════════════════════════════════════
// ORBOS CORE CLASS
// ═══════════════════════════════════════════════════════════════

class ORBOSCore {
    constructor(config = {}) {
        this.userId = config.userId || 'architect';
        this.spirit = config.spirit || 'owl';

        // Initialize all systems
        this.userProfile = new UserProfile(this.userId);
        this.learning = new LearningEngine();
        this.sensors = new SensorHub();
        this.personalization = new PersonalizationEngine();
        this.evolution = new SelfImprovementLoop();

        // Cross-system integration
        this.setupIntegration();
    }

    setupIntegration() {
        // Learning feeds personalization
        this.learning.on('pattern-detected', (pattern) => {
            this.personalization.interact({
                type: 'pattern',
                value: pattern
            });
        });

        // Sensors feed learning
        this.sensors.on('reading', ({ sensorId, reading }) => {
            this.learning.learn({
                type: 'sensor',
                source: sensorId,
                data: reading
            });
        });

        // Personalization feeds evolution
        this.personalization.on('preferences-updated', (prefs) => {
            this.evolution.recordOutcome('adaptation', true, { preferences: prefs });
        });
    }

    // Boot all systems
    async boot() {
        console.log('🚀 ORBOS Core booting...');

        // Start sensors
        this.sensors.start();

        // Initialize personalization
        this.personalization.init(this.userId);

        // Start evolution loop
        this.evolution.start();

        console.log('✅ ORBOS Core online');

        return {
            userId: this.userId,
            spirit: this.spirit,
            systems: ['userProfile', 'learning', 'sensors', 'personalization', 'evolution']
        };
    }

    // Shutdown all systems
    shutdown() {
        this.sensors.stop();
        this.evolution.stop();
        console.log('🛑 ORBOS Core shutdown');
    }

    // Get system status
    status() {
        return {
            userId: this.userId,
            spirit: this.spirit,
            userProfile: this.userProfile.getProfile(),
            learning: {
                patterns: this.learning.patterns?.size || 0,
                confidence: this.learning.confidence || 0
            },
            sensors: this.sensors.getSnapshot(),
            personalization: this.personalization.getProfile(),
            evolution: this.evolution.getReport()
        };
    }

    // Process user interaction
    interact(input, context = {}) {
        // Record in profile
        this.userProfile.recordInteraction({
            type: 'command',
            value: input,
            spirit: this.spirit,
            ...context
        });

        // Learn from it
        this.learning.learn({
            type: 'interaction',
            input,
            context
        });

        // Update personalization
        this.personalization.interact({
            type: 'command',
            value: input
        });

        // Get personalized response
        return {
            predictions: this.personalization.predictNextAction(),
            recommendations: this.personalization.getRecommendations(),
            insights: this.sensors.getInsights()
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
    ORBOSCore,
    UserProfile,
    LearningEngine,
    SensorHub,
    PersonalizationEngine,
    SelfImprovementLoop,
    DEFAULT_PROFILE,
    SENSOR_TYPES,
    DIMENSIONS,
    METRICS
};
