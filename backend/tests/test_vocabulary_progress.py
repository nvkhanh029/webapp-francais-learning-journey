"""GET /api/v1/vocabulary `progress` (API Contract 10.1).

progress counts Vocabulary Study Units the learner marked as learned against the
Study Units available; it never counts individual words and always equals
progress.vocabulary on the Dashboard.
"""
import sqlite3

import pytest

from tests.test_dashboard import _insert_user, _login

pytestmark = pytest.mark.flask


@pytest.fixture
def learner(client, database_path):
    _insert_user(database_path)
    _login(client, 1)
    return client


def study_unit(db, unit_id, subtopic_id, sort_order, *, words=0):
    db.execute("INSERT INTO learning_units (id, unit_type, slug, title_fr) VALUES (?, 'vocabulary', ?, 'FR')",
               (unit_id, f"vocab-{unit_id}"))
    db.execute("INSERT INTO vocabulary_study_units (learning_unit_id, subtopic_id, sort_order) VALUES (?, ?, ?)",
               (unit_id, subtopic_id, sort_order))
    for index in range(1, words + 1):
        db.execute("INSERT INTO vocabulary_words (study_unit_id, french, meaning_vi, meaning_en, sort_order) "
                   "VALUES (?, ?, 'vi', 'en', ?)", (unit_id, f"mot-{unit_id}-{index}", index))


@pytest.fixture
def curriculum(database_path):
    """Three Study Units in two subtopics (one with many words), plus other modules."""
    with sqlite3.connect(database_path) as db:
        db.execute("INSERT INTO vocabulary_categories (id, title_fr, sort_order) VALUES (1, 'Cat', 10)")
        db.execute("INSERT INTO vocabulary_topics (id, category_id, slug, title_fr, sort_order) "
                   "VALUES (1, 1, 'topic', 'Topic', 10)")
        for sub_id in (1, 2):
            db.execute("INSERT INTO vocabulary_subtopics (id, topic_id, title_fr, sort_order) VALUES (?, 1, 'Sub', ?)",
                       (sub_id, sub_id * 10))
        study_unit(db, 1, 1, 10, words=12)
        study_unit(db, 2, 1, 20, words=1)
        study_unit(db, 3, 2, 10, words=0)
        for unit_id, unit_type in ((10, "grammar"), (11, "conjugation")):
            db.execute("INSERT INTO learning_units (id, unit_type, slug, title_fr) VALUES (?, ?, ?, 'FR')",
                       (unit_id, unit_type, f"{unit_type}-unit"))


def learn(database_path, *unit_ids, user_id=1):
    with sqlite3.connect(database_path) as db:
        for unit_id in unit_ids:
            db.execute("INSERT INTO user_learning_state (user_id, learning_unit_id, learned_at, review_later) "
                       "VALUES (?, ?, '2026-09-20T10:00:00+07:00', 0)", (user_id, unit_id))


def progress(client):
    response = client.get("/api/v1/vocabulary")
    assert response.status_code == 200
    return response.json["data"]["progress"]


def test_new_learner_has_zero_of_the_available_study_units(learner, curriculum):
    assert progress(learner) == {"learned": 0, "total": 3}


def test_counts_study_units_not_words(learner, database_path, curriculum):
    learn(database_path, 1)  # a 12-word unit is still one Study Unit
    assert progress(learner) == {"learned": 1, "total": 3}


def test_only_vocabulary_units_count(learner, database_path, curriculum):
    learn(database_path, 10, 11, 2)
    assert progress(learner) == {"learned": 1, "total": 3}


def test_progress_is_per_learner(learner, database_path, curriculum):
    _insert_user(database_path, user_id=2)
    learn(database_path, 1, 2, 3, user_id=2)
    learn(database_path, 3)
    assert progress(learner) == {"learned": 1, "total": 3}


def test_unmarking_and_re_marking_does_not_double_count(learner, database_path, curriculum):
    url = "/api/v1/me/learning-units/vocab-1/state"
    assert learner.patch(url, json={"learned": True}).status_code == 200
    assert learner.patch(url, json={"learned": True}).status_code == 200
    assert progress(learner) == {"learned": 1, "total": 3}
    assert learner.patch(url, json={"learned": False}).status_code == 200
    assert progress(learner) == {"learned": 0, "total": 3}


def test_review_later_and_open_do_not_change_progress(learner, curriculum):
    learner.patch("/api/v1/me/learning-units/vocab-1/state", json={"review_later": True})
    learner.post("/api/v1/me/learning-units/vocab-2/open")
    assert progress(learner) == {"learned": 0, "total": 3}


def test_progress_equals_dashboard_vocabulary_progress(learner, database_path, curriculum):
    for learned in ([], [1], [1, 2, 3]):
        with sqlite3.connect(database_path) as db:
            db.execute("DELETE FROM user_learning_state")
        learn(database_path, *learned)
        dashboard = learner.get("/api/v1/me/dashboard").json["data"]["progress"]["vocabulary"]
        assert progress(learner) == dashboard == {"learned": len(learned), "total": 3}


def test_empty_vocabulary_module_reports_zero_of_zero(learner):
    assert progress(learner) == {"learned": 0, "total": 0}


def test_browse_payload_still_stops_at_topic_metadata(learner, curriculum):
    data = learner.get("/api/v1/vocabulary").json["data"]
    assert set(data) == {"progress", "categories"}
    assert "study_units" not in data["categories"][0]["topics"][0]
