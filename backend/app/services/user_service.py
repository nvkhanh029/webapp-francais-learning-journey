"""Current-user model and support-language preference updates.

One shared user model serves register, login and GET /me so the three responses
cannot drift apart; the preference write runs in a service-owned transaction.
"""
from ..db import transaction
from ..repositories import user_repository


def current_user_model(user):
    """The contract's public user shape: never expose id, password_hash or timestamps."""
    return {"email": user["email"], "support_language": user["support_language"]}


def update_support_language(user_id, support_language):
    """Persist an already validated preference, changing only users.support_language;
    progress, Practice History, streak, Review Later and Continue Learning stay
    untouched. Runs inside a service-owned transaction.
    """
    with transaction():
        user_repository.update_support_language(user_id, support_language)
    return {"support_language": support_language}
