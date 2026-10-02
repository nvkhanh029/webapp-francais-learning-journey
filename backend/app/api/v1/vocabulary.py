"""Vocabulary HTTP boundary (Member 4).

Thin routes for the contract in docs/api-contracts.md §10: read the path,
delegate to the service, and return the shared success envelope. Every endpoint
is session-authenticated; no SQL or business rules belong here.
"""
from flask import Blueprint, jsonify

from ...auth_session import login_required
from ...services import vocabulary_service

bp = Blueprint("vocabulary", __name__, url_prefix="/api/v1/vocabulary")


@bp.get("")
@login_required
def browse_vocabulary():
    """GET /api/v1/vocabulary -> categories with their topic metadata."""
    return jsonify({"data": vocabulary_service.browse_categories()})


@bp.get("/topics/<topic_slug>")
@login_required
def get_vocabulary_topic(topic_slug):
    """GET /api/v1/vocabulary/topics/{topic_slug} -> subtopics and study units."""
    return jsonify({"data": vocabulary_service.get_topic_detail(topic_slug)})


@bp.get("/study-units/<slug>")
@login_required
def get_vocabulary_study_unit(slug):
    """GET /api/v1/vocabulary/study-units/{slug} -> entries and learner state."""
    return jsonify({"data": vocabulary_service.get_study_unit_detail(slug)})
