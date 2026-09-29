"""Contract-focused Practice API tests.

These tests are written against the current Practice implementation:
- the application-owned ``practice_run_store`` from practice_runs.py;
- shared JSON validation from validation.py;
- the Flask application composition in __init__.py.

The tests intentionally do not depend on learning_unit_repository.py or
Dashboard services, which are not part of the currently available files.
"""

import sqlite3

import pytest

pytestmark = pytest.mark.flask


def _practice_setup(client, database_path, *, support_language="vi"):
    """Create one authenticated learner and representative Practice content."""
    with sqlite3.connect(database_path) as db:
        db.execute(
            """
            INSERT INTO users
                (id, email, password_hash, support_language, created_at)
            VALUES (1, 'learner@example.test', 'test-only-hash', ?, 'test')
            """,
            (support_language,),
        )
        db.execute(
            """
            INSERT INTO learning_units
                (id, unit_type, slug, title_fr, title_vi, title_en)
            VALUES
                (1, 'grammar', 'fixture-grammar', 'Les articles', 'Mạo từ', 'Articles'),
                (2, 'vocabulary', 'fixture-vocabulary',
                 'Les mots', 'Từ vựng', 'Vocabulary')
            """
        )
        _insert_question(
            db, question_id=1, unit_id=1, question_type="mcq",
            prompt_vi="Chọn mạo từ đúng.", prompt_en="Choose the correct article.",
            explanation_vi="Le được dùng ở đây.", explanation_en="Le is used here.",
            items=[(101, "le", 1, None, 1), (102, "la", 0, None, 2),
                   (103, "les", 0, None, 3)],
        )
        _insert_question(
            db, question_id=2, unit_id=1, question_type="fill_blank",
            prompt_vi="Điền từ tiếng Pháp cho 'xin chào'.",
            prompt_en="Enter the French word for 'hello'.",
            explanation_vi="Đáp án là bonjour.", explanation_en="The answer is bonjour.",
            items=[(201, "bonjour", 1, None, 1), (202, "salut", 0, None, 2)],
        )
        _insert_question(
            db, question_id=3, unit_id=1, question_type="ordering",
            prompt_vi="Sắp xếp thành câu đúng.",
            prompt_en="Arrange the sentence correctly.",
            explanation_vi="Đây là trật tự đúng.",
            explanation_en="This is the correct order.",
            items=[(301, "Je", 1, 1, 1), (302, "suis", 1, 2, 2),
                   (303, "étudiant", 1, 3, 3)],
        )

    with client.session_transaction() as session:
        session["user_id"] = 1


