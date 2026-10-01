"""Practice question reads and completed-Practice persistence/query SQL
Owner: Member 6 (Practice and Mixed Practice), per docs/repository-conventions.md
Section 8.9. Use app.db.get_db() and parameter-bound SQL. The service owns
transactions; repository writes must not commit independently."""
from ..db import get_db


def list_questions_for_learning_unit(learning_unit_id):
    rows = get_db().execute(
        """
        SELECT
            q.id AS question_id,
            q.question_type,
            q.prompt_vi,
            q.prompt_en,
            q.explanation_vi,
            q.explanation_en,
            lu.id AS learning_unit_id,
            lu.unit_type,
            lu.slug,
            lu.title_fr,
            lu.title_vi,
            lu.title_en,
            qi.id AS item_id,
            qi.item_text,
            qi.is_correct,
            qi.correct_position,
            qi.sort_order AS item_sort_order
        FROM questions AS q
        JOIN learning_units AS lu ON lu.id = q.learning_unit_id
        LEFT JOIN question_items AS qi ON qi.question_id = q.id
        WHERE q.learning_unit_id = ?
        ORDER BY q.sort_order, qi.sort_order
        """,
        (learning_unit_id,),
    ).fetchall()
    return _group_questions(rows)


def list_questions_for_learning_units(learning_unit_ids):
    if not learning_unit_ids:
        return []

    placeholders = ",".join("?" for _ in learning_unit_ids)
    rows = get_db().execute(
        f"""
        SELECT
            q.id AS question_id,
            q.question_type,
            q.prompt_vi,
            q.prompt_en,
            q.explanation_vi,
            q.explanation_en,
            lu.id AS learning_unit_id,
            lu.unit_type,
            lu.slug,
            lu.title_fr,
            lu.title_vi,
            lu.title_en,
            qi.id AS item_id,
            qi.item_text,
            qi.is_correct,
            qi.correct_position,
            qi.sort_order AS item_sort_order
        FROM questions AS q
        JOIN learning_units AS lu ON lu.id = q.learning_unit_id
        LEFT JOIN question_items AS qi ON qi.question_id = q.id
        WHERE q.learning_unit_id IN ({placeholders})
        ORDER BY q.learning_unit_id, q.sort_order, qi.sort_order
        """,
        tuple(learning_unit_ids),
    ).fetchall()
    return _group_questions(rows)


def list_learned_learning_units(user_id):
    return get_db().execute(
        """
        SELECT
            lu.id,
            lu.unit_type,
            lu.slug,
            lu.title_fr,
            lu.title_vi,
            lu.title_en
        FROM learning_units AS lu
        JOIN user_learning_state AS uls
          ON uls.learning_unit_id = lu.id
         AND uls.user_id = ?
        WHERE uls.learned_at IS NOT NULL
        ORDER BY lu.unit_type, lu.id
        """,
        (user_id,),
    ).fetchall()


def get_questions_by_ids(question_ids):
    if not question_ids:
        return []

    placeholders = ",".join("?" for _ in question_ids)
    rows = get_db().execute(
        f"""
        SELECT
            q.id AS question_id,
            q.question_type,
            q.prompt_vi,
            q.prompt_en,
            q.explanation_vi,
            q.explanation_en,
            lu.id AS learning_unit_id,
            lu.unit_type,
            lu.slug,
            lu.title_fr,
            lu.title_vi,
            lu.title_en,
            qi.id AS item_id,
            qi.item_text,
            qi.is_correct,
            qi.correct_position,
            qi.sort_order AS item_sort_order
        FROM questions AS q
        JOIN learning_units AS lu ON lu.id = q.learning_unit_id
        LEFT JOIN question_items AS qi ON qi.question_id = q.id
        WHERE q.id IN ({placeholders})
        ORDER BY q.id, qi.sort_order
        """,
        tuple(question_ids),
    ).fetchall()
    return _group_questions(rows)


def insert_practice_session(
    user_id,
    practice_type,
    learning_unit_id,
    completed_at,
    activity_date,
    correct_count,
    total_questions,
):
    cursor = get_db().execute(
        """
        INSERT INTO practice_sessions (
            user_id,
            practice_type,
            learning_unit_id,
            completed_at,
            activity_date,
            correct_count,
            total_questions
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            practice_type,
            learning_unit_id,
            completed_at,
            activity_date,
            correct_count,
            total_questions,
        ),
    )
    return cursor.lastrowid


def list_recent_practice_sessions(user_id, limit=10):
    return get_db().execute(
        """
        SELECT
            ps.id,
            ps.practice_type,
            ps.learning_unit_id,
            ps.completed_at,
            ps.activity_date,
            ps.correct_count,
            ps.total_questions,
            lu.slug AS learning_unit_slug,
            lu.title_fr AS learning_unit_fr,
            lu.title_vi AS learning_unit_vi,
            lu.title_en AS learning_unit_en,
            lu.unit_type AS learning_unit_type
        FROM practice_sessions AS ps
        LEFT JOIN learning_units AS lu ON lu.id = ps.learning_unit_id
        WHERE ps.user_id = ?
        ORDER BY ps.completed_at DESC
        LIMIT ?
        """,
        (user_id, limit),
    ).fetchall()


def _group_questions(rows):
    questions = {}
    order = []

    for row in rows:
        question_id = row["question_id"]
        question = questions.get(question_id)

        if question is None:
            question = {
                "id": question_id,
                "learning_unit_id": row["learning_unit_id"],
                "learning_unit": {
                    "id": row["learning_unit_id"],
                    "unit_type": row["unit_type"],
                    "slug": row["slug"],
                    "title_fr": row["title_fr"],
                    "title_vi": row["title_vi"],
                    "title_en": row["title_en"],
                },
                "question_type": row["question_type"],
                "prompt_vi": row["prompt_vi"],
                "prompt_en": row["prompt_en"],
                "explanation_vi": row["explanation_vi"],
                "explanation_en": row["explanation_en"],
                "items": [],
            }
            questions[question_id] = question
            order.append(question_id)

        if row["item_id"] is not None:
            question["items"].append(
                {
                    "id": row["item_id"],
                    "text": row["item_text"],
                    "is_correct": row["is_correct"],
                    "correct_position": row["correct_position"],
                    "sort_order": row["item_sort_order"],
                }
            )

    return [questions[question_id] for question_id in order]

def get_recent_sessions(user_id, limit):
    """Most recent completed Practice/Mixed Practice summaries for Dashboard display.

    Mixed Practice rows have no related learning unit, so the join columns
    (slug/unit_type/title_fr) come back NULL for them; the caller distinguishes
    normal vs. mixed using `practice_type`, matching the API Contract shape.
    """
    return get_db().execute(
        "SELECT ps.practice_type AS practice_type, ps.completed_at AS completed_at, "
        "ps.correct_count AS correct_count, ps.total_questions AS total_questions, "
        "lu.slug AS slug, lu.unit_type AS unit_type, lu.title_fr AS title_fr "
        "FROM practice_sessions ps "
        "LEFT JOIN learning_units lu ON lu.id = ps.learning_unit_id "
        "WHERE ps.user_id = ? "
        "ORDER BY ps.completed_at DESC "
        "LIMIT ?",
        (user_id, limit),
    ).fetchall()

def get_activity_dates(user_id):
    """Distinct completed-practice activity dates, for current/longest streak derivation."""
    rows = get_db().execute(
        "SELECT DISTINCT activity_date FROM practice_sessions WHERE user_id = ?",
        (user_id,),
    ).fetchall()
    return [row["activity_date"] for row in rows]