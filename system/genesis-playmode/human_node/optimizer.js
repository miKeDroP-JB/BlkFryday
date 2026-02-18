/**
 * Optimizer.js
 * Suggests breaks, play, or focus windows based on human metrics
 */

const config = require('./config.json');

class Optimizer {
    constructor(tracker, options = {}) {
        this.tracker = tracker;

        // Optimization state
        this.state = {
            suggestionCount: 0,
            lastSuggestion: null,
            acceptedSuggestions: 0,
            declinedSuggestions: 0,
            currentMode: 'focus' // focus, play, rest
        };

        // Suggestion history
        this.history = [];
        this.maxHistory = 50;

        // Pending suggestions
        this.pending = null;

        // Time tracking
        this.lastBreak = Date.now();
        this.sessionStart = Date.now();

        // Patterns learned from user
        this.patterns = {
            peakFocusTimes: [],
            preferredBreakDuration: 10,
            flowTriggers: [],
            energyRecoveryRate: 5 // energy/minute during break
        };

        console.log('[Optimizer] 🎯 Optimization engine initialized');
    }

    /**
     * Analyze current state and generate suggestion
     */
    analyze() {
        const snapshot = this.tracker.getSnapshot();
        const trends = this.tracker.getTrends();
        const metrics = snapshot.metrics;
        const state = snapshot.state;

        let suggestion = null;

        // Priority 1: Critical energy/rest
        if (metrics.energy < config.thresholds.energy.low ||
            metrics.rest < config.thresholds.rest.exhausted) {
            suggestion = this._suggestBreak('critical', metrics);
        }

        // Priority 2: Long session without break
        else if (this._minutesSinceBreak() > 60) {
            suggestion = this._suggestBreak('scheduled', metrics);
        }

        // Priority 3: Declining focus trend
        else if (trends && trends.focus.trend < -10) {
            suggestion = this._suggestModeSwitch('play', 'Focus declining - try something different');
        }

        // Priority 4: Optimize flow state
        else if (state.inFlow && metrics.energy > 50) {
            suggestion = this._suggestFlowOptimization(metrics);
        }

        // Priority 5: Energy management
        else if (metrics.energy < 50 && metrics.rest > 60) {
            suggestion = this._suggestMicroBreak();
        }

        // Priority 6: Mood boost
        else if (state.moodLevel === 'negative') {
            suggestion = this._suggestMoodBoost(metrics);
        }

        if (suggestion) {
            this.pending = suggestion;
            this.state.suggestionCount++;
            this.state.lastSuggestion = Date.now();
            this._recordSuggestion(suggestion);
        }

        return suggestion;
    }

    /**
     * Suggest a break
     */
    _suggestBreak(reason, metrics) {
        const duration = this._calculateBreakDuration(metrics);

        return {
            type: 'break',
            reason,
            duration,
            activities: this._suggestBreakActivities(metrics),
            urgency: reason === 'critical' ? 'high' : 'medium',
            message: reason === 'critical'
                ? `Energy critical (${Math.round(metrics.energy)}%) - take a ${duration} minute break`
                : `You've been working for ${this._minutesSinceBreak()} minutes - time for a break?`
        };
    }

    /**
     * Calculate optimal break duration
     */
    _calculateBreakDuration(metrics) {
        const base = this.patterns.preferredBreakDuration;
        const energyFactor = (100 - metrics.energy) / 100;
        const restFactor = (100 - metrics.rest) / 100;

        return Math.round(base * (1 + energyFactor * 0.5 + restFactor * 0.5));
    }

    /**
     * Suggest break activities
     */
    _suggestBreakActivities(metrics) {
        const activities = [];

        if (metrics.rest < 40) {
            activities.push({ activity: 'Rest eyes', duration: 2 });
            activities.push({ activity: 'Lie down', duration: 5 });
        }

        if (metrics.energy < 40) {
            activities.push({ activity: 'Healthy snack', duration: 5 });
            activities.push({ activity: 'Short walk', duration: 10 });
        }

        activities.push({ activity: 'Stretch', duration: 3 });
        activities.push({ activity: 'Hydrate', duration: 1 });

        return activities;
    }

    /**
     * Suggest mode switch
     */
    _suggestModeSwitch(mode, reason) {
        const activities = {
            play: ['Creative exploration', 'Experiment with ideas', 'Try something new'],
            focus: ['Deep work session', 'Clear priorities', 'Single task'],
            rest: ['Meditation', 'Nature break', 'Music']
        };

        return {
            type: 'mode_switch',
            targetMode: mode,
            reason,
            activities: activities[mode] || [],
            urgency: 'low',
            message: `Consider switching to ${mode} mode: ${reason}`
        };
    }

