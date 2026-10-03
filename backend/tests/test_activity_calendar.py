"""GET /api/v1/me/activity-calendar (API Contract 8.2, Database Design 13.3)."""
import sqlite3
from datetime import datetime, timedelta, timezone

import pytest

from app import clock
from tests.test_dashboard import _insert_learning_unit, _insert_session, _insert_user, _login
from tests.test_practice import _answers, _practice_setup, _start_normal, _submit

pytestmark = pytest.mark.flask

VN = timezone(timedelta(hours=7))
URL = "/api/v1/me/activity-calendar"


@pytest.fixture(autouse=True)
def september_2026(monkeypatch):
    monkeypatch.setattr(clock, "now", lambda: datetime(2026, 9, 20, 21, 15, tzinfo=VN))


@pytest.fixture
def learner(client, database_path):
    _insert_user(database_path)
    _login(client, 1)
    return 1


def add(database_path, session_id, day, **kwargs):
    _insert_session(database_path, session_id=session_id, completed_at=f"{day}T10:00:00+07:00",
                    activity_date=day, **kwargs)


def calendar(client, year, month):
    return client.get(f"{URL}?year={year}&month={month}")


def assert_fields(response, fields):
    assert response.status_code == 422
    error = response.json["error"]
    assert error["code"] == "validation_error"
    assert error["details"] == {"fields": fields}


def test_requires_authentication(client):
    response = calendar(client, 2026, 9)
    assert response.status_code == 401
    assert response.json["error"]["code"] == "not_authenticated"


def test_returns_unique_active_dates_ascending(client, database_path, learner):
    add(database_path, 1, "2026-09-20")
    add(database_path, 2, "2026-09-02")
    add(database_path, 3, "2026-09-19")
    response = calendar(client, 2026, 9)
    assert response.status_code == 200
    assert response.json == {"data": {"year": 2026, "month": 9,
                                      "days": ["2026-09-02", "2026-09-19", "2026-09-20"]}}


def test_several_sessions_on_one_day_appear_once_without_counts(client, database_path, learner):
    _insert_learning_unit(database_path, unit_id=1, unit_type="grammar", slug="grammar-1")
    add(database_path, 1, "2026-09-10", practice_type="normal", learning_unit_id=1)
    add(database_path, 2, "2026-09-10", practice_type="mixed")
    add(database_path, 3, "2026-09-10", practice_type="mixed")
    data = calendar(client, 2026, 9).json["data"]
    assert data == {"year": 2026, "month": 9, "days": ["2026-09-10"]}


def test_month_without_activity_returns_an_empty_list(client, database_path, learner):
    add(database_path, 1, "2026-09-10")
    assert calendar(client, 2026, 8).json["data"] == {"year": 2026, "month": 8, "days": []}


def test_only_the_requested_month_is_returned_with_inclusive_boundaries(client, database_path, learner):
    for index, day in enumerate(["2026-07-31", "2026-08-01", "2026-08-15", "2026-08-31", "2026-09-01"], 1):
        add(database_path, index, day)
    assert calendar(client, 2026, 8).json["data"]["days"] == ["2026-08-01", "2026-08-15", "2026-08-31"]


@pytest.mark.parametrize("year, month, last", [(2024, 2, "2024-02-29"), (2023, 2, "2023-02-28"),
                                               (2025, 12, "2025-12-31"), (2025, 4, "2025-04-30")])
def test_last_day_of_every_kind_of_month_is_included(client, database_path, learner, year, month, last):
    add(database_path, 1, last)
    assert calendar(client, year, month).json["data"]["days"] == [last]


def test_other_learners_activity_is_never_included(client, database_path, learner):
    _insert_user(database_path, user_id=2)
    add(database_path, 1, "2026-09-05", user_id=2)
    add(database_path, 2, "2026-09-06")
    assert calendar(client, 2026, 9).json["data"]["days"] == ["2026-09-06"]


def test_past_months_before_the_first_activity_are_allowed(client, database_path, learner):
    add(database_path, 1, "2026-09-10")
    assert calendar(client, 1999, 1).status_code == 200


def test_current_month_is_allowed_and_next_month_is_a_future_month(client, learner):
    assert calendar(client, 2026, 9).status_code == 200
    assert_fields(calendar(client, 2026, 10), {"month": "future_month"})


@pytest.mark.parametrize("year, month", [(2026, 12), (2027, 1), (2027, 9), (3000, 6)])
def test_every_later_month_is_a_future_month(client, learner, year, month):
    assert_fields(calendar(client, year, month), {"month": "future_month"})


def test_current_month_follows_the_ho_chi_minh_clock(client, learner, monkeypatch):
    # 2026-09-30 18:30 UTC is already October in Asia/Ho_Chi_Minh.
    monkeypatch.setattr(clock, "now",
                        lambda: datetime(2026, 9, 30, 18, 30, tzinfo=timezone.utc).astimezone(VN))
    assert calendar(client, 2026, 10).status_code == 200
    assert_fields(calendar(client, 2026, 11), {"month": "future_month"})


@pytest.mark.parametrize("query, fields", [
    ("", {"year": "required", "month": "required"}),
    ("?year=2026", {"month": "required"}),
    ("?month=9", {"year": "required"}),
    ("?year=&month=%20", {"year": "required", "month": "required"}),
    ("?year=abc&month=9", {"year": "invalid_format"}),
    ("?year=2026&month=9.5", {"month": "invalid_format"}),
    ("?year=20 26&month=9", {"year": "invalid_format"}),
    ("?year=2026&month=0", {"month": "invalid_value"}),
    ("?year=2026&month=13", {"month": "invalid_value"}),
    ("?year=2026&month=-1", {"month": "invalid_value"}),
    ("?year=99&month=1", {"year": "invalid_value"}),
    ("?year=10000&month=1", {"year": "invalid_value"}),
    ("?year=" + "9" * 5000 + "&month=1", {"year": "invalid_value"}),
    ("?year=x&month=99", {"year": "invalid_format", "month": "invalid_value"}),
])
def test_invalid_query_parameters_report_field_codes(client, learner, query, fields):
    assert_fields(client.get(URL + query), fields)


def test_invalid_month_is_not_also_reported_as_future(client, learner):
    assert_fields(calendar(client, 2030, 13), {"month": "invalid_value"})


def test_endpoint_is_read_only(client, database_path, learner):
    add(database_path, 1, "2026-09-10")
    with sqlite3.connect(database_path) as db:
        before = [db.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
                  for t in ("practice_sessions", "user_learning_state", "users")]
    calendar(client, 2026, 9)
    calendar(client, 2030, 1)
    with sqlite3.connect(database_path) as db:
        after = [db.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
                 for t in ("practice_sessions", "user_learning_state", "users")]
    assert before == after


def test_write_methods_are_not_allowed(client, learner):
    assert client.post(URL + "?year=2026&month=9").status_code == 405


def test_completed_practice_shows_up_on_its_ho_chi_minh_date(client, database_path, monkeypatch):
    # 2026-09-20 18:00 UTC is 2026-09-21 01:00 in Asia/Ho_Chi_Minh.
    monkeypatch.setattr(clock, "now",
                        lambda: datetime(2026, 9, 20, 18, 0, tzinfo=timezone.utc).astimezone(VN))
    _practice_setup(client, database_path)
    run = _start_normal(client)
    assert _submit(client, run["practice_run_id"], _answers()).status_code == 200
    assert calendar(client, 2026, 9).json["data"]["days"] == ["2026-09-21"]
