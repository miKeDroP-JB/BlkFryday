// ============================================================
//  ORBOS V11.5 - BRAND IDENTITY SYSTEM
//  "The Future of Business Intelligence"
// ============================================================

const BRAND = {
  // ============================================================
  //  CORE IDENTITY
  // ============================================================

  name: 'ORBOS',
  tagline: 'The Future of Business Intelligence',
  alternateTaglines: [
    'Your Business, Automated',
    '1007 Agents. One Mission.',
    'Intelligence That Works',
    'The Brain Behind Your Business'
  ],

  // The Story
  narrative: {
    origin: 'Born from the convergence of AI, automation, and human ambition',
    mission: 'Democratize enterprise-grade AI for every business',
    vision: 'A world where businesses run themselves, humans focus on what matters',
    promise: 'Deploy in minutes. Results in hours. ROI in days.'
  },

  // ============================================================
  //  VISUAL IDENTITY
  // ============================================================

  colors: {
    primary: {
      orbBlack: '#0A0A0F',      // Deep space black
      orbPurple: '#7C3AED',     // Electric purple (main brand)
      orbCyan: '#06B6D4',       // Neon cyan (accent)
    },
    secondary: {
      orbGold: '#F59E0B',       // Premium gold
      orbGreen: '#10B981',      // Success green
      orbRed: '#EF4444',        // Alert red
      orbBlue: '#3B82F6',       // Trust blue
    },
    gradients: {
      main: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
      premium: 'linear-gradient(135deg, #F59E0B 0%, #7C3AED 100%)',
      dark: 'linear-gradient(180deg, #0A0A0F 0%, #1F1F2E 100%)',
      glow: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)'
    },
    backgrounds: {
      dark: '#0A0A0F',
      card: '#1A1A2E',
      elevated: '#252540',
      glass: 'rgba(26, 26, 46, 0.8)'
    }
  },

  typography: {
    heading: {
      family: "'Space Grotesk', 'Inter', sans-serif",
      weights: [500, 700],
      style: 'Bold, geometric, futuristic'
    },
    body: {
      family: "'Inter', 'SF Pro', sans-serif",
      weights: [400, 500, 600],
      style: 'Clean, readable, professional'
    },
    mono: {
      family: "'JetBrains Mono', 'Fira Code', monospace",
      weights: [400, 500],
      style: 'Technical, code displays'
    }
  },

  logo: {
    primary: '◉ ORBOS',  // The orb symbol
    icon: '◉',
    wordmark: 'ORBOS',
    variations: {
      full: '◉ ORBOS',
      compact: '◉',
      stacked: '◉\nORBOS',
      withTagline: '◉ ORBOS\nThe Future of Business Intelligence'
    },
    clearSpace: '1x logo height on all sides',
    minSize: '24px icon, 80px full logo'
  },

  // ============================================================
  //  VOICE & TONE
  // ============================================================

  voice: {
    personality: ['Confident', 'Intelligent', 'Approachable', 'Visionary'],
    tone: {
      marketing: 'Bold and aspirational',
      product: 'Clear and helpful',
      support: 'Warm and solution-focused',
      technical: 'Precise and knowledgeable'
    },
    doSay: [
      'Your AI workforce, ready in minutes',
      'Results you can measure',
      'Built for businesses that move fast',
      'Enterprise power, startup speed'
    ],
    dontSay: [
      'Revolutionary', 'Disruptive', 'Best-in-class',  // Overused
      'AI-powered' (alone), 'Cutting-edge',            // Generic
      'Simple', 'Easy' (without proof)                 // Empty promises
    ]
  },

  // ============================================================
  //  AUDIO IDENTITY
  // ============================================================

  audio: {
    bootSound: 'Deep resonant pulse → ascending tones → arrival chime',
    notification: 'Soft orb pulse',
    success: 'Harmonious resolution chord',
    error: 'Gentle descending tone',
    voiceChallenge: 'To what do I owe the pleasure?',
    voiceResponse: 'The pleasure is all mine',
    musicStyle: 'Ambient electronic, cinematic, confident'
  }
};

// ============================================================
//  PRODUCT LINEUP - THE AGENT APPS
// ============================================================

