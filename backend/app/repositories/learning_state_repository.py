"""Learner/unit state persistence: learned_at, review_later, last_opened_at.

Owner: Member 2 (Dashboard and Learning State), per docs/repository-conventions.md
Section 8.4. Use app.db.get_db() and parameter-bound SQL. The service owns
transactions; repository writes must not commit independently.
"""
from ..db import get_db


def _ensure_row(user_id, learning_unit_id):
    """Create the (user_id, learning_unit_id) state row if it does not exist yet.

    Learner state can be created either by opening a unit first or by acting
    on Mark as Learned / Review Later directly; both paths must be idempotent
    and must never create a second row for the same pair (composite PK).
    """
    get_db().execute(
        "INSERT INTO user_learning_state (user_id, learning_unit_id, review_later) "
        "VALUES (?, ?, 0) "
        "ON CONFLICT(user_id, learning_unit_id) DO NOTHING",
        (user_id, learning_unit_id),
    )


def record_open(user_id, learning_unit_id, opened_at):
    """Set last_opened_at only. Must never touch learned_at or review_later."""
    _ensure_row(user_id, learning_unit_id)
    get_db().execute(
        "UPDATE user_learning_state SET last_opened_at = ? "
        "WHERE user_id = ? AND learning_unit_id = ?",
        (opened_at, user_id, learning_unit_id),
    )


def update_state(user_id, learning_unit_id, *, learned=None, learned_at=None, review_later=None):
    """Apply Mark as Learned and/or Review Later. Each field is independent.

    `learned=True` only sets learned_at when it is currently NULL, so
    repeating the action on an already-learned unit does not change the
    original completion timestamp or count as progress again. `learned=False`
    always clears learned_at. `review_later` is written only when supplied.
    Passing learned=None and review_later=None performs no write (the caller
    is responsible for rejecting a request that supplies neither field).
    """
    _ensure_row(user_id, learning_unit_id)
    if learned is True:
        get_db().execute(
            "UPDATE user_learning_state SET learned_at = COALESCE(learned_at, ?) "
            "WHERE user_id = ? AND learning_unit_id = ?",
            (learned_at, user_id, learning_unit_id),
        )
    elif learned is False:
        get_db().execute(
            "UPDATE user_learning_state SET learned_at = NULL "
            "WHERE user_id = ? AND learning_unit_id = ?",
            (user_id, learning_unit_id),
        )
    if review_later is not None:
        get_db().execute(
            "UPDATE user_learning_state SET review_later = ? "
            "WHERE user_id = ? AND learning_unit_id = ?",
            (1 if review_later else 0, user_id, learning_unit_id),
        )


def get_state(user_id, learning_unit_id):
    """Return the raw state row (learned_at, review_later, last_opened_at) or None."""
    return get_db().execute(
        "SELECT learned_at, review_later, last_opened_at FROM user_learning_state "
        "WHERE user_id = ? AND learning_unit_id = ?",
        (user_id, learning_unit_id),
    ).fetchone()


def count_learned_by_type(user_id):
    """Return learned counts per module for one learner, e.g. {'grammar': 4, ...}."""
    counts = {}
    rows = get_db().execute(
        "SELECT lu.unit_type AS unit_type, COUNT(*) AS total "
        "FROM user_learning_state uls "
        "JOIN learning_units lu ON lu.id = uls.learning_unit_id "
        "WHERE uls.user_id = ? AND uls.learned_at IS NOT NULL "
        "GROUP BY lu.unit_type",
        (user_id,),
    ).fetchall()
    for row in rows:
        counts[row["unit_type"]] = row["total"]
    return counts


def count_review_later(user_id):
    row = get_db().execute(
        "SELECT COUNT(*) AS total FROM user_learning_state "
        "WHERE user_id = ? AND review_later = 1",
        (user_id,),
    ).fetchone()
    return row["total"]


def has_any_learned(user_id):
    """Used for Mixed Practice availability: at least one explicitly learned unit."""
    row = get_db().execute(
        "SELECT 1 FROM user_learning_state "
        "WHERE user_id = ? AND learned_at IS NOT NULL LIMIT 1",
        (user_id,),
    ).fetchone()
    return row is not None


def get_continue_learning(user_id):
    """Most recently opened unfinished unit, or None. See Database Design Section 11.1."""
    return get_db().execute(
        "SELECT lu.slug AS slug, lu.unit_type AS unit_type, "
        "lu.title_fr AS title_fr, lu.title_vi AS title_vi, lu.title_en AS title_en "
        "FROM user_learning_state uls "
        "JOIN learning_units lu ON lu.id = uls.learning_unit_id "
        "WHERE uls.user_id = ? AND uls.learned_at IS NULL AND uls.last_opened_at IS NOT NULL "
        "ORDER BY uls.last_opened_at DESC LIMIT 1",
        (user_id,),
    ).fetchone()


def list_review_later(user_id):
    """All units currently marked Review Later, ordered deterministically."""
    return get_db().execute(
        "SELECT lu.slug AS slug, lu.unit_type AS unit_type, "
        "lu.title_fr AS title_fr, lu.title_vi AS title_vi, lu.title_en AS title_en, "
        "uls.learned_at AS learned_at "
        "FROM user_learning_state uls "
        "JOIN learning_units lu ON lu.id = uls.learning_unit_id "
        "WHERE uls.user_id = ? AND uls.review_later = 1 "
        "ORDER BY lu.unit_type, lu.slug",
        (user_id,),
    ).fetchall()
