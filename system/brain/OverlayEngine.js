/**
 * ====================================================
 *  OVERLAY ENGINE - 3D ZERO UI/UX TEMPLATE SYSTEM
 * ====================================================
 *  "The interface disappears. Only the experience remains."
 *
 *  Zero UI/UX Philosophy:
 *  - No learning curve
 *  - Instant understanding
 *  - Magical interactions
 *  - Industry-specific presets
 *  - 3D depth and immersion
 *
 *  @created November 25, 2024
 *  @version 1.0.0 - THE OVERLAY AWAKENS
 * ====================================================
 */

const EventEmitter = require('events');

// ==========================================
//  OVERLAY LAYERS - 3D DEPTH SYSTEM
// ==========================================

const OVERLAY_LAYERS = {
  BACKGROUND: {
    id: 'BACKGROUND',
    zIndex: 0,
    depth: -100,
    blur: 10,
    opacity: 0.3,
    parallaxFactor: 0.1,
    purpose: 'Ambient atmosphere and context'
  },
  ENVIRONMENT: {
    id: 'ENVIRONMENT',
    zIndex: 1,
    depth: -50,
    blur: 5,
    opacity: 0.5,
    parallaxFactor: 0.3,
    purpose: 'Environmental elements and particles'
  },
  CONTENT: {
    id: 'CONTENT',
    zIndex: 2,
    depth: 0,
    blur: 0,
    opacity: 1,
    parallaxFactor: 0.5,
    purpose: 'Main content and interactions'
  },
  INTERFACE: {
    id: 'INTERFACE',
    zIndex: 3,
    depth: 25,
    blur: 0,
    opacity: 1,
    parallaxFactor: 0.7,
    purpose: 'UI controls and navigation'
  },
  HUD: {
    id: 'HUD',
    zIndex: 4,
    depth: 50,
    blur: 0,
    opacity: 0.9,
    parallaxFactor: 1.0,
    purpose: 'Heads-up display and status'
  },
  MODAL: {
    id: 'MODAL',
    zIndex: 5,
    depth: 100,
    blur: 0,
    opacity: 1,
    parallaxFactor: 1.2,
    purpose: 'Focused interactions and overlays'
  }
};

// ==========================================
//  INDUSTRY OVERLAY TEMPLATES
// ==========================================

