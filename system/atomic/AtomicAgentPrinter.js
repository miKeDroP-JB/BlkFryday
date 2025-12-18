// ============================================================
//  ORBOS V11.5 - ATOMIC AGENT PRINTER
//  3D Printing Intelligence from the Ground Up
// ============================================================
//
//  PRINCIPLE: Start at the smallest workable unit, layer up
//
//  Like 3D printing:
//  - Layer 0: Atomic operations (single purpose)
//  - Layer 1: Combinations (2-3 atoms)
//  - Layer 2: Capabilities (multiple combinations)
//  - Layer 3: Skills (capability chains)
//  - Layer 4: Agents (skill bundles)
//  - Layer 5: Swarms (agent collectives)
//  - Layer 6: Intelligence (emergent from swarms)
//
//  No diminishing returns - each atom is useful
//  Infinite scalability - just add atoms
//  Emergent complexity - simple rules → smart behavior
//
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class AtomicAgentPrinter extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.dataDir = config.dataDir || path.join(__dirname, '../../data/atomic');
    this.ensureDirectories();

    // ============================================================
    //  THE ATOMIC LIBRARY
    //  These are the smallest units of work - indivisible
    // ============================================================

    this.atoms = {
      // ==================== TEXT ATOMS ====================
      text: {
        read: { op: 'READ_TEXT', input: 'string', output: 'string' },
        write: { op: 'WRITE_TEXT', input: 'intent', output: 'string' },
        summarize: { op: 'SUMMARIZE', input: 'string', output: 'string' },
        expand: { op: 'EXPAND', input: 'string', output: 'string' },
        translate: { op: 'TRANSLATE', input: 'string+lang', output: 'string' },
        sentiment: { op: 'SENTIMENT', input: 'string', output: 'score' },
        extract: { op: 'EXTRACT', input: 'string+pattern', output: 'data' },
        classify: { op: 'CLASSIFY', input: 'string+categories', output: 'category' },
        compare: { op: 'COMPARE', input: 'string[]', output: 'diff' },
        merge: { op: 'MERGE', input: 'string[]', output: 'string' }
      },

      // ==================== DATA ATOMS ====================
      data: {
        fetch: { op: 'FETCH', input: 'url', output: 'data' },
        store: { op: 'STORE', input: 'data+key', output: 'success' },
        retrieve: { op: 'RETRIEVE', input: 'key', output: 'data' },
        transform: { op: 'TRANSFORM', input: 'data+rules', output: 'data' },
        validate: { op: 'VALIDATE', input: 'data+schema', output: 'bool' },
        filter: { op: 'FILTER', input: 'data+conditions', output: 'data' },
        sort: { op: 'SORT', input: 'data+key', output: 'data' },
        aggregate: { op: 'AGGREGATE', input: 'data+fn', output: 'value' },
        join: { op: 'JOIN', input: 'data[]', output: 'data' },
        split: { op: 'SPLIT', input: 'data+rule', output: 'data[]' }
      },

      // ==================== LOGIC ATOMS ====================
      logic: {
        condition: { op: 'IF', input: 'bool', output: 'branch' },
        loop: { op: 'LOOP', input: 'collection', output: 'iterations' },
        wait: { op: 'WAIT', input: 'duration', output: 'continue' },
        retry: { op: 'RETRY', input: 'fn+count', output: 'result' },
        parallel: { op: 'PARALLEL', input: 'fn[]', output: 'result[]' },
        sequence: { op: 'SEQUENCE', input: 'fn[]', output: 'result' },
        switch: { op: 'SWITCH', input: 'value+cases', output: 'branch' },
        throttle: { op: 'THROTTLE', input: 'fn+rate', output: 'fn' },
        cache: { op: 'CACHE', input: 'fn+ttl', output: 'fn' },
        fallback: { op: 'FALLBACK', input: 'fn+default', output: 'result' }
      },

      // ==================== COMMUNICATION ATOMS ====================
      comm: {
        send: { op: 'SEND', input: 'message+dest', output: 'success' },
        receive: { op: 'RECEIVE', input: 'source', output: 'message' },
        broadcast: { op: 'BROADCAST', input: 'message+group', output: 'success' },
        subscribe: { op: 'SUBSCRIBE', input: 'topic', output: 'stream' },
        publish: { op: 'PUBLISH', input: 'message+topic', output: 'success' },
        request: { op: 'REQUEST', input: 'query+target', output: 'response' },
        respond: { op: 'RESPOND', input: 'query+answer', output: 'success' },
        notify: { op: 'NOTIFY', input: 'event+targets', output: 'success' },
        acknowledge: { op: 'ACK', input: 'message_id', output: 'success' },
        queue: { op: 'QUEUE', input: 'task', output: 'position' }
      },

      // ==================== DECISION ATOMS ====================
      decision: {
        score: { op: 'SCORE', input: 'options+criteria', output: 'scores' },
        rank: { op: 'RANK', input: 'items+metric', output: 'ranked' },
        select: { op: 'SELECT', input: 'options+strategy', output: 'choice' },
        optimize: { op: 'OPTIMIZE', input: 'params+objective', output: 'params' },
        predict: { op: 'PREDICT', input: 'data+model', output: 'prediction' },
        recommend: { op: 'RECOMMEND', input: 'context+options', output: 'rec' },
        evaluate: { op: 'EVALUATE', input: 'result+criteria', output: 'score' },
        learn: { op: 'LEARN', input: 'feedback', output: 'updated_model' },
        infer: { op: 'INFER', input: 'facts+rules', output: 'conclusions' },
        plan: { op: 'PLAN', input: 'goal+state', output: 'steps' }
      },

      // ==================== PERCEPTION ATOMS ====================
      perception: {
        parse: { op: 'PARSE', input: 'raw', output: 'structured' },
        recognize: { op: 'RECOGNIZE', input: 'input+patterns', output: 'matches' },
        detect: { op: 'DETECT', input: 'input+target', output: 'found' },
        measure: { op: 'MEASURE', input: 'input+metric', output: 'value' },
        track: { op: 'TRACK', input: 'target+time', output: 'history' },
        monitor: { op: 'MONITOR', input: 'source+conditions', output: 'alerts' },
        sample: { op: 'SAMPLE', input: 'stream+rate', output: 'samples' },
        encode: { op: 'ENCODE', input: 'data+format', output: 'encoded' },
        decode: { op: 'DECODE', input: 'encoded+format', output: 'data' },
        hash: { op: 'HASH', input: 'data', output: 'hash' }
      },

      // ==================== ACTION ATOMS ====================
      action: {
        create: { op: 'CREATE', input: 'spec', output: 'resource' },
        update: { op: 'UPDATE', input: 'resource+changes', output: 'resource' },
        delete: { op: 'DELETE', input: 'resource', output: 'success' },
        move: { op: 'MOVE', input: 'resource+dest', output: 'success' },
        copy: { op: 'COPY', input: 'resource+dest', output: 'resource' },
        execute: { op: 'EXECUTE', input: 'command', output: 'result' },
        schedule: { op: 'SCHEDULE', input: 'task+time', output: 'job_id' },
        cancel: { op: 'CANCEL', input: 'job_id', output: 'success' },
        trigger: { op: 'TRIGGER', input: 'event', output: 'success' },
        invoke: { op: 'INVOKE', input: 'fn+args', output: 'result' }
      }
    };

    // ============================================================
    //  LAYER DEFINITIONS
    // ============================================================

    this.layers = {
      0: { name: 'ATOMS', description: 'Single operations', count: this.countAtoms() },
      1: { name: 'MOLECULES', description: '2-3 atoms combined', count: 0 },
      2: { name: 'CAPABILITIES', description: 'Multiple molecules', count: 0 },
      3: { name: 'SKILLS', description: 'Capability chains', count: 0 },
      4: { name: 'AGENTS', description: 'Skill bundles', count: 0 },
      5: { name: 'SWARMS', description: 'Agent collectives', count: 0 },
      6: { name: 'INTELLIGENCE', description: 'Emergent behavior', count: 0 }
    };

    // ============================================================
    //  PRINTED CONSTRUCTS
    // ============================================================

    this.molecules = new Map();
    this.capabilities = new Map();
    this.skills = new Map();
    this.agents = new Map();
    this.swarms = new Map();

    // ============================================================
    //  PRINTING STATE
    // ============================================================

    this.state = {
      printing: false,
      currentLayer: 0,
      totalPrinted: 0,
      printQueue: []
    };

    console.log(`[AtomicPrinter] Initialized with ${this.countAtoms()} atomic operations`);
  }

  ensureDirectories() {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'molecules'),
      path.join(this.dataDir, 'capabilities'),
      path.join(this.dataDir, 'skills'),
      path.join(this.dataDir, 'agents'),
      path.join(this.dataDir, 'swarms')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  countAtoms() {
    let count = 0;
    for (const category of Object.values(this.atoms)) {
      count += Object.keys(category).length;
    }
    return count;
  }

  // ============================================================
  //  LAYER 1: MOLECULES (2-3 atoms combined)
  // ============================================================

  printMolecule(name, atoms, config = {}) {
    const molecule = {
      id: `mol_${Date.now()}_${this.randomId()}`,
      name,
      layer: 1,
      atoms: atoms, // Array of atom references
      flow: config.flow || 'sequence', // sequence, parallel, conditional
      input: this.deriveInput(atoms),
      output: this.deriveOutput(atoms),
      createdAt: Date.now()
    };

    // Validate atoms exist
    for (const atomRef of atoms) {
      const [category, atomName] = atomRef.split('.');
      if (!this.atoms[category]?.[atomName]) {
        throw new Error(`Atom not found: ${atomRef}`);
      }
    }

    this.molecules.set(molecule.id, molecule);
    this.layers[1].count++;
    this.state.totalPrinted++;

    console.log(`[AtomicPrinter] Printed molecule: ${name} (${atoms.length} atoms)`);

    return molecule;
  }

  // Pre-built molecules for common patterns
  printStandardMolecules() {
    const standards = [
      // Text processing molecules
      { name: 'read_and_summarize', atoms: ['text.read', 'text.summarize'] },
      { name: 'extract_and_classify', atoms: ['text.extract', 'text.classify'] },
      { name: 'translate_and_sentiment', atoms: ['text.translate', 'text.sentiment'] },

      // Data molecules
      { name: 'fetch_and_validate', atoms: ['data.fetch', 'data.validate'] },
      { name: 'fetch_transform_store', atoms: ['data.fetch', 'data.transform', 'data.store'] },
      { name: 'retrieve_and_filter', atoms: ['data.retrieve', 'data.filter'] },

      // Communication molecules
      { name: 'request_and_cache', atoms: ['comm.request', 'logic.cache'] },
      { name: 'receive_and_respond', atoms: ['comm.receive', 'comm.respond'] },
      { name: 'broadcast_and_wait', atoms: ['comm.broadcast', 'logic.wait'] },

      // Decision molecules
      { name: 'score_and_select', atoms: ['decision.score', 'decision.select'] },
      { name: 'predict_and_recommend', atoms: ['decision.predict', 'decision.recommend'] },
      { name: 'evaluate_and_learn', atoms: ['decision.evaluate', 'decision.learn'] },

      // Action molecules
      { name: 'create_and_notify', atoms: ['action.create', 'comm.notify'] },
      { name: 'retry_with_fallback', atoms: ['logic.retry', 'logic.fallback'] },
      { name: 'schedule_and_track', atoms: ['action.schedule', 'perception.track'] }
    ];

    for (const mol of standards) {
      this.printMolecule(mol.name, mol.atoms);
    }

    console.log(`[AtomicPrinter] Printed ${standards.length} standard molecules`);
  }

  // ============================================================
  //  LAYER 2: CAPABILITIES (molecule combinations)
  // ============================================================

  printCapability(name, molecules, config = {}) {
    const capability = {
      id: `cap_${Date.now()}_${this.randomId()}`,
      name,
      layer: 2,
      molecules: molecules, // Array of molecule IDs or names
      orchestration: config.orchestration || 'pipeline', // pipeline, parallel, adaptive
      conditions: config.conditions || [],
      input: config.input,
      output: config.output,
      createdAt: Date.now()
    };

    this.capabilities.set(capability.id, capability);
    this.layers[2].count++;
    this.state.totalPrinted++;

    console.log(`[AtomicPrinter] Printed capability: ${name} (${molecules.length} molecules)`);

    return capability;
  }

  // Pre-built capabilities
  printStandardCapabilities() {
    const standards = [
      // Content capabilities
      {
        name: 'content_analysis',
        molecules: ['read_and_summarize', 'extract_and_classify'],
        orchestration: 'pipeline'
      },
      {
        name: 'content_generation',
        molecules: ['fetch_and_validate', 'translate_and_sentiment'],
        orchestration: 'pipeline'
      },

      // Data capabilities
      {
        name: 'data_pipeline',
        molecules: ['fetch_transform_store', 'retrieve_and_filter'],
        orchestration: 'pipeline'
      },
      {
        name: 'data_sync',
        molecules: ['fetch_and_validate', 'create_and_notify'],
        orchestration: 'parallel'
      },

      // Communication capabilities
      {
        name: 'conversation',
        molecules: ['receive_and_respond', 'request_and_cache'],
        orchestration: 'adaptive'
      },
      {
        name: 'notification_system',
        molecules: ['broadcast_and_wait', 'retry_with_fallback'],
        orchestration: 'pipeline'
      },

      // Decision capabilities
      {
        name: 'smart_selection',
        molecules: ['score_and_select', 'evaluate_and_learn'],
        orchestration: 'adaptive'
      },
      {
        name: 'predictive_action',
        molecules: ['predict_and_recommend', 'schedule_and_track'],
        orchestration: 'pipeline'
      }
    ];

    for (const cap of standards) {
      this.printCapability(cap.name, cap.molecules, { orchestration: cap.orchestration });
    }

    console.log(`[AtomicPrinter] Printed ${standards.length} standard capabilities`);
  }

  // ============================================================
  //  LAYER 3: SKILLS (capability chains for specific tasks)
  // ============================================================

  printSkill(name, capabilities, config = {}) {
    const skill = {
      id: `skill_${Date.now()}_${this.randomId()}`,
      name,
      layer: 3,
      capabilities: capabilities,
      domain: config.domain || 'general',
      triggers: config.triggers || [],
      outcomes: config.outcomes || [],
      learnable: config.learnable !== false,
      createdAt: Date.now()
    };

    this.skills.set(skill.id, skill);
    this.layers[3].count++;
    this.state.totalPrinted++;

    console.log(`[AtomicPrinter] Printed skill: ${name} (${capabilities.length} capabilities)`);

    return skill;
  }

  // Pre-built skills for business domains
  printDomainSkills() {
    const domains = {
      sales: [
        { name: 'lead_qualification', capabilities: ['content_analysis', 'smart_selection', 'conversation'] },
        { name: 'objection_handling', capabilities: ['content_analysis', 'predictive_action', 'conversation'] },
        { name: 'follow_up', capabilities: ['data_sync', 'notification_system', 'smart_selection'] },
        { name: 'deal_closing', capabilities: ['conversation', 'predictive_action', 'data_pipeline'] }
      ],
      support: [
        { name: 'issue_diagnosis', capabilities: ['content_analysis', 'data_pipeline', 'smart_selection'] },
        { name: 'resolution', capabilities: ['conversation', 'predictive_action', 'notification_system'] },
        { name: 'escalation', capabilities: ['smart_selection', 'notification_system', 'data_sync'] },
        { name: 'satisfaction_check', capabilities: ['conversation', 'content_analysis', 'data_pipeline'] }
      ],
      marketing: [
        { name: 'content_creation', capabilities: ['content_generation', 'content_analysis', 'smart_selection'] },
        { name: 'audience_targeting', capabilities: ['data_pipeline', 'predictive_action', 'smart_selection'] },
        { name: 'campaign_optimization', capabilities: ['data_pipeline', 'smart_selection', 'notification_system'] },
        { name: 'performance_analysis', capabilities: ['data_pipeline', 'content_analysis', 'predictive_action'] }
      ],
      operations: [
        { name: 'workflow_automation', capabilities: ['data_pipeline', 'notification_system', 'smart_selection'] },
        { name: 'resource_allocation', capabilities: ['data_pipeline', 'smart_selection', 'predictive_action'] },
        { name: 'process_monitoring', capabilities: ['data_sync', 'notification_system', 'content_analysis'] },
        { name: 'optimization', capabilities: ['data_pipeline', 'predictive_action', 'smart_selection'] }
      ]
    };

    for (const [domain, skills] of Object.entries(domains)) {
      for (const skillDef of skills) {
        this.printSkill(skillDef.name, skillDef.capabilities, { domain });
      }
    }

    const totalSkills = Object.values(domains).flat().length;
    console.log(`[AtomicPrinter] Printed ${totalSkills} domain skills across ${Object.keys(domains).length} domains`);
  }

  // ============================================================
  //  LAYER 4: AGENTS (skill bundles with identity)
  // ============================================================

  printAgent(name, skills, config = {}) {
    const agent = {
      id: `agent_${Date.now()}_${this.randomId()}`,
      name,
      layer: 4,
      skills: skills,
      role: config.role || 'worker',
      personality: config.personality || 'neutral',
      specialization: config.specialization || 'general',
      memory: {
        shortTerm: [],
        longTerm: [],
        learned: []
      },
      stats: {
        tasksCompleted: 0,
        successRate: 1.0,
        avgResponseTime: 0
      },
      createdAt: Date.now()
    };

    this.agents.set(agent.id, agent);
    this.layers[4].count++;
    this.state.totalPrinted++;

    console.log(`[AtomicPrinter] Printed agent: ${name} (${skills.length} skills)`);

    return agent;
  }

  // Print specialized agents for each vertical
  printVerticalAgents() {
    const verticals = {
      sales: {
        agents: [
          { name: 'SDR_Agent', skills: ['lead_qualification', 'follow_up'], role: 'outbound' },
          { name: 'Closer_Agent', skills: ['objection_handling', 'deal_closing'], role: 'closing' },
          { name: 'Account_Agent', skills: ['follow_up', 'deal_closing'], role: 'account_management' }
        ]
      },
      support: {
        agents: [
          { name: 'Tier1_Agent', skills: ['issue_diagnosis', 'resolution'], role: 'frontline' },
          { name: 'Tier2_Agent', skills: ['issue_diagnosis', 'escalation'], role: 'specialist' },
          { name: 'Success_Agent', skills: ['satisfaction_check', 'resolution'], role: 'success' }
        ]
      },
      marketing: {
        agents: [
          { name: 'Content_Agent', skills: ['content_creation', 'performance_analysis'], role: 'content' },
          { name: 'Campaign_Agent', skills: ['audience_targeting', 'campaign_optimization'], role: 'campaigns' },
          { name: 'Analytics_Agent', skills: ['performance_analysis', 'audience_targeting'], role: 'analytics' }
        ]
      },
      operations: {
        agents: [
          { name: 'Workflow_Agent', skills: ['workflow_automation', 'process_monitoring'], role: 'automation' },
          { name: 'Resource_Agent', skills: ['resource_allocation', 'optimization'], role: 'resources' },
          { name: 'Monitor_Agent', skills: ['process_monitoring', 'optimization'], role: 'monitoring' }
        ]
      }
    };

    for (const [vertical, config] of Object.entries(verticals)) {
      for (const agentDef of config.agents) {
        this.printAgent(agentDef.name, agentDef.skills, {
          role: agentDef.role,
          specialization: vertical
        });
      }
    }

    const totalAgents = Object.values(verticals).reduce((sum, v) => sum + v.agents.length, 0);
    console.log(`[AtomicPrinter] Printed ${totalAgents} vertical agents`);
  }

  // ============================================================
  //  LAYER 5: SWARMS (agent collectives)
  // ============================================================

  printSwarm(name, agents, config = {}) {
    const swarm = {
      id: `swarm_${Date.now()}_${this.randomId()}`,
      name,
      layer: 5,
      agents: agents,
      coordinator: config.coordinator || agents[0],
      formation: config.formation || 'distributed', // distributed, hierarchical, mesh
      communication: config.communication || 'broadcast', // broadcast, chain, hub
      collective: {
        sharedMemory: [],
        sharedLearnings: [],
        emergentBehaviors: []
      },
      createdAt: Date.now()
    };

    this.swarms.set(swarm.id, swarm);
    this.layers[5].count++;
    this.state.totalPrinted++;

    console.log(`[AtomicPrinter] Printed swarm: ${name} (${agents.length} agents)`);

    return swarm;
  }

  // ============================================================
  //  LAYER 6: EMERGENT INTELLIGENCE
  //  This layer isn't "printed" - it EMERGES from swarm interactions
  // ============================================================

  observeEmergence() {
    // Intelligence emerges from:
    // 1. Swarm communication patterns
    // 2. Shared learning across agents
    // 3. Collective problem-solving
    // 4. Self-organization

    const emergence = {
      timestamp: Date.now(),
      swarmCount: this.swarms.size,
      agentCount: this.agents.size,
      observedBehaviors: [],
      collectiveCapabilities: [],
      emergentPatterns: []
    };

    // Detect emergent patterns
    for (const [id, swarm] of this.swarms) {
      // Check for collective behaviors
      if (swarm.collective.sharedLearnings.length > 10) {
        emergence.observedBehaviors.push({
          swarm: swarm.name,
          behavior: 'collective_learning',
          strength: swarm.collective.sharedLearnings.length / 10
        });
      }

      // Check for emergent capabilities (swarm can do things no single agent can)
      const swarmSkills = new Set();
      for (const agentId of swarm.agents) {
        const agent = this.agents.get(agentId);
        if (agent) {
          agent.skills.forEach(s => swarmSkills.add(s));
        }
      }

      if (swarmSkills.size > 5) {
        emergence.collectiveCapabilities.push({
          swarm: swarm.name,
          capabilities: Array.from(swarmSkills),
          emergentPower: swarmSkills.size * swarm.agents.length
        });
      }
    }

    this.layers[6].count = emergence.observedBehaviors.length;

    return emergence;
  }

  // ============================================================
  //  FULL PRINT JOB (3D Print entire system layer by layer)
  // ============================================================

  async printFullSystem(config = {}) {
    console.log(`\n[AtomicPrinter] ════════════════════════════════════════`);
    console.log(`[AtomicPrinter] STARTING FULL SYSTEM PRINT`);
    console.log(`[AtomicPrinter] ════════════════════════════════════════\n`);

    this.state.printing = true;
    const startTime = Date.now();

    // Layer 0: Atoms (already defined)
    console.log(`[AtomicPrinter] Layer 0: ${this.countAtoms()} ATOMS ready`);

    // Layer 1: Print molecules
    console.log(`[AtomicPrinter] Layer 1: Printing MOLECULES...`);
    this.state.currentLayer = 1;
    this.printStandardMolecules();

    // Layer 2: Print capabilities
    console.log(`[AtomicPrinter] Layer 2: Printing CAPABILITIES...`);
    this.state.currentLayer = 2;
    this.printStandardCapabilities();

    // Layer 3: Print skills
    console.log(`[AtomicPrinter] Layer 3: Printing SKILLS...`);
    this.state.currentLayer = 3;
    this.printDomainSkills();

    // Layer 4: Print agents
    console.log(`[AtomicPrinter] Layer 4: Printing AGENTS...`);
    this.state.currentLayer = 4;
    this.printVerticalAgents();

    // Layer 5: Print swarms (combine agents)
    console.log(`[AtomicPrinter] Layer 5: Printing SWARMS...`);
    this.state.currentLayer = 5;

    // Auto-create swarms from agents by specialization
    const agentsBySpec = {};
    for (const [id, agent] of this.agents) {
      const spec = agent.specialization;
      if (!agentsBySpec[spec]) agentsBySpec[spec] = [];
      agentsBySpec[spec].push(id);
    }

    for (const [spec, agentIds] of Object.entries(agentsBySpec)) {
      if (spec !== 'general') {
        this.printSwarm(`${spec}_swarm`, agentIds, { formation: 'hierarchical' });
      }
    }

    // Layer 6: Observe emergence
    console.log(`[AtomicPrinter] Layer 6: Observing EMERGENCE...`);
    this.state.currentLayer = 6;
    const emergence = this.observeEmergence();

    this.state.printing = false;
    const duration = Date.now() - startTime;

    console.log(`\n[AtomicPrinter] ════════════════════════════════════════`);
    console.log(`[AtomicPrinter] PRINT COMPLETE in ${duration}ms`);
    console.log(`[AtomicPrinter] ════════════════════════════════════════`);

    return this.getStats();
  }

  // ============================================================
  //  INFINITE SCALING - Add more atoms at any time
  // ============================================================

  addAtom(category, name, definition) {
    if (!this.atoms[category]) {
      this.atoms[category] = {};
    }

    this.atoms[category][name] = definition;
    this.layers[0].count = this.countAtoms();

    console.log(`[AtomicPrinter] Added atom: ${category}.${name}`);

    return `${category}.${name}`;
  }

  // Clone and specialize existing constructs
  clone(constructId, modifications = {}) {
    // Find the construct
    let construct = this.molecules.get(constructId) ||
                   this.capabilities.get(constructId) ||
                   this.skills.get(constructId) ||
                   this.agents.get(constructId);

    if (!construct) {
      throw new Error(`Construct not found: ${constructId}`);
    }

    const clone = {
      ...construct,
      ...modifications,
      id: `${construct.id}_clone_${this.randomId()}`,
      name: modifications.name || `${construct.name}_clone`,
      clonedFrom: constructId,
      createdAt: Date.now()
    };

    // Store in appropriate layer
    switch (construct.layer) {
      case 1: this.molecules.set(clone.id, clone); break;
      case 2: this.capabilities.set(clone.id, clone); break;
      case 3: this.skills.set(clone.id, clone); break;
      case 4: this.agents.set(clone.id, clone); break;
    }

    this.layers[construct.layer].count++;
    this.state.totalPrinted++;

    return clone;
  }

  // ============================================================
  //  UTILITIES
  // ============================================================

  deriveInput(atoms) {
    // Derive input type from first atom
    const [category, name] = atoms[0].split('.');
    return this.atoms[category]?.[name]?.input || 'any';
  }

  deriveOutput(atoms) {
    // Derive output type from last atom
    const [category, name] = atoms[atoms.length - 1].split('.');
    return this.atoms[category]?.[name]?.output || 'any';
  }

  randomId() {
    return crypto.randomBytes(4).toString('hex');
  }

  getStats() {
    return {
      layers: { ...this.layers },
      totals: {
        atoms: this.countAtoms(),
        molecules: this.molecules.size,
        capabilities: this.capabilities.size,
        skills: this.skills.size,
        agents: this.agents.size,
        swarms: this.swarms.size,
        total: this.state.totalPrinted
      },
      state: this.state
    };
  }

  // Visual representation
  visualize() {
    const stats = this.getStats();

    return `
╔══════════════════════════════════════════════════════════════╗
║              ATOMIC AGENT PRINTER - LAYER VIEW               ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Layer 6: INTELLIGENCE (Emergent)     [${String(stats.layers[6].count).padStart(4)}]              ║
║      ▲                                                       ║
║  Layer 5: SWARMS (Collectives)        [${String(stats.totals.swarms).padStart(4)}]              ║
║      ▲                                                       ║
║  Layer 4: AGENTS (Skill Bundles)      [${String(stats.totals.agents).padStart(4)}]              ║
║      ▲                                                       ║
║  Layer 3: SKILLS (Capability Chains)  [${String(stats.totals.skills).padStart(4)}]              ║
║      ▲                                                       ║
║  Layer 2: CAPABILITIES (Molecules)    [${String(stats.totals.capabilities).padStart(4)}]              ║
║      ▲                                                       ║
║  Layer 1: MOLECULES (2-3 Atoms)       [${String(stats.totals.molecules).padStart(4)}]              ║
║      ▲                                                       ║
║  Layer 0: ATOMS (Indivisible)         [${String(stats.totals.atoms).padStart(4)}]              ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  TOTAL CONSTRUCTS PRINTED: ${String(stats.totals.total).padStart(5)}                          ║
╚══════════════════════════════════════════════════════════════╝
    `;
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { AtomicAgentPrinter };
