/**
 * NeuroEngine.js
 * Neural interface engine for HyperMode
 * Simulates neural feedback patterns and bio-reactive responses
 */

class NeuroEngine {
    constructor(manager, config = {}) {
        this.manager = manager;
        this.device = config.device || 'OpenBCI';
        this.sampleRate = config.sampleRate || 250; // Hz
        this.channels = config.channels || 8;
        this.connected = false;

        // Neural state
        this.state = {
            alpha: 0.5,      // 8-12 Hz - relaxation
            beta: 0.5,       // 12-30 Hz - focus
            gamma: 0.3,      // 30-100 Hz - insight
            theta: 0.4,      // 4-8 Hz - creativity
            delta: 0.2,      // 0.5-4 Hz - deep state
            attention: 0.5,
            meditation: 0.5,
            engagement: 0.5
        };

        // Signal buffer
        this.buffer = [];
        this.bufferSize = 1000;

        // Event listeners
        this.listeners = new Map();

        this._init();
        console.log(`[NeuroEngine] 🧠 initialized (device: ${this.device})`);
    }

    _init() {
        // Simulate neural signal updates
        this._simulationInterval = setInterval(() => {
            this._updateState();
            this._emitStateChange();
        }, 1000 / this.sampleRate * 10); // Update at 25Hz for efficiency
    }

    _updateState() {
        // Simulate gradual changes in neural state
        const drift = () => (Math.random() - 0.5) * 0.1;
        const clamp = (v) => Math.max(0, Math.min(1, v));

        this.state.alpha = clamp(this.state.alpha + drift());
        this.state.beta = clamp(this.state.beta + drift());
        this.state.gamma = clamp(this.state.gamma + drift() * 0.5);
        this.state.theta = clamp(this.state.theta + drift());
        this.state.delta = clamp(this.state.delta + drift() * 0.3);

        // Derived metrics
        this.state.attention = (this.state.beta * 0.6 + this.state.gamma * 0.4);
        this.state.meditation = (this.state.alpha * 0.5 + this.state.theta * 0.5);
        this.state.engagement = (this.state.beta * 0.4 + this.state.gamma * 0.3 + (1 - this.state.alpha) * 0.3);

        // Buffer
        this.buffer.push({ ...this.state, ts: Date.now() });
        if (this.buffer.length > this.bufferSize) {
            this.buffer.shift();
        }
    }

    _emitStateChange() {
        const handlers = this.listeners.get('stateChange') || [];
        handlers.forEach(h => h(this.state));
    }

    /**
     * Get current neural state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get attention level (0-1)
     */
    getAttention() {
        return this.state.attention;
    }

    /**
     * Get meditation level (0-1)
     */
    getMeditation() {
        return this.state.meditation;
    }

    /**
     * Get engagement level (0-1)
     */
    getEngagement() {
        return this.state.engagement;
    }

    /**
     * Get dominant brainwave
     */
    getDominantWave() {
        const waves = ['alpha', 'beta', 'gamma', 'theta', 'delta'];
        let max = 0, dominant = 'alpha';
        waves.forEach(w => {
            if (this.state[w] > max) {
                max = this.state[w];
                dominant = w;
            }
        });
        return { wave: dominant, value: max };
    }

    /**
     * Check if user is in flow state
     */
    isInFlowState() {
        return this.state.attention > 0.6 &&
               this.state.engagement > 0.6 &&
               this.state.gamma > 0.4;
    }

    /**
     * Check if user is relaxed
     */
    isRelaxed() {
        return this.state.alpha > 0.6 && this.state.meditation > 0.5;
    }

    /**
     * Get signal quality (0-1)
     */
    getSignalQuality() {
        // Simulated - would be real in hardware integration
        return 0.85 + Math.random() * 0.1;
    }

    /**
     * Subscribe to neural events
     */
    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(handler);
    }

    /**
     * Broadcast neural state to manager
     */
    broadcastState() {
        if (this.manager && this.manager.ws && this.manager.ws.broadcast) {
            this.manager.ws.broadcast({
                type: 'neural_state',
                state: this.state,
                dominant: this.getDominantWave(),
                flow: this.isInFlowState(),
                ts: Date.now()
            });
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        clearInterval(this._simulationInterval);
        this.listeners.clear();
    }
}

module.exports = NeuroEngine;
