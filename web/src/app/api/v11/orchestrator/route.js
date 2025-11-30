// ============================================================
//  ORBOS V11.5 - ORCHESTRATOR API
//  Secure multi-provider AI execution gateway
// ============================================================
//
//  Security-first architecture:
//  Request → SecurityGateway → Provider → SecurityGateway → Response
//                                ↓
//                          KnowledgeStore
//
// ============================================================

import { NextResponse } from 'next/server';

// In-memory state (simulated - real implementation uses actual modules)
const orchestratorState = {
  sessions: new Map(),
  providers: {
    openai: { name: 'OpenAI', available: true, requests: 0 },
    anthropic: { name: 'Anthropic', available: true, requests: 0 },
    google: { name: 'Google AI', available: true, requests: 0 },
    mistral: { name: 'Mistral', available: true, requests: 0 },
    groq: { name: 'Groq', available: true, requests: 0 },
    together: { name: 'Together AI', available: true, requests: 0 },
    perplexity: { name: 'Perplexity', available: true, requests: 0 },
    cohere: { name: 'Cohere', available: true, requests: 0 },
    deepseek: { name: 'DeepSeek', available: true, requests: 0 },
    codestral: { name: 'Codestral', available: true, requests: 0 }
  },
  knowledge: [],
  securityLevel: 1, // STANDARD
  blockedRequests: 0,
  totalRequests: 0
};

// Security patterns to block
const BLOCKED_PATTERNS = [
  /password.*steal/i,
  /hack.*into/i,
  /malware.*create/i,
  /exploit.*vulnerability/i,
  /bypass.*security/i
];

// ============================================================
//  GET - Status and queries
// ============================================================

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';
  const sessionToken = request.headers.get('x-session-token');

  switch (action) {
    case 'status':
      return NextResponse.json({
        success: true,
        data: {
          providers: Object.entries(orchestratorState.providers).map(([id, p]) => ({
            id,
            ...p
          })),
          securityLevel: orchestratorState.securityLevel,
          knowledgeEntries: orchestratorState.knowledge.length,
          totalRequests: orchestratorState.totalRequests,
          blockedRequests: orchestratorState.blockedRequests,
          activeSessions: orchestratorState.sessions.size
        }
      });

    case 'providers':
      return NextResponse.json({
        success: true,
        data: orchestratorState.providers
      });

    case 'knowledge':
      const limit = parseInt(searchParams.get('limit') || '50');
      const tag = searchParams.get('tag');

      let knowledge = orchestratorState.knowledge;
      if (tag) {
        knowledge = knowledge.filter(k => k.tags.includes(tag));
      }

      return NextResponse.json({
        success: true,
        data: knowledge.slice(-limit)
      });

    case 'search':
      const query = searchParams.get('q') || '';
      const results = orchestratorState.knowledge.filter(k =>
        k.summary.toLowerCase().includes(query.toLowerCase()) ||
        k.tags.some(t => t.includes(query.toLowerCase()))
      );

      return NextResponse.json({
        success: true,
        data: results.slice(0, 20)
      });

    default:
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  }
}

