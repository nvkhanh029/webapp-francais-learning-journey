"""Test-only routes exercise shared HTTP/session helpers, not project features."""
import sqlite3

import pytest

pytestmark = pytest.mark.flask


def add_test_routes(app):
    from flask import g, jsonify
    from app.auth_session import login_required, start_user_session, end_user_session
    from app.validation import get_json_body, validate_support_language

    @app.post("/__foundation_test/json")
    def json_input():
        body = get_json_body()
        return jsonify({"data": {"support_language":validate_support_language(body.get("support_language"))}})

    @app.get("/__foundation_test/protected")
    @login_required
    def protected():
        return jsonify({"data":{"email":g.current_user["email"]}})

    @app.post("/__foundation_test/start")
    def start():
        start_user_session(1)
        return jsonify({"data":None})

    @app.post("/__foundation_test/end")
    def end():
        end_user_session()
        return jsonify({"data":None})

    @app.get("/__foundation_test/failure")
    def failure():
        raise RuntimeError("INTERNAL-SQL-PATH-DETAIL")


@pytest.fixture
def http_client(app):
    add_test_routes(app)
    app.config["PROPAGATE_EXCEPTIONS"] = False
    return app.test_client()


def test_valid_json(http_client):
    response=http_client.post("/__foundation_test/json",json={"support_language":"en"})
    assert response.status_code == 200
    assert response.json == {"data":{"support_language":"en"}}


@pytest.mark.parametrize("body,content_type", [('{broken','application/json'),('{"support_language":"vi"}','text/plain'),('x',None),('', 'application/json')])
def test_bad_body_or_content_type_is_json_400(http_client,body,content_type):
    response=http_client.post("/__foundation_test/json",data=body,content_type=content_type)
    assert response.status_code == 400
    assert response.json["error"]["code"] == "invalid_json"


@pytest.mark.parametrize("value",[[],{},None,True,12,"fr"])
def test_invalid_language_http_error_not_500(http_client,value):
    response=http_client.post("/__foundation_test/json",json={"support_language":value})
    assert response.status_code == 422
    assert response.json["error"]["code"] == "validation_error"


@pytest.mark.parametrize("body",['[]','null','"text"','1'])
def test_parsed_non_object_json_is_422(http_client,body):
    response=http_client.post("/__foundation_test/json",data=body,content_type='application/json')
    assert response.status_code == 422
    assert response.json["error"]["details"] == {}


def test_framework_errors_use_json_and_preserve_allow(http_client):
    missing=http_client.get("/__foundation_test/no-such-route")
    assert missing.status_code==404 and missing.json["error"]["code"]=="not_found"
    method=http_client.get("/__foundation_test/json")
    assert method.status_code==405 and method.json["error"]["code"]=="method_not_allowed"
    assert "POST" in method.headers["Allow"]


def test_unexpected_failure_has_no_internals(http_client):
    response=http_client.get("/__foundation_test/failure")
    assert response.status_code==500
    assert response.json["error"]["code"]=="internal_error"
    assert "INTERNAL-SQL-PATH-DETAIL" not in response.get_data(as_text=True)


def test_no_session_gets_json_401(http_client):
    response=http_client.get("/__foundation_test/protected")
    assert response.status_code==401
    assert response.json["error"]["code"]=="not_authenticated"


def test_session_safe_lookup_and_cookie_flow(http_client,app,database_path):
    with sqlite3.connect(database_path) as db:
        db.execute("INSERT INTO users(id,email,password_hash,created_at) VALUES(1,'fixture@example.test','test-only-hash','test')")
    with http_client.session_transaction() as session:
        session["unrelated_old_state"] = True
    start=http_client.post("/__foundation_test/start")
    cookie=start.headers["Set-Cookie"]
    assert "HttpOnly" in cookie and "SameSite=Lax" in cookie
    with http_client.session_transaction() as session:
        assert dict(session)=={"user_id":1}
    response=http_client.get("/__foundation_test/protected")
    assert response.status_code==200
    assert response.json=={"data":{"email":"fixture@example.test"}}
    from app.repositories.user_repository import get_user_by_id_for_session
    with app.app_context():
        assert "password_hash" not in get_user_by_id_for_session(1).keys()
    assert http_client.post("/__foundation_test/end").status_code==200
    assert http_client.post("/__foundation_test/end").status_code==200
    assert http_client.get("/__foundation_test/protected").status_code==401


@pytest.mark.parametrize("user_id",[999,"1",True,[],{}])
def test_stale_or_bad_identity_clears_session(http_client,user_id):
    with http_client.session_transaction() as session:
        session["user_id"]=user_id
    response=http_client.get("/__foundation_test/protected")
    assert response.status_code==401
    with http_client.session_transaction() as session:
        assert "user_id" not in session


def test_debug_mode_does_not_expose_api_tracebacks(http_client,app):
    app.config["DEBUG"] = True
    response = http_client.get("/__foundation_test/failure")
    assert response.status_code == 500
    assert response.json["error"]["code"] == "internal_error"
    assert "INTERNAL-SQL-PATH-DETAIL" not in response.get_data(as_text=True)
