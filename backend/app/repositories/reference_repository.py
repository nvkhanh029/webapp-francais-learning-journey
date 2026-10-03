"""Reference-page SQL. Read-only; services own transactions."""
from ..db import get_db


def get_page_by_slug(slug):
    """One reference page; None when the stable slug does not exist."""
    return get_db().execute(
        """
        SELECT slug, title_fr, title_vi, title_en, content_vi, content_en
        FROM reference_pages
        WHERE slug = ?
        """,
        (slug,),
    ).fetchone()


def list_pages():
    """Reference index rows (no Markdown content), in curriculum order.

    Ordered by reference_pages.sort_order, never by primary key.
    """
    return get_db().execute(
        """
        SELECT slug, title_fr, title_vi, title_en
        FROM reference_pages
        ORDER BY sort_order
        """
    ).fetchall()
