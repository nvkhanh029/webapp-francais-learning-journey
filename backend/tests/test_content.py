"""Member 5: Conjugation and Reference content endpoints (API Contracts §11-12).

Grammar/Vocabulary content tests remain TODO for Members 3-4. Fixture data is
synthetic structural material from tests/support.py, never curriculum.
"""
import sqlite3

import pytest

import seed
from tests.support import node, read_json, write_json

pytestmark = pytest.mark.flask

VI_LESSON_CONTENT = "Nội dung bài học tiếng Việt."
EN_LESSON_CONTENT = "English lesson content."
VI_REFERENCE_CONTENT = "Bảng chữ cái và dấu tiếng Pháp."
EN_REFERENCE_CONTENT = "French alphabet and accents reference."


def _add_conjugation(root, slug, tense, lesson_order):
    """Add a lesson sharing authored parent metadata; keys are source-only."""
    folder = root/"conjugation"/slug
    write_json(folder/"meta.json", {"slug": slug, "title_fr": f"Fixture {slug}",
                                    "sort_order": lesson_order, "tense": tense})
    for language in ("vi", "en"):
        (folder/f"{language}.md").write_text("Synthetic test text, not curriculum.",
                                             encoding="utf-8")


def _localize_sources(root):
    """Make VI/EN distinguishable before seeding; source files stay authoritative."""
    conjugation = root/"conjugation"/"fixture-conjugation"
    meta = read_json(conjugation/"meta.json")
    meta["title_vi"] = "Động từ có quy tắc"
    meta["title_en"] = "Regular -ER verbs"
    meta["tense"]["title_vi"] = "Thì hiện tại"
    meta["tense"]["title_en"] = "Present tense"
    write_json(conjugation/"meta.json", meta)
    (conjugation/"vi.md").write_text(VI_LESSON_CONTENT, encoding="utf-8")
    (conjugation/"en.md").write_text(EN_LESSON_CONTENT, encoding="utf-8")

    reference = root/"reference"/"fixture-reference"
    meta = read_json(reference/"meta.json")
    meta["title_vi"] = "Bảng chữ cái và dấu"
    meta["title_en"] = "Alphabet and accents"
    write_json(reference/"meta.json", meta)
    (reference/"vi.md").write_text(VI_REFERENCE_CONTENT, encoding="utf-8")
    (reference/"en.md").write_text(EN_REFERENCE_CONTENT, encoding="utf-8")


def _authenticate(client, database_path):
    with sqlite3.connect(database_path) as connection:
        connection.execute(
            "INSERT INTO users(id,email,password_hash,created_at) "
            "VALUES(1,'fixture@example.test','test-only-hash','test')"
        )
    with client.session_transaction() as session:
        session["user_id"] = 1


def _set_support_language(database_path, value):
    with sqlite3.connect(database_path) as connection:
        connection.execute("UPDATE users SET support_language=? WHERE id=1", (value,))


def _support_language(database_path):
    with sqlite3.connect(database_path) as connection:
        return connection.execute(
            "SELECT support_language FROM users WHERE id=1"
        ).fetchone()[0]


@pytest.fixture
def learner(client, database_path, content_root):
    """Seeded content, authenticated learner, support language still unset."""
    _add_conjugation(content_root, "fixture-conjugation-b", node("fixture-tense"), 20)
    # node() hardcodes its title, so the second tense needs a distinct one
    # to prove grouping and sort_order ordering are not title/id artifacts.
    _add_conjugation(content_root, "fixture-conjugation-c",
                     {"key": "fixture-tense-two", "title_fr": "Fixture tense two",
                      "sort_order": 20}, 10)
    seed.seed_database(database_path, content_root)
    _authenticate(client, database_path)
    return client


@pytest.fixture
def localized_learner(client, database_path, content_root):
    _localize_sources(content_root)
    seed.seed_database(database_path, content_root)
    _authenticate(client, database_path)
    return client


@pytest.mark.parametrize("path", ["/api/v1/conjugation",
                                  "/api/v1/conjugation/lessons/fixture-conjugation",
                                  "/api/v1/references/fixture-reference"])
def test_content_endpoints_require_authentication(client, path):
    response = client.get(path)
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


def test_browse_groups_lessons_under_ordered_tenses(learner):
    response = learner.get("/api/v1/conjugation")
    assert response.status_code == 200
    assert set(response.json) == {"data"}
    tenses = response.json["data"]["tenses"]
    # Tense and lesson sequence comes from sort_order, never primary keys.
    assert [t["title_fr"] for t in tenses] == ["Fixture node", "Fixture tense two"]
    assert [[l["slug"] for l in t["lessons"]] for t in tenses] == [
        ["fixture-conjugation", "fixture-conjugation-b"],
        ["fixture-conjugation-c"],
    ]


def test_browse_returns_metadata_only_with_learner_state_fields(learner):
    tenses = learner.get("/api/v1/conjugation").json["data"]["tenses"]
    for tense in tenses:
        assert set(tense) == {"title_fr", "title", "lessons"}
        for lesson in tense["lessons"]:
            assert set(lesson) == {"slug", "title_fr", "title",
                                   "learned", "review_later"}
            assert lesson["learned"] is False
            assert lesson["review_later"] is False
            assert "content" not in lesson