const INDUSTRY_OVERLAYS = {
  // ==========================================
  //  SAAS / TECH OVERLAY
  // ==========================================
  SAAS_TECH: {
    id: 'SAAS_TECH',
    name: 'SaaS / Tech',
    icon: '💻',

    // Visual System
    colors: {
      primary: '#0066ff',
      secondary: '#00ccff',
      accent: '#7c3aed',
      background: '#0a0a12',
      surface: '#1a1a2e',
      text: '#ffffff',
      muted: '#6b7280'
    },

    // 3D Elements
    depth: {
      cardElevation: 20,
      buttonElevation: 10,
      shadowIntensity: 0.3,
      perspective: 1000
    },

    // Animation Presets
    animations: {
      pageTransition: 'slide-fade',
      cardHover: 'lift-glow',
      buttonClick: 'pulse-ripple',
      loadingState: 'skeleton-wave'
    },

    // Component Templates
    components: {
      hero: {
        layout: 'centered',
        hasGradient: true,
        hasParticles: true,
        hasFloatingElements: true
      },
      pricing: {
        layout: 'three-column',
        hasToggle: true,
        hasPopular: true,
        hasFeatureComparison: true
      },
      features: {
        layout: 'bento-grid',
        hasIcons: true,
        hasAnimations: true
      },
      testimonials: {
        layout: 'carousel',
        hasAvatars: true,
        hasCompanyLogos: true
      },
      cta: {
        layout: 'full-width',
        hasGradient: true,
        hasCountdown: false
      }
    },

    // Landing Page Sections
    sections: [
      'HERO_GRADIENT',
      'LOGO_CLOUD',
      'FEATURE_BENTO',
      'HOW_IT_WORKS',
      'PRICING_CARDS',
      'TESTIMONIALS',
      'FAQ_ACCORDION',
      'CTA_BANNER',
      'FOOTER_LINKS'
    ],

    // Copy Templates
    copy: {
      headlines: [
        'The Future of {Industry} is Here',
        '{Product} for Teams That Ship Fast',
        'Build Faster. Scale Smarter.',
        'Where {Action} Meets Intelligence'
      ],
      subheadlines: [
        'AI-powered {feature} that transforms how you {action}',
        'Join {number}+ teams already using {product}',
        'From idea to production in minutes, not months'
      ],
      ctas: [
        'Start Free Trial',
        'Get Started',
        'Try for Free',
        'Book a Demo',
        'Start Building'
      ]
    }
  },

  // ==========================================
  //  AGENCY / CREATIVE OVERLAY
  // ==========================================
  AGENCY: {
    id: 'AGENCY',
    name: 'Agency / Creative',
    icon: '🎨',

    colors: {
      primary: '#ff0066',
      secondary: '#ffcc00',
      accent: '#00ff88',
      background: '#000000',
      surface: '#111111',
      text: '#ffffff',
      muted: '#888888'
    },

    depth: {
      cardElevation: 0,
      buttonElevation: 0,
      shadowIntensity: 0,
      perspective: 800
    },

    animations: {
      pageTransition: 'clip-reveal',
      cardHover: 'scale-rotate',
      buttonClick: 'invert-flash',
      loadingState: 'marquee-slide'
    },

    components: {
      hero: {
        layout: 'split-asymmetric',
        hasVideo: true,
        hasMarquee: true,
        hasCustomCursor: true
      },
      work: {
        layout: 'masonry',
        hasFilters: true,
        hasLightbox: true
      },
      about: {
        layout: 'editorial',
        hasTeamGrid: true,
        hasTimeline: true
      },
      contact: {
        layout: 'full-bleed',
        hasMap: false,
        hasForm: true
      }
    },

    sections: [
      'HERO_SPLIT',
      'WORK_MASONRY',
      'SERVICES_LIST',
      'ABOUT_EDITORIAL',
      'TEAM_GRID',
      'CLIENTS_MARQUEE',
      'CONTACT_FORM',
      'FOOTER_MINIMAL'
    ],

    copy: {
      headlines: [
        'We Create Brands That Matter',
        'Design That Demands Attention',
        'Where Strategy Meets Creativity',
        'Unforgettable Digital Experiences'
      ],
      subheadlines: [
        'Award-winning design studio',
        'Transforming visions into reality since {year}',
        'Strategy. Design. Development.'
      ],
      ctas: [
        'View Our Work',
        'Start a Project',
        'Get in Touch',
        'Let\'s Talk'
      ]
    }
  },

  // ==========================================
  //  E-COMMERCE / RETAIL OVERLAY
  // ==========================================
  ECOMMERCE: {
    id: 'ECOMMERCE',
    name: 'E-Commerce / Retail',
    icon: '🛍️',

    colors: {
      primary: '#ff6b35',
      secondary: '#004e89',
      accent: '#00c49a',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#1a1a1a',
      muted: '#6b7280'
    },

    depth: {
      cardElevation: 8,
      buttonElevation: 4,
      shadowIntensity: 0.15,
      perspective: 1200
    },

    animations: {
      pageTransition: 'fade-scale',
      cardHover: 'lift-shadow',
      buttonClick: 'bounce-confirm',
      loadingState: 'shimmer'
    },

    components: {
      hero: {
        layout: 'split-product',
        hasSlider: true,
        hasBadges: true,
        hasQuickShop: true
      },
      products: {
        layout: 'grid-4',
        hasQuickView: true,
        hasWishlist: true,
        hasFilters: true
      },
      cart: {
        layout: 'drawer',
        hasUpsells: true,
        hasPromo: true
      },
      checkout: {
        layout: 'two-column',
        hasExpress: true,
        hasProgress: true
      }
    },

    sections: [
      'HERO_PRODUCT',
      'COLLECTION_GRID',
      'FEATURED_PRODUCTS',
      'BENEFITS_ICONS',
      'REVIEWS_CAROUSEL',
      'INSTAGRAM_FEED',
      'NEWSLETTER_POPUP',
      'FOOTER_LINKS'
    ],

    copy: {
      headlines: [
        'New Arrivals Just Dropped',
        'Shop the Collection',
        'Designed for {lifestyle}',
        'Quality That Speaks for Itself'
      ],
      subheadlines: [
        'Free shipping on orders over $50',
        'Join {number}+ happy customers',
        'Sustainably made. Ethically sourced.'
      ],
      ctas: [
        'Shop Now',
        'Add to Cart',
        'Buy Now',
        'Explore Collection',
        'Get {percent}% Off'
      ]
    }
  },

  // ==========================================
  //  FINTECH / BANKING OVERLAY
  // ==========================================
  FINTECH: {
    id: 'FINTECH',
    name: 'Fintech / Banking',
    icon: '💰',

    colors: {
      primary: '#00d4aa',
      secondary: '#7c3aed',
      accent: '#fbbf24',
      background: '#0f0f1a',
      surface: '#1a1a2e',
      text: '#ffffff',
      muted: '#9ca3af'
    },

    depth: {
      cardElevation: 16,
      buttonElevation: 8,
      shadowIntensity: 0.25,
      perspective: 1000
    },

    animations: {
      pageTransition: 'morph-fade',
      cardHover: 'glow-lift',
      buttonClick: 'ripple-success',
      loadingState: 'pulse-gradient'
    },

    components: {
      hero: {
        layout: 'app-showcase',
        hasPhoneMockup: true,
        hasStats: true,
        hasAppLinks: true
      },
      features: {
        layout: 'alternating',
        hasScreenshots: true,
        hasAnimatedIcons: true
      },
      security: {
        layout: 'centered',
        hasBadges: true,
        hasEncryption: true
      },
      pricing: {
        layout: 'comparison',
        hasTiers: true,
        hasCalculator: true
      }
    },

    sections: [
      'HERO_APP',
      'TRUST_BADGES',
      'FEATURES_ALTERNATING',
      'SECURITY_SECTION',
      'PRICING_TIERS',
      'TESTIMONIALS_CARDS',
      'APP_DOWNLOAD',
      'FOOTER_LEGAL'
    ],

    copy: {
      headlines: [
        'Banking That Works for You',
        'Your Money. Your Control.',
        'Finance at the Speed of Life',
        'The Smarter Way to {action}'
      ],
      subheadlines: [
        'FDIC insured up to $250,000',
        'No hidden fees. No surprises.',
        'Trusted by {number}+ customers worldwide'
      ],
      ctas: [
        'Open Account',
        'Get the App',
        'Start Investing',
        'Apply Now',
        'See Plans'
      ]
    }
  },

  // ==========================================
  //  CRYPTO / WEB3 OVERLAY
  // ==========================================
  CRYPTO_WEB3: {
    id: 'CRYPTO_WEB3',
    name: 'Crypto / Web3',
    icon: '🔗',

    colors: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      background: '#0a0a0f',
      surface: '#141420',
      text: '#ffffff',
      muted: '#6b7280'
    },

    depth: {
      cardElevation: 24,
      buttonElevation: 12,
      shadowIntensity: 0.4,
      perspective: 800
    },

    animations: {
      pageTransition: 'glitch-reveal',
      cardHover: 'holographic',
      buttonClick: 'neon-pulse',
      loadingState: 'matrix-rain'
    },

    components: {
      hero: {
        layout: '3d-scene',
        hasOrb: true,
        hasParticles: true,
        hasWalletConnect: true
      },
      tokenomics: {
        layout: 'pie-chart',
        hasAnimatedChart: true,
        hasBreakdown: true
      },
      roadmap: {
        layout: 'timeline-vertical',
        hasPhases: true,
        hasProgress: true
      },
      team: {
        layout: 'card-flip',
        hasSocials: true,
        hasNFTAvatars: true
      }
    },

    sections: [
      'HERO_3D',
      'STATS_LIVE',
      'FEATURES_CARDS',
      'TOKENOMICS',
      'ROADMAP',
      'TEAM_NFT',
      'PARTNERS',
      'FAQ',
      'FOOTER_SOCIALS'
    ],

    copy: {
      headlines: [
        'The Future is Decentralized',
        'Enter the {Protocol} Ecosystem',
        'Where Innovation Meets Ownership',
        'Build. Own. Earn.'
      ],
      subheadlines: [
        'Join {number}+ holders worldwide',
        'Secured by {blockchain} blockchain',
        'Community-governed. Future-proof.'
      ],
      ctas: [
        'Connect Wallet',
        'Buy $TOKEN',
        'Join Community',
        'Mint Now',
        'Stake & Earn'
      ]
    }
  },

  // ==========================================
  //  HEALTHCARE / WELLNESS OVERLAY
  // ==========================================
  HEALTHCARE: {
    id: 'HEALTHCARE',
    name: 'Healthcare / Wellness',
    icon: '🏥',

    colors: {
      primary: '#4ecdc4',
      secondary: '#1a535c',
      accent: '#ff6b6b',
      background: '#ffffff',
      surface: '#f7fff7',
      text: '#1a1a1a',
      muted: '#6b7280'
    },

    depth: {
      cardElevation: 12,
      buttonElevation: 6,
      shadowIntensity: 0.1,
      perspective: 1200
    },

    animations: {
      pageTransition: 'breath-fade',
      cardHover: 'gentle-lift',
      buttonClick: 'soft-pulse',
      loadingState: 'calm-wave'
    },

    components: {
      hero: {
        layout: 'warm-split',
        hasTestimonial: true,
        hasBooking: true,
        hasTrustBadges: true
      },
      services: {
        layout: 'icon-grid',
        hasDescriptions: true,
        hasPricing: true
      },
      providers: {
        layout: 'profile-cards',
        hasCredentials: true,
        hasAvailability: true
      },
      booking: {
        layout: 'calendar-sidebar',
        hasTimeSlots: true,
        hasInsurance: true
      }
    },

    sections: [
      'HERO_CARING',
      'TRUST_INDICATORS',
      'SERVICES_GRID',
      'HOW_IT_WORKS',
      'PROVIDERS',
      'TESTIMONIALS',
      'INSURANCE_LOGOS',
      'BOOKING_CTA',
      'FOOTER_CONTACT'
    ],

    copy: {
      headlines: [
        'Healthcare That Cares',
        'Your Wellness Journey Starts Here',
        'Better Health. Better Life.',
        'Care That Comes to You'
      ],
      subheadlines: [
        'Book appointments in minutes',
        'Trusted by {number}+ patients',
        'Most insurance accepted'
      ],
      ctas: [
        'Book Appointment',
        'Get Started',
        'Find a Provider',
        'Check Coverage',
        'Start Your Journey'
      ]
    }
  },

  // ==========================================
  //  BUSINESS AUTOMATION OVERLAY
  // ==========================================
  AUTOMATION: {
    id: 'AUTOMATION',
    name: 'Business Automation',
    icon: '⚡',

    colors: {
      primary: '#7c3aed',
      secondary: '#06b6d4',
      accent: '#f59e0b',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#ffffff',
      muted: '#94a3b8'
    },

    depth: {
      cardElevation: 20,
      buttonElevation: 10,
      shadowIntensity: 0.35,
      perspective: 1000
    },

    animations: {
      pageTransition: 'flow-connect',
      cardHover: 'circuit-glow',
      buttonClick: 'lightning-strike',
      loadingState: 'data-stream'
    },

    components: {
      hero: {
        layout: 'workflow-visual',
        hasFlowDiagram: true,
        hasIntegrations: true,
        hasROICalc: true
      },
      integrations: {
        layout: 'logo-grid',
        hasCategories: true,
        hasSearch: true
      },
      workflows: {
        layout: 'template-cards',
        hasPreview: true,
        hasCloneButton: true
      },
      roi: {
        layout: 'calculator',
        hasInputs: true,
        hasResults: true
      }
    },

    sections: [
      'HERO_WORKFLOW',
      'INTEGRATION_LOGOS',
      'USE_CASES',
      'WORKFLOW_TEMPLATES',
      'ROI_CALCULATOR',
      'TESTIMONIALS',
      'ENTERPRISE_CTA',
      'FOOTER_SUPPORT'
    ],

    copy: {
      headlines: [
        'Automate Everything',
        'Work Smarter, Not Harder',
        'Connect. Automate. Scale.',
        'The End of Busy Work'
      ],
      subheadlines: [
        'Save {hours}+ hours every week',
        'Connect {number}+ apps in minutes',
        'No code required'
      ],
      ctas: [
        'Start Automating',
        'Try Free',
        'See Templates',
        'Calculate ROI',
        'Book Demo'
      ]
    }
  }
};

