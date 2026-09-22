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
    # Tests must not load a contributor's local credentials or environment file.
    if test_config is None:
        load_dotenv(BACKEND_ROOT / ".env", override=False)
    app = Flask(__name__, instance_relative_config=True, static_folder=None)
    app.config.from_object(Config)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    app.config["DATABASE"] = Path(app.instance_path) / "app.db"

    secret_key = os.environ.get("SECRET_KEY")

    if test_config is None and not secret_key:
        raise RuntimeError("SECRET_KEY environment variable is required.")

    app.config["SECRET_KEY"] = secret_key or "test-only-secret-key"

    if test_config is not None:
        app.config.update(test_config)

    db.init_app(app)
    init_auth(app)
    register_error_handlers(app)

    from .api.v1 import register_blueprints

    register_blueprints(app)

    app.extensions["practice_run_store"] = InMemoryPracticeRunStore()

    return app
