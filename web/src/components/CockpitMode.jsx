/**
 * 0R8.AI - COCKPIT MODE INTERFACE
 * The command center of the simulation
 *
 * SYSTEM: COCKPIT MODE | ENTITY: DOCKED
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════
// ROTATING COMMAND SYMBOL
// ═══════════════════════════════════════════════════════════════

function CommandSymbol({ isActive = false }) {
  return (
    <div className="command-symbol-container">
      <svg viewBox="0 0 100 100" className="command-symbol">
        <defs>
          <linearGradient id="symbolGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0088aa" stopOpacity="0.4" />
          </linearGradient>
          <filter id="symbolGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer rotating ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#symbolGradient)"
          strokeWidth="1"
          strokeDasharray="10 5"
          className="ring-outer"
        />

        {/* Double inverted triangles (hourglass shape) */}
        <g filter="url(#symbolGlow)">
          {/* Upper triangle pointing down */}
          <polygon
            points="50,15 75,50 25,50"
            fill="none"
            stroke="#00ffff"
            strokeWidth="2"
          />
          {/* Lower triangle pointing up */}
          <polygon
            points="50,85 75,50 25,50"
            fill="none"
            stroke="#00ffff"
            strokeWidth="2"
          />
        </g>

        {/* Center connection point */}
        <circle cx="50" cy="50" r="4" fill="#00ffff" />

        {/* Corner accent marks */}
        <line x1="25" y1="50" x2="20" y2="50" stroke="#00ffff" strokeWidth="1" opacity="0.6" />
        <line x1="75" y1="50" x2="80" y2="50" stroke="#00ffff" strokeWidth="1" opacity="0.6" />
        <line x1="50" y1="15" x2="50" y2="10" stroke="#00ffff" strokeWidth="1" opacity="0.6" />
        <line x1="50" y1="85" x2="50" y2="90" stroke="#00ffff" strokeWidth="1" opacity="0.6" />
      </svg>

      {/* Pulse rings when active */}
      {isActive && (
        <>
          <div className="pulse-ring pulse-1" />
          <div className="pulse-ring pulse-2" />
          <div className="pulse-ring pulse-3" />
        </>
      )}

      <style jsx>{`
        .command-symbol-container {
          position: relative;
          width: 150px;
          height: 150px;
        }

        .command-symbol {
          width: 100%;
          height: 100%;
          animation: rotate 30s linear infinite;
        }

        .command-symbol :global(.ring-outer) {
          animation: rotate-reverse 20s linear infinite;
          transform-origin: center;
        }

        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border: 1px solid #00ffff;
          border-radius: 50%;
          opacity: 0;
        }

        .pulse-1 {
          width: 80px;
          height: 80px;
          animation: pulse-expand 2s ease-out infinite;
        }

        .pulse-2 {
          width: 80px;
          height: 80px;
          animation: pulse-expand 2s ease-out infinite 0.5s;
        }

        .pulse-3 {
          width: 80px;
          height: 80px;
          animation: pulse-expand 2s ease-out infinite 1s;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes rotate-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes pulse-expand {
          0% {
            width: 80px;
            height: 80px;
            opacity: 0.6;
          }
          100% {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEED PANELS
// ═══════════════════════════════════════════════════════════════

function ObjectivesFeed({ objectives = [] }) {
  const defaultObjectives = [
    { label: 'Domain', value: 'Undefined' },
    { label: 'Status', value: 'Passive Listen' }
  ];

  const items = objectives.length > 0 ? objectives : defaultObjectives;

  return (
    <div className="feed-panel objectives">
      <div className="feed-header">
        <span className="feed-title">FEED 1: OBJECTIVES / GOALS</span>
      </div>
      <div className="feed-content">
        {items.map((item, i) => (
          <div key={i} className="feed-item">
            <span className="item-bullet">•</span>
            <span className="item-label">{item.label}:</span>
            <span className="item-value">{item.value}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .feed-panel {
          background: rgba(10, 10, 20, 0.8);
          border: 1px solid #1a1a3a;
          border-radius: 4px;
          width: 320px;
          min-height: 150px;
        }

        .feed-header {
          padding: 12px 16px;
          border-bottom: 1px solid #1a1a3a;
        }

        .feed-title {
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          color: #888;
          letter-spacing: 0.05em;
        }

        .feed-content {
          padding: 16px;
        }

        .feed-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .item-bullet {
          color: #00ffff;
        }

        .item-label {
          color: #888;
        }

        .item-value {
          color: #fff;
        }
      `}</style>
    </div>
  );
}

