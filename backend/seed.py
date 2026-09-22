import argparse
import sqlite3
from pathlib import Path

from app.seeding.loaders import load_all_content
from app.seeding.transforms import generate_vocabulary_study_units
from app.seeding.validators import SeedValidationError, validate_all, validate_source_shapes
from app.seeding.writers import write_all


BACKEND_ROOT = Path(__file__).resolve().parent
DEFAULT_DATABASE = BACKEND_ROOT / "instance" / "app.db"
DEFAULT_DATA_ROOT = BACKEND_ROOT / "data"
STATIC_TABLES = (
    "learning_units",
    "reference_pages",
    "grammar_parts",
    "grammar_chapters",
    "grammar_lessons",
    "vocabulary_categories",
    "vocabulary_topics",
    "vocabulary_subtopics",
    "vocabulary_study_units",
    "vocabulary_words",
    "conjugation_tenses",
    "conjugation_lessons",
    "questions",
    "question_items",
)


def _table_exists(connection, table):
    return connection.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
        (table,),
    ).fetchone() is not None


def _ensure_empty_static_store(connection):
    for table in STATIC_TABLES:
        if not _table_exists(connection, table):
            raise RuntimeError("Database schema is missing. Run `python init_db.py` first.")
        count = connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        if count:
            raise RuntimeError(
                "Static content already exists in the database. "
                "No data was replaced. Stop Flask, back up your database, and use a deliberately fresh local database. "
                "Scaffold v3 does not provide destructive reset or content upsert commands."
            )


def prepare_content(data_root):
    content = load_all_content(data_root)
    validate_source_shapes(content)
    content["vocabulary"] = generate_vocabulary_study_units(content["vocabulary"])
    validate_all(content)
    return content


def seed_database(database_path=DEFAULT_DATABASE, data_root=DEFAULT_DATA_ROOT):
    database_path = Path(database_path)
    if not database_path.is_file():
        raise RuntimeError("Database does not exist. Run `python init_db.py` first.")

    # Load, transform, and validate everything before opening a write transaction.
    content = prepare_content(data_root)

    connection = sqlite3.connect(database_path)
    try:
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            connection.execute("BEGIN IMMEDIATE")
            _ensure_empty_static_store(connection)
            summary = write_all(connection, content)
            connection.commit()
        except Exception:
            connection.rollback()
            raise
    finally:
        connection.close()

    return summary


def _print_summary(summary):
    if sum(summary[key] for key in ("grammar_lessons", "vocabulary_study_units", "conjugation_lessons", "reference_pages")) == 0:
        print("No authored content found; only empty/template directories may exist.\n")
    else:
        print("Seed completed successfully.\n")
    print("Grammar")
    print(f"- {summary['grammar_parts']} parts")
    print(f"- {summary['grammar_chapters']} chapters")
    print(f"- {summary['grammar_lessons']} lessons\n")
    print("Vocabulary")
    print(f"- {summary['vocabulary_categories']} categories")
    print(f"- {summary['vocabulary_topics']} topics")
    print(f"- {summary['vocabulary_subtopics']} subtopics")
    print(f"- {summary['vocabulary_study_units']} study units")
    print(f"- {summary['vocabulary_words']} vocabulary entries\n")
    print("Conjugation")
    print(f"- {summary['conjugation_tenses']} tenses")
    print(f"- {summary['conjugation_lessons']} lessons\n")
    print("Reference")
    print(f"- {summary['reference_pages']} reference pages\n")
    print("Questions")
    print(f"- {summary['questions']} questions")
    print(f"  - {summary['question_types']['mcq']} MCQ")
    print(f"  - {summary['question_types']['fill_blank']} Fill in the Blank")
    print(f"  - {summary['question_types']['ordering']} Sentence Ordering")


def parse_args():
    parser = argparse.ArgumentParser(description="Validate and seed static learning content.")
    parser.add_argument("--validate-only", action="store_true", help="Validate all sources without opening or writing a database.")
    parser.add_argument("--database", default=str(DEFAULT_DATABASE), help="Optional database path override.")
    parser.add_argument("--data-root", default=str(DEFAULT_DATA_ROOT), help="Optional content source root override.")
    return parser.parse_args()


def main():
    args = parse_args()
    try:
        if args.validate_only:
            content = prepare_content(args.data_root)
            counts = {name: len(records) for name, records in content.items()}
            print("Source validation passed:", counts)
            units = [r["meta"]["slug"] for area in ("grammar", "conjugation") for r in content[area]]
            units.extend(u["slug"] for r in content["vocabulary"] for u in r["study_units"])
            print("Learning-unit slugs:", ", ".join(sorted(units)) or "(none; templates are excluded)")
            return
        summary = seed_database(args.database, args.data_root)
    except (RuntimeError, SeedValidationError, sqlite3.Error, ValueError, OSError) as exc:
        raise SystemExit(f"Seed failed: {exc}") from exc
    _print_summary(summary)


if __name__ == "__main__":
    main()
