from unittest.mock import patch

from code_canary_worker.refinery import silver_refinery


def test_silver_source_config_covers_nvd_and_osv():
    assert set(silver_refinery._SILVER_SOURCE_CONFIG) == {"NVD", "OSV"}


def test_refine_entrypoints_use_shared_pending_query():
    assert "source_type = :source_type" in str(silver_refinery.PENDING_COUNT_QUERY)


def test_refine_nvd_data_delegates_to_shared_loop():
    with patch.object(
        silver_refinery,
        "refine_bronze_to_silver",
    ) as refine:
        silver_refinery.refine_nvd_data(batch_size=100, initial_load=True)

    refine.assert_called_once()
    kwargs = refine.call_args.kwargs
    assert kwargs["source_type"] == "NVD"
    assert kwargs["batch_function"] == "silver.refine_nvd_batch"
    assert kwargs["batch_size"] == 100
    assert kwargs["initial_load"] is True


def test_refine_osv_data_delegates_to_shared_loop():
    with patch.object(
        silver_refinery,
        "refine_bronze_to_silver",
    ) as refine:
        silver_refinery.refine_osv_data()

    kwargs = refine.call_args.kwargs
    assert kwargs["source_type"] == "OSV"
    assert kwargs["batch_function"] == "silver.refine_osv_batch"
