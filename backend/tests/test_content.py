"""Content endpoints: docs/api-contracts.md Sections 9-12.

Ownership per docs/repository-conventions.md Section 8:
- Grammar (Section 9) ............. Member 3 (TODO)
- Vocabulary (Section 10) ......... Member 4 (this block)
- Conjugation + Reference (§11-12)  Member 5 (TODO)

Each block uses its own `vocab_`/`grammar_`/`conjugation_`-prefixed helpers and
tests so the three owners can extend this file without name collisions.
"""
import sqlite3
import pytest
import seed

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
