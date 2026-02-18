/**
 * EVENT BUS - Central nervous system for real-time event flow
 *
 * Flow: Edge → Intent Grid → Lexicon → Ritual → {External, Voice} → Supervisor
 *
 * Features:
 * - Pub/Sub with channels
 * - Event persistence for replay
 * - Dead letter queue
 * - Metrics and observability
 */

const express = require('express');
const { EventEmitter } = require('events');
const WebSocket = require('ws');

const app = express();
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════
// EVENT BUS SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);

    this.channels = new Map();
    this.subscriptions = new Map();
    this.eventHistory = [];
    this.deadLetterQueue = [];

    this.metrics = {
      eventsPublished: 0,
      eventsDelivered: 0,
      eventsFailed: 0,
      activeSubscriptions: 0
    };

    // Core channels
    this._initChannels();
  }

  _initChannels() {
    const coreChannels = [
      'edge.request',
      'edge.response',
      'intent.route',
      'intent.result',
      'lexicon.evolve',
      'lexicon.learn',
      'ritual.trigger',
      'ritual.step',
      'ritual.complete',
      'external.webhook',
      'external.action',
      'voice.speak',
      'voice.listen',
      'voice.interrupt',
      'supervisor.health',
      'supervisor.alert',
      'system.error',
      'system.metric'
    ];

    for (const channel of coreChannels) {
      this.channels.set(channel, {
        name: channel,
        subscribers: new Set(),
        messageCount: 0,
        lastMessage: null
      });
    }
  }

  /**
   * Publish an event to a channel
   */
  publish(channel, event) {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const envelope = {
      id: eventId,
      channel,
      event,
      timestamp: new Date().toISOString(),
      delivered: false
    };

    // Store in history (last 1000 events)
    this.eventHistory.push(envelope);
    if (this.eventHistory.length > 1000) {
      this.eventHistory.shift();
    }

    // Get or create channel
    if (!this.channels.has(channel)) {
      this.channels.set(channel, {
        name: channel,
        subscribers: new Set(),
        messageCount: 0,
        lastMessage: null
      });
    }

    const channelData = this.channels.get(channel);
    channelData.messageCount++;
    channelData.lastMessage = envelope;

    this.metrics.eventsPublished++;

    // Deliver to subscribers
    let delivered = 0;
    for (const subId of channelData.subscribers) {
      const subscription = this.subscriptions.get(subId);
      if (subscription && subscription.active) {
        try {
          subscription.handler(envelope);
          delivered++;
        } catch (error) {
          console.error(`[EventBus] Delivery failed: ${error.message}`);
          this.deadLetterQueue.push({ ...envelope, error: error.message });
          this.metrics.eventsFailed++;
        }
      }
    }

    envelope.delivered = delivered > 0;
    this.metrics.eventsDelivered += delivered;

    // Emit for WebSocket clients
    this.emit('event', envelope);

    // Also emit on the specific channel
    this.emit(channel, event);

    return envelope;
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel, handler, options = {}) {
    const subId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const subscription = {
      id: subId,
      channel,
      handler,
      active: true,
      createdAt: new Date().toISOString(),
      filter: options.filter || null,
      ...options
    };

    this.subscriptions.set(subId, subscription);

    // Add to channel
    if (!this.channels.has(channel)) {
      this.channels.set(channel, {
        name: channel,
        subscribers: new Set(),
        messageCount: 0,
        lastMessage: null
      });
    }

    this.channels.get(channel).subscribers.add(subId);
    this.metrics.activeSubscriptions++;

    return subId;
  }

  /**
   * Subscribe to multiple channels with pattern
   */
  subscribePattern(pattern, handler) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const matchingChannels = [];

    for (const [channelName] of this.channels) {
      if (regex.test(channelName)) {
        matchingChannels.push(channelName);
        this.subscribe(channelName, handler);
      }
    }

    return matchingChannels;
  }

  /**
   * Unsubscribe
   */
  unsubscribe(subId) {
    const subscription = this.subscriptions.get(subId);
    if (!subscription) return false;

    subscription.active = false;

    const channel = this.channels.get(subscription.channel);
    if (channel) {
      channel.subscribers.delete(subId);
    }

    this.subscriptions.delete(subId);
    this.metrics.activeSubscriptions--;

    return true;
  }

  /**
   * Get channel info
   */
  getChannel(name) {
    return this.channels.get(name);
  }

  /**
   * Get all channels
   */
  listChannels() {
    return Array.from(this.channels.entries()).map(([name, data]) => ({
      name,
      subscribers: data.subscribers.size,
      messageCount: data.messageCount,
      lastMessage: data.lastMessage?.timestamp
    }));
  }

  /**
   * Get event history
   */
  getHistory(channel = null, limit = 100) {
    let events = this.eventHistory;
    if (channel) {
      events = events.filter(e => e.channel === channel);
    }
    return events.slice(-limit);
  }

  /**
   * Replay events to a handler
   */
  replay(channel, handler, since = null) {
    const events = this.getHistory(channel);
    let replayed = 0;

    for (const event of events) {
      if (since && new Date(event.timestamp) < new Date(since)) {
        continue;
      }
      handler(event);
      replayed++;
    }

    return replayed;
  }

  /**
   * Get dead letter queue
   */
  getDeadLetters(limit = 50) {
    return this.deadLetterQueue.slice(-limit);
  }

  /**
   * Retry dead letters
   */
  retryDeadLetters() {
    const toRetry = [...this.deadLetterQueue];
    this.deadLetterQueue = [];

    for (const envelope of toRetry) {
      this.publish(envelope.channel, envelope.event);
    }

    return toRetry.length;
  }

  getStatus() {
    return {
      service: 'event-bus',
      codename: 'THE NERVOUS SYSTEM',
      status: 'operational',
      channels: this.channels.size,
      activeSubscriptions: this.metrics.activeSubscriptions,
      historySize: this.eventHistory.length,
      deadLetterSize: this.deadLetterQueue.length,
      metrics: this.metrics
    };
  }
}

