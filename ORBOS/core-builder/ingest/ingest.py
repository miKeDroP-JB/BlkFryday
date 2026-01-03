#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
ORBOS CORE BUILDER - INGEST ENGINE
═══════════════════════════════════════════════════════════════════════════════
Forensic-grade ingestion of all external sources into canonical archive.

"Everything enters. Nothing is lost. All is indexed."
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import hashlib
import sqlite3
import json
import mimetypes
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Tuple

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

ORBOS_ROOT = os.environ.get("ORBOS_ROOT", "/home/user/BlkFryday/ORBOS")
ARCHIVE_PATH = os.path.join(ORBOS_ROOT, "archives")
DB_PATH = os.path.join(ORBOS_ROOT, "core-builder", "state.db")

# File types to index
INDEXABLE_EXTENSIONS = {
    # Code
    '.py', '.js', '.ts', '.jsx', '.tsx', '.rs', '.go', '.java', '.c', '.cpp', '.h',
    '.sh', '.bash', '.zsh', '.fish',
    # Config
    '.json', '.yaml', '.yml', '.toml', '.ini', '.env', '.conf',
    # Docs
    '.md', '.txt', '.rst', '.org',
    # Data
    '.csv', '.sql', '.db',
    # Web
    '.html', '.css', '.scss', '.sass',
    # Other
    '.sol', '.vy', '.move',  # Smart contracts
}

# Skip patterns
SKIP_PATTERNS = {
    'node_modules', '.git', '__pycache__', '.venv', 'venv',
    'target', 'build', 'dist', '.cache', '.npm'
}

# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE SCHEMA
# ═══════════════════════════════════════════════════════════════════════════════

SCHEMA = """
CREATE TABLE IF NOT EXISTS files (
    hash TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    name TEXT NOT NULL,
    extension TEXT,
    size INTEGER,
    timestamp TEXT,
    source TEXT,
    canonical_id TEXT,
    module_type TEXT,
    status TEXT DEFAULT 'ingested',
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_path TEXT,
    files_found INTEGER,
    files_new INTEGER,
    files_duplicate INTEGER,
    started_at TEXT,
    completed_at TEXT,
    status TEXT
);

CREATE INDEX IF NOT EXISTS idx_files_canonical ON files(canonical_id);
CREATE INDEX IF NOT EXISTS idx_files_extension ON files(extension);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
"""

# ═══════════════════════════════════════════════════════════════════════════════
# HASHER
# ═══════════════════════════════════════════════════════════════════════════════

def hash_file(path: str) -> str:
    """SHA-256 hash of file contents."""
    sha = hashlib.sha256()
    try:
        with open(path, 'rb') as f:
            while chunk := f.read(8192):
                sha.update(chunk)
        return sha.hexdigest()
    except Exception as e:
        print(f"  ⚠️  Failed to hash {path}: {e}")
        return ""

def hash_content(content: str) -> str:
    """SHA-256 hash of string content."""
    return hashlib.sha256(content.encode()).hexdigest()

# ═══════════════════════════════════════════════════════════════════════════════
# CLASSIFIER
# ═══════════════════════════════════════════════════════════════════════════════

def classify_file(path: str, extension: str) -> str:
    """Classify file into module type."""
    name = os.path.basename(path).lower()

    # Agent detection
    if 'agent' in name or 'agent' in path.lower():
        return 'agent'

    # Memory/storage
    if any(x in name for x in ['memory', 'store', 'cache', 'db']):
        return 'memory'

    # API/endpoints
    if any(x in name for x in ['api', 'route', 'endpoint', 'handler']):
        return 'api'

    # UI components
    if any(x in name for x in ['component', 'ui', 'view', 'page']):
        return 'ui'

    # Core/engine
    if any(x in name for x in ['core', 'engine', 'brain', 'solver']):
        return 'core'

    # Config
    if extension in ['.json', '.yaml', '.yml', '.toml', '.ini', '.env']:
        return 'config'

    # Docs
    if extension in ['.md', '.txt', '.rst']:
        return 'docs'

    # Smart contracts
    if extension in ['.sol', '.vy', '.move']:
        return 'contract'

    return 'module'

