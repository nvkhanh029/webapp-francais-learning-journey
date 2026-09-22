"""Regression coverage for source parsing and validate-before-write behavior."""
from pathlib import Path
import shutil

import pytest

from app.seeding.loaders import load_all_content
from app.seeding.validators import SeedValidationError
from seed import prepare_content
from tests.support import empty_sources, lesson, read_json, write_json, vocabulary


def test_templates_excluded_but_valid_content_retained(tmp_path):
    root = empty_sources(tmp_path/"sources")
    good = lesson(root, "reference", "fixture-reference")
    shutil.copytree(good.parent, good.parent.parent/"_template")
    write_json(root/"questions"/"_example.json", {"not": "a valid question source"})
    content = prepare_content(root)
    assert len(content["reference"]) == 1
    assert content["reference"][0]["meta"]["slug"] == "fixture-reference"
    assert not content["questions"]


def test_repository_sources_validate_without_assuming_empty():
    # Intended read-only check of real authored sources, independent of counts.
    prepare_content(Path(__file__).resolve().parents[1]/"data")


@pytest.mark.parametrize("group", ["grammar", "conjugation", "reference", "vocabulary", "questions"])
@pytest.mark.parametrize("bad", [[], None, "text", 12, True])
def test_non_object_json_rejected_before_transform(tmp_path, group, bad):
    root = empty_sources(tmp_path/"sources")
    target = root/group/("broken/meta.json" if group in ("grammar", "conjugation", "reference") else "broken.json")
    write_json(target, bad)
    with pytest.raises(SeedValidationError, match="object"):
        prepare_content(root)


@pytest.mark.parametrize("text", ['{broken', '{"words": [], "words": []}', '{"words": NaN}'])
def test_invalid_json_and_duplicate_json_keys(tmp_path, text):
    root = empty_sources(tmp_path/"sources")
    (root/"vocabulary"/"broken.json").write_text(text)
    with pytest.raises(SeedValidationError, match="invalid JSON"):
        prepare_content(root)


def test_missing_root_is_not_successful_empty_import(tmp_path):
    with pytest.raises(SeedValidationError, match="data root"):
        load_all_content(tmp_path/"does-not-exist")


def test_missing_group_is_a_clear_error(tmp_path):
    root = empty_sources(tmp_path/"sources")
    (root/"questions").rmdir()
    with pytest.raises(SeedValidationError, match="questions"):
        prepare_content(root)


def test_orphan_markdown_is_not_silently_ignored(tmp_path):
    root = empty_sources(tmp_path/"sources")
    (root/"grammar"/"orphan").mkdir()
    (root/"grammar"/"orphan"/"vi.md").write_text("Fixture")
    with pytest.raises(SeedValidationError, match="meta.json"):
        prepare_content(root)


@pytest.mark.parametrize("group", ["grammar", "conjugation", "reference"])
@pytest.mark.parametrize("language", ["vi", "en"])
def test_missing_translation(content_root, group, language):
    folder = next((content_root/group).iterdir())
    (folder/f"{language}.md").unlink()
    with pytest.raises(SeedValidationError, match=language + r".md"):
        prepare_content(content_root)


@pytest.mark.parametrize("bad_slug", ["Bad-Slug", "bad slug", "a/b", "../outside", "two--hyphens", "-leading", "trailing-", "accent-\u00e9"])
def test_invalid_slug_rejected(content_root, bad_slug):
    p = content_root/"grammar"/"fixture-grammar"/"meta.json"
    meta = read_json(p); meta["slug"] = bad_slug; write_json(p, meta)
    with pytest.raises(SeedValidationError, match="kebab-case"):
        prepare_content(content_root)


@pytest.mark.parametrize("bad", [0, -1, True, 1.2, "10", 2**64])
def test_invalid_order(content_root, bad):
    p = content_root/"grammar"/"fixture-grammar"/"meta.json"
    meta = read_json(p); meta["sort_order"] = bad; write_json(p, meta)
    with pytest.raises(SeedValidationError, match="integer"):
        prepare_content(content_root)


def test_duplicate_learning_slug_across_modules(content_root):
    p = content_root/"conjugation"/"fixture-conjugation"/"meta.json"
    meta = read_json(p); meta["slug"] = "fixture-grammar"; write_json(p, meta)
    with pytest.raises(SeedValidationError, match="duplicate learning-unit"):
        prepare_content(content_root)


