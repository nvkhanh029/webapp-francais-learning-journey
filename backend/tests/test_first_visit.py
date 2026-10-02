"""First visit is derived from Dashboard data, not stored (API Contract 8.1).

The contract has no first-visit field and no new column. The frontend treats a
learner as a first-time visitor when the sum of progress.*.learned is 0 and
streak.longest is 0, so these tests pin the two inputs and the absence of any
dedicated field or column.
"""
import sqlite3

import pytest

from tests.test_practice import _answers, _practice_setup, _start_normal, _submit

pytestmark = pytest.mark.flask

DASHBOARD_KEYS = {"today", "streak", "progress", "continue_learning", "review_later_count",
                  "mixed_practice", "recent_practice"}


def is_first_visit(dashboard):
    """The rule documented in API Contract 8.1."""
    learned = sum(module["learned"] for module in dashboard["progress"].values())
    return learned == 0 and dashboard["streak"]["longest"] == 0


def dashboard(client):
    response = client.get("/api/v1/me/dashboard")
    assert response.status_code == 200
    return response.json["data"]


@pytest.fixture
def learner(client, database_path):
    _practice_setup(client, database_path)
    with sqlite3.connect(database_path) as db:  # module row Continue Learning needs
        db.execute("INSERT INTO grammar_parts (id, title_fr, sort_order) VALUES (1, 'Part', 10)")
        db.execute("INSERT INTO grammar_chapters (id, part_id, title_fr, sort_order) VALUES (1, 1, 'Chapitre', 10)")
        db.execute("INSERT INTO grammar_lessons (learning_unit_id, chapter_id, sort_order, content_vi, content_en) "
                   "VALUES (1, 1, 10, 'x', 'x')")
    return client


def test_new_learner_is_a_first_visit(learner):
    data = dashboard(learner)
    assert data["streak"] == {"current": 0, "longest": 0, "active_today": False}
    assert all(module["learned"] == 0 for module in data["progress"].values())
    assert is_first_visit(data)


def test_dashboard_has_no_dedicated_first_visit_field(learner):
    data = dashboard(learner)
    assert set(data) == DASHBOARD_KEYS
    assert not [key for key in data if "first" in key or "visit" in key]


def test_repeated_dashboard_reads_and_logins_do_not_end_the_first_visit(client, database_path):
    client.post("/api/v1/auth/register", json={"email": "new@example.test", "password": "long-enough-pw"})
    for _ in range(3):
        client.post("/api/v1/auth/logout")
        assert client.post("/api/v1/auth/login",
                           json={"email": "new@example.test", "password": "long-enough-pw"}).status_code == 200
        assert is_first_visit(dashboard(client))


def test_opening_a_unit_alone_is_still_a_first_visit(learner):
    assert learner.post("/api/v1/me/learning-units/fixture-grammar/open").status_code == 200
    data = dashboard(learner)
    assert is_first_visit(data)


def test_marking_a_unit_learned_ends_the_first_visit(learner):
    assert learner.patch("/api/v1/me/learning-units/fixture-grammar/state", json={"learned": True}).status_code == 200
    assert not is_first_visit(dashboard(learner))


def test_review_later_alone_does_not_end_the_first_visit(learner):
    assert learner.patch("/api/v1/me/learning-units/fixture-grammar/state", json={"review_later": True}).status_code == 200
    assert is_first_visit(dashboard(learner))


def test_completed_practice_ends_the_first_visit(learner):
    run = _start_normal(learner)
    assert _submit(learner, run["practice_run_id"], _answers()).status_code == 200
    data = dashboard(learner)
    assert data["streak"]["longest"] == 1
    assert not is_first_visit(data)


def test_unmarking_does_not_bring_back_the_first_visit_after_practice(learner):
    learner.patch("/api/v1/me/learning-units/fixture-grammar/state", json={"learned": True})
    run = _start_normal(learner)
    _submit(learner, run["practice_run_id"], _answers())
    learner.patch("/api/v1/me/learning-units/fixture-grammar/state", json={"learned": False})
    data = dashboard(learner)
    assert sum(module["learned"] for module in data["progress"].values()) == 0
    assert data["streak"]["longest"] == 1
    assert not is_first_visit(data)


def test_first_visit_is_not_stored_in_any_column(database_path):
    with sqlite3.connect(database_path) as db:
        users = [row[1] for row in db.execute("PRAGMA table_info(users)")]
        tables = [row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type = 'table'")]
        columns = {(table, row[1]) for table in tables for row in db.execute(f"PRAGMA table_info({table})")}
    assert users == ["id", "email", "password_hash", "support_language", "created_at"]
    assert not [pair for pair in columns if "first" in pair[1] or "visit" in pair[1] or "login" in pair[1]]


def test_current_user_model_carries_no_first_visit_flag(learner):
    assert learner.get("/api/v1/me").json["data"]["user"].keys() == {"email", "support_language"}
