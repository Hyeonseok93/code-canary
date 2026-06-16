"""Validate zip member paths before opening entries (path traversal / namelist guard)."""

from __future__ import annotations

from code_canary_worker.utils.path_safe import is_safe_zip_entry_name


def safe_json_zip_entries(names: list[str]) -> list[str]:
    return [name for name in names if name.endswith(".json") and is_safe_zip_entry_name(name)]


def zip_entry_block_reason(entry_path: str, allowed: set[str]) -> str | None:
    if not is_safe_zip_entry_name(entry_path):
        return "unsafe zip entry path"
    if entry_path not in allowed:
        return "zip entry not in archive"
    return None
