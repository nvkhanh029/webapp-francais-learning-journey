"""Practice API tests based on the Practice requirements and existing Flask test style.

Coverage:
- authentication and request validation
- normal practice start/submit/result
- all three question types
- answer normalization and final-answer scoring
- temporary-run ownership / reuse
- history persistence and display classification
- mixed-practice eligibility and maximum size
- learned-state requirements
"""

import sqlite3

import pytest

pytestmark = pytest.mark.flask


# ---------------------------------------------------------------------------
# Fixtures / setup helpers
# ---------------------------------------------------------------------------

def _practice_setup(client, database_path, *, support_language="vi"):
    """Create one authenticated learner and representative practice content."""
    with sqlite3.connect(database_path) as db:
        db.execute(
            """
            INSERT INTO users
                (id, email, password_hash, support_language, created_at)
            VALUES
                (1, 'learner@example.test', 'test-only-hash', ?, 'test')
            """,
            (support_language,),
        )

        # Normal-practice unit.
        db.execute(
            """
            INSERT INTO learning_units
                (id, unit_type, slug, title_fr, title_vi, title_en)
            VALUES
                (1, 'grammar', 'fixture-grammar', 'Les articles', 'Mạo từ', 'Articles')
            """
        )

        # Second unit is used by mixed practice.
        db.execute(
            """
            INSERT INTO learning_units
                (id, unit_type, slug, title_fr, title_vi, title_en)
            VALUES
                (2, 'vocabulary', 'fixture-vocabulary',
                 'Les mots', 'Từ vựng', 'Vocabulary')
            """
        )

        # Normal unit: one question of each supported type.
        _insert_question(
            db,
            question_id=1,
            unit_id=1,
            question_type="mcq",
            prompt_vi="Chọn mạo từ đúng.",
            prompt_en="Choose the correct article.",
            explanation_vi="Le được dùng ở đây.",
            explanation_en="Le is used here.",
            items=[
                (101, "le", 1, None, 1),
                (102, "la", 0, None, 2),
                (103, "les", 0, None, 3),
            ],
        )
        _insert_question(
            db,
            question_id=2,
            unit_id=1,
            question_type="fill_blank",
            prompt_vi="Điền từ tiếng Pháp cho 'xin chào'.",
            prompt_en="Enter the French word for 'hello'.",
            explanation_vi="Đáp án là bonjour.",
            explanation_en="The answer is bonjour.",
            items=[
                (201, "bonjour", 1, None, 1),
                (202, "salut", 0, None, 2),
            ],
        )
        _insert_question(
            db,
            question_id=3,
            unit_id=1,
            question_type="ordering",
            prompt_vi="Sắp xếp thành câu đúng.",
            prompt_en="Arrange the sentence correctly.",
            explanation_vi="Đây là trật tự đúng.",
            explanation_en="This is the correct order.",
            items=[
                (301, "Je", 1, 1, 1),
                (302, "suis", 1, 2, 2),
                (303, "étudiant", 1, 3, 3),
            ],
        )

    with client.session_transaction() as session:
        session["user_id"] = 1


def _insert_question(
    db,
    *,
    question_id,
    unit_id,
    question_type,
    prompt_vi,
    prompt_en,
    explanation_vi,
    explanation_en,
    items,
    sort_order=None,
):
    db.execute(
        """
        INSERT INTO questions
            (id, learning_unit_id, question_type,
             prompt_vi, prompt_en, explanation_vi, explanation_en, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            question_id,
            unit_id,
            question_type,
            prompt_vi,
            prompt_en,
            explanation_vi,
            explanation_en,
            sort_order if sort_order is not None else question_id,
        ),
    )

    for item_id, text, is_correct, correct_position, item_sort_order in items:
        db.execute(
            """
            INSERT INTO question_items
                (id, question_id, item_text, is_correct,
                 correct_position, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                item_id,
                question_id,
                text,
                is_correct,
                correct_position,
                item_sort_order,
            ),
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
            """
            SELECT id, question_type
            FROM questions
            ORDER BY id
            """
        ).fetchall()
    return {question_type: question_id for question_id, question_type in rows}


