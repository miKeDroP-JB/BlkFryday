/**
 * IntentGrid - User Intent Parsing & Routing System
 * ═══════════════════════════════════════════════════════════════════
 * The neural layer that understands what users want and routes to
 * the right system/agent.
 *
 * Features:
 * - Natural language intent classification
 * - Multi-intent detection
 * - Context-aware routing
 * - Agent selection optimization
 * - Conversation state management
 * ═══════════════════════════════════════════════════════════════════
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

// Intent Categories
const INTENT_CATEGORIES = {
  // Information seeking
  QUERY: 'query',
  SEARCH: 'search',
  EXPLAIN: 'explain',
  COMPARE: 'compare',

  // Action requests
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  EXECUTE: 'execute',

  // Agent interactions
  AGENT_SUMMON: 'agent_summon',
  AGENT_TASK: 'agent_task',
  AGENT_CHAT: 'agent_chat',

  // System operations
  SETTINGS: 'settings',
  HELP: 'help',
  FEEDBACK: 'feedback',
  SUBSCRIBE: 'subscribe',

  // Ritual/Experience
  RITUAL_JOIN: 'ritual_join',
  RITUAL_CREATE: 'ritual_create',
  EXPERIENCE: 'experience',

  // Commerce
  PURCHASE: 'purchase',
  GIFT: 'gift',
  UPGRADE: 'upgrade',

  // Social
  SHARE: 'share',
  CONNECT: 'connect',
  INVITE: 'invite',

  // Navigation
  NAVIGATE: 'navigate',
  OPEN: 'open',
  CLOSE: 'close',

  // Emotional/Support
  VENT: 'vent',
  CELEBRATE: 'celebrate',
  REFLECT: 'reflect',

  // Unknown
  UNKNOWN: 'unknown',
};

// Intent patterns for classification
const INTENT_PATTERNS = {
  [INTENT_CATEGORIES.CREATE]: [
    /\b(create|make|build|generate|design|craft|compose|write)\b/i,
    /\b(new|start|begin|initiate)\b.*\b(project|task|document|file)\b/i,
  ],
  [INTENT_CATEGORIES.QUERY]: [
    /\b(what|who|where|when|why|how|which)\b.*\?/i,
    /\b(tell me|show me|explain|describe)\b/i,
    /\b(is|are|was|were|do|does|did|can|could|would|should)\b.*\?/i,
  ],
  [INTENT_CATEGORIES.SEARCH]: [
    /\b(search|find|look for|locate|discover)\b/i,
    /\b(where is|where are|where can i find)\b/i,
  ],
  [INTENT_CATEGORIES.AGENT_SUMMON]: [
    /\b(summon|call|invoke|activate|wake)\b.*\b(apollo|athena|hermes|ares|hephaestus|artemis|mercury|agent)\b/i,
    /\b(i need|get me|bring)\b.*\b(apollo|athena|hermes|ares|hephaestus|artemis|mercury|agent)\b/i,
    /\b(apollo|athena|hermes|ares|hephaestus|artemis|mercury)\b[,.]?\s*(help|assist|come)/i,
  ],
  [INTENT_CATEGORIES.AGENT_TASK]: [
    /\b(can you|please|could you|would you|i want you to|i need you to)\b/i,
    /\b(do|perform|execute|run|handle|take care of)\b.*\b(task|job|work)\b/i,
  ],
  [INTENT_CATEGORIES.HELP]: [
    /\b(help|assist|support|guide)\b/i,
    /\b(how do i|how can i|how to)\b/i,
    /\b(what can you do|what are your capabilities)\b/i,
  ],
  [INTENT_CATEGORIES.SETTINGS]: [
    /\b(settings|preferences|options|configure|setup)\b/i,
    /\b(change|modify|adjust|update)\b.*\b(setting|preference|option)\b/i,
  ],
  [INTENT_CATEGORIES.SUBSCRIBE]: [
    /\b(subscribe|subscription|upgrade|premium|pro)\b/i,
    /\b(sign up|join|become a member)\b/i,
  ],
  [INTENT_CATEGORIES.PURCHASE]: [
    /\b(buy|purchase|pay|checkout|order)\b/i,
    /\b(add to cart|get|acquire)\b/i,
  ],
  [INTENT_CATEGORIES.GIFT]: [
    /\b(gift|give|send|share)\b.*\b(to|with|for)\b/i,
    /\b(gift forward|pass it on)\b/i,
  ],
  [INTENT_CATEGORIES.RITUAL_JOIN]: [
    /\b(join|participate|enter|attend)\b.*\b(ritual|event|ceremony|experience)\b/i,
  ],
  [INTENT_CATEGORIES.SHARE]: [
    /\b(share|post|broadcast|publish)\b/i,
  ],
  [INTENT_CATEGORIES.NAVIGATE]: [
    /\b(go to|take me to|navigate to|open|show)\b/i,
  ],
  [INTENT_CATEGORIES.REFLECT]: [
    /\b(reflect|think about|consider|contemplate|meditate)\b/i,
    /\b(i feel|i think|i believe|i wonder)\b/i,
  ],
  [INTENT_CATEGORIES.CELEBRATE]: [
    /\b(celebrate|excited|amazing|awesome|great|wonderful)\b/i,
    /\b(i did it|we did it|success|achieved|accomplished)\b/i,
  ],
  [INTENT_CATEGORIES.VENT]: [
    /\b(frustrated|annoyed|angry|upset|stressed|overwhelmed)\b/i,
    /\b(i hate|this sucks|terrible|awful|worst)\b/i,
  ],
};

// Agent routing based on intent
const INTENT_AGENT_ROUTING = {
  [INTENT_CATEGORIES.CREATE]: ['HEPHAESTUS', 'APOLLO'],
  [INTENT_CATEGORIES.QUERY]: ['ATHENA', 'APOLLO'],
  [INTENT_CATEGORIES.SEARCH]: ['ARTEMIS', 'ATHENA'],
  [INTENT_CATEGORIES.EXPLAIN]: ['ATHENA', 'APOLLO'],
  [INTENT_CATEGORIES.COMPARE]: ['ATHENA', 'MERCURY'],
  [INTENT_CATEGORIES.EXECUTE]: ['ARES', 'HEPHAESTUS'],
  [INTENT_CATEGORIES.AGENT_CHAT]: ['HERMES', 'APOLLO'],
  [INTENT_CATEGORIES.PURCHASE]: ['MERCURY', 'HERMES'],
  [INTENT_CATEGORIES.SUBSCRIBE]: ['MERCURY', 'HERMES'],
  [INTENT_CATEGORIES.GIFT]: ['HERMES', 'APOLLO'],
  [INTENT_CATEGORIES.REFLECT]: ['APOLLO', 'ATHENA'],
  [INTENT_CATEGORIES.CELEBRATE]: ['APOLLO', 'HERMES'],
  [INTENT_CATEGORIES.VENT]: ['ATHENA', 'APOLLO'],
  [INTENT_CATEGORIES.HELP]: ['ATHENA', 'HERMES'],
};

// Entity types for extraction
const ENTITY_TYPES = {
  AGENT: 'agent',
  TIME: 'time',
  DATE: 'date',
  NUMBER: 'number',
  MONEY: 'money',
  EMAIL: 'email',
  URL: 'url',
  PROJECT: 'project',
  TASK: 'task',
  USER: 'user',
  RITUAL: 'ritual',
};

/**
 * IntentClassifier - Classifies user intent
 */
