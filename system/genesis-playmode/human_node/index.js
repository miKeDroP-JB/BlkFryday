/**
 * Human Node - Entry Point
 * Your presence in the multiverse
 */

const MetricsTracker = require('./metrics_tracker');
const AuraVisualizer = require('./aura_visualizer');
const FeedbackLoop = require('./feedback_loop');
const Optimizer = require('./optimizer');
const config = require('./config.json');

class HumanNode {
    constructor(options = {}) {
        this.nodeId = options.nodeId || `human_${Date.now()}`;
        this.name = options.name || 'Player';

        // Initialize components
        this.tracker = new MetricsTracker({ nodeId: this.nodeId });
        this.aura = new AuraVisualizer(this.tracker, { wsPort: options.auraPort || 8084 });
        this.feedback = new FeedbackLoop(this.tracker);
        this.optimizer = new Optimizer(this.tracker);

        // Update loop
        this.updateInterval = options.updateInterval || config.tuning.updateInterval;
        this.running = false;

        // WebSocket for external connections
        this.wsPort = options.wsPort || 8085;
        this.clients = new Set();

        console.log(`[HumanNode] 👤 ${this.name} initialized (${this.nodeId})`);
    }

    /**
     * Start the human node
     */
    start() {
        if (this.running) return;
        this.running = true;

        console.log(`[HumanNode] ▶️ ${this.name} node started`);

        // Main update loop
        this._updateLoop();

        // Optimization check loop
        this._optimizationLoop();

        return this;
    }

    /**
     * Stop the human node
     */
    stop() {
        this.running = false;
        console.log(`[HumanNode] ⏹️ ${this.name} node stopped`);
    }

    /**
     * Main update loop
     */
    _updateLoop() {
        if (!this.running) return;

        // Update tracker with simulated input (in real use, this would come from actual sensors/input)
        this.tracker.simulateActivity(this._detectActivityType());

        // Update aura
        this.aura.update();

        // Broadcast state
        this._broadcast();

        setTimeout(() => this._updateLoop(), this.updateInterval);
    }

    /**
     * Optimization check loop
     */
    _optimizationLoop() {
        if (!this.running) return;

        // Check for suggestions every 30 seconds
        const suggestion = this.optimizer.analyze();

        if (suggestion && suggestion.urgency !== 'info') {
            console.log(`[HumanNode] 💡 Suggestion: ${suggestion.message}`);
            this._broadcast({ type: 'suggestion', suggestion });
        }

        setTimeout(() => this._optimizationLoop(), 30000);
    }

    /**
     * Detect current activity type (simplified simulation)
     */
    _detectActivityType() {
        const snapshot = this.tracker.getSnapshot();

        if (snapshot.state.inFlow) {
            return Math.random() > 0.3 ? 'intense' : 'normal';
        }
        if (snapshot.state.needsBreak) {
            return 'frustration';
        }
        if (snapshot.metrics.energy < 30) {
            return 'relaxed';
        }

        // Random variation
        const types = ['normal', 'normal', 'normal', 'intense', 'relaxed'];
        return types[Math.floor(Math.random() * types.length)];
    }

    /**
     * Update metrics from external input
     */
    updateMetrics(input) {
        return this.tracker.update(input);
    }

    /**
     * Record a break taken
     */
    takeBreak(duration = 10) {
        this.tracker.recordBreak();
        this.optimizer.recordBreak(duration);
        console.log(`[HumanNode] 🧘 ${this.name} taking ${duration}min break`);
    }

    /**
     * Register engine for feedback
     */
    registerEngine(name, engine) {
        this.feedback.registerEngine(name, engine);
    }

    /**
     * Register AI system
     */
    registerAI(name, ai) {
        this.feedback.registerAI(name, ai);
    }

    /**
     * Get current state
     */
    getState() {
        return {
            nodeId: this.nodeId,
            name: this.name,
            running: this.running,
            tracker: this.tracker.getSnapshot(),
            aura: this.aura.getAuraState(),
            feedback: this.feedback.getState(),
            optimizer: this.optimizer.getState()
        };
    }

    /**
     * Get snapshot for visualization
     */
    getVisualizationData() {
        const snapshot = this.tracker.getSnapshot();
        const aura = this.aura.getAuraState();

        return {
            nodeId: this.nodeId,
            name: this.name,
            metrics: snapshot.metrics,
            state: snapshot.state,
            session: snapshot.session,
            aura: {
                position: aura.position,
                color: aura.color,
                glowColor: aura.glowColor,
                intensity: aura.intensity,
                radius: aura.radius,
                pulseValue: aura.pulseValue
            },
            particles: aura.particleData,
            suggestion: this.optimizer.pending,
            timestamp: Date.now()
        };
    }

    /**
     * Initialize WebSocket server
     */
    initWebSocket(WebSocket) {
        const wss = new WebSocket.Server({ port: this.wsPort });

        wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log(`[HumanNode] Client connected to ${this.name}`);

            // Send initial state
            ws.send(JSON.stringify({
                type: 'init',
                data: this.getVisualizationData()
            }));

            ws.on('message', (msg) => {
                try {
                    const data = JSON.parse(msg);
                    this._handleMessage(data, ws);
                } catch (e) { }
            });

            ws.on('close', () => {
                this.clients.delete(ws);
            });
        });

        this.wss = wss;
        console.log(`[HumanNode] WebSocket server on port ${this.wsPort}`);
    }

    /**
     * Handle incoming WebSocket message
     */
    _handleMessage(data, ws) {
        switch (data.type) {
            case 'update_metrics':
                this.updateMetrics(data.metrics);
                break;
            case 'take_break':
                this.takeBreak(data.duration);
                break;
            case 'accept_suggestion':
                this.optimizer.acceptSuggestion();
                break;
            case 'decline_suggestion':
                this.optimizer.declineSuggestion();
                break;
            case 'get_state':
                ws.send(JSON.stringify({
                    type: 'state',
                    data: this.getVisualizationData()
                }));
                break;
        }
    }

    /**
     * Broadcast to all clients
     */
    _broadcast(extra = null) {
        if (!this.clients.size) return;

        const data = JSON.stringify({
            type: 'update',
            data: this.getVisualizationData(),
            ...extra
        });

        this.clients.forEach(client => {
            try {
                if (client.readyState === 1) {
                    client.send(data);
                }
            } catch (e) { }
        });
    }
}

module.exports = HumanNode;
