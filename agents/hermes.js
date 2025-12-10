/**
 * hermes.js
 * Messaging & Client Communication Agent
 * Handles all client interactions, negotiations, and relationship management
 */

class Hermes {
    constructor(config = {}) {
        this.name = 'Hermes';
        this.version = '1.0.0';

        // Communication channels
        this.channels = {
            email: { enabled: true, provider: 'smtp' },
            slack: { enabled: true, webhookUrl: config.slackWebhook || null },
            discord: { enabled: true, webhookUrl: config.discordWebhook || null },
            telegram: { enabled: false, botToken: null },
            sms: { enabled: false, provider: null }
        };

        // Conversation tracking
        this.conversations = new Map();
        this.templates = new Map();
        this.quickReplies = new Map();

        // Tone profiles
        this.toneProfiles = {
            professional: { formality: 0.9, friendliness: 0.5, urgency: 0.3 },
            friendly: { formality: 0.4, friendliness: 0.9, urgency: 0.2 },
            urgent: { formality: 0.7, friendliness: 0.3, urgency: 0.9 },
            casual: { formality: 0.2, friendliness: 0.8, urgency: 0.1 },
            negotiation: { formality: 0.8, friendliness: 0.6, urgency: 0.5 }
        };

        // Stats
        this.stats = {
            messagesSent: 0,
            messagesReceived: 0,
            avgResponseTime: 0,
            clientSatisfaction: 5.0,
            activeConversations: 0
        };

        this._initTemplates();

        console.log('[Hermes] Messaging agent initialized');
    }

    /**
     * Initialize message templates
     */
    _initTemplates() {
        this.templates.set('project_start', {
            subject: 'Project Kickoff - {{projectName}}',
            body: `Hi {{clientName}},

Excited to get started on {{projectName}}! Here's what happens next:

1. I'll review all requirements in detail
2. Set up the development environment
3. Provide first milestone update within {{timeline}}

Questions? Just reply to this message.

Best,
{{signature}}`
        });

        this.templates.set('milestone_update', {
            subject: 'Milestone Update - {{projectName}}',
            body: `Hi {{clientName}},

Quick update on {{projectName}}:

**Completed:**
{{completedItems}}

**In Progress:**
{{inProgressItems}}

**Next Steps:**
{{nextSteps}}

ETA for next milestone: {{nextMilestoneDate}}

Let me know if you have any questions!

Best,
{{signature}}`
        });

        this.templates.set('delivery', {
            subject: 'Delivery Ready - {{projectName}}',
            body: `Hi {{clientName}},

Great news - {{projectName}} is ready for review!

**Deliverables:**
{{deliverables}}

**How to Access:**
{{accessInstructions}}

**Testing Notes:**
{{testingNotes}}

Please review and let me know if any adjustments are needed.

Best,
{{signature}}`
        });

        this.templates.set('follow_up', {
            subject: 'Following Up - {{subject}}',
            body: `Hi {{clientName}},

Just checking in on {{subject}}. Let me know if you need anything else or have any questions.

Happy to hop on a call if that's easier.

Best,
{{signature}}`
        });

        this.templates.set('negotiation', {
            subject: 'Re: {{subject}}',
            body: `Hi {{clientName}},

Thank you for your proposal. I've reviewed the scope and here are my thoughts:

{{negotiationPoints}}

I believe this approach would deliver the best value while staying within your timeline.

Would you be open to discussing this further?

Best,
{{signature}}`
        });

        // Quick replies
        this.quickReplies.set('acknowledge', 'Thanks for the update! I\'ll review and get back to you shortly.');
        this.quickReplies.set('delay', 'Thanks for your patience. I\'m working on this and will have an update for you by {{date}}.');
        this.quickReplies.set('clarify', 'Could you clarify {{topic}}? I want to make sure I understand correctly.');
        this.quickReplies.set('confirm', 'Confirmed! I\'ll proceed as discussed.');
        this.quickReplies.set('schedule', 'How does {{date}} at {{time}} work for a call?');
    }

    /**
     * Execute task
     */
    async execute(task) {
        switch (task.type) {
            case 'send_message':
                return this._sendMessage(task);
            case 'reply':
                return this._replyToMessage(task);
            case 'negotiate':
                return this._handleNegotiation(task);
            case 'schedule':
                return this._scheduleMessage(task);
            case 'broadcast':
                return this._broadcastMessage(task);
            case 'analyze_sentiment':
                return this._analyzeSentiment(task);
            default:
                return { error: 'Unknown task type' };
        }
    }

