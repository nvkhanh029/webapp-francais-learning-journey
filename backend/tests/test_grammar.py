"""Grammar browse and lesson detail behavior.

Failure paths assert both HTTP status and error.code.
"""
import pytest
from app.db import get_db
pytestmark = pytest.mark.flask
BROWSE_URL = "/api/v1/grammar"
LESSON_URL = "/api/v1/grammar/lessons/articles-definis"

# --- Helpers ----------------------------------------------------------------
def insert_user(db, user_id, support_language="vi"):
    """Insert one fixture user row with the given id and language."""
    db.execute(
        "INSERT INTO users (id, email, password_hash, support_language, created_at) "
        "VALUES (?, ?, 'test-only-hash', ?, 'test')",
        (user_id, f"learner{user_id}@example.test", support_language),
    )

def create_grammar_data(app):
    """Populate the database with one part, chapter, lesson, and user."""
    with app.app_context():
        db = get_db()
        insert_user(db, 1, "vi")
        db.execute("""
            INSERT INTO grammar_parts
            (id, title_fr, title_vi, title_en, sort_order)
            VALUES
            (1, 'Le groupe du nom', 'Cụm danh từ', 'Noun Phrase', 1)
        """)

        db.execute("""
            INSERT INTO grammar_chapters
            (id, part_id, title_fr, title_vi, title_en, sort_order)
            VALUES
            (1, 1, 'Les déterminants', 'Từ hạn định', 'Determiners', 1)
        """)

        db.execute("""
            INSERT INTO learning_units
            (id, unit_type, slug, title_fr, title_vi, title_en)
            VALUES
            (1, 'grammar', 'articles-definis',
             'Les articles définis',
             'Mạo từ xác định',
             'Definite Articles')
        """)

        db.execute("""
            INSERT INTO grammar_lessons
            (learning_unit_id, chapter_id, sort_order,
             content_vi, content_en)
            VALUES
            (1, 1, 1,
             'Nội dung tiếng Việt.',
             'English content.')
        """)

        db.commit()


def login_test_user(client, user_id=1):
    """Store the user id in the client session."""
    with client.session_transaction() as session:
        session["user_id"] = user_id


def set_support_language(app, language, user_id=1):
    """Update the stored support language for a user."""
    with app.app_context():
        db = get_db()
        db.execute(
            "UPDATE users SET support_language = ? WHERE id = ?",
            (language, user_id),
        )
        db.commit()


def first_lesson(client):
    """Return the first lesson from the grammar browse payload."""
    body = client.get(BROWSE_URL).get_json()
    return body["data"]["parts"][0]["chapters"][0]["lessons"][0]


# --- Authentication ---------------------------------------------------------

def test_grammar_requires_login(client):
    """Confirm grammar browse requires authentication."""
    response = client.get(BROWSE_URL)

    assert response.status_code == 401


@pytest.mark.parametrize("url", [BROWSE_URL, LESSON_URL])
def test_requires_login_has_error_code(client, url):
    """Confirm grammar endpoints reject unauthenticated requests with a code."""
    response = client.get(url)

    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "not_authenticated"


# --- Browse -----------------------------------------------------------------

def test_grammar_browse(app, client):
    """Confirm browse returns localized ordered part, chapter, and lesson data."""
    create_grammar_data(app)
    login_test_user(client)

    response = client.get(BROWSE_URL)

    assert response.status_code == 200

    data = response.get_json()["data"]

    assert data["parts"][0]["title"] == "Cụm danh từ"
    assert data["parts"][0]["title_fr"] == "Le groupe du nom"

    chapter = data["parts"][0]["chapters"][0]

    assert chapter["title"] == "Từ hạn định"
    assert "_id" not in chapter

    lesson = chapter["lessons"][0]

    assert lesson["slug"] == "articles-definis"
    assert lesson["title_fr"] == "Les articles définis"
    assert lesson["title"] == "Mạo từ xác định"
    assert lesson["learned"] is False
    assert lesson["review_later"] is False
    assert "content" not in lesson


def test_empty_database_returns_empty_parts(app, client):
    """Confirm browse returns an empty parts list when no content exists."""
    with app.app_context():
        db = get_db()
        insert_user(db, 1, "vi")
        db.commit()
    login_test_user(client)

    response = client.get(BROWSE_URL)

    assert response.status_code == 200
    assert response.get_json()["data"] == {"parts": []}


