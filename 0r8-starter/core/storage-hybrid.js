/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   HYBRID STORAGE - Memory + Persistence Layer                             ║
 * ║   Local-first with optional cloud sync                                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// In-memory storage
const localMemory = {};

// Storage metrics
const storageMetrics = {
    saves: 0,
    loads: 0,
    deletes: 0,
    totalItems: 0,
    totalBytes: 0
};

// Storage configuration
const config = {
    maxItemsPerUser: 10000,
    maxItemBytes: 1024 * 1024, // 1MB per item
    ttlDefault: 30 * 24 * 60 * 60 * 1000, // 30 days
    autoCleanupInterval: 60 * 60 * 1000 // 1 hour
};

/**
 * Main user storage interface
 */
export const userStorage = {
    /**
     * Save data for a user
     */
    save(userId, data, options = {}) {
        if (!userId) {
            throw new Error('userId required');
        }

        // Initialize user storage
        if (!localMemory[userId]) {
            localMemory[userId] = {
                items: [],
                meta: {
                    created: Date.now(),
                    lastAccess: Date.now()
                }
            };
        }

        // Normalize data to array
        const items = Array.isArray(data) ? data : [data];

        // Add metadata to each item
        const enrichedItems = items.map(item => ({
            id: item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            data: item,
            timestamp: Date.now(),
            ttl: options.ttl || config.ttlDefault,
            tags: options.tags || [],
            encrypted: options.encrypted || false
        }));

        // Check size limits
        const existingCount = localMemory[userId].items.length;
        if (existingCount + enrichedItems.length > config.maxItemsPerUser) {
            // Remove oldest items to make room
            const toRemove = existingCount + enrichedItems.length - config.maxItemsPerUser;
            localMemory[userId].items = localMemory[userId].items.slice(toRemove);
        }

        // Add items
        localMemory[userId].items.push(...enrichedItems);
        localMemory[userId].meta.lastAccess = Date.now();

        // Update metrics
        storageMetrics.saves++;
        storageMetrics.totalItems += enrichedItems.length;

        return {
            success: true,
            itemsSaved: enrichedItems.length,
            ids: enrichedItems.map(i => i.id)
        };
    },

    /**
     * Load data for a user
     */
    load(userId, options = {}) {
        storageMetrics.loads++;

        if (!localMemory[userId]) {
            return [];
        }

        localMemory[userId].meta.lastAccess = Date.now();

        let items = localMemory[userId].items;

        // Filter by TTL (remove expired)
        const now = Date.now();
        items = items.filter(item => {
            const expiry = item.timestamp + item.ttl;
            return expiry > now;
        });

        // Update stored items (cleanup expired)
        localMemory[userId].items = items;

        // Apply filters
        if (options.tags && options.tags.length > 0) {
            items = items.filter(item =>
                options.tags.some(tag => item.tags.includes(tag))
            );
        }

        if (options.since) {
            items = items.filter(item => item.timestamp >= options.since);
        }

        if (options.limit) {
            items = items.slice(-options.limit);
        }

        // Return data only (unwrap)
        return items.map(item => item.data);
    },

    /**
     * Load with full metadata
     */
    loadFull(userId, options = {}) {
        storageMetrics.loads++;

        if (!localMemory[userId]) {
            return { items: [], meta: null };
        }

        localMemory[userId].meta.lastAccess = Date.now();

        return {
            items: localMemory[userId].items,
            meta: localMemory[userId].meta
        };
    },

    /**
     * Delete items
     */
    delete(userId, itemIds) {
        if (!localMemory[userId]) {
            return { success: false, deleted: 0 };
        }

        const idsToDelete = Array.isArray(itemIds) ? itemIds : [itemIds];
        const originalCount = localMemory[userId].items.length;

        localMemory[userId].items = localMemory[userId].items.filter(
            item => !idsToDelete.includes(item.id)
        );

        const deleted = originalCount - localMemory[userId].items.length;

        storageMetrics.deletes++;
        storageMetrics.totalItems -= deleted;

        return { success: true, deleted };
    },

    /**
     * Clear all user data
     */
    clear(userId) {
        if (!localMemory[userId]) {
            return { success: false };
        }

        const itemCount = localMemory[userId].items.length;
        delete localMemory[userId];

        storageMetrics.totalItems -= itemCount;

        return { success: true, clearedItems: itemCount };
    },

    /**
     * Get user storage stats
     */
    stats(userId) {
        if (!localMemory[userId]) {
            return null;
        }

        const items = localMemory[userId].items;

        return {
            itemCount: items.length,
            oldestItem: items.length > 0 ? items[0].timestamp : null,
            newestItem: items.length > 0 ? items[items.length - 1].timestamp : null,
            tags: [...new Set(items.flatMap(i => i.tags))],
            ...localMemory[userId].meta
        };
    },

    /**
     * Search across user data
     */
    search(userId, query, options = {}) {
        if (!localMemory[userId]) {
            return [];
        }

        const items = localMemory[userId].items;
        const results = [];

        for (const item of items) {
            const dataStr = JSON.stringify(item.data).toLowerCase();

            if (typeof query === 'string') {
                if (dataStr.includes(query.toLowerCase())) {
                    results.push(item.data);
                }
            } else if (query instanceof RegExp) {
                if (query.test(dataStr)) {
                    results.push(item.data);
                }
            }
        }

        return options.limit ? results.slice(0, options.limit) : results;
    }
};

/**
 * Session storage (ephemeral)
 */
export const sessionStorage = {
    sessions: {},

    create(sessionId, data = {}) {
        this.sessions[sessionId] = {
            data,
            created: Date.now(),
            lastAccess: Date.now()
        };
        return sessionId;
    },

    get(sessionId) {
        const session = this.sessions[sessionId];
        if (session) {
            session.lastAccess = Date.now();
            return session.data;
        }
        return null;
    },

    set(sessionId, key, value) {
        if (!this.sessions[sessionId]) {
            this.create(sessionId);
        }
        this.sessions[sessionId].data[key] = value;
        this.sessions[sessionId].lastAccess = Date.now();
    },

    destroy(sessionId) {
        delete this.sessions[sessionId];
    },

    cleanup(maxAge = 3600000) {
        const now = Date.now();
        for (const [id, session] of Object.entries(this.sessions)) {
            if (now - session.lastAccess > maxAge) {
                delete this.sessions[id];
            }
        }
    }
};

/**
 * Cache layer
 */
export const cache = {
    data: {},

    set(key, value, ttl = 300000) {
        this.data[key] = {
            value,
            expires: Date.now() + ttl
        };
    },

    get(key) {
        const cached = this.data[key];
        if (!cached) return null;

        if (Date.now() > cached.expires) {
            delete this.data[key];
            return null;
        }

        return cached.value;
    },

    invalidate(key) {
        delete this.data[key];
    },

    clear() {
        this.data = {};
    }
};

/**
 * Get global storage metrics
 */
export function getStorageMetrics() {
    return {
        ...storageMetrics,
        userCount: Object.keys(localMemory).length,
        sessionCount: Object.keys(sessionStorage.sessions).length,
        cacheCount: Object.keys(cache.data).length
    };
}

// Auto cleanup interval
setInterval(() => {
    sessionStorage.cleanup();

    // Clean expired cache entries
    const now = Date.now();
    for (const [key, entry] of Object.entries(cache.data)) {
        if (now > entry.expires) {
            delete cache.data[key];
        }
    }
}, config.autoCleanupInterval);

export default {
    userStorage,
    sessionStorage,
    cache,
    getStorageMetrics
};
