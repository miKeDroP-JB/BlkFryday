// ============================================================
//  ORBOS V11.5 - KNOWLEDGE HARVESTER
//  Automated extraction from Audio/Video sources
// ============================================================
//
//  Pipeline: SOURCE → DOWNLOAD → EXTRACT AUDIO → TRANSCRIBE →
//            ANALYZE → CHUNK → STORE → INDEX
//
//  Sources: YouTube, Podcasts, Webinars, Courses, Interviews
//  Output: Structured knowledge for the Brain Network
//
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class KnowledgeHarvester extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.dataDir = config.dataDir || path.join(__dirname, '../../data/harvested');
    this.queueDir = path.join(this.dataDir, 'queue');
    this.processedDir = path.join(this.dataDir, 'processed');
    this.knowledgeDir = path.join(this.dataDir, 'knowledge');
    this.ensureDirectories();

    // ============================================================
    //  HARVESTER STATE
    // ============================================================

    this.state = {
      running: false,
      harvesters: new Map(),
      queue: [],
      processing: null,
      stats: {
        sourcesScanned: 0,
        itemsDownloaded: 0,
        hoursTranscribed: 0,
        knowledgeExtracted: 0,
        bytesProcessed: 0
      }
    };

    // ============================================================
    //  SOURCE CONFIGURATIONS
    // ============================================================

    this.sources = {
      youtube: {
        name: 'YouTube',
        type: 'video',
        enabled: true,
        priority: 1,
        rateLimit: 10, // per minute
        categories: [
          'business', 'entrepreneurship', 'marketing', 'sales',
          'programming', 'ai', 'automation', 'productivity'
        ],
        channels: [], // Specific channels to follow
        searchQueries: [] // Keywords to search
      },

      podcasts: {
        name: 'Podcasts',
        type: 'audio',
        enabled: true,
        priority: 2,
        rateLimit: 20,
        feeds: [], // RSS feed URLs
        categories: [
          'business', 'technology', 'entrepreneurship', 'marketing'
        ]
      },

      webinars: {
        name: 'Webinars',
        type: 'video',
        enabled: true,
        priority: 3,
        rateLimit: 5,
        platforms: ['zoom-recordings', 'webinar-archives']
      },

      courses: {
        name: 'Courses',
        type: 'video',
        enabled: true,
        priority: 4,
        rateLimit: 5,
        platforms: ['youtube-playlists', 'free-courses']
      },

      interviews: {
        name: 'Interviews',
        type: 'audio',
        enabled: true,
        priority: 5,
        rateLimit: 15,
        sources: ['podcast-interviews', 'youtube-interviews']
      }
    };

    // ============================================================
    //  PROCESSING PIPELINE CONFIG
    // ============================================================

    this.pipeline = {
      audioExtraction: {
        format: 'mp3',
        bitrate: '128k',
        sampleRate: 16000 // Optimal for speech recognition
      },
      transcription: {
        engine: 'whisper', // whisper, deepgram, assembly
        model: 'large-v3',
        language: 'en',
        chunkSize: 30, // seconds per chunk
        timestamps: true
      },
      analysis: {
        extractTopics: true,
        extractEntities: true,
        extractQuotes: true,
        extractActionItems: true,
        summarize: true,
        sentiment: true
      },
      knowledge: {
        chunkSize: 1000, // characters per knowledge chunk
        overlap: 100,
        minConfidence: 0.7
      }
    };

    console.log(`[KnowledgeHarvester] Initialized with ${Object.keys(this.sources).length} source types`);
  }

  ensureDirectories() {
    [this.dataDir, this.queueDir, this.processedDir, this.knowledgeDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // ============================================================
  //  START/STOP HARVESTING
  // ============================================================

  async start() {
    if (this.state.running) {
      console.log('[KnowledgeHarvester] Already running');
      return;
    }

    this.state.running = true;
    console.log('[KnowledgeHarvester] Starting automated harvesting...');

    // Start source harvesters
    for (const [sourceId, source] of Object.entries(this.sources)) {
      if (source.enabled) {
        this.startSourceHarvester(sourceId, source);
      }
    }

    // Start processing loop
    this.processLoop();
  }

  stop() {
    this.state.running = false;
    console.log('[KnowledgeHarvester] Stopping...');
  }

  // ============================================================
  //  SOURCE HARVESTERS
  // ============================================================

  async startSourceHarvester(sourceId, source) {
    console.log(`[KnowledgeHarvester] Starting harvester: ${source.name}`);

    const harvester = {
      id: sourceId,
      source,
      status: 'running',
      lastRun: null,
      itemsFound: 0
    };

    this.state.harvesters.set(sourceId, harvester);

    // Run harvester loop
    this.harvesterLoop(sourceId, source);
  }

  async harvesterLoop(sourceId, source) {
    while (this.state.running) {
      const harvester = this.state.harvesters.get(sourceId);
      if (!harvester) break;

      harvester.status = 'scanning';

      try {
        // Discover new content
        const items = await this.discoverContent(sourceId, source);

        if (items.length > 0) {
          console.log(`[KnowledgeHarvester] ${source.name}: Found ${items.length} items`);

          // Add to queue
          for (const item of items) {
            this.addToQueue(item);
          }

          harvester.itemsFound += items.length;
          this.state.stats.sourcesScanned++;
        }

        harvester.lastRun = Date.now();
        harvester.status = 'idle';

      } catch (error) {
        console.error(`[KnowledgeHarvester] ${source.name} error:`, error.message);
        harvester.status = 'error';
      }

      // Wait based on rate limit
      const waitTime = (60 / source.rateLimit) * 1000;
      await this.sleep(waitTime);
    }
  }

  async discoverContent(sourceId, source) {
    const items = [];

    switch (sourceId) {
      case 'youtube':
        items.push(...await this.discoverYouTube(source));
        break;

      case 'podcasts':
        items.push(...await this.discoverPodcasts(source));
        break;

      case 'webinars':
        items.push(...await this.discoverWebinars(source));
        break;

      default:
        // Generic discovery
        items.push(...await this.genericDiscover(source));
    }

    return items;
  }

  async discoverYouTube(source) {
    // YouTube discovery logic
    // In production: Use YouTube Data API or yt-dlp for discovery
    const items = [];

    for (const category of source.categories) {
      // Simulated discovery - in production use actual API
      items.push({
        id: `yt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        source: 'youtube',
        type: 'video',
        category,
        title: `Business content about ${category}`,
        url: `https://youtube.com/watch?v=example`,
        duration: Math.floor(Math.random() * 3600) + 300, // 5-65 minutes
        priority: source.priority,
        discoveredAt: Date.now()
      });
    }

    return items.slice(0, 5); // Limit per cycle
  }

  async discoverPodcasts(source) {
    const items = [];

    // In production: Parse RSS feeds
    for (const category of source.categories) {
      items.push({
        id: `pod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        source: 'podcast',
        type: 'audio',
        category,
        title: `Podcast episode about ${category}`,
        url: `https://podcast.example.com/episode`,
        duration: Math.floor(Math.random() * 3600) + 1800, // 30-90 minutes
        priority: source.priority,
        discoveredAt: Date.now()
      });
    }

    return items.slice(0, 5);
  }

  async discoverWebinars(source) {
    return []; // Implement webinar discovery
  }

  async genericDiscover(source) {
    return [];
  }

  // ============================================================
  //  QUEUE MANAGEMENT
  // ============================================================

  addToQueue(item) {
    // Check for duplicates
    const existing = this.state.queue.find(q => q.url === item.url);
    if (existing) return;

    // Check if already processed
    const processedPath = path.join(this.processedDir, `${item.id}.json`);
    if (fs.existsSync(processedPath)) return;

    this.state.queue.push(item);

    // Sort by priority
    this.state.queue.sort((a, b) => a.priority - b.priority);

    // Save queue
    this.saveQueue();
  }

  saveQueue() {
    const queuePath = path.join(this.queueDir, 'queue.json');
    fs.writeFileSync(queuePath, JSON.stringify(this.state.queue, null, 2));
  }

  loadQueue() {
    const queuePath = path.join(this.queueDir, 'queue.json');
    if (fs.existsSync(queuePath)) {
      this.state.queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    }
  }

  // ============================================================
  //  PROCESSING PIPELINE
  // ============================================================

  async processLoop() {
    while (this.state.running) {
      if (this.state.queue.length === 0) {
        await this.sleep(5000);
        continue;
      }

      const item = this.state.queue.shift();
      this.saveQueue();

      try {
        await this.processItem(item);
      } catch (error) {
        console.error(`[KnowledgeHarvester] Process error:`, error.message);
        // Re-queue with lower priority
        item.priority += 10;
        item.retries = (item.retries || 0) + 1;
        if (item.retries < 3) {
          this.state.queue.push(item);
        }
      }

      await this.sleep(1000);
    }
  }

  async processItem(item) {
    console.log(`[KnowledgeHarvester] Processing: ${item.title}`);
    this.state.processing = item;

    const result = {
      id: item.id,
      source: item.source,
      title: item.title,
      url: item.url,
      startedAt: Date.now(),
      steps: {}
    };

    // Step 1: Download
    result.steps.download = await this.download(item);
    this.state.stats.itemsDownloaded++;

    // Step 2: Extract Audio (if video)
    if (item.type === 'video') {
      result.steps.audioExtraction = await this.extractAudio(result.steps.download.path);
    } else {
      result.steps.audioExtraction = { path: result.steps.download.path };
    }

    // Step 3: Transcribe
    result.steps.transcription = await this.transcribe(result.steps.audioExtraction.path);
    this.state.stats.hoursTranscribed += item.duration / 3600;

    // Step 4: Analyze
    result.steps.analysis = await this.analyze(result.steps.transcription);

    // Step 5: Extract Knowledge
    result.steps.knowledge = await this.extractKnowledge(result.steps.analysis);
    this.state.stats.knowledgeExtracted += result.steps.knowledge.chunks.length;

    // Step 6: Store
    result.steps.storage = await this.storeKnowledge(result.steps.knowledge, item);

    // Mark as processed
    result.completedAt = Date.now();
    result.duration = result.completedAt - result.startedAt;

    // Save processed record
    const processedPath = path.join(this.processedDir, `${item.id}.json`);
    fs.writeFileSync(processedPath, JSON.stringify(result, null, 2));

    this.state.processing = null;
    this.emit('item-processed', result);

    console.log(`[KnowledgeHarvester] Completed: ${item.title} (${result.steps.knowledge.chunks.length} knowledge chunks)`);

    return result;
  }

  // ============================================================
  //  PIPELINE STEPS
  // ============================================================

  async download(item) {
    // Simulate download - in production use yt-dlp, requests, etc.
    const filename = `${item.id}.${item.type === 'video' ? 'mp4' : 'mp3'}`;
    const filepath = path.join(this.dataDir, 'downloads', filename);

    // Ensure downloads dir exists
    const downloadsDir = path.join(this.dataDir, 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // In production: Actually download the file
    // For now, create a placeholder
    fs.writeFileSync(filepath, `Placeholder for ${item.url}`);

    this.state.stats.bytesProcessed += 1000000; // Simulated

    return {
      success: true,
      path: filepath,
      size: 1000000,
      duration: item.duration
    };
  }

  async extractAudio(videoPath) {
    // In production: Use ffmpeg
    // ffmpeg -i video.mp4 -vn -acodec libmp3lame -ab 128k -ar 16000 audio.mp3

    const audioPath = videoPath.replace(/\.(mp4|webm|mkv)$/, '.mp3');

    // Simulated extraction
    fs.writeFileSync(audioPath, `Audio extracted from ${videoPath}`);

    return {
      success: true,
      path: audioPath,
      format: 'mp3',
      sampleRate: this.pipeline.audioExtraction.sampleRate
    };
  }

  async transcribe(audioPath) {
    // In production: Use Whisper, Deepgram, or AssemblyAI
    // whisper audio.mp3 --model large-v3 --output_format json

    const transcript = {
      text: `This is a simulated transcript of the audio content.

      The speaker discusses important business topics including:
      - How to automate sales processes effectively
      - Best practices for customer support
      - Marketing strategies that actually work
      - The future of AI in business automation

      Key quote: "The businesses that adopt AI early will have an insurmountable advantage."

      Action items mentioned:
      1. Implement automated follow-up sequences
      2. Use AI for initial customer screening
      3. Create templates for common responses

      The speaker emphasizes the importance of data collection and continuous improvement.`,

      segments: [
        { start: 0, end: 60, text: 'Introduction to business automation' },
        { start: 60, end: 180, text: 'Sales process automation strategies' },
        { start: 180, end: 300, text: 'Customer support best practices' },
        { start: 300, end: 420, text: 'Marketing automation techniques' },
        { start: 420, end: 540, text: 'Future of AI in business' }
      ],

      language: 'en',
      confidence: 0.95
    };

    return {
      success: true,
      transcript,
      wordCount: transcript.text.split(/\s+/).length,
      duration: 540
    };
  }

  async analyze(transcription) {
    const text = transcription.transcript.text;

    // Topic extraction
    const topics = this.extractTopics(text);

    // Entity extraction
    const entities = this.extractEntities(text);

    // Quote extraction
    const quotes = this.extractQuotes(text);

    // Action items
    const actionItems = this.extractActionItems(text);

    // Summary
    const summary = this.generateSummary(text);

    // Sentiment
    const sentiment = this.analyzeSentiment(text);

    return {
      topics,
      entities,
      quotes,
      actionItems,
      summary,
      sentiment,
      wordCount: text.split(/\s+/).length
    };
  }

  extractTopics(text) {
    const topicKeywords = {
      'sales': ['sales', 'selling', 'close', 'deal', 'prospect', 'lead'],
      'marketing': ['marketing', 'brand', 'content', 'social', 'campaign'],
      'automation': ['automate', 'automation', 'workflow', 'process'],
      'ai': ['ai', 'artificial intelligence', 'machine learning', 'model'],
      'business': ['business', 'company', 'enterprise', 'startup'],
      'customer': ['customer', 'client', 'support', 'service']
    };

    const textLower = text.toLowerCase();
    const topics = [];

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const matches = keywords.filter(kw => textLower.includes(kw)).length;
      if (matches > 0) {
        topics.push({ topic, relevance: matches / keywords.length });
      }
    }

    return topics.sort((a, b) => b.relevance - a.relevance);
  }

  extractEntities(text) {
    // Simple entity extraction - in production use NER model
    const entities = {
      tools: [],
      companies: [],
      people: [],
      concepts: []
    };

    // Extract quoted terms as potential entities
    const quoted = text.match(/"([^"]+)"/g) || [];
    entities.concepts = quoted.map(q => q.replace(/"/g, ''));

    return entities;
  }

  extractQuotes(text) {
    const quotes = [];
    const quotePattern = /"([^"]+)"/g;
    let match;

    while ((match = quotePattern.exec(text)) !== null) {
      if (match[1].length > 20) {
        quotes.push({
          text: match[1],
          importance: match[1].length > 50 ? 'high' : 'medium'
        });
      }
    }

    return quotes;
  }

  extractActionItems(text) {
    const actionItems = [];
    const patterns = [
      /\d+\.\s+([A-Z][^.]+)/g,
      /(?:should|must|need to|have to)\s+([^.]+)/gi,
      /(?:action item|todo|task):\s*([^.]+)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        actionItems.push(match[1].trim());
      }
    }

    return [...new Set(actionItems)];
  }

  generateSummary(text) {
    // Simple extractive summary - first few sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  analyzeSentiment(text) {
    const positiveWords = ['success', 'great', 'excellent', 'advantage', 'benefit', 'improve'];
    const negativeWords = ['fail', 'problem', 'issue', 'difficult', 'challenge'];

    const textLower = text.toLowerCase();
    const positive = positiveWords.filter(w => textLower.includes(w)).length;
    const negative = negativeWords.filter(w => textLower.includes(w)).length;

    const total = positive + negative;
    if (total === 0) return { score: 0, label: 'neutral' };

    const score = (positive - negative) / total;
    return {
      score,
      label: score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral'
    };
  }

  // ============================================================
  //  KNOWLEDGE EXTRACTION & STORAGE
  // ============================================================

  async extractKnowledge(analysis) {
    const chunks = [];

    // Create knowledge chunks from analysis
    const { topics, quotes, actionItems, summary } = analysis;

    // Summary chunk
    chunks.push({
      id: `chunk_${Date.now()}_summary`,
      type: 'summary',
      content: summary,
      topics: topics.slice(0, 3).map(t => t.topic),
      confidence: 0.9
    });

    // Quote chunks
    for (const quote of quotes) {
      chunks.push({
        id: `chunk_${Date.now()}_quote_${chunks.length}`,
        type: 'quote',
        content: quote.text,
        importance: quote.importance,
        confidence: 0.95
      });
    }

    // Action item chunks
    for (const action of actionItems) {
      chunks.push({
        id: `chunk_${Date.now()}_action_${chunks.length}`,
        type: 'action',
        content: action,
        confidence: 0.85
      });
    }

    // Topic-specific chunks
    for (const topic of topics) {
      if (topic.relevance > 0.3) {
        chunks.push({
          id: `chunk_${Date.now()}_topic_${topic.topic}`,
          type: 'topic',
          content: `Key insights about ${topic.topic}`,
          topic: topic.topic,
          relevance: topic.relevance,
          confidence: 0.8
        });
      }
    }

    return {
      chunks,
      totalChunks: chunks.length,
      topics: topics.map(t => t.topic)
    };
  }

  async storeKnowledge(knowledge, sourceItem) {
    const stored = [];

    for (const chunk of knowledge.chunks) {
      const entry = {
        id: chunk.id,
        source: {
          type: sourceItem.source,
          title: sourceItem.title,
          url: sourceItem.url,
          harvestedAt: Date.now()
        },
        content: chunk.content,
        type: chunk.type,
        topics: chunk.topics || knowledge.topics,
        confidence: chunk.confidence,
        metadata: {
          importance: chunk.importance,
          relevance: chunk.relevance
        }
      };

      // Save to knowledge directory
      const filepath = path.join(this.knowledgeDir, `${chunk.id}.json`);
      fs.writeFileSync(filepath, JSON.stringify(entry, null, 2));

      stored.push(entry.id);
    }

    this.emit('knowledge-stored', {
      count: stored.length,
      source: sourceItem.title
    });

    return {
      stored,
      count: stored.length
    };
  }

  // ============================================================
  //  MANUAL INGESTION
  // ============================================================

  async ingestURL(url, options = {}) {
    const item = {
      id: `manual_${Date.now()}`,
      source: 'manual',
      type: this.detectType(url),
      title: options.title || 'Manual upload',
      url,
      priority: 0, // Highest priority
      discoveredAt: Date.now()
    };

    this.addToQueue(item);
    return item.id;
  }

  async ingestFile(filepath, options = {}) {
    const item = {
      id: `file_${Date.now()}`,
      source: 'local',
      type: this.detectTypeFromFile(filepath),
      title: options.title || path.basename(filepath),
      url: `file://${filepath}`,
      localPath: filepath,
      priority: 0,
      discoveredAt: Date.now()
    };

    this.addToQueue(item);
    return item.id;
  }

  detectType(url) {
    if (/youtube\.com|youtu\.be/i.test(url)) return 'video';
    if (/\.(mp3|wav|m4a|ogg)$/i.test(url)) return 'audio';
    if (/\.(mp4|webm|mkv|avi)$/i.test(url)) return 'video';
    return 'audio'; // Default to audio
  }

  detectTypeFromFile(filepath) {
    const ext = path.extname(filepath).toLowerCase();
    const videoExts = ['.mp4', '.webm', '.mkv', '.avi', '.mov'];
    return videoExts.includes(ext) ? 'video' : 'audio';
  }

  // ============================================================
  //  STATISTICS
  // ============================================================

  getStats() {
    return {
      state: {
        running: this.state.running,
        processing: this.state.processing?.title || null,
        queueLength: this.state.queue.length
      },
      harvesters: Array.from(this.state.harvesters.entries()).map(([id, h]) => ({
        id,
        name: h.source.name,
        status: h.status,
        itemsFound: h.itemsFound,
        lastRun: h.lastRun
      })),
      stats: this.state.stats,
      queue: this.state.queue.slice(0, 10).map(q => ({
        id: q.id,
        title: q.title,
        source: q.source,
        priority: q.priority
      }))
    };
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

module.exports = { KnowledgeHarvester };
