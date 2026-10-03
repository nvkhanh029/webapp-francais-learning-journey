"""Session hardening required by API Contract 4.7 / Backend Structure 9.6.1.

Covers session expiry, the Secure cookie flag, CSRF protection and login rate
limiting. The CSRF mechanism is a same-origin check on state-changing requests
(see app/auth_session.verify_same_origin), so no test sends a token.
"""
import sqlite3
import time
from datetime import timedelta

import pytest

from app import create_app
from app.config import env_flag
from app.login_rate_limiter import InMemoryLoginRateLimiter

pytestmark = pytest.mark.flask

PASSWORD = "correct-horse-battery"
EMAIL = "learner@example.test"


def make_app(database_path, **config):
    return create_app({"TESTING": True, "DATABASE": str(database_path),
                       "SECRET_KEY": "test-only-not-a-runtime-secret", **config})


def register(client, email=EMAIL, **kwargs):
    return client.post("/api/v1/auth/register", json={"email": email, "password": PASSWORD}, **kwargs)


def login(client, email=EMAIL, password=PASSWORD, **kwargs):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password}, **kwargs)


def advance_time(monkeypatch, seconds):
    real = time.time
    monkeypatch.setattr(time, "time", lambda: real() + seconds)


# ---------------------------------------------------------------------------
# Session expiry
# ---------------------------------------------------------------------------

def test_login_issues_a_cookie_with_an_expiry(client):
    register(client)
    cookie = client.get_cookie("session")
    assert cookie is not None and cookie.expires is not None


def test_expired_session_returns_401_not_authenticated(app, client, monkeypatch):
    register(client)
    value = client.get_cookie("session").value
    fresh = app.test_client()
    fresh.set_cookie("session", value)
    assert fresh.get("/api/v1/me").status_code == 200

    advance_time(monkeypatch, 25 * 3600)  # default lifetime is 24 hours
    response = fresh.get("/api/v1/me")
    assert response.status_code == 401
    assert response.json["error"] == {
        "code": "not_authenticated", "message": "Authentication is required.", "details": {}}


def test_session_still_valid_inside_the_lifetime(app, client, monkeypatch):
    register(client)
    fresh = app.test_client()
    fresh.set_cookie("session", client.get_cookie("session").value)
    advance_time(monkeypatch, 23 * 3600)
    assert fresh.get("/api/v1/me").status_code == 200


def test_session_lifetime_is_configuration(database_path, monkeypatch):
    app = make_app(database_path, PERMANENT_SESSION_LIFETIME=timedelta(hours=1))
    client = app.test_client()
    register(client)
    fresh = app.test_client()
    fresh.set_cookie("session", client.get_cookie("session").value)
    advance_time(monkeypatch, 2 * 3600)
    assert fresh.get("/api/v1/me").status_code == 401


# ---------------------------------------------------------------------------
# Secure cookie
# ---------------------------------------------------------------------------

def _set_cookie(response):
    return response.headers["Set-Cookie"]


def test_cookie_is_not_secure_on_local_http(client):
    cookie = _set_cookie(register(client))
    assert "HttpOnly" in cookie and "SameSite=Lax" in cookie
    assert "Secure" not in cookie


def test_cookie_is_secure_when_served_over_https(client):
    cookie = _set_cookie(register(client, base_url="https://localhost"))
    assert "Secure" in cookie and "HttpOnly" in cookie and "SameSite=Lax" in cookie


def test_cookie_secure_flag_can_be_forced_by_configuration(database_path):
    client = make_app(database_path, SESSION_COOKIE_SECURE=True).test_client()
    assert "Secure" in _set_cookie(register(client))


@pytest.mark.parametrize("value, expected", [
    ("1", True), ("true", True), (" TRUE ", True), ("yes", True),
    ("0", False), ("false", False), ("", False), ("maybe", False),
])
def test_env_flag(value, expected):
    assert env_flag("SESSION_COOKIE_SECURE", {"SESSION_COOKIE_SECURE": value}) is expected


def test_env_flag_unset_is_false():
    assert env_flag("SESSION_COOKIE_SECURE", {}) is False


# ---------------------------------------------------------------------------
# CSRF: same-origin check on POST/PATCH (and any future PUT/DELETE)
# ---------------------------------------------------------------------------

def assert_csrf_rejected(response):
    assert response.status_code == 403
    assert response.json["error"] == {
        "code": "csrf_failed", "message": "Cross-site request rejected.", "details": {}}


