/**
 * EkoToken - Internal Economy Token System
 * "Value flows through the ORB"
 *
 * The EKO token powers the 0r8 ecosystem economy:
 * - Earned through contributions, discoveries, mentorship
 * - Spent on premium features, gifts, unlocks
 * - Transferred between users for collaboration
 */

import fs from 'fs';
import path from 'path';

const LEDGER_PATH = path.resolve('./data/ekoLedger.json');

// Token earning rates
const EARN_RATES = {
    interaction: 1,        // Basic interaction
    discovery: 10,         // Research discovery
    mentorship: 5,         // Teaching others
    contribution: 15,      // Code/content contribution
    referral: 25,          // Bringing new users
    genesis: 100           // Special genesis events
};

// Minimum balances for features
const FEATURE_COSTS = {
    customAvatar: 50,
    premiumPatterns: 100,
    researchBoost: 25,
    mentorSession: 75,
    collaborationRoom: 200
};

class EkoToken {
    constructor() {
        this.name = 'EkoToken';  // Required for module router
        this.ledger = this.loadLedger();
        this.transactions = [];
        this.stats = {
            totalIssued: 0,
            totalTransferred: 0,
            totalBurned: 0
        };
        this.calculateStats();
    }

    /**
     * Load ledger from persistent storage
     */
    loadLedger() {
        try {
            if (fs.existsSync(LEDGER_PATH)) {
                const data = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf-8'));
                return data.ledger || {};
            }
        } catch (e) {
            console.log('[EkoToken] Creating new ledger');
        }
        return {};
    }

    /**
     * Save ledger to persistent storage
     */
    saveLedger() {
        try {
            const dir = path.dirname(LEDGER_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(LEDGER_PATH, JSON.stringify({
                ledger: this.ledger,
                stats: this.stats,
                lastUpdated: new Date().toISOString()
            }, null, 2));
        } catch (e) {
            console.error('[EkoToken] Failed to save ledger:', e.message);
        }
    }

    /**
     * Calculate aggregate statistics
     */
    calculateStats() {
        this.stats.totalIssued = Object.values(this.ledger).reduce((sum, bal) => sum + bal, 0);
    }

    /**
     * Issue tokens to a user (minting)
     */
    issue(userId, amount, reason = 'interaction') {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        if (!this.ledger[userId]) this.ledger[userId] = 0;
        this.ledger[userId] += amount;
        this.stats.totalIssued += amount;

        const tx = {
            id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: 'issue',
            to: userId,
            amount,
            reason,
            timestamp: new Date().toISOString()
        };
        this.transactions.push(tx);
        this.saveLedger();

        return {
            balance: this.ledger[userId],
            issued: amount,
            reason,
            transaction: tx.id
        };
    }

    /**
     * Transfer tokens between users
     */
    transfer(fromUser, toUser, amount, memo = '') {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        if (!this.ledger[fromUser] || this.ledger[fromUser] < amount) {
            throw new Error(`Insufficient balance. Have: ${this.ledger[fromUser] || 0}, Need: ${amount}`);
        }

        if (!this.ledger[toUser]) this.ledger[toUser] = 0;

        this.ledger[fromUser] -= amount;
        this.ledger[toUser] += amount;
        this.stats.totalTransferred += amount;

        const tx = {
            id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: 'transfer',
            from: fromUser,
            to: toUser,
            amount,
            memo,
            timestamp: new Date().toISOString()
        };
        this.transactions.push(tx);
        this.saveLedger();

        return {
            from: { user: fromUser, balance: this.ledger[fromUser] },
            to: { user: toUser, balance: this.ledger[toUser] },
            amount,
            transaction: tx.id
        };
    }

    /**
     * Burn tokens (remove from circulation)
     */
    burn(userId, amount, reason = 'feature_unlock') {
        if (amount <= 0) {
            throw new Error('Amount must be positive');
        }

        if (!this.ledger[userId] || this.ledger[userId] < amount) {
            throw new Error(`Insufficient balance. Have: ${this.ledger[userId] || 0}, Need: ${amount}`);
        }

        this.ledger[userId] -= amount;
        this.stats.totalBurned += amount;

        const tx = {
            id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: 'burn',
            from: userId,
            amount,
            reason,
            timestamp: new Date().toISOString()
        };
        this.transactions.push(tx);
        this.saveLedger();

        return {
            balance: this.ledger[userId],
            burned: amount,
            reason,
            transaction: tx.id
        };
    }

    /**
     * Get user balance
     */
    balance(userId) {
        return this.ledger[userId] || 0;
    }

    /**
     * Get all balances
     */
    allBalances() {
        return { ...this.ledger };
    }

    /**
     * Get top holders
     */
    topHolders(limit = 10) {
        return Object.entries(this.ledger)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([user, balance]) => ({ user, balance }));
    }

