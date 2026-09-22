"""Blueprint shell only. TODO: implement assigned contract endpoints with tests."""
from flask import Blueprint

# Member 1: registration, login, logout.
bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")
