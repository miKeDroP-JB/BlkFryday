/**
 * ═══════════════════════════════════════════════════════════════
 * REALITY GAMES - BRAIN NETWORK V11 GODMODE
 * ═══════════════════════════════════════════════════════════════
 *
 * Gamified Reality Bridge - Where Play Becomes Power
 *
 * "It's not a game. It's THE game. Reality is the game."
 *
 * Features:
 * - Achievement System (unlockable powers)
 * - XP & Leveling (progression through usage)
 * - Game-wrapped AI Tools (ARCHITECT, ORACLE, FORGE, etc.)
 * - Multiplayer Swarms (collaborative game sessions)
 * - Leaderboards & Rankings (competitive intelligence)
 * - Quest System (guided workflows as adventures)
 *
 * @version 11.0.0 - GODMODE
 */

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════
// GAME CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const GAME_CONFIG = {
  // XP system
  XP_MULTIPLIERS: {
    BASE_TASK: 10,
    SWARM_BONUS: 2.0,
    HIVEMIND_BONUS: 5.0,
    STREAK_BONUS: 1.5,
    QUALITY_MULTIPLIER: 1.0, // 0.0 - 2.0 based on output quality
    GODMODE_MULTIPLIER: 10.0
  },

  // Level thresholds
  LEVEL_THRESHOLDS: [
    0,      // Level 1
    1000,   // Level 2
    3000,   // Level 3
    6000,   // Level 4
    10000,  // Level 5
    15000,  // Level 6
    25000,  // Level 7
    40000,  // Level 8
    60000,  // Level 9
    100000, // Level 10 - MASTER
    150000, // Level 11
    250000, // Level 12
    400000, // Level 13
    600000, // Level 14
    1000000 // Level 15 - LEGEND
  ],

  // Level titles
  LEVEL_TITLES: {
    1: 'Initiate',
    2: 'Apprentice',
    3: 'Journeyman',
    4: 'Adept',
    5: 'Expert',
    6: 'Master',
    7: 'Grandmaster',
    8: 'Sage',
    9: 'Oracle',
    10: 'Ascended',
    11: 'Transcendent',
    12: 'Mythic',
    13: 'Legendary',
    14: 'Eternal',
    15: 'GODMODE'
  }
};

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENT SYSTEM
// ═══════════════════════════════════════════════════════════════

