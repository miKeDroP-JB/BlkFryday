/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ███╗   ███╗███████╗███╗   ███╗ ██████╗ ██████╗ ██╗   ██╗                ║
 * ║   ████╗ ████║██╔════╝████╗ ████║██╔═══██╗██╔══██╗╚██╗ ██╔╝                ║
 * ║   ██╔████╔██║█████╗  ██╔████╔██║██║   ██║██████╔╝ ╚████╔╝                 ║
 * ║   ██║╚██╔╝██║██╔══╝  ██║╚██╔╝██║██║   ██║██╔══██╗  ╚██╔╝                  ║
 * ║   ██║ ╚═╝ ██║███████╗██║ ╚═╝ ██║╚██████╔╝██║  ██║   ██║                   ║
 * ║   ╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝                   ║
 * ║                                                                           ║
 * ║   PERSISTENT KNOWLEDGE LAYER - Protected by HYDRA                         ║
 * ║   Learn. Remember. Evolve.                                                ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  dataDir: process.env.ORB_DATA_DIR || path.join(process.cwd(), '.orb-data'),
  encryptionKey: process.env.ORB_ENCRYPTION_KEY || null,
  maxMemorySize: 100 * 1024 * 1024, // 100MB in-memory cache
  persistInterval: 30000, // Persist every 30 seconds
  enableVectorSearch: true,
  embeddingDimensions: 384 // For local embeddings
};

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY TYPES
// ═══════════════════════════════════════════════════════════════════════════

const MEMORY_TYPES = {
  KNOWLEDGE: 'knowledge',      // Facts, learned information
  EXPERIENCE: 'experience',    // Past interactions, outcomes
  SKILL: 'skill',              // Learned procedures, patterns
  CONTEXT: 'context',          // Session context, preferences
  SYSTEM: 'system'             // System state, configurations
};

const PROTECTION_LEVELS = {
  PUBLIC: 0,      // No encryption
  PRIVATE: 1,     // Encrypted at rest
  SOVEREIGN: 2    // Encrypted + HYDRA protected + air-gapped backup
};

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY ENTRY
// ═══════════════════════════════════════════════════════════════════════════

class MemoryEntry {
  constructor(data) {
    this.id = data.id || crypto.randomUUID();
    this.type = data.type || MEMORY_TYPES.KNOWLEDGE;
    this.key = data.key;
    this.value = data.value;
    this.tags = data.tags || [];
    this.embedding = data.embedding || null;
    this.protection = data.protection || PROTECTION_LEVELS.PRIVATE;
    this.metadata = {
      created: data.metadata?.created || Date.now(),
      updated: Date.now(),
      accessCount: data.metadata?.accessCount || 0,
      lastAccessed: data.metadata?.lastAccessed || null,
      source: data.metadata?.source || 'manual',
      confidence: data.metadata?.confidence || 1.0,
      relations: data.metadata?.relations || []
    };
  }

