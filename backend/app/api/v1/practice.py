"""Blueprint shell only. TODO: implement assigned contract endpoints with tests."""
from flask import Blueprint

# Member 6: normal Practice, Mixed Practice, submission.
bp = Blueprint("practice", __name__, url_prefix="/api/v1")
