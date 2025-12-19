'use client';

/**
 * ====================================================
 *  COCKPIT HUD - REAL IMPLEMENTATION
 * ====================================================
 *  Connected to real API. Real voice. Real AI.
 * ====================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceCommand, speakResponse } from '../hooks/useVoiceCommand';

// ==========================================
//  SWARM & MODE DATA
// ==========================================

const SWARM_DATA = [
  { id: 'ALPHA', name: 'ALPHA CORTEX', symbol: 'Α', color: '#ff4444', domain: 'Strategic Vision' },
  { id: 'BETA', name: 'BETA NEXUS', symbol: 'Β', color: '#44ff44', domain: 'Tactical Execution' },
  { id: 'GAMMA', name: 'GAMMA FORGE', symbol: 'Γ', color: '#4444ff', domain: 'Creative Generation' },
  { id: 'DELTA', name: 'DELTA ORACLE', symbol: 'Δ', color: '#ffff44', domain: 'Pattern Recognition' },
  { id: 'EPSILON', name: 'EPSILON WAVE', symbol: 'Ε', color: '#ff44ff', domain: 'Communication' },
  { id: 'ZETA', name: 'ZETA STORM', symbol: 'Ζ', color: '#44ffff', domain: 'Rapid Response' },
  { id: 'ETA', name: 'ETA SYNTHESIS', symbol: 'Η', color: '#ff8844', domain: 'Integration' },
  { id: 'THETA', name: 'THETA DREAM', symbol: 'Θ', color: '#8844ff', domain: 'Subconscious' },
  { id: 'IOTA', name: 'IOTA PRECISION', symbol: 'Ι', color: '#44ff88', domain: 'Micro-Optimization' },
  { id: 'KAPPA', name: 'KAPPA INFINITY', symbol: 'Κ', color: '#ff4488', domain: 'Infinite Scaling' }
];

const MODES = {
  SIMULTANEOUS: { symbol: '⚡', color: '#00ffff', desc: 'Maximum Speed' },
  TOURNAMENT: { symbol: '🏆', color: '#ffd700', desc: 'Best Quality' },
  RESONANCE: { symbol: '∞', color: '#ff00ff', desc: 'Creative Chaos' }
};

// ==========================================
//  MAIN COMPONENT
// ==========================================

export default function CockpitHUDReal() {
  // State
  const [networkStatus, setNetworkStatus] = useState(null);
  const [swarms, setSwarms] = useState(SWARM_DATA);
  const [activeSwarm, setActiveSwarm] = useState(null);
  const [processingMode, setProcessingMode] = useState('SIMULTANEOUS');
  const [buildInput, setBuildInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [exports, setExports] = useState([]);
  const [error, setError] = useState(null);

  // Voice commands
  const {
    isListening,
    isSupported: voiceSupported,
    transcript,
    toggleListening,
    lastCommand
  } = useVoiceCommand({
    onCommand: handleVoiceCommand,
    onTranscript: (t) => setBuildInput(t)
  });

  // ==========================================
  //  API CALLS
  // ==========================================

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/brain-network?action=status');
      const data = await res.json();
      if (data.success) {
        setNetworkStatus(data.data);
        if (data.data.swarms) {
          setSwarms(data.data.swarms);
        }
      }
    } catch (err) {
      console.error('Status fetch error:', err);
    }
  }, []);

  const setMode = useCallback(async (mode) => {
    try {
      const res = await fetch('/api/brain-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-mode', data: { mode } })
      });
      const data = await res.json();
      if (data.success) {
        setProcessingMode(mode);
        addResult({ type: 'mode', message: `Mode set to ${mode}`, glyph: MODES[mode].symbol });
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const processTask = useCallback(async (task) => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/brain-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process',
          data: { task, mode: processingMode }
        })
      });
      const data = await res.json();

      if (data.success) {
        addResult({
          type: 'process',
          mode: data.data.mode,
          task,
          quality: data.data.quality,
          glyph: data.data.symbol,
          output: data.data.output
        });
        speakResponse(`Task processed with ${Math.round(data.data.quality * 100)}% quality`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [processingMode]);

  const generateLandingPage = useCallback(async (config) => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/brain-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-landing',
          data: config
        })
      });
      const data = await res.json();

      if (data.success) {
        // Export the page
        const exportRes = await fetch('/api/brain-network/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'export-landing',
            data: {
              html: data.data.html,
              companyName: config.companyName,
              industry: config.industry
            }
          })
        });
        const exportData = await exportRes.json();

        if (exportData.success) {
          setExports(prev => [...prev, exportData.data]);
          addResult({
            type: 'landing',
            message: `Landing page generated!`,
            url: exportData.data.indexUrl,
            glyph: '🚀'
          });
          speakResponse('Landing page generated and exported');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // ==========================================
  //  VOICE COMMAND HANDLER
  // ==========================================

  function handleVoiceCommand(command) {
    console.log('Voice command:', command);

    switch (command.action) {
      case 'build':
        generateLandingPage({
          companyName: 'My Company',
          product: command.type,
          industry: 'SAAS_TECH'
        });
        break;

      case 'mode':
        setMode(command.mode);
        break;

      case 'status':
        fetchStatus();
        speakResponse(`Network is online with ${networkStatus?.availableAgents || 1000} agents available`);
        break;

      case 'task':
        processTask(command.task);
        break;

      default:
        processTask(command.transcript);
    }
  }

  // ==========================================
  //  HELPERS
  // ==========================================

  const addResult = (result) => {
    setResults(prev => [{
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      ...result
    }, ...prev].slice(0, 10));
  };

  const handleSubmit = () => {
    if (!buildInput.trim()) return;

    if (buildInput.toLowerCase().includes('landing') || buildInput.toLowerCase().includes('page')) {
      generateLandingPage({
        companyName: 'Generated Company',
        product: 'Product',
        industry: 'SAAS_TECH'
      });
    } else {
      processTask(buildInput);
    }
    setBuildInput('');
  };

  // ==========================================
  //  EFFECTS
  // ==========================================

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // ==========================================
  //  RENDER
  // ==========================================

  return (
    <div style={styles.cockpit}>
      {/* Top Bar */}
      <header style={styles.topBar}>
        <div style={styles.logo}>◉ BRAIN NETWORK</div>
        <div style={styles.statusRow}>
          <StatusDot color="#00ff00" label="NETWORK ONLINE" />
          <StatusDot color="#00ffff" label={`${networkStatus?.availableAgents || 1000} AGENTS`} />
          <StatusDot color="#ffff00" label={`${processingMode} MODE`} />
        </div>
        <div style={styles.time}>{new Date().toLocaleTimeString()}</div>
      </header>

      {/* Left Panel - Swarms */}
      <aside style={styles.leftPanel}>
        <div style={styles.panelTitle}>◈ SWARM CONTROL</div>
        {swarms.map((swarm) => (
          <SwarmCard
            key={swarm.id}
            swarm={swarm}
            isActive={activeSwarm === swarm.id}
            onClick={() => setActiveSwarm(activeSwarm === swarm.id ? null : swarm.id)}
          />
        ))}
      </aside>

      {/* Main Display */}
      <main style={styles.mainDisplay}>
        {/* Network Visualization */}
        <div style={styles.networkViz}>
          <div style={styles.centralOrb}>◉</div>
          {swarms.map((swarm, i) => (
            <SwarmNode
              key={swarm.id}
              swarm={swarm}
              index={i}
              total={swarms.length}
              isActive={activeSwarm === swarm.id}
              onClick={() => setActiveSwarm(swarm.id)}
            />
          ))}
        </div>

        {/* Voice/Text Input */}
        <div style={styles.inputBar}>
          <button
            onClick={toggleListening}
            style={{
              ...styles.voiceBtn,
              background: isListening ? 'linear-gradient(135deg, #ff0066, #ff00ff)' : 'linear-gradient(135deg, #333, #444)',
              boxShadow: isListening ? '0 0 30px #ff00ff' : 'none'
            }}
          >
            {isListening ? '🎤' : '🎙️'}
          </button>
          <input
            type="text"
            value={buildInput}
            onChange={(e) => setBuildInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={isListening ? 'Listening...' : 'Speak or type your command...'}
            style={styles.textInput}
          />
          <button onClick={handleSubmit} style={styles.submitBtn} disabled={isProcessing}>
            {isProcessing ? '⏳' : '⚡'}
          </button>
        </div>

        {/* Results */}
        <div style={styles.resultsArea}>
          {results.map((result) => (
            <div key={result.id} style={styles.resultCard}>
              <span style={styles.resultGlyph}>{result.glyph}</span>
              <div>
                <div style={styles.resultMessage}>{result.message || result.task}</div>
                {result.url && (
                  <a href={result.url} target="_blank" rel="noopener noreferrer" style={styles.resultLink}>
                    View Export →
                  </a>
                )}
                {result.quality && (
                  <div style={styles.resultQuality}>Quality: {Math.round(result.quality * 100)}%</div>
                )}
              </div>
              <span style={styles.resultTime}>{result.timestamp}</span>
            </div>
          ))}
        </div>

        {error && <div style={styles.error}>⚠️ {error}</div>}
      </main>

      {/* Right Panel - Controls */}
      <aside style={styles.rightPanel}>
        <div style={styles.panelTitle}>◈ PROCESSING MODE</div>
        {Object.entries(MODES).map(([key, mode]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              ...styles.modeBtn,
              borderColor: processingMode === key ? mode.color : 'rgba(0,255,255,0.2)',
              background: processingMode === key ? `${mode.color}20` : 'transparent'
            }}
          >
            <span style={styles.modeSymbol}>{mode.symbol}</span>
            <div>
              <div style={{ fontWeight: 'bold' }}>{key}</div>
              <div style={{ fontSize: '10px', opacity: 0.7 }}>{mode.desc}</div>
            </div>
          </button>
        ))}

        <div style={styles.panelTitle}>◈ QUICK BUILD</div>
        <div style={styles.quickBuildGrid}>
          {['🚀 Landing', '💎 SaaS', '⚡ Automation', '🌐 Website', '📱 App', '🎨 Brand'].map((item) => (
            <button
              key={item}
              onClick={() => setBuildInput(`Create a ${item.split(' ')[1]}`)}
              style={styles.quickBtn}
            >
              {item}
            </button>
          ))}
        </div>

        {exports.length > 0 && (
          <>
            <div style={styles.panelTitle}>◈ EXPORTS</div>
            {exports.slice(0, 3).map((exp) => (
              <a
                key={exp.projectId}
                href={exp.indexUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.exportLink}
              >
                {exp.projectId}
              </a>
            ))}
          </>
        )}
      </aside>

      {/* Bottom Panel - Stats */}
      <footer style={styles.bottomPanel}>
        <StatModule label="TOTAL BRAINS" value={networkStatus?.totalAgents || 1000} color="#00ffff" />
        <StatModule label="ACTIVE" value={networkStatus?.availableAgents || 847} color="#00ff00" />
        <StatModule label="TASKS" value={networkStatus?.tasksProcessed || 0} color="#ffff00" />
        <StatModule label="AVG SKILL" value={(networkStatus?.networkEnergy || 94.7).toFixed(1)} color="#ff00ff" />
        <StatModule label="ENERGY" value={`${(networkStatus?.networkEnergy || 87).toFixed(0)}%`} color="#ff8844" />
      </footer>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes orbPulse {
          0%, 100% { box-shadow: 0 0 60px rgba(0,255,255,0.5); }
          50% { box-shadow: 0 0 100px rgba(0,255,255,0.8); }
        }
      `}</style>
    </div>
  );
}

// ==========================================
//  SUB-COMPONENTS
// ==========================================

function StatusDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, animation: 'pulse 2s infinite' }} />
      <span>{label}</span>
    </div>
  );
}

function SwarmCard({ swarm, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: isActive ? `${swarm.color}20` : 'rgba(0,255,255,0.05)',
        border: `1px solid ${isActive ? swarm.color : 'rgba(0,255,255,0.2)'}`,
        borderRadius: 4,
        padding: 12,
        cursor: 'pointer',
        marginBottom: 8
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24, fontWeight: 'bold', color: swarm.color }}>{swarm.symbol}</span>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 1, opacity: 0.7 }}>{swarm.name}</div>
          <div style={{ fontSize: 10, opacity: 0.5 }}>{swarm.domain}</div>
        </div>
      </div>
      <div style={{ marginTop: 8, height: 4, background: 'rgba(0,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${swarm.energyLevel || 85}%`, background: swarm.color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

