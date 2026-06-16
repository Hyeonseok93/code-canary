from code_canary_worker.utils import job_context
from code_canary_worker.utils.staging_resolve import resolve_staging_ref


def test_resolve_staging_ref_prefers_job_context():
    job_context.set_staging_ref("nvd_baseline_20260101_120000")
    try:
        assert resolve_staging_ref(lambda: "nvd_baseline_20260102_000000") == (
            "nvd_baseline_20260101_120000"
        )
    finally:
        job_context.clear_job_context()


def test_resolve_staging_ref_falls_back_to_latest():
    job_context.clear_job_context()
    assert resolve_staging_ref(lambda: "latest.zip") == "latest.zip"


def test_resolve_staging_ref_returns_none_when_no_baseline():
    job_context.clear_job_context()
    assert resolve_staging_ref(lambda: None) is None
