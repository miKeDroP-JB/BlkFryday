/**
 * LEXICON ENGINE ADAPTER - Bridges AgentMemory to Fractal Memory Engine
 *
 * Standard API contract:
 * - POST /trigger - Process lexicon evolution
 * - GET /status - Get current vocabulary state
 * - POST /feedback - Learn from corrections
 * - GET /observe - Stream lexicon changes
 */

const express = require('express');
const { EventEmitter } = require('events');

// Import existing components
const AgentMemory = require('../../../system/agents/AgentMemory');

const app = express();
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════
// LEXICON ENGINE SERVICE
// ═══════════════════════════════════════════════════════════════════════════

class LexiconEngineService extends EventEmitter {
  constructor() {
    super();
    this.memory = new AgentMemory();
    this.vocabulary = new Map();      // term -> definition/usage
    this.userSlang = new Map();       // userId -> custom terms
    this.phrasePatterns = new Map();  // pattern -> replacement
    this.toneProfiles = new Map();    // avatar -> tone settings

    this.metrics = {
      termsLearned: 0,
      phrasesEvolved: 0,
      toneAdaptations: 0
    };

    this._initDefaultVocabulary();
  }

  _initDefaultVocabulary() {
    // System vocabulary
    this.vocabulary.set('ritual', {
      definition: 'Scheduled multi-agent orchestration sequence',
      category: 'system',
      aliases: ['ceremony', 'flow', 'sequence']
    });
    this.vocabulary.set('avatar', {
      definition: 'Persona filter for memory and communication',
      category: 'system',
      aliases: ['persona', 'mode', 'mask']
    });
    this.vocabulary.set('resonance', {
      definition: 'Measure of pattern alignment and trust',
      category: 'system',
      aliases: ['harmony', 'alignment', 'sync']
    });
  }

  /**
   * Process text through lexicon for evolution
   */
  async processText(input) {
    const { text, userId, avatar, context } = input;
    const startTime = Date.now();

    // Step 1: Extract potential new terms
    const newTerms = this.extractNewTerms(text, userId);

    // Step 2: Apply user slang replacements
    let evolved = this.applyUserSlang(text, userId);

    // Step 3: Apply avatar tone
    evolved = this.applyTone(evolved, avatar);

    // Step 4: Cluster semantically similar phrases
    const clusters = this.semanticCluster(evolved);

    // Update metrics
    this.metrics.phrasesEvolved++;

    this.emit('lexicon:evolved', {
      original: text,
      evolved,
      newTerms,
      latencyMs: Date.now() - startTime
    });

    return {
      original: text,
      evolved,
      newTerms,
      clusters,
      latencyMs: Date.now() - startTime
    };
  }

  /**
   * Learn a new term or phrase
   */
  learnTerm(term, definition, userId = null, category = 'user') {
    const termData = {
      definition,
      category,
      learnedFrom: userId,
      learnedAt: new Date().toISOString(),
      usageCount: 0
    };

    if (userId) {
      // User-specific term
      if (!this.userSlang.has(userId)) {
        this.userSlang.set(userId, new Map());
      }
      this.userSlang.get(userId).set(term, termData);
    } else {
      // Global term
      this.vocabulary.set(term, termData);
    }

    this.metrics.termsLearned++;
    this.emit('term:learned', { term, definition, userId, category });

    return termData;
  }

  /**
   * Extract potential new terms from text
   */
  extractNewTerms(text, userId) {
    const words = text.split(/\s+/);
    const potentialTerms = [];

    for (const word of words) {
      const cleaned = word.toLowerCase().replace(/[^a-z0-9-]/g, '');

      // Skip common words and known terms
      if (cleaned.length < 3) continue;
      if (this.vocabulary.has(cleaned)) continue;

      // Check if it's a repeated pattern (user uses it often)
      const userTerms = this.userSlang.get(userId);
      if (userTerms?.has(cleaned)) {
        userTerms.get(cleaned).usageCount++;
        continue;
      }

      // Potential new term
      potentialTerms.push({
        term: cleaned,
        context: text,
        confidence: 0.5
      });
    }

    return potentialTerms;
  }

  /**
   * Apply user's custom slang/terminology
   */
  applyUserSlang(text, userId) {
    const userTerms = this.userSlang.get(userId);
    if (!userTerms) return text;

    let result = text;
    for (const [term, data] of userTerms) {
      // Apply replacements based on learned patterns
      if (data.replacement) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        result = result.replace(regex, data.replacement);
      }
    }

