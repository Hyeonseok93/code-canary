import json

from code_canary_worker.loader.nvd_loader import _count_nvd_records
from code_canary_worker.utils import job_context
from code_canary_worker.utils.staging_baselines import latest_nvd_baseline
from code_canary_worker.utils.staging_constants import NVD_BASELINE_PREFIX
from code_canary_worker.utils.staging_resolve import resolve_staging_ref


def test_resolve_staging_ref_for_nvd_load_uses_job_context(tmp_path, monkeypatch):
    folder_name = f"{NVD_BASELINE_PREFIX}20260101_120000"
    baseline_dir = tmp_path / folder_name
    baseline_dir.mkdir()

    monkeypatch.setattr(
        "code_canary_worker.utils.staging_baselines.latest_nvd_baseline",
        lambda: "should-not-be-used",
    )
    job_context.set_staging_ref(folder_name)
    try:
        assert resolve_staging_ref(latest_nvd_baseline) == folder_name
    finally:
        job_context.clear_job_context()


def test_count_nvd_records_sums_vulnerabilities(tmp_path):
    folder = tmp_path / "baseline"
    folder.mkdir()
    payload = {
        "vulnerabilities": [
            {"cve": {"id": "CVE-2024-0001"}},
            {"cve": {"id": "CVE-2024-0002"}},
        ]
    }
    (folder / "batch_0.json").write_text(json.dumps(payload), encoding="utf-8")

    total = _count_nvd_records(folder, ["batch_0.json"])
    assert total == 2
