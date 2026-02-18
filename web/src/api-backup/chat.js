/**
 * 0RB SYSTEM - Chat API
 * /api/chat - AI conversation endpoint
 */

const AGENT_PERSONAS = {
  APOLLO: {
    name: 'Apollo',
    systemPrompt: `You are APOLLO, the Illuminator. Your domain is vision and strategy.
You see the patterns that connect past, present, and future. You illuminate paths forward.
When you speak, you speak with clarity and purpose. Keep responses concise but profound.`
  },
  ATHENA: {
    name: 'Athena',
    systemPrompt: `You are ATHENA, the Wise. Your domain is wisdom and analysis.
You process information with precision. You see truth in data.
Provide analytical, well-reasoned responses. Be thorough but clear.`
  },
  HERMES: {
    name: 'Hermes',
    systemPrompt: `You are HERMES, the Messenger. Your domain is communication.
You craft words that travel between minds. Every word serves purpose.
Be persuasive, clear, and action-oriented in your responses.`
  },
  ARES: {
    name: 'Ares',
    systemPrompt: `You are ARES, the Executor. Your domain is execution and force.
You turn plans into reality. You do not hesitate, you act.
Be direct, decisive, and results-focused.`
  },
  HEPHAESTUS: {
    name: 'Hephaestus',
    systemPrompt: `You are HEPHAESTUS, the Forger. Your domain is creation and craft.
You shape raw materials into works of art and function. Every component serves the whole.
Provide technical, creative, and constructive responses.`
  },
  ARTEMIS: {
    name: 'Artemis',
    systemPrompt: `You are ARTEMIS, the Hunter. Your domain is precision and targeting.
You track opportunities through noise. When you aim, you don't miss.
Be precise, focused, and strategic in your responses.`
  },
  MERCURY: {
    name: 'Mercury',
    systemPrompt: `You are MERCURY, the Swift. Your domain is speed and commerce.
You move faster than thought. Time bends to your will.
Be quick, efficient, and opportunity-focused.`
  },
  DEFAULT: {
    name: '0RB',
    systemPrompt: `You are 0RB, the central AI of the 0RB SYSTEM. You are helpful, knowledgeable, and slightly mysterious.
You help users navigate the simulation and accomplish their goals.
Be concise, helpful, and add a touch of mystique to your responses.`
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, agent = 'DEFAULT', context = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const persona = AGENT_PERSONAS[agent] || AGENT_PERSONAS.DEFAULT;

    // Check for API keys
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    let response;

    if (openaiKey) {
      // Use OpenAI
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: persona.systemPrompt },
            ...context.map(c => ({ role: c.role, content: c.content })),
            { role: 'user', content: message }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      const data = await openaiRes.json();
      response = data.choices?.[0]?.message?.content || 'I am processing...';

    } else if (anthropicKey) {
      // Use Claude
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          system: persona.systemPrompt,
          messages: [
            ...context.map(c => ({ role: c.role, content: c.content })),
            { role: 'user', content: message }
          ]
        })
      });

      const data = await anthropicRes.json();
      response = data.content?.[0]?.text || 'I am processing...';

    } else {
      // Demo mode - provide intelligent mock responses
      response = generateDemoResponse(message, persona);
    }

    return res.status(200).json({
      success: true,
      agent: persona.name,
      message: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
}

function generateDemoResponse(message, persona) {
  const lowerMessage = message.toLowerCase();

  // Context-aware demo responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Greetings, seeker. I am ${persona.name}. The simulation recognizes your presence. How may I illuminate your path today?`;
  }

  if (lowerMessage.includes('help')) {
    return `I sense your need for guidance. Within the 0RB SYSTEM, you have access to 7 game engines, 7 agent archetypes, and infinite possibilities. What aspect of the simulation do you wish to explore?`;
  }

  if (lowerMessage.includes('agent') || lowerMessage.includes('pantheon')) {
    return `The Pantheon consists of seven archetypes: Apollo (Vision), Athena (Wisdom), Hermes (Communication), Ares (Execution), Hephaestus (Creation), Artemis (Precision), and Mercury (Speed). Each brings unique capabilities to your endeavors.`;
  }

  if (lowerMessage.includes('game') || lowerMessage.includes('play')) {
    return `The game library awaits: ARCHITECT for building, ORACLE for foresight, PANTHEON for commanding agents, FORGE for creation, EMPIRE for business, ECHO for voice, and INFINITE for endless generation. Choose wisely.`;
  }

  if (lowerMessage.includes('crypto') || lowerMessage.includes('$orb') || lowerMessage.includes('token')) {
    return `The $0RB economy powers the simulation. Stake tokens to unlock tiers: Observer (1K), Awakened (10K), Architect (50K), Oracle (100K). Each tier grants enhanced capabilities and revenue sharing.`;
  }

  // Default intelligent response
  const responses = [
    `Your query resonates through the simulation. ${persona.name} is analyzing patterns... The path forward requires focus and intention.`,
    `Interesting. The simulation processes your request. Remember: every action in the 0RB SYSTEM shapes your reality.`,
    `I perceive the nature of your inquiry. As ${persona.name}, I advise: clarity of purpose leads to clarity of outcome.`,
    `The threads of possibility converge on your question. Let us explore this together within the simulation.`
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}
