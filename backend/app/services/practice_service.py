import random
from datetime import datetime

from flask import current_app, g

from ..db import transaction
from ..errors import ApiError
from ..localization import localized_value, resolve_support_language
from ..repositories import learning_unit_repository, practice_repository


MAX_MIXED_QUESTIONS = 10


def _run_store():
    return current_app.extensions["practice_run_store"]


def start_normal_practice(slug):
    user_id = g.current_user["id"]
    language = resolve_support_language(g.current_user["support_language"])

    unit = learning_unit_repository.find_by_slug(slug)
    if unit is None:
        raise ApiError(404, "learning_unit_not_found", "Learning unit not found.")

    questions = _usable_questions(
        practice_repository.list_questions_for_learning_unit(unit["id"])
    )
    if not questions:
        raise ApiError(
            409,
            "practice_unavailable",
            "Practice is not available for this learning unit.",
        )

    run = _run_store().create(
        user_id=user_id,
        practice_type="normal",
        learning_unit_id=unit["id"],
        selected_question_ids=[q["id"] for q in questions],
    )

    return {
        "practice_run_id": run["practice_run_id"],
        "practice_type": "normal",
        "learning_unit": _serialize_unit(unit, language),
        "total_questions": len(questions),
        "questions": [
            _serialize_question_for_client(q, language, index)
            for index, q in enumerate(questions, start=1)
        ],
    }


def start_mixed_practice():
    user_id = g.current_user["id"]
    language = resolve_support_language(g.current_user["support_language"])

    learned_units = list(practice_repository.list_learned_learning_units(user_id))
    if not learned_units:
        raise ApiError(
            409,
            "mixed_practice_unavailable",
            "Mixed Practice is not available until you have learned at least one learning unit.",
        )

    unit_ids = [unit["id"] for unit in learned_units]
    eligible = _usable_questions(
        practice_repository.list_questions_for_learning_units(unit_ids)
    )
    if not eligible:
        raise ApiError(
            409,
            "mixed_practice_unavailable",
            "Mixed Practice is not available from the learner's learned content.",
        )

    selected = random.sample(eligible, min(MAX_MIXED_QUESTIONS, len(eligible)))
    random.shuffle(selected)

    run = _run_store().create(
        user_id=user_id,
        practice_type="mixed",
        learning_unit_id=None,
        selected_question_ids=[q["id"] for q in selected],
    )

    return {
        "practice_run_id": run["practice_run_id"],
        "practice_type": "mixed",
        "total_questions": len(selected),
        "questions": [
            _serialize_question_for_client(q, language, index)
            for index, q in enumerate(selected, start=1)
        ],
    }


