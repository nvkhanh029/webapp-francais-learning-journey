"""TODO Member 3: Grammar hierarchy/content SQL.

Use app.db.get_db() and parameter-bound SQL. The service owns transactions;
repository writes must not commit independently. No implementation exists yet.
"""

"""Grammar hierarchy/content SQL for the Grammar feature."""

from ..db import get_db


def get_grammar_browse_rows():
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
            lu.title_en AS lesson_title_en

        FROM grammar_parts AS p
        JOIN grammar_chapters AS c
          ON c.part_id = p.id
        JOIN grammar_lessons AS gl
          ON gl.chapter_id = c.id
        JOIN learning_units AS lu
          ON lu.id = gl.learning_unit_id
         AND lu.unit_type = 'grammar'

        ORDER BY
            p.sort_order,
            c.sort_order,
            gl.sort_order
        """
    ).fetchall()


def get_grammar_lesson_by_slug(slug):
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
            c.title_en AS chapter_title_en

        FROM grammar_lessons AS gl
        JOIN learning_units AS lu
          ON lu.id = gl.learning_unit_id
         AND lu.unit_type = 'grammar'
        JOIN grammar_chapters AS c
          ON c.id = gl.chapter_id
        JOIN grammar_parts AS p
          ON p.id = c.part_id

        WHERE lu.slug = ?
        LIMIT 1
        """,
        (slug,),
    ).fetchone()