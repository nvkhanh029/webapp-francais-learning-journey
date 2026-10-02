"""Content endpoints: docs/api-contracts.md Sections 9-12.

Ownership per docs/repository-conventions.md Section 8:
- Grammar (Section 9) ............. Member 3 (TODO)
- Vocabulary (Section 10) ......... Member 4 (this block)
- Conjugation + Reference (§11-12)  Member 5 (last block)

Each block uses its own `vocab_`/`grammar_`/`conjugation_`-prefixed helpers and
tests so the three owners can extend this file without name collisions.
"""
import sqlite3
import pytest
import seed
from tests.support import node, read_json, write_json

pytestmark = pytest.mark.flask


# ---------------------------------------------------------------------------
# Vocabulary block (Member 4): Section 10 browse / topic / study-unit.
# ---------------------------------------------------------------------------

def _vocab_setup(client, database_path, content_root, *, support_language="vi"):
    """Seed representative sources, create one learner, and log them in."""
    seed.seed_database(database_path, content_root)
    with sqlite3.connect(database_path) as db:
        db.execute(
            "INSERT INTO users (id, email, password_hash, support_language, created_at) "
            "VALUES (1, 'learner1@example.test', 'test-only-hash', ?, 'test')",
            (support_language,),
        )
    with client.session_transaction() as session:
        session["user_id"] = 1


def _vocab_set_state(database_path, slug, *, learned=False, review_later=False):
    """Insert learned / review-later state directly, without Member 2's endpoints."""
    with sqlite3.connect(database_path) as db:
        unit_id = db.execute(
            "SELECT id FROM learning_units WHERE slug = ?", (slug,)
        ).fetchone()[0]
        db.execute(
            "INSERT INTO user_learning_state "
            "(user_id, learning_unit_id, learned_at, review_later) "
            "VALUES (1, ?, ?, ?)",
            (unit_id, "2026-01-01T00:00:00+00:00" if learned else None,
             1 if review_later else 0),
        )


# -- Browse: GET /api/v1/vocabulary (contract §10.1) ------------------------

def test_vocab_browse_returns_categories_with_topics(client, database_path, content_root):
    """Browse payload is category -> topic metadata only."""
    _vocab_setup(client, database_path, content_root)
    response = client.get("/api/v1/vocabulary")
    assert response.status_code == 200
    assert response.json["data"] == {
        "categories": [{
            "title_fr": "Fixture category",
            "title": "Fixture category",  # fixture has no VI title -> title_fr fallback
            "topics": [{
                "slug": "fixture-topic",
                "title_fr": "Fixture topic",
                "title": "Fixture topic",
            }],
        }]
    }


def test_vocab_browse_stops_at_topic_metadata(client, database_path, content_root):
    """Deeper levels are not loaded by browse; the topic page owns them."""
    _vocab_setup(client, database_path, content_root)
    body = client.get("/api/v1/vocabulary").json["data"]
    assert "subtopics" not in body["categories"][0]
    assert "study_units" not in body["categories"][0]["topics"][0]


def test_vocab_browse_requires_authentication(client):
    """Vocabulary content is session-authenticated."""
    response = client.get("/api/v1/vocabulary")
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


# -- Topic: GET /api/v1/vocabulary/topics/{slug} (contract §10.2) -------------

def test_vocab_topic_detail_shape(client, database_path, content_root):
    """Topic page: category context + subtopics carrying study units."""
    _vocab_setup(client, database_path, content_root)
    response = client.get("/api/v1/vocabulary/topics/fixture-topic")
    assert response.status_code == 200
    assert response.json["data"] == {
        "slug": "fixture-topic",
        "title_fr": "Fixture topic",
        "title": "Fixture topic",
        "context": {"category": {
            "title_fr": "Fixture category", "title": "Fixture category"}},
        "subtopics": [{
            "title_fr": "Fixture subtopic",
            "title": "Fixture subtopic",
            "study_units": [{
                "slug": "fixture-words",
                "title_fr": "Fixture subtopic",
                "title": "Fixture subtopic",
                "learned": False,
                "review_later": False,
            }],
        }],
    }


def test_vocab_topic_unknown_slug_is_404(client, database_path, content_root):
    """Unknown topic slug uses the contract's topic_not_found code."""
    _vocab_setup(client, database_path, content_root)
    response = client.get("/api/v1/vocabulary/topics/does-not-exist")
    assert response.status_code == 404
    assert response.json["error"]["code"] == "topic_not_found"


def test_vocab_topic_enriches_learner_state(client, database_path, content_root):
    """learned/review_later reflect the learner's state rows per unit."""
    _vocab_setup(client, database_path, content_root)
    _vocab_set_state(database_path, "fixture-words", learned=True, review_later=True)
    units = client.get(
        "/api/v1/vocabulary/topics/fixture-topic"
    ).json["data"]["subtopics"][0]["study_units"]
    assert units[0]["learned"] is True
    assert units[0]["review_later"] is True


def test_vocab_topic_groups_units_by_subtopic_in_order(client, database_path, content_root):
    """Several units under one subtopic stay grouped and sort_order ordered."""
    _vocab_setup(client, database_path, content_root)
    # Add a second unit to the existing subtopic with a later sort_order.
    with sqlite3.connect(database_path) as db:
        subtopic_id = db.execute("SELECT id FROM vocabulary_subtopics").fetchone()[0]
        unit_id = db.execute(
            "INSERT INTO learning_units (unit_type, slug, title_fr) "
            "VALUES ('vocabulary', 'extra-unit', 'Extra FR')"
        ).lastrowid
        db.execute(
            "INSERT INTO vocabulary_study_units (learning_unit_id, subtopic_id, sort_order) "
            "VALUES (?, ?, 20)", (unit_id, subtopic_id),
        )
    subtopics = client.get(
        "/api/v1/vocabulary/topics/fixture-topic"
    ).json["data"]["subtopics"]
    assert len(subtopics) == 1
    assert [u["slug"] for u in subtopics[0]["study_units"]] == ["fixture-words", "extra-unit"]


