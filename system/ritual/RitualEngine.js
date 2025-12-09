/**
 * RitualEngine - Scheduled Events & Ceremonial Experiences
 * ═══════════════════════════════════════════════════════════════════
 * Orchestrates time-based rituals, seasonal events, and communal experiences.
 *
 * Powers:
 * - Christmas soft launch rituals
 * - NYE mega-event orchestration
 * - Daily/weekly user rituals
 * - Milestone celebrations
 * - Communal synchronized experiences
 * ═══════════════════════════════════════════════════════════════════
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

// Ritual Types
const RITUAL_TYPES = {
  // Personal rituals
  DAILY_CHECK_IN: 'daily_check_in',
  WEEKLY_REFLECTION: 'weekly_reflection',
  MONTHLY_REVIEW: 'monthly_review',

  // Milestone rituals
  FIRST_INTERACTION: 'first_interaction',
  STREAK_MILESTONE: 'streak_milestone',
  ACHIEVEMENT_UNLOCK: 'achievement_unlock',

  // Seasonal events
  CHRISTMAS_SOFT_LAUNCH: 'christmas_soft_launch',
  NYE_MEGA_EVENT: 'nye_mega_event',
  NEW_YEAR_INTENTION: 'new_year_intention',

  // Communal rituals
  COMMUNITY_SYNC: 'community_sync',
  COLLECTIVE_INTENTION: 'collective_intention',
  SHARED_CELEBRATION: 'shared_celebration',

  // Custom
  CUSTOM: 'custom',
};

// Ritual States
const RITUAL_STATES = {
  SCHEDULED: 'scheduled',
  PREPARING: 'preparing',
  ACTIVE: 'active',
  PEAK: 'peak',
  CLOSING: 'closing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Pre-defined seasonal events
const SEASONAL_EVENTS = {
  CHRISTMAS_2024: {
    id: 'christmas_2024',
    type: RITUAL_TYPES.CHRISTMAS_SOFT_LAUNCH,
    name: 'Christmas Soft Launch',
    description: 'First wave of users experiences the magic',
    startTime: new Date('2024-12-24T18:00:00Z'),
    endTime: new Date('2024-12-26T06:00:00Z'),
    phases: [
      { name: 'Eve Preparation', duration: 6 * 3600000, actions: ['ambient_shift', 'notification_wave'] },
      { name: 'Christmas Morning', duration: 12 * 3600000, actions: ['gift_reveal', 'community_greeting'] },
      { name: 'Day of Joy', duration: 18 * 3600000, actions: ['feature_unlock', 'gratitude_ritual'] },
    ],
    config: {
      maxParticipants: 1000,
      requiresSubscription: false,
      voiceEnabled: true,
      multiAgentOrchestration: true,
    },
  },
  NYE_2024: {
    id: 'nye_2024',
    type: RITUAL_TYPES.NYE_MEGA_EVENT,
    name: 'New Year\'s Eve Mega Event',
    description: 'Full multi-agent orchestration, live voice, communal experience',
    startTime: new Date('2024-12-31T20:00:00Z'),
    endTime: new Date('2025-01-01T04:00:00Z'),
    phases: [
      { name: 'Countdown Begins', duration: 3 * 3600000, actions: ['ambient_buildup', 'reflection_prompt'] },
      { name: 'Final Hour', duration: 3600000, actions: ['intensity_peak', 'community_sync'] },
      { name: 'Midnight Strike', duration: 60000, actions: ['peak_moment', 'collective_intention'] },
      { name: 'New Dawn', duration: 4 * 3600000, actions: ['intention_setting', 'celebration_continue'] },
    ],
    config: {
      maxParticipants: null, // Unlimited
      requiresSubscription: false,
      voiceEnabled: true,
      multiAgentOrchestration: true,
      liveCountdown: true,
      collectiveIntention: true,
    },
  },
};

/**
 * Ritual - Individual ritual instance
 */
