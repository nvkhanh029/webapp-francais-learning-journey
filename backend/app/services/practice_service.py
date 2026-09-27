import random
import threading
import uuid
from datetime import datetime, timezone

from flask import g

from ..db import transaction
from ..errors import ApiError
from ..localization import localized_value, resolve_support_language
from ..repositories import practice_repository


MAX_MIXED_QUESTIONS = 10

# Local-MVP temporary run store.
# This is intentionally not durable and is lost if the Flask process restarts.
_RUNS = {}
_RUNS_LOCK = threading.RLock()


def start_normal_practice(slug):
    user_id = g.current_user["id"]
    language = resolve_support_language(g.current_user["support_language"])

    unit = practice_repository.get_learning_unit_by_slug(slug)
    if unit is None:
        raise ApiError(404, "learning_unit_not_found", "Learning unit not found.")

    questions = _usable_questions(
        practice_repository.list_questions_for_learning_unit(unit["id"])
    )
    if not questions:
        raise ApiError(
            404,
            "practice_questions_not_found",
            "No practice questions are available for this learning unit.",
        )

    run_id = _create_run(
        user_id=user_id,
        practice_type="normal",
        learning_unit_id=unit["id"],
        question_ids=[q["id"] for q in questions],
    )

    return {
        "practice_run_id": run_id,
        "practice_type": "normal",
        "learning_unit": _serialize_unit(unit, language),
        "questions": [
            _serialize_question_for_client(q, language) for q in questions
        ],
    }


def start_mixed_practice():
    user_id = g.current_user["id"]
    language = resolve_support_language(g.current_user["support_language"])

    learned_units = list(
        practice_repository.list_learned_learning_units(user_id)
    )

    if not learned_units:
        raise ApiError(
            409,
            "mixed_practice_unavailable",
            "Mixed Practice is not available until you have learned at least one learning unit.",
        )

    unit_ids = [unit["id"] for unit in learned_units]
    all_questions = practice_repository.list_questions_for_learning_units(unit_ids)
    eligible = _usable_questions(all_questions)

    if not eligible:
        raise ApiError(
            404,
            "practice_questions_not_found",
            "No eligible practice questions are available from learned learning units.",
        )

    selected = random.sample(
        eligible,
        min(MAX_MIXED_QUESTIONS, len(eligible)),
    )

    # Keep the selected question order random as well.
    random.shuffle(selected)

    run_id = _create_run(
        user_id=user_id,
        practice_type="mixed",
        learning_unit_id=None,
        question_ids=[q["id"] for q in selected],
        content_unit_ids=sorted({q["learning_unit_id"] for q in selected}),
    )

    return {
        "practice_run_id": run_id,
        "practice_type": "mixed",
        "questions": [
            _serialize_question_for_client(q, language) for q in selected
        ],
    }


