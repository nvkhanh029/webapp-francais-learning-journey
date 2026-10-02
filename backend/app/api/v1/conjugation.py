"""Conjugation browse and detail HTTP routes."""
from flask import Blueprint, g, jsonify

from ...auth_session import login_required
from ...services import conjugation_service

bp = Blueprint("conjugation", __name__, url_prefix="/api/v1/conjugation")


@bp.get("")
@login_required
def browse_conjugation():
    """Return the conjugation catalogue visible to the current learner."""
    return jsonify({"data": conjugation_service.list_conjugation(g.current_user)})


@bp.get("/lessons/<slug>")
@login_required
def get_conjugation_lesson(slug):
    """Return the conjugation lesson addressed by the given slug."""
    return jsonify({"data": conjugation_service.get_lesson(g.current_user, slug)})
