"""Vocabulary response shaping (Member 4).

Converts repository rows into the localized response models of
docs/api-contracts.md §10: support-language selection, hierarchy grouping, and
learner-state enrichment. No HTTP parsing and no SQL here; a missing resource
raises ApiError(404) with the contract's error code.
"""
from flask import g

from ..errors import ApiError
from ..localization import localized_value, resolve_support_language
from ..repositories import vocabulary_repository


def _title(row, prefix, support_language):
    """Localize an entity title, falling back to title_fr when the
    support-language title is absent (docs/api-contracts.md §4.9)."""
    return localized_value(
        {
            "title_fr": row[f"{prefix}_fr"],
            "title_vi": row[f"{prefix}_vi"],
            "title_en": row[f"{prefix}_en"],
        },
        "title",
        support_language,
        french_fallback_field="title_fr",
    )


def browse_categories():
    """Build the browse payload: categories with their topics, in sort_order."""
    language = resolve_support_language(g.current_user["support_language"])
    categories = []
    index = {}  # category_id -> payload, to group the ordered topic rows.
    for row in vocabulary_repository.list_categories_with_topics():
        category = index.get(row["category_id"])
        if category is None:
            category = {
                "title_fr": row["category_fr"],
                "title": _title(row, "category", language),
                "topics": [],
            }
            index[row["category_id"]] = category
            categories.append(category)
        category["topics"].append(
            {
                "slug": row["topic_slug"],
                "title_fr": row["topic_fr"],
                "title": _title(row, "topic", language),
            }
        )
    return {"categories": categories}


def get_topic_detail(topic_slug):
    """Build the topic page: category context plus subtopics with study units.

    Raises ApiError(404, "topic_not_found") for an unknown topic slug.
    """
    row = vocabulary_repository.get_topic_by_slug(topic_slug)
    if row is None:
        raise ApiError(404, "topic_not_found", "Vocabulary topic not found.")

    language = resolve_support_language(g.current_user["support_language"])
    subtopics = []
    index = {}  # subtopic_id -> payload, to group the ordered study-unit rows.
    for unit in vocabulary_repository.list_subtopics_with_units(
        row["topic_id"], g.current_user["id"]
    ):
        subtopic = index.get(unit["subtopic_id"])
        if subtopic is None:
            subtopic = {
                "title_fr": unit["subtopic_fr"],
                "title": _title(unit, "subtopic", language),
                "study_units": [],
            }
            index[unit["subtopic_id"]] = subtopic
            subtopics.append(subtopic)
        subtopic["study_units"].append(
            {
                "slug": unit["unit_slug"],
                "title_fr": unit["unit_fr"],
                "title": _title(unit, "unit", language),
                # A missing user_learning_state row surfaces as learned_at=NULL.
                "learned": unit["learned_at"] is not None,
                "review_later": bool(unit["review_later"]),
            }
        )

    return {
        "slug": row["topic_slug"],
        "title_fr": row["topic_fr"],
        "title": _title(row, "topic", language),
        "context": {
            "category": {
                "title_fr": row["category_fr"],
                "title": _title(row, "category", language),
            }
        },
        "subtopics": subtopics,
    }


def get_study_unit_detail(slug):
    """Build the study unit page: breadcrumb context, localized entries, state.

    Raises ApiError(404, "learning_unit_not_found") when the slug is unknown or
    belongs to another module.
    """
    row = vocabulary_repository.get_study_unit_by_slug(slug, g.current_user["id"])
    if row is None:
        raise ApiError(404, "learning_unit_not_found", "Vocabulary study unit not found.")

    language = resolve_support_language(g.current_user["support_language"])
    entries = [
        {
            "french": word["french"],
            "meaning": localized_value(word, "meaning", language),
            "ipa": word["ipa"],
            "example_fr": word["example_fr"],
            "example_translation": localized_value(word, "example", language),
        }
        for word in vocabulary_repository.list_words(row["learning_unit_id"])
    ]

    return {
        "slug": row["unit_slug"],
        "title_fr": row["unit_fr"],
        "title": _title(row, "unit", language),
        "context": {
            "category": {
                "title_fr": row["category_fr"],
                "title": _title(row, "category", language),
            },
            "topic": {
                "slug": row["topic_slug"],
                "title_fr": row["topic_fr"],
                "title": _title(row, "topic", language),
            },
            "subtopic": {
                "title_fr": row["subtopic_fr"],
                "title": _title(row, "subtopic", language),
            },
        },
        "entries": entries,
        "state": {
            "learned": row["learned_at"] is not None,
            "review_later": bool(row["review_later"]),
        },
    }
