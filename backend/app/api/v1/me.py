"""Learner-owned routes: current user, preferences, dashboard, learning state.

Routes stay thin: parse input, call the owning service, return the contract
envelope; business rules live in the services.
"""

from flask import Blueprint, g, jsonify, request

from ...auth_session import login_required
from ...services import dashboard_service, learning_state_service, user_service
from ...validation import (
    NO_FIELDS,
    field_errors,
    get_json_body,
    require_optional_boolean,
    require_query_integer,
    validate_fields,
    validate_support_language,
)

bp = Blueprint("me", __name__, url_prefix="/api/v1/me")


# Current user and support-language preference.

@bp.get("")
@login_required
def get_current_user():
    """Return the authenticated learner's user model."""
    return jsonify({"data": {"user": user_service.current_user_model(g.current_user)}})


@bp.patch("/preferences")
@login_required
def update_preferences():
    """Validate and persist the learner's support-language preference."""
    body = get_json_body()
    support_language = validate_support_language(body.get("support_language"))
    result = user_service.update_support_language(
        g.current_user["id"],
        support_language,
    )
    return jsonify({"data": result})


# Dashboard and learning state.

@bp.get("/dashboard")
@login_required
def get_dashboard():
    """Return the learner's dashboard summary."""
    return jsonify({"data": dashboard_service.get_dashboard(g.current_user)})


@bp.get("/activity-calendar")
@login_required
def get_activity_calendar():
    values = validate_fields({
        "year": lambda: require_query_integer(request.args, "year", minimum=1000, maximum=9999),
        "month": lambda: require_query_integer(request.args, "month", minimum=1, maximum=12),
    })
    result = dashboard_service.get_activity_calendar(g.current_user, values["year"], values["month"])
    return jsonify({"data": result})


@bp.post("/learning-units/<slug>/open")
@login_required
def open_learning_unit(slug):
    """Record that the learner opened the addressed learning unit."""
    result = learning_state_service.record_open(g.current_user["id"], slug)
    return jsonify({"data": result})


@bp.patch("/learning-units/<slug>/state")
@login_required
def update_learning_unit_state(slug):
    """Patch the learner's learned/review-later state for a learning unit."""
    body = get_json_body()
    values = validate_fields({
        "learned": lambda: require_optional_boolean(body, "learned"),
        "review_later": lambda: require_optional_boolean(body, "review_later"),
    })
    learned, review_later = values["learned"], values["review_later"]

    if learned is None and review_later is None:
        # No single field is at fault, so every allowed field carries the code.
        field_errors({"learned": NO_FIELDS, "review_later": NO_FIELDS})

    result = learning_state_service.update_state(
        g.current_user["id"],
        slug,
        learned=learned,
        review_later=review_later,
    )
    return jsonify({"data": result})


@bp.get("/review-later")
@login_required
def get_review_later():
    """Return the learner's review-later items in their support language."""
    result = learning_state_service.get_review_later(
        g.current_user["id"],
        g.current_user["support_language"],
    )
    return jsonify({"data": result})