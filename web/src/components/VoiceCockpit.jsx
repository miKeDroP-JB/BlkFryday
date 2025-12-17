/**
 * VFLOW VOICE COCKPIT - React Frontend
 * The voice-first UI that connects to all 0RB systems
 *
 * "Correctness first. Speed second."
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Brain server configuration
const BRAIN_HTTP = process.env.NEXT_PUBLIC_BRAIN_URL || 'http://localhost:8420';
const BRAIN_WS = process.env.NEXT_PUBLIC_BRAIN_WS || 'ws://localhost:8421';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_BRAIN_TOKEN || 'orb-brain-default-token';

// VFlow phases with visual states
const PHASES = {
  idle: { label: 'IDLE', color: '#666', icon: '○' },
  understand: { label: 'UNDERSTANDING', color: '#3498db', icon: '◐' },
  plan: { label: 'PLANNING', color: '#9b59b6', icon: '◑' },
  solve: { label: 'SOLVING', color: '#e67e22', icon: '◒' },
  verify: { label: 'VERIFYING', color: '#2ecc71', icon: '◓' },
  verified: { label: 'VERIFIED', color: '#00ff00', icon: '●' },
  failed: { label: 'FAILED', color: '#e74c3c', icon: '✗' },
  paused: { label: 'PAUSED', color: '#f1c40f', icon: '⏸' }
};

// Available systems
const SYSTEMS = [
  { id: 'vflow', name: 'VFlow', icon: '◉', color: '#00ffff', desc: 'Verified Cognition' },
  { id: 'arc', name: 'ARC', icon: '∞', color: '#9b59b6', desc: 'Pattern Reasoning' },
  { id: 'agents', name: 'Agents', icon: '⚡', color: '#ffd700', desc: 'The Pantheon' },
  { id: 'games', name: 'Games', icon: '🎮', color: '#e74c3c', desc: 'Reality Games' },
  { id: 'quantum', name: 'Quantum', icon: '⚛', color: '#3498db', desc: 'Probability Fields' },
  { id: 'genesis', name: 'Genesis', icon: '✦', color: '#2ecc71', desc: 'Creation Engine' },
  { id: 'copa', name: 'Copa', icon: '🤝', color: '#e67e22', desc: 'Augmentation' }
];

export default function VoiceCockpit() {
  // Connection state
  const [connected, setConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);

  // VFlow state
  const [hud, setHud] = useState({
    phase: 'idle',
    confidence: 0,
    retries: 0,
    adaptations: 0,
    currentStrategy: null,
    message: 'System ready'
  });
  const [atlas, setAtlas] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [timeline, setTimeline] = useState([]);

  // Input state
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Active panel
  const [activePanel, setActivePanel] = useState('hud');

  // Refs
  const wsRef = useRef(null);
  const inputRef = useRef(null);
  const historyRef = useRef(null);

  // Fetch system status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BRAIN_HTTP}/status`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      const data = await res.json();
      setSystemStatus(data);
      setConnected(true);
    } catch (e) {
      setConnected(false);
      console.error('Failed to connect to Brain:', e);
    }
  }, []);

  // Fetch HUD state
  const fetchHUD = useCallback(async () => {
    try {
      const res = await fetch(`${BRAIN_HTTP}/vflow/hud`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      const data = await res.json();
      if (data.hud) setHud(data.hud);
    } catch (e) {
      console.error('Failed to fetch HUD:', e);
    }
  }, []);

  // Fetch Atlas
  const fetchAtlas = useCallback(async () => {
    try {
      const res = await fetch(`${BRAIN_HTTP}/vflow/atlas`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      const data = await res.json();
      if (data.atlas) setAtlas(data.atlas);
    } catch (e) {
      console.error('Failed to fetch Atlas:', e);
    }
  }, []);

  // Fetch Metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${BRAIN_HTTP}/vflow/metrics`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      const data = await res.json();
      if (data.metrics) setMetrics(data.metrics);
    } catch (e) {
      console.error('Failed to fetch metrics:', e);
    }
  }, []);

  // Connect WebSocket
  useEffect(() => {
    const connectWS = () => {
      try {
        const ws = new WebSocket(BRAIN_WS);

        ws.onopen = () => {
          console.log('WebSocket connected to Brain');
          setWsConnected(true);
          // Subscribe to VFlow channels
          ws.send(JSON.stringify({ type: 'subscribe', payload: { channel: 'vflow:hud' } }));
          ws.send(JSON.stringify({ type: 'subscribe', payload: { channel: 'vflow:state' } }));
          ws.send(JSON.stringify({ type: 'subscribe', payload: { channel: 'vflow:verified' } }));
        };

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);

          if (msg.type === 'broadcast') {
            switch (msg.channel) {
              case 'vflow:hud':
                setHud(msg.data);
                break;
              case 'vflow:state':
                addToHistory({ type: 'state', data: msg.data });
                break;
              case 'vflow:verified':
                addToHistory({ type: 'verified', data: msg.data });
                break;
            }
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          // Reconnect after 3s
          setTimeout(connectWS, 3000);
        };

        ws.onerror = (e) => {
          console.error('WebSocket error:', e);
        };

        wsRef.current = ws;
      } catch (e) {
        console.error('WebSocket connection failed:', e);
      }
    };

    fetchStatus();
    connectWS();

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchStatus]);

  // Initial data fetch
  useEffect(() => {
    if (connected) {
      fetchHUD();
      fetchAtlas();
      fetchMetrics();
    }
  }, [connected, fetchHUD, fetchAtlas, fetchMetrics]);

  // Add to history
  const addToHistory = (entry) => {
    setHistory(prev => [...prev, { ...entry, timestamp: Date.now() }].slice(-100));
  };

  // Send voice input
  const sendVoice = async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    addToHistory({ type: 'input', text: input });

    try {
      const res = await fetch(`${BRAIN_HTTP}/vflow/voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input: input.trim() })
      });

      const data = await res.json();

      if (data.success) {
        addToHistory({ type: 'response', data: data.result });
        if (data.hud) setHud(data.hud);
      } else {
        addToHistory({ type: 'error', text: data.error || 'Unknown error' });
      }
    } catch (e) {
      addToHistory({ type: 'error', text: e.message });
    }

    setInput('');
    setIsProcessing(false);
    inputRef.current?.focus();
  };

  // Control functions
  const sendControl = async (action) => {
    try {
      const res = await fetch(`${BRAIN_HTTP}/vflow/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      const data = await res.json();
      addToHistory({ type: 'control', action, result: data });
      fetchHUD();
    } catch (e) {
      addToHistory({ type: 'error', text: `Control ${action} failed: ${e.message}` });
    }
  };

  // Solve problem
  const solveProblem = async (problem) => {
    setIsProcessing(true);
    addToHistory({ type: 'solve', problem });

    try {
      const res = await fetch(`${BRAIN_HTTP}/vflow/solve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ problem })
      });

      const data = await res.json();
      addToHistory({ type: 'result', data });
    } catch (e) {
      addToHistory({ type: 'error', text: e.message });
    }

    setIsProcessing(false);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendVoice();
    }
  };

  // Scroll history to bottom
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  const phaseConfig = PHASES[hud.phase] || PHASES.idle;

  return (
    <div className="vflow-cockpit">
      {/* Header */}
      <header className="cockpit-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">◉</span>
            <span className="logo-text">VFLOW</span>
          </div>
          <span className="version">v1.0</span>
        </div>

        <div className="header-center">
          <div className="phase-indicator" style={{ '--phase-color': phaseConfig.color }}>
            <span className="phase-icon">{phaseConfig.icon}</span>
            <span className="phase-label">{phaseConfig.label}</span>
          </div>
        </div>

        <div className="header-right">
          <div className={`connection-status ${connected ? 'online' : 'offline'}`}>
            <span className="status-dot" />
            <span>{connected ? 'BRAIN ONLINE' : 'DISCONNECTED'}</span>
          </div>
          <div className={`ws-status ${wsConnected ? 'online' : 'offline'}`}>
            <span className="status-dot" />
            <span>WS</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="cockpit-body">
        {/* Left Panel - Systems */}
        <nav className="systems-panel">
          <div className="panel-title">SYSTEMS</div>
          {SYSTEMS.map(sys => (
            <button
              key={sys.id}
              className={`system-btn ${systemStatus?.systems?.[sys.id] ? 'active' : 'inactive'}`}
              style={{ '--sys-color': sys.color }}
              title={`${sys.name}: ${sys.desc}`}
            >
              <span className="sys-icon">{sys.icon}</span>
              <span className="sys-name">{sys.name}</span>
              <span className="sys-status">{systemStatus?.systems?.[sys.id] ? '●' : '○'}</span>
            </button>
          ))}
        </nav>

        {/* Center - Main HUD */}
        <main className="main-hud">
          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-label">CONFIDENCE</span>
              <div className="stat-bar">
                <div
                  className="stat-fill confidence"
                  style={{ width: `${(hud.confidence || 0) * 100}%` }}
                />
              </div>
              <span className="stat-value">{((hud.confidence || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">RETRIES</span>
              <span className="stat-value">{hud.retries || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">ADAPTATIONS</span>
              <span className="stat-value">{hud.adaptations || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">STRATEGY</span>
              <span className="stat-value">{hud.currentStrategy || 'none'}</span>
            </div>
          </div>

          {/* Phase Display */}
          <div className="phase-display" style={{ '--phase-color': phaseConfig.color }}>
            <div className="phase-ring">
              <div className="phase-inner">
                <span className="phase-big-icon">{phaseConfig.icon}</span>
                <span className="phase-name">{phaseConfig.label}</span>
              </div>
            </div>
            <p className="phase-message">{hud.message || 'Ready for input'}</p>
          </div>

          {/* History/Log */}
          <div className="history-panel" ref={historyRef}>
            {history.map((entry, i) => (
              <div key={i} className={`history-entry ${entry.type}`}>
                <span className="entry-time">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                {entry.type === 'input' && (
                  <span className="entry-text">&gt; {entry.text}</span>
                )}
                {entry.type === 'response' && (
                  <span className="entry-text">← {JSON.stringify(entry.data)}</span>
                )}
                {entry.type === 'error' && (
                  <span className="entry-error">✗ {entry.text}</span>
                )}
                {entry.type === 'control' && (
                  <span className="entry-control">[{entry.action}] {JSON.stringify(entry.result)}</span>
                )}
                {entry.type === 'state' && (
                  <span className="entry-state">◐ {entry.data?.from} → {entry.data?.to}</span>
                )}
                {entry.type === 'verified' && (
                  <span className="entry-verified">✓ VERIFIED: {JSON.stringify(entry.data)}</span>
                )}
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="input-area">
            <input
              ref={inputRef}
              type="text"
              className="voice-input"
              placeholder="Speak to the system..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isProcessing}
            />
            <button
              className="send-btn"
              onClick={sendVoice}
              disabled={isProcessing || !input.trim()}
            >
              {isProcessing ? '...' : '►'}
            </button>
          </div>
        </main>

        {/* Right Panel - Controls & Atlas */}
        <aside className="control-panel">
          <div className="panel-title">CONTROLS</div>

          <div className="control-grid">
            <button className="ctrl-btn pause" onClick={() => sendControl('pause')}>
              ⏸ PAUSE
            </button>
            <button className="ctrl-btn resume" onClick={() => sendControl('resume')}>
              ▶ RESUME
            </button>
            <button className="ctrl-btn stop" onClick={() => sendControl('stop')}>
              ■ STOP
            </button>
            <button className="ctrl-btn reset" onClick={() => sendControl('reset')}>
              ↻ RESET
            </button>
          </div>

          <div className="panel-title">ATLAS</div>
          <div className="atlas-preview">
            {atlas ? (
              <div className="atlas-stats">
                <div className="atlas-stat">
                  <span>Nodes</span>
                  <span>{atlas.nodeCount || 0}</span>
                </div>
                <div className="atlas-stat">
                  <span>Edges</span>
                  <span>{atlas.edgeCount || 0}</span>
                </div>
                <div className="atlas-stat">
                  <span>Domains</span>
                  <span>{atlas.domainCount || 0}</span>
                </div>
              </div>
            ) : (
              <div className="atlas-empty">No atlas data</div>
            )}
          </div>

          <div className="panel-title">METRICS</div>
          <div className="metrics-preview">
            {metrics ? (
              <div className="metrics-list">
                <div className="metric-item">
                  <span>Total Solves</span>
                  <span>{metrics.totalSolves || 0}</span>
                </div>
                <div className="metric-item">
                  <span>Success Rate</span>
                  <span>{((metrics.successRate || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="metric-item">
                  <span>Avg Retries</span>
                  <span>{(metrics.avgRetries || 0).toFixed(1)}</span>
                </div>
              </div>
            ) : (
              <div className="metrics-empty">No metrics yet</div>
            )}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="cockpit-footer">
        <div className="footer-left">
          <span className="footer-status">
            <span className={`indicator ${connected ? 'online' : 'offline'}`} />
            {systemStatus?.version || '---'} {systemStatus?.codename || ''}
          </span>
        </div>
        <div className="footer-center">
          VERIFIED COGNITION SYSTEM
        </div>
        <div className="footer-right">
          "Correctness first. Speed second."
        </div>
      </footer>

      <style jsx>{`
        .vflow-cockpit {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0a0a0f;
          color: #fff;
          font-family: 'Rajdhani', 'Segoe UI', sans-serif;
          overflow: hidden;
        }

        /* Header */
        .cockpit-header {
          height: 50px;
          background: linear-gradient(180deg, #15151f, #0a0a0f);
          border-bottom: 1px solid #1a1a2e;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
        }

        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-icon {
          font-size: 1.5rem;
          color: #00ffff;
          text-shadow: 0 0 10px #00ffff;
        }

        .logo-text {
          font-family: 'Orbitron', monospace;
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: 0.2em;
        }

        .version {
          font-size: 0.75rem;
          color: #666;
        }

        .phase-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: rgba(var(--phase-color), 0.1);
          border: 1px solid var(--phase-color);
          border-radius: 20px;
        }

        .phase-icon {
          color: var(--phase-color);
          font-size: 1rem;
        }

        .phase-label {
          font-family: 'Orbitron', monospace;
          font-size: 0.85rem;
          color: var(--phase-color);
        }

        .connection-status, .ws-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #666;
        }

        .connection-status.online .status-dot,
        .ws-status.online .status-dot {
          background: #2ecc71;
          box-shadow: 0 0 8px #2ecc71;
        }

        .connection-status.offline .status-dot,
        .ws-status.offline .status-dot {
          background: #e74c3c;
        }

        /* Body */
        .cockpit-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        /* Systems Panel */
        .systems-panel {
          width: 140px;
          background: #12121a;
          border-right: 1px solid #1a1a2e;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .panel-title {
          font-family: 'Orbitron', monospace;
          font-size: 0.7rem;
          color: #666;
          letter-spacing: 0.15em;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #1a1a2e;
        }

        .system-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: transparent;
          border: 1px solid #1a1a2e;
          border-radius: 6px;
          color: #888;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .system-btn:hover {
          background: #1a1a2e;
        }

        .system-btn.active {
          border-color: var(--sys-color);
          color: var(--sys-color);
        }

        .system-btn.active .sys-status {
          color: #2ecc71;
        }

        .sys-icon {
          font-size: 1rem;
        }

        .sys-name {
          flex: 1;
          font-size: 0.8rem;
        }

        .sys-status {
          font-size: 0.6rem;
        }

        /* Main HUD */
        .main-hud {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 16px;
          gap: 16px;
          overflow: hidden;
        }

        .stats-bar {
          display: flex;
          gap: 24px;
          padding: 12px 16px;
          background: #12121a;
          border: 1px solid #1a1a2e;
          border-radius: 8px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 0.65rem;
          color: #666;
          letter-spacing: 0.1em;
        }

        .stat-value {
          font-family: 'Orbitron', monospace;
          font-size: 0.9rem;
          color: #00ffff;
        }

        .stat-bar {
          width: 100px;
          height: 4px;
          background: #1a1a2e;
          border-radius: 2px;
          overflow: hidden;
        }

        .stat-fill {
          height: 100%;
          transition: width 0.3s;
        }

        .stat-fill.confidence {
          background: linear-gradient(90deg, #e74c3c, #f1c40f, #2ecc71);
        }

        /* Phase Display */
        .phase-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
        }

        .phase-ring {
          width: 120px;
          height: 120px;
          border: 2px solid var(--phase-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(var(--phase-color), 0.3);
          animation: pulse-ring 2s infinite;
        }

        .phase-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .phase-big-icon {
          font-size: 2.5rem;
          color: var(--phase-color);
        }

        .phase-name {
          font-family: 'Orbitron', monospace;
          font-size: 0.8rem;
          color: var(--phase-color);
        }

        .phase-message {
          margin-top: 16px;
          color: #888;
          font-size: 0.9rem;
        }

        /* History */
        .history-panel {
          flex: 1;
          background: #0d0d12;
          border: 1px solid #1a1a2e;
          border-radius: 8px;
          padding: 12px;
          overflow-y: auto;
          font-family: 'Space Mono', monospace;
          font-size: 0.8rem;
        }

        .history-entry {
          padding: 4px 0;
          border-bottom: 1px solid #1a1a2e;
        }

        .entry-time {
          color: #444;
          margin-right: 8px;
        }

        .entry-text {
          color: #888;
        }

        .history-entry.input .entry-text {
          color: #00ffff;
        }

        .history-entry.response .entry-text {
          color: #2ecc71;
        }

        .entry-error {
          color: #e74c3c;
        }

        .entry-control {
          color: #f1c40f;
        }

        .entry-state {
          color: #9b59b6;
        }

        .entry-verified {
          color: #2ecc71;
          font-weight: bold;
        }

        /* Input Area */
        .input-area {
          display: flex;
          gap: 8px;
        }

        .voice-input {
          flex: 1;
          padding: 12px 16px;
          background: #12121a;
          border: 1px solid #1a1a2e;
          border-radius: 8px;
          color: #fff;
          font-family: 'Rajdhani', sans-serif;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .voice-input:focus {
          border-color: #00ffff;
        }

        .voice-input::placeholder {
          color: #444;
        }

        .send-btn {
          width: 50px;
          background: #00ffff;
          border: none;
          border-radius: 8px;
          color: #0a0a0f;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Control Panel */
        .control-panel {
          width: 180px;
          background: #12121a;
          border-left: 1px solid #1a1a2e;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .control-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .ctrl-btn {
          padding: 10px;
          background: transparent;
          border: 1px solid #1a1a2e;
          border-radius: 6px;
          color: #888;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ctrl-btn:hover {
          background: #1a1a2e;
        }

        .ctrl-btn.pause:hover { border-color: #f1c40f; color: #f1c40f; }
        .ctrl-btn.resume:hover { border-color: #2ecc71; color: #2ecc71; }
        .ctrl-btn.stop:hover { border-color: #e74c3c; color: #e74c3c; }
        .ctrl-btn.reset:hover { border-color: #3498db; color: #3498db; }

        .atlas-preview, .metrics-preview {
          background: #0d0d12;
          border: 1px solid #1a1a2e;
          border-radius: 6px;
          padding: 10px;
        }

        .atlas-stats, .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .atlas-stat, .metric-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
        }

        .atlas-stat span:first-child,
        .metric-item span:first-child {
          color: #666;
        }

        .atlas-stat span:last-child,
        .metric-item span:last-child {
          color: #00ffff;
          font-family: 'Orbitron', monospace;
        }

        .atlas-empty, .metrics-empty {
          color: #444;
          font-size: 0.75rem;
          text-align: center;
          padding: 10px;
        }

        /* Footer */
        .cockpit-footer {
          height: 28px;
          background: #12121a;
          border-top: 1px solid #1a1a2e;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          font-size: 0.7rem;
          color: #444;
        }

        .footer-left, .footer-center, .footer-right {
          flex: 1;
        }

        .footer-center {
          text-align: center;
          font-family: 'Orbitron', monospace;
          letter-spacing: 0.1em;
        }

        .footer-right {
          text-align: right;
          color: #00ffff;
          font-style: italic;
        }

        .footer-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .indicator.online {
          background: #2ecc71;
        }

        .indicator.offline {
          background: #e74c3c;
        }

        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.2); }
          50% { box-shadow: 0 0 40px rgba(0, 255, 255, 0.4); }
        }
      `}</style>
    </div>
  );
}
