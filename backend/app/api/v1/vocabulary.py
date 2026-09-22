"""Blueprint shell only. TODO: implement assigned contract endpoints with tests."""
from flask import Blueprint

# Member 4: Vocabulary browse/topic/study-unit.
bp = Blueprint("vocabulary", __name__, url_prefix="/api/v1/vocabulary")
