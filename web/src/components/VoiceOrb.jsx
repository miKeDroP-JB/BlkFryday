'use client';

/**
 * ====================================================
 *  VOICE ORB - Real-Time Voice Interface
 * ====================================================
 *  WebRTC/WebAudio integration with VoiceFirst backend
 *  - 150ms RTT target
 *  - Glyph encoding visualization
 *  - Neural audio feedback
 * ====================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Glyph visualization data
const GLYPH_DISPLAY = {
  BUILD: { symbol: '\u2B22', color: '#00ffff' },
  SPEED: { symbol: '\u26A1', color: '#ffff00' },
  QUALITY: { symbol: '\uD83D\uDC8E', color: '#ff00ff' },
  LAUNCH: { symbol: '\uD83D\uDE80', color: '#00ff88' },
  THINK: { symbol: '\uD83E\uDDE0', color: '#8844ff' },
  TARGET: { symbol: '\uD83C\uDFAF', color: '#ff4444' },
  FOCUS: { symbol: '\u25C9', color: '#ffffff' },
  INFINITE: { symbol: '\u221E', color: '#00ffff' },
  QUANTUM: { symbol: '\u269B\uFE0F', color: '#ff00ff' },
  FORCE: { symbol: '\uD83D\uDD25', color: '#ff6600' }
};

export default function VoiceOrb({
  onCommand,
  onTranscript,
  isEnabled = true,
  size = 120,
  showGlyphs = true
}) {
  // State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [activeGlyph, setActiveGlyph] = useState(null);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [latency, setLatency] = useState(0);
  const [error, setError] = useState(null);

  // Refs
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = handleSpeechResult;
      recognitionRef.current.onerror = handleSpeechError;
      recognitionRef.current.onend = handleSpeechEnd;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Speech result handler
  const handleSpeechResult = useCallback((event) => {
    const results = Array.from(event.results);
    const lastResult = results[results.length - 1];

    if (lastResult) {
      const text = lastResult[0].transcript;
      setTranscript(text);
      onTranscript?.(text);

      // Detect glyphs from speech
      detectGlyphs(text);

      // If final result, process command
      if (lastResult.isFinal) {
        processVoiceCommand(text);
      }
    }
  }, [onTranscript]);

  // Detect glyphs from text
  const detectGlyphs = (text) => {
    const textLower = text.toLowerCase();
    const glyphMap = {
      'build': 'BUILD', 'create': 'BUILD', 'make': 'BUILD',
      'fast': 'SPEED', 'quick': 'SPEED', 'speed': 'SPEED',
      'quality': 'QUALITY', 'best': 'QUALITY', 'premium': 'QUALITY',
      'launch': 'LAUNCH', 'deploy': 'LAUNCH', 'ship': 'LAUNCH',
      'think': 'THINK', 'analyze': 'THINK', 'consider': 'THINK',
      'target': 'TARGET', 'aim': 'TARGET', 'focus': 'FOCUS',
      'infinite': 'INFINITE', 'unlimited': 'INFINITE',
      'quantum': 'QUANTUM', 'force': 'FORCE', 'power': 'FORCE'
    };

    for (const [word, glyph] of Object.entries(glyphMap)) {
      if (textLower.includes(word)) {
        setActiveGlyph(GLYPH_DISPLAY[glyph]);
        setTimeout(() => setActiveGlyph(null), 1500);
        break;
      }
    }
  };

  // Process voice command
  const processVoiceCommand = async (text) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    startTimeRef.current = Date.now();

    try {
      const response = await fetch('/api/v11/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text })
      });

      const data = await response.json();
      const rtt = Date.now() - startTimeRef.current;
      setLatency(rtt);

      if (data.success) {
        onCommand?.(data.data);

        // Show result glyph
        if (data.data.glyph) {
          setActiveGlyph({ symbol: data.data.glyph, color: '#00ffff' });
          setTimeout(() => setActiveGlyph(null), 2000);
        }

        // Play audio feedback
        playFeedback(data.data.type === 'command' ? 'success' : 'received');
      }
    } catch (err) {
      setError(err.message);
      playFeedback('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Speech error handler
  const handleSpeechError = (event) => {
    console.warn('[VoiceOrb] Speech error:', event.error);
    if (event.error !== 'no-speech') {
      setError(event.error);
    }
  };

  // Speech end handler
  const handleSpeechEnd = () => {
    if (isListening) {
      // Restart if still should be listening
      try {
        recognitionRef.current?.start();
      } catch (e) { /* ignore */ }
    }
  };

  // Toggle listening
  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      stopAudioAnalysis();
    } else {
      try {
        // Start audio analysis
        await startAudioAnalysis();

        // Start recognition
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
        setTranscript('');
        playFeedback('start');
      } catch (err) {
        setError(err.message);
      }
    }
  }, [isListening]);

  // Audio analysis for visual feedback
  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const analyze = () => {
        if (!isListening) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        setPulseIntensity(Math.min(1, average / 128));

        animationRef.current = requestAnimationFrame(analyze);
      };

      analyze();
    } catch (err) {
      console.warn('[VoiceOrb] Audio analysis error:', err);
    }
  };

  // Stop audio analysis
  const stopAudioAnalysis = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setPulseIntensity(0);
  };

  // Play audio feedback
  const playFeedback = (type) => {
    if (typeof window === 'undefined') return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const frequencies = {
        start: [440, 880],
        success: [523, 659, 784],
        received: [660],
        error: [220, 110]
      };

      const freqs = frequencies[type] || [440];
      let time = ctx.currentTime;

      freqs.forEach((freq, i) => {
        osc.frequency.setValueAtTime(freq, time + i * 0.1);
      });

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialDecayTo?.(0.001, ctx.currentTime + 0.3) ||
        gain.gain.setValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { /* ignore */ }
  };

  // Render orb
  const orbStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: isListening
      ? `radial-gradient(circle, rgba(0,255,255,${0.3 + pulseIntensity * 0.5}) 0%, rgba(0,102,255,0.8) 50%, rgba(0,0,51,1) 100%)`
      : 'radial-gradient(circle, rgba(0,255,255,0.2) 0%, rgba(0,102,255,0.4) 50%, rgba(0,0,51,1) 100%)',
    boxShadow: isListening
      ? `0 0 ${30 + pulseIntensity * 50}px rgba(0,255,255,${0.3 + pulseIntensity * 0.5}), inset 0 0 30px rgba(0,255,255,0.2)`
      : '0 0 20px rgba(0,255,255,0.2)',
    transition: 'box-shadow 0.1s, background 0.3s',
    cursor: isEnabled ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transform: isListening ? `scale(${1 + pulseIntensity * 0.1})` : 'scale(1)'
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Main Orb */}
      <div
        onClick={isEnabled ? toggleListening : undefined}
        style={orbStyle}
      >
        {/* Center Icon */}
        <div style={{
          fontSize: size * 0.3,
          color: isListening ? '#00ffff' : 'rgba(0,255,255,0.5)',
          textShadow: isListening ? '0 0 20px #00ffff' : 'none',
          transition: 'all 0.3s'
        }}>
          {isProcessing ? '\u23F3' : isListening ? '\uD83C\uDF99\uFE0F' : '\uD83C\uDFA4'}
        </div>

        {/* Active Glyph Overlay */}
        {activeGlyph && showGlyphs && (
          <div style={{
            position: 'absolute',
            fontSize: size * 0.5,
            color: activeGlyph.color,
            textShadow: `0 0 30px ${activeGlyph.color}`,
            animation: 'glyphPulse 1.5s ease-out forwards',
            pointerEvents: 'none'
          }}>
            {activeGlyph.symbol}
          </div>
        )}

        {/* Audio Level Ring */}
        {isListening && (
          <div style={{
            position: 'absolute',
            inset: -10,
            borderRadius: '50%',
            border: `2px solid rgba(0,255,255,${0.2 + audioLevel * 0.6})`,
            transform: `scale(${1 + audioLevel * 0.2})`,
            transition: 'all 0.05s'
          }} />
        )}
      </div>

      {/* Status Indicators */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4
      }}>
        {/* Transcript */}
        {transcript && (
          <div style={{
            fontSize: 12,
            color: 'rgba(0,255,255,0.8)',
            maxWidth: 200,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            "{transcript}"
          </div>
        )}

        {/* Latency */}
        {latency > 0 && (
          <div style={{
            fontSize: 10,
            color: latency < 150 ? '#00ff88' : latency < 300 ? '#ffff00' : '#ff4444'
          }}>
            {latency}ms RTT
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ fontSize: 10, color: '#ff4444' }}>
            {error}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes glyphPulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
          100% { opacity: 0; transform: scale(2); }
        }
      `}</style>
    </div>
  );
}
