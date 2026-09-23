"""Blueprint shell only. TODO: implement assigned contract endpoints with tests."""
from flask import Blueprint

# Members 1-2: current user, preferences, dashboard, learner-owned state.
bp = Blueprint("me", __name__, url_prefix="/api/v1/me")
