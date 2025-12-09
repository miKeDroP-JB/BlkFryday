/**
 * 0RB LANDING - Simple. Sigil. Blue Iridium Sparkle.
 * "Almost like a joke" - but it hits different.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function Landing() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  // Sparkle particle effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Iridium blue sparkle particles
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      hue: 200 + Math.random() * 40, // Blue to cyan range
      alpha: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * Math.PI * 2
    }));

    let animationId;
    const animate = () => {
      ctx.fillStyle = 'rgba(5, 5, 12, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.twinkle += 0.05;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Twinkle effect
        const twinkleAlpha = p.alpha * (0.5 + 0.5 * Math.sin(p.twinkle));

        // Draw sparkle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${twinkleAlpha})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${twinkleAlpha * 0.2})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#05050c] overflow-hidden flex items-center justify-center">
      {/* Sparkle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center">

        {/* The Sigil */}
        <div
          className="relative cursor-pointer transition-transform duration-500"
          style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => router.push('/boot')}
        >
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(77,166,255,0.15) 0%, transparent 70%)',
              transform: 'scale(2)',
              filter: 'blur(20px)',
              animation: 'pulse 3s ease-in-out infinite'
            }}
          />

          {/* SVG Sigil */}
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            className="relative z-10"
            style={{
              filter: `drop-shadow(0 0 ${hovered ? '40px' : '20px'} rgba(77,166,255,0.6))`,
              transition: 'filter 0.5s ease'
            }}
          >
            {/* Definitions */}
            <defs>
              {/* Iridium Blue Gradient */}
              <linearGradient id="iridiumBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4da6ff" />
                <stop offset="25%" stopColor="#00d4ff" />
                <stop offset="50%" stopColor="#4da6ff" />
                <stop offset="75%" stopColor="#0099ff" />
                <stop offset="100%" stopColor="#4da6ff" />
              </linearGradient>

              {/* Animated gradient for shimmer */}
              <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)">
                  <animate attributeName="offset" values="-1;1" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="rgba(255,255,255,0.3)">
                  <animate attributeName="offset" values="-0.5;1.5" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="rgba(255,255,255,0)">
                  <animate attributeName="offset" values="0;2" dur="2s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </defs>

            {/* Outer Ring */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="url(#iridiumBlue)"
              strokeWidth="2"
              opacity="0.8"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 100 100"
                to="360 100 100"
                dur="30s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Middle Ring */}
            <circle
              cx="100"
              cy="100"
              r="70"
              fill="none"
              stroke="url(#iridiumBlue)"
              strokeWidth="1"
              opacity="0.5"
              strokeDasharray="10 5"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="360 100 100"
                to="0 100 100"
                dur="20s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Inner Ring */}
            <circle
              cx="100"
              cy="100"
              r="50"
              fill="none"
              stroke="url(#iridiumBlue)"
              strokeWidth="1"
              opacity="0.3"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 100 100"
                to="360 100 100"
                dur="15s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Core Orb */}
            <circle
              cx="100"
              cy="100"
              r="25"
              fill="url(#iridiumBlue)"
              opacity="0.9"
            >
              <animate
                attributeName="r"
                values="23;27;23"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Inner glow */}
            <circle
              cx="100"
              cy="100"
              r="15"
              fill="#ffffff"
              opacity="0.3"
            />

            {/* Shimmer overlay */}
            <circle
              cx="100"
              cy="100"
              r="25"
              fill="url(#shimmer)"
              opacity="0.5"
            />

            {/* Orbital dots */}
            {[0, 72, 144, 216, 288].map((angle, i) => (
              <circle
                key={i}
                cx={100 + 80 * Math.cos((angle * Math.PI) / 180)}
                cy={100 + 80 * Math.sin((angle * Math.PI) / 180)}
                r="3"
                fill="#4da6ff"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`0 100 100`}
                  to={`360 100 100`}
                  dur="10s"
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </svg>
        </div>

        {/* Text */}
        <div className="mt-12 text-center">
          <h1
            className="text-4xl font-light tracking-[0.3em] mb-2"
            style={{
              background: 'linear-gradient(90deg, #4da6ff, #00d4ff, #4da6ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(77,166,255,0.3)'
            }}
          >
            0RB
          </h1>
          <p className="text-[#4da6ff]/50 text-sm tracking-widest">
            CLICK TO ENTER
          </p>
        </div>
      </div>

      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(5,5,12,0.5) 100%)'
        }}
      />

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(2); }
          50% { opacity: 0.5; transform: scale(2.2); }
        }
      `}</style>
    </div>
  );
}
