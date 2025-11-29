'use client';

/**
 * ====================================================
 *  COCKPIT V11.5 - GODMODE ULTIMATE HUD
 * ====================================================
 *  Full integration of V11.5 Brain Network systems:
 *  - VoiceOrb (VoiceFirst)
 *  - GrimoireUI (Grimoire)
 *  - GamificationHUD (RealityGames)
 *  - Swarm Control
 *  - Processing Modes
 * ====================================================
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import VoiceOrb from './VoiceOrb';
import GrimoireUI from './GrimoireUI';
import GamificationHUD from './GamificationHUD';

// Constants
const MAX_RESULTS = 50; // Prevent memory leak
const KEYBOARD_SHORTCUTS = {
  'g': 'grimoire',
  'v': 'voice',
  'h': 'hivemind',
  '1': 'SIMULTANEOUS',
  '2': 'TOURNAMENT',
  '3': 'RESONANCE',
  '4': 'GODMODE'
};

// ==========================================
//  CONFIGURATION
// ==========================================

const SWARM_DATA = [
  { id: 'ALPHA', name: 'ALPHA CORTEX', symbol: '\u0391', color: '#ff4444', domain: 'Strategic Vision' },
  { id: 'BETA', name: 'BETA NEXUS', symbol: '\u0392', color: '#44ff44', domain: 'Tactical Execution' },
  { id: 'GAMMA', name: 'GAMMA FORGE', symbol: '\u0393', color: '#4444ff', domain: 'Creative Generation' },
  { id: 'DELTA', name: 'DELTA ORACLE', symbol: '\u0394', color: '#ffff44', domain: 'Pattern Recognition' },
  { id: 'EPSILON', name: 'EPSILON WAVE', symbol: '\u0395', color: '#ff44ff', domain: 'Communication' },
  { id: 'ZETA', name: 'ZETA STORM', symbol: '\u0396', color: '#44ffff', domain: 'Rapid Response' },
  { id: 'ETA', name: 'ETA SYNTHESIS', symbol: '\u0397', color: '#ff8844', domain: 'Integration' },
  { id: 'THETA', name: 'THETA DREAM', symbol: '\u0398', color: '#8844ff', domain: 'Subconscious' },
  { id: 'IOTA', name: 'IOTA PRECISION', symbol: '\u0399', color: '#44ff88', domain: 'Micro-Optimization' },
  { id: 'KAPPA', name: 'KAPPA INFINITY', symbol: '\u039A', color: '#ff4488', domain: 'Infinite Scaling' }
];

const MODES = {
  SIMULTANEOUS: { symbol: '\u26A1', color: '#00ffff', desc: 'Maximum Speed' },
  TOURNAMENT: { symbol: '\uD83C\uDFC6', color: '#ffd700', desc: 'Best Quality' },
  RESONANCE: { symbol: '\u221E', color: '#ff00ff', desc: 'Creative Chaos' },
  GODMODE: { symbol: '\u269B\uFE0F', color: '#ffffff', desc: 'Transcend Limits' }
};

// ==========================================
//  MAIN COMPONENT
// ==========================================

export default function CockpitV11() {
  // Core state
  const [networkStatus, setNetworkStatus] = useState(null);
  const [swarms, setSwarms] = useState(SWARM_DATA);
  const [activeSwarms, setActiveSwarms] = useState(new Set());
  const [processingMode, setProcessingMode] = useState('SIMULTANEOUS');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // Panel visibility
  const [showGrimoire, setShowGrimoire] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

  // Loading/transition states
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionText, setTransitionText] = useState('');

  // User ID for gamification
  const [userId] = useState('player_' + Math.random().toString(36).substr(2, 9));

  // ==========================================
  //  KEYBOARD SHORTCUTS
  // ==========================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();

      if (KEYBOARD_SHORTCUTS[key]) {
        e.preventDefault();
        const action = KEYBOARD_SHORTCUTS[key];

        if (action === 'grimoire') {
          setShowGrimoire(prev => !prev);
        } else if (action === 'voice') {
          // Toggle voice - handled by VoiceOrb
        } else if (action === 'hivemind') {
          toggleSwarm('ALL');
        } else if (MODES[action]) {
          setMode(action);
        }
      }

      // Escape closes modals
      if (e.key === 'Escape') {
        setShowGrimoire(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ==========================================
  //  TEXT-TO-SPEECH FEEDBACK
  // ==========================================

  const speak = useCallback((text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // ==========================================
  //  TRANSITION HELPER
  // ==========================================

  const showTransition = useCallback((text, duration = 1000) => {
    setTransitionText(text);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), duration);
  }, []);

  // ==========================================
  //  API CALLS
  // ==========================================

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/brain-network?action=status');
      const data = await res.json();
      if (data.success) {
        setNetworkStatus(data.data);
      }
    } catch (err) {
      console.error('Status fetch error:', err);
    }
  }, []);

  const setMode = useCallback(async (mode) => {
    // Show transition
    showTransition(`${MODES[mode]?.symbol || ''} ${mode} ACTIVATING...`, 800);

    try {
      const res = await fetch('/api/brain-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-mode', data: { mode } })
      });
      const data = await res.json();
      if (data.success) {
        setProcessingMode(mode);
        addResult({ type: 'mode', message: `Mode: ${mode}`, glyph: MODES[mode].symbol });

        // Voice feedback
        speak(`${mode} mode activated`);

        // Track for gamification
        if (mode === 'GODMODE') {
          trackEvent('GODMODE_ACTIVATED');
          speak('God mode. All limits transcended.');
        }
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

        // Track for gamification
        trackEvent('TASK_COMPLETE', {
          quality: data.data.quality,
          duration: data.data.processingTime
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [processingMode]);

  // ==========================================
  //  EVENT TRACKING
  // ==========================================

  const trackEvent = async (eventType, eventData = {}) => {
    try {
      await fetch('/api/v11/game/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'trackEvent',
          data: { eventType, eventData }
        })
      });

      // Also award XP
      await fetch('/api/v11/game/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'addXP',
          data: { amount: 10, multiplier: eventData.quality || 1.0 }
        })
      });
    } catch (err) {
      console.warn('Event tracking error:', err);
    }
  };

  // ==========================================
  //  VOICE COMMAND HANDLER
  // ==========================================

  const handleVoiceCommand = (command) => {
    console.log('[CockpitV11] Voice command:', command);

    switch (command.action) {
      case 'build':
        processTask(`Build ${command.result?.buildType || 'project'}`);
        break;

      case 'mode':
        if (command.result?.mode) {
          setMode(command.result.mode);
        }
        break;

      case 'swarm':
        if (command.result?.swarmId) {
          toggleSwarm(command.result.swarmId);
        }
        break;

      case 'status':
        fetchStatus();
        addResult({ type: 'status', message: 'Status refreshed', glyph: '\u25C9' });
        break;

      case 'transcend':
        setMode('GODMODE');
        break;

      default:
        // Process as general task
        if (command.transcript) {
          processTask(command.transcript);
        }
    }
  };

  // ==========================================
  //  SPELL CAST HANDLER
  // ==========================================

  const handleSpellCast = (result) => {
    console.log('[CockpitV11] Spell cast:', result);
    addResult({
      type: 'spell',
      message: `Spell: ${result.spellName}`,
      glyph: result.glyph,
      output: result.output
    });

    // Track for gamification
    trackEvent('TASK_COMPLETE', { quality: 0.95 });
  };

  // ==========================================
  //  HELPERS
  // ==========================================

  const addResult = useCallback((result) => {
    setResults(prev => [{
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      ...result
    }, ...prev].slice(0, MAX_RESULTS)); // Prevent memory leak
  }, []);

  const toggleSwarm = (swarmId) => {
    setActiveSwarms(prev => {
      const next = new Set(prev);
      if (swarmId === 'ALL') {
        if (next.size === 10) {
          next.clear();
        } else {
          SWARM_DATA.forEach(s => next.add(s.id));
        }
      } else if (next.has(swarmId)) {
        next.delete(swarmId);
      } else {
        next.add(swarmId);
      }

      // Track swarm activation
      if (next.size > 0) {
        trackEvent('SWARM_ACTIVATED', { concurrentSwarms: next.size });
      }

      return next;
    });
  };

  // ==========================================
  //  EFFECTS
  // ==========================================

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // ==========================================
  //  RENDER
  // ==========================================

  return (
    <div style={styles.cockpit}>
      {/* Gamification HUD */}
      <GamificationHUD
        userId={userId}
        position="top-right"
        compact={false}
      />

      {/* Top Bar */}
      <header style={styles.topBar}>
        <div style={styles.logo}>\u25C9 BRAIN NETWORK V11.5</div>
        <div style={styles.statusRow}>
          <StatusDot color="#00ff00" label="NETWORK ONLINE" />
          <StatusDot color="#00ffff" label={`${networkStatus?.availableAgents || 1000} AGENTS`} />
          <StatusDot color={MODES[processingMode]?.color || '#00ffff'} label={processingMode} />
          <StatusDot color="#ff00ff" label={`${activeSwarms.size}/10 SWARMS`} />
        </div>
        <div style={styles.time}>{new Date().toLocaleTimeString()}</div>
      </header>

      {/* Left Panel - Swarm Control */}
      <aside style={styles.leftPanel}>
        <div style={styles.panelTitle}>\u25C8 SWARM CONTROL</div>
        <button
          onClick={() => toggleSwarm('ALL')}
          style={{
            ...styles.allSwarmsBtn,
            background: activeSwarms.size === 10 ? 'rgba(0,255,255,0.2)' : 'transparent'
          }}
        >
          {activeSwarms.size === 10 ? '\u2713 ALL ACTIVE' : 'ACTIVATE ALL'}
        </button>
        {swarms.map((swarm) => (
          <SwarmCard
            key={swarm.id}
            swarm={swarm}
            isActive={activeSwarms.has(swarm.id)}
            onClick={() => toggleSwarm(swarm.id)}
          />
        ))}
      </aside>

      {/* Main Display */}
      <main style={styles.mainDisplay}>
        {/* Network Visualization */}
        <div style={styles.networkViz}>
          {/* Central Voice Orb */}
          <VoiceOrb
            onCommand={handleVoiceCommand}
            size={140}
            showGlyphs={true}
          />

          {/* Swarm Nodes */}
          {swarms.map((swarm, i) => (
            <SwarmNode
              key={swarm.id}
              swarm={swarm}
              index={i}
              total={swarms.length}
              isActive={activeSwarms.has(swarm.id)}
              onClick={() => toggleSwarm(swarm.id)}
            />
          ))}
        </div>

        {/* Results Feed */}
        <div style={styles.resultsArea}>
          {results.map((result) => (
            <div key={result.id} style={styles.resultCard}>
              <span style={styles.resultGlyph}>{result.glyph}</span>
              <div style={styles.resultContent}>
                <div style={styles.resultMessage}>{result.message || result.task}</div>
                {result.quality && (
                  <div style={styles.resultQuality}>Quality: {Math.round(result.quality * 100)}%</div>
                )}
              </div>
              <span style={styles.resultTime}>{result.timestamp}</span>
            </div>
          ))}
        </div>

        {error && <div style={styles.error}>\u26A0\uFE0F {error}</div>}
      </main>

      {/* Right Panel - Controls */}
      <aside style={styles.rightPanel}>
        <div style={styles.panelTitle}>\u25C8 PROCESSING MODE</div>
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

        <div style={styles.panelTitle}>\u25C8 QUICK ACTIONS</div>
        <div style={styles.quickBuildGrid}>
          <button onClick={() => setShowGrimoire(true)} style={styles.quickBtn}>
            \uD83D\uDCD6 Grimoire
          </button>
          <button onClick={() => processTask('Build landing page')} style={styles.quickBtn}>
            \uD83D\uDE80 Landing
          </button>
          <button onClick={() => processTask('Build SaaS app')} style={styles.quickBtn}>
            \uD83D\uDC8E SaaS
          </button>
          <button onClick={() => processTask('Analyze code')} style={styles.quickBtn}>
            \uD83E\uDDE0 Analyze
          </button>
          <button onClick={() => setMode('GODMODE')} style={styles.quickBtn}>
            \u269B\uFE0F GODMODE
          </button>
          <button onClick={() => toggleSwarm('ALL')} style={styles.quickBtn}>
            \uD83D\uDC1D Hivemind
          </button>
        </div>

        <div style={styles.panelTitle}>\u25C8 STATS</div>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{networkStatus?.tasksProcessed || 0}</span>
            <span style={styles.statLabel}>Tasks</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{results.length}</span>
            <span style={styles.statLabel}>Results</span>
          </div>
        </div>
      </aside>

      {/* Bottom Panel - Energy Bars */}
      <footer style={styles.bottomPanel}>
        <StatModule label="TOTAL BRAINS" value={networkStatus?.totalAgents || 1000} color="#00ffff" />
        <StatModule label="ACTIVE" value={networkStatus?.availableAgents || 850} color="#00ff00" />
        <StatModule label="TASKS" value={networkStatus?.tasksProcessed || 0} color="#ffff00" />
        <StatModule label="AVG SKILL" value={(networkStatus?.networkEnergy || 94.7).toFixed(1)} color="#ff00ff" />
        <StatModule label="ENERGY" value={`${(networkStatus?.networkEnergy || 87).toFixed(0)}%`} color="#ff8844" />
      </footer>

      {/* Grimoire Modal */}
      {showGrimoire && (
        <div style={styles.modalOverlay}>
          <GrimoireUI
            onCast={handleSpellCast}
            onClose={() => setShowGrimoire(false)}
            isOpen={true}
          />
        </div>
      )}

      {/* Transition Overlay */}
      {isTransitioning && (
        <div style={styles.transitionOverlay}>
          <div style={styles.transitionText}>{transitionText}</div>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div style={styles.keyboardHint}>
        <span>G</span> Grimoire
        <span>H</span> Hivemind
        <span>1-4</span> Modes
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes orbPulse {
          0%, 100% { box-shadow: 0 0 60px rgba(0,255,255,0.5); }
          50% { box-shadow: 0 0 100px rgba(0,255,255,0.8); }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
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
        padding: 10,
        cursor: 'pointer',
        marginBottom: 6,
        transition: 'all 0.2s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20, fontWeight: 'bold', color: swarm.color }}>{swarm.symbol}</span>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 1, opacity: 0.9 }}>{swarm.name}</div>
          <div style={{ fontSize: 9, opacity: 0.5 }}>{swarm.domain}</div>
        </div>
        {isActive && <span style={{ marginLeft: 'auto', color: swarm.color }}>\u2713</span>}
      </div>
    </div>
  );
}

function SwarmNode({ swarm, index, total, isActive, onClick }) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 180;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `calc(50% + ${x}px - 24px)`,
        top: `calc(50% + ${y}px - 24px)`,
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: `${swarm.color}${isActive ? '40' : '15'}`,
        border: `2px solid ${swarm.color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        color: swarm.color,
        cursor: 'pointer',
        transform: isActive ? 'scale(1.15)' : 'scale(1)',
        boxShadow: isActive ? `0 0 20px ${swarm.color}` : `0 0 5px ${swarm.color}40`,
        transition: 'all 0.2s'
      }}
    >
      {swarm.symbol}
    </div>
  );
}

function StatModule({ label, value, color }) {
  return (
    <div style={{ padding: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(0,255,255,0.5)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 'bold', color, textShadow: `0 0 10px ${color}50` }}>{value}</div>
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
    gridTemplateRows: '60px 1fr 100px',
    gridTemplateColumns: '260px 1fr 260px'
  },
  topBar: {
    gridColumn: '1 / -1',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px',
    background: 'rgba(0,255,255,0.05)',
    borderBottom: '1px solid rgba(0,255,255,0.2)'
  },
  logo: { fontSize: 20, fontWeight: 'bold', letterSpacing: 4, textShadow: '0 0 20px rgba(0,255,255,0.5)' },
  statusRow: { display: 'flex', gap: 24 },
  time: { fontSize: 14, opacity: 0.7 },
  leftPanel: {
    background: 'rgba(0,0,0,0.4)',
    borderRight: '1px solid rgba(0,255,255,0.2)',
    padding: 12, overflowY: 'auto'
  },
  rightPanel: {
    background: 'rgba(0,0,0,0.4)',
    borderLeft: '1px solid rgba(0,255,255,0.2)',
    padding: 12, overflowY: 'auto'
  },
  panelTitle: { fontSize: 11, letterSpacing: 2, color: 'rgba(0,255,255,0.6)', margin: '12px 0 8px' },
  allSwarmsBtn: {
    width: '100%',
    padding: 10,
    marginBottom: 8,
    background: 'transparent',
    border: '1px solid rgba(0,255,255,0.3)',
    borderRadius: 4,
    color: '#00ffff',
    fontSize: 11,
    letterSpacing: 1,
    cursor: 'pointer'
  },
  mainDisplay: {
    position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
  },
  networkViz: {
    position: 'relative', width: 450, height: 450,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  resultsArea: {
    position: 'absolute', top: 16, left: 16,
    width: 280, maxHeight: 180, overflowY: 'auto'
  },
  resultCard: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    background: 'rgba(0,255,255,0.05)',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 4, padding: 10, marginBottom: 6
  },
  resultGlyph: { fontSize: 18 },
  resultContent: { flex: 1 },
  resultMessage: { fontSize: 11 },
  resultQuality: { fontSize: 9, color: '#00ff88', marginTop: 2 },
  resultTime: { fontSize: 9, opacity: 0.5 },
  error: {
    position: 'absolute', bottom: 20,
    background: 'rgba(255,0,0,0.2)',
    border: '1px solid rgba(255,0,0,0.5)',
    padding: '10px 20px', borderRadius: 4, fontSize: 12
  },
  modeBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: 10, marginBottom: 6,
    background: 'transparent',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 4, cursor: 'pointer', color: '#00ffff',
    textAlign: 'left', fontSize: 11
  },
  modeSymbol: { fontSize: 18 },
  quickBuildGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  quickBtn: {
    padding: 8, background: 'rgba(0,255,255,0.05)',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 4, cursor: 'pointer', fontSize: 10, color: '#00ffff'
  },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  statItem: {
    textAlign: 'center', padding: 8,
    background: 'rgba(0,255,255,0.05)', borderRadius: 4
  },
  statValue: { display: 'block', fontSize: 18, fontWeight: 'bold', color: '#00ffff' },
  statLabel: { fontSize: 9, color: 'rgba(0,255,255,0.5)' },
  bottomPanel: {
    gridColumn: '1 / -1',
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
    background: 'rgba(0,0,0,0.6)',
    borderTop: '1px solid rgba(0,255,255,0.2)'
  },
  modalOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000
  },
  transitionOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000,
    animation: 'fadeInOut 0.8s ease-in-out'
  },
  transitionText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 8,
    color: '#00ffff',
    textShadow: '0 0 40px rgba(0,255,255,0.8)',
    animation: 'pulse 0.5s infinite'
  },
  keyboardHint: {
    position: 'fixed',
    bottom: 8,
    right: 20,
    display: 'flex',
    gap: 12,
    fontSize: 10,
    color: 'rgba(0,255,255,0.4)',
    zIndex: 10
  }
};
