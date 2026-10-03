import { useCallback, useEffect, useState } from "react";

import { getActivityCalendar } from "../api/dashboardApi.js";
import { monthKey, parseIsoDate, shiftMonth } from "../utils/dateUtils.js";

// Owns the Learning Activity Calendar month and its own request, separately from the Dashboard
// aggregate, so switching months does not reload the rest of the Dashboard (FD §5.6, API §8.2).
//
// `todayDate` is the Dashboard's server `today.date` (API §8.1). It is the only "now" the calendar
// uses: the displayed month opens on the server's current month and a future month is never
// requested, because the API rejects it with `future_month` (API §8.2).
const FALLBACK_MONTH = { year: 1970, month: 0 };
const NO_MONTH = null;

export default function useActivityCalendar(todayDate) {
  const today = parseIsoDate(todayDate);
  // The server month as a comparable key, or null while there is no usable today value.
  const currentKey = today ? monthKey(today) : NO_MONTH;

  const [view, setView] = useState(() => (today ? { year: today.year, month: today.month } : FALLBACK_MONTH));
  // `monthKey(view)` plus `reloadCount` identify the current request, so loading is derived by
  // comparison instead of a synchronous setState inside the effect.
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: NO_MONTH, data: null, error: null });

  // When the server month changes (a reload crossing midnight) return to it rather than staying on a
  // month that may now be in the past or the future. Adjusting state during render, the pattern the
  // codebase already uses for this in NavigationBar, avoids a request for the wrong month.
  const [knownToday, setKnownToday] = useState(todayDate);
  if (todayDate !== knownToday) {
    setKnownToday(todayDate);
    if (today) setView({ year: today.year, month: today.month });
  }

  const requestedKey = `${monthKey(view)}-${reloadCount}`;

  useEffect(() => {
    let active = true;
    getActivityCalendar(view.year, view.month + 1)
      .then((payload) => {
        if (active) setResult({ key: requestedKey, data: payload, error: null });
      })
      .catch((cause) => {
        if (active) setResult({ key: requestedKey, data: null, error: cause });
      });
    return () => {
      active = false;
    };
    // requestedKey encodes view and reloadCount, which are the real inputs of this request.
  }, [requestedKey, view, reloadCount]);

  // Past months are always allowed (API §8.2); the current month is the upper bound.
  const goToPreviousMonth = useCallback(() => setView((month) => shiftMonth(month, -1)), []);

  const goToNextMonth = useCallback(() => {
    setView((month) => (currentKey !== NO_MONTH && monthKey(month) >= currentKey ? month : shiftMonth(month, 1)));
  }, [currentKey]);

  const reload = useCallback(() => setReloadCount((current) => current + 1), []);

  const isLoading = result.key !== requestedKey;

  return {
    year: view.year,
    month: view.month,
    isCurrentMonth: currentKey !== NO_MONTH && monthKey(view) === currentKey,
    data: isLoading ? null : result.data,
    isLoading,
    error: isLoading ? null : result.error,
    goToPreviousMonth,
    goToNextMonth,
    reload,
  };
}
