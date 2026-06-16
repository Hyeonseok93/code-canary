from unittest.mock import patch

from code_canary_worker.utils import db_manager


def test_ensure_env_loaded_skips_missing_repo_root(monkeypatch):
    monkeypatch.delenv("DB_USER", raising=False)
    db_manager._env_loaded = False

    with patch.object(db_manager, "repo_root", side_effect=RuntimeError("no pyproject")):
        db_manager._ensure_env_loaded()

    assert db_manager._env_loaded is True


def test_database_url_uses_process_env_without_dotenv(monkeypatch):
    db_manager._env_loaded = False
    monkeypatch.setenv("DB_USER", "postgres")
    monkeypatch.setenv("DB_PASSWORD", "secret")
    monkeypatch.setenv("DB_HOST", "db")
    monkeypatch.setenv("DB_PORT", "5432")
    monkeypatch.setenv("DB_NAME", "code_canary")

    with patch.object(db_manager, "repo_root", side_effect=RuntimeError("no pyproject")):
        url = db_manager._database_url()

    assert url == "postgresql://postgres:secret@db:5432/code_canary"
