"""Member 1: user persistence.

Provided shared foundation: session-safe lookup only.
TODO: add registration, authentication-only lookup, and preference writes.
Repository write functions must not commit independently.
"""
from ..db import get_db


def get_user_by_id_for_session(user_id):
    """Return only the fields shared session handling needs, never password_hash."""
    return get_db().execute(
        "SELECT id, email, support_language FROM users WHERE id = ?", (user_id,)
    ).fetchone()