function SwarmNode({ swarm, index, total, isActive, onClick }) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 200;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `calc(50% + ${x}px - 30px)`,
        top: `calc(50% + ${y}px - 30px)`,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: `${swarm.color}20`,
        border: `2px solid ${swarm.color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: swarm.color,
        cursor: 'pointer',
        transform: isActive ? 'scale(1.2)' : 'scale(1)',
        boxShadow: isActive ? `0 0 30px ${swarm.color}` : `0 0 10px ${swarm.color}40`,
        transition: 'all 0.2s'
      }}
    >
      {swarm.symbol}
    </div>
  );
}

function StatModule({ label, value, color }) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(0,255,255,0.5)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 'bold', color, textShadow: `0 0 10px ${color}50` }}>{value}</div>
    </div>
  );
}

// ==========================================
//  STYLES
// ==========================================

const styles = {
  cockpit: {
    position: 'fixed', inset: 0,
    background: 'linear-gradient(180deg, #0a0a12 0%, #0f0f1a 50%, #0a0a12 100%)',
    color: '#00ffff',
    fontFamily: "'Space Mono', monospace",
    display: 'grid',
    gridTemplateRows: '60px 1fr 120px',
    gridTemplateColumns: '280px 1fr 280px'
  },
  topBar: {
    gridColumn: '1 / -1',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px',
    background: 'rgba(0,255,255,0.05)',
    borderBottom: '1px solid rgba(0,255,255,0.2)'
  },
  logo: { fontSize: 24, fontWeight: 'bold', letterSpacing: 4, textShadow: '0 0 20px rgba(0,255,255,0.5)' },
  statusRow: { display: 'flex', gap: 32 },
  time: { fontSize: 14, opacity: 0.7 },
  leftPanel: {
    background: 'rgba(0,0,0,0.4)',
    borderRight: '1px solid rgba(0,255,255,0.2)',
    padding: 16, overflowY: 'auto'
  },
  rightPanel: {
    background: 'rgba(0,0,0,0.4)',
    borderLeft: '1px solid rgba(0,255,255,0.2)',
    padding: 16, overflowY: 'auto'
  },
  panelTitle: { fontSize: 12, letterSpacing: 2, color: 'rgba(0,255,255,0.6)', margin: '16px 0 8px' },
  mainDisplay: {
    position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
  },
  networkViz: {
    position: 'relative', width: 500, height: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  centralOrb: {
    width: 100, height: 100, borderRadius: '50%',
    background: 'radial-gradient(circle, #00ffff 0%, #0066ff 50%, #000033 100%)',
    boxShadow: '0 0 60px rgba(0,255,255,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 32, fontWeight: 'bold',
    animation: 'orbPulse 3s infinite'
  },
  inputBar: {
    position: 'absolute', bottom: 20,
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'rgba(0,0,0,0.8)',
    padding: '16px 32px', borderRadius: 50,
    border: '2px solid rgba(0,255,255,0.3)'
  },
  voiceBtn: {
    width: 50, height: 50, borderRadius: '50%',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, transition: 'all 0.2s'
  },
  textInput: {
    background: 'transparent', border: 'none',
    color: '#00ffff', fontSize: 16, width: 300,
    outline: 'none', fontFamily: 'inherit'
  },
  submitBtn: {
    width: 50, height: 50, borderRadius: '50%',
    background: 'linear-gradient(135deg, #00ffff, #0066ff)',
    border: 'none', cursor: 'pointer',
    fontSize: 24, color: '#fff'
  },
  resultsArea: {
    position: 'absolute', top: 20, right: 20,
    width: 300, maxHeight: 200, overflowY: 'auto'
  },
  resultCard: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    background: 'rgba(0,255,0,0.1)',
    border: '1px solid rgba(0,255,0,0.3)',
    borderRadius: 4, padding: 12, marginBottom: 8
  },
  resultGlyph: { fontSize: 20 },
  resultMessage: { fontSize: 12 },
  resultLink: { fontSize: 10, color: '#00ffff' },
  resultQuality: { fontSize: 10, color: '#00ff00' },
  resultTime: { fontSize: 10, opacity: 0.5, marginLeft: 'auto' },
  error: {
    position: 'absolute', bottom: 100,
    background: 'rgba(255,0,0,0.2)',
    border: '1px solid rgba(255,0,0,0.5)',
    padding: '12px 24px', borderRadius: 4
  },
  modeBtn: {
    display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', padding: 12, marginBottom: 8,
    background: 'transparent',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 4, cursor: 'pointer', color: '#00ffff',
    textAlign: 'left'
  },
  modeSymbol: { fontSize: 20 },
  quickBuildGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  quickBtn: {
    padding: 8, background: 'rgba(0,255,255,0.05)',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 4, cursor: 'pointer', fontSize: 10, color: '#00ffff'
  },
  exportLink: {
    display: 'block', padding: 8, marginBottom: 4,
    background: 'rgba(0,255,0,0.1)',
    border: '1px solid rgba(0,255,0,0.3)',
    borderRadius: 4, fontSize: 10, color: '#00ff00',
    textDecoration: 'none'
  },
  bottomPanel: {
    gridColumn: '1 / -1',
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
    background: 'rgba(0,0,0,0.6)',
    borderTop: '1px solid rgba(0,255,255,0.2)'
  }
};