@pytest.fixture
def signed_in(client):
    register(client)
    assert client.patch("/api/v1/me/preferences", json={"support_language": "en"}).status_code == 200
    return client


CROSS_SITE_HEADERS = [
    {"Origin": "https://evil.example"},
    {"Origin": "null"},
    {"Origin": "http://localhost:5173"},  # same host, different port = different origin
    {"Sec-Fetch-Site": "cross-site"},
    {"Sec-Fetch-Site": "same-site"},
    {"Sec-Fetch-Site": "cross-site", "Origin": "http://localhost"},
]


@pytest.mark.parametrize("headers", CROSS_SITE_HEADERS)
def test_cross_site_patch_is_rejected_and_changes_nothing(signed_in, headers):
    response = signed_in.patch("/api/v1/me/preferences", json={"support_language": "vi"}, headers=headers)
    assert_csrf_rejected(response)
    assert signed_in.get("/api/v1/me").json["data"]["user"]["support_language"] == "en"


@pytest.mark.parametrize("headers", CROSS_SITE_HEADERS)
def test_cross_site_logout_does_not_end_the_session(signed_in, headers):
    assert_csrf_rejected(signed_in.post("/api/v1/auth/logout", headers=headers))
    assert signed_in.get("/api/v1/me").status_code == 200


def test_cross_site_login_and_register_are_rejected(client, database_path):
    headers = {"Origin": "https://evil.example"}
    assert_csrf_rejected(register(client, headers=headers))
    with sqlite3.connect(database_path) as db:
        assert db.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0
    register(client)
    client.post("/api/v1/auth/logout")
    assert_csrf_rejected(login(client, headers=headers))
    assert client.get("/api/v1/me").status_code == 401


@pytest.mark.parametrize("headers", [
    {},  # non-browser client: no ambient cookie to abuse
    {"Origin": "http://localhost"},
    {"Origin": "HTTP://LOCALHOST/"},
    {"Sec-Fetch-Site": "same-origin"},
    {"Sec-Fetch-Site": "none"},
    {"Sec-Fetch-Site": "same-origin", "Origin": "http://localhost"},
])
def test_same_origin_requests_are_allowed(signed_in, headers):
    response = signed_in.patch("/api/v1/me/preferences", json={"support_language": "vi"}, headers=headers)
    assert response.status_code == 200


def test_https_origin_must_match_the_https_request(client):
    ok = register(client, base_url="https://localhost", headers={"Origin": "https://localhost"})
    assert ok.status_code == 201
    client.post("/api/v1/auth/logout")
    assert_csrf_rejected(login(client, base_url="https://localhost", headers={"Origin": "http://localhost"}))


def test_vite_style_dev_origin_is_allowed_when_the_host_is_preserved(client):
    # Browser origin http://localhost:5173 proxied with the Host header kept.
    response = register(client, base_url="http://localhost:5173", headers={"Origin": "http://localhost:5173"})
    assert response.status_code == 201


def test_trusted_origin_is_configuration(database_path):
    app = make_app(database_path, CSRF_TRUSTED_ORIGINS=("http://127.0.0.1:5173",))
    client = app.test_client()
    ok = register(client, headers={"Origin": "http://127.0.0.1:5173", "Sec-Fetch-Site": "same-site"})
    assert ok.status_code == 201
    assert_csrf_rejected(login(client, headers={"Origin": "https://evil.example"}))


def test_safe_methods_are_not_subject_to_the_origin_check(signed_in):
    response = signed_in.get("/api/v1/me", headers={"Origin": "https://evil.example",
                                                   "Sec-Fetch-Site": "cross-site"})
    assert response.status_code == 200


def test_csrf_rejection_precedes_validation_and_authentication(client):
    response = client.post("/api/v1/auth/login", data="not json",
                           headers={"Origin": "https://evil.example"})
    assert_csrf_rejected(response)


# ---------------------------------------------------------------------------
# Login rate limiting
# ---------------------------------------------------------------------------

@pytest.fixture
def registered(client):
    register(client)
    client.post("/api/v1/auth/logout")
    return client


def test_failed_logins_beyond_the_threshold_return_429(registered):
    for _ in range(5):
        response = login(registered, password="wrong-password")
        assert response.status_code == 401
        assert response.json["error"]["code"] == "invalid_credentials"
    blocked = login(registered, password="wrong-password")
    assert blocked.status_code == 429
    assert blocked.json == {"error": {
        "code": "rate_limited", "message": "Too many login attempts. Please try again later.",
        "details": {}}}
    assert 1 <= int(blocked.headers["Retry-After"]) <= 300


