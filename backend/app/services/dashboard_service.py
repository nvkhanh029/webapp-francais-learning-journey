"""Dashboard aggregation: progress, streak, Continue Learning and Recent Practice.

Coordinates the learning-unit, learning-state and practice repositories only
(no dashboard_repository.py). `activity_date` is the ISO 8601 "YYYY-MM-DD" value
written by the Practice service.
"""
from datetime import date, datetime, timedelta

from ..localization import localized_value
from ..repositories import learning_state_repository, learning_unit_repository, practice_repository

RECENT_PRACTICE_LIMIT = 10
MODULE_TYPES = ("grammar", "vocabulary", "conjugation")


def _parse_activity_date(value):
    """Parse a YYYY-MM-DD activity_date string into a date object."""
    return datetime.strptime(value, "%Y-%m-%d").date()


def calculate_streak(activity_dates, today=None):
    """Derive current/longest streak purely from activity_date values, with no
    repository or session access. Kept standalone so tests can exercise streak
    edge cases with deterministic dates.
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
    """Return learned and total unit counts per module for Dashboard progress."""
    totals = learning_unit_repository.count_by_type()
    learned = learning_state_repository.count_learned_by_type(user_id)
    return {
        unit_type: {"learned": learned.get(unit_type, 0), "total": totals.get(unit_type, 0)}
        for unit_type in MODULE_TYPES
    }


def _build_continue_learning(user_id, support_language):
    """Return the most recently opened unfinished unit, or None."""
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
    """Return the most recent completed Practice summaries for Dashboard."""
    rows = practice_repository.get_recent_sessions(user_id, RECENT_PRACTICE_LIMIT)
    entries = []
    for row in rows:
        learning_unit = None
        if row["practice_type"] == "normal":
            # Matches the response shape exactly: slug/unit_type/title_fr only.
            # Unlike continue_learning, no localized "title" field appears here.
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