def submit_practice(run_id, answers):
    user_id = g.current_user["id"]

    if not isinstance(run_id, str) or not run_id:
        raise ApiError(400, "invalid_practice_run", "A valid practice_run_id is required.")

    if not isinstance(answers, dict):
        raise ApiError(400, "invalid_answers", "Answers must be an object.")

    with _RUNS_LOCK:
        run = _RUNS.get(run_id)

        if run is None:
            raise ApiError(
                404,
                "practice_run_not_found",
                "Practice run was not found or has expired.",
            )

        if run["user_id"] != user_id:
            raise ApiError(
                403,
                "practice_run_forbidden",
                "This practice run does not belong to the current user.",
            )

        if run["submitted"]:
            raise ApiError(
                409,
                "practice_run_submitted",
                "This practice run has already been submitted.",
            )

        expected_ids = {str(question_id) for question_id in run["question_ids"]}

        if set(answers.keys()) != expected_ids:
            raise ApiError(
                400,
                "incomplete_answers",
                "Every question in the practice run must have exactly one submitted answer.",
            )

        questions = practice_repository.get_questions_by_ids(run["question_ids"])
        by_id = {str(question["id"]): question for question in questions}

        if set(by_id) != expected_ids:
            raise ApiError(
                409,
                "practice_questions_changed",
                "The practice questions are no longer available.",
            )

        # Ensure the database still contains exactly the questions issued to this run.
        actual_unit_ids = {q["learning_unit_id"] for q in questions}
        if run["practice_type"] == "normal":
            if actual_unit_ids != {run["learning_unit_id"]}:
                raise ApiError(
                    409,
                    "practice_run_invalid",
                    "The practice run is no longer valid.",
                )
        else:
            if not actual_unit_ids.issubset(set(run["content_unit_ids"])):
                raise ApiError(
                    409,
                    "practice_run_invalid",
                    "The practice run is no longer valid.",
                )

        language = resolve_support_language(g.current_user["support_language"])
        result_questions = []
        correct_count = 0

        for question_id in run["question_ids"]:
            question = by_id[str(question_id)]
            user_answer = answers[str(question_id)]
            correct = _is_answer_correct(question, user_answer)

            if correct:
                correct_count += 1

            result_questions.append(
                _serialize_result_question(
                    question,
                    user_answer,
                    correct,
                    language,
                )
            )

        total_questions = len(run["question_ids"])
        completed_at = datetime.now(timezone.utc).isoformat()
        activity_date = datetime.now(timezone.utc).date().isoformat()

        # History is written only after the whole submission has been
        # validated and scored.
        with transaction():
            session_id = practice_repository.insert_practice_session(
                user_id=user_id,
                practice_type=run["practice_type"],
                learning_unit_id=run["learning_unit_id"],
                completed_at=completed_at,
                activity_date=activity_date,
                correct_count=correct_count,
                total_questions=total_questions,
            )

        run["submitted"] = True
        del _RUNS[run_id]

    result = {
        "session_id": session_id,
        "practice_run_id": run_id,
        "practice_type": run["practice_type"],
        "correct_count": correct_count,
        "total_questions": total_questions,
        "accuracy": correct_count / total_questions,
        "questions": result_questions,
    }

    if run["practice_type"] == "normal":
        unit = practice_repository.get_learning_unit(run["learning_unit_id"])
        result["learning_unit"] = _serialize_unit(unit, language)
    else:
        units = [
            practice_repository.get_learning_unit(unit_id)
            for unit_id in run["content_unit_ids"]
        ]
        result["content_covered"] = [
            _serialize_unit(unit, language)
            for unit in units
            if unit is not None
        ]

    return result


def get_recent_history(limit=10):
    user_id = g.current_user["id"]
    language = resolve_support_language(g.current_user["support_language"])

    try:
        limit = int(limit)
    except (TypeError, ValueError):
        raise ApiError(400, "invalid_limit", "limit must be an integer.")

    limit = max(1, min(limit, 50))

    rows = practice_repository.list_recent_practice_sessions(user_id, limit)

    history = []
    for row in rows:
        accuracy = row["correct_count"] / row["total_questions"]

        if row["practice_type"] == "mixed":
            content = {"title": "Mixed Practice"}
            display_type = "Mixed"
        else:
            content = {
                "slug": row["learning_unit_slug"],
                "title_fr": row["learning_unit_fr"],
                "title": localized_value(
                    row,
                    "learning_unit",
                    language,
                    french_fallback_field="learning_unit_fr",
                ),
            }
            display_type = _display_type(row["learning_unit_type"])

        history.append(
            {
                "id": row["id"],
                "practice_type": row["practice_type"],
                "type": display_type,
                "content": content,
                "completed_at": row["completed_at"],
                "correct_count": row["correct_count"],
                "total_questions": row["total_questions"],
                "accuracy": accuracy,
            }
        )

    return {"history": history}


def _create_run(
    *,
    user_id,
    practice_type,
    learning_unit_id,
    question_ids,
    content_unit_ids=None,
):
    run_id = uuid.uuid4().hex
    with _RUNS_LOCK:
        _RUNS[run_id] = {
            "user_id": user_id,
            "practice_type": practice_type,
            "learning_unit_id": learning_unit_id,
            "question_ids": list(question_ids),
            "content_unit_ids": list(content_unit_ids or []),
            "submitted": False,
        }
    return run_id


