"""Registration and login business rules.

Owner: Member 1 (Auth and User Preferences). Follows docs/api-contracts.md
Section 6 and docs/repository-conventions.md Section 8.3. Email normalization
happens in validation before this service is reached; duplicate detection,
password hashing and password verification belong here.

Flask session creation and clearing stay in auth_session.py and are driven by
the route (Backend Structure Section 7.2), so this service stays independent
of the HTTP layer.
"""
from flask import current_app
from werkzeug.security import check_password_hash, generate_password_hash

from .. import clock
from ..db import transaction
from ..errors import ApiError
from ..repositories import user_repository

MINIMUM_PASSWORD_LENGTH = 8


def _now_iso():
    """Backend-authoritative creation timestamp; never trust a client-supplied time."""
    return clock.now().isoformat(timespec="seconds")


def register(email, password):
    """Create one learner account from an already normalized/validated email.

    The account starts with support_language = NULL so the frontend routes the
    learner to first-time language setup (FR-LANG-02).
    """
    if user_repository.exists_by_email(email):
        raise ApiError(409, "email_already_registered", "This email is already registered.")
    password_hash = generate_password_hash(password)
    with transaction():
        user_id = user_repository.create_user(email, password_hash, _now_iso())
    return {"id": user_id, "email": email, "support_language": None}


def _rate_limit_keys(email, client_address):
    config = current_app.config
    return (
        (f"email:{email}", config["LOGIN_RATE_LIMIT_MAX_ATTEMPTS"]),
        (f"ip:{client_address}", config["LOGIN_RATE_LIMIT_MAX_ATTEMPTS_PER_IP"]),
    )


def authenticate(email, password, client_address=None):
    """Verify credentials for an already normalized email.

    Unknown email and wrong password deliberately produce the same error so the
    API does not reveal whether an account exists (API Contract Section 6.2).

    Failed attempts are rate limited per email and per client address (API
    Contract Section 4.7). The check happens before the password is verified and
    never consults the database, so an existing and an unknown email behave
    identically; a blocked attempt is not counted again.
    """
    limiter = current_app.extensions["login_rate_limiter"]
    keys = _rate_limit_keys(email, client_address)
    retry_after = max(limiter.retry_after(key, limit) for key, limit in keys)
    if retry_after:
        raise ApiError(
            429, "rate_limited", "Too many login attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )
    row = user_repository.get_user_by_email_for_authentication(email)
    if row is None or not check_password_hash(row["password_hash"], password):
        for key, _limit in keys:
            limiter.record_failure(key)
        raise ApiError(401, "invalid_credentials", "Invalid email or password.")
    limiter.reset(keys[0][0])
    return {
        "id": row["id"],
        "email": row["email"],
        "support_language": row["support_language"],
    }
