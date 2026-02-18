/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   REVENUE ENGINE - Autonomous Daily Revenue Cycle                         ║
 * ║   The money-making heartbeat of the system                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class RevenueEngine extends EventEmitter {
    constructor(nexus, config = {}) {
        super();

        this.nexus = nexus;
        this.config = {
            // Daily goals
            dailyGoal: config.dailyGoal || 100,
            weeklyGoal: config.weeklyGoal || 500,
            monthlyGoal: config.monthlyGoal || 2000,

            // Cycle settings
            morningHour: config.morningHour || 8,     // 8 AM
            afternoonHour: config.afternoonHour || 14, // 2 PM
            eveningHour: config.eveningHour || 20,     // 8 PM

            // Targets per cycle
            gigsPerCycle: config.gigsPerCycle || 5,
            scansPerCycle: config.scansPerCycle || 5,
            outreachPerCycle: config.outreachPerCycle || 10,
            contentPerCycle: config.contentPerCycle || 3,

            // Persistence
            dataPath: config.dataPath || path.join(__dirname, '../../data/revenue_data.json'),

            ...config
        };

        // Revenue state
        this.state = {
            today: {
                revenue: 0,
                tasks: 0,
                gigs_applied: 0,
                bugs_found: 0,
                pitches_sent: 0,
                content_created: 0
            },
            week: { revenue: 0 },
            month: { revenue: 0 },
            allTime: { revenue: 0 }
        };

        // Cycle tracking
        this.cycles = {
            morning: { lastRun: null, status: 'pending' },
            afternoon: { lastRun: null, status: 'pending' },
            evening: { lastRun: null, status: 'pending' }
        };

        // Pipeline state
        this.pipeline = {
            pendingGigs: [],
            activeBounties: [],
            pendingPayouts: [],
            activeClients: []
        };

        // Cycle timers
        this.timers = [];

        this.initialize();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    initialize() {
        this.loadData();
        this.scheduleCycles();
        this.resetDailyIfNeeded();

        console.log(`
╔══════════════════════════════════════════════════════════════╗
║              REVENUE ENGINE ONLINE                           ║
╠══════════════════════════════════════════════════════════════╣
║  Daily Goal: $${String(this.config.dailyGoal).padEnd(46)}║
║  Weekly Goal: $${String(this.config.weeklyGoal).padEnd(45)}║
║  Monthly Goal: $${String(this.config.monthlyGoal).padEnd(44)}║
╠══════════════════════════════════════════════════════════════╣
║  Morning Cycle: ${String(this.config.morningHour + ':00').padEnd(44)}║
║  Afternoon Cycle: ${String(this.config.afternoonHour + ':00').padEnd(42)}║
║  Evening Cycle: ${String(this.config.eveningHour + ':00').padEnd(44)}║
╚══════════════════════════════════════════════════════════════╝
        `);

        this.emit('initialized');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CYCLE SCHEDULING
    // ═══════════════════════════════════════════════════════════════════════════

    scheduleCycles() {
        // Clear existing timers
        this.timers.forEach(t => clearTimeout(t));
        this.timers = [];

        const scheduleNext = (hour, cycleType, handler) => {
            const now = new Date();
            let target = new Date(now);
            target.setHours(hour, 0, 0, 0);

            if (target <= now) {
                target.setDate(target.getDate() + 1);
            }

            const delay = target - now;

            const timer = setTimeout(() => {
                handler();
                // Reschedule for next day
                scheduleNext(hour, cycleType, handler);
            }, delay);

            this.timers.push(timer);
            console.log(`[RevenueEngine] ${cycleType} cycle scheduled for ${target.toLocaleTimeString()}`);
        };

        scheduleNext(this.config.morningHour, 'Morning', () => this.runMorningCycle());
        scheduleNext(this.config.afternoonHour, 'Afternoon', () => this.runAfternoonCycle());
        scheduleNext(this.config.eveningHour, 'Evening', () => this.runEveningCycle());
    }

    resetDailyIfNeeded() {
        const today = new Date().toDateString();
        const lastDate = this.state.today.date;

        if (lastDate !== today) {
            // Archive yesterday's data
            if (lastDate) {
                this.archiveDay(lastDate, { ...this.state.today });
            }

            // Reset daily state
            this.state.today = {
                date: today,
                revenue: 0,
                tasks: 0,
                gigs_applied: 0,
                bugs_found: 0,
                pitches_sent: 0,
                content_created: 0
            };

            // Reset cycle status
            this.cycles.morning.status = 'pending';
            this.cycles.afternoon.status = 'pending';
            this.cycles.evening.status = 'pending';

            this.emit('day:reset');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MORNING CYCLE - Opportunity Discovery
    // ═══════════════════════════════════════════════════════════════════════════

    async runMorningCycle() {
        this.resetDailyIfNeeded();

        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  ☀️  MORNING PULSE - Opportunity Discovery');
        console.log('═══════════════════════════════════════════════════════════');

        this.cycles.morning.status = 'running';
        this.cycles.morning.lastRun = Date.now();
        this.emit('cycle:start', 'morning');

        try {
            // 1. Check for new gig opportunities
            console.log('\n[1/4] Scanning freelance platforms...');
            await this.nexus.route('gig_research', {
                platforms: ['upwork', 'fiverr', 'toptal', 'freelancer'],
                keywords: ['automation', 'ai', 'web development', 'security'],
                maxResults: 20
            });

            // 2. Check bug bounty programs for new targets
            console.log('[2/4] Checking bug bounty programs...');
            await this.nexus.route('bug_scan', {
                mode: 'discovery',
                platforms: ['hackerone', 'bugcrowd'],
                focusAreas: ['new_programs', 'updated_scope']
            });

            // 3. Check client messages
            console.log('[3/4] Checking client communications...');
            await this.nexus.route('client_message', {
                action: 'check_inbox',
                respondToUrgent: true
            });

            // 4. Generate task queue for the day
            console.log('[4/4] Planning daily tasks...');
            const plan = this.generateDailyPlan();

            this.cycles.morning.status = 'complete';
            console.log('\n✓ Morning cycle complete. Tasks queued:', plan.totalTasks);
            console.log('═══════════════════════════════════════════════════════════\n');

            this.emit('cycle:complete', 'morning', plan);
            return plan;

        } catch (error) {
            this.cycles.morning.status = 'error';
            console.error('[Morning Cycle] Error:', error.message);
            this.emit('cycle:error', 'morning', error);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AFTERNOON CYCLE - Active Execution
    // ═══════════════════════════════════════════════════════════════════════════

    async runAfternoonCycle() {
        this.resetDailyIfNeeded();

        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  ⚡ AFTERNOON EXECUTION - Active Revenue Generation');
        console.log('═══════════════════════════════════════════════════════════');

        this.cycles.afternoon.status = 'running';
        this.cycles.afternoon.lastRun = Date.now();
        this.emit('cycle:start', 'afternoon');

        try {
            // 1. Apply to top gigs
            console.log('\n[1/5] Applying to gigs...');
            for (let i = 0; i < this.config.gigsPerCycle; i++) {
                await this.nexus.route('gig_apply', {
                    strategy: 'best_match',
                    customizeProposal: true
                });
                this.state.today.gigs_applied++;
            }

            // 2. Run passive security scans
            console.log('[2/5] Running security scans...');
            for (let i = 0; i < this.config.scansPerCycle; i++) {
                await this.nexus.route('bug_scan', {
                    mode: 'passive',
                    depth: 'standard'
                });
            }

            // 3. Send outreach pitches
            console.log('[3/5] Sending outreach...');
            for (let i = 0; i < this.config.outreachPerCycle; i++) {
                await this.nexus.route('outreach', {
                    type: 'cold_pitch',
                    personalize: true
                });
                this.state.today.pitches_sent++;
            }

            // 4. Submit any pending bug reports
            console.log('[4/5] Submitting bug reports...');
            await this.nexus.route('compile_report', {
                submitReady: true
            });

            // 5. Follow up with active clients
            console.log('[5/5] Client follow-ups...');
            await this.nexus.route('client_message', {
                action: 'follow_up',
                priority: 'pending_payment'
            });

            this.cycles.afternoon.status = 'complete';
            console.log('\n✓ Afternoon cycle complete.');
            console.log(`  Gigs Applied: ${this.state.today.gigs_applied}`);
            console.log(`  Pitches Sent: ${this.state.today.pitches_sent}`);
            console.log('═══════════════════════════════════════════════════════════\n');

            this.emit('cycle:complete', 'afternoon', this.state.today);

        } catch (error) {
            this.cycles.afternoon.status = 'error';
            console.error('[Afternoon Cycle] Error:', error.message);
            this.emit('cycle:error', 'afternoon', error);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENING CYCLE - Content & Reporting
    // ═══════════════════════════════════════════════════════════════════════════

    async runEveningCycle() {
        this.resetDailyIfNeeded();

        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  🌙 EVENING CYCLE - Content & Daily Report');
        console.log('═══════════════════════════════════════════════════════════');

        this.cycles.evening.status = 'running';
        this.cycles.evening.lastRun = Date.now();
        this.emit('cycle:start', 'evening');

        try {
            // 1. Create social content
            console.log('\n[1/4] Creating content...');
            for (let i = 0; i < this.config.contentPerCycle; i++) {
                await this.nexus.route('content_create', {
                    type: 'social',
                    platform: ['twitter', 'linkedin'][i % 2],
                    topic: 'auto'
                });
                this.state.today.content_created++;
            }

            // 2. Check payment status
            console.log('[2/4] Checking payment status...');
            await this.checkPayments();

            // 3. Generate daily report
            console.log('[3/4] Generating daily report...');
            const report = this.generateDailyReport();

            // 4. Update dashboard
            console.log('[4/4] Updating dashboard...');
            this.emit('dashboard:update', report);

            this.cycles.evening.status = 'complete';

            // Print daily summary
            console.log('\n');
            console.log('╔══════════════════════════════════════════════════════════╗');
            console.log('║                    DAILY SUMMARY                         ║');
            console.log('╠══════════════════════════════════════════════════════════╣');
            console.log(`║  Revenue Today: $${String(this.state.today.revenue.toFixed(2)).padEnd(40)}║`);
            console.log(`║  Goal Progress: ${String(this.getGoalProgress() + '%').padEnd(42)}║`);
            console.log(`║  Gigs Applied: ${String(this.state.today.gigs_applied).padEnd(43)}║`);
            console.log(`║  Pitches Sent: ${String(this.state.today.pitches_sent).padEnd(43)}║`);
            console.log(`║  Content Created: ${String(this.state.today.content_created).padEnd(40)}║`);
            console.log('╚══════════════════════════════════════════════════════════╝');
            console.log('\n');

            this.emit('cycle:complete', 'evening', report);
            this.saveData();

            return report;

        } catch (error) {
            this.cycles.evening.status = 'error';
            console.error('[Evening Cycle] Error:', error.message);
            this.emit('cycle:error', 'evening', error);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REVENUE TRACKING
    // ═══════════════════════════════════════════════════════════════════════════

    recordRevenue(amount, source, details = {}) {
        this.state.today.revenue += amount;
        this.state.week.revenue += amount;
        this.state.month.revenue += amount;
        this.state.allTime.revenue += amount;

        const record = {
            amount,
            source,
            timestamp: Date.now(),
            ...details
        };

        console.log(`[RevenueEngine] +$${amount} from ${source}`);
        this.emit('revenue:recorded', record);

        // Notify nexus
        if (this.nexus) {
            this.nexus.emit('revenue:received', amount, source);
        }

        this.saveData();
        return record;
    }

    async checkPayments() {
        // This would integrate with actual payment platforms
        // For now, simulate checking payment status
        const pendingPayouts = this.pipeline.pendingPayouts;

        for (const payout of pendingPayouts) {
            if (payout.status === 'pending' && payout.expectedDate <= Date.now()) {
                // Check if payment received (would call actual API)
                payout.status = 'checking';
                console.log(`[Payment] Checking ${payout.source}: $${payout.amount}`);
            }
        }
    }

    getGoalProgress() {
        return Math.min(100, Math.round((this.state.today.revenue / this.config.dailyGoal) * 100));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PLANNING & REPORTING
    // ═══════════════════════════════════════════════════════════════════════════

    generateDailyPlan() {
        const plan = {
            date: new Date().toDateString(),
            totalTasks: 0,
            categories: {
                gigs: this.config.gigsPerCycle,
                scans: this.config.scansPerCycle,
                outreach: this.config.outreachPerCycle,
                content: this.config.contentPerCycle
            },
            priority: []
        };

        // Prioritize based on goal progress
        const progress = this.getGoalProgress();

        if (progress < 25) {
            plan.priority = ['gigs', 'outreach', 'scans'];
            plan.strategy = 'aggressive';
        } else if (progress < 75) {
            plan.priority = ['gigs', 'scans', 'content'];
            plan.strategy = 'balanced';
        } else {
            plan.priority = ['content', 'scans', 'maintenance'];
            plan.strategy = 'maintenance';
        }

        plan.totalTasks = Object.values(plan.categories).reduce((a, b) => a + b, 0);

        return plan;
    }

    generateDailyReport() {
        return {
            date: new Date().toDateString(),
            summary: {
                revenue: this.state.today.revenue,
                goal: this.config.dailyGoal,
                progress: this.getGoalProgress(),
                tasks: this.state.today.tasks
            },
            activity: {
                gigs_applied: this.state.today.gigs_applied,
                bugs_found: this.state.today.bugs_found,
                pitches_sent: this.state.today.pitches_sent,
                content_created: this.state.today.content_created
            },
            cycles: {
                morning: this.cycles.morning.status,
                afternoon: this.cycles.afternoon.status,
                evening: this.cycles.evening.status
            },
            pipeline: {
                pending_gigs: this.pipeline.pendingGigs.length,
                active_bounties: this.pipeline.activeBounties.length,
                pending_payouts: this.pipeline.pendingPayouts.length,
                active_clients: this.pipeline.activeClients.length
            },
            recommendations: this.generateRecommendations()
        };
    }

    generateRecommendations() {
        const recs = [];
        const progress = this.getGoalProgress();

        if (progress < 50) {
            recs.push('Consider increasing outreach volume');
            recs.push('Focus on quick-win gig opportunities');
        }

        if (this.state.today.gigs_applied < 3) {
            recs.push('Apply to more gigs - low application count today');
        }

        if (this.pipeline.pendingPayouts.length > 5) {
            recs.push('Follow up on pending payments');
        }

        return recs;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PERSISTENCE
    // ═══════════════════════════════════════════════════════════════════════════

    saveData() {
        try {
            const data = {
                state: this.state,
                cycles: this.cycles,
                pipeline: this.pipeline,
                savedAt: Date.now()
            };

            const dir = path.dirname(this.config.dataPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(this.config.dataPath, JSON.stringify(data, null, 2));

        } catch (error) {
            console.error('[RevenueEngine] Save error:', error.message);
        }
    }

    loadData() {
        try {
            if (!fs.existsSync(this.config.dataPath)) {
                return;
            }

            const data = JSON.parse(fs.readFileSync(this.config.dataPath, 'utf8'));

            if (data.state) this.state = { ...this.state, ...data.state };
            if (data.cycles) this.cycles = { ...this.cycles, ...data.cycles };
            if (data.pipeline) this.pipeline = { ...this.pipeline, ...data.pipeline };

        } catch (error) {
            console.error('[RevenueEngine] Load error:', error.message);
        }
    }

    archiveDay(date, data) {
        try {
            const archivePath = path.join(__dirname, '../../data/revenue_archive.json');
            let archive = [];

            if (fs.existsSync(archivePath)) {
                archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
            }

            archive.push({ date, ...data });

            // Keep last 365 days
            if (archive.length > 365) {
                archive = archive.slice(-365);
            }

            fs.writeFileSync(archivePath, JSON.stringify(archive, null, 2));

        } catch (error) {
            console.error('[RevenueEngine] Archive error:', error.message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════════

    getStatus() {
        return {
            today: this.state.today,
            goals: {
                daily: { target: this.config.dailyGoal, current: this.state.today.revenue },
                weekly: { target: this.config.weeklyGoal, current: this.state.week.revenue },
                monthly: { target: this.config.monthlyGoal, current: this.state.month.revenue }
            },
            cycles: this.cycles,
            pipeline: {
                pendingGigs: this.pipeline.pendingGigs.length,
                activeBounties: this.pipeline.activeBounties.length,
                pendingPayouts: this.pipeline.pendingPayouts.length,
                activeClients: this.pipeline.activeClients.length
            }
        };
    }

    // Manual trigger cycles (for testing)
    async triggerMorning() { return this.runMorningCycle(); }
    async triggerAfternoon() { return this.runAfternoonCycle(); }
    async triggerEvening() { return this.runEveningCycle(); }

    async triggerFullDay() {
        await this.runMorningCycle();
        await this.runAfternoonCycle();
        await this.runEveningCycle();
        return this.generateDailyReport();
    }

    // Cleanup
    destroy() {
        this.timers.forEach(t => clearTimeout(t));
        this.timers = [];
        this.saveData();
        this.removeAllListeners();
    }
}

module.exports = RevenueEngine;
