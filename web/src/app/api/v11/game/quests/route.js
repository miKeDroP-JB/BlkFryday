/**
 * ====================================================
 *  V11.5 GAME API - Quests
 * ====================================================
 *  Quest management for guided workflows
 * ====================================================
 */

import { NextResponse } from 'next/server';

// Quest catalog (synced with RealityGames.js)
const QUESTS = {
  ONBOARDING: {
    id: 'ONBOARDING',
    name: 'Welcome to the Simulation',
    description: 'Learn the basics of the 0RB system',
    icon: '\uD83C\uDFAE',
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
    icon: '\uD83C\uDFDB\uFE0F',
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
    icon: '\uD83D\uDC1D',
    xpReward: 2000,
    steps: [
      { id: 'step1', task: 'Activate ALPHA swarm', completed: false },
      { id: 'step2', task: 'Activate BETA swarm', completed: false },
      { id: 'step3', task: 'Activate GAMMA swarm', completed: false },
      { id: 'step4', task: 'Run 5 swarms in parallel', completed: false },
      { id: 'step5', task: 'Activate all 10 swarms', completed: false }
    ],
    rewards: ['SWARM_INITIATE', 'SWARM_COMMANDER']
  },
  GODMODE_ASCENSION: {
    id: 'GODMODE_ASCENSION',
    name: 'GODMODE Ascension',
    description: 'Transcend the limits of ordinary AI',
    icon: '\uD83C\uDF1F',
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

// In-memory player quest state
const playerQuests = new Map();

/**
 * GET - Get quests
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const action = searchParams.get('action') || 'list';

  switch (action) {
    case 'catalog':
      // Return all available quests
      return NextResponse.json({
        success: true,
        data: Object.values(QUESTS)
      });

    case 'list':
      // Return player's quest state
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'userId required'
        }, { status: 400 });
      }

      const state = playerQuests.get(userId) || {
        active: [],
        completed: []
      };

      // Get active quest details with progress
      const activeQuests = state.active.map(questId => {
        const quest = QUESTS[questId];
        const progress = state.progress?.[questId] || {};
        const steps = quest.steps.map(s => ({
          ...s,
          completed: progress[s.id] || false
        }));
        const completedSteps = steps.filter(s => s.completed).length;

        return {
          ...quest,
          steps,
          completedSteps,
          totalSteps: steps.length,
          progress: (completedSteps / steps.length) * 100
        };
      }).filter(Boolean);

      return NextResponse.json({
        success: true,
        data: {
          active: activeQuests,
          completed: state.completed,
          available: Object.keys(QUESTS).filter(
            q => !state.active.includes(q) && !state.completed.includes(q)
          )
        }
      });

    default:
      return NextResponse.json({
        success: false,
        error: 'Unknown action'
      }, { status: 400 });
  }
}

/**
 * POST - Start quest, update progress, complete quest
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, action, questId, stepId } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId required'
      }, { status: 400 });
    }

    // Get player's quest state
    let state = playerQuests.get(userId) || {
      active: [],
      completed: [],
      progress: {}
    };

    switch (action) {
      case 'start':
        // Start a quest
        if (!questId || !QUESTS[questId]) {
          return NextResponse.json({
            success: false,
            error: 'Invalid questId'
          }, { status: 400 });
        }

        if (state.active.includes(questId) || state.completed.includes(questId)) {
          return NextResponse.json({
            success: false,
            error: 'Quest already started or completed'
          }, { status: 400 });
        }

        state.active.push(questId);
        state.progress[questId] = {};
        playerQuests.set(userId, state);

        return NextResponse.json({
          success: true,
          data: {
            started: true,
            quest: QUESTS[questId]
          }
        });

      case 'progress':
        // Update quest step progress
        if (!questId || !stepId) {
          return NextResponse.json({
            success: false,
            error: 'questId and stepId required'
          }, { status: 400 });
        }

        if (!state.active.includes(questId)) {
          return NextResponse.json({
            success: false,
            error: 'Quest not active'
          }, { status: 400 });
        }

        // Mark step complete
        state.progress[questId] = state.progress[questId] || {};
        state.progress[questId][stepId] = true;

        // Check if quest is complete
        const quest = QUESTS[questId];
        const allComplete = quest.steps.every(
          s => state.progress[questId][s.id]
        );

        if (allComplete) {
          // Move to completed
          state.active = state.active.filter(q => q !== questId);
          state.completed.push(questId);
        }

        playerQuests.set(userId, state);

        return NextResponse.json({
          success: true,
          data: {
            updated: true,
            questId,
            stepId,
            completed: allComplete,
            xpReward: allComplete ? quest.xpReward : 0,
            rewards: allComplete ? quest.rewards : []
          }
        });

      case 'abandon':
        // Abandon a quest
        if (!questId) {
          return NextResponse.json({
            success: false,
            error: 'questId required'
          }, { status: 400 });
        }

        state.active = state.active.filter(q => q !== questId);
        delete state.progress[questId];
        playerQuests.set(userId, state);

        return NextResponse.json({
          success: true,
          data: {
            abandoned: true,
            questId
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
