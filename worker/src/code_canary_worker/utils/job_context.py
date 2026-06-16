"""Per-job context passed from runner into pipeline task handlers."""

from __future__ import annotations

from contextvars import ContextVar

_staging_ref: ContextVar[str | None] = ContextVar("staging_ref", default=None)
_collect_mode: ContextVar[str | None] = ContextVar("collect_mode", default=None)

COLLECT_MODE_FULL = "full"
COLLECT_MODE_INCREMENTAL = "incremental"


def set_staging_ref(staging_ref: str | None) -> None:
    normalized = staging_ref.strip() if staging_ref else None
    _staging_ref.set(normalized or None)


def get_staging_ref() -> str | None:
    return _staging_ref.get()


def set_collect_mode(collect_mode: str | None) -> None:
    normalized = collect_mode.strip().lower() if collect_mode else None
    if normalized not in {None, COLLECT_MODE_FULL, COLLECT_MODE_INCREMENTAL}:
        raise ValueError(f"Unsupported collect mode: {collect_mode}")
    _collect_mode.set(normalized)


def get_collect_mode() -> str:
    mode = _collect_mode.get()
    return mode or COLLECT_MODE_FULL


def clear_job_context() -> None:
    _staging_ref.set(None)
    _collect_mode.set(None)