def test_blocked_email_cannot_log_in_even_with_the_right_password(registered):
    for _ in range(5):
        login(registered, password="wrong-password")
    assert login(registered).status_code == 429
    assert registered.get("/api/v1/me").status_code == 401


def test_unknown_email_is_limited_exactly_like_an_existing_one(registered):
    def sequence(email):
        outcomes = [login(registered, email=email, password="wrong-password") for _ in range(7)]
        return [(r.status_code, r.json["error"]["code"], r.json["error"]["details"]) for r in outcomes]

    assert sequence(EMAIL) == sequence("nobody@example.test")


def test_other_emails_are_not_blocked_by_one_blocked_email(registered):
    register(registered, email="second@example.test")
    registered.post("/api/v1/auth/logout")
    for _ in range(5):
        login(registered, password="wrong-password")
    assert login(registered).status_code == 429
    assert login(registered, email="second@example.test").status_code == 200


def test_successful_login_clears_the_email_counter(registered):
    for _ in range(4):
        login(registered, password="wrong-password")
    assert login(registered).status_code == 200
    registered.post("/api/v1/auth/logout")
    for _ in range(4):
        assert login(registered, password="wrong-password").status_code == 401


def test_request_validation_failures_are_not_counted(registered):
    for _ in range(10):
        assert registered.post("/api/v1/auth/login", json={"email": EMAIL}).status_code == 422
    assert login(registered).status_code == 200


def test_threshold_is_configuration(database_path):
    client = make_app(database_path, LOGIN_RATE_LIMIT_MAX_ATTEMPTS=2).test_client()
    register(client)
    client.post("/api/v1/auth/logout")
    assert [login(client, password="wrong-password").status_code for _ in range(3)] == [401, 401, 429]


def test_per_client_backstop_limits_many_emails_from_one_address(database_path):
    client = make_app(database_path, LOGIN_RATE_LIMIT_MAX_ATTEMPTS_PER_IP=3).test_client()
    codes = [login(client, email=f"user{i}@example.test", password="x-wrong-pw").status_code
             for i in range(5)]
    assert codes == [401, 401, 401, 429, 429]


def test_window_is_configuration_and_attempts_recover_after_it(database_path):
    now = [1000.0]
    app = make_app(database_path, LOGIN_RATE_LIMIT_MAX_ATTEMPTS=2, LOGIN_RATE_LIMIT_WINDOW_SECONDS=60)
    app.extensions["login_rate_limiter"] = InMemoryLoginRateLimiter(60, clock=lambda: now[0])
    client = app.test_client()
    register(client)
    client.post("/api/v1/auth/logout")
    login(client, password="wrong-password")
    login(client, password="wrong-password")
    blocked = login(client)
    assert blocked.status_code == 429 and int(blocked.headers["Retry-After"]) == 60
    now[0] += 61
    assert login(client).status_code == 200


def test_each_application_instance_has_its_own_limiter(database_path, tmp_path):
    first = make_app(database_path)
    second = make_app(database_path)
    assert first.extensions["login_rate_limiter"] is not second.extensions["login_rate_limiter"]


# ---------------------------------------------------------------------------
# InMemoryLoginRateLimiter unit behaviour
# ---------------------------------------------------------------------------

def test_limiter_counts_only_failures_inside_the_window():
    now = [0.0]
    limiter = InMemoryLoginRateLimiter(100, clock=lambda: now[0])
    limiter.record_failure("k")
    now[0] = 60
    limiter.record_failure("k")
    assert limiter.retry_after("k", 2) == 40  # oldest failure leaves the window at t=100
    now[0] = 101
    assert limiter.retry_after("k", 2) == 0


def test_limiter_checking_does_not_extend_the_block_and_reset_clears_it():
    now = [0.0]
    limiter = InMemoryLoginRateLimiter(100, clock=lambda: now[0])
    limiter.record_failure("k")
    limiter.record_failure("k")
    now[0] = 50
    for _ in range(5):
        assert limiter.retry_after("k", 2) == 50
    limiter.reset("k")
    assert limiter.retry_after("k", 2) == 0
    assert limiter.retry_after("never-seen", 1) == 0


def test_limiter_drops_expired_keys_to_bound_memory():
    now = [0.0]
    limiter = InMemoryLoginRateLimiter(10, clock=lambda: now[0])
    for index in range(1500):
        limiter.record_failure(f"k{index}")
    now[0] = 11
    limiter.record_failure("fresh")
    assert set(limiter._failures) == {"fresh"}
