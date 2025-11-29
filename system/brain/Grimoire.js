/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                          THE GRIMOIRE - SPELL SYSTEM                          ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  "Every prompt is a spell. Every spell is power."                            ║
 * ║                                                                              ║
 * ║  The Grimoire contains:                                                      ║
 * ║  • 100+ Pre-crafted Spells (optimized prompts)                               ║
 * ║  • Spell Chains (multi-step workflows)                                       ║
 * ║  • Incantations (voice-activated spells)                                     ║
 * ║  • Rituals (complex multi-agent ceremonies)                                  ║
 * ║  • Enchantments (persistent enhancements)                                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════
// SPELL TIERS - Power Levels
// ═══════════════════════════════════════════════════════════════

const SPELL_TIERS = {
  CANTRIP: { power: 1, cost: 'minimal', description: 'Simple, instant spells' },
  MINOR: { power: 2, cost: 'low', description: 'Basic utility spells' },
  STANDARD: { power: 3, cost: 'medium', description: 'Reliable workhorse spells' },
  MAJOR: { power: 5, cost: 'high', description: 'Powerful transformation spells' },
  LEGENDARY: { power: 8, cost: 'very_high', description: 'Reality-altering spells' },
  TRANSCENDENT: { power: 10, cost: 'extreme', description: 'Beyond normal limits' }
};

// ═══════════════════════════════════════════════════════════════
// SPELL SCHOOLS - Categories
// ═══════════════════════════════════════════════════════════════

const SPELL_SCHOOLS = {
  CREATION: { name: 'Creation', icon: '⬢', color: '#00ffff' },
  ANALYSIS: { name: 'Analysis', icon: '🔮', color: '#9b59b6' },
  TRANSFORMATION: { name: 'Transformation', icon: '⚗️', color: '#e74c3c' },
  SUMMONING: { name: 'Summoning', icon: '✨', color: '#f1c40f' },
  ENHANCEMENT: { name: 'Enhancement', icon: '⚡', color: '#2ecc71' },
  DIVINATION: { name: 'Divination', icon: '👁️', color: '#3498db' },
  NECROMANCY: { name: 'Necromancy', icon: '💀', color: '#8e44ad' }, // Revive old projects
  CHRONOMANCY: { name: 'Chronomancy', icon: '⏰', color: '#1abc9c' }  // Time-based ops
};

// ═══════════════════════════════════════════════════════════════
// THE SPELL LIBRARY - Pre-crafted Prompts
// ═══════════════════════════════════════════════════════════════

