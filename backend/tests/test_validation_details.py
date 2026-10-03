"""validation_error `details.fields` carries the field-level codes of API Contract 4.4."""
import sqlite3

import pytest

from app.errors import ApiError
from app.validation import (
    field_error,
    validate_email,
    validate_fields,
    validate_support_language,
    require_boolean,
    require_string,
)
from tests.test_practice import _practice_setup, _start_normal, _submit

pytestmark = pytest.mark.flask

GOOD_PASSWORD = "long-enough-password"
FIELD_CODES = {"required", "invalid_type", "invalid_format", "invalid_value",
               "too_short", "future_month", "no_fields"}


def assert_fields(response, fields):
    assert response.status_code == 422
    error = response.json["error"]
    assert error["code"] == "validation_error"
    assert error["message"] == "One or more fields are invalid."
    assert error["details"] == {"fields": fields}
    assert set(error["details"]["fields"].values()) <= FIELD_CODES


def register(client, **body):
    return client.post("/api/v1/auth/register", json=body)


def login(client, **body):
    return client.post("/api/v1/auth/login", json=body)


# --- register ---------------------------------------------------------------

def test_register_reports_every_invalid_field_together(client):
    response = register(client, email="not-an-email", password="short")
    assert_fields(response, {"email": "invalid_format", "password": "too_short"})


@pytest.mark.parametrize("email", ["no-at-sign", "two@@example.test", "@example.test",
                                   "learner@", "spa ce@example.test"])
def test_register_email_format_code(client, email):
    assert_fields(register(client, email=email, password=GOOD_PASSWORD), {"email": "invalid_format"})


@pytest.mark.parametrize("body, fields", [
    ({}, {"email": "required", "password": "required"}),
    ({"email": None, "password": None}, {"email": "required", "password": "required"}),
    ({"email": "", "password": ""}, {"email": "required", "password": "required"}),
    ({"email": "   ", "password": GOOD_PASSWORD}, {"email": "required"}),
    ({"email": 5, "password": GOOD_PASSWORD}, {"email": "invalid_type"}),
    ({"email": "a@b.test", "password": 12345678}, {"password": "invalid_type"}),
    ({"email": "a@b.test", "password": "1234567"}, {"password": "too_short"}),
])
def test_register_required_type_and_length_codes(client, body, fields):
    assert_fields(register(client, **body), fields)


def test_register_codes_never_echo_submitted_values(client):
    secret_email, secret_password = "private person@example.test", "pw-12"
    response = register(client, email=secret_email, password=secret_password)
    text = response.get_data(as_text=True)
    assert secret_email not in text and secret_password not in text


# --- login ------------------------------------------------------------------

@pytest.mark.parametrize("body, fields", [
    ({}, {"email": "required", "password": "required"}),
    ({"email": "", "password": ""}, {"email": "required", "password": "required"}),
    ({"email": "a@b.test"}, {"password": "required"}),
    ({"email": 1, "password": []}, {"email": "invalid_type", "password": "invalid_type"}),
])
def test_login_field_codes(client, body, fields):
    assert_fields(login(client, **body), fields)


def test_login_badly_formatted_email_is_still_invalid_credentials(client):
    response = login(client, email="not-an-email", password="whatever")
    assert response.status_code == 401
    assert response.json["error"]["code"] == "invalid_credentials"


# --- preferences ------------------------------------------------------------

@pytest.fixture
def signed_in(client):
    register(client, email="learner@example.test", password=GOOD_PASSWORD)
    return client


@pytest.mark.parametrize("body, code", [
    ({}, "required"),
    ({"support_language": None}, "required"),
    ({"support_language": "fr"}, "invalid_value"),
    ({"support_language": ""}, "invalid_value"),
    ({"support_language": "VI"}, "invalid_value"),
    ({"support_language": 5}, "invalid_value"),
])
def test_preferences_field_codes(signed_in, body, code):
    response = signed_in.patch("/api/v1/me/preferences", json=body)
    assert_fields(response, {"support_language": code})


# --- learner state ----------------------------------------------------------

@pytest.fixture
def unit(database_path):
    with sqlite3.connect(database_path) as db:
        db.execute("INSERT INTO learning_units (id, unit_type, slug, title_fr) "
                   "VALUES (1, 'grammar', 'fixture-unit', 'Fixture')")


STATE_URL = "/api/v1/me/learning-units/fixture-unit/state"


def test_state_without_any_allowed_field_is_no_fields(signed_in, unit):
    response = signed_in.patch(STATE_URL, json={})
    assert_fields(response, {"learned": "no_fields", "review_later": "no_fields"})


def test_state_unrelated_fields_only_is_no_fields(signed_in, unit):
    response = signed_in.patch(STATE_URL, json={"something_else": True})
    assert_fields(response, {"learned": "no_fields", "review_later": "no_fields"})


@pytest.mark.parametrize("body, fields", [
    ({"learned": "yes"}, {"learned": "invalid_type"}),
    ({"review_later": 1}, {"review_later": "invalid_type"}),
    ({"learned": None}, {"learned": "required"}),
    ({"learned": "yes", "review_later": []}, {"learned": "invalid_type", "review_later": "invalid_type"}),
])
def test_state_boolean_field_codes(signed_in, unit, body, fields):
    assert_fields(signed_in.patch(STATE_URL, json=body), fields)


