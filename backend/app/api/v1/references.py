"""Member 5: reference content (API Contract §12)."""
from flask import Blueprint, g, jsonify

from ...auth_session import login_required
from ...services import reference_service

bp = Blueprint("references", __name__, url_prefix="/api/v1/references")


@bp.get("")
@login_required
def list_reference_pages():
    return jsonify({"data": reference_service.list_pages(g.current_user)})


@bp.get("/<slug>")
@login_required
def get_reference_page(slug):
    return jsonify({"data": reference_service.get_page(g.current_user, slug)})
