"""Create missing tables non-destructively. This is not a migration/reset tool."""
import argparse
import sqlite3
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
DEFAULT_DATABASE = BACKEND_ROOT / "instance" / "app.db"
SCHEMA_PATH = BACKEND_ROOT / "app" / "schema.sql"


def initialize_database(database_path=DEFAULT_DATABASE):
    database_path = Path(database_path)
    database_path.parent.mkdir(parents=True, exist_ok=True)
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    connection = sqlite3.connect(database_path)
    try:
        connection.execute("PRAGMA foreign_keys = ON")
        # Keep DDL atomic. Existing rows are not dropped by IF NOT EXISTS.
        connection.executescript("BEGIN;\n" + schema + "\nCOMMIT;")
    except BaseException:
        connection.rollback()
        raise
    finally:
        connection.close()
    return database_path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", default=str(DEFAULT_DATABASE))
    args = parser.parse_args()
    try:
        path = initialize_database(args.database)
    except (OSError, sqlite3.Error) as exc:
        raise SystemExit(f"Database initialization failed: {exc}") from exc
    print(f"Schema initialized (existing data preserved): {path}")


if __name__ == "__main__":
    main()
