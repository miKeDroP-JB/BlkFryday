/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██╗██████╗ ██╗███████╗                                                  ║
 * ║   ██║██╔══██╗██║██╔════╝                                                  ║
 * ║   ██║██████╔╝██║███████╗                                                  ║
 * ║   ██║██╔══██╗██║╚════██║                                                  ║
 * ║   ██║██║  ██║██║███████║                                                  ║
 * ║   ╚═╝╚═╝  ╚═╝╚═╝╚══════╝                                                  ║
 * ║                                                                           ║
 * ║   INTELLIGENCE RESEARCH INFORMATION SCOUT                                 ║
 * ║   Opportunities • Pain Points • Sentiment • Competitive Intel             ║
 * ║                                                                           ║
 * ║   "Find the signal in the noise"                                          ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');
const { parseJSON, generateId } = require('../utils');

// ═══════════════════════════════════════════════════════════════════════════
// OPPORTUNITY TYPES
// ═══════════════════════════════════════════════════════════════════════════

const OPPORTUNITY_TYPES = {
  BUILD: 'build',           // Something to create
  PARTNER: 'partner',       // Potential partnership
  MARKET_GAP: 'market_gap', // Unserved need
  TREND: 'trend',           // Emerging trend to ride
  ARBITRAGE: 'arbitrage',   // Price/info asymmetry
  ACQUISITION: 'acquisition' // Something to buy/acquire
};

// ═══════════════════════════════════════════════════════════════════════════
// INTEL SOURCES
// ═══════════════════════════════════════════════════════════════════════════

const INTEL_SOURCES = {
  ARTICLE: 'article',
  SOCIAL_MEDIA: 'social_media',
  FORUM: 'forum',
  REVIEW: 'review',
  COMMENT: 'comment',
  NEWS: 'news',
  RESEARCH: 'research',
  COMPETITOR: 'competitor'
};

// ═══════════════════════════════════════════════════════════════════════════
// IRIS AGENT CLASS
// ═══════════════════════════════════════════════════════════════════════════

