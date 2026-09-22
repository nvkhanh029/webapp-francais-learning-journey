"""Validate source shape before transforms, then all references before writes."""
import re

SLUG_PATTERN = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*\Z")
GROUPS = ("grammar", "vocabulary", "conjugation", "reference", "questions")
TITLE_FIELDS = {"title_fr", "title_vi", "title_en"}
WORD_FIELDS = {"french", "meaning_vi", "meaning_en", "ipa", "example_fr", "example_vi", "example_en"}
VOCAB_FIELDS = {
    "category", "category_key", "category_sort_order", "category_vi", "category_en",
    "topic", "topic_slug", "topic_sort_order", "topic_vi", "topic_en",
    "subtopic", "subtopic_key", "subtopic_sort_order", "subtopic_vi", "subtopic_en", "words",
}


class SeedValidationError(ValueError):
    """A contextual, contributor-facing content error. No writes may follow it."""


def _fail(source, message):
    raise SeedValidationError(f"{source}: {message}")


def _object(value, source, label, allowed=None):
    if not isinstance(value, dict):
        _fail(source, f"'{label}' must be an object")
    if allowed is not None:
        extras = set(value)-allowed
        if extras:
            _fail(source, f"unknown field(s) in {label}: {', '.join(sorted(extras))}")


def _text(value, source, field, *, optional=False):
    if optional and value is None:
        return
    if not isinstance(value, str) or not value.strip():
        _fail(source, f"'{field}' must be non-empty text" + (" or null" if optional else ""))


def _slug(value, source, field):
    _text(value, source, field)
    if not SLUG_PATTERN.fullmatch(value):
        _fail(source, f"'{field}' must be lowercase kebab-case (letters, digits, hyphens)")


def _positive(value, source, field):
    if type(value) is not int or not 0 < value <= 9223372036854775807:
        _fail(source, f"'{field}' must be a positive SQLite-range integer")


def _titles(node, source):
    _text(node.get("title_fr"), source, "title_fr")
    for field in ("title_vi", "title_en"):
        _text(node.get(field), source, field, optional=True)
        node.setdefault(field, None)


def _named_node(node, source, label):
    _object(node, source, label, TITLE_FIELDS | {"key", "sort_order"})
    _slug(node.get("key"), source, label + ".key")
    _positive(node.get("sort_order"), source, label + ".sort_order")
    _titles(node, source)


def validate_source_shapes(content):
    """Check every raw input before any .get(), list splitting, or ID lookup."""
    _object(content, "content", "content", set(GROUPS))
    for group in GROUPS:
        if not isinstance(content.get(group), list):
            _fail(group, "content collection must be a list")
        for record in content[group]:
            _object(record, group, "source record")
            source = record.get("source", group)
            if group in ("grammar", "conjugation", "reference"):
                meta = record.get("meta")
                parents = {"part", "chapter"} if group == "grammar" else ({"tense"} if group == "conjugation" else set())
                _object(meta, source, "meta", TITLE_FIELDS | {"slug", "sort_order"} | parents)
                _slug(meta.get("slug"), source, "slug")
                _positive(meta.get("sort_order"), source, "sort_order")
                _titles(meta, source)
                for language in ("vi", "en"):
                    _text(record.get(f"content_{language}"), source, f"{language}.md")
                for parent in parents:
                    _named_node(meta.get(parent), source, parent)
            elif group == "vocabulary":
                data = record.get("data")
                _object(data, source, "Vocabulary source", VOCAB_FIELDS)
                for name, identity in (("category", "category_key"), ("topic", "topic_slug"), ("subtopic", "subtopic_key")):
                    _text(data.get(name), source, name)
                    _slug(data.get(identity), source, identity)
                    _positive(data.get(f"{name}_sort_order"), source, f"{name}_sort_order")
                    for language in ("vi", "en"):
                        _text(data.get(f"{name}_{language}"), source, f"{name}_{language}", optional=True)
                words = data.get("words")
                if not isinstance(words, list) or not words:
                    _fail(source, "'words' must be a non-empty list")
                for index, word in enumerate(words, 1):
                    loc = f"{source} word #{index}"
                    _object(word, loc, "word", WORD_FIELDS)
                    for field in ("french", "meaning_vi", "meaning_en"):
                        _text(word.get(field), loc, field)
                    for field in ("ipa", "example_fr", "example_vi", "example_en"):
                        _text(word.get(field), loc, field, optional=True)
            else:
                data = record.get("data")
                _object(data, source, "Question source", {"learning_unit_slug", "questions"})
                _slug(data.get("learning_unit_slug"), source, "learning_unit_slug")
                questions = data.get("questions")
                if not isinstance(questions, list) or not questions:
                    _fail(source, "'questions' must be a non-empty list")
                for index, question in enumerate(questions, 1):
                    loc = f"{source} question #{index}"
                    _object(question, loc, "question")
                    kind = question.get("question_type")
                    if not isinstance(kind, str) or kind not in {"mcq", "fill_blank", "ordering"}:
                        _fail(loc, "question_type must be mcq, fill_blank, or ordering")
                    body_field = {"mcq": "options", "fill_blank": "accepted_answers", "ordering": "pieces"}[kind]
                    allowed = {"question_type", "sort_order", "prompt_vi", "prompt_en", "explanation_vi", "explanation_en", body_field}
                    _object(question, loc, "question", allowed)
                    _positive(question.get("sort_order"), loc, "sort_order")
                    for field in ("prompt_vi", "prompt_en"):
                        _text(question.get(field), loc, field)
                    for field in ("explanation_vi", "explanation_en"):
                        _text(question.get(field), loc, field, optional=True)
                    items = question.get(body_field)
                    minimum = 1 if kind == "fill_blank" else 2
                    if not isinstance(items, list) or len(items) < minimum:
                        _fail(loc, f"'{body_field}' needs at least {minimum} item(s)")
                    for item in items:
                        if kind == "mcq":
                            _object(item, loc, "option", {"text", "is_correct"})
                            _text(item.get("text"), loc, "options[].text")
                            if not isinstance(item.get("is_correct"), bool):
                                _fail(loc, "options[].is_correct must be boolean")
                        else:
                            _text(item, loc, body_field + "[]")
                    if kind == "mcq" and sum(item["is_correct"] for item in items) != 1:
                        _fail(loc, "MCQ requires exactly one correct option")


