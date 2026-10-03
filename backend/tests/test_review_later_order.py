"""GET /me/review-later is in curriculum order (API Contract 13.3).

Module order grammar -> vocabulary -> conjugation, then the parent sort_order
chain, then the unit's own sort_order: the same order as the browse endpoints,
and independent of when units were saved, opened or learned.
"""
import sqlite3

import pytest

import seed
from tests.test_dashboard import _insert_user, _login

pytestmark = pytest.mark.flask

URL = "/api/v1/me/review-later"


@pytest.fixture
def learner(client, database_path):
    _insert_user(database_path)
    _login(client, 1)
    return client


def unit(db, unit_id, unit_type, slug):
    db.execute("INSERT INTO learning_units (id, unit_type, slug, title_fr) VALUES (?, ?, ?, ?)",
               (unit_id, unit_type, slug, f"FR {slug}"))


@pytest.fixture
def curriculum(database_path):
    """Ids deliberately run opposite to curriculum order in every module."""
    with sqlite3.connect(database_path) as db:
        # Grammar: part(10,20) > chapter > lesson. Highest ids come first in the curriculum.
        db.execute("INSERT INTO grammar_parts (id, title_fr, sort_order) VALUES (1, 'P2', 20), (2, 'P1', 10)")
        db.execute("INSERT INTO grammar_chapters (id, part_id, title_fr, sort_order) VALUES "
                   "(1, 1, 'P2C1', 10), (2, 2, 'P1C2', 20), (3, 2, 'P1C1', 10)")
        for unit_id, slug, chapter_id, order in [(1, "g-p2c1-l1", 1, 10), (2, "g-p1c2-l1", 2, 10),
                                                  (3, "g-p1c1-l2", 3, 20), (4, "g-p1c1-l1", 3, 10)]:
            unit(db, unit_id, "grammar", slug)
            db.execute("INSERT INTO grammar_lessons (learning_unit_id, chapter_id, sort_order, content_vi, content_en) "
                       "VALUES (?, ?, ?, 'x', 'x')", (unit_id, chapter_id, order))
        # Vocabulary: category > topic > subtopic > study unit.
        db.execute("INSERT INTO vocabulary_categories (id, title_fr, sort_order) VALUES (1, 'C2', 20), (2, 'C1', 10)")
        db.execute("INSERT INTO vocabulary_topics (id, category_id, slug, title_fr, sort_order) VALUES "
                   "(1, 1, 't-c2', 'T', 10), (2, 2, 't-c1b', 'T', 20), (3, 2, 't-c1a', 'T', 10)")
        db.execute("INSERT INTO vocabulary_subtopics (id, topic_id, title_fr, sort_order) VALUES "
                   "(1, 1, 'S', 10), (2, 2, 'S', 10), (3, 3, 'S', 20), (4, 3, 'S', 10)")
        for unit_id, slug, sub_id, order in [(11, "v-c2", 1, 10), (12, "v-c1b", 2, 10), (13, "v-c1a-s2", 3, 10),
                                              (14, "v-c1a-s1-u2", 4, 20), (15, "v-c1a-s1-u1", 4, 10)]:
            unit(db, unit_id, "vocabulary", slug)
            db.execute("INSERT INTO vocabulary_study_units (learning_unit_id, subtopic_id, sort_order) "
                       "VALUES (?, ?, ?)", (unit_id, sub_id, order))
        # Conjugation: tense > lesson, with the smallest ids of all.
        db.execute("INSERT INTO conjugation_tenses (id, title_fr, sort_order) VALUES (1, 'T2', 20), (2, 'T1', 10)")
        for unit_id, slug, tense_id, order in [(21, "c-t2", 1, 10), (22, "c-t1-l2", 2, 20), (23, "c-t1-l1", 2, 10)]:
            unit(db, unit_id, "conjugation", slug)
            db.execute("INSERT INTO conjugation_lessons (learning_unit_id, tense_id, sort_order, content_vi, content_en) "
                       "VALUES (?, ?, ?, 'x', 'x')", (unit_id, tense_id, order))


EXPECTED = ["g-p1c1-l1", "g-p1c1-l2", "g-p1c2-l1", "g-p2c1-l1",
            "v-c1a-s1-u1", "v-c1a-s1-u2", "v-c1a-s2", "v-c1b", "v-c2",
            "c-t1-l1", "c-t1-l2", "c-t2"]


def save(client, slug, **state):
    response = client.patch(f"/api/v1/me/learning-units/{slug}/state", json={"review_later": True, **state})
    assert response.status_code == 200


