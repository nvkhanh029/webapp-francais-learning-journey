from ..db import get_db


def get_learning_unit_by_slug(slug):
    return get_db().execute(
        """
        SELECT id, unit_type, slug, title_fr, title_vi, title_en
        FROM learning_units
        WHERE slug = ?
        """,
        (slug,),
    ).fetchone()


def get_learning_unit(learning_unit_id):
    return get_db().execute(
        """
        SELECT id, unit_type, slug, title_fr, title_vi, title_en
        FROM learning_units
        WHERE id = ?
        """,
        (learning_unit_id,),
    ).fetchone()


def list_questions_for_learning_unit(learning_unit_id):
    rows = get_db().execute(
        """
        SELECT
            q.id AS question_id,
            q.learning_unit_id,
            q.question_type,
            q.prompt_vi,
            q.prompt_en,
            q.explanation_vi,
            q.explanation_en,
            qi.id AS item_id,
            qi.item_text,
            qi.is_correct,
            qi.correct_position,
            qi.sort_order AS item_sort_order
        FROM questions AS q
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
            q.learning_unit_id,
            q.question_type,
            q.prompt_vi,
            q.prompt_en,
            q.explanation_vi,
            q.explanation_en,
            qi.id AS item_id,
            qi.item_text,
            qi.is_correct,
            qi.correct_position,
            qi.sort_order AS item_sort_order
        FROM questions AS q
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
            q.learning_unit_id,
            q.question_type,
            q.prompt_vi,
            q.prompt_en,
            q.explanation_vi,
            q.explanation_en,
            qi.id AS item_id,
            qi.item_text,
            qi.is_correct,
            qi.correct_position,
            qi.sort_order AS item_sort_order
        FROM questions AS q
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