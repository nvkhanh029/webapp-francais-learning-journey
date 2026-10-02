"""Learner state and Review Later behavior."""
import sqlite3

import pytest

pytestmark = pytest.mark.flask


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


@pytest.fixture
def learner(client, database_path):
    """Create a logged-in learner and return the user id."""
    _insert_user(database_path)
    _login(client, 1)
    return 1


# --- Open a learning unit ---------------------------------------------------

def test_open_creates_state_and_sets_last_opened_at(client, database_path, learner):
    """Opening a unit creates state and sets last_opened_at only."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    response = client.post("/api/v1/me/learning-units/articles-definis/open")
    assert response.status_code == 200
    assert response.json["data"] == {"slug": "articles-definis", "opened": True}
    with sqlite3.connect(database_path) as db:
        row = db.execute(
            "SELECT learned_at, review_later, last_opened_at FROM user_learning_state "
            "WHERE user_id = 1 AND learning_unit_id = 1"
        ).fetchone()
    assert row[0] is None
    assert row[1] == 0
    assert row[2] is not None


def test_open_does_not_mark_learned_or_touch_review_later(client, database_path, learner):
    """Opening a unit leaves learned and review_later untouched."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    client.post("/api/v1/me/learning-units/articles-definis/open")
    with sqlite3.connect(database_path) as db:
        row = db.execute(
            "SELECT learned_at, review_later FROM user_learning_state "
            "WHERE user_id = 1 AND learning_unit_id = 1"
        ).fetchone()
    assert row == (None, 0)


def test_open_unknown_slug_is_404(client, learner):
    """Opening an unknown slug returns a learning_unit_not_found error."""
    response = client.post("/api/v1/me/learning-units/does-not-exist/open")
    assert response.status_code == 404
    assert response.json["error"]["code"] == "learning_unit_not_found"


def test_open_requires_authentication(client, database_path):
    """Confirm opening a unit requires authentication."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    response = client.post("/api/v1/me/learning-units/articles-definis/open")
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


# --- Mark learned / Review Later state --------------------------------------

def test_mark_as_learned_sets_learned_state(client, database_path, learner):
    """Marking learned sets the learned flag and leaves review_later false."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    response = client.patch("/api/v1/me/learning-units/articles-definis/state", json={"learned": True})
    assert response.status_code == 200
    assert response.json["data"] == {
        "slug": "articles-definis",
        "state": {"learned": True, "review_later": False},
    }


def test_repeated_mark_as_learned_does_not_duplicate_or_move_timestamp(client, database_path, learner):
    """Repeated learned updates keep one row and the original timestamp."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    client.patch("/api/v1/me/learning-units/articles-definis/state", json={"learned": True})
    with sqlite3.connect(database_path) as db:
        first_learned_at = db.execute(
            "SELECT learned_at FROM user_learning_state WHERE user_id = 1 AND learning_unit_id = 1"
        ).fetchone()[0]

    response = client.patch("/api/v1/me/learning-units/articles-definis/state", json={"learned": True})

    with sqlite3.connect(database_path) as db:
        second_learned_at, row_count = db.execute(
            "SELECT learned_at, "
            "(SELECT COUNT(*) FROM user_learning_state WHERE user_id = 1 AND learning_unit_id = 1) "
            "FROM user_learning_state WHERE user_id = 1 AND learning_unit_id = 1"
        ).fetchone()
    assert response.status_code == 200
    assert first_learned_at == second_learned_at
    assert row_count == 1


def test_unmark_clears_learned_state(client, database_path, learner):
    """Unmarking learned clears the learned flag."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    client.patch("/api/v1/me/learning-units/articles-definis/state", json={"learned": True})
    response = client.patch("/api/v1/me/learning-units/articles-definis/state", json={"learned": False})
    assert response.status_code == 200
    assert response.json["data"]["state"]["learned"] is False


