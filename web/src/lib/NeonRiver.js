// ============================================================
//  BRAIN NETWORK V11.5 - NEON RIVER
//  Master Orchestrator - The Flow State Engine
// ============================================================
//
//  "The Neon River flows now."
//
//  This module orchestrates all V11.5 subsystems:
//  - WASM Engine (zero-copy glyph encoding)
//  - Sonic Loader (pre-warmed audio)
//  - Network Manager (WebTransport multiplex)
//  - Stability Monitor (adaptive routing)
//
// ============================================================

import { getSonicLoader } from './audio/SonicLoader';

// ============================================================
//  NEON RIVER - MAIN ORCHESTRATOR
// ============================================================

class NeonRiver {
  constructor() {
    this.isInitialized = false;
    this.isFlowing = false;

    // Subsystems
    this.sonic = null;
    this.wasmWorker = null;
    this.network = null;

    // State
    this.stabilityScore = 1.0;
    this.rttSamples = [];
    this.jitterSamples = [];
    this.packetLoss = 0;

    // Performance metrics
    this.metrics = {
      initTime: 0,
      wasmReady: false,
      sonicReady: false,
      networkReady: false
    };

    // Event handlers
    this.handlers = new Map();
  }

  // ============================================================
  //  BOOT SEQUENCE
  // ============================================================

  async flow() {
    if (this.isFlowing) return this;

    const startTime = performance.now();
    console.log('[NeonRiver] Initiating flow...');

    try {
      // Parallel initialization of all subsystems
      await Promise.all([
        this.initWasm(),
        this.initSonic(),
        this.initNetwork()
      ]);

      this.metrics.initTime = performance.now() - startTime;
      this.isFlowing = true;
      this.isInitialized = true;

      console.log(`[NeonRiver] Flow established in ${this.metrics.initTime.toFixed(1)}ms`);
      this.emit('flow', { metrics: this.metrics });

      // Play boot sound
      this.sonic?.boot();

      return this;

    } catch (error) {
      console.error('[NeonRiver] Flow failed:', error);
      this.emit('error', { error });
      throw error;
    }
  }

  // ============================================================
  //  WASM INITIALIZATION
  // ============================================================

  async initWasm() {
    return new Promise((resolve, reject) => {
      try {
        // Check for Worker support
        if (typeof Worker === 'undefined') {
          console.warn('[NeonRiver] Web Workers not supported, using fallback');
          this.metrics.wasmReady = true;
          resolve();
          return;
        }

        // Create worker
        this.wasmWorker = new Worker(
          new URL('../workers/wasm-worker.js', import.meta.url),
          { type: 'module' }
        );

        const timeout = setTimeout(() => {
          console.warn('[NeonRiver] WASM init timeout, continuing without');
          this.metrics.wasmReady = false;
          resolve();
        }, 5000);

        this.wasmWorker.onmessage = (e) => {
          if (e.data.type === 'WASM_READY') {
            clearTimeout(timeout);
            this.metrics.wasmReady = true;
            console.log(`[NeonRiver] WASM ready (${e.data.version})`);
            resolve();
          }
        };

        this.wasmWorker.onerror = (error) => {
          clearTimeout(timeout);
          console.warn('[NeonRiver] WASM worker error:', error.message);
          this.metrics.wasmReady = false;
          resolve(); // Don't fail, continue without WASM
        };

      } catch (error) {
        console.warn('[NeonRiver] WASM init error:', error);
        this.metrics.wasmReady = false;
        resolve();
      }
    });
  }

  // ============================================================
  //  SONIC INITIALIZATION
  // ============================================================

  async initSonic() {
    try {
      this.sonic = getSonicLoader();
      await this.sonic.init();
      await this.sonic.hydrate();
      this.metrics.sonicReady = true;
      console.log('[NeonRiver] Sonic audio engine hydrated');
    } catch (error) {
      console.warn('[NeonRiver] Sonic init error:', error);
      this.metrics.sonicReady = false;
    }
  }