// ============================================================
//  POST - Execute operations
// ============================================================

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, data } = body;
    const sessionToken = request.headers.get('x-session-token');

    orchestratorState.totalRequests++;

    switch (action) {

      // ============================================================
      //  AUTHENTICATE - Voice or credential auth
      // ============================================================
      case 'authenticate': {
        const { phrase, voiceprint, userId } = data;

        // Validate voice phrase
        const expectedPhrase = "the pleasure is all mine";
        const normalizedPhrase = (phrase || '').toLowerCase().trim();

        if (!isSimilar(normalizedPhrase, expectedPhrase)) {
          return NextResponse.json({
            success: false,
            error: 'Voice authentication failed'
          }, { status: 401 });
        }

        // Create session
        const token = generateToken();
        orchestratorState.sessions.set(token, {
          userId: userId || 'orbos-user',
          createdAt: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000),
          requests: 0
        });

        return NextResponse.json({
          success: true,
          data: {
            token,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000),
            message: 'Voice authentication successful'
          }
        });
      }

      // ============================================================
      //  EXECUTE - Run prompt through security gateway
      // ============================================================
      case 'execute': {
        const { prompt, providers, mode, options } = data;

        // Security check
        const securityResult = checkSecurity(prompt);
        if (securityResult.blocked) {
          orchestratorState.blockedRequests++;
          return NextResponse.json({
            success: false,
            error: 'Request blocked by security gateway',
            reason: securityResult.reason
          }, { status: 403 });
        }

        // Sanitize prompt
        const sanitizedPrompt = sanitizePrompt(securityResult.sanitized);

        // Select providers
        const targetProviders = providers || ['anthropic', 'openai', 'groq'];
        const availableProviders = targetProviders.filter(
          p => orchestratorState.providers[p]?.available
        );

        // Execute based on mode
        let result;
        switch (mode) {
          case 'parallel':
            result = await executeParallel(sanitizedPrompt, availableProviders, options);
            break;
          case 'tournament':
            result = await executeTournament(sanitizedPrompt, availableProviders, options);
            break;
          case 'chain':
            result = await executeChain(sanitizedPrompt, availableProviders, options);
            break;
          case 'swarm':
            result = await executeSwarm(sanitizedPrompt, availableProviders, options);
            break;
          default:
            result = await executeSingle(sanitizedPrompt, availableProviders[0], options);
        }

        // Store knowledge from response
        storeKnowledge(prompt, result);

        return NextResponse.json({
          success: true,
          data: {
            result,
            providers: availableProviders,
            mode: mode || 'single',
            securityLevel: orchestratorState.securityLevel
          }
        });
      }

      // ============================================================
      //  CODE-SEARCH - Search code from external sources
      // ============================================================
      case 'code-search': {
        const { query, language, sources } = data;

        const results = await searchCode(query, { language, sources });

        return NextResponse.json({
          success: true,
          data: results
        });
      }

      // ============================================================
      //  SYNTHESIZE - Combine knowledge for a task
      // ============================================================
      case 'synthesize': {
        const { task, context } = data;

        // Search relevant knowledge
        const relevant = orchestratorState.knowledge.filter(k =>
          task.toLowerCase().split(' ').some(word =>
            k.summary.toLowerCase().includes(word) ||
            k.tags.includes(word)
          )
        ).slice(0, 10);

        return NextResponse.json({
          success: true,
          data: {
            task,
            relevantKnowledge: relevant,
            synthesis: buildSynthesis(task, relevant, context)
          }
        });
      }

      // ============================================================
      //  SET-SECURITY-LEVEL - Adjust security posture
      // ============================================================
      case 'set-security-level': {
        const { level, reason } = data;

        if (level < 0 || level > 4) {
          return NextResponse.json({
            success: false,
            error: 'Invalid security level (0-4)'
          }, { status: 400 });
        }

        orchestratorState.securityLevel = level;

        return NextResponse.json({
          success: true,
          data: {
            newLevel: level,
            reason,
            timestamp: Date.now()
          }
        });
      }

      // ============================================================
      //  LEARN - Store new knowledge
      // ============================================================
      case 'learn': {
        const { content, type, tags, source } = data;

        const entry = {
          id: `know_${Date.now()}`,
          type: type || 'general',
          tags: tags || [],
          source: source || 'manual',
          summary: content.slice(0, 200),
          content,
          createdAt: Date.now(),
          accessCount: 0
        };

        orchestratorState.knowledge.push(entry);

        return NextResponse.json({
          success: true,
          data: { entry }
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// ============================================================
//  HELPER FUNCTIONS
// ============================================================

function generateToken() {
  return 'orbos_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function isSimilar(str1, str2) {
  const s1 = str1.toLowerCase().replace(/[^a-z]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z]/g, '');

  let matches = 0;
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) matches++;
  }

  return matches / Math.max(s1.length, s2.length) > 0.7;
}

function checkSecurity(prompt) {
  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      return { blocked: true, reason: 'Prohibited content detected' };
    }
  }

  // Redact sensitive data
  let sanitized = prompt;
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
  sanitized = sanitized.replace(/\b(sk-|pk-)[a-zA-Z0-9]{32,}\b/g, '[API_KEY]');

  return { blocked: false, sanitized };
}

