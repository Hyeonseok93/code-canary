"""UPSERT helpers for gold.ingestion_sync (collection / silver / gold pipeline timestamps)."""

from sqlalchemy import text

VALID_SOURCES = frozenset({"NVD", "OSV"})
VALID_STATUSES = frozenset({"idle", "running", "failed"})

_UPSERT_COLLECTION = text("""
    INSERT INTO gold.ingestion_sync (
        source_type, last_collected_at, records_touched, status, updated_at
    ) VALUES (
        :source_type,
        CASE WHEN :touch_collected_at THEN CURRENT_TIMESTAMP ELSE NULL END,
        :records_touched,
        :status,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (source_type) DO UPDATE SET
        last_collected_at = CASE
            WHEN :touch_collected_at THEN EXCLUDED.last_collected_at
            ELSE gold.ingestion_sync.last_collected_at
        END,
        records_touched = CASE
            WHEN :records_touched >= 0 THEN EXCLUDED.records_touched
            ELSE gold.ingestion_sync.records_touched
        END,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
""")


def _validate_source(source_type: str) -> str:
    normalized = source_type.upper()
    if normalized not in VALID_SOURCES:
        raise ValueError(f"Unsupported source_type: {source_type}")
    return normalized


def upsert_collection_sync(
    db,
    source_type: str,
    *,
    status: str = "idle",
    records_touched: int = -1,
    touch_collected_at: bool = False,
) -> None:
    """
    Record collection lifecycle for NVD/OSV.

    - Start: touch_collected_at=True, status='running' (sets last_collected_at to collection start)
    - Success end: touch_collected_at=False, status='idle', records_touched=N
    - Failure: touch_collected_at=False, status='failed'
    """
    normalized = _validate_source(source_type)
    normalized_status = status.lower()
    if normalized_status not in VALID_STATUSES:
        raise ValueError(f"Unsupported status: {status}")

    db.execute(
        _UPSERT_COLLECTION,
        {
            "source_type": normalized,
            "touch_collected_at": touch_collected_at,
            "records_touched": records_touched,
            "status": normalized_status,
        },
    )


def mark_silver_refined(db, source_type: str) -> None:
    normalized = _validate_source(source_type)
    db.execute(
        text("""
            UPDATE gold.ingestion_sync
            SET last_silver_refined_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE source_type = :source_type
        """),
        {"source_type": normalized},
    )


def mark_gold_refreshed(db) -> None:
    db.execute(
        text("""
            UPDATE gold.ingestion_sync
            SET last_gold_refreshed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE source_type IN ('NVD', 'OSV')
        """)
    )


_GET_LAST_COLLECT_STARTED = text("""
    SELECT last_collected_at
    FROM gold.ingestion_sync
    WHERE source_type = :source_type
""")


def get_last_collect_started_at(db, source_type: str):
    """Return last collect job start time (incremental window anchor)."""
    normalized = _validate_source(source_type)
    row = db.execute(_GET_LAST_COLLECT_STARTED, {"source_type": normalized}).fetchone()
    if row is None:
        return None
    return row[0]
