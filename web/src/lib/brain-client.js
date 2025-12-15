/**
 * 0RB BRAIN CLIENT
 * ═══════════════════════════════════════════════════════════════════
 * Connects the cloud frontend to the local Xeon brain server
 * ═══════════════════════════════════════════════════════════════════
 */

class BrainClient {
  constructor(options = {}) {
    this.httpUrl = options.httpUrl || process.env.BRAIN_URL || 'http://localhost:8420';
    this.wsUrl = options.wsUrl || process.env.BRAIN_WS_URL || 'ws://localhost:8421';
    this.authToken = options.authToken || process.env.BRAIN_AUTH_TOKEN || '';
    this.ws = null;
    this.subscriptions = new Map();
    this.pendingTasks = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  // ═══════════════════════════════════════════════════════════════
  // HTTP API
  // ═══════════════════════════════════════════════════════════════

  async request(endpoint, options = {}) {
    const url = `${this.httpUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // STATUS & HEALTH
  // ═══════════════════════════════════════════════════════════════

  async getStatus() {
    return this.get('/status');
  }

  async isOnline() {
    try {
      const status = await this.getStatus();
      return status.status === 'online';
    } catch {
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // AGENTS
  // ═══════════════════════════════════════════════════════════════

  async listAgents() {
    return this.get('/agents');
  }

  async createAgent(config) {
    return this.post('/agents/create', config);
  }

  async assignTask(agentId, task) {
    return this.post('/agents/task', { agentId, task });
  }

  // ═══════════════════════════════════════════════════════════════
  // CHAT / AI
  // ═══════════════════════════════════════════════════════════════

  async chat(message, context = {}, model = null) {
    return this.post('/chat', { message, context, model });
  }

  // ═══════════════════════════════════════════════════════════════
  // ARC SOLVER
  // ═══════════════════════════════════════════════════════════════

  async solveArc(task, mode = 'benchmark') {
    return this.post('/arc/solve', { task, mode });
  }

  // ═══════════════════════════════════════════════════════════════
  // GAMES
  // ═══════════════════════════════════════════════════════════════

  async listGames() {
    return this.get('/games');
  }

  async launchGame(game) {
    return this.post('/games/launch', { game });
  }

  // ═══════════════════════════════════════════════════════════════
  // QUANTUM
  // ═══════════════════════════════════════════════════════════════

  async quantumOptimize(params) {
    return this.post('/quantum/optimize', params);
  }

  async quantumDecide(options, context = {}) {
    return this.post('/quantum/decide', { options, context });
  }

  // ═══════════════════════════════════════════════════════════════
  // GENESIS
  // ═══════════════════════════════════════════════════════════════

  async createFromIntent(intent) {
    return this.post('/genesis/create', { intent });
  }

  async listBlueprints() {
    return this.get('/genesis/blueprints');
  }

  // ═══════════════════════════════════════════════════════════════
  // COPA
  // ═══════════════════════════════════════════════════════════════

  async runSimulation(params) {
    return this.post('/copa/simulate', params);
  }

  async listIndustries() {
    return this.get('/copa/industries');
  }

  // ═══════════════════════════════════════════════════════════════
  // WEBSOCKET CONNECTION
  // ═══════════════════════════════════════════════════════════════

  connect() {
    if (typeof window === 'undefined') return; // Server-side guard

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('Connected to Brain Server');
        this.reconnectAttempts = 0;
        resolve(this.ws);
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };

      this.ws.onclose = () => {
        console.log('Disconnected from Brain Server');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  handleMessage(message) {
    const { type, taskId, channel, data, content } = message;

    switch (type) {
      case 'connected':
        console.log('Brain connection established:', message);
        break;

      case 'task_queued':
        console.log('Task queued:', taskId);
        break;

      case 'task_result':
        const resolver = this.pendingTasks.get(taskId);
        if (resolver) {
          resolver.resolve(message.result);
          this.pendingTasks.delete(taskId);
        }
        break;

      case 'broadcast':
        const handlers = this.subscriptions.get(channel);
        if (handlers) {
          handlers.forEach(handler => handler(data));
        }
        break;

      case 'stream_start':
        this.emit('stream:start');
        break;

      case 'stream_chunk':
        this.emit('stream:chunk', content);
        break;

      case 'stream_end':
        this.emit('stream:end');
        break;

      case 'pong':
        // Heartbeat response
        break;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
    setTimeout(() => this.connect(), delay);
  }

  // ═══════════════════════════════════════════════════════════════
  // WEBSOCKET METHODS
  // ═══════════════════════════════════════════════════════════════

  send(message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  subscribe(channel, handler) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      this.send({ type: 'subscribe', payload: { channel } });
    }
    this.subscriptions.get(channel).add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptions.get(channel);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  async submitTask(system, action, data) {
    return new Promise((resolve, reject) => {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      this.pendingTasks.set(taskId, { resolve, reject });

      this.send({
        type: 'task',
        payload: { system, action, data }
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        if (this.pendingTasks.has(taskId)) {
          this.pendingTasks.delete(taskId);
          reject(new Error('Task timeout'));
        }
      }, 300000);
    });
  }

  streamChat(message, context = {}) {
    this.send({
      type: 'stream',
      payload: { message, context }
    });
  }

  // Simple event emitter
  _listeners = {};
  on(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  }
  off(event, handler) {
    if (this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter(h => h !== handler);
    }
  }
  emit(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(h => h(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance for client-side use
let brainInstance = null;

export function getBrainClient(options = {}) {
  if (!brainInstance) {
    brainInstance = new BrainClient(options);
  }
  return brainInstance;
}

export default BrainClient;