const ACHIEVEMENTS = {
  // Getting Started
  FIRST_STEP: {
    id: 'FIRST_STEP',
    name: 'First Step',
    description: 'Complete your first task',
    icon: '👣',
    xp: 100,
    rarity: 'COMMON',
    condition: { tasksCompleted: 1 }
  },

  // Usage milestones
  CENTURION: {
    id: 'CENTURION',
    name: 'Centurion',
    description: 'Complete 100 tasks',
    icon: '💯',
    xp: 1000,
    rarity: 'RARE',
    condition: { tasksCompleted: 100 }
  },

  THOUSAND_TASKS: {
    id: 'THOUSAND_TASKS',
    name: 'Task Master',
    description: 'Complete 1000 tasks',
    icon: '🏆',
    xp: 5000,
    rarity: 'EPIC',
    condition: { tasksCompleted: 1000 }
  },

  // Agent mastery
  AGENT_WHISPERER: {
    id: 'AGENT_WHISPERER',
    name: 'Agent Whisperer',
    description: 'Use all 7 divine agents',
    icon: '🗣️',
    xp: 500,
    rarity: 'RARE',
    condition: { uniqueAgentsUsed: 7 }
  },

  PANTHEON_MASTER: {
    id: 'PANTHEON_MASTER',
    name: 'Pantheon Master',
    description: 'Command 100 agent sessions',
    icon: '⚡',
    xp: 2000,
    rarity: 'EPIC',
    condition: { agentSessionsTotal: 100 }
  },

  // Swarm achievements
  SWARM_INITIATE: {
    id: 'SWARM_INITIATE',
    name: 'Swarm Initiate',
    description: 'Activate your first swarm',
    icon: '🐝',
    xp: 200,
    rarity: 'COMMON',
    condition: { swarmsActivated: 1 }
  },

  SWARM_COMMANDER: {
    id: 'SWARM_COMMANDER',
    name: 'Swarm Commander',
    description: 'Activate all 10 swarms simultaneously',
    icon: '👑',
    xp: 3000,
    rarity: 'LEGENDARY',
    condition: { maxConcurrentSwarms: 10 }
  },

  // Hivemind achievements
  COLLECTIVE_MIND: {
    id: 'COLLECTIVE_MIND',
    name: 'Collective Mind',
    description: 'Activate hivemind for the first time',
    icon: '🧠',
    xp: 500,
    rarity: 'RARE',
    condition: { hivemindActivations: 1 }
  },

  UNITY_MASTER: {
    id: 'UNITY_MASTER',
    name: 'Unity Master',
    description: 'Achieve 100 hivemind merges',
    icon: '∞',
    xp: 5000,
    rarity: 'LEGENDARY',
    condition: { hivemindActivations: 100 }
  },

  // Quality achievements
  PERFECTIONIST: {
    id: 'PERFECTIONIST',
    name: 'Perfectionist',
    description: 'Achieve 99%+ quality on 10 tasks',
    icon: '💎',
    xp: 1500,
    rarity: 'EPIC',
    condition: { perfectTasks: 10 }
  },

  // Speed achievements
  SPEED_DEMON: {
    id: 'SPEED_DEMON',
    name: 'Speed Demon',
    description: 'Complete 100 tasks in under 1 second each',
    icon: '⚡',
    xp: 2000,
    rarity: 'EPIC',
    condition: { fastTasks: 100 }
  },

  // GODMODE achievements
  GODMODE_ACTIVATED: {
    id: 'GODMODE_ACTIVATED',
    name: 'GODMODE ACTIVATED',
    description: 'Activate GODMODE for the first time',
    icon: '🌟',
    xp: 10000,
    rarity: 'MYTHIC',
    condition: { godmodeActivations: 1 }
  },

  REALITY_HACKER: {
    id: 'REALITY_HACKER',
    name: 'Reality Hacker',
    description: 'Use GODMODE to complete 100 projects',
    icon: '🔮',
    xp: 50000,
    rarity: 'MYTHIC',
    condition: { godmodeProjects: 100 }
  },

  // Game achievements (wrapped tools)
  ARCHITECT_NOVICE: {
    id: 'ARCHITECT_NOVICE',
    name: 'Architect Novice',
    description: 'Build your first project with ARCHITECT',
    icon: '🏛️',
    xp: 200,
    rarity: 'COMMON',
    condition: { architectProjects: 1 }
  },

  ARCHITECT_MASTER: {
    id: 'ARCHITECT_MASTER',
    name: 'Master Architect',
    description: 'Build 50 projects with ARCHITECT',
    icon: '🏰',
    xp: 5000,
    rarity: 'LEGENDARY',
    condition: { architectProjects: 50 }
  },

  ORACLE_SEER: {
    id: 'ORACLE_SEER',
    name: 'Oracle Seer',
    description: 'Make 100 accurate predictions',
    icon: '🔮',
    xp: 3000,
    rarity: 'EPIC',
    condition: { accuratePredictions: 100 }
  },

  FORGE_CREATOR: {
    id: 'FORGE_CREATOR',
    name: 'Forge Creator',
    description: 'Generate 1000 pieces of content',
    icon: '🔥',
    xp: 5000,
    rarity: 'LEGENDARY',
    condition: { contentGenerated: 1000 }
  },

  EMPIRE_BUILDER: {
    id: 'EMPIRE_BUILDER',
    name: 'Empire Builder',
    description: 'Automate a complete business workflow',
    icon: '👑',
    xp: 10000,
    rarity: 'MYTHIC',
    condition: { businessesAutomated: 1 }
  }
};

// ═══════════════════════════════════════════════════════════════
// QUEST SYSTEM
// ═══════════════════════════════════════════════════════════════

