/**
 * ====================================================
 *  COCKPIT HUD - FIGHTER PILOT COMMAND CENTER
 * ====================================================
 *  "Control the entire Brain Network from your cockpit."
 *
 *  Features:
 *  - Real-time brain network visualization
 *  - Multi-control panels
 *  - 3D overlay system
 *  - Live data streams
 *  - Voice command integration
 *  - Swarm status indicators
 *
 *  @created November 25, 2024
 *  @version 1.0.0 - THE PILOT AWAKENS
 * ====================================================
 */

import React, { useState, useEffect, useRef } from 'react';

// ==========================================
//  CONSTANTS
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

const PROCESSING_MODES = {
  SIMULTANEOUS: { name: 'SIMULTANEOUS', symbol: '⚡', color: '#00ffff', description: 'Maximum Speed' },
  TOURNAMENT: { name: 'TOURNAMENT', symbol: '🏆', color: '#ffd700', description: 'Best Quality' },
  RESONANCE: { name: 'RESONANCE', symbol: '∞', color: '#ff00ff', description: 'Creative Chaos' }
};

// ==========================================
//  STYLES
// ==========================================

const styles = {
  cockpit: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, #0a0a12 0%, #0f0f1a 50%, #0a0a12 100%)',
    color: '#00ffff',
    fontFamily: "'Space Mono', 'Courier New', monospace",
    overflow: 'hidden',
    display: 'grid',
    gridTemplateRows: '60px 1fr 200px',
    gridTemplateColumns: '280px 1fr 280px'
  },

  // Top Bar
  topBar: {
    gridColumn: '1 / -1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    background: 'rgba(0, 255, 255, 0.05)',
    borderBottom: '1px solid rgba(0, 255, 255, 0.2)'
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    letterSpacing: '4px',
    color: '#00ffff',
    textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
  },
  systemStatus: {
    display: 'flex',
    gap: '32px',
    fontSize: '12px'
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },

  // Left Panel - Swarm Control
  leftPanel: {
    background: 'rgba(0, 0, 0, 0.4)',
    borderRight: '1px solid rgba(0, 255, 255, 0.2)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto'
  },
  panelTitle: {
    fontSize: '12px',
    letterSpacing: '2px',
    color: 'rgba(0, 255, 255, 0.6)',
    marginBottom: '8px',
    textTransform: 'uppercase'
  },
  swarmCard: {
    background: 'rgba(0, 255, 255, 0.05)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    borderRadius: '4px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  swarmSymbol: {
    fontSize: '24px',
    fontWeight: 'bold'
  },
  swarmName: {
    fontSize: '10px',
    letterSpacing: '1px',
    opacity: 0.7
  },
  swarmStats: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
    fontSize: '10px'
  },
  energyBar: {
    height: '4px',
    background: 'rgba(0, 255, 255, 0.2)',
    borderRadius: '2px',
    marginTop: '8px',
    overflow: 'hidden'
  },
  energyFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s'
  },

  // Main Display
  mainDisplay: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  networkVisualization: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    border: '2px solid rgba(0, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  centralOrb: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #00ffff 0%, #0066ff 50%, #000033 100%)',
    boxShadow: '0 0 60px rgba(0, 255, 255, 0.5), inset 0 0 40px rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    animation: 'orbPulse 3s infinite'
  },
  swarmNode: {
    position: 'absolute',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '2px solid'
  },
  connectionLine: {
    position: 'absolute',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent)',
    transformOrigin: 'left center'
  },

  // Right Panel - Build Control
  rightPanel: {
    background: 'rgba(0, 0, 0, 0.4)',
    borderLeft: '1px solid rgba(0, 255, 255, 0.2)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  modeSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  modeButton: {
    padding: '12px',
    background: 'rgba(0, 255, 255, 0.05)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#00ffff'
  },
  modeSymbol: {
    fontSize: '20px'
  },
  buildTypes: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px'
  },
  buildTypeBtn: {
    padding: '8px',
    background: 'rgba(0, 255, 255, 0.05)',
    border: '1px solid rgba(0, 255, 255, 0.2)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '10px',
    color: '#00ffff',
    textAlign: 'center',
    transition: 'all 0.2s'
  },

  // Bottom Panel - Data Streams
  bottomPanel: {
    gridColumn: '1 / -1',
    background: 'rgba(0, 0, 0, 0.6)',
    borderTop: '1px solid rgba(0, 255, 255, 0.2)',
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '1px',
    padding: '1px'
  },
  dataModule: {
    background: 'rgba(0, 255, 255, 0.02)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column'
  },
  dataLabel: {
    fontSize: '10px',
    letterSpacing: '2px',
    color: 'rgba(0, 255, 255, 0.5)',
    marginBottom: '8px'
  },
  dataValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#00ffff',
    textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
  },
  dataChart: {
    marginTop: 'auto',
    height: '40px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '2px'
  },
  chartBar: {
    flex: 1,
    background: 'rgba(0, 255, 255, 0.3)',
    borderRadius: '2px 2px 0 0',
    transition: 'height 0.3s'
  },

  // Voice Input
  voiceInput: {
    position: 'absolute',
    bottom: '220px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'rgba(0, 0, 0, 0.8)',
    padding: '16px 32px',
    borderRadius: '50px',
    border: '2px solid rgba(0, 255, 255, 0.3)'
  },
  voiceButton: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ff0066, #ff00ff)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  textInput: {
    background: 'transparent',
    border: 'none',
    color: '#00ffff',
    fontSize: '16px',
    width: '300px',
    outline: 'none',
    fontFamily: 'inherit'
  },

  // Alerts
  alertZone: {
    position: 'absolute',
    top: '80px',
    right: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  alert: {
    padding: '12px 24px',
    background: 'rgba(0, 255, 0, 0.1)',
    border: '1px solid rgba(0, 255, 0, 0.3)',
    borderRadius: '4px',
    fontSize: '12px',
    animation: 'slideIn 0.3s'
  },

  // HUD Overlays
  hudCorner: {
    position: 'absolute',
    width: '100px',
    height: '100px',
    border: '2px solid rgba(0, 255, 255, 0.2)',
    pointerEvents: 'none'
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent)',
    animation: 'scanline 4s linear infinite',
    pointerEvents: 'none'
  }
};

