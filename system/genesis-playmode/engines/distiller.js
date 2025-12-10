/**
 * Distiller
 * Strategy storage and extraction
 */

class Distiller {
    constructor() {
        this.strategies = [];
        this.maxStrategies = 1000;
    }

    distill(solution, context) {
        const strategy = {
            id: `strat_${Date.now()}`,
            pattern: this._extractPattern(solution),
            context: context,
            score: solution.score || 0,
            uses: 0,
            timestamp: Date.now()
        };

        this.strategies.push(strategy);

        if (this.strategies.length > this.maxStrategies) {
            this._prune();
        }

        return strategy;
    }

    _extractPattern(solution) {
        return {
            steps: solution.path?.length || 0,
            approach: solution.approach || 'unknown',
            signature: JSON.stringify(solution).slice(0, 100)
        };
    }

    findSimilar(context, limit = 5) {
        return this.strategies
            .filter(s => this._contextMatch(s.context, context))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    _contextMatch(a, b) {
        if (!a || !b) return false;
        return a.type === b.type;
    }

    _prune() {
        this.strategies.sort((a, b) => b.score - a.score);
        this.strategies = this.strategies.slice(0, this.maxStrategies * 0.8);
    }

    getStats() {
        return {
            count: this.strategies.length,
            avgScore: this.strategies.reduce((s, x) => s + x.score, 0) / this.strategies.length || 0
        };
    }
}

module.exports = Distiller;
