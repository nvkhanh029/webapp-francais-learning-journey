"""Small request-input helpers. Services still enforce business rules."""
from .errors import ApiError

SUPPORTED_LANGUAGES = {"vi", "en"}


def _invalid(field, message):
    raise ApiError(422, "validation_error", "Request fields are invalid.", {field: message})


def get_json_body():
    from flask import request
    from werkzeug.exceptions import BadRequest

    # Use the existing 400 invalid_json request-error family; no HTML 415 leaks.
    if not request.is_json:
        raise ApiError(400, "invalid_json", "Content-Type must be application/json.")
    try:
        body = request.get_json(silent=False)
    except BadRequest as exc:
        raise ApiError(400, "invalid_json", "Request body must contain valid JSON.") from exc
    if not isinstance(body, dict):
        raise ApiError(422, "validation_error", "Request body must be a JSON object.")
    return body


def require_string(body, field, *, min_length=1, strip=True):
    """Use strip=False for passwords: never silently alter a credential."""
    value = body.get(field)
    if not isinstance(value, str):
        _invalid(field, "Must be a string.")
    result = value.strip() if strip else value
    if len(result) < min_length:
        _invalid(field, f"Must contain at least {min_length} character(s).")
    return result


def require_boolean(body, field):
    value = body.get(field)
    if not isinstance(value, bool):
        _invalid(field, "Must be a boolean.")
    return value


def require_optional_boolean(body, field):
    """Return None when the field is absent; otherwise validate it as a boolean.

    Used by partial-update contracts (e.g. PATCH learning-unit state) where a
    field is only validated/applied when the caller actually supplied it.
    """
    if field not in body:
        return None
    return require_boolean(body, field)


def normalize_email(value):
    if not isinstance(value, str):
        _invalid("email", "Must be a string.")
    return value.strip().lower()


def validate_email(value):
    email = normalize_email(value)
    if any(character.isspace() for character in email) or email.count("@") != 1:
        _invalid("email", "Invalid email.")
    local, domain = email.split("@", 1)
    if not local or not domain:
        _invalid("email", "Invalid email.")
    return email


def validate_support_language(value):
    if not isinstance(value, str) or value not in SUPPORTED_LANGUAGES:
        _invalid("support_language", "Must be 'vi' or 'en'.")
    return value