def _usable_questions(questions):
    usable = []

    for question in questions:
        items = question["items"]
        question_type = question["question_type"]

        if question_type == "mcq":
            if len(items) >= 2 and any(item["is_correct"] == 1 for item in items):
                usable.append(question)

        elif question_type == "fill_blank":
            if any(item["is_correct"] == 1 for item in items):
                usable.append(question)

        elif question_type == "ordering":
            positions = [
                item["correct_position"]
                for item in items
                if item["correct_position"] is not None
            ]
            if len(items) >= 2 and sorted(positions) == list(range(1, len(items) + 1)):
                usable.append(question)

    return usable


def _serialize_unit(unit, language):
    return {
        "id": unit["id"],
        "slug": unit["slug"],
        "unit_type": unit["unit_type"],
        "title_fr": unit["title_fr"],
        "title": localized_value(
            unit,
            "title",
            language,
            french_fallback_field="title_fr",
        ),
    }


def _serialize_question_for_client(question, language):
    result = {
        "id": question["id"],
        "type": question["question_type"],
        "prompt": question[f"prompt_{language}"],
    }

    if question["question_type"] == "mcq":
        items = list(question["items"])
        random.shuffle(items)
        result["options"] = [
            {"id": item["id"], "text": item["text"]}
            for item in items
        ]

    elif question["question_type"] == "fill_blank":
        # Only the prompt is returned. Accepted answers remain server-side.
        result["input"] = True

    elif question["question_type"] == "ordering":
        items = list(question["items"])
        correct_ids = [
            item["id"]
            for item in sorted(items, key=lambda item: item["correct_position"])
        ]
        shuffled = list(items)

        # Try until the initial order differs from the canonical order.
        for _ in range(20):
            random.shuffle(shuffled)
            if [item["id"] for item in shuffled] != correct_ids:
                break

        if [item["id"] for item in shuffled] == correct_ids:
            # Deterministic fallback for valid questions with >= 2 pieces.
            shuffled[0], shuffled[1] = shuffled[1], shuffled[0]

        result["pieces"] = [
            {"id": item["id"], "text": item["text"]}
            for item in shuffled
        ]

    return result


def _is_answer_correct(question, answer):
    question_type = question["question_type"]

    if question_type == "mcq":
        try:
            answer_id = int(answer)
        except (TypeError, ValueError):
            return False

        return any(
            item["id"] == answer_id and item["is_correct"] == 1
            for item in question["items"]
        )

    if question_type == "fill_blank":
        if not isinstance(answer, str):
            return False

        normalized = answer.strip().casefold()
        accepted = {
            item["text"].strip().casefold()
            for item in question["items"]
            if item["is_correct"] == 1
        }
        return normalized in accepted

    if question_type == "ordering":
        if not isinstance(answer, list):
            return False

        try:
            answer_ids = [int(item_id) for item_id in answer]
        except (TypeError, ValueError):
            return False

        canonical = [
            item["id"]
            for item in sorted(
                question["items"],
                key=lambda item: item["correct_position"],
            )
        ]
        return answer_ids == canonical

    return False


def _serialize_result_question(question, user_answer, correct, language):
    result = {
        "id": question["id"],
        "type": question["question_type"],
        "prompt": question[f"prompt_{language}"],
        "submitted_answer": user_answer,
        "correct": correct,
    }

    if question["question_type"] == "mcq":
        correct_item = next(
            item for item in question["items"] if item["is_correct"] == 1
        )
        result["correct_answer"] = {
            "id": correct_item["id"],
            "text": correct_item["text"],
        }

    elif question["question_type"] == "fill_blank":
        result["correct_answers"] = [
            item["text"]
            for item in question["items"]
            if item["is_correct"] == 1
        ]

    elif question["question_type"] == "ordering":
        result["correct_answer"] = [
            item["id"]
            for item in sorted(
                question["items"],
                key=lambda item: item["correct_position"],
            )
        ]
        result["correct_pieces"] = [
            {"id": item["id"], "text": item["text"]}
            for item in sorted(
                question["items"],
                key=lambda item: item["correct_position"],
            )
        ]

    explanation = localized_value(
        question,
        "explanation",
        language,
    )
    if explanation is not None:
        result["explanation"] = explanation

    return result


def _display_type(unit_type):
    return {
        "grammar": "Grammar",
        "vocabulary": "Vocabulary",
        "conjugation": "Conjugation",
    }.get(unit_type, unit_type)