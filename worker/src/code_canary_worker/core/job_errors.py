"""Map pipeline exceptions to admin-safe job failure messages."""

from __future__ import annotations

import json
import zipfile

from code_canary_worker.refinery.silver_finalize import SilverRefineIncompleteError
from code_canary_worker.utils.job_cancellation import JobCancelledError


def public_job_error_message(job_id: int, step_key: str, exc: BaseException) -> str:
    """Return a message safe to store in pipeline_jobs and show in Admin UI."""
    prefix = f"Job #{job_id} failed"

    if isinstance(exc, JobCancelledError):
        return f"Job #{job_id} stopped by operator."

    if isinstance(exc, SilverRefineIncompleteError):
        return (
            f"{prefix}: silver refine did not finish "
            f"({exc.remaining} bronze record(s) remain). See worker logs for job #{job_id}."
        )

    if isinstance(exc, FileNotFoundError):
        return f"{prefix}: required staging data was not found."

    if isinstance(exc, ValueError):
        message = str(exc).lower()
        if "staging_ref" in message or "staging baseline" in message:
            return f"{prefix}: invalid staging baseline reference."
        if "unsupported pipeline step" in message or "collect mode" in message:
            return f"{prefix}: invalid pipeline request."
        return f"{prefix}: invalid request parameters."

    if isinstance(exc, RuntimeError) and "database configuration" in str(exc).lower():
        return f"{prefix}: worker database is not configured."

    if isinstance(exc, json.JSONDecodeError):
        return f"{prefix}: staging data could not be parsed."

    if isinstance(exc, zipfile.BadZipFile):
        return f"{prefix}: staging archive is not a valid ZIP file."

    if exc.__class__.__module__.startswith("sqlalchemy"):
        return f"{prefix}: database error. See worker logs for job #{job_id}."

    if exc.__class__.__module__.startswith("requests"):
        return f"{prefix}: upstream API request failed. See worker logs for job #{job_id}."

    return f"{prefix} ({step_key}). See worker logs for job #{job_id}."
