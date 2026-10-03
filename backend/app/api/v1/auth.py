"""Registration, login and logout HTTP routes.

Routes stay thin: validate the request shape, call auth_service, drive the
session through auth_session, and return the contract envelope.
"""
from flask import Blueprint, jsonify, request

from ...auth_session import end_user_session, start_user_session
from ...services import auth_service, user_service
from ...validation import (
    get_json_body,
    normalize_email,
    require_string,
    validate_email,
    validate_fields,
)

bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


@bp.post("/register")
def register():
    """Create an account, start its session, and return the new user model."""
    body = get_json_body()
    # strip=False: a password is a credential and must never be silently altered.
    values = validate_fields({
        "email": lambda: validate_email(body.get("email")),
        "password": lambda: require_string(
            body, "password", min_length=auth_service.MINIMUM_PASSWORD_LENGTH, strip=False,
        ),
    })
    user = auth_service.register(values["email"], values["password"])
    start_user_session(user["id"])
    return jsonify({"data": {"user": user_service.current_user_model(user)}}), 201


@bp.post("/login")
def login():
    """Authenticate credentials, start the session, and return the user model."""
    body = get_json_body()
    # Login only normalizes the email: a badly formatted value must fail as
    # invalid credentials, not as a validation error that hints at the format.
    values = validate_fields({
        "email": lambda: normalize_email(require_string(body, "email")),
        "password": lambda: require_string(body, "password", strip=False),
    })
    user = auth_service.authenticate(values["email"], values["password"], request.remote_addr)
    start_user_session(user["id"])
    return jsonify({"data": {"user": user_service.current_user_model(user)}})


@bp.post("/logout")
def logout():
    """End the current session idempotently and report the logout result."""
    # Idempotent by contract: no authenticated session is required.
    end_user_session()
    return jsonify({"data": {"logged_out": True}})
