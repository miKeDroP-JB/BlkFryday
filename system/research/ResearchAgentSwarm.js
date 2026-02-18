// ============================================================
//  ORBOS V11.5 - RESEARCH AGENT SWARM
//  Continuous data gathering & intelligent distribution
// ============================================================
//
//  Architecture:
//  - 1 Master Researcher (always running, coordinates all)
//  - N Specialized Researchers (per domain/agent type)
//  - Data Pipeline (pull → classify → route → deliver)
//
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class ResearchAgentSwarm extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.dataDir = config.dataDir || path.join(__dirname, '../../data/research');
    this.ensureDirectories();

    // ============================================================
    //  MASTER RESEARCHER - Always running
    // ============================================================

    this.masterResearcher = {
      id: 'master_researcher',
      status: 'idle',
      running: false,
      stats: {
        dataGathered: 0,
        dataDistributed: 0,
        sourcesScanned: 0,
        errors: 0
      },
      queue: [],
      lastRun: null
    };

    // ============================================================
    //  SPECIALIZED RESEARCHERS (one per domain)
    // ============================================================

    this.specializedResearchers = new Map();
    this.initializeResearchers();

    // ============================================================
    //  DATA SOURCES
    // ============================================================

    this.dataSources = {
      // Code & Development
      github: {
        type: 'code',
        url: 'https://api.github.com',
        interests: ['repositories', 'code', 'issues', 'releases'],
        rateLimit: 60,
        researchers: ['code', 'security']
      },
      npm: {
        type: 'packages',
        url: 'https://registry.npmjs.org',
        interests: ['packages', 'dependencies', 'vulnerabilities'],
        rateLimit: 100,
        researchers: ['code', 'security']
      },
      stackoverflow: {
        type: 'qa',
        url: 'https://api.stackexchange.com',
        interests: ['questions', 'answers', 'trends'],
        rateLimit: 30,
        researchers: ['code', 'research']
      },

      // AI & ML
      huggingface: {
        type: 'ml',
        url: 'https://huggingface.co/api',
        interests: ['models', 'datasets', 'papers'],
        rateLimit: 100,
        researchers: ['learning', 'research']
      },
      arxiv: {
        type: 'papers',
        url: 'http://export.arxiv.org/api',
        interests: ['papers', 'research', 'citations'],
        rateLimit: 20,
        researchers: ['research', 'learning']
      },
      paperswithcode: {
        type: 'ml',
        url: 'https://paperswithcode.com/api',
        interests: ['benchmarks', 'implementations', 'sota'],
        rateLimit: 60,
        researchers: ['research', 'learning']
      },

      // Security
      nvd: {
        type: 'security',
        url: 'https://services.nvd.nist.gov/rest/json',
        interests: ['cves', 'vulnerabilities', 'advisories'],
        rateLimit: 10,
        researchers: ['security']
      },
      github_advisories: {
        type: 'security',
        url: 'https://api.github.com/advisories',
        interests: ['security', 'vulnerabilities'],
        rateLimit: 60,
        researchers: ['security', 'code']
      },

      // News & Trends
      hackernews: {
        type: 'news',
        url: 'https://hacker-news.firebaseio.com/v0',
        interests: ['tech', 'startups', 'programming'],
        rateLimit: 100,
        researchers: ['research', 'creative']
      },
      devto: {
        type: 'content',
        url: 'https://dev.to/api',
        interests: ['articles', 'tutorials', 'discussions'],
        rateLimit: 60,
        researchers: ['research', 'creative']
      },

      // Documentation
      mdn: {
        type: 'docs',
        url: 'https://developer.mozilla.org/api',
        interests: ['web', 'javascript', 'css', 'html'],
        rateLimit: 100,
        researchers: ['code', 'research']
      }
    };

    // ============================================================
    //  DELIVERY QUEUES (per agent swarm)
    // ============================================================

    this.deliveryQueues = {
      reasoning: [],
      coding: [],
      research: [],
      creative: [],
      voice: [],
      vision: [],
      data: [],
      security: [],
      orchestration: [],
      learning: []
    };

    // Data classification rules
    this.classificationRules = this.initializeClassificationRules();

    console.log(`[ResearchSwarm] Initialized with ${this.specializedResearchers.size} researchers, ${Object.keys(this.dataSources).length} sources`);
  }

  ensureDirectories() {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'raw'),
      path.join(this.dataDir, 'processed'),
      path.join(this.dataDir, 'delivered'),
      path.join(this.dataDir, 'archive')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // ============================================================
  //  INITIALIZE SPECIALIZED RESEARCHERS
  // ============================================================

  initializeResearchers() {
    const researcherSpecs = [
      {
        id: 'code',
        name: 'Code Research Agent',
        domains: ['programming', 'frameworks', 'libraries', 'patterns', 'best-practices'],
        sources: ['github', 'npm', 'stackoverflow', 'mdn'],
        deliverTo: ['coding', 'security'],
        pullInterval: 60000, // 1 minute
        keywords: ['code', 'programming', 'javascript', 'python', 'api', 'framework', 'library']
      },
      {
        id: 'security',
        name: 'Security Research Agent',
        domains: ['vulnerabilities', 'threats', 'patches', 'compliance', 'encryption'],
        sources: ['nvd', 'github_advisories', 'github'],
        deliverTo: ['security', 'coding'],
        pullInterval: 30000, // 30 seconds - security is critical
        keywords: ['vulnerability', 'cve', 'security', 'exploit', 'patch', 'advisory']
      },
      {
        id: 'research',
        name: 'General Research Agent',
        domains: ['trends', 'news', 'analysis', 'insights', 'comparisons'],
        sources: ['hackernews', 'devto', 'arxiv', 'stackoverflow'],
        deliverTo: ['research', 'reasoning', 'creative'],
        pullInterval: 120000, // 2 minutes
        keywords: ['trend', 'analysis', 'comparison', 'benchmark', 'review']
      },
      {
        id: 'learning',
        name: 'ML/AI Research Agent',
        domains: ['models', 'training', 'datasets', 'papers', 'benchmarks'],
        sources: ['huggingface', 'arxiv', 'paperswithcode'],
        deliverTo: ['learning', 'data', 'reasoning'],
        pullInterval: 180000, // 3 minutes
        keywords: ['model', 'training', 'dataset', 'neural', 'transformer', 'llm', 'benchmark']
      },
      {
        id: 'creative',
        name: 'Creative Research Agent',
        domains: ['design', 'ux', 'content', 'ideas', 'inspiration'],
        sources: ['devto', 'hackernews'],
        deliverTo: ['creative', 'vision'],
        pullInterval: 300000, // 5 minutes
        keywords: ['design', 'ui', 'ux', 'creative', 'idea', 'inspiration']
      },
      {
        id: 'data',
        name: 'Data Research Agent',
        domains: ['databases', 'analytics', 'etl', 'storage', 'processing'],
        sources: ['stackoverflow', 'github', 'npm'],
        deliverTo: ['data', 'reasoning'],
        pullInterval: 180000,
        keywords: ['database', 'sql', 'nosql', 'analytics', 'pipeline', 'etl']
      }
    ];

    for (const spec of researcherSpecs) {
      this.specializedResearchers.set(spec.id, {
        ...spec,
        status: 'idle',
        running: false,
        stats: {
          pullCount: 0,
          dataFetched: 0,
          dataDelivered: 0,
          errors: 0
        },
        lastPull: null,
        cache: new Map()
      });
    }
  }

  initializeClassificationRules() {
    return {
      // Keyword-based classification
      keywords: {
        coding: ['code', 'programming', 'function', 'class', 'api', 'sdk', 'library'],
        security: ['vulnerability', 'cve', 'exploit', 'security', 'patch', 'breach'],
        research: ['study', 'analysis', 'research', 'paper', 'findings'],
        learning: ['model', 'training', 'neural', 'ml', 'ai', 'dataset'],
        data: ['database', 'sql', 'analytics', 'data', 'etl', 'query'],
        creative: ['design', 'ui', 'ux', 'creative', 'art', 'visual'],
        reasoning: ['logic', 'algorithm', 'problem', 'solve', 'math'],
        voice: ['audio', 'speech', 'voice', 'sound', 'transcription'],
        vision: ['image', 'video', 'visual', 'ocr', 'recognition']
      },

      // Source-based classification
      sources: {
        github: ['coding', 'security'],
        nvd: ['security'],
        huggingface: ['learning'],
        arxiv: ['research', 'learning'],
        stackoverflow: ['coding', 'data'],
        hackernews: ['research'],
        mdn: ['coding']
      }
    };
  }

  // ============================================================
  //  START MASTER RESEARCHER
  // ============================================================

  async start() {
    if (this.masterResearcher.running) {
      console.log('[ResearchSwarm] Already running');
      return;
    }

    console.log('[ResearchSwarm] Starting Master Researcher...');
    this.masterResearcher.running = true;
    this.masterResearcher.status = 'running';

    // Start all specialized researchers
    for (const [id, researcher] of this.specializedResearchers) {
      this.startResearcher(id);
    }

    // Master coordination loop
    this.masterLoop();
  }

  stop() {
    console.log('[ResearchSwarm] Stopping...');
    this.masterResearcher.running = false;
    this.masterResearcher.status = 'stopped';

    for (const [id, researcher] of this.specializedResearchers) {
      researcher.running = false;
      researcher.status = 'stopped';
    }
  }

  async masterLoop() {
    while (this.masterResearcher.running) {
      this.masterResearcher.lastRun = Date.now();

      // 1. Collect data from all researcher queues
      const allData = this.collectFromResearchers();

      // 2. Classify and route data
      for (const item of allData) {
        const destinations = this.classifyData(item);
        this.routeData(item, destinations);
      }

      // 3. Process delivery queues
      await this.processDeliveryQueues();

      // 4. Update stats
      this.masterResearcher.stats.dataDistributed += allData.length;

      // 5. Emit status
      this.emit('master-cycle', {
        dataProcessed: allData.length,
        queueSizes: this.getQueueSizes()
      });

      // Wait before next cycle
      await this.sleep(5000); // 5 second master cycle
    }
  }

  // ============================================================
  //  SPECIALIZED RESEARCHER OPERATIONS
  // ============================================================

  async startResearcher(researcherId) {
    const researcher = this.specializedResearchers.get(researcherId);
    if (!researcher || researcher.running) return;

    researcher.running = true;
    researcher.status = 'running';

    console.log(`[ResearchSwarm] Starting researcher: ${researcher.name}`);

    // Run researcher loop
    this.researcherLoop(researcherId);
  }

  async researcherLoop(researcherId) {
    const researcher = this.specializedResearchers.get(researcherId);

    while (researcher.running) {
      researcher.status = 'pulling';

      try {
        // Pull from assigned sources
        for (const sourceId of researcher.sources) {
          const source = this.dataSources[sourceId];
          if (!source) continue;

          const data = await this.pullFromSource(sourceId, researcher);

          if (data && data.length > 0) {
            researcher.stats.dataFetched += data.length;

            // Add to master queue for classification/routing
            this.masterResearcher.queue.push(...data.map(d => ({
              ...d,
              fetchedBy: researcherId,
              fetchedAt: Date.now()
            })));
          }
        }

        researcher.stats.pullCount++;
        researcher.lastPull = Date.now();
        researcher.status = 'idle';

      } catch (error) {
        researcher.stats.errors++;
        researcher.status = 'error';
        console.error(`[ResearchSwarm] ${researcher.name} error:`, error.message);
      }

      // Wait for pull interval
      await this.sleep(researcher.pullInterval);
    }
  }

  async pullFromSource(sourceId, researcher) {
    const source = this.dataSources[sourceId];
    if (!source) return [];

    console.log(`[ResearchSwarm] ${researcher.name} pulling from ${sourceId}...`);
    this.masterResearcher.stats.sourcesScanned++;

    // Source-specific fetching (simulated - real implementation would use actual APIs)
    const data = await this.fetchSourceData(sourceId, source, researcher.keywords);

    return data;
  }

  async fetchSourceData(sourceId, source, keywords) {
    // Simulated data fetching - in production, this would call actual APIs
    const simulatedData = [];

    // Generate relevant data based on source type
    switch (source.type) {
      case 'code':
        simulatedData.push({
          id: `${sourceId}_${Date.now()}`,
          source: sourceId,
          type: 'repository',
          title: `New ${keywords[0]} library`,
          content: `A new library for ${keywords.join(', ')}`,
          url: `${source.url}/example`,
          relevance: Math.random(),
          timestamp: Date.now()
        });
        break;

      case 'security':
        simulatedData.push({
          id: `${sourceId}_${Date.now()}`,
          source: sourceId,
          type: 'advisory',
          title: `Security Advisory`,
          severity: Math.random() > 0.7 ? 'high' : 'medium',
          content: `New vulnerability detected`,
          url: `${source.url}/advisory`,
          relevance: Math.random() + 0.5, // Security always high relevance
          timestamp: Date.now()
        });
        break;

      case 'ml':
        simulatedData.push({
          id: `${sourceId}_${Date.now()}`,
          source: sourceId,
          type: 'model',
          title: `New ML model released`,
          content: `State-of-the-art performance`,
          url: `${source.url}/model`,
          relevance: Math.random(),
          timestamp: Date.now()
        });
        break;

      case 'papers':
        simulatedData.push({
          id: `${sourceId}_${Date.now()}`,
          source: sourceId,
          type: 'paper',
          title: `Research paper on ${keywords[0]}`,
          content: `Abstract discussing ${keywords.join(', ')}`,
          url: `${source.url}/paper`,
          relevance: Math.random(),
          timestamp: Date.now()
        });
        break;

      case 'news':
      case 'content':
        simulatedData.push({
          id: `${sourceId}_${Date.now()}`,
          source: sourceId,
          type: 'article',
          title: `Article about ${keywords[0]}`,
          content: `Discussion of ${keywords.join(', ')}`,
          url: `${source.url}/article`,
          relevance: Math.random(),
          timestamp: Date.now()
        });
        break;

      default:
        simulatedData.push({
          id: `${sourceId}_${Date.now()}`,
          source: sourceId,
          type: 'general',
          title: `Update from ${sourceId}`,
          content: `General content`,
          url: `${source.url}`,
          relevance: Math.random(),
          timestamp: Date.now()
        });
    }

    return simulatedData;
  }

  // ============================================================
  //  DATA CLASSIFICATION & ROUTING
  // ============================================================

  collectFromResearchers() {
    const collected = [...this.masterResearcher.queue];
    this.masterResearcher.queue = [];
    return collected;
  }

  classifyData(item) {
    const destinations = new Set();
    const contentLower = (item.title + ' ' + item.content).toLowerCase();

    // 1. Source-based classification
    const sourceDestinations = this.classificationRules.sources[item.source] || [];
    sourceDestinations.forEach(d => destinations.add(d));

    // 2. Keyword-based classification
    for (const [swarm, keywords] of Object.entries(this.classificationRules.keywords)) {
      for (const keyword of keywords) {
        if (contentLower.includes(keyword)) {
          destinations.add(swarm);
          break;
        }
      }
    }

    // 3. Type-based classification
    switch (item.type) {
      case 'repository':
      case 'code':
        destinations.add('coding');
        break;
      case 'advisory':
      case 'vulnerability':
        destinations.add('security');
        break;
      case 'model':
      case 'dataset':
        destinations.add('learning');
        break;
      case 'paper':
        destinations.add('research');
        destinations.add('reasoning');
        break;
    }

    // 4. High-relevance items go to more destinations
    if (item.relevance > 0.8) {
      destinations.add('research');
      destinations.add('reasoning');
    }

    return Array.from(destinations);
  }

  routeData(item, destinations) {
    for (const destination of destinations) {
      if (this.deliveryQueues[destination]) {
        this.deliveryQueues[destination].push({
          ...item,
          routedAt: Date.now(),
          routedTo: destination
        });
      }
    }
  }

  // ============================================================
  //  DELIVERY PROCESSING
  // ============================================================

  async processDeliveryQueues() {
    for (const [swarm, queue] of Object.entries(this.deliveryQueues)) {
      if (queue.length === 0) continue;

      // Process up to 10 items per swarm per cycle
      const toDeliver = queue.splice(0, 10);

      for (const item of toDeliver) {
        await this.deliverToSwarm(swarm, item);
      }
    }
  }

  async deliverToSwarm(swarm, item) {
    // Format data for the swarm
    const delivery = {
      id: `delivery_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      swarm,
      data: item,
      deliveredAt: Date.now()
    };

    // Save to delivered folder
    const deliveryPath = path.join(this.dataDir, 'delivered', `${swarm}_${delivery.id}.json`);
    fs.writeFileSync(deliveryPath, JSON.stringify(delivery, null, 2));

    // Emit delivery event
    this.emit('data-delivered', delivery);

    // Update researcher stats
    const researcher = this.specializedResearchers.get(item.fetchedBy);
    if (researcher) {
      researcher.stats.dataDelivered++;
    }
  }

  // ============================================================
  //  QUERY INTERFACE
  // ============================================================

  async query(query, options = {}) {
    const { sources = [], keywords = [], limit = 20 } = options;

    console.log(`[ResearchSwarm] Processing query: "${query}"`);

    const results = [];

    // Pull fresh data for query
    for (const [sourceId, source] of Object.entries(this.dataSources)) {
      if (sources.length > 0 && !sources.includes(sourceId)) continue;

      const queryKeywords = keywords.length > 0 ? keywords : query.split(' ');
      const data = await this.fetchSourceData(sourceId, source, queryKeywords);

      results.push(...data);
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    return {
      query,
      resultCount: results.length,
      results: results.slice(0, limit)
    };
  }

  // ============================================================
  //  STATISTICS
  // ============================================================

  getStats() {
    const researcherStats = {};
    for (const [id, researcher] of this.specializedResearchers) {
      researcherStats[id] = {
        name: researcher.name,
        status: researcher.status,
        running: researcher.running,
        stats: researcher.stats,
        lastPull: researcher.lastPull
      };
    }

    return {
      master: {
        status: this.masterResearcher.status,
        running: this.masterResearcher.running,
        stats: this.masterResearcher.stats,
        queueSize: this.masterResearcher.queue.length,
        lastRun: this.masterResearcher.lastRun
      },
      researchers: researcherStats,
      deliveryQueues: this.getQueueSizes(),
      dataSources: Object.keys(this.dataSources).length
    };
  }

  getQueueSizes() {
    const sizes = {};
    for (const [swarm, queue] of Object.entries(this.deliveryQueues)) {
      sizes[swarm] = queue.length;
    }
    return sizes;
  }

  // ============================================================
  //  UTILITIES
  // ============================================================

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { ResearchAgentSwarm };
