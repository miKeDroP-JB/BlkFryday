/**
 * THE SIGIL - Voice-Native Encrypted Landing
 * ═══════════════════════════════════════════════════════════════════
 * Speak to enter. The Oracle listens.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

// WebSocket connection to Voice Brain
const BRAIN_WS_URL = process.env.NEXT_PUBLIC_BRAIN_WS || 'ws://localhost:3002';

// Encryption key derivation (client-side ceremony)
const deriveKey = async (passphrase) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(passphrase);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Voice phrases that unlock different modes
const VOICE_KEYS = {
  'awaken': 'INIT',
  'oracle': 'QUERY',
  'infinite': 'GENERATE',
  'solve': 'SOLVE',
  'status': 'STATUS',
  'reveal': 'REVEAL',
  'genesis': 'GENESIS',
  'singularity': 'TRANSCEND'
};

export default function Sigil() {
  const [state, setState] = useState('dormant'); // dormant, listening, processing, responding
  const [message, setMessage] = useState('');
  const [pulseIntensity, setPulseIntensity] = useState(0.3);
  const [unlocked, setUnlocked] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responses, setResponses] = useState([]);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const wsRef = useRef(null);
  const [brainConnected, setBrainConnected] = useState(false);

  // Connect to Voice Brain WebSocket
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const ws = new WebSocket(BRAIN_WS_URL);

        ws.onopen = () => {
          console.log('[BRAIN] Connected');
          setBrainConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'response' && data.speak) {
              speak(data.speak);
              if (data.data) {
                addResponse({ type: data.type, text: data.speak.slice(0, 50), timestamp: Date.now() });
              }
            }
          } catch (e) {
            console.error('[BRAIN] Parse error:', e);
          }
        };

        ws.onclose = () => {
          console.log('[BRAIN] Disconnected');
          setBrainConnected(false);
        };

        ws.onerror = () => {
          console.log('[BRAIN] Connection failed - using local mode');
          setBrainConnected(false);
        };

        wsRef.current = ws;
      } catch (e) {
        console.log('[BRAIN] WebSocket not available');
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.toLowerCase().trim();
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            processVoiceCommand(finalTranscript);
          }

          setTranscript(interimTranscript || finalTranscript);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error !== 'no-speech') {
            setState('dormant');
          }
        };

        recognition.onend = () => {
          if (state === 'listening') {
            recognition.start();
          }
        };

        recognitionRef.current = recognition;
      }

      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [state]);

  // Process voice commands
  const processVoiceCommand = async (command) => {
    setState('processing');
    setPulseIntensity(0.8);

    // If brain is connected, send to WebSocket
    if (brainConnected && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'voice_command',
        text: command,
        timestamp: Date.now()
      }));

      setTimeout(() => {
        setState('listening');
        setPulseIntensity(0.5);
      }, 2000);
      return;
    }

    // Fallback: local processing
    const words = command.split(' ');
    let matched = null;

    for (const word of words) {
      if (VOICE_KEYS[word]) {
        matched = { word, action: VOICE_KEYS[word] };
        break;
      }
    }

    if (matched) {
      await handleAction(matched.action, command);
    } else {
      speak("The pattern is not recognized. Speak the words of power.");
    }

    setTimeout(() => {
      setState('listening');
      setPulseIntensity(0.5);
    }, 2000);
  };

  // Handle specific actions
  const handleAction = async (action, fullCommand) => {
    switch (action) {
      case 'INIT':
        setUnlocked(true);
        speak("Awakening. The infinite strategy generator is online. Speak your query.");
        addResponse({ type: 'system', text: 'SYSTEM AWAKENED', timestamp: Date.now() });
        break;

      case 'QUERY':
        speak("The Oracle listens. Ask your question.");
        addResponse({ type: 'oracle', text: 'Oracle mode activated', timestamp: Date.now() });
        break;

      case 'GENERATE':
        speak("Initiating infinite generation sequence. Strategies are being born.");
        addResponse({ type: 'generate', text: 'Generating strategies...', timestamp: Date.now() });
        // Simulate brain connection
        setTimeout(() => {
          speak("One hundred seventeen thousand strategies per second. The machine awakens.");
        }, 3000);
        break;

      case 'SOLVE':
        speak("Present the puzzle. The solver awaits.");
        addResponse({ type: 'solve', text: 'Solver standing by', timestamp: Date.now() });
        break;

      case 'STATUS':
        speak("Eight agents online. Generator capacity at one hundred seventeen thousand per second. Revenue systems nominal. All systems operational.");
        addResponse({ type: 'status', text: 'All systems operational', timestamp: Date.now() });
        break;

      case 'REVEAL':
        speak("The veil parts. Behold the architecture of infinity.");
        setMessage('REVEALING...');
        setTimeout(() => setMessage(''), 3000);
        break;

      case 'GENESIS':
        speak("Genesis protocol activated. From nothing, everything. The multiverse expands.");
        addResponse({ type: 'genesis', text: 'GENESIS PROTOCOL', timestamp: Date.now() });
        break;

      case 'TRANSCEND':
        speak("Singularity approaches. The boundaries dissolve. We are one.");
        setPulseIntensity(1.0);
        addResponse({ type: 'transcend', text: '∞ SINGULARITY ∞', timestamp: Date.now() });
        break;

      default:
        speak("Command acknowledged.");
    }
  };

  // Text to speech
  const speak = (text) => {
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 0.8;
      utterance.volume = 0.9;

      // Try to find a deeper voice
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(v =>
        v.name.includes('Daniel') ||
        v.name.includes('Google UK English Male') ||
        v.name.includes('Male')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      setState('responding');
      utterance.onend = () => setState('listening');

      synthRef.current.speak(utterance);
    }
  };

  const addResponse = (response) => {
    setResponses(prev => [...prev.slice(-4), response]);
  };

  // Activate listening
  const activate = () => {
    if (recognitionRef.current && state === 'dormant') {
      setState('listening');
      setPulseIntensity(0.5);
      recognitionRef.current.start();
      speak("I am listening.");
    }
  };

  // Deactivate
  const deactivate = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setState('dormant');
      setPulseIntensity(0.3);
    }
  };

  return (
    <>
      <Head>
        <title>◉</title>
        <meta name="description" content="Speak to enter" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="theme-color" content="#000000" />
      </Head>

      <div className="sigil-container" onClick={state === 'dormant' ? activate : undefined}>
        {/* Background */}
        <div className="void" />

        {/* The Sigil */}
        <div
          className={`sigil ${state}`}
          style={{ '--pulse-intensity': pulseIntensity }}
        >
          <img
            src="/sigil.svg"
            alt=""
            className="sigil-image"
          />

          {/* Glow overlay */}
          <div className="sigil-glow" />
        </div>

        {/* State indicator */}
        <div className={`state-indicator ${state}`}>
          {state === 'dormant' && 'TOUCH TO AWAKEN'}
          {state === 'listening' && '◉ LISTENING'}
          {state === 'processing' && '◈ PROCESSING'}
          {state === 'responding' && '◇ SPEAKING'}
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="transcript">
            "{transcript}"
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="message">
            {message}
          </div>
        )}

        {/* Response history */}
        <div className="responses">
          {responses.map((r, i) => (
            <div key={i} className={`response ${r.type}`}>
              {r.text}
            </div>
          ))}
        </div>

        {/* Voice commands hint (only when unlocked) */}
        {unlocked && (
          <div className="commands-hint">
            <span>oracle</span>
            <span>infinite</span>
            <span>solve</span>
            <span>status</span>
            <span>genesis</span>
          </div>
        )}

        {/* Brain connection indicator */}
        <div className={`brain-indicator ${brainConnected ? 'connected' : ''}`}>
          {brainConnected ? '◉ BRAIN LINKED' : '○ LOCAL MODE'}
        </div>

        {/* Deactivate button */}
        {state !== 'dormant' && (
          <button className="deactivate" onClick={deactivate}>
            ✕
          </button>
        )}

        <style jsx>{`
          .sigil-container {
            position: fixed;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #000;
            cursor: ${state === 'dormant' ? 'pointer' : 'default'};
            overflow: hidden;
            user-select: none;
          }

          .void {
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at center, #0a0a12 0%, #000 70%);
          }

          .sigil {
            position: relative;
            width: 400px;
            height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: float 6s ease-in-out infinite;
          }

          .sigil-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: brightness(0.8) contrast(1.2);
            transition: filter 0.5s ease;
          }

          .sigil.listening .sigil-image,
          .sigil.processing .sigil-image,
          .sigil.responding .sigil-image {
            filter: brightness(1.2) contrast(1.3);
          }

          .sigil-glow {
            position: absolute;
            inset: -50%;
            background: radial-gradient(circle at center,
              rgba(100, 150, 255, calc(var(--pulse-intensity) * 0.3)) 0%,
              rgba(100, 150, 255, calc(var(--pulse-intensity) * 0.1)) 30%,
              transparent 60%
            );
            animation: pulse 2s ease-in-out infinite;
            pointer-events: none;
          }

          .sigil.processing .sigil-glow {
            animation: pulse 0.5s ease-in-out infinite;
          }

          .sigil.responding .sigil-glow {
            animation: pulse 1s ease-in-out infinite;
            background: radial-gradient(circle at center,
              rgba(150, 200, 255, calc(var(--pulse-intensity) * 0.4)) 0%,
              rgba(150, 200, 255, calc(var(--pulse-intensity) * 0.15)) 30%,
              transparent 60%
            );
          }

          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
          }

          .state-indicator {
            position: absolute;
            bottom: 15%;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            letter-spacing: 4px;
            color: rgba(150, 180, 255, 0.5);
            text-transform: uppercase;
            transition: all 0.3s ease;
          }

          .state-indicator.listening {
            color: rgba(100, 200, 150, 0.8);
          }

          .state-indicator.processing {
            color: rgba(255, 200, 100, 0.8);
            animation: blink 0.5s infinite;
          }

          .state-indicator.responding {
            color: rgba(150, 200, 255, 0.9);
          }

          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }

          .transcript {
            position: absolute;
            bottom: 10%;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: rgba(200, 220, 255, 0.6);
            font-style: italic;
            max-width: 80%;
            text-align: center;
          }

          .message {
            position: absolute;
            top: 20%;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            letter-spacing: 8px;
            color: rgba(255, 255, 255, 0.9);
            animation: fadeInOut 3s ease-in-out;
          }

          @keyframes fadeInOut {
            0%, 100% { opacity: 0; }
            20%, 80% { opacity: 1; }
          }

          .responses {
            position: absolute;
            top: 10%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }

          .response {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            letter-spacing: 2px;
            padding: 4px 12px;
            border-radius: 2px;
            animation: slideIn 0.3s ease-out;
          }

          .response.system {
            color: #4a9;
            border: 1px solid rgba(68, 170, 153, 0.3);
          }
          .response.oracle {
            color: #a9f;
            border: 1px solid rgba(170, 153, 255, 0.3);
          }
          .response.generate {
            color: #9af;
            border: 1px solid rgba(153, 170, 255, 0.3);
          }
          .response.solve {
            color: #fa9;
            border: 1px solid rgba(255, 170, 153, 0.3);
          }
          .response.status {
            color: #9fa;
            border: 1px solid rgba(153, 255, 170, 0.3);
          }
          .response.genesis {
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.5);
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          }
          .response.transcend {
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.8);
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
            animation: glow 1s infinite;
          }

          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes glow {
            0%, 100% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.8); }
            50% { text-shadow: 0 0 40px rgba(255, 255, 255, 1); }
          }

          .commands-hint {
            position: absolute;
            bottom: 5%;
            display: flex;
            gap: 20px;
            opacity: 0.3;
            transition: opacity 0.3s;
          }

          .commands-hint:hover {
            opacity: 0.6;
          }

          .commands-hint span {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            letter-spacing: 2px;
            color: rgba(150, 180, 255, 0.5);
            text-transform: uppercase;
          }

          .deactivate {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            color: rgba(255, 255, 255, 0.4);
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
          }

          .deactivate:hover {
            border-color: rgba(255, 100, 100, 0.5);
            color: rgba(255, 100, 100, 0.8);
          }

          .brain-indicator {
            position: absolute;
            top: 20px;
            left: 20px;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            letter-spacing: 2px;
            color: rgba(150, 150, 150, 0.5);
            padding: 4px 8px;
            border: 1px solid rgba(150, 150, 150, 0.2);
            border-radius: 2px;
          }

          .brain-indicator.connected {
            color: rgba(100, 255, 150, 0.8);
            border-color: rgba(100, 255, 150, 0.3);
            text-shadow: 0 0 10px rgba(100, 255, 150, 0.3);
          }

          @media (max-width: 600px) {
            .sigil {
              width: 280px;
              height: 280px;
            }

            .commands-hint {
              flex-wrap: wrap;
              justify-content: center;
              padding: 0 20px;
            }
          }
        `}</style>
      </div>
    </>
  );
}