    /**
     * Send a message
     */
    async _sendMessage(task) {
        const { to, channel, template, variables, customMessage, tone } = task;

        let message;
        if (template && this.templates.has(template)) {
            message = this._applyTemplate(template, variables || {});
        } else if (customMessage) {
            message = this._adjustTone(customMessage, tone || 'professional');
        } else {
            return { error: 'No template or custom message provided' };
        }

        // Track conversation
        const conversationId = this._getOrCreateConversation(to);
        this.conversations.get(conversationId).messages.push({
            direction: 'outbound',
            content: message,
            timestamp: Date.now(),
            channel
        });

        // Simulate send (would integrate with actual providers)
        const result = await this._dispatchMessage(channel, to, message);

        this.stats.messagesSent++;
        console.log(`[Hermes] Message sent to ${to} via ${channel}`);

        return {
            success: true,
            conversationId,
            messageId: `msg_${Date.now()}`,
            channel,
            preview: message.body ? message.body.substring(0, 100) + '...' : message.substring(0, 100) + '...'
        };
    }

    /**
     * Apply template with variables
     */
    _applyTemplate(templateName, variables) {
        const template = this.templates.get(templateName);
        let subject = template.subject;
        let body = template.body;

        for (const [key, value] of Object.entries(variables)) {
            const pattern = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(pattern, value);
            body = body.replace(pattern, value);
        }

        return { subject, body };
    }

    /**
     * Adjust message tone
     */
    _adjustTone(message, toneName) {
        const tone = this.toneProfiles[toneName] || this.toneProfiles.professional;

        // Apply tone adjustments (simplified)
        let adjusted = message;

        if (tone.formality > 0.7) {
            adjusted = adjusted.replace(/hey/gi, 'Hello');
            adjusted = adjusted.replace(/yeah/gi, 'Yes');
            adjusted = adjusted.replace(/gonna/gi, 'going to');
        }

        if (tone.friendliness > 0.7) {
            adjusted = adjusted.replace(/Regards,/gi, 'Best,');
            if (!adjusted.includes('!')) {
                adjusted = adjusted.replace(/\.$/, '!');
            }
        }

        if (tone.urgency > 0.7) {
            adjusted = adjusted.replace(/when you can/gi, 'as soon as possible');
            adjusted = adjusted.replace(/no rush/gi, 'at your earliest convenience');
        }

        return adjusted;
    }

    /**
     * Reply to a message
     */
    async _replyToMessage(task) {
        const { conversationId, quickReply, customReply, variables } = task;

        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            return { error: 'Conversation not found' };
        }

        let reply;
        if (quickReply && this.quickReplies.has(quickReply)) {
            reply = this.quickReplies.get(quickReply);
            if (variables) {
                for (const [key, value] of Object.entries(variables)) {
                    reply = reply.replace(new RegExp(`{{${key}}}`, 'g'), value);
                }
            }
        } else if (customReply) {
            reply = customReply;
        } else {
            return { error: 'No reply content provided' };
        }

        conversation.messages.push({
            direction: 'outbound',
            content: reply,
            timestamp: Date.now(),
            channel: conversation.preferredChannel
        });

        this.stats.messagesSent++;

