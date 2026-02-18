/**
 * scan_queue.js
 * Bug Bounty Scan Queue Manager
 * Manages scanning tasks with proper rate limiting and authorization
 */

class ScanQueue {
    constructor(config = {}) {
        this.queue = [];
        this.activeScans = new Map();
        this.completedScans = [];
        this.maxConcurrent = config.maxConcurrent || 3;
        this.cooldownMs = config.cooldownMs || 5000; // Between scans per target

        // Rate limiting per target
        this.targetCooldowns = new Map();

        // Stats
        this.stats = {
            queued: 0,
            running: 0,
            completed: 0,
            findings: 0
        };

        console.log('[ScanQueue] Queue manager initialized');
    }

    /**
     * Add scan to queue
     */
    enqueue(scan) {
        // Validate authorization
        if (!scan.authorization || !scan.authorization.confirmed) {
            return {
                error: 'Authorization required',
                message: 'Cannot queue scan without confirmed authorization'
            };
        }

        // Validate scope
        if (!this._isInScope(scan.target, scan.program)) {
            return {
                error: 'Out of scope',
                message: `Target ${scan.target} is not in scope for this program`
            };
        }

        const queueItem = {
            id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            target: scan.target,
            program: scan.program,
            scanType: scan.scanType || 'recon',
            priority: scan.priority || 'normal',
            authorization: scan.authorization,
            status: 'queued',
            queuedAt: Date.now(),
            startedAt: null,
            completedAt: null,
            findings: []
        };

        // Priority queue insertion
        if (queueItem.priority === 'high') {
            // Insert after other high priority items
            const insertIdx = this.queue.findIndex(q => q.priority !== 'high');
            if (insertIdx === -1) {
                this.queue.push(queueItem);
            } else {
                this.queue.splice(insertIdx, 0, queueItem);
            }
        } else {
            this.queue.push(queueItem);
        }

        this.stats.queued++;

        console.log(`[ScanQueue] Queued: ${queueItem.id} (${queueItem.scanType})`);

        return {
            success: true,
            scanId: queueItem.id,
            position: this.queue.findIndex(q => q.id === queueItem.id) + 1,
            estimatedWait: this._estimateWait(queueItem)
        };
    }

    /**
     * Process queue
     */
    async processQueue() {
        // Check if we can start more scans
        while (this.activeScans.size < this.maxConcurrent && this.queue.length > 0) {
            const scan = this._getNextAvailable();
            if (scan) {
                await this._startScan(scan);
            } else {
                break; // No available scans (all on cooldown)
            }
        }
    }

    /**
     * Get next available scan (respecting cooldowns)
     */
    _getNextAvailable() {
        const now = Date.now();

        for (let i = 0; i < this.queue.length; i++) {
            const scan = this.queue[i];
            const lastScanTime = this.targetCooldowns.get(scan.target) || 0;

            if (now - lastScanTime >= this.cooldownMs) {
                return this.queue.splice(i, 1)[0];
            }
        }

        return null;
    }

    /**
     * Start a scan
     */
    async _startScan(scan) {
        scan.status = 'running';
        scan.startedAt = Date.now();

        this.activeScans.set(scan.id, scan);
        this.stats.queued--;
        this.stats.running++;

        console.log(`[ScanQueue] Started: ${scan.id}`);

        // Simulate scan execution (would call actual scanner in production)
        // This is where Sentinel agent would be invoked
        try {
            const results = await this._executeScan(scan);
            this._completeScan(scan, results);
        } catch (error) {
            this._failScan(scan, error);
        }
    }

