'use client';
// ============================================================
//  ORBOS - IMMERSIVE BOOT SEQUENCE
//  "To what do I owe the pleasure?"
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { initNeonRiver } from '../lib/NeonRiver';

// Boot phases
const PHASES = {
  LOADING: 'loading',
  MUSIC: 'music',
  CHALLENGE: 'challenge',
  LISTENING: 'listening',
  UNLOCKING: 'unlocking',
  COMPLETE: 'complete'
};

export default function ORBOSBoot({ onUnlock, children }) {
  const [phase, setPhase] = useState(PHASES.LOADING);
  const [progress, setProgress] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [unlockAttempts, setUnlockAttempts] = useState(0);
  const [glitchText, setGlitchText] = useState('');
  const [showOrb, setShowOrb] = useState(false);

  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // ============================================================
  //  LOADING PHASE
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      // Simulate dramatic loading
      for (let i = 0; i <= 100; i += 2) {
        if (!mounted) return;
        setProgress(i);
        await new Promise(r => setTimeout(r, 30));
      }

      // Initialize NeonRiver in background
      initNeonRiver().catch(console.warn);

      // Show orb
      setShowOrb(true);
      await new Promise(r => setTimeout(r, 500));

      // Move to music phase
      if (mounted) setPhase(PHASES.MUSIC);
    };

    boot();
    return () => { mounted = false; };
  }, []);

  // ============================================================
  //  MUSIC PHASE - User clicks to start
  // ============================================================

  const startExperience = useCallback(async () => {
    // Try to play music
    if (audioRef.current) {
      try {
        audioRef.current.volume = 0.6;
        await audioRef.current.play();
        setAudioReady(true);
      } catch (e) {
        console.log('Audio autoplay blocked, continuing...');
        setAudioReady(true);
      }
    } else {
      setAudioReady(true);
    }

    // Dramatic pause then challenge
    await new Promise(r => setTimeout(r, 2000));
    setPhase(PHASES.CHALLENGE);

    // Speak the challenge
    await new Promise(r => setTimeout(r, 1000));
    speakChallenge();
  }, []);

  // ============================================================
  //  VOICE CHALLENGE
  // ============================================================

  const speakChallenge = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Lower music volume
    if (audioRef.current) {
      audioRef.current.volume = 0.2;
    }

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance("To what do I owe the pleasure?");

    // Find a deep voice
    const voices = synth.getVoices();
    const deepVoice = voices.find(v =>
      v.name.includes('Male') ||
      v.name.includes('Daniel') ||
      v.name.includes('Google UK English Male')
    ) || voices[0];

    utterance.voice = deepVoice;
    utterance.rate = 0.85;
    utterance.pitch = 0.7;
    utterance.volume = 1;

    utterance.onend = () => {
      setPhase(PHASES.LISTENING);
      startListening();
    };

    synth.speak(utterance);
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback: show text input
      setIsListening(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const current = event.results[event.results.length - 1];
      const text = current[0].transcript.toLowerCase();
      setTranscript(text);

      if (current.isFinal) {
        checkPassphrase(text);
      }
    };

    recognition.onerror = (e) => {
      console.log('Speech error:', e.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const checkPassphrase = useCallback((text) => {
    const normalized = text.toLowerCase().trim();

    // Check for passphrase variations
    const validPhrases = [
      'the pleasure is all mine',
      'the pleasure is mine',
      'pleasure is all mine',
      'pleasure is mine',
      'the pleasures all mine',
      'pleasures all mine'
    ];

    const isValid = validPhrases.some(phrase =>
      normalized.includes(phrase) ||
      normalized.replace(/['']/g, '').includes(phrase)
    );

    if (isValid) {
      unlockORBOS();
    } else {
      setUnlockAttempts(prev => prev + 1);

      if (unlockAttempts >= 2) {
        // After 3 attempts, show hint
        setGlitchText('Hint: "The pleasure is all mine"');
      }

      // Glitch effect
      setGlitchText('ACCESS DENIED');
      setTimeout(() => setGlitchText(''), 1500);

      // Try again
      setTimeout(() => {
        setTranscript('');
        setPhase(PHASES.CHALLENGE);
        setTimeout(speakChallenge, 1000);
      }, 2000);
    }
  }, [unlockAttempts, speakChallenge]);

  // Manual input fallback
  const handleManualInput = useCallback((e) => {
    if (e.key === 'Enter') {
      checkPassphrase(e.target.value);
    }
  }, [checkPassphrase]);

  // ============================================================
  //  UNLOCK SEQUENCE
  // ============================================================

  const unlockORBOS = useCallback(async () => {
    setPhase(PHASES.UNLOCKING);

    // Raise music volume for dramatic effect
    if (audioRef.current) {
      audioRef.current.volume = 0.8;
    }

    // Speak welcome
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance("Welcome to ORBOS.");
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      window.speechSynthesis.speak(utterance);
    }

    // Dramatic unlock animation
    await new Promise(r => setTimeout(r, 3000));

    // Fade out music
    if (audioRef.current) {
      const fadeOut = setInterval(() => {
        if (audioRef.current && audioRef.current.volume > 0.1) {
          audioRef.current.volume -= 0.1;
        } else {
          clearInterval(fadeOut);
          if (audioRef.current) {
            audioRef.current.pause();
          }
        }
      }, 100);
    }

    await new Promise(r => setTimeout(r, 1000));
    setPhase(PHASES.COMPLETE);
    onUnlock?.();
  }, [onUnlock]);

  // ============================================================
  //  RENDER COMPLETE - Show children
  // ============================================================

  if (phase === PHASES.COMPLETE) {
    return children;
  }

  // ============================================================
  //  RENDER BOOT SEQUENCE
  // ============================================================

  return (
    <div style={styles.container}>
      {/* Background Music */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        style={{ display: 'none' }}
      >
        {/* User should place their audio file here */}
        <source src="/audio/boot-music.mp3" type="audio/mpeg" />
        <source src="/audio/boot-music.wav" type="audio/wav" />
      </audio>

      {/* Animated Background */}
      <div style={styles.bgGrid} />
      <div style={styles.bgGlow} />

      {/* Particle Effect */}
      <div style={styles.particles}>
        {Array(20).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.particle,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div style={styles.content}>

        {/* LOADING PHASE */}
        {phase === PHASES.LOADING && (
          <>
            <pre style={styles.asciiLogo}>
{`
     ██████╗ ██████╗ ██████╗  ██████╗ ███████╗
    ██╔═══██╗██╔══██╗██╔══██╗██╔═══██╗██╔════╝
    ██║   ██║██████╔╝██████╔╝██║   ██║███████╗
    ██║   ██║██╔══██╗██╔══██╗██║   ██║╚════██║
    ╚██████╔╝██║  ██║██████╔╝╚██████╔╝███████║
     ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝
`}
            </pre>

            <div style={styles.progressContainer}>
              <div style={{ ...styles.progressBar, width: `${progress}%` }} />
            </div>
            <div style={styles.progressText}>INITIALIZING... {progress}%</div>
          </>
        )}

        {/* CENTRAL ORB - Shows after loading */}
        {showOrb && phase !== PHASES.LOADING && (
          <div style={{
            ...styles.orb,
            animation: phase === PHASES.UNLOCKING
              ? 'orbExpand 3s ease-out forwards'
              : 'orbFloat 4s ease-in-out infinite, orbPulse 2s ease-in-out infinite'
          }}>
            <div style={styles.orbInner}>
              <span style={styles.orbSymbol}>◉</span>
            </div>
            <div style={styles.orbRing} />
            <div style={{ ...styles.orbRing, animationDelay: '0.5s', width: 220, height: 220 }} />
          </div>
        )}

        {/* MUSIC PHASE - Click to start */}
        {phase === PHASES.MUSIC && (
          <div style={styles.startPrompt} onClick={startExperience}>
            <div style={styles.clickText}>CLICK TO ENTER</div>
            <div style={styles.subText}>Turn up your volume</div>
          </div>
        )}

        {/* CHALLENGE PHASE */}
        {phase === PHASES.CHALLENGE && (
          <div style={styles.challengeText}>
            <div style={styles.speakingIndicator}>◉ SPEAKING...</div>
          </div>
        )}

        {/* LISTENING PHASE */}
        {phase === PHASES.LISTENING && (
          <div style={styles.listeningContainer}>
            <div style={styles.listeningIndicator}>
              <span style={styles.micIcon}>🎤</span>
              <span style={styles.listeningText}>LISTENING...</span>
            </div>

            {transcript && (
              <div style={styles.transcript}>"{transcript}"</div>
            )}

            {/* Fallback text input */}
            <input
              type="text"
              placeholder="Or type your response..."
              style={styles.fallbackInput}
              onKeyDown={handleManualInput}
            />

            {unlockAttempts >= 2 && (
              <div style={styles.hint}>Hint: "The pleasure is all mine"</div>
            )}
          </div>
        )}

        {/* GLITCH TEXT */}
        {glitchText && (
          <div style={styles.glitchText}>{glitchText}</div>
        )}

        {/* UNLOCKING PHASE */}
        {phase === PHASES.UNLOCKING && (
          <div style={styles.unlockingContainer}>
            <div style={styles.welcomeText}>WELCOME TO ORBOS</div>
            <div style={styles.unlockBars}>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.unlockBar,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Version */}
        <div style={styles.version}>
          V11.5 | GODMODE ULTIMATE | NEON RIVER
        </div>
      </div>

      <style jsx global>{`
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.02); }
        }
        @keyframes orbPulse {
          0%, 100% { box-shadow: 0 0 60px rgba(0,255,255,0.5), 0 0 120px rgba(0,255,255,0.3); }
          50% { box-shadow: 0 0 100px rgba(0,255,255,0.8), 0 0 200px rgba(0,255,255,0.5); }
        }
        @keyframes orbExpand {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(2); opacity: 0.8; }
          100% { transform: scale(50); opacity: 0; }
        }
        @keyframes ringRotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes particleFloat {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(1); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-5px, 5px); }
          40% { transform: translate(-5px, -5px); }
          60% { transform: translate(5px, 5px); }
          80% { transform: translate(5px, -5px); }
        }
        @keyframes unlockSlide {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
//  STYLES
// ============================================================

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    background: '#000',
    overflow: 'hidden',
    fontFamily: "'Space Mono', 'Courier New', monospace"
  },
  bgGrid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
    animation: 'pulse 4s ease-in-out infinite'
  },
  bgGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '150vmax',
    height: '150vmax',
    background: 'radial-gradient(circle, rgba(0,255,255,0.1) 0%, transparent 50%)',
    animation: 'pulse 3s ease-in-out infinite'
  },
  particles: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none'
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    background: '#00ffff',
    borderRadius: '50%',
    animation: 'particleFloat 8s linear infinite',
    boxShadow: '0 0 10px #00ffff'
  },
  content: {
    position: 'relative',
    zIndex: 10,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00ffff'
  },
  asciiLogo: {
    fontSize: 10,
    lineHeight: 1.2,
    color: '#00ffff',
    textShadow: '0 0 20px #00ffff',
    margin: 0,
    animation: 'fadeIn 1s ease-out'
  },
  progressContainer: {
    width: 400,
    height: 4,
    background: 'rgba(0,255,255,0.2)',
    borderRadius: 2,
    marginTop: 40,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #00ffff, #ff00ff, #00ffff)',
    backgroundSize: '200% 100%',
    animation: 'pulse 1s ease-in-out infinite',
    transition: 'width 0.1s ease'
  },
  progressText: {
    marginTop: 16,
    fontSize: 14,
    letterSpacing: 4,
    opacity: 0.7
  },
  orb: {
    position: 'relative',
    width: 180,
    height: 180,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, #00ffff 0%, #0066ff 40%, #000033 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  orbInner: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  orbSymbol: {
    fontSize: 72,
    color: '#fff',
    textShadow: '0 0 30px #fff'
  },
  orbRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 200,
    height: 200,
    border: '1px solid rgba(0,255,255,0.3)',
    borderRadius: '50%',
    animation: 'ringRotate 10s linear infinite'
  },
  startPrompt: {
    position: 'absolute',
    bottom: 150,
    cursor: 'pointer',
    textAlign: 'center',
    animation: 'pulse 2s ease-in-out infinite'
  },
  clickText: {
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: 'bold',
    textShadow: '0 0 20px #00ffff'
  },
  subText: {
    marginTop: 16,
    fontSize: 12,
    opacity: 0.5,
    letterSpacing: 2
  },
  challengeText: {
    position: 'absolute',
    bottom: 150,
    textAlign: 'center'
  },
  speakingIndicator: {
    fontSize: 18,
    letterSpacing: 4,
    animation: 'pulse 1s ease-in-out infinite'
  },
  listeningContainer: {
    position: 'absolute',
    bottom: 100,
    textAlign: 'center',
    width: '100%',
    maxWidth: 500
  },
  listeningIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    fontSize: 20,
    marginBottom: 24
  },
  micIcon: {
    fontSize: 32,
    animation: 'pulse 0.5s ease-in-out infinite'
  },
  listeningText: {
    letterSpacing: 4
  },
  transcript: {
    fontSize: 24,
    fontStyle: 'italic',
    color: '#ff00ff',
    marginBottom: 24,
    minHeight: 40
  },
  fallbackInput: {
    width: '80%',
    padding: '16px 24px',
    background: 'rgba(0,255,255,0.1)',
    border: '1px solid rgba(0,255,255,0.3)',
    borderRadius: 8,
    color: '#00ffff',
    fontSize: 16,
    textAlign: 'center',
    outline: 'none'
  },
  hint: {
    marginTop: 24,
    fontSize: 12,
    color: '#ff00ff',
    opacity: 0.7
  },
  glitchText: {
    position: 'absolute',
    top: '40%',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff0000',
    textShadow: '0 0 20px #ff0000',
    animation: 'glitch 0.3s ease-in-out infinite',
    letterSpacing: 8
  },
  unlockingContainer: {
    position: 'absolute',
    bottom: 150,
    textAlign: 'center'
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 12,
    textShadow: '0 0 40px #00ffff',
    marginBottom: 40,
    animation: 'fadeIn 1s ease-out'
  },
  unlockBars: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center'
  },
  unlockBar: {
    width: 60,
    height: 4,
    background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
    borderRadius: 2,
    transformOrigin: 'left',
    animation: 'unlockSlide 0.5s ease-out forwards'
  },
  version: {
    position: 'absolute',
    bottom: 20,
    fontSize: 10,
    letterSpacing: 2,
    opacity: 0.3
  }
};

export { ORBOSBoot };