class IntentClassifier {
  constructor(options = {}) {
    this.patterns = { ...INTENT_PATTERNS, ...options.customPatterns };
    this.threshold = options.threshold || 0.3;
    this.maxIntents = options.maxIntents || 3;
  }

  /**
   * Classify input text
   */
  classify(text) {
    const normalizedText = text.toLowerCase().trim();
    const scores = new Map();

    // Score each intent category
    for (const [intent, patterns] of Object.entries(this.patterns)) {
      let score = 0;
      let matchCount = 0;

      for (const pattern of patterns) {
        if (pattern.test(normalizedText)) {
          matchCount++;
          // Boost score based on match position (earlier = higher)
          const match = normalizedText.match(pattern);
          if (match) {
            const positionBoost = 1 - (match.index / normalizedText.length) * 0.3;
            score += positionBoost;
          }
        }
      }

      if (matchCount > 0) {
        score = score / patterns.length; // Normalize
        scores.set(intent, { score, matchCount });
      }
    }

    // Sort and filter by threshold
    const intents = Array.from(scores.entries())
      .filter(([, data]) => data.score >= this.threshold)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, this.maxIntents)
      .map(([intent, data]) => ({
        intent,
        confidence: Math.min(data.score, 1),
        matchCount: data.matchCount,
      }));

    // Default to unknown if no matches
    if (intents.length === 0) {
      intents.push({
        intent: INTENT_CATEGORIES.UNKNOWN,
        confidence: 0.5,
        matchCount: 0,
      });
    }

    return {
      primary: intents[0],
      secondary: intents.slice(1),
      all: intents,
    };
  }
}

/**
 * EntityExtractor - Extracts entities from text
 */