def slugs(client):
    response = client.get(URL)
    assert response.status_code == 200
    return [item["slug"] for item in response.json["data"]["items"]]


def test_modules_then_parent_chain_then_unit_order(learner, curriculum):
    for slug in reversed(EXPECTED):  # save in the opposite order
        save(learner, slug)
    assert slugs(learner) == EXPECTED


def test_order_does_not_depend_on_the_order_items_were_saved(learner, curriculum):
    for slug in ["c-t2", "v-c2", "g-p2c1-l1", "g-p1c1-l1", "v-c1a-s1-u1", "c-t1-l1"]:
        save(learner, slug)
    assert slugs(learner) == ["g-p1c1-l1", "g-p2c1-l1", "v-c1a-s1-u1", "v-c2", "c-t1-l1", "c-t2"]


def test_order_is_stable_when_units_are_opened_learned_or_re_saved(learner, curriculum):
    for slug in EXPECTED:
        save(learner, slug)
    before = slugs(learner)
    for slug in reversed(EXPECTED):
        learner.post(f"/api/v1/me/learning-units/{slug}/open")
    learner.patch("/api/v1/me/learning-units/g-p2c1-l1/state", json={"learned": True})
    learner.patch("/api/v1/me/learning-units/v-c1a-s1-u1/state", json={"review_later": False})
    learner.patch("/api/v1/me/learning-units/v-c1a-s1-u1/state", json={"review_later": True})
    learner.patch("/api/v1/me/learning-units/c-t1-l1/state", json={"learned": True, "review_later": True})
    assert slugs(learner) == before == EXPECTED


def test_learned_and_unlearned_units_are_both_listed_in_order(learner, curriculum):
    save(learner, "c-t1-l1", learned=True)
    save(learner, "g-p2c1-l1")
    save(learner, "g-p1c1-l1", learned=True)
    items = learner.get(URL).json["data"]["items"]
    assert [(i["slug"], i["learned"]) for i in items] == [
        ("g-p1c1-l1", True), ("g-p2c1-l1", False), ("c-t1-l1", True)]


def test_item_shape_is_unchanged(learner, curriculum):
    save(learner, "g-p1c1-l1")
    assert learner.get(URL).json["data"]["items"] == [
        {"slug": "g-p1c1-l1", "unit_type": "grammar", "title_fr": "FR g-p1c1-l1",
         "title": "FR g-p1c1-l1", "learned": False}]


def test_only_the_learners_own_items_are_returned(learner, database_path, curriculum):
    _insert_user(database_path, user_id=2)
    with sqlite3.connect(database_path) as db:
        db.execute("INSERT INTO user_learning_state (user_id, learning_unit_id, review_later) VALUES (2, 4, 1)")
    save(learner, "g-p1c1-l2")
    assert slugs(learner) == ["g-p1c1-l2"]


def test_units_without_a_module_row_still_list_deterministically(learner, database_path):
    with sqlite3.connect(database_path) as db:  # not valid curriculum, but must not crash or flip-flop
        for unit_id, slug in ((1, "z-orphan"), (2, "a-orphan")):
            unit(db, unit_id, "grammar", slug)
    save(learner, "z-orphan")
    save(learner, "a-orphan")
    assert slugs(learner) == ["a-orphan", "z-orphan"]


def test_review_later_order_matches_the_browse_endpoints_on_the_demo_content(client, database_path):
    seed.seed_database(database_path)  # the real authored demo content, in a throwaway database
    _insert_user(database_path)
    _login(client, 1)
    with sqlite3.connect(database_path) as db:
        rows = db.execute("SELECT slug FROM learning_units ORDER BY id DESC").fetchall()
    for (slug,) in rows:  # save in reverse id order
        save(client, slug)

    grammar = [lesson["slug"]
               for part in client.get("/api/v1/grammar").json["data"]["parts"]
               for chapter in part["chapters"] for lesson in chapter["lessons"]]
    vocabulary = []
    for category in client.get("/api/v1/vocabulary").json["data"]["categories"]:
        for topic in category["topics"]:
            detail = client.get(f"/api/v1/vocabulary/topics/{topic['slug']}").json["data"]
            vocabulary += [u["slug"] for sub in detail["subtopics"] for u in sub["study_units"]]
    conjugation = [lesson["slug"]
                   for tense in client.get("/api/v1/conjugation").json["data"]["tenses"]
                   for lesson in tense["lessons"]]

    assert grammar and vocabulary and conjugation
    assert slugs(client) == grammar + vocabulary + conjugation
