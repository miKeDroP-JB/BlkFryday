/**
 * MemoryBank
 * Heuristics interface for pattern storage and retrieval
 */

class MemoryBank {
    constructor() {
        this.patterns = new Map();
        this.heuristics = new Map();
        this.maxPatterns = 10000;
    }

    store(fingerprint, data) {
        this.patterns.set(fingerprint, {
            data,
            timestamp: Date.now(),
            hits: 0
        });

        if (this.patterns.size > this.maxPatterns) {
            this._evict();
        }
    }

    retrieve(fingerprint) {
        const entry = this.patterns.get(fingerprint);
        if (entry) {
            entry.hits++;
            return entry.data;
        }
        return null;
    }

    storeHeuristic(key, heuristic) {
        this.heuristics.set(key, heuristic);
    }

    getHeuristic(key) {
        return this.heuristics.get(key);
    }

    _evict() {
        let oldest = null;
        let oldestTime = Infinity;

        this.patterns.forEach((entry, key) => {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldest = key;
            }
        });

        if (oldest) {
            this.patterns.delete(oldest);
        }
    }

    getStats() {
        return {
            patterns: this.patterns.size,
            heuristics: this.heuristics.size
        };
    }
}

module.exports = MemoryBank;
