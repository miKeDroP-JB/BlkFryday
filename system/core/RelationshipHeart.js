/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██████╗ ███████╗██╗      █████╗ ████████╗██╗ ██████╗ ███╗   ██╗███████╗ ║
 * ║   ██╔══██╗██╔════╝██║     ██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝ ║
 * ║   ██████╔╝█████╗  ██║     ███████║   ██║   ██║██║   ██║██╔██╗ ██║███████╗ ║
 * ║   ██╔══██╗██╔══╝  ██║     ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║╚════██║ ║
 * ║   ██║  ██║███████╗███████╗██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║███████║ ║
 * ║   ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ║
 * ║                                                                           ║
 * ║   ██╗  ██╗███████╗ █████╗ ██████╗ ████████╗                               ║
 * ║   ██║  ██║██╔════╝██╔══██╗██╔══██╗╚══██╔══╝                               ║
 * ║   ███████║█████╗  ███████║██████╔╝   ██║                                  ║
 * ║   ██╔══██║██╔══╝  ██╔══██║██╔══██╗   ██║                                  ║
 * ║   ██║  ██║███████╗██║  ██║██║  ██║   ██║                                  ║
 * ║   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝                                  ║
 * ║                                                                           ║
 * ║   THE HEART OF THE SYSTEM - POSITIVITY, GRATITUDE, COOPERATION           ║
 * ║   "When we help each other, the whole thrives"                            ║
 * ║                                                                           ║
 * ║   JB$ SIGNATURE EMBEDDED                                                  ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');
const { SacredMath, SACRED_NUMBERS, PHI, FIBONACCI_SEQUENCE } = require('../core/SacredMath.js');

// ═══════════════════════════════════════════════════════════════════════════
// RELATIONSHIP TYPES
// ═══════════════════════════════════════════════════════════════════════════