// ==========================================
//  EFFECT PRESETS - VISUAL MAGIC
// ==========================================

const EFFECT_PRESETS = {
  GLASSMORPHISM: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  },
  NEUMORPHISM: {
    background: '#e0e5ec',
    boxShadow: '8px 8px 16px #b8bcc2, -8px -8px 16px #ffffff',
    borderRadius: '24px'
  },
  HOLOGRAPHIC: {
    background: 'linear-gradient(135deg, #ff00ff20, #00ffff20, #ffff0020)',
    animation: 'holographic 3s linear infinite',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  NEON_GLOW: {
    boxShadow: '0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor',
    textShadow: '0 0 10px currentColor'
  },
  GRADIENT_MESH: {
    background: `
      radial-gradient(at 40% 20%, #ff006620 0px, transparent 50%),
      radial-gradient(at 80% 0%, #0066ff20 0px, transparent 50%),
      radial-gradient(at 0% 50%, #00ff6620 0px, transparent 50%),
      radial-gradient(at 80% 50%, #ff00ff20 0px, transparent 50%),
      radial-gradient(at 0% 100%, #ffff0020 0px, transparent 50%)
    `
  },
  PARTICLE_FIELD: {
    type: 'canvas',
    particles: 100,
    speed: 0.5,
    connections: true,
    interactivity: true
  },
  SCANLINES: {
    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
    pointerEvents: 'none'
  }
};

