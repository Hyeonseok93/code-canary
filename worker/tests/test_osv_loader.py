import io
import json
import zipfile
from unittest.mock import MagicMock, patch

from code_canary_worker.loader import osv_loader


def _make_osv_zip() -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as z:
        z.writestr(
            "OSV-2024-1.json",
            json.dumps({"id": "OSV-2024-1", "summary": "test"}),
        )
    return buffer.getvalue()


from code_canary_worker.utils.staging_constants import OSV_BASELINE_PREFIX


def test_load_osv_to_db_opens_zip_once(tmp_path, monkeypatch):
    zip_name = f"{OSV_BASELINE_PREFIX}20260101_120000.zip"
    zip_path = tmp_path / zip_name
    zip_path.write_bytes(_make_osv_zip())

    monkeypatch.setattr(osv_loader, "DATA_DIR", str(tmp_path))
    monkeypatch.setattr(
        osv_loader,
        "resolve_staging_ref",
        lambda _latest: zip_name,
    )

    db = MagicMock()
    upserter = MagicMock()
    upserter.scanned = 1
    upserter.hash_map = {}
    upserter.consider.return_value = None

    with (
        patch.object(osv_loader, "SessionLocal", return_value=db),
        patch.object(osv_loader, "BronzeUpserter", return_value=upserter),
        patch.object(osv_loader.zipfile, "ZipFile", wraps=zipfile.ZipFile) as zip_ctor,
    ):
        osv_loader.load_osv_to_db()

    assert zip_ctor.call_count == 1