def validate_all(content):
    """Validate normalized hierarchy identity, order and generated-unit references.

    Call through seed.prepare_content(); raw shape validation precedes normalization.
    """
    entities = {}
    orders = {}
    learning_slugs = set()
    reference_slugs = set()
    topic_slugs = set()

    def register(kind, key, node, parent, source):
        identity = (kind, key)
        value = (parent, node)
        if identity in entities and entities[identity] != value:
            _fail(source, f"inconsistent {kind} metadata for {key!r}")
        entities[identity] = value
        scope = (kind, parent, node["sort_order"])
        if scope in orders and orders[scope] != identity:
            _fail(source, f"duplicate {kind} sort_order within the same parent")
        orders[scope] = identity

    def unit(slug, source):
        _slug(slug, source, "learning-unit slug")
        if slug in learning_slugs:
            _fail(source, f"duplicate learning-unit slug '{slug}'")
        learning_slugs.add(slug)

    for group in ("grammar", "conjugation"):
        for record in content[group]:
            source, meta = record["source"], record["meta"]
            if group == "grammar":
                part, chapter = meta["part"], meta["chapter"]
                register("Grammar Part", part["key"], part, None, source)
                parent = (part["key"], chapter["key"])
                register("Grammar Chapter", parent, chapter, part["key"], source)
            else:
                tense = meta["tense"]
                register("Conjugation Tense", tense["key"], tense, None, source)
                parent = tense["key"]
            unit(meta["slug"], source)
            register(group + " lesson", meta["slug"], meta, parent, source)

    seen_subtopics = set()
    for record in content["vocabulary"]:
        source, data = record["source"], record["data"]
        category, topic, subtopic = data["category"], data["topic"], data["subtopic"]
        register("Vocabulary Category", category["key"], category, None, source)
        register("Vocabulary Topic", topic["slug"], topic, category["key"], source)
        topic_slugs.add(topic["slug"])
        parent = (topic["slug"], subtopic["key"])
        if parent in seen_subtopics:
            _fail(source, "one Vocabulary subtopic must be authored in one source file")
        seen_subtopics.add(parent)
        register("Vocabulary Subtopic", parent, subtopic, topic["slug"], source)
        for item in record["study_units"]:
            unit(item["slug"], source)
            register("Vocabulary Study Unit", item["slug"], item, parent, source)

    for record in content["reference"]:
        source, meta = record["source"], record["meta"]
        if meta["slug"] in reference_slugs:
            _fail(source, f"duplicate reference slug '{meta['slug']}'")
        reference_slugs.add(meta["slug"])
        register("Reference", meta["slug"], meta, None, source)

    question_files, question_orders = set(), set()
    for record in content["questions"]:
        source, data = record["source"], record["data"]
        slug = data["learning_unit_slug"]
        if slug not in learning_slugs:
            _fail(source, f"unknown learning_unit_slug '{slug}'")
        if slug in question_files:
            _fail(source, f"one question source file is allowed per learning unit: '{slug}'")
        question_files.add(slug)
        for question in data["questions"]:
            key = (slug, question["sort_order"])
            if key in question_orders:
                _fail(source, "duplicate question sort_order for the learning unit")
            question_orders.add(key)
    return {"learning_unit_slugs": learning_slugs, "topic_slugs": topic_slugs,
            "reference_slugs": reference_slugs}
