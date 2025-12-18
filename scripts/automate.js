#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║    █████╗ ██╗   ██╗████████╗ ██████╗ ███╗   ███╗ █████╗ ████████╗███████╗ ║
 * ║   ██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗████╗ ████║██╔══██╗╚══██╔══╝██╔════╝ ║
 * ║   ███████║██║   ██║   ██║   ██║   ██║██╔████╔██║███████║   ██║   █████╗   ║
 * ║   ██╔══██║██║   ██║   ██║   ██║   ██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝   ║
 * ║   ██║  ██║╚██████╔╝   ██║   ╚██████╔╝██║ ╚═╝ ██║██║  ██║   ██║   ███████╗ ║
 * ║   ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝ ║
 * ║                                                                           ║
 * ║   ZERO-TOUCH AUTOMATION - The system runs itself                          ║
 * ║   Setup once, profit forever.                                             ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Paths
  rootDir: path.resolve(__dirname, '..'),
  dataDir: path.resolve(__dirname, '../data'),
  logsDir: path.resolve(__dirname, '../logs'),
  configDir: path.resolve(__dirname, '../config'),

  // Default settings
  defaults: {
    ai: {
      provider: process.env.ORB_DEFAULT_PROVIDER || 'anthropic',
      model: process.env.ORB_DEFAULT_MODEL || 'claude-sonnet-4-20250514'
    },
    outreach: {
      dailyEmailLimit: 100,
      dailyLinkedInLimit: 50
    },
    scheduler: {
      morningBriefTime: '09:00',
      eveningReportTime: '18:00'
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ENVIRONMENT SETUP
// ═══════════════════════════════════════════════════════════════════════════

function ensureDirectories() {
  const dirs = [CONFIG.dataDir, CONFIG.logsDir, CONFIG.configDir];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

function checkEnvironment() {
  const required = [];
  const optional = [];

  // Check for at least one AI provider
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOllama = checkOllamaRunning();

  if (!hasOpenAI && !hasAnthropic && !hasOllama) {
    required.push('At least one AI provider (OPENAI_API_KEY, ANTHROPIC_API_KEY, or running Ollama)');
  }

  // Optional but recommended
  if (!process.env.SENDGRID_API_KEY && !process.env.RESEND_API_KEY) {
    optional.push('Email provider (SENDGRID_API_KEY or RESEND_API_KEY) - using console mode');
  }

  return { required, optional, hasOpenAI, hasAnthropic, hasOllama };
}

function checkOllamaRunning() {
  try {
    execSync('curl -s http://localhost:11434/api/tags', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTOMATION TASKS
// ═══════════════════════════════════════════════════════════════════════════

const TASKS = {
  /**
   * Morning routine - starts the day
   */
  async morning() {
    console.log('\n🌅 Running morning routine...\n');

    const { createORB, AtlasAgent, IrisAgent } = require('../core');

    // Initialize system
    const orb = await createORB({
      ai: { defaultProvider: CONFIG.defaults.ai.provider },
      security: { enabled: true }
    });

    // Initialize personal agents
    const atlas = new AtlasAgent(orb.ai);
    const iris = new IrisAgent(orb.ai);

    // Generate daily brief
    console.log('📋 Generating daily brief...');
    const brief = await atlas.generateDailyBrief();

    // Scan for opportunities
    console.log('🔍 Scanning for opportunities...');
    const opps = await iris.scoreOpportunities();

    // Log results
    const logPath = path.join(CONFIG.logsDir, `morning-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(logPath, JSON.stringify({ brief, opportunities: opps }, null, 2));

    console.log('\n✅ Morning routine complete');
    console.log(`   Brief: ${brief.priorities?.length || 0} priorities`);
    console.log(`   Opportunities: ${opps?.length || 0} found`);
    console.log(`   Log saved: ${logPath}`);

    await orb.shutdown();
    return { brief, opportunities: opps };
  },

  /**
   * Outreach automation - runs campaigns
   */
  async outreach() {
    console.log('\n📧 Running outreach automation...\n');

    const { createORB, OutreachEngine, createEmailProvider } = require('../core');

    const orb = await createORB({
      ai: { defaultProvider: CONFIG.defaults.ai.provider }
    });

    const outreach = new OutreachEngine({
      aiEngine: orb.ai,
      senderName: process.env.SENDER_NAME || 'Your Name',
      senderEmail: process.env.SENDER_EMAIL || 'you@example.com'
    });

    // Set up email provider
    const emailType = process.env.SENDGRID_API_KEY ? 'sendgrid' :
                     process.env.RESEND_API_KEY ? 'resend' : 'console';
    outreach.setEmailProvider(createEmailProvider(emailType));

    // Process active campaigns
    const campaigns = outreach.listCampaigns().filter(c => c.status === 'active');
    console.log(`   Processing ${campaigns.length} active campaigns...`);

    const report = outreach.getDailyReport();

    // Log results
    const logPath = path.join(CONFIG.logsDir, `outreach-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(logPath, JSON.stringify(report, null, 2));

    console.log('\n✅ Outreach automation complete');
    console.log(`   Emails sent today: ${report.summary.email || 0}`);
    console.log(`   Log saved: ${logPath}`);

    await orb.shutdown();
    return report;
  },

  /**
   * Security scan - monitors for threats
   */
  async security() {
    console.log('\n🛡️ Running security scan...\n');

    const { createORB } = require('../core');

    const orb = await createORB({
      ai: { defaultProvider: CONFIG.defaults.ai.provider },
      security: { enabled: true }
    });

    const status = orb.getSecurityStatus();

    console.log('   Security status:', status.enabled ? '✅ Enabled' : '❌ Disabled');
    if (status.stats) {
      console.log(`   Transactions analyzed: ${status.stats.analyzed || 0}`);
      console.log(`   Threats blocked: ${status.stats.blocked || 0}`);
    }

    const logPath = path.join(CONFIG.logsDir, `security-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(logPath, JSON.stringify(status, null, 2));

    await orb.shutdown();
    return status;
  },

  /**
   * Evening report - summarizes the day
   */
  async evening() {
    console.log('\n🌙 Generating evening report...\n');

    // Collect all today's logs
    const today = new Date().toISOString().split('T')[0];
    const logs = {};

    const logFiles = fs.readdirSync(CONFIG.logsDir).filter(f => f.includes(today));
    for (const file of logFiles) {
      const content = fs.readFileSync(path.join(CONFIG.logsDir, file), 'utf8');
      logs[file] = JSON.parse(content);
    }

    const report = {
      date: today,
      logs,
      summary: {
        tasksProcessed: logs['morning-' + today + '.json']?.brief?.priorities?.length || 0,
        emailsSent: logs['outreach-' + today + '.json']?.summary?.email || 0,
        opportunitiesFound: logs['morning-' + today + '.json']?.opportunities?.length || 0
      }
    };

    const reportPath = path.join(CONFIG.logsDir, `daily-report-${today}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n✅ Evening report generated');
    console.log(`   Tasks: ${report.summary.tasksProcessed}`);
    console.log(`   Emails: ${report.summary.emailsSent}`);
    console.log(`   Opportunities: ${report.summary.opportunitiesFound}`);
    console.log(`   Report: ${reportPath}`);

    return report;
  },

  /**
   * Full daily cycle
   */
  async daily() {
    console.log('\n🔄 Running full daily automation cycle...\n');

    await this.morning();
    await this.outreach();
    await this.security();
    await this.evening();

    console.log('\n✅ Daily cycle complete\n');
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULER (Simple cron-like)
// ═══════════════════════════════════════════════════════════════════════════

class Scheduler {
  constructor() {
    this.jobs = new Map();
    this.running = false;
  }

  schedule(name, time, task) {
    this.jobs.set(name, { time, task, lastRun: null });
  }

  start() {
    this.running = true;
    this._tick();
    console.log('⏰ Scheduler started');
  }

  stop() {
    this.running = false;
    console.log('⏰ Scheduler stopped');
  }

  _tick() {
    if (!this.running) return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = now.toDateString();

    for (const [name, job] of this.jobs) {
      if (job.time === currentTime && job.lastRun !== today) {
        console.log(`⏰ Running scheduled job: ${name}`);
        job.lastRun = today;
        job.task().catch(err => console.error(`Job ${name} failed:`, err));
      }
    }

    // Check every minute
    setTimeout(() => this._tick(), 60000);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    0RB AUTOMATION ENGINE                                  ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

  // Setup directories
  ensureDirectories();

  // Check environment
  const env = checkEnvironment();
  if (env.required.length > 0) {
    console.log('❌ Missing required configuration:');
    env.required.forEach(r => console.log(`   - ${r}`));
    process.exit(1);
  }

  if (env.optional.length > 0) {
    console.log('⚠️  Optional configuration missing:');
    env.optional.forEach(o => console.log(`   - ${o}`));
  }

  console.log('\n✅ Environment check passed');
  console.log(`   OpenAI: ${env.hasOpenAI ? '✓' : '✗'}`);
  console.log(`   Anthropic: ${env.hasAnthropic ? '✓' : '✗'}`);
  console.log(`   Ollama: ${env.hasOllama ? '✓' : '✗'}`);

  switch (command) {
    case 'morning':
      await TASKS.morning();
      break;

    case 'outreach':
      await TASKS.outreach();
      break;

    case 'security':
      await TASKS.security();
      break;

    case 'evening':
      await TASKS.evening();
      break;

    case 'daily':
      await TASKS.daily();
      break;

    case 'schedule':
      const scheduler = new Scheduler();
      scheduler.schedule('morning', CONFIG.defaults.scheduler.morningBriefTime, () => TASKS.morning());
      scheduler.schedule('evening', CONFIG.defaults.scheduler.eveningReportTime, () => TASKS.evening());
      scheduler.start();
      console.log('\n📅 Scheduled jobs:');
      console.log(`   Morning brief: ${CONFIG.defaults.scheduler.morningBriefTime}`);
      console.log(`   Evening report: ${CONFIG.defaults.scheduler.eveningReportTime}`);
      console.log('\nPress Ctrl+C to stop');
      break;

    default:
      console.log(`
Usage: node automate.js <command>

Commands:
  morning   - Run morning routine (daily brief + opportunity scan)
  outreach  - Process outreach campaigns
  security  - Run security scan
  evening   - Generate evening report
  daily     - Run full daily cycle
  schedule  - Start scheduler daemon

Environment Variables:
  OPENAI_API_KEY      - OpenAI API key
  ANTHROPIC_API_KEY   - Anthropic API key
  SENDGRID_API_KEY    - SendGrid API key (for email)
  RESEND_API_KEY      - Resend API key (for email)
  SENDER_NAME         - Your name for outreach
  SENDER_EMAIL        - Your email for outreach
`);
  }
}

main().catch(console.error);