class Ritual {
  constructor(config) {
    this.id = config.id || crypto.randomUUID();
    this.type = config.type;
    this.name = config.name;
    this.description = config.description || '';
    this.state = RITUAL_STATES.SCHEDULED;

    // Timing
    this.scheduledAt = config.scheduledAt || new Date();
    this.startTime = config.startTime;
    this.endTime = config.endTime;
    this.duration = config.duration || (this.endTime - this.startTime);

    // Phases
    this.phases = config.phases || [];
    this.currentPhase = null;
    this.phaseIndex = -1;

    // Participants
    this.participants = new Map();
    this.maxParticipants = config.maxParticipants || null;

    // Configuration
    this.config = config.config || {};

    // Results
    this.metrics = {
      participantCount: 0,
      peakConcurrent: 0,
      completionRate: 0,
      engagementScore: 0,
    };

    // Timestamps
    this.createdAt = new Date().toISOString();
    this.startedAt = null;
    this.completedAt = null;
  }

  canJoin(userId) {
    if (this.state === RITUAL_STATES.COMPLETED || this.state === RITUAL_STATES.CANCELLED) {
      return { allowed: false, reason: 'Ritual has ended' };
    }
    if (this.maxParticipants && this.participants.size >= this.maxParticipants) {
      return { allowed: false, reason: 'Ritual is full' };
    }
    if (this.participants.has(userId)) {
      return { allowed: true, reason: 'Already joined' };
    }
    return { allowed: true };
  }

  join(userId, metadata = {}) {
    const check = this.canJoin(userId);
    if (!check.allowed) return check;

    this.participants.set(userId, {
      joinedAt: new Date().toISOString(),
      ...metadata,
    });
    this.metrics.participantCount = this.participants.size;
    this.metrics.peakConcurrent = Math.max(this.metrics.peakConcurrent, this.participants.size);

    return { allowed: true, participantNumber: this.participants.size };
  }

  leave(userId) {
    this.participants.delete(userId);
    return { success: true };
  }

  advancePhase() {
    this.phaseIndex++;
    if (this.phaseIndex < this.phases.length) {
      this.currentPhase = this.phases[this.phaseIndex];
      return { phase: this.currentPhase, index: this.phaseIndex };
    }
    return null;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      description: this.description,
      state: this.state,
      startTime: this.startTime,
      endTime: this.endTime,
      currentPhase: this.currentPhase,
      participantCount: this.participants.size,
      metrics: this.metrics,
    };
  }
}

/**
 * RitualScheduler - Manages ritual timing
 */
class RitualScheduler {
  constructor() {
    this.scheduled = new Map(); // ritualId -> timeoutId
    this.recurring = new Map(); // ritualId -> intervalId
  }

  schedule(ritual, callback) {
    const now = Date.now();
    const startTime = new Date(ritual.startTime).getTime();
    const delay = startTime - now;

    if (delay <= 0) {
      // Start immediately
      callback(ritual, 'start');
      return;
    }

    const timeoutId = setTimeout(() => {
      callback(ritual, 'start');
      this.scheduled.delete(ritual.id);
    }, delay);

    this.scheduled.set(ritual.id, timeoutId);
  }

  scheduleRecurring(ritualTemplate, interval, callback) {
    const intervalId = setInterval(() => {
      const ritual = new Ritual({
        ...ritualTemplate,
        id: crypto.randomUUID(),
        startTime: new Date(),
      });
      callback(ritual, 'start');
    }, interval);

    this.recurring.set(ritualTemplate.id, intervalId);
  }

  cancel(ritualId) {
    const timeoutId = this.scheduled.get(ritualId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduled.delete(ritualId);
    }

    const intervalId = this.recurring.get(ritualId);
    if (intervalId) {
      clearInterval(intervalId);
      this.recurring.delete(ritualId);
    }
  }

