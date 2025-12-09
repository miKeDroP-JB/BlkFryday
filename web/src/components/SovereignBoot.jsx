/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                     SOVEREIGN BOOT - CINEMATIC UI                             ║
 * ║                                                                               ║
 * ║   "12 seconds of pure ceremony and flow-state priming."                       ║
 * ║   "Think Iron Man's suit-up, TRON mainframe energy surge."                    ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const PHASES = {
  IDLE: 'idle',
  SPARK: 'spark',
  IGNITION: 'ignition',
  GREETING: 'greeting',
  VOICE_LOCK: 'voice_lock',
  UNLOCK: 'unlock',
  COMPLETE: 'complete'
};

const SYSTEM_MESSAGES = [
  'INITIALIZING 0Rb FRACTAL ENGINE...',
  'ALPHA CORES ONLINE...',
  'MEMORY MATRICES ALIGNING...',
  'NEURAL PATHWAYS ACTIVATED...',
  'QUANTUM FIELDS STABILIZING...',
  'SOVEREIGN SYSTEMS READY...'
];

// ═══════════════════════════════════════════════════════════════════════════════
// FRACTAL PARTICLE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function FractalParticles({ phase, audioLevel = 0 }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

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

    // Initialize particles
    const particleCount = 150;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.6 + 0.2,
      hue: Math.random() * 60 + 160, // Cyan to blue range
      targetX: null,
      targetY: null
    }));

    const animate = () => {
      // Clear with trail effect
      ctx.fillStyle = phase === PHASES.VOICE_LOCK
        ? 'rgba(10, 10, 15, 0.15)'  // Slower fade during voice lock
        : 'rgba(10, 10, 15, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      particlesRef.current.forEach((p, i) => {
        // Phase-specific behavior
        if (phase === PHASES.SPARK) {
          // Converge to center
          const dx = centerX - p.x;
          const dy = centerY - p.y;
          p.vx += dx * 0.001;
          p.vy += dy * 0.001;
        } else if (phase === PHASES.VOICE_LOCK) {
          // Freeze in place (subtle drift only)
          p.vx *= 0.95;
          p.vy *= 0.95;
        } else if (phase === PHASES.GREETING) {
          // Pulse with audio
          const pulseFactor = 1 + audioLevel * 0.5;
          p.size = (Math.random() * 3 + 1) * pulseFactor;
        } else if (phase === PHASES.UNLOCK) {
          // Explode outward
          const dx = p.x - centerX;
          const dy = p.y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          p.vx += (dx / dist) * 0.3;
          p.vy += (dy / dist) * 0.3;
        }

        // Apply velocity
        p.x += p.vx;
        p.y += p.vy;

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.alpha})`;
        ctx.fill();

        // Connect nearby particles
        particlesRef.current.slice(i + 1).forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(180, 100%, 50%, ${0.1 * (1 - dist / 100)})`;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase, audioLevel]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      style={{ background: '#0a0a0f' }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLASMA ARC EFFECT
// ═══════════════════════════════════════════════════════════════════════════════

function PlasmaArc({ active }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.svg
          className="absolute inset-0 z-10 pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <defs>
            <linearGradient id="plasmaGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0" />
              <stop offset="50%" stopColor="#7dd3fc" stopOpacity="1" />
              <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
            </linearGradient>
            <filter id="plasmaGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <motion.path
            d="M 0,0 Q 50,2 100,0"
            fill="none"
            stroke="url(#plasmaGradient)"
            strokeWidth="0.5"
            filter="url(#plasmaGlow)"
            initial={{ pathLength: 0, pathOffset: 1 }}
            animate={{ pathLength: 1, pathOffset: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOVEREIGN SIGIL
// ═══════════════════════════════════════════════════════════════════════════════

function SovereignSigil({ phase, scale = 1 }) {
  const controls = useAnimation();

  useEffect(() => {
    if (phase === PHASES.SPARK) {
      controls.start({
        scale: [0, 1.2, 1],
        rotate: [0, 360],
        opacity: [0, 1],
        transition: { duration: 1, ease: "easeOut" }
      });
    } else if (phase === PHASES.UNLOCK) {
      controls.start({
        scale: [1, 1.5, 1],
        filter: ["drop-shadow(0 0 20px #00ffff)", "drop-shadow(0 0 60px #00ffff)", "drop-shadow(0 0 30px #00ffff)"],
        transition: { duration: 0.5 }
      });
    }
  }, [phase, controls]);

  return (
    <motion.div
      className="relative"
      style={{ width: 200 * scale, height: 200 * scale }}
      animate={controls}
    >
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 border-2 border-cyan-400 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ filter: 'drop-shadow(0 0 10px #00ffff)' }}
      />

      {/* Middle ring */}
      <motion.div
        className="absolute inset-4 border border-cyan-400/50 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      {/* Inner ring */}
      <motion.div
        className="absolute inset-8 border border-cyan-400/30 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Core orb */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: phase === PHASES.GREETING ? [1, 1.1, 1] : 1
        }}
        transition={{ duration: 0.5, repeat: phase === PHASES.GREETING ? Infinity : 0 }}
      >
        <div
          className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600"
          style={{
            boxShadow: '0 0 40px #00ffff, inset 0 0 20px rgba(255,255,255,0.3)'
          }}
        />
      </motion.div>

      {/* Orbiting dots */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-cyan-400 rounded-full"
          style={{
            top: '50%',
            left: '50%',
            marginTop: -4,
            marginLeft: -4,
          }}
          animate={{
            x: Math.cos((angle + (Date.now() / 50)) * Math.PI / 180) * 80,
            y: Math.sin((angle + (Date.now() / 50)) * Math.PI / 180) * 80,
          }}
          transition={{ duration: 0.1 }}
        />
      ))}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TERMINAL MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

