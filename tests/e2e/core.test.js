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
