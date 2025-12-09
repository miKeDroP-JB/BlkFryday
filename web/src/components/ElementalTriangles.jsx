/**
 * 0R8.AI - ELEMENTAL TRIANGLES BANNER
 * Ice • Energy • Fire - The fundamental forces
 *
 * "INITIATE CONNECTION" - System Online
 */

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════
// ELEMENTAL TRIANGLE SVG COMPONENTS
// ═══════════════════════════════════════════════════════════════

const IceTriangle = ({ className = '' }) => (
  <svg viewBox="0 0 100 100" className={`triangle-svg ${className}`}>
    <defs>
      <linearGradient id="iceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00ffff" stopOpacity="1" />
        <stop offset="50%" stopColor="#0099cc" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#00ffff" stopOpacity="0.6" />
      </linearGradient>
      <filter id="iceGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    {/* Outer triangle */}
    <polygon
      points="50,10 90,80 10,80"
      fill="none"
      stroke="url(#iceGradient)"
      strokeWidth="2"
      filter="url(#iceGlow)"
    />
    {/* Inner triangle */}
    <polygon
      points="50,25 75,70 25,70"
      fill="none"
      stroke="#00ffff"
      strokeWidth="1.5"
      opacity="0.7"
    />
    {/* Crossbar (double triangle) */}
    <line x1="25" y1="55" x2="75" y2="55" stroke="#00ffff" strokeWidth="1.5" opacity="0.6" />
  </svg>
);

const EnergyTriangle = ({ className = '' }) => (
  <svg viewBox="0 0 100 100" className={`triangle-svg ${className}`}>
    <defs>
      <radialGradient id="energyGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00ffff" stopOpacity="0.9" />
        <stop offset="70%" stopColor="#0066aa" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#003355" stopOpacity="0.1" />
      </radialGradient>
      <filter id="energyGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    {/* Energy sphere */}
    <circle cx="50" cy="50" r="40" fill="url(#energyGradient)" filter="url(#energyGlow)" />
    {/* Lightning lines */}
    <path d="M30,30 L50,50 L35,50 L55,75" fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.6" />
    <path d="M70,30 L50,50 L65,50 L45,75" fill="none" stroke="#00ffff" strokeWidth="1" opacity="0.6" />
    {/* Inner triangle */}
    <polygon
      points="50,20 80,70 20,70"
      fill="none"
      stroke="#00ffff"
      strokeWidth="2"
      filter="url(#energyGlow)"
    />
    {/* Center dot */}
    <circle cx="50" cy="48" r="4" fill="#ffffff" opacity="0.9" />
  </svg>
);

const FireTriangle = ({ className = '' }) => (
  <svg viewBox="0 0 100 100" className={`triangle-svg ${className}`}>
    <defs>
      <linearGradient id="fireGradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ff4400" stopOpacity="1" />
        <stop offset="50%" stopColor="#ff6600" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#ff9900" stopOpacity="0.7" />
      </linearGradient>
      <filter id="fireGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    {/* Outer triangle */}
    <polygon
      points="50,10 90,80 10,80"
      fill="none"
      stroke="url(#fireGradient)"
      strokeWidth="3"
      filter="url(#fireGlow)"
    />
    {/* Inner triangle */}
    <polygon
      points="50,25 75,70 25,70"
      fill="none"
      stroke="#ff6600"
      strokeWidth="1.5"
      opacity="0.8"
    />
    {/* Flame wisps */}
    <path d="M50,10 Q55,0 50,5 Q45,0 50,10" fill="none" stroke="#ff9900" strokeWidth="1" opacity="0.7" />
  </svg>
);

const CompassWheel = ({ className = '' }) => (
  <svg viewBox="0 0 100 100" className={`wheel-svg ${className}`}>
    <defs>
      <linearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#cc9900" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    {/* Outer circle */}
    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#wheelGradient)" strokeWidth="2" />
    {/* Inner circle */}
    <circle cx="50" cy="50" r="35" fill="none" stroke="#ffd700" strokeWidth="1" opacity="0.5" />
    {/* Spokes - 8 directions */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 50 + 15 * Math.cos(rad);
      const y1 = 50 + 15 * Math.sin(rad);
      const x2 = 50 + 40 * Math.cos(rad);
      const y2 = 50 + 40 * Math.sin(rad);
      return (
        <line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#ffd700"
          strokeWidth={i % 2 === 0 ? "2" : "1"}
          opacity={i % 2 === 0 ? "0.9" : "0.5"}
        />
      );
    })}
    {/* Center */}
    <circle cx="50" cy="50" r="8" fill="#ffd700" opacity="0.8" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// PARTICLE MIST EFFECT
// ═══════════════════════════════════════════════════════════════

