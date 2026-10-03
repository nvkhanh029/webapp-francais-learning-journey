"""The single server clock: every date-sensitive value comes from here.

API Contract Section 4.10 fixes one timezone, `Asia/Ho_Chi_Minh`, for
`completed_at`, `activity_date`, streaks, the Activity Calendar and the Dashboard
`today` value. Services call `clock.now()` / `clock.today()` and never the
process-local timezone (`date.today()`, `datetime.now().astimezone()`), so tests
replace this one helper.

`Asia/Ho_Chi_Minh` is a fixed UTC+07:00 with no daylight saving (API §4.10), so
a fixed offset is used instead of `zoneinfo`; that keeps the app independent of
a system tz database (Windows needs the extra `tzdata` package otherwise).
"""
from datetime import datetime, timedelta, timezone

TIMEZONE_NAME = "Asia/Ho_Chi_Minh"
_TIMEZONE = timezone(timedelta(hours=7), TIMEZONE_NAME)


def now():
    """Current instant as an aware datetime in Asia/Ho_Chi_Minh."""
    return datetime.now(_TIMEZONE)


def today():
    """Current calendar date in Asia/Ho_Chi_Minh (same clock as `now()`)."""
    return now().date()
