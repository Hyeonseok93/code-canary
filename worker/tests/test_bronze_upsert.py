import json
import zipfile
from io import BytesIO
from unittest.mock import MagicMock

from code_canary_worker.utils.bronze_upsert import (
    BronzeUpserter,
    canonical_json,
    compute_content_hash,
)


def test_compute_content_hash_is_stable_for_key_order():
    first = {"b": 2, "a": 1}
    second = {"a": 1, "b": 2}
    assert compute_content_hash(first) == compute_content_hash(second)


def test_bronze_upserter_skips_unchanged_rows():
    db = MagicMock()
    db.execute.return_value.fetchall.return_value = [
        ("CVE-2024-0001", compute_content_hash({"id": "CVE-2024-0001", "v": 1})),
    ]

    upserter = BronzeUpserter(db, "NVD")
    unchanged = upserter.consider("CVE-2024-0001", {"id": "CVE-2024-0001", "v": 1})
    changed = upserter.consider("CVE-2024-0002", {"id": "CVE-2024-0002", "v": 1})

    assert unchanged is None
    assert changed is not None
    assert upserter.skipped == 1
    assert upserter.upserted == 1
    assert changed["content"] == canonical_json({"id": "CVE-2024-0002", "v": 1})
