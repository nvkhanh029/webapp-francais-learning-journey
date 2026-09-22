"""Blueprint shell only. TODO: implement assigned contract endpoints with tests."""
from flask import Blueprint

# Member 5: reference content.
bp = Blueprint("references", __name__, url_prefix="/api/v1/references")
