'use client';

/**
 * ====================================================
 *  0RB SYSTEM - MAIN LANDING
 * ====================================================
 *  Brain Network V11.5 - GODMODE ULTIMATE
 *  "First and best of its kind in the world"
 * ====================================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0.5);

  useEffect(() => {
    setMounted(true);

    // Animate glow
    const interval = setInterval(() => {
      setGlowIntensity(prev => 0.5 + Math.sin(Date.now() / 1000) * 0.3);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div style={styles.container}>
      {/* Background Grid */}
      <div style={styles.grid} />

      {/* Central Orb */}
      <div
        style={{
          ...styles.orb,
          boxShadow: `0 0 ${60 + glowIntensity * 40}px rgba(0, 255, 255, ${glowIntensity})`
        }}
      >
        <span style={styles.orbSymbol}>◉</span>
      </div>

      {/* Title */}
      <h1 style={styles.title}>BRAIN NETWORK</h1>
      <h2 style={styles.subtitle}>V11.5 - GODMODE ULTIMATE</h2>

      {/* Stats */}
      <div style={styles.stats}>
        <StatBlock value="1,007" label="AGENTS" color="#00ffff" />
        <StatBlock value="10" label="SWARMS" color="#ff00ff" />
        <StatBlock value="50+" label="STRATEGIES" color="#ffff00" />
        <StatBlock value="∞" label="POWER" color="#00ff00" />
      </div>

      {/* Enter Button */}
      <Link href="/brain-network" style={styles.enterButton}>
        ENTER THE NETWORK
      </Link>

      {/* Tagline */}
      <p style={styles.tagline}>
        "First and best of its kind in the world"
      </p>

      {/* Version */}
      <div style={styles.version}>
        NEON RIVER PERFORMANCE STACK | WebTransport | WASM | Pre-warmed Audio
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

function StatBlock({ value, label, color }) {
  return (
    <div style={styles.statBlock}>
      <div style={{ ...styles.statValue, color, textShadow: `0 0 20px ${color}50` }}>
        {value}
      </div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, #0a0a0a 0%, #0a0a1a 50%, #0a0a0a 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Space Mono', monospace",
    color: '#00ffff',
    overflow: 'hidden'
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
    pointerEvents: 'none'
  },
  orb: {
    width: 180,
    height: 180,
    borderRadius: '50%',
    background: 'radial-gradient(circle, #00ffff 0%, #0066ff 40%, #000033 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    animation: 'float 4s ease-in-out infinite',
    cursor: 'pointer'
  },
  orbSymbol: {
    fontSize: 72,
    color: '#fff',
    textShadow: '0 0 30px #fff'
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 16,
    margin: 0,
    textShadow: '0 0 40px rgba(0,255,255,0.5)'
  },
  subtitle: {
    fontSize: 18,
    letterSpacing: 8,
    margin: '16px 0 48px',
    color: 'rgba(0,255,255,0.7)',
    fontWeight: 'normal'
  },
  stats: {
    display: 'flex',
    gap: 48,
    marginBottom: 48
  },
  statBlock: {
    textAlign: 'center'
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(0,255,255,0.5)',
    marginTop: 8
  },
  enterButton: {
    padding: '16px 48px',
    background: 'transparent',
    border: '2px solid #00ffff',
    borderRadius: 4,
    color: '#00ffff',
    fontSize: 16,
    letterSpacing: 4,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginBottom: 32
  },
  tagline: {
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(0,255,255,0.5)',
    margin: 0
  },
  version: {
    position: 'absolute',
    bottom: 20,
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(0,255,255,0.3)'
  }
};
