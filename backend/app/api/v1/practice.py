from flask import Blueprint, jsonify, request
from ...errors import ApiError
from ...auth_session import login_required
from ...validation import get_json_body
from ...services import practice_service


bp = Blueprint("practice", __name__, url_prefix="/api/v1")


@bp.post("/learning-units/<slug>/practice/start")
@login_required
def start_normal_practice(slug):
    response = jsonify({"data": practice_service.start_normal_practice(slug)})
    response.status_code = 201
    return response


@bp.post("/mixed-practice/start")
@login_required
def start_mixed_practice():
    body = get_json_body() if request.data else {}

    if "filters" in body:
        raise ApiError(
            422,
            "invalid_mixed_filters",
            "Mixed Practice filters are not supported.",
        )

    response = jsonify({"data": practice_service.start_mixed_practice()})
    response.status_code = 201
    return response


@bp.post("/practice/runs/<practice_run_id>/submit")
@login_required
def submit_practice(practice_run_id):
    payload = get_json_body()
    return jsonify(
        {
            "data": practice_service.submit_practice(
                practice_run_id,
                payload.get("answers"),
            )
        }
    )