// ==========================================
//  ZERO UI/UX PRINCIPLES
// ==========================================

const ZERO_UI_PRINCIPLES = {
  INSTANT_UNDERSTANDING: {
    description: 'Users understand immediately without instructions',
    techniques: [
      'Familiar patterns from industry leaders',
      'Clear visual hierarchy',
      'Obvious CTAs',
      'Consistent iconography'
    ]
  },
  INVISIBLE_INTERFACE: {
    description: 'The interface disappears, only experience remains',
    techniques: [
      'Minimal chrome',
      'Context-aware controls',
      'Progressive disclosure',
      'Gesture-based interactions'
    ]
  },
  EMOTIONAL_RESONANCE: {
    description: 'Creates emotional connection through design',
    techniques: [
      'Micro-interactions',
      'Delightful animations',
      'Sound design',
      'Haptic feedback'
    ]
  },
  ANTICIPATORY_DESIGN: {
    description: 'Predicts user needs before they ask',
    techniques: [
      'Smart defaults',
      'Predictive suggestions',
      'Contextual help',
      'Auto-complete'
    ]
  },
  SENSORY_HARMONY: {
    description: 'All senses work together',
    techniques: [
      'Visual-audio sync',
      'Smooth transitions',
      'Consistent rhythm',
      'Balanced stimulation'
    ]
  }
};

