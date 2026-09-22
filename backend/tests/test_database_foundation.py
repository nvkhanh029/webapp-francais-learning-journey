"""Schema creation, persistence safety, and representative SQL constraints."""
import sqlite3

import pytest

from init_db import initialize_database
from seed import seed_database

EXPECTED_TABLES = {"users","learning_units","reference_pages","grammar_parts","grammar_chapters","grammar_lessons",
    "vocabulary_categories","vocabulary_topics","vocabulary_subtopics","vocabulary_study_units","vocabulary_words",
    "conjugation_tenses","conjugation_lessons","questions","question_items","user_learning_state","practice_sessions"}


def test_exact_schema_table_set(database_path):
    with sqlite3.connect(database_path) as db:
        tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        assert tables == EXPECTED_TABLES


def test_repeat_initialization_preserves_user(database_path):
    with sqlite3.connect(database_path) as db:
        db.execute("INSERT INTO users(email,password_hash,created_at) VALUES ('fixture@example.test','test-only','test')")
    initialize_database(database_path)
    with sqlite3.connect(database_path) as db:
        assert db.execute("SELECT count(*) FROM users").fetchone()[0] == 1


@pytest.mark.parametrize("sql", [
    "INSERT INTO users(email,password_hash,support_language,created_at) VALUES('a','test-only','fr','test')",
    "INSERT INTO learning_units(unit_type,slug,title_fr) VALUES('reference','x','test')",
    "INSERT INTO questions(learning_unit_id,question_type,prompt_vi,prompt_en,sort_order) VALUES(999,'mcq','a','b',10)",
    "INSERT INTO grammar_parts(title_fr,sort_order) VALUES('test',0)",
])
def test_invalid_records_are_rejected(database_path, sql):
    with sqlite3.connect(database_path) as db:
        db.execute("PRAGMA foreign_keys=ON")
        with pytest.raises(sqlite3.IntegrityError): db.execute(sql)


@pytest.mark.parametrize("kind,unit,count,total", [("normal",None,0,1),("mixed",1,0,1),("mixed",None,2,1),("mixed",None,0,0),("mixed",None,-1,1)])
def test_practice_summary_constraints(database_path, content_root, kind, unit, count, total):
    seed_database(database_path, content_root)
    with sqlite3.connect(database_path) as db:
        db.execute("PRAGMA foreign_keys=ON")
        db.execute("INSERT INTO users(id,email,password_hash,created_at) VALUES(1,'fixture','test-only','test')")
        with pytest.raises(sqlite3.IntegrityError):
            db.execute("INSERT INTO practice_sessions(user_id,practice_type,learning_unit_id,completed_at,activity_date,correct_count,total_questions) VALUES(1,?,?,'test','test',?,?)", (kind,unit,count,total))
