"""
Contract test for GET /runs/{run_id}/cohort.

This is the first test in the repo — CLAUDE.md says "no test suite," but
this endpoint is the backbone every phase-4 view will read from, and the
metric registry keys are exactly the kind of thing CLAUDE.md warns breaks
charts silently if renamed without noticing.
"""

import json
from pathlib import Path

from fastapi.testclient import TestClient

from main import app
from routers import runs as runs_router
from runs.service import RunService
from runs.metrics import METRICS
from workspace.local import LocalWorkspace

RUN_ID = "test-run"

SUMMARY_TEXT = """Project: AUTOMATIC
Crystal: DEFAULT
Sequence length: 0
Wavelength: NATIVE (0.97857)
Sweep: SWEEP1
Files /work/example_master.h5
Images: 1 to 1800
Beam 120.00 115.61 => 120.06 115.40
Distance 140.00 => 140.15
Date: Thu Jan  1 00:00:01 1970
For AUTOMATIC/DEFAULT/NATIVE:
High resolution limit                           1.95    5.29    1.95
Low resolution limit                           46.17   46.18    1.98
Completeness                                  100.0   100.0    97.5
Multiplicity                                   13.3    12.0    11.6
I/sigma                                         5.0    20.1     0.3
Rmerge(I+/-)                                  0.240   0.141   3.779
CC half                                       0.993   0.988   0.322
Anomalous completeness                         99.9   100.0    97.4
Anomalous multiplicity                          7.1     7.0     6.0
Cell:  46.170  74.269 110.799  90.000  90.000  90.000
Spacegroup: P 21 21 21
"""


def _write_sample(root: Path, dataset: str, sample: str, variants: str, peak_memory: float = 512.0, runtime: float = 10.0):
    for variant in variants:
        variant_dir = root / RUN_ID / dataset / "data" / sample / variant
        variant_dir.mkdir(parents=True, exist_ok=True)
        (variant_dir / "xia2-summary.dat").write_text(SUMMARY_TEXT)
        (variant_dir / "peak_memory-integrate.txt").write_text(
            f"mprofile-integrate.dat\t{peak_memory} MiB"
        )
        (variant_dir / "xia2-timing.json").write_text(json.dumps([
            {
                "short_command": "dials.integrate",
                "time_start": 0.0,
                "time_end": runtime,
                "runtime": runtime,
            }
        ]))


def _build_fixture_workspace(tmp_path: Path) -> Path:
    (tmp_path / RUN_ID).mkdir()
    (tmp_path / RUN_ID / "good_master_files.txt").write_text("")

    _write_sample(tmp_path, "complete-ds", "sample-1", "AB")
    _write_sample(tmp_path, "partial-ds", "sample-1", "A")
    # Different peak-memory/runtime per sample so the cohort join can be
    # caught duplicating one sample's value across the other's row — the
    # multi-sample collision bug this phase (2b) fixes.
    _write_sample(tmp_path, "multi-ds", "sample-1", "AB", peak_memory=100.0, runtime=10.0)
    _write_sample(tmp_path, "multi-ds", "sample-2", "AB", peak_memory=200.0, runtime=20.0)

    return tmp_path


def test_cohort_shape(tmp_path, monkeypatch):
    root = _build_fixture_workspace(tmp_path)
    monkeypatch.setattr(
        runs_router, "service", RunService(workspace=LocalWorkspace(root=str(root)))
    )

    client = TestClient(app)
    response = client.get(f"/runs/{RUN_ID}/cohort")

    assert response.status_code == 200
    body = response.json()

    assert body["coverage"] == {
        "total": 4,
        "complete": 3,
        "missing_a": 0,
        "missing_b": 1,
    }

    rows_by_key = {(r["dataset"], r["sample"]): r for r in body["rows"]}
    assert set(rows_by_key) == {
        ("complete-ds", "sample-1"),
        ("partial-ds", "sample-1"),
        ("multi-ds", "sample-1"),
        ("multi-ds", "sample-2"),
    }

    partial = rows_by_key[("partial-ds", "sample-1")]
    assert partial["status"] == "missing_b"
    assert partial["A"] is not None
    assert partial["B"] is None

    complete = rows_by_key[("complete-ds", "sample-1")]
    assert complete["A"]["cc_half"] == {"overall": 0.993, "inner": 0.988, "outer": 0.322}
    assert complete["A"]["spacegroup"] == "P 21 21 21"
    assert complete["A"]["peak_memory"] == 512.0

    # The multi-sample collision bug (TODO section 1, fixed in phase 2b): each
    # sample must get its own memory/runtime, not one dataset-wide value
    # duplicated across both rows.
    multi_1 = rows_by_key[("multi-ds", "sample-1")]
    multi_2 = rows_by_key[("multi-ds", "sample-2")]
    assert multi_1["A"]["peak_memory"] == 100.0
    assert multi_2["A"]["peak_memory"] == 200.0
    assert multi_1["A"]["cumulative_runtime"] == 10.0
    assert multi_2["A"]["cumulative_runtime"] == 20.0

    # The registry's keys are read by the frontend's metric picker (phase 4) —
    # a rename here needs to be a deliberate, grep-checked decision.
    assert {m["key"] for m in body["metrics"]} == {m["key"] for m in METRICS}


def test_cohort_404_on_unknown_run():
    client = TestClient(app)
    response = client.get("/runs/does-not-exist/cohort")
    assert response.status_code == 404


def test_memory_404_on_unknown_run():
    # The section-1 bug this closes: unknown run used to return `200 []`.
    client = TestClient(app)
    response = client.get("/runs/does-not-exist/memory")
    assert response.status_code == 404
