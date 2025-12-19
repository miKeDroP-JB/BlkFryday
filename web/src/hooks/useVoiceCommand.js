/**
 * ====================================================
 *  VOICE COMMAND HOOK - REAL VOICE RECOGNITION
 * ====================================================
 *  "Speak it into existence."
 * ====================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Glyph voice command mappings
const VOICE_COMMANDS = {
  // Build commands
  'build landing page': { action: 'build', type: 'LANDING_PAGE', glyph: '⬢△🚀' },
  'create landing page': { action: 'build', type: 'LANDING_PAGE', glyph: '⬢△🚀' },
  'build website': { action: 'build', type: 'WEBSITE', glyph: '⬢🌐⚡' },
  'create website': { action: 'build', type: 'WEBSITE', glyph: '⬢🌐⚡' },
  'build saas': { action: 'build', type: 'SAAS_APP', glyph: '⬢💎∞' },
  'create saas': { action: 'build', type: 'SAAS_APP', glyph: '⬢💎∞' },
  'build app': { action: 'build', type: 'MOBILE_APP', glyph: '⬢📱⚡' },
  'create app': { action: 'build', type: 'MOBILE_APP', glyph: '⬢📱⚡' },
  'build brand': { action: 'build', type: 'BRAND', glyph: '♀🎨◇' },
  'create brand': { action: 'build', type: 'BRAND', glyph: '♀🎨◇' },
  'build store': { action: 'build', type: 'ECOMMERCE', glyph: '⬢🛒💎' },
  'create store': { action: 'build', type: 'ECOMMERCE', glyph: '⬢🛒💎' },
  'build empire': { action: 'build', type: 'EMPIRE', glyph: '👑♃∞' },
  'launch empire': { action: 'build', type: 'EMPIRE', glyph: '👑♃∞' },

  // Mode commands
  'simultaneous mode': { action: 'mode', mode: 'SIMULTANEOUS', glyph: '⚡' },
  'speed mode': { action: 'mode', mode: 'SIMULTANEOUS', glyph: '⚡' },
  'tournament mode': { action: 'mode', mode: 'TOURNAMENT', glyph: '🏆' },
  'quality mode': { action: 'mode', mode: 'TOURNAMENT', glyph: '🏆' },
  'resonance mode': { action: 'mode', mode: 'RESONANCE', glyph: '∞' },
  'creative mode': { action: 'mode', mode: 'RESONANCE', glyph: '∞' },
  'chaos mode': { action: 'mode', mode: 'RESONANCE', glyph: '∞' },

  // Status commands
  'status': { action: 'status', glyph: '◉' },
  'show status': { action: 'status', glyph: '◉' },
  'network status': { action: 'status', glyph: '◉' },

  // Swarm commands
  'activate alpha': { action: 'swarm', swarmId: 'ALPHA', glyph: 'Α' },
  'activate beta': { action: 'swarm', swarmId: 'BETA', glyph: 'Β' },
  'activate gamma': { action: 'swarm', swarmId: 'GAMMA', glyph: 'Γ' },
  'activate all swarms': { action: 'swarm', swarmId: 'ALL', glyph: '⊕' },

  // Export commands
  'export': { action: 'export', glyph: '△' },
  'export project': { action: 'export', glyph: '△' },
  'download': { action: 'export', glyph: '△' }
};

/**
 * useVoiceCommand - React hook for voice recognition
 */
export function useVoiceCommand(options = {}) {
  const {
    continuous = true,
    language = 'en-US',
    onCommand = () => {},
    onTranscript = () => {},
    onError = () => {}
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState(null);

  const recognitionRef = useRef(null);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        onTranscript(currentTranscript);

        // Check for command match
        if (finalTranscript) {
          const command = matchCommand(finalTranscript.toLowerCase().trim());
          if (command) {
            setLastCommand(command);
            onCommand(command);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        onError(event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListening && continuous) {
          // Restart if continuous mode
          recognition.start();
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [continuous, language]);

  // Match transcript to command
  const matchCommand = useCallback((text) => {
    // Direct match
    if (VOICE_COMMANDS[text]) {
      return { ...VOICE_COMMANDS[text], transcript: text };
    }

    // Fuzzy match
    for (const [phrase, command] of Object.entries(VOICE_COMMANDS)) {
      if (text.includes(phrase)) {
        return { ...command, transcript: text };
      }
    }

    // No match - return as general task
    return {
      action: 'task',
      task: text,
      glyph: '◯',
      transcript: text
    };
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript('');
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  }, [isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    lastCommand,
    startListening,
    stopListening,
    toggleListening,
    commands: VOICE_COMMANDS
  };
}

/**
 * Voice synthesis for feedback
 */
export function speakResponse(text, options = {}) {
  if (!window.speechSynthesis) return;

  const {
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    voice = null
  } = options;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  if (voice) {
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.name.includes(voice));
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Get available voices
 */
export function getAvailableVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
    }
  });
}

export default useVoiceCommand;
