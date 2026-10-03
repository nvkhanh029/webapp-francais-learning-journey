"""Shape reference-only content responses for the API."""
from ..errors import ApiError
from ..localization import localized_value, resolve_support_language
from ..repositories import reference_repository


def get_page(user, slug):
    """Return a localized reference page, raising ApiError(404) for an unknown slug.

    Reference pages are not learning units: the response carries no learner
    `state`, and reading one changes no learner state.
    """
    row = reference_repository.get_page_by_slug(slug)
    if row is None:
        raise ApiError(404, "reference_not_found", "Reference content was not found.")
    language = resolve_support_language(user["support_language"])
    return {
        "slug": row["slug"],
        "title_fr": row["title_fr"],
        "title": localized_value(row, "title", language, french_fallback_field="title_fr"),
        "content": localized_value(row, "content", language),
    }


def list_pages(user):
    """Index of reference pages: metadata only, no `content` and no learner `state`.

    Reference pages are not learning units (BR-11), so this read changes no
    learner state, progress or streak (API Contract 12.1).
    """
    language = resolve_support_language(user["support_language"])
    return {
        "references": [
            {
                "slug": row["slug"],
                "title_fr": row["title_fr"],
                "title": localized_value(row, "title", language, french_fallback_field="title_fr"),
            }
            for row in reference_repository.list_pages()
        ]
    }
