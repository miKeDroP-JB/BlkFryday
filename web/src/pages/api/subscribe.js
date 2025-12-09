/**
 * SUBSCRIPTION API - Stripe Integration
 * ═══════════════════════════════════════════════════════════════════
 * Direct Stripe integration - 0% gatekeeper cut, full user control.
 *
 * Plans:
 * - Free Tier: Basic access, viral onboarding
 * - EKO+ ($9.99/mo): Full access, all apps, priority agents
 * - EKO Pro ($29.99/mo): Everything + API access, custom rituals
 *
 * Features:
 * - Gift Forward system for viral growth
 * - Referral credits
 * - Trial periods
 * ═══════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');

const API_VERSION = '1.0.0';

// Subscription Plans
const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free Tier',
    price: 0,
    currency: 'usd',
    interval: null,
    features: [
      'Basic agent access',
      'Limited ritual participation',
      'Community features',
      '3 agent tasks/day',
    ],
    limits: {
      agentTasksPerDay: 3,
      ritualsPerMonth: 2,
      storageGB: 1,
    },
  },
  EKO_PLUS: {
    id: 'eko_plus',
    name: 'EKO+',
    price: 999, // cents
    currency: 'usd',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_EKO_PLUS || 'price_eko_plus',
    features: [
      'Full agent access - all 7 archetypes',
      'Unlimited ritual participation',
      'Priority agent queue',
      'EKO Apps: SANCTUARY, GROUND, HARBOR, COMPASS',
      'Voice interface',
      'Custom agent personalities',
      '50 agent tasks/day',
    ],
    limits: {
      agentTasksPerDay: 50,
      ritualsPerMonth: -1, // unlimited
      storageGB: 10,
    },
  },
  EKO_PRO: {
    id: 'eko_pro',
    name: 'EKO Pro',
    price: 2999, // cents
    currency: 'usd',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_EKO_PRO || 'price_eko_pro',
    features: [
      'Everything in EKO+',
      'API access',
      'Custom rituals creation',
      'White-label options',
      'Priority support',
      'Agent swarm orchestration',
      'Unlimited agent tasks',
      'Early access to new features',
    ],
    limits: {
      agentTasksPerDay: -1, // unlimited
      ritualsPerMonth: -1,
      storageGB: 100,
    },
  },
};

// Gift Forward Configuration
const GIFT_CONFIG = {
  creditAmount: 999, // 1 month free for both giver and receiver
  maxGiftsPerUser: 10,
  expiryDays: 30,
};

// Mock data stores
const stores = {
  subscriptions: new Map(),
  gifts: new Map(),
  referrals: new Map(),
  credits: new Map(),
};

/**
 * Response helpers
 */
const respond = (res, data, status = 200) => {
  return res.status(status).json({
    success: status < 400,
    version: API_VERSION,
    timestamp: Date.now(),
    data,
  });
};

const error = (res, message, status = 400) => {
  return res.status(status).json({
    success: false,
    version: API_VERSION,
    timestamp: Date.now(),
    error: message,
  });
};

/**
 * Get user from request
 */
const getUser = (req) => {
  return {
    id: req.headers['x-user-id'] || req.query.userId || 'anonymous',
    email: req.headers['x-user-email'] || null,
  };
};

/**
 * Route handlers
 */