def _start_normal(client):
    response = client.post("/api/v1/practice/normal/fixture-grammar/start")
    assert response.status_code == 200
    return response.json["data"]


# ---------------------------------------------------------------------------
# Start: normal practice
# ---------------------------------------------------------------------------

def test_practice_normal_start_returns_run_and_questions(
    client, database_path
):
    _practice_setup(client, database_path)

    response = client.post(
        "/api/v1/practice/normal/fixture-grammar/start"
    )

    assert response.status_code == 200
    data = response.json["data"]

    assert data["practice_run_id"]
    assert data["practice_type"] == "normal"
    assert data["learning_unit"] == {
        "id": 1,
        "slug": "fixture-grammar",
        "unit_type": "grammar",
        "title_fr": "Les articles",
        "title": "Mạo từ",
    }
    assert len(data["questions"]) == 3
    assert {q["type"] for q in data["questions"]} == {
        "mcq", "fill_blank", "ordering"
    }


def test_practice_normal_start_uses_english_prompts_when_preference_is_en(
    client, database_path
):
    _practice_setup(client, database_path, support_language="en")

    data = _start_normal(client)

    prompts = {q["type"]: q["prompt"] for q in data["questions"]}
    assert prompts["mcq"] == "Choose the correct article."
    assert prompts["fill_blank"] == "Enter the French word for 'hello'."
    assert prompts["ordering"] == "Arrange the sentence correctly."


def test_practice_normal_start_hides_trusted_answer_data(
    client, database_path
):
    _practice_setup(client, database_path)

    data = _start_normal(client)

    for question in data["questions"]:
        assert "is_correct" not in str(question)
        assert "correct_position" not in str(question)

    mcq = next(q for q in data["questions"] if q["type"] == "mcq")
    assert all(set(option) == {"id", "text"} for option in mcq["options"])


def test_practice_ordering_is_not_initially_canonical(
    client, database_path
):
    _practice_setup(client, database_path)

    data = _start_normal(client)
    ordering = next(q for q in data["questions"] if q["type"] == "ordering")

    assert [piece["id"] for piece in ordering["pieces"]] != [301, 302, 303]


def test_practice_normal_unknown_unit_is_404(client, database_path):
    _practice_setup(client, database_path)

    response = client.post(
        "/api/v1/practice/normal/does-not-exist/start"
    )

    assert response.status_code == 404
    assert response.json["error"]["code"] == "learning_unit_not_found"


def test_practice_normal_without_questions_is_404(client, database_path):
    _practice_setup(client, database_path)

    with sqlite3.connect(database_path) as db:
        db.execute("DELETE FROM questions WHERE learning_unit_id = 1")

    response = client.post(
        "/api/v1/practice/normal/fixture-grammar/start"
    )

    assert response.status_code == 404
    assert response.json["error"]["code"] == "practice_questions_not_found"


def test_practice_start_requires_authentication(client):
    response = client.post(
        "/api/v1/practice/normal/fixture-grammar/start"
    )

    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


# ---------------------------------------------------------------------------
# Submit / scoring
# ---------------------------------------------------------------------------

def test_practice_submit_scores_all_three_question_types(
    client, database_path
):
    _practice_setup(client, database_path)

    data = _start_normal(client)
    ids = _question_ids_by_type(database_path)

    answers = {
        str(ids["mcq"]): 101,
        str(ids["fill_blank"]): "  BONJOUR  ",
        str(ids["ordering"]): [301, 302, 303],
    }

    response = client.post(
        f"/api/v1/practice/{data['practice_run_id']}/submit",
        json={"answers": answers},
    )

    assert response.status_code == 200
    result = response.json["data"]

    assert result["practice_type"] == "normal"
    assert result["correct_count"] == 3
    assert result["total_questions"] == 3
    assert result["accuracy"] == 1.0

    assert all(question["correct"] for question in result["questions"])


