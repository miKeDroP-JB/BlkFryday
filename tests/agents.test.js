/**
 * Agent Army Test Suite
 */

const ORBBrain = require('../agents/0rb_brain');
const Sentinel = require('../agents/sentinel');
const Apollo = require('../agents/apollo');
const Mercury = require('../agents/mercury');
const Athena = require('../agents/athena');
const Ares = require('../agents/ares');
const Hermes = require('../agents/hermes');
const Hephaestus = require('../agents/hephaestus');
const Artemis = require('../agents/artemis');
const RevenueTracker = require('../agents/dashboard/revenue_tracker');
const AgentMetrics = require('../agents/dashboard/agent_metrics');

describe('ORBBrain', () => {
  let brain;

  beforeEach(() => {
    brain = new ORBBrain();
  });

  test('should initialize with empty queues', () => {
    expect(brain.taskQueue).toEqual([]);
    expect(brain.completed).toEqual([]);
    expect(brain.failed).toEqual([]);
  });

  test('should add tasks to queue', () => {
    const taskId = brain.addTask({ agent: 'sentinel', type: 'scan', data: {} });
    expect(taskId).toBeDefined();
    expect(brain.taskQueue.length).toBe(1);
  });

  test('should return status', () => {
    brain.addTask({ agent: 'apollo', type: 'freelance', data: {} });
    const status = brain.getStatus();
    expect(status.queued).toBe(1);
    expect(status.completed).toBe(0);
    expect(status.agents).toContain('sentinel');
    expect(status.agents).toContain('apollo');
  });

  test('should reject unknown agents', () => {
    brain.addTask({ agent: 'unknown_agent', type: 'test', data: {} });
    brain.dispatch();
    expect(brain.failed.length).toBe(1);
    expect(brain.failed[0].error).toBe('Unknown agent');
  });
});

describe('Sentinel', () => {
  let sentinel;

  beforeEach(() => {
    sentinel = new Sentinel();
  });

  test('should initialize correctly', () => {
    expect(sentinel.name).toBe('Sentinel');
    expect(sentinel.version).toBeDefined();
  });

  test('should require authorization for scans', async () => {
    const result = await sentinel.execute({
      type: 'scan',
      target: 'example.com',
      authorization: null
    });
    expect(result.error).toBeDefined();
  });

  test('should have stats', () => {
    const stats = sentinel.getStats();
    expect(stats).toHaveProperty('scansCompleted');
    expect(stats).toHaveProperty('findingsReported');
  });
});

describe('Apollo', () => {
  let apollo;

  beforeEach(() => {
    apollo = new Apollo();
  });

  test('should initialize correctly', () => {
    expect(apollo.name).toBe('Apollo');
  });

  test('should have profile', () => {
    expect(apollo.profile).toBeDefined();
    expect(apollo.profile.skills).toBeDefined();
  });

  test('should search gigs', async () => {
    const result = await apollo.execute({
      type: 'freelance_search',
      keywords: ['javascript', 'api'],
      budget: { min: 500 }
    });
    expect(result).toBeDefined();
  });
});

describe('Mercury', () => {
  let mercury;

  beforeEach(() => {
    mercury = new Mercury();
  });

  test('should initialize correctly', () => {
    expect(mercury.name).toBe('Mercury');
  });

  test('should have outreach channels', () => {
    expect(mercury.channels).toBeDefined();
  });

  test('should find prospects', async () => {
    const result = await mercury.execute({
      type: 'prospect',
      criteria: { industry: 'tech' }
    });
    expect(result).toBeDefined();
  });
});

describe('Athena', () => {
  let athena;

  beforeEach(() => {
    athena = new Athena();
  });

  test('should initialize correctly', () => {
    expect(athena.name).toBe('Athena');
  });

  test('should have content types', () => {
    expect(athena.contentTypes).toBeDefined();
  });

  test('should generate content', async () => {
    const result = await athena.execute({
      type: 'content',
      contentType: 'blog_post',
      topic: 'Test Topic'
    });
    expect(result).toBeDefined();
  });
});

describe('Ares', () => {
  let ares;

  beforeEach(() => {
    ares = new Ares();
  });

  test('should initialize correctly', () => {
    expect(ares.name).toBe('Ares');
  });

  test('should have supported platforms', () => {
    expect(ares.platforms).toBeDefined();
  });

  test('should draft reports', async () => {
    const result = await ares.execute({
      type: 'draft_report',
      finding: {
        title: 'XSS Vulnerability',
        severity: 'high',
        description: 'Test finding'
      }
    });
    expect(result).toBeDefined();
  });
});

