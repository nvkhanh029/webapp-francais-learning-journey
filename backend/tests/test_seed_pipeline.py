"""Real SQLite/CLI tests for the seed foundation; no feature endpoints."""
import sqlite3
import subprocess
import sys
from pathlib import Path

import pytest

import seed
from app.seeding.transforms import balanced_sizes
from app.seeding.validators import SeedValidationError
from tests.support import empty_sources, read_json, write_json, vocabulary, question

BACKEND = Path(__file__).resolve().parents[1]


# --- Full fixture seed ------------------------------------------------------

def test_full_fixture_seed_has_all_modules_and_question_types(database_path, content_root):
    """Confirm a full fixture seed populates every module and question type."""
    summary = seed.seed_database(database_path, content_root)
    assert summary["grammar_lessons"] == summary["conjugation_lessons"] == summary["vocabulary_study_units"] == 1
    assert summary["reference_pages"] == 1
    assert summary["question_types"] == {"mcq": 2, "fill_blank": 2, "ordering": 1}
    with sqlite3.connect(database_path) as db:
        assert db.execute("PRAGMA foreign_key_check").fetchall() == []
        assert db.execute("SELECT count(*) FROM learning_units").fetchone()[0] == 3
        assert db.execute("SELECT count(*) FROM users").fetchone()[0] == 0
        assert db.execute("SELECT count(*) FROM practice_sessions").fetchone()[0] == 0
        assert db.execute("SELECT count(*) FROM user_learning_state").fetchone()[0] == 0
        assert db.execute("SELECT correct_position FROM question_items WHERE correct_position IS NOT NULL ORDER BY correct_position").fetchall() == [(1,),(2,),(3,)]
        for unit_id, kind in db.execute("SELECT id, unit_type FROM learning_units"):
            tables = ["grammar_lessons", "vocabulary_study_units", "conjugation_lessons"]
            memberships = [db.execute(f"SELECT count(*) FROM {table} WHERE learning_unit_id=?", (unit_id,)).fetchone()[0] for table in tables]
            assert sum(memberships) == 1


# --- Vocabulary splitting and transforms ------------------------------------

@pytest.mark.parametrize("total,expected", [(1,[1]),(18,[18]),(19,[10,9]),(30,[15,15]),(34,[12,11,11]),(46,[12,12,11,11])])
def test_vocabulary_splitting_and_question_refs(tmp_path, total, expected):
    """Confirm large vocabulary sources split into balanced study units."""
    root = empty_sources(tmp_path/"sources")
    raw = vocabulary(total)
    write_json(root/"vocabulary"/"fixture.json", raw)
    target = "fixture-words" if total <= 18 else "fixture-words-1"
    write_json(root/"questions"/"fixture.json", {"learning_unit_slug": target, "questions":[question("mcq")]})
    content = seed.prepare_content(root)
    units = content["vocabulary"][0]["study_units"]
    assert [len(u["words"]) for u in units] == expected
    assert [w["french"] for u in units for w in u["words"]] == [w["french"] for w in raw["words"]]
    assert units[0]["slug"] == target


def test_balanced_sizes_input_validation():
    """Confirm balanced_sizes rejects invalid inputs and handles zero."""
    assert balanced_sizes(0) == []
    with pytest.raises(ValueError): balanced_sizes(-1)
    with pytest.raises(ValueError): balanced_sizes(3, preferred_max=0)


# --- Validate-before-write and rollback safety ------------------------------

def test_validation_failure_never_calls_writer(database_path, content_root, monkeypatch):
    """Confirm validation failure aborts before any writer call."""
    p = content_root/"questions"/"fixture-grammar.json"
    raw = read_json(p); raw["learning_unit_slug"] = "unknown-unit"; write_json(p, raw)
    def writer_should_not_run(*args):
        """Fail the test if the writer runs before validation succeeds."""
        pytest.fail("writer ran before successful validation")
    monkeypatch.setattr(seed, "write_all", writer_should_not_run)
    with pytest.raises(SeedValidationError): seed.seed_database(database_path, content_root)
    with sqlite3.connect(database_path) as db:
        assert db.execute("SELECT count(*) FROM learning_units").fetchone()[0] == 0