function ParticleMist({ color = '#00ffff', direction = 'right' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 60;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: direction === 'right' ? Math.random() * 2 + 0.5 : -(Math.random() * 2 + 0.5),
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.5 + 0.1
      });
    }

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (direction === 'right' && p.x > canvas.width + 10) {
          p.x = -10;
          p.y = Math.random() * canvas.height;
        } else if (direction === 'left' && p.x < -10) {
          p.x = canvas.width + 10;
          p.y = Math.random() * canvas.height;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = color.replace(')', `, ${p.alpha})`).replace('rgb', 'rgba');
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [color, direction]);

  return <canvas ref={canvasRef} className="particle-mist" />;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function ElementalTriangles({ onInitiate, systemStatus = 'ONLINE' }) {
  return (
    <div className="elemental-banner">
      {/* Background effects */}
      <div className="banner-bg">
        <div className="stars" />
        <div className="gradient-overlay" />
      </div>

      {/* HUD Frame */}
      <div className="hud-frame">
        <div className="frame-corner tl" />
        <div className="frame-corner tr" />
        <div className="frame-corner bl" />
        <div className="frame-corner br" />
      </div>

      {/* Header */}
      <div className="banner-header">
        <div className="header-left">
          <span className="brand">0r8.ai</span>
        </div>
        <div className="header-center">
          <span className="tagline">INITIATE CONNECTION</span>
        </div>
        <div className="header-right">
          <span className="status-label">SYSTEM:</span>
          <span className={`status-value ${systemStatus.toLowerCase()}`}>{systemStatus}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="elemental-content">
        {/* Ice Triangle - Left */}
        <motion.div
          className="element-group ice"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <ParticleMist color="rgb(0, 255, 255)" direction="right" />
          <div className="triangle-container rotating-slow">
            <IceTriangle />
          </div>
          <div className="triangle-container offset rotating-slow-reverse">
            <IceTriangle />
          </div>
        </motion.div>

        {/* Energy Sphere - Center */}
        <motion.div
          className="element-group energy"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="sphere-container pulsing">
            <EnergyTriangle />
          </div>
        </motion.div>

        {/* Fire Triangle - Right */}
        <motion.div
          className="element-group fire"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <ParticleMist color="rgb(255, 100, 0)" direction="left" />
          <div className="triangle-container rotating-slow">
            <FireTriangle />
          </div>
        </motion.div>

        {/* Compass Wheel - Far Right */}
        <motion.div
          className="element-group compass"
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="wheel-container rotating-medium">
            <CompassWheel />
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="banner-footer">
        <motion.button
          className="initiate-btn"
          onClick={onInitiate}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="btn-text">LOADG</span>
          <span className="btn-progress" />
        </motion.button>
      </div>

      <style jsx>{`
        .elemental-banner {
          position: relative;
          width: 100%;
          height: 300px;
          background: linear-gradient(180deg, #050510 0%, #0a0a1a 50%, #0f0f20 100%);
          overflow: hidden;
          font-family: 'Rajdhani', sans-serif;
        }

        .banner-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .stars {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image:
            radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.2), transparent),
            radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 80% 50%, rgba(255,255,255,0.2), transparent),
            radial-gradient(1px 1px at 90% 80%, rgba(255,255,255,0.3), transparent);
        }

        .gradient-overlay {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg,
            rgba(0,255,255,0.05) 0%,
            transparent 30%,
            transparent 70%,
            rgba(255,100,0,0.05) 100%
          );
        }

        .hud-frame {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          bottom: 10px;
          pointer-events: none;
        }

        .frame-corner {
          position: absolute;
          width: 30px;
          height: 30px;
          border-color: #00ffff;
          border-style: solid;
          border-width: 0;
          opacity: 0.5;
        }

        .frame-corner.tl {
          top: 0; left: 0;
          border-top-width: 2px;
          border-left-width: 2px;
        }

        .frame-corner.tr {
          top: 0; right: 0;
          border-top-width: 2px;
          border-right-width: 2px;
        }

        .frame-corner.bl {
          bottom: 0; left: 0;
          border-bottom-width: 2px;
          border-left-width: 2px;
        }

        .frame-corner.br {
          bottom: 0; right: 0;
          border-bottom-width: 2px;
          border-right-width: 2px;
        }

        .banner-header {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
          z-index: 10;
        }

        .brand {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #00ffff;
          text-shadow: 0 0 20px rgba(0,255,255,0.5);
        }

        .tagline {
          font-family: 'Space Mono', monospace;
          font-size: 0.85rem;
          color: #888;
          letter-spacing: 0.2em;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-label {
          font-size: 0.75rem;
          color: #666;
        }

        .status-value {
          font-family: 'Orbitron', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .status-value.online {
          color: #2ecc71;
          text-shadow: 0 0 10px rgba(46,204,113,0.5);
        }

        .status-value.connecting {
          color: #f1c40f;
          animation: blink 1s infinite;
        }

        .elemental-content {
          position: relative;
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 180px;
          padding: 0 40px;
          z-index: 5;
        }

        .element-group {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .element-group.ice {
          width: 200px;
          height: 150px;
        }

        .element-group.energy {
          width: 180px;
          height: 180px;
        }

        .element-group.fire {
          width: 150px;
          height: 150px;
        }

        .element-group.compass {
          width: 100px;
          height: 100px;
        }

        .triangle-container {
          position: absolute;
          width: 120px;
          height: 120px;
        }

        .triangle-container.offset {
          transform: translateX(-50px);
          opacity: 0.6;
        }

        .sphere-container {
          width: 160px;
          height: 160px;
        }

        .wheel-container {
          width: 80px;
          height: 80px;
        }

        .element-group :global(.particle-mist) {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .element-group :global(.triangle-svg),
        .element-group :global(.wheel-svg) {
          width: 100%;
          height: 100%;
        }

        /* Rotation Animations */
        .rotating-slow {
          animation: rotate 20s linear infinite;
        }

        .rotating-slow-reverse {
          animation: rotate 25s linear infinite reverse;
        }

        .rotating-medium {
          animation: rotate 15s linear infinite;
        }

        .pulsing {
          animation: pulse-scale 3s ease-in-out infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .banner-footer {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }

        .initiate-btn {
          position: relative;
          background: transparent;
          border: 1px solid #00ffff;
          color: #00ffff;
          padding: 10px 30px;
          font-family: 'Orbitron', sans-serif;
          font-size: 0.9rem;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s;
        }

        .initiate-btn:hover {
          background: rgba(0,255,255,0.1);
          box-shadow: 0 0 20px rgba(0,255,255,0.3);
        }

        .btn-text {
          position: relative;
          z-index: 1;
        }

        .btn-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          width: 0;
          background: #00ffff;
          transition: width 0.3s;
        }

        .initiate-btn:hover .btn-progress {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