describe('Hermes', () => {
  let hermes;

  beforeEach(() => {
    hermes = new Hermes();
  });

  test('should initialize correctly', () => {
    expect(hermes.name).toBe('Hermes');
  });

  test('should have channels', () => {
    expect(hermes.channels).toBeDefined();
  });

  test('should have templates', () => {
    expect(hermes.templates.size).toBeGreaterThan(0);
  });

  test('should get stats', () => {
    const stats = hermes.getStats();
    expect(stats).toHaveProperty('messagesSent');
  });
});

describe('Hephaestus', () => {
  let hephaestus;

  beforeEach(() => {
    hephaestus = new Hephaestus();
  });

  test('should initialize correctly', () => {
    expect(hephaestus.name).toBe('Hephaestus');
  });

  test('should have project templates', () => {
    const templates = hephaestus.getTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  test('should scaffold projects', async () => {
    const result = await hephaestus.execute({
      type: 'scaffold',
      templateName: 'node-api',
      projectName: 'test-project'
    });
    expect(result.success).toBe(true);
    expect(result.files).toBeDefined();
  });
});

describe('Artemis', () => {
  let artemis;

  beforeEach(() => {
    artemis = new Artemis();
  });

  test('should initialize correctly', () => {
    expect(artemis.name).toBe('Artemis');
  });

  test('should have rule sets', () => {
    const ruleSets = artemis.getRuleSets();
    expect(ruleSets.length).toBeGreaterThan(0);
  });

  test('should validate compliance', async () => {
    const result = await artemis.execute({
      type: 'validate',
      ruleSet: 'bug_bounty',
      context: { authorized: true, targetInScope: true },
      evidence: {}
    });
    expect(result).toBeDefined();
    expect(result.ruleSet).toBe('bug_bounty');
  });

  test('should generate contracts', async () => {
    const result = await artemis.execute({
      type: 'generate_contract',
      templateName: 'freelance_basic',
      variables: {
        clientName: 'Test Client',
        contractorName: 'Test Contractor',
        date: '2024-01-01'
      }
    });
    expect(result.document).toBeDefined();
  });
});

describe('RevenueTracker', () => {
  let tracker;

  beforeEach(() => {
    tracker = new RevenueTracker({ dailyGoal: 100, weeklyGoal: 500, monthlyGoal: 2000 });
  });

  test('should initialize with goals', () => {
    expect(tracker.goals.daily).toBe(100);
    expect(tracker.goals.weekly).toBe(500);
    expect(tracker.goals.monthly).toBe(2000);
  });

  test('should record transactions', () => {
    const result = tracker.recordTransaction('bug_bounty', 500, { description: 'Test bounty' });
    expect(result.success).toBe(true);
    expect(result.transaction.amount).toBe(500);
  });

  test('should calculate summaries', () => {
    tracker.recordTransaction('bug_bounty', 500);
    tracker.recordTransaction('freelance', 300);
    const summary = tracker.getSummary('month');
    expect(summary.total).toBe(800);
  });

  test('should track goal progress', () => {
    tracker.recordTransaction('bug_bounty', 50);
    const progress = tracker.getGoalProgress();
    expect(progress.daily.current).toBe(50);
    expect(progress.daily.percentage).toBe(50);
  });
});

describe('AgentMetrics', () => {
  let metrics;

  beforeEach(() => {
    metrics = new AgentMetrics();
  });

  test('should initialize with default agents', () => {
    const summary = metrics.getAllAgentsSummary();
    expect(summary.agents.length).toBe(8);
  });

  test('should record task completion', () => {
    const result = metrics.recordTaskCompletion('sentinel', { duration: 1000, revenue: 100 });
    expect(result.success).toBe(true);
    expect(result.metrics.tasksCompleted).toBe(1);
  });

  test('should record task failure', () => {
    const result = metrics.recordTaskFailure('apollo', { type: 'test' }, new Error('Test error'));
    expect(result.success).toBe(true);
    expect(result.metrics.tasksFailed).toBe(1);
  });

  test('should calculate ROI', () => {
    metrics.recordTaskCompletion('sentinel', { duration: 1000, revenue: 500 });
    const roi = metrics.getROIAnalysis();
    expect(roi.totalRevenue).toBe(500);
  });
});
