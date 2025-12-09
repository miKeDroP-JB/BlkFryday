/**
 * 0R8.AI - COCKPIT INTERFACE
 * The Command Center of the Simulation
 *
 * Integrates:
 * - Elemental Triangles Banner (Ice • Energy • Fire)
 * - Cockpit Mode Interface
 * - Full Rotation System
 */

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamic imports for client-side only components
const ElementalTriangles = dynamic(
  () => import('@/components/ElementalTriangles'),
  { ssr: false }
);

const CockpitMode = dynamic(
  () => import('@/components/CockpitMode'),
  { ssr: false }
);

// ═══════════════════════════════════════════════════════════════
// INTERFACE STATES
// ═══════════════════════════════════════════════════════════════

const INTERFACE_STATES = {
  BANNER: 'banner',
  CONNECTING: 'connecting',
  COCKPIT: 'cockpit'
};

// ═══════════════════════════════════════════════════════════════
// LOADING TRANSITION
// ═══════════════════════════════════════════════════════════════

function ConnectionTransition({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('INITIALIZING');

  const phases = [
    'INITIALIZING NEURAL LINK',
    'SYNCHRONIZING CONSCIOUSNESS',
    'LOADING ELEMENTAL MATRIX',
    'CALIBRATING INTERFACE',
    'ESTABLISHING CONNECTION',
    'CONNECTION ESTABLISHED'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete?.(), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const phaseIndex = Math.min(
      Math.floor((progress / 100) * phases.length),
      phases.length - 1
    );
    setPhase(phases[phaseIndex]);
  }, [progress]);

  return (
    <div className="connection-transition">
      <div className="transition-content">
        {/* Rotating symbol */}
        <div className="symbol-container">
          <svg viewBox="0 0 100 100" className="connection-symbol">
            <defs>
              <linearGradient id="connGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00ffff" />
                <stop offset="100%" stopColor="#0088aa" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="url(#connGradient)"
              strokeWidth="2"
              strokeDasharray="251.2"
              strokeDashoffset={251.2 - (251.2 * progress) / 100}
              className="progress-ring"
            />
            <polygon
              points="50,20 70,60 30,60"
              fill="none"
              stroke="#00ffff"
              strokeWidth="2"
              className="inner-triangle"
            />
            <polygon
              points="50,80 70,40 30,40"
              fill="none"
              stroke="#00ffff"
              strokeWidth="2"
              className="inner-triangle"
            />
            <circle cx="50" cy="50" r="5" fill="#00ffff" />
          </svg>
        </div>

        {/* Phase text */}
        <motion.div
          className="phase-text"
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <span className="phase-label">{phase}</span>
        </motion.div>

        {/* Progress */}
        <div className="progress-container">
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              animate={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-value">{Math.round(progress)}%</span>
        </div>
      </div>

      <style jsx>{`
        .connection-transition {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #050510;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .transition-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 40px;
        }

        .symbol-container {
          width: 150px;
          height: 150px;
        }

        .connection-symbol {
          width: 100%;
          height: 100%;
        }

        .connection-symbol :global(.progress-ring) {
          transform: rotate(-90deg);
          transform-origin: center;
          transition: stroke-dashoffset 0.3s ease;
        }

        .connection-symbol :global(.inner-triangle) {
          animation: rotate 10s linear infinite;
          transform-origin: center;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .phase-text {
          text-align: center;
        }

        .phase-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.9rem;
          color: #00ffff;
          letter-spacing: 0.2em;
        }

        .progress-container {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 300px;
        }

        .progress-bar {
          flex: 1;
          height: 4px;
          background: #1a1a2e;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ffff, #0088aa);
          border-radius: 2px;
        }

        .progress-value {
          font-family: 'Space Mono', monospace;
          font-size: 0.85rem;
          color: #888;
          min-width: 40px;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CockpitPage() {
  const [interfaceState, setInterfaceState] = useState(INTERFACE_STATES.BANNER);
  const [systemStatus, setSystemStatus] = useState('ONLINE');
  const [entityStatus, setEntityStatus] = useState('DOCKED');
  const [objectives, setObjectives] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // Handle initiate connection from banner
  const handleInitiate = useCallback(() => {
    setSystemStatus('CONNECTING');
    setInterfaceState(INTERFACE_STATES.CONNECTING);
  }, []);

  // Handle connection complete
  const handleConnectionComplete = useCallback(() => {
    setSystemStatus('ONLINE');
    setEntityStatus('CONNECTED');
    setInterfaceState(INTERFACE_STATES.COCKPIT);

    // Set initial objectives
    setObjectives([
      { label: 'Domain', value: 'Simulation Interface' },
      { label: 'Status', value: 'Active Connection' },
      { label: 'Mode', value: 'Command Ready' }
    ]);

    // Set initial suggestions
    setSuggestions([
      {
        timestamp: '00.001',
        type: 'SYSTEM',
        action: 'Connection established',
        target: 'Neural interface online',
        detail: 'Ready for commands'
      }
    ]);
  }, []);

  // Handle speak command
  const handleSpeakCommand = useCallback(() => {
    // Add to suggestions feed
    setSuggestions(prev => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        type: 'VOICE',
        action: 'Voice input detected',
        target: 'Processing command',
        detail: 'Analyzing intent...'
      }
    ]);
  }, []);

  // Handle return to banner
  const handleDisconnect = useCallback(() => {
    setInterfaceState(INTERFACE_STATES.BANNER);
    setSystemStatus('ONLINE');
    setEntityStatus('DOCKED');
  }, []);

  return (
    <main className="cockpit-page">
      <AnimatePresence mode="wait">
        {interfaceState === INTERFACE_STATES.BANNER && (
          <motion.div
            key="banner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="banner-wrapper"
          >
            <ElementalTriangles
              onInitiate={handleInitiate}
              systemStatus={systemStatus}
            />

            {/* Additional content below banner */}
            <div className="banner-content">
              <motion.div
                className="intro-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h1 className="intro-title">0R8.AI</h1>
                <p className="intro-subtitle">INITIATE THE SIMULATION</p>
                <p className="intro-desc">
                  Enter the cockpit to command reality. The elemental forces await your direction.
                </p>

                <button className="enter-btn" onClick={handleInitiate}>
                  ENTER COCKPIT MODE
                </button>
              </motion.div>

              {/* Floating elements */}
              <div className="floating-elements">
                <div className="float-element e1" />
                <div className="float-element e2" />
                <div className="float-element e3" />
              </div>
            </div>
          </motion.div>
        )}

        {interfaceState === INTERFACE_STATES.CONNECTING && (
          <motion.div
            key="connecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ConnectionTransition onComplete={handleConnectionComplete} />
          </motion.div>
        )}

        {interfaceState === INTERFACE_STATES.COCKPIT && (
          <motion.div
            key="cockpit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CockpitMode
              entityStatus={entityStatus}
              objectives={objectives}
              suggestions={suggestions}
              onSpeakCommand={handleSpeakCommand}
            >
              {/* Main feed content */}
              <div className="feed-content">
                <div className="feed-message">
                  <span className="message-icon">⚡</span>
                  <span className="message-text">Neural link active. Awaiting commands.</span>
                </div>
              </div>
            </CockpitMode>

            {/* Disconnect button */}
            <button
              className="disconnect-btn"
              onClick={handleDisconnect}
            >
              DISCONNECT
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .cockpit-page {
          min-height: 100vh;
          background: #050510;
        }

        .banner-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .banner-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 40px;
          position: relative;
        }

        .intro-section {
          text-align: center;
          max-width: 600px;
          z-index: 10;
        }

        .intro-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 4rem;
          font-weight: 700;
          color: #00ffff;
          text-shadow: 0 0 40px rgba(0, 255, 255, 0.5);
          margin-bottom: 16px;
          letter-spacing: 0.2em;
        }

        .intro-subtitle {
          font-family: 'Space Mono', monospace;
          font-size: 1rem;
          color: #888;
          letter-spacing: 0.3em;
          margin-bottom: 24px;
        }

        .intro-desc {
          color: #666;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 40px;
        }

        .enter-btn {
          background: linear-gradient(135deg, #00ffff, #0088aa);
          border: none;
          color: #050510;
          padding: 16px 48px;
          font-family: 'Orbitron', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.3s;
          border-radius: 4px;
        }

        .enter-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(0, 255, 255, 0.3);
        }

        .floating-elements {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }

        .float-element {
          position: absolute;
          background: radial-gradient(circle, rgba(0, 255, 255, 0.1), transparent);
          border-radius: 50%;
          animation: float-drift 20s ease-in-out infinite;
        }

        .float-element.e1 {
          width: 300px;
          height: 300px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .float-element.e2 {
          width: 200px;
          height: 200px;
          top: 60%;
          right: 15%;
          animation-delay: -5s;
        }

        .float-element.e3 {
          width: 150px;
          height: 150px;
          bottom: 20%;
          left: 20%;
          animation-delay: -10s;
        }

        @keyframes float-drift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translate(20px, -20px) scale(1.1);
            opacity: 0.5;
          }
          50% {
            transform: translate(-10px, 10px) scale(0.9);
            opacity: 0.4;
          }
          75% {
            transform: translate(-20px, -10px) scale(1.05);
            opacity: 0.3;
          }
        }

        .feed-content {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .feed-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 40px;
          background: rgba(0, 255, 255, 0.05);
          border: 1px solid rgba(0, 255, 255, 0.2);
          border-radius: 4px;
        }

        .message-icon {
          font-size: 1.5rem;
        }

        .message-text {
          font-family: 'Space Mono', monospace;
          font-size: 0.9rem;
          color: #00ffff;
        }

        .disconnect-btn {
          position: fixed;
          top: 24px;
          right: 200px;
          background: transparent;
          border: 1px solid #ff4444;
          color: #ff4444;
          padding: 8px 16px;
          font-family: 'Orbitron', sans-serif;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.3s;
          z-index: 100;
        }

        .disconnect-btn:hover {
          background: rgba(255, 68, 68, 0.1);
        }

        @media (max-width: 768px) {
          .intro-title {
            font-size: 2.5rem;
          }

          .intro-subtitle {
            font-size: 0.85rem;
          }

          .disconnect-btn {
            right: 20px;
            top: auto;
            bottom: 20px;
          }
        }
      `}</style>
    </main>
  );
}
