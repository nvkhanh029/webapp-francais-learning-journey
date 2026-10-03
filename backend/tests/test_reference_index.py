"""GET /api/v1/references: reference index (API Contract 12.1)."""
import sqlite3

import pytest

from tests.test_dashboard import _insert_user, _login

pytestmark = pytest.mark.flask

URL = "/api/v1/references"


def page(db, page_id, slug, sort_order, *, vi="Tieu de VI", en="Title EN"):
    db.execute("INSERT INTO reference_pages (id, slug, title_fr, title_vi, title_en, content_vi, content_en, sort_order) "
               "VALUES (?, ?, ?, ?, ?, 'SECRET-CONTENT-VI', 'SECRET-CONTENT-EN', ?)",
               (page_id, slug, f"FR {slug}", vi, en, sort_order))


@pytest.fixture
def learner(client, database_path):
    _insert_user(database_path, support_language="vi")
    _login(client, 1)
    return client


def test_requires_authentication(client):
    response = client.get(URL)
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


def test_empty_index(learner):
    response = learner.get(URL)
    assert response.status_code == 200
    assert response.json == {"data": {"references": []}}


def test_entry_shape_is_slug_and_titles_only(learner, database_path):
    with sqlite3.connect(database_path) as db:
        page(db, 1, "french-alphabet-accents", 10)
    response = learner.get(URL)
    assert response.json == {"data": {"references": [
        {"slug": "french-alphabet-accents", "title_fr": "FR french-alphabet-accents", "title": "Tieu de VI"}]}}
    assert "SECRET-CONTENT" not in response.get_data(as_text=True)
    assert "state" not in response.get_data(as_text=True)


def test_ordered_by_sort_order_not_by_id(learner, database_path):
    with sqlite3.connect(database_path) as db:
        page(db, 1, "third", 30)
        page(db, 2, "first", 10)
        page(db, 3, "second", 20)
    slugs = [entry["slug"] for entry in learner.get(URL).json["data"]["references"]]
    assert slugs == ["first", "second", "third"]


@pytest.mark.parametrize("language, title", [("vi", "Tieu de VI"), ("en", "Title EN")])
def test_title_follows_the_support_language(learner, database_path, language, title):
    with sqlite3.connect(database_path) as db:
        page(db, 1, "p", 10)
        db.execute("UPDATE users SET support_language = ?", (language,))
    assert learner.get(URL).json["data"]["references"][0]["title"] == title


def test_unset_language_uses_vietnamese_without_persisting_it(learner, database_path):
    with sqlite3.connect(database_path) as db:
        page(db, 1, "p", 10)
        db.execute("UPDATE users SET support_language = NULL")
    assert learner.get(URL).json["data"]["references"][0]["title"] == "Tieu de VI"
    with sqlite3.connect(database_path) as db:
        assert db.execute("SELECT support_language FROM users").fetchone()[0] is None


def test_missing_localized_title_falls_back_to_french(learner, database_path):
    with sqlite3.connect(database_path) as db:
        page(db, 1, "p", 10, vi=None, en=None)
    entry = learner.get(URL).json["data"]["references"][0]
    assert entry["title"] == entry["title_fr"] == "FR p"


def test_index_is_read_only_and_creates_no_learner_state(learner, database_path):
    with sqlite3.connect(database_path) as db:
        page(db, 1, "p", 10)
    learner.get(URL)
    learner.get(URL + "/p")
    with sqlite3.connect(database_path) as db:
        for table in ("user_learning_state", "practice_sessions", "learning_units"):
            assert db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] == 0
    data = learner.get("/api/v1/me/dashboard").json["data"]
    assert data["continue_learning"] is None and data["streak"]["longest"] == 0


def test_page_detail_endpoint_still_works_next_to_the_index(learner, database_path):
    with sqlite3.connect(database_path) as db:
        page(db, 1, "p", 10)
    detail = learner.get(URL + "/p")
    assert detail.status_code == 200 and detail.json["data"]["content"] == "SECRET-CONTENT-VI"


def test_write_methods_are_not_allowed(learner):
    assert learner.post(URL).status_code == 405
