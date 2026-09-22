
def _insert_learning_unit(connection, unit_type, unit):
    cursor = connection.execute(
        """
        INSERT INTO learning_units (unit_type, slug, title_fr, title_vi, title_en)
        VALUES (?, ?, ?, ?, ?)
        """,
        (unit_type, unit["slug"], unit["title_fr"], unit.get("title_vi"), unit.get("title_en")),
    )
    return cursor.lastrowid


def write_all(connection, content):
    summary = {
        "grammar_parts": 0,
        "grammar_chapters": 0,
        "grammar_lessons": 0,
        "vocabulary_categories": 0,
        "vocabulary_topics": 0,
        "vocabulary_subtopics": 0,
        "vocabulary_study_units": 0,
        "vocabulary_words": 0,
        "conjugation_tenses": 0,
        "conjugation_lessons": 0,
        "reference_pages": 0,
        "questions": 0,
        "question_types": {"mcq": 0, "fill_blank": 0, "ordering": 0},
    }
    learning_unit_ids = {}

    # Grammar
    parts = {}
    chapters = {}
    for record in sorted(content["grammar"], key=lambda item: (item["meta"]["part"]["sort_order"], item["meta"]["chapter"]["sort_order"], item["meta"]["sort_order"])):
        meta = record["meta"]
        part = meta["part"]
        chapter = meta["chapter"]
        part_key = part["key"]
        chapter_key = (part_key, chapter["key"])

        if part_key not in parts:
            cursor = connection.execute(
                "INSERT INTO grammar_parts (title_fr, title_vi, title_en, sort_order) VALUES (?, ?, ?, ?)",
                (part["title_fr"], part.get("title_vi"), part.get("title_en"), part["sort_order"]),
            )
            parts[part_key] = cursor.lastrowid
            summary["grammar_parts"] += 1

        if chapter_key not in chapters:
            cursor = connection.execute(
                "INSERT INTO grammar_chapters (part_id, title_fr, title_vi, title_en, sort_order) VALUES (?, ?, ?, ?, ?)",
                (parts[part_key], chapter["title_fr"], chapter.get("title_vi"), chapter.get("title_en"), chapter["sort_order"]),
            )
            chapters[chapter_key] = cursor.lastrowid
            summary["grammar_chapters"] += 1

        learning_unit_id = _insert_learning_unit(connection, "grammar", meta)
        learning_unit_ids[meta["slug"]] = learning_unit_id
        connection.execute(
            "INSERT INTO grammar_lessons (learning_unit_id, chapter_id, sort_order, content_vi, content_en) VALUES (?, ?, ?, ?, ?)",
            (learning_unit_id, chapters[chapter_key], meta["sort_order"], record["content_vi"], record["content_en"]),
        )
        summary["grammar_lessons"] += 1

    # Vocabulary
    categories = {}
    topics = {}
    subtopics = {}
    for record in sorted(content["vocabulary"], key=lambda item: (item["data"]["category"]["sort_order"], item["data"]["topic"]["sort_order"], item["data"]["subtopic"]["sort_order"])):
        data = record["data"]
        category = data["category"]
        topic = data["topic"]
        subtopic = data["subtopic"]
        category_key = category["key"]
        topic_slug = topic["slug"]
        subtopic_key = (topic_slug, subtopic["key"])

        if category_key not in categories:
            cursor = connection.execute(
                "INSERT INTO vocabulary_categories (title_fr, title_vi, title_en, sort_order) VALUES (?, ?, ?, ?)",
                (category["title_fr"], category.get("title_vi"), category.get("title_en"), category["sort_order"]),
            )
            categories[category_key] = cursor.lastrowid
            summary["vocabulary_categories"] += 1

        if topic_slug not in topics:
            cursor = connection.execute(
                "INSERT INTO vocabulary_topics (category_id, slug, title_fr, title_vi, title_en, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
                (categories[category_key], topic_slug, topic["title_fr"], topic.get("title_vi"), topic.get("title_en"), topic["sort_order"]),
            )
            topics[topic_slug] = cursor.lastrowid
            summary["vocabulary_topics"] += 1

        if subtopic_key not in subtopics:
            cursor = connection.execute(
                "INSERT INTO vocabulary_subtopics (topic_id, title_fr, title_vi, title_en, sort_order) VALUES (?, ?, ?, ?, ?)",
                (topics[topic_slug], subtopic["title_fr"], subtopic.get("title_vi"), subtopic.get("title_en"), subtopic["sort_order"]),
            )
            subtopics[subtopic_key] = cursor.lastrowid
            summary["vocabulary_subtopics"] += 1

        for unit in record["study_units"]:
            learning_unit_id = _insert_learning_unit(connection, "vocabulary", unit)
            learning_unit_ids[unit["slug"]] = learning_unit_id
            connection.execute(
                "INSERT INTO vocabulary_study_units (learning_unit_id, subtopic_id, sort_order) VALUES (?, ?, ?)",
                (learning_unit_id, subtopics[subtopic_key], unit["sort_order"]),
            )
            summary["vocabulary_study_units"] += 1
            for index, word in enumerate(unit["words"], start=1):
                connection.execute(
                    """
                    INSERT INTO vocabulary_words (
                        study_unit_id, french, meaning_vi, meaning_en, ipa,
                        example_fr, example_vi, example_en, sort_order
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        learning_unit_id,
                        word["french"],
                        word["meaning_vi"],
                        word["meaning_en"],
                        word.get("ipa"),
                        word.get("example_fr"),
                        word.get("example_vi"),
                        word.get("example_en"),
                        index * 10,
                    ),
                )
                summary["vocabulary_words"] += 1

    # Conjugation
    tenses = {}
    for record in sorted(content["conjugation"], key=lambda item: (item["meta"]["tense"]["sort_order"], item["meta"]["sort_order"])):
        meta = record["meta"]
        tense = meta["tense"]
        tense_key = tense["key"]
        if tense_key not in tenses:
            cursor = connection.execute(
                "INSERT INTO conjugation_tenses (title_fr, title_vi, title_en, sort_order) VALUES (?, ?, ?, ?)",
                (tense["title_fr"], tense.get("title_vi"), tense.get("title_en"), tense["sort_order"]),
            )
            tenses[tense_key] = cursor.lastrowid
            summary["conjugation_tenses"] += 1

        learning_unit_id = _insert_learning_unit(connection, "conjugation", meta)
        learning_unit_ids[meta["slug"]] = learning_unit_id
        connection.execute(
            "INSERT INTO conjugation_lessons (learning_unit_id, tense_id, sort_order, content_vi, content_en) VALUES (?, ?, ?, ?, ?)",
            (learning_unit_id, tenses[tense_key], meta["sort_order"], record["content_vi"], record["content_en"]),
        )
        summary["conjugation_lessons"] += 1

    # Reference pages
    for record in sorted(content["reference"], key=lambda item: item["meta"]["sort_order"]):
        meta = record["meta"]
        connection.execute(
            """
            INSERT INTO reference_pages (slug, title_fr, title_vi, title_en, content_vi, content_en, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (meta["slug"], meta["title_fr"], meta.get("title_vi"), meta.get("title_en"), record["content_vi"], record["content_en"], meta["sort_order"]),
        )
        summary["reference_pages"] += 1

    # Questions and question items
    for record in content["questions"]:
        data = record["data"]
        learning_unit_id = learning_unit_ids[data["learning_unit_slug"]]
        for question in sorted(data["questions"], key=lambda item: item["sort_order"]):
            cursor = connection.execute(
                """
                INSERT INTO questions (
                    learning_unit_id, question_type, prompt_vi, prompt_en,
                    explanation_vi, explanation_en, sort_order
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    learning_unit_id,
                    question["question_type"],
                    question["prompt_vi"],
                    question["prompt_en"],
                    question.get("explanation_vi"),
                    question.get("explanation_en"),
                    question["sort_order"],
                ),
            )
            question_id = cursor.lastrowid
            qtype = question["question_type"]
            summary["questions"] += 1
            summary["question_types"][qtype] += 1

            if qtype == "mcq":
                items = [
                    (option["text"], int(option["is_correct"]), None)
                    for option in question["options"]
                ]
            elif qtype == "fill_blank":
                items = [(answer, 1, None) for answer in question["accepted_answers"]]
            else:
                items = [(piece, None, position) for position, piece in enumerate(question["pieces"], start=1)]

            for index, (text, is_correct, correct_position) in enumerate(items, start=1):
                connection.execute(
                    "INSERT INTO question_items (question_id, item_text, is_correct, correct_position, sort_order) VALUES (?, ?, ?, ?, ?)",
                    (question_id, text, is_correct, correct_position, index * 10),
                )

    return summary