  // ============================================================
  //  NETWORK INITIALIZATION
  // ============================================================

  async initNetwork() {
    try {
      this.network = new NetworkManager(this);
      await this.network.connect();
      this.metrics.networkReady = true;
      console.log('[NeonRiver] Network manager connected');
    } catch (error) {
      console.warn('[NeonRiver] Network init error:', error);
      this.metrics.networkReady = false;
    }
  }

  // ============================================================
  //  GLYPH ENCODING (via WASM)
  // ============================================================

  async encodeGlyph(points) {
    if (!this.wasmWorker || !this.metrics.wasmReady) {
      // Fallback to JS encoding
      return this.encodeGlyphJS(points);
    }

    return new Promise((resolve, reject) => {
      const id = Date.now();

      const handler = (e) => {
        if (e.data.id === id && e.data.type === 'GLYPH_ENCODED') {
          this.wasmWorker.removeEventListener('message', handler);
          resolve(e.data.payload);
        }
      };

      this.wasmWorker.addEventListener('message', handler);
      this.wasmWorker.postMessage({
        type: 'ENCODE_GLYPH',
        id,
        payload: new Float32Array(points)
      });

      // Timeout fallback
      setTimeout(() => {
        this.wasmWorker.removeEventListener('message', handler);
        resolve(this.encodeGlyphJS(points));
      }, 100);
    });
  }

  encodeGlyphJS(points) {
    const result = [];
    let prevX = 0, prevY = 0;

    for (let i = 0; i < points.length; i += 3) {
      const x = points[i] || 0;
      const y = points[i + 1] || 0;
      const p = points[i + 2] || 0;

      const dx = Math.round((x - prevX) * 127);
      const dy = Math.round((y - prevY) * 127);
      const dp = Math.round(p * 255);

      result.push((dx + 256) % 256);
      result.push((dy + 256) % 256);
      result.push(dp);

      prevX = x;
      prevY = y;
    }

    return new Uint8Array(result);
  }

  // ============================================================
  //  STABILITY MONITORING
  // ============================================================

  recordRTT(rtt) {
    this.rttSamples.push(rtt);
    if (this.rttSamples.length > 50) {
      this.rttSamples.shift();
    }
    this.updateStability();
  }

  recordJitter(jitter) {
    this.jitterSamples.push(jitter);
    if (this.jitterSamples.length > 50) {
      this.jitterSamples.shift();
    }
    this.updateStability();
  }

  recordPacketLoss(rate) {
    this.packetLoss = rate;
    this.updateStability();
  }

  updateStability() {
    if (this.rttSamples.length === 0) return;

    const avgRtt = this.rttSamples.reduce((a, b) => a + b, 0) / this.rttSamples.length;
    const avgJitter = this.jitterSamples.length > 0
      ? this.jitterSamples.reduce((a, b) => a + b, 0) / this.jitterSamples.length
      : 0;

    const rttScore = Math.max(0, 1 - avgRtt / 200);
    const jitterScore = Math.max(0, 1 - avgJitter / 50);
    const lossScore = Math.max(0, 1 - this.packetLoss * 10);

    this.stabilityScore = Math.min(1, rttScore * 0.4 + jitterScore * 0.4 + lossScore * 0.2);

    this.emit('stability', { score: this.stabilityScore, rtt: avgRtt, jitter: avgJitter });
  }

  // ============================================================
  //  VOICE STREAM
  // ============================================================

  async sendVoice(audioData, metadata = {}) {
    if (!this.network) return { error: 'network_not_ready' };

    return this.network.sendVoice(audioData, {
      ...metadata,
      stabilityScore: this.stabilityScore
    });
  }

  // ============================================================
  //  CONTROL STREAM
  // ============================================================

  async sendControl(action, payload = {}) {
    if (!this.network) return { error: 'network_not_ready' };

    this.sonic?.click();
    return this.network.sendControl(action, payload);
  }

  // ============================================================
  //  TELEMETRY
  // ============================================================

