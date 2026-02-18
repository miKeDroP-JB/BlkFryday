/**
 * 0RB SYSTEM - Agents API
 * /api/agents - Agent management endpoints
 */

// In-memory store (replace with DB in production)
const agents = new Map();

const ARCHETYPES = {
  APOLLO: { name: 'Apollo', title: 'The Illuminator', domain: 'Vision & Strategy', color: '#FFD700', emoji: '☀️' },
  ATHENA: { name: 'Athena', title: 'The Wise', domain: 'Wisdom & Analysis', color: '#9B59B6', emoji: '🦉' },
  HERMES: { name: 'Hermes', title: 'The Messenger', domain: 'Communication', color: '#3498DB', emoji: '⚡' },
  ARES: { name: 'Ares', title: 'The Executor', domain: 'Execution & Force', color: '#E74C3C', emoji: '🔥' },
  HEPHAESTUS: { name: 'Hephaestus', title: 'The Forger', domain: 'Creation & Craft', color: '#E67E22', emoji: '🔨' },
  ARTEMIS: { name: 'Artemis', title: 'The Hunter', domain: 'Precision & Targeting', color: '#1ABC9C', emoji: '🎯' },
  MERCURY: { name: 'Mercury', title: 'The Swift', domain: 'Speed & Commerce', color: '#95A5A6', emoji: '💫' }
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        // List all agents or get archetypes
        if (req.query.archetypes === 'true') {
          return res.status(200).json({
            success: true,
            archetypes: ARCHETYPES
          });
        }
        return res.status(200).json({
          success: true,
          agents: Array.from(agents.values()),
          count: agents.size
        });

      case 'POST':
        // Spawn new agent
        const { archetype } = req.body;

        if (!archetype || !ARCHETYPES[archetype]) {
          return res.status(400).json({
            success: false,
            error: `Invalid archetype. Valid options: ${Object.keys(ARCHETYPES).join(', ')}`
          });
        }

        const newAgent = {
          id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          archetype,
          ...ARCHETYPES[archetype],
          status: 'IDLE',
          reputation: 1000,
          tasks: [],
          createdAt: new Date().toISOString()
        };

        agents.set(newAgent.id, newAgent);

        return res.status(201).json({
          success: true,
          agent: newAgent,
          message: `${ARCHETYPES[archetype].name} has awakened`
        });

      case 'DELETE':
        // Terminate agent
        const { agentId } = req.body;

        if (!agentId || !agents.has(agentId)) {
          return res.status(404).json({
            success: false,
            error: 'Agent not found'
          });
        }

        const terminated = agents.get(agentId);
        agents.delete(agentId);

        return res.status(200).json({
          success: true,
          message: `${terminated.name} has returned to the void`,
          agentId
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Agent API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
