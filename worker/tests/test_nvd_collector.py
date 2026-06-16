from unittest.mock import patch

from code_canary_worker.collector import nvd_collector
from code_canary_worker.utils.job_context import COLLECT_MODE_FULL, COLLECT_MODE_INCREMENTAL


def test_collect_nvd_data_routes_to_incremental():
    with (
        patch.object(nvd_collector, "collect_nvd_incremental") as incremental,
        patch.object(nvd_collector, "collect_nvd_full") as full,
        patch.object(nvd_collector, "get_collect_mode", return_value=COLLECT_MODE_INCREMENTAL),
    ):
        nvd_collector.collect_nvd_data()
        incremental.assert_called_once_with()
        full.assert_not_called()


def test_collect_nvd_data_routes_to_full_by_default():
    with (
        patch.object(nvd_collector, "collect_nvd_incremental") as incremental,
        patch.object(nvd_collector, "collect_nvd_full") as full,
        patch.object(nvd_collector, "get_collect_mode", return_value=COLLECT_MODE_FULL),
    ):
        nvd_collector.collect_nvd_data()
        full.assert_called_once_with()
        incremental.assert_not_called()


def test_run_nvd_collect_full_uses_empty_api_params():
    session = patch.object(nvd_collector, "SessionLocal", return_value=_MagicMockSession())
    upsert = patch.object(nvd_collector, "upsert_collection_sync")
    batch_dir = patch.object(
        nvd_collector,
        "_create_batch_dir",
        return_value=("nvd_baseline_test", "/tmp/nvd_baseline_test"),
    )
    headers = patch.object(nvd_collector, "_nvd_request_headers", return_value={})
    catalog = patch.object(nvd_collector, "_log_full_catalog_estimate")
    paged = patch.object(nvd_collector, "_collect_paged", return_value=12)

    with session, upsert, batch_dir, headers, catalog, paged as collect_paged:
        nvd_collector._run_nvd_collect("full", lambda _db: ({}, None))

    collect_paged.assert_called_once()
    assert collect_paged.call_args.args[2] == {}


def test_run_nvd_collect_incremental_passes_modified_window():
    session = patch.object(nvd_collector, "SessionLocal", return_value=_MagicMockSession())
    upsert = patch.object(nvd_collector, "upsert_collection_sync")
    batch_dir = patch.object(
        nvd_collector,
        "_create_batch_dir",
        return_value=("nvd_baseline_test", "/tmp/nvd_baseline_test"),
    )
    headers = patch.object(nvd_collector, "_nvd_request_headers", return_value={})
    paged = patch.object(nvd_collector, "_collect_paged", return_value=3)
    params = {
        "lastModStartDate": "2026-01-01T00:00:00.000",
        "lastModEndDate": "2026-01-02T00:00:00.000",
    }

    with session, upsert, batch_dir, headers, paged as collect_paged:
        nvd_collector._run_nvd_collect(
            "incremental",
            lambda _db: (params, "Modified window"),
        )

    assert collect_paged.call_args.args[2] == params


class _MagicMockSession:
    def commit(self):
        pass

    def rollback(self):
        pass

    def close(self):
        pass
