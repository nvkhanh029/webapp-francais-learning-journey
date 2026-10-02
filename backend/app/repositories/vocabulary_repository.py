"""Vocabulary hierarchy and content SQL (Member 4).

Read-only queries via app.db.get_db() with parameter binding; rows are returned
raw for the service to localize. Writes, if ever added, must not commit here:
the service owns the transaction boundary (docs/backend-structure.md §8).
"""
from ..db import get_db


def list_categories_with_topics():
    """Categories with their topics, ordered by sort_order.

    INNER JOIN intentionally omits categories that have no topic.
    """
    return get_db().execute(
        """
        SELECT c.id AS category_id,
               c.title_fr AS category_fr,
               c.title_vi AS category_vi,
               c.title_en AS category_en,
               t.slug AS topic_slug,
               t.title_fr AS topic_fr,
               t.title_vi AS topic_vi,
               t.title_en AS topic_en
        FROM vocabulary_categories AS c
        JOIN vocabulary_topics AS t ON t.category_id = c.id
        ORDER BY c.sort_order, t.sort_order
        """
    ).fetchall()


def get_topic_by_slug(topic_slug):
    """A topic plus its parent category, or None when the slug is unknown."""
    return get_db().execute(
        """
        SELECT t.id AS topic_id,
               t.slug AS topic_slug,
               t.title_fr AS topic_fr,
               t.title_vi AS topic_vi,
               t.title_en AS topic_en,
               c.title_fr AS category_fr,
               c.title_vi AS category_vi,
               c.title_en AS category_en
        FROM vocabulary_topics AS t
        JOIN vocabulary_categories AS c ON c.id = t.category_id
        WHERE t.slug = ?
        """,
        (topic_slug,),
    ).fetchone()


def list_subtopics_with_units(topic_id, user_id):
    """Subtopics of one topic with their study units and the user's state.

    LEFT JOIN keeps units without a user_learning_state row; those come back
    with learned_at=NULL and review_later=0.
    """
    return get_db().execute(
        """
        SELECT st.id AS subtopic_id,
               st.title_fr AS subtopic_fr,
               st.title_vi AS subtopic_vi,
               st.title_en AS subtopic_en,
               lu.slug AS unit_slug,
               lu.title_fr AS unit_fr,
               lu.title_vi AS unit_vi,
               lu.title_en AS unit_en,
               uls.learned_at AS learned_at,
               COALESCE(uls.review_later, 0) AS review_later
        FROM vocabulary_subtopics AS st
        JOIN vocabulary_study_units AS su ON su.subtopic_id = st.id
        JOIN learning_units AS lu ON lu.id = su.learning_unit_id
        LEFT JOIN user_learning_state AS uls
               ON uls.learning_unit_id = lu.id AND uls.user_id = ?
        WHERE st.topic_id = ?
        ORDER BY st.sort_order, su.sort_order
        """,
        (user_id, topic_id),
    ).fetchall()


def get_study_unit_by_slug(slug, user_id):
    """A vocabulary study unit with its full context and the user's state, or None.

    unit_type = 'vocabulary' rejects slugs that exist only in another module.
    """
    return get_db().execute(
        """
        SELECT lu.id AS learning_unit_id,
               lu.slug AS unit_slug,
               lu.title_fr AS unit_fr,
               lu.title_vi AS unit_vi,
               lu.title_en AS unit_en,
               st.title_fr AS subtopic_fr,
               st.title_vi AS subtopic_vi,
               st.title_en AS subtopic_en,
               t.slug AS topic_slug,
               t.title_fr AS topic_fr,
               t.title_vi AS topic_vi,
               t.title_en AS topic_en,
               c.title_fr AS category_fr,
               c.title_vi AS category_vi,
               c.title_en AS category_en,
               uls.learned_at AS learned_at,
               COALESCE(uls.review_later, 0) AS review_later
        FROM vocabulary_study_units AS su
        JOIN learning_units AS lu ON lu.id = su.learning_unit_id
        JOIN vocabulary_subtopics AS st ON st.id = su.subtopic_id
        JOIN vocabulary_topics AS t ON t.id = st.topic_id
        JOIN vocabulary_categories AS c ON c.id = t.category_id
        LEFT JOIN user_learning_state AS uls
               ON uls.learning_unit_id = lu.id AND uls.user_id = ?
        WHERE lu.slug = ? AND lu.unit_type = 'vocabulary'
        """,
        (user_id, slug),
    ).fetchone()


def list_words(study_unit_id):
    """Vocabulary entries of a study unit, in curriculum (sort_order) order."""
    return get_db().execute(
        """
        SELECT french, meaning_vi, meaning_en, ipa,
               example_fr, example_vi, example_en
        FROM vocabulary_words
        WHERE study_unit_id = ?
        ORDER BY sort_order
        """,
        (study_unit_id,),
    ).fetchall()
