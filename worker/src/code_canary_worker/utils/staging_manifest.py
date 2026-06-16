"""Staging manifest: record-level content hashes for fast Load diff without opening every file."""

from __future__ import annotations

import json
import logging
import os
import zipfile
from datetime import datetime, timezone

from code_canary_worker.utils.bronze_upsert import compute_content_hash
from code_canary_worker.utils.zip_entry import safe_json_zip_entries

MANIFEST_VERSION = 1
MANIFEST_SUFFIX = ".manifest.json"


def osv_manifest_path(data_dir: str, staging_ref: str) -> str:
    base = staging_ref[:-4] if staging_ref.lower().endswith(".zip") else staging_ref
    return os.path.join(data_dir, f"{base}{MANIFEST_SUFFIX}")


def load_manifest(manifest_path: str) -> dict | None:
    if not os.path.isfile(manifest_path):
        return None
    with open(manifest_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if data.get("version") != MANIFEST_VERSION:
        return None
    records = data.get("records")
    paths = data.get("paths")
    if not isinstance(records, dict) or not isinstance(paths, dict):
        return None
    return data


def write_manifest(
    manifest_path: str,
    *,
    source_type: str,
    staging_ref: str,
    records: dict[str, str],
    paths: dict[str, str],
) -> None:
    payload = {
        "version": MANIFEST_VERSION,
        "source_type": source_type,
        "staging_ref": staging_ref,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "record_count": len(records),
        "records": records,
        "paths": paths,
    }
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))


def build_osv_manifest_from_zip(
    zip_path: str,
    staging_ref: str,
    *,
    logger: logging.Logger,
    progress_interval: int = 50_000,
) -> str:
    """Scan an OSV baseline zip and write a companion manifest.json."""
    manifest_path = osv_manifest_path(os.path.dirname(zip_path), staging_ref)
    records: dict[str, str] = {}
    paths: dict[str, str] = {}
    scanned = 0

    logger.info("Building OSV staging manifest from %s", staging_ref)

    with zipfile.ZipFile(zip_path, "r") as z:
        json_files = safe_json_zip_entries(z.namelist())
        total = len(json_files)

        for name in json_files:
            with z.open(name) as handle:
                try:
                    vuln_data = json.load(handle)
                except Exception as exc:
                    logger.warning("Manifest skip (parse error) %s: %s", name, exc)
                    continue

            osv_id = vuln_data.get("id")
            if not osv_id:
                continue

            records[osv_id] = compute_content_hash(vuln_data)
            paths[osv_id] = name
            scanned += 1

            if progress_interval and scanned % progress_interval == 0:
                logger.info("Manifest progress: %s / %s", f"{scanned:,}", f"{total:,}")

    write_manifest(
        manifest_path,
        source_type="OSV",
        staging_ref=staging_ref,
        records=records,
        paths=paths,
    )
    logger.info(
        "OSV manifest saved: %s (%s records)",
        os.path.basename(manifest_path),
        f"{len(records):,}",
    )
    return manifest_path


def select_osv_ids_to_open(manifest: dict, bronze_hashes: dict[str, str]) -> set[str]:
    """Return vulnerability IDs whose staging hash differs from bronze (or are new)."""
    records: dict[str, str] = manifest["records"]
    to_open: set[str] = set()
    for osv_id, staging_hash in records.items():
        existing = bronze_hashes.get(osv_id)
        if existing is not None and existing == staging_hash:
            continue
        to_open.add(osv_id)
    return to_open