// ==========================================
//  OVERLAY ENGINE CLASS
// ==========================================

class OverlayEngine extends EventEmitter {
  constructor() {
    super();
    this.activeOverlay = null;
    this.layers = {};
    this.effects = [];
    this.isInitialized = false;

    this._initializeLayers();
  }

  _initializeLayers() {
    for (const [name, config] of Object.entries(OVERLAY_LAYERS)) {
      this.layers[name] = {
        ...config,
        elements: [],
        isVisible: true
      };
    }
    this.isInitialized = true;
    this.emit('initialized');
  }

  // ==========================================
  //  PUBLIC METHODS
  // ==========================================

  /**
   * Apply industry-specific overlay template
   */
  applyOverlay(industryId) {
    const overlay = INDUSTRY_OVERLAYS[industryId];
    if (!overlay) {
      throw new Error(`Unknown industry overlay: ${industryId}`);
    }

    this.activeOverlay = overlay;

    // Generate CSS variables
    const cssVariables = this._generateCSSVariables(overlay);

    // Generate component styles
    const componentStyles = this._generateComponentStyles(overlay);

    // Generate section templates
    const sectionTemplates = this._generateSectionTemplates(overlay);

    this.emit('overlay-applied', {
      industryId,
      overlay,
      cssVariables,
      componentStyles,
      sectionTemplates
    });

    return {
      overlay,
      css: cssVariables,
      components: componentStyles,
      sections: sectionTemplates
    };
  }

  /**
   * Apply visual effect to layer
   */
  applyEffect(layerId, effectId) {
    const effect = EFFECT_PRESETS[effectId];
    if (!effect) {
      throw new Error(`Unknown effect: ${effectId}`);
    }

    if (!this.layers[layerId]) {
      throw new Error(`Unknown layer: ${layerId}`);
    }

    this.layers[layerId].effect = effect;
    this.effects.push({ layer: layerId, effect: effectId });

    this.emit('effect-applied', { layerId, effectId, effect });

    return effect;
  }

