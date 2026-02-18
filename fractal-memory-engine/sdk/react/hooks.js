/**
 * Fractal Memory React Hooks - THE HUMAN PORTAL
 * Phase 15: React integration hooks
 *
 * Hooks:
 * - useFractalChat() - Main chat hook
 * - useAvatar() - Avatar management
 * - usePatterns() - Pattern subscription
 * - useNarrative() - Narrative subscription
 * - useFractalContext() - Context provider hook
 */

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { createFractalClient } from '../js/fractal.js';

// ═══════════════════════════════════════════════════════════════
// Context
// ═══════════════════════════════════════════════════════════════

const FractalContext = createContext(null);

/**
 * Fractal Provider Component
 * Wrap your app with this to provide Fractal client to all hooks
 */
export function FractalProvider({ config, children }) {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fractalClient = createFractalClient(config);

    fractalClient.onConnected(() => setIsConnected(true));
    fractalClient.onDisconnected(() => setIsConnected(false));
    fractalClient.onError((err) => setError(err));

    setClient(fractalClient);

    return () => {
      fractalClient.disconnect();
    };
  }, [config.baseUrl, config.authToken, config.userId]);

  return (
    <FractalContext.Provider value={{ client, isConnected, error }}>
      {children}
    </FractalContext.Provider>
  );
}

/**
 * Get Fractal context
 */
export function useFractalContext() {
  const context = useContext(FractalContext);
  if (!context) {
    throw new Error('useFractalContext must be used within FractalProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════
// useFractalChat
// ═══════════════════════════════════════════════════════════════

/**
 * Main chat hook
 * @param {Object} options
 * @param {string} [options.avatar] - Avatar to use
 * @returns {Object} Chat state and methods
 */
export function useFractalChat(options = {}) {
  const { client, isConnected } = useFractalContext();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentContext, setCurrentContext] = useState(null);
  const [toneProfile, setToneProfile] = useState(null);

  // Set avatar if provided
  useEffect(() => {
    if (client && options.avatar) {
      client.setAvatar(options.avatar);
    }
  }, [client, options.avatar]);

  // Subscribe to resonance events
  useEffect(() => {
    if (!client) return;

    const unsubscribe = client.subscribeToResonance((data) => {
      setCurrentContext(data.snippets);
      setToneProfile(data.tone);
    });

    return unsubscribe;
  }, [client]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (content, messageOptions = {}) => {
    if (!client || !content.trim()) return null;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await client.sendMessage(content, {
        ...options,
        ...messageOptions,
      });

      const assistantMessage = {
        id: response.request_id,
        role: 'assistant',
        content: response.llm_response,
        timestamp: response.timestamp,
        context: response.context_used,
        tone: response.tone_profile,
        pipeline: response.pipeline,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentContext(response.context_used);
      setToneProfile(response.tone_profile);

      return response;
    } catch (error) {
      const errorMessage = {
        id: Date.now().toString(),
        role: 'error',
        content: error.message,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [client, options]);

  /**
   * Clear chat history
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentContext(null);
  }, []);

  /**
   * Get context preview
   */
  const getContext = useCallback(async (message = '') => {
    if (!client) return null;
    return client.getContextPreview(message);
  }, [client]);

  return {
    messages,
    sendMessage,
    clearMessages,
    getContext,
    isLoading,
    isConnected,
    currentContext,
    toneProfile,
  };
}

// ═══════════════════════════════════════════════════════════════
// useAvatar
// ═══════════════════════════════════════════════════════════════

/**
 * Avatar management hook
 * @returns {Object} Avatar state and methods
 */
export function useAvatar() {
  const { client } = useFractalContext();
  const [currentAvatar, setCurrentAvatar] = useState('default');
  const [avatars, setAvatars] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load avatars on mount
  useEffect(() => {
    if (!client) return;

    const loadAvatars = async () => {
      setIsLoading(true);
      try {
        const list = await client.getAvatars();
        setAvatars(list);
      } catch (error) {
        console.error('Failed to load avatars:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAvatars();
  }, [client]);

  /**
   * Switch avatar
   */
  const switchAvatar = useCallback((avatarName) => {
    if (client) {
      client.setAvatar(avatarName);
      setCurrentAvatar(avatarName);
    }
  }, [client]);

  /**
   * Create new avatar
   */
  const createAvatar = useCallback(async (config) => {
    if (!client) return null;

    setIsLoading(true);
    try {
      const newAvatar = await client.createAvatar(config);
      setAvatars(prev => [...prev, newAvatar]);
      return newAvatar;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  return {
    currentAvatar,
    avatars,
    switchAvatar,
    createAvatar,
    isLoading,
  };
}

// ═══════════════════════════════════════════════════════════════
// usePatterns
// ═══════════════════════════════════════════════════════════════

/**
 * Pattern subscription hook
 * @returns {Object} Pattern state
 */
export function usePatterns() {
  const { client } = useFractalContext();
  const [patterns, setPatterns] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!client) return;

    const unsubscribe = client.subscribeToPatterns((data) => {
      setPatterns(data.patterns || []);
      setLastUpdate(new Date().toISOString());
    });

    return unsubscribe;
  }, [client]);

  return {
    patterns,
    lastUpdate,
  };
}

// ═══════════════════════════════════════════════════════════════
// useNarrative
// ═══════════════════════════════════════════════════════════════

/**
 * Narrative subscription hook
 * @returns {Object} Narrative state
 */
export function useNarrative() {
  const { client } = useFractalContext();
  const [narrative, setNarrative] = useState([]);
  const [lastEntry, setLastEntry] = useState(null);

  useEffect(() => {
    if (!client) return;

    const unsubscribe = client.subscribeToNarrative((data) => {
      setNarrative(prev => [...prev, data]);
      setLastEntry(data);
    });

    return unsubscribe;
  }, [client]);

  /**
   * Clear narrative history
   */
  const clearNarrative = useCallback(() => {
    setNarrative([]);
    setLastEntry(null);
  }, []);

  return {
    narrative,
    lastEntry,
    clearNarrative,
  };
}

// ═══════════════════════════════════════════════════════════════
// useUserState
// ═══════════════════════════════════════════════════════════════

/**
 * User state hook
 * @returns {Object} User state
 */
export function useUserState() {
  const { client } = useFractalContext();
  const [userState, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      const state = await client.getUserState();
      setUserState(state);
    } catch (error) {
      console.error('Failed to fetch user state:', error);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    userState,
    isLoading,
    refresh,
  };
}

export default {
  FractalProvider,
  useFractalContext,
  useFractalChat,
  useAvatar,
  usePatterns,
  useNarrative,
  useUserState,
};
