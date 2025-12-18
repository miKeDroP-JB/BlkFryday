// ============================================================
//  ORBOS V11.5 - KNOWLEDGE STORE
//  Persistent learning & memory system
// ============================================================
//
//  "Everything ORBOS learns, it remembers"
//  Aggregates knowledge from all AI providers into unified memory
//
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class KnowledgeStore {
  constructor(config = {}) {
    this.config = config;
    this.dataDir = config.dataDir || path.join(__dirname, '../../data/knowledge-store');
    this.indexDir = path.join(this.dataDir, 'indices');
    this.chunksDir = path.join(this.dataDir, 'chunks');
    this.ensureDirectories();

    // In-memory index for fast lookups
    this.memoryIndex = new Map();
    this.tagIndex = new Map();
    this.typeIndex = new Map();

    // Knowledge categories
    this.categories = {
      CODE: 'code',
      FACTS: 'facts',
      PROCEDURES: 'procedures',
      CONCEPTS: 'concepts',
      PATTERNS: 'patterns',
      ERRORS: 'errors',
      SOLUTIONS: 'solutions'
    };

    // Load existing indices
    this.loadIndices();

    console.log(`[KnowledgeStore] Initialized with ${this.memoryIndex.size} entries`);
  }

  ensureDirectories() {
    [this.dataDir, this.indexDir, this.chunksDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadIndices() {
    const mainIndexPath = path.join(this.indexDir, 'main.json');
    if (fs.existsSync(mainIndexPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(mainIndexPath, 'utf8'));
        data.entries.forEach(entry => {
          this.memoryIndex.set(entry.id, entry);

          // Build tag index
          (entry.tags || []).forEach(tag => {
            if (!this.tagIndex.has(tag)) this.tagIndex.set(tag, []);
            this.tagIndex.get(tag).push(entry.id);
          });

          // Build type index
          if (!this.typeIndex.has(entry.type)) this.typeIndex.set(entry.type, []);
          this.typeIndex.get(entry.type).push(entry.id);
        });
      } catch (error) {
        console.error('[KnowledgeStore] Failed to load indices:', error.message);
      }
    }
  }

  saveIndices() {
    const mainIndexPath = path.join(this.indexDir, 'main.json');
    const entries = Array.from(this.memoryIndex.values());

    fs.writeFileSync(mainIndexPath, JSON.stringify({
      version: '1.0',
      updatedAt: Date.now(),
      count: entries.length,
      entries
    }, null, 2));
  }

  // ============================================================
  //  KNOWLEDGE INGESTION
  // ============================================================

  async store(knowledge) {
    const {
      content,
      type = 'general',
      source = 'unknown',
      tags = [],
      metadata = {}
    } = knowledge;

    // Generate unique ID
    const id = crypto.randomUUID();

    // Create embedding/hash for similarity matching
    const contentHash = this.hashContent(content);

    // Check for duplicates
    const duplicate = this.findDuplicate(contentHash);
    if (duplicate) {
      console.log(`[KnowledgeStore] Duplicate detected, merging with ${duplicate.id}`);
      return this.mergeKnowledge(duplicate.id, knowledge);
    }

    // Chunk large content
    const chunks = this.chunkContent(content);

    // Create entry
    const entry = {
      id,
      type,
      source,
      tags: [...new Set(tags)],
      contentHash,
      chunkCount: chunks.length,
      summary: this.summarize(content),
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessed: null,
      metadata
    };

    // Store chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunkPath = path.join(this.chunksDir, `${id}_${i}.txt`);
      fs.writeFileSync(chunkPath, chunks[i]);
    }

    // Update indices
    this.memoryIndex.set(id, entry);

    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) this.tagIndex.set(tag, []);
      this.tagIndex.get(tag).push(id);
    });

    if (!this.typeIndex.has(type)) this.typeIndex.set(type, []);
    this.typeIndex.get(type).push(id);

    // Persist
    this.saveIndices();

    console.log(`[KnowledgeStore] Stored: ${id} (${type}, ${chunks.length} chunks)`);

    return { id, entry };
  }

  async storeCodePattern(pattern) {
    const { code, language, description, useCase, examples } = pattern;

    return this.store({
      content: JSON.stringify({ code, description, useCase, examples }),
      type: this.categories.CODE,
      source: 'code-aggregator',
      tags: [language, 'pattern', ...(pattern.tags || [])],
      metadata: {
        language,
        complexity: this.estimateComplexity(code),
        lineCount: code.split('\n').length
      }
    });
  }

  async storeSolution(solution) {
    const { problem, solution: sol, steps, tags } = solution;

    return this.store({
      content: JSON.stringify({ problem, solution: sol, steps }),
      type: this.categories.SOLUTIONS,
      source: solution.source || 'ai-response',
      tags: ['solution', ...(tags || [])],
      metadata: {
        stepCount: steps?.length || 0,
        verified: solution.verified || false
      }
    });
  }

  async storeFact(fact) {
    const { statement, confidence, source, context } = fact;

    return this.store({
      content: statement,
      type: this.categories.FACTS,
      source,
      tags: ['fact', ...(context?.tags || [])],
      metadata: {
        confidence,
        context
      }
    });
  }

  // ============================================================
  //  KNOWLEDGE RETRIEVAL
  // ============================================================

  async retrieve(id) {
    const entry = this.memoryIndex.get(id);
    if (!entry) return null;

    // Load chunks
    const chunks = [];
    for (let i = 0; i < entry.chunkCount; i++) {
      const chunkPath = path.join(this.chunksDir, `${id}_${i}.txt`);
      if (fs.existsSync(chunkPath)) {
        chunks.push(fs.readFileSync(chunkPath, 'utf8'));
      }
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.saveIndices();

    return {
      ...entry,
      content: chunks.join('')
    };
  }

  async search(query, options = {}) {
    const {
      type,
      tags = [],
      limit = 20,
      minScore = 0.3
    } = options;

    let candidates = Array.from(this.memoryIndex.values());

    // Filter by type
    if (type) {
      candidates = candidates.filter(e => e.type === type);
    }

    // Filter by tags
    if (tags.length > 0) {
      candidates = candidates.filter(e =>
        tags.some(tag => e.tags.includes(tag))
      );
    }

    // Score by relevance to query
    const scored = candidates.map(entry => ({
      entry,
      score: this.scoreRelevance(entry, query)
    }));

    // Filter and sort
    const results = scored
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results.map(r => ({
      ...r.entry,
      relevanceScore: r.score
    }));
  }

  async searchByTag(tag, limit = 50) {
    const ids = this.tagIndex.get(tag) || [];
    return ids.slice(0, limit).map(id => this.memoryIndex.get(id)).filter(Boolean);
  }

  async searchByType(type, limit = 50) {
    const ids = this.typeIndex.get(type) || [];
    return ids.slice(0, limit).map(id => this.memoryIndex.get(id)).filter(Boolean);
  }

  async findSimilar(id, limit = 10) {
    const entry = this.memoryIndex.get(id);
    if (!entry) return [];

    // Find by overlapping tags
    const tagScores = new Map();

    entry.tags.forEach(tag => {
      const related = this.tagIndex.get(tag) || [];
      related.forEach(relatedId => {
        if (relatedId !== id) {
          tagScores.set(relatedId, (tagScores.get(relatedId) || 0) + 1);
        }
      });
    });

    // Sort by score
    const sorted = Array.from(tagScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([relatedId, score]) => ({
      ...this.memoryIndex.get(relatedId),
      similarity: score / entry.tags.length
    }));
  }

  // ============================================================
  //  KNOWLEDGE SYNTHESIS
  // ============================================================

  async synthesize(query, options = {}) {
    // Find relevant knowledge
    const results = await this.search(query, { limit: 10, ...options });

    if (results.length === 0) {
      return { synthesized: false, reason: 'No relevant knowledge found' };
    }

    // Load full content for top results
    const fullResults = await Promise.all(
      results.slice(0, 5).map(r => this.retrieve(r.id))
    );

    // Combine and structure
    const synthesis = {
      query,
      timestamp: Date.now(),
      sources: fullResults.map(r => ({
        id: r.id,
        type: r.type,
        summary: r.summary,
        relevance: r.relevanceScore
      })),
      combinedContent: fullResults.map(r => r.content).join('\n\n---\n\n'),
      recommendations: this.generateRecommendations(fullResults)
    };

    return synthesis;
  }

  generateRecommendations(results) {
    const recs = [];

    // Most accessed
    const mostUsed = results.sort((a, b) => b.accessCount - a.accessCount)[0];
    if (mostUsed) {
      recs.push({
        type: 'popular',
        message: `Most referenced: ${mostUsed.summary}`,
        id: mostUsed.id
      });
    }

    // Code patterns
    const codeResults = results.filter(r => r.type === this.categories.CODE);
    if (codeResults.length > 0) {
      recs.push({
        type: 'code',
        message: `${codeResults.length} code patterns available`,
        ids: codeResults.map(r => r.id)
      });
    }

    return recs;
  }

  // ============================================================
  //  LEARNING FROM INTERACTIONS
  // ============================================================

  async learnFromInteraction(interaction) {
    const { query, response, provider, feedback } = interaction;

    // Store the interaction
    await this.store({
      content: JSON.stringify({ query, response }),
      type: 'interaction',
      source: provider,
      tags: this.extractTags(query + ' ' + response),
      metadata: {
        feedback,
        interactionTime: Date.now()
      }
    });

    // Extract any code patterns
    const codeBlocks = response.match(/```[\s\S]*?```/g) || [];
    for (const block of codeBlocks) {
      const language = block.match(/```(\w+)/)?.[1] || 'unknown';
      const code = block.replace(/```\w*\n?/g, '').replace(/```/g, '');

      await this.storeCodePattern({
        code,
        language,
        description: `Extracted from: ${query.slice(0, 100)}`,
        useCase: query,
        tags: [language]
      });
    }

    console.log(`[KnowledgeStore] Learned from interaction (${provider})`);
  }

  // ============================================================
  //  UTILITY METHODS
  // ============================================================

  hashContent(content) {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  findDuplicate(contentHash) {
    for (const entry of this.memoryIndex.values()) {
      if (entry.contentHash === contentHash) return entry;
    }
    return null;
  }

  async mergeKnowledge(existingId, newKnowledge) {
    const existing = this.memoryIndex.get(existingId);
    if (!existing) return null;

    // Merge tags
    existing.tags = [...new Set([...existing.tags, ...newKnowledge.tags])];
    existing.accessCount++;
    existing.lastAccessed = Date.now();

    this.saveIndices();
    return { id: existingId, merged: true };
  }

  chunkContent(content, maxChunkSize = 10000) {
    if (content.length <= maxChunkSize) return [content];

    const chunks = [];
    let remaining = content;

    while (remaining.length > 0) {
      if (remaining.length <= maxChunkSize) {
        chunks.push(remaining);
        break;
      }

      // Find a good break point
      let breakPoint = remaining.lastIndexOf('\n\n', maxChunkSize);
      if (breakPoint === -1) breakPoint = remaining.lastIndexOf('\n', maxChunkSize);
      if (breakPoint === -1) breakPoint = maxChunkSize;

      chunks.push(remaining.slice(0, breakPoint));
      remaining = remaining.slice(breakPoint);
    }

    return chunks;
  }

  summarize(content, maxLength = 200) {
    // Simple extractive summary
    const firstSentences = content.split(/[.!?]/).slice(0, 2).join('. ');
    return firstSentences.slice(0, maxLength) + (firstSentences.length > maxLength ? '...' : '');
  }

  scoreRelevance(entry, query) {
    let score = 0;
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    // Tag matches
    entry.tags.forEach(tag => {
      if (queryLower.includes(tag.toLowerCase())) score += 0.3;
    });

    // Summary matches
    const summaryLower = (entry.summary || '').toLowerCase();
    queryWords.forEach(word => {
      if (summaryLower.includes(word)) score += 0.1;
    });

    // Recency bonus
    const ageHours = (Date.now() - entry.createdAt) / (1000 * 60 * 60);
    if (ageHours < 24) score += 0.1;

    // Access frequency bonus
    if (entry.accessCount > 10) score += 0.1;

    return Math.min(score, 1);
  }

  extractTags(text) {
    const tags = [];
    const textLower = text.toLowerCase();

    // Programming languages
    ['javascript', 'python', 'rust', 'go', 'typescript', 'java', 'c++', 'react', 'node'].forEach(lang => {
      if (textLower.includes(lang)) tags.push(lang);
    });

    // Concepts
    ['api', 'database', 'security', 'auth', 'cache', 'queue', 'websocket', 'http'].forEach(concept => {
      if (textLower.includes(concept)) tags.push(concept);
    });

    return [...new Set(tags)];
  }

  estimateComplexity(code) {
    const lines = code.split('\n').length;
    const nesting = (code.match(/{/g) || []).length;

    if (lines > 100 || nesting > 10) return 'high';
    if (lines > 30 || nesting > 5) return 'medium';
    return 'low';
  }

  // ============================================================
  //  STATISTICS
  // ============================================================

  getStats() {
    const entries = Array.from(this.memoryIndex.values());

    const byType = {};
    this.typeIndex.forEach((ids, type) => {
      byType[type] = ids.length;
    });

    const topTags = Array.from(this.tagIndex.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 20)
      .map(([tag, ids]) => ({ tag, count: ids.length }));

    return {
      totalEntries: entries.length,
      byType,
      topTags,
      totalAccessCount: entries.reduce((sum, e) => sum + e.accessCount, 0),
      oldestEntry: Math.min(...entries.map(e => e.createdAt)),
      newestEntry: Math.max(...entries.map(e => e.createdAt))
    };
  }

  // ============================================================
  //  EXPORT / BACKUP
  // ============================================================

  async export(format = 'json') {
    const entries = Array.from(this.memoryIndex.values());
    const fullEntries = await Promise.all(entries.map(e => this.retrieve(e.id)));

    if (format === 'json') {
      return JSON.stringify(fullEntries, null, 2);
    }

    // CSV format
    const headers = ['id', 'type', 'source', 'tags', 'summary', 'createdAt'];
    const rows = fullEntries.map(e =>
      headers.map(h => h === 'tags' ? e[h].join(';') : e[h]).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { KnowledgeStore };
