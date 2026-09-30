"""Grammar browse/detail application behavior and localized response models."""

from ..errors import ApiError
from ..localization import localized_value, resolve_support_language
from ..repositories import grammar_repository


def get_grammar_browse(current_user):
    """Return the Grammar hierarchy and lesson metadata."""

    support_language = current_user["support_language"]

    rows = grammar_repository.get_grammar_browse_rows(
        current_user["id"]
    )

    parts = []
    part_by_id = {}

    for row in rows:
        part = part_by_id.get(row["part_id"])

        if part is None:
            part = {
                "title_fr": row["part_title_fr"],
                "title": localized_value(
                    row,
                    "part_title",
                    support_language,
                    french_fallback_field="part_title_fr",
                ),
                "chapters": [],
            }

            part_by_id[row["part_id"]] = part
            parts.append(part)

        chapters = part["chapters"]

        chapter = next(
            (
                item
                for item in chapters
                if item["_id"] == row["chapter_id"]
            ),
            None,
        )

        if chapter is None:
            chapter = {
                "_id": row["chapter_id"],
                "title_fr": row["chapter_title_fr"],
                "title": localized_value(
                    row,
                    "chapter_title",
                    support_language,
                    french_fallback_field="chapter_title_fr",
                ),
                "lessons": [],
            }

            chapters.append(chapter)

        chapter["lessons"].append({
            "slug": row["slug"],
            "title_fr": row["lesson_title_fr"],
            "title": localized_value(
                row,
                "lesson_title",
                support_language,
                french_fallback_field="lesson_title_fr",
            ),
            "learned": bool(row["learned"]),
            "review_later": bool(row["review_later"]),
        })

    for part in parts:
        for chapter in part["chapters"]:
            del chapter["_id"]

    return {"parts": parts}


def get_grammar_lesson(current_user, slug):
    """Return one Grammar lesson with localized content."""

    support_language = current_user["support_language"]
    language = resolve_support_language(support_language)

    row = grammar_repository.get_grammar_lesson_by_slug(
        slug,
        current_user["id"],
    )

    if row is None:
        raise ApiError(
            404,
            "learning_unit_not_found",
            "The requested Grammar lesson was not found.",
        )

    return {
        "slug": row["slug"],
        "title_fr": row["lesson_title_fr"],
        "title": localized_value(
            row,
            "lesson_title",
            support_language,
            french_fallback_field="lesson_title_fr",
        ),
        "context": {
            "part": {
                "title_fr": row["part_title_fr"],
                "title": localized_value(
                    row,
                    "part_title",
                    support_language,
                    french_fallback_field="part_title_fr",
                ),
            },
            "chapter": {
                "title_fr": row["chapter_title_fr"],
                "title": localized_value(
                    row,
                    "chapter_title",
                    support_language,
                    french_fallback_field="chapter_title_fr",
                ),
            },
        },
       "content": row[f"content_{language}"],
        "state": {
            "learned": bool(row["learned"]),
            "review_later": bool(row["review_later"]),
        },
    }