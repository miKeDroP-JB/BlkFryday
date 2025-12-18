#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██████╗  █████╗  ██████╗██╗  ██╗██╗   ██╗██████╗                        ║
 * ║   ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██║   ██║██╔══██╗                       ║
 * ║   ██████╔╝███████║██║     █████╔╝ ██║   ██║██████╔╝                       ║
 * ║   ██╔══██╗██╔══██║██║     ██╔═██╗ ██║   ██║██╔═══╝                        ║
 * ║   ██████╔╝██║  ██║╚██████╗██║  ██╗╚██████╔╝██║                            ║
 * ║   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝                            ║
 * ║                                                                           ║
 * ║   0RB BACKUP SYSTEM - Protect your knowledge                              ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node scripts/backup.js                  # Create backup
 *   node scripts/backup.js --restore <file> # Restore from backup
 *   node scripts/backup.js --list           # List available backups
 *   node scripts/backup.js --schedule       # Run scheduler daemon
 *   node scripts/backup.js --verify <file>  # Verify backup integrity
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  dataDir: process.env.ORB_DATA_DIR || path.join(process.cwd(), '.orb-data'),
  backupDir: process.env.ORB_BACKUP_DIR || path.join(process.cwd(), 'backups'),
  maxBackups: parseInt(process.env.ORB_MAX_BACKUPS) || 10,
  compressionLevel: 9,
  scheduleInterval: 6 * 60 * 60 * 1000, // 6 hours
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function log(message, type = 'info') {
  const icons = {
    info: '⟡',
    success: '✓',
    error: '✗',
    warn: '⚠'
  };
  console.log(`${icons[type] || '•'} ${message}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateChecksum(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKUP FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function createBackup() {
  log('Starting backup...');

  // Check if data directory exists
  if (!fs.existsSync(CONFIG.dataDir)) {
    log('No data directory found - nothing to backup', 'warn');
    return null;
  }

  ensureDir(CONFIG.backupDir);

  // Generate backup filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `orb-backup-${timestamp}`;
  const tarFile = path.join(CONFIG.backupDir, `${backupName}.tar.gz`);
  const metaFile = path.join(CONFIG.backupDir, `${backupName}.meta.json`);

  // Get data directory stats
  let totalSize = 0;
  let fileCount = 0;

  function countFiles(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        countFiles(fullPath);
      } else {
        totalSize += stat.size;
        fileCount++;
      }
    }
  }

  countFiles(CONFIG.dataDir);

  log(`Found ${fileCount} files (${formatBytes(totalSize)})`);

  // Create tar.gz backup
  try {
    const parentDir = path.dirname(CONFIG.dataDir);
    const dataName = path.basename(CONFIG.dataDir);

    execSync(`tar -czf "${tarFile}" -C "${parentDir}" "${dataName}"`, {
      stdio: 'pipe'
    });

    log(`Created archive: ${path.basename(tarFile)}`, 'success');
  } catch (error) {
    log(`Failed to create archive: ${error.message}`, 'error');
    return null;
  }

  // Generate metadata
  const backupStat = fs.statSync(tarFile);
  const checksum = generateChecksum(tarFile);

  const metadata = {
    version: '1.0',
    created: new Date().toISOString(),
    originalPath: CONFIG.dataDir,
    originalSize: totalSize,
    originalFiles: fileCount,
    compressedSize: backupStat.size,
    compression: 'gzip',
    checksum,
    checksumType: 'sha256'
  };

  fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2));
  log(`Compression ratio: ${((1 - backupStat.size / totalSize) * 100).toFixed(1)}%`);

  // Cleanup old backups
  await cleanupOldBackups();

  log(`Backup complete: ${backupName}`, 'success');

  return {
    file: tarFile,
    metadata
  };
}

async function restoreBackup(backupFile) {
  log(`Restoring from ${path.basename(backupFile)}...`);

  if (!fs.existsSync(backupFile)) {
    log('Backup file not found', 'error');
    return false;
  }

  // Check for metadata
  const metaFile = backupFile.replace('.tar.gz', '.meta.json');
  let metadata = null;

  if (fs.existsSync(metaFile)) {
    metadata = JSON.parse(fs.readFileSync(metaFile, 'utf8'));

    // Verify checksum
    log('Verifying checksum...');
    const currentChecksum = generateChecksum(backupFile);

    if (currentChecksum !== metadata.checksum) {
      log('Checksum mismatch - backup may be corrupted!', 'error');
      return false;
    }
    log('Checksum verified', 'success');
  } else {
    log('No metadata found - proceeding without verification', 'warn');
  }

  // Backup current data before restore
  if (fs.existsSync(CONFIG.dataDir)) {
    const currentBackup = `${CONFIG.dataDir}.pre-restore.${Date.now()}`;
    fs.renameSync(CONFIG.dataDir, currentBackup);
    log(`Current data backed up to: ${path.basename(currentBackup)}`);
  }

  // Extract backup
  try {
    const targetDir = path.dirname(CONFIG.dataDir);
    execSync(`tar -xzf "${backupFile}" -C "${targetDir}"`, {
      stdio: 'pipe'
    });

    log('Backup restored successfully', 'success');

    if (metadata) {
      log(`Restored ${metadata.originalFiles} files (${formatBytes(metadata.originalSize)})`);
    }

    return true;
  } catch (error) {
    log(`Restore failed: ${error.message}`, 'error');
    return false;
  }
}

async function listBackups() {
  if (!fs.existsSync(CONFIG.backupDir)) {
    log('No backups directory found');
    return [];
  }

  const files = fs.readdirSync(CONFIG.backupDir)
    .filter(f => f.endsWith('.tar.gz'))
    .sort()
    .reverse();

  if (files.length === 0) {
    log('No backups found');
    return [];
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    AVAILABLE BACKUPS                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const backups = [];

  for (const file of files) {
    const filePath = path.join(CONFIG.backupDir, file);
    const stat = fs.statSync(filePath);
    const metaPath = filePath.replace('.tar.gz', '.meta.json');

    let metadata = null;
    if (fs.existsSync(metaPath)) {
      metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }

    const info = {
      file,
      path: filePath,
      size: stat.size,
      created: metadata?.created || stat.mtime.toISOString(),
      originalFiles: metadata?.originalFiles || 'unknown',
      verified: metadata?.checksum ? '✓' : '?'
    };

    backups.push(info);

    console.log(`  ${info.verified} ${file}`);
    console.log(`    Size: ${formatBytes(info.size)} | Files: ${info.originalFiles}`);
    console.log(`    Created: ${info.created}\n`);
  }

  return backups;
}

async function verifyBackup(backupFile) {
  log(`Verifying ${path.basename(backupFile)}...`);

  if (!fs.existsSync(backupFile)) {
    log('Backup file not found', 'error');
    return false;
  }

  // Check metadata
  const metaFile = backupFile.replace('.tar.gz', '.meta.json');

  if (!fs.existsSync(metaFile)) {
    log('No metadata file - cannot verify', 'warn');
    return false;
  }

  const metadata = JSON.parse(fs.readFileSync(metaFile, 'utf8'));

  // Verify checksum
  log('Computing checksum...');
  const currentChecksum = generateChecksum(backupFile);

  if (currentChecksum === metadata.checksum) {
    log('Checksum verified - backup is intact', 'success');
    return true;
  } else {
    log('Checksum mismatch - backup is corrupted!', 'error');
    log(`  Expected: ${metadata.checksum}`);
    log(`  Got:      ${currentChecksum}`);
    return false;
  }
}

async function cleanupOldBackups() {
  if (!fs.existsSync(CONFIG.backupDir)) return;

  const files = fs.readdirSync(CONFIG.backupDir)
    .filter(f => f.endsWith('.tar.gz'))
    .sort()
    .reverse();

  if (files.length > CONFIG.maxBackups) {
    const toDelete = files.slice(CONFIG.maxBackups);

    for (const file of toDelete) {
      const filePath = path.join(CONFIG.backupDir, file);
      const metaPath = filePath.replace('.tar.gz', '.meta.json');

      fs.unlinkSync(filePath);
      if (fs.existsSync(metaPath)) {
        fs.unlinkSync(metaPath);
      }

      log(`Removed old backup: ${file}`);
    }
  }
}

async function runScheduler() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              BACKUP SCHEDULER - RUNNING                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  log(`Backup interval: ${CONFIG.scheduleInterval / 1000 / 60 / 60} hours`);
  log(`Max backups: ${CONFIG.maxBackups}`);
  log('Press Ctrl+C to stop\n');

  // Create initial backup
  await createBackup();

  // Schedule recurring backups
  setInterval(async () => {
    log('\n--- Scheduled backup starting ---');
    await createBackup();
  }, CONFIG.scheduleInterval);

  // Keep process running
  process.on('SIGINT', () => {
    log('\nScheduler stopped');
    process.exit(0);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);

  console.log('\n⟡ 0RB Backup System\n');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  node scripts/backup.js                  Create a new backup
  node scripts/backup.js --restore <file> Restore from backup
  node scripts/backup.js --list           List available backups
  node scripts/backup.js --schedule       Run backup scheduler
  node scripts/backup.js --verify <file>  Verify backup integrity

Environment Variables:
  ORB_DATA_DIR     Data directory (default: .orb-data)
  ORB_BACKUP_DIR   Backup directory (default: backups)
  ORB_MAX_BACKUPS  Maximum backups to keep (default: 10)
`);
    return;
  }

  if (args.includes('--list') || args.includes('-l')) {
    await listBackups();
    return;
  }

  if (args.includes('--schedule') || args.includes('-s')) {
    await runScheduler();
    return;
  }

  if (args.includes('--restore') || args.includes('-r')) {
    const idx = args.findIndex(a => a === '--restore' || a === '-r');
    const backupFile = args[idx + 1];

    if (!backupFile) {
      log('Please specify a backup file to restore', 'error');
      log('Usage: node scripts/backup.js --restore <backup-file>');
      process.exit(1);
    }

    const fullPath = path.isAbsolute(backupFile)
      ? backupFile
      : path.join(CONFIG.backupDir, backupFile);

    const success = await restoreBackup(fullPath);
    process.exit(success ? 0 : 1);
  }

  if (args.includes('--verify') || args.includes('-v')) {
    const idx = args.findIndex(a => a === '--verify' || a === '-v');
    const backupFile = args[idx + 1];

    if (!backupFile) {
      log('Please specify a backup file to verify', 'error');
      process.exit(1);
    }

    const fullPath = path.isAbsolute(backupFile)
      ? backupFile
      : path.join(CONFIG.backupDir, backupFile);

    const valid = await verifyBackup(fullPath);
    process.exit(valid ? 0 : 1);
  }

  // Default: create backup
  const result = await createBackup();
  process.exit(result ? 0 : 1);
}

main().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  process.exit(1);
});
