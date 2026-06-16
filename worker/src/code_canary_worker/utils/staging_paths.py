"""Resolve host paths for pipeline staging data (NVD folders, OSV zips)."""

from __future__ import annotations

import os
from pathlib import Path

from code_canary_worker.utils.paths import worker_root


def resolve_data_root() -> Path:
    configured = os.getenv("PIPELINE_DATA_ROOT")
    if configured:
        return Path(configured)
    try:
        return worker_root().parent / "data"
    except RuntimeError:
        return Path("/data")


def nvd_data_dir() -> str:
    return str(resolve_data_root() / "nvd")


def osv_data_dir() -> str:
    return str(resolve_data_root() / "osv")
