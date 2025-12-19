/**
 * ====================================================
 *  V11.5 GRIMOIRE API - Spell Casting System
 * ====================================================
 *  Bridges frontend GrimoireUI to backend Grimoire system
 *  - Cast spells with variable binding
 *  - Return spell results
 *  - Manage spell catalog
 * ====================================================
 */

import { NextResponse } from 'next/server';

// Spell catalog (synced with Grimoire.js)
const SPELL_CATALOG = {
  'landing-page': {
    id: 'landing-page',
    name: 'Conjure Landing Page',
    category: 'BUILD',
    glyph: '\u2B22\u25B3\uD83D\uDE80',
    incantation: 'By the power of {swarm}, manifest a landing page for {company} selling {product}',
    variables: ['swarm', 'company', 'product'],
    effect: 'GENERATE_LANDING'
  },
  'brand-identity': {
    id: 'brand-identity',
    name: 'Forge Brand Identity',
    category: 'BUILD',
    glyph: '\u2640\uD83C\uDFA8\u25C7',
    incantation: 'Forge a complete brand identity for {company} in the {industry} space',
    variables: ['company', 'industry'],
    effect: 'GENERATE_BRAND'
  },
  'analyze-code': {
    id: 'analyze-code',
    name: 'Oracle Sight',
    category: 'ANALYZE',
    glyph: '\uD83D\uDD2E\uD83E\uDDE0\uD83D\uDC41\uFE0F',
    incantation: 'With Oracle sight, analyze {code} for {purpose}',
    variables: ['code', 'purpose'],
    effect: 'ANALYZE_CODE'
  },
  'summon-swarm': {
    id: 'summon-swarm',
    name: 'Summon Swarm Legion',
    category: 'SUMMON',
    glyph: '\uD83D\uDC1D\u26A1\u2295',
    incantation: 'Rise, {swarm} swarm! Execute {task} with full force!',
    variables: ['swarm', 'task'],
    effect: 'ACTIVATE_SWARM'
  },
  'transcend': {
    id: 'transcend',
    name: 'GODMODE Transcendence',
    category: 'TRANSCEND',
    glyph: '\u269B\uFE0F\uD83E\uDDE0\u221E',
    incantation: 'By quantum entanglement, transcend all limits for {goal}',
    variables: ['goal'],
    effect: 'ACTIVATE_GODMODE'
  },
  'transform-content': {
    id: 'transform-content',
    name: 'Transmute Content',
    category: 'TRANSFORM',
    glyph: '\u2728\u25BD\u25B3',
    incantation: 'Transform {source} into {target} with {style} essence',
    variables: ['source', 'target', 'style'],
    effect: 'TRANSFORM_CONTENT'
  },
  'summon-agent': {
    id: 'summon-agent',
    name: 'Divine Summoning',
    category: 'SUMMON',
    glyph: '\u2728\u26A1\uD83C\uDF1F',
    incantation: 'From the Pantheon, I summon {agent} for {purpose}!',
    variables: ['agent', 'purpose'],
    effect: 'SUMMON_AGENT'
  },
  'quick-build': {
    id: 'quick-build',
    name: 'Speed Creation',
    category: 'BUILD',
    glyph: '\u26A1\u2B22\uD83D\uDE80',
    incantation: 'With lightning speed, create {type} for {name}',
    variables: ['type', 'name'],
    effect: 'QUICK_BUILD'
  }
};

// Spell casting state
let castingState = {
  totalCasts: 0,
  successfulCasts: 0,
  spellUsage: {}
};

/**
 * POST - Cast a spell
 */
