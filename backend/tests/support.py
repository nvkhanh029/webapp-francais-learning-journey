"""Synthetic structural fixtures only; no authored learning material."""
import json
from pathlib import Path

GROUPS = ("grammar", "vocabulary", "conjugation", "reference", "questions")


def write_json(path, value):
    """Write value as UTF-8 JSON, creating parent directories."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")


def empty_sources(root):
    """Create the empty group directories and return the root."""
    root = Path(root)
    for group in GROUPS:
        (root/group).mkdir(parents=True, exist_ok=True)
    return root


def node(key, order=10):
    """Return a minimal fixture node with key, title, and order."""
    return {"key": key, "title_fr": "Fixture node", "sort_order": order}


def lesson(root, group, slug, *, order=10):
    """Write a lesson meta file and language files, returning the meta path."""
    meta = {"slug": slug, "title_fr": "Fixture title", "sort_order": order}
    if group == "grammar":
        meta.update(part=node("fixture-part"), chapter=node("fixture-chapter"))
    elif group == "conjugation":
        meta["tense"] = node("fixture-tense")
    folder = root/group/slug
    write_json(folder/"meta.json", meta)
    for language in ("vi", "en"):
        (folder/f"{language}.md").write_text("Synthetic test text, not curriculum.", encoding="utf-8")
    return folder/"meta.json"


def vocabulary(count=3):
    """Return a flat fixture vocabulary source with count words."""
    return {"category": "Fixture category", "category_key": "fixture-category", "category_sort_order": 10,
            "topic": "Fixture topic", "topic_slug": "fixture-topic", "topic_sort_order": 10,
            "subtopic": "Fixture subtopic", "subtopic_key": "fixture-words", "subtopic_sort_order": 10,
            "words": [{"french": f"fixture-{i}", "meaning_vi": f"fixture-vi-{i}", "meaning_en": f"fixture-en-{i}"}
                      for i in range(count)]}


def question(kind, order=10):
    """Return one fixture question of the given kind and order."""
    value = {"question_type": kind, "sort_order": order, "prompt_vi": "Fixture VI prompt", "prompt_en": "Fixture EN prompt"}
    if kind == "mcq":
        value["options"] = [{"text": "fixture-a", "is_correct": True}, {"text": "fixture-b", "is_correct": False}]
    elif kind == "fill_blank":
        value["accepted_answers"] = ["fixture-answer"]
    else:
        value["pieces"] = ["fixture-a", "fixture-b", "fixture-c"]
    return value


def representative_sources(root):
    """Build and return a complete synthetic source tree."""
    root = empty_sources(root)
    lesson(root, "grammar", "fixture-grammar")
    lesson(root, "conjugation", "fixture-conjugation")
    lesson(root, "reference", "fixture-reference")
    write_json(root/"vocabulary"/"fixture-words.json", vocabulary())
    for slug, types in (("fixture-grammar", ["mcq", "fill_blank", "ordering"]),
                        ("fixture-words", ["mcq"]), ("fixture-conjugation", ["fill_blank"])):
        write_json(root/"questions"/f"{slug}.json", {"learning_unit_slug": slug,
                   "questions": [question(kind, i*10) for i, kind in enumerate(types, 1)]})
    return root


def read_json(path):
    """Read and return the JSON document at path."""
    return json.loads(Path(path).read_text(encoding="utf-8"))