def test_mid_write_failure_rolls_back_everything(database_path, content_root, monkeypatch):
    """Confirm a write failure rolls back all earlier writes."""
    def broken_writer(db, content):
        """Insert one part and then raise to force a mid-write failure."""
        db.execute("INSERT INTO grammar_parts(title_fr,sort_order) VALUES ('fixture',10)")
        raise sqlite3.IntegrityError("injected write failure")
    monkeypatch.setattr(seed,"write_all",broken_writer)
    with pytest.raises(sqlite3.IntegrityError): seed.seed_database(database_path, content_root)
    with sqlite3.connect(database_path) as db:
        assert db.execute("SELECT count(*) FROM grammar_parts").fetchone()[0] == 0


# --- Non-destructive reseed guarantee ---------------------------------------

def test_reseed_refuses_without_wiping_learner_data(database_path, content_root):
    """Confirm reseeding refuses and preserves learner rows."""
    seed.seed_database(database_path, content_root)
    with sqlite3.connect(database_path) as db:
        db.execute("INSERT INTO users(email,password_hash,created_at) VALUES ('fixture@example.test','test-only','test')")
    with pytest.raises(RuntimeError, match="already exists"):
        seed.seed_database(database_path, content_root)
    with sqlite3.connect(database_path) as db:
        assert db.execute("SELECT count(*) FROM users").fetchone()[0] == 1
        assert db.execute("SELECT count(*) FROM learning_units").fetchone()[0] == 3


# --- seed.py CLI behavior ---------------------------------------------------

def test_cli_validate_only_does_not_create_a_database(tmp_path, content_root):
    """Confirm validate-only exits cleanly without creating a database."""
    missing = tmp_path/"not-created.db"
    process = subprocess.run([sys.executable, str(BACKEND/"seed.py"), "--validate-only", "--data-root", str(content_root), "--database", str(missing)], capture_output=True, text=True)
    assert process.returncode == 0, process.stderr
    assert "fixture-grammar" in process.stdout
    assert not missing.exists()


def test_empty_existing_scaffold_is_explicit_in_summary(database_path, tmp_path):
    """Confirm an empty scaffold is reported explicitly in the summary."""
    root = empty_sources(tmp_path/"sources")
    process = subprocess.run([sys.executable, str(BACKEND/"seed.py"), "--data-root", str(root), "--database", str(database_path)], capture_output=True, text=True)
    assert process.returncode == 0, process.stderr
    assert "No authored content found" in process.stdout
    assert "Seed completed successfully" not in process.stdout


def test_bad_root_cli_returns_nonzero(database_path, tmp_path):
    """Confirm a missing data root makes the CLI exit nonzero."""
    process = subprocess.run([sys.executable, str(BACKEND/"seed.py"), "--data-root", str(tmp_path/"missing"), "--database", str(database_path)], capture_output=True, text=True)
    assert process.returncode != 0
    assert "data root" in process.stderr


# --- Shipped templates as an isolated fixture -------------------------------

def test_shipped_templates_can_be_materialized_as_isolated_fixture(database_path, tmp_path):
    """Confirm shipped templates seed as an isolated valid fixture."""
    import shutil
    root = empty_sources(tmp_path/"template-fixture")
    data_root = BACKEND/"data"
    for area in ("grammar","conjugation","reference"):
        shutil.copytree(data_root/area/"_template",root/area/"fixture")
    shutil.copyfile(data_root/"vocabulary"/"_template.json",root/"vocabulary"/"fixture.json")
    data=read_json(data_root/"questions"/"_template.json")
    data["learning_unit_slug"]=read_json(root/"grammar"/"fixture"/"meta.json")["slug"]
    write_json(root/"questions"/"fixture.json",data)
    summary=seed.seed_database(database_path,root)
    assert summary["grammar_lessons"]==1 and summary["reference_pages"]==1
    assert summary["question_types"]=={"mcq":1,"fill_blank":1,"ordering":1}