def test_browse_title_falls_back_to_french_when_unlocalized(learner):
    tenses = learner.get("/api/v1/conjugation").json["data"]["tenses"]
    # Fixture sources intentionally omit title_vi/title_en (API Contract §4.9).
    assert all(t["title"] == t["title_fr"] for t in tenses)
    assert all(l["title"] == l["title_fr"]
               for t in tenses for l in t["lessons"])


def test_browse_titles_follow_support_language(localized_learner, database_path):
    tenses = localized_learner.get("/api/v1/conjugation").json["data"]["tenses"]
    # Unset preference reads Vietnamese as the documented temporary fallback.
    assert tenses[0]["title"] == "Thì hiện tại"
    assert tenses[0]["lessons"][0]["title"] == "Động từ có quy tắc"

    _set_support_language(database_path, "en")
    tenses = localized_learner.get("/api/v1/conjugation").json["data"]["tenses"]
    assert tenses[0]["title"] == "Present tense"
    assert tenses[0]["lessons"][0]["title"] == "Regular -ER verbs"


def test_lesson_detail_returns_context_content_and_state(learner):
    response = learner.get("/api/v1/conjugation/lessons/fixture-conjugation")
    assert response.status_code == 200
    data = response.json["data"]
    assert set(data) == {"slug", "title_fr", "title", "context", "content", "state"}
    assert data["slug"] == "fixture-conjugation"
    assert data["title_fr"] == "Fixture title"
    assert data["title"] == "Fixture title"
    assert set(data["context"]) == {"tense"}
    assert data["context"]["tense"]["title_fr"] == "Fixture node"
    assert data["content"] == "Synthetic test text, not curriculum."
    assert set(data["state"]) == {"learned", "review_later"}
    assert data["state"] == {"learned": False, "review_later": False}


def test_lesson_detail_localizes_content_without_persisting_fallback(
        localized_learner, database_path):
    response = localized_learner.get("/api/v1/conjugation/lessons/fixture-conjugation")
    data = response.json["data"]
    assert data["content"] == VI_LESSON_CONTENT
    assert data["title"] == "Động từ có quy tắc"
    assert data["context"]["tense"]["title"] == "Thì hiện tại"
    # FR-LANG-07: the null -> vi read fallback must never be written back.
    assert _support_language(database_path) is None

    _set_support_language(database_path, "en")
    data = localized_learner.get(
        "/api/v1/conjugation/lessons/fixture-conjugation").json["data"]
    assert data["content"] == EN_LESSON_CONTENT
    assert data["title"] == "Regular -ER verbs"
    assert data["context"]["tense"]["title"] == "Present tense"
    assert _support_language(database_path) == "en"


def test_lesson_detail_unknown_slug_is_contract_404(learner):
    response = learner.get("/api/v1/conjugation/lessons/no-such-lesson")
    assert response.status_code == 404
    assert set(response.json) == {"error"}
    assert set(response.json["error"]) == {"code", "message", "details"}
    assert response.json["error"]["code"] == "learning_unit_not_found"


def test_lesson_detail_rejects_another_modules_slug(learner):
    # fixture-grammar exists as a learning unit but not as a Conjugation lesson.
    response = learner.get("/api/v1/conjugation/lessons/fixture-grammar")
    assert response.status_code == 404
    assert response.json["error"]["code"] == "learning_unit_not_found"


def test_reference_detail_is_reference_only_content(learner):
    response = learner.get("/api/v1/references/fixture-reference")
    assert response.status_code == 200
    assert set(response.json) == {"data"}
    data = response.json["data"]
    # No learner state object: reference pages are not learning units (BR-11).
    assert set(data) == {"slug", "title_fr", "title", "content"}
    assert data["slug"] == "fixture-reference"
    assert data["title"] == "Fixture title"
    assert data["content"] == "Synthetic test text, not curriculum."


def test_reference_detail_localizes_without_persisting_fallback(
        localized_learner, database_path):
    data = localized_learner.get(
        "/api/v1/references/fixture-reference").json["data"]
    assert data["content"] == VI_REFERENCE_CONTENT
    assert data["title"] == "Bảng chữ cái và dấu"
    assert _support_language(database_path) is None

    _set_support_language(database_path, "en")
    data = localized_learner.get(
        "/api/v1/references/fixture-reference").json["data"]
    assert data["content"] == EN_REFERENCE_CONTENT
    assert data["title"] == "Alphabet and accents"


@pytest.mark.parametrize("path", ["/api/v1/references/no-such-page",
                                  # A Conjugation slug is not a reference slug.
                                  "/api/v1/references/fixture-conjugation"])
def test_reference_detail_unknown_slug_is_contract_404(learner, path):
    response = learner.get(path)
    assert response.status_code == 404
    assert response.json["error"]["code"] == "reference_not_found"


def test_content_reads_create_no_learner_state_or_history(learner, database_path):
    assert learner.get("/api/v1/conjugation").status_code == 200
    assert learner.get(
        "/api/v1/conjugation/lessons/fixture-conjugation").status_code == 200
    assert learner.get(
        "/api/v1/references/fixture-reference").status_code == 200

    with sqlite3.connect(database_path) as connection:
        # GET must not record last_opened_at, progress, or Practice History.
        assert connection.execute(
            "SELECT count(*) FROM user_learning_state").fetchone()[0] == 0
        assert connection.execute(
            "SELECT count(*) FROM practice_sessions").fetchone()[0] == 0
