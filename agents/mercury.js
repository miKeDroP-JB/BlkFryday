/**
 * mercury.js
 * Outreach & Pitching Agent
 * Automates client acquisition and relationship building
 */

class Mercury {
    constructor(config = {}) {
        this.name = 'Mercury';
        this.version = '1.0.0';

        // Outreach templates
        this.templates = {
            coldOutreach: config.coldTemplate || null,
            followUp: config.followUpTemplate || null,
            pitch: config.pitchTemplate || null
        };

        // Targets
        this.prospects = [];
        this.contacted = [];
        this.responses = [];

        // Channels
        this.channels = ['email', 'linkedin', 'twitter', 'direct'];

        // Stats
        this.stats = {
            sent: 0,
            opened: 0,
            responded: 0,
            converted: 0,
            responseRate: 0
        };

        console.log('[Mercury] 📨 Outreach agent initialized');
    }

    /**
     * Execute task
     */
    async execute(task) {
        switch (task.type) {
            case 'outreach':
                return this._sendOutreach(task);
            case 'pitch':
                return this._sendPitch(task);
            case 'follow_up':
                return this._sendFollowUp(task);
            case 'prospect':
                return this._findProspects(task);
            default:
                return { error: 'Unknown task type' };
        }
    }

    /**
     * Find prospects
     */
    async _findProspects(task) {
        const criteria = task.criteria || {};
        const prospects = [];

        // Simulated prospect finding
        const industries = criteria.industries || ['tech', 'saas', 'fintech', 'ecommerce'];
        const count = criteria.count || 10;

        for (let i = 0; i < count; i++) {
            prospects.push({
                id: `prospect_${Date.now()}_${i}`,
                company: `Company ${i + 1}`,
                industry: industries[Math.floor(Math.random() * industries.length)],
                size: ['startup', 'smb', 'enterprise'][Math.floor(Math.random() * 3)],
                contact: {
                    name: `Contact ${i + 1}`,
                    title: ['CTO', 'CEO', 'VP Engineering', 'Tech Lead'][Math.floor(Math.random() * 4)],
                    channel: this.channels[Math.floor(Math.random() * this.channels.length)]
                },
                score: Math.floor(Math.random() * 100),
                foundAt: Date.now()
            });
        }

        // Sort by score
        prospects.sort((a, b) => b.score - a.score);

        this.prospects.push(...prospects);

        return {
            found: prospects.length,
            prospects: prospects.slice(0, 10)
        };
    }

    /**
     * Send outreach message
     */
    async _sendOutreach(task) {
        const prospect = task.prospect;
        const template = task.template || this._getDefaultOutreachTemplate();

        // Personalize message
        const message = this._personalizeMessage(template, prospect);

        const outreach = {
            id: `outreach_${Date.now()}`,
            prospectId: prospect.id,
            channel: prospect.contact.channel,
            message,
            sentAt: Date.now(),
            status: 'sent'
        };

        this.contacted.push(outreach);
        this.stats.sent++;

        console.log(`[Mercury] 📤 Outreach sent to: ${prospect.company}`);

        return {
            outreachId: outreach.id,
            status: 'sent',
            channel: outreach.channel
        };
    }

    /**
     * Send pitch
     */
    async _sendPitch(task) {
        const prospect = task.prospect;
        const offering = task.offering;

        const pitch = this._generatePitch(prospect, offering);

        const record = {
            id: `pitch_${Date.now()}`,
            prospectId: prospect.id,
            pitch,
            sentAt: Date.now(),
            status: 'sent'
        };

        this.contacted.push(record);
        this.stats.sent++;

        console.log(`[Mercury] 🎯 Pitch sent to: ${prospect.company}`);

        return {
            pitchId: record.id,
            status: 'sent'
        };
    }

    /**
     * Send follow-up
     */
    async _sendFollowUp(task) {
        const original = task.originalOutreach;
        const daysSince = Math.floor((Date.now() - original.sentAt) / (1000 * 60 * 60 * 24));

        const followUp = {
            id: `followup_${Date.now()}`,
            originalId: original.id,
            prospectId: original.prospectId,
            message: this._getFollowUpMessage(daysSince),
            sentAt: Date.now(),
            attemptNumber: (original.followUps || 0) + 1,
            status: 'sent'
        };

        this.contacted.push(followUp);
        this.stats.sent++;

        console.log(`[Mercury] 🔄 Follow-up #${followUp.attemptNumber} sent`);

        return {
            followUpId: followUp.id,
            attemptNumber: followUp.attemptNumber,
            status: 'sent'
        };
    }

    /**
     * Get default outreach template
     */
    _getDefaultOutreachTemplate() {
        return {
            subject: 'Quick question about {{company}}',
            body: `Hi {{name}},

I noticed {{company}} is doing interesting work in {{industry}}.

I help companies like yours with:
- Automation that saves 10+ hours/week
- Security assessments that prevent costly breaches
- Custom tooling that accelerates development

Would you be open to a quick 15-minute call to see if there's a fit?

Best,
[Your Name]`
        };
    }

    /**
     * Personalize message
     */
    _personalizeMessage(template, prospect) {
        let body = template.body;
        let subject = template.subject;

        const replacements = {
            '{{name}}': prospect.contact.name,
            '{{company}}': prospect.company,
            '{{industry}}': prospect.industry,
            '{{title}}': prospect.contact.title
        };

        for (const [key, value] of Object.entries(replacements)) {
            body = body.replace(new RegExp(key, 'g'), value);
            subject = subject.replace(new RegExp(key, 'g'), value);
        }

        return { subject, body };
    }

    /**
     * Generate pitch
     */
    _generatePitch(prospect, offering) {
        const pitch = {
            headline: `${offering.name} for ${prospect.company}`,
            problem: `Companies in ${prospect.industry} often struggle with...`,
            solution: offering.description,
            benefits: offering.benefits || [
                'Save time',
                'Reduce costs',
                'Increase security',
                'Scale faster'
            ],
            cta: 'Schedule a demo',
            pricing: offering.pricing || 'Custom quote'
        };

        return pitch;
    }

    /**
     * Get follow-up message
     */
    _getFollowUpMessage(daysSince) {
        const messages = [
            `Just following up on my previous message. Would love to connect if you have a few minutes.`,
            `Wanted to bump this to the top of your inbox. Any interest in chatting?`,
            `I know you're busy, but thought this might be worth a quick look. Happy to work around your schedule.`
        ];

        return messages[Math.min(daysSince - 1, messages.length - 1)] || messages[0];
    }

    /**
     * Record response
     */
    recordResponse(outreachId, response) {
        const outreach = this.contacted.find(c => c.id === outreachId);
        if (outreach) {
            outreach.response = response;
            outreach.respondedAt = Date.now();
            this.responses.push({ outreachId, response, timestamp: Date.now() });
            this.stats.responded++;
            this._updateStats();
        }
    }

    /**
     * Update stats
     */
    _updateStats() {
        if (this.stats.sent > 0) {
            this.stats.responseRate = (this.stats.responded / this.stats.sent) * 100;
        }
    }

    /**
     * Get stats
     */
    getStats() {
        return this.stats;
    }
}

module.exports = Mercury;
