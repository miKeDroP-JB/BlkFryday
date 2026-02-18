/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  0RB CORE - COMPANY FACTORY                                                  ║
 * ║  The machine that builds machines. Million dollar companies in seconds.      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const EventEmitter = require('events');
const { AIEngine } = require('../ai/engine');
const { AgentPool, AGENT_PROMPTS } = require('../agents/executor');

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY BLUEPRINTS - Pre-defined company structures
// ═══════════════════════════════════════════════════════════════════════════════

const COMPANY_BLUEPRINTS = {
  // SaaS company blueprint
  SAAS: {
    name: 'SaaS Business',
    description: 'Software-as-a-Service company',
    phases: [
      {
        name: 'Discovery',
        agents: ['APOLLO', 'ATHENA'],
        tasks: [
          { agent: 'APOLLO', task: 'Define product vision and market positioning' },
          { agent: 'ATHENA', task: 'Research market size, competitors, and customer pain points' }
        ]
      },
      {
        name: 'Strategy',
        agents: ['APOLLO', 'ARTEMIS'],
        tasks: [
          { agent: 'APOLLO', task: 'Create business model and pricing strategy' },
          { agent: 'ARTEMIS', task: 'Identify ideal customer profile and acquisition channels' }
        ]
      },
      {
        name: 'Brand',
        agents: ['HERMES', 'HEPHAESTUS'],
        tasks: [
          { agent: 'HERMES', task: 'Develop brand voice, messaging, and value propositions' },
          { agent: 'HEPHAESTUS', task: 'Create brand assets: logo concepts, color palette, typography' }
        ]
      },
      {
        name: 'Product',
        agents: ['HEPHAESTUS', 'ATHENA'],
        tasks: [
          { agent: 'HEPHAESTUS', task: 'Design product architecture and core features' },
          { agent: 'HEPHAESTUS', task: 'Build MVP landing page and waitlist system' }
        ]
      },
      {
        name: 'Content',
        agents: ['HERMES', 'HEPHAESTUS'],
        tasks: [
          { agent: 'HERMES', task: 'Write website copy, email sequences, and sales materials' },
          { agent: 'HERMES', task: 'Create content strategy and initial content pieces' }
        ]
      },
      {
        name: 'Launch',
        agents: ['ARES', 'HERMES'],
        tasks: [
          { agent: 'ARES', task: 'Create launch plan and execution checklist' },
          { agent: 'HERMES', task: 'Write launch emails and social announcements' }
        ]
      }
    ],
    deliverables: [
      'Business model canvas',
      'Market research report',
      'Brand guidelines',
      'Landing page',
      'Email sequences',
      'Launch plan'
    ]
  },

  // Agency blueprint
  AGENCY: {
    name: 'Service Agency',
    description: 'Professional services agency',
    phases: [
      {
        name: 'Positioning',
        agents: ['APOLLO', 'ATHENA'],
        tasks: [
          { agent: 'APOLLO', task: 'Define agency niche, positioning, and unique value proposition' },
          { agent: 'ATHENA', task: 'Analyze competitive landscape and pricing benchmarks' }
        ]
      },
      {
        name: 'Services',
        agents: ['APOLLO', 'ATHENA'],
        tasks: [
          { agent: 'APOLLO', task: 'Design service offerings and packages' },
          { agent: 'ATHENA', task: 'Create service delivery processes and SOPs' }
        ]
      },
      {
        name: 'Brand',
        agents: ['HERMES', 'HEPHAESTUS'],
        tasks: [
          { agent: 'HERMES', task: 'Develop brand identity and messaging framework' },
          { agent: 'HEPHAESTUS', task: 'Design visual identity and brand assets' }
        ]
      },
      {
        name: 'Sales',
        agents: ['HERMES', 'ARTEMIS'],
        tasks: [
          { agent: 'HERMES', task: 'Create sales scripts, proposals, and case study templates' },
          { agent: 'ARTEMIS', task: 'Build prospect lists and outreach sequences' }
        ]
      },
      {
        name: 'Website',
        agents: ['HEPHAESTUS', 'HERMES'],
        tasks: [
          { agent: 'HEPHAESTUS', task: 'Build agency website with portfolio and contact forms' },
          { agent: 'HERMES', task: 'Write all website copy and service descriptions' }
        ]
      },
      {
        name: 'Acquisition',
        agents: ['ARES', 'ARTEMIS'],
        tasks: [
          { agent: 'ARES', task: 'Deploy initial outreach campaigns' },
          { agent: 'ARTEMIS', task: 'Identify and qualify first 50 prospects' }
        ]
      }
    ],
    deliverables: [
      'Positioning document',
      'Service catalog',
      'Pricing matrix',
      'Sales playbook',
      'Agency website',
      'Prospect list'
    ]
  },

  // E-commerce blueprint
  ECOMMERCE: {
    name: 'E-commerce Brand',
    description: 'Direct-to-consumer product brand',
    phases: [
      {
        name: 'Market',
        agents: ['ATHENA', 'ARTEMIS'],
        tasks: [
          { agent: 'ATHENA', task: 'Research product market, trends, and competition' },
          { agent: 'ARTEMIS', task: 'Identify target customer segments and personas' }
        ]
      },
      {
        name: 'Brand',
        agents: ['APOLLO', 'HERMES'],
        tasks: [
          { agent: 'APOLLO', task: 'Define brand vision, values, and positioning' },
          { agent: 'HERMES', task: 'Create brand story and messaging hierarchy' }
        ]
      },
      {
        name: 'Design',
        agents: ['HEPHAESTUS'],
        tasks: [
          { agent: 'HEPHAESTUS', task: 'Design brand identity: logo, colors, packaging concepts' },
          { agent: 'HEPHAESTUS', task: 'Create product photography guidelines and mockups' }
        ]
      },
      {
        name: 'Store',
        agents: ['HEPHAESTUS', 'HERMES'],
        tasks: [
          { agent: 'HEPHAESTUS', task: 'Design and build Shopify store' },
          { agent: 'HERMES', task: 'Write product descriptions and collection copy' }
        ]
      },
      {
        name: 'Marketing',
        agents: ['HERMES', 'ARTEMIS'],
        tasks: [
          { agent: 'HERMES', task: 'Create ad copy, email flows, and social content' },
          { agent: 'ARTEMIS', task: 'Build audience targeting and influencer lists' }
        ]
      },
      {
        name: 'Launch',
        agents: ['ARES', 'MERCURY'],
        tasks: [
          { agent: 'ARES', task: 'Execute launch sequence across all channels' },
          { agent: 'MERCURY', task: 'Monitor launch metrics and optimize in real-time' }
        ]
      }
    ],
    deliverables: [
      'Market research',
      'Brand guide',
      'Shopify store',
      'Product listings',
      'Marketing assets',
      'Launch report'
    ]
  },

  // Content creator blueprint
  CREATOR: {
    name: 'Content Creator Brand',
    description: 'Personal brand and content business',
    phases: [
      {
        name: 'Identity',
        agents: ['APOLLO', 'ATHENA'],
        tasks: [
          { agent: 'APOLLO', task: 'Define personal brand vision, niche, and unique angle' },
          { agent: 'ATHENA', task: 'Research audience, platform trends, and content gaps' }
        ]
      },
      {
        name: 'Strategy',
        agents: ['APOLLO', 'ARTEMIS'],
        tasks: [
          { agent: 'APOLLO', task: 'Create content strategy and pillar content themes' },
          { agent: 'ARTEMIS', task: 'Identify collaboration opportunities and growth tactics' }
        ]
      },
      {
        name: 'Content',
        agents: ['HERMES', 'HEPHAESTUS'],
        tasks: [
          { agent: 'HERMES', task: 'Create 30-day content calendar with hooks and scripts' },
          { agent: 'HEPHAESTUS', task: 'Design content templates and brand assets' }
        ]
      },
      {
        name: 'Monetization',
        agents: ['APOLLO', 'HERMES'],
        tasks: [
          { agent: 'APOLLO', task: 'Design monetization strategy: products, sponsorships, etc.' },
          { agent: 'HERMES', task: 'Create sponsorship pitch deck and rate card' }
        ]
      },
      {
        name: 'Growth',
        agents: ['ARES', 'MERCURY'],
        tasks: [
          { agent: 'ARES', task: 'Set up posting schedule and automation' },
          { agent: 'MERCURY', task: 'Implement analytics and growth tracking' }
        ]
      }
    ],
    deliverables: [
      'Brand identity document',
      'Content strategy',
      '30-day content calendar',
      'Content templates',
      'Monetization plan',
      'Growth dashboard'
    ]
  },

  // Quick MVP
  MVP: {
    name: 'Quick MVP',
    description: 'Minimum viable product in record time',
    phases: [
      {
        name: 'Define',
        agents: ['APOLLO'],
        tasks: [
          { agent: 'APOLLO', task: 'Define MVP scope: core feature, target user, success metric' }
        ]
      },
      {
        name: 'Build',
        agents: ['HEPHAESTUS'],
        tasks: [
          { agent: 'HEPHAESTUS', task: 'Build complete MVP: landing page, core functionality, user flow' }
        ]
      },
      {
        name: 'Launch',
        agents: ['HERMES', 'ARES'],
        tasks: [
          { agent: 'HERMES', task: 'Write launch copy and announcement' },
          { agent: 'ARES', task: 'Deploy MVP and initial promotion' }
        ]
      }
    ],
    deliverables: [
      'MVP definition',
      'Working product',
      'Landing page',
      'Launch announcement'
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// WORKFLOW ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

class WorkflowEngine extends EventEmitter {
  constructor(agentPool) {
    super();
    this.agentPool = agentPool;
    this.workflows = new Map();
  }

  async executePhase(phase, context) {
    const results = [];

    for (const taskDef of phase.tasks) {
      // Get or spawn agent
      let agent = this.agentPool.getByArchetype(taskDef.agent);
      if (!agent) {
        agent = this.agentPool.spawn(taskDef.agent);
      }

      // Build context with previous results
      const taskContext = {
        ...context,
        previousOutput: results.length > 0
          ? results.map(r => `${r.agent}: ${r.result}`).join('\n\n')
          : null
      };

      this.emit('task:start', {
        phase: phase.name,
        agent: taskDef.agent,
        task: taskDef.task
      });

      const result = await agent.execute(taskDef.task, taskContext);

      results.push({
        agent: taskDef.agent,
        task: taskDef.task,
        result: result.result,
        artifacts: result.artifacts,
        duration: result.completionTime
      });

      this.emit('task:complete', {
        phase: phase.name,
        agent: taskDef.agent,
        task: taskDef.task,
        duration: result.completionTime
      });
    }

    return results;
  }

  async executeWorkflow(blueprint, objective, options = {}) {
    const workflowId = `workflow-${Date.now()}`;
    const startTime = Date.now();

    const workflow = {
      id: workflowId,
      blueprint: blueprint.name,
      objective,
      status: 'RUNNING',
      phases: [],
      deliverables: [],
      startTime,
      endTime: null
    };

    this.workflows.set(workflowId, workflow);
    this.emit('workflow:start', { workflowId, blueprint: blueprint.name, objective });

    const context = {
      objective,
      blueprintName: blueprint.name,
      ...options.context
    };

    try {
      for (const phase of blueprint.phases) {
        this.emit('phase:start', { workflowId, phase: phase.name });

        const phaseResults = await this.executePhase(phase, context);

        workflow.phases.push({
          name: phase.name,
          results: phaseResults,
          completedAt: Date.now()
        });

        // Update context with phase results
        context[`phase_${phase.name}`] = phaseResults;

        this.emit('phase:complete', {
          workflowId,
          phase: phase.name,
          taskCount: phaseResults.length
        });
      }

      // Collect all artifacts as deliverables
      for (const phase of workflow.phases) {
        for (const result of phase.results) {
          if (result.artifacts) {
            workflow.deliverables.push(...result.artifacts);
          }
        }
      }

      workflow.status = 'COMPLETED';
      workflow.endTime = Date.now();

      this.emit('workflow:complete', {
        workflowId,
        duration: workflow.endTime - workflow.startTime,
        deliverableCount: workflow.deliverables.length
      });

      return workflow;

    } catch (error) {
      workflow.status = 'FAILED';
      workflow.error = error.message;
      workflow.endTime = Date.now();

      this.emit('workflow:error', { workflowId, error: error.message });
      throw error;
    }
  }

  getWorkflow(workflowId) {
    return this.workflows.get(workflowId);
  }

  listWorkflows() {
    return Array.from(this.workflows.values()).map(w => ({
      id: w.id,
      blueprint: w.blueprint,
      objective: w.objective,
      status: w.status,
      phaseCount: w.phases.length,
      deliverableCount: w.deliverables.length,
      duration: w.endTime ? w.endTime - w.startTime : null
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY FACTORY - The main orchestrator
// ═══════════════════════════════════════════════════════════════════════════════

class CompanyFactory extends EventEmitter {
  constructor(config = {}) {
    super();

    this.engine = config.engine || new AIEngine(config.aiConfig);
    this.agentPool = new AgentPool(this.engine);
    this.workflowEngine = new WorkflowEngine(this.agentPool);
    this.blueprints = COMPANY_BLUEPRINTS;

    this.companies = new Map();

    // Forward events
    this.workflowEngine.on('workflow:start', (data) => this.emit('build:start', data));
    this.workflowEngine.on('workflow:complete', (data) => this.emit('build:complete', data));
    this.workflowEngine.on('workflow:error', (data) => this.emit('build:error', data));
    this.workflowEngine.on('phase:start', (data) => this.emit('phase:start', data));
    this.workflowEngine.on('phase:complete', (data) => this.emit('phase:complete', data));
    this.workflowEngine.on('task:start', (data) => this.emit('task:start', data));
    this.workflowEngine.on('task:complete', (data) => this.emit('task:complete', data));

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     ██████╗ ██████╗ ███╗   ███╗██████╗  █████╗ ███╗   ██╗██╗   ██╗           ║
║    ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██╔══██╗████╗  ██║╚██╗ ██╔╝           ║
║    ██║     ██║   ██║██╔████╔██║██████╔╝███████║██╔██╗ ██║ ╚████╔╝            ║
║    ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██╔══██║██║╚██╗██║  ╚██╔╝             ║
║    ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ██║  ██║██║ ╚████║   ██║              ║
║     ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝              ║
║                                                                              ║
║    ███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗               ║
║    ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝               ║
║    █████╗  ███████║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝                ║
║    ██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝                 ║
║    ██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║                  ║
║    ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝                  ║
║                                                                              ║
║    The machine that builds machines. Million dollar companies in seconds.    ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Blueprints: ${String(Object.keys(this.blueprints).length).padEnd(62)}║
║  Agents: ${String(Object.keys(AGENT_PROMPTS).length).padEnd(66)}║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * Build a company from a blueprint
   */
  async build(blueprintName, objective, options = {}) {
    const blueprint = this.blueprints[blueprintName];
    if (!blueprint) {
      throw new Error(`Unknown blueprint: ${blueprintName}. Available: ${Object.keys(this.blueprints).join(', ')}`);
    }

    console.log(`\n[FACTORY] Building ${blueprint.name}: ${objective}\n`);

    const result = await this.workflowEngine.executeWorkflow(blueprint, objective, options);

    // Store company
    const company = {
      id: result.id,
      name: options.companyName || objective,
      blueprint: blueprintName,
      objective,
      workflow: result,
      createdAt: new Date().toISOString()
    };

    this.companies.set(company.id, company);

    return company;
  }

  /**
   * Quick build - single agent task
   */
  async quickBuild(agentType, task, context = {}) {
    let agent = this.agentPool.getByArchetype(agentType);
    if (!agent) {
      agent = this.agentPool.spawn(agentType);
    }

    return agent.execute(task, context);
  }

  /**
   * Custom workflow - define your own phases
   */
  async customBuild(name, phases, objective, options = {}) {
    const customBlueprint = {
      name,
      description: 'Custom workflow',
      phases,
      deliverables: []
    };

    return this.workflowEngine.executeWorkflow(customBlueprint, objective, options);
  }

  /**
   * Get available blueprints
   */
  getBlueprints() {
    return Object.entries(this.blueprints).map(([key, blueprint]) => ({
      key,
      name: blueprint.name,
      description: blueprint.description,
      phases: blueprint.phases.length,
      deliverables: blueprint.deliverables
    }));
  }

  /**
   * Get company by ID
   */
  getCompany(companyId) {
    return this.companies.get(companyId);
  }

  /**
   * List all companies
   */
  listCompanies() {
    return Array.from(this.companies.values()).map(c => ({
      id: c.id,
      name: c.name,
      blueprint: c.blueprint,
      status: c.workflow.status,
      createdAt: c.createdAt
    }));
  }

  /**
   * Get factory statistics
   */
  getStatistics() {
    return {
      companies: this.companies.size,
      agents: this.agentPool.getStatistics(),
      workflows: this.workflowEngine.listWorkflows().length,
      blueprints: Object.keys(this.blueprints).length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  const factory = new CompanyFactory();

  // Example: Build a SaaS company
  if (process.argv[2] === 'build') {
    const blueprint = process.argv[3] || 'MVP';
    const objective = process.argv.slice(4).join(' ') || 'AI-powered task management tool';

    console.log(`Building ${blueprint}: ${objective}`);

    factory.on('phase:start', ({ phase }) => console.log(`  → Starting phase: ${phase}`));
    factory.on('task:complete', ({ agent, task }) => console.log(`    ✓ ${agent}: ${task.substring(0, 50)}...`));

    const company = await factory.build(blueprint, objective);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('BUILD COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Company: ${company.name}`);
    console.log(`Phases: ${company.workflow.phases.length}`);
    console.log(`Deliverables: ${company.workflow.deliverables.length}`);
    console.log(`Duration: ${(company.workflow.endTime - company.workflow.startTime) / 1000}s`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  CompanyFactory,
  WorkflowEngine,
  COMPANY_BLUEPRINTS
};
