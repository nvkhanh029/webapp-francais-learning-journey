"""Grammar hierarchy/content SQL for the Grammar feature."""

from ..db import get_db


def get_grammar_browse_rows(user_id):
    """Return ordered Grammar hierarchy and lesson metadata rows."""

    return get_db().execute(
        """
        SELECT
            p.id AS part_id,
            p.title_fr AS part_title_fr,
            p.title_vi AS part_title_vi,
            p.title_en AS part_title_en,
            p.sort_order AS part_sort_order,

            c.id AS chapter_id,
            c.title_fr AS chapter_title_fr,
            c.title_vi AS chapter_title_vi,
            c.title_en AS chapter_title_en,
            c.sort_order AS chapter_sort_order,

            gl.learning_unit_id,
            gl.sort_order AS lesson_sort_order,

            lu.slug,
            lu.title_fr AS lesson_title_fr,
            lu.title_vi AS lesson_title_vi,
            lu.title_en AS lesson_title_en,

            uls.learned_at IS NOT NULL AS learned,
            COALESCE(uls.review_later, 0) AS review_later

        FROM grammar_parts AS p
        JOIN grammar_chapters AS c
          ON c.part_id = p.id
        JOIN grammar_lessons AS gl
          ON gl.chapter_id = c.id
        JOIN learning_units AS lu
          ON lu.id = gl.learning_unit_id
         AND lu.unit_type = 'grammar'

        LEFT JOIN user_learning_state AS uls
          ON uls.learning_unit_id = gl.learning_unit_id
         AND uls.user_id = ?

        ORDER BY
            p.sort_order,
            c.sort_order,
            gl.sort_order
        """,
        (user_id,),
    ).fetchall()


def get_grammar_lesson_by_slug(slug, user_id):
    """Return one Grammar lesson by stable learning-unit slug."""

    return get_db().execute(
        """
        SELECT
            gl.learning_unit_id,
            lu.slug,
            lu.title_fr AS lesson_title_fr,
            lu.title_vi AS lesson_title_vi,
            lu.title_en AS lesson_title_en,
            gl.content_vi,
            gl.content_en,

            p.title_fr AS part_title_fr,
            p.title_vi AS part_title_vi,
            p.title_en AS part_title_en,

            c.title_fr AS chapter_title_fr,
            c.title_vi AS chapter_title_vi,
            c.title_en AS chapter_title_en,

            uls.learned_at IS NOT NULL AS learned,
            COALESCE(uls.review_later, 0) AS review_later

        FROM grammar_lessons AS gl
        JOIN learning_units AS lu
          ON lu.id = gl.learning_unit_id
         AND lu.unit_type = 'grammar'
        JOIN grammar_chapters AS c
          ON c.id = gl.chapter_id
        JOIN grammar_parts AS p
          ON p.id = c.part_id

        LEFT JOIN user_learning_state AS uls
          ON uls.learning_unit_id = gl.learning_unit_id
         AND uls.user_id = ?

        WHERE lu.slug = ?
        LIMIT 1
        """,
        (user_id, slug),
    ).fetchone()


def get_unit_position(learning_unit_id):
    """Parent chapter and 1-based place of one Grammar lesson among its siblings.

    Returns parent_title_fr/vi/en, position_index (by sort_order, never by id)
    and position_total, or None when the unit is not a Grammar lesson. Used by the
    Dashboard Continue Learning object (API Contract 8.1).
    """
    return get_db().execute(
        """
        SELECT p.title_fr AS parent_title_fr,
               p.title_vi AS parent_title_vi,
               p.title_en AS parent_title_en,
               (SELECT COUNT(*) FROM grammar_lessons AS s
                 WHERE s.chapter_id = u.chapter_id AND s.sort_order <= u.sort_order) AS position_index,
               (SELECT COUNT(*) FROM grammar_lessons AS s
                 WHERE s.chapter_id = u.chapter_id) AS position_total
        FROM grammar_lessons AS u
        JOIN grammar_chapters AS p ON p.id = u.chapter_id
        WHERE u.learning_unit_id = ?
        """,
        (learning_unit_id,),
    ).fetchone()
