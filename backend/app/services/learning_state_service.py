"""Open, Mark as Learned and Review Later transitions.

Owner: Member 2 (Dashboard and Learning State). Follows docs/api-contracts.md
Section 13 and docs/database-design.md Section 11.1. Learner identity is
always the authenticated user_id from the route/session, never a client value.
"""
from datetime import datetime, timezone

from ..db import transaction
from ..errors import ApiError
from ..localization import localized_value
from ..repositories import learning_state_repository, learning_unit_repository


def _now_iso():
    """Backend-authoritative timestamp; never trust a client-supplied time."""
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def _find_unit_or_404(slug):
    unit = learning_unit_repository.find_by_slug(slug)
    if unit is None:
        raise ApiError(404, "learning_unit_not_found", "This learning unit does not exist.")
    return unit


def record_open(user_id, slug):
    """Record that the learner opened a unit. Never marks it learned or touches streak."""
    unit = _find_unit_or_404(slug)
    with transaction():
        learning_state_repository.record_open(user_id, unit["id"], _now_iso())
    return {"slug": unit["slug"], "opened": True}


def update_state(user_id, slug, *, learned=None, review_later=None):
    """Apply Mark as Learned and/or Review Later. The two fields stay independent
    and neither one creates or removes streak activity (Requirements Section 11.1).
    """
    unit = _find_unit_or_404(slug)
    with transaction():
        learning_state_repository.update_state(
            user_id, unit["id"],
            learned=learned, learned_at=_now_iso(), review_later=review_later,
        )
    state_row = learning_state_repository.get_state(user_id, unit["id"])
    return {
        "slug": unit["slug"],
        "state": {
            "learned": state_row["learned_at"] is not None,
            "review_later": bool(state_row["review_later"]),
        },
    }


def get_review_later(user_id, support_language):
    """Build the Review Later list. `review_later` itself is not repeated per item
    because membership in this list already implies review_later = true.
    """
    rows = learning_state_repository.list_review_later(user_id)
    items = [
        {
            "slug": row["slug"],
            "unit_type": row["unit_type"],
            "title_fr": row["title_fr"],
            "title": localized_value(row, "title", support_language, french_fallback_field="title_fr"),
            "learned": row["learned_at"] is not None,
        }
        for row in rows
    ]
    return {"items": items}
