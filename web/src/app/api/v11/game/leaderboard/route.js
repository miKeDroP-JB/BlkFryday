/**
 * ====================================================
 *  V11.5 GAME API - Leaderboard
 * ====================================================
 *  Global leaderboard for the gamification system
 * ====================================================
 */

import { NextResponse } from 'next/server';

// In-memory leaderboard data
let leaderboardData = [
  // Seed with some demo data
  { userId: 'ORACLE_PRIME', level: 15, title: 'GODMODE', xp: 1250000, achievements: 20, tasksCompleted: 5000 },
  { userId: 'SWARM_MASTER', level: 12, title: 'Mythic', xp: 380000, achievements: 16, tasksCompleted: 2500 },
  { userId: 'QUANTUM_USER', level: 10, title: 'Ascended', xp: 125000, achievements: 12, tasksCompleted: 1500 },
  { userId: 'BUILDER_ONE', level: 8, title: 'Sage', xp: 55000, achievements: 9, tasksCompleted: 800 },
  { userId: 'PIONEER', level: 6, title: 'Master', xp: 20000, achievements: 7, tasksCompleted: 400 }
];

// Track when leaderboard was last updated
let lastUpdated = Date.now();

/**
 * GET - Get leaderboard
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const sortBy = searchParams.get('sortBy') || 'xp';

  // Sort leaderboard
  const sorted = [...leaderboardData].sort((a, b) => {
    switch (sortBy) {
      case 'level':
        return b.level - a.level;
      case 'achievements':
        return b.achievements - a.achievements;
      case 'tasks':
        return b.tasksCompleted - a.tasksCompleted;
      case 'xp':
      default:
        return b.xp - a.xp;
    }
  });

  // Paginate
  const paginated = sorted.slice(offset, offset + limit);

  // Add ranks
  const ranked = paginated.map((player, index) => ({
    rank: offset + index + 1,
    ...player
  }));

  return NextResponse.json({
    success: true,
    data: ranked,
    meta: {
      total: leaderboardData.length,
      limit,
      offset,
      sortBy,
      lastUpdated
    }
  });
}

/**
 * POST - Update leaderboard entry
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, level, title, xp, achievements, tasksCompleted } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId required'
      }, { status: 400 });
    }

    // Find existing entry
    const existingIndex = leaderboardData.findIndex(p => p.userId === userId);

    const entry = {
      userId,
      level: level || 1,
      title: title || 'Initiate',
      xp: xp || 0,
      achievements: achievements || 0,
      tasksCompleted: tasksCompleted || 0
    };

    if (existingIndex >= 0) {
      // Update existing
      leaderboardData[existingIndex] = entry;
    } else {
      // Add new
      leaderboardData.push(entry);
    }

    // Sort by XP
    leaderboardData.sort((a, b) => b.xp - a.xp);

    // Keep only top 100
    if (leaderboardData.length > 100) {
      leaderboardData = leaderboardData.slice(0, 100);
    }

    lastUpdated = Date.now();

    // Find new rank
    const newRank = leaderboardData.findIndex(p => p.userId === userId) + 1;

    return NextResponse.json({
      success: true,
      data: {
        updated: true,
        rank: newRank,
        entry
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
