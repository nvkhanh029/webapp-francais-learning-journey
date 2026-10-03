"""Dashboard aggregation: docs/api-contracts.md Section 8; streak rules in
docs/requirements-and-analysis.md Section 11 and docs/database-design.md
Section 11.2/13.3.

Streak edge cases are exercised as the pure `dashboard_service.calculate_streak`
function with fixed calendar dates so they do not depend on the real current
date (Backend Structure Section 15.8). One end-to-end HTTP test additionally
checks the real `today`/`yesterday` wiring through the full aggregate read.
"""
import sqlite3
from datetime import date, datetime, timedelta, timezone

import pytest

from app import clock
from app.services.dashboard_service import calculate_streak

pytestmark = pytest.mark.flask

VN = timezone(timedelta(hours=7))


# ---------------------------------------------------------------------------
# Pure streak derivation (deterministic dates, no Flask/DB access required)
# ---------------------------------------------------------------------------

def test_streak_empty_history():
    """Confirm an empty history yields zero current and longest streaks."""
    assert calculate_streak([], today=date(2026, 1, 10)) == {
        "current": 0, "longest": 0, "active_today": False,
    }


def test_streak_active_today_counts_consecutive_run():
    """Confirm consecutive days ending today form a current streak."""
    today = date(2026, 1, 10)
    dates = ["2026-01-08", "2026-01-09", "2026-01-10"]
    assert calculate_streak(dates, today=today) == {
        "current": 3, "longest": 3, "active_today": True,
    }


def test_streak_not_active_today_but_active_yesterday_keeps_current():
    """Confirm a streak ending yesterday stays current but inactive today."""
    today = date(2026, 1, 10)
    dates = ["2026-01-08", "2026-01-09"]
    assert calculate_streak(dates, today=today) == {
        "current": 2, "longest": 2, "active_today": False,
    }


def test_streak_gap_resets_current_but_preserves_longest():
    """Confirm a gap resets the current streak but keeps the longest."""
    today = date(2026, 1, 10)
    dates = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"]
    assert calculate_streak(dates, today=today) == {
        "current": 0, "longest": 5, "active_today": False,
    }


def test_streak_multiple_sessions_same_day_count_as_one_active_day():
    """Confirm multiple same-day sessions count as one active day."""
    today = date(2026, 1, 10)
    dates = ["2026-01-10", "2026-01-10", "2026-01-09"]
    assert calculate_streak(dates, today=today) == {
        "current": 2, "longest": 2, "active_today": True,
    }


def test_streak_current_can_be_shorter_than_longest():
    """Confirm the current streak can be shorter than the longest."""
    today = date(2026, 1, 20)
    dates = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-19", "2026-01-20"]
    assert calculate_streak(dates, today=today) == {
        "current": 2, "longest": 3, "active_today": True,
    }


# ---------------------------------------------------------------------------
# GET /api/v1/me/dashboard aggregation
# ---------------------------------------------------------------------------

def _login(client, user_id):
    """Store the given user id in the client session."""
    with client.session_transaction() as session:
        session["user_id"] = user_id


def _insert_user(database_path, *, user_id=1, support_language="vi"):
    """Insert one fixture user row with the given id and language."""
    with sqlite3.connect(database_path) as db:
        db.execute(
            "INSERT INTO users (id, email, password_hash, support_language, created_at) "
            "VALUES (?, ?, 'test-only-hash', ?, 'test')",
            (user_id, f"learner{user_id}@example.test", support_language),
        )


def _insert_learning_unit(database_path, *, unit_id, unit_type, slug):
    """Insert one fixture learning unit of the given type and slug."""
    with sqlite3.connect(database_path) as db:
        db.execute(
            "INSERT INTO learning_units (id, unit_type, slug, title_fr, title_vi, title_en) "
            "VALUES (?, ?, ?, 'Fixture FR', 'Fixture VI', 'Fixture EN')",
            (unit_id, unit_type, slug),
        )


