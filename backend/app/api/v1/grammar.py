"""Blueprint shell only. TODO: implement assigned contract endpoints with tests."""
from flask import Blueprint

# Member 3: Grammar browse/detail.
bp = Blueprint("grammar", __name__, url_prefix="/api/v1/grammar")
