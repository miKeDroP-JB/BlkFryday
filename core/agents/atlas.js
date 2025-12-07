/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║    █████╗ ████████╗██╗      █████╗ ███████╗                               ║
 * ║   ██╔══██╗╚══██╔══╝██║     ██╔══██╗██╔════╝                               ║
 * ║   ███████║   ██║   ██║     ███████║███████╗                               ║
 * ║   ██╔══██║   ██║   ██║     ██╔══██║╚════██║                               ║
 * ║   ██║  ██║   ██║   ███████╗██║  ██║███████║                               ║
 * ║   ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝                               ║
 * ║                                                                           ║
 * ║   YOUR AI CHIEF OF STAFF                                                  ║
 * ║   Scheduling • Prioritization • Email Triage • Daily Briefs               ║
 * ║                                                                           ║
 * ║   "Filter everything up, flag the important, discard the noise"           ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');

// ═══════════════════════════════════════════════════════════════════════════
// PRIORITY LEVELS
// ═══════════════════════════════════════════════════════════════════════════

const PRIORITY = {
  CRITICAL: { level: 5, label: '🔴 CRITICAL', color: 'red' },
  HIGH: { level: 4, label: '🟠 HIGH', color: 'orange' },
  MEDIUM: { level: 3, label: '🟡 MEDIUM', color: 'yellow' },
  LOW: { level: 2, label: '🟢 LOW', color: 'green' },
  NONE: { level: 1, label: '⚪ NONE', color: 'gray' }
};

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

const EMAIL_CATEGORIES = {
  URGENT_ACTION: 'urgent_action',      // Needs immediate response
  NEEDS_RESPONSE: 'needs_response',    // Reply expected but not urgent
  FYI: 'fyi',                          // Just informational
  NEWSLETTER: 'newsletter',            // Can batch read
  PROMOTIONAL: 'promotional',          // Can usually delete
  SPAM: 'spam',                        // Delete
  OPPORTUNITY: 'opportunity'           // Potential business opportunity
};

// ═══════════════════════════════════════════════════════════════════════════
// ATLAS AGENT CLASS
// ═══════════════════════════════════════════════════════════════════════════

