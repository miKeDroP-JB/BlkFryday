// ============================================================
//  CONTEXT CACHE - Map of the Territory
// ============================================================
//
//  "Do not cache the whole file content. Cache a 'Map of the
//   Territory' - a summarized version of your codebase that
//   indexes where everything is."
//
//  The Problem: Re-reading entire codebase every command
//  burns latency.
//
//  The Fix:
//  1. Cache the "Project Skeleton" (file tree, core definitions)
//  2. Index where everything is located
//  3. Only "load" full file when specifically needed
//
//  Result: Keep input tokens low and speed high
//
// ============================================================

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
//  CONFIGURATION
// ============================================================

const CACHE_CONFIG = {
  maxSummaryLength: 500,        // Max chars per file summary
  maxTreeDepth: 10,             // Max directory depth
  cacheExpiry: 300000,          // 5 minutes
  summaryTypes: ['function', 'class', 'export', 'import', 'const'],
  ignoreDirs: ['node_modules', '.git', 'dist', 'build', '.0rb_staging'],
  ignoreFiles: ['.DS_Store', 'package-lock.json', 'yarn.lock']
};

// ============================================================
//  FILE SUMMARIZER
// ============================================================

class FileSummarizer {
  constructor(config = {}) {
    this.config = { ...CACHE_CONFIG, ...config };
  }

  // Summarize a file's structure
  summarize(filePath, content) {
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath);

    const summary = {
      path: filePath,
      filename,
      extension: ext,
      lines: content.split('\n').length,
      size: Buffer.byteLength(content, 'utf8'),
      hash: this.hashContent(content),
      definitions: [],
      imports: [],
      exports: [],
      description: '',
      lastModified: Date.now()
    };

    // Extract based on file type
    switch (ext) {
      case '.js':
      case '.ts':
      case '.jsx':
      case '.tsx':
        this.extractJavaScript(content, summary);
        break;
      case '.py':
        this.extractPython(content, summary);
        break;
      case '.json':
        this.extractJson(content, summary);
        break;
      case '.md':
        this.extractMarkdown(content, summary);
        break;
      default:
        summary.description = `${ext} file with ${summary.lines} lines`;
    }

