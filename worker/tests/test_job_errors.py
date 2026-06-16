import zipfile

from code_canary_worker.core.job_errors import public_job_error_message
from code_canary_worker.refinery.silver_finalize import SilverRefineIncompleteError
from code_canary_worker.utils.job_cancellation import JobCancelledError


def test_public_job_error_message_for_cancelled_job():
    message = public_job_error_message(42, "nvd-collect", JobCancelledError("Stopped by operator."))
    assert message == "Job #42 stopped by operator."


def test_public_job_error_message_for_silver_incomplete():
    exc = SilverRefineIncompleteError("NVD", 3)
    message = public_job_error_message(7, "nvd-silver", exc)
    assert "3 bronze record(s) remain" in message
    assert "Job #7" in message


def test_public_job_error_message_for_missing_staging():
    message = public_job_error_message(1, "nvd-load", FileNotFoundError("missing"))
    assert "required staging data was not found" in message


def test_public_job_error_message_for_bad_zip():
    message = public_job_error_message(1, "osv-load", zipfile.BadZipFile("bad"))
    assert "not a valid ZIP file" in message
