import os
import json
import logging
import zipfile
from code_canary_worker.utils.db_manager import SessionLocal
from code_canary_worker.utils.bronze_upsert import BronzeUpserter, compute_content_hash
from code_canary_worker.utils.log_sanitize import exc_type_name
from code_canary_worker.utils.staging_baselines import latest_osv_baseline
from code_canary_worker.utils.staging_resolve import resolve_staging_ref
from code_canary_worker.utils.staging_paths import osv_data_dir
from code_canary_worker.utils.staging_validation import OSV_LOAD_STEP, resolve_staging_path
from code_canary_worker.utils.staging_manifest import (
    load_manifest,
    osv_manifest_path,
    select_osv_ids_to_open,
    write_manifest,
)
from code_canary_worker.utils.progress_logger import (
    PROGRESS_INTERVAL,
    format_progress,
    format_completed,
    should_log_progress,
)
from code_canary_worker.utils.zip_entry import safe_json_zip_entries, zip_entry_block_reason

logger = logging.getLogger("CodeCanary.Loader.OSV")

DATA_DIR = osv_data_dir()


def _format_osv_progress(scanned: int, total: int, staging_ref: str) -> str:
    return f"{format_progress(scanned, total)} | file: {staging_ref}"


def _load_with_manifest(
    z: zipfile.ZipFile,
    staging_ref: str,
    manifest: dict,
    upserter: BronzeUpserter,
    batch_params: list[dict],
    db_batch_size: int,
    total_expected: int,
) -> None:
    manifest_records: dict[str, str] = manifest["records"]
    manifest_paths: dict[str, str] = manifest["paths"]
    ids_to_open = select_osv_ids_to_open(manifest, upserter.hash_map)
    manifest_skipped = len(manifest_records) - len(ids_to_open)
    upserter.record_unchanged(manifest_skipped)

    logger.info(
        "Manifest diff: %s unchanged (skip open), %s to read from zip",
        f"{manifest_skipped:,}",
        f"{len(ids_to_open):,}",
    )

    allowed = set(z.namelist())
    for osv_id in ids_to_open:
        entry_path = manifest_paths.get(osv_id)
        if not entry_path:
            logger.warning("Manifest missing zip path for %s", osv_id)
            continue

        block_reason = zip_entry_block_reason(entry_path, allowed)
        if block_reason:
            logger.warning(
                "Skipping manifest entry for %s (%s): %s",
                osv_id,
                entry_path,
                block_reason,
            )
            continue

        with z.open(entry_path) as handle:
            try:
                vuln_data = json.load(handle)
            except Exception as exc:
                logger.warning("Failed to parse %s: %s", entry_path, exc_type_name(exc))
                continue

        if vuln_data.get("id") != osv_id:
            logger.warning(
                "Manifest id mismatch for %s (json id=%s)",
                entry_path,
                vuln_data.get("id"),
            )

        param = upserter.consider(osv_id, vuln_data)
        if param:
            batch_params.append(param)

        if len(batch_params) >= db_batch_size:
            upserter.execute_batch(batch_params)
            batch_params.clear()

            if should_log_progress(upserter.scanned, PROGRESS_INTERVAL):
                logger.info(_format_osv_progress(upserter.scanned, total_expected, staging_ref))

    upserter.execute_batch(batch_params)


def _load_full_scan(
    z: zipfile.ZipFile,
    json_files: list[str],
    staging_ref: str,
    upserter: BronzeUpserter,
    batch_params: list[dict],
    db_batch_size: int,
    total_expected: int,
) -> None:
    manifest_records: dict[str, str] = {}
    manifest_paths: dict[str, str] = {}

    for filename in json_files:
        with z.open(filename) as handle:
            try:
                vuln_data = json.load(handle)
                osv_id = vuln_data.get("id")
                if not osv_id:
                    continue
                manifest_records[osv_id] = compute_content_hash(vuln_data)
                manifest_paths[osv_id] = filename
                param = upserter.consider(osv_id, vuln_data)
                if param:
                    batch_params.append(param)
            except Exception as exc:
                logger.warning("Failed to parse %s: %s", filename, exc_type_name(exc))

        if len(batch_params) >= db_batch_size:
            upserter.execute_batch(batch_params)
            batch_params.clear()

            if should_log_progress(upserter.scanned, PROGRESS_INTERVAL):
                logger.info(_format_osv_progress(upserter.scanned, total_expected, staging_ref))

    upserter.execute_batch(batch_params)

    manifest_path = osv_manifest_path(DATA_DIR, staging_ref)
    if not os.path.isfile(manifest_path) and manifest_records:
        write_manifest(
            manifest_path,
            source_type="OSV",
            staging_ref=staging_ref,
            records=manifest_records,
            paths=manifest_paths,
        )
        logger.info(
            "Wrote OSV manifest for next load: %s (%s records)",
            os.path.basename(manifest_path),
            f"{len(manifest_records):,}",
        )


def load_osv_to_db():
    """OSV ZIP 파일을 스트리밍으로 읽어서 DB의 raw_vulnerability_data 테이블에 UPSERT"""
    latest_zip = resolve_staging_ref(latest_osv_baseline)
    if not latest_zip:
        raise FileNotFoundError("No baseline ZIP found in data/osv/")

    zip_path = resolve_staging_path(DATA_DIR, OSV_LOAD_STEP, latest_zip)
    if not zip_path.is_file():
        raise FileNotFoundError(f"OSV baseline ZIP not found: {latest_zip}")

    manifest_path = osv_manifest_path(DATA_DIR, latest_zip)
    manifest = load_manifest(manifest_path)
    if manifest and manifest.get("staging_ref") != latest_zip:
        logger.warning(
            "Manifest staging_ref mismatch (%s != %s); ignoring manifest",
            manifest.get("staging_ref"),
            latest_zip,
        )
        manifest = None

    with zipfile.ZipFile(zip_path, "r") as z:
        json_files = safe_json_zip_entries(z.namelist())
        total_expected = len(json_files)

        logger.info("Starting OSV Load → Bronze")
        logger.info(f"Source: {latest_zip} ({total_expected:,} JSON files)")
        if manifest:
            logger.info(
                "Manifest: %s (%s records)",
                os.path.basename(manifest_path),
                f"{manifest.get('record_count', len(manifest.get('records', {}))):,}",
            )
        else:
            logger.info("Manifest: not found — full zip scan (legacy baseline)")
        logger.info("Target: bronze.raw_vulnerability_data")

        db = SessionLocal()
        try:
            upserter = BronzeUpserter(db, "OSV")
            batch_params: list[dict] = []
            db_batch_size = 1000

            total_records = (
                manifest.get("record_count") or len(manifest["records"])
                if manifest
                else total_expected
            )

            if manifest:
                _load_with_manifest(
                    z,
                    latest_zip,
                    manifest,
                    upserter,
                    batch_params,
                    db_batch_size,
                    total_records,
                )
            else:
                _load_full_scan(
                    z,
                    json_files,
                    latest_zip,
                    upserter,
                    batch_params,
                    db_batch_size,
                    total_records,
                )

            if upserter.scanned > 0 and upserter.scanned % PROGRESS_INTERVAL != 0:
                logger.info(_format_osv_progress(upserter.scanned, total_records, latest_zip))

            logger.info(format_completed(upserter.scanned, total_records, "scanned"))
            upserter.log_summary(logger)
            upserter.commit()

        except Exception as e:
            db.rollback()
            logger.error("Aborted. Error loading OSV data: %s", exc_type_name(e))
            raise
        finally:
            db.close()
