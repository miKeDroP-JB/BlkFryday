/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   REVENUE TRACKER - Income Persistence & Analytics                        ║
 * ║   Track every dollar the system generates                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');

// Paths
const logsDir = path.join(__dirname, 'logs');
const revenueFile = path.join(logsDir, 'revenue.json');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize revenue file if not exists
if (!fs.existsSync(revenueFile)) {
    const initial = {
        entries: [],
        total: 0,
        bySource: {},
        byDay: {},
        goals: {
            daily: 100,
            weekly: 500,
            monthly: 2000
        },
        created_at: new Date().toISOString()
    };
    fs.writeFileSync(revenueFile, JSON.stringify(initial, null, 2));
}

/**
 * Read revenue data from disk
 */
function readRevenue() {
    try {
        return JSON.parse(fs.readFileSync(revenueFile, 'utf8'));
    } catch (e) {
        console.error('[RevenueTracker] Error reading:', e.message);
        return { entries: [], total: 0, bySource: {}, byDay: {} };
    }
}

/**
 * Write revenue data to disk
 */
function writeRevenue(data) {
    try {
        fs.writeFileSync(revenueFile, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('[RevenueTracker] Error writing:', e.message);
    }
}

/**
 * Add a revenue entry
 * @param {Object} entry - { source, amount, meta }
 * @returns {Object} The recorded entry
 */
function addRevenue({ source, amount, meta = {} }) {
    const db = readRevenue();
    const numAmount = Number(amount) || 0;

    const entry = {
        id: `r-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ts: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        source: source || 'unknown',
        amount: numAmount,
        meta
    };

    // Add to entries
    db.entries.push(entry);

    // Update total
    db.total = db.entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Update by source
    db.bySource[entry.source] = (db.bySource[entry.source] || 0) + numAmount;

    // Update by day
    db.byDay[entry.date] = (db.byDay[entry.date] || 0) + numAmount;

    writeRevenue(db);

    console.log(`[RevenueTracker] +$${numAmount.toFixed(2)} from ${source}`);
    return entry;
}

/**
 * Get revenue summary
 */
function getSummary() {
    const db = readRevenue();

    // Calculate today's revenue
    const today = new Date().toISOString().split('T')[0];
    const todayRevenue = db.byDay[today] || 0;

    // Calculate this week's revenue
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    let weekRevenue = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        weekRevenue += db.byDay[dateStr] || 0;
    }

    // Calculate this month's revenue
    const monthKey = today.slice(0, 7);
    let monthRevenue = 0;
    for (const [date, amount] of Object.entries(db.byDay)) {
        if (date.startsWith(monthKey)) {
            monthRevenue += amount;
        }
    }

    return {
        total: db.total,
        today: todayRevenue,
        week: weekRevenue,
        month: monthRevenue,
        bySource: db.bySource,
        goals: db.goals || { daily: 100, weekly: 500, monthly: 2000 },
        progress: {
            daily: Math.min(100, Math.round((todayRevenue / (db.goals?.daily || 100)) * 100)),
            weekly: Math.min(100, Math.round((weekRevenue / (db.goals?.weekly || 500)) * 100)),
            monthly: Math.min(100, Math.round((monthRevenue / (db.goals?.monthly || 2000)) * 100))
        },
        entryCount: db.entries.length,
        lastEntry: db.entries[db.entries.length - 1] || null
    };
}

/**
 * Get all entries
 */
function getEntries(limit = 100) {
    const db = readRevenue();
    return db.entries.slice(-limit);
}

/**
 * Get entries by source
 */
function getBySource(source) {
    const db = readRevenue();
    return db.entries.filter(e => e.source === source);
}

/**
 * Get entries by date range
 */
function getByDateRange(startDate, endDate) {
    const db = readRevenue();
    return db.entries.filter(e => {
        const date = e.date || e.ts.split('T')[0];
        return date >= startDate && date <= endDate;
    });
}

/**
 * Get daily breakdown for last N days
 */
function getDailyBreakdown(days = 30) {
    const db = readRevenue();
    const breakdown = [];

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        breakdown.push({
            date: dateStr,
            amount: db.byDay[dateStr] || 0
        });
    }

    return breakdown;
}

/**
 * Set revenue goals
 */
function setGoals({ daily, weekly, monthly }) {
    const db = readRevenue();
    db.goals = {
        daily: daily || db.goals?.daily || 100,
        weekly: weekly || db.goals?.weekly || 500,
        monthly: monthly || db.goals?.monthly || 2000
    };
    writeRevenue(db);
    return db.goals;
}

/**
 * Get top revenue sources
 */
function getTopSources(limit = 10) {
    const db = readRevenue();
    return Object.entries(db.bySource)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([source, amount]) => ({ source, amount }));
}

/**
 * Export data for backup
 */
function exportData() {
    return readRevenue();
}

module.exports = {
    addRevenue,
    getSummary,
    getEntries,
    getBySource,
    getByDateRange,
    getDailyBreakdown,
    setGoals,
    getTopSources,
    exportData,
    revenueFile
};
