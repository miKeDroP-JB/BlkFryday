/**
 * MetricsTracker.js
 * Tracks human player metrics: energy, focus, mood, rest, reflection
 */

const fs = require('fs');
const path = require('path');
const config = require('./config.json');

class MetricsTracker {
    constructor(options = {}) {
        this.nodeId = options.nodeId || `human_${Date.now()}`;
        this.updateInterval = options.updateInterval || config.tuning.updateInterval;
        this.smoothingFactor = options.smoothingFactor || config.tuning.smoothingFactor;

        // Current metrics
        this.metrics = {
            energy: 75,
            focus: 50,
            mood: 0.5,
            rest: 70,
            reflection: 0.5,
            presence: 1.0,
            sessionDuration: 0,
            lastActivity: Date.now()
        };

        // History for trends
        this.history = [];
        this.maxHistory = config.tuning.historyLength;

        // Derived states
        this.state = {
            energyLevel: 'medium',
            focusLevel: 'normal',
            moodLevel: 'neutral',
            restLevel: 'rested',
            inFlow: false,
            needsBreak: false
        };

        // Session tracking
        this.session = {
            startTime: Date.now(),
            peakFocus: 0,
            peakEnergy: 75,
            flowMinutes: 0,
            breaks: 0
        };

        // Event handlers
        this.handlers = new Map();

        console.log(`[MetricsTracker] 👤 Human node initialized: ${this.nodeId}`);
    }

    /**
     * Update metrics from input source
     */
    update(input = {}) {
        const now = Date.now();

        // Smooth updates
        if (input.energy !== undefined) {
            this.metrics.energy = this._smooth(this.metrics.energy, input.energy);
        }
        if (input.focus !== undefined) {
            this.metrics.focus = this._smooth(this.metrics.focus, input.focus);
        }
        if (input.mood !== undefined) {
            this.metrics.mood = this._smooth(this.metrics.mood, input.mood);
        }
        if (input.rest !== undefined) {
            this.metrics.rest = this._smooth(this.metrics.rest, input.rest);
        }
        if (input.reflection !== undefined) {
            this.metrics.reflection = this._smooth(this.metrics.reflection, input.reflection);
        }

        // Update activity tracking
        this.metrics.lastActivity = now;
        this.metrics.sessionDuration = (now - this.session.startTime) / 1000 / 60; // minutes

        // Natural decay
        this._applyNaturalDecay();

        // Update derived states
        this._updateStates();

        // Record history
        this._recordHistory();

        // Check alerts
        this._checkAlerts();

        // Emit update
        this._emit('update', this.getSnapshot());

        return this.getSnapshot();
    }

    /**
     * Smooth value update
     */
    _smooth(current, target) {
        return current + (target - current) * this.smoothingFactor;
    }

    /**
     * Apply natural decay over time
     */
    _applyNaturalDecay() {
        const minutesActive = this.metrics.sessionDuration;

        // Energy decays over time
        this.metrics.energy = Math.max(0, this.metrics.energy - 0.01);

        // Rest decays slowly
        this.metrics.rest = Math.max(0, this.metrics.rest - 0.005);

        // Focus fluctuates
        this.metrics.focus += (Math.random() - 0.5) * 2;
        this.metrics.focus = Math.max(0, Math.min(100, this.metrics.focus));

        // Mood drifts toward neutral
        this.metrics.mood += (0.5 - this.metrics.mood) * 0.001;
    }

    /**
     * Update derived states based on thresholds
     */
    _updateStates() {
        const t = config.thresholds;

        // Energy level
        if (this.metrics.energy < t.energy.low) {
            this.state.energyLevel = 'low';
        } else if (this.metrics.energy < t.energy.medium) {
            this.state.energyLevel = 'medium';
        } else {
            this.state.energyLevel = 'high';
        }

        // Focus level
        if (this.metrics.focus < t.focus.scattered) {
            this.state.focusLevel = 'scattered';
        } else if (this.metrics.focus < t.focus.normal) {
            this.state.focusLevel = 'normal';
        } else if (this.metrics.focus < t.focus.flow) {
            this.state.focusLevel = 'flow';
        } else {
            this.state.focusLevel = 'hyperfocus';
        }

        // Mood level
        if (this.metrics.mood < t.mood.negative) {
            this.state.moodLevel = 'negative';
        } else if (this.metrics.mood < t.mood.neutral) {
            this.state.moodLevel = 'neutral';
        } else {
            this.state.moodLevel = 'positive';
        }

        // Rest level
        if (this.metrics.rest < t.rest.exhausted) {
            this.state.restLevel = 'exhausted';
        } else if (this.metrics.rest < t.rest.tired) {
            this.state.restLevel = 'tired';
        } else if (this.metrics.rest < t.rest.rested) {
            this.state.restLevel = 'rested';
        } else {
            this.state.restLevel = 'refreshed';
        }

        // Flow state detection
        this.state.inFlow = this.metrics.focus >= t.focus.flow &&
                           this.metrics.energy >= t.energy.medium &&
                           this.state.moodLevel !== 'negative';

        // Track peak flow
        if (this.state.inFlow) {
            this.session.flowMinutes += this.updateInterval / 1000 / 60;
        }

        // Needs break detection
        this.state.needsBreak = this.metrics.energy < t.energy.low ||
                               this.metrics.rest < t.rest.exhausted ||
                               this.metrics.sessionDuration > config.alerts.longSession.duration;

        // Track peaks
        if (this.metrics.focus > this.session.peakFocus) {
            this.session.peakFocus = this.metrics.focus;
        }
        if (this.metrics.energy > this.session.peakEnergy) {
            this.session.peakEnergy = this.metrics.energy;
        }
    }

