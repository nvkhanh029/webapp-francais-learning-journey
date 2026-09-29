"""Dashboard aggregation: docs/api-contracts.md Section 8; streak rules in
docs/requirements-and-analysis.md Section 11 and docs/database-design.md
Section 11.2/13.3.

Streak edge cases are exercised as the pure `dashboard_service.calculate_streak`
function with fixed calendar dates so they do not depend on the real current
date (Backend Structure Section 15.8). One end-to-end HTTP test additionally
checks the real `today`/`yesterday` wiring through the full aggregate read.
"""
import sqlite3
from datetime import date, timedelta

import pytest

from app.services.dashboard_service import calculate_streak

pytestmark = pytest.mark.flask


# ---------------------------------------------------------------------------
# Pure streak derivation (deterministic dates, no Flask/DB access required)
# ---------------------------------------------------------------------------

def test_streak_empty_history():
    assert calculate_streak([], today=date(2026, 1, 10)) == {
        "current": 0, "longest": 0, "active_today": False,
    }


def test_streak_active_today_counts_consecutive_run():
    today = date(2026, 1, 10)
    dates = ["2026-01-08", "2026-01-09", "2026-01-10"]
    assert calculate_streak(dates, today=today) == {
        "current": 3, "longest": 3, "active_today": True,
    }


def test_streak_not_active_today_but_active_yesterday_keeps_current():
    today = date(2026, 1, 10)
    dates = ["2026-01-08", "2026-01-09"]
    assert calculate_streak(dates, today=today) == {
        "current": 2, "longest": 2, "active_today": False,
    }


def test_streak_gap_resets_current_but_preserves_longest():
    today = date(2026, 1, 10)
    dates = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"]
    assert calculate_streak(dates, today=today) == {
        "current": 0, "longest": 5, "active_today": False,
    }


def test_streak_multiple_sessions_same_day_count_as_one_active_day():
    today = date(2026, 1, 10)
    dates = ["2026-01-10", "2026-01-10", "2026-01-09"]
    assert calculate_streak(dates, today=today) == {
        "current": 2, "longest": 2, "active_today": True,
    }


def test_streak_current_can_be_shorter_than_longest():
    today = date(2026, 1, 20)
    dates = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-19", "2026-01-20"]
    assert calculate_streak(dates, today=today) == {
        "current": 2, "longest": 3, "active_today": True,
    }


# ---------------------------------------------------------------------------
# GET /api/v1/me/dashboard aggregation
# ---------------------------------------------------------------------------

def _login(client, user_id):
    with client.session_transaction() as session:
        session["user_id"] = user_id


def _insert_user(database_path, *, user_id=1, support_language="vi"):
    with sqlite3.connect(database_path) as db:
        db.execute(
            "INSERT INTO users (id, email, password_hash, support_language, created_at) "
            "VALUES (?, ?, 'test-only-hash', ?, 'test')",
            (user_id, f"learner{user_id}@example.test", support_language),
        )


def _insert_learning_unit(database_path, *, unit_id, unit_type, slug):
    with sqlite3.connect(database_path) as db:
        db.execute(
            "INSERT INTO learning_units (id, unit_type, slug, title_fr, title_vi, title_en) "
            "VALUES (?, ?, ?, 'Fixture FR', 'Fixture VI', 'Fixture EN')",
            (unit_id, unit_type, slug),
        )


def _insert_state(database_path, *, unit_id, user_id=1, learned=False, review_later=False, last_opened_at=None):
    with sqlite3.connect(database_path) as db:
        db.execute(
            "INSERT INTO user_learning_state "
            "(user_id, learning_unit_id, learned_at, review_later, last_opened_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (
                user_id, unit_id,
                "2026-01-01T00:00:00+00:00" if learned else None,
                1 if review_later else 0,
                last_opened_at,
            ),
        )


def _insert_session(database_path, *, session_id, completed_at, activity_date, user_id=1,
                     practice_type="mixed", learning_unit_id=None, correct_count=8, total_questions=10):
    with sqlite3.connect(database_path) as db:
        db.execute(
            "INSERT INTO practice_sessions "
            "(id, user_id, practice_type, learning_unit_id, completed_at, activity_date, "
            "correct_count, total_questions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (session_id, user_id, practice_type, learning_unit_id, completed_at,
             activity_date, correct_count, total_questions),
        )


@pytest.fixture
def learner(client, database_path):
    _insert_user(database_path)
    _login(client, 1)
    return 1


def test_new_learner_dashboard_state(client, database_path, learner):
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    response = client.get("/api/v1/me/dashboard")
    assert response.status_code == 200
    assert response.json["data"] == {
        "streak": {"current": 0, "longest": 0, "active_today": False},
        "progress": {
            "grammar": {"learned": 0, "total": 1},
            "vocabulary": {"learned": 0, "total": 0},
            "conjugation": {"learned": 0, "total": 0},
        },
        "continue_learning": None,
        "review_later_count": 0,
        "mixed_practice": {"available": False},
        "recent_practice": [],
    }


def test_dashboard_requires_authentication(client):
    response = client.get("/api/v1/me/dashboard")
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


