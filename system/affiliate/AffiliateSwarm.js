/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   █████╗ ███████╗███████╗██╗██╗     ██╗ █████╗ ████████╗███████╗         ║
 * ║  ██╔══██╗██╔════╝██╔════╝██║██║     ██║██╔══██╗╚══██╔══╝██╔════╝         ║
 * ║  ███████║█████╗  █████╗  ██║██║     ██║███████║   ██║   █████╗           ║
 * ║  ██╔══██║██╔══╝  ██╔══╝  ██║██║     ██║██╔══██║   ██║   ██╔══╝           ║
 * ║  ██║  ██║██║     ██║     ██║███████╗██║██║  ██║   ██║   ███████╗         ║
 * ║  ╚═╝  ╚═╝╚═╝     ╚═╝     ╚═╝╚══════╝╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝         ║
 * ║                                                                           ║
 * ║  ███████╗██╗    ██╗ █████╗ ██████╗ ███╗   ███╗                           ║
 * ║  ██╔════╝██║    ██║██╔══██╗██╔══██╗████╗ ████║                           ║
 * ║  ███████╗██║ █╗ ██║███████║██████╔╝██╔████╔██║                           ║
 * ║  ╚════██║██║███╗██║██╔══██║██╔══██╗██║╚██╔╝██║                           ║
 * ║  ███████║╚███╔███╔╝██║  ██║██║  ██║██║ ╚═╝ ██║                           ║
 * ║  ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝                           ║
 * ║                                                                           ║
 * ║  Autonomous Affiliate Research & Revenue Engine                           ║
 * ║  "The swarm finds money while you sleep"                                  ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// AFFILIATE NETWORKS & CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

const AFFILIATE_NETWORKS = {
    AMAZON: {
        id: 'amazon',
        name: 'Amazon Associates',
        type: 'marketplace',
        commission: '1-10%',
        cookie: '24 hours',
        payout: '$10 minimum',
        categories: ['electronics', 'home', 'fashion', 'books', 'everything'],
        signupUrl: 'https://affiliate-program.amazon.com',
        tier: 'beginner'
    },
    SHAREASALE: {
        id: 'shareasale',
        name: 'ShareASale',
        type: 'network',
        commission: 'Varies by merchant',
        cookie: '30-90 days',
        payout: '$50 minimum',
        categories: ['fashion', 'home', 'business', 'software'],
        signupUrl: 'https://shareasale.com',
        tier: 'intermediate'
    },
    CJ: {
        id: 'cj',
        name: 'CJ Affiliate (Commission Junction)',
        type: 'network',
        commission: 'Varies by merchant',
        cookie: '30+ days',
        payout: '$50 minimum',
        categories: ['retail', 'travel', 'finance', 'services'],
        signupUrl: 'https://cj.com',
        tier: 'intermediate'
    },
    CLICKBANK: {
        id: 'clickbank',
        name: 'ClickBank',
        type: 'digital',
        commission: '50-75%',
        cookie: '60 days',
        payout: '$10 minimum',
        categories: ['digital products', 'courses', 'software', 'ebooks'],
        signupUrl: 'https://clickbank.com',
        tier: 'beginner'
    },
    IMPACT: {
        id: 'impact',
        name: 'Impact',
        type: 'network',
        commission: 'Varies',
        cookie: '30+ days',
        payout: '$25 minimum',
        categories: ['saas', 'retail', 'finance', 'travel'],
        signupUrl: 'https://impact.com',
        tier: 'advanced'
    },
    RAKUTEN: {
        id: 'rakuten',
        name: 'Rakuten Advertising',
        type: 'network',
        commission: 'Varies',
        cookie: '30 days',
        payout: '$50 minimum',
        categories: ['retail', 'fashion', 'electronics'],
        signupUrl: 'https://rakutenadvertising.com',
        tier: 'intermediate'
    },
    AWIN: {
        id: 'awin',
        name: 'Awin',
        type: 'network',
        commission: 'Varies',
        cookie: '30 days',
        payout: '$20 minimum',
        categories: ['travel', 'finance', 'retail', 'telecom'],
        signupUrl: 'https://awin.com',
        tier: 'intermediate'
    },
    PARTNERSTACK: {
        id: 'partnerstack',
        name: 'PartnerStack',
        type: 'saas',
        commission: '15-30% recurring',
        cookie: '90 days',
        payout: '$25 minimum',
        categories: ['saas', 'software', 'b2b'],
        signupUrl: 'https://partnerstack.com',
        tier: 'advanced'
    }
};