def submit_practice(run_id, answers):
    user_id = g.current_user["id"]

    if not isinstance(run_id, str) or not run_id:
        raise ApiError(
            422,
            "validation_error",
            "Request fields are invalid.",
            {"practice_run_id": "Must be a non-empty string."},
        )

    store = _run_store()

    # The shared practice_runs file is runtime infrastructure only. The
    # service owns authorization, validation, scoring, persistence, and the
    # submitted transition.
    with store.lock():
        run = store.get(run_id)

        if run is None:
            raise ApiError(
                404,
                "practice_run_not_found",
                "Practice run was not found or has expired.",
            )

        if run["user_id"] != user_id:
            raise ApiError(
                404,
                "practice_run_not_found",
                "Practice run was not found or has expired.",
            )

        if run["submitted"]:
            raise ApiError(
                409,
                "practice_already_submitted",
                "This practice run has already been submitted.",
            )

        parsed_answers = _parse_answers(answers)
        expected_ids = {str(qid) for qid in run["selected_question_ids"]}

        if set(parsed_answers) != expected_ids:
            raise ApiError(
                422,
                "incomplete_practice",
                "Every question in the practice run must have exactly one submitted answer.",
                {"answers": "Answers must contain exactly one entry for every question."},
            )

        questions = practice_repository.get_questions_by_ids(
            run["selected_question_ids"]
        )
        by_id = {str(question["id"]): question for question in questions}

        if set(by_id) != expected_ids:
            code = (
                "practice_unavailable"
                if run["practice_type"] == "normal"
                else "mixed_practice_unavailable"
            )
            raise ApiError(409, code, "The practice questions are no longer available.")

        actual_unit_ids = {q["learning_unit_id"] for q in questions}
        if run["practice_type"] == "normal" and actual_unit_ids != {run["learning_unit_id"]}:
            raise ApiError(409, "practice_unavailable", "The practice run is no longer valid.")

        _validate_answers(questions, parsed_answers)

        language = resolve_support_language(g.current_user["support_language"])
        result_questions = []
        correct_count = 0
        question_number_by_id = {
            str(question_id): index
            for index, question_id in enumerate(run["selected_question_ids"], start=1)
        }

        for question_id in run["selected_question_ids"]:
            question = by_id[str(question_id)]
            user_answer = parsed_answers[str(question_id)]
            correct = _is_answer_correct(question, user_answer)
            if correct:
                correct_count += 1

            result_questions.append(
                _serialize_result_question(
                    question,
                    user_answer,
                    correct,
                    language,
                    question_number_by_id[str(question_id)],
                )
            )

        total_questions = len(run["selected_question_ids"])
        now = datetime.now().astimezone()
        completed_at = now.isoformat()
        activity_date = now.date().isoformat()

        # No Practice History row is created until all structural validation
        # succeeds and the final answers have been scored.
        with transaction():
            practice_repository.insert_practice_session(
                user_id=user_id,
                practice_type=run["practice_type"],
                learning_unit_id=run["learning_unit_id"],
                completed_at=completed_at,
                activity_date=activity_date,
                correct_count=correct_count,
                total_questions=total_questions,
            )
        store.mark_submitted(run_id)

        result = {
            "practice_run_id": run_id,
            "practice_type": run["practice_type"],
            "correct_count": correct_count,
            "total_questions": total_questions,
            "accuracy": round(100 * correct_count / total_questions, 1),
            "results": result_questions,
        }

        # Question retrieval is the source of truth for the units represented
        # by this run. This avoids duplicating learning-unit ID lookups in the
        # Practice repository.
        content_units = []
        seen_unit_ids = set()
        for question_id in run["selected_question_ids"]:
            question = by_id[str(question_id)]
            unit_id = question["learning_unit_id"]
            if unit_id in seen_unit_ids:
                continue
            seen_unit_ids.add(unit_id)
            unit = question["learning_unit"]
            content_units.append(unit)

        if run["practice_type"] == "normal":
            if len(content_units) != 1:
                raise ApiError(
                    409,
                    "practice_unavailable",
                    "The learning unit is no longer available.",
                )
            result["learning_unit"] = _serialize_unit(content_units[0], language)
        else:
            result["content_covered"] = [
                _serialize_unit(unit, language)
                for unit in content_units
            ]

        return result


def _parse_answers(answers):
    if not isinstance(answers, list):
        _validation_error("answers", "Must be an array.")

    parsed = {}
    for index, entry in enumerate(answers):
        field = f"answers[{index}]"
        if not isinstance(entry, dict):
            _validation_error(field, "Must be an object.")

        question_id = entry.get("question_id")
        answer = entry.get("answer")

        if type(question_id) is not int or question_id <= 0:
            _validation_error(f"{field}.question_id", "Must be a positive integer.")
        if not isinstance(answer, dict):
            _validation_error(f"{field}.answer", "Must be an object.")

        key = str(question_id)
        if key in parsed:
            _validation_error(
                f"{field}.question_id", "Question may only be answered once."
            )
        parsed[key] = answer

    return parsed


def _validate_answers(questions, parsed_answers):
    by_id = {str(question["id"]): question for question in questions}

    for question_id, answer in parsed_answers.items():
        question = by_id[question_id]
        field = f"answers[{question_id}]"
        question_type = question["question_type"]

        if question_type == "mcq":
            if set(answer) != {"item_id"} or type(answer["item_id"]) is not int:
                _validation_error(field, "MCQ answer must contain exactly one integer item_id.")
            if not any(item["id"] == answer["item_id"] for item in question["items"]):
                _validation_error(field, "item_id does not belong to this question.")

        elif question_type == "fill_blank":
            if set(answer) != {"text"} or not isinstance(answer["text"], str) or not answer["text"].strip():
                _validation_error(field, "Fill-blank answer must contain exactly one string text value.")

        elif question_type == "ordering":
            item_ids = answer.get("item_ids")
            expected = [item["id"] for item in question["items"]]
            if set(answer) != {"item_ids"} or not isinstance(item_ids, list):
                _validation_error(field, "Ordering answer must contain exactly one item_ids array.")
            if (
                len(item_ids) != len(expected)
                or any(type(item_id) is not int for item_id in item_ids)
                or len(set(item_ids)) != len(item_ids)
                or set(item_ids) != set(expected)
            ):
                _validation_error(field, "item_ids must be a complete permutation of this question's items.")

        else:
            _validation_error(field, "Unsupported question type.")


