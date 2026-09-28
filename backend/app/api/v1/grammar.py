#"""Blueprint shell only. TODO: implement assigned contract endpoints with tests."""
#from flask import Blueprint

# Member 3: Grammar browse/detail.
#bp = Blueprint("grammar", __name__, url_prefix="/api/v1/grammar")

"""Grammar browse/detail API routes."""

from flask import Blueprint, g, jsonify

from ...auth_session import login_required
from ...services.grammar_service import get_grammar_browse, get_grammar_lesson

bp = Blueprint("grammar", __name__, url_prefix="/api/v1/grammar")


@bp.get("")
@login_required
def browse_grammar():
    return jsonify({"data": get_grammar_browse(g.current_user)})


@bp.get("/lessons/<slug>")
@login_required
def get_grammar_lesson_by_slug(slug):
    return jsonify({"data": get_grammar_lesson(g.current_user, slug)})
