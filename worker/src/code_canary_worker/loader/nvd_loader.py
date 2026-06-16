import json
import logging
import os
from code_canary_worker.utils.db_manager import SessionLocal
from code_canary_worker.utils.bronze_upsert import BronzeUpserter
from code_canary_worker.utils.log_sanitize import exc_type_name
from code_canary_worker.utils.staging_baselines import latest_nvd_baseline
from code_canary_worker.utils.staging_resolve import resolve_staging_ref
from code_canary_worker.utils.staging_paths import nvd_data_dir
from natsort import natsorted
from code_canary_worker.utils.staging_validation import (
    NVD_LOAD_STEP,
    resolve_baseline_file,
    resolve_staging_path,
    safe_json_baseline_files,
)
from code_canary_worker.utils.progress_logger import (
    PROGRESS_INTERVAL,
    format_progress,
    format_completed,
    should_log_progress,
)

logger = logging.getLogger("CodeCanary.Loader.NVD")

DATA_DIR = nvd_data_dir()


def _count_nvd_records(folder_path, files):
    total = 0
    for filename in files:
        file_path = resolve_baseline_file(folder_path, filename)
        if file_path is None or not file_path.is_file():
            continue
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            total += len(data.get("vulnerabilities", []))
    return total


def load_nvd_to_db():
    """NVD JSON 파일들을 읽어서 DB의 raw_vulnerability_data 테이블에 UPSERT"""
    latest_folder = resolve_staging_ref(latest_nvd_baseline)
    if not latest_folder:
        raise FileNotFoundError("No baseline folder found in data/nvd/")

    folder_path = resolve_staging_path(DATA_DIR, NVD_LOAD_STEP, latest_folder)
    if not folder_path.is_dir():
        raise FileNotFoundError(f"NVD baseline folder not found: {latest_folder}")

    files = natsorted(safe_json_baseline_files(os.listdir(folder_path)))

    logger.info("Starting NVD Load → Bronze")
    logger.info(f"Source: {latest_folder} ({len(files)} files)")
    logger.info("Target: bronze.raw_vulnerability_data")

    total_expected = _count_nvd_records(folder_path, files)
    logger.info(f"Total records to scan: {total_expected:,}")

    db = SessionLocal()
    try:
        upserter = BronzeUpserter(db, "NVD")
        current_file = ""

        for filename in files:
            current_file = filename
            file_path = resolve_baseline_file(folder_path, filename)
            if file_path is None or not file_path.is_file():
                logger.warning("Skipping unsafe or missing baseline file: %s", filename)
                continue
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                vulnerabilities = data.get("vulnerabilities", [])

                batch_params = []
                for vuln in vulnerabilities:
                    cve = vuln.get("cve", {})
                    cve_id = cve.get("id")
                    if not cve_id:
                        continue
                    param = upserter.consider(cve_id, cve)
                    if param:
                        batch_params.append(param)

                upserter.execute_batch(batch_params)

                if should_log_progress(upserter.scanned, PROGRESS_INTERVAL):
                    logger.info(
                        f"{format_progress(upserter.scanned, total_expected)} | file: {current_file}"
                    )

        if upserter.scanned > 0 and upserter.scanned % PROGRESS_INTERVAL != 0:
            logger.info(
                f"{format_progress(upserter.scanned, total_expected)} | file: {current_file}"
            )

        logger.info(format_completed(upserter.scanned, total_expected, "scanned"))
        upserter.log_summary(logger)
        upserter.commit()

    except Exception as e:
        db.rollback()
        logger.error("Aborted. Error loading NVD data: %s", exc_type_name(e))
        raise
    finally:
        db.close()