  touch() {
    this.metadata.accessCount++;
    this.metadata.lastAccessed = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      key: this.key,
      value: this.value,
      tags: this.tags,
      embedding: this.embedding,
      protection: this.protection,
      metadata: this.metadata
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VECTOR INDEX (Simple local implementation)
// ═══════════════════════════════════════════════════════════════════════════

class VectorIndex {
  constructor(dimensions = 384) {
    this.dimensions = dimensions;
    this.vectors = new Map(); // id -> embedding
  }

  add(id, embedding) {
    if (embedding && embedding.length === this.dimensions) {
      this.vectors.set(id, embedding);
    }
  }

  remove(id) {
    this.vectors.delete(id);
  }

  // Cosine similarity search
  search(queryEmbedding, limit = 10, threshold = 0.7) {
    if (!queryEmbedding || queryEmbedding.length !== this.dimensions) {
      return [];
    }

    const results = [];

    for (const [id, embedding] of this.vectors) {
      const similarity = this._cosineSimilarity(queryEmbedding, embedding);
      if (similarity >= threshold) {
        results.push({ id, similarity });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  _cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  size() {
    return this.vectors.size;
  }

  export() {
    return Array.from(this.vectors.entries());
  }

  import(data) {
    for (const [id, embedding] of data) {
      this.vectors.set(id, embedding);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ENCRYPTION LAYER
// ═══════════════════════════════════════════════════════════════════════════

class EncryptionLayer {
  constructor(key) {
    this.algorithm = 'aes-256-gcm';
    this.key = key ? this._deriveKey(key) : null;
  }

  _deriveKey(password) {
    return crypto.scryptSync(password, 'orb-salt-v1', 32);
  }

  encrypt(data) {
    if (!this.key) return { encrypted: false, data };

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted: true,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted
    };
  }

  decrypt(encryptedData) {
    if (!encryptedData.encrypted) return encryptedData.data;
    if (!this.key) throw new Error('No encryption key provided');

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY CORE - THE BRAIN
// ═══════════════════════════════════════════════════════════════════════════

class MemoryCore extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.entries = new Map();
    this.vectorIndex = new VectorIndex(this.config.embeddingDimensions);
    this.encryption = new EncryptionLayer(this.config.encryptionKey);
    this.hydra = null; // Will be wired by ORBCore

    this.state = {
      initialized: false,
      dirty: false,
      lastPersist: null,
      stats: {
        totalEntries: 0,
        byType: {},
        totalSize: 0
      }
    };

    this._persistTimer = null;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  async initialize() {
    console.log('⟡ Initializing Memory Core...');

    // Ensure data directory exists
    if (!fs.existsSync(this.config.dataDir)) {
      fs.mkdirSync(this.config.dataDir, { recursive: true });
    }

    // Load existing data
    await this._loadFromDisk();

    // Start auto-persist timer
    this._startAutoPersist();

    this.state.initialized = true;
    console.log(`  ✓ Memory Core ready (${this.entries.size} entries loaded)`);

    this.emit('memory:initialized', { entries: this.entries.size });
    return this;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CORE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Store a memory entry
   */
  async store(key, value, options = {}) {
    // HYDRA protection check
    if (this.hydra && options.protection === PROTECTION_LEVELS.SOVEREIGN) {
      const approved = await this.hydra.approveMemoryWrite(key, value);
      if (!approved) {
        this.emit('memory:blocked', { key, reason: 'HYDRA protection denied' });
        throw new Error('Memory write blocked by HYDRA');
      }
    }

    const entry = new MemoryEntry({
      key,
      value,
      type: options.type || MEMORY_TYPES.KNOWLEDGE,
      tags: options.tags || [],
      protection: options.protection || PROTECTION_LEVELS.PRIVATE,
      embedding: options.embedding || null,
      metadata: {
        source: options.source || 'api',
        confidence: options.confidence || 1.0,
        relations: options.relations || []
      }
    });

    // Generate embedding if not provided and embedder is available
    if (!entry.embedding && this.embedder) {
      entry.embedding = await this._generateEmbedding(value);
    }

    // Add to vector index
    if (entry.embedding) {
      this.vectorIndex.add(entry.id, entry.embedding);
    }

    this.entries.set(key, entry);
    this.state.dirty = true;
    this._updateStats();

    this.emit('memory:stored', { key, type: entry.type });
    return entry;
  }

  /**
   * Retrieve a memory entry by key
   */
  async retrieve(key) {
    const entry = this.entries.get(key);
    if (!entry) return null;

    entry.touch();
    this.state.dirty = true;

    this.emit('memory:accessed', { key, accessCount: entry.metadata.accessCount });
    return entry;
  }

  /**
   * Semantic search using embeddings
   */
  async search(query, options = {}) {
    const limit = options.limit || 10;
    const threshold = options.threshold || 0.7;
    const type = options.type || null;

    // Generate query embedding
    let queryEmbedding = options.embedding;
    if (!queryEmbedding && this.embedder) {
      queryEmbedding = await this._generateEmbedding(query);
    }

    if (!queryEmbedding) {
      // Fallback to keyword search
      return this._keywordSearch(query, limit, type);
    }

    // Vector similarity search
    const vectorResults = this.vectorIndex.search(queryEmbedding, limit * 2, threshold);

    // Get full entries and filter by type
    const results = [];
    for (const { id, similarity } of vectorResults) {
      for (const [key, entry] of this.entries) {
        if (entry.id === id) {
          if (!type || entry.type === type) {
            entry.touch();
            results.push({ entry, similarity });
          }
          break;
        }
      }
    }

    this.state.dirty = true;
    return results.slice(0, limit);
  }

  /**
   * Keyword-based fallback search
   */
  _keywordSearch(query, limit, type) {
    const queryLower = query.toLowerCase();
    const results = [];

    for (const [key, entry] of this.entries) {
      if (type && entry.type !== type) continue;

      const keyMatch = key.toLowerCase().includes(queryLower);
      const valueMatch = JSON.stringify(entry.value).toLowerCase().includes(queryLower);
      const tagMatch = entry.tags.some(t => t.toLowerCase().includes(queryLower));

      if (keyMatch || valueMatch || tagMatch) {
        const score = (keyMatch ? 0.5 : 0) + (valueMatch ? 0.3 : 0) + (tagMatch ? 0.2 : 0);
        results.push({ entry, similarity: score });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Delete a memory entry
   */
  async delete(key) {
    const entry = this.entries.get(key);
    if (!entry) return false;

    // HYDRA protection for sovereign memories
    if (this.hydra && entry.protection === PROTECTION_LEVELS.SOVEREIGN) {
      const approved = await this.hydra.approveMemoryDelete(key);
      if (!approved) {
        this.emit('memory:blocked', { key, reason: 'HYDRA protection denied delete' });
        throw new Error('Memory delete blocked by HYDRA');
      }
    }

    this.vectorIndex.remove(entry.id);
    this.entries.delete(key);
    this.state.dirty = true;
    this._updateStats();

    this.emit('memory:deleted', { key });
    return true;
  }

  /**
   * Get all entries by type
   */
  getByType(type) {
    const results = [];
    for (const [key, entry] of this.entries) {
      if (entry.type === type) {
        results.push(entry);
      }
    }
    return results;
  }

  /**
   * Get entries by tag
   */
  getByTag(tag) {
    const results = [];
    for (const [key, entry] of this.entries) {
      if (entry.tags.includes(tag)) {
        results.push(entry);
      }
    }
    return results;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LEARNING & TRAINING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Learn from an experience (store with learning metadata)
   */
  async learn(experience, outcome, options = {}) {
    const learningEntry = {
      experience,
      outcome,
      success: options.success !== false,
      lessons: options.lessons || [],
      timestamp: Date.now()
    };

    return this.store(
      `experience:${Date.now()}`,
      learningEntry,
      {
        type: MEMORY_TYPES.EXPERIENCE,
        tags: ['learning', ...(options.tags || [])],
        source: 'learning_loop',
        confidence: options.confidence || 0.8
      }
    );
  }

  /**
   * Extract patterns from experiences
   */
  async extractPatterns(type = MEMORY_TYPES.EXPERIENCE, minOccurrences = 3) {
    const experiences = this.getByType(type);
    const patterns = new Map();

    for (const exp of experiences) {
      const key = JSON.stringify(exp.value.lessons || []);
      const existing = patterns.get(key) || { count: 0, examples: [] };
      existing.count++;
      existing.examples.push(exp);
      patterns.set(key, existing);
    }

    // Return patterns that occur frequently
    const significantPatterns = [];
    for (const [key, data] of patterns) {
      if (data.count >= minOccurrences) {
        significantPatterns.push({
          pattern: JSON.parse(key),
          occurrences: data.count,
          examples: data.examples.slice(0, 3)
        });
      }
    }

    return significantPatterns;
  }

  /**
   * Train on feedback (reinforce or weaken memories)
   */
  async feedback(key, positive = true, amount = 0.1) {
    const entry = this.entries.get(key);
    if (!entry) return null;

    const adjustment = positive ? amount : -amount;
    entry.metadata.confidence = Math.max(0, Math.min(1, entry.metadata.confidence + adjustment));
    entry.metadata.updated = Date.now();
    this.state.dirty = true;

    this.emit('memory:feedback', { key, positive, newConfidence: entry.metadata.confidence });
    return entry;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════

  async _loadFromDisk() {
    const dataFile = path.join(this.config.dataDir, 'memory.json');
    const vectorFile = path.join(this.config.dataDir, 'vectors.json');

    try {
      if (fs.existsSync(dataFile)) {
        const encrypted = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        const data = this.encryption.decrypt(encrypted);

        for (const [key, entryData] of Object.entries(data)) {
          this.entries.set(key, new MemoryEntry(entryData));
        }
      }

      if (fs.existsSync(vectorFile)) {
        const vectorData = JSON.parse(fs.readFileSync(vectorFile, 'utf8'));
        this.vectorIndex.import(vectorData);
      }

      this._updateStats();
    } catch (error) {
      console.error('  ⚠ Failed to load memory:', error.message);
      // Start fresh if corrupted
      this.entries.clear();
    }
  }

  async persist() {
    if (!this.state.dirty) return;

    const dataFile = path.join(this.config.dataDir, 'memory.json');
    const vectorFile = path.join(this.config.dataDir, 'vectors.json');
    const backupFile = path.join(this.config.dataDir, `memory.backup.${Date.now()}.json`);

    try {
      // Convert entries to plain object
      const data = {};
      for (const [key, entry] of this.entries) {
        data[key] = entry.toJSON();
      }

      // Encrypt and save
      const encrypted = this.encryption.encrypt(data);

      // Backup before overwrite
      if (fs.existsSync(dataFile)) {
        fs.copyFileSync(dataFile, backupFile);
      }

      fs.writeFileSync(dataFile, JSON.stringify(encrypted, null, 2));
      fs.writeFileSync(vectorFile, JSON.stringify(this.vectorIndex.export()));

      // Clean old backups (keep last 5)
      this._cleanBackups();

      this.state.dirty = false;
      this.state.lastPersist = Date.now();

      this.emit('memory:persisted', { entries: this.entries.size });
    } catch (error) {
      console.error('  ⚠ Failed to persist memory:', error.message);
      this.emit('memory:error', error);
    }
  }

  _cleanBackups() {
    const files = fs.readdirSync(this.config.dataDir)
      .filter(f => f.startsWith('memory.backup.'))
      .sort()
      .reverse();

    for (const file of files.slice(5)) {
      fs.unlinkSync(path.join(this.config.dataDir, file));
    }
  }

  _startAutoPersist() {
    if (this._persistTimer) clearInterval(this._persistTimer);

    this._persistTimer = setInterval(() => {
      this.persist().catch(console.error);
    }, this.config.persistInterval);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════

  async _generateEmbedding(text) {
    // Convert to string if needed
    const textToEmbed = typeof text === 'string'
      ? text
      : JSON.stringify(text);

    if (this.embedder && textToEmbed.length > 0) {
      try {
        const embedding = await this.embedder.embed(textToEmbed);
        // Update vector index dimensions if needed
        if (embedding && embedding.length !== this.vectorIndex.dimensions) {
          this.vectorIndex = new VectorIndex(embedding.length);
          // Re-index existing entries with embeddings
          for (const [key, entry] of this.entries) {
            if (entry.embedding) {
              this.vectorIndex.add(entry.id, entry.embedding);
            }
          }
        }
        return embedding;
      } catch (error) {
        console.error('  ⚠ Embedding generation failed:', error.message);
        return null;
      }
    }
    return null;
  }

  _updateStats() {
    const byType = {};
    for (const [key, entry] of this.entries) {
      byType[entry.type] = (byType[entry.type] || 0) + 1;
    }

    this.state.stats = {
      totalEntries: this.entries.size,
      vectorCount: this.vectorIndex.size(),
      byType,
      totalSize: this._estimateSize()
    };
  }

  _estimateSize() {
    let size = 0;
    for (const [key, entry] of this.entries) {
      size += JSON.stringify(entry).length;
    }
    return size;
  }

  getStats() {
    return { ...this.state.stats, lastPersist: this.state.lastPersist };
  }

  /**
   * Connect HYDRA sentinel for memory protection
   */
  connectHydra(hydra) {
    this.hydra = hydra;
    console.log('  ✓ Memory Core connected to HYDRA Sentinel');
  }

  /**
   * Connect embedder for vector search
   */
  connectEmbedder(embedder) {
    this.embedder = embedder;
    console.log('  ✓ Memory Core connected to Embedder');
  }

  /**
   * Shutdown gracefully
   */
  async shutdown() {
    if (this._persistTimer) {
      clearInterval(this._persistTimer);
    }
    await this.persist();
    this.emit('memory:shutdown');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  MemoryCore,
  MemoryEntry,
  VectorIndex,
  EncryptionLayer,
  MEMORY_TYPES,
  PROTECTION_LEVELS
};
