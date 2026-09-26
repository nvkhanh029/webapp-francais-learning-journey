"""Current-user model and support-language preference updates.

Owner: Member 1 (Auth and User Preferences). Follows docs/api-contracts.md
Sections 6.4 and 7. One shared user model is used by register, login and
GET /me so the three responses cannot drift apart.
"""
from ..db import transaction
from ..repositories import user_repository


def current_user_model(user):
    """The contract's public user shape: never expose id, password_hash or timestamps."""
    return {"email": user["email"], "support_language": user["support_language"]}


def update_support_language(user_id, support_language):
    """Persist an already validated preference.

    Only users.support_language changes; progress, Practice History, streak,
    Review Later and Continue Learning state are untouched (FR-LANG-06).
    """
    with transaction():
        user_repository.update_support_language(user_id, support_language)
    return {"support_language": support_language}