// ==========================================
//  COMPONENT
// ==========================================

const CockpitHUD = () => {
  const [activeSwarm, setActiveSwarm] = useState(null);
  const [processingMode, setProcessingMode] = useState('SIMULTANEOUS');
  const [buildInput, setBuildInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    totalAgents: 1000,
    activeAgents: 847,
    tasksProcessed: 0,
    avgSkill: 94.7,
    networkEnergy: 87
  });
  const [swarmEnergies, setSwarmEnergies] = useState(
    SWARM_DATA.reduce((acc, s) => ({ ...acc, [s.id]: 80 + Math.random() * 20 }), {})
  );
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState(Array(20).fill(0).map(() => Math.random() * 100));

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update swarm energies with staggered regeneration
      setSwarmEnergies(prev => {
        const updated = { ...prev };
        SWARM_DATA.forEach((swarm, index) => {
          const phase = (Date.now() / 1000) % 10;
          const isActive = Math.abs(phase - index) < 2;
          if (isActive) {
            updated[swarm.id] = Math.min(100, prev[swarm.id] + 2);
          } else {
            updated[swarm.id] = Math.max(50, prev[swarm.id] - 0.5);
          }
        });
        return updated;
      });

      // Update chart data
      setChartData(prev => {
        const newData = [...prev.slice(1), Math.random() * 100];
        return newData;
      });

      // Update network stats
      setNetworkStats(prev => ({
        ...prev,
        activeAgents: 800 + Math.floor(Math.random() * 200),
        tasksProcessed: prev.tasksProcessed + Math.floor(Math.random() * 10),
        networkEnergy: 80 + Math.random() * 20
      }));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Calculate swarm node positions
  const getSwarmPosition = (index, total) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = 240;
    return {
      left: `calc(50% + ${Math.cos(angle) * radius}px - 30px)`,
      top: `calc(50% + ${Math.sin(angle) * radius}px - 30px)`
    };
  };

  // Handle build submission
  const handleBuild = () => {
    if (!buildInput.trim()) return;

    setAlerts(prev => [...prev, {
      id: Date.now(),
      message: `Building: ${buildInput}`,
      type: 'info'
    }]);

    // Clear input
    setBuildInput('');

    // Remove alert after 3 seconds
    setTimeout(() => {
      setAlerts(prev => prev.slice(1));
    }, 3000);
  };

  return (
    <div style={styles.cockpit}>
      {/* Scanline Effect */}
      <div style={styles.scanline} />

      {/* HUD Corner Brackets */}
      <div style={{ ...styles.hudCorner, top: 70, left: 10, borderRight: 'none', borderBottom: 'none' }} />
      <div style={{ ...styles.hudCorner, top: 70, right: 10, borderLeft: 'none', borderBottom: 'none' }} />
      <div style={{ ...styles.hudCorner, bottom: 210, left: 10, borderRight: 'none', borderTop: 'none' }} />
      <div style={{ ...styles.hudCorner, bottom: 210, right: 10, borderLeft: 'none', borderTop: 'none' }} />

      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.logo}>◉ BRAIN NETWORK</div>
        <div style={styles.systemStatus}>
          <div style={styles.statusItem}>
            <div style={{ ...styles.statusDot, background: '#00ff00' }} />
            <span>NETWORK ACTIVE</span>
          </div>
          <div style={styles.statusItem}>
            <div style={{ ...styles.statusDot, background: '#00ffff' }} />
            <span>1000 BRAINS ONLINE</span>
          </div>
          <div style={styles.statusItem}>
            <div style={{ ...styles.statusDot, background: '#ffff00' }} />
            <span>{processingMode} MODE</span>
          </div>
        </div>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Left Panel - Swarm Control */}
      <div style={styles.leftPanel}>
        <div style={styles.panelTitle}>◈ SWARM CONTROL</div>
        {SWARM_DATA.map((swarm) => (
          <div
            key={swarm.id}
            style={{
              ...styles.swarmCard,
              borderColor: activeSwarm === swarm.id ? swarm.color : 'rgba(0, 255, 255, 0.2)',
              background: activeSwarm === swarm.id ? `${swarm.color}20` : 'rgba(0, 255, 255, 0.05)'
            }}
            onClick={() => setActiveSwarm(activeSwarm === swarm.id ? null : swarm.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ ...styles.swarmSymbol, color: swarm.color }}>{swarm.symbol}</span>
              <div>
                <div style={styles.swarmName}>{swarm.name}</div>
                <div style={{ fontSize: '10px', opacity: 0.5 }}>{swarm.domain}</div>
              </div>
            </div>
            <div style={styles.swarmStats}>
              <span>100 BRAINS</span>
              <span style={{ color: swarm.color }}>{Math.round(swarmEnergies[swarm.id])}%</span>
            </div>
            <div style={styles.energyBar}>
              <div
                style={{
                  ...styles.energyFill,
                  width: `${swarmEnergies[swarm.id]}%`,
                  background: swarm.color
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Main Display */}
      <div style={styles.mainDisplay}>
        {/* Network Visualization */}
        <div style={styles.networkVisualization}>
          {/* Connection Lines */}
          {SWARM_DATA.map((swarm, index) => {
            const angle = (index / SWARM_DATA.length) * 2 * Math.PI - Math.PI / 2;
            const length = 180;
            return (
              <div
                key={`line-${swarm.id}`}
                style={{
                  ...styles.connectionLine,
                  width: `${length}px`,
                  transform: `rotate(${angle}rad)`,
                  opacity: activeSwarm === swarm.id ? 1 : 0.3
                }}
              />
            );
          })}

          {/* Central Orb */}
          <div style={styles.centralOrb}>
            ◉
          </div>

          {/* Swarm Nodes */}
          {SWARM_DATA.map((swarm, index) => (
            <div
              key={swarm.id}
              style={{
                ...styles.swarmNode,
                ...getSwarmPosition(index, SWARM_DATA.length),
                background: `${swarm.color}20`,
                borderColor: swarm.color,
                color: swarm.color,
                boxShadow: activeSwarm === swarm.id
                  ? `0 0 30px ${swarm.color}`
                  : `0 0 10px ${swarm.color}40`,
                transform: activeSwarm === swarm.id ? 'scale(1.2)' : 'scale(1)'
              }}
              onClick={() => setActiveSwarm(activeSwarm === swarm.id ? null : swarm.id)}
            >
              {swarm.symbol}
            </div>
          ))}
        </div>

        {/* Voice Input */}
        <div style={styles.voiceInput}>
          <button
            style={{
              ...styles.voiceButton,
              boxShadow: isListening ? '0 0 30px #ff00ff' : 'none',
              transform: isListening ? 'scale(1.1)' : 'scale(1)'
            }}
            onClick={() => setIsListening(!isListening)}
          >
            🎤
          </button>
          <input
            type="text"
            placeholder="Speak or type your command..."
            style={styles.textInput}
            value={buildInput}
            onChange={(e) => setBuildInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleBuild()}
          />
          <button
            style={{
              ...styles.voiceButton,
              background: 'linear-gradient(135deg, #00ffff, #0066ff)',
              width: '50px',
              height: '50px'
            }}
            onClick={handleBuild}
          >
            ⚡
          </button>
        </div>

        {/* Alerts */}
        <div style={styles.alertZone}>
          {alerts.map((alert) => (
            <div key={alert.id} style={styles.alert}>
              ◈ {alert.message}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Build Control */}
      <div style={styles.rightPanel}>
        <div style={styles.panelTitle}>◈ PROCESSING MODE</div>
        <div style={styles.modeSelector}>
          {Object.entries(PROCESSING_MODES).map(([key, mode]) => (
            <button
              key={key}
              style={{
                ...styles.modeButton,
                borderColor: processingMode === key ? mode.color : 'rgba(0, 255, 255, 0.2)',
                background: processingMode === key ? `${mode.color}20` : 'rgba(0, 255, 255, 0.05)'
              }}
              onClick={() => setProcessingMode(key)}
            >
              <span style={styles.modeSymbol}>{mode.symbol}</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{mode.name}</div>
                <div style={{ fontSize: '10px', opacity: 0.7 }}>{mode.description}</div>
              </div>
            </button>
          ))}
        </div>

        <div style={styles.panelTitle}>◈ QUICK BUILD</div>
        <div style={styles.buildTypes}>
          {['🚀 Landing', '💎 SaaS', '⚡ Automation', '🌐 Website', '📱 App', '🎨 Brand', '🛒 Store', '👑 Empire'].map((type) => (
            <button
              key={type}
              style={styles.buildTypeBtn}
              onClick={() => setBuildInput(`Create a ${type.split(' ')[1]}`)}
            >
              {type}
            </button>
          ))}
        </div>

        <div style={styles.panelTitle}>◈ MULTIPLIERS</div>
        <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Network Effect</span>
            <span style={{ color: '#00ff00' }}>2.0x</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Glyph Compression</span>
            <span style={{ color: '#00ff00' }}>100x</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Voice Encoding</span>
            <span style={{ color: '#00ff00' }}>50x</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Quantum Overlap</span>
            <span style={{ color: '#00ff00' }}>φ (1.618)</span>
          </div>
        </div>
      </div>

      {/* Bottom Panel - Data Streams */}
      <div style={styles.bottomPanel}>
        <div style={styles.dataModule}>
          <div style={styles.dataLabel}>TOTAL BRAINS</div>
          <div style={styles.dataValue}>{networkStats.totalAgents.toLocaleString()}</div>
          <div style={styles.dataChart}>
            {chartData.slice(0, 10).map((value, i) => (
              <div key={i} style={{ ...styles.chartBar, height: `${value}%` }} />
            ))}
          </div>
        </div>

        <div style={styles.dataModule}>
          <div style={styles.dataLabel}>ACTIVE AGENTS</div>
          <div style={{ ...styles.dataValue, color: '#00ff00' }}>{networkStats.activeAgents}</div>
          <div style={styles.dataChart}>
            {chartData.slice(4, 14).map((value, i) => (
              <div key={i} style={{ ...styles.chartBar, height: `${value}%`, background: 'rgba(0, 255, 0, 0.3)' }} />
            ))}
          </div>
        </div>

        <div style={styles.dataModule}>
          <div style={styles.dataLabel}>TASKS PROCESSED</div>
          <div style={{ ...styles.dataValue, color: '#ffff00' }}>{networkStats.tasksProcessed.toLocaleString()}</div>
          <div style={styles.dataChart}>
            {chartData.slice(8, 18).map((value, i) => (
              <div key={i} style={{ ...styles.chartBar, height: `${value}%`, background: 'rgba(255, 255, 0, 0.3)' }} />
            ))}
          </div>
        </div>

        <div style={styles.dataModule}>
          <div style={styles.dataLabel}>AVG SKILL RATING</div>
          <div style={{ ...styles.dataValue, color: '#ff00ff' }}>{networkStats.avgSkill.toFixed(1)}</div>
          <div style={styles.dataChart}>
            {chartData.slice(2, 12).map((value, i) => (
              <div key={i} style={{ ...styles.chartBar, height: `${value}%`, background: 'rgba(255, 0, 255, 0.3)' }} />
            ))}
          </div>
        </div>

        <div style={styles.dataModule}>
          <div style={styles.dataLabel}>NETWORK ENERGY</div>
          <div style={{ ...styles.dataValue, color: '#ff8844' }}>{networkStats.networkEnergy.toFixed(0)}%</div>
          <div style={styles.dataChart}>
            {chartData.slice(6, 16).map((value, i) => (
              <div key={i} style={{ ...styles.chartBar, height: `${value}%`, background: 'rgba(255, 136, 68, 0.3)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Keyframe Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes orbPulse {
          0%, 100% { box-shadow: 0 0 60px rgba(0, 255, 255, 0.5), inset 0 0 40px rgba(255, 255, 255, 0.2); }
          50% { box-shadow: 0 0 100px rgba(0, 255, 255, 0.8), inset 0 0 60px rgba(255, 255, 255, 0.3); }
        }

        @keyframes scanline {
          0% { top: 60px; }
          100% { top: calc(100% - 200px); }
        }

        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CockpitHUD;