  /**
   * Generate complete landing page from overlay
   */
  generateLandingPage(industryId, options = {}) {
    const overlay = INDUSTRY_OVERLAYS[industryId];
    if (!overlay) {
      throw new Error(`Unknown industry: ${industryId}`);
    }

    const {
      headline = this._selectRandom(overlay.copy.headlines),
      subheadline = this._selectRandom(overlay.copy.subheadlines),
      cta = this._selectRandom(overlay.copy.ctas),
      companyName = 'Your Company',
      product = 'Product'
    } = options;

    // Replace placeholders in copy
    const processedHeadline = this._processTemplate(headline, { product, companyName });
    const processedSubheadline = this._processTemplate(subheadline, { number: '10,000', product });

    // Generate HTML structure
    const html = this._generateHTML(overlay, {
      headline: processedHeadline,
      subheadline: processedSubheadline,
      cta,
      companyName
    });

    // Generate CSS
    const css = this._generateFullCSS(overlay);

    // Generate JS for interactions
    const js = this._generateInteractionsJS(overlay);

    return {
      html,
      css,
      js,
      metadata: {
        title: `${companyName} - ${processedHeadline}`,
        description: processedSubheadline,
        industry: industryId,
        sections: overlay.sections
      }
    };
  }

  /**
   * Get available overlays
   */
  getOverlays() {
    return INDUSTRY_OVERLAYS;
  }

  /**
   * Get available effects
   */
  getEffects() {
    return EFFECT_PRESETS;
  }

  /**
   * Get Zero UI principles
   */
  getPrinciples() {
    return ZERO_UI_PRINCIPLES;
  }

  // ==========================================
  //  PRIVATE METHODS
  // ==========================================

  _generateCSSVariables(overlay) {
    return `
:root {
  /* Colors */
  --color-primary: ${overlay.colors.primary};
  --color-secondary: ${overlay.colors.secondary};
  --color-accent: ${overlay.colors.accent};
  --color-background: ${overlay.colors.background};
  --color-surface: ${overlay.colors.surface};
  --color-text: ${overlay.colors.text};
  --color-muted: ${overlay.colors.muted};

  /* Depth */
  --elevation-card: ${overlay.depth.cardElevation}px;
  --elevation-button: ${overlay.depth.buttonElevation}px;
  --shadow-intensity: ${overlay.depth.shadowIntensity};
  --perspective: ${overlay.depth.perspective}px;

  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0,0,0, var(--shadow-intensity));
  --shadow-md: 0 4px 8px rgba(0,0,0, var(--shadow-intensity));
  --shadow-lg: 0 8px 24px rgba(0,0,0, var(--shadow-intensity));
  --shadow-xl: 0 16px 48px rgba(0,0,0, var(--shadow-intensity));

  /* Animation */
  --transition-fast: 150ms ease;
  --transition-medium: 300ms ease;
  --transition-slow: 500ms ease;
}
`;
  }

  _generateComponentStyles(overlay) {
    const { colors, depth, animations } = overlay;

    return {
      button: {
        primary: `
          background: ${colors.primary};
          color: white;
          padding: 16px 32px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
          box-shadow: 0 ${depth.buttonElevation}px ${depth.buttonElevation * 2}px ${colors.primary}40;
        `,
        secondary: `
          background: transparent;
          color: ${colors.primary};
          padding: 16px 32px;
          border-radius: 8px;
          border: 2px solid ${colors.primary};
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        `
      },
      card: `
        background: ${colors.surface};
        border-radius: 16px;
        padding: 32px;
        box-shadow: var(--shadow-lg);
        transition: transform var(--transition-medium), box-shadow var(--transition-medium);
      `,
      input: `
        background: ${colors.surface};
        border: 2px solid ${colors.muted}40;
        border-radius: 8px;
        padding: 16px;
        color: ${colors.text};
        font-size: 16px;
        transition: border-color var(--transition-fast);
      `,
      heading: `
        color: ${colors.text};
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: -0.02em;
      `
    };
  }

  _generateSectionTemplates(overlay) {
    const templates = {};

    for (const section of overlay.sections) {
      templates[section] = this._generateSectionTemplate(section, overlay);
    }

    return templates;
  }

