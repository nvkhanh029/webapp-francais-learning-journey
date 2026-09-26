"""Member 1: user persistence.

Covers session-safe lookup, registration, the authentication-only lookup and
support-language preference writes. The authentication lookup is the only
function that returns password_hash; normal current-user reads must not carry
it through the application (Backend Structure Section 8.5).

Use app.db.get_db() and parameter-bound SQL. The service owns transactions;
repository writes must not commit independently.
"""
from ..db import get_db


def get_user_by_id_for_session(user_id):
    """Return only the fields shared session handling needs, never password_hash."""
    return get_db().execute(
        """
        SELECT id, email, support_language
        FROM users
        WHERE id = ?
        """,
        (user_id,),
    ).fetchone()


def get_user_by_email_for_authentication(email):
    """Authentication-only read. The returned password_hash must never reach a response."""
    return get_db().execute(
        """
        SELECT id, email, password_hash, support_language
        FROM users
        WHERE email = ?
        """,
        (email,),
    ).fetchone()


def exists_by_email(email):
    """Duplicate-registration check that does not load the password hash."""
    row = get_db().execute(
        """
        SELECT 1
        FROM users
        WHERE email = ?
        LIMIT 1
        """,
        (email,),
    ).fetchone()
    return row is not None


def create_user(email, password_hash, created_at):
    """Insert one learner with an unset support_language and return the new id."""
    cursor = get_db().execute(
        """
        INSERT INTO users (email, password_hash, support_language, created_at)
        VALUES (?, ?, NULL, ?)
        """,
        (email, password_hash, created_at),
    )
    return cursor.lastrowid


def update_support_language(user_id, support_language):
    """Write the preference only. No other learner state may be touched here."""
    get_db().execute(
        """
        UPDATE users
        SET support_language = ?
        WHERE id = ?
        """,
        (support_language, user_id),
    )
