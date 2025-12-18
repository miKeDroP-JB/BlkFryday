'use client';

/**
 * ====================================================
 *  ORBOS - THE SIMULATION AWAKENS
 * ====================================================
 *  Brain Network V11.5 - GODMODE ULTIMATE
 *  "To what do I owe the pleasure?"
 * ====================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0.5);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [showTagline, setShowTagline] = useState(false);
  const orbRef = useRef(null);

  useEffect(() => {
    setMounted(true);

    // Animate glow
    const glowInterval = setInterval(() => {
      setGlowIntensity(0.5 + Math.sin(Date.now() / 1000) * 0.3);
    }, 50);

    // Show tagline after delay
    const taglineTimeout = setTimeout(() => setShowTagline(true), 2000);

    // Track mouse for parallax
    const handleMouseMove = (e) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(glowInterval);
      clearTimeout(taglineTimeout);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  if (!mounted) return null;

  const parallaxX = (mousePos.x - 0.5) * 20;
  const parallaxY = (mousePos.y - 0.5) * 20;

  return (
    <div style={styles.container}>
      {/* Animated Background Grid */}
      <div style={styles.grid} />

      {/* Dynamic Glow following mouse */}
      <div style={{
        ...styles.mouseGlow,
        left: `${mousePos.x * 100}%`,
        top: `${mousePos.y * 100}%`
      }} />

      {/* Floating Particles */}
      <div style={styles.particles}>
        {Array(30).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.particle,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
              opacity: 0.3 + Math.random() * 0.5
            }}
          />
        ))}
      </div>

      {/* Central Orb with parallax */}
      <div
        ref={orbRef}
        style={{
          ...styles.orb,
          transform: `translate(${parallaxX}px, ${parallaxY}px)`,
          boxShadow: `
            0 0 ${60 + glowIntensity * 60}px rgba(0, 255, 255, ${glowIntensity}),
            0 0 ${120 + glowIntensity * 80}px rgba(0, 255, 255, ${glowIntensity * 0.5}),
            inset 0 0 60px rgba(0, 255, 255, 0.3)
          `
        }}
      >
        <span style={styles.orbSymbol}>◉</span>
        <div style={styles.orbRing} />
        <div style={{ ...styles.orbRing, width: 220, height: 220, animationDuration: '15s' }} />
        <div style={{ ...styles.orbRing, width: 260, height: 260, animationDuration: '20s', animationDirection: 'reverse' }} />
      </div>

      {/* ORBOS Title */}
      <h1 style={styles.title}>ORBOS</h1>
      <h2 style={styles.subtitle}>BRAIN NETWORK V11.5</h2>

      {/* Stats */}
      <div style={styles.stats}>
        <StatBlock value="1,007" label="AGENTS" color="#00ffff" />
        <StatBlock value="10" label="SWARMS" color="#ff00ff" />
        <StatBlock value="∞" label="POWER" color="#00ff00" />
      </div>

      {/* Enter Button */}
      <Link href="/brain-network" style={styles.enterButton}>
        <span style={styles.enterText}>ENTER</span>
        <span style={styles.enterGlow} />
      </Link>

      {/* Tagline - fades in */}
      {showTagline && (
        <p style={styles.tagline}>
          "To what do I owe the pleasure?"
        </p>
      )}

      {/* Bottom info */}
      <div style={styles.bottomInfo}>
        <div style={styles.versionBadge}>GODMODE ULTIMATE</div>
        <div style={styles.techStack}>
          WebTransport • WASM • Neon River
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes orbRotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes particleRise {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-100vh) scale(1); opacity: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes borderGlow {
          0%, 100% { border-color: rgba(0,255,255,0.5); }
          50% { border-color: rgba(0,255,255,1); }
        }
      `}</style>
    </div>
  );
}

function StatBlock({ value, label, color }) {
  return (
    <div style={styles.statBlock}>
      <div style={{ ...styles.statValue, color, textShadow: `0 0 30px ${color}` }}>
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
    background: 'linear-gradient(180deg, #000 0%, #0a0a1a 50%, #000 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Space Mono', 'Courier New', monospace",
    color: '#00ffff',
    overflow: 'hidden'
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,255,0.02) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    animation: 'pulse 5s ease-in-out infinite'
  },
  mouseGlow: {
    position: 'absolute',
    width: 400,
    height: 400,
    background: 'radial-gradient(circle, rgba(0,255,255,0.15) 0%, transparent 70%)',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    transition: 'left 0.3s ease-out, top 0.3s ease-out'
  },
  particles: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none'
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    background: '#00ffff',
    borderRadius: '50%',
    animation: 'particleRise 15s linear infinite',
    boxShadow: '0 0 6px #00ffff'
  },
  orb: {
    position: 'relative',
    width: 200,
    height: 200,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, #00ffff 0%, #0066ff 30%, #000066 70%, #000 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
    animation: 'float 5s ease-in-out infinite',
    cursor: 'pointer',
    transition: 'transform 0.1s ease-out'
  },
  orbSymbol: {
    fontSize: 80,
    color: '#fff',
    textShadow: '0 0 40px #fff, 0 0 80px #00ffff'
  },
  orbRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 180,
    height: 180,
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: '50%',
    animation: 'orbRotate 10s linear infinite'
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    letterSpacing: 24,
    margin: 0,
    textShadow: '0 0 60px rgba(0,255,255,0.8), 0 0 120px rgba(0,255,255,0.4)',
    animation: 'fadeInUp 1s ease-out'
  },
  subtitle: {
    fontSize: 16,
    letterSpacing: 12,
    margin: '20px 0 50px',
    color: 'rgba(0,255,255,0.6)',
    fontWeight: 'normal',
    animation: 'fadeInUp 1s ease-out 0.2s backwards'
  },
  stats: {
    display: 'flex',
    gap: 60,
    marginBottom: 50,
    animation: 'fadeInUp 1s ease-out 0.4s backwards'
  },
  statBlock: {
    textAlign: 'center'
  },
  statValue: {
    fontSize: 42,
    fontWeight: 'bold'
  },
  statLabel: {
    fontSize: 11,
    letterSpacing: 3,
    color: 'rgba(0,255,255,0.4)',
    marginTop: 8
  },
  enterButton: {
    position: 'relative',
    padding: '20px 60px',
    background: 'transparent',
    border: '2px solid rgba(0,255,255,0.5)',
    borderRadius: 4,
    color: '#00ffff',
    fontSize: 18,
    letterSpacing: 8,
    textDecoration: 'none',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    animation: 'fadeInUp 1s ease-out 0.6s backwards, borderGlow 2s ease-in-out infinite'
  },
  enterText: {
    position: 'relative',
    zIndex: 1
  },
  enterGlow: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.2), transparent)',
    transform: 'translateX(-100%)',
    animation: 'none'
  },
  tagline: {
    position: 'absolute',
    bottom: 100,
    fontSize: 14,
    fontStyle: 'italic',
    color: 'rgba(255,0,255,0.6)',
    letterSpacing: 2,
    animation: 'fadeInUp 1s ease-out'
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 30,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8
  },
  versionBadge: {
    padding: '6px 16px',
    background: 'rgba(0,255,255,0.1)',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 20,
    fontSize: 10,
    letterSpacing: 3
  },
  techStack: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(0,255,255,0.3)'
  }
};
