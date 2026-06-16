"""Validate staging_ref values before Load — mirrors PipelineStagingValidator.java."""

from __future__ import annotations

from pathlib import Path

from code_canary_worker.utils.path_safe import is_safe_flat_filename
from code_canary_worker.utils.staging_constants import NVD_BASELINE_PATTERN, OSV_BASELINE_PATTERN

NVD_LOAD_STEP = "nvd-load"
OSV_LOAD_STEP = "osv-load"

_STEP_PATTERNS = {
    NVD_LOAD_STEP: NVD_BASELINE_PATTERN,
    OSV_LOAD_STEP: OSV_BASELINE_PATTERN,
}


def _validate_staging_ref(step_key: str, staging_ref: str) -> None:
    pattern = _STEP_PATTERNS.get(step_key)
    if pattern is None:
        raise ValueError(f"staging_ref is not supported for step: {step_key}")
    if not pattern.fullmatch(staging_ref):
        raise ValueError(f"Invalid staging_ref for step {step_key}: {staging_ref!r}")


def is_safe_baseline_filename(name: str) -> bool:
    """Flat baseline file name only — no directory segments or traversal."""
    return is_safe_flat_filename(name)


def safe_json_baseline_files(filenames: list[str]) -> list[str]:
    return [name for name in filenames if name.endswith(".json") and is_safe_baseline_filename(name)]


def resolve_baseline_file(folder: Path, filename: str) -> Path | None:
    if not is_safe_baseline_filename(filename):
        return None
    root = folder.resolve()
    candidate = (root / filename).resolve()
    try:
        candidate.relative_to(root)
    except ValueError:
        return None
    return candidate


def resolve_staging_path(data_dir: str, step_key: str, staging_ref: str) -> Path:
    """Return an absolute path under data_dir after regex and traversal checks."""
    _validate_staging_ref(step_key, staging_ref)
    root = Path(data_dir).resolve()
    candidate = (root / staging_ref).resolve()
    try:
        candidate.relative_to(root)
    except ValueError as exc:
        raise ValueError(f"staging_ref escapes data directory: {staging_ref!r}") from exc
    return candidate
