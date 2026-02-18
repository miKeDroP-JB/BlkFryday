/**
 * HyperModeManager.js
 * Central control hub for advanced Amoeba features
 * Integrates heatmap, evolution tracing, UBS scheduling, and real-time broadcast
 */

const path = require('path');

// Safe require helper - gracefully handles missing modules
const safeRequire = (p) => {
    try {
        return require(p);
    } catch (e) {
        console.warn(`[HyperMode] missing module: ${p}`);
        return null;
    }
};

// Optional subsystem imports
const heatmap = safeRequire('../amoeba/heatmap/Heatmap');
const evoTrace = safeRequire('../amoeba/evo_trace/trace');
const UBS = safeRequire('../amoeba/ubs/scheduler');
const commandBus = safeRequire('../amoeba/command_bus/bus');
const lineage = safeRequire('../realtime/lineage_store');
const wsUltra = safeRequire('../realtime/ws_broadcaster_ultra');

class HyperModeManager {
    constructor(config = {}) {
        this.config = config;
        this.enabled = true;

        // Initialize subsystems
        this.heatmap = heatmap ? new heatmap(this.config.heatmap || {}) : null;
        this.ubs = UBS ? new UBS(this.config.ubs || {}) : null;
        this.bus = commandBus ? commandBus.init(this.config.commandBus || {}) : null;
        this.lineage = lineage || null;
        this.ws = wsUltra || null;
        this.evo = evoTrace || null;
        this.voxel = null;

        // Stats
        this.stats = {
            phasesStarted: 0,
            branchesSpawned: 0,
            branchesCompleted: 0,
            wins: 0,
            startTime: Date.now()
        };

        // Initialize WebSocket broadcaster
        if (this.ws && this.ws.initBroadcaster) {
            this.ws.initBroadcaster(this.config.wsPort || 8081);
        }

        console.log('[HyperMode] 🚀 initialized');
    }

    /**
     * Called when a phase starts
     */
    onPhaseStart(phase, ctx) {
        this.stats.phasesStarted++;

        if (this.ws && this.ws.broadcast) {
            this.ws.broadcast({
                type: 'phase',
                phase,
                ts: Date.now()
            });
        }

        if (this.heatmap && ctx?.fingerprint) {
            this.heatmap.markPhase(phase, ctx.fingerprint);
        }
    }

    /**
     * Spawn a new branch
     */
    spawnBranch(parentId, meta = {}) {
        this.stats.branchesSpawned++;
        let node = null;

        try {
            if (this.lineage && this.lineage.spawn) {
                node = this.lineage.spawn(parentId, meta);
            }
        } catch (e) {
            console.warn('[HyperMode] lineage spawn error:', e.message);
        }

        if (this.ws && this.ws.broadcast) {
            this.ws.broadcast({
                type: 'branch_spawn',
                id: node ? node.id : null,
                parent: parentId,
                meta,
                ts: Date.now()
            });
        }

        if (this.evo && this.evo.recordSpawn) {
            this.evo.recordSpawn(node || { parent: parentId, meta });
        }

        return node;
    }

    /**
     * Mark a branch as complete
     */
    completeBranch(id, result) {
        this.stats.branchesCompleted++;

        if (result?.status === 'win') {
            this.stats.wins++;
        }

        try {
            if (this.lineage && this.lineage.complete) {
                this.lineage.complete(id, result);
            }
        } catch (e) {
            console.warn('[HyperMode] lineage complete error:', e.message);
        }

        if (this.ws && this.ws.broadcast) {
            this.ws.broadcast({
                type: 'branch_complete',
                id,
                result,
                ts: Date.now()
            });
        }

        if (this.evo && this.evo.recordComplete) {
            this.evo.recordComplete(id, result);
        }

        if (this.heatmap && result?.fingerprint) {
            this.heatmap.update(result.fingerprint, result.phase, result.score);
        }
    }

    /**
     * Submit AST diff for visualization
     */
    submitAstDiff(id, prev, next) {
        try {
            if (this.ws && this.ws.broadcastDiff) {
                this.ws.broadcastDiff(prev, next, id);
            }
        } catch (e) {
            console.warn('[HyperMode] AST diff error:', e.message);
        }
    }

    /**
     * Schedule beam search with UBS
     */
    scheduleWithUBS(beam, ctx) {
        if (this.ubs && this.ubs.schedule) {
            return this.ubs.schedule(beam, ctx, this.config.ubs || {});
        }
        return null;
    }

    /**
     * Broadcast metrics update
     */
    broadcastMetrics(metrics) {
        if (this.ws && this.ws.broadcast) {
            this.ws.broadcast({
                type: 'metric_update',
                ...metrics,
                stats: this.stats,
                ts: Date.now()
            });
        }
    }

    /**
     * Attach voxel renderer for 3D visualization
     */
    attachVoxelRenderer(renderer) {
        this.voxel = renderer;
    }

    /**
     * Get current state snapshot
     */
    getStateSnapshot() {
        return {
            heatmap: this.heatmap ? this.heatmap.snapshot() : null,
            lineage: this.lineage ? this.lineage.snapshot() : null,
            stats: this.stats,
            uptime: Date.now() - this.stats.startTime
        };
    }

    /**
     * Execute command from control bus
     */
    executeCommand(cmd, payload = {}) {
        console.log(`[HyperMode] executing command: ${cmd}`, payload);

        switch (cmd) {
            case 'boost':
                this.config.branchFactor = Math.min(15, (this.config.branchFactor || 4) + 2);
                break;
            case 'slow':
                this.config.branchFactor = Math.max(1, (this.config.branchFactor || 4) - 2);
                break;
            case 'freeze':
                this.enabled = !this.enabled;
                break;
            case 'splitFocused':
                // Trigger focused branch split
                break;
            case 'mergeClosest':
                // Trigger merge of closest branches
                break;
            default:
                console.warn(`[HyperMode] unknown command: ${cmd}`);
        }

        this.broadcastMetrics({ command: cmd, config: this.config, enabled: this.enabled });
    }

    /**
     * Cleanup and shutdown
     */
    shutdown() {
        console.log('[HyperMode] 🛑 shutting down');
        if (this.ws && this.ws.closeBroadcaster) {
            this.ws.closeBroadcaster();
        }
    }
}

module.exports = HyperModeManager;