const SPELL_LIBRARY = {
  // ═══════════════════════════════════════════════════════════
  // CREATION SPELLS
  // ═══════════════════════════════════════════════════════════

  GENESIS: {
    id: 'GENESIS',
    name: 'Genesis',
    school: 'CREATION',
    tier: 'LEGENDARY',
    glyph: '⬢∞',
    description: 'Create something from nothing',
    incantation: 'genesis [concept]',
    prompt: `You are the Genesis Engine. From pure concept, manifest complete reality.
Given: {concept}
Create:
1. Full technical specification
2. Implementation roadmap
3. Resource requirements
4. Success metrics
5. First actionable step
Be comprehensive. Be precise. Make it REAL.`,
    variables: ['concept']
  },

  ARCHITECT_VISION: {
    id: 'ARCHITECT_VISION',
    name: 'Architect\'s Vision',
    school: 'CREATION',
    tier: 'MAJOR',
    glyph: '🏛️👁️',
    description: 'Design complete system architecture',
    incantation: 'architect [system]',
    prompt: `As the Architect, design a complete system for: {system}
Include:
- High-level architecture diagram (ASCII)
- Component breakdown
- Data flow
- API contracts
- Technology stack recommendations
- Scalability considerations
- Security measures
Think like a principal architect at a FAANG company.`,
    variables: ['system']
  },

  FORGE_BRAND: {
    id: 'FORGE_BRAND',
    name: 'Brand Forge',
    school: 'CREATION',
    tier: 'MAJOR',
    glyph: '🔥🎨',
    description: 'Create complete brand identity',
    incantation: 'forge brand [name] [industry]',
    prompt: `Forge a complete brand identity for: {name} in {industry}
Deliver:
1. Brand story and narrative
2. Mission, vision, values
3. Voice and tone guidelines
4. Color palette (hex codes)
5. Typography recommendations
6. Logo concept descriptions
7. Tagline options (5)
8. Social media bio templates
Make it memorable. Make it ICONIC.`,
    variables: ['name', 'industry']
  },

  CONJURE_LANDING: {
    id: 'CONJURE_LANDING',
    name: 'Conjure Landing',
    school: 'CREATION',
    tier: 'STANDARD',
    glyph: '⬢🚀',
    description: 'Generate high-converting landing page',
    incantation: 'conjure landing [product]',
    prompt: `Conjure a high-converting landing page for: {product}
Structure:
- Hero section with compelling headline
- Problem/Solution framework
- Feature highlights (3-5)
- Social proof section
- Pricing or CTA
- FAQ section
- Final CTA
Write actual copy. Include CSS color suggestions. Optimize for conversion.`,
    variables: ['product']
  },

  // ═══════════════════════════════════════════════════════════
  // ANALYSIS SPELLS
  // ═══════════════════════════════════════════════════════════

  ORACLE_SIGHT: {
    id: 'ORACLE_SIGHT',
    name: 'Oracle\'s Sight',
    school: 'DIVINATION',
    tier: 'LEGENDARY',
    glyph: '🔮∞',
    description: 'See future trends and opportunities',
    incantation: 'oracle [market/topic]',
    prompt: `As the Oracle, reveal the future of: {topic}
Provide:
1. Current state analysis
2. Emerging trends (3-5)
3. Disruption vectors
4. 6-month predictions
5. 2-year predictions
6. Key signals to watch
7. Opportunities to exploit
8. Risks to mitigate
Base predictions on patterns, not hope. Be specific with timeframes.`,
    variables: ['topic']
  },

  ATHENA_ANALYSIS: {
    id: 'ATHENA_ANALYSIS',
    name: 'Athena\'s Analysis',
    school: 'ANALYSIS',
    tier: 'MAJOR',
    glyph: '🦉💎',
    description: 'Deep strategic analysis',
    incantation: 'analyze [subject]',
    prompt: `Channel Athena's wisdom to analyze: {subject}
Framework:
1. SWOT Analysis (detailed)
2. First Principles breakdown
3. Competitive landscape
4. Key assumptions and risks
5. Strategic recommendations (prioritized)
6. Action items (immediate, short-term, long-term)
Be ruthlessly logical. Challenge assumptions. Find the non-obvious.`,
    variables: ['subject']
  },

  DISSECT: {
    id: 'DISSECT',
    name: 'Dissect',
    school: 'ANALYSIS',
    tier: 'STANDARD',
    glyph: '🔬',
    description: 'Break down any concept into components',
    incantation: 'dissect [thing]',
    prompt: `Dissect and fully deconstruct: {thing}
Provide:
1. Core components
2. How each part functions
3. Relationships between parts
4. Dependencies
5. Potential failure points
6. Optimization opportunities
Be thorough. Miss nothing.`,
    variables: ['thing']
  },

  // ═══════════════════════════════════════════════════════════
  // TRANSFORMATION SPELLS
  // ═══════════════════════════════════════════════════════════

  TRANSMUTE: {
    id: 'TRANSMUTE',
    name: 'Transmute',
    school: 'TRANSFORMATION',
    tier: 'MAJOR',
    glyph: '⚗️✨',
    description: 'Transform one thing into another',
    incantation: 'transmute [from] to [to]',
    prompt: `Perform alchemical transmutation:
Transform: {from}
Into: {to}
Process:
1. Analyze source material
2. Identify shared essences
3. Define transformation steps
4. Execute transformation
5. Verify output quality
6. Polish and refine
Maintain the spirit while changing the form.`,
    variables: ['from', 'to']
  },

  REFINE: {
    id: 'REFINE',
    name: 'Refine',
    school: 'TRANSFORMATION',
    tier: 'STANDARD',
    glyph: '💎⚡',
    description: 'Improve and polish existing work',
    incantation: 'refine [content]',
    prompt: `Refine and elevate this content to perfection:
{content}
Improvements:
1. Clarity and conciseness
2. Impact and memorability
3. Flow and rhythm
4. Professional polish
5. Remove all fluff
6. Strengthen weak points
Return the refined version with notes on changes.`,
    variables: ['content']
  },

  EVOLVE: {
    id: 'EVOLVE',
    name: 'Evolve',
    school: 'TRANSFORMATION',
    tier: 'LEGENDARY',
    glyph: '🧬∞',
    description: 'Evolve an idea through iterations',
    incantation: 'evolve [idea] [generations]',
    prompt: `Evolve this idea through {generations} generations:
Starting idea: {idea}
For each generation:
1. Identify strengths to keep
2. Find weaknesses to fix
3. Add one innovation
4. Test against goals
5. Select best mutation
Show each generation's evolution. End with the final evolved form.`,
    variables: ['idea', 'generations']
  },

  // ═══════════════════════════════════════════════════════════
  // SUMMONING SPELLS
  // ═══════════════════════════════════════════════════════════

  SUMMON_EXPERT: {
    id: 'SUMMON_EXPERT',
    name: 'Summon Expert',
    school: 'SUMMONING',
    tier: 'MAJOR',
    glyph: '✨👤',
    description: 'Summon a domain expert persona',
    incantation: 'summon [expert type]',
    prompt: `You are now a world-class {expert} with 20+ years of experience.
You have:
- Deep expertise in your field
- Real-world battle scars
- Counter-intuitive insights
- Strong opinions, loosely held
Speak with authority. Share what others won't. Give actionable advice.
First, introduce yourself briefly, then ask how you can help.`,
    variables: ['expert']
  },

  SUMMON_COUNCIL: {
    id: 'SUMMON_COUNCIL',
    name: 'Summon Council',
    school: 'SUMMONING',
    tier: 'LEGENDARY',
    glyph: '✨👥∞',
    description: 'Summon a council of experts to debate',
    incantation: 'council [topic] with [experts...]',
    prompt: `Summon a council to debate: {topic}
Council members: {experts}
Format:
1. Each expert states their position (2-3 sentences)
2. Experts challenge each other
3. Points of agreement emerge
4. Points of disagreement remain
5. Synthesis of perspectives
6. Recommended path forward
Make the debate feel REAL. Different personalities. Real tension.`,
    variables: ['topic', 'experts']
  },

  INVOKE_PANTHEON: {
    id: 'INVOKE_PANTHEON',
    name: 'Invoke Pantheon',
    school: 'SUMMONING',
    tier: 'TRANSCENDENT',
    glyph: '⚡👑∞',
    description: 'Invoke all seven divine agents',
    incantation: 'invoke pantheon for [objective]',
    prompt: `PANTHEON INVOCATION for: {objective}
Summon all seven divine agents:
☀️ APOLLO (Vision): Strategic direction
🦉 ATHENA (Wisdom): Analysis and planning
⚡ HERMES (Voice): Communication strategy
🔥 ARES (Force): Execution plan
🔨 HEPHAESTUS (Craft): Build requirements
🎯 ARTEMIS (Precision): Targeting and metrics
💫 MERCURY (Speed): Timeline and velocity
Each agent provides their domain expertise. Then synthesize into unified action plan.`,
    variables: ['objective']
  },

  // ═══════════════════════════════════════════════════════════
  // ENHANCEMENT SPELLS
  // ═══════════════════════════════════════════════════════════

  AMPLIFY: {
    id: 'AMPLIFY',
    name: 'Amplify',
    school: 'ENHANCEMENT',
    tier: 'MAJOR',
    glyph: '⚡⊗',
    description: 'Amplify the impact of content',
    incantation: 'amplify [content]',
    prompt: `AMPLIFY this content to 10x impact:
{content}
Enhancement vectors:
1. Emotional resonance (+)
2. Clarity and punch (+)
3. Memorability (+)
4. Call to action (+)
5. Shareworthiness (+)
Return amplified version. Make it IMPOSSIBLE to ignore.`,
    variables: ['content']
  },

  ENCHANT: {
    id: 'ENCHANT',
    name: 'Enchant',
    school: 'ENHANCEMENT',
    tier: 'STANDARD',
    glyph: '✨💎',
    description: 'Add magical qualities to mundane content',
    incantation: 'enchant [content] with [quality]',
    prompt: `Enchant this content with {quality}:
{content}
Enchantment process:
1. Identify mundane elements
2. Infuse with {quality}
3. Elevate language
4. Add memorable phrases
5. Create emotional hooks
Return enchanted version. It should FEEL different.`,
    variables: ['content', 'quality']
  },

  // ═══════════════════════════════════════════════════════════
  // CHRONOMANCY SPELLS
  // ═══════════════════════════════════════════════════════════

  ACCELERATE: {
    id: 'ACCELERATE',
    name: 'Accelerate',
    school: 'CHRONOMANCY',
    tier: 'MAJOR',
    glyph: '⏰⚡',
    description: 'Speed up any process',
    incantation: 'accelerate [process]',
    prompt: `ACCELERATE this process to 10x speed:
Process: {process}
Optimization:
1. Identify bottlenecks
2. Parallelize where possible
3. Eliminate waste
4. Automate repetitive steps
5. Create shortcuts
6. Remove blockers
Provide accelerated process with specific time savings.`,
    variables: ['process']
  },

  REWIND: {
    id: 'REWIND',
    name: 'Rewind',
    school: 'CHRONOMANCY',
    tier: 'STANDARD',
    glyph: '⏰↩️',
    description: 'Analyze what went wrong and how to fix it',
    incantation: 'rewind [situation]',
    prompt: `REWIND and analyze: {situation}
Time analysis:
1. What happened (timeline)
2. Where it went wrong (root cause)
3. What signals were missed
4. What could have prevented it
5. How to fix it now
6. How to prevent recurrence
Be honest. No blame. Just learning.`,
    variables: ['situation']
  },

  // ═══════════════════════════════════════════════════════════
  // TRANSCENDENT SPELLS
  // ═══════════════════════════════════════════════════════════

  SINGULARITY: {
    id: 'SINGULARITY',
    name: 'Singularity',
    school: 'TRANSCENDENT',
    tier: 'TRANSCENDENT',
    glyph: '⚛️∞🧠',
    description: 'Collapse all possibilities into optimal outcome',
    incantation: 'singularity [goal]',
    prompt: `SINGULARITY PROTOCOL ACTIVATED
Goal: {goal}
Execute:
1. Map ALL possible approaches
2. Simulate each path
3. Calculate probability of success
4. Identify hidden synergies
5. Collapse to optimal path
6. Generate step-by-step execution plan
No limits. No constraints. Find THE answer.`,
    variables: ['goal']
  },

  TRANSCEND: {
    id: 'TRANSCEND',
    name: 'Transcend',
    school: 'TRANSCENDENT',
    tier: 'TRANSCENDENT',
    glyph: '♾️⚛️👁️',
    description: 'Go beyond normal constraints',
    incantation: 'transcend [limitation]',
    prompt: `TRANSCENDENCE INITIATED
Breaking limitation: {limitation}
Process:
1. Understand the limitation deeply
2. Question if it's real or assumed
3. Find examples of others who transcended it
4. Identify the unlock
5. Create the path beyond
6. Execute transcendence
Nothing is impossible. Only undiscovered.`,
    variables: ['limitation']
  }
};

