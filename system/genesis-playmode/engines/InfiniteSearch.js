/**
 * InfiniteSearch V3.6
 * Beam + DFS hybrid engine with human adaptation
 */

class InfiniteSearch {
    constructor(config = {}) {
        this.name = 'InfiniteSearch';
        this.version = '3.6';

        this.params = {
            beamWidth: config.beamWidth || 8,
            maxDepth: config.maxDepth || 20,
            dfsProbability: config.dfsProbability || 0.3
        };

        this.state = {
            phase: 'idle',
            currentDepth: 0,
            nodesExplored: 0,
            bestScore: 0
        };

        this.humanMultiplier = 1.0;

        console.log(`[InfiniteSearch] v${this.version} initialized`);
    }

    adaptToHuman(feedback) {
        if (!feedback || !feedback.metrics) return;

        const metrics = feedback.metrics;
        this.humanMultiplier = (metrics.energy / 100 + metrics.focus / 100) / 2;

        // Adjust parameters
        this.params.beamWidth = Math.round(8 * this.humanMultiplier);
        this.params.dfsProbability = metrics.focus > 70 ? 0.4 : 0.3;
    }

    setParameters(params) {
        Object.assign(this.params, params);
    }

    async search(startState) {
        this.state.phase = 'searching';
        this.state.currentDepth = 0;
        this.state.nodesExplored = 0;

        let beam = [{ state: startState, score: 0, path: [] }];

        while (this.state.currentDepth < this.params.maxDepth) {
            // Expand beam
            const candidates = [];

            for (const node of beam) {
                const expansions = await this._expand(node);
                candidates.push(...expansions);
                this.state.nodesExplored += expansions.length;
            }

            // DFS probe with probability
            if (Math.random() < this.params.dfsProbability) {
                const dfsResult = await this._dfsProbe(candidates[0]);
                if (dfsResult) candidates.push(dfsResult);
            }

            // Select beam
            beam = candidates
                .sort((a, b) => b.score - a.score)
                .slice(0, this.params.beamWidth);

            // Update best
            if (beam[0] && beam[0].score > this.state.bestScore) {
                this.state.bestScore = beam[0].score;
            }

            this.state.currentDepth++;
        }

        this.state.phase = 'complete';
        return beam[0];
    }

    async _expand(node) {
        const expansions = [];
        const count = 3 + Math.floor(Math.random() * 3);

        for (let i = 0; i < count; i++) {
            expansions.push({
                state: { ...node.state, step: (node.state.step || 0) + 1 },
                score: node.score + Math.random() * 10 * this.humanMultiplier,
                path: [...node.path, i]
            });
        }

        return expansions;
    }

    async _dfsProbe(node) {
        if (!node) return null;

        let current = node;
        const maxProbe = 5;

        for (let i = 0; i < maxProbe; i++) {
            const expansions = await this._expand(current);
            if (expansions.length === 0) break;
            current = expansions[Math.floor(Math.random() * expansions.length)];
        }

        return current;
    }

    getState() {
        return { ...this.state, params: this.params };
    }
}

module.exports = InfiniteSearch;
