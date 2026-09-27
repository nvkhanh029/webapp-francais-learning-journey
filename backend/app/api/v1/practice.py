from flask import Blueprint, jsonify, request

from ...auth_session import login_required
from ...services import practice_service


bp = Blueprint("practice", __name__, url_prefix="/api/v1/practice")


@bp.post("/normal/<slug>/start")
@login_required
def start_normal_practice(slug):
    return jsonify(
        {"data": practice_service.start_normal_practice(slug)}
    )


@bp.post("/mixed/start")
@login_required
def start_mixed_practice():
    return jsonify(
        {"data": practice_service.start_mixed_practice()}
    )


@bp.post("/<run_id>/submit")
@login_required
def submit_practice(run_id):
    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        from ...errors import ApiError
        raise ApiError(400, "invalid_request", "JSON request body is required.")

    return jsonify(
        {
            "data": practice_service.submit_practice(
                run_id,
                payload.get("answers"),
            )
        }
    )


@bp.get("/history")
@login_required
def get_practice_history():
    return jsonify(
        {
            "data": practice_service.get_recent_history(
                request.args.get("limit", 10)
            )
        }
    )