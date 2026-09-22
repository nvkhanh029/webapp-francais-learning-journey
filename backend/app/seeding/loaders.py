"""Read source files only; templates are never canonical content."""
import json
from pathlib import Path

from .validators import SeedValidationError

GROUPS = ("grammar", "vocabulary", "conjugation", "reference", "questions")


def _is_template_path(path):
    return any(part.startswith("_") for part in path.parts)


def _unique_pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON field {key!r}")
        result[key] = value
    return result


def _reject_constant(value):
    raise ValueError(f"{value} is not a valid JSON constant")


def _read_text(path, root):
    if not path.resolve().is_relative_to(root.resolve()):
        raise SeedValidationError(f"{path}: source must remain inside the data root")
    try:
        return path.read_text(encoding="utf-8-sig")
    except (OSError, UnicodeError) as exc:
        raise SeedValidationError(f"{path}: cannot read UTF-8 source: {exc}") from exc


def _load_json(path, root):
    try:
        data = json.loads(_read_text(path, root), object_pairs_hook=_unique_pairs,
                          parse_constant=_reject_constant)
    except (ValueError, UnicodeError) as exc:
        raise SeedValidationError(f"{path}: invalid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise SeedValidationError(f"{path}: top-level JSON value must be an object")
    return data


def load_all_content(data_root):
    root = Path(data_root)
    if not root.is_dir():
        raise SeedValidationError(f"{root}: data root must be an existing directory")
    for group in GROUPS:
        if not (root/group).is_dir():
            raise SeedValidationError(f"{root/group}: required content directory is missing")
    result = {group: [] for group in GROUPS}
    for group in ("grammar", "conjugation", "reference"):
        base = root/group
        # An orphan translation is not a successfully empty content directory.
        for md in sorted(base.rglob("*.md")):
            if _is_template_path(md.relative_to(base)):
                continue
            if md.name in ("vi.md", "en.md") and not (md.parent/"meta.json").is_file():
                raise SeedValidationError(f"{md.parent}: meta.json is missing")
        for path in sorted(base.rglob("meta.json")):
            if _is_template_path(path.relative_to(base)):
                continue
            record = {"meta": _load_json(path, root),
                      "source": path.relative_to(root).as_posix()}
            for language in ("vi", "en"):
                translation = path.parent/f"{language}.md"
                record[f"content_{language}"] = (
                    _read_text(translation, root) if translation.is_file() else None
                )
            result[group].append(record)
    for group in ("vocabulary", "questions"):
        base = root/group
        for path in sorted(base.rglob("*.json")):
            if _is_template_path(path.relative_to(base)):
                continue
            result[group].append({"data": _load_json(path, root),
                                  "source": path.relative_to(root).as_posix()})
    return result
