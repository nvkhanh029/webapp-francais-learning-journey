"""Shared learning_units identity, lookup and counts across modules.

Grammar/Vocabulary/Conjugation content stays in its own repository; this file
covers only the cross-module identity used by Dashboard, Learning State and
Practice. Parameter-bound SQL via get_db(); the service owns transactions.
"""
from ..db import get_db

UNIT_TYPES = ("grammar", "vocabulary", "conjugation")


def find_by_slug(slug):
    """Return the shared learning_units row for a stable slug, or None."""
    return get_db().execute(
        "SELECT id, unit_type, slug, title_fr, title_vi, title_en "
        "FROM learning_units WHERE slug = ?",
        (slug,),
    ).fetchone()


def count_by_type():
    """Return total learning_units per module, e.g. {'grammar': 20, ...}.

    Always includes all three module keys, even when a module currently has
    zero seeded units, so Dashboard progress totals never omit a module.
    """
    counts = {unit_type: 0 for unit_type in UNIT_TYPES}
    rows = get_db().execute(
        "SELECT unit_type, COUNT(*) AS total FROM learning_units GROUP BY unit_type"
    ).fetchall()
    for row in rows:
        counts[row["unit_type"]] = row["total"]
    return counts
