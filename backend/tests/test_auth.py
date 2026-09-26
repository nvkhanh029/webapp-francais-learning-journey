"""Auth and User Preferences: docs/api-contracts.md Sections 6 and 7,
docs/requirements-and-analysis.md Sections 5.1 and 5.2, and Backend Structure
Section 15.5.

Failure paths assert both the HTTP status and the contract error code, never
only the human-readable message (Backend Structure Section 15.10).
"""
import sqlite3

import pytest

pytestmark = pytest.mark.flask

REGISTRATION = {"email": "learner@example.test", "password": "correct-horse"}


def _register(client, **overrides):
    return client.post("/api/v1/auth/register", json={**REGISTRATION, **overrides})


def _read_user(database_path, email):
    with sqlite3.connect(database_path) as db:
        return db.execute(
            """
            SELECT id, email, password_hash, support_language
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()


# --- Registration -----------------------------------------------------------

def test_register_creates_account_with_unset_support_language(client):
    response = _register(client)
    assert response.status_code == 201
    assert response.json["data"] == {
        "user": {"email": "learner@example.test", "support_language": None},
    }


def test_register_signs_the_learner_in_automatically(client):
    _register(client)
    response = client.get("/api/v1/me")
    assert response.status_code == 200
    assert response.json["data"]["user"]["email"] == "learner@example.test"


def test_register_stores_a_hashed_password(client, database_path):
    _register(client)
    row = _read_user(database_path, "learner@example.test")
    assert row is not None
    assert row[2] != REGISTRATION["password"]
    assert REGISTRATION["password"] not in row[2]


def test_register_normalizes_email_before_storing(client, database_path):
    response = _register(client, email="  LEARNER@Example.TEST  ")
    assert response.status_code == 201
    assert response.json["data"]["user"]["email"] == "learner@example.test"
    assert _read_user(database_path, "learner@example.test") is not None


def test_register_rejects_duplicate_normalized_email(client):
    _register(client)
    response = _register(client, email="LEARNER@example.test")
    assert response.status_code == 409
    assert response.json["error"]["code"] == "email_already_registered"


def test_register_rejects_short_password(client):
    response = _register(client, password="1234567")
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"


@pytest.mark.parametrize("email", ["", "   ", "no-at-sign", "two@@example.test",
                                   "@example.test", "learner@", "spa ce@example.test"])
def test_register_rejects_invalid_email(client, email):
    response = _register(client, email=email)
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"


def test_register_rejects_missing_fields(client):
    response = client.post("/api/v1/auth/register", json={})
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"


def test_register_rejects_malformed_json(client):
    response = client.post(
        "/api/v1/auth/register", data="not json", content_type="application/json",
    )
    assert response.status_code == 400
    assert response.json["error"]["code"] == "invalid_json"


def test_register_never_exposes_the_password_hash(client):
    response = _register(client)
    assert "password" not in response.get_data(as_text=True)
    assert "password_hash" not in response.get_data(as_text=True)


# --- Login ------------------------------------------------------------------

def test_login_returns_the_user_and_starts_a_session(client):
    _register(client)
    client.post("/api/v1/auth/logout")

    response = client.post("/api/v1/auth/login", json=REGISTRATION)

    assert response.status_code == 200
    assert response.json["data"] == {
        "user": {"email": "learner@example.test", "support_language": None},
    }
    assert client.get("/api/v1/me").status_code == 200


def test_login_normalizes_the_email(client):
    _register(client)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "  LEARNER@Example.TEST  ", "password": REGISTRATION["password"]},
    )
    assert response.status_code == 200


def test_login_restores_a_saved_support_language(client):
    _register(client)
    client.patch("/api/v1/me/preferences", json={"support_language": "en"})
    client.post("/api/v1/auth/logout")

    response = client.post("/api/v1/auth/login", json=REGISTRATION)

    assert response.json["data"]["user"]["support_language"] == "en"


def test_login_with_wrong_password_is_generic_401(client):
    _register(client)
    response = client.post(
        "/api/v1/auth/login",
        json={"email": REGISTRATION["email"], "password": "wrong-password"},
    )
    assert response.status_code == 401
    assert response.json["error"]["code"] == "invalid_credentials"


def test_login_with_unknown_email_uses_the_same_generic_error(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.test", "password": REGISTRATION["password"]},
    )
    assert response.status_code == 401
    assert response.json["error"]["code"] == "invalid_credentials"


def test_login_requires_non_empty_credentials(client):
    response = client.post("/api/v1/auth/login", json={"email": "", "password": ""})
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"


def test_failed_login_does_not_create_a_session(client):
    _register(client)
    client.post("/api/v1/auth/logout")
    client.post(
        "/api/v1/auth/login",
        json={"email": REGISTRATION["email"], "password": "wrong-password"},
    )
    assert client.get("/api/v1/me").status_code == 401


# --- Logout -----------------------------------------------------------------

def test_logout_clears_the_session(client):
    _register(client)
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert response.json["data"] == {"logged_out": True}
    assert client.get("/api/v1/me").status_code == 401


def test_logout_is_idempotent_without_a_session(client):
    first = client.post("/api/v1/auth/logout")
    second = client.post("/api/v1/auth/logout")
    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json["data"] == {"logged_out": True}


# --- Current user -----------------------------------------------------------

def test_current_user_requires_authentication(client):
    response = client.get("/api/v1/me")
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


def test_current_user_exposes_only_the_contract_fields(client):
    _register(client)
    response = client.get("/api/v1/me")
    assert response.json["data"]["user"] == {
        "email": "learner@example.test", "support_language": None,
    }


def test_session_for_a_deleted_user_is_rejected(client, database_path):
    _register(client)
    with sqlite3.connect(database_path) as db:
        db.execute("DELETE FROM users WHERE email = ?", ("learner@example.test",))
    response = client.get("/api/v1/me")
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


# --- Support-language preference --------------------------------------------

@pytest.mark.parametrize("language", ["vi", "en"])
def test_preferences_persist_the_selected_language(client, database_path, language):
    _register(client)

    response = client.patch("/api/v1/me/preferences", json={"support_language": language})

    assert response.status_code == 200
    assert response.json["data"] == {"support_language": language}
    assert _read_user(database_path, "learner@example.test")[3] == language
    assert client.get("/api/v1/me").json["data"]["user"]["support_language"] == language


def test_preferences_can_be_changed_again(client):
    _register(client)
    client.patch("/api/v1/me/preferences", json={"support_language": "vi"})
    response = client.patch("/api/v1/me/preferences", json={"support_language": "en"})
    assert response.json["data"] == {"support_language": "en"}


@pytest.mark.parametrize("value", ["fr", "", "VI", None, 1, True])
def test_preferences_reject_unsupported_values(client, value):
    _register(client)
    response = client.patch("/api/v1/me/preferences", json={"support_language": value})
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"


def test_preferences_reject_a_missing_field(client):
    _register(client)
    response = client.patch("/api/v1/me/preferences", json={})
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"


def test_preferences_require_authentication(client):
    response = client.patch("/api/v1/me/preferences", json={"support_language": "vi"})
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


def test_changing_language_preserves_learner_state(client, database_path):
    """FR-LANG-06: switching support language must not reset learner state."""
    _register(client)
    user_id = _read_user(database_path, "learner@example.test")[0]
    with sqlite3.connect(database_path) as db:
        db.execute(
            """
            INSERT INTO learning_units (id, unit_type, slug, title_fr)
            VALUES (1, 'grammar', 'articles-definis', 'Fixture FR')
            """
        )
        db.execute(
            """
            INSERT INTO user_learning_state
                (user_id, learning_unit_id, learned_at, review_later, last_opened_at)
            VALUES (?, 1, 'test-learned-at', 1, 'test-opened-at')
            """,
            (user_id,),
        )
        db.execute(
            """
            INSERT INTO practice_sessions
                (user_id, practice_type, learning_unit_id,
                 completed_at, activity_date, correct_count, total_questions)
            VALUES (?, 'normal', 1, 'test-completed-at', '2026-01-10', 8, 10)
            """,
            (user_id,),
        )

    client.patch("/api/v1/me/preferences", json={"support_language": "en"})

    with sqlite3.connect(database_path) as db:
        state = db.execute(
            """
            SELECT learned_at, review_later, last_opened_at
            FROM user_learning_state
            WHERE user_id = ? AND learning_unit_id = 1
            """,
            (user_id,),
        ).fetchone()
        sessions = db.execute(
            """
            SELECT COUNT(*)
            FROM practice_sessions
            WHERE user_id = ?
            """,
            (user_id,),
        ).fetchone()[0]
    assert state == ("test-learned-at", 1, "test-opened-at")
    assert sessions == 1


# --- Learner isolation ------------------------------------------------------

def test_one_learner_cannot_change_another_learners_preference(client, database_path):
    _register(client)
    _register(client, email="other@example.test")
    # The second registration replaced the session; it must only affect that account.
    client.patch("/api/v1/me/preferences", json={"support_language": "en"})

    assert _read_user(database_path, "learner@example.test")[3] is None
    assert _read_user(database_path, "other@example.test")[3] == "en"