    /**
     * Execute scan (simulation)
     */
    async _executeScan(scan) {
        // In production, this would invoke the Sentinel agent
        // with proper authorization and scope checks

        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulated results
                const findings = [];

                // Random chance of finding something
                if (Math.random() < 0.3) {
                    findings.push({
                        id: `finding_${Date.now()}`,
                        type: ['header', 'ssl', 'info'][Math.floor(Math.random() * 3)],
                        severity: ['info', 'low', 'medium'][Math.floor(Math.random() * 3)],
                        title: 'Potential issue found',
                        target: scan.target,
                        timestamp: Date.now()
                    });
                }

                resolve({
                    scanId: scan.id,
                    target: scan.target,
                    scanType: scan.scanType,
                    duration: Date.now() - scan.startedAt,
                    findings
                });
            }, 1000 + Math.random() * 2000);
        });
    }

    /**
     * Complete a scan
     */
    _completeScan(scan, results) {
        scan.status = 'completed';
        scan.completedAt = Date.now();
        scan.findings = results.findings;
        scan.duration = results.duration;

        this.activeScans.delete(scan.id);
        this.completedScans.push(scan);

        // Update cooldown
        this.targetCooldowns.set(scan.target, Date.now());

        this.stats.running--;
        this.stats.completed++;
        this.stats.findings += results.findings.length;

        console.log(`[ScanQueue] Completed: ${scan.id} (${results.findings.length} findings)`);

        // Process more from queue
        this.processQueue();
    }

    /**
     * Fail a scan
     */
    _failScan(scan, error) {
        scan.status = 'failed';
        scan.completedAt = Date.now();
        scan.error = error.message;

        this.activeScans.delete(scan.id);
        this.completedScans.push(scan);

        this.stats.running--;
        this.stats.completed++;

        console.log(`[ScanQueue] Failed: ${scan.id} - ${error.message}`);

        // Process more from queue
        this.processQueue();
    }

    /**
     * Check if target is in scope
     */
    _isInScope(target, program) {
        if (!program || !program.scope) return false;

        const inScope = program.scope.inScope || [];
        const outOfScope = program.scope.outOfScope || [];

        // Check if explicitly out of scope
        for (const pattern of outOfScope) {
            if (this._matchesPattern(target, pattern)) {
                return false;
            }
        }

        // Check if in scope
        for (const pattern of inScope) {
            if (this._matchesPattern(target, pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Match target against scope pattern
     */
    _matchesPattern(target, pattern) {
        // Handle wildcard patterns
        if (pattern.startsWith('*.')) {
            const domain = pattern.slice(2);
            return target.endsWith(domain) || target === domain.slice(1);
        }

        return target === pattern || target.includes(pattern);
    }

    /**
     * Estimate wait time
     */
    _estimateWait(scan) {
        const position = this.queue.findIndex(q => q.id === scan.id);
        const avgScanTime = 3000; // Estimated average
        const waitingScans = position - this.maxConcurrent;

        if (waitingScans <= 0) return 'Starting soon';

        const estimatedMs = waitingScans * avgScanTime;
        return `~${Math.ceil(estimatedMs / 1000)} seconds`;
    }

    /**
     * Get scan status
     */
    getStatus(scanId) {
        // Check active
        if (this.activeScans.has(scanId)) {
            return this.activeScans.get(scanId);
        }

        // Check queue
        const queued = this.queue.find(q => q.id === scanId);
        if (queued) return queued;

        // Check completed
        const completed = this.completedScans.find(c => c.id === scanId);
        if (completed) return completed;

        return null;
    }

    /**
     * Cancel scan
     */
    cancel(scanId) {
        // Remove from queue
        const idx = this.queue.findIndex(q => q.id === scanId);
        if (idx !== -1) {
            const removed = this.queue.splice(idx, 1)[0];
            this.stats.queued--;
            return { success: true, status: 'cancelled' };
        }

        // Cannot cancel active scans in this implementation
        if (this.activeScans.has(scanId)) {
            return { error: 'Cannot cancel active scan' };
        }

        return { error: 'Scan not found' };
    }

    /**
     * Get queue status
     */
    getQueueStatus() {
        return {
            queued: this.queue.length,
            active: this.activeScans.size,
            completed: this.completedScans.length,
            stats: this.stats
        };
    }

    /**
     * Get recent findings
     */
    getRecentFindings(limit = 20) {
        const allFindings = this.completedScans
            .flatMap(s => s.findings)
            .sort((a, b) => b.timestamp - a.timestamp);

        return allFindings.slice(0, limit);
    }

    /**
     * Clear completed scans (keep last N)
     */
    cleanup(keep = 100) {
        if (this.completedScans.length > keep) {
            this.completedScans = this.completedScans.slice(-keep);
        }
    }
}

module.exports = ScanQueue;