const DEAL_CATEGORIES = {
    TECH: { id: 'tech', name: 'Technology', icon: '💻', color: '#3498db' },
    FINANCE: { id: 'finance', name: 'Finance & Crypto', icon: '💰', color: '#f1c40f' },
    SAAS: { id: 'saas', name: 'Software & Tools', icon: '🔧', color: '#9b59b6' },
    EDUCATION: { id: 'education', name: 'Courses & Learning', icon: '📚', color: '#2ecc71' },
    ECOMMERCE: { id: 'ecommerce', name: 'E-commerce', icon: '🛒', color: '#e74c3c' },
    HEALTH: { id: 'health', name: 'Health & Wellness', icon: '💪', color: '#1abc9c' },
    TRAVEL: { id: 'travel', name: 'Travel', icon: '✈️', color: '#e67e22' },
    HOSTING: { id: 'hosting', name: 'Web Hosting', icon: '🌐', color: '#34495e' }
};

// ═══════════════════════════════════════════════════════════════════════════
// AFFILIATE SWARM CLASS
// ═══════════════════════════════════════════════════════════════════════════

class AffiliateSwarm extends EventEmitter {
    constructor(config = {}) {
        super();

        this.config = {
            platformFee: config.platformFee || 0.30, // 30% fee
            userShare: config.userShare || 0.70,     // 70% to users
            minPayout: config.minPayout || 25,
            dataPath: config.dataPath || path.join(__dirname, '../../data/affiliate'),
            researchInterval: config.researchInterval || 6 * 60 * 60 * 1000, // 6 hours
            maxDealsPerCategory: config.maxDealsPerCategory || 10,
            ...config
        };

        // Active deals database
        this.deals = [];
        this.hotDeals = [];

        // User management
        this.users = new Map();
        this.referrals = new Map();

        // Revenue tracking
        this.revenue = {
            total: 0,
            platformShare: 0,
            userPayouts: 0,
            pendingCommissions: []
        };

        // Research state
        this.lastResearch = null;
        this.researchTimer = null;

        // Statistics
        this.stats = {
            dealsFound: 0,
            activeDeals: 0,
            totalUsers: 0,
            totalClicks: 0,
            totalConversions: 0,
            totalRevenue: 0
        };

        this.initialize();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    initialize() {
        // Ensure data directory exists
        const dataDir = this.config.dataPath;
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Load existing data
        this.loadData();

        // Start research loop
        this.startResearchLoop();

        console.log(`
╔══════════════════════════════════════════════════════════════╗
║              AFFILIATE SWARM INITIALIZED                     ║
╠══════════════════════════════════════════════════════════════╣
║  Platform Fee: ${String(this.config.platformFee * 100 + '%').padEnd(43)}║
║  User Share: ${String(this.config.userShare * 100 + '%').padEnd(45)}║
║  Min Payout: $${String(this.config.minPayout).padEnd(43)}║
║  Active Deals: ${String(this.deals.length).padEnd(43)}║
╚══════════════════════════════════════════════════════════════╝
        `);

        this.emit('initialized');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DEAL RESEARCH (Swarm Intelligence)
    // ═══════════════════════════════════════════════════════════════════════════

    startResearchLoop() {
        // Initial research
        this.runResearch();

        // Schedule recurring research
        this.researchTimer = setInterval(
            () => this.runResearch(),
            this.config.researchInterval
        );
    }

    async runResearch() {
        console.log('\n[AffiliateSwarm] 🔍 Starting deal research...');
        this.emit('research:start');

        try {
            const newDeals = [];

            // Research each category
            for (const [catId, category] of Object.entries(DEAL_CATEGORIES)) {
                console.log(`  Researching ${category.name}...`);
                const categoryDeals = await this.researchCategory(catId, category);
                newDeals.push(...categoryDeals);
            }

            // Score and rank deals
            const scoredDeals = this.scoreDeals(newDeals);

            // Update deals database
            this.updateDeals(scoredDeals);

            // Find hot deals (top performers)
            this.updateHotDeals();

            this.lastResearch = Date.now();
            this.stats.dealsFound += newDeals.length;

            console.log(`[AffiliateSwarm] ✓ Found ${newDeals.length} deals, ${this.hotDeals.length} hot deals`);
            this.emit('research:complete', { deals: newDeals.length, hot: this.hotDeals.length });

            this.saveData();

        } catch (error) {
            console.error('[AffiliateSwarm] Research error:', error.message);
            this.emit('research:error', error);
        }
    }

    async researchCategory(categoryId, category) {
        const deals = [];

        // Simulate swarm research (in production, this would call APIs/scrape)
        // Each "agent" in the swarm handles different sources

        // Agent 1: Network Programs
        const networkDeals = this.researchNetworks(categoryId);
        deals.push(...networkDeals);

        // Agent 2: High Commission Deals
        const highCommission = this.findHighCommissionDeals(categoryId);
        deals.push(...highCommission);

        // Agent 3: Trending/Seasonal Deals
        const trending = this.findTrendingDeals(categoryId);
        deals.push(...trending);

        // Agent 4: Recurring Revenue Programs
        const recurring = this.findRecurringPrograms(categoryId);
        deals.push(...recurring);

        return deals;
    }

    researchNetworks(categoryId) {
        const deals = [];
        const category = DEAL_CATEGORIES[categoryId.toUpperCase()];

        // Find programs from each network that match this category
        for (const [networkId, network] of Object.entries(AFFILIATE_NETWORKS)) {
            if (network.categories.some(c =>
                c.toLowerCase().includes(categoryId.toLowerCase()) ||
                categoryId.toLowerCase().includes(c.toLowerCase())
            )) {
                deals.push({
                    id: `${networkId.toLowerCase()}_${categoryId}_${Date.now()}`,
                    network: networkId,
                    networkName: network.name,
                    category: categoryId,
                    categoryName: category?.name || categoryId,
                    type: 'network_program',
                    commission: network.commission,
                    cookie: network.cookie,
                    tier: network.tier,
                    signupUrl: network.signupUrl,
                    score: 0,
                    clicks: 0,
                    conversions: 0,
                    createdAt: Date.now()
                });
            }
        }

        return deals;
    }

    findHighCommissionDeals(categoryId) {
        // Curated high-commission programs by category
        const highCommissionPrograms = {
            tech: [
                { name: 'NordVPN', commission: '40%', cookie: '30 days', url: 'nordvpn.com/affiliate' },
                { name: 'ExpressVPN', commission: '36%', cookie: '90 days', url: 'expressvpn.com/affiliate' },
                { name: 'Surfshark', commission: '40%', cookie: '30 days', url: 'surfshark.com/affiliate' }
            ],
            saas: [
                { name: 'HubSpot', commission: '$250-$1000/sale', cookie: '90 days', url: 'hubspot.com/partners' },
                { name: 'Semrush', commission: '$200/sale', cookie: '120 days', url: 'semrush.com/affiliate' },
                { name: 'Shopify', commission: '$150/sale', cookie: '30 days', url: 'shopify.com/affiliates' }
            ],
            hosting: [
                { name: 'Bluehost', commission: '$65-$130/sale', cookie: '90 days', url: 'bluehost.com/affiliate' },
                { name: 'HostGator', commission: '$65-$125/sale', cookie: '60 days', url: 'hostgator.com/affiliate' },
                { name: 'Cloudways', commission: '$50/sale + 7% recurring', cookie: '90 days', url: 'cloudways.com/affiliate' }
            ],
            finance: [
                { name: 'Coinbase', commission: '50% of fees for 3 months', cookie: '30 days', url: 'coinbase.com/affiliates' },
                { name: 'Binance', commission: 'Up to 50% commission', cookie: '90 days', url: 'binance.com/affiliate' },
                { name: 'Robinhood', commission: '$5-$20/signup', cookie: '30 days', url: 'robinhood.com/referral' }
            ],
            education: [
                { name: 'Coursera', commission: '10-45%', cookie: '30 days', url: 'coursera.org/affiliate' },
                { name: 'Skillshare', commission: '$7/signup', cookie: '30 days', url: 'skillshare.com/affiliate' },
                { name: 'Udemy', commission: '15%', cookie: '7 days', url: 'udemy.com/affiliate' }
            ]
        };

        const programs = highCommissionPrograms[categoryId.toLowerCase()] || [];
        const category = DEAL_CATEGORIES[categoryId.toUpperCase()];

        return programs.map((p, i) => ({
            id: `high_${categoryId}_${i}_${Date.now()}`,
            name: p.name,
            network: 'direct',
            networkName: 'Direct Program',
            category: categoryId,
            categoryName: category?.name || categoryId,
            type: 'high_commission',
            commission: p.commission,
            cookie: p.cookie,
            signupUrl: p.url,
            tier: 'recommended',
            featured: true,
            score: 80 + Math.random() * 20,
            clicks: Math.floor(Math.random() * 1000),
            conversions: Math.floor(Math.random() * 50),
            createdAt: Date.now()
        }));
    }

    findTrendingDeals(categoryId) {
        // Seasonal/trending deals (would be dynamic in production)
        const trending = [];
        const category = DEAL_CATEGORIES[categoryId.toUpperCase()];

        // Add seasonal context
        const month = new Date().getMonth();
        const isHoliday = month === 10 || month === 11; // Nov/Dec
        const isNewYear = month === 0; // Jan
        const isSummer = month >= 5 && month <= 7;

        if (isHoliday && categoryId === 'ecommerce') {
            trending.push({
                id: `trend_blackfriday_${Date.now()}`,
                name: 'Black Friday Mega Deals Collection',
                category: categoryId,
                categoryName: category?.name,
                type: 'seasonal',
                commission: 'Up to 20%',
                badge: '🔥 HOT',
                expiresAt: new Date(new Date().getFullYear(), 11, 1).getTime(),
                score: 95,
                featured: true,
                createdAt: Date.now()
            });
        }

        return trending;
    }

    findRecurringPrograms(categoryId) {
        // Programs with recurring commissions (best for passive income)
        const recurringPrograms = {
            saas: [
                { name: 'ConvertKit', commission: '30% recurring', type: 'email marketing' },
                { name: 'Teachable', commission: '30% recurring', type: 'course platform' },
                { name: 'Kajabi', commission: '30% recurring', type: 'creator platform' }
            ],
            hosting: [
                { name: 'Kinsta', commission: '$50-$500 + 10% recurring', type: 'managed hosting' },
                { name: 'WP Engine', commission: '$200 + 35% recurring', type: 'wordpress hosting' }
            ],
            tech: [
                { name: 'Grammarly', commission: '$0.20-$20/signup', type: 'writing tool' }
            ]
        };

        const programs = recurringPrograms[categoryId.toLowerCase()] || [];
        const category = DEAL_CATEGORIES[categoryId.toUpperCase()];

        return programs.map((p, i) => ({
            id: `recurring_${categoryId}_${i}_${Date.now()}`,
            name: p.name,
            category: categoryId,
            categoryName: category?.name || categoryId,
            type: 'recurring',
            commission: p.commission,
            productType: p.type,
            badge: '💎 RECURRING',
            score: 75 + Math.random() * 20,
            passive: true,
            createdAt: Date.now()
        }));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DEAL SCORING & RANKING
    // ═══════════════════════════════════════════════════════════════════════════

    scoreDeals(deals) {
        return deals.map(deal => {
            let score = deal.score || 50;

            // Commission value scoring
            if (deal.commission) {
                const commStr = deal.commission.toLowerCase();
                if (commStr.includes('recurring')) score += 20;
                if (commStr.includes('50%') || commStr.includes('75%')) score += 15;
                if (commStr.includes('$200') || commStr.includes('$500')) score += 15;
            }

            // Cookie duration scoring
            if (deal.cookie) {
                const cookieStr = deal.cookie.toLowerCase();
                if (cookieStr.includes('90') || cookieStr.includes('120')) score += 10;
                if (cookieStr.includes('lifetime')) score += 20;
            }

            // Type scoring
            if (deal.type === 'recurring') score += 15;
            if (deal.type === 'high_commission') score += 10;
            if (deal.featured) score += 10;

            // Conversion rate scoring
            if (deal.conversions && deal.clicks) {
                const rate = deal.conversions / deal.clicks;
                if (rate > 0.1) score += 15;
                else if (rate > 0.05) score += 10;
            }

            deal.score = Math.min(100, score);
            return deal;
        }).sort((a, b) => b.score - a.score);
    }

    updateDeals(newDeals) {
        // Merge new deals with existing, avoiding duplicates
        const dealMap = new Map(this.deals.map(d => [d.id, d]));

        for (const deal of newDeals) {
            if (!dealMap.has(deal.id)) {
                dealMap.set(deal.id, deal);
            }
        }

        this.deals = Array.from(dealMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 500); // Keep top 500 deals

        this.stats.activeDeals = this.deals.length;
    }

    updateHotDeals() {
        // Hot deals = top scored deals across categories
        this.hotDeals = this.deals
            .filter(d => d.score >= 80 || d.featured || d.type === 'recurring')
            .slice(0, 20);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // USER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    registerUser(userData) {
        const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const user = {
            id: userId,
            email: userData.email,
            name: userData.name || 'Anonymous',
            referralCode: this.generateReferralCode(userId),
            joinedAt: Date.now(),
            earnings: {
                total: 0,
                pending: 0,
                paid: 0
            },
            clicks: 0,
            conversions: 0,
            tier: 'starter',
            activeDeals: []
        };

        this.users.set(userId, user);
        this.stats.totalUsers++;

        console.log(`[AffiliateSwarm] New user registered: ${userId}`);
        this.emit('user:registered', user);

        this.saveData();
        return user;
    }

    generateReferralCode(userId) {
        return `ORB${userId.slice(-6).toUpperCase()}`;
    }

    getUserByReferral(code) {
        for (const [userId, user] of this.users) {
            if (user.referralCode === code) {
                return user;
            }
        }
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLICK & CONVERSION TRACKING
    // ═══════════════════════════════════════════════════════════════════════════

    trackClick(dealId, userId) {
        const deal = this.deals.find(d => d.id === dealId);
        const user = this.users.get(userId);

        if (deal) {
            deal.clicks = (deal.clicks || 0) + 1;
            this.stats.totalClicks++;
        }

        if (user) {
            user.clicks++;
        }

        this.emit('click', { dealId, userId });
    }

    recordConversion(dealId, userId, amount) {
        const deal = this.deals.find(d => d.id === dealId);
        const user = this.users.get(userId);

        if (!user) {
            console.warn('[AffiliateSwarm] Conversion for unknown user:', userId);
            return null;
        }

        // Calculate shares
        const platformShare = amount * this.config.platformFee;
        const userShare = amount * this.config.userShare;

        // Update deal stats
        if (deal) {
            deal.conversions = (deal.conversions || 0) + 1;
        }

        // Update user earnings
        user.conversions++;
        user.earnings.total += userShare;
        user.earnings.pending += userShare;

        // Update platform revenue
        this.revenue.total += amount;
        this.revenue.platformShare += platformShare;
        this.revenue.pendingCommissions.push({
            id: `conv_${Date.now()}`,
            dealId,
            userId,
            amount,
            platformShare,
            userShare,
            timestamp: Date.now()
        });

        this.stats.totalConversions++;
        this.stats.totalRevenue += amount;

        console.log(`[AffiliateSwarm] Conversion: $${amount} (User: $${userShare.toFixed(2)}, Platform: $${platformShare.toFixed(2)})`);
        this.emit('conversion', { dealId, userId, amount, userShare, platformShare });

        this.saveData();

        return {
            conversionId: `conv_${Date.now()}`,
            amount,
            userShare,
            platformShare
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PAYOUT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    processPayouts() {
        const payouts = [];

        for (const [userId, user] of this.users) {
            if (user.earnings.pending >= this.config.minPayout) {
                const payout = {
                    id: `payout_${Date.now()}_${userId.slice(-6)}`,
                    userId,
                    amount: user.earnings.pending,
                    status: 'processing',
                    createdAt: Date.now()
                };

                // In production, this would trigger actual payment
                user.earnings.paid += user.earnings.pending;
                user.earnings.pending = 0;
                this.revenue.userPayouts += payout.amount;

                payouts.push(payout);
                this.emit('payout:created', payout);
            }
        }

        this.saveData();
        return payouts;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DATA ACCESS
    // ═══════════════════════════════════════════════════════════════════════════

    getDeals(options = {}) {
        let deals = [...this.deals];

        if (options.category) {
            deals = deals.filter(d => d.category === options.category);
        }

        if (options.type) {
            deals = deals.filter(d => d.type === options.type);
        }

        if (options.minScore) {
            deals = deals.filter(d => d.score >= options.minScore);
        }

        if (options.featured) {
            deals = deals.filter(d => d.featured);
        }

        const limit = options.limit || 50;
        return deals.slice(0, limit);
    }

    getHotDeals() {
        return this.hotDeals;
    }

    getCategories() {
        return Object.values(DEAL_CATEGORIES);
    }

    getNetworks() {
        return Object.values(AFFILIATE_NETWORKS);
    }

    getUserDashboard(userId) {
        const user = this.users.get(userId);
        if (!user) return null;

        return {
            user: {
                id: user.id,
                name: user.name,
                referralCode: user.referralCode,
                tier: user.tier,
                joinedAt: user.joinedAt
            },
            earnings: user.earnings,
            stats: {
                clicks: user.clicks,
                conversions: user.conversions,
                conversionRate: user.clicks > 0 ? (user.conversions / user.clicks * 100).toFixed(2) : 0
            },
            recommendedDeals: this.getDeals({ limit: 10, minScore: 70 })
        };
    }

    getStats() {
        return {
            ...this.stats,
            revenue: this.revenue,
            lastResearch: this.lastResearch,
            categories: Object.keys(DEAL_CATEGORIES).length,
            networks: Object.keys(AFFILIATE_NETWORKS).length
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PERSISTENCE
    // ═══════════════════════════════════════════════════════════════════════════

    saveData() {
        try {
            const data = {
                deals: this.deals,
                hotDeals: this.hotDeals,
                users: Array.from(this.users.entries()),
                revenue: this.revenue,
                stats: this.stats,
                lastResearch: this.lastResearch,
                savedAt: Date.now()
            };

            const filePath = path.join(this.config.dataPath, 'affiliate_data.json');
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        } catch (error) {
            console.error('[AffiliateSwarm] Save error:', error.message);
        }
    }

    loadData() {
        try {
            const filePath = path.join(this.config.dataPath, 'affiliate_data.json');

            if (!fs.existsSync(filePath)) {
                return;
            }

            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (data.deals) this.deals = data.deals;
            if (data.hotDeals) this.hotDeals = data.hotDeals;
            if (data.users) this.users = new Map(data.users);
            if (data.revenue) this.revenue = { ...this.revenue, ...data.revenue };
            if (data.stats) this.stats = { ...this.stats, ...data.stats };
            if (data.lastResearch) this.lastResearch = data.lastResearch;

            console.log(`[AffiliateSwarm] Loaded ${this.deals.length} deals, ${this.users.size} users`);

        } catch (error) {
            console.error('[AffiliateSwarm] Load error:', error.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════════

    destroy() {
        if (this.researchTimer) {
            clearInterval(this.researchTimer);
        }
        this.saveData();
        this.removeAllListeners();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = AffiliateSwarm;
module.exports.AFFILIATE_NETWORKS = AFFILIATE_NETWORKS;
module.exports.DEAL_CATEGORIES = DEAL_CATEGORIES;