function sanitizePrompt(prompt) {
  // Add ORBOS context
  return `[ORBOS: Respond helpfully while maintaining ethical standards.]\n\n${prompt}`;
}

// Simulated execution modes
async function executeSingle(prompt, provider, options) {
  orchestratorState.providers[provider].requests++;

  return {
    provider,
    response: `[${provider}] Simulated response for: ${prompt.slice(0, 100)}...`,
    latency: Math.random() * 1000 + 500,
    tokens: Math.floor(Math.random() * 1000) + 100
  };
}

async function executeParallel(prompt, providers, options) {
  const results = await Promise.all(
    providers.map(p => executeSingle(prompt, p, options))
  );

  return {
    mode: 'parallel',
    results,
    fastest: results.sort((a, b) => a.latency - b.latency)[0]
  };
}

async function executeTournament(prompt, providers, options) {
  const results = await executeParallel(prompt, providers, options);

  // Score and rank
  const scored = results.results.map(r => ({
    ...r,
    score: Math.random() * 100 // Simulated scoring
  }));

  return {
    mode: 'tournament',
    winner: scored.sort((a, b) => b.score - a.score)[0],
    rankings: scored
  };
}

async function executeChain(prompt, providers, options) {
  let currentPrompt = prompt;
  const chain = [];

  for (const provider of providers) {
    const result = await executeSingle(currentPrompt, provider, options);
    chain.push(result);
    currentPrompt = `Previous: ${result.response}\n\nContinue: ${prompt}`;
  }

  return {
    mode: 'chain',
    chain,
    finalResponse: chain[chain.length - 1].response
  };
}

async function executeSwarm(prompt, providers, options) {
  // Swarm mode - multiple agents working together
  const swarmSize = options?.swarmSize || 5;
  const tasks = Array(swarmSize).fill(prompt).map((p, i) => ({
    id: i,
    provider: providers[i % providers.length],
    task: `Agent ${i}: ${p}`
  }));

  const results = await Promise.all(
    tasks.map(t => executeSingle(t.task, t.provider, options))
  );

  return {
    mode: 'swarm',
    agentCount: swarmSize,
    results,
    aggregated: `Swarm completed with ${results.length} agents`
  };
}

async function searchCode(query, options = {}) {
  // Simulated code search across sources
  return {
    query,
    sources: ['github', 'stackoverflow', 'npm'],
    results: [
      {
        source: 'github',
        title: `${query} implementation`,
        url: `https://github.com/search?q=${encodeURIComponent(query)}`,
        score: 0.9
      },
      {
        source: 'stackoverflow',
        title: `How to ${query}`,
        url: `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`,
        score: 0.85
      }
    ]
  };
}

function storeKnowledge(prompt, result) {
  // Extract and store learnings
  const entry = {
    id: `learn_${Date.now()}`,
    type: 'interaction',
    tags: extractTags(prompt),
    source: result.provider || 'multi',
    summary: prompt.slice(0, 200),
    createdAt: Date.now(),
    accessCount: 0
  };

  orchestratorState.knowledge.push(entry);

  // Keep knowledge store bounded
  if (orchestratorState.knowledge.length > 10000) {
    orchestratorState.knowledge = orchestratorState.knowledge.slice(-5000);
  }
}

function extractTags(text) {
  const tags = [];
  const textLower = text.toLowerCase();

  const keywords = ['javascript', 'python', 'api', 'database', 'security', 'react', 'node'];
  keywords.forEach(kw => {
    if (textLower.includes(kw)) tags.push(kw);
  });

  return tags;
}

function buildSynthesis(task, knowledge, context) {
  return {
    task,
    knowledgeUsed: knowledge.length,
    prompt: `
Based on ${knowledge.length} relevant knowledge entries:

${knowledge.map(k => `- ${k.summary}`).join('\n')}

Task: ${task}
${context ? `Context: ${context}` : ''}

Synthesize the best approach:
`
  };
}