def test_practice_fill_blank_ignores_whitespace_and_case(
    client, database_path
):
    _practice_setup(client, database_path)

    data = _start_normal(client)
    ids = _question_ids_by_type(database_path)

    answers = {
        str(ids["mcq"]): 101,
        str(ids["fill_blank"]): "   BoNjOuR   ",
        str(ids["ordering"]): [301, 302, 303],
    }

    response = client.post(
        f"/api/v1/practice/{data['practice_run_id']}/submit",
        json={"answers": answers},
    )

    assert response.status_code == 200
    assert response.json["data"]["correct_count"] == 3


def test_practice_fill_blank_keeps_accents_significant(
    client, database_path
):
    _practice_setup(client, database_path)

    with sqlite3.connect(database_path) as db:
        db.execute(
            """
            UPDATE question_items
            SET item_text = 'été'
            WHERE id = 201
            """
        )

    data = _start_normal(client)
    ids = _question_ids_by_type(database_path)

    answers = {
        str(ids["mcq"]): 101,
        str(ids["fill_blank"]): "ete",
        str(ids["ordering"]): [301, 302, 303],
    }

    response = client.post(
        f"/api/v1/practice/{data['practice_run_id']}/submit",
        json={"answers": answers},
    )

    assert response.status_code == 200
    result = response.json["data"]

    assert result["correct_count"] == 2
    fill_result = next(
        q for q in result["questions"] if q["type"] == "fill_blank"
    )
    assert fill_result["correct"] is False
    assert fill_result["correct_answers"] == ["été"]


def test_practice_submit_uses_final_answers_at_submission_time(
    client, database_path
):
    _practice_setup(client, database_path)

    data = _start_normal(client)
    ids = _question_ids_by_type(database_path)

    # Simulates changing answers in the review step before final submit.
    answers = {
        str(ids["mcq"]): 102,          # changed to wrong answer
        str(ids["fill_blank"]): "bonjour",
        str(ids["ordering"]): [301, 302, 303],
    }

    response = client.post(
        f"/api/v1/practice/{data['practice_run_id']}/submit",
        json={"answers": answers},
    )

    assert response.status_code == 200
    assert response.json["data"]["correct_count"] == 2

    mcq_result = next(
        q for q in response.json["data"]["questions"] if q["type"] == "mcq"
    )
    assert mcq_result["correct"] is False
    assert mcq_result["correct_answer"] == {"id": 101, "text": "le"}


def test_practice_submit_returns_explanations_and_correct_answers(
    client, database_path
):
    _practice_setup(client, database_path)

    data = _start_normal(client)
    ids = _question_ids_by_type(database_path)

    response = client.post(
        f"/api/v1/practice/{data['practice_run_id']}/submit",
        json={
            "answers": {
                str(ids["mcq"]): 102,
                str(ids["fill_blank"]): "wrong",
                str(ids["ordering"]): [303, 302, 301],
            }
        },
    )

    assert response.status_code == 200
    questions = response.json["data"]["questions"]

    mcq = next(q for q in questions if q["type"] == "mcq")
    fill = next(q for q in questions if q["type"] == "fill_blank")
    ordering = next(q for q in questions if q["type"] == "ordering")

    assert mcq["correct_answer"] == {"id": 101, "text": "le"}
    assert fill["correct_answers"] == ["bonjour"]
    assert ordering["correct_answer"] == [301, 302, 303]
    assert ordering["correct_pieces"] == [
        {"id": 301, "text": "Je"},
        {"id": 302, "text": "suis"},
        {"id": 303, "text": "étudiant"},
    ]

    assert mcq["explanation"] == "Le được dùng ở đây."
    assert fill["explanation"] == "Đáp án là bonjour."
    assert ordering["explanation"] == "Đây là trật tự đúng."