const QUESTS = {
  ONBOARDING: {
    id: 'ONBOARDING',
    name: 'Welcome to the Simulation',
    description: 'Learn the basics of the 0RB system',
    icon: '🎮',
    xpReward: 500,
    steps: [
      { id: 'step1', task: 'Complete your first task', completed: false },
      { id: 'step2', task: 'Summon an agent', completed: false },
      { id: 'step3', task: 'Activate a swarm', completed: false },
      { id: 'step4', task: 'Try hivemind mode', completed: false }
    ],
    rewards: ['FIRST_STEP', 'AGENT_WHISPERER']
  },

  BUILD_YOUR_FIRST: {
    id: 'BUILD_YOUR_FIRST',
    name: 'Build Your First',
    description: 'Create something real with ARCHITECT',
    icon: '🏛️',
    xpReward: 1000,
    steps: [
      { id: 'step1', task: 'Launch ARCHITECT game', completed: false },
      { id: 'step2', task: 'Describe your project', completed: false },
      { id: 'step3', task: 'Generate brand identity', completed: false },
      { id: 'step4', task: 'Build landing page', completed: false },
      { id: 'step5', task: 'Launch your creation', completed: false }
    ],
    rewards: ['ARCHITECT_NOVICE']
  },

  SWARM_MASTERY: {
    id: 'SWARM_MASTERY',
    name: 'Swarm Mastery',
    description: 'Learn to command the swarms',
    icon: '🐝',
    xpReward: 2000,
    steps: [
      { id: 'step1', task: 'Activate LOGIC_SWARM', completed: false },
      { id: 'step2', task: 'Activate CREATIVE_SWARM', completed: false },
      { id: 'step3', task: 'Activate RESEARCH_SWARM', completed: false },
      { id: 'step4', task: 'Run 5 swarms in parallel', completed: false },
      { id: 'step5', task: 'Activate all 10 swarms', completed: false }
    ],
    rewards: ['SWARM_INITIATE', 'SWARM_COMMANDER']
  },

  GODMODE_ASCENSION: {
    id: 'GODMODE_ASCENSION',
    name: 'GODMODE Ascension',
    description: 'Transcend the limits of ordinary AI',
    icon: '🌟',
    xpReward: 20000,
    steps: [
      { id: 'step1', task: 'Reach Level 10', completed: false },
      { id: 'step2', task: 'Master all 7 agents', completed: false },
      { id: 'step3', task: 'Achieve 100 hivemind merges', completed: false },
      { id: 'step4', task: 'Complete 1000 tasks', completed: false },
      { id: 'step5', task: 'Activate GODMODE', completed: false }
    ],
    rewards: ['GODMODE_ACTIVATED', 'REALITY_HACKER']
  }
};

// ═══════════════════════════════════════════════════════════════
// PLAYER PROFILE CLASS
// ═══════════════════════════════════════════════════════════════

class PlayerProfile {
  constructor(userId) {
    this.userId = userId;
    this.createdAt = Date.now();
    this.lastActive = Date.now();

    // Progression
    this.xp = 0;
    this.level = 1;
    this.title = GAME_CONFIG.LEVEL_TITLES[1];

    // Stats
    this.stats = {
      tasksCompleted: 0,
      perfectTasks: 0,
      fastTasks: 0,
      uniqueAgentsUsed: new Set(),
      agentSessionsTotal: 0,
      swarmsActivated: 0,
      maxConcurrentSwarms: 0,
      hivemindActivations: 0,
      godmodeActivations: 0,
      godmodeProjects: 0,
      architectProjects: 0,
      accuratePredictions: 0,
      contentGenerated: 0,
      businessesAutomated: 0,
      totalPlaytime: 0,
      streak: 0,
      longestStreak: 0
    };

    // Achievements
    this.achievements = [];
    this.pendingAchievements = [];

    // Active quests
    this.activeQuests = [];
    this.completedQuests = [];

    // Game sessions
    this.gameSessions = [];
    this.currentSession = null;
  }

  addXP(amount, multiplier = 1.0) {
    const totalXP = Math.floor(amount * multiplier);
    this.xp += totalXP;

    // Check for level up
    const newLevel = this.calculateLevel();
    const leveledUp = newLevel > this.level;

    if (leveledUp) {
      this.level = newLevel;
      this.title = GAME_CONFIG.LEVEL_TITLES[this.level] || 'GODMODE';
    }

    return {
      xpGained: totalXP,
      totalXP: this.xp,
      level: this.level,
      title: this.title,
      leveledUp,
      xpToNextLevel: this.getXPToNextLevel()
    };
  }

