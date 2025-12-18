// ============================================================
//  AIRLOCK PROTOCOL - Safe File Staging System
// ============================================================
//
//  "The agent is only allowed to download or generate files
//   into a strict staging folder."
//
//  Prevents file scattering by containing all agent outputs
//  in a controlled staging area with schema validation.
//
//  Components:
//  1. Staging Directory - All agent outputs go here first
//  2. Manifest Validation - Agent must declare what it's doing
//  3. Schema Check - Files must pass validation before moving
//  4. Janitor Script - Non-AI cleanup and organization
//
// ============================================================

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
//  CONFIGURATION
// ============================================================

const AIRLOCK_CONFIG = {
  stagingDir: '.0rb_staging',
  manifestFile: 'manifest.json',
  quarantineDir: '.0rb_quarantine',
  maxFileSize: 10 * 1024 * 1024,  // 10MB max per file
  allowedExtensions: [
    '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt',
    '.css', '.scss', '.html', '.yaml', '.yml', '.env',
    '.py', '.go', '.rs', '.sh', '.sql'
  ],
  forbiddenPaths: [
    '../', '..\\',           // Path traversal
    '/etc/', '/usr/',        // System directories
    'node_modules/',         // Dependencies
    '.git/',                 // Git internals
    '.env'                   // Secrets (unless explicitly allowed)
  ],
  requiredManifestFields: ['agent', 'action', 'files', 'timestamp']
};

// ============================================================
//  FILE VALIDATOR
// ============================================================

class FileValidator {
  constructor(config = {}) {
    this.config = { ...AIRLOCK_CONFIG, ...config };
  }

  // Validate a single file
  validate(filePath, content) {
    const errors = [];
    const warnings = [];

    // Check extension
    const ext = path.extname(filePath).toLowerCase();
    if (!this.config.allowedExtensions.includes(ext)) {
      errors.push(`Forbidden extension: ${ext}`);
    }

    // Check for path traversal
    for (const forbidden of this.config.forbiddenPaths) {
      if (filePath.includes(forbidden)) {
        errors.push(`Forbidden path pattern: ${forbidden}`);
      }
    }

    // Check file size
    const size = Buffer.byteLength(content, 'utf8');
    if (size > this.config.maxFileSize) {
      errors.push(`File too large: ${size} bytes (max: ${this.config.maxFileSize})`);
    }

    // Check for suspicious patterns
    const suspicious = this.checkSuspiciousPatterns(content);
    if (suspicious.length > 0) {
      warnings.push(...suspicious.map(s => `Suspicious pattern: ${s}`));
    }

    // Check filename sanity
    const filename = path.basename(filePath);
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      warnings.push(`Unusual filename characters: ${filename}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        extension: ext,
        size,
        hash: this.hashContent(content)
      }
    };
  }

  // Check for suspicious patterns in content
  checkSuspiciousPatterns(content) {
    const patterns = [];

    // Eval and dangerous functions
    if (/\beval\s*\(/.test(content)) patterns.push('eval()');
    if (/\bFunction\s*\(/.test(content)) patterns.push('Function()');
    if (/child_process/.test(content)) patterns.push('child_process');

    // Credential patterns
    if (/password\s*[:=]\s*['"][^'"]+['"]/i.test(content)) patterns.push('hardcoded password');
    if (/api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i.test(content)) patterns.push('hardcoded API key');

    // Potential injection
    if (/exec\s*\(/.test(content)) patterns.push('exec()');
    if (/spawn\s*\(/.test(content)) patterns.push('spawn()');

    return patterns;
  }

  hashContent(content) {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }
}

// ============================================================
//  MANIFEST HANDLER
// ============================================================

class ManifestHandler {
  constructor(config = {}) {
    this.config = { ...AIRLOCK_CONFIG, ...config };
  }

  // Create a new manifest
  create(agentId, action, files) {
    return {
      version: '1.0',
      agent: agentId,
      action,
      files: files.map(f => ({
        path: f.path,
        type: f.type || 'create',
        hash: f.hash,
        size: f.size
      })),
      timestamp: Date.now(),
      id: `manifest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    };
  }

