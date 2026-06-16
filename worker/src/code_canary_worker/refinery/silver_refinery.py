"""Shared Bronze → Silver batch refine loop for NVD and OSV."""

from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.sql.elements import TextClause

from code_canary_worker.refinery.silver_finalize import finalize_silver_refine
from code_canary_worker.utils.db_manager import get_engine
from code_canary_worker.utils.progress_logger import format_completed, format_progress
from code_canary_worker.utils.silver_load_mode import resolve_initial_load

logger = logging.getLogger("CodeCanary.Refinery.Silver")

PENDING_COUNT_QUERY = text("""
    SELECT COUNT(*) FROM bronze.raw_vulnerability_data
    WHERE source_type = :source_type AND processed_status IN ('PENDING', 'ERROR')
""")

_SILVER_SOURCE_CONFIG: dict[str, tuple[str, str]] = {
    "NVD": ("silver.refine_nvd_batch", "CodeCanary.Refinery.NVD"),
    "OSV": ("silver.refine_osv_batch", "CodeCanary.Refinery.OSV"),
}


def refine_bronze_to_silver(
    *,
    source_type: str,
    batch_function: str,
    pending_count_query: TextClause,
    log: logging.Logger | None = None,
    batch_size: int = 5000,
    initial_load: bool | None = None,
) -> None:
    """Run DB-level silver refine batches until no pending bronze rows remain."""
    step_log = log or logger
    query_params = {"source_type": source_type}

    if initial_load is None:
        initial_load = resolve_initial_load(source_type)

    mode_label = "initial load (skip DELETE)" if initial_load else "reprocess (with DELETE)"
    step_log.info("Starting %s Refine: Bronze → Silver", source_type)
    step_log.info("Mode: %s | Batch size: %s", mode_label, f"{batch_size:,}")

    db_engine = get_engine()
    with db_engine.connect() as conn:
        pending_total = conn.execute(pending_count_query, query_params).scalar() or 0

    if pending_total == 0:
        step_log.info("Pending: 0 records — nothing to refine (all PROCESSED)")
        step_log.info(format_completed(0, 0, "refined"))
        return

    step_log.info("Pending: %s records (PENDING/ERROR)", f"{pending_total:,}")

    batch_sql = text(f"SELECT {batch_function}(:batch_size, :initial_load)")
    total_processed = 0

    while True:
        with db_engine.begin() as conn:
            processed = conn.execute(
                batch_sql,
                {"batch_size": batch_size, "initial_load": initial_load},
            ).scalar()

        if not processed:
            break

        total_processed += processed
        step_log.info(format_progress(total_processed, pending_total))

    step_log.info(format_completed(total_processed, pending_total, "refined"))
    finalize_silver_refine(source_type, pending_count_query)


def refine_nvd_data(batch_size: int = 5000, initial_load: bool | None = None) -> None:
    """Bronze -> Silver NVD refine (PostgreSQL silver.refine_nvd_batch)."""
    batch_function, logger_name = _SILVER_SOURCE_CONFIG["NVD"]
    refine_bronze_to_silver(
        source_type="NVD",
        batch_function=batch_function,
        pending_count_query=PENDING_COUNT_QUERY,
        log=logging.getLogger(logger_name),
        batch_size=batch_size,
        initial_load=initial_load,
    )


def refine_osv_data(batch_size: int = 5000, initial_load: bool | None = None) -> None:
    """Bronze -> Silver OSV refine (PostgreSQL silver.refine_osv_batch)."""
    batch_function, logger_name = _SILVER_SOURCE_CONFIG["OSV"]
    refine_bronze_to_silver(
        source_type="OSV",
        batch_function=batch_function,
        pending_count_query=PENDING_COUNT_QUERY,
        log=logging.getLogger(logger_name),
        batch_size=batch_size,
        initial_load=initial_load,
    )
