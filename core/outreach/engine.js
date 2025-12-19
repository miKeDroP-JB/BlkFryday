/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██████╗ ██╗   ██╗████████╗██████╗ ███████╗ █████╗  ██████╗██╗  ██╗      ║
 * ║  ██╔═══██╗██║   ██║╚══██╔══╝██╔══██╗██╔════╝██╔══██╗██╔════╝██║  ██║      ║
 * ║  ██║   ██║██║   ██║   ██║   ██████╔╝█████╗  ███████║██║     ███████║      ║
 * ║  ██║   ██║██║   ██║   ██║   ██╔══██╗██╔══╝  ██╔══██║██║     ██╔══██║      ║
 * ║  ╚██████╔╝╚██████╔╝   ██║   ██║  ██║███████╗██║  ██║╚██████╗██║  ██║      ║
 * ║   ╚═════╝  ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝      ║
 * ║                                                                           ║
 * ║   AI-POWERED OUTREACH ENGINE                                              ║
 * ║   Automated prospecting • Personalized messaging • Multi-channel          ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');
const { parseJSON, generateId, sleep } = require('../utils');

// ═══════════════════════════════════════════════════════════════════════════
// CHANNEL TYPES
// ═══════════════════════════════════════════════════════════════════════════

const CHANNELS = {
  EMAIL: 'email',
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter',
  SMS: 'sms',
  COLD_CALL: 'cold_call'
};

// ═══════════════════════════════════════════════════════════════════════════
// CAMPAIGN TYPES
// ═══════════════════════════════════════════════════════════════════════════

const CAMPAIGN_TYPES = {
  COLD_OUTREACH: 'cold_outreach',
  WARM_FOLLOWUP: 'warm_followup',
  NURTURE: 'nurture',
  RE_ENGAGEMENT: 're_engagement',
  REFERRAL_ASK: 'referral_ask'
};