  _generateSectionTemplate(sectionId, overlay) {
    const baseTemplates = {
      HERO_GRADIENT: `
        <section class="hero hero-gradient">
          <div class="hero-background"></div>
          <div class="hero-content">
            <h1 class="hero-headline">{headline}</h1>
            <p class="hero-subheadline">{subheadline}</p>
            <div class="hero-cta">
              <button class="btn-primary">{cta}</button>
              <button class="btn-secondary">Learn More</button>
            </div>
          </div>
          <div class="hero-visual"></div>
        </section>
      `,
      HERO_SPLIT: `
        <section class="hero hero-split">
          <div class="hero-left">
            <h1 class="hero-headline">{headline}</h1>
            <p class="hero-subheadline">{subheadline}</p>
            <button class="btn-primary">{cta}</button>
          </div>
          <div class="hero-right">
            <div class="hero-image"></div>
          </div>
        </section>
      `,
      FEATURE_BENTO: `
        <section class="features bento">
          <h2 class="section-title">Features</h2>
          <div class="bento-grid">
            <div class="bento-item large"></div>
            <div class="bento-item"></div>
            <div class="bento-item"></div>
            <div class="bento-item wide"></div>
          </div>
        </section>
      `,
      PRICING_CARDS: `
        <section class="pricing">
          <h2 class="section-title">Pricing</h2>
          <div class="pricing-grid">
            <div class="pricing-card">
              <h3>Starter</h3>
              <div class="price">$9/mo</div>
              <ul class="features-list"></ul>
              <button class="btn-secondary">Get Started</button>
            </div>
            <div class="pricing-card popular">
              <span class="badge">Popular</span>
              <h3>Pro</h3>
              <div class="price">$29/mo</div>
              <ul class="features-list"></ul>
              <button class="btn-primary">{cta}</button>
            </div>
            <div class="pricing-card">
              <h3>Enterprise</h3>
              <div class="price">Custom</div>
              <ul class="features-list"></ul>
              <button class="btn-secondary">Contact Sales</button>
            </div>
          </div>
        </section>
      `,
      CTA_BANNER: `
        <section class="cta-banner">
          <h2>Ready to get started?</h2>
          <p>{subheadline}</p>
          <button class="btn-primary">{cta}</button>
        </section>
      `
    };

    return baseTemplates[sectionId] || `<section class="${sectionId.toLowerCase()}"></section>`;
  }

  _generateHTML(overlay, content) {
    const { headline, subheadline, cta, companyName } = content;

    let sectionsHTML = '';
    for (const section of overlay.sections) {
      const template = this._generateSectionTemplate(section, overlay);
      sectionsHTML += template
        .replace(/{headline}/g, headline)
        .replace(/{subheadline}/g, subheadline)
        .replace(/{cta}/g, cta)
        .replace(/{companyName}/g, companyName);
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${companyName} - ${headline}</title>
  <meta name="description" content="${subheadline}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <nav class="navbar">
    <div class="logo">${companyName}</div>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <a href="#about">About</a>
    </div>
    <button class="btn-primary btn-nav">${cta}</button>
  </nav>

  <main>
    ${sectionsHTML}
  </main>

  <footer class="footer">
    <div class="footer-content">
      <div class="footer-brand">
        <div class="logo">${companyName}</div>
        <p>${subheadline}</p>
      </div>
      <div class="footer-links">
        <div class="link-group">
          <h4>Product</h4>
          <a href="#">Features</a>
          <a href="#">Pricing</a>
          <a href="#">Integrations</a>
        </div>
        <div class="link-group">
          <h4>Company</h4>
          <a href="#">About</a>
          <a href="#">Blog</a>
          <a href="#">Careers</a>
        </div>
        <div class="link-group">
          <h4>Support</h4>
          <a href="#">Help Center</a>
          <a href="#">Contact</a>
          <a href="#">Status</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>
`;
  }

  _generateFullCSS(overlay) {
    const variables = this._generateCSSVariables(overlay);
    const components = this._generateComponentStyles(overlay);

    return `
${variables}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--color-background);
  color: var(--color-text);
  line-height: 1.6;
  overflow-x: hidden;
}

/* Typography */
h1 { font-size: clamp(2.5rem, 6vw, 4.5rem); }
h2 { font-size: clamp(2rem, 4vw, 3rem); }
h3 { font-size: clamp(1.25rem, 2vw, 1.5rem); }

h1, h2, h3, h4, h5, h6 {
  ${components.heading}
}

/* Buttons */
.btn-primary {
  ${components.button.primary}
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px ${overlay.colors.primary}50;
}

.btn-secondary {
  ${components.button.secondary}
}

.btn-secondary:hover {
  background: ${overlay.colors.primary};
  color: white;
}

/* Navbar */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 48px;
  background: ${overlay.colors.background}ee;
  backdrop-filter: blur(20px);
  z-index: 1000;
}

