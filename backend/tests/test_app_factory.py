"""App-factory and database-transaction foundation behavior (real Flask)."""
from pathlib import Path
import sqlite3

import pytest

pytestmark = pytest.mark.flask


# --- Factory configuration --------------------------------------------------

def test_app_factory_uses_expected_cookie_defaults(app):
    """Confirm the factory applies the expected secure cookie defaults."""
    assert app.config["SESSION_COOKIE_HTTPONLY"] is True
    assert app.config["SESSION_COOKIE_SAMESITE"] == "Lax"
    assert app.config["SESSION_COOKIE_SECURE"] is False
    assert app.debug is False


def test_factory_attaches_separate_stores(app, database_path):
    """Confirm each app instance owns a separate practice run store."""
    from app import create_app
    second = create_app({"TESTING":True,"SECRET_KEY":"test-only","DATABASE":str(database_path)})
    assert app.extensions["practice_run_store"] is not second.extensions["practice_run_store"]


def test_all_planned_blueprints_registered(app):
    """Confirm the factory registers every planned blueprint."""
    assert {"auth","me","grammar","vocabulary","conjugation","references","practice"} <= set(app.blueprints)


def test_test_configuration_wins_over_real_environment(monkeypatch, database_path):
    """Confirm test configuration overrides values from the real environment."""
    from app import create_app
    monkeypatch.setenv("SECRET_KEY","a-different-test-value")
    test_app = create_app({"TESTING":True,"SECRET_KEY":"test-only","DATABASE":str(database_path)})
    assert test_app.config["SECRET_KEY"] == "test-only"
    assert Path(test_app.config["DATABASE"]) == database_path


def test_missing_test_secret_does_not_fall_back_to_local_environment(monkeypatch, database_path):
    """Confirm an empty test secret raises instead of reading the environment."""
    from app import create_app
    monkeypatch.setenv("SECRET_KEY","a-different-test-value")
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        create_app({"TESTING":True,"SECRET_KEY":"","DATABASE":str(database_path)})


# --- Database context and transactions --------------------------------------

def test_db_context_connection_foreign_keys_and_teardown(app):
    """Confirm request connections enable foreign keys and close after teardown."""
    from app.db import get_db
    with app.app_context():
        first=get_db()
        assert get_db() is first
        assert first.execute("PRAGMA foreign_keys").fetchone()[0] == 1
    with pytest.raises(sqlite3.ProgrammingError): first.execute("SELECT 1")


def test_service_transaction_commits_and_rolls_back(app):
    """Confirm transactions commit on success and roll back on failure."""
    from app.db import get_db, transaction
    with app.app_context():
        with transaction() as db:
            db.execute("INSERT INTO users(email,password_hash,created_at) VALUES('kept','test-only','test')")
        with pytest.raises(RuntimeError):
            with transaction() as db:
                db.execute("INSERT INTO users(email,password_hash,created_at) VALUES('rolled-back','test-only','test')")
                raise RuntimeError("injected service failure")
        assert [row[0] for row in get_db().execute("SELECT email FROM users")] == ["kept"]


def test_nested_transactions_are_not_independently_committed(app):
    """Confirm nested transactions raise and never commit partial work."""
    from app.db import get_db, transaction
    with app.app_context():
        with pytest.raises(RuntimeError,match="already active"):
            with transaction() as db:
                db.execute("INSERT INTO users(email,password_hash,created_at) VALUES('nested','test-only','test')")
                with transaction(): pass
        assert get_db().execute("SELECT count(*) FROM users").fetchone()[0] == 0
