#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
ORBOS CORE BUILDER - CANONICALIZATION ENGINE
═══════════════════════════════════════════════════════════════════════════════
Assigns canonical IDs, detects collisions, determines strongest implementation.

"One truth. One ID. One source of authority."
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import sqlite3
import json
import re
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from collections import defaultdict

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

ORBOS_ROOT = os.environ.get("ORBOS_ROOT", "/home/user/BlkFryday/ORBOS")
DB_PATH = os.path.join(ORBOS_ROOT, "core-builder", "state.db")

# Canonical ID prefixes by module type
ID_PREFIXES = {
    'agent': 'ORB-AGT',
    'core': 'ORB-COR',
    'memory': 'ORB-MEM',
    'api': 'ORB-API',
    'ui': 'ORB-UI',
    'config': 'ORB-CFG',
    'docs': 'ORB-DOC',
    'contract': 'ORB-CTR',
    'module': 'ORB-MOD',
}

# ═══════════════════════════════════════════════════════════════════════════════
# SIMILARITY DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

def normalize_name(name: str) -> str:
    """Normalize filename for comparison."""
    # Remove extension
    name = os.path.splitext(name)[0]
    # Lowercase
    name = name.lower()
    # Remove common prefixes/suffixes
    for pattern in ['_v\\d+', '-v\\d+', '\\.v\\d+', '_test', '_spec', '\\.test', '\\.spec']:
        name = re.sub(pattern, '', name)
    # Normalize separators
    name = re.sub(r'[-_.]', '', name)
    return name

def similarity_score(name1: str, name2: str) -> float:
    """Calculate similarity between two normalized names."""
    n1 = normalize_name(name1)
    n2 = normalize_name(name2)

    if n1 == n2:
        return 1.0

    # Jaccard similarity on character n-grams
    def ngrams(s, n=3):
        return set(s[i:i+n] for i in range(len(s) - n + 1))

    g1 = ngrams(n1)
    g2 = ngrams(n2)

    if not g1 or not g2:
        return 0.0

    intersection = len(g1 & g2)
    union = len(g1 | g2)

    return intersection / union if union > 0 else 0.0

# ═══════════════════════════════════════════════════════════════════════════════
# STRENGTH ANALYZER
# ═══════════════════════════════════════════════════════════════════════════════

def analyze_strength(file_info: Dict) -> float:
    """
    Analyze implementation strength based on multiple factors.
    Returns score 0.0-1.0 where higher = stronger implementation.
    """
    score = 0.0

    # Size bonus (larger files often more complete)
    size = file_info.get('size', 0)
    if size > 10000:
        score += 0.3
    elif size > 5000:
        score += 0.2
    elif size > 1000:
        score += 0.1

    # Recency bonus (newer = likely more refined)
    timestamp = file_info.get('timestamp', '')
    if timestamp:
        try:
            dt = datetime.fromisoformat(timestamp)
            age_days = (datetime.now() - dt).days
            if age_days < 7:
                score += 0.3
            elif age_days < 30:
                score += 0.2
            elif age_days < 90:
                score += 0.1
        except:
            pass

    # Source priority (some sources more authoritative)
    source = file_info.get('source', '')
    if 'orb-core' in source.lower():
        score += 0.2
    elif '0r8-starter' in source.lower():
        score += 0.15
    elif 'system' in source.lower():
        score += 0.1

    # Extension bonus
    ext = file_info.get('extension', '')
    if ext in ['.rs', '.ts']:  # Typed languages
        score += 0.1
    elif ext == '.py':
        score += 0.05

    return min(1.0, score)

# ═══════════════════════════════════════════════════════════════════════════════
# CANONICALIZER
# ═══════════════════════════════════════════════════════════════════════════════