const eventBus = new EventBus();

// ═══════════════════════════════════════════════════════════════════════════
// FLOW ORCHESTRATOR - Wires the pipeline
// ═══════════════════════════════════════════════════════════════════════════

class FlowOrchestrator {
  constructor(bus) {
    this.bus = bus;
    this._wireFlows();
  }

  _wireFlows() {
    // Edge → Intent Grid
    this.bus.subscribe('edge.request', async (envelope) => {
      console.log('[Flow] Edge request → Intent Grid');
      // Forward to intent grid
      this.bus.publish('intent.route', envelope.event);
    });

    // Intent Grid → Lexicon
    this.bus.subscribe('intent.result', async (envelope) => {
      console.log('[Flow] Intent result → Lexicon');
      // Process through lexicon
      this.bus.publish('lexicon.evolve', envelope.event);
    });

    // Lexicon → Ritual Engine (if ritual trigger detected)
    this.bus.subscribe('lexicon.evolve', async (envelope) => {
      const event = envelope.event;
      if (event.ritual_trigger) {
        console.log('[Flow] Lexicon → Ritual Engine');
        this.bus.publish('ritual.trigger', event);
      }
    });

    // Ritual → External Tether
    this.bus.subscribe('ritual.step', async (envelope) => {
      const step = envelope.event;
      if (step.agent === 'external') {
        console.log('[Flow] Ritual → External Tether');
        this.bus.publish('external.action', step);
      }
    });

    // Ritual → Voice Loop
    this.bus.subscribe('ritual.step', async (envelope) => {
      const step = envelope.event;
      if (step.agent === 'voice') {
        console.log('[Flow] Ritual → Voice Loop');
        this.bus.publish('voice.speak', step);
      }
    });

    // All events → Supervisor (for monitoring)
    this.bus.subscribePattern('*', async (envelope) => {
      // Don't create infinite loop
      if (!envelope.channel.startsWith('supervisor.')) {
        this.bus.publish('supervisor.metric', {
          channel: envelope.channel,
          eventId: envelope.id,
          timestamp: envelope.timestamp
        });
      }
    });

    // System errors → Supervisor alerts
    this.bus.subscribe('system.error', async (envelope) => {
      console.log('[Flow] Error → Supervisor Alert');
      this.bus.publish('supervisor.alert', {
        type: 'system_error',
        severity: 'warning',
        ...envelope.event
      });
    });
  }
}

