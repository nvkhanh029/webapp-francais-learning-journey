"""Registration and login business rules.

Owner: Member 1 (Auth and User Preferences). Follows docs/api-contracts.md
Section 6 and docs/repository-conventions.md Section 8.3. Email normalization
happens in validation before this service is reached; duplicate detection,
password hashing and password verification belong here.

Flask session creation and clearing stay in auth_session.py and are driven by
the route (Backend Structure Section 7.2), so this service stays independent
of the HTTP layer.
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


def authenticate(email, password):
    """Verify credentials for an already normalized email.

    Unknown email and wrong password deliberately produce the same error so the
    API does not reveal whether an account exists (API Contract Section 6.2).
    """
    row = user_repository.get_user_by_email_for_authentication(email)
    if row is None or not check_password_hash(row["password_hash"], password):
        raise ApiError(401, "invalid_credentials", "Invalid email or password.")
    return {
        "id": row["id"],
        "email": row["email"],
        "support_language": row["support_language"],
    }
