"""Application composition only; learner-facing endpoints are member tasks."""

import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask

from . import db
from .auth_session import init_app as init_auth
from .config import Config
from .errors import register_error_handlers
from .practice_runs import InMemoryPracticeRunStore


BACKEND_ROOT = Path(__file__).resolve().parent.parent


def create_app(test_config=None):
    """Create and configure one isolated Flask application instance."""
    # Local development may load backend/.env for convenience.
    # Tests must not load or fall back to contributor-local credentials.
    if test_config is None:
        load_dotenv(BACKEND_ROOT / ".env", override=False)

    app = Flask(
        __name__,
        instance_relative_config=True,
        static_folder=None,
    )
    app.config.from_object(Config)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    # Safe runtime defaults. Tests may override DATABASE through test_config.
    app.config["DATABASE"] = Path(app.instance_path) / "app.db"

    if test_config is None:
        # Normal runtime configuration must obtain the secret from the
        # environment (optionally populated from backend/.env above).
        app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
    else:
        # Test configuration is intentionally self-contained. In particular,
        # a missing test SECRET_KEY must not silently fall back to the host
        # environment, which keeps tests deterministic and isolated.
        app.config.update(test_config)

    secret_key = app.config.get("SECRET_KEY")
    if not isinstance(secret_key, str) or not secret_key.strip():
        source = "test_config" if test_config is not None else "the environment"
        raise RuntimeError(f"SECRET_KEY is required in {source}.")

    db.init_app(app)
    init_auth(app)
    register_error_handlers(app)

    # Import here to avoid coupling Blueprint imports to module import time.
    from .api.v1 import register_blueprints

    register_blueprints(app)

    # Each application instance receives its own temporary Practice run store.
    app.extensions["practice_run_store"] = InMemoryPracticeRunStore()

    return app
