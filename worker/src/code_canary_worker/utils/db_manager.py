import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from code_canary_worker.utils.paths import repo_root

_env_loaded = False
_engine = None
_SessionLocal = None


def _ensure_env_loaded() -> None:
    """Load monorepo .env for local dev; Docker uses env_file/secrets instead."""
    global _env_loaded
    if _env_loaded:
        return
    try:
        env_path = repo_root() / ".env"
    except RuntimeError:
        env_path = None
    if env_path is not None and env_path.is_file():
        load_dotenv(env_path)
    _env_loaded = True


def _database_url() -> str:
    _ensure_env_loaded()
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT")
    db_name = os.getenv("DB_NAME")
    if not all([db_user, db_password, db_host, db_port, db_name]):
        raise RuntimeError("Database configuration is incomplete in environment")
    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"


def get_engine():
    global _engine
    if _engine is None:
        pool_size = int(os.getenv("DB_POOL_SIZE", "5"))
        max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "10"))
        _engine = create_engine(
            _database_url(),
            pool_size=pool_size,
            max_overflow=max_overflow,
        )
    return _engine


def get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal


def SessionLocal():
    """Create a new SQLAlchemy session (lazy DB init on first use)."""
    return get_session_factory()()