# ═══════════════════════════════════════════════════════════════════════════════
# INGEST ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class IngestEngine:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        self._init_db()

    def _init_db(self):
        """Initialize database connection and schema."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        self.cursor.executescript(SCHEMA)
        self.conn.commit()

    def should_skip(self, path: str) -> bool:
        """Check if path should be skipped."""
        parts = Path(path).parts
        return any(skip in parts for skip in SKIP_PATTERNS)

    def should_index(self, path: str) -> bool:
        """Check if file should be indexed."""
        ext = os.path.splitext(path)[1].lower()
        return ext in INDEXABLE_EXTENSIONS

    def ingest_path(self, source_path: str, source_name: str = None) -> Dict:
        """Ingest all files from a path."""
        source_name = source_name or os.path.basename(source_path)
        started_at = datetime.now().isoformat()

        stats = {
            'files_found': 0,
            'files_new': 0,
            'files_duplicate': 0,
            'files_skipped': 0,
            'errors': []
        }

        print(f"\n{'═'*60}")
        print(f"  📥 INGESTING: {source_path}")
        print(f"{'═'*60}\n")

        for root, dirs, files in os.walk(source_path):
            # Filter out skip directories
            dirs[:] = [d for d in dirs if d not in SKIP_PATTERNS]

            for file in files:
                path = os.path.join(root, file)

                if self.should_skip(path):
                    stats['files_skipped'] += 1
                    continue

                if not self.should_index(path):
                    stats['files_skipped'] += 1
                    continue

                stats['files_found'] += 1

                try:
                    result = self._ingest_file(path, source_name)
                    if result == 'new':
                        stats['files_new'] += 1
                    elif result == 'duplicate':
                        stats['files_duplicate'] += 1
                except Exception as e:
                    stats['errors'].append(f"{path}: {e}")

        # Log ingestion run
        self.cursor.execute("""
            INSERT INTO ingestion_runs
            (source_path, files_found, files_new, files_duplicate, started_at, completed_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            source_path,
            stats['files_found'],
            stats['files_new'],
            stats['files_duplicate'],
            started_at,
            datetime.now().isoformat(),
            'complete'
        ))
        self.conn.commit()

        print(f"\n{'─'*60}")
        print(f"  ✅ Complete: {stats['files_new']} new, {stats['files_duplicate']} duplicate")
        print(f"{'─'*60}\n")

        return stats

    def _ingest_file(self, path: str, source: str) -> str:
        """Ingest a single file."""
        file_hash = hash_file(path)
        if not file_hash:
            return 'error'

        # Check if already exists
        self.cursor.execute("SELECT hash FROM files WHERE hash = ?", (file_hash,))
        if self.cursor.fetchone():
            return 'duplicate'

        # Get file info
        name = os.path.basename(path)
        ext = os.path.splitext(name)[1].lower()
        size = os.path.getsize(path)
        timestamp = datetime.fromtimestamp(os.path.getmtime(path)).isoformat()
        module_type = classify_file(path, ext)

        # Insert
        self.cursor.execute("""
            INSERT INTO files (hash, path, name, extension, size, timestamp, source, module_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (file_hash, path, name, ext, size, timestamp, source, module_type))

        self.conn.commit()
        print(f"  + {name} [{module_type}]")
        return 'new'

    def get_stats(self) -> Dict:
        """Get ingestion statistics."""
        self.cursor.execute("SELECT COUNT(*) FROM files")
        total = self.cursor.fetchone()[0]

        self.cursor.execute("SELECT module_type, COUNT(*) FROM files GROUP BY module_type")
        by_type = dict(self.cursor.fetchall())

        self.cursor.execute("SELECT source, COUNT(*) FROM files GROUP BY source")
        by_source = dict(self.cursor.fetchall())

        return {
            'total_files': total,
            'by_type': by_type,
            'by_source': by_source
        }

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    print("""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║     ██████╗ ██████╗ ██████╗  ██████╗ ███████╗    ██╗███╗   ██╗ ██████╗       ║
║    ██╔═══██╗██╔══██╗██╔══██╗██╔═══██╗██╔════╝    ██║████╗  ██║██╔════╝       ║
║    ██║   ██║██████╔╝██████╔╝██║   ██║███████╗    ██║██╔██╗ ██║██║  ███╗      ║
║    ██║   ██║██╔══██╗██╔══██╗██║   ██║╚════██║    ██║██║╚██╗██║██║   ██║      ║
║    ╚██████╔╝██║  ██║██████╔╝╚██████╔╝███████║    ██║██║ ╚████║╚██████╔╝      ║
║     ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝    ╚═╝╚═╝  ╚═══╝ ╚═════╝       ║
║                                                                               ║
║                    CORE BUILDER - INGEST ENGINE                               ║
║              "Everything enters. Nothing is lost. All is indexed."            ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    """)

    engine = IngestEngine()

    if len(sys.argv) > 1:
        # Ingest specified path
        path = sys.argv[1]
        name = sys.argv[2] if len(sys.argv) > 2 else None
        engine.ingest_path(path, name)
    else:
        # Default: ingest archives
        if os.path.exists(ARCHIVE_PATH):
            engine.ingest_path(ARCHIVE_PATH, "archives")
        else:
            print(f"  ⚠️  No archives found at {ARCHIVE_PATH}")
            print(f"  Usage: python ingest.py <path> [source_name]")

    # Show stats
    stats = engine.get_stats()
    print(f"\n📊 Total indexed: {stats['total_files']} files")
    print(f"   By type: {json.dumps(stats['by_type'], indent=2)}")

    engine.close()


if __name__ == "__main__":
    main()
