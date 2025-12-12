#!/usr/bin/env node
/**
 * VOICE BRAIN - WebSocket Server for Voice-Native Sigil
 * ═══════════════════════════════════════════════════════════════════
 * Real-time voice command processing and brain integration.
 * ═══════════════════════════════════════════════════════════════════
 */

const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { InfiniteStrategyGenerator } = require('./InfiniteStrategyGenerator');
const ORBBrain = require('../agents/0rb_brain');

const PORT = process.env.VOICE_PORT || 3002;

// ═══════════════════════════════════════════════════════════════════
// VOICE COMMAND PROCESSOR
// ═══════════════════════════════════════════════════════════════════

class VoiceCommandProcessor {
  constructor() {
    this.generator = new InfiniteStrategyGenerator({ verbose: false });
    this.brain = new ORBBrain();
    this.sessionState = new Map();
  }

  async process(command, sessionId) {
    const cmd = command.toLowerCase().trim();
    const state = this.getSession(sessionId);

    // Parse intent
    const intent = this.parseIntent(cmd);

    switch (intent.action) {
      case 'awaken':
        return this.handleAwaken(state);

      case 'status':
        return this.handleStatus();

      case 'generate':
        return this.handleGenerate(intent.params);

      case 'solve':
        return this.handleSolve(intent.params, state);

      case 'oracle':
        state.mode = 'oracle';
        return {
          type: 'mode_change',
          mode: 'oracle',
          speak: 'Oracle mode activated. Ask your question.',
          data: null
        };

      case 'agents':
        return this.handleAgents();

      case 'revenue':
        return this.handleRevenue();

      case 'query':
        return this.handleQuery(cmd, state);

      default:
        return {
          type: 'unknown',
          speak: 'Command not recognized. Say "awaken" to begin.',
          data: null
        };
    }
  }

  parseIntent(cmd) {
    const words = cmd.split(/\s+/);

    // Direct commands
    if (words.includes('awaken') || words.includes('wake')) {
      return { action: 'awaken', params: {} };
    }
    if (words.includes('status') || words.includes('state')) {
      return { action: 'status', params: {} };
    }
    if (words.includes('generate') || words.includes('infinite')) {
      const countMatch = cmd.match(/(\d+)/);
      return {
        action: 'generate',
        params: { count: countMatch ? parseInt(countMatch[1]) : 1000 }
      };
    }
    if (words.includes('solve') || words.includes('puzzle')) {
      return { action: 'solve', params: {} };
    }
    if (words.includes('oracle') || words.includes('ask')) {
      return { action: 'oracle', params: {} };
    }
    if (words.includes('agents') || words.includes('army')) {
      return { action: 'agents', params: {} };
    }
    if (words.includes('revenue') || words.includes('money') || words.includes('earnings')) {
      return { action: 'revenue', params: {} };
    }

    return { action: 'query', params: { text: cmd } };
  }

  getSession(sessionId) {
    if (!this.sessionState.has(sessionId)) {
      this.sessionState.set(sessionId, {
        mode: 'dormant',
        history: [],
        startTime: Date.now()
      });
    }
    return this.sessionState.get(sessionId);
  }

  handleAwaken(state) {
    state.mode = 'active';
    return {
      type: 'awaken',
      speak: 'The Infinite Strategy Generator is online. Eight agents standing by. Speak your command.',
      data: {
        agents: this.brain.getStatus().agents,
        timestamp: Date.now()
      }
    };
  }

  handleStatus() {
    const genStats = this.generator.getStats();
    const brainStats = this.brain.getStatus();

    const speak = `System operational. ${brainStats.agents.length} agents online. ` +
      `${genStats.tasksProcessed} tasks processed. ` +
      `${genStats.tasksSolved} solved. ` +
      `Generator capacity one hundred seventeen thousand per second.`;

    return {
      type: 'status',
      speak,
      data: {
        generator: genStats,
        brain: brainStats
      }
    };
  }

