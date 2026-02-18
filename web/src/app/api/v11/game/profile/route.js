/**
 * ====================================================
 *  V11.5 GAME API - Player Profile
 * ====================================================
 *  Manages player profiles for the gamification system
 * ====================================================
 */

import { NextResponse } from 'next/server';

// Level configuration (synced with RealityGames.js)
const LEVEL_THRESHOLDS = [
  0, 1000, 3000, 6000, 10000, 15000, 25000, 40000,
  60000, 100000, 150000, 250000, 400000, 600000, 1000000
];

const LEVEL_TITLES = {
  1: 'Initiate', 2: 'Apprentice', 3: 'Journeyman', 4: 'Adept',
  5: 'Expert', 6: 'Master', 7: 'Grandmaster', 8: 'Sage',
  9: 'Oracle', 10: 'Ascended', 11: 'Transcendent', 12: 'Mythic',
  13: 'Legendary', 14: 'Eternal', 15: 'GODMODE'
};

// In-memory player storage (would be database in production)
const players = new Map();

/**
 * GET - Get player profile
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'default';

  // Get or create player
  let player = players.get(userId);
  if (!player) {
    player = createPlayer(userId);
    players.set(userId, player);
  }

  return NextResponse.json({
    success: true,
    data: {
      userId: player.userId,
      level: player.level,
      title: player.title,
      xp: player.xp,
      xpToNextLevel: getXPToNextLevel(player),
      achievements: player.achievements.length,
      totalAchievements: 20, // Total possible achievements
      stats: {
        tasksCompleted: player.stats.tasksCompleted,
        perfectTasks: player.stats.perfectTasks,
        fastTasks: player.stats.fastTasks,
        swarmsActivated: player.stats.swarmsActivated,
        hivemindActivations: player.stats.hivemindActivations,
        godmodeActivations: player.stats.godmodeActivations,
        totalPlaytime: player.stats.totalPlaytime,
        streak: player.stats.streak
      },
      activeQuests: player.activeQuests.length,
      completedQuests: player.completedQuests.length,
      memberSince: player.createdAt
    }
  });
}

/**
 * POST - Update player profile (add XP, track event)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId = 'default', action, data = {} } = body;

    // Get or create player
    let player = players.get(userId);
    if (!player) {
      player = createPlayer(userId);
      players.set(userId, player);
    }

    switch (action) {
      case 'addXP':
        return handleAddXP(player, data);

      case 'trackEvent':
        return handleTrackEvent(player, data);

      case 'updateStat':
        return handleUpdateStat(player, data);

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Create new player
 */
function createPlayer(userId) {
  return {
    userId,
    createdAt: Date.now(),
    lastActive: Date.now(),
    xp: 0,
    level: 1,
    title: LEVEL_TITLES[1],
    stats: {
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
      contentGenerated: 0,
      totalPlaytime: 0,
      streak: 0,
      longestStreak: 0
    },
    achievements: [],
    activeQuests: [],
    completedQuests: []
  };
}

/**
 * Calculate level from XP
 */
function calculateLevel(xp) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP to next level
 */
function getXPToNextLevel(player) {
  const nextLevelIndex = player.level;
  if (nextLevelIndex >= LEVEL_THRESHOLDS.length) {
    return 0; // Max level
  }
  return LEVEL_THRESHOLDS[nextLevelIndex] - player.xp;
}

/**
 * Handle add XP
 */
function handleAddXP(player, data) {
  const { amount, multiplier = 1.0 } = data;
  const totalXP = Math.floor(amount * multiplier);

  const oldLevel = player.level;
  player.xp += totalXP;
  player.level = calculateLevel(player.xp);
  player.title = LEVEL_TITLES[player.level] || 'GODMODE';
  player.lastActive = Date.now();

  const leveledUp = player.level > oldLevel;

  return NextResponse.json({
    success: true,
    data: {
      xpGained: totalXP,
      totalXP: player.xp,
      level: player.level,
      title: player.title,
      leveledUp,
      xpToNextLevel: getXPToNextLevel(player)
    }
  });
}

/**
 * Handle track event
 */
function handleTrackEvent(player, data) {
  const { eventType, eventData = {} } = data;

  switch (eventType) {
    case 'TASK_COMPLETE':
      player.stats.tasksCompleted++;
      if (eventData.quality >= 0.99) player.stats.perfectTasks++;
      if (eventData.duration < 1000) player.stats.fastTasks++;
      break;

    case 'SWARM_ACTIVATED':
      player.stats.swarmsActivated++;
      break;

    case 'HIVEMIND_MERGE':
      player.stats.hivemindActivations++;
      break;

    case 'GODMODE_ACTIVATED':
      player.stats.godmodeActivations++;
      break;
  }

  player.lastActive = Date.now();

  return NextResponse.json({
    success: true,
    data: {
      tracked: true,
      eventType,
      stats: {
        tasksCompleted: player.stats.tasksCompleted,
        swarmsActivated: player.stats.swarmsActivated,
        hivemindActivations: player.stats.hivemindActivations,
        godmodeActivations: player.stats.godmodeActivations
      }
    }
  });
}

/**
 * Handle update stat
 */
function handleUpdateStat(player, data) {
  const { statName, value } = data;

  if (player.stats[statName] !== undefined) {
    if (typeof value === 'number') {
      player.stats[statName] += value;
    } else {
      player.stats[statName] = value;
    }
  }

  player.lastActive = Date.now();

  return NextResponse.json({
    success: true,
    data: {
      updated: true,
      statName,
      newValue: player.stats[statName]
    }
  });
}