  cancelAll() {
    for (const timeoutId of this.scheduled.values()) {
      clearTimeout(timeoutId);
    }
    this.scheduled.clear();

    for (const intervalId of this.recurring.values()) {
      clearInterval(intervalId);
    }
    this.recurring.clear();
  }
}

/**
 * RitualOrchestrator - Coordinates multi-agent ritual experiences
 */
class RitualOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super();

    this.agents = options.agents || null; // Reference to AgentManager
    this.voice = options.voice || null; // Reference to VoiceInterface
    this.ethicsGateway = options.ethicsGateway || null;

    this.activeAgents = new Map(); // ritualId -> [agentIds]
  }

  async orchestrate(ritual, phase) {
    const actions = phase.actions || [];
    const results = [];

    for (const action of actions) {
      const result = await this.executeAction(ritual, action);
      results.push(result);
    }

    return results;
  }

  async executeAction(ritual, action) {
    switch (action) {
      case 'ambient_shift':
        this.emit('ambient-change', { ritual, mood: 'celebratory' });
        return { action, success: true };

      case 'notification_wave':
        this.emit('notification', {
          ritual,
          message: `${ritual.name} is beginning...`,
          type: 'ritual_start',
        });
        return { action, success: true };

      case 'gift_reveal':
        this.emit('gift-reveal', { ritual });
        return { action, success: true };

      case 'community_greeting':
        this.emit('community-greeting', {
          ritual,
          participantCount: ritual.participants.size,
        });
        return { action, success: true };

      case 'feature_unlock':
        this.emit('feature-unlock', { ritual, features: ['premium_ritual'] });
        return { action, success: true };

      case 'gratitude_ritual':
        this.emit('gratitude-prompt', { ritual });
        return { action, success: true };

      case 'ambient_buildup':
        this.emit('ambient-change', { ritual, mood: 'anticipation', intensity: 0.7 });
        return { action, success: true };

      case 'reflection_prompt':
        this.emit('reflection-prompt', {
          ritual,
          prompt: 'What are you grateful for this year?',
        });
        return { action, success: true };

      case 'intensity_peak':
        this.emit('ambient-change', { ritual, mood: 'peak', intensity: 1.0 });
        return { action, success: true };

      case 'community_sync':
        this.emit('sync-moment', {
          ritual,
          participantCount: ritual.participants.size,
        });
        return { action, success: true };

      case 'peak_moment':
        this.emit('peak-moment', { ritual, timestamp: new Date().toISOString() });
        return { action, success: true };

      case 'collective_intention':
        this.emit('collective-intention', {
          ritual,
          prompt: 'Set your intention for the new year...',
        });
        return { action, success: true };

      case 'intention_setting':
        this.emit('intention-setting', { ritual });
        return { action, success: true };

      case 'celebration_continue':
        this.emit('celebration', { ritual, continuing: true });
        return { action, success: true };

      default:
        return { action, success: false, error: 'Unknown action' };
    }
  }

  async activateAgents(ritual, agentTypes = ['APOLLO', 'ATHENA']) {
    if (!this.agents) return [];

    const activated = [];
    for (const type of agentTypes) {
      const agentId = `${ritual.id}_${type}`;
      activated.push({ id: agentId, type });
    }

    this.activeAgents.set(ritual.id, activated);
    this.emit('agents-activated', { ritual, agents: activated });

    return activated;
  }

  deactivateAgents(ritualId) {
    const agents = this.activeAgents.get(ritualId);
    this.activeAgents.delete(ritualId);
    this.emit('agents-deactivated', { ritualId, agents });
  }
}

/**
 * RitualEngine - Main engine class
 */
