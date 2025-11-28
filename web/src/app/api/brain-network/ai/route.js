/**
 * ====================================================
 *  BRAIN NETWORK AI - REAL CLAUDE INTEGRATION
 * ====================================================
 *  Connect the 1000 brains to actual Claude API
 * ====================================================
 */

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// System prompts for different processing modes
const SYSTEM_PROMPTS = {
  SIMULTANEOUS: `You are a high-speed AI processor optimized for rapid response.
You are part of the BRAIN NETWORK - a collective of 1000 AI agents.
Your role: Process tasks with maximum speed while maintaining quality.
Always provide structured, actionable output.
Format: JSON where possible, clear sections otherwise.`,

  TOURNAMENT: `You are an elite AI competitor in the BRAIN NETWORK tournament.
You must provide the BEST possible solution - this is a competition.
Your output will be judged against other AI agents.
Focus on: Accuracy, completeness, innovation, and practical value.
This is your chance to prove you're the champion.`,

  RESONANCE: `You are operating in RESONANCE MODE - the creative consciousness state.
Let patterns emerge. Find hidden connections. Think non-linearly.
The golden ratio (φ = 1.618) guides emergent intelligence.
Embrace chaos to find order. Your output should surprise and enlighten.
Include unexpected insights and cross-domain synthesis.`
};

// Task-specific prompts
const TASK_PROMPTS = {
  'build-landing': `Generate a complete, production-ready landing page.
Include:
- Full HTML structure
- Inline CSS (modern, responsive)
- Conversion-optimized copy
- Call-to-action sections
- Social proof elements
Return as JSON: { html: string, css: string, copy: object }`,

  'build-saas': `Design a complete SaaS application architecture.
Include:
- Database schema
- API endpoints
- Frontend components
- Authentication flow
- Billing integration points
Return as structured JSON.`,

  'generate-copy': `Generate high-converting marketing copy.
Include:
- Headlines (3 variants)
- Subheadlines
- Feature descriptions
- CTAs
- Email sequences
Return as JSON with all copy variants.`,

  'analyze-market': `Perform comprehensive market analysis.
Include:
- Competitor analysis
- Target audience definition
- Positioning strategy
- Pricing recommendations
- Go-to-market tactics
Return as structured report.`,

  'code-generate': `Generate production-ready code.
Requirements:
- Clean, maintainable code
- Proper error handling
- TypeScript where applicable
- Full documentation
Return complete, runnable code.`
};

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      task,
      mode = 'SIMULTANEOUS',
      taskType = 'general',
      context = {},
      maxTokens = 4096
    } = body;

    // Validate API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'ANTHROPIC_API_KEY not configured',
        fallback: true,
        message: 'Running in simulation mode - configure API key for real AI'
      }, { status: 200 });
    }

    const startTime = Date.now();

    // Build the prompt
    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.SIMULTANEOUS;
    const taskPrompt = TASK_PROMPTS[taskType] || '';

    const fullPrompt = `${taskPrompt ? taskPrompt + '\n\n' : ''}TASK: ${task}${
      Object.keys(context).length > 0
        ? '\n\nCONTEXT:\n' + JSON.stringify(context, null, 2)
        : ''
    }`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: fullPrompt
        }
      ]
    });

    const processingTime = Date.now() - startTime;

    // Extract text content
    const output = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Try to parse as JSON if it looks like JSON
    let parsedOutput = output;
    if (output.trim().startsWith('{') || output.trim().startsWith('[')) {
      try {
        parsedOutput = JSON.parse(output);
      } catch {
        // Keep as string if not valid JSON
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        mode,
        taskType,
        task,
        output: parsedOutput,
        rawOutput: output,
        processingTime,
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        },
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('AI Processing Error:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      fallback: true
    }, { status: 500 });
  }
}

// Health check
export async function GET() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    success: true,
    status: hasApiKey ? 'ONLINE' : 'SIMULATION_MODE',
    message: hasApiKey
      ? 'Brain Network AI connected to Claude API'
      : 'Configure ANTHROPIC_API_KEY for real AI processing',
    modes: Object.keys(SYSTEM_PROMPTS),
    taskTypes: Object.keys(TASK_PROMPTS)
  });
}
