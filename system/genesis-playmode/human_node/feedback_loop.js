/**
 * FeedbackLoop.js
 * Sends human metrics to engines and AI systems
 * Bidirectional communication between human node and universe
 */

class FeedbackLoop {
    constructor(tracker, options = {}) {
        this.tracker = tracker;
        this.engines = new Map();
        this.aiSystems = new Map();

        // Feedback state
        this.state = {
            feedbackCount: 0,
            lastFeedback: null,
            responsesReceived: 0,
            adaptationsApplied: 0
        };

        // Feedback queue
        this.queue = [];
        this.maxQueueSize = 100;

        // Configuration
        this.feedbackInterval = options.feedbackInterval || 100;
        this.batchSize = options.batchSize || 10;

        // Subscribe to tracker updates
        this.tracker.on('update', (snapshot) => this._onMetricsUpdate(snapshot));
        this.tracker.on('alert', (alert) => this._onAlert(alert));
        this.tracker.on('break', (data) => this._onBreak(data));

        console.log('[FeedbackLoop] 🔄 Feedback loop initialized');
    }

    /**
     * Register an engine to receive feedback
     */
    registerEngine(name, engine) {
        this.engines.set(name, {
            engine,
            lastFeedback: null,
            responsiveness: 1.0
        });
        console.log(`[FeedbackLoop] Registered engine: ${name}`);
    }

    /**
     * Register an AI system
     */
    registerAI(name, ai) {
        this.aiSystems.set(name, {
            ai,
            lastFeedback: null,
            adaptations: 0
        });
        console.log(`[FeedbackLoop] Registered AI: ${name}`);
    }

    /**
     * Handle metrics update
     */
    _onMetricsUpdate(snapshot) {
        // Create feedback packet
        const feedback = {
            type: 'metrics_update',
            nodeId: snapshot.nodeId,
            metrics: snapshot.metrics,
            state: snapshot.state,
            timestamp: snapshot.timestamp
        };

        // Queue feedback
        this._queueFeedback(feedback);

        // Process queue
        this._processQueue();
    }

    /**
     * Handle alert
     */
    _onAlert(alert) {
        const feedback = {
            type: 'alert',
            alert,
            timestamp: Date.now()
        };

        // Immediate broadcast for alerts
        this._broadcastToAll(feedback);
    }

    /**
     * Handle break
     */
    _onBreak(data) {
        const feedback = {
            type: 'break',
            ...data,
            timestamp: Date.now()
        };

        this._broadcastToAll(feedback);
    }

    /**
     * Queue feedback for batch processing
     */
    _queueFeedback(feedback) {
        this.queue.push(feedback);
        if (this.queue.length > this.maxQueueSize) {
            this.queue.shift();
        }
    }

    /**
     * Process feedback queue
     */
    _processQueue() {
        if (this.queue.length < this.batchSize) return;

        const batch = this.queue.splice(0, this.batchSize);

        // Aggregate batch
        const aggregated = this._aggregateBatch(batch);

        // Send to engines
        this._sendToEngines(aggregated);

        // Send to AI systems
        this._sendToAI(aggregated);

        this.state.feedbackCount += batch.length;
        this.state.lastFeedback = Date.now();
    }

    /**
     * Aggregate batch of feedback
     */
    _aggregateBatch(batch) {
        const metricsUpdates = batch.filter(f => f.type === 'metrics_update');

        if (metricsUpdates.length === 0) {
            return { type: 'empty', timestamp: Date.now() };
        }

        // Average metrics
        const avg = (arr, key) => arr.reduce((s, x) => s + x.metrics[key], 0) / arr.length;

        return {
            type: 'aggregated_metrics',
            count: metricsUpdates.length,
            metrics: {
                energy: avg(metricsUpdates, 'energy'),
                focus: avg(metricsUpdates, 'focus'),
                mood: avg(metricsUpdates, 'mood'),
                rest: avg(metricsUpdates, 'rest'),
                presence: avg(metricsUpdates, 'presence')
            },
            state: metricsUpdates[metricsUpdates.length - 1].state,
            timestamp: Date.now()
        };
    }

    /**
     * Send feedback to engines
     */
    _sendToEngines(feedback) {
        this.engines.forEach((entry, name) => {
            try {
                const engine = entry.engine;

                // Adapt engine behavior based on human state
                if (engine.adaptToHuman) {
                    engine.adaptToHuman(feedback);
                    entry.lastFeedback = Date.now();
                }

                // Adjust parameters
                if (engine.setParameters && feedback.metrics) {
                    const params = this._calculateEngineParams(feedback);
                    engine.setParameters(params);
                }

            } catch (e) {
                console.warn(`[FeedbackLoop] Engine ${name} feedback error:`, e.message);
            }
        });
    }

    /**
     * Send feedback to AI systems
     */
    _sendToAI(feedback) {
        this.aiSystems.forEach((entry, name) => {
            try {
                const ai = entry.ai;

                // Update AI with human state
                if (ai.receiveHumanFeedback) {
                    const adaptation = ai.receiveHumanFeedback(feedback);
                    if (adaptation) {
                        entry.adaptations++;
                        this.state.adaptationsApplied++;
                        this._applyAdaptation(adaptation);
                    }
                }

                entry.lastFeedback = Date.now();

            } catch (e) {
                console.warn(`[FeedbackLoop] AI ${name} feedback error:`, e.message);
            }
        });
    }

    /**
     * Calculate engine parameters from human state
     */
    _calculateEngineParams(feedback) {
        const metrics = feedback.metrics;
        const state = feedback.state;

        return {
            // Reduce complexity when energy is low
            complexity: state.energyLevel === 'low' ? 0.5 : 1.0,

            // Increase exploration when in flow
            exploration: state.inFlow ? 1.5 : 1.0,

            // Adjust speed based on focus
            speed: state.focusLevel === 'hyperfocus' ? 1.5 :
                   state.focusLevel === 'scattered' ? 0.7 : 1.0,

            // Branching factor based on energy
            branchFactor: Math.max(0.5, metrics.energy / 100),

            // Visual density based on presence
            visualDensity: metrics.presence
        };
    }

    /**
     * Apply adaptation from AI
     */
    _applyAdaptation(adaptation) {
        // Could adjust tracker settings, emit events, etc.
        console.log('[FeedbackLoop] Applied adaptation:', adaptation.type || 'unknown');
    }

    /**
     * Broadcast to all registered systems
     */
    _broadcastToAll(feedback) {
        this._sendToEngines(feedback);
        this._sendToAI(feedback);
    }

    /**
     * Request optimization suggestion
     */
    requestOptimization() {
        const snapshot = this.tracker.getSnapshot();
        const trends = this.tracker.getTrends();

        const request = {
            type: 'optimization_request',
            snapshot,
            trends,
            timestamp: Date.now()
        };

        const suggestions = [];

        this.aiSystems.forEach((entry, name) => {
            const ai = entry.ai;
            if (ai.suggestOptimization) {
                const suggestion = ai.suggestOptimization(request);
                if (suggestion) {
                    suggestions.push({ source: name, ...suggestion });
                }
            }
        });

        return suggestions;
    }

    /**
     * Get feedback state
     */
    getState() {
        return {
            ...this.state,
            enginesCount: this.engines.size,
            aiSystemsCount: this.aiSystems.size,
            queueLength: this.queue.length
        };
    }
}

module.exports = FeedbackLoop;