def test_grammar_english(app, client):
    """Confirm English support language selects English titles."""
    create_grammar_data(app)
    set_support_language(app, "en")
    login_test_user(client)

    response = client.get(BROWSE_URL)

    assert response.status_code == 200

    data = response.get_json()["data"]

    assert data["parts"][0]["title"] == "Noun Phrase"

    chapter = data["parts"][0]["chapters"][0]

    assert chapter["title"] == "Determiners"
    assert chapter["lessons"][0]["title"] == "Definite Articles"


def test_title_falls_back_to_french(app, client):
    """Confirm missing localized titles fall back to French."""
    create_grammar_data(app)
    with app.app_context():
        db = get_db()
        db.execute("UPDATE learning_units SET title_vi = NULL WHERE id = 1")
        db.execute("UPDATE grammar_parts SET title_vi = NULL WHERE id = 1")
        db.execute("UPDATE grammar_chapters SET title_vi = NULL WHERE id = 1")
        db.commit()
    login_test_user(client)

    data = client.get(BROWSE_URL).get_json()["data"]
    part = data["parts"][0]
    chapter = part["chapters"][0]

    assert part["title"] == "Le groupe du nom"
    assert chapter["title"] == "Les déterminants"
    assert chapter["lessons"][0]["title"] == "Les articles définis"


def test_browse_orders_by_sort_order_not_id(app, client):
    """Confirm browse orders parts, chapters, and lessons by sort_order."""
    with app.app_context():
        db = get_db()
        insert_user(db, 1, "vi")

        # Inserted in the "wrong" order on purpose: IDs must not drive order.
        db.execute("INSERT INTO grammar_parts (id, title_fr, sort_order) VALUES (1, 'Part B', 20)")
        db.execute("INSERT INTO grammar_parts (id, title_fr, sort_order) VALUES (2, 'Part A', 10)")

        db.execute("INSERT INTO grammar_chapters (id, part_id, title_fr, sort_order) VALUES (1, 1, 'B-ch-20', 20)")
        db.execute("INSERT INTO grammar_chapters (id, part_id, title_fr, sort_order) VALUES (2, 1, 'B-ch-10', 10)")
        db.execute("INSERT INTO grammar_chapters (id, part_id, title_fr, sort_order) VALUES (3, 2, 'A-ch-10', 10)")

        lessons = [
            (1, "b-lesson", 1, 10),
            (2, "bch10-second", 2, 20),
            (3, "bch10-first", 2, 10),
            (4, "a-lesson", 3, 10),
        ]
        for unit_id, slug, chapter_id, sort_order in lessons:
            db.execute(
                "INSERT INTO learning_units (id, unit_type, slug, title_fr) "
                "VALUES (?, 'grammar', ?, ?)",
                (unit_id, slug, slug),
            )
            db.execute(
                "INSERT INTO grammar_lessons "
                "(learning_unit_id, chapter_id, sort_order, content_vi, content_en) "
                "VALUES (?, ?, ?, 'vi', 'en')",
                (unit_id, chapter_id, sort_order),
            )
        db.commit()
    login_test_user(client)

    parts = client.get(BROWSE_URL).get_json()["data"]["parts"]

    assert [p["title_fr"] for p in parts] == ["Part A", "Part B"]
    assert [c["title_fr"] for c in parts[1]["chapters"]] == ["B-ch-10", "B-ch-20"]
    assert [l["slug"] for l in parts[1]["chapters"][0]["lessons"]] == [
        "bch10-first",
        "bch10-second",
    ]
    assert [l["slug"] for l in parts[1]["chapters"][1]["lessons"]] == ["b-lesson"]
    assert [l["slug"] for l in parts[0]["chapters"][0]["lessons"]] == ["a-lesson"]


# --- Lesson detail ----------------------------------------------------------

def test_grammar_lesson_detail(app, client):
    """Confirm lesson detail returns localized content, context, and state."""
    create_grammar_data(app)
    login_test_user(client)

    response = client.get(LESSON_URL)

    assert response.status_code == 200

    data = response.get_json()["data"]

    assert data["slug"] == "articles-definis"
    assert data["title_fr"] == "Les articles définis"
    assert data["title"] == "Mạo từ xác định"
    assert data["content"] == "Nội dung tiếng Việt."
    assert data["context"]["part"]["title_fr"] == "Le groupe du nom"
    assert data["context"]["chapter"]["title_fr"] == "Les déterminants"
    assert data["state"] == {"learned": False, "review_later": False}


