"""Dashboard continue_learning.parent / .position (API Contract 8.1).

parent.kind is chapter / subtopic / tense by module; position is the 1-based
place among the units of that same parent ordered by sort_order, never by id.
"""
import sqlite3

import pytest

from tests.test_dashboard import _insert_state, _insert_user, _login

pytestmark = pytest.mark.flask


@pytest.fixture
def learner(client, database_path):
    _insert_user(database_path, support_language="vi")
    _login(client, 1)
    return 1


def unit(db, unit_id, unit_type, slug, vi="Tieu de VI", en="Title EN"):
    db.execute("INSERT INTO learning_units (id, unit_type, slug, title_fr, title_vi, title_en) "
               "VALUES (?, ?, ?, ?, ?, ?)", (unit_id, unit_type, slug, f"FR {slug}", vi, en))


def grammar(db, unit_id, slug, chapter_id, sort_order):
    unit(db, unit_id, "grammar", slug)
    db.execute("INSERT INTO grammar_lessons (learning_unit_id, chapter_id, sort_order, content_vi, content_en) "
               "VALUES (?, ?, ?, 'x', 'x')", (unit_id, chapter_id, sort_order))


def chapter(db, chapter_id, sort_order, vi="Chuong VI", en="Chapter EN"):
    db.execute("INSERT OR IGNORE INTO grammar_parts (id, title_fr, sort_order) VALUES (1, 'Part', 10)")
    db.execute("INSERT INTO grammar_chapters (id, part_id, title_fr, title_vi, title_en, sort_order) "
               "VALUES (?, 1, ?, ?, ?, ?)", (chapter_id, f"Chapitre {chapter_id}", vi, en, sort_order))


def continue_learning(client, database_path, unit_id):
    _insert_state(database_path, unit_id=unit_id, last_opened_at="2026-09-20T10:00:00+07:00")
    response = client.get("/api/v1/me/dashboard")
    assert response.status_code == 200
    return response.json["data"]["continue_learning"]


def test_grammar_unit_reports_chapter_parent_and_position(client, database_path, learner):
    with sqlite3.connect(database_path) as db:
        chapter(db, 1, 10)
        chapter(db, 2, 20)
        grammar(db, 1, "first", 1, 10)
        grammar(db, 2, "other-chapter", 2, 10)
        grammar(db, 3, "third", 1, 30)
        grammar(db, 4, "second", 1, 20)
        grammar(db, 5, "fourth", 1, 40)
        grammar(db, 6, "fifth", 1, 50)
    result = continue_learning(client, database_path, 4)
    assert result["parent"] == {"kind": "chapter", "title_fr": "Chapitre 1", "title": "Chuong VI"}
    assert result["position"] == {"index": 2, "total": 5}  # sort_order 20, not id 4


@pytest.mark.parametrize("unit_id, expected", [(2, {"index": 1, "total": 3}), (1, {"index": 2, "total": 3}),
                                               (3, {"index": 3, "total": 3})])
def test_position_follows_sort_order_not_database_id(client, database_path, learner, unit_id, expected):
    with sqlite3.connect(database_path) as db:
        chapter(db, 1, 10)
        grammar(db, 1, "middle", 1, 20)
        grammar(db, 2, "first-by-order", 1, 10)
        grammar(db, 3, "last", 1, 30)
    assert continue_learning(client, database_path, unit_id)["position"] == expected


def test_only_unit_of_its_parent_is_one_of_one(client, database_path, learner):
    with sqlite3.connect(database_path) as db:
        chapter(db, 1, 10)
        grammar(db, 1, "alone", 1, 10)
    assert continue_learning(client, database_path, 1)["position"] == {"index": 1, "total": 1}


