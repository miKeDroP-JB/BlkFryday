/**
 * AuraVisualizer.js
 * Maps human presence as a visual aura in the multiverse
 */

const config = require('./config.json');

class AuraVisualizer {
    constructor(tracker, options = {}) {
        this.tracker = tracker;
        this.wsPort = options.wsPort || 8084;

        // Aura state
        this.aura = {
            position: { x: 0, y: 0, z: 0 },
            radius: config.visualization.auraRadius,
            color: config.colors.aura.base,
            glowColor: config.colors.aura.glow,
            intensity: 1.0,
            pulsePhase: 0,
            particles: [],
            trail: []
        };

        // WebSocket for broadcasting
        this.ws = null;
        this.clients = new Set();

        this._initParticles();
        console.log('[AuraVisualizer] ✨ Aura system initialized');
    }

    /**
     * Initialize aura particles
     */
    _initParticles() {
        const count = config.visualization.particleCount;
        this.aura.particles = [];

        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = this.aura.radius * (0.5 + Math.random() * 0.5);

            this.aura.particles.push({
                id: i,
                x: r * Math.sin(phi) * Math.cos(theta),
                y: r * Math.sin(phi) * Math.sin(theta),
                z: r * Math.cos(phi),
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                vz: (Math.random() - 0.5) * 2,
                size: 2 + Math.random() * 4,
                alpha: 0.3 + Math.random() * 0.7,
                orbit: Math.random() * Math.PI * 2
            });
        }
    }

    /**
     * Update aura based on current metrics
     */
    update() {
        const snapshot = this.tracker.getSnapshot();
        const metrics = snapshot.metrics;
        const state = snapshot.state;

        // Update intensity based on energy
        this.aura.intensity = metrics.energy / 100;

        // Update radius based on presence
        this.aura.radius = config.visualization.auraRadius *
            (0.5 + metrics.presence * 0.5);

        // Update color based on mood and focus
        this.aura.color = this._calculateColor(metrics, state);
        this.aura.glowColor = this._calculateGlowColor(state);

        // Update pulse based on focus
        this.aura.pulsePhase += config.visualization.pulseSpeed *
            (1 + metrics.focus / 50);

        // Update particles
        this._updateParticles(metrics, state);

        // Record trail
        this._updateTrail();

        // Broadcast to connected clients
        this.broadcast();

        return this.getAuraState();
    }

    /**
     * Calculate main aura color
     */
    _calculateColor(metrics, state) {
        const colors = config.colors;

        // Blend based on primary state
        let r = 0, g = 0, b = 0;

        // Energy contribution (red-green)
        const energyColor = this._hexToRgb(colors.energy[state.energyLevel]);
        r += energyColor.r * 0.3;
        g += energyColor.g * 0.3;
        b += energyColor.b * 0.3;

        // Focus contribution (blue-purple)
        const focusColor = this._hexToRgb(colors.focus[state.focusLevel]);
        r += focusColor.r * 0.4;
        g += focusColor.g * 0.4;
        b += focusColor.b * 0.4;

        // Mood contribution
        const moodColor = this._hexToRgb(colors.mood[state.moodLevel]);
        r += moodColor.r * 0.3;
        g += moodColor.g * 0.3;
        b += moodColor.b * 0.3;

        return this._rgbToHex(Math.round(r), Math.round(g), Math.round(b));
    }

    /**
     * Calculate glow color
     */
    _calculateGlowColor(state) {
        if (state.inFlow) {
            return '#88ffff'; // Cyan glow for flow state
        }
        if (state.focusLevel === 'hyperfocus') {
            return '#ff88ff'; // Magenta for hyperfocus
        }
        return config.colors.aura.glow;
    }

    /**
     * Update particle positions
     */
    _updateParticles(metrics, state) {
        const focusFactor = metrics.focus / 100;
        const energyFactor = metrics.energy / 100;

        this.aura.particles.forEach(p => {
            // Orbital motion
            p.orbit += 0.02 * (1 + focusFactor);
            const orbitInfluence = state.inFlow ? 0.5 : 0.2;

            // Update position with orbit and chaos
            const chaos = state.focusLevel === 'scattered' ? 0.5 : 0.1;
            p.x += p.vx * chaos + Math.cos(p.orbit) * orbitInfluence;
            p.y += p.vy * chaos + Math.sin(p.orbit) * orbitInfluence;
            p.z += p.vz * chaos;

            // Contain within aura radius
            const dist = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
            if (dist > this.aura.radius) {
                const scale = this.aura.radius / dist * 0.9;
                p.x *= scale;
                p.y *= scale;
                p.z *= scale;
                // Bounce velocity
                p.vx *= -0.5;
                p.vy *= -0.5;
                p.vz *= -0.5;
            }

            // Update visual properties
            p.alpha = 0.3 + energyFactor * 0.7;
            p.size = (2 + focusFactor * 4) * (state.inFlow ? 1.5 : 1);
        });
    }

    /**
     * Update position trail
     */
    _updateTrail() {
        this.aura.trail.push({
            x: this.aura.position.x,
            y: this.aura.position.y,
            z: this.aura.position.z,
            intensity: this.aura.intensity,
            timestamp: Date.now()
        });

        // Limit trail length
        while (this.aura.trail.length > config.visualization.trailLength) {
            this.aura.trail.shift();
        }
    }

    /**
     * Move aura position
     */
    setPosition(x, y, z) {
        this.aura.position = { x, y, z };
    }

    /**
     * Get aura state for rendering
     */
    getAuraState() {
        return {
            ...this.aura,
            pulseValue: Math.sin(this.aura.pulsePhase) * 0.5 + 0.5,
            particleData: this.aura.particles.map(p => ({
                x: p.x + this.aura.position.x,
                y: p.y + this.aura.position.y,
                z: p.z + this.aura.position.z,
                size: p.size,
                alpha: p.alpha
            }))
        };
    }

    /**
     * Initialize WebSocket server
     */
    initWebSocket(WebSocket) {
        const wss = new WebSocket.Server({ port: this.wsPort });

        wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log('[AuraVisualizer] Client connected');

            ws.on('close', () => {
                this.clients.delete(ws);
            });
        });

        this.wss = wss;
        console.log(`[AuraVisualizer] WebSocket server on port ${this.wsPort}`);
    }

    /**
     * Broadcast aura state
     */
    broadcast() {
        if (!this.clients.size) return;

        const data = JSON.stringify({
            type: 'aura_update',
            aura: this.getAuraState(),
            timestamp: Date.now()
        });

        this.clients.forEach(client => {
            try {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(data);
                }
            } catch (e) { }
        });
    }

    // Color utilities
    _hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 128, g: 128, b: 128 };
    }

    _rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.max(0, Math.min(255, x)).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
}

module.exports = AuraVisualizer;
