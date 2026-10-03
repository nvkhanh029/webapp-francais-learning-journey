"""Small request-input helpers. Services still enforce business rules."""
import re

from .errors import ApiError

SUPPORTED_LANGUAGES = {"vi", "en"}

# Field-level codes of API Contract 4.4. `future_month` is raised by the Activity
# Calendar service; the rest are shared request-shape codes.
REQUIRED = "required"
INVALID_TYPE = "invalid_type"
INVALID_FORMAT = "invalid_format"
INVALID_VALUE = "invalid_value"
TOO_SHORT = "too_short"
FUTURE_MONTH = "future_month"
NO_FIELDS = "no_fields"


def field_errors(fields):
    """Raise 422 validation_error with `details.fields` = {field name: code}.

    Only stable codes go in: never the submitted value (API Contract 4.4).
    """
    raise ApiError(422, "validation_error", "One or more fields are invalid.", {"fields": dict(fields)})


def field_error(field, code):
    field_errors({field: code})


def validate_fields(checks):
    """Run every `{field: zero-arg check}` and report all failing fields together.

    A check returns the validated value or raises a field-level `validation_error`
    (e.g. through `require_string`). Collecting them lets the frontend show a
    message under each invalid field from one response (API Contract 4.4 example).
    Returns `{field: value}` when everything is valid.
    """
    values, errors = {}, {}
    for field, check in checks.items():
        try:
            values[field] = check()
        except ApiError as error:
            if error.code != "validation_error" or "fields" not in error.details:
                raise
            errors.update(error.details["fields"])
    if errors:
        field_errors(errors)
    return values


def get_json_body():
    """Parse the request body as a JSON object or raise ApiError(400)."""
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
    """Use strip=False for passwords: never silently alter a credential.

    Missing, null and empty values are `required`; a non-string is
    `invalid_type`; a non-empty value below `min_length` is `too_short`.
    """
    value = body.get(field)
    if value is None:
        field_error(field, REQUIRED)
    if not isinstance(value, str):
        field_error(field, INVALID_TYPE)
    result = value.strip() if strip else value
    if not result:
        field_error(field, REQUIRED)
    if len(result) < min_length:
        field_error(field, TOO_SHORT)
    return result


def require_boolean(body, field):
    """Return the field when it is a boolean, else raise validation_error."""
    value = body.get(field)
    if value is None:
        field_error(field, REQUIRED)
    if not isinstance(value, bool):
        field_error(field, INVALID_TYPE)
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
    """Return a trimmed lowercase email string, else raise validation_error."""
    if value is None:
        field_error("email", REQUIRED)
    if not isinstance(value, str):
        field_error("email", INVALID_TYPE)
    return value.strip().lower()


def validate_email(value):
    """Return a normalized email, or raise validation_error if malformed."""
    email = normalize_email(value)
    if not email:
        field_error("email", REQUIRED)
    if any(character.isspace() for character in email) or email.count("@") != 1:
        field_error("email", INVALID_FORMAT)
    local, domain = email.split("@", 1)
    if not local or not domain:
        field_error("email", INVALID_FORMAT)
    return email


def validate_support_language(value):
    """API 7.1: a missing value is `required`; anything but vi/en is `invalid_value`."""
    if value is None:
        field_error("support_language", REQUIRED)
    if not isinstance(value, str) or value not in SUPPORTED_LANGUAGES:
        field_error("support_language", INVALID_VALUE)
    return value


_INTEGER_TEXT = re.compile(r"-?[0-9]+")


def require_query_integer(args, name, *, minimum, maximum):
    """Validate a required integer query parameter (API Contract 8.2).

    Missing or blank is `required`; text that is not a whole number is
    `invalid_format`; a number outside minimum..maximum is `invalid_value`.
    """
    raw = args.get(name)
    if raw is None or not raw.strip():
        field_error(name, REQUIRED)
    if not _INTEGER_TEXT.fullmatch(raw):
        field_error(name, INVALID_FORMAT)
    # Bound the length before int(): an absurdly long digit string is just out of range.
    value = int(raw) if len(raw) <= 12 else None
    if value is None or not minimum <= value <= maximum:
        field_error(name, INVALID_VALUE)
    return value
