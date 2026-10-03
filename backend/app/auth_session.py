"""Flask session mechanics only; authentication business rules live in auth_service.

Owner: Member 1 (Auth and User Preferences), per docs/repository-conventions.md
Section 8.3. The auth routes drive these helpers; nothing but the learner id is
ever stored in the session.
"""
from functools import wraps

from flask import current_app, g, request, session
from flask.sessions import SecureCookieSessionInterface

from .errors import ApiError
from .repositories.user_repository import get_user_by_id_for_session


class SecureAwareSessionInterface(SecureCookieSessionInterface):
    """Mark the session cookie Secure whenever the request arrived over HTTPS.

    SESSION_COOKIE_SECURE stays the explicit switch (e.g. behind a TLS proxy);
    HTTPS is detected on top of it so a deployment cannot forget the flag
    (API Contract 4.7).
    """

    def get_cookie_secure(self, app):
        return bool(app.config["SESSION_COOKIE_SECURE"]) or request.is_secure


STATE_CHANGING_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


def _csrf_failed():
    return ApiError(403, "csrf_failed", "Cross-site request rejected.")


def verify_same_origin():
    """CSRF protection for every state-changing request, in one shared place.

    Mechanism: the request must come from the origin the app is served from.
    Browsers attach `Sec-Fetch-Site` and `Origin` to such requests themselves and
    page scripts cannot forge them, so nothing is added to the request or
    response contract and the frontend sends no token.

    1. `Origin` listed in CSRF_TRUSTED_ORIGINS: allowed.
    2. `Sec-Fetch-Site` present: only `same-origin` (or `none`, a user-initiated
       request) is allowed; `same-site` and `cross-site` are rejected. This is
       also correct behind the Vite dev proxy, where the Host header can differ
       from the browser's origin.
    3. Otherwise `Origin` must equal the request's own origin; `Origin: null`
       is rejected.
    4. Neither header present: a non-browser client (curl, test client). It does
       not carry a victim's ambient cookie, so it is not a CSRF vector.

    `SameSite=Lax` and the JSON-only body parsing remain as further layers.
    """
    if request.method not in STATE_CHANGING_METHODS:
        return
    origin = request.headers.get("Origin")
    if origin is not None:
        trusted = {value.rstrip("/").lower() for value in current_app.config["CSRF_TRUSTED_ORIGINS"]}
        if origin.rstrip("/").lower() in trusted:
            return
    site = request.headers.get("Sec-Fetch-Site")
    if site is not None:
        if site.lower() in ("same-origin", "none"):
            return
        raise _csrf_failed()
    if origin is None:
        return
    if origin.rstrip("/").lower() == request.host_url.rstrip("/").lower():
        return
    raise _csrf_failed()


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
    # Permanent = the cookie carries an expiry and PERMANENT_SESSION_LIFETIME applies.
    session.permanent = True
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
    app.session_interface = SecureAwareSessionInterface()
    # CSRF is checked first so a rejected request never reaches any view.
    app.before_request(verify_same_origin)
    app.before_request(load_current_user)
