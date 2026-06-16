"""Unified progress logging for Load / Refine / Gold pipelines."""

PROGRESS_INTERVAL = 5000
GOLD_TOTAL_STEPS = 5
CWE_PROGRESS_INTERVAL = 200


def format_count(n: int) -> str:
    return f"{n:,}"


def format_progress(current: int, total: int) -> str:
    if total <= 0:
        return f"Progress: {format_count(current)} / 0 (0.0%)"
    pct = current / total * 100
    return f"Progress: {format_count(current)} / {format_count(total)} ({pct:.1f}%)"


def format_completed(current: int, total: int, action: str) -> str:
    if total <= 0:
        return f"Completed. 0 / 0 records {action} (skipped)"
    pct = 100.0 if current >= total else current / total * 100
    return f"Completed. {format_count(current)} / {format_count(total)} records {action} ({pct:.1f}%)"


def should_log_progress(current: int, interval: int = PROGRESS_INTERVAL) -> bool:
    return current > 0 and current % interval == 0


def gold_step(step: int, message: str) -> str:
    return f"[Step {step}/{GOLD_TOTAL_STEPS}] {message}"
