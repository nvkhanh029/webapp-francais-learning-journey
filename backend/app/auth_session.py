"""Session mechanics only. Register/login/logout endpoints remain Member 1 tasks."""
from functools import wraps

from flask import g, session

from .errors import ApiError
from .repositories.user_repository import get_user_by_id_for_session


def load_current_user():
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
    if type(user_id) is not int or user_id <= 0:
        raise ValueError("A positive integer user_id is required.")
    session.clear()
    session["user_id"] = user_id


def end_user_session():
    session.clear()


def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if g.get("current_user") is None:
            raise ApiError(401, "not_authenticated", "Authentication is required.")
        return view(*args, **kwargs)
    return wrapped_view


def init_app(app):
    app.before_request(load_current_user)
