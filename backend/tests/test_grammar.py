from app.db import get_db


def create_grammar_data(app):
    with app.app_context():
        db = get_db()

        db.execute("""
            INSERT INTO users
            (id, email, password_hash, support_language, created_at)
            VALUES
            (1, 'test@example.com', 'test', 'vi', '2026-01-01')
        """)

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


def login_test_user(client):
    with client.session_transaction() as session:
        session["user_id"] = 1


def test_grammar_requires_login(client):
    response = client.get("/api/v1/grammar")

    assert response.status_code == 401


def test_grammar_browse(app, client):
    create_grammar_data(app)
    login_test_user(client)

    response = client.get("/api/v1/grammar")

    assert response.status_code == 200

    data = response.get_json()["data"]

    assert data["parts"][0]["title"] == "Cụm danh từ"

    chapter = data["parts"][0]["chapters"][0]

    assert chapter["title"] == "Từ hạn định"

    lesson = chapter["lessons"][0]

    assert lesson["slug"] == "articles-definis"
    assert lesson["title"] == "Mạo từ xác định"
    assert lesson["learned"] is False
    assert lesson["review_later"] is False


def test_grammar_lesson_detail(app, client):
    create_grammar_data(app)
    login_test_user(client)

    response = client.get(
        "/api/v1/grammar/lessons/articles-definis"
    )

    assert response.status_code == 200

    data = response.get_json()["data"]

    assert data["slug"] == "articles-definis"
    assert data["title"] == "Mạo từ xác định"
    assert data["content"] == "Nội dung tiếng Việt."

    assert data["state"]["learned"] is False
    assert data["state"]["review_later"] is False


def test_grammar_english(app, client):
    create_grammar_data(app)

    with app.app_context():
        db = get_db()

        db.execute("""
            UPDATE users
            SET support_language = 'en'
            WHERE id = 1
        """)

        db.commit()

    login_test_user(client)

    response = client.get("/api/v1/grammar")

    assert response.status_code == 200

    data = response.get_json()["data"]

    assert data["parts"][0]["title"] == "Noun Phrase"

    chapter = data["parts"][0]["chapters"][0]

    assert chapter["title"] == "Determiners"

    lesson = chapter["lessons"][0]

    assert lesson["title"] == "Definite Articles"


def test_grammar_lesson_english(app, client):
    create_grammar_data(app)

    with app.app_context():
        db = get_db()

        db.execute("""
            UPDATE users
            SET support_language = 'en'
            WHERE id = 1
        """)

        db.commit()

    login_test_user(client)

    response = client.get(
        "/api/v1/grammar/lessons/articles-definis"
    )

    assert response.status_code == 200

    data = response.get_json()["data"]

    assert data["title"] == "Definite Articles"
    assert data["content"] == "English content."

    assert data["context"]["part"]["title"] == "Noun Phrase"
    assert data["context"]["chapter"]["title"] == "Determiners"


def test_grammar_lesson_not_found(app, client):
    create_grammar_data(app)
    login_test_user(client)

    response = client.get(
        "/api/v1/grammar/lessons/not-exist"
    )

    assert response.status_code == 404

    body = response.get_json()

    assert body["error"]["code"] == "learning_unit_not_found"