    /**
     * Record history snapshot
     */
    _recordHistory() {
        this.history.push({
            ...this.metrics,
            ...this.state,
            timestamp: Date.now()
        });

        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    /**
     * Check and emit alerts
     */
    _checkAlerts() {
        const alerts = config.alerts;

        if (this.metrics.energy < alerts.lowEnergy.threshold) {
            this._emit('alert', {
                type: 'lowEnergy',
                ...alerts.lowEnergy
            });
        }

        if (this.metrics.sessionDuration > alerts.longSession.duration) {
            this._emit('alert', {
                type: 'longSession',
                ...alerts.longSession,
                duration: this.metrics.sessionDuration
            });
        }

        if (this.state.inFlow && this.metrics.focus >= alerts.flowState.threshold) {
            this._emit('alert', {
                type: 'flowState',
                ...alerts.flowState
            });
        }
    }

    /**
     * Simulate user activity (for testing)
     */
    simulateActivity(type = 'normal') {
        const patterns = {
            normal: { energy: -0.5, focus: (Math.random() - 0.5) * 5, mood: 0 },
            intense: { energy: -2, focus: 10, mood: 0.1 },
            relaxed: { energy: 0.5, focus: -5, mood: 0.05, rest: 1 },
            break: { energy: 5, focus: -20, mood: 0.1, rest: 10 },
            frustration: { energy: -3, focus: -10, mood: -0.2 },
            success: { energy: 5, focus: 5, mood: 0.3 }
        };

        const pattern = patterns[type] || patterns.normal;

        this.update({
            energy: this.metrics.energy + pattern.energy,
            focus: this.metrics.focus + pattern.focus,
            mood: this.metrics.mood + pattern.mood,
            rest: this.metrics.rest + (pattern.rest || 0)
        });
    }

    /**
     * Record a break
     */
    recordBreak() {
        this.session.breaks++;
        this.metrics.energy = Math.min(100, this.metrics.energy + 20);
        this.metrics.rest = Math.min(100, this.metrics.rest + 30);
        this.metrics.focus = 50; // Reset focus
        this._emit('break', { breaks: this.session.breaks });
    }

    /**
     * Get current snapshot
     */
    getSnapshot() {
        return {
            nodeId: this.nodeId,
            metrics: { ...this.metrics },
            state: { ...this.state },
            session: { ...this.session },
            timestamp: Date.now()
        };
    }

    /**
     * Get trend analysis
     */
    getTrends() {
        if (this.history.length < 10) return null;

        const recent = this.history.slice(-30);
        const older = this.history.slice(-60, -30);

        const avg = (arr, key) => arr.reduce((s, x) => s + x[key], 0) / arr.length;

        return {
            energy: {
                current: avg(recent, 'energy'),
                previous: older.length ? avg(older, 'energy') : null,
                trend: recent.length > 1 ? recent[recent.length - 1].energy - recent[0].energy : 0
            },
            focus: {
                current: avg(recent, 'focus'),
                previous: older.length ? avg(older, 'focus') : null,
                trend: recent.length > 1 ? recent[recent.length - 1].focus - recent[0].focus : 0
            },
            mood: {
                current: avg(recent, 'mood'),
                previous: older.length ? avg(older, 'mood') : null,
                trend: recent.length > 1 ? recent[recent.length - 1].mood - recent[0].mood : 0
            }
        };
    }

    /**
     * Subscribe to events
     */
    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event).push(handler);
    }

    /**
     * Emit event
     */
    _emit(event, data) {
        const handlers = this.handlers.get(event) || [];
        handlers.forEach(h => h(data));
    }
}

module.exports = MetricsTracker;
