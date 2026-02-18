/**
 * Fingerprint
 * Grid and state fingerprinting for pattern matching
 */

class Fingerprint {
    constructor() {
        this.cache = new Map();
    }

    compute(grid) {
        if (!grid) return 'empty';

        const key = JSON.stringify(grid);
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        const fp = this._hash(key);
        this.cache.set(key, fp);

        return fp;
    }

    _hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    computeFeatures(grid) {
        if (!grid || !Array.isArray(grid)) {
            return { width: 0, height: 0, colors: [], density: 0 };
        }

        const height = grid.length;
        const width = grid[0]?.length || 0;
        const colorSet = new Set();
        let nonZero = 0;

        for (const row of grid) {
            for (const cell of row) {
                colorSet.add(cell);
                if (cell !== 0) nonZero++;
            }
        }

        return {
            width,
            height,
            colors: Array.from(colorSet),
            density: nonZero / (width * height || 1),
            fingerprint: this.compute(grid)
        };
    }

    similarity(fp1, fp2) {
        if (fp1 === fp2) return 1.0;

        const f1 = this.computeFeatures(fp1);
        const f2 = this.computeFeatures(fp2);

        let score = 0;
        if (f1.width === f2.width) score += 0.2;
        if (f1.height === f2.height) score += 0.2;
        if (Math.abs(f1.density - f2.density) < 0.1) score += 0.3;

        const colorOverlap = f1.colors.filter(c => f2.colors.includes(c)).length;
        score += (colorOverlap / Math.max(f1.colors.length, f2.colors.length, 1)) * 0.3;

        return score;
    }

    clearCache() {
        this.cache.clear();
    }
}

module.exports = Fingerprint;
