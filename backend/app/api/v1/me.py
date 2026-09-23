"""Learner-owned routes. Auth-owned GET /me and PATCH /me/preferences are

Member 1's TODO (docs/repository-conventions.md Section 8.3) and are not
implemented here. Member 2 implements Dashboard and Learning State below
(Section 8.4). Routes stay thin: parse input, call a service, return the
contract envelope; business rules live in the services.
"""
from flask import Blueprint, g, jsonify

from ...auth_session import login_required
from ...errors import ApiError
from ...services import dashboard_service, learning_state_service
from ...validation import get_json_body, require_optional_boolean

# Members 1-2: current user, preferences, dashboard, learner-owned state.
bp = Blueprint("me", __name__, url_prefix="/api/v1/me")


@bp.get("/dashboard")
@login_required
def get_dashboard():
    return jsonify({"data": dashboard_service.get_dashboard(g.current_user)})


@bp.post("/learning-units/<slug>/open")
@login_required
def open_learning_unit(slug):
    result = learning_state_service.record_open(g.current_user["id"], slug)
    return jsonify({"data": result})


@bp.patch("/learning-units/<slug>/state")
@login_required
def update_learning_unit_state(slug):
    body = get_json_body()
    learned = require_optional_boolean(body, "learned")
    review_later = require_optional_boolean(body, "review_later")
    if learned is None and review_later is None:
        raise ApiError(
            422,
            "validation_error",
            "At least one of learned or review_later is required.",
            {
                "learned": "At least one of learned or review_later must be supplied.",
                "review_later": "At least one of learned or review_later must be supplied.",
            },
        )
    result = learning_state_service.update_state(
        g.current_user["id"], slug, learned=learned, review_later=review_later,
    )
    return jsonify({"data": result})


@bp.get("/review-later")
@login_required
def get_review_later():
    result = learning_state_service.get_review_later(
        g.current_user["id"], g.current_user["support_language"],
    )
    return jsonify({"data": result})
