
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    support_language TEXT NULL CHECK (support_language IN ('vi', 'en') OR support_language IS NULL),
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_units (
    id INTEGER PRIMARY KEY,
    unit_type TEXT NOT NULL CHECK (unit_type IN ('grammar', 'vocabulary', 'conjugation')),
    slug TEXT NOT NULL UNIQUE,
    title_fr TEXT NOT NULL,
    title_vi TEXT NULL,
    title_en TEXT NULL
);

CREATE TABLE IF NOT EXISTS reference_pages (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title_fr TEXT NOT NULL,
    title_vi TEXT NULL,
    title_en TEXT NULL,
    content_vi TEXT NOT NULL,
    content_en TEXT NOT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    UNIQUE (sort_order)
);

CREATE TABLE IF NOT EXISTS grammar_parts (
    id INTEGER PRIMARY KEY,
    title_fr TEXT NOT NULL,
    title_vi TEXT NULL,
    title_en TEXT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    UNIQUE (sort_order)
);

CREATE TABLE IF NOT EXISTS grammar_chapters (
    id INTEGER PRIMARY KEY,
    part_id INTEGER NOT NULL REFERENCES grammar_parts(id),
    title_fr TEXT NOT NULL,
    title_vi TEXT NULL,
    title_en TEXT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    UNIQUE (part_id, sort_order)
);

CREATE TABLE IF NOT EXISTS grammar_lessons (
    learning_unit_id INTEGER PRIMARY KEY REFERENCES learning_units(id),
    chapter_id INTEGER NOT NULL REFERENCES grammar_chapters(id),
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    content_vi TEXT NOT NULL,
    content_en TEXT NOT NULL,
    UNIQUE (chapter_id, sort_order)
);

CREATE TABLE IF NOT EXISTS vocabulary_categories (
    id INTEGER PRIMARY KEY,
    title_fr TEXT NOT NULL,
    title_vi TEXT NULL,
    title_en TEXT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    UNIQUE (sort_order)
);

CREATE TABLE IF NOT EXISTS vocabulary_topics (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES vocabulary_categories(id),
    slug TEXT NOT NULL UNIQUE,
    title_fr TEXT NOT NULL,
    title_vi TEXT NULL,
    title_en TEXT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    UNIQUE (category_id, sort_order)
);

CREATE TABLE IF NOT EXISTS vocabulary_subtopics (
    id INTEGER PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES vocabulary_topics(id),
    title_fr TEXT NOT NULL,
    title_vi TEXT NULL,
    title_en TEXT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    UNIQUE (topic_id, sort_order)
);

CREATE TABLE IF NOT EXISTS vocabulary_study_units (
    learning_unit_id INTEGER PRIMARY KEY REFERENCES learning_units(id),
    subtopic_id INTEGER NOT NULL REFERENCES vocabulary_subtopics(id),
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    UNIQUE (subtopic_id, sort_order)
);

CREATE TABLE IF NOT EXISTS vocabulary_words (
    id INTEGER PRIMARY KEY,
    study_unit_id INTEGER NOT NULL REFERENCES vocabulary_study_units(learning_unit_id),
    french TEXT NOT NULL,
    meaning_vi TEXT NOT NULL,
    meaning_en TEXT NOT NULL,
    ipa TEXT NULL,
    example_fr TEXT NULL,
    example_vi TEXT NULL,
    example_en TEXT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    UNIQUE (study_unit_id, sort_order)
);

CREATE TABLE IF NOT EXISTS conjugation_tenses (
    id INTEGER PRIMARY KEY,
    title_fr TEXT NOT NULL,
    title_vi TEXT NULL,
    title_en TEXT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    UNIQUE (sort_order)
);

CREATE TABLE IF NOT EXISTS conjugation_lessons (
    learning_unit_id INTEGER PRIMARY KEY REFERENCES learning_units(id),
    tense_id INTEGER NOT NULL REFERENCES conjugation_tenses(id),
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    content_vi TEXT NOT NULL,
    content_en TEXT NOT NULL,
    UNIQUE (tense_id, sort_order)
);

CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY,
    learning_unit_id INTEGER NOT NULL REFERENCES learning_units(id),
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'fill_blank', 'ordering')),
    prompt_vi TEXT NOT NULL,
    prompt_en TEXT NOT NULL,
    explanation_vi TEXT NULL,
    explanation_en TEXT NULL,
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    UNIQUE (learning_unit_id, sort_order)
);

CREATE TABLE IF NOT EXISTS question_items (
    id INTEGER PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id),
    item_text TEXT NOT NULL,
    is_correct INTEGER NULL CHECK (is_correct IN (0, 1) OR is_correct IS NULL),
    correct_position INTEGER NULL CHECK (correct_position > 0 OR correct_position IS NULL),
    sort_order INTEGER NOT NULL CHECK (sort_order > 0),
    UNIQUE (question_id, sort_order)
);

CREATE TABLE IF NOT EXISTS user_learning_state (
    user_id INTEGER NOT NULL REFERENCES users(id),
    learning_unit_id INTEGER NOT NULL REFERENCES learning_units(id),
    learned_at TEXT NULL,
    review_later INTEGER NOT NULL DEFAULT 0 CHECK (review_later IN (0, 1)),
    last_opened_at TEXT NULL,
    PRIMARY KEY (user_id, learning_unit_id)
);

CREATE TABLE IF NOT EXISTS practice_sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    practice_type TEXT NOT NULL CHECK (practice_type IN ('normal', 'mixed')),
    learning_unit_id INTEGER NULL REFERENCES learning_units(id),
    completed_at TEXT NOT NULL,
    activity_date TEXT NOT NULL,
    correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions > 0),
    CHECK (correct_count <= total_questions),
    CHECK (
        (practice_type = 'normal' AND learning_unit_id IS NOT NULL)
        OR
        (practice_type = 'mixed' AND learning_unit_id IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_user_learning_state_last_opened
    ON user_learning_state(user_id, last_opened_at);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_completed
    ON practice_sessions(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_activity
    ON practice_sessions(user_id, activity_date);

CREATE INDEX IF NOT EXISTS idx_questions_learning_unit
    ON questions(learning_unit_id, sort_order);