class AtlasAgent extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      aiEngine: config.aiEngine || null,
      timezone: config.timezone || 'America/New_York',
      workHoursStart: config.workHoursStart || 9,
      workHoursEnd: config.workHoursEnd || 18,
      dailyBriefTime: config.dailyBriefTime || '07:00',
      ...config
    };

    this.aiEngine = this.config.aiEngine;

    // State
    this.tasks = [];
    this.emails = [];
    this.calendar = [];
    this.context = {
      currentFocus: null,
      lastInteraction: null,
      openLoops: [],
      blockers: []
    };

    // Daily brief cache
    this.dailyBrief = null;
    this.lastBriefDate = null;
  }

  /**
   * Set the AI engine
   */
  setAIEngine(engine) {
    this.aiEngine = engine;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EMAIL TRIAGE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Triage a batch of emails
   * @param {Array} emails - Array of email objects
   * @returns {Object} Categorized and prioritized emails
   */
  async triageEmails(emails) {
    if (!this.aiEngine) {
      throw new Error('AI Engine not configured');
    }

    console.log(`[ATLAS] Triaging ${emails.length} emails...`);

    const systemPrompt = `You are ATLAS, an AI Chief of Staff. Your job is to triage emails.

For each email, determine:
1. Category (urgent_action, needs_response, fyi, newsletter, promotional, spam, opportunity)
2. Priority (CRITICAL, HIGH, MEDIUM, LOW, NONE)
3. Suggested action (reply, forward, archive, delete, schedule)
4. Key points (2-3 bullet points)
5. Estimated response time if reply needed

Be ruthless about filtering noise. Only CRITICAL and HIGH priority items should interrupt focus time.

Respond in JSON format:
{
  "emails": [
    {
      "id": "...",
      "category": "...",
      "priority": "...",
      "suggestedAction": "...",
      "keyPoints": ["...", "..."],
      "estimatedResponseTime": "5 min",
      "draftReply": "..." // Only if needs_response
    }
  ],
  "summary": {
    "total": N,
    "urgent": N,
    "needsResponse": N,
    "canIgnore": N
  }
}`;

    const emailSummaries = emails.map((e, i) => `
Email ${i + 1}:
From: ${e.from}
Subject: ${e.subject}
Date: ${e.date}
Preview: ${e.body?.slice(0, 500) || e.preview || 'No preview'}
`).join('\n---\n');

    const response = await this.aiEngine.run(systemPrompt, `Triage these emails:\n${emailSummaries}`, {
      temperature: 0.3
    });

    const result = this._parseJSON(response.content);

    // Store for context
    this.emails = result.emails || [];

    this.emit('emails:triaged', result);

    return result;
  }

  /**
   * Generate a draft reply for an email
   */
  async draftReply(email, context = {}) {
    if (!this.aiEngine) {
      throw new Error('AI Engine not configured');
    }

    const systemPrompt = `You are ATLAS, drafting an email reply on behalf of the user.

Tone: Professional but personable
Length: Concise - get to the point
Style: ${context.style || 'Match the formality of the original email'}

The user can edit before sending. Provide a complete draft they can send as-is or modify.`;

    const userMessage = `Draft a reply to this email:

From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

${context.instructions ? `Additional instructions: ${context.instructions}` : ''}`;

    const response = await this.aiEngine.run(systemPrompt, userMessage, {
      temperature: 0.7
    });

    return {
      to: email.from,
      subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      body: response.content,
      originalEmail: email
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TASK PRIORITIZATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Add a task
   */
  addTask(task) {
    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: task.title || task,
      description: task.description || '',
      priority: task.priority || 'MEDIUM',
      dueDate: task.dueDate || null,
      estimatedTime: task.estimatedTime || null,
      tags: task.tags || [],
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.tasks.push(newTask);
    this.emit('task:added', newTask);

    return newTask;
  }

  /**
   * Prioritize all tasks
   */
  async prioritizeTasks() {
    if (!this.aiEngine) {
      throw new Error('AI Engine not configured');
    }

    if (this.tasks.length === 0) {
      return { prioritized: [], recommendations: [] };
    }

    const systemPrompt = `You are ATLAS, prioritizing tasks for maximum productivity.

Consider:
1. Urgency (deadlines)
2. Impact (value delivered)
3. Dependencies (what blocks what)
4. Energy required (match to available energy)
5. Time available

Use the Eisenhower Matrix:
- Urgent + Important = Do First
- Important + Not Urgent = Schedule
- Urgent + Not Important = Delegate
- Not Urgent + Not Important = Eliminate

Respond in JSON:
{
  "prioritized": [
    {
      "id": "...",
      "suggestedPriority": "CRITICAL|HIGH|MEDIUM|LOW",
      "reasoning": "...",
      "bestTimeToWork": "morning|afternoon|evening|anytime",
      "blockedBy": ["task-id"] or null
    }
  ],
  "recommendations": [
    "Consider delegating X",
    "Task Y can be batched with Z"
  ],
  "focusOrder": ["task-id-1", "task-id-2", ...]
}`;

    const taskList = this.tasks.map(t => `
- ID: ${t.id}
  Title: ${t.title}
  Description: ${t.description}
  Current Priority: ${t.priority}
  Due: ${t.dueDate || 'No deadline'}
  Est. Time: ${t.estimatedTime || 'Unknown'}
  Tags: ${t.tags.join(', ') || 'None'}
`).join('\n');

    const response = await this.aiEngine.run(systemPrompt, `Prioritize these tasks:\n${taskList}`, {
      temperature: 0.3
    });

    const result = this._parseJSON(response.content);

    // Update task priorities
    if (result.prioritized) {
      for (const update of result.prioritized) {
        const task = this.tasks.find(t => t.id === update.id);
        if (task) {
          task.priority = update.suggestedPriority;
          task.reasoning = update.reasoning;
          task.bestTimeToWork = update.bestTimeToWork;
        }
      }
    }

    this.emit('tasks:prioritized', result);

    return result;
  }

  /**
   * Get next task to focus on
   */
  getNextTask() {
    const pending = this.tasks.filter(t => t.status === 'pending');
    if (pending.length === 0) return null;

    // Sort by priority
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4 };
    pending.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return pending[0];
  }

  /**
   * Complete a task
   */
  completeTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      this.emit('task:completed', task);
    }
    return task;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DAILY BRIEF
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generate daily brief
   */
  async generateDailyBrief(options = {}) {
    if (!this.aiEngine) {
      throw new Error('AI Engine not configured');
    }

    const today = new Date().toISOString().split('T')[0];

    // Check cache
    if (this.lastBriefDate === today && this.dailyBrief && !options.force) {
      return this.dailyBrief;
    }

    console.log('[ATLAS] Generating daily brief...');

    const systemPrompt = `You are ATLAS, creating a morning brief for your executive.

The brief should be:
- Scannable in 30 seconds
- Actionable
- Honest about priorities (don't sugarcoat)

Include:
1. Top 3 priorities for today
2. Key meetings/events
3. Items that need immediate attention
4. Opportunities identified
5. Blockers to address
6. One motivational note (brief, not cheesy)

Format for easy reading. Use bullet points.`;

    const context = `
Current date: ${today}
Day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

TASKS (${this.tasks.length} total):
${this.tasks.filter(t => t.status === 'pending').map(t =>
  `- [${t.priority}] ${t.title}${t.dueDate ? ` (Due: ${t.dueDate})` : ''}`
).join('\n') || 'No pending tasks'}

CALENDAR:
${this.calendar.map(e =>
  `- ${e.time}: ${e.title}${e.attendees ? ` (with ${e.attendees.join(', ')})` : ''}`
).join('\n') || 'No events scheduled'}

UNREAD EMAILS:
${this.emails.filter(e => e.category === 'urgent_action' || e.category === 'needs_response').map(e =>
  `- [${e.priority}] From ${e.from}: ${e.subject}`
).slice(0, 10).join('\n') || 'Inbox clear'}

OPEN LOOPS:
${this.context.openLoops.map(l => `- ${l}`).join('\n') || 'None tracked'}

BLOCKERS:
${this.context.blockers.map(b => `- ${b}`).join('\n') || 'None'}
`;

    const response = await this.aiEngine.run(systemPrompt, `Generate my daily brief:\n${context}`, {
      temperature: 0.7
    });

    this.dailyBrief = {
      date: today,
      content: response.content,
      generatedAt: new Date().toISOString(),
      inputContext: {
        taskCount: this.tasks.length,
        emailCount: this.emails.length,
        eventCount: this.calendar.length
      }
    };

    this.lastBriefDate = today;

    this.emit('brief:generated', this.dailyBrief);

    return this.dailyBrief;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONTEXT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Set current focus
   */
  setFocus(focus) {
    this.context.currentFocus = {
      what: focus,
      startedAt: new Date().toISOString()
    };
    this.emit('focus:set', this.context.currentFocus);
  }

  /**
   * Add open loop (something to follow up on)
   */
  addOpenLoop(item) {
    this.context.openLoops.push({
      item,
      addedAt: new Date().toISOString()
    });
    this.emit('openloop:added', item);
  }

  /**
   * Close open loop
   */
  closeOpenLoop(index) {
    const removed = this.context.openLoops.splice(index, 1);
    this.emit('openloop:closed', removed[0]);
  }

  /**
   * Add blocker
   */
  addBlocker(blocker) {
    this.context.blockers.push({
      blocker,
      addedAt: new Date().toISOString()
    });
    this.emit('blocker:added', blocker);
  }

  /**
   * Resolve blocker
   */
  resolveBlocker(index) {
    const removed = this.context.blockers.splice(index, 1);
    this.emit('blocker:resolved', removed[0]);
  }

  /**
   * Get context summary for handoff (e.g., to another agent)
   */
  getContextSummary() {
    return {
      currentFocus: this.context.currentFocus,
      pendingTasks: this.tasks.filter(t => t.status === 'pending').length,
      urgentEmails: this.emails.filter(e => e.priority === 'CRITICAL' || e.priority === 'HIGH').length,
      openLoops: this.context.openLoops.length,
      blockers: this.context.blockers.length,
      todaysEvents: this.calendar.length,
      lastInteraction: this.context.lastInteraction
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CALENDAR INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Add calendar event
   */
  addEvent(event) {
    const newEvent = {
      id: `event-${Date.now()}`,
      title: event.title,
      time: event.time,
      duration: event.duration || 60,
      attendees: event.attendees || [],
      location: event.location || null,
      notes: event.notes || '',
      createdAt: new Date().toISOString()
    };

    this.calendar.push(newEvent);
    this.calendar.sort((a, b) => new Date(a.time) - new Date(b.time));

    this.emit('event:added', newEvent);

    return newEvent;
  }

  /**
   * Find best time for a meeting
   */
  async findBestTime(duration, attendees = [], preferences = {}) {
    if (!this.aiEngine) {
      throw new Error('AI Engine not configured');
    }

    const systemPrompt = `You are ATLAS, finding optimal meeting times.

Consider:
1. Existing calendar commitments
2. Energy levels (avoid meeting-heavy times)
3. Focus blocks (protect deep work time)
4. Attendee preferences if known

Suggest 3 options with reasoning.

Respond in JSON:
{
  "suggestions": [
    {
      "datetime": "ISO string",
      "reasoning": "...",
      "conflicts": [] or ["..."]
    }
  ]
}`;

    const context = `
Duration needed: ${duration} minutes
Attendees: ${attendees.join(', ') || 'Just me'}
Preferences: ${JSON.stringify(preferences)}

Current calendar:
${this.calendar.map(e => `- ${e.time}: ${e.title} (${e.duration}min)`).join('\n') || 'Empty'}

Work hours: ${this.config.workHoursStart}:00 - ${this.config.workHoursEnd}:00
`;

    const response = await this.aiEngine.run(systemPrompt, context, { temperature: 0.3 });

    return this._parseJSON(response.content);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // QUICK CAPTURE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Quick capture - process a quick thought/task/idea
   */
  async capture(input) {
    if (!this.aiEngine) {
      // Fallback: just add as task
      return this.addTask({ title: input });
    }

    const systemPrompt = `You are ATLAS. The user just captured a quick thought.

Determine what this is:
1. TASK - Something to do
2. IDEA - Creative thought to explore later
3. REMINDER - Something to remember
4. FOLLOW_UP - Something to check on
5. NOTE - Just information to record

Extract:
- Type
- Core content
- Any dates/deadlines mentioned
- Priority if urgent language used

Respond in JSON:
{
  "type": "TASK|IDEA|REMINDER|FOLLOW_UP|NOTE",
  "content": "cleaned up version",
  "deadline": "ISO date or null",
  "priority": "CRITICAL|HIGH|MEDIUM|LOW",
  "suggestedAction": "what to do with this"
}`;

    const response = await this.aiEngine.run(systemPrompt, `Capture: "${input}"`, {
      temperature: 0.3
    });

    const parsed = this._parseJSON(response.content);

    // Route to appropriate handler
    if (parsed.type === 'TASK') {
      return this.addTask({
        title: parsed.content,
        priority: parsed.priority,
        dueDate: parsed.deadline
      });
    } else {
      // Store as open loop for other types
      this.addOpenLoop(`[${parsed.type}] ${parsed.content}`);
      return parsed;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Parse JSON from AI response
   */
  _parseJSON(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('[ATLAS] Failed to parse JSON:', e.message);
    }
    return { raw: content };
  }

  /**
   * Get full status
   */
  getStatus() {
    return {
      tasks: {
        total: this.tasks.length,
        pending: this.tasks.filter(t => t.status === 'pending').length,
        completed: this.tasks.filter(t => t.status === 'completed').length,
        byPriority: {
          critical: this.tasks.filter(t => t.priority === 'CRITICAL' && t.status === 'pending').length,
          high: this.tasks.filter(t => t.priority === 'HIGH' && t.status === 'pending').length,
          medium: this.tasks.filter(t => t.priority === 'MEDIUM' && t.status === 'pending').length,
          low: this.tasks.filter(t => t.priority === 'LOW' && t.status === 'pending').length
        }
      },
      emails: {
        total: this.emails.length,
        urgent: this.emails.filter(e => e.category === 'urgent_action').length,
        needsResponse: this.emails.filter(e => e.category === 'needs_response').length
      },
      calendar: {
        todayEvents: this.calendar.length
      },
      context: {
        currentFocus: this.context.currentFocus?.what || null,
        openLoops: this.context.openLoops.length,
        blockers: this.context.blockers.length
      },
      lastBrief: this.lastBriefDate
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  AtlasAgent,
  PRIORITY,
  EMAIL_CATEGORIES
};
