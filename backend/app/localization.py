"""Pure helpers for the documented read-time language fallback."""
SUPPORTED_LANGUAGES = {"vi", "en"}


def resolve_support_language(value):
    if value is None:
        return "vi"
    if not isinstance(value, str) or value not in SUPPORTED_LANGUAGES:
        raise ValueError("Persisted support_language must be None, 'vi', or 'en'.")
    return value


def localized_value(row, field, support_language, *, french_fallback_field=None):
    """Accept dict or sqlite3.Row; missing selected fields indicate a query bug."""
    language = resolve_support_language(support_language)
    value = row[f"{field}_{language}"]
    if value is not None:
        return value
    if french_fallback_field is not None:
        return row[french_fallback_field]
    return None
