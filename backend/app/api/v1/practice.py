from flask import Blueprint, jsonify, request

from ...auth_session import login_required
from ...errors import ApiError
from ...services import practice_service


# The Practice blueprint is rooted at /api/v1 because the frozen contract
# places Practice start and submit routes in different URL branches.
bp = Blueprint("practice", __name__, url_prefix="/api/v1")


@bp.post("/learning-units/<slug>/practice/start")
@login_required
def start_normal_practice(slug):
    return jsonify(
        {"data": practice_service.start_normal_practice(slug)}
    )


@bp.post("/mixed-practice/start")
@login_required
def start_mixed_practice():
    return jsonify(
        {"data": practice_service.start_mixed_practice()}
    )


@bp.post("/practice/runs/<practice_run_id>/submit")
@login_required
def submit_practice(practice_run_id):
    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        raise ApiError(400, "invalid_request", "JSON request body is required.")

    return jsonify(
        {
            "data": practice_service.submit_practice(
                practice_run_id,
                payload.get("answers"),
            )
        }
    )