"""Shared Silver refine completion checks."""

from __future__ import annotations

from sqlalchemy.sql.elements import TextClause

from code_canary_worker.utils.db_manager import SessionLocal, get_engine
from code_canary_worker.utils.ingestion_sync import mark_silver_refined


class SilverRefineIncompleteError(RuntimeError):
    def __init__(self, source_type: str, remaining: int) -> None:
        self.source_type = source_type
        self.remaining = remaining
        super().__init__(
            f"Silver refine incomplete for {source_type}: "
            f"{remaining} bronze record(s) remain PENDING/ERROR"
        )


def finalize_silver_refine(source_type: str, pending_count_query: TextClause) -> None:
    """Mark silver refined only when no bronze PENDING/ERROR rows remain."""
    with get_engine().connect() as conn:
        remaining = conn.execute(
            pending_count_query,
            {"source_type": source_type},
        ).scalar() or 0

    if remaining:
        raise SilverRefineIncompleteError(source_type, remaining)

    db = SessionLocal()
    try:
        mark_silver_refined(db, source_type)
        db.commit()
    finally:
        db.close()
