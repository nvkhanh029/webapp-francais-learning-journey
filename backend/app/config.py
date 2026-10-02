from datetime import timedelta


class Config:
    """Safe non-secret application defaults for the local MVP."""

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    # Local HTTP development only. A request that arrives over HTTPS always gets
    # a Secure cookie regardless of this value (auth_session.SecureAwareSessionInterface);
    # set SESSION_COOKIE_SECURE=1 in the environment for a TLS-terminating proxy.
    SESSION_COOKIE_SECURE = False

    # API Contract 4.7: sessions expire. Flask signs the issue time into the
    # cookie and rejects it after this lifetime; each request refreshes it, so
    # this is an idle timeout.
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)

    # API Contract 4.7: login rate limiting. At most MAX_ATTEMPTS failed logins
    # per normalized email within WINDOW_SECONDS; the per-IP limit is a coarser
    # backstop against one client trying many emails.
    LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5
    LOGIN_RATE_LIMIT_MAX_ATTEMPTS_PER_IP = 20
    LOGIN_RATE_LIMIT_WINDOW_SECONDS = 300

    # CSRF: extra browser origins (scheme://host[:port]) allowed to make
    # state-changing requests, besides the origin the app itself is served from.
    CSRF_TRUSTED_ORIGINS = ()


def env_flag(name, environ):
    """True for 1/true/yes (any case); unset or anything else is False."""
    return environ.get(name, "").strip().lower() in ("1", "true", "yes")
