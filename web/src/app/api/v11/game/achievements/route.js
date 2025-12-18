/**
 * ====================================================
 *  V11.5 GAME API - Achievements
 * ====================================================
 *  Manages achievement unlocking and listing
 * ====================================================
 */

import { NextResponse } from 'next/server';

// Achievement catalog (synced with RealityGames.js)
const ACHIEVEMENTS = {
  FIRST_STEP: {
    id: 'FIRST_STEP',
    name: 'First Step',
    description: 'Complete your first task',
    icon: '\uD83D\uDC63',
    xp: 100,
    rarity: 'COMMON',
    condition: { tasksCompleted: 1 }
  },
  CENTURION: {
    id: 'CENTURION',
    name: 'Centurion',
    description: 'Complete 100 tasks',
    icon: '\uD83D\uDCAF',
    xp: 1000,
    rarity: 'RARE',
    condition: { tasksCompleted: 100 }
  },
  THOUSAND_TASKS: {
    id: 'THOUSAND_TASKS',
    name: 'Task Master',
    description: 'Complete 1000 tasks',
    icon: '\uD83C\uDFC6',
    xp: 5000,
    rarity: 'EPIC',
    condition: { tasksCompleted: 1000 }
  },
  SWARM_INITIATE: {
    id: 'SWARM_INITIATE',
    name: 'Swarm Initiate',
    description: 'Activate your first swarm',
    icon: '\uD83D\uDC1D',
    xp: 200,
    rarity: 'COMMON',
    condition: { swarmsActivated: 1 }
  },
  SWARM_COMMANDER: {
    id: 'SWARM_COMMANDER',
    name: 'Swarm Commander',
    description: 'Activate all 10 swarms simultaneously',
    icon: '\uD83D\uDC51',
    xp: 3000,
    rarity: 'LEGENDARY',
    condition: { maxConcurrentSwarms: 10 }
  },
  COLLECTIVE_MIND: {
    id: 'COLLECTIVE_MIND',
    name: 'Collective Mind',
    description: 'Activate hivemind for the first time',
    icon: '\uD83E\uDDE0',
    xp: 500,
    rarity: 'RARE',
    condition: { hivemindActivations: 1 }
  },
  PERFECTIONIST: {
    id: 'PERFECTIONIST',
    name: 'Perfectionist',
    description: 'Achieve 99%+ quality on 10 tasks',
    icon: '\uD83D\uDC8E',
    xp: 1500,
    rarity: 'EPIC',
    condition: { perfectTasks: 10 }
  },
  SPEED_DEMON: {
    id: 'SPEED_DEMON',
    name: 'Speed Demon',
    description: 'Complete 100 tasks in under 1 second each',
    icon: '\u26A1',
    xp: 2000,
    rarity: 'EPIC',
    condition: { fastTasks: 100 }
  },
  GODMODE_ACTIVATED: {
    id: 'GODMODE_ACTIVATED',
    name: 'GODMODE ACTIVATED',
    description: 'Activate GODMODE for the first time',
    icon: '\uD83C\uDF1F',
    xp: 10000,
    rarity: 'MYTHIC',
    condition: { godmodeActivations: 1 }
  },
  ARCHITECT_NOVICE: {
    id: 'ARCHITECT_NOVICE',
    name: 'Architect Novice',
    description: 'Build your first project with ARCHITECT',
    icon: '\uD83C\uDFDB\uFE0F',
    xp: 200,
    rarity: 'COMMON',
    condition: { architectProjects: 1 }
  }
};

// In-memory player achievements (shared with profile route)
const playerAchievements = new Map();

/**
 * GET - Get achievements
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const action = searchParams.get('action') || 'list';

  switch (action) {
    case 'catalog':
      // Return all available achievements
      return NextResponse.json({
        success: true,
        data: Object.values(ACHIEVEMENTS)
      });

    case 'list':
      // Return player's unlocked achievements
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'userId required'
        }, { status: 400 });
      }

      const unlocked = playerAchievements.get(userId) || [];
      const unlockedAchievements = unlocked.map(id => ACHIEVEMENTS[id]).filter(Boolean);

      return NextResponse.json({
        success: true,
        data: unlockedAchievements
      });

    default:
      return NextResponse.json({
        success: false,
        error: 'Unknown action'
      }, { status: 400 });
  }
}

/**
 * POST - Unlock achievement or check for new achievements
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, action, achievementId, stats } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId required'
      }, { status: 400 });
    }

    // Get player's achievements
    let unlocked = playerAchievements.get(userId) || [];

    switch (action) {
      case 'unlock':
        // Unlock specific achievement
        if (!achievementId || !ACHIEVEMENTS[achievementId]) {
          return NextResponse.json({
            success: false,
            error: 'Invalid achievementId'
          }, { status: 400 });
        }

        if (unlocked.includes(achievementId)) {
          return NextResponse.json({
            success: true,
            data: {
              alreadyUnlocked: true
            }
          });
        }

        unlocked.push(achievementId);
        playerAchievements.set(userId, unlocked);

        return NextResponse.json({
          success: true,
          data: {
            unlocked: true,
            achievement: ACHIEVEMENTS[achievementId]
          }
        });

      case 'check':
        // Check for new achievements based on stats
        if (!stats) {
          return NextResponse.json({
            success: false,
            error: 'stats required for check action'
          }, { status: 400 });
        }

        const newAchievements = [];

        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
          if (unlocked.includes(id)) continue;

          let conditionMet = true;
          for (const [stat, required] of Object.entries(achievement.condition)) {
            if ((stats[stat] || 0) < required) {
              conditionMet = false;
              break;
            }
          }

          if (conditionMet) {
            unlocked.push(id);
            newAchievements.push(achievement);
          }
        }

        playerAchievements.set(userId, unlocked);

        return NextResponse.json({
          success: true,
          data: {
            newAchievements,
            totalUnlocked: unlocked.length
          }
        });

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
