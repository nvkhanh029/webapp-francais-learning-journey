"""One server clock in Asia/Ho_Chi_Minh (API Contract Section 4.10).

The instants below are chosen so that the UTC date and the Asia/Ho_Chi_Minh
date differ: a process-local or UTC clock would store the wrong activity date.
"""
import re
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

from app import clock
from tests.test_practice import _answers, _learn_unit, _practice_setup, _start_normal, _submit

pytestmark = pytest.mark.flask

VN = timezone(timedelta(hours=7))
# 2026-09-30 18:30 UTC == 2026-10-01 01:30 in Asia/Ho_Chi_Minh.
LATE_UTC_EVENING = datetime(2026, 9, 30, 18, 30, 15, tzinfo=timezone.utc)


@pytest.fixture
def frozen_clock(monkeypatch):
    monkeypatch.setattr(clock, "now", lambda: LATE_UTC_EVENING.astimezone(VN))


def test_clock_reports_fixed_ho_chi_minh_offset():
    now = clock.now()
    assert clock.TIMEZONE_NAME == "Asia/Ho_Chi_Minh"
    assert now.utcoffset() == timedelta(hours=7)
    assert now.isoformat().endswith("+07:00")


def test_today_is_the_date_of_now(frozen_clock):
    assert clock.today().isoformat() == "2026-10-01"


def test_practice_completion_uses_ho_chi_minh_date_and_offset(client, database_path, frozen_clock):
    _practice_setup(client, database_path)
    run = _start_normal(client)
    response = _submit(client, run["practice_run_id"], _answers())
    assert response.status_code == 200
    with sqlite3.connect(database_path) as db:
        completed_at, activity_date = db.execute(
            "SELECT completed_at, activity_date FROM practice_sessions").fetchone()
    assert completed_at.startswith("2026-10-01T01:30:15")
    assert completed_at.endswith("+07:00")
    assert activity_date == "2026-10-01"


def test_streak_uses_the_same_clock_as_activity_date(client, database_path, frozen_clock):
    _practice_setup(client, database_path)
    run = _start_normal(client)
    _submit(client, run["practice_run_id"], _answers())
    streak = client.get("/api/v1/me/dashboard").json["data"]["streak"]
    assert streak == {"current": 1, "longest": 1, "active_today": True}


def test_learner_state_and_registration_timestamps_use_the_server_clock(client, database_path, frozen_clock):
    response = client.post("/api/v1/auth/register",
                           json={"email": "clock@example.test", "password": "long-enough-pw"})
    assert response.status_code == 201
    with sqlite3.connect(database_path) as db:
        (created_at,) = db.execute("SELECT created_at FROM users").fetchone()
        db.execute("INSERT INTO learning_units (id, unit_type, slug, title_fr) "
                   "VALUES (1, 'grammar', 'clock-unit', 'Fixture')")
    assert created_at == "2026-10-01T01:30:15+07:00"
    assert client.post("/api/v1/me/learning-units/clock-unit/open").status_code == 200
    with sqlite3.connect(database_path) as db:
        (opened_at,) = db.execute("SELECT last_opened_at FROM user_learning_state").fetchone()
    assert opened_at == "2026-10-01T01:30:15+07:00"


def test_no_module_bypasses_the_clock_helper():
    """Guard against re-introducing a process-local timezone in application code."""
    forbidden = re.compile(r"date\.today\(|datetime\.now\(|datetime\.utcnow\(|\.astimezone\(")
    offenders = []
    for path in sorted(Path(clock.__file__).parent.rglob("*.py")):
        if path.name == "clock.py":
            continue
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if forbidden.search(line):
                offenders.append(f"{path.name}:{number}: {line.strip()}")
    assert offenders == []