function GuidanceFeed({ suggestions = [] }) {
  const defaultSuggestions = [
    {
      timestamp: '23.103',
      type: 'SUGGESTION',
      action: 'Define core mission',
      target: 'Launch Alpha Project',
      detail: 'Tamprd1 started Alpha Projec'
    },
    {
      timestamp: '3.48.300',
      type: 'SUGGESTION',
      action: 'Define care mission',
      target: 'Launch Alpha Projea',
      detail: 'Project'
    }
  ];

  const items = suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <div className="feed-panel guidance">
      <div className="feed-header">
        <span className="feed-title">FEED 2: INTENT GUIDANCE / SUGGESTIONS</span>
      </div>
      <div className="feed-content">
        {items.map((item, i) => (
          <div key={i} className="guidance-item">
            <div className="guidance-meta">
              <span className="guidance-timestamp">Deepr sale Vmflivpr 1e-{item.timestamp}</span>
            </div>
            <div className="guidance-action">
              <span className="guidance-type">[{item.type}]</span>
              <span className="guidance-text">{item.action}: Target: {item.target}</span>
            </div>
            <div className="guidance-detail">
              {item.detail}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .feed-panel {
          background: rgba(10, 10, 20, 0.8);
          border: 1px solid #1a1a3a;
          border-radius: 4px;
          width: 380px;
          min-height: 150px;
        }

        .feed-header {
          padding: 12px 16px;
          border-bottom: 1px solid #1a1a3a;
        }

        .feed-title {
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          color: #888;
          letter-spacing: 0.05em;
        }

        .feed-content {
          padding: 16px;
        }

        .guidance-item {
          margin-bottom: 16px;
          font-size: 0.85rem;
        }

        .guidance-item:last-child {
          margin-bottom: 0;
        }

        .guidance-meta {
          margin-bottom: 4px;
        }

        .guidance-timestamp {
          color: #666;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
        }

        .guidance-action {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .guidance-type {
          color: #00ffff;
        }

        .guidance-text {
          color: #fff;
        }

        .guidance-detail {
          color: #00ffff;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN ACTION FEED DISPLAY
// ═══════════════════════════════════════════════════════════════

function MainActionFeed({ content = null, isActive = false }) {
  return (
    <div className={`main-feed ${isActive ? 'active' : ''}`}>
      {/* Corner brackets */}
      <div className="bracket tl" />
      <div className="bracket tr" />
      <div className="bracket bl" />
      <div className="bracket br" />

      {/* Side accents */}
      <div className="side-accent left">
        <div className="accent-bar" />
        <div className="accent-dot" />
      </div>
      <div className="side-accent right">
        <div className="accent-bar" />
        <div className="accent-dot" />
      </div>

      {/* Content area */}
      <div className="feed-display">
        {content || (
          <div className="empty-state">
            <span className="empty-text">AWAITING INPUT</span>
          </div>
        )}
      </div>

      {/* Footer label */}
      <div className="feed-label">
        <span>MAIN ACTION FEED</span>
      </div>

      <style jsx>{`
        .main-feed {
          position: relative;
          width: 100%;
          max-width: 800px;
          height: 350px;
          background: rgba(5, 5, 15, 0.6);
          border: 1px solid #1a2a4a;
        }

        .main-feed.active {
          border-color: #00ffff;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.1);
        }

        /* Corner brackets */
        .bracket {
          position: absolute;
          width: 40px;
          height: 40px;
        }

        .bracket.tl {
          top: -1px;
          left: -1px;
          border-top: 3px solid #00ffff;
          border-left: 3px solid #00ffff;
        }

        .bracket.tr {
          top: -1px;
          right: -1px;
          border-top: 3px solid #00ffff;
          border-right: 3px solid #00ffff;
        }

        .bracket.bl {
          bottom: -1px;
          left: -1px;
          border-bottom: 3px solid #00ffff;
          border-left: 3px solid #00ffff;
        }

        .bracket.br {
          bottom: -1px;
          right: -1px;
          border-bottom: 3px solid #00ffff;
          border-right: 3px solid #00ffff;
        }

        /* Side accents (red/orange marks) */
        .side-accent {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .side-accent.left {
          left: -8px;
        }

        .side-accent.right {
          right: -8px;
        }

        .accent-bar {
          width: 4px;
          height: 60px;
          background: linear-gradient(180deg, #ff4444 0%, #aa2222 100%);
          border-radius: 2px;
        }

        .accent-dot {
          width: 8px;
          height: 8px;
          background: #ff4444;
          border-radius: 50%;
          box-shadow: 0 0 10px #ff4444;
        }

        .feed-display {
          width: 100%;
          height: calc(100% - 40px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-state {
          text-align: center;
        }

        .empty-text {
          font-family: 'Space Mono', monospace;
          font-size: 0.9rem;
          color: #444;
          letter-spacing: 0.2em;
        }

        .feed-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 10, 20, 0.8);
          border-top: 1px solid #1a2a4a;
        }

        .feed-label span {
          font-family: 'Orbitron', sans-serif;
          font-size: 1rem;
          color: #888;
          letter-spacing: 0.2em;
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SPEAK COMMAND BUTTON
// ═══════════════════════════════════════════════════════════════

function SpeakCommandButton({ onSpeak, isListening = false }) {
  return (
    <motion.button
      className={`speak-btn ${isListening ? 'listening' : ''}`}
      onClick={onSpeak}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="btn-text">SPEAK COMMAND</span>
      {isListening && <span className="listening-indicator" />}

      <style jsx>{`
        .speak-btn {
          position: relative;
          background: linear-gradient(180deg, #1a3a5a 0%, #0a1a2a 100%);
          border: 2px solid #00a8cc;
          color: #00ffff;
          padding: 16px 40px;
          font-family: 'Orbitron', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: all 0.3s;
          border-radius: 4px;
          overflow: hidden;
        }

        .speak-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .speak-btn:hover::before {
          left: 100%;
        }

        .speak-btn:hover {
          border-color: #00ffff;
          box-shadow: 0 0 20px rgba(0,255,255,0.3), inset 0 0 20px rgba(0,255,255,0.1);
        }

        .speak-btn.listening {
          border-color: #ff4444;
          animation: pulse-border 1s infinite;
        }

        .btn-text {
          position: relative;
          z-index: 1;
        }

        .listening-indicator {
          position: absolute;
          top: 50%;
          right: 16px;
          transform: translateY(-50%);
          width: 10px;
          height: 10px;
          background: #ff4444;
          border-radius: 50%;
          animation: pulse-glow 1s infinite;
        }

        @keyframes pulse-border {
          0%, 100% { border-color: #ff4444; }
          50% { border-color: #ff8888; }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 10px #ff4444;
          }
          50% {
            opacity: 0.5;
            box-shadow: 0 0 20px #ff4444;
          }
        }
      `}</style>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════
// DECORATIVE STAR
// ═══════════════════════════════════════════════════════════════

function DecorativeStar() {
  return (
    <div className="decorative-star">
      <svg viewBox="0 0 50 50" width="50" height="50">
        <polygon
          points="25,5 30,20 45,20 33,30 38,45 25,35 12,45 17,30 5,20 20,20"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />
      </svg>
      <style jsx>{`
        .decorative-star {
          position: absolute;
          bottom: 40px;
          right: 60px;
          opacity: 0.5;
          animation: twinkle 3s ease-in-out infinite;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COCKPIT MODE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CockpitMode({
  entityStatus = 'DOCKED',
  objectives = [],
  suggestions = [],
  onSpeakCommand,
  children
}) {
  const [isListening, setIsListening] = useState(false);
  const [feedActive, setFeedActive] = useState(false);

  const handleSpeak = useCallback(() => {
    setIsListening(prev => !prev);
    setFeedActive(true);
    onSpeakCommand?.();
  }, [onSpeakCommand]);

  return (
    <div className="cockpit-mode">
      {/* Background */}
      <div className="cockpit-bg">
        <div className="stars-layer" />
        <div className="nebula-layer" />
      </div>

      {/* Header */}
      <header className="cockpit-header">
        <div className="header-brand">
          <span className="brand-text">0r8.ai</span>
        </div>
        <div className="header-status">
          <div className="status-item">
            <span className="status-label">SYSTEM:</span>
            <span className="status-value">COCKPIT MODE</span>
          </div>
          <div className="status-item">
            <span className="status-label">ENTITY:</span>
            <span className="status-value highlight">{entityStatus}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="cockpit-main">
        <MainActionFeed content={children} isActive={feedActive} />
      </main>

      {/* Command Symbol */}
      <div className="symbol-area">
        <CommandSymbol isActive={isListening} />
      </div>

      {/* Speak Command Button */}
      <div className="command-area">
        <SpeakCommandButton
          onSpeak={handleSpeak}
          isListening={isListening}
        />
      </div>

      {/* Side Feeds */}
      <aside className="feeds-left">
        <ObjectivesFeed objectives={objectives} />
      </aside>

      <aside className="feeds-right">
        <GuidanceFeed suggestions={suggestions} />
      </aside>

      {/* Decorative Elements */}
      <DecorativeStar />

      <style jsx>{`
        .cockpit-mode {
          position: relative;
          width: 100vw;
          height: 100vh;
          min-height: 800px;
          background: #050510;
          color: #fff;
          font-family: 'Rajdhani', sans-serif;
          overflow: hidden;
        }

        .cockpit-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .stars-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image:
            radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 20% 40%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 30% 10%, rgba(255,255,255,0.2), transparent),
            radial-gradient(1px 1px at 50% 50%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 70% 30%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 80% 70%, rgba(255,255,255,0.2), transparent),
            radial-gradient(1px 1px at 90% 10%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 95% 90%, rgba(255,255,255,0.4), transparent);
        }

        .nebula-layer {
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at 30% 40%, rgba(50,50,100,0.1) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 60%, rgba(30,30,80,0.1) 0%, transparent 50%);
        }

        .cockpit-header {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 40px;
          z-index: 10;
        }

        .brand-text {
          font-family: 'Orbitron', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: #00ffff;
          text-shadow: 0 0 30px rgba(0,255,255,0.5);
        }

        .header-status {
          display: flex;
          gap: 40px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.9rem;
          color: #666;
        }

        .status-value {
          font-family: 'Orbitron', sans-serif;
          font-size: 1rem;
          color: #fff;
          letter-spacing: 0.1em;
        }

        .status-value.highlight {
          color: #00ffff;
        }

        .cockpit-main {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 20px 40px;
          z-index: 5;
        }

        .symbol-area {
          position: absolute;
          left: 50%;
          top: 55%;
          transform: translate(-50%, -50%);
          z-index: 20;
        }

        .command-area {
          position: absolute;
          left: 50%;
          bottom: 80px;
          transform: translateX(-50%);
          z-index: 20;
        }

        .feeds-left {
          position: absolute;
          left: 40px;
          bottom: 120px;
          z-index: 15;
        }

        .feeds-right {
          position: absolute;
          right: 40px;
          bottom: 120px;
          z-index: 15;
        }

        @media (max-width: 1400px) {
          .feeds-left, .feeds-right {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
