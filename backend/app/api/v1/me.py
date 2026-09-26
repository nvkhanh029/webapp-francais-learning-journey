"""Learner-owned routes shared by two feature streams.

GET /me and PATCH /me/preferences belong to Member 1 (Auth and User
Preferences). Dashboard and Learning State routes belong to Member 2
(docs/repository-conventions.md Sections 8.3 and 8.4) and are not implemented
in this file yet. Routes stay thin: parse input, call a service, return the
contract envelope; business rules live in the services.
"""
from flask import Blueprint, g, jsonify

from ...auth_session import login_required
from ...services import user_service
from ...validation import get_json_body, validate_support_language

# Members 1-2: current user, preferences, dashboard, learner-owned state.
bp = Blueprint("me", __name__, url_prefix="/api/v1/me")


# --- Member 1: current user and support-language preference -----------------

@bp.get("")
@login_required
def get_current_user():
    return jsonify({"data": {"user": user_service.current_user_model(g.current_user)}})


@bp.patch("/preferences")
@login_required
def update_preferences():
    body = get_json_body()
    support_language = validate_support_language(body.get("support_language"))
    result = user_service.update_support_language(g.current_user["id"], support_language)
    return jsonify({"data": result})
