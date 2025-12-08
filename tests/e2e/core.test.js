/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  E2E TESTS - Core System                                                     ║
 * ║  Test the entire system flow from initialization to shutdown                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// Mock environment for tests
process.env.NODE_ENV = 'test';

describe('0RB Core System', () => {
  let core;

  beforeAll(() => {
    core = require('../../core');
  });

  describe('Module Exports', () => {
    test('exports ORBCore class', () => {
      expect(core.ORBCore).toBeDefined();
      expect(typeof core.ORBCore).toBe('function');
    });

    test('exports createORB factory function', () => {
      expect(core.createORB).toBeDefined();
      expect(typeof core.createORB).toBe('function');
    });

    test('exports all AI components', () => {
      expect(core.AIEngine).toBeDefined();
      expect(core.ToolExecutor).toBeDefined();
      // Note: Individual providers are internal, AIEngine handles them
      expect(typeof core.AIEngine).toBe('function');
    });

    test('exports all Agent components', () => {
      expect(core.Agent).toBeDefined();
      expect(core.AGENT_ARCHETYPES).toBeDefined();
      expect(core.AGENT_PROMPTS).toBeDefined();
      expect(core.AtlasAgent).toBeDefined();
      expect(core.IrisAgent).toBeDefined();
    });

    test('exports all Crypto components', () => {
      expect(core.Web3Engine).toBeDefined();
      expect(core.ContractManager).toBeDefined();
      expect(core.WalletConnector).toBeDefined();
      expect(core.TransactionManager).toBeDefined();
      expect(core.NETWORK_CONFIG).toBeDefined();
    });

    test('exports Factory components', () => {
      expect(core.CompanyFactory).toBeDefined();
      expect(core.COMPANY_BLUEPRINTS).toBeDefined();
      // WORKFLOW_PHASES is internal to CompanyFactory
      expect(typeof core.CompanyFactory).toBe('function');
    });

    test('exports Security components', () => {
      expect(core.HydraSentinel).toBeDefined();
      expect(core.EXPLOIT_PATTERNS).toBeDefined();
    });

    test('exports Outreach components', () => {
      expect(core.OutreachEngine).toBeDefined();
      expect(core.Campaign).toBeDefined();
      expect(core.Prospect).toBeDefined();
      expect(core.CHANNELS).toBeDefined();
      expect(core.createEmailProvider).toBeDefined();
    });

    test('exports utilities', () => {
      expect(core.utils).toBeDefined();
      expect(core.utils.parseJSON).toBeDefined();
      expect(core.utils.generateId).toBeDefined();
    });
  });

  describe('Agent Archetypes', () => {
    test('has all 7 archetypes', () => {
      const archetypes = Object.keys(core.AGENT_ARCHETYPES);
      expect(archetypes).toHaveLength(7);
      expect(archetypes).toContain('APOLLO');
      expect(archetypes).toContain('ATHENA');
      expect(archetypes).toContain('HERMES');
      expect(archetypes).toContain('ARES');
      expect(archetypes).toContain('HEPHAESTUS');
      expect(archetypes).toContain('ARTEMIS');
      expect(archetypes).toContain('MERCURY');
    });

    test('each archetype has required fields', () => {
      for (const [name, archetype] of Object.entries(core.AGENT_ARCHETYPES)) {
        expect(archetype.name).toBe(name);
        expect(archetype.title).toBeDefined();
        expect(archetype.domain).toBeDefined();
        expect(archetype.systemPrompt).toBeDefined();
        expect(archetype.tools).toBeDefined();
        expect(Array.isArray(archetype.tools)).toBe(true);
        expect(archetype.model).toBeDefined();
        expect(typeof archetype.temperature).toBe('number');
      }
    });
  });

  describe('Utilities', () => {
    test('generateId creates unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(core.utils.generateId('test'));
      }
      expect(ids.size).toBe(100);
    });

    test('generateId includes prefix', () => {
      const id = core.utils.generateId('myprefix');
      expect(id.startsWith('myprefix-')).toBe(true);
    });

    test('parseJSON handles valid JSON', () => {
      const result = core.utils.parseJSON('{"key": "value"}', 'TEST');
      expect(result.key).toBe('value');
    });

    test('parseJSON extracts JSON from text', () => {
      const result = core.utils.parseJSON('Some text {"key": "value"} more text', 'TEST');
      expect(result.key).toBe('value');
    });

    test('parseJSON returns raw on failure', () => {
      const result = core.utils.parseJSON('not json', 'TEST');
      expect(result.raw).toBe('not json');
    });

    test('sleep delays execution', async () => {
      const start = Date.now();
      await core.utils.sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    test('truncate limits string length', () => {
      const long = 'a'.repeat(200);
      const truncated = core.utils.truncate(long, 50);
      expect(truncated.length).toBe(50);
      expect(truncated.endsWith('...')).toBe(true);
    });

    test('isValidEmail validates emails', () => {
      expect(core.utils.isValidEmail('test@example.com')).toBe(true);
      expect(core.utils.isValidEmail('invalid')).toBe(false);
      expect(core.utils.isValidEmail('test@')).toBe(false);
    });

    test('isValidEthAddress validates addresses', () => {
      expect(core.utils.isValidEthAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(true);
      expect(core.utils.isValidEthAddress('invalid')).toBe(false);
      expect(core.utils.isValidEthAddress('0x123')).toBe(false);
    });
  });

  describe('Outreach Engine', () => {
    let engine;

    beforeEach(() => {
      engine = new core.OutreachEngine();
    });

    test('creates prospects', () => {
      const prospect = engine.addProspect({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      });

      expect(prospect.id).toBeDefined();
      expect(prospect.firstName).toBe('John');
      expect(prospect.email).toBe('john@example.com');
    });

    test('imports multiple prospects', () => {
      const ids = engine.importProspects([
        { firstName: 'A', email: 'a@example.com' },
        { firstName: 'B', email: 'b@example.com' },
        { firstName: 'C', email: 'c@example.com' }
      ]);

      expect(ids).toHaveLength(3);
    });

    test('creates campaigns', () => {
      const campaign = engine.createCampaign({
        name: 'Test Campaign',
        type: 'cold_outreach'
      });

      expect(campaign.id).toBeDefined();
      expect(campaign.name).toBe('Test Campaign');
      expect(campaign.status).toBe('draft');
    });

    test('adds prospects to campaigns', () => {
      const campaign = engine.createCampaign({ name: 'Test' });
      const prospect = campaign.addProspect({
        firstName: 'Test',
        email: 'test@example.com'
      });

      expect(campaign.prospects.size).toBe(1);
      expect(prospect.id).toBeDefined();
    });

    test('tracks daily limits', () => {
      const stats = engine.getStats();
      expect(stats.limits).toBeDefined();
      expect(stats.dailyUsage).toBeDefined();
    });
  });

  describe('Email Providers', () => {
    test('creates console provider', () => {
      const provider = core.createEmailProvider('console');
      expect(provider.name).toBe('console');
    });

    test('console provider logs messages', async () => {
      const provider = core.createEmailProvider('console');
      const result = await provider.send(
        { email: 'test@example.com' },
        { subject: 'Test', body: 'Test body' }
      );

      expect(result.sent).toBe(true);
      expect(result.logged).toBe(true);
    });

    test('throws on unknown provider', () => {
      expect(() => core.createEmailProvider('unknown')).toThrow();
    });
  });

  describe('Network Configuration', () => {
    test('has Ethereum mainnet', () => {
      expect(core.NETWORK_CONFIG.ethereum).toBeDefined();
      expect(core.NETWORK_CONFIG.ethereum.chainId).toBe(1);
    });

    test('has Base network', () => {
      expect(core.NETWORK_CONFIG.base).toBeDefined();
      expect(core.NETWORK_CONFIG.base.chainId).toBe(8453);
    });

    test('has Polygon network', () => {
      expect(core.NETWORK_CONFIG.polygon).toBeDefined();
      expect(core.NETWORK_CONFIG.polygon.chainId).toBe(137);
    });
  });
});

describe('Logging', () => {
  const { Logger, LOG_LEVELS, createLogger, MemoryTransport } = require('../../core').utils;

  test('exports logging components', () => {
    expect(Logger).toBeDefined();
    expect(LOG_LEVELS).toBeDefined();
    expect(createLogger).toBeDefined();
    expect(MemoryTransport).toBeDefined();
  });

  test('Logger logs at correct levels', () => {
    const logger = createLogger({ console: false, memory: { maxEntries: 100 } });
    logger.setLevel('debug');
    logger.error('test error');
    logger.info('test info');
    logger.debug('test debug');

    const logs = logger.getRecentLogs();
    expect(logs.length).toBe(3);
  });

  test('Logger respects level filtering', () => {
    const logger = createLogger({ console: false, memory: { maxEntries: 100 } });
    logger.setLevel('warn');
    logger.error('error msg');
    logger.warn('warn msg');
    logger.info('info msg'); // Should not log
    logger.debug('debug msg'); // Should not log

    const logs = logger.getRecentLogs();
    expect(logs.length).toBe(2);
  });

  test('Logger child inherits context', () => {
    const logger = createLogger({ console: false, memory: { maxEntries: 100 } });
    const child = logger.child({ component: 'test' });
    child.info('test message');

    const logs = logger.getRecentLogs();
    expect(logs[0].meta.component).toBe('test');
  });
});

describe('Rate Limiting', () => {
  const { TokenBucket, RateLimiter, createRateLimiter, PROVIDER_LIMITS } = require('../../core').utils;

  test('exports rate limiting components', () => {
    expect(TokenBucket).toBeDefined();
    expect(RateLimiter).toBeDefined();
    expect(createRateLimiter).toBeDefined();
    expect(PROVIDER_LIMITS).toBeDefined();
  });

  test('TokenBucket consumes tokens', () => {
    const bucket = new TokenBucket({ capacity: 10, refillRate: 1 });
    expect(bucket.tryConsume(5)).toBe(true);
    expect(bucket.getTokens()).toBe(5);
    expect(bucket.tryConsume(10)).toBe(false); // Not enough tokens
  });

  test('TokenBucket refills over time', async () => {
    const bucket = new TokenBucket({ capacity: 10, refillRate: 100 }); // 100 tokens/sec
    bucket.tryConsume(10); // Drain all tokens
    const before = bucket.getTokens();
    await new Promise(r => setTimeout(r, 100)); // Wait 100ms
    const after = bucket.getTokens();
    expect(after).toBeGreaterThan(before);
  });

  test('RateLimiter tracks per-provider stats', async () => {
    const limiter = new RateLimiter({ defaultRPM: 100 });
    await limiter.acquire('test-provider', 10);
    const status = limiter.getStatus('test-provider');
    expect(status.stats.requests).toBe(1);
  });

  test('createRateLimiter pre-configures providers', () => {
    const limiter = createRateLimiter();
    expect(limiter.buckets.has('openai')).toBe(true);
    expect(limiter.buckets.has('anthropic')).toBe(true);
  });
});

describe('Embedding System', () => {
  const { createEmbeddingProvider, LocalEmbeddingProvider, EmbeddingRegistry } = require('../../core');

  test('exports embedding components', () => {
    expect(createEmbeddingProvider).toBeDefined();
    expect(LocalEmbeddingProvider).toBeDefined();
    expect(EmbeddingRegistry).toBeDefined();
  });

  test('creates local embedding provider', () => {
    const embedder = createEmbeddingProvider('local');
    expect(embedder.name).toBe('local');
    expect(embedder.dimensions).toBe(384);
  });

  test('local embedder generates embeddings', async () => {
    const embedder = new LocalEmbeddingProvider({ dimensions: 128 });
    const embedding = await embedder.embed('hello world test');
    expect(embedding).toBeDefined();
    expect(embedding.length).toBe(128);
    expect(typeof embedding[0]).toBe('number');
  });

  test('embeddings are cached', async () => {
    const embedder = new LocalEmbeddingProvider();
    await embedder.embed('cached text');
    await embedder.embed('cached text'); // Should hit cache
    const stats = embedder.getStats();
    expect(stats.cacheHits).toBe(1);
  });
});

describe('Memory System', () => {
  const { MemoryCore, MemoryEntry, VectorIndex, MEMORY_TYPES, PROTECTION_LEVELS } = require('../../core');

  test('exports Memory components', () => {
    expect(MemoryCore).toBeDefined();
    expect(MemoryEntry).toBeDefined();
    expect(VectorIndex).toBeDefined();
    expect(MEMORY_TYPES).toBeDefined();
    expect(PROTECTION_LEVELS).toBeDefined();
  });

  test('has all memory types', () => {
    expect(MEMORY_TYPES.KNOWLEDGE).toBe('knowledge');
    expect(MEMORY_TYPES.EXPERIENCE).toBe('experience');
    expect(MEMORY_TYPES.SKILL).toBe('skill');
    expect(MEMORY_TYPES.CONTEXT).toBe('context');
    expect(MEMORY_TYPES.SYSTEM).toBe('system');
  });

  test('has protection levels', () => {
    expect(PROTECTION_LEVELS.PUBLIC).toBe(0);
    expect(PROTECTION_LEVELS.PRIVATE).toBe(1);
    expect(PROTECTION_LEVELS.SOVEREIGN).toBe(2);
  });

  test('VectorIndex stores and searches', () => {
    const index = new VectorIndex(3);

    // Add some vectors
    index.add('a', [1, 0, 0]);
    index.add('b', [0, 1, 0]);
    index.add('c', [0.9, 0.1, 0]);

    expect(index.size()).toBe(3);

    // Search for similar to [1, 0, 0]
    const results = index.search([1, 0, 0], 2, 0.5);
    expect(results.length).toBe(2);
    expect(results[0].id).toBe('a'); // Exact match
    expect(results[0].similarity).toBeCloseTo(1);
  });

  test('MemoryEntry creates with metadata', () => {
    const entry = new MemoryEntry({
      key: 'test-key',
      value: 'test-value',
      type: MEMORY_TYPES.KNOWLEDGE,
      tags: ['test']
    });

    expect(entry.id).toBeDefined();
    expect(entry.key).toBe('test-key');
    expect(entry.value).toBe('test-value');
    expect(entry.type).toBe('knowledge');
    expect(entry.tags).toContain('test');
    expect(entry.metadata.created).toBeDefined();
    expect(entry.metadata.accessCount).toBe(0);
  });

  test('MemoryEntry touch updates access count', () => {
    const entry = new MemoryEntry({ key: 'test', value: 'data' });
    expect(entry.metadata.accessCount).toBe(0);

    entry.touch();
    expect(entry.metadata.accessCount).toBe(1);
    expect(entry.metadata.lastAccessed).toBeDefined();
  });
});

describe('Sequence Templates', () => {
  const { SEQUENCE_TEMPLATES, MESSAGE_TEMPLATES } = require('../../core');

  test('has cold_b2b sequence', () => {
    expect(SEQUENCE_TEMPLATES.cold_b2b).toBeDefined();
    expect(SEQUENCE_TEMPLATES.cold_b2b.steps.length).toBeGreaterThan(0);
  });

  test('has warm_inbound sequence', () => {
    expect(SEQUENCE_TEMPLATES.warm_inbound).toBeDefined();
  });

  test('has nurture sequence', () => {
    expect(SEQUENCE_TEMPLATES.nurture).toBeDefined();
  });

  test('has email templates', () => {
    expect(MESSAGE_TEMPLATES.email).toBeDefined();
    expect(MESSAGE_TEMPLATES.email.intro).toBeDefined();
    expect(MESSAGE_TEMPLATES.email.breakup).toBeDefined();
  });

  test('has linkedin templates', () => {
    expect(MESSAGE_TEMPLATES.linkedin).toBeDefined();
    expect(MESSAGE_TEMPLATES.linkedin.connect).toBeDefined();
  });
});