class IrisAgent extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      aiEngine: config.aiEngine || null,
      watchKeywords: config.watchKeywords || [],
      watchCompetitors: config.watchCompetitors || [],
      watchDomains: config.watchDomains || ['AI', 'crypto', 'SaaS'],
      ...config
    };

    this.aiEngine = this.config.aiEngine;

    // Intel storage
    this.opportunities = [];
    this.painPoints = [];
    this.competitorMoves = [];
    this.trends = [];
    this.sentimentData = [];

    // Watch lists
    this.watchKeywords = new Set(this.config.watchKeywords);
    this.watchCompetitors = new Set(this.config.watchCompetitors);
  }

  /**
   * Set the AI engine
   */
  setAIEngine(engine) {
    this.aiEngine = engine;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ARTICLE ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Analyze an article for opportunities and insights
   */
  async analyzeArticle(article) {
    if (!this.aiEngine) {
      throw new Error('AI Engine not configured');
    }

    console.log(`[IRIS] Analyzing article: ${article.title || 'Untitled'}`);

    const systemPrompt = `You are IRIS, an intelligence scout analyzing content for business opportunities.

Your job:
1. Extract actionable opportunities (what could we BUILD based on this?)
2. Identify pain points mentioned (problems people have)
3. Spot market gaps (needs not being served)
4. Note competitive intelligence (what are others doing?)
5. Detect trends (what's emerging?)
6. Gauge sentiment (how do people feel about this topic?)

Be aggressive about finding opportunities. Think like an entrepreneur.

Respond in JSON:
{
  "summary": "2-3 sentence summary",
  "opportunities": [
    {
      "title": "...",
      "type": "build|partner|market_gap|trend|arbitrage|acquisition",
      "description": "...",
      "confidence": 0.0-1.0,
      "urgency": "immediate|soon|monitor",
      "suggestedAction": "..."
    }
  ],
  "painPoints": [
    {
      "problem": "...",
      "severity": "critical|high|medium|low",
      "audience": "who has this problem",
      "currentSolutions": "how people solve it now",
      "opportunity": "how we could solve it better"
    }
  ],
  "competitorIntel": [
    {
      "competitor": "...",
      "move": "what they did",
      "implication": "what it means for us"
    }
  ],
  "trends": [
    {
      "trend": "...",
      "direction": "up|down|stable",
      "timeframe": "...",
      "relevance": "why this matters"
    }
  ],
  "sentiment": {
    "overall": "positive|negative|neutral|mixed",
    "confidence": 0.0-1.0,
    "keyTakeaway": "..."
  },
  "keyQuotes": ["notable quotes from the article"],
  "actionItems": ["specific things to do based on this"]
}`;

    const content = `
Title: ${article.title || 'Unknown'}
Source: ${article.source || 'Unknown'}
Date: ${article.date || 'Unknown'}

Content:
${article.content || article.body || article.text || 'No content provided'}
`;

    const response = await this.aiEngine.run(systemPrompt, content, {
      temperature: 0.4
    });

    const result = parseJSON(response.content, 'IRIS');

    // Store findings
    if (result.opportunities) {
      this.opportunities.push(...result.opportunities.map(o => ({
        ...o,
        source: article.title || article.url,
        sourceType: INTEL_SOURCES.ARTICLE,
        foundAt: new Date().toISOString()
      })));
    }

    if (result.painPoints) {
      this.painPoints.push(...result.painPoints.map(p => ({
        ...p,
        source: article.title || article.url,
        foundAt: new Date().toISOString()
      })));
    }

    if (result.competitorIntel) {
      this.competitorMoves.push(...result.competitorIntel.map(c => ({
        ...c,
        source: article.title || article.url,
        foundAt: new Date().toISOString()
      })));
    }

    if (result.trends) {
      this.trends.push(...result.trends.map(t => ({
        ...t,
        source: article.title || article.url,
        foundAt: new Date().toISOString()
      })));
    }

    this.emit('article:analyzed', result);

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PAIN POINT EXTRACTION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Extract pain points from reviews, comments, forums
   */
  async extractPainPoints(content, source = {}) {
    if (!this.aiEngine) {
      throw new Error('AI Engine not configured');
    }

    console.log(`[IRIS] Extracting pain points from ${source.type || 'content'}...`);

    const systemPrompt = `You are IRIS, mining content for customer pain points and problems.

Look for:
1. Explicit complaints
2. Feature requests (implied problems)
3. Workarounds people mention (indicates unmet need)
4. Frustration expressions
5. Comparison statements ("I wish X was like Y")
6. Questions that reveal confusion or difficulty

Rate each pain point by:
- Severity: How much does this hurt?
- Frequency: How often mentioned?
- Monetizable: Would people pay to solve this?

Respond in JSON:
{
  "painPoints": [
    {
      "problem": "clear statement of the problem",
      "severity": "critical|high|medium|low",
      "frequency": "very_common|common|occasional|rare",
      "monetizable": true|false,
      "targetAudience": "who has this problem",
      "currentWorkarounds": "how they cope now",
      "quotes": ["actual quotes expressing this"],
      "solutionIdea": "how we could solve this"
    }
  ],
  "themes": ["recurring themes across pain points"],
  "biggestOpportunity": {
    "painPoint": "the most actionable one",
    "reasoning": "why this is the biggest opportunity"
  }
}`;

    const response = await this.aiEngine.run(systemPrompt, `Extract pain points from:\n\n${content}`, {
      temperature: 0.3
    });

    const result = parseJSON(response.content, 'IRIS');

    // Store findings
    if (result.painPoints) {
      this.painPoints.push(...result.painPoints.map(p => ({
        ...p,
        source: source.name || 'Unknown',
        sourceType: source.type || INTEL_SOURCES.FORUM,
        foundAt: new Date().toISOString()
      })));
    }

    this.emit('painpoints:extracted', result);

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COMPETITIVE INTELLIGENCE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Analyze competitor
   */
  async analyzeCompetitor(competitor) {
    if (!this.aiEngine) {
      throw new Error('AI Engine not configured');
    }

    console.log(`[IRIS] Analyzing competitor: ${competitor.name}`);

    const systemPrompt = `You are IRIS, conducting competitive intelligence analysis.

Analyze:
1. Their strengths (what they do well)
2. Their weaknesses (where they fall short)
3. Their positioning (how they present themselves)
4. Their pricing strategy
5. Their customer sentiment (if reviews provided)
6. Recent moves (what have they done lately)
7. Likely next moves (what will they probably do)

Identify:
- Where we can beat them
- Where we should avoid competing
- What we can learn from them
- Threats they pose
- Opportunities their gaps create

Respond in JSON:
{
  "competitor": "name",
  "overview": "2-3 sentence summary",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "positioning": "how they position themselves",
  "pricingStrategy": "...",
  "customerSentiment": "positive|negative|mixed",
  "recentMoves": ["..."],
  "likelyNextMoves": ["..."],
  "battleStrategy": {
    "whereToCompete": ["areas we can win"],
    "whereToAvoid": ["areas to not bother"],
    "thingsToSteal": ["good ideas to adopt"],
    "thingsToExploit": ["weaknesses to target"]
  },
  "threatLevel": "high|medium|low",
  "watchPriority": "high|medium|low"
}`;

    const context = `
Competitor: ${competitor.name}
Website: ${competitor.website || 'Unknown'}
Description: ${competitor.description || 'Unknown'}
Product: ${competitor.product || 'Unknown'}
Pricing: ${competitor.pricing || 'Unknown'}

Additional info:
${competitor.additionalInfo || 'None'}

Reviews/Feedback:
${competitor.reviews || 'None provided'}
`;

    const response = await this.aiEngine.run(systemPrompt, context, {
      temperature: 0.4
    });

    const result = parseJSON(response.content, 'IRIS');

    // Store intel
    this.competitorMoves.push({
      competitor: competitor.name,
      analysis: result,
      analyzedAt: new Date().toISOString()
    });

    // Add to watch list if high threat
    if (result.threatLevel === 'high') {
      this.watchCompetitors.add(competitor.name);
    }

    this.emit('competitor:analyzed', result);

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SENTIMENT ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Analyze sentiment from multiple sources
   */
  async analyzeSentiment(content, topic) {
    if (!this.aiEngine) {
      throw new Error('AI Engine not configured');
    }

    console.log(`[IRIS] Analyzing sentiment for: ${topic}`);

    const systemPrompt = `You are IRIS, analyzing market sentiment.

Determine:
1. Overall sentiment (positive/negative/neutral/mixed)
2. Sentiment strength (how strongly felt)
3. Key drivers of sentiment
4. Sentiment trajectory (improving/declining/stable)
5. Notable outliers (strong opinions worth noting)
6. Actionable insights (what should we do based on this)

Respond in JSON:
{
  "topic": "...",
  "overall": "positive|negative|neutral|mixed",
  "strength": 0.0-1.0,
  "drivers": {
    "positive": ["what people like"],
    "negative": ["what people dislike"]
  },
  "trajectory": "improving|declining|stable",
  "outliers": [
    {
      "sentiment": "positive|negative",
      "quote": "...",
      "significance": "why this matters"
    }
  ],
  "insights": ["actionable takeaways"],
  "recommendation": "what we should do based on this sentiment"
}`;

    const response = await this.aiEngine.run(systemPrompt, `Analyze sentiment for "${topic}":\n\n${content}`, {
      temperature: 0.3
    });

    const result = parseJSON(response.content, 'IRIS');

    // Store sentiment data
    this.sentimentData.push({
      topic,
      analysis: result,
      analyzedAt: new Date().toISOString()
    });

    this.emit('sentiment:analyzed', result);

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TREND DETECTION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Detect and analyze trends
   */
  async detectTrends(content, domain = 'general') {
    if (!this.aiEngine) {
      throw new Error('AI Engine not configured');
    }

    console.log(`[IRIS] Detecting trends in ${domain}...`);

    const systemPrompt = `You are IRIS, detecting emerging trends.

Look for:
1. New technologies/approaches gaining traction
2. Shifting consumer preferences
3. Regulatory changes
4. Market movements
5. Cultural shifts
6. Emerging problems (create new markets)

For each trend:
- Is it early stage or established?
- What's driving it?
- How long will it last?
- Who benefits/loses?
- What opportunities does it create?

Respond in JSON:
{
  "trends": [
    {
      "name": "trend name",
      "description": "what's happening",
      "stage": "emerging|growing|mature|declining",
      "drivers": ["what's causing this"],
      "timeframe": "expected duration",
      "winners": ["who benefits"],
      "losers": ["who loses"],
      "opportunities": ["what we could do"],
      "confidence": 0.0-1.0,
      "actionableNow": true|false
    }
  ],
  "metaTrend": "overarching theme connecting these trends",
  "recommendation": "top action to take based on these trends"
}`;

    const response = await this.aiEngine.run(systemPrompt, `Detect trends in ${domain}:\n\n${content}`, {
      temperature: 0.5
    });

    const result = parseJSON(response.content, 'IRIS');

    // Store trends
    if (result.trends) {
      this.trends.push(...result.trends.map(t => ({
        ...t,
        domain,
        detectedAt: new Date().toISOString()
      })));
    }

    this.emit('trends:detected', result);

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // OPPORTUNITY SCORING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Score and rank all opportunities
   */
  async scoreOpportunities() {
    if (!this.aiEngine) {
      throw new Error('AI Engine not configured');
    }

    if (this.opportunities.length === 0) {
      return { ranked: [], recommendation: 'No opportunities collected yet' };
    }

    console.log(`[IRIS] Scoring ${this.opportunities.length} opportunities...`);

    const systemPrompt = `You are IRIS, ranking opportunities by potential value.

Score each opportunity on:
1. Market size (TAM potential)
2. Feasibility (can we actually do this?)
3. Time to value (how fast can we capitalize?)
4. Competitive advantage (do we have an edge?)
5. Strategic fit (does this align with our strengths?)

Calculate an overall score and rank them.

Respond in JSON:
{
  "ranked": [
    {
      "title": "...",
      "overallScore": 0-100,
      "scores": {
        "marketSize": 0-100,
        "feasibility": 0-100,
        "timeToValue": 0-100,
        "competitiveAdvantage": 0-100,
        "strategicFit": 0-100
      },
      "reasoning": "why this ranks here",
      "nextStep": "specific action to pursue this"
    }
  ],
  "topPick": {
    "opportunity": "the #1 opportunity",
    "whyThisOne": "reasoning"
  },
  "quickWins": ["opportunities we could act on immediately"]
}`;

    const opportunities = this.opportunities.map(o => `
- ${o.title}
  Type: ${o.type}
  Description: ${o.description}
  Confidence: ${o.confidence}
  Source: ${o.source}
`).join('\n');

    const response = await this.aiEngine.run(systemPrompt, `Score these opportunities:\n${opportunities}`, {
      temperature: 0.3
    });

    const result = parseJSON(response.content, 'IRIS');

    this.emit('opportunities:scored', result);

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INTEL REPORT
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generate comprehensive intel report
   */
  async generateIntelReport() {
    if (!this.aiEngine) {
      throw new Error('AI Engine not configured');
    }

    console.log('[IRIS] Generating intel report...');

    const systemPrompt = `You are IRIS, creating an executive intelligence briefing.

Synthesize all gathered intelligence into:
1. Executive Summary (3-5 bullets)
2. Top Opportunities (ranked)
3. Critical Pain Points to Solve
4. Competitive Landscape
5. Trend Analysis
6. Recommended Actions (prioritized)

Make it scannable but comprehensive. This is for decision-making.`;

    const context = `
OPPORTUNITIES (${this.opportunities.length}):
${this.opportunities.slice(0, 20).map(o => `- [${o.type}] ${o.title}: ${o.description}`).join('\n')}

PAIN POINTS (${this.painPoints.length}):
${this.painPoints.slice(0, 20).map(p => `- [${p.severity}] ${p.problem}`).join('\n')}

COMPETITOR INTEL (${this.competitorMoves.length}):
${this.competitorMoves.slice(0, 10).map(c => `- ${c.competitor}: ${c.move || 'Analysis available'}`).join('\n')}

TRENDS (${this.trends.length}):
${this.trends.slice(0, 10).map(t => `- [${t.stage}] ${t.name || t.trend}: ${t.description || t.relevance}`).join('\n')}

SENTIMENT DATA (${this.sentimentData.length}):
${this.sentimentData.slice(0, 5).map(s => `- ${s.topic}: ${s.analysis?.overall || 'analyzed'}`).join('\n')}
`;

    const response = await this.aiEngine.run(systemPrompt, context, {
      temperature: 0.5
    });

    const report = {
      generatedAt: new Date().toISOString(),
      content: response.content,
      stats: {
        opportunities: this.opportunities.length,
        painPoints: this.painPoints.length,
        competitorMoves: this.competitorMoves.length,
        trends: this.trends.length,
        sentimentAnalyses: this.sentimentData.length
      }
    };

    this.emit('report:generated', report);

    return report;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // WATCH LIST MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Add keyword to watch
   */
  addWatchKeyword(keyword) {
    this.watchKeywords.add(keyword.toLowerCase());
    this.emit('watch:keyword:added', keyword);
  }

  /**
   * Add competitor to watch
   */
  addWatchCompetitor(competitor) {
    this.watchCompetitors.add(competitor);
    this.emit('watch:competitor:added', competitor);
  }

  /**
   * Get watch lists
   */
  getWatchLists() {
    return {
      keywords: Array.from(this.watchKeywords),
      competitors: Array.from(this.watchCompetitors),
      domains: this.config.watchDomains
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get full status
   */
  getStatus() {
    return {
      opportunities: {
        total: this.opportunities.length,
        byType: {
          build: this.opportunities.filter(o => o.type === 'build').length,
          market_gap: this.opportunities.filter(o => o.type === 'market_gap').length,
          trend: this.opportunities.filter(o => o.type === 'trend').length,
          other: this.opportunities.filter(o => !['build', 'market_gap', 'trend'].includes(o.type)).length
        }
      },
      painPoints: {
        total: this.painPoints.length,
        critical: this.painPoints.filter(p => p.severity === 'critical').length,
        high: this.painPoints.filter(p => p.severity === 'high').length
      },
      competitors: {
        tracked: this.competitorMoves.length,
        watching: this.watchCompetitors.size
      },
      trends: {
        total: this.trends.length,
        emerging: this.trends.filter(t => t.stage === 'emerging').length
      },
      watchLists: {
        keywords: this.watchKeywords.size,
        competitors: this.watchCompetitors.size
      }
    };
  }

  /**
   * Clear all intel (fresh start)
   */
  clearIntel() {
    this.opportunities = [];
    this.painPoints = [];
    this.competitorMoves = [];
    this.trends = [];
    this.sentimentData = [];
    this.emit('intel:cleared');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  IrisAgent,
  OPPORTUNITY_TYPES,
  INTEL_SOURCES
};