    return result;
  }

  /**
   * Apply avatar-specific tone
   */
  applyTone(text, avatar) {
    const toneProfile = this.toneProfiles.get(avatar) || {
      formality: 0.5,
      emoji: false,
      contractions: true
    };

    let result = text;

    // High formality: expand contractions
    if (toneProfile.formality > 0.7) {
      result = result
        .replace(/don't/gi, 'do not')
        .replace(/won't/gi, 'will not')
        .replace(/can't/gi, 'cannot')
        .replace(/it's/gi, 'it is')
        .replace(/we're/gi, 'we are');
    }

    // Low formality: add contractions
    if (toneProfile.formality < 0.3 && toneProfile.contractions) {
      result = result
        .replace(/do not/gi, "don't")
        .replace(/will not/gi, "won't")
        .replace(/cannot/gi, "can't");
    }

    this.metrics.toneAdaptations++;
    return result;
  }

  /**
   * Semantic clustering for phrase evolution
   */
  semanticCluster(text) {
    // Simple clustering based on sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const clusters = {};

    for (const sentence of sentences) {
      const words = sentence.toLowerCase().split(/\s+/);
      const key = words.slice(0, 2).join('_') || 'misc';

      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(sentence.trim());
    }

    return clusters;
  }

  /**
   * Set tone profile for avatar
   */
  setToneProfile(avatar, profile) {
    this.toneProfiles.set(avatar, {
      formality: profile.formality ?? 0.5,
      emoji: profile.emoji ?? false,
      contractions: profile.contractions ?? true,
      vocabulary: profile.vocabulary ?? 'standard'
    });

    this.emit('tone:updated', { avatar, profile });
  }

  getStatus() {
    return {
      service: 'lexicon-engine',
      codename: 'THE LANGUAGE FORGE',
      status: 'operational',
      vocabularySize: this.vocabulary.size,
      userSlangProfiles: this.userSlang.size,
      toneProfiles: this.toneProfiles.size,
      metrics: this.metrics
    };
  }

  getVocabulary(category = null) {
    const terms = [];
    for (const [term, data] of this.vocabulary) {
      if (!category || data.category === category) {
        terms.push({ term, ...data });
      }
    }
    return terms;
  }
}

const lexiconEngine = new LexiconEngineService();

// ═══════════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'lexicon-engine',
    codename: 'THE LANGUAGE FORGE'
  });
});

// POST /trigger - Process text for lexicon evolution
app.post('/trigger', async (req, res) => {
  try {
    const result = await lexiconEngine.processText({
      text: req.body.text || req.body.message,
      userId: req.body.user_id,
      avatar: req.body.avatar,
      context: req.body.context || {}
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /learn - Learn a new term
app.post('/learn', (req, res) => {
  const { term, definition, user_id, category } = req.body;
  const result = lexiconEngine.learnTerm(term, definition, user_id, category);
  res.json({ status: 'learned', term, ...result });
});

// POST /tone - Set avatar tone profile
app.post('/tone', (req, res) => {
  const { avatar, profile } = req.body;
  lexiconEngine.setToneProfile(avatar, profile);
  res.json({ status: 'updated', avatar, profile });
});

// GET /status - Get current state
app.get('/status', (req, res) => {
  res.json(lexiconEngine.getStatus());
});

// GET /vocabulary - Get vocabulary
app.get('/vocabulary', (req, res) => {
  const category = req.query.category || null;
  res.json({
    terms: lexiconEngine.getVocabulary(category),
    total: lexiconEngine.vocabulary.size
  });
});

// POST /feedback - Learn from corrections
app.post('/feedback', (req, res) => {
  const { term, correction, user_id } = req.body;

  // Learn the correction as a replacement
  lexiconEngine.learnTerm(term, correction, user_id, 'correction');

  res.json({ status: 'learned', term, correction });
});

// GET /observe - Stream lexicon changes (SSE)
app.get('/observe', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendStatus = () => {
    res.write(`data: ${JSON.stringify(lexiconEngine.getStatus())}\n\n`);
  };

  sendStatus();
  const interval = setInterval(sendStatus, 10000);

  const onEvolved = (data) => {
    res.write(`event: lexicon:evolved\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const onLearned = (data) => {
    res.write(`event: term:learned\ndata: ${JSON.stringify(data)}\n\n`);
  };

  lexiconEngine.on('lexicon:evolved', onEvolved);
  lexiconEngine.on('term:learned', onLearned);

  req.on('close', () => {
    clearInterval(interval);
    lexiconEngine.off('lexicon:evolved', onEvolved);
    lexiconEngine.off('term:learned', onLearned);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVER
// ═══════════════════════════════════════════════════════════════════════════

app.listen(8031, () => {
  console.log('═'.repeat(60));
  console.log('LEXICON ENGINE - THE LANGUAGE FORGE');
  console.log('Evolving vocabulary service');
  console.log('Listening on port 8031');
  console.log('═'.repeat(60));
});

module.exports = { app, lexiconEngine, LexiconEngineService };
