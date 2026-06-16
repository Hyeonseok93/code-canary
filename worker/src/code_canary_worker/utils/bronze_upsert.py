import hashlib
import json
import logging
from sqlalchemy import text
from sqlalchemy.orm import Session

BRONZE_UPSERT_SQL = text("""
    INSERT INTO bronze.raw_vulnerability_data (
        vulnerability_id,
        source_type,
        raw_content,
        content_hash,
        last_collected_at,
        processed_status
    )
    VALUES (
        :v_id,
        :source_type,
        CAST(:content AS jsonb),
        :content_hash,
        CURRENT_TIMESTAMP,
        'PENDING'
    )
    ON CONFLICT (source_type, vulnerability_id)
    DO UPDATE SET
        raw_content = EXCLUDED.raw_content,
        content_hash = EXCLUDED.content_hash,
        last_collected_at = CURRENT_TIMESTAMP,
        processed_status = 'PENDING'
""")


def canonical_json(data: dict) -> str:
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def compute_content_hash(data: dict) -> str:
    return hashlib.sha256(canonical_json(data).encode("utf-8")).hexdigest()


def load_content_hash_map(db: Session, source_type: str) -> dict[str, str]:
    rows = db.execute(
        text("""
            SELECT vulnerability_id, content_hash
            FROM bronze.raw_vulnerability_data
            WHERE source_type = :source_type
              AND content_hash IS NOT NULL
        """),
        {"source_type": source_type},
    ).fetchall()
    return {row[0]: row[1] for row in rows}


class BronzeUpserter:
    """Load diff helper: only upsert rows whose canonical content hash changed."""

    def __init__(self, db: Session, source_type: str):
        self.db = db
        self.source_type = source_type
        self.hash_map = load_content_hash_map(db, source_type)
        self.scanned = 0
        self.skipped = 0
        self.upserted = 0

    def record_unchanged(self, count: int = 1) -> None:
        self.scanned += count
        self.skipped += count

    def consider(self, vulnerability_id: str, data: dict) -> dict | None:
        self.scanned += 1
        content_hash = compute_content_hash(data)
        existing = self.hash_map.get(vulnerability_id)
        if existing is not None and existing == content_hash:
            self.skipped += 1
            return None

        self.upserted += 1
        self.hash_map[vulnerability_id] = content_hash
        return {
            "v_id": vulnerability_id,
            "source_type": self.source_type,
            "content": canonical_json(data),
            "content_hash": content_hash,
        }

    def execute_batch(self, batch: list[dict]) -> None:
        if not batch:
            return
        self.db.execute(BRONZE_UPSERT_SQL, batch)

    def commit(self) -> None:
        self.db.commit()

    def log_summary(self, logger: logging.Logger) -> None:
        logger.info(
            "Bronze load summary (%s): scanned=%s, unchanged=%s, upserted=%s",
            self.source_type,
            f"{self.scanned:,}",
            f"{self.skipped:,}",
            f"{self.upserted:,}",
        )
