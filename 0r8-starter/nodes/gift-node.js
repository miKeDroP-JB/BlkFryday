/**
 * Gift Node - Community Gifting System
 * "Generosity flows through the ORB"
 *
 * Tracks gifts between users for community building,
 * rewards, and trusted creator appreciation.
 */

import fs from 'fs';
import path from 'path';

const GIFT_LOG_PATH = path.resolve('./data/giftLog.json');

// Gift types and their XP bonuses
const GIFT_TYPES = {
    appreciation: { xpBonus: 5, bondBonus: 2, emoji: '🙏' },
    reward: { xpBonus: 10, bondBonus: 5, emoji: '🏆' },
    mentorship: { xpBonus: 15, bondBonus: 8, emoji: '📚' },
    collaboration: { xpBonus: 20, bondBonus: 10, emoji: '🤝' },
    discovery: { xpBonus: 25, bondBonus: 12, emoji: '🔬' },
    genesis: { xpBonus: 50, bondBonus: 25, emoji: '✨' }
};

class GiftNode {
    constructor() {
        this.name = 'GiftNode';  // Required for module router
        this.gifts = this.loadLog();
        this.stats = {
            totalGifts: 0,
            totalValue: 0,
            topGivers: {},
            topReceivers: {}
        };
        this.calculateStats();
    }

    /**
     * Load gift log from persistent storage
     */
    loadLog() {
        try {
            if (fs.existsSync(GIFT_LOG_PATH)) {
                return JSON.parse(fs.readFileSync(GIFT_LOG_PATH, 'utf-8'));
            }
        } catch (e) {
            console.log('[GiftNode] Creating new gift log');
        }
        return [];
    }

    /**
     * Save gift log to persistent storage
     */
    saveLog() {
        try {
            const dir = path.dirname(GIFT_LOG_PATH);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(GIFT_LOG_PATH, JSON.stringify(this.gifts, null, 2));
        } catch (e) {
            console.error('[GiftNode] Failed to save log:', e.message);
        }
    }

    /**
     * Calculate aggregate statistics
     */
    calculateStats() {
        this.stats.totalGifts = this.gifts.length;
        this.stats.totalValue = this.gifts.reduce((sum, g) => sum + (g.amount || 0), 0);

        // Reset counters
        this.stats.topGivers = {};
        this.stats.topReceivers = {};

        for (const gift of this.gifts) {
            // Track givers
            if (!this.stats.topGivers[gift.fromUser]) {
                this.stats.topGivers[gift.fromUser] = { count: 0, value: 0 };
            }
            this.stats.topGivers[gift.fromUser].count++;
            this.stats.topGivers[gift.fromUser].value += gift.amount || 0;

            // Track receivers
            if (!this.stats.topReceivers[gift.toUser]) {
                this.stats.topReceivers[gift.toUser] = { count: 0, value: 0 };
            }
            this.stats.topReceivers[gift.toUser].count++;
            this.stats.topReceivers[gift.toUser].value += gift.amount || 0;
        }
    }

    /**
     * Give a gift from one user to another
     */
    giveGift({ fromUser, toUser, amount, purpose, type = 'appreciation' }) {
        const giftType = GIFT_TYPES[type] || GIFT_TYPES.appreciation;

        const giftEntry = {
            id: `gift_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            fromUser,
            toUser,
            amount: amount || 0,
            purpose: purpose || 'General appreciation',
            type,
            emoji: giftType.emoji,
            xpBonus: giftType.xpBonus,
            bondBonus: giftType.bondBonus,
            timestamp: new Date().toISOString()
        };

        this.gifts.push(giftEntry);
        this.saveLog();
        this.calculateStats();

        return giftEntry;
    }

    /**
     * Get all gifts for a specific user (given or received)
     */
    getUserGifts(userId) {
        return {
            given: this.gifts.filter(g => g.fromUser === userId),
            received: this.gifts.filter(g => g.toUser === userId),
            total: this.gifts.filter(g => g.toUser === userId || g.fromUser === userId)
        };
    }

    /**
     * Get user's gift karma (received - given balance)
     */
    getKarma(userId) {
        const userGifts = this.getUserGifts(userId);
        const received = userGifts.received.reduce((sum, g) => sum + (g.amount || 0), 0);
        const given = userGifts.given.reduce((sum, g) => sum + (g.amount || 0), 0);

        return {
            received,
            given,
            karma: received - given,
            giftsReceived: userGifts.received.length,
            giftsGiven: userGifts.given.length,
            isGenerous: given > received
        };
    }

    /**
     * Get all gifts in the system
     */
    getAllGifts() {
        return this.gifts;
    }

    /**
     * Get system statistics
     */
    getStats() {
        return {
            ...this.stats,
            giftTypes: Object.keys(GIFT_TYPES)
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

        // Detect gift intent
        const giftMatch = lowerInput.match(/gift\s+(\w+)\s+to\s+(\w+)/);
        const checkMatch = lowerInput.match(/my\s+gifts|gift\s+history|karma/);

        if (giftMatch) {
            const [, type, toUser] = giftMatch;
            const gift = this.giveGift({
                fromUser: userContext.userId || 'anonymous',
                toUser,
                amount: 1,
                purpose: rawInput,
                type: GIFT_TYPES[type] ? type : 'appreciation'
            });

            return {
                name: 'GiftNode',
                action: 'give',
                gift,
                message: `${gift.emoji} Gift sent to ${toUser}!`,
                xpGain: gift.xpBonus,
                bondGain: gift.bondBonus
            };
        }

        if (checkMatch) {
            const karma = this.getKarma(userContext.userId || 'anonymous');
            return {
                name: 'GiftNode',
                action: 'check',
                karma,
                message: karma.isGenerous
                    ? `You're a generous soul! Given: ${karma.giftsGiven}, Received: ${karma.giftsReceived}`
                    : `Karma: ${karma.karma}. Gifts received: ${karma.giftsReceived}`
            };
        }

        return {
            name: 'GiftNode',
            action: 'info',
            stats: this.getStats(),
            message: 'Gift Node ready. Use "gift [type] to [user]" or "my gifts" to check karma.'
        };
    }
}

export const giftNode = new GiftNode();

export default giftNode;