    return summary;
  }

  // Extract JavaScript/TypeScript definitions
  extractJavaScript(content, summary) {
    // Functions
    const funcMatches = content.matchAll(/(?:async\s+)?function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g);
    for (const match of funcMatches) {
      summary.definitions.push({
        type: 'function',
        name: match[1] || match[2],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Classes
    const classMatches = content.matchAll(/class\s+(\w+)(?:\s+extends\s+(\w+))?/g);
    for (const match of classMatches) {
      summary.definitions.push({
        type: 'class',
        name: match[1],
        extends: match[2] || null,
        line: this.getLineNumber(content, match.index)
      });
    }

    // Imports
    const importMatches = content.matchAll(/(?:import\s+.*?from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))/g);
    for (const match of importMatches) {
      summary.imports.push(match[1] || match[2]);
    }

    // Exports
    const exportMatches = content.matchAll(/(?:module\.exports\s*=|export\s+(?:default\s+)?(?:class|function|const)?\s*)(\w+)?/g);
    for (const match of exportMatches) {
      if (match[1]) {
        summary.exports.push(match[1]);
      }
    }

    // Generate description
    const defCount = summary.definitions.length;
    const classCount = summary.definitions.filter(d => d.type === 'class').length;
    const funcCount = defCount - classCount;

    summary.description = [
      classCount > 0 ? `${classCount} classes` : null,
      funcCount > 0 ? `${funcCount} functions` : null,
      summary.exports.length > 0 ? `exports: ${summary.exports.slice(0, 3).join(', ')}` : null
    ].filter(Boolean).join(', ') || 'JavaScript module';
  }

  // Extract Python definitions
  extractPython(content, summary) {
    // Functions
    const funcMatches = content.matchAll(/def\s+(\w+)\s*\(/g);
    for (const match of funcMatches) {
      summary.definitions.push({
        type: 'function',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Classes
    const classMatches = content.matchAll(/class\s+(\w+)(?:\((\w+)\))?:/g);
    for (const match of classMatches) {
      summary.definitions.push({
        type: 'class',
        name: match[1],
        extends: match[2] || null,
        line: this.getLineNumber(content, match.index)
      });
    }

    // Imports
    const importMatches = content.matchAll(/(?:from\s+(\S+)\s+import|import\s+(\S+))/g);
    for (const match of importMatches) {
      summary.imports.push(match[1] || match[2]);
    }

    summary.description = `Python: ${summary.definitions.length} definitions`;
  }

  // Extract JSON structure
  extractJson(content, summary) {
    try {
      const data = JSON.parse(content);
      const keys = Object.keys(data);
      summary.description = `JSON with keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`;
      summary.definitions = keys.map(k => ({ type: 'key', name: k }));
    } catch (e) {
      summary.description = 'Invalid JSON';
    }
  }

  // Extract Markdown structure
  extractMarkdown(content, summary) {
    // Headers
    const headerMatches = content.matchAll(/^(#{1,6})\s+(.+)$/gm);
    for (const match of headerMatches) {
      summary.definitions.push({
        type: 'heading',
        level: match[1].length,
        name: match[2].trim(),
        line: this.getLineNumber(content, match.index)
      });
    }

    summary.description = `Markdown: ${summary.definitions.length} sections`;
  }

  getLineNumber(content, index) {
    return content.slice(0, index).split('\n').length;
  }

  hashContent(content) {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
  }
}

// ============================================================
//  PROJECT SKELETON
// ============================================================

class ProjectSkeleton {
  constructor(rootDir, config = {}) {
    this.rootDir = rootDir;
    this.config = { ...CACHE_CONFIG, ...config };
    this.tree = {};
    this.summaries = new Map();
    this.index = {
      byType: new Map(),      // type -> [paths]
      byName: new Map(),      // name -> [paths]
      byImport: new Map(),    // import -> [paths that use it]
      byExport: new Map()     // export -> path
    };
    this.lastBuild = null;
  }

  // Build the skeleton
  async build() {
    const startTime = Date.now();
    const summarizer = new FileSummarizer(this.config);

    // Clear existing
    this.tree = { name: path.basename(this.rootDir), type: 'directory', children: [] };
    this.summaries.clear();
    this.clearIndex();

    // Walk directory
    await this.walkDir(this.rootDir, this.tree, summarizer, 0);

    this.lastBuild = Date.now();

    return {
      files: this.summaries.size,
      buildTime: Date.now() - startTime,
      indexSize: {
        types: this.index.byType.size,
        names: this.index.byName.size,
        imports: this.index.byImport.size,
        exports: this.index.byExport.size
      }
    };
  }

  // Walk directory recursively
  async walkDir(dir, treeNode, summarizer, depth) {
    if (depth > this.config.maxTreeDepth) return;

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return; // Skip unreadable directories
    }

    for (const entry of entries) {
      // Skip ignored
      if (this.config.ignoreDirs.includes(entry.name)) continue;
      if (this.config.ignoreFiles.includes(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(this.rootDir, fullPath);

      if (entry.isDirectory()) {
        const child = { name: entry.name, type: 'directory', children: [] };
        treeNode.children.push(child);
        await this.walkDir(fullPath, child, summarizer, depth + 1);
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const summary = summarizer.summarize(relativePath, content);

          // Add to tree
          treeNode.children.push({
            name: entry.name,
            type: 'file',
            summary: summary.description,
            lines: summary.lines
          });

          // Store summary
          this.summaries.set(relativePath, summary);

          // Update index
          this.updateIndex(relativePath, summary);
        } catch (e) {
          // Skip unreadable files
        }
      }
    }
  }

  // Update search index
  updateIndex(filePath, summary) {
    // Index by definition type
    for (const def of summary.definitions) {
      const typeKey = def.type;
      if (!this.index.byType.has(typeKey)) {
        this.index.byType.set(typeKey, []);
      }
      this.index.byType.get(typeKey).push({ path: filePath, name: def.name, line: def.line });

      // Index by name
      const nameKey = def.name?.toLowerCase();
      if (nameKey) {
        if (!this.index.byName.has(nameKey)) {
          this.index.byName.set(nameKey, []);
        }
        this.index.byName.get(nameKey).push({ path: filePath, type: def.type, line: def.line });
      }
    }

    // Index imports
    for (const imp of summary.imports) {
      if (!this.index.byImport.has(imp)) {
        this.index.byImport.set(imp, []);
      }
      this.index.byImport.get(imp).push(filePath);
    }

    // Index exports
    for (const exp of summary.exports) {
      this.index.byExport.set(exp, filePath);
    }
  }

  clearIndex() {
    this.index.byType.clear();
    this.index.byName.clear();
    this.index.byImport.clear();
    this.index.byExport.clear();
  }

  // Get tree as string (for context)
  getTreeString(maxDepth = 3) {
    const lines = [];
    this.treeToString(this.tree, '', 0, maxDepth, lines);
    return lines.join('\n');
  }

  treeToString(node, prefix, depth, maxDepth, lines) {
    if (depth > maxDepth) return;

    const icon = node.type === 'directory' ? '📁' : '📄';
    const info = node.summary ? ` (${node.summary})` : '';
    lines.push(`${prefix}${icon} ${node.name}${info}`);

    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const isLast = i === node.children.length - 1;
        const newPrefix = prefix + (isLast ? '  ' : '│ ');
        this.treeToString(node.children[i], newPrefix, depth + 1, maxDepth, lines);
      }
    }
  }
}

// ============================================================
//  CONTEXT CACHE (Main Class)
// ============================================================

class ContextCache extends EventEmitter {
  constructor(projectRoot, config = {}) {
    super();

    this.projectRoot = projectRoot;
    this.config = { ...CACHE_CONFIG, ...config };

    this.skeleton = new ProjectSkeleton(projectRoot, config);
    this.fullFileCache = new Map(); // path -> { content, expires }
    this.contextHistory = [];       // Recent context requests

    this.stats = {
      skeletonBuilds: 0,
      cacheHits: 0,
      cacheMisses: 0,
      fullFileLoads: 0
    };
  }

  // ============================================================
  //  INITIALIZATION
  // ============================================================

  // Build or refresh the skeleton
  async refresh() {
    const result = await this.skeleton.build();
    this.stats.skeletonBuilds++;
    this.emit('skeleton:built', result);
    return result;
  }

  // ============================================================
  //  CONTEXT RETRIEVAL
  // ============================================================

  // Get minimal context (skeleton only)
  getMinimalContext() {
    return {
      type: 'minimal',
      tree: this.skeleton.getTreeString(2),
      fileCount: this.skeleton.summaries.size,
      lastBuild: this.skeleton.lastBuild
    };
  }

  // Get focused context (skeleton + specific files)
  getFocusedContext(relevantFiles = []) {
    const files = {};

    for (const filePath of relevantFiles) {
      const summary = this.skeleton.summaries.get(filePath);
      if (summary) {
        files[filePath] = {
          summary: summary.description,
          definitions: summary.definitions.slice(0, 10),
          lines: summary.lines
        };
      }
    }

    return {
      type: 'focused',
      tree: this.skeleton.getTreeString(2),
      files,
      fileCount: this.skeleton.summaries.size
    };
  }

  // Get full file content (cached)
  getFullFile(filePath) {
    // Check cache
    const cached = this.fullFileCache.get(filePath);
    if (cached && cached.expires > Date.now()) {
      this.stats.cacheHits++;
      return cached.content;
    }

    // Load from disk
    const fullPath = path.join(this.projectRoot, filePath);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      this.stats.fullFileLoads++;
      this.stats.cacheMisses++;

      // Cache it
      this.fullFileCache.set(filePath, {
        content,
        expires: Date.now() + this.config.cacheExpiry
      });

      return content;
    } catch (e) {
      return null;
    }
  }

  // Invalidate cache for a file
  invalidate(filePath) {
    this.fullFileCache.delete(filePath);
    // Also update skeleton summary if file changed
    if (fs.existsSync(path.join(this.projectRoot, filePath))) {
      const content = fs.readFileSync(path.join(this.projectRoot, filePath), 'utf8');
      const summarizer = new FileSummarizer(this.config);
      const summary = summarizer.summarize(filePath, content);
      this.skeleton.summaries.set(filePath, summary);
    }
  }

  // ============================================================
  //  SEARCH & QUERY
  // ============================================================

  // Find files by definition name
  findByName(name) {
    const results = this.skeleton.index.byName.get(name.toLowerCase()) || [];
    return results;
  }

  // Find files by type (class, function, etc.)
  findByType(type) {
    return this.skeleton.index.byType.get(type) || [];
  }

  // Find files that import a module
  findByImport(moduleName) {
    return this.skeleton.index.byImport.get(moduleName) || [];
  }

  // Find file that exports a symbol
  findExport(exportName) {
    return this.skeleton.index.byExport.get(exportName);
  }

  // Search summaries by keyword
  search(keyword) {
    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    for (const [filePath, summary] of this.skeleton.summaries) {
      const matchScore = this.calculateMatchScore(summary, lowerKeyword);
      if (matchScore > 0) {
        results.push({ path: filePath, summary, score: matchScore });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 20);
  }

  calculateMatchScore(summary, keyword) {
    let score = 0;

    // Check filename
    if (summary.filename.toLowerCase().includes(keyword)) score += 10;

    // Check definitions
    for (const def of summary.definitions) {
      if (def.name?.toLowerCase().includes(keyword)) score += 5;
    }

    // Check description
    if (summary.description.toLowerCase().includes(keyword)) score += 2;

    // Check exports
    for (const exp of summary.exports) {
      if (exp.toLowerCase().includes(keyword)) score += 3;
    }

    return score;
  }

  // ============================================================
  //  SMART CONTEXT
  // ============================================================

  // Generate context for a specific task
  getTaskContext(task) {
    const context = {
      type: 'task',
      task: task.description || task,
      tree: this.skeleton.getTreeString(2),
      relevantFiles: [],
      suggestions: []
    };

    // Extract keywords from task
    const keywords = this.extractKeywords(task.description || task);

    // Find relevant files
    for (const keyword of keywords) {
      const matches = this.search(keyword);
      for (const match of matches.slice(0, 3)) {
        if (!context.relevantFiles.find(f => f.path === match.path)) {
          context.relevantFiles.push({
            path: match.path,
            summary: match.summary.description,
            relevance: keyword
          });
        }
      }
    }

    // Add suggestions based on task type
    if (task.type === 'create' || (task.description || '').includes('create')) {
      context.suggestions.push('Check existing similar files for patterns');
    }
    if (task.type === 'fix' || (task.description || '').includes('fix')) {
      context.suggestions.push('Load full file content for detailed analysis');
    }

    return context;
  }

  extractKeywords(text) {
    if (typeof text !== 'string') return [];

    // Extract meaningful words
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .filter(w => !['the', 'and', 'for', 'that', 'this', 'with'].includes(w));

    return [...new Set(words)];
  }

  // ============================================================
  //  STATS
  // ============================================================

  getStats() {
    return {
      ...this.stats,
      cachedFiles: this.fullFileCache.size,
      indexedFiles: this.skeleton.summaries.size,
      cacheHitRate: this.stats.cacheHits /
        Math.max(1, this.stats.cacheHits + this.stats.cacheMisses)
    };
  }
}

// ============================================================
//  EXPORTS
// ============================================================

module.exports = {
  ContextCache,
  ProjectSkeleton,
  FileSummarizer,
  CACHE_CONFIG
};
