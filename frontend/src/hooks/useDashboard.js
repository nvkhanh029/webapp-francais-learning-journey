import { useCallback, useEffect, useState } from "react";

import { getDashboard } from "../api/dashboardApi.js";

// Owns the Dashboard aggregate request (FD §5.6): { data, isLoading, error, reload() }.
//
// GET /api/v1/me/dashboard (API §8.1) is the only source of Dashboard truth. Module progress,
// current/longest streak, Continue Learning, Mixed Practice availability, the Review Later count,
// the recent-practice subset and the server `today` value all arrive in this one response and are
// rendered as received: React never recomputes them from database-like data (FD §3.3, FD §8.6).
export default function useDashboard() {
  // `requestId` identifies the current request; `result` carries the answer of whichever request
  // finished. Loading is derived by comparing them, so starting a request never has to setState
  // synchronously inside the effect. `null` never equals a real request id, so the first render is
  // a loading state rather than an empty page.
  const [requestId, setRequestId] = useState(0);
  const [result, setResult] = useState({ requestId: null, data: null, error: null });

  useEffect(() => {
    // `active` drops the answer of a request whose effect was already cleaned up, so a StrictMode
    // double-mount cannot apply an outdated response (StrictMode remounts every effect in dev).
    let active = true;
    getDashboard()
      .then((payload) => {
        if (active) setResult({ requestId, data: payload, error: null });
      })
      .catch((cause) => {
        if (active) setResult({ requestId, data: null, error: cause });
      });
    return () => {
      active = false;
    };
  }, [requestId]);

  const reload = useCallback(() => setRequestId((current) => current + 1), []);

  // A newer requestId means this result is stale: the page is loading again.
  const isLoading = result.requestId !== requestId;

  return {
    data: isLoading ? null : result.data,
    isLoading,
    error: isLoading ? null : result.error,
    reload,
  };
}
