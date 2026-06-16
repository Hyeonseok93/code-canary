"""List staging baselines from the pipeline data volume (mirrors Admin staging API)."""

from __future__ import annotations

import os

from natsort import natsorted

from code_canary_worker.utils.staging_constants import NVD_BASELINE_PREFIX, OSV_BASELINE_PREFIX
from code_canary_worker.utils.staging_paths import nvd_data_dir, osv_data_dir


def list_nvd_baselines() -> list[str]:
    data_dir = nvd_data_dir()
    if not os.path.isdir(data_dir):
        return []
    folders = [
        name
        for name in os.listdir(data_dir)
        if name.startswith(NVD_BASELINE_PREFIX) and os.path.isdir(os.path.join(data_dir, name))
    ]
    return natsorted(folders, reverse=True)


def list_osv_baselines() -> list[str]:
    data_dir = osv_data_dir()
    if not os.path.isdir(data_dir):
        return []
    files = [
        name
        for name in os.listdir(data_dir)
        if name.startswith(OSV_BASELINE_PREFIX)
        and name.endswith(".zip")
        and os.path.isfile(os.path.join(data_dir, name))
    ]
    return natsorted(files, reverse=True)


def latest_nvd_baseline() -> str | None:
    baselines = list_nvd_baselines()
    return baselines[0] if baselines else None


def latest_osv_baseline() -> str | None:
    baselines = list_osv_baselines()
    return baselines[0] if baselines else None
