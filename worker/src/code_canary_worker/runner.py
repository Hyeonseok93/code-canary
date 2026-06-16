"""
Poll management.pipeline_jobs and execute pipeline steps.

Docker (default): worker service runs `code-canary-worker` via local compose / docker-up.
Local: from repo root, `pip install -e worker` then `code-canary-worker` or `code-canary-cli`.
"""

from __future__ import annotations

import logging
import os
import signal
import socket
import threading
import time

from code_canary_worker.core.job_errors import public_job_error_message
from code_canary_worker.core.job_store import (
    append_log,
    claim_next_job,
    complete_job,
    fail_running_job,
    is_cancel_requested,
    reclaim_all_running_on_startup,
    reclaim_stale_running_jobs,
    reset_ingestion_sync_for_step,
    touch_heartbeat,
)
from code_canary_worker.core.tasks import run_step
from code_canary_worker.utils.db_manager import SessionLocal
from code_canary_worker.utils.job_cancellation import (
    JobCancelledError,
    begin_job_cancellation_watch,
    end_job_cancellation_watch,
    signal_job_cancelled,
)
from code_canary_worker.utils.log_sanitize import exc_type_name

POLL_SECONDS = float(os.getenv("WORKER_POLL_SECONDS", "5"))
HEARTBEAT_SECONDS = float(os.getenv("WORKER_HEARTBEAT_SECONDS", "60"))
STARTUP_RECLAIM_MESSAGE = "Worker restarted; job marked failed (startup recovery)."
STALE_RECLAIM_MESSAGE = "Worker heartbeat lost; job marked failed (stale recovery)."
SHUTDOWN_RECLAIM_MESSAGE = "Worker shutting down; job marked failed (graceful shutdown)."
STOP_JOB_MESSAGE = "Stopped by operator."

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("CodeCanary.Runner")

_current_job: dict | None = None
_worker_id = os.getenv("WORKER_ID") or f"{socket.gethostname()}-{os.getpid()}"


def _startup_recovery() -> None:
    db = SessionLocal()
    try:
        released = reclaim_all_running_on_startup(db, error_message=STARTUP_RECLAIM_MESSAGE)
        if released:
            ids = ", ".join(f"#{job_id}" for job_id, _ in released)
            logger.warning("Startup recovery failed %s running job(s): %s", len(released), ids)
    finally:
        db.close()


def _stale_recovery() -> None:
    db = SessionLocal()
    try:
        reclaimed = reclaim_stale_running_jobs(db, error_message=STALE_RECLAIM_MESSAGE)
        if reclaimed:
            ids = ", ".join(f"#{job_id}" for job_id, _ in reclaimed)
            logger.warning("Stale recovery failed %s running job(s): %s", len(reclaimed), ids)
    finally:
        db.close()


class _HeartbeatThread:
    def __init__(self, job_id: int, interval_seconds: float) -> None:
        self._job_id = job_id
        self._interval_seconds = interval_seconds
        self._stop = threading.Event()
        self._thread = threading.Thread(target=self._run, name=f"job-heartbeat-{job_id}", daemon=True)

    def start(self) -> None:
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        self._thread.join(timeout=self._interval_seconds + 5)

    def _run(self) -> None:
        while not self._stop.wait(self._interval_seconds):
            db = SessionLocal()
            try:
                touch_heartbeat(db, self._job_id)
            except Exception as exc:
                logger.error(
                    "Heartbeat update failed for job #%s: %s",
                    self._job_id,
                    exc_type_name(exc),
                )
            finally:
                db.close()


class _CancelWatcherThread:
    def __init__(self, job_id: int, interval_seconds: float = 2.0) -> None:
        self._job_id = job_id
        self._interval_seconds = interval_seconds
        self._stop = threading.Event()
        self._thread = threading.Thread(
            target=self._run,
            name=f"job-cancel-{job_id}",
            daemon=True,
        )

    def start(self) -> None:
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        self._thread.join(timeout=self._interval_seconds + 5)

    def _run(self) -> None:
        while not self._stop.wait(self._interval_seconds):
            db = SessionLocal()
            try:
                if is_cancel_requested(db, self._job_id):
                    signal_job_cancelled()
                    return
            except Exception as exc:
                logger.error(
                    "Cancel check failed for job #%s: %s",
                    self._job_id,
                    exc_type_name(exc),
                )
            finally:
                db.close()