const flowOrchestrator = new FlowOrchestrator(eventBus);

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'event-bus',
    codename: 'THE NERVOUS SYSTEM'
  });
});

// POST /publish - Publish an event
app.post('/publish', (req, res) => {
  const { channel, event } = req.body;
  if (!channel || !event) {
    return res.status(400).json({ error: 'channel and event required' });
  }

  const envelope = eventBus.publish(channel, event);
  res.json({ status: 'published', envelope });
});

// POST /subscribe - Subscribe to a channel (for webhooks)
app.post('/subscribe', (req, res) => {
  const { channel, webhook_url } = req.body;

  // For webhook subscriptions
  const handler = async (envelope) => {
    try {
      await fetch(webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelope)
      });
    } catch (error) {
      console.error(`Webhook delivery failed: ${error.message}`);
    }
  };

  const subId = eventBus.subscribe(channel, handler);
  res.json({ status: 'subscribed', subscription_id: subId, channel });
});

// DELETE /subscribe/:subId - Unsubscribe
app.delete('/subscribe/:subId', (req, res) => {
  const success = eventBus.unsubscribe(req.params.subId);
  res.json({ status: success ? 'unsubscribed' : 'not_found' });
});

// GET /channels - List all channels
app.get('/channels', (req, res) => {
  res.json({ channels: eventBus.listChannels() });
});

// GET /channel/:name - Get channel info
app.get('/channel/:name', (req, res) => {
  const channel = eventBus.getChannel(req.params.name);
  if (!channel) {
    return res.status(404).json({ error: 'Channel not found' });
  }
  res.json(channel);
});

// GET /history - Get event history
app.get('/history', (req, res) => {
  const channel = req.query.channel || null;
  const limit = parseInt(req.query.limit) || 100;
  res.json({ events: eventBus.getHistory(channel, limit) });
});

// POST /replay - Replay events
app.post('/replay', (req, res) => {
  const { channel, webhook_url, since } = req.body;

  let replayed = 0;
  eventBus.replay(channel, async (envelope) => {
    await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope)
    });
    replayed++;
  }, since);

  res.json({ status: 'replaying', channel, replayed });
});

// GET /dead-letters - Get dead letter queue
app.get('/dead-letters', (req, res) => {
  res.json({ deadLetters: eventBus.getDeadLetters() });
});

// POST /dead-letters/retry - Retry dead letters
app.post('/dead-letters/retry', (req, res) => {
  const count = eventBus.retryDeadLetters();
  res.json({ status: 'retried', count });
});

// GET /status - Get bus status
app.get('/status', (req, res) => {
  res.json(eventBus.getStatus());
});

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET FOR REAL-TIME EVENTS
// ═══════════════════════════════════════════════════════════════════════════

const server = app.listen(8040, () => {
  console.log('═'.repeat(60));
  console.log('EVENT BUS - THE NERVOUS SYSTEM');
  console.log('Central event routing and orchestration');
  console.log('Listening on port 8040');
  console.log('═'.repeat(60));
});

const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('Event Bus WebSocket client connected');

  // Subscribe to all events
  const handler = (envelope) => {
    ws.send(JSON.stringify(envelope));
  };

  eventBus.on('event', handler);

  ws.on('message', (message) => {
    try {
      const cmd = JSON.parse(message);
      if (cmd.action === 'publish') {
        const envelope = eventBus.publish(cmd.channel, cmd.event);
        ws.send(JSON.stringify({ action: 'published', envelope }));
      } else if (cmd.action === 'subscribe') {
        // Filter events for this client
        ws.channels = ws.channels || new Set();
        ws.channels.add(cmd.channel);
      }
    } catch (error) {
      ws.send(JSON.stringify({ error: error.message }));
    }
  });

  ws.on('close', () => {
    eventBus.off('event', handler);
  });
});

module.exports = { app, eventBus, flowOrchestrator, EventBus };
