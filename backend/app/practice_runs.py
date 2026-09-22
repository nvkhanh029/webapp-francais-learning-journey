"""Per-application in-memory run storage, NOT a completed Practice feature."""
from threading import RLock
from uuid import uuid4


def _snapshot(run):
    if run is None:
        return None
    return {**run, "selected_question_ids": list(run["selected_question_ids"])}


class InMemoryPracticeRunStore:
    """Single-process MVP infrastructure; restart loses all runs.

    The Practice service MUST hold `with store.lock():` across ownership and
    submitted checks, successful DB commit, then mark_submitted(). The store
    alone does not authorize a user, score answers, or write Practice history.
    """

    def __init__(self):
        self._runs = {}
        self._lock = RLock()

    def create(self, *, user_id, practice_type, learning_unit_id, selected_question_ids):
        if type(user_id) is not int or user_id <= 0:
            raise ValueError("A positive integer user_id is required.")
        if practice_type not in ("normal", "mixed"):
            raise ValueError("practice_type must be normal or mixed.")
        if practice_type == "normal" and (type(learning_unit_id) is not int or learning_unit_id <= 0):
            raise ValueError("Normal Practice requires a positive learning_unit_id.")
        if practice_type == "mixed" and learning_unit_id is not None:
            raise ValueError("Mixed Practice requires learning_unit_id=None.")
        ids = list(selected_question_ids)
        if not ids or any(type(item) is not int or item <= 0 for item in ids):
            raise ValueError("selected_question_ids must be non-empty positive integers.")
        if len(set(ids)) != len(ids):
            raise ValueError("selected_question_ids must be distinct.")
        run_id = str(uuid4())
        run = {"practice_run_id": run_id, "user_id": user_id,
               "practice_type": practice_type, "learning_unit_id": learning_unit_id,
               "selected_question_ids": ids, "submitted": False}
        with self._lock:
            self._runs[run_id] = run
            return _snapshot(run)

    def get(self, run_id):
        with self._lock:
            return _snapshot(self._runs.get(run_id))

    def mark_submitted(self, run_id):
        """Call only after successful history commit under the service's lock."""
        with self._lock:
            run = self._runs.get(run_id)
            if run is None:
                return None
            run["submitted"] = True
            return _snapshot(run)

    def lock(self):
        return self._lock