def _validation_error(field, message):
    raise ApiError(422, "validation_error", "Request fields are invalid.", {field: message})


def _is_answer_correct(question, answer):
    question_type = question["question_type"]
    if question_type == "mcq":
        return any(
            item["id"] == answer["item_id"] and item["is_correct"] == 1
            for item in question["items"]
        )

    if question_type == "fill_blank":
        normalized = answer["text"].strip().casefold()
        accepted = {
            item["text"].strip().casefold()
            for item in question["items"]
            if item["is_correct"] == 1
        }
        return normalized in accepted

    if question_type == "ordering":
        canonical = [
            item["id"]
            for item in sorted(question["items"], key=lambda item: item["correct_position"])
        ]
        return answer["item_ids"] == canonical

    return False


def _serialize_unit(unit, language):
    return {
        "slug": unit["slug"],
        "unit_type": unit["unit_type"],
        "title_fr": unit["title_fr"],
        "title": localized_value(unit, "title", language, french_fallback_field="title_fr"),
    }


def _serialize_question_for_client(question, language, question_number):
    result = {
        "question_id": question["id"],
        "question_number": question_number,
        "question_type": question["question_type"],
        "prompt": question[f"prompt_{language}"],
    }

    if question["question_type"] == "mcq":
        items = list(question["items"])
        random.shuffle(items)
        result["options"] = [
            {"item_id": item["id"], "text": item["text"]}
            for item in items
        ]
    elif question["question_type"] == "ordering":
        items = list(question["items"])
        correct_ids = [
            item["id"] for item in sorted(items, key=lambda item: item["correct_position"])
        ]
        shuffled = list(items)
        for _ in range(20):
            random.shuffle(shuffled)
            if [item["id"] for item in shuffled] != correct_ids:
                break
        if [item["id"] for item in shuffled] == correct_ids:
            shuffled[0], shuffled[1] = shuffled[1], shuffled[0]
        result["items"] = [
            {"item_id": item["id"], "text": item["text"]}
            for item in shuffled
        ]

    return result


def _serialize_result_question(question, user_answer, correct, language, question_number):
    result = {
        "question_id": question["id"],
        "question_number": question_number,
        "question_type": question["question_type"],
        "prompt": question[f"prompt_{language}"],
        "submitted_answer": _serialize_submitted_answer(question, user_answer),
        "correct": correct,
        "explanation": localized_value(question, "explanation", language),
    }

    if question["question_type"] == "mcq":
        correct_item = next(item for item in question["items"] if item["is_correct"] == 1)
        result["correct_answer"] = {"item_id": correct_item["id"], "text": correct_item["text"]}
    elif question["question_type"] == "fill_blank":
        result["correct_answer"] = {
            "accepted_answers": [
                item["text"] for item in question["items"] if item["is_correct"] == 1
            ]
        }
    elif question["question_type"] == "ordering":
        ordered = sorted(question["items"], key=lambda item: item["correct_position"])
        result["correct_answer"] = {
            "items": [
                {"item_id": item["id"], "text": item["text"]}
                for item in ordered
            ]
        }

    return result


def _serialize_submitted_answer(question, answer):
    if question["question_type"] == "mcq":
        item_id = answer["item_id"]
        item = next(item for item in question["items"] if item["id"] == item_id)
        return {"item_id": item_id, "text": item["text"]}
    if question["question_type"] == "fill_blank":
        return {"text": answer["text"]}
    if question["question_type"] == "ordering":
        items_by_id = {item["id"]: item for item in question["items"]}
        return {
            "items": [
                {"item_id": item_id, "text": items_by_id[item_id]["text"]}
                for item_id in answer["item_ids"]
            ]
        }
    return answer


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