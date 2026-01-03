#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
ORBOS REVENUE ENGINE - CRYPTO RAIL INFRASTRUCTURE
═══════════════════════════════════════════════════════════════════════════════
Proof-of-attribution, automated payments, transparent revenue tracking.

"Every action tracked. Every contribution rewarded. Everybody Eats."
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import hashlib
import json
import sqlite3
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import uuid

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

ORBOS_ROOT = os.environ.get("ORBOS_ROOT", "/home/user/BlkFryday/ORBOS")
DB_PATH = os.path.join(ORBOS_ROOT, "orb-core", "revenue-engine", "revenue.db")

# Revenue split configuration
REVENUE_SPLITS = {
    'architect': 0.40,      # JB - 40%
    'agents': 0.25,         # Agent pool - 25%
    'treasury': 0.20,       # ORBOS treasury - 20%
    'contributors': 0.10,   # Community contributors - 10%
    'reserve': 0.05,        # Emergency reserve - 5%
}

# ═══════════════════════════════════════════════════════════════════════════════
# DATA TYPES
# ═══════════════════════════════════════════════════════════════════════════════

class TransactionType(Enum):
    REVENUE = "revenue"          # Incoming revenue
    PAYOUT = "payout"            # Outgoing payment
    ATTRIBUTION = "attribution"  # Attribution record
    SPLIT = "split"              # Revenue split
    CONVERSION = "conversion"    # LP conversion

class AttributionType(Enum):
    DIRECT = "direct"           # Direct sale/conversion
    REFERRAL = "referral"       # Referred by another user
    AFFILIATE = "affiliate"     # Affiliate link
    ORGANIC = "organic"         # Organic (no attribution)
    AGENT = "agent"             # Agent-generated

@dataclass
class Attribution:
    """Proof-of-attribution record."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    source_id: str = ""          # Who/what generated this
    source_type: AttributionType = AttributionType.ORGANIC
    target_id: str = ""          # What was converted (LP, sale, etc)
    amount: float = 0.0
    currency: str = "USD"
    timestamp: float = field(default_factory=time.time)
    metadata: Dict = field(default_factory=dict)
    tx_hash: str = ""

    def __post_init__(self):
        if not self.tx_hash:
            self.tx_hash = self._compute_hash()

    def _compute_hash(self) -> str:
        """Compute immutable transaction hash."""
        record = f"{self.id}-{self.source_id}-{self.target_id}-{self.amount}-{self.timestamp}"
        return hashlib.sha256(record.encode()).hexdigest()

@dataclass
class RevenueEvent:
    """Incoming revenue event."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    amount: float = 0.0
    currency: str = "USD"
    source: str = ""             # Where revenue came from
    product_id: str = ""         # What product/service
    attribution: Optional[Attribution] = None
    timestamp: float = field(default_factory=time.time)
    splits: Dict[str, float] = field(default_factory=dict)
    tx_hash: str = ""

    def __post_init__(self):
        if not self.splits:
            self.splits = self._compute_splits()
        if not self.tx_hash:
            self.tx_hash = self._compute_hash()

    def _compute_splits(self) -> Dict[str, float]:
        """Compute revenue splits."""
        return {k: self.amount * v for k, v in REVENUE_SPLITS.items()}

    def _compute_hash(self) -> str:
        record = f"{self.id}-{self.amount}-{self.source}-{self.timestamp}"
        return hashlib.sha256(record.encode()).hexdigest()

# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE SCHEMA
# ═══════════════════════════════════════════════════════════════════════════════

SCHEMA = """
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    source TEXT,
    target TEXT,
    tx_hash TEXT UNIQUE,
    timestamp REAL,
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attributions (
    id TEXT PRIMARY KEY,
    source_id TEXT,
    source_type TEXT,
    target_id TEXT,
    amount REAL,
    currency TEXT DEFAULT 'USD',
    tx_hash TEXT UNIQUE,
    timestamp REAL,
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS balances (
    account TEXT PRIMARY KEY,
    balance REAL DEFAULT 0,
    pending REAL DEFAULT 0,
    total_earned REAL DEFAULT 0,
    total_paid REAL DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payouts (
    id TEXT PRIMARY KEY,
    account TEXT,
    amount REAL,
    currency TEXT DEFAULT 'USD',
    method TEXT,
    status TEXT DEFAULT 'pending',
    tx_hash TEXT,
    timestamp REAL,
    completed_at REAL,
    metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_attr_source ON attributions(source_id);
CREATE INDEX IF NOT EXISTS idx_attr_target ON attributions(target_id);
"""