class Canonicalizer:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()

        # Ensure canonical columns exist
        try:
            self.cursor.execute("ALTER TABLE files ADD COLUMN strength REAL DEFAULT 0")
        except:
            pass
        try:
            self.cursor.execute("ALTER TABLE files ADD COLUMN collision_group TEXT")
        except:
            pass
        try:
            self.cursor.execute("ALTER TABLE files ADD COLUMN is_canonical INTEGER DEFAULT 0")
        except:
            pass
        self.conn.commit()

    def assign_canonical_ids(self) -> Dict:
        """Assign canonical IDs to all files."""
        print("\n📋 Assigning canonical IDs...")

        stats = {'total': 0, 'assigned': 0}

        # Get files without canonical IDs, ordered by timestamp
        self.cursor.execute("""
            SELECT hash, name, module_type, size, timestamp, source, extension
            FROM files
            WHERE canonical_id IS NULL
            ORDER BY timestamp
        """)

        files = self.cursor.fetchall()
        stats['total'] = len(files)

        # Track ID counters per type
        counters = defaultdict(int)

        for f in files:
            module_type = f['module_type'] or 'module'
            prefix = ID_PREFIXES.get(module_type, 'ORB-MOD')

            # Get current count for this type
            self.cursor.execute(
                "SELECT COUNT(*) FROM files WHERE canonical_id LIKE ?",
                (f"{prefix}%",)
            )
            count = self.cursor.fetchone()[0]

            canonical_id = f"{prefix}-{count:06d}"

            # Calculate strength
            strength = analyze_strength(dict(f))

            # Update file
            self.cursor.execute("""
                UPDATE files
                SET canonical_id = ?, strength = ?
                WHERE hash = ?
            """, (canonical_id, strength, f['hash']))

            stats['assigned'] += 1

        self.conn.commit()
        print(f"  ✅ Assigned {stats['assigned']} canonical IDs")
        return stats

    def detect_collisions(self, threshold: float = 0.7) -> List[Dict]:
        """Detect potential duplicate/collision files."""
        print(f"\n🔍 Detecting collisions (threshold: {threshold})...")

        # Get all files
        self.cursor.execute("""
            SELECT hash, name, canonical_id, module_type, strength
            FROM files
        """)
        files = [dict(f) for f in self.cursor.fetchall()]

        collisions = []
        processed = set()
        group_id = 0

        for i, f1 in enumerate(files):
            if f1['hash'] in processed:
                continue

            group = [f1]
            processed.add(f1['hash'])

            for f2 in files[i+1:]:
                if f2['hash'] in processed:
                    continue

                # Same module type?
                if f1['module_type'] != f2['module_type']:
                    continue

                # Calculate similarity
                sim = similarity_score(f1['name'], f2['name'])

                if sim >= threshold:
                    group.append(f2)
                    processed.add(f2['hash'])

            if len(group) > 1:
                group_id += 1
                collision = {
                    'group_id': f"COLLISION-{group_id:04d}",
                    'files': group,
                    'count': len(group)
                }
                collisions.append(collision)

                # Update collision group in DB
                for f in group:
                    self.cursor.execute(
                        "UPDATE files SET collision_group = ? WHERE hash = ?",
                        (collision['group_id'], f['hash'])
                    )

        self.conn.commit()
        print(f"  ⚠️  Found {len(collisions)} collision groups")
        return collisions

    def resolve_collisions(self) -> Dict:
        """Resolve collisions by selecting strongest implementation."""
        print("\n⚡ Resolving collisions...")

        stats = {'groups': 0, 'resolved': 0}

        # Get collision groups
        self.cursor.execute("""
            SELECT DISTINCT collision_group
            FROM files
            WHERE collision_group IS NOT NULL
        """)

        groups = [g[0] for g in self.cursor.fetchall()]
        stats['groups'] = len(groups)

        for group_id in groups:
            # Get files in group
            self.cursor.execute("""
                SELECT hash, name, canonical_id, strength
                FROM files
                WHERE collision_group = ?
                ORDER BY strength DESC
            """, (group_id,))

            files = self.cursor.fetchall()

            if files:
                # Mark strongest as canonical
                strongest = files[0]
                self.cursor.execute(
                    "UPDATE files SET is_canonical = 1, status = 'canonical' WHERE hash = ?",
                    (strongest['hash'],)
                )

                # Mark others as superseded
                for f in files[1:]:
                    self.cursor.execute(
                        "UPDATE files SET is_canonical = 0, status = 'superseded' WHERE hash = ?",
                        (f['hash'],)
                    )

                stats['resolved'] += 1
                print(f"  ✓ {group_id}: {strongest['name']} (strength: {strongest['strength']:.2f})")

        self.conn.commit()
        print(f"  ✅ Resolved {stats['resolved']} collision groups")
        return stats

    def get_canonical_modules(self) -> List[Dict]:
        """Get all canonical (authoritative) modules."""
        self.cursor.execute("""
            SELECT canonical_id, name, module_type, path, strength
            FROM files
            WHERE is_canonical = 1 OR collision_group IS NULL
            ORDER BY module_type, canonical_id
        """)

        return [dict(f) for f in self.cursor.fetchall()]

    def export_manifest(self, output_path: str = None) -> str:
        """Export canonical manifest as JSON."""
        modules = self.get_canonical_modules()

        manifest = {
            'version': '1.0.0',
            'generated_at': datetime.now().isoformat(),
            'total_modules': len(modules),
            'modules': modules
        }

        output_path = output_path or os.path.join(ORBOS_ROOT, "core-builder", "canonical_manifest.json")

        with open(output_path, 'w') as f:
            json.dump(manifest, f, indent=2)

        print(f"\n📄 Manifest exported to: {output_path}")
        return output_path

    def close(self):
        if self.conn:
            self.conn.close()


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    print("""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║     ██████╗ █████╗ ███╗   ██╗ ██████╗ ███╗   ██╗██╗ ██████╗ █████╗ ██╗       ║
║    ██╔════╝██╔══██╗████╗  ██║██╔═══██╗████╗  ██║██║██╔════╝██╔══██╗██║       ║
║    ██║     ███████║██╔██╗ ██║██║   ██║██╔██╗ ██║██║██║     ███████║██║       ║
║    ██║     ██╔══██║██║╚██╗██║██║   ██║██║╚██╗██║██║██║     ██╔══██║██║       ║
║    ╚██████╗██║  ██║██║ ╚████║╚██████╔╝██║ ╚████║██║╚██████╗██║  ██║███████╗  ║
║     ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝  ║
║                                                                               ║
║                    CORE BUILDER - CANONICALIZATION                            ║
║              "One truth. One ID. One source of authority."                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    """)

    canon = Canonicalizer()

    # Step 1: Assign IDs
    canon.assign_canonical_ids()

    # Step 2: Detect collisions
    collisions = canon.detect_collisions()

    # Step 3: Resolve collisions
    if collisions:
        canon.resolve_collisions()

    # Step 4: Export manifest
    canon.export_manifest()

    # Summary
    modules = canon.get_canonical_modules()
    print(f"\n📊 Canonical modules: {len(modules)}")

    # Group by type
    by_type = defaultdict(int)
    for m in modules:
        by_type[m['module_type']] += 1

    for t, count in sorted(by_type.items()):
        print(f"   {t}: {count}")

    canon.close()


if __name__ == "__main__":
    main()
