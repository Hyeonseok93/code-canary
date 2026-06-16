"""Helpers for worker logs that must not echo exception message bodies."""

from __future__ import annotations


def exc_type_name(exc: BaseException) -> str:
    return exc.__class__.__name__
