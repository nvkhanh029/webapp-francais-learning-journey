"""Blueprint shell only. TODO: implement assigned contract endpoints with tests."""
from flask import Blueprint

# Member 5: Conjugation browse/detail.
bp = Blueprint("conjugation", __name__, url_prefix="/api/v1/conjugation")