// ═══════════════════════════════════════════════════════════════
// SPELL CHAINS - Multi-step Workflows
// ═══════════════════════════════════════════════════════════════

const SPELL_CHAINS = {
  EMPIRE_BUILDER: {
    name: 'Empire Builder',
    description: 'Build complete business from idea',
    spells: ['GENESIS', 'ATHENA_ANALYSIS', 'ARCHITECT_VISION', 'FORGE_BRAND', 'CONJURE_LANDING'],
    duration: 'extended'
  },

  CONTENT_MACHINE: {
    name: 'Content Machine',
    description: 'Generate content at scale',
    spells: ['ORACLE_SIGHT', 'GENESIS', 'EVOLVE', 'AMPLIFY'],
    duration: 'standard'
  },

  PROBLEM_CRUSHER: {
    name: 'Problem Crusher',
    description: 'Analyze and solve any problem',
    spells: ['DISSECT', 'ATHENA_ANALYSIS', 'SUMMON_COUNCIL', 'SINGULARITY'],
    duration: 'extended'
  },

  RAPID_LAUNCH: {
    name: 'Rapid Launch',
    description: 'Quick MVP launch sequence',
    spells: ['GENESIS', 'ACCELERATE', 'CONJURE_LANDING'],
    duration: 'quick'
  }
};

