/**
 * ====================================================
 *  BRAIN NETWORK CLIENT - FRONTEND SDK
 * ====================================================
 *  Connect to the Brain Network from any React component
 * ====================================================
 */

const API_BASE = '/api/brain-network';

/**
 * BrainNetworkClient - Frontend interface to the Brain Network
 */
class BrainNetworkClient {
  constructor() {
    this.isConnected = false;
    this.status = null;
    this.listeners = new Map();
    this.pollingInterval = null;
  }

  // ==========================================
  //  CONNECTION
  // ==========================================

  async connect() {
    try {
      const status = await this.getStatus();
      this.isConnected = true;
      this.status = status;
      this._startPolling();
      this._emit('connected', status);
      return status;
    } catch (error) {
      this._emit('error', error);
      throw error;
    }
  }

  disconnect() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isConnected = false;
    this._emit('disconnected');
  }

  _startPolling(interval = 1000) {
    this.pollingInterval = setInterval(async () => {
      try {
        const status = await this.getStatus();
        this.status = status;
        this._emit('status', status);
      } catch (error) {
        this._emit('error', error);
      }
    }, interval);
  }

  // ==========================================
  //  API METHODS
  // ==========================================

  async getStatus() {
    const response = await fetch(`${API_BASE}?action=status`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  }

  async getSwarms() {
    const response = await fetch(`${API_BASE}?action=swarms`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  }

  async getProjects() {
    const response = await fetch(`${API_BASE}?action=projects`);
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  }

  async setMode(mode) {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set-mode', data: { mode } })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    this._emit('mode-changed', mode);
    return data;
  }

  // ==========================================
  //  PROCESSING METHODS
  // ==========================================

  async process(task, mode = 'SIMULTANEOUS') {
    this._emit('processing-started', { task, mode });

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'process',
        data: { task, mode }
      })
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);

    this._emit('processing-completed', data.data);
    return data.data;
  }

  async processWithAI(task, options = {}) {
    const { mode = 'SIMULTANEOUS', taskType = 'general', context = {} } = options;

    this._emit('ai-processing-started', { task, mode, taskType });

    const response = await fetch(`${API_BASE}/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, mode, taskType, context })
    });

    const data = await response.json();

    if (data.fallback) {
      this._emit('ai-fallback', data.message);
    }

    if (!data.success) throw new Error(data.error);

    this._emit('ai-processing-completed', data.data);
    return data.data;
  }

  // ==========================================
  //  BUILD METHODS
  // ==========================================

  async build(input, options = {}) {
    this._emit('build-started', { input, options });

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'build',
        data: { input, ...options }
      })
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);

    this._emit('build-completed', data.data);
    return data.data;
  }

  async generateLandingPage(config) {
    this._emit('landing-page-started', config);

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate-landing',
        data: config
      })
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.error);

    this._emit('landing-page-completed', data.data);
    return data.data;
  }

  // ==========================================
  //  QUICK METHODS
  // ==========================================

  async quickBuild(type) {
    return this.build(`Create a ${type}`);
  }

  async quickLandingPage(companyName, product) {
    return this.generateLandingPage({ companyName, product });
  }

  // ==========================================
  //  EVENT SYSTEM
  // ==========================================

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  _emit(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event handler error for ${event}:`, error);
        }
      }
    }
  }
}

// Export singleton instance
export const brainNetwork = new BrainNetworkClient();

// Export class for custom instances
export { BrainNetworkClient };

// React hook for easy integration
export function useBrainNetwork() {
  const [status, setStatus] = React.useState(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleStatus = (data) => setStatus(data);
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    const handleError = (err) => setError(err);

    brainNetwork.on('status', handleStatus);
    brainNetwork.on('connected', handleConnected);
    brainNetwork.on('disconnected', handleDisconnected);
    brainNetwork.on('error', handleError);

    // Connect on mount
    brainNetwork.connect().catch(setError);

    return () => {
      brainNetwork.off('status', handleStatus);
      brainNetwork.off('connected', handleConnected);
      brainNetwork.off('disconnected', handleDisconnected);
      brainNetwork.off('error', handleError);
    };
  }, []);

  return {
    status,
    isConnected,
    error,
    process: brainNetwork.process.bind(brainNetwork),
    processWithAI: brainNetwork.processWithAI.bind(brainNetwork),
    build: brainNetwork.build.bind(brainNetwork),
    generateLandingPage: brainNetwork.generateLandingPage.bind(brainNetwork),
    setMode: brainNetwork.setMode.bind(brainNetwork)
  };
}
