"""Shared fixtures. Never use backend/instance/app.db or the final curriculum."""
import pytest

from init_db import initialize_database
from tests.support import representative_sources


@pytest.fixture
def database_path(tmp_path):
    return initialize_database(tmp_path/"test.db")


@pytest.fixture
def content_root(tmp_path):
    return representative_sources(tmp_path/"sources")


@pytest.fixture
def app(database_path):
    # Real Flask is required. Do not mock the framework or silently skip in CI.
    from app import create_app
    return create_app({"TESTING": True, "DATABASE": str(database_path),
                       "SECRET_KEY": "test-only-not-a-runtime-secret"})


@pytest.fixture
def client(app):
    return app.test_client()