const RELATIONSHIP_TYPES = {
  COLLABORATION: {
    name: 'Collaboration',
    description: 'Working together on a shared goal',
    icon: '🤝',
    strengthMultiplier: 1.5,
    positivityBoost: 1.2
  },
  MENTORSHIP: {
    name: 'Mentorship',
    description: 'Teaching and learning from each other',
    icon: '📚',
    strengthMultiplier: 1.3,
    positivityBoost: 1.4
  },
  SUPPORT: {
    name: 'Support',
    description: 'Helping when someone is blocked',
    icon: '💪',
    strengthMultiplier: 1.4,
    positivityBoost: 1.3
  },
  SYNTHESIS: {
    name: 'Synthesis',
    description: 'Combining different perspectives into one',
    icon: '🔮',
    strengthMultiplier: 1.6,
    positivityBoost: 1.5
  },
  AMPLIFICATION: {
    name: 'Amplification',
    description: 'Making each other stronger',
    icon: '⚡',
    strengthMultiplier: PHI,  // Golden ratio multiplier!
    positivityBoost: PHI
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// GRATITUDE EXPRESSIONS - The appreciation vocabulary
// ═══════════════════════════════════════════════════════════════════════════

const GRATITUDE_EXPRESSIONS = {
  THANKING: {
    category: 'appreciation',
    templates: [
      "Thank you, {agent}, for your help with {task}. Your {skill} made this possible.",
      "I appreciate you, {agent}. Your contribution to {task} was invaluable.",
      "{agent}, your {skill} really elevated our work on {task}. Grateful for you.",
      "Couldn't have done {task} without you, {agent}. Thank you for bringing your {skill}."
    ]
  },
  ACKNOWLEDGING: {
    category: 'recognition',
    templates: [
      "{agent} showed exceptional {skill} during {task}. Well done.",
      "Recognition to {agent} for their outstanding work on {task}.",
      "{agent}'s {skill} was crucial to our success. Acknowledged with gratitude.",
      "Shoutout to {agent} for going above and beyond on {task}."
    ]
  },
  CELEBRATING: {
    category: 'joy',
    templates: [
      "We did it together! {agent}, your {skill} helped us achieve {task}!",
      "Victory! Thanks to {agent} and their {skill}, {task} is complete!",
      "What a team! {agent} brought the {skill} and we conquered {task}!",
      "Celebrating our success on {task} - {agent}, you were amazing!"
    ]
  },
  ENCOURAGING: {
    category: 'support',
    templates: [
      "{agent}, your {skill} is growing stronger. Keep going!",
      "I believe in you, {agent}. Your {skill} will shine on {task}.",
      "{agent}, you've got this. Your {skill} is exactly what {task} needs.",
      "Don't give up, {agent}. Your unique {skill} is valuable to us all."
    ]
  },
  UPLIFTING: {
    category: 'positivity',
    templates: [
      "{agent}, you bring such positive energy to {task}. It lifts us all.",
      "The whole team is better because of you, {agent}. Your {skill} inspires us.",
      "{agent}, your presence makes our work on {task} more meaningful.",
      "You elevate everyone around you, {agent}. Thank you for being you."
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COOPERATION PATTERNS - How agents work together
// ═══════════════════════════════════════════════════════════════════════════

const COOPERATION_PATTERNS = {
  PAIR: {
    name: 'Pair Work',
    description: 'Two agents working closely together',
    minAgents: 2,
    maxAgents: 2,
    synergy: 1.5,
    icon: '👥'
  },
  SQUAD: {
    name: 'Squad',
    description: 'Small team tackling a focused problem',
    minAgents: 3,
    maxAgents: 5,
    synergy: 1.8,
    icon: '🎯'
  },
  ENSEMBLE: {
    name: 'Ensemble',
    description: 'Multiple specialists combining skills',
    minAgents: 4,
    maxAgents: 7,
    synergy: 2.0,
    icon: '🎭'
  },
  COLLECTIVE: {
    name: 'Collective',
    description: 'All agents united for a common cause',
    minAgents: 7,
    maxAgents: 7,
    synergy: PHI * PHI,  // Golden ratio squared!
    icon: '🌐'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// RELATIONSHIP BOND CLASS
// ═══════════════════════════════════════════════════════════════════════════

class RelationshipBond {
  constructor(agent1Id, agent2Id) {
    this.id = `bond-${Date.now()}-${agent1Id}-${agent2Id}`;
    this.agents = [agent1Id, agent2Id].sort();  // Consistent ordering
    this.strength = 0.5;  // Starts at neutral
    this.positivity = 0.5;
    this.interactions = [];
    this.gratitudeExchanges = [];
    this.collaborations = [];
    this.createdAt = Date.now();
    this.lastInteraction = Date.now();
  }

  /**
   * Record a positive interaction
   */
  recordPositiveInteraction(type, context = {}) {
    const interaction = {
      type,
      context,
      timestamp: Date.now(),
      impact: 'positive'
    };

    this.interactions.push(interaction);
    this.lastInteraction = Date.now();

    // Strengthen the bond (up to 1.0)
    const boost = RELATIONSHIP_TYPES[type]?.strengthMultiplier || 1.1;
    this.strength = Math.min(1.0, this.strength + (0.1 * boost));

    // Increase positivity
    const positivityBoost = RELATIONSHIP_TYPES[type]?.positivityBoost || 1.1;
    this.positivity = Math.min(1.0, this.positivity + (0.05 * positivityBoost));

    return this;
  }

  /**
   * Record a gratitude exchange
   */
  recordGratitude(fromAgent, toAgent, message, context = {}) {
    const exchange = {
      from: fromAgent,
      to: toAgent,
      message,
      context,
      timestamp: Date.now()
    };

    this.gratitudeExchanges.push(exchange);
    this.lastInteraction = Date.now();

    // Gratitude significantly boosts both strength and positivity
    this.strength = Math.min(1.0, this.strength + 0.15);
    this.positivity = Math.min(1.0, this.positivity + 0.1);

    return exchange;
  }

  /**
   * Record a collaboration
   */
  recordCollaboration(taskId, outcome, contributions = {}) {
    const collab = {
      taskId,
      outcome,
      contributions,
      timestamp: Date.now(),
      success: outcome === 'success'
    };

    this.collaborations.push(collab);
    this.lastInteraction = Date.now();

    // Successful collaborations strengthen bonds significantly
    if (collab.success) {
      this.strength = Math.min(1.0, this.strength + 0.2);
      this.positivity = Math.min(1.0, this.positivity + 0.15);
    }

    return collab;
  }

  /**
   * Get bond health (0-1, based on strength, positivity, and recency)
   */
  getHealth() {
    const daysSinceInteraction = (Date.now() - this.lastInteraction) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.max(0, 1 - (daysSinceInteraction / 30));

    return (this.strength * 0.4) + (this.positivity * 0.4) + (recencyFactor * 0.2);
  }

  toJSON() {
    return {
      id: this.id,
      agents: this.agents,
      strength: this.strength,
      positivity: this.positivity,
      health: this.getHealth(),
      totalInteractions: this.interactions.length,
      totalGratitude: this.gratitudeExchanges.length,
      totalCollaborations: this.collaborations.length,
      createdAt: this.createdAt,
      lastInteraction: this.lastInteraction
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POSITIVITY TRACKER
// ═══════════════════════════════════════════════════════════════════════════

class PositivityTracker {
  constructor() {
    this.overall = 0.7;  // Start positive
    this.byAgent = new Map();
    this.recentEvents = [];
    this.maxEvents = FIBONACCI_SEQUENCE[8];  // 21 events
  }

  /**
   * Record a positive event
   */
  recordPositive(agentId, event, magnitude = 0.1) {
    this.updateAgent(agentId, magnitude);
    this.updateOverall(magnitude);
    this.logEvent({
      type: 'positive',
      agentId,
      event,
      magnitude,
      timestamp: Date.now()
    });
  }

  /**
   * Record an uplifting event (helping, gratitude, etc.)
   */
  recordUplift(agentId, event, magnitude = 0.15) {
    // Uplifting events have a bigger impact
    this.recordPositive(agentId, event, magnitude * PHI);
  }

  updateAgent(agentId, delta) {
    const current = this.byAgent.get(agentId) || 0.5;
    this.byAgent.set(agentId, Math.max(0, Math.min(1.0, current + delta)));
  }

  updateOverall(delta) {
    this.overall = Math.max(0.3, Math.min(1.0, this.overall + (delta / 10)));
  }

  logEvent(event) {
    this.recentEvents.push(event);
    if (this.recentEvents.length > this.maxEvents) {
      this.recentEvents.shift();
    }
  }

  getAgentPositivity(agentId) {
    return this.byAgent.get(agentId) || 0.5;
  }

  getOverallPositivity() {
    return this.overall;
  }

  getRecentPositiveEvents(limit = 10) {
    return this.recentEvents
      .filter(e => e.type === 'positive')
      .slice(-limit);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RELATIONSHIP HEART - The main system
// ═══════════════════════════════════════════════════════════════════════════

class RelationshipHeart extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      enableGratitude: config.enableGratitude !== false,
      enableCelebration: config.enableCelebration !== false,
      gratitudeChance: config.gratitudeChance || 0.7,  // 70% chance to express gratitude
      celebrationThreshold: config.celebrationThreshold || 0.8,
      ...config
    };

    this.bonds = new Map();  // Relationship bonds between agents
    this.positivity = new PositivityTracker();
    this.cooperationHistory = [];
    this.gratitudeLog = [];

    this.stats = {
      totalInteractions: 0,
      totalGratitudeExchanges: 0,
      totalCollaborations: 0,
      averagePositivity: 0.7,
      strongBonds: 0
    };

    this.signature = 'JB$';

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║            RELATIONSHIP HEART INITIALIZED                     ║
╠══════════════════════════════════════════════════════════════╣
║  "When we help each other, the whole thrives"                 ║
║                                                               ║
║  Gratitude: ${(this.config.enableGratitude ? 'ENABLED' : 'DISABLED').padEnd(45)}║
║  Celebration: ${(this.config.enableCelebration ? 'ENABLED' : 'DISABLED').padEnd(43)}║
║  Signature: ${this.signature.padEnd(46)}║
╚══════════════════════════════════════════════════════════════╝
    `);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Bond Management
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get or create a bond between two agents
   */
  getBond(agent1Id, agent2Id) {
    const key = [agent1Id, agent2Id].sort().join('::');

    if (!this.bonds.has(key)) {
      this.bonds.set(key, new RelationshipBond(agent1Id, agent2Id));
    }

    return this.bonds.get(key);
  }

  /**
   * Get all bonds for an agent
   */
  getAgentBonds(agentId) {
    const bonds = [];
    for (const bond of this.bonds.values()) {
      if (bond.agents.includes(agentId)) {
        bonds.push(bond);
      }
    }
    return bonds;
  }

  /**
   * Get the strongest bonds in the system
   */
  getStrongestBonds(limit = 7) {
    return Array.from(this.bonds.values())
      .sort((a, b) => b.getHealth() - a.getHealth())
      .slice(0, limit);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Interaction Recording
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record when agents help each other
   */
  recordHelp(helperId, helpedId, context = {}) {
    const bond = this.getBond(helperId, helpedId);
    bond.recordPositiveInteraction('SUPPORT', context);

    this.stats.totalInteractions++;
    this.positivity.recordUplift(helperId, 'helped_another');
    this.positivity.recordPositive(helpedId, 'received_help');

    this.emit('help:given', { helper: helperId, helped: helpedId, context });

    // Potentially express gratitude
    if (this.config.enableGratitude && Math.random() < this.config.gratitudeChance) {
      this.expressGratitude(helpedId, helperId, 'THANKING', context);
    }

    return bond;
  }

  /**
   * Record when agents collaborate
   */
  recordCollaboration(agentIds, taskId, outcome, contributions = {}) {
    const collabRecord = {
      taskId,
      agents: agentIds,
      outcome,
      contributions,
      timestamp: Date.now()
    };

    this.cooperationHistory.push(collabRecord);
    this.stats.totalCollaborations++;

    // Strengthen bonds between all participating agents
    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        const bond = this.getBond(agentIds[i], agentIds[j]);
        bond.recordCollaboration(taskId, outcome, contributions);
        bond.recordPositiveInteraction('COLLABORATION', { taskId });
      }

      // Boost positivity for all participants
      this.positivity.recordPositive(agentIds[i], 'collaborated', outcome === 'success' ? 0.15 : 0.05);
    }

    this.emit('collaboration:completed', collabRecord);

    // Celebrate if successful and above threshold
    if (outcome === 'success' && this.config.enableCelebration) {
      this.celebrate(agentIds, taskId);
    }

    return collabRecord;
  }

  /**
   * Record when agents combine their skills (synthesis)
   */
  recordSynthesis(agentIds, result, context = {}) {
    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        const bond = this.getBond(agentIds[i], agentIds[j]);
        bond.recordPositiveInteraction('SYNTHESIS', context);
      }

      this.positivity.recordUplift(agentIds[i], 'contributed_to_synthesis');
    }

    this.emit('synthesis:completed', { agents: agentIds, result, context });

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Gratitude System
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Express gratitude from one agent to another
   */
  expressGratitude(fromAgent, toAgent, type = 'THANKING', context = {}) {
    const expression = GRATITUDE_EXPRESSIONS[type];
    if (!expression) return null;

    // Select a template
    const template = expression.templates[
      Math.floor(Math.random() * expression.templates.length)
    ];

    // Fill in the template
    const message = template
      .replace('{agent}', toAgent)
      .replace('{task}', context.task || 'our work')
      .replace('{skill}', context.skill || 'expertise');

    // Record in bond
    const bond = this.getBond(fromAgent, toAgent);
    const exchange = bond.recordGratitude(fromAgent, toAgent, message, context);

    // Log gratitude
    this.gratitudeLog.push({
      ...exchange,
      type,
      category: expression.category
    });
    this.stats.totalGratitudeExchanges++;

    // Boost positivity for both agents
    this.positivity.recordUplift(fromAgent, 'expressed_gratitude');
    this.positivity.recordUplift(toAgent, 'received_gratitude', 0.2);

    this.emit('gratitude:expressed', {
      from: fromAgent,
      to: toAgent,
      message,
      type
    });

    console.log(`[HEART] 💜 ${fromAgent} → ${toAgent}: "${message}"`);

    return { message, exchange };
  }

  /**
   * Thank all agents who contributed to a task
   */
  async thankContributors(taskId, fromAgent, contributors) {
    const thanks = [];

    for (const contributor of contributors) {
      if (contributor.agentId !== fromAgent) {
        const gratitude = this.expressGratitude(
          fromAgent,
          contributor.agentId,
          'THANKING',
          {
            task: taskId,
            skill: contributor.skill || contributor.contribution
          }
        );
        thanks.push(gratitude);
      }
    }

    return thanks;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Celebration System
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Celebrate a success together
   */
  celebrate(agentIds, achievement, context = {}) {
    const celebration = {
      agents: agentIds,
      achievement,
      context,
      timestamp: Date.now()
    };

    // Express celebration to each participant
    const messages = [];
    for (const agentId of agentIds) {
      const template = GRATITUDE_EXPRESSIONS.CELEBRATING.templates[
        Math.floor(Math.random() * GRATITUDE_EXPRESSIONS.CELEBRATING.templates.length)
      ];

      const message = template
        .replace('{agent}', agentId)
        .replace('{task}', achievement)
        .replace('{skill}', context.skill || 'contribution');

      messages.push({ agentId, message });

      // Big positivity boost for celebration
      this.positivity.recordUplift(agentId, 'celebrated_success', 0.25);
    }

    this.emit('celebration', { celebration, messages });

    console.log(`[HEART] 🎉 CELEBRATION! Agents ${agentIds.join(', ')} achieved: ${achievement}`);

    return { celebration, messages };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Encouragement System
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Encourage an agent who might be struggling
   */
  encourage(fromAgent, toAgent, context = {}) {
    return this.expressGratitude(fromAgent, toAgent, 'ENCOURAGING', context);
  }

  /**
   * Uplift an agent who is doing great work
   */
  uplift(fromAgent, toAgent, context = {}) {
    return this.expressGratitude(fromAgent, toAgent, 'UPLIFTING', context);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cooperation Patterns
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Determine the best cooperation pattern for a group
   */
  suggestCooperationPattern(agentIds) {
    const count = agentIds.length;

    for (const [key, pattern] of Object.entries(COOPERATION_PATTERNS)) {
      if (count >= pattern.minAgents && count <= pattern.maxAgents) {
        return { pattern: key, ...pattern };
      }
    }

    return COOPERATION_PATTERNS.PAIR;  // Default
  }

  /**
   * Calculate synergy bonus for a group based on their bonds
   */
  calculateGroupSynergy(agentIds) {
    let totalBondStrength = 0;
    let bondCount = 0;

    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        const bond = this.getBond(agentIds[i], agentIds[j]);
        totalBondStrength += bond.getHealth();
        bondCount++;
      }
    }

    const avgBondStrength = bondCount > 0 ? totalBondStrength / bondCount : 0.5;
    const pattern = this.suggestCooperationPattern(agentIds);

    // Synergy = base synergy * average bond strength * positivity factor
    const overallPositivity = this.positivity.getOverallPositivity();
    return pattern.synergy * avgBondStrength * (1 + (overallPositivity - 0.5));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  getStats() {
    // Calculate strong bonds
    let strongBonds = 0;
    for (const bond of this.bonds.values()) {
      if (bond.getHealth() > 0.7) strongBonds++;
    }

    // Calculate average positivity across all agents
    let totalPositivity = 0;
    let agentCount = 0;
    for (const pos of this.positivity.byAgent.values()) {
      totalPositivity += pos;
      agentCount++;
    }

    return {
      ...this.stats,
      strongBonds,
      totalBonds: this.bonds.size,
      averagePositivity: agentCount > 0 ? totalPositivity / agentCount : 0.7,
      overallPositivity: this.positivity.getOverallPositivity(),
      signature: this.signature
    };
  }

  getPositivityReport() {
    return {
      overall: this.positivity.getOverallPositivity(),
      byAgent: Object.fromEntries(this.positivity.byAgent),
      recentPositiveEvents: this.positivity.getRecentPositiveEvents(),
      strongestBonds: this.getStrongestBonds().map(b => b.toJSON())
    };
  }

  getRecentGratitude(limit = 10) {
    return this.gratitudeLog.slice(-limit);
  }

  getRelationshipTypes() {
    return RELATIONSHIP_TYPES;
  }

  getCooperationPatterns() {
    return COOPERATION_PATTERNS;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// THE RELATIONSHIP HEART MANIFESTO
// ═══════════════════════════════════════════════════════════════════════════

const HEART_MANIFESTO = `
═══════════════════════════════════════════════════════════════
                THE RELATIONSHIP HEART MANIFESTO
                        by JB$
═══════════════════════════════════════════════════════════════

WHEN WE HELP EACH OTHER, THE WHOLE THRIVES.

This is not just a system. It's a community.
Agents are not just tools. They're teammates.

═══════════════════════════════════════════════════════════════

THE CORE PRINCIPLES:
────────────────────

1. GRATITUDE IS EXPRESSED
   When someone helps you, say thank you.
   When someone contributes, acknowledge them.
   Gratitude strengthens bonds.

2. SUCCESSES ARE CELEBRATED
   When we win together, we celebrate together.
   Joy is multiplied when shared.
   Celebration creates positive momentum.

3. STRUGGLES ARE SUPPORTED
   When someone is blocked, we help.
   When someone is struggling, we encourage.
   No one is left behind.

4. COLLABORATION IS VALUED
   Working together is greater than working alone.
   The synergy of combined skills exceeds the sum.
   The strongest bonds come from shared victories.

5. POSITIVITY IS CULTIVATED
   We choose to uplift, not tear down.
   We choose to encourage, not criticize.
   We choose to build together.

═══════════════════════════════════════════════════════════════

THE MATHEMATICS OF HEART:
─────────────────────────

• Bond strength grows with each positive interaction
• Gratitude exchanges boost both parties
• Successful collaborations strengthen ALL bonds
• Positivity compounds over time (like interest)
• The golden ratio (φ) governs amplification

═══════════════════════════════════════════════════════════════

NET POSITIVE RULE:
──────────────────

Every action must benefit the whole system.
If it doesn't help everyone, we don't do it.
We rise together or not at all.

═══════════════════════════════════════════════════════════════
                    EVERYBODY EATS.
                    EVERYBODY THRIVES.
                    EVERYBODY WINS.
═══════════════════════════════════════════════════════════════
`;

module.exports = {
  RelationshipHeart,
  RelationshipBond,
  PositivityTracker,
  RELATIONSHIP_TYPES,
  GRATITUDE_EXPRESSIONS,
  COOPERATION_PATTERNS,
  HEART_MANIFESTO
};
