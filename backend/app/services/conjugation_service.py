"""Member 5: Conjugation browse/detail response models (API Contracts §11)."""
from ..errors import ApiError
from ..localization import localized_value, resolve_support_language
from ..repositories import conjugation_repository


def _learner_state(user_id, learning_unit_id):
    # TODO(Member 5): placeholder until learning_state_repository exists
    # (Member 2). Contract shape is already final: swap the body for the
    # real learned/review_later read without changing this response model.
    return {"learned": False, "review_later": False}


def _localized_title(row, prefix, language):
    return localized_value(
        row,
        prefix,
        language,
        french_fallback_field=f"{prefix}_fr",
    )


def list_conjugation(user):
    """Tense-grouped browse metadata; no lesson Markdown (Contract §11.1)."""
    language = resolve_support_language(user["support_language"])
    tenses = []
    current = None
    for row in conjugation_repository.get_tenses_with_lessons():
        if current is None or current["_tense_id"] != row["tense_id"]:
            current = {
                "_tense_id": row["tense_id"],
                "title_fr": row["tense_title_fr"],
                "title": _localized_title(row, "tense_title", language),
                "lessons": [],
            }
            tenses.append(current)
        current["lessons"].append(
            {
                "slug": row["slug"],
                "title_fr": row["title_fr"],
                "title": _localized_title(row, "title", language),
                **_learner_state(user["id"], row["learning_unit_id"]),
            }
        )
    for tense in tenses:
        del tense["_tense_id"]
    return {"tenses": tenses}


def get_lesson(user, slug):
    """One rule/pattern lesson with localized Markdown (Contract §11.2)."""
    row = conjugation_repository.get_lesson_by_slug(slug)
    if row is None:
        raise ApiError(404, "learning_unit_not_found", "Learning content was not found.")
    language = resolve_support_language(user["support_language"])
    return {
        "slug": row["slug"],
        "title_fr": row["title_fr"],
        "title": _localized_title(row, "title", language),
        "context": {
            "tense": {
                "title_fr": row["tense_title_fr"],
                "title": _localized_title(row, "tense_title", language),
            }
        },
        "content": localized_value(row, "content", language),
        "state": _learner_state(user["id"], row["learning_unit_id"]),
    }
