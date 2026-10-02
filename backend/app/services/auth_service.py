"""Registration and login business rules.

Owns duplicate detection and password hashing/verification; email normalization
happens earlier in validation and Flask session handling stays in auth_session.py,
keeping this service independent of the HTTP layer.
"""
from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from ..db import transaction
from ..errors import ApiError
from ..repositories import user_repository

MINIMUM_PASSWORD_LENGTH = 8


def _now_iso():
    """Backend-authoritative creation timestamp; never trust a client-supplied time."""
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def register(email, password):
    """Create one learner from an already normalized/validated email, raising
    ApiError(409) if it is registered. support_language starts NULL so the frontend
    routes the learner to first-time language setup.
    """
    if user_repository.exists_by_email(email):
        raise ApiError(409, "email_already_registered", "This email is already registered.")
    password_hash = generate_password_hash(password)
    with transaction():
        user_id = user_repository.create_user(email, password_hash, _now_iso())
    return {"id": user_id, "email": email, "support_language": None}


def authenticate(email, password):
    """Verify credentials for an already normalized email, raising ApiError(401)
    on failure. Unknown email and wrong password deliberately share one error so the
    API never reveals whether an account exists.
    """
    row = user_repository.get_user_by_email_for_authentication(email)
    if row is None or not check_password_hash(row["password_hash"], password):
        raise ApiError(401, "invalid_credentials", "Invalid email or password.")
    return {
        "id": row["id"],
        "email": row["email"],
        "support_language": row["support_language"],
    }