def test_review_later_is_independent_of_learned(client, database_path, learner):
    """Confirm review_later can be set while learned stays true."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    client.patch("/api/v1/me/learning-units/articles-definis/state", json={"learned": True})
    response = client.patch("/api/v1/me/learning-units/articles-definis/state", json={"review_later": True})
    assert response.status_code == 200
    assert response.json["data"]["state"] == {"learned": True, "review_later": True}


def test_review_later_only_update_does_not_change_learned(client, database_path, learner):
    """A review_later-only update leaves learned unchanged."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    client.patch("/api/v1/me/learning-units/articles-definis/state", json={"review_later": True})
    response = client.patch("/api/v1/me/learning-units/articles-definis/state", json={"review_later": False})
    assert response.status_code == 200
    assert response.json["data"]["state"] == {"learned": False, "review_later": False}


def test_state_requires_at_least_one_field(client, database_path, learner):
    """Confirm an empty state update is rejected."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    response = client.patch("/api/v1/me/learning-units/articles-definis/state", json={})
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"


def test_state_rejects_non_boolean_value(client, database_path, learner):
    """Confirm non-boolean state values are rejected."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    response = client.patch("/api/v1/me/learning-units/articles-definis/state", json={"learned": "yes"})
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"


def test_state_unknown_slug_is_404(client, learner):
    """Updating an unknown slug returns a learning_unit_not_found error."""
    response = client.patch("/api/v1/me/learning-units/does-not-exist/state", json={"learned": True})
    assert response.status_code == 404
    assert response.json["error"]["code"] == "learning_unit_not_found"


def test_state_requires_authentication(client, database_path):
    """Confirm state updates require authentication."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    response = client.patch("/api/v1/me/learning-units/articles-definis/state", json={"learned": True})
    assert response.status_code == 401


# --- Side effects and the Review Later list ---------------------------------

def test_learning_state_actions_do_not_create_practice_history(client, database_path, learner):
    """Confirm state actions never create practice history."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    client.post("/api/v1/me/learning-units/articles-definis/open")
    client.patch("/api/v1/me/learning-units/articles-definis/state", json={"learned": True, "review_later": True})
    with sqlite3.connect(database_path) as db:
        count = db.execute("SELECT COUNT(*) FROM practice_sessions").fetchone()[0]
    assert count == 0


def test_review_later_list_empty_state(client, learner):
    """Confirm the Review Later list is empty for an unmarked learner."""
    response = client.get("/api/v1/me/review-later")
    assert response.status_code == 200
    assert response.json["data"] == {"items": []}


def test_review_later_list_reflects_marked_units_and_localizes_title(client, database_path, learner):
    """Confirm the list returns marked units with localized titles."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    _insert_learning_unit(database_path, unit_id=2, unit_type="vocabulary", slug="pain-viennoiseries-1")
    client.patch("/api/v1/me/learning-units/articles-definis/state", json={"review_later": True})
    client.patch(
        "/api/v1/me/learning-units/pain-viennoiseries-1/state",
        json={"learned": True, "review_later": True},
    )

    response = client.get("/api/v1/me/review-later")

    assert response.status_code == 200
    items = response.json["data"]["items"]
    assert len(items) == 2
    grammar_item = next(item for item in items if item["slug"] == "articles-definis")
    assert grammar_item == {
        "slug": "articles-definis",
        "unit_type": "grammar",
        "title_fr": "Fixture FR",
        "title": "Fixture VI",
        "learned": False,
    }
    vocabulary_item = next(item for item in items if item["slug"] == "pain-viennoiseries-1")
    assert vocabulary_item["learned"] is True
    assert "review_later" not in vocabulary_item


def test_review_later_list_excludes_unmarked_units(client, database_path, learner):
    """Confirm the list omits units not marked Review Later."""
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="articles-definis")
    response = client.get("/api/v1/me/review-later")
    assert response.json["data"] == {"items": []}


def test_review_later_requires_authentication(client):
    """Confirm the Review Later list requires authentication."""
    response = client.get("/api/v1/me/review-later")
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"