def test_vocabulary_unit_reports_subtopic_parent(client, database_path, learner):
    with sqlite3.connect(database_path) as db:
        db.execute("INSERT INTO vocabulary_categories (id, title_fr, sort_order) VALUES (1, 'Cat', 10)")
        db.execute("INSERT INTO vocabulary_topics (id, category_id, slug, title_fr, sort_order) "
                   "VALUES (1, 1, 'topic-1', 'Topic', 10)")
        for sub_id, order in ((1, 10), (2, 20)):
            db.execute("INSERT INTO vocabulary_subtopics (id, topic_id, title_fr, title_vi, title_en, sort_order) "
                       "VALUES (?, 1, ?, ?, ?, ?)", (sub_id, f"Sous-theme {sub_id}", f"Chu de con {sub_id}",
                                                   f"Subtopic {sub_id}", order))
        for unit_id, sub_id, order in ((1, 1, 10), (2, 2, 10), (3, 2, 20), (4, 2, 30)):
            unit(db, unit_id, "vocabulary", f"vocab-{unit_id}")
            db.execute("INSERT INTO vocabulary_study_units (learning_unit_id, subtopic_id, sort_order) "
                       "VALUES (?, ?, ?)", (unit_id, sub_id, order))
    result = continue_learning(client, database_path, 3)
    assert result["unit_type"] == "vocabulary"
    assert result["parent"] == {"kind": "subtopic", "title_fr": "Sous-theme 2", "title": "Chu de con 2"}
    assert result["position"] == {"index": 2, "total": 3}


def test_conjugation_unit_reports_tense_parent(client, database_path, learner):
    with sqlite3.connect(database_path) as db:
        db.execute("INSERT INTO conjugation_tenses (id, title_fr, title_vi, title_en, sort_order) "
                   "VALUES (1, 'Present', 'Hien tai', 'Present', 10)")
        for unit_id, order in ((1, 10), (2, 20)):
            unit(db, unit_id, "conjugation", f"conj-{unit_id}")
            db.execute("INSERT INTO conjugation_lessons (learning_unit_id, tense_id, sort_order, content_vi, content_en) "
                       "VALUES (?, 1, ?, 'x', 'x')", (unit_id, order))
    result = continue_learning(client, database_path, 2)
    assert result["parent"] == {"kind": "tense", "title_fr": "Present", "title": "Hien tai"}
    assert result["position"] == {"index": 2, "total": 2}


def test_parent_title_uses_the_support_language(client, database_path, learner):
    with sqlite3.connect(database_path) as db:
        chapter(db, 1, 10)
        grammar(db, 1, "unit", 1, 10)
        db.execute("UPDATE users SET support_language = 'en'")
    assert continue_learning(client, database_path, 1)["parent"]["title"] == "Chapter EN"


def test_parent_title_falls_back_to_french_when_localized_title_is_missing(client, database_path, learner):
    with sqlite3.connect(database_path) as db:
        chapter(db, 1, 10, vi=None, en=None)
        grammar(db, 1, "unit", 1, 10)
    parent = continue_learning(client, database_path, 1)["parent"]
    assert parent == {"kind": "chapter", "title_fr": "Chapitre 1", "title": "Chapitre 1"}


def test_unset_support_language_uses_the_vietnamese_fallback(client, database_path, learner):
    with sqlite3.connect(database_path) as db:
        chapter(db, 1, 10)
        grammar(db, 1, "unit", 1, 10)
        db.execute("UPDATE users SET support_language = NULL")
    assert continue_learning(client, database_path, 1)["parent"]["title"] == "Chuong VI"


def test_parent_and_position_are_present_whenever_continue_learning_is(client, database_path, learner):
    with sqlite3.connect(database_path) as db:
        chapter(db, 1, 10)
        grammar(db, 1, "unit", 1, 10)
    result = continue_learning(client, database_path, 1)
    assert result["parent"] is not None and result["position"] is not None
    assert set(result) == {"slug", "unit_type", "title_fr", "title", "parent", "position"}


def test_continue_learning_stays_null_without_an_unfinished_opened_unit(client, database_path, learner):
    with sqlite3.connect(database_path) as db:
        chapter(db, 1, 10)
        grammar(db, 1, "unit", 1, 10)
    _insert_state(database_path, unit_id=1, learned=True, last_opened_at="2026-09-20T10:00:00+07:00")
    assert client.get("/api/v1/me/dashboard").json["data"]["continue_learning"] is None
