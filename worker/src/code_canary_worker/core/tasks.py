"""Dispatch table for admin-enqueued pipeline jobs and interactive worker menu."""

from __future__ import annotations

import logging
from typing import Callable

from code_canary_worker.utils.job_context import clear_job_context, set_collect_mode, set_staging_ref

logger = logging.getLogger("CodeCanary.Tasks")

TaskHandler = Callable[[], None]

_TASKS: dict[str, TaskHandler] = {}

# Menu digit -> step key (keep in sync with frontend/constants/pipelineStepKeys.ts)
MENU_SECTIONS: list[tuple[str, list[tuple[str, str]]]] = [
    (
        "NVD",
        [
            ("1", "nvd-collect"),
            ("4", "nvd-load"),
            ("5", "nvd-silver"),
        ],
    ),
    (
        "OSV",
        [
            ("6", "osv-collect"),
            ("9", "osv-load"),
            ("10", "osv-silver"),
        ],
    ),
    (
        "Gold",
        [
            ("G", "gold-refresh"),
        ],
    ),
]

STEP_MENU: list[tuple[str, str]] = [
    item for _, section_items in MENU_SECTIONS for item in section_items
]

MENU_CHOICES: dict[str, str] = dict(STEP_MENU)

STEP_LABELS: dict[str, str] = {
    "nvd-collect": "Collect NVD (API)",
    "nvd-load": "Load NVD → Bronze",
    "nvd-silver": "Refine NVD → Silver",
    "osv-collect": "Collect OSV (ZIP)",
    "osv-load": "Load OSV → Bronze",
    "osv-silver": "Refine OSV → Silver",
    "gold-refresh": "Refresh Gold analytics",
}

LOAD_STEPS = frozenset({"nvd-load", "osv-load"})
NVD_COLLECT_STEP = "nvd-collect"


def _register(step_key: str, handler: TaskHandler) -> None:
    _TASKS[step_key] = handler


def menu_label(choice: str) -> str | None:
    step_key = MENU_CHOICES.get(choice)
    if step_key is None:
        return None
    return STEP_LABELS.get(step_key, step_key.replace("-", " ").title())


def _lazy_register() -> None:
    if _TASKS:
        return

    from code_canary_worker.collector.nvd_collector import collect_nvd_data
    from code_canary_worker.collector.osv_collector import download_osv_all
    from code_canary_worker.loader.nvd_loader import load_nvd_to_db
    from code_canary_worker.loader.osv_loader import load_osv_to_db
    from code_canary_worker.refinery.gold_refinery import refresh_gold_metrics
    from code_canary_worker.refinery.silver_refinery import refine_nvd_data, refine_osv_data

    handlers: dict[str, TaskHandler] = {
        "nvd-collect": collect_nvd_data,
        "nvd-load": load_nvd_to_db,
        "nvd-silver": refine_nvd_data,
        "osv-collect": download_osv_all,
        "osv-load": load_osv_to_db,
        "osv-silver": refine_osv_data,
        "gold-refresh": refresh_gold_metrics,
    }

    for _, step_key in STEP_MENU:
        _register(step_key, handlers[step_key])


def run_step(
    step_key: str,
    *,
    staging_ref: str | None = None,
    collect_mode: str | None = None,
) -> None:
    _lazy_register()
    handler = _TASKS.get(step_key)
    if handler is None:
        raise ValueError(f"Unsupported pipeline step: {step_key}")

    set_staging_ref(staging_ref)
    set_collect_mode(collect_mode if step_key == NVD_COLLECT_STEP else None)

    logger.info("Running pipeline step: %s", step_key)
    try:
        handler()
    finally:
        clear_job_context()