def _insert_question(db, *, question_id, unit_id, question_type,
                     prompt_vi, prompt_en, explanation_vi, explanation_en,
                     items, sort_order=None):
    db.execute(
        """
        INSERT INTO questions
            (id, learning_unit_id, question_type, prompt_vi, prompt_en,
             explanation_vi, explanation_en, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (question_id, unit_id, question_type, prompt_vi, prompt_en,
         explanation_vi, explanation_en,
         question_id if sort_order is None else sort_order),
    )
    for item_id, text, is_correct, correct_position, item_sort_order in items:
        db.execute(
            """
            INSERT INTO question_items
                (id, question_id, item_text, is_correct, correct_position, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (item_id, question_id, text, is_correct, correct_position, item_sort_order),
        )


def _learn_unit(database_path, unit_id=1, *, user_id=1):
    with sqlite3.connect(database_path) as db:
        db.execute(
            """
            INSERT INTO user_learning_state
                (user_id, learning_unit_id, learned_at)
            VALUES (?, ?, ?)
            """,
            (user_id, unit_id, "2026-01-01T00:00:00+00:00"),
        )


def _question_ids_by_type(database_path):
    with sqlite3.connect(database_path) as db:
        rows = db.execute(
            "SELECT id, question_type FROM questions ORDER BY id"
        ).fetchall()
    return {question_type: question_id for question_id, question_type in rows}


def _answers(mcq=101, fill="bonjour", ordering=None):
    return [
        {"question_id": 1, "answer": {"item_id": mcq}},
        {"question_id": 2, "answer": {"text": fill}},
        {"question_id": 3, "answer": {"item_ids": ordering or [301, 302, 303]}},
    ]


def _start_normal(client):
    response = client.post("/api/v1/learning-units/fixture-grammar/practice/start")
    assert response.status_code == 201
    return response.json["data"]


def _submit(client, run_id, answers):
    return client.post(
        f"/api/v1/practice/runs/{run_id}/submit",
        json={"answers": answers},
    )


# ---------------------------------------------------------------------------
# Application/run-store wiring
# ---------------------------------------------------------------------------

def test_practice_uses_application_owned_run_store(client):
    store = client.application.extensions["practice_run_store"]
    assert store.__class__.__name__ == "InMemoryPracticeRunStore"
    assert hasattr(store, "create")
    assert hasattr(store, "get")
    assert hasattr(store, "mark_submitted")
    assert hasattr(store, "lock")


def test_practice_run_store_uses_contract_fields(client):
    store = client.application.extensions["practice_run_store"]
    run = store.create(
        user_id=1,
        practice_type="normal",
        learning_unit_id=1,
        selected_question_ids=[1, 2, 3],
    )
    assert set(run) == {
        "practice_run_id", "user_id", "practice_type", "learning_unit_id",
        "selected_question_ids", "submitted",
    }
    assert run["selected_question_ids"] == [1, 2, 3]
    assert "content_unit_ids" not in run
    assert run["submitted"] is False


# ---------------------------------------------------------------------------
# Start: normal Practice
# ---------------------------------------------------------------------------

def test_normal_start_returns_201_total_questions_and_contract_shape(client, database_path):
    _practice_setup(client, database_path)
    response = client.post("/api/v1/learning-units/fixture-grammar/practice/start")

    assert response.status_code == 201
    data = response.json["data"]
    assert data["practice_run_id"]
    assert data["practice_type"] == "normal"
    assert data["total_questions"] == 3
    assert data["learning_unit"] == {
        "slug": "fixture-grammar",
        "unit_type": "grammar",
        "title_fr": "Les articles",
        "title": "Mạo từ",
    }
    assert {q["question_type"] for q in data["questions"]} == {
        "mcq", "fill_blank", "ordering"
    }
    assert all("question_id" in q and "question_number" in q for q in data["questions"])


def test_normal_start_uses_support_language_for_prompts(client, database_path):
    _practice_setup(client, database_path, support_language="en")
    data = _start_normal(client)
    prompts = {q["question_type"]: q["prompt"] for q in data["questions"]}
    assert prompts == {
        "mcq": "Choose the correct article.",
        "fill_blank": "Enter the French word for 'hello'.",
        "ordering": "Arrange the sentence correctly.",
    }


def test_normal_start_hides_correct_answer_information(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    for question in data["questions"]:
        text = str(question)
        assert "is_correct" not in text
        assert "correct_position" not in text
        assert "correct_answer" not in question
    mcq = next(q for q in data["questions"] if q["question_type"] == "mcq")
    assert all(set(option) == {"item_id", "text"} for option in mcq["options"])


def test_normal_start_ordering_is_not_canonical(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    ordering = next(q for q in data["questions"] if q["question_type"] == "ordering")
    assert [item["item_id"] for item in ordering["items"]] != [301, 302, 303]


def test_normal_unknown_unit_is_404(client, database_path):
    _practice_setup(client, database_path)
    response = client.post("/api/v1/learning-units/does-not-exist/practice/start")
    assert response.status_code == 404
    assert response.json["error"]["code"] == "learning_unit_not_found"


def test_normal_without_usable_questions_is_409(client, database_path):
    _practice_setup(client, database_path)
    with sqlite3.connect(database_path) as db:
        db.execute("DELETE FROM questions WHERE learning_unit_id = 1")
    response = client.post("/api/v1/learning-units/fixture-grammar/practice/start")
    assert response.status_code == 409
    assert response.json["error"]["code"] == "practice_unavailable"


def test_normal_start_requires_authentication(client):
    response = client.post("/api/v1/learning-units/fixture-grammar/practice/start")
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


# ---------------------------------------------------------------------------
# Submit/scoring/result contract
# ---------------------------------------------------------------------------

def test_submit_scores_all_three_question_types(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    response = _submit(client, data["practice_run_id"], _answers(fill="  BoNjOuR  "))

    assert response.status_code == 200
    result = response.json["data"]
    assert result["practice_type"] == "normal"
    assert result["correct_count"] == 3
    assert result["total_questions"] == 3
    assert result["accuracy"] == 100.0
    assert len(result["results"]) == 3
    assert all(item["correct"] for item in result["results"])
    assert "session_id" not in result


def test_submit_result_has_contract_answer_shapes(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    response = _submit(
        client,
        data["practice_run_id"],
        _answers(mcq=102, fill="wrong", ordering=[303, 302, 301]),
    )
    assert response.status_code == 200
    results = response.json["data"]["results"]

    mcq = next(q for q in results if q["question_type"] == "mcq")
    fill = next(q for q in results if q["question_type"] == "fill_blank")
    ordering = next(q for q in results if q["question_type"] == "ordering")

    assert mcq["correct"] is False
    assert mcq["correct_answer"] == {"item_id": 101, "text": "le"}
    assert mcq["submitted_answer"] == {"item_id": 102, "text": "la"}

    assert fill["correct"] is False
    assert fill["correct_answer"] == {"accepted_answers": ["bonjour"]}
    assert fill["submitted_answer"] == {"text": "wrong"}

    assert ordering["correct"] is False
    assert ordering["correct_answer"] == {
        "items": [
            {"item_id": 301, "text": "Je"},
            {"item_id": 302, "text": "suis"},
            {"item_id": 303, "text": "étudiant"},
        ]
    }
    assert ordering["submitted_answer"] == {
        "items": [
            {"item_id": 303, "text": "étudiant"},
            {"item_id": 302, "text": "suis"},
            {"item_id": 301, "text": "Je"},
        ]
    }


def test_submit_always_includes_explanation_key(client, database_path):
    _practice_setup(client, database_path)
    with sqlite3.connect(database_path) as db:
        db.execute("UPDATE questions SET explanation_vi = NULL WHERE id = 2")
    data = _start_normal(client)
    result = _submit(client, data["practice_run_id"], _answers()).json["data"]
    fill = next(q for q in result["results"] if q["question_type"] == "fill_blank")
    assert "explanation" in fill
    assert fill["explanation"] is None


def test_fill_blank_ignores_whitespace_and_case_but_not_accents(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    ok = _submit(client, data["practice_run_id"], _answers(fill="  BoNjOuR  "))
    assert ok.status_code == 200
    assert ok.json["data"]["correct_count"] == 3

    # A fresh run is required because completed runs cannot be submitted again.
    with sqlite3.connect(database_path) as db:
        db.execute("UPDATE question_items SET item_text = 'été' WHERE id = 201")
    data = _start_normal(client)
    response = _submit(client, data["practice_run_id"], _answers(fill="ete"))
    assert response.status_code == 200
    fill = next(q for q in response.json["data"]["results"] if q["question_type"] == "fill_blank")
    assert fill["correct"] is False


def test_submit_uses_final_answers_at_submission_time(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    response = _submit(client, data["practice_run_id"], _answers(mcq=102))
    assert response.status_code == 200
    assert response.json["data"]["correct_count"] == 2


# ---------------------------------------------------------------------------
# Submission validation / history safety
# ---------------------------------------------------------------------------

def _history_count(database_path):
    with sqlite3.connect(database_path) as db:
        return db.execute("SELECT COUNT(*) FROM practice_sessions").fetchone()[0]


def test_incomplete_practice_is_422_and_writes_no_history(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    response = _submit(
        client, data["practice_run_id"],
        [{"question_id": 1, "answer": {"item_id": 101}}],
    )
    assert response.status_code == 422
    assert response.json["error"]["code"] == "incomplete_practice"
    assert _history_count(database_path) == 0


def test_malformed_json_uses_shared_invalid_json_error(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    response = client.post(
        f"/api/v1/practice/runs/{data['practice_run_id']}/submit",
        data="not json",
        content_type="application/json",
    )
    assert response.status_code == 400
    assert response.json["error"]["code"] == "invalid_json"


def test_non_object_submit_body_is_422_validation_error(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    response = client.post(
        f"/api/v1/practice/runs/{data['practice_run_id']}/submit",
        json=[{"question_id": 1}],
    )
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"


def test_answers_must_be_an_array(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    response = _submit(client, data["practice_run_id"], {"1": {"item_id": 101}})
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"
    assert _history_count(database_path) == 0


def test_mcq_rejects_foreign_item_id(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    response = _submit(client, data["practice_run_id"], [
        {"question_id": 1, "answer": {"item_id": 201}},
        {"question_id": 2, "answer": {"text": "bonjour"}},
        {"question_id": 3, "answer": {"item_ids": [301, 302, 303]}},
    ])
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"
    assert _history_count(database_path) == 0


def test_fill_blank_rejects_non_string_answer(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    response = _submit(client, data["practice_run_id"], [
        {"question_id": 1, "answer": {"item_id": 101}},
        {"question_id": 2, "answer": {"text": 123}},
        {"question_id": 3, "answer": {"item_ids": [301, 302, 303]}},
    ])
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"
    assert _history_count(database_path) == 0


@pytest.mark.parametrize("item_ids", [[301, 302], [301, 301, 303], [301, 302, 999]])
def test_ordering_rejects_incomplete_duplicate_or_foreign_permutation(
    client, database_path, item_ids
):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    response = _submit(client, data["practice_run_id"], [
        {"question_id": 1, "answer": {"item_id": 101}},
        {"question_id": 2, "answer": {"text": "bonjour"}},
        {"question_id": 3, "answer": {"item_ids": item_ids}},
    ])
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"
    assert _history_count(database_path) == 0


def test_duplicate_question_answer_is_rejected(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    response = _submit(client, data["practice_run_id"], [
        {"question_id": 1, "answer": {"item_id": 101}},
        {"question_id": 1, "answer": {"item_id": 102}},
        {"question_id": 2, "answer": {"text": "bonjour"}},
        {"question_id": 3, "answer": {"item_ids": [301, 302, 303]}},
    ])
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"
    assert _history_count(database_path) == 0


# ---------------------------------------------------------------------------
# Run ownership / lifecycle
# ---------------------------------------------------------------------------

def test_unknown_run_is_404(client, database_path):
    _practice_setup(client, database_path)
    response = _submit(client, "does-not-exist", _answers())
    assert response.status_code == 404
    assert response.json["error"]["code"] == "practice_run_not_found"


def test_run_ownership_is_checked_before_answer_validation(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    with sqlite3.connect(database_path) as db:
        db.execute(
            """
            INSERT INTO users
                (id, email, password_hash, support_language, created_at)
            VALUES (2, 'other@example.test', 'test-only-hash', 'vi', 'test')
            """
        )
    with client.session_transaction() as session:
        session["user_id"] = 2
    response = _submit(client, data["practice_run_id"], {"not": "valid"})
    assert response.status_code == 404
    assert response.json["error"]["code"] == "practice_run_not_found"
    assert _history_count(database_path) == 0


def test_run_cannot_be_submitted_twice(client, database_path):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    first = _submit(client, data["practice_run_id"], _answers())
    second = _submit(client, data["practice_run_id"], _answers())
    assert first.status_code == 200
    assert second.status_code == 409
    assert second.json["error"]["code"] == "practice_already_submitted"
    assert _history_count(database_path) == 1


def test_completed_practice_persists_one_summary_without_exposing_session_id(
    client, database_path
):
    _practice_setup(client, database_path)
    data = _start_normal(client)
    response = _submit(client, data["practice_run_id"], _answers())
    assert response.status_code == 200
    assert "session_id" not in response.json["data"]

    with sqlite3.connect(database_path) as db:
        row = db.execute(
            """
            SELECT practice_type, learning_unit_id, correct_count, total_questions
            FROM practice_sessions
            WHERE user_id = 1
            """
        ).fetchone()
    assert row == ("normal", 1, 3, 3)


# ---------------------------------------------------------------------------
# Mixed Practice
# ---------------------------------------------------------------------------

def test_mixed_start_returns_201_and_requires_learned_content(client, database_path):
    _practice_setup(client, database_path)
    response = client.post("/api/v1/mixed-practice/start")
    assert response.status_code == 409
    assert response.json["error"]["code"] == "mixed_practice_unavailable"


def test_mixed_start_accepts_empty_json_object(client, database_path):
    _practice_setup(client, database_path)
    _learn_unit(database_path, unit_id=1)
    response = client.post("/api/v1/mixed-practice/start", json={})
    assert response.status_code == 201
    assert response.json["data"]["practice_type"] == "mixed"


def test_mixed_start_accepts_no_body(client, database_path):
    _practice_setup(client, database_path)
    _learn_unit(database_path, unit_id=1)
    response = client.post("/api/v1/mixed-practice/start")
    assert response.status_code == 201


def test_mixed_uses_only_learned_units(client, database_path):
    _practice_setup(client, database_path)
    _learn_unit(database_path, unit_id=1)
    with sqlite3.connect(database_path) as db:
        _insert_question(
            db, question_id=10, unit_id=2, question_type="mcq",
            prompt_vi="Không chọn.", prompt_en="Must not be selected.",
            explanation_vi=None, explanation_en=None,
            items=[(1001, "correct", 1, None, 1), (1002, "wrong", 0, None, 2)],
        )
    response = client.post("/api/v1/mixed-practice/start")
    assert response.status_code == 201
    questions = response.json["data"]["questions"]
    assert len(questions) == 3
    assert {q["question_id"] for q in questions} == {1, 2, 3}


def test_mixed_selects_at_most_ten_distinct_questions(client, database_path):
    _practice_setup(client, database_path)
    _learn_unit(database_path, unit_id=1)
    _learn_unit(database_path, unit_id=2)
    with sqlite3.connect(database_path) as db:
        for question_id in range(10, 19):
            item_id = 1000 + question_id
            _insert_question(
                db, question_id=question_id, unit_id=2, question_type="mcq",
                prompt_vi=f"Question {question_id}", prompt_en=f"Question {question_id}",
                explanation_vi=None, explanation_en=None,
                items=[(item_id, "correct", 1, None, 1),
                       (item_id + 100, "wrong", 0, None, 2)],
            )
    response = client.post("/api/v1/mixed-practice/start")
    assert response.status_code == 201
    questions = response.json["data"]["questions"]
    ids = [q["question_id"] for q in questions]
    assert len(ids) == 10
    assert len(set(ids)) == 10
    assert set(ids) <= set(range(1, 4)) | set(range(10, 19))


def test_mixed_uses_all_available_questions_when_fewer_than_ten(client, database_path):
    _practice_setup(client, database_path)
    _learn_unit(database_path, unit_id=1)
    response = client.post("/api/v1/mixed-practice/start")
    assert response.status_code == 201
    questions = response.json["data"]["questions"]
    assert len(questions) == 3
    assert len({q["question_id"] for q in questions}) == 3


def test_mixed_result_derives_content_covered_from_selected_questions(client, database_path):
    _practice_setup(client, database_path)
    _learn_unit(database_path, unit_id=1)
    _learn_unit(database_path, unit_id=2)
    with sqlite3.connect(database_path) as db:
        for question_id in range(10, 17):
            item_id = 1000 + question_id
            _insert_question(
                db, question_id=question_id, unit_id=2, question_type="mcq",
                prompt_vi=f"Từ vựng {question_id}", prompt_en=f"Vocabulary {question_id}",
                explanation_vi=None, explanation_en=None,
                items=[(item_id, "correct", 1, None, 1),
                       (item_id + 100, "wrong", 0, None, 2)],
            )

    data = client.post("/api/v1/mixed-practice/start").json["data"]
    assert len(data["questions"]) == 10

    answers = []
    for question in data["questions"]:
        if question["question_id"] in {1, 2, 3}:
            if question["question_type"] == "mcq":
                answer = {"item_id": 101}
            elif question["question_type"] == "fill_blank":
                answer = {"text": "bonjour"}
            else:
                answer = {"item_ids": [301, 302, 303]}
        else:
            answer = {"item_id": min(i["item_id"] for i in question["options"])}
        answers.append({"question_id": question["question_id"], "answer": answer})

    response = _submit(client, data["practice_run_id"], answers)
    assert response.status_code == 200
    covered = response.json["data"]["content_covered"]
    assert {unit["slug"] for unit in covered} == {"fixture-grammar", "fixture-vocabulary"}
    assert all("id" not in unit for unit in covered)


def test_mixed_completion_persists_null_learning_unit(client, database_path):
    _practice_setup(client, database_path)
    _learn_unit(database_path, unit_id=1)
    data = client.post("/api/v1/mixed-practice/start").json["data"]
    answers = []
    for question in data["questions"]:
        if question["question_type"] == "mcq":
            answer = {"item_id": 101}
        elif question["question_type"] == "fill_blank":
            answer = {"text": "bonjour"}
        else:
            answer = {"item_ids": [301, 302, 303]}
        answers.append({"question_id": question["question_id"], "answer": answer})
    response = _submit(client, data["practice_run_id"], answers)
    assert response.status_code == 200
    with sqlite3.connect(database_path) as db:
        row = db.execute(
            "SELECT practice_type, learning_unit_id FROM practice_sessions WHERE user_id = 1"
        ).fetchone()
    assert row == ("mixed", None)