export async function POST(request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { spellId, variables = {}, userId = 'default' } = body;

    // Validate spell exists
    const spell = SPELL_CATALOG[spellId];
    if (!spell) {
      return NextResponse.json({
        success: false,
        error: `Unknown spell: ${spellId}`
      }, { status: 400 });
    }

    // Validate required variables
    const missingVars = spell.variables.filter(v =>
      variables[v] === undefined || variables[v] === null || variables[v] === ''
    );

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required variables: ${missingVars.join(', ')}`
      }, { status: 400 });
    }

    // Resolve incantation with variables
    let resolvedIncantation = spell.incantation;
    for (const [varName, value] of Object.entries(variables)) {
      resolvedIncantation = resolvedIncantation.replace(
        new RegExp(`\\{${varName}\\}`, 'g'),
        value
      );
    }

    // Execute spell effect
    const effect = await executeSpellEffect(spell.effect, variables, userId);

    // Update stats
    castingState.totalCasts++;
    if (effect.success) {
      castingState.successfulCasts++;
    }
    castingState.spellUsage[spellId] = (castingState.spellUsage[spellId] || 0) + 1;

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        spellId,
        spellName: spell.name,
        glyph: spell.glyph,
        resolvedIncantation,
        variables,
        effect: spell.effect,
        output: effect.output,
        executionTime,
        userId
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * GET - Get spell catalog or status
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'catalog';

  switch (action) {
    case 'catalog':
      return NextResponse.json({
        success: true,
        data: Object.values(SPELL_CATALOG)
      });

    case 'status':
      return NextResponse.json({
        success: true,
        data: {
          ...castingState,
          successRate: castingState.totalCasts > 0
            ? ((castingState.successfulCasts / castingState.totalCasts) * 100).toFixed(1) + '%'
            : 'N/A',
          totalSpells: Object.keys(SPELL_CATALOG).length,
          categories: [...new Set(Object.values(SPELL_CATALOG).map(s => s.category))]
        }
      });

    case 'spell':
      const spellId = searchParams.get('id');
      const spell = SPELL_CATALOG[spellId];

      if (!spell) {
        return NextResponse.json({
          success: false,
          error: 'Spell not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: spell
      });

    default:
      return NextResponse.json({
        success: false,
        error: 'Unknown action'
      }, { status: 400 });
  }
}

/**
 * Execute spell effect
 */
async function executeSpellEffect(effect, variables, userId) {
  switch (effect) {
    case 'GENERATE_LANDING':
      return {
        success: true,
        output: {
          type: 'landing_page',
          company: variables.company,
          product: variables.product,
          status: 'generated',
          message: `Landing page for ${variables.company} selling ${variables.product} is being generated by ${variables.swarm || 'ALPHA'} swarm`
        }
      };

    case 'GENERATE_BRAND':
      return {
        success: true,
        output: {
          type: 'brand_identity',
          company: variables.company,
          industry: variables.industry,
          status: 'generated',
          components: ['logo', 'colors', 'typography', 'voice', 'guidelines'],
          message: `Brand identity for ${variables.company} in ${variables.industry} is being forged`
        }
      };

    case 'ANALYZE_CODE':
      return {
        success: true,
        output: {
          type: 'analysis',
          purpose: variables.purpose,
          status: 'analyzing',
          message: `Oracle sight analyzing code for ${variables.purpose}`
        }
      };

    case 'ACTIVATE_SWARM':
      return {
        success: true,
        output: {
          type: 'swarm_activation',
          swarm: variables.swarm,
          task: variables.task,
          status: 'activated',
          agents: 100,
          message: `${variables.swarm} swarm activated with 100 agents executing: ${variables.task}`
        }
      };

    case 'ACTIVATE_GODMODE':
      return {
        success: true,
        output: {
          type: 'godmode',
          goal: variables.goal,
          status: 'transcended',
          multiplier: '10x',
          message: `GODMODE activated - All limits transcended for: ${variables.goal}`
        }
      };

    case 'TRANSFORM_CONTENT':
      return {
        success: true,
        output: {
          type: 'transformation',
          source: variables.source,
          target: variables.target,
          style: variables.style,
          status: 'transforming',
          message: `Transmuting ${variables.source} into ${variables.target} with ${variables.style} essence`
        }
      };

    case 'SUMMON_AGENT':
      return {
        success: true,
        output: {
          type: 'agent_summon',
          agent: variables.agent,
          purpose: variables.purpose,
          status: 'summoned',
          message: `${variables.agent} has been summoned for ${variables.purpose}`
        }
      };

    case 'QUICK_BUILD':
      return {
        success: true,
        output: {
          type: 'quick_build',
          buildType: variables.type,
          name: variables.name,
          status: 'building',
          message: `Speed creating ${variables.type} for ${variables.name}`
        }
      };

    default:
      return {
        success: false,
        output: {
          error: `Unknown effect: ${effect}`
        }
      };
  }
}