        return {
            success: true,
            conversationId,
            reply,
            responseTime: this._calculateResponseTime(conversation)
        };
    }

    /**
     * Handle negotiation
     */
    async _handleNegotiation(task) {
        const { conversationId, proposal, constraints, strategy } = task;

        const strategies = {
            firm: { flexibility: 0.1, concessionRate: 0.05 },
            balanced: { flexibility: 0.5, concessionRate: 0.15 },
            flexible: { flexibility: 0.8, concessionRate: 0.25 },
            win_win: { flexibility: 0.6, concessionRate: 0.2 }
        };

        const strat = strategies[strategy] || strategies.balanced;

        // Analyze proposal against constraints
        const analysis = {
            proposedBudget: proposal.budget,
            minAcceptable: constraints.minBudget,
            proposedTimeline: proposal.timeline,
            minTimeline: constraints.minTimeline,
            scope: proposal.scope
        };

        // Generate counter-proposal if needed
        let counterProposal = null;
        let recommendation = 'accept';

        if (proposal.budget < constraints.minBudget) {
            const gap = constraints.minBudget - proposal.budget;
            const concession = gap * strat.concessionRate;
            counterProposal = {
                budget: constraints.minBudget - concession,
                timeline: proposal.timeline,
                scope: proposal.scope,
                justification: 'Based on scope complexity and market rates'
            };
            recommendation = 'counter';
        }

        // Generate negotiation response
        const responsePoints = [];
        if (counterProposal) {
            responsePoints.push(`Budget: I can work with $${counterProposal.budget} for the defined scope`);
            responsePoints.push(`Timeline: ${proposal.timeline} is achievable`);
            responsePoints.push(`Added Value: I'll include ${this._generateAddedValue()}`);
        }

        return {
            analysis,
            recommendation,
            counterProposal,
            responsePoints,
            suggestedResponse: this._applyTemplate('negotiation', {
                subject: 'Project Proposal',
                clientName: task.clientName || 'there',
                negotiationPoints: responsePoints.map(p => `- ${p}`).join('\n'),
                signature: task.signature || 'Best regards'
            })
        };
    }

    /**
     * Generate added value for negotiations
     */
    _generateAddedValue() {
        const values = [
            '30 days of post-delivery support',
            'comprehensive documentation',
            'a brief walkthrough session',
            'minor revision rounds',
            'deployment assistance'
        ];
        return values[Math.floor(Math.random() * values.length)];
    }

    /**
     * Schedule a message
     */
    async _scheduleMessage(task) {
        const { sendAt, ...messageTask } = task;

        const scheduledId = `sched_${Date.now()}`;
        const delay = sendAt - Date.now();

        if (delay > 0) {
            setTimeout(() => {
                this._sendMessage(messageTask);
            }, delay);
        }

        return {
            scheduledId,
            sendAt,
            status: 'scheduled',
            preview: messageTask.customMessage?.substring(0, 50) + '...'
        };
    }

    /**
     * Broadcast message to multiple recipients
     */
    async _broadcastMessage(task) {
        const { recipients, template, variables, channel } = task;
        const results = [];

        for (const recipient of recipients) {
            const personalizedVars = {
                ...variables,
                ...recipient.variables,
                clientName: recipient.name
            };

            const result = await this._sendMessage({
                to: recipient.contact,
                channel: recipient.preferredChannel || channel,
                template,
                variables: personalizedVars
            });

            results.push({
                recipient: recipient.contact,
                ...result
            });
        }

        return {
            totalSent: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };
    }

    /**
     * Analyze sentiment of received message
     */
    _analyzeSentiment(task) {
        const { message } = task;
        const text = message.toLowerCase();

        // Simple keyword-based sentiment (would use ML in production)
        const positive = ['great', 'excellent', 'thanks', 'perfect', 'love', 'amazing', 'happy', 'pleased'];
        const negative = ['disappointed', 'frustrated', 'angry', 'unhappy', 'bad', 'poor', 'issue', 'problem'];
        const urgent = ['asap', 'urgent', 'immediately', 'critical', 'deadline', 'emergency'];

        let sentiment = 'neutral';
        let urgency = 'normal';
        let score = 0;

        positive.forEach(word => {
            if (text.includes(word)) score += 1;
        });

        negative.forEach(word => {
            if (text.includes(word)) score -= 1;
        });

        urgent.forEach(word => {
            if (text.includes(word)) urgency = 'high';
        });

        if (score > 0) sentiment = 'positive';
        else if (score < 0) sentiment = 'negative';

        return {
            sentiment,
            score,
            urgency,
            suggestedTone: sentiment === 'negative' ? 'professional' : 'friendly',
            suggestedResponseTime: urgency === 'high' ? '< 1 hour' : '< 24 hours'
        };
    }

    /**
     * Get or create conversation
     */
    _getOrCreateConversation(contact) {
        const existing = Array.from(this.conversations.entries())
            .find(([, conv]) => conv.contact === contact);

        if (existing) {
            return existing[0];
        }

        const id = `conv_${Date.now()}`;
        this.conversations.set(id, {
            id,
            contact,
            messages: [],
            preferredChannel: 'email',
            createdAt: Date.now(),
            lastActivity: Date.now()
        });

        this.stats.activeConversations++;
        return id;
    }

    /**
     * Calculate response time
     */
    _calculateResponseTime(conversation) {
        const messages = conversation.messages;
        if (messages.length < 2) return null;

        const lastInbound = messages.filter(m => m.direction === 'inbound').pop();
        const lastOutbound = messages.filter(m => m.direction === 'outbound').pop();

        if (lastInbound && lastOutbound && lastOutbound.timestamp > lastInbound.timestamp) {
            return lastOutbound.timestamp - lastInbound.timestamp;
        }

        return null;
    }

    /**
     * Dispatch message to channel
     */
    async _dispatchMessage(channel, to, message) {
        // Simulated dispatch - would integrate with actual providers
        const dispatchers = {
            email: () => ({ sent: true, provider: 'smtp' }),
            slack: () => ({ sent: true, provider: 'webhook' }),
            discord: () => ({ sent: true, provider: 'webhook' }),
            telegram: () => ({ sent: true, provider: 'bot' }),
            sms: () => ({ sent: true, provider: 'twilio' })
        };

        const dispatcher = dispatchers[channel] || dispatchers.email;
        return dispatcher();
    }

    /**
     * Get conversation history
     */
    getConversation(conversationId) {
        return this.conversations.get(conversationId);
    }

    /**
     * Get all active conversations
     */
    getActiveConversations() {
        return Array.from(this.conversations.values())
            .filter(c => Date.now() - c.lastActivity < 7 * 24 * 60 * 60 * 1000); // Last 7 days
    }

    /**
     * Get stats
     */
    getStats() {
        return this.stats;
    }
}

module.exports = Hermes;
