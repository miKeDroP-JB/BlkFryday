/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   INTEGRATION HELPERS - Cross-module event handlers                       ║
 * ║   "Everything connected, everything in sync"                              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Provides helper functions to coordinate between avatars, nodes, and WebSocket
 * updates. These handlers trigger dashboard updates after state changes.
 */

import { triggerDashboardUpdate } from './ws-server.js';
import { updateTwinAvatar, getTwinStats } from '../avatars/twin-avatar.js';
import { updateSpiritAnimal, getSpiritStats } from '../avatars/spirit-animal.js';
import { sigilAI } from '../nodes/sigil-ai.js';
import { giftNode } from '../nodes/gift-node.js';
import { eKo } from '../nodes/eko-token.js';
import { userStorage } from './storage-hybrid.js';

// In-memory user context cache (for quick lookups)
const userContextCache = new Map();

/**
 * Get or create user context
 */
export function getUserContext(userId) {
    if (!userContextCache.has(userId)) {
        userContextCache.set(userId, {
            userId,
            memory: [],
            preferences: {},
            trusted: false
        });
    }
    return userContextCache.get(userId);
}

/**
 * Update user context in cache
 */
export function setUserContext(userId, context) {
    userContextCache.set(userId, { ...context, userId });
}

/**
 * Handle XP and Bond gains
 * Updates Twin Avatar XP and Spirit Animal bond, then triggers dashboard update
 */
export function handleXPandBond(userId, xpGained, bondGained) {
    try {
        const userContext = getUserContext(userId);

        // Initialize twin if needed and add XP
        userContext.twin = userContext.twin || {
            name: 'Twin',
            XP: 0,
            level: 1,
            abilities: ['observe'],
            totalInteractions: 0,
            discoveries: 0
        };
        userContext.twin.XP += xpGained;
        userContext.twin.totalInteractions++;

        // Check for level up (every 50 XP per level)
        while (userContext.twin.XP >= userContext.twin.level * 50 && userContext.twin.level < 10) {
            userContext.twin.XP -= userContext.twin.level * 50;
            userContext.twin.level++;
        }

        // Initialize spirit if needed and add bond
        userContext.spiritAnimal = userContext.spiritAnimal || {
            species: 'phoenix',
            bond: 10,
            level: 1,
            totalInteractions: 0
        };
        userContext.spiritAnimal.bond += bondGained;
        userContext.spiritAnimal.totalInteractions++;

        // Check for spirit level up (every 20 bond per level)
        while (userContext.spiritAnimal.bond >= userContext.spiritAnimal.level * 20 && userContext.spiritAnimal.level < 5) {
            userContext.spiritAnimal.bond -= userContext.spiritAnimal.level * 20;
            userContext.spiritAnimal.level++;
        }

        // Update cache
        setUserContext(userId, userContext);

        // Trigger WebSocket update
        triggerDashboardUpdate(userId, {
            event: 'xp_bond_update',
            xpGained,
            bondGained,
            twin: getTwinStats(userContext),
            spirit: getSpiritStats(userContext)
        });

        return {
            success: true,
            twin: userContext.twin,
            spirit: userContext.spiritAnimal
        };
    } catch (err) {
        console.error(`[Integration] XP/Bond update failed for ${userId}:`, err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Handle Gift + EKO transfer
 * Records gift in GiftNode and transfers EKO tokens
 */
export function handleGift(fromUser, toUser, amount, purpose, type = 'appreciation') {
    try {
        // Record gift
        const gift = giftNode.giveGift({
            fromUser,
            toUser,
            amount,
            purpose,
            type
        });

        // Transfer EKO tokens
        let transferResult = null;
        try {
            transferResult = eKo.transfer(fromUser, toUser, amount, purpose);
        } catch (transferErr) {
            console.warn(`[Integration] EKO transfer failed: ${transferErr.message}`);
            // Gift still recorded even if transfer fails
        }

        // Trigger dashboard updates for both users
        triggerDashboardUpdate(fromUser, {
            event: 'gift_sent',
            gift,
            ekoTransfer: transferResult
        });
        triggerDashboardUpdate(toUser, {
            event: 'gift_received',
            gift,
            ekoTransfer: transferResult
        });

        return {
            success: true,
            gift,
            ekoTransfer: transferResult
        };
    } catch (err) {
        console.error(`[Integration] Gift/EKO transfer failed:`, err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Handle Sigil pattern unlock
 * Forces a specific pattern to be unlocked for a user
 */
export function handleSigilUnlock(userId, pattern) {
    try {
        const userContext = getUserContext(userId);

        // Initialize sigil state
        userContext.sigil = userContext.sigil || {
            score: 0,
            level: 1,
            patternsUnlocked: ['reverse', 'mirror'],
            totalTransformations: 0
        };

        // Add pattern if not already unlocked
        if (!userContext.sigil.patternsUnlocked.includes(pattern)) {
            userContext.sigil.patternsUnlocked.push(pattern);
        }

        // Update cache
        setUserContext(userId, userContext);

        // Trigger dashboard update
        triggerDashboardUpdate(userId, {
            event: 'sigil_unlock',
            pattern,
            patternsUnlocked: userContext.sigil.patternsUnlocked
        });

        return {
            success: true,
            pattern,
            patternsUnlocked: userContext.sigil.patternsUnlocked
        };
    } catch (err) {
        console.error(`[Integration] Sigil unlock failed for ${userId}:`, err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Issue EKO tokens to user
 */
export function handleEkoIssue(userId, amount, reason = 'interaction') {
    try {
        const result = eKo.issue(userId, amount, reason);

        triggerDashboardUpdate(userId, {
            event: 'eko_issued',
            amount,
            reason,
            balance: result.balance
        });

        return { success: true, ...result };
    } catch (err) {
        console.error(`[Integration] EKO issue failed:`, err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Handle level up event
 */
export function handleLevelUp(userId, type, newLevel) {
    triggerDashboardUpdate(userId, {
        event: 'level_up',
        type, // 'twin', 'spirit', 'sigil'
        newLevel
    });
}

/**
 * Get full user state for dashboard
 */
export function getFullUserState(userId) {
    const userContext = getUserContext(userId);

    return {
        userId,
        twin: getTwinStats(userContext),
        spirit: getSpiritStats(userContext),
        sigil: sigilAI.getStats(userContext),
        karma: giftNode.getKarma(userId),
        ekoBalance: eKo.balance(userId),
        timestamp: Date.now()
    };
}

/**
 * Bulk update after pipeline processing
 */
export function handlePipelineComplete(userId, results, userContext) {
    // Update avatars
    const twin = updateTwinAvatar(userContext, results);
    const spirit = updateSpiritAnimal(userContext);

    // Update cache
    setUserContext(userId, userContext);

    // Trigger comprehensive dashboard update
    triggerDashboardUpdate(userId, {
        event: 'pipeline_complete',
        twin,
        spirit,
        moduleResults: results.map(r => ({
            node: r.node,
            success: r.success,
            latency: r.latency
        }))
    });

    return { twin, spirit };
}

export default {
    getUserContext,
    setUserContext,
    handleXPandBond,
    handleGift,
    handleSigilUnlock,
    handleEkoIssue,
    handleLevelUp,
    getFullUserState,
    handlePipelineComplete
};
