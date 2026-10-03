// Pure date/time helpers for Dashboard date presentation (FD §5.2, FD §7.7).
//
// The whole application runs on one server clock in `Asia/Ho_Chi_Minh` and every date-sensitive
// value is serialized with that offset (API §4.10). These helpers therefore read the calendar and
// clock fields *as written on the wire* and never convert them through the browser timezone:
// converting would let the browser's offset silently move a session to a neighbouring day, and
// the browser clock must never decide "today" (FD §13.32).

import { dayMonth, localeFor, t } from "../i18n/index.js";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

// A calendar date as { year, month, day } with `month` 0-based, matching the JS Date convention.
// Day arithmetic below runs through Date.UTC so it cannot be shifted by the browser timezone.
function parts(year, month, day) {
  return { year, month, day };
}

// Parse a `YYYY-MM-DD` value (today.date, a calendar day) into { year, month, day }.
// Returns null for anything unparsable so callers can fall back instead of rendering "NaN".
export function parseIsoDate(value) {
  const match = typeof value === "string" ? ISO_DATE.exec(value) : null;
  return match ? parts(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

// Parse an ISO 8601 instant such as `2026-09-20T21:15:00+07:00` into its wall-clock fields at the
// serialized offset. The offset is intentionally not applied or subtracted (see the file header).
export function parseIsoInstant(value) {
  const match = typeof value === "string" ? ISO_INSTANT.exec(value) : null;
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return { ...parts(Number(year), Number(month) - 1, Number(day)), hour, minute };
}

export function isSameDate(a, b) {
  return Boolean(a) && Boolean(b) && a.year === b.year && a.month === b.month && a.day === b.day;
}

export function addDays(date, amount) {
  const shifted = new Date(Date.UTC(date.year, date.month, date.day + amount));
  return parts(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

// Shift a 0-based month by `offset`, normalising the year. Month keys stay comparable as plain
// integers so "is this month later than the current one?" is a single numeric check.
export function shiftMonth({ year, month }, offset) {
  const key = year * 12 + month + offset;
  return { year: Math.floor(key / 12), month: key % 12 };
}

export function monthKey({ year, month }) {
  return year * 12 + month;
}

// "12 tháng 5" / "12 May", with the year appended when the date is not in the current server year
// (FD §9.4). Formatting uses local noon so the calendar day cannot shift under the runtime timezone.
export function dayMonthLabel(date, currentYear) {
  const showYear = date.year !== currentYear;
  if (!showYear) return dayMonth(date.day, date.month, date.year);
  return new Intl.DateTimeFormat(localeFor(), { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(date.year, date.month, date.day, 12),
  );
}

// Presentation of one Recent Practice `completed_at`: the machine-readable value for <time datetime>
// plus the localized label. `today` is the Dashboard's `today.date` string (API §8.1); "today" and
// "yesterday" are decided from that server value, never from the browser clock, and the label always
// ends with the time (FD §7.7, FD §9.4).
export function formatActivityDate(instant, today) {
  const parsed = parseIsoInstant(instant);
  const currentDay = parseIsoDate(today);
  if (!parsed || !currentDay) return null;
  const time = `${parsed.hour}:${parsed.minute}`;
  let label;
  if (isSameDate(parsed, currentDay)) {
    label = t("time.todayAt", { time });
  } else if (isSameDate(parsed, addDays(currentDay, -1))) {
    label = t("time.yesterdayAt", { time });
  } else {
    label = t("time.dateAt", { date: dayMonthLabel(parsed, currentDay.year), time });
  }
  return { dateTime: instant, label };
}
