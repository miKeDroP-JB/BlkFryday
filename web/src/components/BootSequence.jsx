'use client';
// ============================================================
//  BRAIN NETWORK V11.5 - BOOT SEQUENCE
//  Automated System Initialization
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { initNeonRiver, getNeonRiver } from '../lib/NeonRiver';

export default function BootSequence({ onComplete, children }) {
  const [bootState, setBootState] = useState('initializing');
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: Date.now() }].slice(-20));
  }, []);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        addLog('Initializing Neon River...', 'system');
        setProgress(10);

        // Initialize NeonRiver (all subsystems)
        const river = await initNeonRiver();

        if (!mounted) return;

        setProgress(50);
        addLog('WASM Engine: ' + (river.metrics.wasmReady ? 'READY' : 'FALLBACK'),
               river.metrics.wasmReady ? 'success' : 'warn');

        setProgress(70);
        addLog('Sonic Audio: ' + (river.metrics.sonicReady ? 'HYDRATED' : 'FALLBACK'),
               river.metrics.sonicReady ? 'success' : 'warn');

        setProgress(90);
        addLog('Network: ' + (river.metrics.networkReady ? 'CONNECTED' : 'OFFLINE'),
               river.metrics.networkReady ? 'success' : 'warn');

        setProgress(100);
        addLog(`Boot complete in ${river.metrics.initTime.toFixed(0)}ms`, 'success');

        setMetrics(river.metrics);
        setBootState('complete');

        // Notify parent
        onComplete?.({ river, metrics: river.metrics });

      } catch (error) {
        if (!mounted) return;
        addLog(`Boot failed: ${error.message}`, 'error');
        setBootState('error');
      }
    };

    boot();

    return () => { mounted = false; };
  }, [addLog, onComplete]);

  // Show children immediately if boot is complete
  if (bootState === 'complete' && children) {
    return children;
  }

  // Boot animation
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* ASCII Art Header */}
        <pre style={styles.ascii}>
{`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     ██████╗ ██████╗  █████╗ ██╗███╗   ██╗               ║
║     ██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║               ║
║     ██████╔╝██████╔╝███████║██║██╔██╗ ██║               ║
║     ██╔══██╗██╔══██╗██╔══██║██║██║╚██╗██║               ║
║     ██████╔╝██║  ██║██║  ██║██║██║ ╚████║               ║
║     ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝               ║
║                                                          ║
║         NETWORK V11.5 - GODMODE ULTIMATE                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`}
        </pre>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={{ ...styles.progressBar, width: `${progress}%` }} />
        </div>
        <div style={styles.progressText}>{progress}%</div>

        {/* Status */}
        <div style={styles.status}>
          {bootState === 'initializing' && 'INITIALIZING SYSTEMS...'}
          {bootState === 'complete' && 'BOOT COMPLETE'}
          {bootState === 'error' && 'BOOT FAILED'}
        </div>

        {/* Boot Logs */}
        <div style={styles.logs}>
          {logs.map((log, i) => (
            <div key={i} style={{
              ...styles.logLine,
              color: log.type === 'error' ? '#ff4444' :
                     log.type === 'success' ? '#44ff44' :
                     log.type === 'warn' ? '#ffaa00' :
                     log.type === 'system' ? '#00ffff' : '#888'
            }}>
              [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
            </div>
          ))}
        </div>

        {/* Metrics */}
        {metrics && (
          <div style={styles.metrics}>
            <span>WASM: {metrics.wasmReady ? '●' : '○'}</span>
            <span>SONIC: {metrics.sonicReady ? '●' : '○'}</span>
            <span>NET: {metrics.networkReady ? '●' : '○'}</span>
            <span>TIME: {metrics.initTime.toFixed(0)}ms</span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'monospace',
    color: '#00ffff',
    zIndex: 9999
  },
  content: {
    textAlign: 'center',
    maxWidth: '700px',
    padding: '2rem'
  },
  ascii: {
    fontSize: '8px',
    lineHeight: 1.2,
    color: '#00ffff',
    textShadow: '0 0 10px #00ffff',
    margin: 0
  },
  progressContainer: {
    width: '100%',
    height: '4px',
    background: '#333',
    borderRadius: '2px',
    marginTop: '2rem',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
    transition: 'width 0.3s ease',
    boxShadow: '0 0 10px #00ffff'
  },
  progressText: {
    marginTop: '0.5rem',
    fontSize: '14px',
    color: '#666'
  },
  status: {
    marginTop: '1rem',
    fontSize: '18px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  logs: {
    marginTop: '2rem',
    textAlign: 'left',
    fontSize: '11px',
    maxHeight: '150px',
    overflow: 'auto',
    background: 'rgba(0,0,0,0.3)',
    padding: '1rem',
    borderRadius: '4px'
  },
  logLine: {
    padding: '2px 0',
    fontFamily: 'monospace'
  },
  metrics: {
    marginTop: '1rem',
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    fontSize: '12px',
    color: '#888'
  }
};

// Export hook for accessing NeonRiver
export function useNeonRiver() {
  const [river, setRiver] = useState(null);

  useEffect(() => {
    const r = getNeonRiver();
    if (r.isInitialized) {
      setRiver(r);
    } else {
      const unsubscribe = r.on('flow', () => setRiver(r));
      return unsubscribe;
    }
  }, []);

  return river;
}