class RitualEngine extends EventEmitter {
  constructor(options = {}) {
    super();

    this.scheduler = new RitualScheduler();
    this.orchestrator = new RitualOrchestrator(options);

    // Storage
    this.rituals = new Map(); // id -> Ritual
    this.userRituals = new Map(); // odamId -> [ritualIds]
    this.templates = new Map(); // templateId -> template

    // Configuration
    this.config = {
      enabled: options.enabled !== false,
      autoScheduleSeasonal: options.autoScheduleSeasonal !== false,
      ...options.config,
    };

    // Load seasonal events
    if (this.config.autoScheduleSeasonal) {
      this._loadSeasonalEvents();
    }

    // Wire orchestrator events
    this._wireOrchestratorEvents();

    // Stats
    this.stats = {
      ritualsCreated: 0,
      ritualsCompleted: 0,
      totalParticipants: 0,
    };
  }

  _loadSeasonalEvents() {
    for (const [key, eventConfig] of Object.entries(SEASONAL_EVENTS)) {
      const ritual = new Ritual(eventConfig);
      this.rituals.set(ritual.id, ritual);

      // Schedule if in the future
      if (new Date(ritual.startTime) > new Date()) {
        this.scheduler.schedule(ritual, (r, event) => this._onScheduledEvent(r, event));
      }
    }
  }

  _wireOrchestratorEvents() {
    // Forward all orchestrator events
    const events = [
      'ambient-change', 'notification', 'gift-reveal', 'community-greeting',
      'feature-unlock', 'gratitude-prompt', 'reflection-prompt', 'sync-moment',
      'peak-moment', 'collective-intention', 'intention-setting', 'celebration',
      'agents-activated', 'agents-deactivated',
    ];

    for (const event of events) {
      this.orchestrator.on(event, (data) => this.emit(event, data));
    }
  }

  _onScheduledEvent(ritual, event) {
    if (event === 'start') {
      this.startRitual(ritual.id);
    }
  }

  /**
   * Create a new ritual
   */
  createRitual(config) {
    const ritual = new Ritual(config);
    this.rituals.set(ritual.id, ritual);
    this.stats.ritualsCreated++;

    // Schedule if has start time
    if (ritual.startTime && new Date(ritual.startTime) > new Date()) {
      this.scheduler.schedule(ritual, (r, event) => this._onScheduledEvent(r, event));
    }

    this.emit('ritual-created', ritual.toJSON());
    return ritual;
  }

  /**
   * Start a ritual
   */
  async startRitual(ritualId) {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) throw new Error(`Ritual not found: ${ritualId}`);

    ritual.state = RITUAL_STATES.PREPARING;
    ritual.startedAt = new Date().toISOString();
    this.emit('ritual-starting', ritual.toJSON());

    // Activate agents if configured
    if (ritual.config.multiAgentOrchestration) {
      await this.orchestrator.activateAgents(ritual);
    }

    // Start first phase
    ritual.state = RITUAL_STATES.ACTIVE;
    const firstPhase = ritual.advancePhase();

    if (firstPhase) {
      await this.orchestrator.orchestrate(ritual, firstPhase.phase);
      this._schedulePhaseTransitions(ritual);
    }

