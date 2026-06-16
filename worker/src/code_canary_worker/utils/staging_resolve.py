"""Resolve staging baseline from job context or latest on-disk baseline."""

from __future__ import annotations

from collections.abc import Callable

from code_canary_worker.utils.job_context import get_staging_ref


def resolve_staging_ref(latest_baseline: Callable[[], str | None]) -> str | None:
    """Use explicit job staging_ref when set; otherwise pick the newest baseline."""
    staging_ref = get_staging_ref()
    if staging_ref:
        return staging_ref
    return latest_baseline()
