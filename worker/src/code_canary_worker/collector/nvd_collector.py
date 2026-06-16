import os
import requests
import json
import logging
from collections.abc import Callable
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from code_canary_worker.utils.job_cancellation import (
    JobCancelledError,
    interruptible_sleep,
    raise_if_cancel_requested,
)
from code_canary_worker.utils.log_sanitize import exc_type_name
from code_canary_worker.utils.staging_constants import NVD_BASELINE_PREFIX
from code_canary_worker.utils.db_manager import SessionLocal
from code_canary_worker.utils.ingestion_sync import (
    upsert_collection_sync,
    get_last_collect_started_at,
)
from code_canary_worker.utils.job_context import get_collect_mode, COLLECT_MODE_INCREMENTAL
from code_canary_worker.utils.staging_paths import nvd_data_dir

logger = logging.getLogger("CodeCanary.NVD")

BASE_URL = os.getenv("NVD_API_URL", "https://services.nvd.nist.gov/rest/json/cves/2.0")
API_KEY = os.getenv("NVD_API_KEY")
PARENT_SAVE_DIR = nvd_data_dir()
RESULTS_PER_PAGE = 2000
INCREMENTAL_OVERLAP = timedelta(minutes=10)


def _format_nvd_api_datetime(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.replace(tzinfo=None).strftime("%Y-%m-%dT%H:%M:%S.000")


def _resolve_incremental_window(db):
    collect_started = get_last_collect_started_at(db, "NVD")
    if collect_started is None:
        raise RuntimeError(
            "No NVD collect start time found. Run a full NVD collect first, "
            "or restore gold.ingestion_sync from staging bootstrap."
        )

    if collect_started.tzinfo is None:
        collect_started = collect_started.replace(tzinfo=timezone.utc)
    else:
        collect_started = collect_started.astimezone(timezone.utc)

    start = collect_started - INCREMENTAL_OVERLAP
    end = datetime.now(timezone.utc)
    return start, end


def _create_batch_dir(timestamp_suffix: str) -> tuple[str, str]:
    batch_dir_name = f"{NVD_BASELINE_PREFIX}{timestamp_suffix}"
    save_dir = os.path.join(PARENT_SAVE_DIR, batch_dir_name)
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
        logger.info(f"Created directory: {save_dir}")
    return batch_dir_name, save_dir


def _request_page(params: dict, headers: dict) -> dict:
    response = requests.get(BASE_URL, params=params, headers=headers, timeout=60)
    response.raise_for_status()
    return response.json()


def _collect_paged(save_dir: str, timestamp_suffix: str, base_params: dict, headers: dict) -> int:
    start_index = 0
    total_saved = 0
    total_results = None

    while True:
        raise_if_cancel_requested()
        params = {
            **base_params,
            "resultsPerPage": RESULTS_PER_PAGE,
            "startIndex": start_index,
        }

        try:
            logger.info(f"Fetching records from index {start_index}...")
            data = _request_page(params, headers)
            vulnerabilities = data.get("vulnerabilities", [])
            if total_results is None:
                total_results = data.get("totalResults", 0)
                logger.info(f"Total NVD records for this request: {total_results:,}")

            if not vulnerabilities:
                break

            filename = f"{NVD_BASELINE_PREFIX}BATCH_{start_index}_{timestamp_suffix}.json"
            save_path = os.path.join(save_dir, filename)
            with open(save_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)

            batch_count = len(vulnerabilities)
            total_saved += batch_count
            logger.info(f"Saved {batch_count} records to {filename}")

            start_index += batch_count
            if total_results is not None and start_index >= total_results:
                break

            interruptible_sleep(1 if API_KEY else 6)
        except JobCancelledError:
            raise
        except Exception as e:
            logger.error("Error at index %s: %s", start_index, exc_type_name(e))
            logger.info(f"Retrying in 10 seconds... (Current Index: {start_index})")
            interruptible_sleep(10)
            continue

    return total_saved


def _nvd_request_headers() -> dict:
    headers = {"apiKey": API_KEY} if API_KEY else {}
    if not API_KEY:
        logger.warning("No NVD API Key found in .env. Rate limiting will be strict.")
    return headers


def _log_full_catalog_estimate(headers: dict) -> None:
    try:
        probe = _request_page({"resultsPerPage": 1, "startIndex": 0}, headers)
        total_results = probe.get("totalResults", 0)
        estimated_batches = (total_results // RESULTS_PER_PAGE) + (
            1 if total_results % RESULTS_PER_PAGE else 0
        )
        logger.info(f"Total NVD records (catalog): {total_results:,}")
        logger.info(f"Estimated batches: {estimated_batches} (at {RESULTS_PER_PAGE} per page)")
    except Exception as e:
        logger.warning("Could not pre-calculate total results: %s", exc_type_name(e))


def _run_nvd_collect(
    mode: str,
    base_params_factory: Callable[[Session], tuple[dict, str | None]],
) -> None:
    start_time = datetime.now(timezone.utc)
    timestamp_suffix = start_time.strftime("%Y%m%d_%H%M%S")

    db = SessionLocal()
    total_saved = 0
    batch_dir_name = ""
    try:
        base_params, detail_log = base_params_factory(db)

        upsert_collection_sync(db, "NVD", status="running", touch_collected_at=True)
        db.commit()

        batch_dir_name, save_dir = _create_batch_dir(timestamp_suffix)
        logger.info(f"NVD {mode} collection started. Target directory: {batch_dir_name}")
        if detail_log:
            logger.info(detail_log)

        headers = _nvd_request_headers()
        if mode == "full":
            _log_full_catalog_estimate(headers)

        total_saved = _collect_paged(save_dir, timestamp_suffix, base_params, headers)

        if mode == "incremental":
            logger.info(
                f"NVD incremental collection completed. "
                f"Batch folder: {batch_dir_name} ({total_saved:,} records)"
            )
        else:
            logger.info(f"NVD full collection completed. Batch folder: {batch_dir_name}")

        upsert_collection_sync(
            db,
            "NVD",
            status="idle",
            records_touched=total_saved,
            touch_collected_at=False,
        )
        db.commit()
    except Exception as e:
        db.rollback()
        upsert_collection_sync(db, "NVD", status="failed", touch_collected_at=False)
        db.commit()
        logger.error("NVD %s collection failed: %s", mode, exc_type_name(e))
        raise
    finally:
        db.close()


def collect_nvd_data():
    mode = get_collect_mode()
    if mode == COLLECT_MODE_INCREMENTAL:
        collect_nvd_incremental()
    else:
        collect_nvd_full()


def collect_nvd_full():
    """NVD 2.0 API full feed (paginated, no date filter)."""
    _run_nvd_collect("full", lambda _db: ({}, None))


def collect_nvd_incremental():
    """NVD 2.0 API incremental sync via lastModStartDate / lastModEndDate."""

    def factory(db: Session) -> tuple[dict, str | None]:
        mod_start, mod_end = _resolve_incremental_window(db)
        start_param = _format_nvd_api_datetime(mod_start)
        end_param = _format_nvd_api_datetime(mod_end)
        return (
            {
                "lastModStartDate": start_param,
                "lastModEndDate": end_param,
            },
            f"Modified window: {start_param} → {end_param} (UTC)",
        )

    _run_nvd_collect("incremental", factory)