const handlers = {
  // ═══════════════════════════════════════════════════════════════════
  // PLANS
  // ═══════════════════════════════════════════════════════════════════

  'GET /plans': (req, res) => {
    const plans = Object.values(PLANS).map(plan => ({
      ...plan,
      priceFormatted: plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(2)}/${plan.interval}`,
    }));

    return respond(res, {
      plans,
      currency: 'usd',
      giftForwardEnabled: true,
    });
  },

  // ═══════════════════════════════════════════════════════════════════
  // SUBSCRIPTION STATUS
  // ═══════════════════════════════════════════════════════════════════

  'GET /status': (req, res) => {
    const user = getUser(req);
    const subscription = stores.subscriptions.get(user.id);
    const credits = stores.credits.get(user.id) || 0;

    if (!subscription) {
      return respond(res, {
        plan: PLANS.FREE,
        status: 'active',
        credits,
        usage: {
          agentTasksToday: 0,
          ritualsThisMonth: 0,
        },
      });
    }

    return respond(res, {
      ...subscription,
      credits,
    });
  },

  // ═══════════════════════════════════════════════════════════════════
  // CREATE CHECKOUT SESSION
  // ═══════════════════════════════════════════════════════════════════

  'POST /checkout': async (req, res) => {
    const user = getUser(req);
    const { planId, successUrl, cancelUrl } = req.body || {};

    if (!planId) {
      return error(res, 'Plan ID required');
    }

    const plan = Object.values(PLANS).find(p => p.id === planId);
    if (!plan) {
      return error(res, 'Invalid plan ID');
    }

    if (plan.price === 0) {
      return error(res, 'Cannot checkout free plan');
    }

    // Check for credits
    const credits = stores.credits.get(user.id) || 0;
    const adjustedPrice = Math.max(0, plan.price - credits);

    // Create checkout session (mock - in production use Stripe SDK)
    const session = {
      id: `cs_${crypto.randomBytes(16).toString('hex')}`,
      url: `https://checkout.stripe.com/mock/${crypto.randomBytes(8).toString('hex')}`,
      planId: plan.id,
      amount: adjustedPrice,
      originalAmount: plan.price,
      creditsApplied: credits,
      currency: plan.currency,
      userId: user.id,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      successUrl: successUrl || '/subscribe/success',
      cancelUrl: cancelUrl || '/subscribe/cancel',
    };

    return respond(res, {
      session,
      message: credits > 0
        ? `$${(credits / 100).toFixed(2)} in credits applied!`
        : null,
    }, 201);
  },

  // ═══════════════════════════════════════════════════════════════════
  // CONFIRM SUBSCRIPTION (webhook simulation)
  // ═══════════════════════════════════════════════════════════════════

  'POST /confirm': (req, res) => {
    const { sessionId, userId, planId } = req.body || {};

    if (!userId || !planId) {
      return error(res, 'Missing required fields');
    }

    const plan = Object.values(PLANS).find(p => p.id === planId);
    if (!plan) {
      return error(res, 'Invalid plan');
    }

    const subscription = {
      id: `sub_${crypto.randomBytes(16).toString('hex')}`,
      userId,
      plan,
      status: 'active',
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      createdAt: new Date().toISOString(),
    };

    stores.subscriptions.set(userId, subscription);

    // Clear applied credits
    stores.credits.delete(userId);

    return respond(res, {
      subscription,
      message: `Welcome to ${plan.name}!`,
    });
  },

  // ═══════════════════════════════════════════════════════════════════
  // CANCEL SUBSCRIPTION
  // ═══════════════════════════════════════════════════════════════════

  'POST /cancel': (req, res) => {
    const user = getUser(req);
    const subscription = stores.subscriptions.get(user.id);

    if (!subscription) {
      return error(res, 'No active subscription');
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date().toISOString();
    subscription.cancelAtPeriodEnd = true;

    stores.subscriptions.set(user.id, subscription);

    return respond(res, {
      subscription,
      message: `Your subscription will remain active until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`,
    });
  },

  // ═══════════════════════════════════════════════════════════════════
  // GIFT FORWARD
  // ═══════════════════════════════════════════════════════════════════

  'POST /gift': (req, res) => {
    const user = getUser(req);
    const { recipientEmail, message } = req.body || {};

    if (!recipientEmail) {
      return error(res, 'Recipient email required');
    }

    // Check gift limits
    const userGifts = stores.gifts.get(user.id) || [];
    if (userGifts.length >= GIFT_CONFIG.maxGiftsPerUser) {
      return error(res, `Maximum ${GIFT_CONFIG.maxGiftsPerUser} gifts allowed`);
    }

    // Create gift
    const gift = {
      id: `gift_${crypto.randomBytes(16).toString('hex')}`,
      code: crypto.randomBytes(8).toString('hex').toUpperCase(),
      fromUserId: user.id,
      recipientEmail,
      message: message || 'Enjoy EKO+ on me!',
      creditAmount: GIFT_CONFIG.creditAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + GIFT_CONFIG.expiryDays * 24 * 60 * 60 * 1000).toISOString(),
    };

    userGifts.push(gift);
    stores.gifts.set(user.id, userGifts);
    stores.gifts.set(gift.code, gift); // Also index by code

    return respond(res, {
      gift,
      shareUrl: `/gift/${gift.code}`,
      message: 'Gift created! Share the link with your friend.',
    }, 201);
  },

  'POST /gift/redeem': (req, res) => {
    const user = getUser(req);
    const { code } = req.body || {};

    if (!code) {
      return error(res, 'Gift code required');
    }

    const gift = stores.gifts.get(code.toUpperCase());
    if (!gift) {
      return error(res, 'Invalid gift code');
    }

    if (gift.status !== 'pending') {
      return error(res, 'Gift already redeemed');
    }

    if (new Date(gift.expiresAt) < new Date()) {
      return error(res, 'Gift has expired');
    }

    if (gift.fromUserId === user.id) {
      return error(res, 'Cannot redeem your own gift');
    }

    // Redeem gift
    gift.status = 'redeemed';
    gift.redeemedBy = user.id;
    gift.redeemedAt = new Date().toISOString();

    // Add credits to recipient
    const currentCredits = stores.credits.get(user.id) || 0;
    stores.credits.set(user.id, currentCredits + gift.creditAmount);

    // Add credits to giver too (Gift Forward bonus)
    const giverCredits = stores.credits.get(gift.fromUserId) || 0;
    stores.credits.set(gift.fromUserId, giverCredits + gift.creditAmount);

    return respond(res, {
      gift,
      creditsReceived: gift.creditAmount,
      totalCredits: currentCredits + gift.creditAmount,
      message: `You received $${(gift.creditAmount / 100).toFixed(2)} in credits! The giver also received a bonus.`,
    });
  },

  'GET /gifts': (req, res) => {
    const user = getUser(req);
    const gifts = stores.gifts.get(user.id) || [];

    return respond(res, {
      gifts,
      remaining: GIFT_CONFIG.maxGiftsPerUser - gifts.length,
      creditAmount: GIFT_CONFIG.creditAmount,
    });
  },

  // ═══════════════════════════════════════════════════════════════════
  // REFERRAL SYSTEM
  // ═══════════════════════════════════════════════════════════════════

  'GET /referral': (req, res) => {
    const user = getUser(req);

    let referral = stores.referrals.get(user.id);
    if (!referral) {
      referral = {
        code: crypto.randomBytes(4).toString('hex').toUpperCase(),
        userId: user.id,
        uses: 0,
        creditsEarned: 0,
        createdAt: new Date().toISOString(),
      };
      stores.referrals.set(user.id, referral);
      stores.referrals.set(referral.code, referral); // Index by code
    }

    return respond(res, {
      referral,
      shareUrl: `/ref/${referral.code}`,
      creditPerReferral: 500, // $5.00 per referral
    });
  },

  'POST /referral/apply': (req, res) => {
    const user = getUser(req);
    const { code } = req.body || {};

    if (!code) {
      return error(res, 'Referral code required');
    }

    const referral = stores.referrals.get(code.toUpperCase());
    if (!referral) {
      return error(res, 'Invalid referral code');
    }

    if (referral.userId === user.id) {
      return error(res, 'Cannot use your own referral code');
    }

    // Check if user already used a referral
    const existingSub = stores.subscriptions.get(user.id);
    if (existingSub && existingSub.referredBy) {
      return error(res, 'You have already used a referral code');
    }

    // Apply referral credit to new user
    const userCredits = stores.credits.get(user.id) || 0;
    stores.credits.set(user.id, userCredits + 500);

    // Give credit to referrer
    const referrerCredits = stores.credits.get(referral.userId) || 0;
    stores.credits.set(referral.userId, referrerCredits + 500);

    // Update referral stats
    referral.uses++;
    referral.creditsEarned += 500;

    return respond(res, {
      creditsReceived: 500,
      message: 'Referral applied! You both received $5.00 in credits.',
    });
  },

  // ═══════════════════════════════════════════════════════════════════
  // CREDITS
  // ═══════════════════════════════════════════════════════════════════

  'GET /credits': (req, res) => {
    const user = getUser(req);
    const credits = stores.credits.get(user.id) || 0;

    return respond(res, {
      credits,
      formatted: `$${(credits / 100).toFixed(2)}`,
      sources: {
        gifts: 'Gift Forward program',
        referrals: 'Referral program',
        promotions: 'Special promotions',
      },
    });
  },

  // ═══════════════════════════════════════════════════════════════════
  // STRIPE WEBHOOK
  // ═══════════════════════════════════════════════════════════════════

  'POST /webhook': (req, res) => {
    // In production, verify Stripe signature
    const event = req.body;

    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        break;
      case 'customer.subscription.updated':
        // Handle subscription update
        break;
      case 'customer.subscription.deleted':
        // Handle cancellation
        break;
      case 'invoice.payment_failed':
        // Handle failed payment
        break;
    }

    return respond(res, { received: true });
  },
};