# --- practice submit --------------------------------------------------------

def submit(client, database_path, answers):
    _practice_setup(client, database_path)
    run = _start_normal(client)
    return _submit(client, run["practice_run_id"], answers)


@pytest.mark.parametrize("answers, fields", [
    (None, {"answers": "required"}),
    ({"1": {"item_id": 101}}, {"answers": "invalid_type"}),
    (["x"], {"answers[0]": "invalid_type"}),
    ([{"answer": {"item_id": 101}}], {"answers[0].question_id": "required"}),
    ([{"question_id": "1", "answer": {"item_id": 101}}], {"answers[0].question_id": "invalid_type"}),
    ([{"question_id": 0, "answer": {"item_id": 101}}], {"answers[0].question_id": "invalid_value"}),
    ([{"question_id": 1}], {"answers[0].answer": "required"}),
    ([{"question_id": 1, "answer": "le"}], {"answers[0].answer": "invalid_type"}),
    ([{"question_id": 1, "answer": {"item_id": 101}}, {"question_id": 1, "answer": {"item_id": 102}}],
     {"answers[1].question_id": "invalid_value"}),
])
def test_practice_answer_shape_codes(client, database_path, answers, fields):
    assert_fields(submit(client, database_path, answers), fields)


def full_answers(override):
    answers = {
        1: {"item_id": 101},
        2: {"text": "bonjour"},
        3: {"item_ids": [301, 302, 303]},
    }
    answers.update(override)
    return [{"question_id": qid, "answer": answer} for qid, answer in answers.items()]


@pytest.mark.parametrize("override, fields", [
    ({1: {}}, {"answers[1].item_id": "required"}),
    ({1: {"item_id": "101"}}, {"answers[1].item_id": "invalid_type"}),
    ({1: {"item_id": 201}}, {"answers[1].item_id": "invalid_value"}),
    ({1: {"item_id": 101, "extra": 1}}, {"answers[1]": "invalid_value"}),
    ({2: {}}, {"answers[2].text": "required"}),
    ({2: {"text": 123}}, {"answers[2].text": "invalid_type"}),
    ({2: {"text": "   "}}, {"answers[2].text": "required"}),
    ({3: {}}, {"answers[3].item_ids": "required"}),
    ({3: {"item_ids": "301"}}, {"answers[3].item_ids": "invalid_type"}),
    ({3: {"item_ids": [301, "302", 303]}}, {"answers[3].item_ids": "invalid_type"}),
    ({3: {"item_ids": [301, 302]}}, {"answers[3].item_ids": "invalid_value"}),
    ({3: {"item_ids": [301, 301, 303]}}, {"answers[3].item_ids": "invalid_value"}),
    ({3: {"item_ids": [301, 302, 999]}}, {"answers[3].item_ids": "invalid_value"}),
])
def test_practice_answer_content_codes(client, database_path, override, fields):
    assert_fields(submit(client, database_path, full_answers(override)), fields)
    with sqlite3.connect(database_path) as db:
        assert db.execute("SELECT COUNT(*) FROM practice_sessions").fetchone()[0] == 0


# --- helpers ----------------------------------------------------------------

def test_non_object_body_has_no_field_to_report(client):
    response = client.post("/api/v1/auth/login", data="[]", content_type="application/json")
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"
    assert response.json["error"]["details"] == {}


def test_malformed_json_is_still_400_invalid_json(client):
    response = client.post("/api/v1/auth/login", data="{", content_type="application/json")
    assert response.status_code == 400
    assert response.json["error"]["code"] == "invalid_json"


def test_validate_fields_returns_values_when_valid():
    body = {"email": " A@B.test ", "password": "abcdefgh"}
    assert validate_fields({
        "email": lambda: validate_email(body["email"]),
        "password": lambda: require_string(body, "password", min_length=8, strip=False),
    }) == {"email": "a@b.test", "password": "abcdefgh"}


def test_validate_fields_lets_non_validation_errors_through():
    def explode():
        raise ApiError(409, "email_already_registered", "dup")
    with pytest.raises(ApiError) as error:
        validate_fields({"email": explode})
    assert error.value.code == "email_already_registered"


@pytest.mark.parametrize("call, code", [
    (lambda: validate_support_language(None), "required"),
    (lambda: validate_support_language("fr"), "invalid_value"),
    (lambda: validate_email(None), "required"),
    (lambda: validate_email(3), "invalid_type"),
    (lambda: validate_email("x"), "invalid_format"),
    (lambda: require_boolean({}, "flag"), "required"),
    (lambda: require_boolean({"flag": "true"}, "flag"), "invalid_type"),
    (lambda: field_error("anything", "too_short"), "too_short"),
])
def test_helpers_raise_the_documented_codes(call, code):
    with pytest.raises(ApiError) as error:
        call()
    assert error.value.status == 422
    assert list(error.value.details["fields"].values()) == [code]