class EntityExtractor {
  constructor() {
    this.patterns = {
      [ENTITY_TYPES.AGENT]: /\b(apollo|athena|hermes|ares|hephaestus|artemis|mercury)\b/gi,
      [ENTITY_TYPES.EMAIL]: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      [ENTITY_TYPES.URL]: /https?:\/\/[^\s]+/g,
      [ENTITY_TYPES.MONEY]: /\$[\d,]+(?:\.\d{2})?|\b\d+(?:\.\d{2})?\s*(?:dollars?|usd)\b/gi,
      [ENTITY_TYPES.NUMBER]: /\b\d+(?:\.\d+)?\b/g,
      [ENTITY_TYPES.TIME]: /\b(?:1[0-2]|0?[1-9])(?::[0-5][0-9])?\s*(?:am|pm)\b|\b(?:[01]?[0-9]|2[0-3]):[0-5][0-9]\b/gi,
      [ENTITY_TYPES.DATE]: /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:,?\s*\d{4})?\b|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/gi,
    };
  }

  extract(text) {
    const entities = [];

    for (const [type, pattern] of Object.entries(this.patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          entities.push({
            type,
            value: match,
            normalized: this._normalize(type, match),
          });
        }
      }
    }

    return entities;
  }

  _normalize(type, value) {
    switch (type) {
      case ENTITY_TYPES.AGENT:
        return value.toUpperCase();
      case ENTITY_TYPES.MONEY:
        return parseFloat(value.replace(/[$,]/g, ''));
      case ENTITY_TYPES.NUMBER:
        return parseFloat(value);
      default:
        return value;
    }
  }
}

/**
 * ConversationContext - Manages conversation state
 */
class ConversationContext {
  constructor(userId) {
    this.userId = userId;
    this.messages = [];
    this.intents = [];
    this.entities = new Map();
    this.activeAgent = null;
    this.activeRitual = null;
    this.slots = new Map(); // For slot filling
    this.lastActivity = Date.now();
    this.sessionStart = Date.now();
  }

  addMessage(role, content, metadata = {}) {
    this.messages.push({
      role,
      content,
      timestamp: Date.now(),
      ...metadata,
    });
    this.lastActivity = Date.now();

    // Keep only last 50 messages
    if (this.messages.length > 50) {
      this.messages = this.messages.slice(-50);
    }
  }

  addIntent(intent) {
    this.intents.push({
      ...intent,
      timestamp: Date.now(),
    });

    // Keep only last 20 intents
    if (this.intents.length > 20) {
      this.intents = this.intents.slice(-20);
    }
  }

  addEntities(entities) {
    for (const entity of entities) {
      if (!this.entities.has(entity.type)) {
        this.entities.set(entity.type, []);
      }
      this.entities.get(entity.type).push({
        ...entity,
        timestamp: Date.now(),
      });
    }
  }

  getRecentIntents(count = 5) {
    return this.intents.slice(-count);
  }

  getEntity(type) {
    const typeEntities = this.entities.get(type) || [];
    return typeEntities[typeEntities.length - 1] || null;
  }

  setSlot(name, value) {
    this.slots.set(name, { value, timestamp: Date.now() });
  }

  getSlot(name) {
    const slot = this.slots.get(name);
    return slot ? slot.value : null;
  }

  toJSON() {
    return {
      userId: this.userId,
      messageCount: this.messages.length,
      recentIntents: this.getRecentIntents(),
      activeAgent: this.activeAgent,
      activeRitual: this.activeRitual,
      sessionDuration: Date.now() - this.sessionStart,
      lastActivity: this.lastActivity,
    };
  }
}

/**
 * IntentRouter - Routes intents to appropriate handlers
 */
class IntentRouter {
  constructor() {
    this.routes = new Map(); // intent -> handler
    this.defaultHandler = null;
  }

  register(intent, handler) {
    this.routes.set(intent, handler);
  }

  setDefault(handler) {
    this.defaultHandler = handler;
  }

  async route(intentResult, context, entities) {
    const primaryIntent = intentResult.primary.intent;
    const handler = this.routes.get(primaryIntent) || this.defaultHandler;

    if (!handler) {
      throw new Error(`No handler for intent: ${primaryIntent}`);
    }

    return handler({
      intent: intentResult,
      context,
      entities,
      suggestedAgents: INTENT_AGENT_ROUTING[primaryIntent] || ['ATHENA'],
    });
  }
}

/**
 * IntentGrid - Main orchestrator
 */
