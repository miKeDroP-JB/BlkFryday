// ============================================================
//  ORBOS V11.5 - SYNTHETIC DATA FORGE
//  AI Generating Perfect Training Data for Itself
// ============================================================
//
//  "The smartest system creates its own training data"
//
//  Generate millions of realistic:
//  - Sales conversations
//  - Support tickets
//  - Marketing content
//  - Business workflows
//  - Edge cases & error scenarios
//
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class SyntheticDataForge extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.dataDir = config.dataDir || path.join(__dirname, '../../data/synthetic');
    this.ensureDirectories();

    // ============================================================
    //  GENERATION STATE
    // ============================================================

    this.state = {
      running: false,
      generators: new Map(),
      totalGenerated: 0,
      byType: {},
      quality: {
        excellent: 0,
        good: 0,
        acceptable: 0,
        rejected: 0
      }
    };

    // ============================================================
    //  PERSONA LIBRARY (Realistic Characters)
    // ============================================================

    this.personas = {
      // Customer Personas
      customers: {
        frustrated_customer: {
          name: 'Frustrated Customer',
          traits: ['impatient', 'demanding', 'upset'],
          language: ['I need this fixed NOW', 'This is unacceptable', 'I want to speak to a manager'],
          industries: ['all']
        },
        confused_customer: {
          name: 'Confused Customer',
          traits: ['uncertain', 'asks many questions', 'needs hand-holding'],
          language: ['Im not sure how to...', 'Can you explain...', 'What does this mean?'],
          industries: ['all']
        },
        power_user: {
          name: 'Power User',
          traits: ['technical', 'efficient', 'knows what they want'],
          language: ['I need the API endpoint for...', 'Can you bulk export...', 'Whats the rate limit?'],
          industries: ['tech', 'saas']
        },
        price_sensitive: {
          name: 'Price Sensitive',
          traits: ['budget-conscious', 'compares options', 'asks about discounts'],
          language: ['Whats your best price?', 'Do you have any promotions?', 'Your competitor offers...'],
          industries: ['all']
        },
        enterprise_buyer: {
          name: 'Enterprise Buyer',
          traits: ['formal', 'process-driven', 'security-focused'],
          language: ['We need SOC2 compliance', 'What are your SLAs?', 'Can we get a custom contract?'],
          industries: ['enterprise', 'finance', 'healthcare']
        },
        small_business_owner: {
          name: 'Small Business Owner',
          traits: ['time-poor', 'wears many hats', 'practical'],
          language: ['I dont have time for...', 'Just tell me what works', 'Will this save me time?'],
          industries: ['smb', 'retail', 'services']
        }
      },

      // Sales Rep Personas
      salesReps: {
        aggressive_closer: {
          style: 'High pressure, urgency-focused',
          techniques: ['scarcity', 'social proof', 'assumptive close']
        },
        consultative_seller: {
          style: 'Problem-solving, value-focused',
          techniques: ['discovery questions', 'ROI calculation', 'case studies']
        },
        relationship_builder: {
          style: 'Long-term focused, trust-building',
          techniques: ['personal connection', 'follow-up', 'referral ask']
        }
      },

      // Support Agent Personas
      supportAgents: {
        efficient_resolver: {
          style: 'Quick, solution-focused',
          approach: 'Identify problem fast, provide solution, confirm resolution'
        },
        empathetic_helper: {
          style: 'Understanding, patient',
          approach: 'Acknowledge frustration, explain thoroughly, ensure satisfaction'
        },
        technical_expert: {
          style: 'Detailed, thorough',
          approach: 'Deep diagnosis, root cause analysis, preventive advice'
        }
      }
    };

    // ============================================================
    //  INDUSTRY TEMPLATES
    // ============================================================

    this.industries = {
      saas: {
        name: 'SaaS / Software',
        products: ['CRM', 'project management', 'analytics', 'automation'],
        pain_points: ['integration issues', 'user adoption', 'pricing tiers', 'feature requests'],
        terminology: ['API', 'webhook', 'SSO', 'seats', 'workspace', 'integration']
      },
      ecommerce: {
        name: 'E-Commerce',
        products: ['clothing', 'electronics', 'home goods', 'subscriptions'],
        pain_points: ['shipping delays', 'returns', 'sizing issues', 'payment problems'],
        terminology: ['SKU', 'fulfillment', 'cart', 'checkout', 'tracking', 'refund']
      },
      healthcare: {
        name: 'Healthcare',
        products: ['appointments', 'prescriptions', 'insurance', 'records'],
        pain_points: ['wait times', 'billing confusion', 'appointment availability', 'referrals'],
        terminology: ['copay', 'deductible', 'prior auth', 'referral', 'provider', 'coverage']
      },
      finance: {
        name: 'Financial Services',
        products: ['accounts', 'loans', 'investments', 'insurance'],
        pain_points: ['fees', 'approval times', 'documentation', 'security concerns'],
        terminology: ['APR', 'balance', 'statement', 'transfer', 'limit', 'credit']
      },
      real_estate: {
        name: 'Real Estate',
        products: ['listings', 'rentals', 'mortgages', 'property management'],
        pain_points: ['availability', 'pricing', 'documentation', 'timing'],
        terminology: ['listing', 'showing', 'offer', 'closing', 'escrow', 'inspection']
      },
      professional_services: {
        name: 'Professional Services',
        products: ['consulting', 'legal', 'accounting', 'marketing'],
        pain_points: ['scope creep', 'timeline', 'communication', 'deliverables'],
        terminology: ['retainer', 'billable', 'deliverable', 'scope', 'engagement', 'SOW']
      }
    };

    // ============================================================
    //  SCENARIO TEMPLATES
    // ============================================================

    this.scenarios = {
      sales: {
        cold_outreach: {
          stages: ['intro', 'value_prop', 'discovery', 'objection_handling', 'close_attempt'],
          outcomes: ['meeting_booked', 'follow_up_needed', 'not_interested', 'wrong_contact']
        },
        demo_call: {
          stages: ['rapport', 'needs_assessment', 'product_demo', 'questions', 'next_steps'],
          outcomes: ['trial_started', 'proposal_requested', 'needs_approval', 'not_a_fit']
        },
        negotiation: {
          stages: ['opening', 'value_discussion', 'price_objection', 'terms_negotiation', 'close'],
          outcomes: ['deal_closed', 'discount_given', 'lost_on_price', 'competitor_chosen']
        },
        follow_up: {
          stages: ['check_in', 'address_concerns', 'provide_value', 'advance_deal'],
          outcomes: ['moved_forward', 'delayed', 'ghosted', 'lost']
        }
      },

      support: {
        technical_issue: {
          stages: ['problem_statement', 'clarification', 'troubleshooting', 'resolution', 'verification'],
          outcomes: ['resolved', 'escalated', 'workaround_provided', 'known_issue']
        },
        billing_inquiry: {
          stages: ['question', 'account_lookup', 'explanation', 'action', 'confirmation'],
          outcomes: ['explained', 'refunded', 'adjusted', 'escalated']
        },
        feature_request: {
          stages: ['request', 'understanding_need', 'setting_expectations', 'alternatives', 'documentation'],
          outcomes: ['logged', 'already_exists', 'workaround_provided', 'not_planned']
        },
        complaint: {
          stages: ['venting', 'acknowledgment', 'investigation', 'resolution_offer', 'follow_up'],
          outcomes: ['satisfied', 'partially_satisfied', 'escalated', 'churned']
        },
        onboarding: {
          stages: ['welcome', 'setup_guidance', 'first_task', 'questions', 'success_confirmation'],
          outcomes: ['activated', 'needs_help', 'abandoned', 'upgraded']
        }
      },

      marketing: {
        content_creation: {
          types: ['blog_post', 'social_post', 'email', 'ad_copy', 'landing_page'],
          tones: ['professional', 'casual', 'urgent', 'educational', 'entertaining']
        },
        campaign_planning: {
          elements: ['objective', 'audience', 'channels', 'messaging', 'timeline', 'budget'],
          outcomes: ['launched', 'optimized', 'paused', 'scaled']
        }
      }
    };

    // ============================================================
    //  OBJECTION LIBRARY
    // ============================================================

    this.objections = {
      price: [
        "It's too expensive",
        "We don't have budget for this",
        "Your competitor is cheaper",
        "Can you do better on price?",
        "We need to wait until next quarter"
      ],
      timing: [
        "We're not ready yet",
        "This isn't a priority right now",
        "We're in the middle of another project",
        "Call me back in 6 months",
        "We just signed with someone else"
      ],
      authority: [
        "I need to check with my boss",
        "This decision is above my pay grade",
        "Let me discuss with the team",
        "I'm not the right person for this",
        "We have a committee that decides"
      ],
      trust: [
        "I've never heard of your company",
        "How do I know this will work?",
        "Do you have case studies?",
        "What if it doesn't work out?",
        "We had a bad experience with something similar"
      ],
      need: [
        "We're happy with our current solution",
        "We don't really need this",
        "We've been doing fine without it",
        "I don't see how this helps us",
        "Our process works fine"
      ]
    };

    // ============================================================
    //  RESPONSE TEMPLATES
    // ============================================================

    this.responseTemplates = {
      objectionHandlers: {
        price: [
          "I understand budget is a concern. Let me show you the ROI our customers typically see...",
          "What if I could show you how this pays for itself in the first month?",
          "Compared to hiring someone to do this manually, you're looking at 10x savings..."
        ],
        timing: [
          "I hear you. What would need to change for this to become a priority?",
          "Many of our best customers said the same thing, then realized waiting was costing them...",
          "What if we could start small and scale when you're ready?"
        ],
        trust: [
          "That's a fair concern. Here's a case study from a company just like yours...",
          "We offer a 30-day trial so you can see results before committing",
          "I can connect you with a customer in your industry who can share their experience"
        ]
      },

      supportResponses: {
        empathy: [
          "I completely understand how frustrating this must be.",
          "I'm sorry you're experiencing this issue.",
          "I can see why this would be concerning."
        ],
        solution: [
          "Here's what we can do to fix this...",
          "I have a solution that should resolve this immediately.",
          "Let me walk you through the steps to fix this."
        ],
        confirmation: [
          "Is there anything else I can help you with?",
          "Does this resolve your issue?",
          "Please let me know if you have any other questions."
        ]
      }
    };

    console.log(`[SyntheticDataForge] Initialized with ${Object.keys(this.industries).length} industries, ${Object.keys(this.personas.customers).length} customer personas`);
  }

  ensureDirectories() {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'sales'),
      path.join(this.dataDir, 'support'),
      path.join(this.dataDir, 'marketing'),
      path.join(this.dataDir, 'workflows'),
      path.join(this.dataDir, 'edge_cases')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // ============================================================
  //  MAIN GENERATION ENGINE
  // ============================================================

  async generate(type, count = 100, options = {}) {
    console.log(`[SyntheticDataForge] Generating ${count} ${type} samples...`);

    const generated = [];

    for (let i = 0; i < count; i++) {
      let sample;

      switch (type) {
        case 'sales_conversation':
          sample = await this.generateSalesConversation(options);
          break;
        case 'support_ticket':
          sample = await this.generateSupportTicket(options);
          break;
        case 'marketing_content':
          sample = await this.generateMarketingContent(options);
          break;
        case 'workflow':
          sample = await this.generateWorkflow(options);
          break;
        case 'edge_case':
          sample = await this.generateEdgeCase(options);
          break;
        case 'qa_pair':
          sample = await this.generateQAPair(options);
          break;
        default:
          sample = await this.generateGeneric(type, options);
      }

      // Quality check
      const quality = this.assessQuality(sample);
      sample.quality = quality;

      if (quality !== 'rejected') {
        generated.push(sample);
        this.state.quality[quality]++;
        this.state.totalGenerated++;
        this.state.byType[type] = (this.state.byType[type] || 0) + 1;

        // Save sample
        this.saveSample(type, sample);
      }

      // Progress update
      if ((i + 1) % 100 === 0) {
        console.log(`[SyntheticDataForge] Generated ${i + 1}/${count}...`);
      }
    }

    console.log(`[SyntheticDataForge] Completed: ${generated.length} samples (${count - generated.length} rejected)`);

    return generated;
  }

  // ============================================================
  //  SALES CONVERSATION GENERATOR
  // ============================================================

  async generateSalesConversation(options = {}) {
    const industry = options.industry || this.randomChoice(Object.keys(this.industries));
    const industryData = this.industries[industry];
    const scenario = options.scenario || this.randomChoice(Object.keys(this.scenarios.sales));
    const scenarioData = this.scenarios.sales[scenario];
    const customerPersona = this.randomChoice(Object.values(this.personas.customers));
    const repPersona = this.randomChoice(Object.values(this.personas.salesReps));

    const conversation = {
      id: `sales_${Date.now()}_${this.randomId()}`,
      type: 'sales_conversation',
      metadata: {
        industry,
        scenario,
        customer_persona: customerPersona.name,
        rep_style: repPersona.style,
        outcome: this.randomChoice(scenarioData.outcomes)
      },
      messages: []
    };

    // Generate conversation flow
    for (const stage of scenarioData.stages) {
      // Customer message
      const customerMsg = this.generateSalesCustomerMessage(stage, customerPersona, industryData);
      conversation.messages.push({
        role: 'customer',
        stage,
        content: customerMsg
      });

      // Rep response
      const repMsg = this.generateSalesRepMessage(stage, repPersona, customerMsg, industryData);
      conversation.messages.push({
        role: 'sales_rep',
        stage,
        content: repMsg
      });

      // Maybe add objection
      if (Math.random() > 0.6 && stage !== 'intro') {
        const objectionType = this.randomChoice(Object.keys(this.objections));
        const objection = this.randomChoice(this.objections[objectionType]);
        conversation.messages.push({
          role: 'customer',
          stage: 'objection',
          objection_type: objectionType,
          content: objection
        });

        // Handle objection
        const handler = this.randomChoice(this.responseTemplates.objectionHandlers[objectionType] ||
          ["I understand. Let me address that concern..."]);
        conversation.messages.push({
          role: 'sales_rep',
          stage: 'objection_handling',
          content: handler
        });
      }
    }

    conversation.message_count = conversation.messages.length;
    conversation.generated_at = Date.now();

    return conversation;
  }

  generateSalesCustomerMessage(stage, persona, industry) {
    const templates = {
      intro: [
        `Hi, I saw your ${this.randomChoice(industry.products)} and had some questions.`,
        `Someone referred me to you for ${this.randomChoice(industry.products)}.`,
        `I'm looking for a solution to ${this.randomChoice(industry.pain_points)}.`
      ],
      value_prop: [
        `What makes you different from other ${industry.name} solutions?`,
        `How does this help with ${this.randomChoice(industry.pain_points)}?`,
        `What results have other companies seen?`
      ],
      discovery: [
        `We currently use ${this.randomChoice(['spreadsheets', 'manual processes', 'a competitor', 'nothing'])}.`,
        `Our biggest challenge is ${this.randomChoice(industry.pain_points)}.`,
        `We have about ${Math.floor(Math.random() * 50) + 5} people who would use this.`
      ],
      objection_handling: persona.language,
      close_attempt: [
        `What would the next steps look like?`,
        `I need to think about it.`,
        `Can you send me more information?`,
        `Let me discuss with my team.`
      ]
    };

    return this.randomChoice(templates[stage] || templates.intro);
  }

  generateSalesRepMessage(stage, persona, customerMsg, industry) {
    const templates = {
      intro: [
        `Thanks for reaching out! I'd love to learn more about what you're looking for. What's prompting your search for ${this.randomChoice(industry.products)}?`,
        `Great to connect! Tell me a bit about your current situation with ${this.randomChoice(industry.pain_points)}.`
      ],
      value_prop: [
        `Great question. What sets us apart is our focus on ${this.randomChoice(['automation', 'ease of use', 'results', 'support'])}. Our customers typically see ${Math.floor(Math.random() * 50) + 20}% improvement in their ${this.randomChoice(industry.terminology)}.`,
        `We've helped over ${Math.floor(Math.random() * 500) + 100} companies solve exactly that problem. The key difference is...`
      ],
      discovery: [
        `That's helpful context. So if I understand correctly, your main goal is to improve ${this.randomChoice(industry.pain_points)}? What would success look like for you?`,
        `Got it. And what's driving the urgency to solve this now?`
      ],
      close_attempt: [
        `Based on what you've shared, I think we'd be a great fit. Would you be open to a quick trial to see it in action?`,
        `I can have a proposal over to you by end of day. What's the best email?`,
        `Let's schedule a follow-up with your team. What day works best?`
      ]
    };

    return this.randomChoice(templates[stage] || [`I appreciate you sharing that. Let me address that...`]);
  }

  // ============================================================
  //  SUPPORT TICKET GENERATOR
  // ============================================================

  async generateSupportTicket(options = {}) {
    const industry = options.industry || this.randomChoice(Object.keys(this.industries));
    const industryData = this.industries[industry];
    const scenario = options.scenario || this.randomChoice(Object.keys(this.scenarios.support));
    const scenarioData = this.scenarios.support[scenario];
    const customerPersona = this.randomChoice(Object.values(this.personas.customers));
    const agentPersona = this.randomChoice(Object.values(this.personas.supportAgents));

    const ticket = {
      id: `support_${Date.now()}_${this.randomId()}`,
      type: 'support_ticket',
      metadata: {
        industry,
        scenario,
        customer_persona: customerPersona.name,
        agent_style: agentPersona.style,
        outcome: this.randomChoice(scenarioData.outcomes),
        priority: this.randomChoice(['low', 'medium', 'high', 'urgent']),
        channel: this.randomChoice(['chat', 'email', 'phone', 'ticket'])
      },
      messages: []
    };

    // Initial customer message
    const initialIssue = this.generateSupportIssue(scenario, industryData, customerPersona);
    ticket.messages.push({
      role: 'customer',
      stage: 'initial',
      content: initialIssue
    });

    // Conversation flow
    for (const stage of scenarioData.stages.slice(1)) {
      // Agent response
      const agentMsg = this.generateAgentMessage(stage, agentPersona, industryData);
      ticket.messages.push({
        role: 'agent',
        stage,
        content: agentMsg
      });

      // Customer follow-up (except for last stage)
      if (stage !== scenarioData.stages[scenarioData.stages.length - 1]) {
        const customerFollowUp = this.generateCustomerFollowUp(stage, customerPersona);
        ticket.messages.push({
          role: 'customer',
          stage,
          content: customerFollowUp
        });
      }
    }

    // Resolution
    ticket.messages.push({
      role: 'agent',
      stage: 'resolution',
      content: this.randomChoice(this.responseTemplates.supportResponses.confirmation)
    });

    ticket.message_count = ticket.messages.length;
    ticket.resolution_time_minutes = Math.floor(Math.random() * 60) + 5;
    ticket.csat_score = ticket.metadata.outcome === 'resolved' ?
      Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 1;
    ticket.generated_at = Date.now();

    return ticket;
  }

  generateSupportIssue(scenario, industry, persona) {
    const issues = {
      technical_issue: [
        `I'm getting an error when I try to ${this.randomChoice(['log in', 'save', 'export', 'connect'])}. It says "${this.randomChoice(['Something went wrong', 'Error 500', 'Connection failed', 'Invalid request'])}".`,
        `The ${this.randomChoice(industry.terminology)} isn't working. I've tried ${this.randomChoice(['refreshing', 'clearing cache', 'restarting', 'reinstalling'])} but nothing helps.`,
        `Ever since the last update, I can't ${this.randomChoice(['access my data', 'use the main feature', 'see my dashboard', 'connect my integrations'])}.`
      ],
      billing_inquiry: [
        `I was charged $${Math.floor(Math.random() * 200) + 50} but I thought my plan was $${Math.floor(Math.random() * 100) + 20}. Can you explain?`,
        `I need to update my payment method but can't find where to do it.`,
        `I want to cancel my subscription. How do I do that?`,
        `Can I get a refund for ${this.randomChoice(['last month', 'the overcharge', 'the unused portion'])}?`
      ],
      feature_request: [
        `It would be really helpful if you could add ${this.randomChoice(['bulk export', 'API access', 'custom fields', 'automation rules'])}.`,
        `Is there a way to ${this.randomChoice(['integrate with Slack', 'set up alerts', 'customize the dashboard', 'add team members'])}?`,
        `I need to ${this.randomChoice(['do X', 'connect Y', 'automate Z'])} but I can't figure out how.`
      ],
      complaint: [
        `${this.randomChoice(persona.language)} Your ${this.randomChoice(industry.products)} has been ${this.randomChoice(['down', 'slow', 'buggy', 'unreliable'])} for ${this.randomChoice(['hours', 'days', 'weeks'])}.`,
        `I've been waiting ${Math.floor(Math.random() * 48) + 1} hours for a response. This is unacceptable.`,
        `I'm extremely frustrated. This is the ${this.randomChoice(['third', 'fourth', 'fifth'])} time I've had this issue.`
      ],
      onboarding: [
        `I just signed up and I'm not sure where to start. Can you help?`,
        `How do I set up my first ${this.randomChoice(industry.terminology)}?`,
        `I'm trying to ${this.randomChoice(['import my data', 'invite my team', 'connect my accounts'])} but I'm stuck.`
      ]
    };

    return this.randomChoice(issues[scenario] || issues.technical_issue);
  }

  generateAgentMessage(stage, persona, industry) {
    const templates = {
      clarification: [
        `Thank you for reaching out. I'm sorry you're experiencing this issue. To help you better, could you tell me ${this.randomChoice(['when this started', 'what you were doing', 'which browser you use', 'if you see any error messages'])}?`,
        `I want to make sure I understand correctly. You're trying to ${this.randomChoice(['access', 'export', 'configure', 'connect'])} your ${this.randomChoice(industry.terminology)}, correct?`
      ],
      troubleshooting: [
        `Let's try a few things. First, can you ${this.randomChoice(['clear your browser cache', 'try a different browser', 'check your internet connection', 'log out and back in'])}?`,
        `I'm looking at your account now. I can see ${this.randomChoice(['the issue', 'what might be causing this', 'some unusual activity'])}. Let me ${this.randomChoice(['fix that for you', 'make an adjustment', 'reset that setting'])}.`
      ],
      resolution: [
        `I've ${this.randomChoice(['resolved the issue', 'updated your account', 'applied the fix', 'made the adjustment'])}. You should be all set now. Can you try again and confirm it's working?`,
        `This should be fixed now. I've also ${this.randomChoice(['added a credit to your account', 'extended your trial', 'upgraded your plan temporarily'])} for the inconvenience.`
      ],
      verification: this.responseTemplates.supportResponses.confirmation
    };

    // Add empathy for complaints
    if (Math.random() > 0.5) {
      return this.randomChoice(this.responseTemplates.supportResponses.empathy) + ' ' +
        this.randomChoice(templates[stage] || templates.clarification);
    }

    return this.randomChoice(templates[stage] || templates.clarification);
  }

  generateCustomerFollowUp(stage, persona) {
    const followUps = [
      `Okay, I did that. Now what?`,
      `It's still not working.`,
      `That helped a bit, but I'm still seeing the issue.`,
      `Yes, that makes sense. What's next?`,
      `I tried that but got the same error.`
    ];

    if (persona.traits.includes('impatient')) {
      followUps.push(`Can we speed this up? I have a meeting in 10 minutes.`);
    }

    return this.randomChoice(followUps);
  }

  // ============================================================
  //  MARKETING CONTENT GENERATOR
  // ============================================================

  async generateMarketingContent(options = {}) {
    const contentType = options.type || this.randomChoice(this.scenarios.marketing.content_creation.types);
    const tone = options.tone || this.randomChoice(this.scenarios.marketing.content_creation.tones);
    const industry = options.industry || this.randomChoice(Object.keys(this.industries));
    const industryData = this.industries[industry];

    const content = {
      id: `marketing_${Date.now()}_${this.randomId()}`,
      type: 'marketing_content',
      metadata: {
        content_type: contentType,
        tone,
        industry,
        target_audience: this.randomChoice(['decision_makers', 'end_users', 'technical', 'general'])
      },
      content: null,
      generated_at: Date.now()
    };

    switch (contentType) {
      case 'blog_post':
        content.content = this.generateBlogPost(industryData, tone);
        break;
      case 'social_post':
        content.content = this.generateSocialPost(industryData, tone);
        break;
      case 'email':
        content.content = this.generateMarketingEmail(industryData, tone);
        break;
      case 'ad_copy':
        content.content = this.generateAdCopy(industryData, tone);
        break;
      case 'landing_page':
        content.content = this.generateLandingPage(industryData, tone);
        break;
    }

    return content;
  }

  generateBlogPost(industry, tone) {
    const topics = [
      `${Math.floor(Math.random() * 10) + 5} Ways to Improve Your ${this.randomChoice(industry.pain_points)}`,
      `The Complete Guide to ${this.randomChoice(industry.products)} in ${new Date().getFullYear()}`,
      `Why ${this.randomChoice(industry.pain_points)} Is Costing You More Than You Think`,
      `How Top ${industry.name} Companies Are Using AI to ${this.randomChoice(['Save Time', 'Cut Costs', 'Grow Faster'])}`
    ];

    return {
      title: this.randomChoice(topics),
      outline: [
        'Introduction - Hook the reader',
        'The Problem - Why this matters',
        'The Solution - How to fix it',
        'Case Study - Real results',
        'Action Steps - What to do next',
        'Conclusion - Call to action'
      ],
      word_count: Math.floor(Math.random() * 1000) + 1500,
      seo_keywords: industry.terminology.slice(0, 5)
    };
  }

  generateSocialPost(industry, tone) {
    const templates = {
      professional: [
        `${Math.floor(Math.random() * 80) + 20}% of ${industry.name} leaders say ${this.randomChoice(industry.pain_points)} is their biggest challenge.\n\nHere's how the top performers are solving it:\n\n🎯 Strategy 1\n🎯 Strategy 2\n🎯 Strategy 3\n\nWhich one resonates with you?`,
        `Just helped a client reduce their ${this.randomChoice(industry.pain_points)} by ${Math.floor(Math.random() * 50) + 30}%.\n\nThe secret? ${this.randomChoice(['Automation', 'Better processes', 'The right tools', 'AI'])}.\n\nDM me if you want to know how.`
      ],
      casual: [
        `POV: You finally fixed your ${this.randomChoice(industry.pain_points)} problem 🙌\n\nStop wasting time on ${this.randomChoice(industry.products)} that doesn't work.\n\nThere's a better way. Link in bio.`,
        `Hot take: Most ${industry.name} companies are doing ${this.randomChoice(industry.terminology)} wrong.\n\nHere's what actually works 👇`
      ]
    };

    return {
      text: this.randomChoice(templates[tone] || templates.professional),
      platform: this.randomChoice(['linkedin', 'twitter', 'instagram', 'facebook']),
      hashtags: industry.terminology.slice(0, 3).map(t => `#${t.replace(/\s/g, '')}`)
    };
  }

  generateMarketingEmail(industry, tone) {
    return {
      subject: this.randomChoice([
        `Quick question about your ${this.randomChoice(industry.products)}`,
        `${Math.floor(Math.random() * 50) + 20}% off - this week only`,
        `You're missing out on ${this.randomChoice(['efficiency', 'revenue', 'time savings'])}`,
        `[Case Study] How ${this.randomChoice(['Company X', 'a competitor', 'industry leaders'])} solved ${this.randomChoice(industry.pain_points)}`
      ]),
      preview_text: `See how you can improve your ${this.randomChoice(industry.terminology)}...`,
      body_sections: ['hook', 'problem', 'solution', 'proof', 'cta'],
      cta: this.randomChoice(['Start Free Trial', 'Book a Demo', 'Learn More', 'Get Started'])
    };
  }

  generateAdCopy(industry, tone) {
    return {
      headline: this.randomChoice([
        `Stop ${this.randomChoice(industry.pain_points)}`,
        `${this.randomChoice(industry.products)} That Actually Works`,
        `Save ${Math.floor(Math.random() * 20) + 5} Hours/Week on ${this.randomChoice(industry.terminology)}`
      ]),
      description: `The #1 ${industry.name} solution. Trusted by ${Math.floor(Math.random() * 10000) + 1000}+ companies.`,
      cta: this.randomChoice(['Try Free', 'Get Demo', 'Start Now', 'Learn More']),
      platform: this.randomChoice(['google', 'facebook', 'linkedin', 'instagram'])
    };
  }

  generateLandingPage(industry, tone) {
    return {
      headline: `The ${industry.name} Solution That ${this.randomChoice(['Saves Time', 'Cuts Costs', 'Drives Results'])}`,
      subheadline: `Join ${Math.floor(Math.random() * 5000) + 500}+ companies using ORBOS to ${this.randomChoice(['automate', 'streamline', 'optimize'])} their ${this.randomChoice(industry.products)}.`,
      hero_cta: 'Start Free Trial',
      sections: [
        { type: 'problem', title: `Tired of ${this.randomChoice(industry.pain_points)}?` },
        { type: 'solution', title: 'There\'s a better way' },
        { type: 'features', count: 3 },
        { type: 'social_proof', testimonials: 3 },
        { type: 'pricing', tiers: 3 },
        { type: 'faq', questions: 5 },
        { type: 'final_cta' }
      ]
    };
  }

  // ============================================================
  //  WORKFLOW & EDGE CASE GENERATORS
  // ============================================================

  async generateWorkflow(options = {}) {
    const workflowTypes = [
      'lead_qualification', 'customer_onboarding', 'support_escalation',
      'content_approval', 'deal_closing', 'renewal_process'
    ];

    const type = options.type || this.randomChoice(workflowTypes);

    return {
      id: `workflow_${Date.now()}_${this.randomId()}`,
      type: 'workflow',
      workflow_type: type,
      steps: this.generateWorkflowSteps(type),
      triggers: ['manual', 'scheduled', 'event-based'],
      conditions: ['if-then', 'branching', 'loops'],
      generated_at: Date.now()
    };
  }

  generateWorkflowSteps(type) {
    const steps = [];
    const stepCount = Math.floor(Math.random() * 5) + 3;

    for (let i = 0; i < stepCount; i++) {
      steps.push({
        order: i + 1,
        action: this.randomChoice(['send_email', 'update_record', 'notify_team', 'wait', 'check_condition', 'assign_task']),
        config: {}
      });
    }

    return steps;
  }

  async generateEdgeCase(options = {}) {
    const edgeCases = [
      { type: 'empty_input', input: '', expected: 'handle_gracefully' },
      { type: 'very_long_input', input: 'x'.repeat(10000), expected: 'truncate_or_reject' },
      { type: 'special_characters', input: '<script>alert("xss")</script>', expected: 'sanitize' },
      { type: 'unicode', input: '你好世界 🌍 مرحبا', expected: 'handle_properly' },
      { type: 'concurrent_requests', scenario: '100 requests in 1 second', expected: 'rate_limit' },
      { type: 'invalid_format', input: { wrong: 'structure' }, expected: 'validation_error' },
      { type: 'timeout', scenario: 'API takes 60 seconds', expected: 'timeout_gracefully' },
      { type: 'null_values', input: null, expected: 'handle_null' },
      { type: 'negative_numbers', input: -999, expected: 'validate_range' },
      { type: 'duplicate_submission', scenario: 'same request twice', expected: 'idempotent' }
    ];

    const edgeCase = options.type ?
      edgeCases.find(e => e.type === options.type) :
      this.randomChoice(edgeCases);

    return {
      id: `edge_${Date.now()}_${this.randomId()}`,
      type: 'edge_case',
      ...edgeCase,
      generated_at: Date.now()
    };
  }

  async generateQAPair(options = {}) {
    const industry = options.industry || this.randomChoice(Object.keys(this.industries));
    const industryData = this.industries[industry];

    const qaPairs = [
      {
        question: `How do I ${this.randomChoice(['set up', 'configure', 'use', 'integrate'])} ${this.randomChoice(industryData.products)}?`,
        answer: `To ${this.randomChoice(['set up', 'configure', 'use', 'integrate'])} ${this.randomChoice(industryData.products)}, follow these steps: 1) First... 2) Then... 3) Finally...`,
        category: 'how-to'
      },
      {
        question: `What's the difference between ${this.randomChoice(industryData.terminology)} and ${this.randomChoice(industryData.terminology)}?`,
        answer: `The main difference is that ${this.randomChoice(industryData.terminology)} is used for X, while ${this.randomChoice(industryData.terminology)} is designed for Y.`,
        category: 'comparison'
      },
      {
        question: `Why am I seeing ${this.randomChoice(industryData.pain_points)}?`,
        answer: `This typically happens when... The solution is to...`,
        category: 'troubleshooting'
      }
    ];

    const pair = this.randomChoice(qaPairs);

    return {
      id: `qa_${Date.now()}_${this.randomId()}`,
      type: 'qa_pair',
      industry,
      ...pair,
      generated_at: Date.now()
    };
  }

  // ============================================================
  //  BULK GENERATION
  // ============================================================

  async generateDataset(config) {
    const {
      sales_conversations = 1000,
      support_tickets = 1000,
      marketing_content = 500,
      workflows = 200,
      edge_cases = 100,
      qa_pairs = 500
    } = config;

    console.log(`[SyntheticDataForge] Starting bulk generation...`);
    console.log(`  Sales conversations: ${sales_conversations}`);
    console.log(`  Support tickets: ${support_tickets}`);
    console.log(`  Marketing content: ${marketing_content}`);
    console.log(`  Workflows: ${workflows}`);
    console.log(`  Edge cases: ${edge_cases}`);
    console.log(`  QA pairs: ${qa_pairs}`);

    const results = {
      sales: await this.generate('sales_conversation', sales_conversations),
      support: await this.generate('support_ticket', support_tickets),
      marketing: await this.generate('marketing_content', marketing_content),
      workflows: await this.generate('workflow', workflows),
      edge_cases: await this.generate('edge_case', edge_cases),
      qa_pairs: await this.generate('qa_pair', qa_pairs)
    };

    const totalGenerated = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    console.log(`[SyntheticDataForge] Bulk generation complete: ${totalGenerated} total samples`);

    return results;
  }

  // ============================================================
  //  QUALITY ASSESSMENT
  // ============================================================

  assessQuality(sample) {
    let score = 0;
    const checks = [];

    // Check completeness
    if (sample.messages?.length >= 4 || sample.content) {
      score += 25;
      checks.push('complete');
    }

    // Check diversity (not too repetitive)
    const content = JSON.stringify(sample);
    const uniqueWords = new Set(content.toLowerCase().match(/\b\w+\b/g) || []);
    if (uniqueWords.size > 50) {
      score += 25;
      checks.push('diverse');
    }

    // Check realism
    if (sample.metadata?.industry && sample.metadata?.scenario) {
      score += 25;
      checks.push('realistic');
    }

    // Check structure
    if (sample.id && sample.type && sample.generated_at) {
      score += 25;
      checks.push('structured');
    }

    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'acceptable';
    return 'rejected';
  }

  // ============================================================
  //  STORAGE
  // ============================================================

  saveSample(type, sample) {
    const typeDir = path.join(this.dataDir, type.replace('_', '/').split('/')[0]);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }

    const filepath = path.join(typeDir, `${sample.id}.json`);
    fs.writeFileSync(filepath, JSON.stringify(sample, null, 2));
  }

  // ============================================================
  //  UTILITIES
  // ============================================================

  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  randomId() {
    return crypto.randomBytes(4).toString('hex');
  }

  getStats() {
    return {
      totalGenerated: this.state.totalGenerated,
      byType: this.state.byType,
      quality: this.state.quality,
      industries: Object.keys(this.industries),
      personas: Object.keys(this.personas.customers).length
    };
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { SyntheticDataForge };