    /**
     * Suggest micro break
     */
    _suggestMicroBreak() {
        return {
            type: 'micro_break',
            duration: 2,
            activities: [
                { activity: 'Deep breaths', duration: 1 },
                { activity: 'Quick stretch', duration: 1 }
            ],
            urgency: 'low',
            message: 'Quick 2-minute refresh?'
        };
    }

    /**
     * Optimize for flow state
     */
    _suggestFlowOptimization(metrics) {
        return {
            type: 'flow_optimization',
            actions: [
                'Minimize notifications',
                'Clear workspace',
                'Queue is optimized for depth'
            ],
            urgency: 'info',
            message: 'Flow state detected - environment optimized for deep work'
        };
    }

    /**
     * Suggest mood boost
     */
    _suggestMoodBoost(metrics) {
        const boosts = [
            { activity: 'Play favorite music', impact: 'high' },
            { activity: 'Quick win task', impact: 'medium' },
            { activity: 'Social break', impact: 'high' },
            { activity: 'Change environment', impact: 'medium' }
        ];

        return {
            type: 'mood_boost',
            suggestions: boosts,
            urgency: 'medium',
            message: 'Mood seems low - try one of these boosters?'
        };
    }

    /**
     * Get optimal focus window
     */
    suggestFocusWindow() {
        const snapshot = this.tracker.getSnapshot();
        const metrics = snapshot.metrics;

        // Calculate optimal duration based on current state
        let duration = 25; // Default pomodoro

        if (snapshot.state.inFlow) {
            duration = 50; // Extended for flow
        } else if (metrics.energy < 50) {
            duration = 15; // Shorter when tired
        } else if (metrics.focus > 70) {
            duration = 45; // Longer when focused
        }

        return {
            type: 'focus_window',
            duration,
            startNow: metrics.focus > 40,
            preparation: metrics.focus < 40 ? [
                'Clear distractions',
                'Set intention',
                'Quick stretch'
            ] : null,
            message: `Suggested focus window: ${duration} minutes`
        };
    }

    /**
     * Accept pending suggestion
     */
    acceptSuggestion() {
        if (!this.pending) return null;

        const suggestion = this.pending;
        this.pending = null;
        this.state.acceptedSuggestions++;

        // Apply suggestion effects
        if (suggestion.type === 'break') {
            this.lastBreak = Date.now();
            this.state.currentMode = 'rest';
        } else if (suggestion.type === 'mode_switch') {
            this.state.currentMode = suggestion.targetMode;
        }

        // Learn from acceptance
        this._learnFromFeedback(suggestion, true);

        return suggestion;
    }

    /**
     * Decline pending suggestion
     */
    declineSuggestion() {
        if (!this.pending) return null;

        const suggestion = this.pending;
        this.pending = null;
        this.state.declinedSuggestions++;

        // Learn from decline
        this._learnFromFeedback(suggestion, false);

        return suggestion;
    }

    /**
     * Record completed break
     */
    recordBreak(duration) {
        this.lastBreak = Date.now();

        // Update pattern learning
        this.patterns.preferredBreakDuration =
            this.patterns.preferredBreakDuration * 0.8 + duration * 0.2;
    }

    /**
     * Minutes since last break
     */
    _minutesSinceBreak() {
        return (Date.now() - this.lastBreak) / 1000 / 60;
    }

    /**
     * Record suggestion
     */
    _recordSuggestion(suggestion) {
        this.history.push({
            ...suggestion,
            timestamp: Date.now()
        });

        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    /**
     * Learn from user feedback
     */
    _learnFromFeedback(suggestion, accepted) {
        // Simple learning - adjust patterns based on feedback
        if (accepted && suggestion.type === 'break') {
            // User accepted break - they might need more
        } else if (!accepted && suggestion.type === 'break') {
            // User declined break - maybe suggest later
        }
    }

    /**
     * Get schedule for next period
     */
    getSchedule(hours = 2) {
        const snapshot = this.tracker.getSnapshot();
        const schedule = [];
        let time = Date.now();
        const endTime = time + hours * 60 * 60 * 1000;

        while (time < endTime) {
            // Add focus block
            const focusDuration = this.suggestFocusWindow().duration;
            schedule.push({
                type: 'focus',
                start: time,
                duration: focusDuration
            });
            time += focusDuration * 60 * 1000;

            // Add break
            const breakDuration = 5 + Math.floor(Math.random() * 10);
            schedule.push({
                type: 'break',
                start: time,
                duration: breakDuration
            });
            time += breakDuration * 60 * 1000;
        }

        return schedule;
    }

    /**
     * Get optimizer state
     */
    getState() {
        return {
            ...this.state,
            pending: this.pending,
            minutesSinceBreak: this._minutesSinceBreak(),
            patterns: this.patterns
        };
    }
}

module.exports = Optimizer;
