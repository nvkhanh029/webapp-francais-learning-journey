"""Storage primitive tests, NOT tests of the unimplemented Practice endpoint."""
from concurrent.futures import ThreadPoolExecutor

import pytest

from app.practice_runs import InMemoryPracticeRunStore


def create(store, ids=None):
    """Create and return a run in the given store."""
    return store.create(user_id=1, practice_type="normal", learning_unit_id=1,
                        selected_question_ids=[1,2] if ids is None else ids)


# --- Snapshot isolation -----------------------------------------------------

@pytest.mark.parametrize("method",["create","get","mark_submitted"])
def test_snapshot_does_not_share_mutable_ids(method):
    """Confirm snapshots never share the mutable selected-id list."""
    store = InMemoryPracticeRunStore()
    original_ids = [1,2]
    initial = create(store, original_ids)
    original_ids.append(700)
    snapshot = initial if method == "create" else getattr(store,method)(initial["practice_run_id"])
    snapshot["selected_question_ids"].append(999)
    assert store.get(initial["practice_run_id"])["selected_question_ids"] == [1,2]


def test_store_instances_isolated():
    """Confirm separate store instances do not share runs."""
    first,second = InMemoryPracticeRunStore(),InMemoryPracticeRunStore()
    run = create(first)
    assert second.get(run["practice_run_id"]) is None


# --- Locking and finalization safety ----------------------------------------

def test_lock_serializes_example_finalization_check():
    """Confirm the lock serializes a finalization check to one write."""
    store = InMemoryPracticeRunStore(); run = create(store); writes = []
    def finish():
        """Record one synthetic write and mark the run submitted once."""
        with store.lock():
            current = store.get(run["practice_run_id"])
            if current["submitted"]: return
            writes.append("synthetic successful persistence")
            store.mark_submitted(run["practice_run_id"])
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(lambda _: finish(), range(2)))
    assert len(writes) == 1


def test_failed_example_persistence_does_not_mark_run():
    """Confirm a failed persistence never marks the run submitted."""
    store = InMemoryPracticeRunStore(); run = create(store)
    with pytest.raises(RuntimeError):
        with store.lock():
            raise RuntimeError("synthetic failure before mark_submitted")
    assert not store.get(run["practice_run_id"])["submitted"]


# --- Input validation -------------------------------------------------------

@pytest.mark.parametrize("ids", [[],[1,1],[True],[0],[-1],["1"]])
def test_invalid_id_lists(ids):
    """Confirm invalid selected-id lists are rejected."""
    with pytest.raises(ValueError): create(InMemoryPracticeRunStore(),ids)