def _handle_shutdown_signal(signum: int, _frame) -> None:
    global _current_job
    signal_name = signal.Signals(signum).name
    logger.warning("Received %s — attempting graceful job shutdown", signal_name)

    job = _current_job
    if job is not None:
        job_id = job["id"]
        step_key = job["step_key"]
        db = SessionLocal()
        try:
            append_log(db, job_id, "error", SHUTDOWN_RECLAIM_MESSAGE)
            if fail_running_job(db, job_id, error_message=SHUTDOWN_RECLAIM_MESSAGE):
                reset_ingestion_sync_for_step(db, step_key)
                db.commit()
                logger.warning("Marked job #%s failed due to worker shutdown", job_id)
        finally:
            db.close()

    raise SystemExit(0)


def process_once() -> bool:
    global _current_job

    _stale_recovery()

    db = SessionLocal()
    heartbeat: _HeartbeatThread | None = None
    cancel_watcher: _CancelWatcherThread | None = None
    try:
        job = claim_next_job(db, worker_id=_worker_id)
        if job is None:
            return False

        _current_job = job
        job_id = job["id"]
        step_key = job["step_key"]
        requested_by = job.get("requested_by") or "admin"
        staging_ref = job.get("staging_ref")
        collect_mode = job.get("collect_mode")

        if is_cancel_requested(db, job_id):
            append_log(db, job_id, "error", STOP_JOB_MESSAGE)
            complete_job(db, job_id, success=False, error_message=STOP_JOB_MESSAGE)
            reset_ingestion_sync_for_step(db, step_key)
            logger.info("Skipped cancelled job #%s (%s)", job_id, step_key)
            return True

        staging_note = f" (baseline: {staging_ref})" if staging_ref else ""
        mode_note = ""
        if step_key == "nvd-collect" and collect_mode:
            mode_note = f" [collect: {collect_mode}]"
        append_log(
            db,
            job_id,
            "info",
            f"Job #{job_id} started ({step_key}){mode_note}{staging_note} — requested by {requested_by}",
        )

        begin_job_cancellation_watch()
        heartbeat = _HeartbeatThread(job_id, HEARTBEAT_SECONDS)
        cancel_watcher = _CancelWatcherThread(job_id)
        heartbeat.start()
        cancel_watcher.start()

        try:
            run_step(step_key, staging_ref=staging_ref, collect_mode=collect_mode)
            if is_cancel_requested(db, job_id):
                raise JobCancelledError(STOP_JOB_MESSAGE)
            append_log(db, job_id, "success", f"Job #{job_id} completed ({step_key})")
            complete_job(db, job_id, success=True)
            logger.info("Completed job #%s (%s)", job_id, step_key)
        except JobCancelledError:
            append_log(db, job_id, "error", STOP_JOB_MESSAGE)
            complete_job(db, job_id, success=False, error_message=STOP_JOB_MESSAGE)
            reset_ingestion_sync_for_step(db, step_key)
            logger.warning("Job #%s stopped by operator (%s)", job_id, step_key)
        except Exception as exc:
            public_message = public_job_error_message(job_id, step_key, exc)
            append_log(db, job_id, "error", public_message)
            complete_job(db, job_id, success=False, error_message=public_message[:2000])
            logger.error(
                "Job #%s failed (%s): %s",
                job_id,
                step_key,
                exc.__class__.__name__,
            )
        return True
    finally:
        if cancel_watcher is not None:
            cancel_watcher.stop()
        if heartbeat is not None:
            heartbeat.stop()
        end_job_cancellation_watch()
        _current_job = None
        db.close()


def main() -> None:
    signal.signal(signal.SIGTERM, _handle_shutdown_signal)
    if hasattr(signal, "SIGINT"):
        signal.signal(signal.SIGINT, _handle_shutdown_signal)

    logger.info(
        "Code Canary worker runner started (worker_id=%s, poll=%ss, heartbeat=%ss). Ctrl+C to stop.",
        _worker_id,
        POLL_SECONDS,
        HEARTBEAT_SECONDS,
    )
    _startup_recovery()

    while True:
        try:
            had_job = process_once()
            if not had_job:
                time.sleep(POLL_SECONDS)
        except SystemExit:
            raise
        except KeyboardInterrupt:
            logger.info("Worker runner stopped.")
            break
        except Exception as exc:
            logger.error(
                "Unexpected runner error — retrying in %ss: %s",
                POLL_SECONDS,
                exc_type_name(exc),
            )
            time.sleep(POLL_SECONDS)
