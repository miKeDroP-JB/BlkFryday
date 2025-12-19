/**
 * Fractal Memory SDK - THE HUMAN PORTAL
 * Phase 15: Frontend Developer Experience
 *
 * Single SDK for integrating Fractal Memory Engine into any UI
 *
 * Features:
 * - sendMessage → routes through Orchestrator
 * - setAvatar
 * - subscribeToNarrative
 * - subscribeToPatterns
 * - getContextPreview
 * - getUserState
 * - WebSocket stream support
 */

class FractalClient {
  /**
   * @param {Object} config
   * @param {string} config.baseUrl - Orchestrator URL
   * @param {string} config.authToken - Authentication token
   * @param {string} config.userId - User ID
   * @param {string} [config.defaultAvatar='default'] - Default avatar
   * @param {boolean} [config.enableWebSocket=true] - Enable WebSocket streaming
   */
  constructor(config) {
    this.baseUrl = config.baseUrl || 'http://localhost:8000';
    this.authToken = config.authToken;
    this.userId = config.userId;
    this.defaultAvatar = config.defaultAvatar || 'default';
    this.currentAvatar = this.defaultAvatar;
    this.enableWebSocket = config.enableWebSocket !== false;

    // WebSocket connection
    this.ws = null;
    this.wsReconnectAttempts = 0;
    this.maxReconnectAttempts = 5;

    // Event listeners
    this._listeners = {
      narrative: [],
      patterns: [],
      resonance: [],
      error: [],
      connected: [],
      disconnected: [],
    };

    // Session state
    this.sessionId = this._generateSessionId();
    this.messageCount = 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // Core Methods
  // ═══════════════════════════════════════════════════════════════

  /**
   * Send a message through the Orchestrator
   * @param {string} message - User message
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Orchestration response
   */
  async sendMessage(message, options = {}) {
    const payload = {
      message,
      user_id: this.userId,
      avatar: options.avatar || this.currentAvatar,
      session_id: this.sessionId,
      priority: options.priority || 'normal',
      include_llm_response: options.includeLlmResponse !== false,
      stream: options.stream || false,
      metadata: {
        ...options.metadata,
        message_index: ++this.messageCount,
        client_timestamp: new Date().toISOString(),
      },
    };

    try {
      const response = await this._fetch('/orchestrate/message', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Emit events based on response
      if (response.context_used?.length > 0) {
        this._emit('resonance', {
          snippets: response.context_used,
          tone: response.tone_profile,
        });
      }

      return response;
    } catch (error) {
      this._emit('error', { type: 'message', error });
      throw error;
    }
  }

  /**
   * Set current avatar
   * @param {string} avatarName - Avatar name
   */
  setAvatar(avatarName) {
    this.currentAvatar = avatarName;
    // Notify WebSocket if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'set_avatar',
        avatar: avatarName,
      }));
    }
  }

  /**
   * Get current user state
   * @returns {Promise<Object>} User state
   */
  async getUserState() {
    return this._fetch(`/surface/quick_profile/${this.userId}`);
  }

  /**
   * Get context preview for current avatar
   * @param {string} [message=''] - Optional message for context relevance
   * @returns {Promise<Object>} Context preview
   */
  async getContextPreview(message = '') {
    return this._fetch('/surface/context', {
      method: 'POST',
      body: JSON.stringify({
        user_state: { user_id: this.userId },
        current_avatar: this.currentAvatar,
        current_message: message,
        max_snippets: 10,
      }),
    });
  }

  /**
   * Get list of user's avatars
   * @returns {Promise<Array>} List of avatars
   */
  async getAvatars() {
    return this._fetch(`/avatars/${this.userId}`);
  }

  /**
   * Create a new avatar
   * @param {Object} config - Avatar configuration
   * @returns {Promise<Object>} Created avatar
   */
  async createAvatar(config) {
    return this._fetch(`/avatars/${this.userId}`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // Subscriptions
  // ═══════════════════════════════════════════════════════════════

  /**
   * Subscribe to narrative updates
   * @param {Function} callback - Callback for narrative events
   * @returns {Function} Unsubscribe function
   */
  subscribeToNarrative(callback) {
    this._listeners.narrative.push(callback);
    this._ensureWebSocket();
    return () => {
      this._listeners.narrative = this._listeners.narrative.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to pattern updates
   * @param {Function} callback - Callback for pattern events
   * @returns {Function} Unsubscribe function
   */
  subscribeToPatterns(callback) {
    this._listeners.patterns.push(callback);
    this._ensureWebSocket();
    return () => {
      this._listeners.patterns = this._listeners.patterns.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to resonance triggers
   * @param {Function} callback - Callback for resonance events
   * @returns {Function} Unsubscribe function
   */
  subscribeToResonance(callback) {
    this._listeners.resonance.push(callback);
    return () => {
      this._listeners.resonance = this._listeners.resonance.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to connection events
   * @param {Function} callback - Callback
   * @returns {Function} Unsubscribe function
   */
  onConnected(callback) {
    this._listeners.connected.push(callback);
    return () => {
      this._listeners.connected = this._listeners.connected.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to disconnection events
   * @param {Function} callback - Callback
   * @returns {Function} Unsubscribe function
   */
  onDisconnected(callback) {
    this._listeners.disconnected.push(callback);
    return () => {
      this._listeners.disconnected = this._listeners.disconnected.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to errors
   * @param {Function} callback - Callback
   * @returns {Function} Unsubscribe function
   */
  onError(callback) {
    this._listeners.error.push(callback);
    return () => {
      this._listeners.error = this._listeners.error.filter(cb => cb !== callback);
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // WebSocket
  // ═══════════════════════════════════════════════════════════════

  _ensureWebSocket() {
    if (!this.enableWebSocket) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    const wsUrl = this.baseUrl.replace('http', 'ws') + '/ws';
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.wsReconnectAttempts = 0;
      // Authenticate
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: this.authToken,
        user_id: this.userId,
        avatar: this.currentAvatar,
      }));
      this._emit('connected', {});
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this._handleWebSocketMessage(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    this.ws.onclose = () => {
      this._emit('disconnected', {});
      this._attemptReconnect();
    };

    this.ws.onerror = (error) => {
      this._emit('error', { type: 'websocket', error });
    };
  }

  _handleWebSocketMessage(data) {
    switch (data.type) {
      case 'narrative':
        this._emit('narrative', data.payload);
        break;
      case 'pattern':
        this._emit('patterns', data.payload);
        break;
      case 'resonance':
        this._emit('resonance', data.payload);
        break;
      case 'error':
        this._emit('error', data.payload);
        break;
    }
  }

  _attemptReconnect() {
    if (this.wsReconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnect attempts reached');
      return;
    }

    this.wsReconnectAttempts++;
    const delay = Math.pow(2, this.wsReconnectAttempts) * 1000;

    setTimeout(() => {
      this._ensureWebSocket();
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Utilities
  // ═══════════════════════════════════════════════════════════════

  async _fetch(path, options = {}) {
    const url = this.baseUrl + path;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`,
      'X-Request-ID': this._generateRequestId(),
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  _emit(event, data) {
    const listeners = this._listeners[event] || [];
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error(`Error in ${event} listener:`, e);
      }
    });
  }

  _generateSessionId() {
    return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  _generateRequestId() {
    return 'req_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}

// ═══════════════════════════════════════════════════════════════
// Factory Function
// ═══════════════════════════════════════════════════════════════

/**
 * Create a Fractal client instance
 * @param {Object} config - Configuration
 * @returns {FractalClient}
 */
function createFractalClient(config) {
  return new FractalClient(config);
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FractalClient, createFractalClient };
}
if (typeof window !== 'undefined') {
  window.FractalClient = FractalClient;
  window.createFractalClient = createFractalClient;
}

export { FractalClient, createFractalClient };