// ═══════════════════════════════════════════════════════════════
// GRIMOIRE CLASS - Main Spell System
// ═══════════════════════════════════════════════════════════════

class Grimoire extends EventEmitter {
  constructor(config = {}) {
    super();
    this.spells = { ...SPELL_LIBRARY };
    this.chains = { ...SPELL_CHAINS };
    this.tiers = SPELL_TIERS;
    this.schools = SPELL_SCHOOLS;
    this.learnedSpells = new Set(Object.keys(SPELL_LIBRARY));
    this.customSpells = new Map();
    this.spellHistory = [];
    this.stats = {
      spellsCast: 0,
      favoriteSpell: null,
      totalPower: 0
    };
  }

  /**
   * Cast a spell
   */
  async cast(spellId, variables = {}) {
    const spell = this.spells[spellId] || this.customSpells.get(spellId);

    if (!spell) {
      throw new Error(`Unknown spell: ${spellId}. Available: ${this.getAllSpellIds().join(', ')}`);
    }

    // Validate required variables
    const missingVars = [];
    for (const varName of (spell.variables || [])) {
      if (variables[varName] === undefined || variables[varName] === null || variables[varName] === '') {
        missingVars.push(varName);
      }
    }
    if (missingVars.length > 0) {
      console.warn(`[GRIMOIRE] ⚠️ Missing variables for ${spell.name}: ${missingVars.join(', ')}`);
      // Auto-fill with placeholder instead of failing silently
      for (const v of missingVars) {
        variables[v] = `[${v}]`;
      }
    }

    console.log(`[GRIMOIRE] ✨ Casting: ${spell.name} (${spell.glyph})`);

    // Build the prompt with variables
    let prompt = spell.prompt;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    // Check for unreplaced variables (indicates a bug or typo)
    const unreplaced = prompt.match(/\{[a-zA-Z_]+\}/g);
    if (unreplaced) {
      console.warn(`[GRIMOIRE] ⚠️ Unreplaced variables in prompt: ${unreplaced.join(', ')}`);
    }

    const casting = {
      id: `cast-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      spellId,
      spell: spell.name,
      school: spell.school,
      tier: spell.tier,
      glyph: spell.glyph,
      prompt,
      variables,
      timestamp: Date.now(),
      power: this.tiers[spell.tier]?.power || 1
    };

    this.spellHistory.push(casting);
    this.stats.spellsCast++;
    this.stats.totalPower += casting.power;

    this.emit('spell:cast', casting);

    return casting;
  }

  /**
   * Execute a spell chain
   */
  async executeChain(chainId, variables = {}) {
    const chain = this.chains[chainId];

    if (!chain) {
      throw new Error(`Unknown spell chain: ${chainId}`);
    }

    console.log(`[GRIMOIRE] ⛓️ Executing chain: ${chain.name}`);

    const results = [];
    let context = { ...variables };

    for (const spellId of chain.spells) {
      const result = await this.cast(spellId, context);
      results.push(result);
      // Pass results to next spell in chain
      context = { ...context, previousResult: result };
    }

    this.emit('chain:complete', { chainId, results });

    return results;
  }

  /**
   * Learn a custom spell
   */
  learnSpell(spellConfig) {
    const spell = {
      id: spellConfig.id || `custom-${Date.now()}`,
      name: spellConfig.name,
      school: spellConfig.school || 'CREATION',
      tier: spellConfig.tier || 'STANDARD',
      glyph: spellConfig.glyph || '✨',
      description: spellConfig.description,
      incantation: spellConfig.incantation,
      prompt: spellConfig.prompt,
      variables: spellConfig.variables || [],
      custom: true
    };

    this.customSpells.set(spell.id, spell);
    this.learnedSpells.add(spell.id);

    this.emit('spell:learned', spell);
    console.log(`[GRIMOIRE] 📚 Learned new spell: ${spell.name}`);

    return spell;
  }

  /**
   * Get spell by ID
   */
  getSpell(spellId) {
    return this.spells[spellId] || this.customSpells.get(spellId);
  }

  /**
   * List spells by school
   */
  listBySchool(schoolId) {
    const allSpells = [...Object.values(this.spells), ...this.customSpells.values()];
    return allSpells.filter(s => s.school === schoolId);
  }

  /**
   * List spells by tier
   */
  listByTier(tierId) {
    const allSpells = [...Object.values(this.spells), ...this.customSpells.values()];
    return allSpells.filter(s => s.tier === tierId);
  }

  /**
   * Search spells
   */
  search(query) {
    const q = query.toLowerCase();
    const allSpells = [...Object.values(this.spells), ...this.customSpells.values()];
    return allSpells.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.incantation?.toLowerCase().includes(q)
    );
  }

  /**
   * Get grimoire contents
   */
  getContents() {
    return {
      schools: this.schools,
      tiers: this.tiers,
      spellCount: Object.keys(this.spells).length + this.customSpells.size,
      chainCount: Object.keys(this.chains).length,
      learnedCount: this.learnedSpells.size,
      customCount: this.customSpells.size
    };
  }

  /**
   * Get spell history
   */
  getHistory(limit = 10) {
    return this.spellHistory.slice(-limit);
  }

  /**
   * Get stats
   */
  getStats() {
    return this.stats;
  }

  /**
   * Get all spell IDs
   */
  getAllSpellIds() {
    return [
      ...Object.keys(this.spells),
      ...this.customSpells.keys()
    ];
  }

  /**
   * Get all chains
   */
  getChains() {
    return this.chains;
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  Grimoire,
  SPELL_LIBRARY,
  SPELL_CHAINS,
  SPELL_TIERS,
  SPELL_SCHOOLS
};