/**
 * Route parser
 */
const parseRoute = (method, resource) => {
  if (resource) {
    return `${method} /${resource}`;
  }
  return `${method} /`;
};

/**
 * Main handler
 */
export default function handler(req, res) {
  const { method, query } = req;
  const { resource, action } = query;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID, X-User-Email');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Build route key
  let routeKey = parseRoute(method, resource);
  if (action) {
    routeKey = `${method} /${resource}/${action}`;
  }

  const handlerFn = handlers[routeKey];

  if (handlerFn) {
    try {
      return handlerFn(req, res);
    } catch (err) {
      console.error('Subscribe API Error:', err);
      return error(res, 'Internal server error', 500);
    }
  }

  // Default route info
  if (method === 'GET' && !resource) {
    return respond(res, {
      name: 'EKO Subscription API',
      version: API_VERSION,
      endpoints: {
        plans: 'GET /api/subscribe?resource=plans',
        status: 'GET /api/subscribe?resource=status',
        checkout: 'POST /api/subscribe?resource=checkout',
        cancel: 'POST /api/subscribe?resource=cancel',
        gift: 'POST /api/subscribe?resource=gift',
        referral: 'GET /api/subscribe?resource=referral',
        credits: 'GET /api/subscribe?resource=credits',
      },
    });
  }

  return error(res, `Unknown endpoint: ${routeKey}`, 404);
}

export const config = {
  api: {
    bodyParser: true,
  },
};
