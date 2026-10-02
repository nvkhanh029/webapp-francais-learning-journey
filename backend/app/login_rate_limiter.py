"""In-memory failed-login counter (API Contract 4.7, Backend Structure 9.6.1).

Server-side process memory, no Redis. Keys are opaque strings chosen by the
caller (normalized email, client address); the counter never looks anything up
in the database, so the behaviour is identical for an existing and an unknown
email and cannot reveal which one it is.
"""
import math
import threading
import time
from collections import defaultdict, deque

_PRUNE_ABOVE = 1000


class InMemoryLoginRateLimiter:
    def __init__(self, window_seconds, clock=time.monotonic):
        self._window = window_seconds
        self._clock = clock
        self._failures = defaultdict(deque)
        self._lock = threading.Lock()

    def _recent(self, key, now):
        failures = self._failures.get(key)
        if failures is None:
            return None
        while failures and now - failures[0] >= self._window:
            failures.popleft()
        if not failures:
            del self._failures[key]
            return None
        return failures

    def retry_after(self, key, max_attempts):
        """Seconds until another attempt is allowed for `key`, or 0 when allowed."""
        with self._lock:
            now = self._clock()
            failures = self._recent(key, now)
            if failures is None or len(failures) < max_attempts:
                return 0
            return max(1, math.ceil(self._window - (now - failures[0])))

    def record_failure(self, key):
        with self._lock:
            now = self._clock()
            self._failures[key].append(now)
            if len(self._failures) > _PRUNE_ABOVE:
                for stale in list(self._failures):
                    self._recent(stale, now)

    def reset(self, key):
        with self._lock:
            self._failures.pop(key, None)
