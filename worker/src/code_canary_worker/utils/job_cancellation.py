"""Cooperative stop for long-running pipeline steps (admin Stop button)."""

from __future__ import annotations

import threading
import time


class JobCancelledError(Exception):
    """Raised when an operator requests stop for the active pipeline job."""


_cancel_event: threading.Event | None = None


def begin_job_cancellation_watch() -> threading.Event:
    global _cancel_event
    event = threading.Event()
    _cancel_event = event
    return event


def end_job_cancellation_watch() -> None:
    global _cancel_event
    _cancel_event = None


def signal_job_cancelled() -> None:
    if _cancel_event is not None:
        _cancel_event.set()


def raise_if_cancel_requested() -> None:
    if _cancel_event is not None and _cancel_event.is_set():
        raise JobCancelledError("Stopped by operator.")


def interruptible_sleep(seconds: float) -> None:
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        raise_if_cancel_requested()
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            break
        time.sleep(min(1.0, remaining))