function TerminalMessages({ messages, active }) {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setVisibleMessages([]);
      setCurrentIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev < messages.length) {
          setVisibleMessages(msgs => [...msgs, messages[prev]]);
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [active, messages]);

  return (
    <div className="font-mono text-sm text-cyan-400/80 space-y-1">
      <AnimatePresence>
        {visibleMessages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <span className="text-green-400">{">"}</span>
            <span>{msg}</span>
            {i === visibleMessages.length - 1 && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                _
              </motion.span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE LOCK UI
// ═══════════════════════════════════════════════════════════════════════════════

function VoiceLockUI({ active, onVoiceInput, isListening }) {
  const [transcript, setTranscript] = useState('');

  // Voice recognition setup
  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);

      if (result.isFinal) {
        onVoiceInput?.(result[0].transcript);
      }
    };

    recognition.start();

    return () => {
      recognition.stop();
    };
  }, [active, onVoiceInput]);

  if (!active) return null;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Listening indicator */}
      <motion.div
        className="w-24 h-24 rounded-full border-4 border-cyan-400 flex items-center justify-center mb-8"
        animate={{
          scale: [1, 1.1, 1],
          borderColor: ['#00ffff', '#00d4ff', '#00ffff']
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <motion.div
          className="w-8 h-8 bg-cyan-400 rounded-full"
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      </motion.div>

      {/* Transcript display */}
      <div className="text-center">
        <p className="text-white/60 text-sm mb-2">LISTENING...</p>
        <p className="text-cyan-400 text-xl font-mono min-h-[2em]">
          {transcript || '...'}
        </p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI AVATAR
// ═══════════════════════════════════════════════════════════════════════════════

function AIAvatar({ visible, speaking }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute left-8 top-1/2 -translate-y-1/2 z-20"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
        >
          {/* Avatar glow */}
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 backdrop-blur-sm"
            animate={{
              boxShadow: speaking
                ? ['0 0 30px #00ffff', '0 0 60px #00ffff', '0 0 30px #00ffff']
                : '0 0 20px #00ffff'
            }}
            transition={{ duration: 0.3, repeat: speaking ? Infinity : 0 }}
          >
            <div className="w-full h-full rounded-full border border-cyan-400/50 flex items-center justify-center">
              {/* Simple avatar icon */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SOVEREIGN BOOT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SovereignBoot({
  musicSrc = '/audio/boot_track.mp3',
  onComplete,
  onDenied,
  autoStart = true
}) {
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [audioLevel, setAudioLevel] = useState(0);
  const [greeting, setGreeting] = useState('');
  const [musicVolume, setMusicVolume] = useState(0);
  const audioRef = useRef(null);
  const speechSynthRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // AUDIO SETUP
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(musicSrc);
      audioRef.current.loop = true;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [musicSrc]);

  // ─────────────────────────────────────────────────────────────────────────────
  // TEXT-TO-SPEECH
  // ─────────────────────────────────────────────────────────────────────────────

  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.95;
      utterance.rate = 0.9;
      utterance.volume = 1;

      // Try to get a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v =>
        v.name.includes('Google UK English Male') ||
        v.name.includes('Daniel') ||
        v.lang === 'en-GB'
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onend = resolve;
      utterance.onerror = resolve;

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // BOOT SEQUENCE
  // ─────────────────────────────────────────────────────────────────────────────

  const executeBootSequence = useCallback(async () => {
    // PHASE 1: THE SPARK (0-1s)
    setPhase(PHASES.SPARK);
    await delay(1000);

    // PHASE 2: IGNITION (1-4s)
    setPhase(PHASES.IGNITION);
    if (audioRef.current) {
      audioRef.current.volume = 0;
      audioRef.current.play().catch(() => {});

      // Fade in music
      let vol = 0;
      const fadeIn = setInterval(() => {
        vol += 0.05;
        if (vol >= 1) {
          vol = 1;
          clearInterval(fadeIn);
        }
        audioRef.current.volume = vol;
        setMusicVolume(vol);
      }, 100);
    }
    await delay(3000);

    // PHASE 3: GREETING (4-7s)
    setPhase(PHASES.GREETING);
    setGreeting('To what do I owe the pleasure?');

    // Duck music
    if (audioRef.current) {
      audioRef.current.volume = 0.34;
      setMusicVolume(0.34);
    }

    await speak('To what do I owe the pleasure?');
    await delay(500);

    // PHASE 4: VOICE LOCK (7-9s)
    setPhase(PHASES.VOICE_LOCK);

  }, [speak]);

  // Handle voice input
  const handleVoiceInput = useCallback(async (transcript) => {
    const normalized = transcript.toLowerCase().trim();
    const expected = 'the pleasure is all mine';

    // Simple matching
    const isMatch = normalized.includes('pleasure') && normalized.includes('mine');

    if (isMatch) {
      // PHASE 5: UNLOCK (9-12s)
      setPhase(PHASES.UNLOCK);

      // Music surge
      if (audioRef.current) {
        audioRef.current.volume = 1;
        setMusicVolume(1);
      }

      await speak('Welcome back. Command pathways open.');
      await delay(2000);

      setPhase(PHASES.COMPLETE);
      onComplete?.();
    } else {
      // Denied
      await speak('Voice lock failed. Access denied.');
      onDenied?.();
    }
  }, [speak, onComplete, onDenied]);

  // Auto-start
  useEffect(() => {
    if (autoStart && phase === PHASES.IDLE) {
      executeBootSequence();
    }
  }, [autoStart, phase, executeBootSequence]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-hidden">
      {/* Fractal Particles */}
      <FractalParticles phase={phase} audioLevel={audioLevel} />

      {/* Plasma Arc (spark phase) */}
      <PlasmaArc active={phase === PHASES.SPARK} />

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">

        {/* Sigil */}
        <AnimatePresence>
          {phase !== PHASES.IDLE && phase !== PHASES.COMPLETE && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="mb-8"
            >
              <SovereignSigil phase={phase} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terminal Messages (ignition phase) */}
        <div className="absolute left-8 bottom-8 max-w-md">
          <TerminalMessages
            messages={SYSTEM_MESSAGES}
            active={phase === PHASES.IGNITION}
          />
        </div>

        {/* Greeting Text */}
        <AnimatePresence>
          {phase === PHASES.GREETING && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-2xl text-white font-light tracking-wider">
                "{greeting}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Lock UI */}
        <VoiceLockUI
          active={phase === PHASES.VOICE_LOCK}
          onVoiceInput={handleVoiceInput}
          isListening={phase === PHASES.VOICE_LOCK}
        />

        {/* Unlock Message */}
        <AnimatePresence>
          {phase === PHASES.UNLOCK && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.h1
                className="text-4xl font-bold text-cyan-400 mb-4"
                animate={{
                  textShadow: [
                    '0 0 20px #00ffff',
                    '0 0 60px #00ffff',
                    '0 0 20px #00ffff'
                  ]
                }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                ACCESS GRANTED
              </motion.h1>
              <p className="text-white/80">Welcome back. Command pathways open.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Avatar */}
        <AIAvatar
          visible={phase === PHASES.GREETING || phase === PHASES.UNLOCK}
          speaking={phase === PHASES.GREETING}
        />
      </div>

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-50"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
          opacity: 0.3
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 text-cyan-400/30 text-2xl">{"◢"}</div>
      <div className="absolute top-4 right-4 text-cyan-400/30 text-2xl">{"◣"}</div>
      <div className="absolute bottom-4 left-4 text-cyan-400/30 text-2xl">{"◥"}</div>
      <div className="absolute bottom-4 right-4 text-cyan-400/30 text-2xl">{"◤"}</div>

      {/* Phase indicator (debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-cyan-400/50 text-xs font-mono">
          PHASE: {phase.toUpperCase()} | MUSIC: {Math.round(musicVolume * 100)}%
        </div>
      )}
    </div>
  );
}

// Helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
