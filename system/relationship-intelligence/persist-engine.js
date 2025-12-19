/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PERSIST ENGINE - Storage Layer
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * The memory that endures. Every insight, every pattern, every moment of
 * resonance - preserved for the relationship to grow.
 *
 * Storage backends supported:
 * - Memory (development/testing)
 * - File-based (local persistence)
 * - MongoDB (production scale)
 * - Neo4j (graph relationships - future)
 *
 * Created: December 2, 2025
 * Architect: JB + Claude
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs').promises;
const path = require('path');
const { RelationshipSchema, SessionContext } = require('./schema');

/**
 * Storage backend interface
 */
class StorageBackend {
  async save(key, data) { throw new Error('Not implemented'); }
  async load(key) { throw new Error('Not implemented'); }
  async delete(key) { throw new Error('Not implemented'); }
  async list(prefix) { throw new Error('Not implemented'); }
  async exists(key) { throw new Error('Not implemented'); }
}

/**
 * In-memory storage for development
 */
class MemoryBackend extends StorageBackend {
  constructor() {
    super();
    this.store = new Map();
  }

  async save(key, data) {
    this.store.set(key, JSON.stringify(data));
    return true;
  }

  async load(key) {
    const data = this.store.get(key);
    return data ? JSON.parse(data) : null;
  }

  async delete(key) {
    return this.store.delete(key);
  }

  async list(prefix = '') {
    return Array.from(this.store.keys()).filter(k => k.startsWith(prefix));
  }

  async exists(key) {
    return this.store.has(key);
  }

  // For debugging
  dump() {
    const result = {};
    this.store.forEach((v, k) => { result[k] = JSON.parse(v); });
    return result;
  }
}

/**
 * File-based storage for local persistence
 */
class FileBackend extends StorageBackend {
  constructor(basePath = './data/relationships') {
    super();
    this.basePath = basePath;
    this._ensureDir();
  }

  async _ensureDir() {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (e) {
      // Directory exists
    }
  }