// ═══════════════════════════════════════════════════════════════════════════
// SEQUENCE TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const SEQUENCE_TEMPLATES = {
  cold_b2b: {
    name: 'Cold B2B Outreach',
    description: '5-touch sequence for cold prospects',
    steps: [
      { day: 0, channel: 'email', type: 'intro', subject: 'Quick question about {industry}' },
      { day: 3, channel: 'linkedin', type: 'connect', note: true },
      { day: 5, channel: 'email', type: 'value_add', subject: 'Thought you might find this useful' },
      { day: 8, channel: 'linkedin', type: 'engage', action: 'comment_on_post' },
      { day: 12, channel: 'email', type: 'breakup', subject: 'Should I close your file?' }
    ],
    variables: ['first_name', 'company', 'industry', 'pain_point', 'case_study']
  },

  warm_inbound: {
    name: 'Warm Inbound Follow-up',
    description: '3-touch sequence for inbound leads',
    steps: [
      { day: 0, channel: 'email', type: 'immediate_response', subject: 'Re: Your inquiry' },
      { day: 1, channel: 'email', type: 'calendar_link', subject: 'Quick call this week?' },
      { day: 3, channel: 'sms', type: 'gentle_nudge' }
    ],
    variables: ['first_name', 'inquiry_topic', 'calendar_link']
  },

  nurture: {
    name: 'Long-term Nurture',
    description: 'Monthly value-add for not-ready prospects',
    steps: [
      { day: 0, channel: 'email', type: 'value_content', subject: '{industry} insights for {month}' },
      { day: 30, channel: 'email', type: 'case_study', subject: 'How {company} achieved {result}' },
      { day: 60, channel: 'email', type: 'offer', subject: 'Special offer for you' }
    ],
    variables: ['first_name', 'industry', 'month', 'case_study_company', 'result']
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

const MESSAGE_TEMPLATES = {
  email: {
    intro: {
      subject: 'Quick question about {industry}',
      body: `Hey {first_name},

Saw you're running {company} in {industry}. Quick question:

How much time do you spend on {pain_point} each week?

We built an AI system that automates exactly that. One of our {industry} clients went from 30 hours/week to 5.

Worth a 10-minute call to see if it fits your workflow?

Best,
{sender_name}

P.S. - Free trial, no commitment. Just want to show you what's possible.`
    },

    value_add: {
      subject: 'Thought you might find this useful',
      body: `Hey {first_name},

Following up on my last note.

I put together a quick guide on how {industry} companies are using AI to automate {pain_point}.

{value_content_link}

Let me know if any questions - happy to walk through how it might apply to {company}.

{sender_name}`
    },

    breakup: {
      subject: 'Should I close your file?',
      body: `Hey {first_name},

I've reached out a few times but haven't heard back. Totally understand if timing isn't right.

Should I close your file for now, or is there a better time to reconnect?

Either way, no hard feelings.

{sender_name}`
    }
  },

  linkedin: {
    connect: `Hey {first_name} - saw you're in {industry}. We built an AI copilot specifically for that. Thought you might find it interesting.`,

    followup: `Thanks for connecting! Quick question - what's the most tedious part of your workflow right now? The repetitive stuff that eats up your day?`,

    pitch: `We automated exactly that for {case_study_company}. They went from 40 hours/week to 15 on {pain_point}. Want me to show you how?`
  },

  sms: {
    gentle_nudge: `Hey {first_name}, this is {sender_name}. Sent you a couple emails about streamlining {pain_point}. Worth a quick call?`,

    reminder: `Hi {first_name}! Just a reminder about our call tomorrow at {time}. Looking forward to it. - {sender_name}`
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PROSPECT CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Prospect {
  constructor(data) {
    this.id = generateId('prospect');
    this.firstName = data.firstName || data.first_name || '';
    this.lastName = data.lastName || data.last_name || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.linkedinUrl = data.linkedinUrl || data.linkedin_url || '';
    this.company = data.company || '';
    this.title = data.title || '';
    this.industry = data.industry || '';
    this.source = data.source || 'manual';

    this.status = 'new'; // new, contacted, responded, qualified, unqualified, converted
    this.score = data.score || 0;
    this.tags = data.tags || [];

    this.touchpoints = [];
    this.notes = [];

    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this.lastContactedAt = null;
  }

  addTouchpoint(touchpoint) {
    this.touchpoints.push({
      id: generateId('touch'),
      ...touchpoint,
      timestamp: Date.now()
    });
    this.lastContactedAt = Date.now();
    this.updatedAt = Date.now();
  }

  addNote(note) {
    this.notes.push({
      id: generateId('note'),
      content: note,
      timestamp: Date.now()
    });
    this.updatedAt = Date.now();
  }

  updateStatus(status) {
    this.status = status;
    this.updatedAt = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      name: `${this.firstName} ${this.lastName}`.trim(),
      email: this.email,
      company: this.company,
      industry: this.industry,
      status: this.status,
      score: this.score,
      touchpoints: this.touchpoints.length,
      lastContactedAt: this.lastContactedAt
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CAMPAIGN CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Campaign {
  constructor(data, aiEngine = null) {
    this.id = generateId('campaign');
    this.name = data.name;
    this.type = data.type || CAMPAIGN_TYPES.COLD_OUTREACH;
    this.sequence = data.sequence || SEQUENCE_TEMPLATES.cold_b2b;
    this.status = 'draft'; // draft, active, paused, completed

    this.prospects = new Map();
    this.stats = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      converted: 0
    };

    this.aiEngine = aiEngine;
    this.variables = data.variables || {};

    this.createdAt = Date.now();
    this.startedAt = null;
  }

  addProspect(prospect) {
    const prospectObj = prospect instanceof Prospect ? prospect : new Prospect(prospect);
    this.prospects.set(prospectObj.id, {
      prospect: prospectObj,
      currentStep: 0,
      nextSendTime: null,
      status: 'pending'
    });
    return prospectObj;
  }

  async personalizeMessage(template, prospect, variables = {}) {
    if (!this.aiEngine) {
      // Simple variable replacement
      return this._simpleReplace(template, { ...variables, ...prospect });
    }

    // AI-powered personalization
    const systemPrompt = `You are HERMES, master of persuasive communication.
Your task is to personalize an outreach message for maximum effectiveness.

RULES:
1. Keep the core structure and message intent intact
2. Add 1-2 personalized elements based on the prospect's profile
3. Make it feel genuinely personal, not templated
4. Keep it concise - every word must earn its place
5. Output ONLY the personalized message, no explanations`;

    const userPrompt = `TEMPLATE:
${template}

PROSPECT INFO:
- Name: ${prospect.firstName} ${prospect.lastName}
- Company: ${prospect.company}
- Title: ${prospect.title}
- Industry: ${prospect.industry}

VARIABLES:
${JSON.stringify(variables, null, 2)}

Personalize this message:`;

    try {
      const response = await this.aiEngine.run(systemPrompt, userPrompt, { temperature: 0.7 });
      return response.content || this._simpleReplace(template, { ...variables, ...prospect });
    } catch (error) {
      console.warn('[OUTREACH] AI personalization failed, using simple replacement:', error.message);
      return this._simpleReplace(template, { ...variables, ...prospect });
    }
  }

  _simpleReplace(template, data) {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
      result = result.replace(new RegExp(`\\{${snakeKey}\\}`, 'g'), value || '');
    }
    return result;
  }

  getStats() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      prospectCount: this.prospects.size,
      stats: this.stats,
      openRate: this.stats.sent > 0 ? (this.stats.opened / this.stats.sent * 100).toFixed(1) + '%' : '0%',
      replyRate: this.stats.sent > 0 ? (this.stats.replied / this.stats.sent * 100).toFixed(1) + '%' : '0%',
      conversionRate: this.stats.sent > 0 ? (this.stats.converted / this.stats.sent * 100).toFixed(1) + '%' : '0%'
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTREACH ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class OutreachEngine extends EventEmitter {
  constructor(config = {}) {
    super();

    this.aiEngine = config.aiEngine || null;
    this.campaigns = new Map();
    this.prospects = new Map();

    // Channel integrations (to be plugged in)
    this.channels = {
      email: config.emailProvider || null,
      linkedin: config.linkedinProvider || null,
      twitter: config.twitterProvider || null,
      sms: config.smsProvider || null
    };

    // Default sender info
    this.sender = {
      name: config.senderName || 'Your Name',
      email: config.senderEmail || 'you@example.com',
      company: config.senderCompany || 'Your Company'
    };

    // Daily limits (to avoid getting banned)
    this.limits = {
      email: config.limits?.email || 100,
      linkedin: config.limits?.linkedin || 50,
      twitter: config.limits?.twitter || 50,
      sms: config.limits?.sms || 20
    };

    // Today's usage
    this.dailyUsage = {
      email: 0,
      linkedin: 0,
      twitter: 0,
      sms: 0,
      lastReset: new Date().toDateString()
    };

    console.log('[OUTREACH] Engine initialized');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CAMPAIGN MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  createCampaign(data) {
    const campaign = new Campaign(data, this.aiEngine);
    this.campaigns.set(campaign.id, campaign);
    this.emit('campaign:created', { campaignId: campaign.id, name: campaign.name });
    return campaign;
  }

  getCampaign(campaignId) {
    return this.campaigns.get(campaignId);
  }

  listCampaigns() {
    return Array.from(this.campaigns.values()).map(c => c.getStats());
  }

  async startCampaign(campaignId) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

    campaign.status = 'active';
    campaign.startedAt = Date.now();

    this.emit('campaign:started', { campaignId });

    // Process first batch
    await this._processCampaignBatch(campaign);

    return campaign.getStats();
  }

  pauseCampaign(campaignId) {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

    campaign.status = 'paused';
    this.emit('campaign:paused', { campaignId });

    return campaign.getStats();
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PROSPECT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  addProspect(prospectData) {
    const prospect = new Prospect(prospectData);
    this.prospects.set(prospect.id, prospect);
    this.emit('prospect:added', { prospectId: prospect.id });
    return prospect;
  }

  importProspects(prospectList) {
    const imported = [];
    for (const data of prospectList) {
      const prospect = this.addProspect(data);
      imported.push(prospect.id);
    }
    this.emit('prospects:imported', { count: imported.length });
    return imported;
  }

  getProspect(prospectId) {
    return this.prospects.get(prospectId);
  }

  searchProspects(query) {
    const results = [];
    for (const prospect of this.prospects.values()) {
      const searchStr = `${prospect.firstName} ${prospect.lastName} ${prospect.company} ${prospect.email}`.toLowerCase();
      if (searchStr.includes(query.toLowerCase())) {
        results.push(prospect);
      }
    }
    return results;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MESSAGE GENERATION
  // ═══════════════════════════════════════════════════════════════════════

  async generateMessage(type, channel, prospect, variables = {}) {
    const template = MESSAGE_TEMPLATES[channel]?.[type];
    if (!template) {
      throw new Error(`No template found for ${channel}/${type}`);
    }

    const messageVars = {
      ...variables,
      sender_name: this.sender.name,
      sender_company: this.sender.company
    };

    // Get the template body (may be object with subject+body or just string)
    const templateBody = typeof template === 'object' ? template.body : template;
    const personalizedBody = await this._personalizeWithAI(templateBody, prospect, messageVars);

    if (typeof template === 'object' && template.subject) {
      return {
        subject: this._simpleReplace(template.subject, { ...messageVars, ...prospect }),
        body: personalizedBody
      };
    }

    return personalizedBody;
  }

  async _personalizeWithAI(template, prospect, variables) {
    if (!this.aiEngine) {
      return this._simpleReplace(template, { ...variables, ...prospect });
    }

    const systemPrompt = `You are HERMES, master of persuasive communication.
Personalize this outreach message for the prospect. Keep the core message intent but make it feel genuinely personal.
Output ONLY the personalized message, nothing else.`;

    const userPrompt = `TEMPLATE:
${template}

PROSPECT:
- Name: ${prospect.firstName} ${prospect.lastName}
- Company: ${prospect.company}
- Title: ${prospect.title}
- Industry: ${prospect.industry}

VARIABLES:
${JSON.stringify(variables, null, 2)}

Personalized message:`;

    try {
      const response = await this.aiEngine.run(systemPrompt, userPrompt, { temperature: 0.7 });
      return response.content || this._simpleReplace(template, { ...variables, ...prospect });
    } catch (error) {
      console.warn('[OUTREACH] AI personalization failed:', error.message);
      return this._simpleReplace(template, { ...variables, ...prospect });
    }
  }

  _simpleReplace(template, data) {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
      result = result.replace(new RegExp(`\\{${snakeKey}\\}`, 'g'), value || '');
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SENDING MESSAGES
  // ═══════════════════════════════════════════════════════════════════════

  async sendMessage(channel, prospect, message, options = {}) {
    // Check daily limits
    this._checkDailyLimits(channel);

    // Get channel provider
    const provider = this.channels[channel];

    let result;
    if (provider) {
      // Use integrated provider
      result = await provider.send(prospect, message, options);
    } else {
      // Log message for manual sending
      result = {
        sent: false,
        manual: true,
        message,
        prospect: prospect.toJSON()
      };
      console.log(`[OUTREACH] Manual ${channel} message queued for ${prospect.firstName} ${prospect.lastName}`);
    }

    // Update stats
    this.dailyUsage[channel]++;

    // Record touchpoint
    prospect.addTouchpoint({
      channel,
      type: options.type || 'message',
      message: typeof message === 'object' ? message.subject : message.substring(0, 100),
      sent: result.sent !== false
    });

    this.emit('message:sent', {
      channel,
      prospectId: prospect.id,
      sent: result.sent !== false
    });

    return result;
  }

  _checkDailyLimits(channel) {
    // Reset if new day
    const today = new Date().toDateString();
    if (this.dailyUsage.lastReset !== today) {
      this.dailyUsage = {
        email: 0,
        linkedin: 0,
        twitter: 0,
        sms: 0,
        lastReset: today
      };
    }

    if (this.dailyUsage[channel] >= this.limits[channel]) {
      throw new Error(`Daily ${channel} limit reached (${this.limits[channel]})`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CAMPAIGN PROCESSING
  // ═══════════════════════════════════════════════════════════════════════

  async _processCampaignBatch(campaign) {
    if (campaign.status !== 'active') return;

    const now = Date.now();

    for (const [prospectId, entry] of campaign.prospects) {
      if (entry.status !== 'pending') continue;

      const step = campaign.sequence.steps[entry.currentStep];
      if (!step) {
        entry.status = 'completed';
        continue;
      }

      // Check if it's time to send
      const sendTime = entry.nextSendTime || now;
      if (sendTime > now) continue;

      try {
        // Generate and send message
        const message = await this.generateMessage(
          step.type,
          step.channel,
          entry.prospect,
          campaign.variables
        );

        await this.sendMessage(step.channel, entry.prospect, message, { type: step.type });

        campaign.stats.sent++;

        // Schedule next step
        entry.currentStep++;
        if (entry.currentStep < campaign.sequence.steps.length) {
          const nextStep = campaign.sequence.steps[entry.currentStep];
          entry.nextSendTime = now + (nextStep.day - step.day) * 24 * 60 * 60 * 1000;
        } else {
          entry.status = 'completed';
        }

      } catch (error) {
        console.error(`[OUTREACH] Failed to process prospect ${prospectId}:`, error.message);
        if (error.message.includes('limit')) {
          break; // Stop batch if we hit limits
        }
      }

      // Small delay between sends to avoid rate limiting
      await sleep(1000);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REPORTING
  // ═══════════════════════════════════════════════════════════════════════

  getStats() {
    return {
      campaigns: this.campaigns.size,
      activeCampaigns: Array.from(this.campaigns.values()).filter(c => c.status === 'active').length,
      prospects: this.prospects.size,
      dailyUsage: this.dailyUsage,
      limits: this.limits
    };
  }

  getDailyReport() {
    const stats = this.getStats();
    const campaigns = this.listCampaigns();

    return {
      date: new Date().toISOString().split('T')[0],
      summary: {
        ...stats.dailyUsage,
        campaignsActive: stats.activeCampaigns,
        totalProspects: stats.prospects
      },
      campaigns: campaigns.filter(c => c.status === 'active'),
      recommendations: this._generateRecommendations()
    };
  }

  _generateRecommendations() {
    const recommendations = [];

    // Check if we have unused capacity
    for (const [channel, limit] of Object.entries(this.limits)) {
      const used = this.dailyUsage[channel];
      if (used < limit * 0.5) {
        recommendations.push(`Only used ${used}/${limit} ${channel} touches today. Increase outreach.`);
      }
    }

    // Check campaign performance
    for (const campaign of this.campaigns.values()) {
      if (campaign.status === 'active') {
        const stats = campaign.getStats();
        if (parseFloat(stats.replyRate) < 5) {
          recommendations.push(`Campaign "${campaign.name}" has low reply rate. Consider A/B testing subject lines.`);
        }
      }
    }

    return recommendations;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHANNEL PROVIDER INTERFACES
  // ═══════════════════════════════════════════════════════════════════════

  setEmailProvider(provider) {
    this.channels.email = provider;
  }

  setLinkedInProvider(provider) {
    this.channels.linkedin = provider;
  }

  setTwitterProvider(provider) {
    this.channels.twitter = provider;
  }

  setSMSProvider(provider) {
    this.channels.sms = provider;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  OutreachEngine,
  Campaign,
  Prospect,
  CHANNELS,
  CAMPAIGN_TYPES,
  SEQUENCE_TEMPLATES,
  MESSAGE_TEMPLATES
};
