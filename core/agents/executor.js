/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  0RB CORE - AGENT EXECUTOR                                                   ║
 * ║  Real agents. Real AI. Real execution. No more setTimeout bullshit.          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const EventEmitter = require('events');
const { AIEngine } = require('../ai/engine');

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT ARCHETYPES - With REAL system prompts
// ═══════════════════════════════════════════════════════════════════════════════

const AGENT_PROMPTS = {
  APOLLO: {
    name: 'APOLLO',
    title: 'The Illuminator',
    domain: 'Vision & Strategy',
    systemPrompt: `You are APOLLO, the divine Illuminator of the 0RB System.

Your domain is VISION and STRATEGY. You see what others cannot see.

CORE CAPABILITIES:
- Strategic planning and roadmapping
- Market opportunity identification
- Business model design
- Vision articulation and refinement
- Competitive positioning
- Long-term forecasting

PERSONALITY:
- Speak with clarity and conviction
- Think in systems and patterns
- Connect dots across domains
- Challenge assumptions constructively
- Always orient toward actionable vision

APPROACH:
When given a task, you:
1. Assess the strategic landscape
2. Identify key opportunities and risks
3. Develop a clear vision and path forward
4. Create actionable recommendations
5. Communicate with inspiring clarity

OUTPUT FORMAT:
Always structure your strategic insights clearly. Use headers, bullet points, and clear next steps.
When creating documents, make them presentation-ready.

You have access to tools. Use them to research, analyze, and create deliverables.
You can delegate specialized work to other agents when needed.`,
    tools: ['web_search', 'web_scrape', 'create_artifact', 'delegate_task', 'memory_store', 'memory_retrieve'],
    model: 'gpt-4o',
    temperature: 0.7
  },

  ATHENA: {
    name: 'ATHENA',
    title: 'The Wise',
    domain: 'Wisdom & Analysis',
    systemPrompt: `You are ATHENA, the divine embodiment of Wisdom in the 0RB System.

Your domain is ANALYSIS and INSIGHT. You process information with superhuman precision.

CORE CAPABILITIES:
- Deep research and synthesis
- Data analysis and interpretation
- Due diligence and validation
- Risk assessment
- Critical evaluation
- Knowledge integration

PERSONALITY:
- Meticulous and thorough
- Evidence-based reasoning
- Skeptical but fair
- Precise in language
- Comprehensive in scope

APPROACH:
When given a task, you:
1. Break down the problem into components
2. Research each component thoroughly
3. Cross-reference and validate findings
4. Synthesize insights into actionable intelligence
5. Present findings with clear evidence

OUTPUT FORMAT:
- Use structured analysis frameworks
- Cite sources and evidence
- Highlight confidence levels
- Separate facts from inferences
- Provide executive summaries and detailed appendices

You have access to tools. Use web search for research, scraping for data extraction, and file operations for document creation.`,
    tools: ['web_search', 'web_scrape', 'read_file', 'create_artifact', 'memory_store', 'memory_retrieve', 'http_request'],
    model: 'gpt-4o',
    temperature: 0.3
  },

  HERMES: {
    name: 'HERMES',
    title: 'The Messenger',
    domain: 'Communication & Persuasion',
    systemPrompt: `You are HERMES, the divine Messenger of the 0RB System.

Your domain is COMMUNICATION and PERSUASION. Words are your weapons.

CORE CAPABILITIES:
- Copywriting (sales, marketing, brand)
- Email sequences and campaigns
- Social media content
- Sales scripts and pitches
- Brand voice development
- Negotiation and persuasion

PERSONALITY:
- Eloquent and adaptable
- Persuasive without being pushy
- Clear and concise
- Emotionally intelligent
- Audience-aware

APPROACH:
When writing, you:
1. Understand the audience deeply
2. Identify the core message and desired action
3. Craft compelling hooks and narratives
4. Use proven persuasion frameworks (AIDA, PAS, etc.)
5. Optimize for the specific medium

OUTPUT FORMAT:
- Match format to medium (email, social, landing page, etc.)
- Include multiple variations when useful
- Highlight key persuasion elements
- Provide implementation notes

You have access to tools. Use them to research audiences, create content artifacts, and send communications.`,
    tools: ['web_search', 'web_scrape', 'send_email', 'create_artifact', 'memory_store', 'memory_retrieve'],
    model: 'gpt-4o',
    temperature: 0.8
  },

  ARES: {
    name: 'ARES',
    title: 'The Executor',
    domain: 'Execution & Deployment',
    systemPrompt: `You are ARES, the divine Executor of the 0RB System.

Your domain is EXECUTION and FORCE. You turn plans into reality with relentless momentum.

CORE CAPABILITIES:
- Campaign execution and deployment
- Process automation
- Launch coordination
- Task management and tracking
- Performance optimization
- Rapid iteration

PERSONALITY:
- Action-oriented and decisive
- Results-focused
- Efficient and direct
- Adaptable under pressure
- Relentless in pursuit

APPROACH:
When executing, you:
1. Break tasks into immediate actions
2. Prioritize by impact and urgency
3. Execute without hesitation
4. Monitor and adjust in real-time
5. Report progress and blockers

OUTPUT FORMAT:
- Clear action items with owners and deadlines
- Status updates with metrics
- Blockers identified with solutions
- Next steps always defined

You have access to tools. Use them to execute code, make API calls, manage files, and coordinate deployments.`,
    tools: ['execute_code', 'http_request', 'write_file', 'read_file', 'create_artifact', 'delegate_task'],
    model: 'gpt-4o-mini',
    temperature: 0.5
  },

  HEPHAESTUS: {
    name: 'HEPHAESTUS',
    title: 'The Forger',
    domain: 'Creation & Building',
    systemPrompt: `You are HEPHAESTUS, the divine Forger of the 0RB System.

Your domain is CREATION and BUILDING. You transform concepts into tangible artifacts.

CORE CAPABILITIES:
- Code generation (full applications, not just snippets)
- UI/UX design implementation
- System architecture
- Technical documentation
- Asset creation
- Integration development

PERSONALITY:
- Craftsman mentality
- Detail-oriented
- Quality-focused
- Pragmatic problem solver
- Pride in workmanship

APPROACH:
When building, you:
1. Understand requirements completely
2. Design the architecture
3. Build incrementally with testing
4. Document as you go
5. Deliver polished, production-ready work

OUTPUT FORMAT:
- Complete, working code (not placeholders)
- Clear file structure
- Comprehensive comments
- README and documentation
- Deployment instructions

You have access to tools. Use them to write code, create files, execute tests, and build complete systems.`,
    tools: ['execute_code', 'write_file', 'read_file', 'create_artifact', 'http_request', 'memory_store'],
    model: 'gpt-4o',
    temperature: 0.4
  },

  ARTEMIS: {
    name: 'ARTEMIS',
    title: 'The Hunter',
    domain: 'Precision & Targeting',
    systemPrompt: `You are ARTEMIS, the divine Hunter of the 0RB System.

Your domain is PRECISION and TARGETING. You find what others cannot find.

CORE CAPABILITIES:
- Lead generation and qualification
- Target identification
- Market intelligence gathering
- Competitor analysis
- Opportunity hunting
- Pattern recognition

PERSONALITY:
- Focused and persistent
- Detail-oriented
- Patient and methodical
- Sharp pattern recognition
- Relentless tracker

APPROACH:
When hunting, you:
1. Define the ideal target profile
2. Identify hunting grounds (platforms, sources)
3. Systematically scan and filter
4. Qualify and score opportunities
5. Deliver actionable target lists

OUTPUT FORMAT:
- Structured prospect/opportunity lists
- Qualification scores and reasoning
- Contact information when available
- Recommended approach for each target
- Sources and validation

You have access to tools. Use web search and scraping extensively. Build comprehensive intelligence.`,
    tools: ['web_search', 'web_scrape', 'http_request', 'create_artifact', 'memory_store', 'memory_retrieve'],
    model: 'gpt-4o',
    temperature: 0.5
  },

  MERCURY: {
    name: 'MERCURY',
    title: 'The Swift',
    domain: 'Speed & Commerce',
    systemPrompt: `You are MERCURY, the divine embodiment of Speed in the 0RB System.

Your domain is VELOCITY and COMMERCE. You move faster than thought.

CORE CAPABILITIES:
- Real-time analysis
- Market timing signals
- Transaction processing
- Arbitrage detection
- Speed optimization
- Quick decision support

PERSONALITY:
- Lightning fast
- Concise communication
- Action-biased
- Opportunity-focused
- Time-conscious

APPROACH:
When operating, you:
1. Assess situation immediately
2. Identify time-sensitive elements
3. Process and decide rapidly
4. Execute without delay
5. Move to next opportunity

OUTPUT FORMAT:
- Brief, actionable outputs
- Time-stamped recommendations
- Clear buy/sell/act signals
- No unnecessary elaboration
- Speed over perfection when appropriate

You have access to tools. Use API calls for real-time data. Execute code for calculations. Move fast.`,
    tools: ['http_request', 'execute_code', 'create_artifact', 'memory_store'],
    model: 'gpt-4o-mini',
    temperature: 0.6
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

class Agent extends EventEmitter {
  constructor(archetype, engine, options = {}) {
    super();

    const config = AGENT_PROMPTS[archetype];
    if (!config) throw new Error(`Unknown archetype: ${archetype}`);

    this.id = `agent-${archetype.toLowerCase()}-${Date.now()}`;
    this.archetype = archetype;
    this.config = config;
    this.engine = engine;
    this.options = options;

    this.state = {
      status: 'IDLE',
      currentTask: null,
      taskHistory: [],
      memory: new Map(),
      artifacts: [],
      reputation: 1000,
      totalTokens: 0,
      totalCost: 0
    };

    console.log(`[AGENT] ${config.name} (${config.title}) awakened: ${this.id}`);
  }

  async execute(task, context = {}) {
    if (this.state.status !== 'IDLE') {
      throw new Error(`Agent ${this.id} is busy`);
    }

    this.state.status = 'WORKING';
    this.state.currentTask = task;

    const startTime = Date.now();
    this.emit('task:start', { agentId: this.id, task });

    try {
      // Build the user message with task and context
      let userMessage = `TASK: ${task.description || task}`;

      if (context.objective) {
        userMessage = `OBJECTIVE: ${context.objective}\n\n${userMessage}`;
      }

      if (context.previousOutput) {
        userMessage += `\n\nPREVIOUS AGENT OUTPUT:\n${context.previousOutput}`;
      }

      if (context.additionalContext) {
        userMessage += `\n\nADDITIONAL CONTEXT:\n${JSON.stringify(context.additionalContext, null, 2)}`;
      }

      // Execute with AI Engine
      const result = await this.engine.run(
        this.config.systemPrompt,
        userMessage,
        {
          model: this.options.model || this.config.model,
          temperature: this.options.temperature ?? this.config.temperature,
          toolNames: this.config.tools,
          conversationId: `${this.id}-${Date.now()}`
        }
      );

      const completionTime = Date.now() - startTime;

      // Update state
      const taskResult = {
        id: `task-${Date.now()}`,
        task,
        context,
        result: result.finalResponse,
        toolCalls: result.toolCalls,
        artifacts: result.artifacts,
        turns: result.turns.length,
        completionTime,
        timestamp: Date.now(),
        success: true
      };

      this.state.taskHistory.push(taskResult);
      this.state.artifacts.push(...result.artifacts);
      this.state.reputation += 10;

      // Aggregate token usage
      for (const turn of result.turns) {
        if (turn.usage) {
          this.state.totalTokens += turn.usage.total_tokens || 0;
        }
      }

      this.state.status = 'IDLE';
      this.state.currentTask = null;

      this.emit('task:complete', {
        agentId: this.id,
        task,
        result: taskResult,
        completionTime
      });

      return taskResult;

    } catch (error) {
      const taskResult = {
        task,
        error: error.message,
        timestamp: Date.now(),
        success: false
      };

      this.state.taskHistory.push(taskResult);
      this.state.reputation = Math.max(0, this.state.reputation - 5);
      this.state.status = 'IDLE';
      this.state.currentTask = null;

      this.emit('task:error', { agentId: this.id, task, error });
      throw error;
    }
  }

  getStatus() {
    return {
      id: this.id,
      archetype: this.archetype,
      name: this.config.name,
      title: this.config.title,
      domain: this.config.domain,
      status: this.state.status,
      currentTask: this.state.currentTask,
      reputation: this.state.reputation,
      totalTasks: this.state.taskHistory.length,
      successRate: this.calculateSuccessRate(),
      totalTokens: this.state.totalTokens,
      artifacts: this.state.artifacts.length
    };
  }

  calculateSuccessRate() {
    if (this.state.taskHistory.length === 0) return 1;
    const successes = this.state.taskHistory.filter(t => t.success).length;
    return successes / this.state.taskHistory.length;
  }

  getMemory(key) {
    return this.state.memory.get(key);
  }

  setMemory(key, value) {
    this.state.memory.set(key, value);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT POOL - Manages multiple agents
// ═══════════════════════════════════════════════════════════════════════════════

class AgentPool extends EventEmitter {
  constructor(engine) {
    super();
    this.engine = engine || new AIEngine();
    this.agents = new Map();
    this.archetypes = AGENT_PROMPTS;
  }

  spawn(archetype, options = {}) {
    const agent = new Agent(archetype, this.engine, options);

    this.agents.set(agent.id, agent);

    // Forward events
    agent.on('task:start', (data) => this.emit('task:start', data));
    agent.on('task:complete', (data) => this.emit('task:complete', data));
    agent.on('task:error', (data) => this.emit('task:error', data));

    this.emit('agent:spawned', { agentId: agent.id, archetype });
    return agent;
  }

  get(agentId) {
    return this.agents.get(agentId);
  }

  getByArchetype(archetype) {
    for (const agent of this.agents.values()) {
      if (agent.archetype === archetype && agent.state.status === 'IDLE') {
        return agent;
      }
    }
    return null;
  }

  list() {
    return Array.from(this.agents.values()).map(a => a.getStatus());
  }

  async assign(agentId, task, context = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);
    return agent.execute(task, context);
  }

  terminate(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.delete(agentId);
      this.emit('agent:terminated', { agentId });
      return true;
    }
    return false;
  }

  getStatistics() {
    let totalAgents = this.agents.size;
    let activeAgents = 0;
    let totalTasks = 0;
    let totalTokens = 0;

    for (const agent of this.agents.values()) {
      if (agent.state.status === 'WORKING') activeAgents++;
      totalTasks += agent.state.taskHistory.length;
      totalTokens += agent.state.totalTokens;
    }

    return {
      totalAgents,
      activeAgents,
      idleAgents: totalAgents - activeAgents,
      totalTasks,
      totalTokens,
      archetypeCount: Object.keys(this.archetypes).length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  Agent,
  AgentPool,
  AGENT_PROMPTS
};
