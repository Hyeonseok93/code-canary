"""Shared path traversal checks for staging files and zip entries."""

from __future__ import annotations

from pathlib import Path


def is_unsafe_path_name(name: str) -> bool:
    if not name or name in {".", ".."}:
        return True
    if name.startswith(("/", "\\")):
        return True
    parts = name.replace("\\", "/").split("/")
    return ".." in parts or not all(parts)


def is_safe_flat_filename(name: str) -> bool:
    """Single path segment only — baseline JSON files on disk."""
    if is_unsafe_path_name(name):
        return False
    return Path(name).name == name and "/" not in name and "\\" not in name


def is_safe_zip_entry_name(name: str) -> bool:
    """Zip member path — subdirectories allowed, traversal blocked."""
    return not is_unsafe_path_name(name)
