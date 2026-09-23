"""Member 5: Conjugation tense/lesson SQL. Read-only; services own transactions."""
from ..db import get_db


def get_tenses_with_lessons():
    """All tenses with nested lessons in curriculum order.

    Order follows conjugation_tenses.sort_order then
    conjugation_lessons.sort_order, never primary keys.
    """
    return get_db().execute(
        """
        SELECT t.id AS tense_id,
               t.title_fr AS tense_title_fr,
               t.title_vi AS tense_title_vi,
               t.title_en AS tense_title_en,
               lu.id AS learning_unit_id,
               lu.slug,
               lu.title_fr,
               lu.title_vi,
               lu.title_en,
               cl.sort_order AS lesson_sort_order
        FROM conjugation_tenses AS t
        JOIN conjugation_lessons AS cl ON cl.tense_id = t.id
        JOIN learning_units AS lu ON lu.id = cl.learning_unit_id
        ORDER BY t.sort_order, cl.sort_order
        """
    ).fetchall()


def get_lesson_by_slug(slug):
    """One Conjugation lesson with its unit and tense context.

    The conjugation_lessons join enforces the module boundary: a slug that
    exists only in Grammar/Vocabulary returns no row and stays a 404 here.
    """
    return get_db().execute(
        """
        SELECT lu.id AS learning_unit_id,
               lu.slug,
               lu.title_fr,
               lu.title_vi,
               lu.title_en,
               cl.content_vi,
               cl.content_en,
               t.title_fr AS tense_title_fr,
               t.title_vi AS tense_title_vi,
               t.title_en AS tense_title_en
        FROM learning_units AS lu
        JOIN conjugation_lessons AS cl ON cl.learning_unit_id = lu.id
        JOIN conjugation_tenses AS t ON t.id = cl.tense_id
        WHERE lu.slug = ?
        """,
        (slug,),
    ).fetchone()