.logo {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

.nav-links {
  display: flex;
  gap: 32px;
}

.nav-links a {
  color: var(--color-muted);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.nav-links a:hover {
  color: var(--color-text);
}

.btn-nav {
  padding: 12px 24px;
}

/* Hero Sections */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 120px 48px 80px;
  position: relative;
  overflow: hidden;
}

.hero-gradient {
  background: linear-gradient(135deg, var(--color-background), var(--color-surface));
}

.hero-gradient .hero-background {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, ${overlay.colors.primary}20 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, ${overlay.colors.secondary}20 0%, transparent 40%);
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  text-align: center;
  margin: 0 auto;
}

.hero-headline {
  margin-bottom: 24px;
  background: linear-gradient(135deg, var(--color-text), ${overlay.colors.primary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subheadline {
  font-size: 1.25rem;
  color: var(--color-muted);
  margin-bottom: 40px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-cta {
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* Cards */
.card {
  ${components.card}
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
}

/* Sections */
section {
  padding: 120px 48px;
}

.section-title {
  text-align: center;
  margin-bottom: 64px;
}

/* Pricing */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.pricing-card {
  ${components.card}
  text-align: center;
  position: relative;
}

.pricing-card.popular {
  border: 2px solid var(--color-primary);
  transform: scale(1.05);
}

.pricing-card .badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: white;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.pricing-card .price {
  font-size: 48px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 24px 0;
}

/* CTA Banner */
.cta-banner {
  background: linear-gradient(135deg, ${overlay.colors.primary}, ${overlay.colors.secondary});
  text-align: center;
  border-radius: 24px;
  margin: 0 48px;
}

.cta-banner h2 {
  color: white;
  margin-bottom: 16px;
}

.cta-banner p {
  color: rgba(255,255,255,0.8);
  margin-bottom: 32px;
}

.cta-banner .btn-primary {
  background: white;
  color: ${overlay.colors.primary};
}

/* Footer */
.footer {
  background: var(--color-surface);
  padding: 80px 48px 40px;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: 64px;
  max-width: 1200px;
  margin: 0 auto 48px;
}

.footer-brand p {
  color: var(--color-muted);
  margin-top: 16px;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.link-group h4 {
  margin-bottom: 16px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.link-group a {
  display: block;
  color: var(--color-muted);
  text-decoration: none;
  margin-bottom: 8px;
  transition: color var(--transition-fast);
}

.link-group a:hover {
  color: var(--color-text);
}

.footer-bottom {
  text-align: center;
  padding-top: 40px;
  border-top: 1px solid ${overlay.colors.muted}20;
  color: var(--color-muted);
  font-size: 14px;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-content {
  animation: fadeInUp 0.8s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar {
    padding: 16px 24px;
  }

  .nav-links {
    display: none;
  }

  .hero {
    padding: 100px 24px 60px;
  }

  .hero-cta {
    flex-direction: column;
  }

  section {
    padding: 80px 24px;
  }

  .footer-content {
    grid-template-columns: 1fr;
  }

  .footer-links {
    grid-template-columns: repeat(2, 1fr);
  }
}
`;
  }

  _generateInteractionsJS(overlay) {
    return `
// Zero UI/UX Interactions
document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Button ripple effect
  document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      ripple.style.cssText = \`
        position: absolute;
        background: rgba(255,255,255,0.3);
        border-radius: 50%;
        pointer-events: none;
        animation: ripple 0.6s ease-out;
        left: \${e.clientX - rect.left}px;
        top: \${e.clientY - rect.top}px;
        width: 0;
        height: 0;
      \`;
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Intersection Observer for fade-in
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(40px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
  });

  // Add visible class styles
  const style = document.createElement('style');
  style.textContent = \`
    section.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
    @keyframes ripple {
      to {
        width: 200px;
        height: 200px;
        margin-left: -100px;
        margin-top: -100px;
        opacity: 0;
      }
    }
  \`;
  document.head.appendChild(style);

  // Navbar scroll effect
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const currentScroll = window.scrollY;

    if (currentScroll > 100) {
      navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    } else {
      navbar.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
  });

  console.log('✨ Zero UI/UX initialized');
});
`;
  }

  _selectRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _processTemplate(template, vars) {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return result;
  }
}

// ==========================================
//  EXPORTS
// ==========================================

module.exports = {
  OverlayEngine,
  OVERLAY_LAYERS,
  INDUSTRY_OVERLAYS,
  EFFECT_PRESETS,
  ZERO_UI_PRINCIPLES
};
