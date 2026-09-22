"""Practice question reads and completed-Practice persistence/query SQL.

Primary owner: Member 6 (Practice and Mixed Practice) - question selection,
answer scoring and the `practice_sessions` INSERT on valid final submission
belong there and are not implemented in this file yet.

The two read-only functions below exist because Dashboard (Member 2) needs
completed-Practice history for Recent Practice and streak derivation. Per
Repository Conventions Section 8.5/8.12, coordinate with Member 6 before
changing these queries or adding write paths here.

Use app.db.get_db() and parameter-bound SQL. The service owns transactions;
repository writes must not commit independently.
"""
from ..db import get_db


def get_recent_sessions(user_id, limit):
    """Most recent completed Practice/Mixed Practice summaries for Dashboard display.

    Mixed Practice rows have no related learning unit, so the join columns
    (slug/unit_type/title_fr) come back NULL for them; the caller distinguishes
    normal vs. mixed using `practice_type`, matching the API Contract shape.
    """
    return get_db().execute(
        "SELECT ps.practice_type AS practice_type, ps.completed_at AS completed_at, "
        "ps.correct_count AS correct_count, ps.total_questions AS total_questions, "
        "lu.slug AS slug, lu.unit_type AS unit_type, lu.title_fr AS title_fr "
        "FROM practice_sessions ps "
        "LEFT JOIN learning_units lu ON lu.id = ps.learning_unit_id "
        "WHERE ps.user_id = ? "
        "ORDER BY ps.completed_at DESC "
        "LIMIT ?",
        (user_id, limit),
    ).fetchall()


def get_activity_dates(user_id):
    """Distinct completed-practice activity dates, for current/longest streak derivation."""
    rows = get_db().execute(
        "SELECT DISTINCT activity_date FROM practice_sessions WHERE user_id = ?",
        (user_id,),
    ).fetchall()
    return [row["activity_date"] for row in rows]
