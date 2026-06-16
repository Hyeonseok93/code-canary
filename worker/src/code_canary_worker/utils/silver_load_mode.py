"""Resolve silver refinery initial_load from existing master-table rows."""

from __future__ import annotations

from sqlalchemy import text

from code_canary_worker.utils.db_manager import get_engine

_SILVER_MASTER_TABLES = {
    "NVD": "silver.cve_vulnerabilities",
    "OSV": "silver.osv_vulnerabilities",
}


def resolve_initial_load(source_type: str) -> bool:
    """
    True  = first silver ingest (skip child DELETE in refine_*_batch).
    False = reprocess (delete child rows for each batch before insert).
    """
    normalized = source_type.upper()
    table = _SILVER_MASTER_TABLES.get(normalized)
    if table is None:
        raise ValueError(f"Unsupported source_type: {source_type}")

    query = text(f"SELECT EXISTS (SELECT 1 FROM {table} LIMIT 1) AS has_rows")
    with get_engine().connect() as conn:
        has_rows = bool(conn.execute(query).scalar())

    return not has_rows
