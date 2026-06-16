from code_canary_worker.utils.log_sanitize import exc_type_name


def test_exc_type_name_returns_class_only():
    assert exc_type_name(ValueError("secret detail")) == "ValueError"