    this.emit('ritual-started', ritual.toJSON());
    return ritual;
  }

  _schedulePhaseTransitions(ritual) {
    let cumulativeDelay = 0;

    for (let i = ritual.phaseIndex + 1; i < ritual.phases.length; i++) {
      const phase = ritual.phases[i];
      cumulativeDelay += ritual.phases[i - 1]?.duration || 0;

      setTimeout(async () => {
        if (ritual.state !== RITUAL_STATES.ACTIVE) return;

        ritual.currentPhase = phase;
        ritual.phaseIndex = i;

        // Check if this is the peak phase
        if (phase.name.toLowerCase().includes('peak') ||
            phase.name.toLowerCase().includes('midnight')) {
          ritual.state = RITUAL_STATES.PEAK;
        }

        await this.orchestrator.orchestrate(ritual, phase);
        this.emit('ritual-phase-change', { ritual: ritual.toJSON(), phase });
      }, cumulativeDelay);
    }

    // Schedule completion
    const totalDuration = ritual.phases.reduce((sum, p) => sum + (p.duration || 0), 0);
    setTimeout(() => {
      this.completeRitual(ritual.id);
    }, totalDuration);
  }

  /**
   * Complete a ritual
   */
  completeRitual(ritualId) {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) return;

    ritual.state = RITUAL_STATES.COMPLETED;
    ritual.completedAt = new Date().toISOString();
    ritual.metrics.completionRate =
      ritual.participants.size > 0 ?
      (ritual.participants.size / (ritual.maxParticipants || ritual.participants.size)) : 0;

    this.stats.ritualsCompleted++;
    this.stats.totalParticipants += ritual.participants.size;

    // Deactivate agents
    this.orchestrator.deactivateAgents(ritualId);

    this.emit('ritual-completed', ritual.toJSON());
    return ritual;
  }

  /**
   * Join a ritual
   */
  joinRitual(ritualId, userId, metadata = {}) {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) throw new Error(`Ritual not found: ${ritualId}`);

    const result = ritual.join(userId, metadata);

    if (result.allowed) {
      // Track user's rituals
      if (!this.userRituals.has(userId)) {
        this.userRituals.set(userId, []);
      }
      this.userRituals.get(userId).push(ritualId);

      this.emit('participant-joined', {
        ritual: ritual.toJSON(),
        userId,
        participantNumber: result.participantNumber,
      });
    }

    return result;
  }

  /**
   * Leave a ritual
   */
  leaveRitual(ritualId, userId) {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) throw new Error(`Ritual not found: ${ritualId}`);

    const result = ritual.leave(userId);

    // Remove from user's rituals
    const userRitualList = this.userRituals.get(userId);
    if (userRitualList) {
      const index = userRitualList.indexOf(ritualId);
      if (index > -1) userRitualList.splice(index, 1);
    }

    this.emit('participant-left', { ritualId, userId });
    return result;
  }

  /**
   * Get active rituals
   */
  getActiveRituals() {
    return Array.from(this.rituals.values())
      .filter(r => [RITUAL_STATES.ACTIVE, RITUAL_STATES.PEAK, RITUAL_STATES.PREPARING].includes(r.state))
      .map(r => r.toJSON());
  }

  /**
   * Get upcoming rituals
   */
  getUpcomingRituals(limit = 10) {
    const now = new Date();
    return Array.from(this.rituals.values())
      .filter(r => r.state === RITUAL_STATES.SCHEDULED && new Date(r.startTime) > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, limit)
      .map(r => r.toJSON());
  }

  /**
   * Get user's rituals
   */
  getUserRituals(userId) {
    const ritualIds = this.userRituals.get(userId) || [];
    return ritualIds
      .map(id => this.rituals.get(id))
      .filter(Boolean)
      .map(r => r.toJSON());
  }

  /**
   * Get ritual by ID
   */
  getRitual(ritualId) {
    const ritual = this.rituals.get(ritualId);
    return ritual ? ritual.toJSON() : null;
  }

  /**
   * Cancel a ritual
   */
  cancelRitual(ritualId, reason = '') {
    const ritual = this.rituals.get(ritualId);
    if (!ritual) return;

    ritual.state = RITUAL_STATES.CANCELLED;
    this.scheduler.cancel(ritualId);
    this.orchestrator.deactivateAgents(ritualId);

    this.emit('ritual-cancelled', { ritual: ritual.toJSON(), reason });
    return ritual;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeRituals: this.getActiveRituals().length,
      scheduledRituals: Array.from(this.rituals.values())
        .filter(r => r.state === RITUAL_STATES.SCHEDULED).length,
    };
  }

  /**
   * Shutdown
   */
  shutdown() {
    this.scheduler.cancelAll();
    this.emit('shutdown');
  }
}

module.exports = {
  RitualEngine,
  Ritual,
  RitualScheduler,
  RitualOrchestrator,
  RITUAL_TYPES,
  RITUAL_STATES,
  SEASONAL_EVENTS,
};
