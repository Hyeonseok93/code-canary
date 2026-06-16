"""Filesystem anchors for worker layout (src/ + editable install)."""

from __future__ import annotations

from pathlib import Path


def worker_root() -> Path:
    """Directory containing worker/pyproject.toml."""
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "pyproject.toml").is_file():
            return parent
    raise RuntimeError("Could not locate worker root (pyproject.toml not found above utils/paths.py)")


def repo_root() -> Path:
    """Monorepo root (parent of worker/)."""
    return worker_root().parent