class IntentGrid extends EventEmitter {
  constructor(options = {}) {
    super();

    this.classifier = new IntentClassifier(options.classifier);
    this.extractor = new EntityExtractor();
    this.router = new IntentRouter();

    // Conversation contexts
    this.contexts = new Map(); // userId -> ConversationContext

    // Ethics gateway reference
    this.ethicsGateway = options.ethicsGateway || null;

    // Configuration
    this.config = {
      contextTimeout: options.contextTimeout || 30 * 60 * 1000, // 30 minutes
      ...options.config,
    };

    // Stats
    this.stats = {
      processed: 0,
      byIntent: {},
      avgConfidence: 0,
    };

    // Cleanup old contexts periodically
    this._cleanupInterval = setInterval(() => this._cleanupContexts(), 60000);
  }

  /**
   * Process user input
   */
  async process(userId, input, metadata = {}) {
    this.stats.processed++;

    // Get or create context
    let context = this.contexts.get(userId);
    if (!context) {
      context = new ConversationContext(userId);
      this.contexts.set(userId, context);
    }

    // Add user message to context
    context.addMessage('user', input, metadata);

    // Process through ethics gateway if available
    let processedInput = input;
    if (this.ethicsGateway) {
      const ethicsResult = await this.ethicsGateway.processRequest(
        { text: input, userId },
        { action: 'intent_process', userId }
      );
      if (!ethicsResult.allowed) {
        return {
          success: false,
          error: 'Input blocked by ethics filter',
          report: ethicsResult.report,
        };
      }
      processedInput = ethicsResult.data.text || input;
    }

    // Classify intent
    const intentResult = this.classifier.classify(processedInput);
    context.addIntent(intentResult.primary);

    // Extract entities
    const entities = this.extractor.extract(processedInput);
    context.addEntities(entities);

    // Update stats
    this._updateStats(intentResult.primary);

    // Emit event
    this.emit('intent-processed', {
      userId,
      input: processedInput,
      intent: intentResult,
      entities,
    });

    // Build response
    const response = {
      success: true,
      intent: intentResult,
      entities,
      context: context.toJSON(),
      suggestedAgents: INTENT_AGENT_ROUTING[intentResult.primary.intent] || ['ATHENA'],
      requiresSlotFilling: this._checkSlotFilling(intentResult.primary.intent, entities),
    };

    // Route if handlers registered
    if (this.router.routes.size > 0) {
      try {
        response.routeResult = await this.router.route(intentResult, context, entities);
      } catch (err) {
        response.routeError = err.message;
      }
    }

    return response;
  }

  _checkSlotFilling(intent, entities) {
    // Define required slots per intent
    const requiredSlots = {
      [INTENT_CATEGORIES.PURCHASE]: ['item', 'amount'],
      [INTENT_CATEGORIES.GIFT]: ['recipient'],
      [INTENT_CATEGORIES.AGENT_SUMMON]: ['agent'],
      [INTENT_CATEGORIES.RITUAL_JOIN]: ['ritual'],
    };

    const required = requiredSlots[intent] || [];
    const entityTypes = entities.map(e => e.type);

    const missing = [];
    for (const slot of required) {
      if (!entityTypes.includes(slot)) {
        missing.push(slot);
      }
    }

    return missing.length > 0 ? { needed: true, missing } : { needed: false };
  }

  _updateStats(intent) {
    const intentName = intent.intent;
    this.stats.byIntent[intentName] = (this.stats.byIntent[intentName] || 0) + 1;

    // Rolling average confidence
    const n = this.stats.processed;
    this.stats.avgConfidence = ((n - 1) * this.stats.avgConfidence + intent.confidence) / n;
  }

  _cleanupContexts() {
    const now = Date.now();
    for (const [userId, context] of this.contexts.entries()) {
      if (now - context.lastActivity > this.config.contextTimeout) {
        this.contexts.delete(userId);
        this.emit('context-expired', { userId });
      }
    }
  }

  /**
   * Get conversation context
   */
  getContext(userId) {
    return this.contexts.get(userId) || null;
  }

  /**
   * Clear conversation context
   */
  clearContext(userId) {
    this.contexts.delete(userId);
    this.emit('context-cleared', { userId });
  }

  /**
   * Register intent handler
   */
  registerHandler(intent, handler) {
    this.router.register(intent, handler);
  }

  /**
   * Set default handler
   */
  setDefaultHandler(handler) {
    this.router.setDefault(handler);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeContexts: this.contexts.size,
    };
  }

  /**
   * Shutdown
   */
  shutdown() {
    clearInterval(this._cleanupInterval);
    this.emit('shutdown');
  }
}

module.exports = {
  IntentGrid,
  IntentClassifier,
  EntityExtractor,
  ConversationContext,
  IntentRouter,
  INTENT_CATEGORIES,
  INTENT_PATTERNS,
  INTENT_AGENT_ROUTING,
  ENTITY_TYPES,
};
