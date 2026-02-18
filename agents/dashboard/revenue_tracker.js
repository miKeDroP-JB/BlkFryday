/**
 * revenue_tracker.js
 * Revenue Tracking Dashboard
 * Tracks income from all streams: bounties, freelance, content
 */

class RevenueTracker {
    constructor(config = {}) {
        this.streams = {
            bug_bounty: { name: 'Bug Bounty', color: '#ff4444', transactions: [] },
            freelance: { name: 'Freelance', color: '#44ff44', transactions: [] },
            content: { name: 'Content', color: '#4488ff', transactions: [] },
            other: { name: 'Other', color: '#ffaa44', transactions: [] }
        };

        this.goals = {
            daily: config.dailyGoal || 100,
            weekly: config.weeklyGoal || 500,
            monthly: config.monthlyGoal || 2000
        };

        this.currency = config.currency || 'USD';

        console.log('[RevenueTracker] Revenue tracker initialized');
    }

    /**
     * Record a transaction
     */
    recordTransaction(stream, amount, details = {}) {
        if (!this.streams[stream]) {
            return { error: `Unknown stream: ${stream}` };
        }

        const transaction = {
            id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            stream,
            amount,
            description: details.description || '',
            source: details.source || null,
            projectId: details.projectId || null,
            platform: details.platform || null,
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0]
        };

        this.streams[stream].transactions.push(transaction);

        console.log(`[RevenueTracker] +$${amount} from ${this.streams[stream].name}`);

        return {
            success: true,
            transaction
        };
    }

    /**
     * Get revenue summary
     */
    getSummary(period = 'all') {
        const now = Date.now();
        const periods = {
            today: now - 24 * 60 * 60 * 1000,
            week: now - 7 * 24 * 60 * 60 * 1000,
            month: now - 30 * 24 * 60 * 60 * 1000,
            quarter: now - 90 * 24 * 60 * 60 * 1000,
            year: now - 365 * 24 * 60 * 60 * 1000,
            all: 0
        };

        const cutoff = periods[period] || 0;

        const summary = {
            period,
            byStream: {},
            total: 0,
            transactionCount: 0,
            avgTransaction: 0,
            topSource: null
        };

        const sourceAmounts = {};

        for (const [streamId, stream] of Object.entries(this.streams)) {
            const transactions = stream.transactions.filter(t => t.timestamp >= cutoff);
            const streamTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

            summary.byStream[streamId] = {
                name: stream.name,
                color: stream.color,
                total: streamTotal,
                count: transactions.length,
                percentage: 0 // Calculated after total
            };

            summary.total += streamTotal;
            summary.transactionCount += transactions.length;

            // Track sources
            for (const t of transactions) {
                const source = t.source || t.platform || 'unknown';
                sourceAmounts[source] = (sourceAmounts[source] || 0) + t.amount;
            }
        }

        // Calculate percentages
        for (const streamId of Object.keys(summary.byStream)) {
            summary.byStream[streamId].percentage = summary.total > 0
                ? Math.round((summary.byStream[streamId].total / summary.total) * 100)
                : 0;
        }

        summary.avgTransaction = summary.transactionCount > 0
            ? Math.round(summary.total / summary.transactionCount)
            : 0;

        // Find top source
        const topSource = Object.entries(sourceAmounts).sort((a, b) => b[1] - a[1])[0];
        summary.topSource = topSource ? { name: topSource[0], amount: topSource[1] } : null;

        return summary;
    }

    /**
     * Get goal progress
     */
    getGoalProgress() {
        const today = this.getSummary('today');
        const week = this.getSummary('week');
        const month = this.getSummary('month');

        return {
            daily: {
                current: today.total,
                goal: this.goals.daily,
                percentage: Math.min(100, Math.round((today.total / this.goals.daily) * 100)),
                remaining: Math.max(0, this.goals.daily - today.total)
            },
            weekly: {
                current: week.total,
                goal: this.goals.weekly,
                percentage: Math.min(100, Math.round((week.total / this.goals.weekly) * 100)),
                remaining: Math.max(0, this.goals.weekly - week.total)
            },
            monthly: {
                current: month.total,
                goal: this.goals.monthly,
                percentage: Math.min(100, Math.round((month.total / this.goals.monthly) * 100)),
                remaining: Math.max(0, this.goals.monthly - month.total)
            }
        };
    }

    /**
     * Get daily breakdown for a period
     */
    getDailyBreakdown(days = 30) {
        const breakdown = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayData = {
                date: dateStr,
                total: 0,
                byStream: {}
            };

            for (const [streamId, stream] of Object.entries(this.streams)) {
                const dayTotal = stream.transactions
                    .filter(t => t.date === dateStr)
                    .reduce((sum, t) => sum + t.amount, 0);

                dayData.byStream[streamId] = dayTotal;
                dayData.total += dayTotal;
            }

            breakdown.push(dayData);
        }

        return breakdown;
    }

    /**
     * Get top transactions
     */
    getTopTransactions(limit = 10) {
        const allTransactions = Object.values(this.streams)
            .flatMap(s => s.transactions)
            .sort((a, b) => b.amount - a.amount);

        return allTransactions.slice(0, limit);
    }

    /**
     * Get recent transactions
     */
    getRecentTransactions(limit = 20) {
        const allTransactions = Object.values(this.streams)
            .flatMap(s => s.transactions)
            .sort((a, b) => b.timestamp - a.timestamp);

        return allTransactions.slice(0, limit);
    }

    /**
     * Get stream performance
     */
    getStreamPerformance() {
        const performance = {};

        for (const [streamId, stream] of Object.entries(this.streams)) {
            const transactions = stream.transactions;
            const total = transactions.reduce((sum, t) => sum + t.amount, 0);

            // Calculate trend (compare last 30 days to previous 30 days)
            const now = Date.now();
            const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
            const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

            const recent = transactions
                .filter(t => t.timestamp >= thirtyDaysAgo)
                .reduce((sum, t) => sum + t.amount, 0);

            const previous = transactions
                .filter(t => t.timestamp >= sixtyDaysAgo && t.timestamp < thirtyDaysAgo)
                .reduce((sum, t) => sum + t.amount, 0);

            let trend = 'stable';
            let trendPercent = 0;

            if (previous > 0) {
                trendPercent = Math.round(((recent - previous) / previous) * 100);
                if (trendPercent > 10) trend = 'up';
                else if (trendPercent < -10) trend = 'down';
            }

            performance[streamId] = {
                name: stream.name,
                color: stream.color,
                total,
                count: transactions.length,
                avgTransaction: transactions.length > 0 ? Math.round(total / transactions.length) : 0,
                recentTotal: recent,
                trend,
                trendPercent
            };
        }

        return performance;
    }

    /**
     * Set goals
     */
    setGoals(goals) {
        if (goals.daily) this.goals.daily = goals.daily;
        if (goals.weekly) this.goals.weekly = goals.weekly;
        if (goals.monthly) this.goals.monthly = goals.monthly;

        return this.goals;
    }

    /**
     * Export data
     */
    exportData(period = 'all') {
        const summary = this.getSummary(period);
        const transactions = this.getRecentTransactions(1000);

        return {
            exportedAt: Date.now(),
            period,
            summary,
            transactions,
            goals: this.goals
        };
    }

    /**
     * Get dashboard data
     */
    getDashboard() {
        return {
            summary: this.getSummary('month'),
            goals: this.getGoalProgress(),
            performance: this.getStreamPerformance(),
            recentTransactions: this.getRecentTransactions(10),
            dailyBreakdown: this.getDailyBreakdown(7)
        };
    }
}

module.exports = RevenueTracker;