def test_practice_submit_requires_answers_for_every_question(
    client, database_path
):
    _practice_setup(client, database_path)

    data = _start_normal(client)
    ids = _question_ids_by_type(database_path)

    response = client.post(
        f"/api/v1/practice/{data['practice_run_id']}/submit",
        json={"answers": {str(ids["mcq"]): 101}},
    )

    assert response.status_code == 400
    assert response.json["error"]["code"] == "incomplete_answers"

    # Invalid submission must not create history.
    with sqlite3.connect(database_path) as db:
        count = db.execute(
            "SELECT COUNT(*) FROM practice_sessions"
        ).fetchone()[0]
    assert count == 0


def test_practice_submit_requires_json_object(client, database_path):
    _practice_setup(client, database_path)

    data = _start_normal(client)

    response = client.post(
        f"/api/v1/practice/{data['practice_run_id']}/submit",
        data="not json",
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.json["error"]["code"] == "invalid_request"


def test_practice_run_cannot_be_submitted_twice(client, database_path):
    _practice_setup(client, database_path)

    data = _start_normal(client)
    ids = _question_ids_by_type(database_path)
    answers = {
        str(ids["mcq"]): 101,
        str(ids["fill_blank"]): "bonjour",
        str(ids["ordering"]): [301, 302, 303],
    }

    first = client.post(
        f"/api/v1/practice/{data['practice_run_id']}/submit",
        json={"answers": answers},
    )
    second = client.post(
        f"/api/v1/practice/{data['practice_run_id']}/submit",
        json={"answers": answers},
    )

    assert first.status_code == 200
    # The run is removed from the temporary store after completion.
    assert second.status_code == 404
    assert second.json["error"]["code"] == "practice_run_not_found"


def test_practice_completed_session_is_persisted_once(
    client, database_path
):
    _practice_setup(client, database_path)

    data = _start_normal(client)
    ids = _question_ids_by_type(database_path)

    response = client.post(
        f"/api/v1/practice/{data['practice_run_id']}/submit",
        json={
            "answers": {
                str(ids["mcq"]): 101,
                str(ids["fill_blank"]): "bonjour",
                str(ids["ordering"]): [301, 302, 303],
            }
        },
    )

    assert response.status_code == 200
    session_id = response.json["data"]["session_id"]

    with sqlite3.connect(database_path) as db:
        row = db.execute(
            """
            SELECT id, practice_type, learning_unit_id,
                   correct_count, total_questions
            FROM practice_sessions
            WHERE id = ?
            """,
            (session_id,),
        ).fetchone()

    assert row == (session_id, "normal", 1, 3, 3)


# ---------------------------------------------------------------------------
# History
# ---------------------------------------------------------------------------

def test_practice_history_returns_completed_sessions_newest_first(
    client, database_path
):
    _practice_setup(client, database_path)

    with sqlite3.connect(database_path) as db:
        db.execute(
            """
            INSERT INTO practice_sessions
                (id, user_id, practice_type, learning_unit_id,
                 completed_at, activity_date, correct_count, total_questions)
            VALUES
                (1, 1, 'normal', 1,
                 '2026-01-01T10:00:00+00:00', '2026-01-01', 2, 3)
            """
        )
        db.execute(
            """
            INSERT INTO practice_sessions
                (id, user_id, practice_type, learning_unit_id,
                 completed_at, activity_date, correct_count, total_questions)
            VALUES
                (2, 1, 'mixed', NULL,
                 '2026-01-02T10:00:00+00:00', '2026-01-02', 1, 2)
            """
        )

    response = client.get("/api/v1/practice/history")

    assert response.status_code == 200
    history = response.json["data"]["history"]

    assert [entry["id"] for entry in history] == [2, 1]
    assert history[0]["type"] == "Mixed"
    assert history[0]["content"] == {"title": "Mixed Practice"}

    assert history[1]["type"] == "Grammar"
    assert history[1]["content"] == {
        "slug": "fixture-grammar",
        "title_fr": "Les articles",
        "title": "Mạo từ",
    }
    assert history[1]["accuracy"] == pytest.approx(2 / 3)


def test_practice_history_uses_support_language_for_normal_content(
    client, database_path
):
    _practice_setup(client, database_path, support_language="en")

    with sqlite3.connect(database_path) as db:
        db.execute(
            """
            INSERT INTO practice_sessions
                (user_id, practice_type, learning_unit_id,
                 completed_at, activity_date, correct_count, total_questions)
            VALUES
                (1, 'normal', 1,
                 '2026-01-01T10:00:00+00:00', '2026-01-01', 3, 3)
            """
        )

    response = client.get("/api/v1/practice/history")

    assert response.status_code == 200
    entry = response.json["data"]["history"][0]
    assert entry["content"]["title"] == "Articles"


def test_practice_history_limit_is_respected(client, database_path):
    _practice_setup(client, database_path)

    with sqlite3.connect(database_path) as db:
        for session_id in range(1, 4):
            db.execute(
                """
                INSERT INTO practice_sessions
                    (id, user_id, practice_type, learning_unit_id,
                     completed_at, activity_date, correct_count, total_questions)
                VALUES (?, 1, 'normal', 1, ?, ?, 1, 1)
                """,
                (
                    session_id,
                    f"2026-01-0{session_id}T10:00:00+00:00",
                    f"2026-01-0{session_id}",
                ),
            )

    response = client.get("/api/v1/practice/history?limit=2")

    assert response.status_code == 200
    assert len(response.json["data"]["history"]) == 2


def test_practice_history_rejects_non_integer_limit(client, database_path):
    _practice_setup(client, database_path)

    response = client.get("/api/v1/practice/history?limit=abc")

    assert response.status_code == 400
    assert response.json["error"]["code"] == "invalid_limit"


def test_practice_history_requires_authentication(client):
    response = client.get("/api/v1/practice/history")

    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


# ---------------------------------------------------------------------------
# Mixed practice
# ---------------------------------------------------------------------------

def test_mixed_practice_requires_at_least_one_learned_unit(
    client, database_path
):
    _practice_setup(client, database_path)

    response = client.post("/api/v1/practice/mixed/start")

    assert response.status_code == 409
    assert response.json["error"]["code"] == "mixed_practice_unavailable"


def test_mixed_practice_uses_only_learned_units(client, database_path):
    _practice_setup(client, database_path)
    _learn_unit(database_path, unit_id=1)

    # Add one question to the unlearned vocabulary unit.
    with sqlite3.connect(database_path) as db:
        _insert_question(
            db,
            question_id=10,
            unit_id=2,
            question_type="mcq",
            prompt_vi="Không được chọn.",
            prompt_en="Must not be selected.",
            explanation_vi=None,
            explanation_en=None,
            items=[
                (1001, "wrong", 1, None, 1),
                (1002, "other", 0, None, 2),
            ],
        )

    response = client.post("/api/v1/practice/mixed/start")

    assert response.status_code == 200
    data = response.json["data"]

    assert data["practice_type"] == "mixed"
    assert len(data["questions"]) == 3
    assert all(
        question["id"] in {1, 2, 3}
        for question in data["questions"]
    )


def test_mixed_practice_selects_at_most_ten_questions(
    client, database_path
):
    _practice_setup(client, database_path)
    _learn_unit(database_path, unit_id=1)
    _learn_unit(database_path, unit_id=2)

    with sqlite3.connect(database_path) as db:
        # Add enough eligible questions to make the pool > 10.
        for question_id in range(10, 19):
            item_id = 1000 + question_id
            _insert_question(
                db,
                question_id=question_id,
                unit_id=2,
                question_type="mcq",
                prompt_vi=f"Question {question_id}",
                prompt_en=f"Question {question_id}",
                explanation_vi=None,
                explanation_en=None,
                items=[
                    (item_id, "correct", 1, None, 1),
                    (item_id + 100, "wrong", 0, None, 2),
                ],
            )

    response = client.post("/api/v1/practice/mixed/start")

    assert response.status_code == 200
    questions = response.json["data"]["questions"]

    assert len(questions) == 10
    assert len({q["id"] for q in questions}) == 10
    assert all(q["id"] in set(range(1, 4)) | set(range(10, 19))
               for q in questions)


def test_mixed_practice_uses_all_questions_when_fewer_than_ten(
    client, database_path
):
    _practice_setup(client, database_path)
    _learn_unit(database_path, unit_id=1)

    response = client.post("/api/v1/practice/mixed/start")

    assert response.status_code == 200
    questions = response.json["data"]["questions"]

    assert len(questions) == 3
    assert len({q["id"] for q in questions}) == 3


def test_mixed_completion_stores_null_learning_unit(
    client, database_path
):
    _practice_setup(client, database_path)
    _learn_unit(database_path, unit_id=1)

    data = client.post("/api/v1/practice/mixed/start").json["data"]
    ids = _question_ids_by_type(database_path)

    response = client.post(
        f"/api/v1/practice/{data['practice_run_id']}/submit",
        json={
            "answers": {
                str(ids["mcq"]): 101,
                str(ids["fill_blank"]): "bonjour",
                str(ids["ordering"]): [301, 302, 303],
            }
        },
    )

    assert response.status_code == 200
    assert response.json["data"]["practice_type"] == "mixed"

    with sqlite3.connect(database_path) as db:
        row = db.execute(
            """
            SELECT practice_type, learning_unit_id
            FROM practice_sessions
            WHERE id = ?
            """,
            (response.json["data"]["session_id"],),
        ).fetchone()

    assert row == ("mixed", None)


def test_mixed_result_contains_content_covered(client, database_path):
    _practice_setup(client, database_path)
    _learn_unit(database_path, unit_id=1)

    # Also make vocabulary learned, then add an eligible question there.
    _learn_unit(database_path, unit_id=2)
    with sqlite3.connect(database_path) as db:
        _insert_question(
            db,
            question_id=10,
            unit_id=2,
            question_type="mcq",
            prompt_vi="Từ vựng",
            prompt_en="Vocabulary",
            explanation_vi=None,
            explanation_en=None,
            items=[
                (1001, "chat", 1, None, 1),
                (1002, "chien", 0, None, 2),
            ],
        )

    # The prototype randomly selects from the pool. Retry a few starts until
    # both units are represented, without making the test depend on one draw.

    for _ in range(20):
        data = client.post("/api/v1/practice/mixed/start").json["data"]
        ids = {q["id"] for q in data["questions"]}
        if 10 in ids:
            break
        with practice_service._RUNS_LOCK:
            practice_service._RUNS.pop(data["practice_run_id"], None)
    else:
        pytest.fail("Mixed selection did not include the second learned unit.")

    answers = {}
    for question in data["questions"]:
        if question["type"] == "mcq":
            # For this fixture, question 10's correct answer is 1001;
            # questions 1/other MCQ use their first option.
            answers[str(question["id"])] = (
                1001 if question["id"] == 10 else 101
            )
        elif question["type"] == "fill_blank":
            answers[str(question["id"])] = "bonjour"
        elif question["type"] == "ordering":
            answers[str(question["id"])] = [301, 302, 303]

    response = client.post(
        f"/api/v1/practice/{data['practice_run_id']}/submit",
        json={"answers": answers},
    )

    assert response.status_code == 200
    covered = response.json["data"]["content_covered"]

    assert {unit["id"] for unit in covered} == {1, 2}


# ---------------------------------------------------------------------------
# Run ownership
# ---------------------------------------------------------------------------

def test_practice_run_belongs_to_the_learner_who_started_it(
    client, database_path
):
    _practice_setup(client, database_path)

    data = _start_normal(client)

    with sqlite3.connect(database_path) as db:
        db.execute(
            """
            INSERT INTO users
                (id, email, password_hash, support_language, created_at)
            VALUES
                (2, 'other@example.test', 'test-only-hash', 'vi', 'test')
            """
        )

    with client.session_transaction() as session:
        session["user_id"] = 2

    response = client.post(
        f"/api/v1/practice/{data['practice_run_id']}/submit",
        json={"answers": {}},
    )

    assert response.status_code == 403
    assert response.json["error"]["code"] == "practice_run_forbidden"