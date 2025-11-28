'use client';

/**
 * ====================================================
 *  BRAIN NETWORK - COMMAND CENTER PAGE
 * ====================================================
 *  Access the 1000-brain neural supercomputer
 * ====================================================
 */

import React, { useState, useEffect } from 'react';
import CockpitHUDReal from '../../components/CockpitHUDReal';

export default function BrainNetworkPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [bootPhase, setBootPhase] = useState(0);

  const bootMessages = [
    '◉ INITIALIZING BRAIN NETWORK...',
    '├─ SPAWNING 1000 AGENTS...',
    '├─ LOADING 10 SWARM LEGIONS...',
    '├─ CALIBRATING 90+ SKILL MATRICES...',
    '├─ ACTIVATING STAGGERED ENERGY...',
    '├─ INITIALIZING GLYPH VOICE SYSTEM...',
    '├─ LOADING PROCESSING MODES...',
    '├─ RENDERING COCKPIT HUD...',
    '└─ ✓ BRAIN NETWORK ONLINE'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBootPhase(prev => {
        if (prev >= bootMessages.length - 1) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 500);
          return prev;
        }
        return prev + 1;
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a12',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Space Mono', monospace",
        color: '#00ffff'
      }}>
        {/* Central Orb */}
        <div style={{
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #00ffff 0%, #0066ff 50%, #000033 100%)',
          boxShadow: '0 0 60px rgba(0, 255, 255, 0.5)',
          marginBottom: '48px',
          animation: 'orbPulse 2s infinite'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px'
          }}>
            ◉
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          letterSpacing: '8px',
          marginBottom: '48px',
          textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
        }}>
          BRAIN NETWORK
        </h1>

        {/* Boot Messages */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontFamily: "'Space Mono', monospace",
          fontSize: '14px'
        }}>
          {bootMessages.slice(0, bootPhase + 1).map((msg, i) => (
            <div
              key={i}
              style={{
                color: i === bootPhase ? '#00ffff' : 'rgba(0, 255, 255, 0.5)',
                animation: i === bootPhase ? 'fadeIn 0.3s' : 'none'
              }}
            >
              {msg}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '300px',
          height: '4px',
          background: 'rgba(0, 255, 255, 0.2)',
          borderRadius: '2px',
          marginTop: '48px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((bootPhase + 1) / bootMessages.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00ffff, #0066ff)',
            borderRadius: '2px',
            transition: 'width 0.3s',
            boxShadow: '0 0 10px #00ffff'
          }} />
        </div>

        {/* Stats Preview */}
        <div style={{
          display: 'flex',
          gap: '48px',
          marginTop: '48px',
          fontSize: '12px',
          color: 'rgba(0, 255, 255, 0.5)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#00ffff', fontWeight: 'bold' }}>1,000</div>
            <div>AGENTS</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: '#00ffff', fontWeight: 'bold' }}>10</div>
            <div>SWARMS</div>
          </div>
          <div style={{ textAlign: '24px', color: '#00ffff', fontWeight: 'bold' }}>
            <div style={{ fontSize: '24px', color: '#00ffff', fontWeight: 'bold' }}>90+</div>
            <div>SKILL RATING</div>
          </div>
        </div>

        <style jsx>{`
          @keyframes orbPulse {
            0%, 100% { box-shadow: 0 0 60px rgba(0, 255, 255, 0.5); transform: scale(1); }
            50% { box-shadow: 0 0 100px rgba(0, 255, 255, 0.8); transform: scale(1.05); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    );
  }

  return <CockpitHUDReal />;
}