def _insert_state(database_path, *, unit_id, user_id=1, learned=False, review_later=False, last_opened_at=None):
    """Insert one learning-state row with the given flags and timestamp."""
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
    """Insert one practice-session row with counts and dates."""
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
    """Create a logged-in learner and return the user id."""
    _insert_user(database_path)
    _login(client, 1)
    return 1


def test_new_learner_dashboard_state(client, database_path, learner, monkeypatch):
    """Confirm a new learner sees zeroed progress and an empty dashboard."""
    monkeypatch.setattr(clock, "now", lambda: datetime(2026, 9, 20, 10, 0, tzinfo=VN))
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    response = client.get("/api/v1/me/dashboard")
    assert response.status_code == 200
    assert response.json["data"] == {
        "today": {"date": "2026-09-20", "timezone": "Asia/Ho_Chi_Minh"},
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
    """Confirm the dashboard requires authentication."""
    response = client.get("/api/v1/me/dashboard")
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


def test_progress_counts_learned_and_total_per_module(client, database_path, learner):
    """Confirm progress counts learned and total units per module."""
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
    """Confirm continue_learning picks the most recently opened unfinished unit."""
    with sqlite3.connect(database_path) as db:
        db.execute("INSERT INTO grammar_parts (id, title_fr, sort_order) VALUES (1, 'Part', 10)")
        db.execute("INSERT INTO grammar_chapters (id, part_id, title_fr, title_vi, title_en, sort_order) "
                   "VALUES (1, 1, 'Chapitre', 'Chuong', 'Chapter', 10)")
        for unit_id, slug in ((1, "grammar-1"), (2, "grammar-2")):
            db.execute("INSERT INTO learning_units (id, unit_type, slug, title_fr, title_vi, title_en) "
                       "VALUES (?, 'grammar', ?, 'Fixture FR', 'Fixture VI', 'Fixture EN')", (unit_id, slug))
            db.execute("INSERT INTO grammar_lessons (learning_unit_id, chapter_id, sort_order, content_vi, content_en) "
                       "VALUES (?, 1, ?, 'x', 'x')", (unit_id, unit_id * 10))
    _insert_state(database_path, unit_id=1, last_opened_at="2026-01-01T10:00:00+00:00")
    _insert_state(database_path, unit_id=2, last_opened_at="2026-01-02T10:00:00+00:00")

    response = client.get("/api/v1/me/dashboard")

    assert response.json["data"]["continue_learning"] == {
        "slug": "grammar-2", "unit_type": "grammar",
        "title_fr": "Fixture FR", "title": "Fixture VI",
        "parent": {"kind": "chapter", "title_fr": "Chapitre", "title": "Chuong"},
        "position": {"index": 2, "total": 2},
    }


def test_continue_learning_excludes_units_already_learned(client, database_path, learner):
    """Confirm learned units are excluded from continue_learning."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="grammar-1")
    _insert_state(database_path, unit_id=1, learned=True, last_opened_at="2026-01-01T10:00:00+00:00")

    response = client.get("/api/v1/me/dashboard")

    assert response.json["data"]["continue_learning"] is None


def test_continue_learning_null_when_nothing_opened(client, database_path, learner):
    """Confirm continue_learning is null when nothing was opened."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="grammar-1")
    response = client.get("/api/v1/me/dashboard")
    assert response.json["data"]["continue_learning"] is None


def test_review_later_count_reflects_marked_units(client, database_path, learner):
    """Confirm review_later_count counts only marked units."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="grammar-1")
    _insert_learning_unit(database_path, unit_id=2, unit_type="vocabulary", slug="vocab-1")
    _insert_state(database_path, unit_id=1, review_later=True)
    _insert_state(database_path, unit_id=2, review_later=False)

    response = client.get("/api/v1/me/dashboard")

    assert response.json["data"]["review_later_count"] == 1


def test_mixed_practice_available_only_after_a_learned_unit(client, database_path, learner):
    """Confirm mixed practice unlocks after any unit is learned."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="grammar-1")

    response = client.get("/api/v1/me/dashboard")
    assert response.json["data"]["mixed_practice"] == {"available": False}

    _insert_state(database_path, unit_id=1, learned=True)
    response = client.get("/api/v1/me/dashboard")
    assert response.json["data"]["mixed_practice"] == {"available": True}


def test_recent_practice_orders_most_recent_first_and_limits_results(client, database_path, learner):
    """Confirm recent practice is newest-first and capped at ten."""
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
    """Confirm normal and mixed sessions serialize with the right unit fields."""
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
    today = clock.today()
    yesterday = today - timedelta(days=1)
    _insert_session(database_path, session_id=1, completed_at=f"{yesterday.isoformat()}T09:00:00+00:00",
                     activity_date=yesterday.isoformat())
    _insert_session(database_path, session_id=2, completed_at=f"{today.isoformat()}T09:00:00+00:00",
                     activity_date=today.isoformat())

    response = client.get("/api/v1/me/dashboard")

    assert response.json["data"]["streak"] == {"current": 2, "longest": 2, "active_today": True}


# ---------------------------------------------------------------------------
# today {date, timezone} and active_today share one clock (API 8.1, 4.10)
# ---------------------------------------------------------------------------

def test_dashboard_today_is_the_server_date_in_ho_chi_minh(client, learner, monkeypatch):
    # 2026-09-30 20:00 UTC is already 2026-10-01 03:00 in Asia/Ho_Chi_Minh.
    monkeypatch.setattr(clock, "now",
                        lambda: datetime(2026, 9, 30, 20, 0, tzinfo=timezone.utc).astimezone(VN))
    data = client.get("/api/v1/me/dashboard").json["data"]
    assert data["today"] == {"date": "2026-10-01", "timezone": "Asia/Ho_Chi_Minh"}


def test_dashboard_today_ignores_the_browser_clock(client, learner, monkeypatch):
    monkeypatch.setattr(clock, "now", lambda: datetime(2030, 1, 2, 23, 59, tzinfo=VN))
    response = client.get("/api/v1/me/dashboard", headers={"Date": "Mon, 01 Jan 1990 00:00:00 GMT"})
    assert response.json["data"]["today"]["date"] == "2030-01-02"


def test_active_today_agrees_with_today_date(client, database_path, learner, monkeypatch):
    monkeypatch.setattr(clock, "now", lambda: datetime(2026, 10, 1, 0, 5, tzinfo=VN))
    _insert_session(database_path, session_id=1, completed_at="2026-10-01T00:01:00+07:00",
                    activity_date="2026-10-01")
    _insert_session(database_path, session_id=2, completed_at="2026-09-30T23:50:00+07:00",
                    activity_date="2026-09-30")
    data = client.get("/api/v1/me/dashboard").json["data"]
    assert data["today"]["date"] == "2026-10-01"
    assert data["streak"] == {"current": 2, "longest": 2, "active_today": True}


def test_not_active_today_when_the_last_session_was_yesterday(client, database_path, learner, monkeypatch):
    monkeypatch.setattr(clock, "now", lambda: datetime(2026, 10, 1, 0, 5, tzinfo=VN))
    _insert_session(database_path, session_id=1, completed_at="2026-09-30T23:50:00+07:00",
                    activity_date="2026-09-30")
    data = client.get("/api/v1/me/dashboard").json["data"]
    assert data["streak"] == {"current": 1, "longest": 1, "active_today": False}


def test_dashboard_reads_the_clock_once_per_request(client, learner, monkeypatch):
    calls = []
    def tick():
        calls.append(1)
        return datetime(2026, 10, 1, 12, 0, tzinfo=VN)
    monkeypatch.setattr(clock, "now", tick)
    client.get("/api/v1/me/dashboard")
    assert len(calls) == 1
