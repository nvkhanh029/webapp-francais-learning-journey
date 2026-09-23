"""Dashboard aggregation: progress, streak, Continue Learning, Recent Practice.

Owner: Member 2 (Dashboard and Learning State). Follows docs/api-contracts.md
Section 8 and docs/database-design.md Sections 11.2/12. There is intentionally
no dashboard_repository.py (Backend Structure Section 7.2); this service only
coordinates the existing learning-unit, learning-state and practice
repositories.

`practice_sessions.activity_date` is assumed to be stored as an ISO 8601
calendar date string ("YYYY-MM-DD"), consistent with `completed_at` using
ISO 8601. Member 6 owns the write path that produces this value; coordinate
before changing the assumed format.
"""
from datetime import date, datetime, timedelta

from ..localization import localized_value
from ..repositories import learning_state_repository, learning_unit_repository, practice_repository

RECENT_PRACTICE_LIMIT = 10
MODULE_TYPES = ("grammar", "vocabulary", "conjugation")


def _parse_activity_date(value):
    return datetime.strptime(value, "%Y-%m-%d").date()


def calculate_streak(activity_dates, today=None):
    """Pure derivation from distinct activity_date values (Requirements Section 11).

    Kept as a standalone pure function (no repository/session access) so tests
    can exercise streak edge cases with deterministic dates instead of
    depending on the real current date (Backend Structure Section 15.8).
    """
    if today is None:
        today = date.today()

    days = sorted({_parse_activity_date(value) for value in activity_dates})
    if not days:
        return {"current": 0, "longest": 0, "active_today": False}

    longest = 0
    run_ending_at = {}
    previous_day = None
    current_run = 0
    for day in days:
        if previous_day is not None and day - previous_day == timedelta(days=1):
            current_run += 1
        else:
            current_run = 1
        run_ending_at[day] = current_run
        longest = max(longest, current_run)
        previous_day = day

    active_today = today in run_ending_at
    if active_today:
        current = run_ending_at[today]
    else:
        current = run_ending_at.get(today - timedelta(days=1), 0)

    return {"current": current, "longest": longest, "active_today": active_today}


def _build_progress(user_id):
    totals = learning_unit_repository.count_by_type()
    learned = learning_state_repository.count_learned_by_type(user_id)
    return {
        unit_type: {"learned": learned.get(unit_type, 0), "total": totals.get(unit_type, 0)}
        for unit_type in MODULE_TYPES
    }


def _build_continue_learning(user_id, support_language):
    row = learning_state_repository.get_continue_learning(user_id)
    if row is None:
        return None
    return {
        "slug": row["slug"],
        "unit_type": row["unit_type"],
        "title_fr": row["title_fr"],
        "title": localized_value(row, "title", support_language, french_fallback_field="title_fr"),
    }


def _build_recent_practice(user_id):
    rows = practice_repository.get_recent_sessions(user_id, RECENT_PRACTICE_LIMIT)
    entries = []
    for row in rows:
        learning_unit = None
        if row["practice_type"] == "normal":
            # Matches the API Contract example shape exactly: slug/unit_type/title_fr
            # only. No localized "title" field appears here (unlike continue_learning).
            learning_unit = {
                "slug": row["slug"],
                "unit_type": row["unit_type"],
                "title_fr": row["title_fr"],
            }
        entries.append({
            "practice_type": row["practice_type"],
            "completed_at": row["completed_at"],
            "correct_count": row["correct_count"],
            "total_questions": row["total_questions"],
            "learning_unit": learning_unit,
        })
    return entries


def get_dashboard(user):
    """Build the full GET /api/v1/me/dashboard payload for one authenticated learner."""
    user_id = user["id"]
    support_language = user["support_language"]

    activity_dates = practice_repository.get_activity_dates(user_id)

    return {
        "streak": calculate_streak(activity_dates),
        "progress": _build_progress(user_id),
        "continue_learning": _build_continue_learning(user_id, support_language),
        "review_later_count": learning_state_repository.count_review_later(user_id),
        "mixed_practice": {"available": learning_state_repository.has_any_learned(user_id)},
        "recent_practice": _build_recent_practice(user_id),
    }
