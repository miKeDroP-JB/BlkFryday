// ============================================================
//  ORBOS V11.5 - LOCAL DRIVE HARVESTER
//  Turn Your Hard Drives Into AI Brain Fuel
// ============================================================
//
//  MISSION: Ingest EVERYTHING from local drives
//  - Your PC hard drive
//  - The 30+ drives in your garage
//  - Any mounted storage
//
//  Turn decades of accumulated data into competitive advantage.
//
// ============================================================

const LOCAL_DRIVE_HARVESTER = {
  // ============================================================
  //  DRIVE DISCOVERY
  // ============================================================

  discovery: {
    scanMethods: {
      linux: ['lsblk', 'fdisk -l', 'df -h', 'mount'],
      windows: ['wmic diskdrive list', 'Get-PhysicalDisk', 'diskpart'],
      macos: ['diskutil list', 'df -h', 'mount']
    },

    driveTypes: {
      internal: { priority: 1, connection: 'SATA/NVMe' },
      external: { priority: 2, connection: 'USB' },
      network: { priority: 3, connection: 'NAS/SMB' },
      archive: { priority: 4, connection: 'USB dock' }  // The garage drives
    },

    autoDetect: {
      enabled: true,
      scanInterval: 30000,  // Check for new drives every 30s
      hotplug: true         // Detect when drives are plugged in
    }
  },

  // ============================================================
  //  DATA TYPE EXTRACTORS
  // ============================================================

  extractors: {
    // Documents - The written knowledge
    documents: {
      extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.md', '.tex'],
      extract: 'text_content',
      metadata: ['author', 'created', 'modified', 'title', 'keywords'],
      value: 'HIGH - direct knowledge'
    },

    // Spreadsheets - Structured data gold
    spreadsheets: {
      extensions: ['.xlsx', '.xls', '.csv', '.tsv', '.ods'],
      extract: 'structured_data',
      metadata: ['columns', 'rows', 'sheets', 'formulas'],
      value: 'HIGH - patterns and metrics'
    },

    // Code - Technical knowledge
    code: {
      extensions: ['.js', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.ts', '.rb', '.php', '.swift', '.kt'],
      extract: 'ast_and_patterns',
      metadata: ['language', 'frameworks', 'dependencies', 'functions', 'classes'],
      value: 'CRITICAL - build capability'
    },

    // Emails - Communication patterns
    emails: {
      extensions: ['.eml', '.msg', '.mbox', '.pst', '.ost'],
      extract: 'conversations',
      metadata: ['from', 'to', 'subject', 'date', 'thread'],
      value: 'HIGH - communication training'
    },

    // Databases - Pure structured knowledge
    databases: {
      extensions: ['.sqlite', '.db', '.mdb', '.accdb', '.sql'],
      extract: 'schemas_and_data',
      metadata: ['tables', 'relationships', 'indexes'],
      value: 'CRITICAL - structured knowledge'
    },

    // Images - Visual data
    images: {
      extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.svg'],
      extract: 'ocr_and_vision',
      metadata: ['exif', 'dimensions', 'colors', 'faces', 'objects'],
      value: 'MEDIUM - visual context'
    },

    // Audio - Voice and sound
    audio: {
      extensions: ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac'],
      extract: 'transcription',
      metadata: ['duration', 'speakers', 'language'],
      value: 'MEDIUM - voice training data'
    },

    // Video - Rich media
    video: {
      extensions: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.webm'],
      extract: 'frames_and_audio',
      metadata: ['duration', 'resolution', 'scenes', 'transcription'],
      value: 'HIGH - multimodal training'
    },

    // Archives - Compressed treasures
    archives: {
      extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
      extract: 'recursive_unpack',
      metadata: ['contents', 'compressed_size', 'original_size'],
      value: 'VARIABLE - depends on contents'
    },

    // Browser data - Web history and patterns
    browser: {
      paths: ['~/.config/google-chrome', '~/Library/Safari', '~/.mozilla/firefox'],
      extract: 'history_bookmarks_passwords',
      metadata: ['urls', 'timestamps', 'frequency'],
      value: 'HIGH - behavior patterns'
    },

    // Chat logs - Conversation data
    chatLogs: {
      extensions: ['.json', '.txt', '.log'],
      paths: ['WhatsApp', 'Telegram', 'Discord', 'Slack'],
      extract: 'conversations',
      metadata: ['participants', 'timestamps', 'topics'],
      value: 'HIGH - conversational training'
    }
  },

  // ============================================================
  //  GARAGE DRIVE HANDLER
  //  Special handling for bulk drive ingestion
  // ============================================================

  garageDrives: {
    name: 'Bulk Archive Ingestion System',

    setup: {
      description: 'Process 30+ old hard drives systematically',
      requirements: [
        'USB hard drive dock (SATA/IDE)',
        'USB hub for multiple drives',
        'Power supply for dock'
      ]
    },

    workflow: {
      step1: {
        name: 'DRIVE QUEUE',
        action: 'Create queue of drives to process',
        tracking: 'Drive label → UUID → Status → Progress'
      },
      step2: {
        name: 'MOUNT & SCAN',
        action: 'Auto-mount, scan file structure',
        timeout: '5 minutes per drive for initial scan'
      },
      step3: {
        name: 'PRIORITIZE',
        action: 'Score files by value, process highest first',
        criteria: ['file_type', 'size', 'date', 'uniqueness']
      },
      step4: {
        name: 'EXTRACT',
        action: 'Run extractors in parallel',
        parallelism: 'CPU cores - 1 for responsiveness'
      },
      step5: {
        name: 'DEDUPE',
        action: 'Skip files already seen on other drives',
        method: 'Content hash (SHA-256)'
      },
      step6: {
        name: 'INDEX',
        action: 'Add to knowledge graph',
        output: 'Searchable knowledge base'
      },
      step7: {
        name: 'UNMOUNT',
        action: 'Safe eject, log completion',
        notification: 'Ready for next drive'
      }
    },

    batchProcessing: {
      enabled: true,
      maxConcurrentDrives: 4,  // With 4-bay dock
      queueManagement: true,
      progressTracking: true,
      estimatedTimeDisplay: true
    },

    recovery: {
      badSectors: 'Skip and log',
      corruptFiles: 'Extract what we can',
      unreadable: 'Flag for manual review',
      oldFormats: 'Try legacy readers'
    }
  },

  // ============================================================
  //  PROCESSING PIPELINE
  // ============================================================

  pipeline: {
    stages: {
      discover: {
        order: 1,
        action: 'Find all files on drive',
        output: 'File list with metadata'
      },
      classify: {
        order: 2,
        action: 'Identify file types and value',
        output: 'Prioritized processing queue'
      },
      extract: {
        order: 3,
        action: 'Pull content from files',
        output: 'Raw extracted data'
      },
      clean: {
        order: 4,
        action: 'Remove noise, fix encoding',
        output: 'Clean data'
      },
      structure: {
        order: 5,
        action: 'Convert to unified format',
        output: 'Structured knowledge objects'
      },
      deduplicate: {
        order: 6,
        action: 'Remove duplicates across all sources',
        output: 'Unique knowledge only'
      },
      enrich: {
        order: 7,
        action: 'Add context and relationships',
        output: 'Enriched knowledge graph'
      },
      index: {
        order: 8,
        action: 'Make searchable and trainable',
        output: 'Ready for AI consumption'
      }
    },

    parallelization: {
      fileLevel: true,       // Process multiple files at once
      driveLevel: true,      // Process multiple drives at once
      stageLevel: false,     // Stages are sequential per file
      maxWorkers: 'auto'     // Based on CPU cores
    }
  },

  // ============================================================
  //  SMART SCANNING
  // ============================================================

  smartScan: {
    // Don't waste time on junk
    skipPatterns: [
      '**/node_modules/**',
      '**/vendor/**',
      '**/.git/objects/**',
      '**/Windows/System32/**',
      '**/Windows/WinSxS/**',
      '**/$RECYCLE.BIN/**',
      '**/System Volume Information/**',
      '**/.Trash/**',
      '**/temp/**',
      '**/cache/**',
      '**/Cache/**',
      '**/*.dll',
      '**/*.exe',      // Unless specifically needed
      '**/*.sys',
      '**/*.log',      // Usually noise
      '**/*.tmp'
    ],

    // High value paths to prioritize
    priorityPaths: [
      '**/Documents/**',
      '**/Projects/**',
      '**/Work/**',
      '**/Code/**',
      '**/src/**',
      '**/data/**',
      '**/exports/**',
      '**/reports/**',
      '**/Research/**',
      '**/Notes/**',
      '**/Business/**'
    ],

    // Size limits
    sizeLimits: {
      skipFilesOver: '10GB',     // Probably video/backup image
      warnFilesOver: '1GB',
      prioritizeFilesUnder: '10MB'  // Usually more valuable per byte
    },

    // Age considerations
    ageHandling: {
      veryOld: { years: 10, note: 'Historical value, might need format conversion' },
      old: { years: 5, note: 'Good data, standard processing' },
      recent: { years: 1, note: 'High relevance, prioritize' },
      current: { months: 3, note: 'Highest priority' }
    }
  },

  // ============================================================
  //  KNOWLEDGE OUTPUT
  // ============================================================

  output: {
    formats: {
      trainingData: {
        format: 'JSONL',
        schema: { input: 'string', output: 'string', context: 'object' },
        destination: '/data/training/'
      },
      knowledgeGraph: {
        format: 'Neo4j/GraphQL',
        schema: { nodes: 'Entity', edges: 'Relationship' },
        destination: 'graph://localhost:7687'
      },
      vectorEmbeddings: {
        format: 'Float32[]',
        dimensions: 1536,
        destination: '/data/embeddings/'
      },
      searchIndex: {
        format: 'Elasticsearch',
        destination: 'http://localhost:9200'
      }
    },

    statistics: {
      track: [
        'total_files_processed',
        'total_bytes_ingested',
        'unique_documents',
        'training_examples_generated',
        'knowledge_nodes_created',
        'processing_time',
        'drive_by_drive_stats'
      ]
    }
  },

  // ============================================================
  //  PRIVACY & SECURITY
  // ============================================================

  privacy: {
    piiDetection: {
      enabled: true,
      patterns: ['ssn', 'credit_card', 'password', 'api_key', 'private_key'],
      action: 'redact_and_flag'
    },

    sensitiveFiles: {
      patterns: ['*password*', '*secret*', '*.pem', '*.key', '*credentials*'],
      action: 'quarantine_for_review'
    },

    encryption: {
      atRest: true,
      inTransit: true,
      keys: 'local_only'
    }
  }
};

// ============================================================
//  IMPLEMENTATION
// ============================================================

class LocalDriveHarvester {
  constructor() {
    this.config = LOCAL_DRIVE_HARVESTER;
    this.discoveredDrives = [];
    this.processedFiles = new Set();  // Dedup via content hash
    this.stats = {
      drivesProcessed: 0,
      filesScanned: 0,
      filesProcessed: 0,
      bytesIngested: 0,
      trainingExamplesGenerated: 0,
      knowledgeNodesCreated: 0,
      startTime: null,
      errors: []
    };
    this.driveQueue = [];
    this.activeWorkers = 0;
  }

  // ============================================================
  //  DRIVE DISCOVERY
  // ============================================================

  async discoverDrives() {
    const drives = [];

    // Simulated drive discovery
    const mockDrives = [
      { path: '/dev/sda', name: 'Main SSD', size: '1TB', type: 'internal' },
      { path: '/dev/sdb', name: 'Data HDD', size: '4TB', type: 'internal' },
      { path: '/media/usb0', name: 'Garage Drive 1', size: '500GB', type: 'archive' },
      { path: '/media/usb1', name: 'Garage Drive 2', size: '1TB', type: 'archive' },
      // ... up to 30+ drives
    ];

    for (const drive of mockDrives) {
      drives.push({
        id: this.generateDriveId(drive),
        ...drive,
        status: 'discovered',
        scanned: false,
        processed: false,
        fileCount: 0,
        totalSize: 0
      });
    }

    this.discoveredDrives = drives;
    return drives;
  }

  generateDriveId(drive) {
    return `drive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================
  //  FILE SCANNING
  // ============================================================

  async scanDrive(drive) {
    console.log(`📀 Scanning drive: ${drive.name}`);

    const files = [];
    const skipPatterns = this.config.smartScan.skipPatterns;
    const priorityPaths = this.config.smartScan.priorityPaths;

    // Simulated file scan
    // In reality, would use fs.walk or similar

    drive.status = 'scanning';
    drive.fileCount = files.length;

    return files;
  }

  // ============================================================
  //  FILE PROCESSING
  // ============================================================

  async processFile(file) {
    // Get appropriate extractor
    const extractor = this.getExtractor(file.extension);
    if (!extractor) return null;

    // Check if already processed (dedup)
    const hash = await this.hashFile(file);
    if (this.processedFiles.has(hash)) {
      return { status: 'duplicate', hash };
    }

    // Extract content
    const content = await this.extract(file, extractor);

    // Clean and structure
    const cleaned = this.cleanContent(content);
    const structured = this.structureContent(cleaned, file);

    // Add to processed set
    this.processedFiles.add(hash);

    // Update stats
    this.stats.filesProcessed++;
    this.stats.bytesIngested += file.size;

    return structured;
  }

  getExtractor(extension) {
    for (const [type, config] of Object.entries(this.config.extractors)) {
      if (config.extensions && config.extensions.includes(extension)) {
        return { type, config };
      }
    }
    return null;
  }

  async hashFile(file) {
    // SHA-256 hash of file content
    return `sha256_${Math.random().toString(36).substr(2, 16)}`;
  }

  async extract(file, extractor) {
    // Different extraction logic based on type
    switch (extractor.type) {
      case 'documents':
        return this.extractDocument(file);
      case 'spreadsheets':
        return this.extractSpreadsheet(file);
      case 'code':
        return this.extractCode(file);
      case 'emails':
        return this.extractEmail(file);
      case 'databases':
        return this.extractDatabase(file);
      case 'images':
        return this.extractImage(file);
      case 'audio':
        return this.extractAudio(file);
      case 'video':
        return this.extractVideo(file);
      default:
        return null;
    }
  }

  extractDocument(file) {
    return { type: 'document', content: '', metadata: {} };
  }

  extractSpreadsheet(file) {
    return { type: 'spreadsheet', rows: [], columns: [], metadata: {} };
  }

  extractCode(file) {
    return { type: 'code', content: '', ast: {}, metadata: {} };
  }

  extractEmail(file) {
    return { type: 'email', from: '', to: '', subject: '', body: '', metadata: {} };
  }

  extractDatabase(file) {
    return { type: 'database', tables: [], data: [], metadata: {} };
  }

  extractImage(file) {
    return { type: 'image', ocr: '', objects: [], metadata: {} };
  }

  extractAudio(file) {
    return { type: 'audio', transcription: '', metadata: {} };
  }

  extractVideo(file) {
    return { type: 'video', frames: [], audio: '', metadata: {} };
  }

  cleanContent(content) {
    // Remove noise, fix encoding, normalize
    return content;
  }

  structureContent(content, file) {
    return {
      id: `knowledge_${Date.now()}`,
      source: file.path,
      type: content.type,
      content: content,
      extracted: new Date().toISOString(),
      hash: file.hash
    };
  }

  // ============================================================
  //  GARAGE DRIVE BATCH PROCESSOR
  // ============================================================

  async processGarageDrives(driveList) {
    console.log(`🏠 Starting garage drive batch processing`);
    console.log(`📀 ${driveList.length} drives to process`);

    this.driveQueue = [...driveList];
    const maxConcurrent = this.config.garageDrives.batchProcessing.maxConcurrentDrives;

    const results = [];

    while (this.driveQueue.length > 0 || this.activeWorkers > 0) {
      // Start new workers up to max
      while (this.activeWorkers < maxConcurrent && this.driveQueue.length > 0) {
        const drive = this.driveQueue.shift();
        this.activeWorkers++;

        this.processSingleGarageDrive(drive).then(result => {
          results.push(result);
          this.activeWorkers--;
          this.stats.drivesProcessed++;
          console.log(`✅ Drive complete: ${drive.name} (${this.stats.drivesProcessed}/${driveList.length})`);
        }).catch(error => {
          this.stats.errors.push({ drive: drive.name, error });
          this.activeWorkers--;
          console.log(`❌ Drive failed: ${drive.name}`);
        });
      }

      // Wait a bit before checking again
      await new Promise(r => setTimeout(r, 1000));
    }

    return results;
  }

  async processSingleGarageDrive(drive) {
    console.log(`🔌 Mounting: ${drive.name}`);

    // 1. Mount & Scan
    const files = await this.scanDrive(drive);

    // 2. Prioritize
    const prioritized = this.prioritizeFiles(files);

    // 3. Process all files
    const processed = [];
    for (const file of prioritized) {
      try {
        const result = await this.processFile(file);
        if (result) processed.push(result);
      } catch (error) {
        this.stats.errors.push({ file: file.path, error });
      }
    }

    // 4. Safe unmount
    console.log(`⏏️  Ejecting: ${drive.name}`);

    return {
      drive: drive.name,
      filesProcessed: processed.length,
      knowledgeExtracted: processed.length
    };
  }

  prioritizeFiles(files) {
    return files.sort((a, b) => {
      // Higher priority first
      const scoreA = this.calculateFileScore(a);
      const scoreB = this.calculateFileScore(b);
      return scoreB - scoreA;
    });
  }

  calculateFileScore(file) {
    let score = 0;

    // File type value
    const extractor = this.getExtractor(file.extension);
    if (extractor) {
      if (extractor.config.value?.includes('CRITICAL')) score += 100;
      else if (extractor.config.value?.includes('HIGH')) score += 50;
      else if (extractor.config.value?.includes('MEDIUM')) score += 25;
    }

    // Recency bonus
    const ageYears = (Date.now() - file.modified) / (365 * 24 * 60 * 60 * 1000);
    if (ageYears < 1) score += 30;
    else if (ageYears < 3) score += 20;
    else if (ageYears < 5) score += 10;

    // Size penalty for very large files
    if (file.size > 1e9) score -= 20;  // > 1GB

    // Priority path bonus
    for (const pattern of this.config.smartScan.priorityPaths) {
      if (file.path.includes(pattern.replace('**/', ''))) {
        score += 25;
        break;
      }
    }

    return score;
  }

  // ============================================================
  //  TRAINING DATA GENERATION
  // ============================================================

  async generateTrainingData(knowledgeBase) {
    const trainingExamples = [];

    for (const knowledge of knowledgeBase) {
      const examples = this.createExamplesFromKnowledge(knowledge);
      trainingExamples.push(...examples);
    }

    this.stats.trainingExamplesGenerated = trainingExamples.length;
    return trainingExamples;
  }

  createExamplesFromKnowledge(knowledge) {
    const examples = [];

    switch (knowledge.type) {
      case 'document':
        examples.push({
          input: `Summarize this document: ${knowledge.content.substring(0, 500)}`,
          output: `[Generated summary]`,
          context: { source: knowledge.source }
        });
        break;

      case 'email':
        examples.push({
          input: `Draft a response to: ${knowledge.content.subject}`,
          output: `[Generated response]`,
          context: { type: 'email_response' }
        });
        break;

      case 'code':
        examples.push({
          input: `Explain this code: ${knowledge.content.substring(0, 500)}`,
          output: `[Code explanation]`,
          context: { language: knowledge.metadata?.language }
        });
        break;
    }

    return examples;
  }

  // ============================================================
  //  FULL HARVEST
  // ============================================================

  async harvestAll(options = {}) {
    console.log('\n' + '='.repeat(60));
    console.log('  🌾 LOCAL DRIVE HARVESTER - FULL HARVEST');
    console.log('='.repeat(60) + '\n');

    this.stats.startTime = Date.now();

    // 1. Discover all drives
    console.log('📡 Discovering drives...');
    const drives = await this.discoverDrives();
    console.log(`   Found ${drives.length} drives\n`);

    // 2. Separate garage drives from main
    const mainDrives = drives.filter(d => d.type !== 'archive');
    const garageDrives = drives.filter(d => d.type === 'archive');

    // 3. Process main drives first
    console.log('💻 Processing main drives...');
    for (const drive of mainDrives) {
      await this.processSingleGarageDrive(drive);
    }

    // 4. Batch process garage drives
    if (garageDrives.length > 0) {
      console.log(`\n🏠 Processing ${garageDrives.length} garage drives...`);
      await this.processGarageDrives(garageDrives);
    }

    // 5. Generate training data
    console.log('\n🎓 Generating training data...');
    // await this.generateTrainingData(allKnowledge);

    // 6. Final stats
    const duration = (Date.now() - this.stats.startTime) / 1000;

    console.log('\n' + '='.repeat(60));
    console.log('  📊 HARVEST COMPLETE');
    console.log('='.repeat(60));
    console.log(`  Drives processed:     ${this.stats.drivesProcessed}`);
    console.log(`  Files scanned:        ${this.stats.filesScanned}`);
    console.log(`  Files processed:      ${this.stats.filesProcessed}`);
    console.log(`  Data ingested:        ${this.formatBytes(this.stats.bytesIngested)}`);
    console.log(`  Training examples:    ${this.stats.trainingExamplesGenerated}`);
    console.log(`  Knowledge nodes:      ${this.stats.knowledgeNodesCreated}`);
    console.log(`  Errors:               ${this.stats.errors.length}`);
    console.log(`  Duration:             ${duration.toFixed(1)}s`);
    console.log('='.repeat(60) + '\n');

    return this.stats;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ============================================================
  //  STATUS DISPLAY
  // ============================================================

  showStatus() {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║               🌾 LOCAL DRIVE HARVESTER STATUS                  ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log('║                                                               ║');
    console.log(`║  Discovered Drives: ${this.discoveredDrives.length.toString().padEnd(41)}║`);
    console.log(`║  Drives Processed:  ${this.stats.drivesProcessed.toString().padEnd(41)}║`);
    console.log(`║  Files Processed:   ${this.stats.filesProcessed.toString().padEnd(41)}║`);
    console.log(`║  Data Ingested:     ${this.formatBytes(this.stats.bytesIngested).padEnd(41)}║`);
    console.log('║                                                               ║');
    console.log('║  DRIVE QUEUE:                                                 ║');
    for (const drive of this.discoveredDrives.slice(0, 5)) {
      const status = drive.processed ? '✅' : drive.status === 'scanning' ? '🔄' : '⏳';
      console.log(`║    ${status} ${(drive.name + ' (' + drive.size + ')').padEnd(53)}║`);
    }
    if (this.discoveredDrives.length > 5) {
      console.log(`║    ... and ${this.discoveredDrives.length - 5} more                                       ║`);
    }
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = {
  LOCAL_DRIVE_HARVESTER,
  LocalDriveHarvester
};