def test_progress_counts_learned_and_total_per_module(client, database_path, learner):
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="grammar-1")
    _insert_learning_unit(database_path, unit_id=2, unit_type="grammar", slug="grammar-2")
    _insert_learning_unit(database_path, unit_id=3, unit_type="vocabulary", slug="vocab-1")
    _insert_state(database_path, unit_id=1, learned=True)
    _insert_state(database_path, unit_id=2, learned=False)
    _insert_state(database_path, unit_id=3, learned=True)

    response = client.get("/api/v1/me/dashboard")

    progress = response.json["data"]["progress"]
    assert progress["grammar"] == {"learned": 1, "total": 2}
    assert progress["vocabulary"] == {"learned": 1, "total": 1}
    assert progress["conjugation"] == {"learned": 0, "total": 0}


def test_continue_learning_uses_most_recently_opened_unfinished_unit(client, database_path, learner):
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="grammar-1")
    _insert_learning_unit(database_path, unit_id=2, unit_type="grammar", slug="grammar-2")
    _insert_state(database_path, unit_id=1, last_opened_at="2026-01-01T10:00:00+00:00")
    _insert_state(database_path, unit_id=2, last_opened_at="2026-01-02T10:00:00+00:00")

    response = client.get("/api/v1/me/dashboard")

    assert response.json["data"]["continue_learning"] == {
        "slug": "grammar-2", "unit_type": "grammar",
        "title_fr": "Fixture FR", "title": "Fixture VI",
    }


def test_continue_learning_excludes_units_already_learned(client, database_path, learner):
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="grammar-1")
    _insert_state(database_path, unit_id=1, learned=True, last_opened_at="2026-01-01T10:00:00+00:00")

    response = client.get("/api/v1/me/dashboard")

    assert response.json["data"]["continue_learning"] is None


def test_continue_learning_null_when_nothing_opened(client, database_path, learner):
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="grammar-1")
    response = client.get("/api/v1/me/dashboard")
    assert response.json["data"]["continue_learning"] is None


def test_review_later_count_reflects_marked_units(client, database_path, learner):
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="grammar-1")
    _insert_learning_unit(database_path, unit_id=2, unit_type="vocabulary", slug="vocab-1")
    _insert_state(database_path, unit_id=1, review_later=True)
    _insert_state(database_path, unit_id=2, review_later=False)

    response = client.get("/api/v1/me/dashboard")

    assert response.json["data"]["review_later_count"] == 1


def test_mixed_practice_available_only_after_a_learned_unit(client, database_path, learner):
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="grammar-1")

    response = client.get("/api/v1/me/dashboard")
    assert response.json["data"]["mixed_practice"] == {"available": False}

    _insert_state(database_path, unit_id=1, learned=True)
    response = client.get("/api/v1/me/dashboard")
    assert response.json["data"]["mixed_practice"] == {"available": True}


def test_recent_practice_orders_most_recent_first_and_limits_results(client, database_path, learner):
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="grammar-1")
    for i in range(12):
        _insert_session(
            database_path, session_id=i + 1, practice_type="normal", learning_unit_id=1,
            completed_at=f"2026-01-{i + 1:02d}T10:00:00+00:00",
            activity_date=f"2026-01-{i + 1:02d}",
        )

    response = client.get("/api/v1/me/dashboard")

    entries = response.json["data"]["recent_practice"]
    assert len(entries) == 10
    assert entries[0]["completed_at"] == "2026-01-12T10:00:00+00:00"
    assert entries[-1]["completed_at"] == "2026-01-03T10:00:00+00:00"


def test_recent_practice_normal_vs_mixed_representation(client, database_path, learner):
    _insert_learning_unit(database_path, unit_id=1, unit_type="vocabulary", slug="vocab-1")
    _insert_session(
        database_path, session_id=1, practice_type="normal", learning_unit_id=1,
        completed_at="2026-01-02T10:00:00+00:00", activity_date="2026-01-02",
        correct_count=7, total_questions=10,
    )
    _insert_session(
        database_path, session_id=2, practice_type="mixed", learning_unit_id=None,
        completed_at="2026-01-01T10:00:00+00:00", activity_date="2026-01-01",
        correct_count=6, total_questions=10,
    )

    response = client.get("/api/v1/me/dashboard")

    entries = response.json["data"]["recent_practice"]
    assert entries[0] == {
        "practice_type": "normal", "completed_at": "2026-01-02T10:00:00+00:00",
        "correct_count": 7, "total_questions": 10,
        "learning_unit": {"slug": "vocab-1", "unit_type": "vocabulary", "title_fr": "Fixture FR"},
    }
    assert entries[1] == {
        "practice_type": "mixed", "completed_at": "2026-01-01T10:00:00+00:00",
        "correct_count": 6, "total_questions": 10, "learning_unit": None,
    }


def test_dashboard_streak_wiring_uses_real_today_and_yesterday(client, database_path, learner):
    """End-to-end check that activity_date round-trips through the real DB/HTTP
    path; edge cases themselves are covered above by the pure-function tests.
    """
    today = date.today()
    yesterday = today - timedelta(days=1)
    _insert_session(database_path, session_id=1, completed_at=f"{yesterday.isoformat()}T09:00:00+00:00",
                     activity_date=yesterday.isoformat())
    _insert_session(database_path, session_id=2, completed_at=f"{today.isoformat()}T09:00:00+00:00",
                     activity_date=today.isoformat())

    response = client.get("/api/v1/me/dashboard")

    assert response.json["data"]["streak"] == {"current": 2, "longest": 2, "active_today": True}