  async sendTelemetry(metric, data) {
    if (!this.network) return;

    return this.network.sendTelemetry({
      metric,
      dimensions: data.dimensions || {},
      values: data.values || {},
      flags: data.flags || {},
      timestamp: Date.now()
    });
  }

  // ============================================================
  //  EVENT SYSTEM
  // ============================================================

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event, data) {
    this.handlers.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`[NeonRiver] Event handler error (${event}):`, error);
      }
    });
  }

  // ============================================================
  //  CLEANUP
  // ============================================================

  dispose() {
    this.wasmWorker?.terminate();
    this.sonic?.dispose();
    this.network?.disconnect();
    this.handlers.clear();
    this.isFlowing = false;
    this.isInitialized = false;
    console.log('[NeonRiver] Flow stopped');
  }
}

// ============================================================
//  NETWORK MANAGER
// ============================================================

class NetworkManager {
  constructor(river) {
    this.river = river;
    this.transport = null;
    this.fallbackWs = null;
    this.isConnected = false;
    this.useWebTransport = false;
    this.baseUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : 'http://localhost:3000';
  }

  async connect() {
    // Try WebTransport first (if available)
    if (typeof WebTransport !== 'undefined') {
      try {
        await this.connectWebTransport();
        return;
      } catch (error) {
        console.log('[NetworkManager] WebTransport unavailable, using fallback');
      }
    }

    // Fallback to WebSocket
    await this.connectWebSocket();
  }

  async connectWebTransport() {
    const url = this.baseUrl.replace('http', 'https');
    this.transport = new WebTransport(`${url}/wt`);
    await this.transport.ready;
    this.useWebTransport = true;
    this.isConnected = true;
    console.log('[NetworkManager] WebTransport connected');
  }

  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws/fallback';

      try {
        this.fallbackWs = new WebSocket(wsUrl);

        this.fallbackWs.onopen = () => {
          this.isConnected = true;
          console.log('[NetworkManager] WebSocket connected');
          resolve();
        };

        this.fallbackWs.onerror = (error) => {
          console.warn('[NetworkManager] WebSocket error, using HTTP fallback');
          this.isConnected = true; // Mark as connected, will use HTTP
          resolve();
        };

        this.fallbackWs.onclose = () => {
          this.isConnected = false;
        };

        // Timeout - use HTTP fallback
        setTimeout(() => {
          if (!this.isConnected) {
            this.isConnected = true;
            resolve();
          }
        }, 2000);

      } catch (error) {
        // Use HTTP as final fallback
        this.isConnected = true;
        resolve();
      }
    });
  }

  async sendVoice(audioData, metadata) {
    const payload = {
      audio: Array.from(audioData),
      ...metadata,
      timestamp: Date.now()
    };

    return this.send('/wt/voice', payload);
  }

  async sendControl(action, data) {
    return this.send('/wt/control', { action, payload: data });
  }

  async sendTelemetry(data) {
    // Fire and forget
    this.send('/wt/telemetry', data).catch(() => {});
  }

  async send(endpoint, data) {
    // Try WebSocket if available
    if (this.fallbackWs?.readyState === WebSocket.OPEN) {
      this.fallbackWs.send(JSON.stringify({ endpoint, ...data }));
      return { sent: true };
    }

    // HTTP fallback
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-stability-score': this.river.stabilityScore.toString()
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();

    } catch (error) {
      console.error('[NetworkManager] Send error:', error);
      return { error: error.message };
    }
  }

  disconnect() {
    this.transport?.close();
    this.fallbackWs?.close();
    this.isConnected = false;
  }
}

// ============================================================
//  SINGLETON INSTANCE
// ============================================================

let neonRiverInstance = null;

export function getNeonRiver() {
  if (!neonRiverInstance) {
    neonRiverInstance = new NeonRiver();
  }
  return neonRiverInstance;
}

export function initNeonRiver() {
  return getNeonRiver().flow();
}

export { NeonRiver, NetworkManager };
export default NeonRiver;
