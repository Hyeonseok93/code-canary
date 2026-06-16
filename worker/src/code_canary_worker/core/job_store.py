"""DB helpers for management.pipeline_jobs consumed by code_canary_worker.runner."""

from __future__ import annotations

import os

from sqlalchemy import text

_HEARTBEAT_STALE_MINUTES = int(os.getenv("WORKER_JOB_STALE_MINUTES", "10"))

_RECLAIM_STALE_RUNNING = text("""
    UPDATE management.pipeline_jobs
    SET status = 'failed',
        finished_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        error_message = :error_message
    WHERE status = 'running'
      AND COALESCE(heartbeat_at, started_at, created_at)
          < CURRENT_TIMESTAMP - (:stale_minutes * INTERVAL '1 minute')
    RETURNING id, step_key
""")

_RECLAIM_ALL_RUNNING = text("""
    UPDATE management.pipeline_jobs
    SET status = 'failed',
        finished_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        error_message = :error_message
    WHERE status = 'running'
    RETURNING id, step_key
""")

_CLAIM_NEXT_JOB = text("""
    WITH next_job AS (
        SELECT id
        FROM management.pipeline_jobs
        WHERE status = 'queued'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    UPDATE management.pipeline_jobs AS j
    SET status = 'running',
        started_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        heartbeat_at = CURRENT_TIMESTAMP,
        worker_id = :worker_id
    FROM next_job
    WHERE j.id = next_job.id
    RETURNING j.id, j.step_key, j.requested_by, j.staging_ref, j.collect_mode
""")

_TOUCH_HEARTBEAT = text("""
    UPDATE management.pipeline_jobs
    SET heartbeat_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = :job_id
      AND status = 'running'
""")

_FAIL_JOB = text("""
    UPDATE management.pipeline_jobs
    SET status = 'failed',
        finished_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        error_message = :error_message
    WHERE id = :job_id
      AND status = 'running'
""")

_COMPLETE_JOB = text("""
    UPDATE management.pipeline_jobs
    SET status = :status,
        finished_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        error_message = :error_message
    WHERE id = :job_id
""")

_APPEND_LOG = text("""
    INSERT INTO management.pipeline_job_logs (job_id, level, message)
    VALUES (:job_id, :level, :message)
""")

_IS_CANCEL_REQUESTED = text("""
    SELECT cancel_requested_at IS NOT NULL
    FROM management.pipeline_jobs
    WHERE id = :job_id
      AND status = 'running'
""")

_RESET_COLLECT_SYNC_FAILED = text("""
    UPDATE gold.ingestion_sync
    SET status = 'failed',
        updated_at = CURRENT_TIMESTAMP
    WHERE source_type = :source_type
      AND status = 'running'
""")


def reclaim_stale_running_jobs(db, *, error_message: str) -> list[tuple[int, str]]:
    rows = db.execute(
        _RECLAIM_STALE_RUNNING,
        {"error_message": error_message[:2000], "stale_minutes": _HEARTBEAT_STALE_MINUTES},
    ).fetchall()
    released: list[tuple[int, str]] = []
    for job_id, step_key in rows:
        _append_recovery_log(db, job_id, error_message)
        reset_ingestion_sync_for_step(db, step_key)
        released.append((job_id, step_key))
    if released:
        db.commit()
    else:
        db.rollback()
    return released


def reclaim_all_running_on_startup(db, *, error_message: str) -> list[tuple[int, str]]:
    rows = db.execute(_RECLAIM_ALL_RUNNING, {"error_message": error_message[:2000]}).fetchall()
    released: list[tuple[int, str]] = []
    for job_id, step_key in rows:
        _append_recovery_log(db, job_id, error_message)
        reset_ingestion_sync_for_step(db, step_key)
        released.append((job_id, step_key))
    if released:
        db.commit()
    else:
        db.rollback()
    return released


def claim_next_job(db, *, worker_id: str):
    row = db.execute(_CLAIM_NEXT_JOB, {"worker_id": worker_id}).fetchone()
    if row is None:
        db.rollback()
        return None
    db.commit()
    return {
        "id": row[0],
        "step_key": row[1],
        "requested_by": row[2],
        "staging_ref": row[3],
        "collect_mode": row[4],
    }


def touch_heartbeat(db, job_id: int) -> None:
    db.execute(_TOUCH_HEARTBEAT, {"job_id": job_id})
    db.commit()


def fail_running_job(db, job_id: int, *, error_message: str) -> bool:
    result = db.execute(
        _FAIL_JOB,
        {"job_id": job_id, "error_message": error_message[:2000]},
    )
    updated = result.rowcount > 0
    if updated:
        db.commit()
    else:
        db.rollback()
    return updated


def complete_job(db, job_id: int, *, success: bool, error_message: str | None = None) -> None:
    db.execute(
        _COMPLETE_JOB,
        {
            "job_id": job_id,
            "status": "success" if success else "failed",
            "error_message": error_message,
        },
    )
    db.commit()


def append_log(db, job_id: int, level: str, message: str) -> None:
    normalized_level = level.lower()
    if normalized_level not in {"info", "warn", "error", "success"}:
        normalized_level = "info"
    db.execute(
        _APPEND_LOG,
        {"job_id": job_id, "level": normalized_level, "message": message[:4000]},
    )
    db.commit()


def _append_recovery_log(db, job_id: int, message: str) -> None:
    db.execute(
        _APPEND_LOG,
        {"job_id": job_id, "level": "error", "message": message[:4000]},
    )


def is_cancel_requested(db, job_id: int) -> bool:
    row = db.execute(_IS_CANCEL_REQUESTED, {"job_id": job_id}).fetchone()
    return bool(row and row[0])


def reset_ingestion_sync_for_step(db, step_key: str) -> None:
    source_type = _source_type_for_collect_step(step_key)
    if source_type is None:
        return
    db.execute(_RESET_COLLECT_SYNC_FAILED, {"source_type": source_type})


def _source_type_for_collect_step(step_key: str) -> str | None:
    if step_key == "nvd-collect":
        return "NVD"
    if step_key == "osv-collect":
        return "OSV"
    return None