def test_vocab_topic_requires_authentication(client):
    """Topic page is session-authenticated."""
    response = client.get("/api/v1/vocabulary/topics/fixture-topic")
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


# -- Study unit: GET /api/v1/vocabulary/study-units/{slug} (§10.3) ------------

def test_vocab_study_unit_shape_vi(client, database_path, content_root):
    """Study-unit shape: breadcrumb context, VI meanings, optional fields null."""
    _vocab_setup(client, database_path, content_root, support_language="vi")
    response = client.get("/api/v1/vocabulary/study-units/fixture-words")
    assert response.status_code == 200
    data = response.json["data"]
    assert data["slug"] == "fixture-words"
    assert data["context"]["topic"]["slug"] == "fixture-topic"
    assert data["context"]["subtopic"]["title_fr"] == "Fixture subtopic"
    assert data["entries"] == [
        {"french": f"fixture-{i}", "meaning": f"fixture-vi-{i}", "ipa": None,
         "example_fr": None, "example_translation": None}
        for i in range(3)
    ]
    assert data["state"] == {"learned": False, "review_later": False}


def test_vocab_study_unit_selects_english_meaning(client, database_path, content_root):
    """support_language=en selects meaning_en."""
    _vocab_setup(client, database_path, content_root, support_language="en")
    entries = client.get(
        "/api/v1/vocabulary/study-units/fixture-words"
    ).json["data"]["entries"]
    assert [e["meaning"] for e in entries] == ["fixture-en-0", "fixture-en-1", "fixture-en-2"]


def test_vocab_study_unit_null_language_falls_back_to_vi_without_persisting(
    client, database_path, content_root,
):
    """Unset language falls back to VI read-time only and is never stored."""
    _vocab_setup(client, database_path, content_root, support_language=None)
    entries = client.get(
        "/api/v1/vocabulary/study-units/fixture-words"
    ).json["data"]["entries"]
    assert entries[0]["meaning"] == "fixture-vi-0"
    # The fallback must not be persisted into the learner's preference.
    with sqlite3.connect(database_path) as db:
        stored = db.execute(
            "SELECT support_language FROM users WHERE id = 1"
        ).fetchone()[0]
    assert stored is None


def test_vocab_study_unit_unknown_slug_is_404(client, database_path, content_root):
    """Unknown unit slug -> learning_unit_not_found."""
    _vocab_setup(client, database_path, content_root)
    response = client.get("/api/v1/vocabulary/study-units/does-not-exist")
    assert response.status_code == 404
    assert response.json["error"]["code"] == "learning_unit_not_found"


def test_vocab_study_unit_rejects_other_module_slug(client, database_path, content_root):
    """A grammar slug is 404 here: the unit_type guard applies."""
    _vocab_setup(client, database_path, content_root)
    response = client.get("/api/v1/vocabulary/study-units/fixture-grammar")
    assert response.status_code == 404
    assert response.json["error"]["code"] == "learning_unit_not_found"


def test_vocab_study_unit_reflects_learner_state(client, database_path, content_root):
    """Unit state mirrors the learner's learned/review_later row."""
    _vocab_setup(client, database_path, content_root)
    _vocab_set_state(database_path, "fixture-words", learned=True, review_later=True)
    state = client.get(
        "/api/v1/vocabulary/study-units/fixture-words"
    ).json["data"]["state"]
    assert state == {"learned": True, "review_later": True}


def test_vocab_study_unit_requires_authentication(client):
    """Study-unit page is session-authenticated."""
    response = client.get("/api/v1/vocabulary/study-units/fixture-words")
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


# ---------------------------------------------------------------------------
# Conjugation + Reference block (Member 5): Sections 11-12.
# Fixture data is synthetic structural material from tests/support.py,
# never curriculum.
# ---------------------------------------------------------------------------

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


def test_state_fields_reflect_persisted_learner_state(learner, database_path):
    # Simulate actions taken via Member 2's learning-state endpoints.
    with sqlite3.connect(database_path) as connection:
        unit_ids = dict(connection.execute(
            "SELECT slug, id FROM learning_units WHERE unit_type='conjugation'"))
        connection.execute(
            "INSERT INTO user_learning_state(user_id,learning_unit_id,learned_at,review_later) "
            "VALUES(1,?,'2026-09-30T09:00:00',0)",
            (unit_ids["fixture-conjugation"],))
        connection.execute(
            "INSERT INTO user_learning_state(user_id,learning_unit_id,learned_at,review_later) "
            "VALUES(1,?,NULL,1)",
            (unit_ids["fixture-conjugation-b"],))

    detail = learner.get(
        "/api/v1/conjugation/lessons/fixture-conjugation").json["data"]
    assert detail["state"] == {"learned": True, "review_later": False}

    tenses = learner.get("/api/v1/conjugation").json["data"]["tenses"]
    states = {lesson["slug"]: (lesson["learned"], lesson["review_later"])
              for lesson in tenses[0]["lessons"]}
    assert states == {
        "fixture-conjugation": (True, False),
        "fixture-conjugation-b": (False, True),
    }


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