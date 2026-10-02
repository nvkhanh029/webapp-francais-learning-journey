"""Flask session mechanics only; authentication business rules live in auth_service.

The auth routes drive these helpers; nothing but the learner id is ever stored
in the session.
"""
from functools import wraps

from flask import g, session

from .errors import ApiError
from .repositories.user_repository import get_user_by_id_for_session


def load_current_user():
    """Populate g.current_user from the session, clearing stale sessions."""
    g.current_user = None
    user_id = session.get("user_id")
    if user_id is None:
        return
    if type(user_id) is not int or user_id <= 0:
        session.clear()
        return
    g.current_user = get_user_by_id_for_session(user_id)
    if g.current_user is None:
        session.clear()


def start_user_session(user_id):
    """Store the validated learner id in the Flask session."""
    if type(user_id) is not int or user_id <= 0:
        raise ValueError("A positive integer user_id is required.")
    session.clear()
    session["user_id"] = user_id


def end_user_session():
    """Clear the current Flask session."""
    session.clear()


def login_required(view):
    """Decorate a view so it requires an authenticated current user."""
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        """Raise ApiError(401) unless g.current_user is set, then call the view."""
        if g.get("current_user") is None:
            raise ApiError(401, "not_authenticated", "Authentication is required.")
        return view(*args, **kwargs)
    return wrapped_view


def init_app(app):
    """Register the before-request hook that loads the current user."""
    app.before_request(load_current_user)
