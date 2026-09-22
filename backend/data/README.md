# Static Content Authoring

**Primary content owner: Member 3.** Author only from project/lead-approved
sources. Templates and synthetic test labels are not curriculum.

The authoritative data meaning is in `../../docs/database-design.md`, Sections
14-17. That document contains conceptual examples as well as canonical question
fields. This README supplies the concrete file-level mapping needed by the
loader; it does **not** add DB columns, API fields or product behavior.

## Read this before entering data

- Use UTF-8 and preserve French/Vietnamese diacritics in actual content.
- Slugs/keys use lowercase ASCII letters/digits separated by single hyphens.
- Numeric database IDs are never authored. `key` fields below are source-only
  references used to combine repeated parent metadata during this seed.
- `sort_order` and the equivalent named order fields are positive integers,
  normally 10, 20, 30, unique within the same parent. Do not use DB IDs or file
  listing order for curriculum order.
- Keep repeated metadata for a shared parent consistent across files. Optional
  title/translation fields may be absent or null, but not blank strings.
- Do not add undocumented fields for new features; the validator rejects unknown
  fields rather than silently throwing information away.
- Every path component beginning with `_` is excluded from seed discovery. Copy
  a template to a normal path, replace its placeholders, then validate it.

All five group directories must exist. They may initially contain only templates.
A wrong/missing data root is an error, not an empty successful import.

## 1. Grammar

Copy `grammar/_template/` to `grammar/<lesson-slug>/`.

| File | Contents |
|---|---|
| `meta.json` | `slug`, `title_fr`, optional `title_vi`/`title_en`, `sort_order`, `part`, `chapter` |
| `vi.md` | Non-empty Vietnamese explanation from the approved source |
| `en.md` | Non-empty English explanation from the approved source |

`part` and `chapter` are objects with `key`, `title_fr`, optional `title_vi`/
`title_en`, and `sort_order`. `part.key` identifies a source Part; `chapter.key`
identifies a Chapter within that Part. Reuse the same keys and metadata for
lessons with the same parents.

Mapping: parent objects -> `grammar_parts` and `grammar_chapters`; lesson identity
-> `learning_units`; chapter link/order/Markdown -> `grammar_lessons`. The source
keys are not new table columns. They are resolved to numeric FKs during import.

## 2. Conjugation

Copy `conjugation/_template/` to `conjugation/<lesson-slug>/`.
The same three files are required. `meta.json` has lesson slug/titles/order and a
`tense` object containing `key`, titles and `sort_order`.

Mapping: tense object -> `conjugation_tenses`; lesson identity -> `learning_units`;
link/order/Markdown -> `conjugation_lessons`. Teach a tense/rule pattern, not one
new learning unit per individual verb.

## 3. Vocabulary - one concrete flat format

Copy `vocabulary/_template.json` to
`vocabulary/<topic-folder>/<subtopic>.json`. One file represents one Subtopic.

The DB Design Section 14.4 illustrates **string** `category`, `topic`, `subtopic`,
root `topic_slug`, and `words`. v3 keeps those names and types. The conceptual
example omits explicit hierarchy order/source keys; the ready-to-copy template
adds the fields below to supply the already-required DB hierarchy/order.

| Field | Required? | Mapping/purpose |
|---|---|---|
| `category` | Yes | French category title -> `vocabulary_categories.title_fr` |
| `category_key` | Yes | Source-only stable category reference |
| `category_sort_order` | Yes | Category `sort_order` |
| `category_vi`, `category_en` | No | Category localized titles |
| `topic` | Yes | French topic title |
| `topic_slug` | Yes | Persistent, unique `vocabulary_topics.slug` |
| `topic_sort_order` | Yes | Topic order within Category |
| `topic_vi`, `topic_en` | No | Topic localized titles |
| `subtopic` | Yes | French subtopic title |
| `subtopic_key` | Yes | Source identity and generated Study Unit slug base |
| `subtopic_sort_order` | Yes | Subtopic order within Topic |
| `subtopic_vi`, `subtopic_en` | No | Subtopic/localized generated unit titles |
| `words` | Yes | Non-empty list in intended source order |

Each word object requires `french`, `meaning_vi`, `meaning_en`. `ipa`, `example_fr`,
`example_vi`, `example_en` are optional. Omit them or use null when unavailable.
IPA must be source-reviewed; the validator checks text shape, not linguistic
correctness. A multi-word expression is one entry.

Study Units follow the supplied splitting rule:

```text
1-18 entries -> one unit, slug = subtopic_key
more than 18 -> ceil(entry_count / 15) balanced units
               slug = subtopic_key-1, subtopic_key-2, ...
34 entries -> 12 + 11 + 11, preserving source order
```

Single-unit titles use the Subtopic title; multiple-unit titles append the part
number. Unit/entry sort orders are generated as 10, 20, 30. Use globally distinct
subtopic keys so generated unit slugs do not collide with other modules.

Before writing Vocabulary questions, run `python seed.py --validate-only` from
`backend/` to inspect the generated learning-unit slugs. Do not alter a frozen
unit's membership through an automatic rebalance after learner progress exists.
Incremental content update/migration tools are intentionally deferred.

## 4. Reference

Copy `reference/_template/` to `reference/<reference-slug>/`.
Metadata has slug, titles and `sort_order`; both `vi.md` and `en.md` are required.
Reference pages map only to `reference_pages`, never `learning_units`.
Do not attach completion, Review Later or Practice questions to a reference slug.

## 5. Questions

Copy `questions/_template.json` to `questions/<learning-unit-slug>.json`.
There must be one source file per learning unit.

Root fields: `learning_unit_slug`, `questions` (a non-empty list).
Every question requires positive `sort_order`, `question_type`, `prompt_vi` and
`prompt_en`; `explanation_vi`/`explanation_en` are optional.

| Type | Required body | Rules |
|---|---|---|
| `mcq` | `options` with `text` and Boolean `is_correct` | At least two, exactly one correct |
| `fill_blank` | `accepted_answers` | At least one non-empty string |
| `ordering` | `pieces` | At least two strings in canonical correct order |

Source array order generates `question_items.sort_order`; Ordering also generates
`correct_position = 1..N`. The future Practice service, not the seed, shuffles
learner-facing pieces. No source/DB IDs need to be entered manually.

The validator checks structure and references, not whether a French answer is
correct or a question is unambiguous. Content-level review is still necessary.

## 6. Commands and safety

From `backend/`:

```bash
python seed.py --validate-only
python -m pytest -q
```

Validation includes all sources and generated unit references before any write.
The read-only command needs no database or real learner account.

To import into a fresh initialized database:

```bash
python init_db.py
python seed.py
```

Seeding is transactional and never creates real users, progress, history or
streak rows. It refuses a non-empty static store. A template-only directory prints
an explicit zero-content notice. `--reset`, automatic upserts and production
migrations are not included. Do not bypass the refusal by editing the DB manually.
Use an isolated scratch DB for seed checks, or coordinate a backed-up, deliberate
local replacement with the lead. See the root README.
