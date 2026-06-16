from code_canary_worker.utils.path_safe import (
    is_safe_flat_filename,
    is_safe_zip_entry_name,
)
from code_canary_worker.utils.staging_validation import is_safe_baseline_filename


def test_baseline_filename_matches_flat_rules():
    assert is_safe_baseline_filename("batch_0.json") is True
    assert is_safe_baseline_filename("../x.json") is False
    assert is_safe_baseline_filename("dir/file.json") is False


def test_flat_filename_rejects_traversal_and_nested_paths():
    assert is_safe_flat_filename("batch_0.json") is True
    assert is_safe_flat_filename("../x.json") is False
    assert is_safe_flat_filename("dir/file.json") is False
    assert is_safe_flat_filename("") is False


def test_zip_entry_allows_nested_paths_but_not_traversal():
    assert is_safe_zip_entry_name("pkg/advisory.json") is True
    assert is_safe_zip_entry_name("../advisory.json") is False
    assert is_safe_zip_entry_name("/etc/passwd") is False
    assert is_safe_zip_entry_name("") is False
