"""Request-scoped SQLite connections and service-owned transactions."""
import sqlite3
from contextlib import contextmanager

from flask import current_app, g


def get_db():
    if "db" not in g:
        connection = sqlite3.connect(current_app.config["DATABASE"])
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        g.db = connection
    return g.db


def close_db(_error=None):
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()


@contextmanager
def transaction():
    """Start a single service transaction; nested transactions are not supported.

    Repositories must not commit. Enter this context before any business write.
    """
    connection = get_db()
    if connection.in_transaction:
        raise RuntimeError("Transaction already active. The outer service owns its boundary.")
    connection.execute("BEGIN")
    try:
        yield connection
        connection.commit()
    except BaseException:
        connection.rollback()
        raise


def init_app(app):
    app.teardown_appcontext(close_db)