    /**
     * Check if user can afford a feature
     */
    canAfford(userId, feature) {
        const cost = FEATURE_COSTS[feature];
        if (!cost) return { canAfford: false, error: 'Unknown feature' };

        const balance = this.balance(userId);
        return {
            canAfford: balance >= cost,
            balance,
            cost,
            feature
        };
    }

    /**
     * Unlock a feature (burns tokens)
     */
    unlockFeature(userId, feature) {
        const check = this.canAfford(userId, feature);
        if (!check.canAfford) {
            return {
                success: false,
                error: check.error || `Need ${check.cost} EKO, have ${check.balance}`
            };
        }

        this.burn(userId, check.cost, `unlock_${feature}`);
        return {
            success: true,
            feature,
            cost: check.cost,
            remainingBalance: this.balance(userId)
        };
    }

    /**
     * Get earning rate for an action
     */
    getEarnRate(action) {
        return EARN_RATES[action] || EARN_RATES.interaction;
    }

    /**
     * Get system statistics
     */
    getStats() {
        return {
            ...this.stats,
            holders: Object.keys(this.ledger).length,
            recentTransactions: this.transactions.slice(-10),
            earnRates: EARN_RATES,
            featureCosts: FEATURE_COSTS
        };
    }

    /**
     * Process for ORB pipeline integration
     */
    async process(filteredData, userContext = {}) {
        // Handle both object (from pipeline) and string (direct) input
        const rawInput = typeof filteredData === 'object'
            ? (filteredData.original || filteredData.raw || JSON.stringify(filteredData))
            : String(filteredData);
        const lowerInput = rawInput.toLowerCase();
        const userId = userContext.userId || 'anonymous';

        // Check balance
        if (/balance|eko|tokens?|wallet/.test(lowerInput)) {
            const balance = this.balance(userId);
            const stats = this.getStats();
            return {
                name: 'EkoToken',
                action: 'balance',
                balance,
                message: `You have ${balance} EKO tokens`,
                topHolders: this.topHolders(5),
                stats: {
                    totalHolders: stats.holders,
                    totalIssued: stats.totalIssued
                }
            };
        }

        // Transfer tokens
        const transferMatch = lowerInput.match(/(?:send|transfer|pay)\s+(\d+)\s+(?:eko|tokens?)?\s*(?:to\s+)?(\w+)/);
        if (transferMatch) {
            const [, amountStr, toUser] = transferMatch;
            const amount = parseInt(amountStr, 10);

            try {
                const result = this.transfer(userId, toUser, amount, rawInput);
                return {
                    name: 'EkoToken',
                    action: 'transfer',
                    success: true,
                    ...result,
                    message: `Sent ${amount} EKO to ${toUser}`
                };
            } catch (e) {
                return {
                    name: 'EkoToken',
                    action: 'transfer',
                    success: false,
                    error: e.message
                };
            }
        }

        // Earn tokens from interaction
        const earnRate = this.getEarnRate('interaction');
        const multiplier = userContext.trusted ? 2 : 1;
        const earned = earnRate * multiplier;

        this.issue(userId, earned, 'interaction');

        return {
            name: 'EkoToken',
            action: 'earn',
            earned,
            balance: this.balance(userId),
            message: `+${earned} EKO`,
            multiplier: userContext.trusted ? '2x (trusted)' : '1x'
        };
    }
}

export const eKo = new EkoToken();

export default eKo;
