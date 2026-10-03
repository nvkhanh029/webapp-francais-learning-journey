import { useEffect, useState } from "react";

// State of a "429 rate_limited" answer: the wait the server asked for (ApiError.retryAfterSeconds, from the
// Retry-After header, FD §6.7) counted down once per second. While `blocked` the form disables its submit button.
// Without a known wait there is no countdown: the form shows the generic message and stays usable.
//
//   start(retryAfterSeconds)  a 429 arrived (seconds may be null)
//   message                   { key, params } for t(), or null when no rate limit applies
//   blocked                   true while the countdown runs
export default function useRateLimit() {
  const [limit, setLimit] = useState(null); // null, or { until: ms timestamp | null }
  const [now, setNow] = useState(0);
  const until = limit ? limit.until : null;

  useEffect(() => {
    if (until === null) return undefined;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= until) setLimit(null);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [until]);

  function start(retryAfterSeconds) {
    const current = Date.now();
    setNow(current);
    setLimit({ until: retryAfterSeconds ? current + retryAfterSeconds * 1000 : null });
  }

  const remaining = until === null ? 0 : Math.max(0, Math.ceil((until - now) / 1000));
  let message = null;
  if (limit) message = rateLimitMessage(until === null ? null : remaining);
  return { start, message, blocked: until !== null && remaining > 0 };
}

// Whole seconds up to a minute, then whole minutes (rounded up). null means "no wait known".
export function rateLimitMessage(seconds) {
  if (!seconds) return { key: "auth.rateLimited" };
  return seconds >= 60
    ? { key: "auth.rateLimitedMinutes", params: { n: Math.ceil(seconds / 60) } }
    : { key: "auth.rateLimitedSeconds", params: { n: seconds } };
}
