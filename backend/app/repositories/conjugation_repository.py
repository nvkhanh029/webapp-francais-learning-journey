"""Conjugation tense and lesson SQL. Read-only; services own transactions."""
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


def get_unit_position(learning_unit_id):
    """Parent tense and 1-based place of one Conjugation lesson among its siblings.

    Returns parent_title_fr/vi/en, position_index (by sort_order, never by id)
    and position_total, or None when the unit is not a Conjugation lesson. Used by the
    Dashboard Continue Learning object (API Contract 8.1).
    """
    return get_db().execute(
        """
        SELECT p.title_fr AS parent_title_fr,
               p.title_vi AS parent_title_vi,
               p.title_en AS parent_title_en,
               (SELECT COUNT(*) FROM conjugation_lessons AS s
                 WHERE s.tense_id = u.tense_id AND s.sort_order <= u.sort_order) AS position_index,
               (SELECT COUNT(*) FROM conjugation_lessons AS s
                 WHERE s.tense_id = u.tense_id) AS position_total
        FROM conjugation_lessons AS u
        JOIN conjugation_tenses AS p ON p.id = u.tense_id
        WHERE u.learning_unit_id = ?
        """,
        (learning_unit_id,),
    ).fetchone()
