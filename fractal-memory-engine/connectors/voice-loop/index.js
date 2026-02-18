/**
 * VOICE LOOP ADAPTER - Bridges VoiceInterface to Fractal Memory Engine
 *
 * Standard API contract:
 * - POST /trigger - Speak or listen
 * - GET /status - Get voice state
 * - POST /feedback - Adjust voice parameters
 * - GET /observe - Stream voice events
 */

const express = require('express');
const { EventEmitter } = require('events');
const WebSocket = require('ws');

// Import existing components
const VoiceInterface = require('../../../system/ui/VoiceInterface');

const app = express();
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════
// VOICE LOOP SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class VoiceLoopService extends EventEmitter {
  constructor() {
    super();
    this.voice = new VoiceInterface();
    this.activeSessions = new Map();
    this.voiceProfiles = new Map();
    this.resonanceMode = false;

    this.metrics = {
      utterancesSpoken: 0,
      listeningSeconds: 0,
      interruptionsHandled: 0,
      avgResponseLatencyMs: 0
    };

    this._initVoiceProfiles();
  }

  _initVoiceProfiles() {
    // Avatar voice configurations
    this.voiceProfiles.set('default', {
      name: 'Default',
      pitch: 1.0,
      rate: 1.0,
      voice: 'en-US',
      personality: 'neutral, helpful'
    });

    this.voiceProfiles.set('business', {
      name: 'Business',
      pitch: 0.95,
      rate: 0.95,
      voice: 'en-US',
      personality: 'professional, measured'
    });

    this.voiceProfiles.set('creative', {
      name: 'Creative',
      pitch: 1.1,
      rate: 1.05,
      voice: 'en-US',
      personality: 'expressive, inspiring'
    });

    this.voiceProfiles.set('builder', {
      name: 'Builder',
      pitch: 1.0,
      rate: 1.1,
      voice: 'en-US',
      personality: 'technical, precise'
    });
  }

  /**
   * Speak text with avatar voice
   */
  async speak(input) {
    const { text, avatar, userId, options = {} } = input;
    const startTime = Date.now();
    const utteranceId = `utt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const profile = this.voiceProfiles.get(avatar) || this.voiceProfiles.get('default');

    try {
      // Create session if needed
      if (!this.activeSessions.has(userId)) {
        this.activeSessions.set(userId, {
          userId,
          avatar,
          startedAt: new Date().toISOString(),
          utterances: []
        });
      }

      const session = this.activeSessions.get(userId);

      // In production, this would call actual TTS service
      const result = await this._synthesize(text, profile, options);

      const utterance = {
        id: utteranceId,
        text,
        avatar,
        duration: result.durationMs,
        timestamp: new Date().toISOString()
      };

      session.utterances.push(utterance);
      this.metrics.utterancesSpoken++;

      this.emit('voice:spoken', {
        utteranceId,
        text,
        avatar,
        durationMs: result.durationMs,
        latencyMs: Date.now() - startTime
      });

      return {
        utteranceId,
        status: 'spoken',
        text,
        avatar,
        profile: profile.name,
        durationMs: result.durationMs,
        latencyMs: Date.now() - startTime
      };

    } catch (error) {
      this.emit('voice:error', { utteranceId, error: error.message });
      throw error;
    }
  }

  /**
   * Start listening for voice input
   */
  async listen(input) {
    const { userId, avatar, options = {} } = input;
    const sessionId = `listen_${Date.now()}`;

    const session = {
      sessionId,
      userId,
      avatar,
      status: 'listening',
      startedAt: new Date().toISOString(),
      transcripts: []
    };

    this.activeSessions.set(sessionId, session);

    this.emit('voice:listening', { sessionId, userId });

    // In production, this would start actual STT
    // For now, simulate ready state
    return {
      sessionId,
      status: 'listening',
      message: 'Voice input ready'
    };
  }

  /**
   * Handle voice interrupt
   */
  async handleInterrupt(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.status = 'interrupted';
    this.metrics.interruptionsHandled++;

    this.emit('voice:interrupted', { sessionId });

    return {
      sessionId,
      status: 'interrupted',
      resumable: true
    };
  }

  /**
   * Enable resonance mode (ceremonial voice)
   */
  async enableResonanceMode(options = {}) {
    this.resonanceMode = true;

    // Adjust all profiles for ceremonial delivery
    for (const [key, profile] of this.voiceProfiles) {
      profile.resonance = {
        reverb: options.reverb || 0.3,
        depth: options.depth || 0.5,
        harmony: options.harmony || true
      };
    }

    this.emit('voice:resonance_enabled', { options });

    return {
      status: 'resonance_enabled',
      mode: 'ceremonial',
      options
    };
  }

  /**
   * Internal TTS synthesis (simulated)
   */
  async _synthesize(text, profile, options) {
    // Estimate duration based on text length and rate
    const wordsPerMinute = 150 * profile.rate;
    const words = text.split(/\s+/).length;
    const durationMs = Math.floor((words / wordsPerMinute) * 60 * 1000);

    // Simulate synthesis delay
    await new Promise(r => setTimeout(r, 50));

    return {
      durationMs,
      audioFormat: 'mp3',
      profile: profile.name
    };
  }

  getStatus() {
    return {
      service: 'voice-loop',
      codename: 'THE BREATH',
      status: 'operational',
      resonanceMode: this.resonanceMode,
      activeSessions: this.activeSessions.size,
      voiceProfiles: Array.from(this.voiceProfiles.keys()),
      metrics: this.metrics
    };
  }

  getSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }
}

const voiceLoop = new VoiceLoopService();

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'voice-loop',
    codename: 'THE BREATH'
  });
});

// POST /trigger - Speak or listen
app.post('/trigger', async (req, res) => {
  try {
    const action = req.body.action || 'speak';

    if (action === 'speak') {
      const result = await voiceLoop.speak({
        text: req.body.text || req.body.message,
        avatar: req.body.avatar || 'default',
        userId: req.body.user_id,
        options: req.body.options || {}
      });
      res.json(result);
    } else if (action === 'listen') {
      const result = await voiceLoop.listen({
        userId: req.body.user_id,
        avatar: req.body.avatar || 'default',
        options: req.body.options || {}
      });
      res.json(result);
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /speak - Direct speak endpoint
app.post('/speak', async (req, res) => {
  try {
    const result = await voiceLoop.speak({
      text: req.body.text,
      avatar: req.body.avatar || 'default',
      userId: req.body.user_id,
      options: req.body.options || {}
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /listen - Start listening
app.post('/listen', async (req, res) => {
  try {
    const result = await voiceLoop.listen({
      userId: req.body.user_id,
      avatar: req.body.avatar || 'default',
      options: req.body.options || {}
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /interrupt - Handle voice interrupt
app.post('/interrupt', async (req, res) => {
  try {
    const result = await voiceLoop.handleInterrupt(req.body.session_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /resonance - Enable resonance mode
app.post('/resonance', async (req, res) => {
  try {
    const result = await voiceLoop.enableResonanceMode(req.body.options || {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /status - Get current state
app.get('/status', (req, res) => {
  res.json(voiceLoop.getStatus());
});

// GET /session/:sessionId - Get session details
app.get('/session/:sessionId', (req, res) => {
  const session = voiceLoop.getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session);
});

// POST /feedback - Adjust voice parameters
app.post('/feedback', (req, res) => {
  const { avatar, adjustments } = req.body;
  const profile = voiceLoop.voiceProfiles.get(avatar);

  if (profile && adjustments) {
    Object.assign(profile, adjustments);
    voiceLoop.emit('voice:adjusted', { avatar, adjustments });
  }

  res.json({ status: 'adjusted', avatar, adjustments });
});

// GET /observe - Stream voice events (SSE)
app.get('/observe', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendStatus = () => {
    res.write(`data: ${JSON.stringify(voiceLoop.getStatus())}\n\n`);
  };

  sendStatus();
  const interval = setInterval(sendStatus, 5000);

  const onSpoken = (data) => {
    res.write(`event: voice:spoken\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const onListening = (data) => {
    res.write(`event: voice:listening\ndata: ${JSON.stringify(data)}\n\n`);
  };

  voiceLoop.on('voice:spoken', onSpoken);
  voiceLoop.on('voice:listening', onListening);

  req.on('close', () => {
    clearInterval(interval);
    voiceLoop.off('voice:spoken', onSpoken);
    voiceLoop.off('voice:listening', onListening);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET FOR REAL-TIME VOICE
// ═══════════════════════════════════════════════════════════════════════════

const server = app.listen(8032, () => {
  console.log('═'.repeat(60));
  console.log('VOICE LOOP - THE BREATH');
  console.log('Realtime voice assistant service');
  console.log('Listening on port 8032');
  console.log('═'.repeat(60));
});

const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('Voice WebSocket client connected');

  const onSpoken = (data) => {
    ws.send(JSON.stringify({ event: 'voice:spoken', data }));
  };

  voiceLoop.on('voice:spoken', onSpoken);

  ws.on('message', async (message) => {
    try {
      const cmd = JSON.parse(message);
      if (cmd.action === 'speak') {
        const result = await voiceLoop.speak(cmd);
        ws.send(JSON.stringify({ event: 'speak:result', data: result }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ event: 'error', error: error.message }));
    }
  });

  ws.on('close', () => {
    voiceLoop.off('voice:spoken', onSpoken);
  });
});

module.exports = { app, voiceLoop, VoiceLoopService };