def test_grammar_lesson_english(app, client):
    """Confirm lesson detail selects English content and titles."""
    create_grammar_data(app)
    set_support_language(app, "en")
    login_test_user(client)

    response = client.get(LESSON_URL)

    assert response.status_code == 200

    data = response.get_json()["data"]

    assert data["title"] == "Definite Articles"
    assert data["content"] == "English content."
    assert data["context"]["part"]["title"] == "Noun Phrase"
    assert data["context"]["chapter"]["title"] == "Determiners"


def test_null_support_language_falls_back_to_vietnamese(app, client):
    """Confirm a null language reads Vietnamese without persisting it."""
    create_grammar_data(app)
    set_support_language(app, None)
    login_test_user(client)

    response = client.get(LESSON_URL)

    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["content"] == "Nội dung tiếng Việt."
    assert data["title"] == "Mạo từ xác định"

    # The fallback is read-time only and must not be persisted.
    with app.app_context():
        row = get_db().execute(
            "SELECT support_language FROM users WHERE id = 1"
        ).fetchone()
    assert row["support_language"] is None


def test_grammar_lesson_not_found(app, client):
    """Confirm an unknown lesson slug returns a learning_unit_not_found error."""
    create_grammar_data(app)
    login_test_user(client)

    response = client.get("/api/v1/grammar/lessons/not-exist")

    assert response.status_code == 404
    assert response.get_json()["error"]["code"] == "learning_unit_not_found"


def test_slug_of_other_module_is_404(app, client):
    """Confirm a non-grammar slug is treated as not found."""
    create_grammar_data(app)
    with app.app_context():
        db = get_db()
        db.execute(
            "INSERT INTO learning_units (id, unit_type, slug, title_fr) "
            "VALUES (2, 'vocabulary', 'pain-1', 'Le pain')"
        )
        db.commit()
    login_test_user(client)

    response = client.get("/api/v1/grammar/lessons/pain-1")

    assert response.status_code == 404
    assert response.get_json()["error"]["code"] == "learning_unit_not_found"


# --- Learner state ----------------------------------------------------------

def test_learner_state_is_returned(app, client):
    """Confirm learned and review_later state appear in detail and browse."""
    create_grammar_data(app)
    with app.app_context():
        db = get_db()
        db.execute(
            "INSERT INTO user_learning_state "
            "(user_id, learning_unit_id, learned_at, review_later) "
            "VALUES (1, 1, 'test-learned-at', 1)"
        )
        db.commit()
    login_test_user(client)

    detail = client.get(LESSON_URL).get_json()["data"]
    assert detail["state"] == {"learned": True, "review_later": True}

    lesson = first_lesson(client)
    assert lesson["learned"] is True
    assert lesson["review_later"] is True


def test_learned_and_review_later_are_independent(app, client):
    """Confirm review_later can be set without marking the unit learned."""
    create_grammar_data(app)
    with app.app_context():
        db = get_db()
        db.execute(
            "INSERT INTO user_learning_state "
            "(user_id, learning_unit_id, learned_at, review_later) "
            "VALUES (1, 1, NULL, 1)"
        )
        db.commit()
    login_test_user(client)

    lesson = first_lesson(client)

    assert lesson["learned"] is False
    assert lesson["review_later"] is True


def test_state_of_another_learner_is_not_returned(app, client):
    """Confirm one learner never sees another learner's state."""
    create_grammar_data(app)
    with app.app_context():
        db = get_db()
        insert_user(db, 2, "vi")
        db.execute(
            "INSERT INTO user_learning_state "
            "(user_id, learning_unit_id, learned_at, review_later) "
            "VALUES (1, 1, 'test-learned-at', 1)"
        )
        db.commit()
    login_test_user(client, user_id=2)

    detail = client.get(LESSON_URL).get_json()["data"]
    lesson = first_lesson(client)

    assert detail["state"] == {"learned": False, "review_later": False}
    assert lesson["learned"] is False
    assert lesson["review_later"] is False


def test_get_lesson_does_not_set_last_opened_at(app, client):
    """Confirm reading a lesson creates no learning-state row."""
    create_grammar_data(app)
    login_test_user(client)

    response = client.get(LESSON_URL)

    assert response.status_code == 200
    with app.app_context():
        count = get_db().execute(
            "SELECT COUNT(*) FROM user_learning_state"
        ).fetchone()[0]
    assert count == 0
