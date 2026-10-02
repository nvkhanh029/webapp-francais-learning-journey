"""Registration, login and logout.

Owner: Member 1 (Auth and User Preferences), docs/api-contracts.md Section 6.
Routes stay thin: validate the request shape, call the service, establish or
clear the Flask session through auth_session, return the contract envelope.
"""
from flask import Blueprint, jsonify

from ...auth_session import end_user_session, start_user_session
from ...services import auth_service, user_service
from ...validation import get_json_body, normalize_email, require_string, validate_email

# Member 1: registration, login, logout.
bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


@bp.post("/register")
def register():
    body = get_json_body()
    # strip=False: a password is a credential and must never be silently altered.
    email = validate_email(body.get("email"))
    password = require_string(
        body, "password", min_length=auth_service.MINIMUM_PASSWORD_LENGTH, strip=False,
    )
    user = auth_service.register(email, password)
    start_user_session(user["id"])
    return jsonify({"data": {"user": user_service.current_user_model(user)}}), 201


@bp.post("/login")
def login():
    body = get_json_body()
    # Login only normalizes the email: a badly formatted value must fail as
    # invalid credentials, not as a validation error that hints at the format.
    email = normalize_email(require_string(body, "email"))
    password = require_string(body, "password", strip=False)
    user = auth_service.authenticate(email, password)
    start_user_session(user["id"])
    return jsonify({"data": {"user": user_service.current_user_model(user)}})


@bp.post("/logout")
def logout():
    # Idempotent by contract: no authenticated session is required.
    end_user_session()
    return jsonify({"data": {"logged_out": True}})