  _keyToPath(key) {
    // Sanitize key for filesystem
    const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.basePath, `${safe}.json`);
  }

  async save(key, data) {
    await this._ensureDir();
    const filePath = this._keyToPath(key);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  }

  async load(key) {
    try {
      const filePath = this._keyToPath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  async delete(key) {
    try {
      const filePath = this._keyToPath(key);
      await fs.unlink(filePath);
      return true;
    } catch (e) {
      return false;
    }
  }

  async list(prefix = '') {
    try {
      await this._ensureDir();
      const files = await fs.readdir(this.basePath);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
        .filter(k => k.startsWith(prefix.replace(/[^a-zA-Z0-9_-]/g, '_')));
    } catch (e) {
      return [];
    }
  }

  async exists(key) {
    try {
      const filePath = this._keyToPath(key);
      await fs.access(filePath);
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * The Persist Engine - manages all relationship data storage
 */
class PersistEngine {
  constructor(backend = null) {
    this.backend = backend || new MemoryBackend();
    this.cache = new Map();  // Hot cache for active schemas
    this.cacheTimeout = 5 * 60 * 1000;  // 5 minutes
  }

  /**
   * Generate storage key for a user's schema
   */
  _schemaKey(userId) {
    return `schema:${userId}`;
  }

  /**
   * Generate storage key for a session
   */
  _sessionKey(sessionId) {
    return `session:${sessionId}`;
  }

  /**
   * Get or create a relationship schema for a user
   */
  async getSchema(userId) {
    const key = this._schemaKey(userId);

    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.schema;
    }

    // Load from backend
    const data = await this.backend.load(key);
    if (data) {
      const schema = RelationshipSchema.fromJSON(data);
      this.cache.set(key, { schema, timestamp: Date.now() });
      return schema;
    }

    // Create new schema
    const schema = new RelationshipSchema(userId);
    await this.saveSchema(schema);
    return schema;
  }

  /**
   * Save a relationship schema
   */
  async saveSchema(schema) {
    const key = this._schemaKey(schema.user_id);
    schema.last_updated = new Date().toISOString();

    await this.backend.save(key, JSON.parse(schema.toJSON()));
    this.cache.set(key, { schema, timestamp: Date.now() });

    return true;
  }

  /**
   * Save a session for later analysis
   */
  async saveSession(session) {
    const key = this._sessionKey(session.session_id);
    await this.backend.save(key, session);

    // Also update the user's session history index
    const indexKey = `sessions:${session.user_id}`;
    const index = await this.backend.load(indexKey) || [];
    if (!index.includes(session.session_id)) {
      index.push(session.session_id);
      await this.backend.save(indexKey, index);
    }

    return true;
  }

  /**
   * Load a previous session
   */
  async getSession(sessionId) {
    const key = this._sessionKey(sessionId);
    return await this.backend.load(key);
  }

  /**
   * Get all session IDs for a user
   */
  async getUserSessions(userId, limit = 100) {
    const indexKey = `sessions:${userId}`;
    const index = await this.backend.load(indexKey) || [];
    return index.slice(-limit);
  }

  /**
   * Get recent sessions with full data
   */
  async getRecentSessions(userId, count = 5) {
    const sessionIds = await this.getUserSessions(userId, count);
    const sessions = [];

    for (const id of sessionIds.slice(-count)) {
      const session = await this.getSession(id);
      if (session) sessions.push(session);
    }

    return sessions;
  }

  /**
   * Perform handoff between avatars
   * Returns context package for the new avatar
   */
  async handoff(userId, fromAvatar, toAvatar) {
    const schema = await this.getSchema(userId);

    // Get recent session with previous avatar
    const recentSessions = await this.getRecentSessions(userId, 10);
    const lastWithFrom = recentSessions
      .filter(s => s.avatar === fromAvatar)
      .pop();

    // Create handoff package
    const handoffPackage = {
      timestamp: new Date().toISOString(),
      from_avatar: fromAvatar,
      to_avatar: toAvatar,
      user_id: userId,

      // Essential context
      schema_snapshot: {
        identity: schema.identity,
        operating_style: schema.operating_style,
        current_goals: schema.goals.session_level,
        recent_topics: lastWithFrom?.current_topic,
        trust_level: schema.avatar_relationships[fromAvatar]?.trust_level,
        shared_lexicon: schema.lexicon.terms.slice(-20)
      },

      // Last session summary
      last_session: lastWithFrom ? {
        topic: lastWithFrom.current_topic,
        goal: lastWithFrom.current_goal,
        insights: lastWithFrom.insights_generated.slice(-5),
        resonance_achieved: lastWithFrom.resonance_active
      } : null,

      // Relationship with new avatar
      existing_relationship: schema.avatar_relationships[toAvatar] || null,

      // Handoff notes from previous avatar
      notes: schema.avatar_relationships[fromAvatar]?.handoff_notes || []
    };

    // Record the handoff
    schema.updateAvatarRelationship(fromAvatar, {
      handoff_notes: [
        ...(schema.avatar_relationships[fromAvatar]?.handoff_notes || []),
        {
          to: toAvatar,
          timestamp: new Date().toISOString(),
          context: lastWithFrom?.current_topic
        }
      ]
    });

    await this.saveSchema(schema);
    return handoffPackage;
  }

  /**
   * Export all user data (GDPR compliance)
   */
  async exportUserData(userId) {
    const schema = await this.getSchema(userId);
    const sessions = await this.getRecentSessions(userId, 1000);

    const exportData = {
      exported_at: new Date().toISOString(),
      schema: JSON.parse(schema.toJSON()),
      sessions: sessions,
      metadata: {
        total_sessions: sessions.length,
        avatars_interacted: Object.keys(schema.avatar_relationships)
      }
    };

    // Record the export
    schema.privacy.export_history.push({
      timestamp: new Date().toISOString(),
      format: 'json',
      destination: 'user_export'
    });
    await this.saveSchema(schema);

    return exportData;
  }

  /**
   * Delete all user data (right to be forgotten)
   */
  async deleteUserData(userId) {
    // Get all session IDs
    const sessionIds = await this.getUserSessions(userId, 10000);

    // Delete all sessions
    for (const sessionId of sessionIds) {
      await this.backend.delete(this._sessionKey(sessionId));
    }

    // Delete session index
    await this.backend.delete(`sessions:${userId}`);

    // Delete schema
    await this.backend.delete(this._schemaKey(userId));

    // Clear cache
    this.cache.delete(this._schemaKey(userId));

    return true;
  }

  /**
   * List all users in the system
   */
  async listUsers() {
    const keys = await this.backend.list('schema:');
    return keys.map(k => k.replace('schema:', ''));
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    const users = await this.listUsers();
    let totalSessions = 0;
    let totalPatterns = 0;

    for (const userId of users) {
      const sessions = await this.getUserSessions(userId);
      totalSessions += sessions.length;

      const schema = await this.getSchema(userId);
      totalPatterns += schema.evolution.schema_changes.length;
    }

    return {
      total_users: users.length,
      total_sessions: totalSessions,
      total_pattern_updates: totalPatterns,
      cache_size: this.cache.size,
      backend_type: this.backend.constructor.name
    };
  }
}

module.exports = {
  StorageBackend,
  MemoryBackend,
  FileBackend,
  PersistEngine
};