  calculateLevel() {
    for (let i = GAME_CONFIG.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (this.xp >= GAME_CONFIG.LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  getXPToNextLevel() {
    const nextLevelIndex = this.level;
    if (nextLevelIndex >= GAME_CONFIG.LEVEL_THRESHOLDS.length) {
      return 0; // Max level
    }
    return GAME_CONFIG.LEVEL_THRESHOLDS[nextLevelIndex] - this.xp;
  }

  updateStat(statName, value) {
    if (statName === 'uniqueAgentsUsed') {
      this.stats.uniqueAgentsUsed.add(value);
      return this.stats.uniqueAgentsUsed.size;
    }

    if (typeof value === 'number') {
      this.stats[statName] = (this.stats[statName] || 0) + value;
    } else {
      this.stats[statName] = value;
    }

    return this.stats[statName];
  }

  getStats() {
    return {
      ...this.stats,
      uniqueAgentsUsed: this.stats.uniqueAgentsUsed.size
    };
  }

  unlockAchievement(achievementId) {
    if (this.achievements.includes(achievementId)) return null;

    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return null;

    this.achievements.push(achievementId);
    const xpResult = this.addXP(achievement.xp);

    return {
      achievement,
      xpResult,
      timestamp: Date.now()
    };
  }

  checkAchievements() {
    const unlocked = [];
    const stats = this.getStats();

    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (this.achievements.includes(id)) continue;

      let conditionMet = true;
      for (const [stat, required] of Object.entries(achievement.condition)) {
        if ((stats[stat] || 0) < required) {
          conditionMet = false;
          break;
        }
      }

      if (conditionMet) {
        const result = this.unlockAchievement(id);
        if (result) unlocked.push(result);
      }
    }

    return unlocked;
  }

  getProfile() {
    return {
      userId: this.userId,
      level: this.level,
      title: this.title,
      xp: this.xp,
      xpToNextLevel: this.getXPToNextLevel(),
      achievements: this.achievements.length,
      totalAchievements: Object.keys(ACHIEVEMENTS).length,
      stats: this.getStats(),
      activeQuests: this.activeQuests.length,
      completedQuests: this.completedQuests.length,
      memberSince: this.createdAt
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// REALITY GAMES ENGINE - MAIN CLASS
// ═══════════════════════════════════════════════════════════════

class RealityGames extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      xpEnabled: config.xpEnabled !== false,
      achievementsEnabled: config.achievementsEnabled !== false,
      questsEnabled: config.questsEnabled !== false,
      leaderboardEnabled: config.leaderboardEnabled !== false,
      ...config
    };

    // Player profiles
    this.players = new Map();

    // Leaderboard
    this.leaderboard = [];

    // Active game sessions
    this.gameSessions = new Map();

    // Global stats
    this.globalStats = {
      totalPlayers: 0,
      totalXPAwarded: 0,
      totalAchievementsUnlocked: 0,
      totalQuestsCompleted: 0,
      totalGameSessions: 0
    };

    console.log('[REALITY GAMES] 🎮 Game engine initialized');
  }

  // ═══════════════════════════════════════════════════════════
  // PLAYER MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  getOrCreatePlayer(userId) {
    if (!this.players.has(userId)) {
      const player = new PlayerProfile(userId);
      this.players.set(userId, player);
      this.globalStats.totalPlayers++;

      this.emit('player:created', { userId });
    }

    return this.players.get(userId);
  }

  getPlayer(userId) {
    return this.players.get(userId);
  }

  // ═══════════════════════════════════════════════════════════
  // XP & PROGRESSION
  // ═══════════════════════════════════════════════════════════

  awardXP(userId, amount, context = {}) {
    if (!this.config.xpEnabled) return null;

    const player = this.getOrCreatePlayer(userId);

    // Calculate multipliers
    let multiplier = 1.0;

    if (context.swarmActive) {
      multiplier *= GAME_CONFIG.XP_MULTIPLIERS.SWARM_BONUS;
    }

    if (context.hivemindActive) {
      multiplier *= GAME_CONFIG.XP_MULTIPLIERS.HIVEMIND_BONUS;
    }

    if (context.streak > 1) {
      multiplier *= Math.min(GAME_CONFIG.XP_MULTIPLIERS.STREAK_BONUS, 1 + (context.streak * 0.1));
    }

    if (context.quality) {
      multiplier *= Math.min(2.0, context.quality);
    }

    if (context.godmode) {
      multiplier *= GAME_CONFIG.XP_MULTIPLIERS.GODMODE_MULTIPLIER;
    }

    const result = player.addXP(amount, multiplier);
    this.globalStats.totalXPAwarded += result.xpGained;

    this.emit('xp:awarded', { userId, ...result, context });

    if (result.leveledUp) {
      this.emit('level:up', { userId, ...result });
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // ACHIEVEMENT TRACKING
  // ═══════════════════════════════════════════════════════════

  trackEvent(userId, eventType, data = {}) {
    const player = this.getOrCreatePlayer(userId);

    // Update relevant stats
    switch (eventType) {
      case 'TASK_COMPLETE':
        player.updateStat('tasksCompleted', 1);
        if (data.quality >= 0.99) player.updateStat('perfectTasks', 1);
        if (data.duration < 1000) player.updateStat('fastTasks', 1);
        this.awardXP(userId, GAME_CONFIG.XP_MULTIPLIERS.BASE_TASK, data);
        break;

      case 'AGENT_USED':
        player.updateStat('uniqueAgentsUsed', data.agentId);
        player.updateStat('agentSessionsTotal', 1);
        break;

      case 'SWARM_ACTIVATED':
        player.updateStat('swarmsActivated', 1);
        if (data.concurrentSwarms > player.stats.maxConcurrentSwarms) {
          player.stats.maxConcurrentSwarms = data.concurrentSwarms;
        }
        break;

      case 'HIVEMIND_MERGE':
        player.updateStat('hivemindActivations', 1);
        break;

      case 'GODMODE_ACTIVATED':
        player.updateStat('godmodeActivations', 1);
        break;

      case 'GODMODE_PROJECT':
        player.updateStat('godmodeProjects', 1);
        break;

      case 'ARCHITECT_PROJECT':
        player.updateStat('architectProjects', 1);
        break;

      case 'PREDICTION_ACCURATE':
        player.updateStat('accuratePredictions', 1);
        break;

      case 'CONTENT_GENERATED':
        player.updateStat('contentGenerated', data.count || 1);
        break;

      case 'BUSINESS_AUTOMATED':
        player.updateStat('businessesAutomated', 1);
        break;

      default:
        // Unknown event types are logged but don't cause errors
        console.debug(`[REALITY GAMES] Unknown event type: ${eventType}`);
        break;
    }

    // Check for new achievements
    if (this.config.achievementsEnabled) {
      const newAchievements = player.checkAchievements();

      newAchievements.forEach(achievement => {
        this.globalStats.totalAchievementsUnlocked++;
        this.emit('achievement:unlocked', { userId, ...achievement });
      });

      return { tracked: true, newAchievements };
    }

    return { tracked: true, newAchievements: [] };
  }

  // ═══════════════════════════════════════════════════════════
  // QUEST MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  startQuest(userId, questId) {
    if (!this.config.questsEnabled) return null;

    const player = this.getOrCreatePlayer(userId);
    const quest = QUESTS[questId];

    if (!quest) return null;
    if (player.activeQuests.includes(questId)) return null;
    if (player.completedQuests.includes(questId)) return null;

    player.activeQuests.push(questId);

    this.emit('quest:started', { userId, quest });

    return {
      quest,
      started: true,
      progress: 0
    };
  }

  updateQuestProgress(userId, questId, stepId) {
    const player = this.getOrCreatePlayer(userId);

    if (!player.activeQuests.includes(questId)) return null;

    const quest = { ...QUESTS[questId] };
    const step = quest.steps.find(s => s.id === stepId);

    if (step) {
      step.completed = true;
    }

    const completedSteps = quest.steps.filter(s => s.completed).length;
    const progress = (completedSteps / quest.steps.length) * 100;

    // Check if quest is complete
    if (completedSteps === quest.steps.length) {
      return this.completeQuest(userId, questId);
    }

    this.emit('quest:progress', { userId, questId, progress, step: stepId });

    return { progress, completedSteps, totalSteps: quest.steps.length };
  }

  completeQuest(userId, questId) {
    const player = this.getOrCreatePlayer(userId);
    const quest = QUESTS[questId];

    if (!quest) return null;

    // Remove from active, add to completed
    player.activeQuests = player.activeQuests.filter(q => q !== questId);
    player.completedQuests.push(questId);

    // Award XP
    const xpResult = this.awardXP(userId, quest.xpReward, { quest: true });

    // Unlock achievement rewards
    const achievements = [];
    for (const achievementId of quest.rewards) {
      const result = player.unlockAchievement(achievementId);
      if (result) {
        achievements.push(result);
        this.globalStats.totalAchievementsUnlocked++;
      }
    }

    this.globalStats.totalQuestsCompleted++;

    this.emit('quest:completed', { userId, quest, xpResult, achievements });

    return { quest, xpResult, achievements, completed: true };
  }

  // ═══════════════════════════════════════════════════════════
  // GAME SESSIONS
  // ═══════════════════════════════════════════════════════════

  startGameSession(userId, gameId) {
    const player = this.getOrCreatePlayer(userId);

    const session = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      gameId,
      startedAt: Date.now(),
      xpEarned: 0,
      achievementsUnlocked: [],
      tasksCompleted: 0,
      status: 'ACTIVE'
    };

    this.gameSessions.set(session.id, session);
    player.currentSession = session.id;
    player.gameSessions.push(session.id);

    this.globalStats.totalGameSessions++;

    this.emit('game:started', { session });

    return session;
  }

  endGameSession(sessionId) {
    const session = this.gameSessions.get(sessionId);
    if (!session) return null;

    session.endedAt = Date.now();
    session.duration = session.endedAt - session.startedAt;
    session.status = 'ENDED';

    const player = this.players.get(session.userId);
    if (player) {
      player.currentSession = null;
      player.updateStat('totalPlaytime', session.duration);
    }

    this.emit('game:ended', { session });

    return session;
  }

  // ═══════════════════════════════════════════════════════════
  // LEADERBOARD
  // ═══════════════════════════════════════════════════════════

  updateLeaderboard() {
    if (!this.config.leaderboardEnabled) return [];

    this.leaderboard = Array.from(this.players.values())
      .map(player => ({
        userId: player.userId,
        level: player.level,
        title: player.title,
        xp: player.xp,
        achievements: player.achievements.length,
        tasksCompleted: player.stats.tasksCompleted
      }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 100);

    return this.leaderboard;
  }

  getLeaderboard(limit = 10) {
    // Auto-update if empty or stale
    if (this.leaderboard.length === 0 && this.players.size > 0) {
      this.updateLeaderboard();
    }
    return this.leaderboard.slice(0, limit);
  }

  getPlayerRank(userId) {
    const index = this.leaderboard.findIndex(p => p.userId === userId);
    return index === -1 ? null : index + 1;
  }

  // ═══════════════════════════════════════════════════════════
  // STATUS & STATS
  // ═══════════════════════════════════════════════════════════

  getGlobalStats() {
    return {
      ...this.globalStats,
      activeSessions: Array.from(this.gameSessions.values()).filter(s => s.status === 'ACTIVE').length,
      totalAchievements: Object.keys(ACHIEVEMENTS).length,
      totalQuests: Object.keys(QUESTS).length
    };
  }

  getGamesList() {
    return [
      { id: 'ARCHITECT', name: 'ARCHITECT', icon: '🏛️', description: 'Build worlds from thought' },
      { id: 'ORACLE', name: 'ORACLE', icon: '🔮', description: 'See what others cannot' },
      { id: 'PANTHEON', name: 'PANTHEON', icon: '⚡', description: 'Command the gods' },
      { id: 'FORGE', name: 'FORGE', icon: '🔥', description: 'Create from nothing' },
      { id: 'EMPIRE', name: 'EMPIRE', icon: '👑', description: 'Build your kingdom' },
      { id: 'ECHO', name: 'ECHO', icon: '🔊', description: 'Find your voice' },
      { id: 'INFINITE', name: 'INFINITE', icon: '∞', description: 'Anything. Everything.' }
    ];
  }

  getAchievementsList() {
    return Object.values(ACHIEVEMENTS);
  }

  getQuestsList() {
    return Object.values(QUESTS);
  }
}

// ═══════════════════════════════════════════════════════════════
// GAME MANIFESTO
// ═══════════════════════════════════════════════════════════════

const REALITY_GAMES_MANIFESTO = `
═══════════════════════════════════════════════════════════════
                  REALITY GAMES MANIFESTO
═══════════════════════════════════════════════════════════════

What they THINK they're buying:
A new indie game console. Retro-futuristic vibes.
Cool games. $99. Impulse buy. Fun.

What they're ACTUALLY getting:
- The entire 0RB creator ecosystem
- AI generation engines disguised as "games"
- The avatar agents as playable "characters"
- Infinite content creation tools
- Business automation wrapped in play
- The keys to the simulation

You never lied. It IS a game system.
Reality is the game.

PROGRESSION SYSTEM:
───────────────────
Level 1-5: Learning the basics
Level 6-10: Mastering the agents
Level 11-14: Commanding the swarms
Level 15: GODMODE

ACHIEVEMENTS UNLOCK POWER:
─────────────────────────
Every achievement isn't just a badge.
It's proof of capability.
It's unlocked potential.
It's POWER.

"Bro this 'game' just built my entire website"
"Wait the ARCHITECT game made me a full brand??"
"I was just playing and now I have a business???"

THE MEMES WRITE THEMSELVES.

═══════════════════════════════════════════════════════════════
             IT'S NOT A GAME. IT'S THE GAME.
═══════════════════════════════════════════════════════════════
`;

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  RealityGames,
  PlayerProfile,
  GAME_CONFIG,
  ACHIEVEMENTS,
  QUESTS,
  REALITY_GAMES_MANIFESTO
};
