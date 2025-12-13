/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   AMOEBA SECURITY - Adaptive Threat Detection                             ║
 * ║   Shape-shifting protection that evolves with threats                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Threat pattern database (evolves over time)
const threatPatterns = {
    injection: [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /eval\(/i,
        /document\./i,
        /window\./i
    ],
    sqlInjection: [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
        /union.*select/i,
        /select.*from/i,
        /insert.*into/i,
        /drop\s+table/i
    ],
    suspicious: [
        /[<>{}[\]\\]/,
        /\0/,
        /\x00/
    ],
    rateAbuse: {
        maxPerMinute: 30,
        maxPerHour: 200
    }
};

// Learned patterns (adaptive)
const learnedPatterns = {
    blocked: [],
    allowed: [],
    anomalies: []
};

export const amoebaSecurity = {
    name: 'AmoebaSecurity',

    // Metrics
    metrics: {
        scans: 0,
        blocked: 0,
        anomalies: 0,
        learned: 0
    },

    /**
     * Main security scan
     */
    async scan(input, userContext) {
        this.metrics.scans++;
        const anomalies = [];
        let riskScore = 0;

        // 1. Check for injection attempts
        const injectionCheck = this.checkInjection(input);
        if (injectionCheck.detected) {
            anomalies.push(...injectionCheck.types);
            riskScore += 0.5;
        }

        // 2. Check for SQL injection
        const sqlCheck = this.checkSQLInjection(input);
        if (sqlCheck.detected) {
            anomalies.push('SQL injection attempt');
            riskScore += 0.4;
        }

        // 3. Check for suspicious patterns
        const suspiciousCheck = this.checkSuspicious(input);
        if (suspiciousCheck.detected) {
            anomalies.push('Suspicious characters');
            riskScore += 0.2;
        }

        // 4. Check rate limiting
        const rateCheck = this.checkRate(userContext);
        if (rateCheck.exceeded) {
            anomalies.push(`Rate limit exceeded: ${rateCheck.type}`);
            riskScore += 0.3;
        }

        // 5. Check against learned patterns
        const learnedCheck = this.checkLearned(input);
        if (learnedCheck.blocked) {
            anomalies.push('Matches blocked pattern');
            riskScore += 0.5;
        }
        if (learnedCheck.allowed) {
            riskScore -= 0.2; // Reduce risk for known-good patterns
        }

        // 6. Behavioral analysis
        const behaviorCheck = this.analyzeBehavior(input, userContext);
        if (behaviorCheck.anomalous) {
            anomalies.push(behaviorCheck.reason);
            riskScore += behaviorCheck.riskDelta;
        }

        // Clamp risk score
        riskScore = Math.max(0, Math.min(1, riskScore));

        // Track if blocked
        if (riskScore > 0.7) {
            this.metrics.blocked++;
        }
        if (anomalies.length > 0) {
            this.metrics.anomalies++;
        }

        return {
            input,
            anomalies,
            riskScore,
            timestamp: Date.now(),
            blocked: riskScore > 0.7,
            sanitized: riskScore > 0.7 ? this.sanitize(input) : input
        };
    },

    /**
     * Check for XSS/injection attempts
     */
    checkInjection(input) {
        const detected = [];

        for (const pattern of threatPatterns.injection) {
            if (pattern.test(input)) {
                detected.push('XSS/injection');
                break;
            }
        }

        return {
            detected: detected.length > 0,
            types: detected
        };
    },

    /**
     * Check for SQL injection
     */
    checkSQLInjection(input) {
        for (const pattern of threatPatterns.sqlInjection) {
            if (pattern.test(input)) {
                return { detected: true };
            }
        }
        return { detected: false };
    },

    /**
     * Check for suspicious characters
     */
    checkSuspicious(input) {
        for (const pattern of threatPatterns.suspicious) {
            if (pattern.test(input)) {
                return { detected: true };
            }
        }
        return { detected: false };
    },

    /**
     * Check rate limiting
     */
    checkRate(userContext) {
        if (!userContext?.recentInputs) {
            return { exceeded: false };
        }

        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const oneHourAgo = now - 3600000;

        const lastMinute = userContext.recentInputs.filter(t => t > oneMinuteAgo).length;
        const lastHour = userContext.recentInputs.filter(t => t > oneHourAgo).length;

        if (lastMinute > threatPatterns.rateAbuse.maxPerMinute) {
            return { exceeded: true, type: 'per-minute' };
        }
        if (lastHour > threatPatterns.rateAbuse.maxPerHour) {
            return { exceeded: true, type: 'per-hour' };
        }

        return { exceeded: false };
    },

    /**
     * Check against learned patterns
     */
    checkLearned(input) {
        const normalizedInput = input.toLowerCase().trim();

        for (const pattern of learnedPatterns.blocked) {
            if (normalizedInput.includes(pattern)) {
                return { blocked: true, allowed: false };
            }
        }

        for (const pattern of learnedPatterns.allowed) {
            if (normalizedInput.includes(pattern)) {
                return { blocked: false, allowed: true };
            }
        }

        return { blocked: false, allowed: false };
    },

    /**
     * Behavioral analysis
     */
    analyzeBehavior(input, userContext) {
        const result = { anomalous: false, reason: '', riskDelta: 0 };

        // Check for unusual input length
        if (input.length > 10000) {
            result.anomalous = true;
            result.reason = 'Unusually long input';
            result.riskDelta = 0.2;
        }

        // Check for repeated patterns (potential DoS)
        const repeatedPattern = /(.{10,})\1{5,}/;
        if (repeatedPattern.test(input)) {
            result.anomalous = true;
            result.reason = 'Repeated pattern detected';
            result.riskDelta = 0.3;
        }

        // Check for entropy (random gibberish)
        const entropy = this.calculateEntropy(input);
        if (entropy > 4.5 && input.length > 100) {
            result.anomalous = true;
            result.reason = 'High entropy input';
            result.riskDelta = 0.15;
        }

        return result;
    },

    /**
     * Calculate Shannon entropy
     */
    calculateEntropy(str) {
        const freq = {};
        for (const char of str) {
            freq[char] = (freq[char] || 0) + 1;
        }

        let entropy = 0;
        const len = str.length;

        for (const char in freq) {
            const p = freq[char] / len;
            entropy -= p * Math.log2(p);
        }

        return entropy;
    },

    /**
     * Sanitize input
     */
    sanitize(input) {
        return input
            .replace(/<[^>]*>/g, '')
            .replace(/[<>'"]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .substring(0, 1000);
    },

    /**
     * Learn from outcome (adaptive evolution)
     */
    learn(input, wasBlocked, wasMalicious) {
        const normalizedInput = input.toLowerCase().trim();
        const signature = normalizedInput.substring(0, 50);

        if (wasBlocked && !wasMalicious) {
            // False positive - add to allowed
            learnedPatterns.allowed.push(signature);
            this.metrics.learned++;
        } else if (!wasBlocked && wasMalicious) {
            // False negative - add to blocked
            learnedPatterns.blocked.push(signature);
            this.metrics.learned++;
        }

        // Keep learned patterns manageable
        if (learnedPatterns.allowed.length > 1000) {
            learnedPatterns.allowed = learnedPatterns.allowed.slice(-500);
        }
        if (learnedPatterns.blocked.length > 1000) {
            learnedPatterns.blocked = learnedPatterns.blocked.slice(-500);
        }
    },

    /**
     * Get security metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
};

export default amoebaSecurity;