# ═══════════════════════════════════════════════════════════════════════════════
# REVENUE ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class RevenueEngine:
    """
    Core revenue tracking and distribution engine.
    Implements proof-of-attribution and automated splits.
    """

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        self._init_db()

    def _init_db(self):
        """Initialize database."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
        self.cursor.executescript(SCHEMA)

        # Initialize default accounts
        for account in REVENUE_SPLITS.keys():
            self.cursor.execute(
                "INSERT OR IGNORE INTO balances (account) VALUES (?)",
                (account,)
            )
        self.conn.commit()

    # ─────────────────────────────────────────────────────────────────────────
    # ATTRIBUTION
    # ─────────────────────────────────────────────────────────────────────────

    def track_attribution(self, attribution: Attribution) -> str:
        """Record attribution for proof-of-action."""
        self.cursor.execute("""
            INSERT INTO attributions
            (id, source_id, source_type, target_id, amount, currency, tx_hash, timestamp, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            attribution.id,
            attribution.source_id,
            attribution.source_type.value,
            attribution.target_id,
            attribution.amount,
            attribution.currency,
            attribution.tx_hash,
            attribution.timestamp,
            json.dumps(attribution.metadata)
        ))
        self.conn.commit()

        print(f"  📝 Attribution tracked: {attribution.tx_hash[:16]}...")
        return attribution.tx_hash

    def get_attributions(self, source_id: str = None, target_id: str = None) -> List[Dict]:
        """Get attributions by source or target."""
        query = "SELECT * FROM attributions WHERE 1=1"
        params = []

        if source_id:
            query += " AND source_id = ?"
            params.append(source_id)
        if target_id:
            query += " AND target_id = ?"
            params.append(target_id)

        query += " ORDER BY timestamp DESC"
        self.cursor.execute(query, params)
        return [dict(row) for row in self.cursor.fetchall()]

    # ─────────────────────────────────────────────────────────────────────────
    # REVENUE
    # ─────────────────────────────────────────────────────────────────────────

    def record_revenue(self, event: RevenueEvent) -> str:
        """Record incoming revenue and process splits."""

        # Record main transaction
        self.cursor.execute("""
            INSERT INTO transactions
            (id, type, amount, currency, source, target, tx_hash, timestamp, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event.id,
            TransactionType.REVENUE.value,
            event.amount,
            event.currency,
            event.source,
            event.product_id,
            event.tx_hash,
            event.timestamp,
            json.dumps({'splits': event.splits})
        ))

        # Process splits and update balances
        for account, amount in event.splits.items():
            self._credit_account(account, amount)

            # Record split transaction
            split_id = str(uuid.uuid4())
            self.cursor.execute("""
                INSERT INTO transactions
                (id, type, amount, currency, source, target, tx_hash, timestamp, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                split_id,
                TransactionType.SPLIT.value,
                amount,
                event.currency,
                event.id,
                account,
                hashlib.sha256(f"{split_id}-{amount}".encode()).hexdigest(),
                event.timestamp,
                json.dumps({'parent_tx': event.tx_hash})
            ))

        self.conn.commit()

        print(f"  💰 Revenue recorded: ${event.amount:.2f} from {event.source}")
        for account, amount in event.splits.items():
            print(f"     → {account}: ${amount:.2f}")

        return event.tx_hash

    def _credit_account(self, account: str, amount: float):
        """Credit an account balance."""
        self.cursor.execute("""
            UPDATE balances
            SET balance = balance + ?,
                total_earned = total_earned + ?,
                updated_at = ?
            WHERE account = ?
        """, (amount, amount, datetime.now().isoformat(), account))

    # ─────────────────────────────────────────────────────────────────────────
    # PAYOUTS
    # ─────────────────────────────────────────────────────────────────────────

    def request_payout(self, account: str, amount: float, method: str = "crypto") -> Optional[str]:
        """Request a payout from account balance."""
        # Check balance
        self.cursor.execute("SELECT balance FROM balances WHERE account = ?", (account,))
        row = self.cursor.fetchone()

        if not row or row['balance'] < amount:
            print(f"  ❌ Insufficient balance for {account}")
            return None

        # Create payout request
        payout_id = str(uuid.uuid4())
        tx_hash = hashlib.sha256(f"{payout_id}-{amount}-{time.time()}".encode()).hexdigest()

        self.cursor.execute("""
            INSERT INTO payouts
            (id, account, amount, currency, method, status, tx_hash, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (payout_id, account, amount, 'USD', method, 'pending', tx_hash, time.time()))

        # Update balance (move to pending)
        self.cursor.execute("""
            UPDATE balances
            SET balance = balance - ?,
                pending = pending + ?,
                updated_at = ?
            WHERE account = ?
        """, (amount, amount, datetime.now().isoformat(), account))

        self.conn.commit()

        print(f"  📤 Payout requested: ${amount:.2f} for {account}")
        return payout_id

    def complete_payout(self, payout_id: str) -> bool:
        """Mark a payout as completed."""
        self.cursor.execute("""
            UPDATE payouts
            SET status = 'completed', completed_at = ?
            WHERE id = ?
        """, (time.time(), payout_id))

        if self.cursor.rowcount == 0:
            return False

        # Get payout details
        self.cursor.execute("SELECT account, amount FROM payouts WHERE id = ?", (payout_id,))
        row = self.cursor.fetchone()

        if row:
            # Update balance
            self.cursor.execute("""
                UPDATE balances
                SET pending = pending - ?,
                    total_paid = total_paid + ?,
                    updated_at = ?
                WHERE account = ?
            """, (row['amount'], row['amount'], datetime.now().isoformat(), row['account']))

        self.conn.commit()
        print(f"  ✅ Payout completed: {payout_id}")
        return True

    # ─────────────────────────────────────────────────────────────────────────
    # REPORTING
    # ─────────────────────────────────────────────────────────────────────────

    def get_balances(self) -> Dict[str, Dict]:
        """Get all account balances."""
        self.cursor.execute("SELECT * FROM balances")
        return {row['account']: dict(row) for row in self.cursor.fetchall()}

    def get_summary(self, days: int = 30) -> Dict:
        """Get revenue summary for period."""
        cutoff = time.time() - (days * 24 * 60 * 60)

        # Total revenue
        self.cursor.execute("""
            SELECT SUM(amount) as total
            FROM transactions
            WHERE type = 'revenue' AND timestamp > ?
        """, (cutoff,))
        total_revenue = self.cursor.fetchone()['total'] or 0

        # By source
        self.cursor.execute("""
            SELECT source, SUM(amount) as total
            FROM transactions
            WHERE type = 'revenue' AND timestamp > ?
            GROUP BY source
        """, (cutoff,))
        by_source = {row['source']: row['total'] for row in self.cursor.fetchall()}

        # Conversion count
        self.cursor.execute("""
            SELECT COUNT(*) as count
            FROM attributions
            WHERE timestamp > ?
        """, (cutoff,))
        conversions = self.cursor.fetchone()['count']

        return {
            'period_days': days,
            'total_revenue': total_revenue,
            'by_source': by_source,
            'conversions': conversions,
            'avg_per_conversion': total_revenue / conversions if conversions > 0 else 0
        }

    def close(self):
        if self.conn:
            self.conn.close()


# ═══════════════════════════════════════════════════════════════════════════════
# CONVERSION TRACKER
# ═══════════════════════════════════════════════════════════════════════════════

class ConversionTracker:
    """Tracks conversions from LPs, calls, and other touchpoints."""

    def __init__(self, engine: RevenueEngine):
        self.engine = engine

    def track_lp_conversion(self, user_id: str, lp_id: str, amount: float,
                            referrer_id: str = None) -> str:
        """Track a landing page conversion."""

        # Create attribution
        attr_type = AttributionType.REFERRAL if referrer_id else AttributionType.DIRECT
        attribution = Attribution(
            source_id=referrer_id or user_id,
            source_type=attr_type,
            target_id=lp_id,
            amount=amount,
            metadata={'user_id': user_id, 'lp_id': lp_id}
        )

        # Track attribution
        self.engine.track_attribution(attribution)

        # Record revenue
        event = RevenueEvent(
            amount=amount,
            source='landing_page',
            product_id=lp_id,
            attribution=attribution
        )

        return self.engine.record_revenue(event)

    def track_agent_conversion(self, agent_id: str, action: str, amount: float) -> str:
        """Track an agent-generated conversion."""
        attribution = Attribution(
            source_id=agent_id,
            source_type=AttributionType.AGENT,
            target_id=action,
            amount=amount,
            metadata={'agent': agent_id, 'action': action}
        )

        self.engine.track_attribution(attribution)

        event = RevenueEvent(
            amount=amount,
            source='agent',
            product_id=action,
            attribution=attribution
        )

        return self.engine.record_revenue(event)


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    print("""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║    ██████╗ ███████╗██╗   ██╗███████╗███╗   ██╗██╗   ██╗███████╗              ║
║    ██╔══██╗██╔════╝██║   ██║██╔════╝████╗  ██║██║   ██║██╔════╝              ║
║    ██████╔╝█████╗  ██║   ██║█████╗  ██╔██╗ ██║██║   ██║█████╗                ║
║    ██╔══██╗██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║██║   ██║██╔══╝                ║
║    ██║  ██║███████╗ ╚████╔╝ ███████╗██║ ╚████║╚██████╔╝███████╗              ║
║    ╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝              ║
║                                                                               ║
║                    CRYPTO RAIL - REVENUE ENGINE                               ║
║          "Every action tracked. Every contribution rewarded."                 ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    """)

    engine = RevenueEngine()
    tracker = ConversionTracker(engine)

    print("\n  📌 Demo: Simulating revenue events\n")

    # Simulate conversions
    tracker.track_lp_conversion("user_001", "lp_landing_main", 97.00)
    tracker.track_lp_conversion("user_002", "lp_coaching", 497.00, referrer_id="affiliate_x")
    tracker.track_agent_conversion("agent_apollo", "freelance_gig", 150.00)
    tracker.track_agent_conversion("agent_mercury", "outreach_close", 500.00)

    # Show balances
    print("\n  📊 Current Balances:")
    balances = engine.get_balances()
    for account, data in balances.items():
        print(f"     {account}: ${data['balance']:.2f} (earned: ${data['total_earned']:.2f})")

    # Show summary
    print("\n  📈 30-Day Summary:")
    summary = engine.get_summary(30)
    print(f"     Total Revenue: ${summary['total_revenue']:.2f}")
    print(f"     Conversions: {summary['conversions']}")
    print(f"     Avg/Conversion: ${summary['avg_per_conversion']:.2f}")

    engine.close()


if __name__ == "__main__":
    main()
