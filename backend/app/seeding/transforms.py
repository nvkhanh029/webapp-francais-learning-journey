"""Source-to-runtime transformations; source shapes must be validated first."""
from copy import deepcopy
from math import ceil


def balanced_sizes(total, *, preferred_max=15):
    if type(total) is not int or total < 0:
        raise ValueError("total must be a non-negative integer")
    if type(preferred_max) is not int or preferred_max < 1:
        raise ValueError("preferred_max must be a positive integer")
    if total == 0:
        return []
    count = ceil(total/preferred_max)
    size, remainder = divmod(total, count)
    return [size + (index < remainder) for index in range(count)]


def generate_vocabulary_study_units(records):
    """Normalize the ONE flat authored format, then split without reordering.

    The nested nodes in the return value are internal writer models, NOT a
    second accepted authoring format. See backend/data/README.md.
    """
    result = []
    for record in records:
        raw = record["data"]
        data = {"words": deepcopy(raw["words"])}
        for label, key in (("category", "category_key"), ("topic", "topic_slug"), ("subtopic", "subtopic_key")):
            data[label] = {
                "slug" if label == "topic" else "key": raw[key],
                "title_fr": raw[label], "title_vi": raw.get(f"{label}_vi"),
                "title_en": raw.get(f"{label}_en"), "sort_order": raw[f"{label}_sort_order"],
            }
        words, subtopic = data["words"], data["subtopic"]
        sizes = [len(words)] if len(words) <= 18 else balanced_sizes(len(words))
        units, cursor = [], 0
        for index, size in enumerate(sizes, 1):
            multiple = len(sizes) > 1
            titles = {}
            for lang, suffix in (("fr", "Partie"), ("vi", "Ph\u1ea7n"), ("en", "Part")):
                title = subtopic.get(f"title_{lang}")
                titles[f"title_{lang}"] = f"{title} \u2014 {suffix} {index}" if multiple and title else title
            units.append({"slug": f"{subtopic['key']}-{index}" if multiple else subtopic["key"],
                          **titles, "sort_order": index*10, "words": words[cursor:cursor+size]})
            cursor += size
        result.append({"source": record["source"], "data": data, "study_units": units})
    return result
