/**
 * 0RB SYSTEM - Games API
 * /api/games - Game engine endpoints
 */

const GAMES = {
  ARCHITECT: {
    id: 'ARCHITECT',
    name: 'ARCHITECT',
    icon: '🏛️',
    tagline: 'Build worlds from thought',
    description: 'Full AI website/app/brand generator',
    color: '#00ffff',
    modes: ['WEBSITE', 'BRAND', 'APP', 'LANDING_PAGE', 'PORTFOLIO', 'ECOMMERCE'],
    status: 'ACTIVE'
  },
  ORACLE: {
    id: 'ORACLE',
    name: 'ORACLE',
    icon: '🔮',
    tagline: 'See what others cannot',
    description: 'The prediction/strategy engine',
    color: '#9b59b6',
    modes: ['MARKET_RESEARCH', 'TREND_PREDICTION', 'COMPETITOR_ANALYSIS', 'OPPORTUNITY_MAPPING'],
    status: 'ACTIVE'
  },
  PANTHEON: {
    id: 'PANTHEON',
    name: 'PANTHEON',
    icon: '⚡',
    tagline: 'Command the gods',
    description: 'Access to all 7 avatar agents',
    color: '#ffd700',
    modes: ['TEAM_ASSEMBLY', 'AGENT_MANAGEMENT', 'TASK_ROUTING', 'SWARM_CONTROL'],
    status: 'ACTIVE'
  },
  FORGE: {
    id: 'FORGE',
    name: 'FORGE',
    icon: '🔥',
    tagline: 'Create from nothing',
    description: 'App/code/automation builder',
    color: '#e74c3c',
    modes: ['APP', 'API', 'DATABASE', 'AUTOMATION', 'INTEGRATION', 'SMART_CONTRACT'],
    status: 'ACTIVE'
  },
  EMPIRE: {
    id: 'EMPIRE',
    name: 'EMPIRE',
    icon: '👑',
    tagline: 'Build your kingdom',
    description: 'Business automation simulation',
    color: '#e67e22',
    modes: ['BUSINESS_PLAN', 'FINANCIAL_MODEL', 'PITCH_DECK', 'FUNDRAISING', 'OPERATIONS'],
    status: 'ACTIVE'
  },
  ECHO: {
    id: 'ECHO',
    name: 'ECHO',
    icon: '🔊',
    tagline: 'Find your voice',
    description: 'Content engine + voice interface',
    color: '#3498db',
    modes: ['BLOG', 'SOCIAL', 'VIDEO_SCRIPT', 'PODCAST', 'EMAIL', 'AD_COPY'],
    status: 'ACTIVE'
  },
  INFINITE: {
    id: 'INFINITE',
    name: 'INFINITE',
    icon: '∞',
    tagline: 'Anything. Everything.',
    description: 'The generative creation engine',
    color: '#1abc9c',
    modes: ['IMAGE', 'MUSIC', 'VIDEO', 'WORLD', '3D_MODEL', 'STORY', 'GAME', 'SIMULATION'],
    status: 'ACTIVE'
  }
};

// Active game sessions
const sessions = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        // List all games
        return res.status(200).json({
          success: true,
          games: Object.values(GAMES),
          count: Object.keys(GAMES).length
        });

      case 'POST':
        // Start a game session
        const { gameId, mode, config = {} } = req.body;

        if (!gameId || !GAMES[gameId]) {
          return res.status(400).json({
            success: false,
            error: `Invalid game. Options: ${Object.keys(GAMES).join(', ')}`
          });
        }

        const game = GAMES[gameId];

        if (mode && !game.modes.includes(mode)) {
          return res.status(400).json({
            success: false,
            error: `Invalid mode for ${gameId}. Options: ${game.modes.join(', ')}`
          });
        }

        const session = {
          id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          gameId,
          game: game.name,
          mode: mode || game.modes[0],
          config,
          status: 'ACTIVE',
          startedAt: new Date().toISOString(),
          progress: 0,
          outputs: []
        };

        sessions.set(session.id, session);

        return res.status(201).json({
          success: true,
          session,
          message: `${game.name} initialized. ${game.tagline}.`
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Games API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