const PRODUCTS = {
  // ============================================================
  //  TIER 1: FLAGSHIP PRODUCTS (Launch First)
  // ============================================================

  flagship: {
    orbosOne: {
      name: 'ORBOS One',
      tagline: 'Your Complete AI Business Brain',
      description: 'Full platform access - all 1007 agents, all capabilities',
      price: '$999/mo',
      icon: '◉',
      color: '#7C3AED',
      features: [
        'All agent swarms',
        'Unlimited automation',
        'Voice commands',
        'Priority support'
      ]
    }
  },

  // ============================================================
  //  TIER 2: VERTICAL AGENTS (Revenue Drivers)
  // ============================================================

  verticals: {
    orbosSales: {
      name: 'ORBOS Sales',
      tagline: 'Close More. Call Less.',
      description: 'AI-powered sales calls, follow-ups, and CRM automation',
      price: '$299/mo',
      icon: '📞',
      color: '#10B981',
      agents: ['CallAgent', 'FollowUpAgent', 'LeadScorer', 'CRMSync'],
      metrics: ['Calls made', 'Appointments set', 'Deals closed'],
      targetMarket: 'Sales teams, call centers, agencies'
    },

    orbosSupport: {
      name: 'ORBOS Support',
      tagline: '24/7 Support. Zero Burnout.',
      description: 'AI customer service across all channels',
      price: '$249/mo',
      icon: '💬',
      color: '#3B82F6',
      agents: ['ChatAgent', 'TicketResolver', 'EscalationManager', 'SentimentAnalyzer'],
      metrics: ['Tickets resolved', 'Response time', 'CSAT score'],
      targetMarket: 'E-commerce, SaaS, service businesses'
    },

    orbosMarketing: {
      name: 'ORBOS Marketing',
      tagline: 'Content That Converts.',
      description: 'AI content creation, social management, ad optimization',
      price: '$199/mo',
      icon: '📣',
      color: '#F59E0B',
      agents: ['ContentWriter', 'SocialManager', 'AdOptimizer', 'SEOAnalyzer'],
      metrics: ['Content pieces', 'Engagement rate', 'Lead generation'],
      targetMarket: 'Marketing teams, agencies, creators'
    },

    orbosOps: {
      name: 'ORBOS Ops',
      tagline: 'Operations on Autopilot.',
      description: 'Workflow automation, scheduling, resource management',
      price: '$199/mo',
      icon: '⚙️',
      color: '#06B6D4',
      agents: ['WorkflowEngine', 'Scheduler', 'ResourceAllocator', 'ProcessOptimizer'],
      metrics: ['Tasks automated', 'Time saved', 'Error reduction'],
      targetMarket: 'Operations teams, SMBs, enterprises'
    },

    orbosFinance: {
      name: 'ORBOS Finance',
      tagline: 'Numbers That Make Sense.',
      description: 'Bookkeeping, invoicing, financial analysis automation',
      price: '$249/mo',
      icon: '💰',
      color: '#8B5CF6',
      agents: ['BookkeeperAgent', 'InvoiceManager', 'ExpenseTracker', 'CashFlowAnalyzer'],
      metrics: ['Transactions processed', 'Invoice accuracy', 'Time to close'],
      targetMarket: 'Finance teams, accountants, SMBs'
    },

    orbosHR: {
      name: 'ORBOS HR',
      tagline: 'People Operations, Perfected.',
      description: 'Recruiting, onboarding, employee management automation',
      price: '$199/mo',
      icon: '👥',
      color: '#EC4899',
      agents: ['RecruiterAgent', 'OnboardingManager', 'PerformanceTracker', 'PolicyBot'],
      metrics: ['Candidates screened', 'Time to hire', 'Onboarding completion'],
      targetMarket: 'HR teams, recruiters, growing companies'
    }
  },

  // ============================================================
  //  TIER 3: SPECIALTY AGENTS (High-Value Niches)
  // ============================================================

  specialty: {
    orbosLegal: {
      name: 'ORBOS Legal',
      tagline: 'Contracts at Scale.',
      description: 'Contract review, compliance checking, legal research',
      price: '$399/mo',
      icon: '⚖️',
      color: '#64748B'
    },

    orbosReal: {
      name: 'ORBOS Real Estate',
      tagline: 'Listings That Sell.',
      description: 'Property descriptions, lead nurturing, market analysis',
      price: '$299/mo',
      icon: '🏠',
      color: '#22C55E'
    },

    orbosMedical: {
      name: 'ORBOS Medical',
      tagline: 'Patient Care, Amplified.',
      description: 'Scheduling, patient follow-ups, documentation',
      price: '$349/mo',
      icon: '🏥',
      color: '#EF4444'
    },

    orbosEcom: {
      name: 'ORBOS E-Commerce',
      tagline: 'Sell More. Do Less.',
      description: 'Product listings, customer service, inventory management',
      price: '$249/mo',
      icon: '🛒',
      color: '#F97316'
    }
  },

  // ============================================================
  //  TIER 4: DEVELOPER/ENTERPRISE
  // ============================================================

  enterprise: {
    orbosAPI: {
      name: 'ORBOS API',
      tagline: 'Build With Intelligence.',
      description: 'Full API access to all agent capabilities',
      price: 'Usage-based',
      icon: '🔌',
      color: '#6366F1'
    },

    orbosEnterprise: {
      name: 'ORBOS Enterprise',
      tagline: 'Your AI, Your Way.',
      description: 'Custom deployment, dedicated support, SLA guarantees',
      price: 'Custom',
      icon: '🏢',
      color: '#7C3AED'
    }
  }
};

// ============================================================
//  PRICING STRATEGY
// ============================================================

const PRICING = {
  philosophy: 'Value-based pricing with clear ROI',

  tiers: {
    starter: {
      name: 'Starter',
      price: '$49/mo',
      description: 'For individuals and small teams',
      includes: ['1 vertical agent', '1,000 tasks/mo', 'Email support']
    },
    professional: {
      name: 'Professional',
      price: '$199/mo',
      description: 'For growing businesses',
      includes: ['3 vertical agents', '10,000 tasks/mo', 'Priority support', 'API access']
    },
    business: {
      name: 'Business',
      price: '$499/mo',
      description: 'For teams that need more',
      includes: ['All vertical agents', '50,000 tasks/mo', 'Dedicated CSM', 'Custom integrations']
    },
    enterprise: {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations',
      includes: ['Everything', 'Unlimited tasks', 'On-premise option', 'SLA guarantees']
    }
  },

  addOns: {
    additionalTasks: '$0.01/task over limit',
    priorityProcessing: '$99/mo',
    whiteLabel: '$299/mo',
    dedicatedInfra: 'Custom pricing'
  }
};

// ============================================================
//  EXPORT
// ============================================================

module.exports = {
  BRAND,
  PRODUCTS,
  PRICING
};