  // Validate a manifest
  validate(manifest) {
    const errors = [];

    // Check required fields
    for (const field of this.config.requiredManifestFields) {
      if (!manifest[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check files array
    if (!Array.isArray(manifest.files)) {
      errors.push('Files must be an array');
    } else if (manifest.files.length === 0) {
      errors.push('Manifest has no files');
    }

    // Check timestamp is recent (within 1 hour)
    if (manifest.timestamp) {
      const age = Date.now() - manifest.timestamp;
      if (age > 3600000) {
        errors.push('Manifest is too old (>1 hour)');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Compare manifest to actual staged files
  compareToStaged(manifest, stagedFiles) {
    const mismatches = [];

    const manifestPaths = new Set(manifest.files.map(f => f.path));
    const stagedPaths = new Set(stagedFiles.map(f => f.path));

    // Files in manifest but not staged
    for (const p of manifestPaths) {
      if (!stagedPaths.has(p)) {
        mismatches.push({ type: 'missing', path: p, message: 'In manifest but not staged' });
      }
    }

    // Files staged but not in manifest
    for (const p of stagedPaths) {
      if (!manifestPaths.has(p)) {
        mismatches.push({ type: 'extra', path: p, message: 'Staged but not in manifest' });
      }
    }

    // Hash mismatches
    for (const mFile of manifest.files) {
      const staged = stagedFiles.find(s => s.path === mFile.path);
      if (staged && mFile.hash && staged.hash !== mFile.hash) {
        mismatches.push({
          type: 'hash_mismatch',
          path: mFile.path,
          message: `Hash mismatch: expected ${mFile.hash}, got ${staged.hash}`
        });
      }
    }

    return {
      match: mismatches.length === 0,
      mismatches
    };
  }
}

// ============================================================
//  JANITOR - Non-AI Cleanup Script
// ============================================================

class Janitor {
  constructor(projectRoot, config = {}) {
    this.projectRoot = projectRoot;
    this.config = { ...AIRLOCK_CONFIG, ...config };
    this.stagingPath = path.join(projectRoot, this.config.stagingDir);
    this.quarantinePath = path.join(projectRoot, this.config.quarantineDir);
  }

  // Initialize staging directories
  init() {
    if (!fs.existsSync(this.stagingPath)) {
      fs.mkdirSync(this.stagingPath, { recursive: true });
    }
    if (!fs.existsSync(this.quarantinePath)) {
      fs.mkdirSync(this.quarantinePath, { recursive: true });
    }
    return this;
  }

  // List all files in staging
  listStaged() {
    if (!fs.existsSync(this.stagingPath)) return [];

    const files = [];
    const walk = (dir, prefix = '') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(prefix, entry.name);

        if (entry.isDirectory()) {
          walk(fullPath, relativePath);
        } else if (entry.name !== this.config.manifestFile) {
          const content = fs.readFileSync(fullPath, 'utf8');
          files.push({
            path: relativePath,
            fullPath,
            size: Buffer.byteLength(content, 'utf8'),
            hash: crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)
          });
        }
      }
    };

    walk(this.stagingPath);
    return files;
  }

  // Move file from staging to destination
  promote(stagedPath, destPath) {
    const srcFull = path.join(this.stagingPath, stagedPath);
    const destFull = path.join(this.projectRoot, destPath);

    // Ensure destination directory exists
    fs.mkdirSync(path.dirname(destFull), { recursive: true });

    // Move file
    fs.renameSync(srcFull, destFull);

    return destFull;
  }

  // Move file to quarantine
  quarantine(stagedPath, reason) {
    const srcFull = path.join(this.stagingPath, stagedPath);
    const destFull = path.join(this.quarantinePath, `${Date.now()}_${path.basename(stagedPath)}`);

    fs.renameSync(srcFull, destFull);

    // Log reason
    fs.writeFileSync(
      destFull + '.reason.json',
      JSON.stringify({ path: stagedPath, reason, timestamp: Date.now() }, null, 2)
    );

    return destFull;
  }

  // Clean up old quarantine files (>7 days)
  cleanQuarantine(maxAgeDays = 7) {
    if (!fs.existsSync(this.quarantinePath)) return 0;

    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let cleaned = 0;

    const files = fs.readdirSync(this.quarantinePath);
    for (const file of files) {
      const fullPath = path.join(this.quarantinePath, file);
      const stat = fs.statSync(fullPath);
      if (now - stat.mtimeMs > maxAge) {
        fs.unlinkSync(fullPath);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Clear staging directory
  clearStaging() {
    if (!fs.existsSync(this.stagingPath)) return 0;

    let cleared = 0;
    const walk = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
          fs.rmdirSync(fullPath);
        } else {
          fs.unlinkSync(fullPath);
          cleared++;
        }
      }
    };

    walk(this.stagingPath);
    return cleared;
  }
}

// ============================================================
//  AIRLOCK (Main Class)
// ============================================================

class Airlock extends EventEmitter {
  constructor(projectRoot, config = {}) {
    super();

    this.projectRoot = projectRoot;
    this.config = { ...AIRLOCK_CONFIG, ...config };

    this.validator = new FileValidator(this.config);
    this.manifestHandler = new ManifestHandler(this.config);
    this.janitor = new Janitor(projectRoot, this.config).init();

    this.stats = {
      filesStaged: 0,
      filesPromoted: 0,
      filesQuarantined: 0,
      manifestsProcessed: 0
    };

    console.log(`[Airlock] Initialized at ${this.janitor.stagingPath}`);
  }

  // ============================================================
  //  STAGING OPERATIONS
  // ============================================================

  // Stage a file (agent writes here)
  stageFile(relativePath, content, agentId = 'unknown') {
    // Validate first
    const validation = this.validator.validate(relativePath, content);

    if (!validation.valid) {
      this.emit('validation:failed', { path: relativePath, errors: validation.errors });
      return { success: false, errors: validation.errors };
    }

    // Write to staging
    const stagePath = path.join(this.janitor.stagingPath, relativePath);
    fs.mkdirSync(path.dirname(stagePath), { recursive: true });
    fs.writeFileSync(stagePath, content);

    this.stats.filesStaged++;
    this.emit('file:staged', {
      path: relativePath,
      agent: agentId,
      metadata: validation.metadata
    });

    return {
      success: true,
      warnings: validation.warnings,
      metadata: validation.metadata
    };
  }

  // Stage multiple files with manifest
  stageBatch(files, agentId, action) {
    const results = {
      staged: [],
      failed: [],
      manifest: null
    };

    // Stage each file
    for (const file of files) {
      const result = this.stageFile(file.path, file.content, agentId);
      if (result.success) {
        results.staged.push({
          path: file.path,
          hash: result.metadata.hash,
          size: result.metadata.size
        });
      } else {
        results.failed.push({ path: file.path, errors: result.errors });
      }
    }

    // Create manifest
    if (results.staged.length > 0) {
      results.manifest = this.manifestHandler.create(agentId, action, results.staged);

      // Write manifest
      fs.writeFileSync(
        path.join(this.janitor.stagingPath, this.config.manifestFile),
        JSON.stringify(results.manifest, null, 2)
      );
    }

    return results;
  }

  // ============================================================
  //  PROMOTION (Move to main directory)
  // ============================================================

  // Promote all staged files after validation
  promoteAll(manifest = null) {
    // Load manifest if not provided
    if (!manifest) {
      const manifestPath = path.join(this.janitor.stagingPath, this.config.manifestFile);
      if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      }
    }

    // Validate manifest
    if (manifest) {
      const manifestValidation = this.manifestHandler.validate(manifest);
      if (!manifestValidation.valid) {
        return { success: false, errors: manifestValidation.errors };
      }
    }

    // Get staged files
    const stagedFiles = this.janitor.listStaged();

    // Compare to manifest if present
    if (manifest) {
      const comparison = this.manifestHandler.compareToStaged(manifest, stagedFiles);
      if (!comparison.match) {
        // Quarantine mismatched files
        for (const mismatch of comparison.mismatches.filter(m => m.type === 'extra')) {
          this.janitor.quarantine(mismatch.path, 'Not in manifest');
          this.stats.filesQuarantined++;
        }

        if (comparison.mismatches.some(m => m.type === 'missing' || m.type === 'hash_mismatch')) {
          return {
            success: false,
            errors: comparison.mismatches.map(m => m.message)
          };
        }
      }
    }

    // Promote each file
    const promoted = [];
    for (const file of stagedFiles) {
      const destPath = file.path;
      try {
        this.janitor.promote(file.path, destPath);
        promoted.push(destPath);
        this.stats.filesPromoted++;
      } catch (e) {
        this.janitor.quarantine(file.path, e.message);
        this.stats.filesQuarantined++;
      }
    }

    // Clean up manifest
    const manifestPath = path.join(this.janitor.stagingPath, this.config.manifestFile);
    if (fs.existsSync(manifestPath)) {
      fs.unlinkSync(manifestPath);
    }

    this.stats.manifestsProcessed++;
    this.emit('batch:promoted', { files: promoted });

    return { success: true, promoted };
  }

  // ============================================================
  //  INSPECTION
  // ============================================================

  // Get current staging status
  getStatus() {
    return {
      staged: this.janitor.listStaged(),
      stats: this.stats,
      stagingPath: this.janitor.stagingPath
    };
  }

  // Clear staging (abort current batch)
  abort(reason = 'Manual abort') {
    const staged = this.janitor.listStaged();

    for (const file of staged) {
      this.janitor.quarantine(file.path, reason);
      this.stats.filesQuarantined++;
    }

    this.janitor.clearStaging();
    this.emit('batch:aborted', { reason, files: staged.length });

    return { aborted: staged.length };
  }
}

// ============================================================
//  EXPORTS
// ============================================================

module.exports = {
  Airlock,
  FileValidator,
  ManifestHandler,
  Janitor,
  AIRLOCK_CONFIG
};