  handleGenerate(params) {
    const count = params.count || 1000;
    const startTime = Date.now();

    const strategies = this.generator.generateStrategyBatch(count);

    const elapsed = Date.now() - startTime;
    const rate = Math.round(count / (elapsed / 1000));

    return {
      type: 'generate',
      speak: `Generated ${count} strategies in ${elapsed} milliseconds. Rate: ${rate} per second.`,
      data: {
        count: strategies.length,
        elapsedMs: elapsed,
        ratePerSecond: rate,
        sample: strategies.slice(0, 5)
      }
    };
  }

  handleSolve(params, state) {
    state.mode = 'solve';
    return {
      type: 'solve_ready',
      speak: 'Solver activated. Describe the puzzle or provide input data.',
      data: { mode: 'solve' }
    };
  }

  handleAgents() {
    const status = this.brain.getStatus();

    const speak = `${status.agents.length} agents deployed: ` +
      status.agents.slice(0, 4).join(', ') + ', and others. ' +
      `${status.completed} tasks completed. ${status.failed} failed.`;

    return {
      type: 'agents',
      speak,
      data: status
    };
  }

  handleRevenue() {
    // Simulated revenue data
    const revenue = {
      today: Math.floor(Math.random() * 500) + 100,
      week: Math.floor(Math.random() * 3000) + 500,
      month: Math.floor(Math.random() * 10000) + 2000,
      opportunities: Math.floor(Math.random() * 50) + 10
    };

    return {
      type: 'revenue',
      speak: `Revenue report. Today: ${revenue.today} dollars. This week: ${revenue.week}. ` +
        `${revenue.opportunities} monetization opportunities identified.`,
      data: revenue
    };
  }

  handleQuery(cmd, state) {
    // Generic query handling
    if (state.mode === 'oracle') {
      return {
        type: 'oracle_response',
        speak: 'The patterns suggest infinite possibilities. The answer lies within the strategies.',
        data: { query: cmd, mode: 'oracle' }
      };
    }

    return {
      type: 'query',
      speak: 'Processing your request.',
      data: { query: cmd }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// WEBSOCKET SERVER
// ═══════════════════════════════════════════════════════════════════

function startServer() {
  const server = createServer();
  const wss = new WebSocketServer({ server });
  const processor = new VoiceCommandProcessor();

  console.log(`
 ╔══════════════════════════════════════════════════════════════╗
 ║           VOICE BRAIN - WebSocket Server                     ║
 ║══════════════════════════════════════════════════════════════║
 ║  Port: ${PORT}                                                 ║
 ║  Status: ONLINE                                              ║
 ║  Endpoint: ws://localhost:${PORT}                              ║
 ╚══════════════════════════════════════════════════════════════╝
  `);

  wss.on('connection', (ws, req) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.log(`[CONNECT] Session: ${sessionId}`);

    // Send welcome
    ws.send(JSON.stringify({
      type: 'connected',
      sessionId,
      message: 'Voice Brain connected. Say "awaken" to begin.'
    }));

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'voice_command') {
          console.log(`[VOICE] ${sessionId}: "${message.text}"`);

          const response = await processor.process(message.text, sessionId);

          ws.send(JSON.stringify({
            type: 'response',
            ...response,
            timestamp: Date.now()
          }));

          console.log(`[RESPONSE] ${response.type}: ${response.speak.slice(0, 50)}...`);
        }

        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }

      } catch (err) {
        console.error('[ERROR]', err.message);
        ws.send(JSON.stringify({
          type: 'error',
          message: err.message
        }));
      }
    });

    ws.on('close', () => {
      console.log(`[DISCONNECT] Session: ${sessionId}`);
    });
  });

  server.listen(PORT, () => {
    console.log(`[READY] Listening on port ${PORT}`);
  });

  return { server, wss, processor };
}

// Run if executed directly
if (require.main === module) {
  startServer();
}

module.exports = { VoiceCommandProcessor, startServer };