def test_duplicate_sibling_order(content_root):
    lesson(content_root, "grammar", "fixture-grammar-two", order=10)
    with pytest.raises(SeedValidationError, match="sort_order"):
        prepare_content(content_root)


def test_inconsistent_repeated_parent(content_root):
    p = lesson(content_root, "grammar", "fixture-grammar-two", order=20)
    meta = read_json(p); meta["part"]["title_fr"] = "Conflicting parent"; write_json(p, meta)
    with pytest.raises(SeedValidationError, match="inconsistent"):
        prepare_content(content_root)


def test_missing_and_null_optional_parent_titles_are_equivalent(content_root):
    p = lesson(content_root, "grammar", "fixture-grammar-two", order=20)
    meta = read_json(p); meta["part"]["title_vi"] = None; write_json(p, meta)
    assert len(prepare_content(content_root)["grammar"]) == 2


def test_vocabulary_flat_format_and_top_level_topic_slug(content_root):
    raw = read_json(content_root/"vocabulary"/"fixture-words.json")
    assert isinstance(raw["category"], str) and isinstance(raw["topic"], str)
    normalized = prepare_content(content_root)["vocabulary"][0]
    assert normalized["data"]["topic"]["slug"] == raw["topic_slug"]
    assert normalized["study_units"][0]["slug"] == raw["subtopic_key"]


def test_legacy_nested_vocabulary_not_a_second_authoring_format(content_root):
    p = content_root/"vocabulary"/"fixture-words.json"
    raw = read_json(p); raw["topic"] = {"slug": "fixture-topic"}; write_json(p, raw)
    with pytest.raises(SeedValidationError, match="topic.*text"):
        prepare_content(content_root)


def test_conceptual_vocabulary_example_reports_missing_metadata(tmp_path):
    root = empty_sources(tmp_path/"sources")
    raw = {"category": "Fixture", "topic": "Fixture", "topic_slug": "fixture-topic",
           "subtopic": "Fixture", "words": vocabulary()["words"]}
    write_json(root/"vocabulary"/"sample.json", raw)
    with pytest.raises(SeedValidationError, match="category_key"):
        prepare_content(root)


def test_duplicate_question_files_rejected_before_write(content_root):
    src = content_root/"questions"/"fixture-grammar.json"
    shutil.copyfile(src, src.with_name("duplicate.json"))
    with pytest.raises(SeedValidationError, match="one question source file"):
        prepare_content(content_root)


def test_question_order_unique_within_unit(content_root):
    p = content_root/"questions"/"fixture-grammar.json"
    raw = read_json(p); raw["questions"][1]["sort_order"] = 10; write_json(p, raw)
    with pytest.raises(SeedValidationError, match="question sort_order"):
        prepare_content(content_root)


def test_unknown_question_reference(content_root):
    p = content_root/"questions"/"fixture-grammar.json"
    raw = read_json(p); raw["learning_unit_slug"] = "unknown-unit"; write_json(p, raw)
    with pytest.raises(SeedValidationError, match="unknown learning_unit_slug"):
        prepare_content(content_root)


@pytest.mark.parametrize("bad", [[], {}, None, "multiple_choice"])
def test_invalid_question_type_has_contextual_error(content_root, bad):
    p = content_root/"questions"/"fixture-grammar.json"
    raw = read_json(p); raw["questions"][0]["question_type"] = bad; write_json(p, raw)
    with pytest.raises(SeedValidationError, match="question_type"):
        prepare_content(content_root)


@pytest.mark.parametrize("index,field,value", [
    (0,"options",[]), (0,"options",[{"text":"a","is_correct":True}]),
    (0,"options",[{"text":"a","is_correct":True},{"text":"b","is_correct":True}]),
    (0,"options",[{"text":"a","is_correct":1},{"text":"b","is_correct":False}]),
    (1,"accepted_answers",[]), (1,"accepted_answers",[" "]),
    (2,"pieces",["a"]), (2,"pieces",["a",{}]),
])
def test_bad_question_items(content_root, index, field, value):
    p = content_root/"questions"/"fixture-grammar.json"
    raw = read_json(p); raw["questions"][index][field] = value; write_json(p, raw)
    with pytest.raises(SeedValidationError):
        prepare_content(content_root)


def test_unapproved_fields_not_silently_ignored(content_root):
    p = content_root/"questions"/"fixture-grammar.json"
    raw = read_json(p); raw["questions"][0]["difficulty"] = "hard"; write_json(p, raw)
    with pytest.raises(SeedValidationError, match="unknown field"):
        prepare_content(content_root)
