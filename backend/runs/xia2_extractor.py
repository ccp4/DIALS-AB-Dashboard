from pathlib import Path
from workspace.base import Workspace
import json
import logging
import re
from bisect import bisect_left

from runs.dataset_id import DatasetSampleId

logger = logging.getLogger(__name__)


def _dataset_sample_path(run_id: str, dataset: str) -> str:
    """`dataset` is a composite `"dataset/sample"` id — resolve it to the sample's directory."""
    return DatasetSampleId.parse(dataset).path(run_id)

def extract_xia2_datasets(workspace: Workspace, run_id: str) -> list:
    """
    Every selectable `"dataset/sample"` id for a run — always composite,
    including single-sample datasets.

    Derived from `datasets.txt` (path shape
    `.../{dataset}/data/{sample}_master.h5`). Each candidate is checked with
    `exists()`, since some manifest entries have no local `data/{sample}`
    directory (aborted/incomplete processing).
    """
    manifest = workspace.read_text(f"{run_id}/datasets.txt").splitlines()

    result = []
    for line in manifest:
        master_path = Path(line.strip())
        dataset = master_path.parent.parent.name
        sample = master_path.name.removesuffix("_master.h5")
        if workspace.exists(f"{run_id}/{dataset}/data/{sample}"):
            result.append(f"{dataset}/{sample}")

    return result

def extract_xia2_build_info(workspace: Workspace, run_id: str, datasets: list) -> dict:
    """
    The DIALS build (version + git hash) used for A and B, e.g.
    `"DIALS 3.dev.1493-gf324578a1"` — logged identically in every sample's
    `xia2-debug.txt`. Checks each dataset/sample's `{A,B}/xia2-debug.txt`
    directly, stopping once both variants are found. `datasets` is
    `extract_xia2_datasets`'s output.
    """
    result = {"A": None, "B": None}

    for dataset in datasets:
        if all(result.values()):
            break

        for variant in ("A", "B"):
            if result[variant] is not None:
                continue

            debug_path = f"{_dataset_sample_path(run_id, dataset)}/{variant}/xia2-debug.txt"
            if not workspace.exists(debug_path):
                continue

            for line in workspace.read_text(debug_path).splitlines():
                if line.startswith("DIALS ") and "-g" in line:
                    result[variant] = line.strip()
                    break

    return result

_SUMMARY_METRIC_LABELS = {
    "High resolution limit": "high_resolution_limit",
    "Low resolution limit": "low_resolution_limit",
    "Completeness": "completeness",
    "Multiplicity": "multiplicity",
    "I/sigma": "i_over_sigma",
    "Rmerge(I+/-)": "r_merge",
    "CC half": "cc_half",
    "Anomalous completeness": "anomalous_completeness",
    "Anomalous multiplicity": "anomalous_multiplicity",
}

def _parse_xia2_summary(text: str) -> dict:
    """Matches fields by label, not line position, even though the format is
    completely regular (460/460 files checked, 22 lines each)."""
    parsed = {}

    for line in text.splitlines():
        stripped = line.strip()

        if stripped.startswith("Cell:"):
            parsed["cell"] = [float(v) for v in stripped[len("Cell:"):].split()]
            continue

        if stripped.startswith("Spacegroup:"):
            parsed["spacegroup"] = stripped[len("Spacegroup:"):].strip()
            continue

        parts = re.split(r"\s{2,}", stripped)
        key = _SUMMARY_METRIC_LABELS.get(parts[0])

        if key and len(parts) == 4:
            overall, inner, outer = (float(v) for v in parts[1:])
            parsed[key] = {"overall": overall, "inner": inner, "outer": outer}

    return parsed

def extract_xia2_summary(workspace: Workspace, run_id: str) -> list[dict]:
    """
    One record per (dataset, sample), each carrying A's and B's parsed
    `xia2-summary.dat` (or None where that variant is missing) — the
    per-sample granularity the cohort table is built from.
    """
    records = []

    for composite_id in extract_xia2_datasets(workspace, run_id):
        id_ = DatasetSampleId.parse(composite_id)
        record = {"dataset": id_.dataset, "sample": id_.sample, "A": None, "B": None}

        for variant in ("A", "B"):
            path = f"{id_.path(run_id)}/{variant}/xia2-summary.dat"
            if workspace.exists(path):
                record[variant] = _parse_xia2_summary(workspace.read_text(path))

        records.append(record)

    return records

def extract_xia2_dataset_memplot(workspace: Workspace, run_id:str, dataset: str):
    """Memory-over-time trace for a sample, from mprofile.dat's
    `MEM <mem_mb> <timestamp>` lines — reshaped to `[time, mem]` pairs for charting."""
    data_src = workspace.resolve(_dataset_sample_path(run_id, dataset))
    files = workspace.list_files(data_src)
    wanted = ["mprofile.dat"]

    res = {"A": [],"B": []}

    for f in files:
        if f.name not in wanted:
            continue

        samples = []
        text = workspace.read_text(f)
        for line in text.splitlines():
            
            parts = line.split()
            if len(parts) == 3 and parts[0] == "MEM":
                samples.append([
                    float(parts[2]),
                    float(parts[1])
                ])
        res[f.parent.name] = samples
    return res

def extract_xia2_timing(workspace: Workspace, run_id: str, dataset: str):
    """Builds the path directly for each variant, from `{A,B}/xia2-timing.json`. Called once per sample."""
    id_ = DatasetSampleId.parse(dataset)
    res = {"A": [], "B": []}

    for variant in ("A", "B"):
        path = f"{id_.path(run_id)}/{variant}/xia2-timing.json"
        if not workspace.exists(path):
            continue

        try:
            timing = json.loads(workspace.read_text(path))
        except json.JSONDecodeError:
            logger.warning("Skipping corrupt JSON at %s", path)
            continue

        events = []

        for item in timing:
            if "time_start" not in item or "time_end" not in item or "runtime" not in item:
                logger.warning("Skipping malformed timing event in %s: %r", path, item)
                continue

            events.append({
                "command": item["short_command"],
                "time_start": float(item["time_start"]),
                "time_end": float(item["time_end"]),
                "runtime": float(item["runtime"])
            })

        res[variant] = events

    return res

def extract_xia2_cumulative_timing(workspace: Workspace, run_id: str):
    """Cumulative runtime per dataset, summed from `extract_xia2_timing`'s
    events. Shape: `{"A": [[dataset, value], ...], "B": [...]}`."""
    res = {"A": [],"B": []}

    for composite_id in extract_xia2_datasets(workspace=workspace, run_id=run_id):
        timings = extract_xia2_timing(workspace=workspace, run_id=run_id, dataset=composite_id)

        for process in ("A", "B"):
            total = 0

            for command in timings.get(process, []):
                total += command.get("runtime", 0)

            res[process].append([composite_id, total])

    return res

def extract_xia2_unit_cell_space(workspace: Workspace, run_id: str, dataset: str) -> dict:
    """Unit cell and spacegroup for each variant, both parsed from a single
    read of `xia2-summary.dat`."""
    data_src = workspace.resolve(_dataset_sample_path(run_id, dataset))
    files = workspace.list_files(data_src)
    wanted = ["xia2-summary.dat"]

    unit_cell = {"A": None, "B": None}
    space_group = {"A": None, "B": None}

    for f in files:
        if f.name not in wanted:
            continue

        for line in workspace.read_text(f).splitlines():
            if "Cell:" in line and unit_cell[f.parent.name] is None:
                unit_cell[f.parent.name] = line
            elif "Spacegroup:" in line and space_group[f.parent.name] is None:
                space_group[f.parent.name] = line

    return {"unit_cell": unit_cell, "space_group": space_group}

def extract_xia2_resolution(workspace: Workspace, run_id: str) -> dict:
    return _extract_json_files(
        workspace,
        run_id,
         [
            "dials.estimate_resolution-A.json",
            "dials.estimate_resolution-B.json"
        ]
    )

def extract_xia2_dataset_resolution(workspace: Workspace, run_id: str, dataset: str) -> dict:
    return extract_xia2_resolution(workspace=workspace, run_id=_dataset_sample_path(run_id, dataset))

def extract_xia2_dataset_merging_stats(workspace: Workspace, run_id: str, dataset: str) -> dict:
    return extract_xia2_merging_stats(workspace=workspace, run_id=_dataset_sample_path(run_id, dataset))

def extract_xia2_merging_stats(workspace: Workspace, run_id: str) -> dict:
    return _extract_json_files(
        workspace,
        run_id,
        ["xia2.compare_merging_stats.json"],
    )

def extract_xia2_memory(workspace: Workspace, run_id: str) -> dict:
    return _extract_memory_files(workspace, run_id, "peak_memory-integrate.txt")

def _sample_key(path: Path) -> str:
    """Composite `"dataset/sample"` id (parts[1]/parts[3]) when the path is
    deep enough to have both; falls back to just the dataset, or "overall",
    for shallower paths."""
    if len(path.parts) > 3:
        return f"{path.parts[1]}/{path.parts[3]}"
    if len(path.parts) > 1:
        return path.parts[1]
    return "overall"

def _extract_json_files(workspace: Workspace, run_id: str, names: list[str]) -> dict:
    """Walks `list_files()` and filters by an exact filename set — the one
    extractor here that doesn't build the path directly."""
    files = workspace.list_files(workspace.resolve(run_id))
    wanted = set(names)

    result = {}

    for f in files:
        if f.name not in wanted:
            continue

        try:
            parsed = json.loads(workspace.read_text(f))
        except json.JSONDecodeError:
            logger.warning("Skipping corrupt JSON at %s", f)
            continue

        td = _sample_key(f)
        result.setdefault(td, {})
        result[td][f.name] = parsed

    return result

def extract_xia2_cc_half(workspace: Workspace, run_id: str) -> dict:
    """
    The DIALS-computed CC½ threshold crossing (`d_min`) per dataset, for A and
    B. Not an interpolation — `dials.estimate_resolution-{A,B}.json`'s
    `cc_half.data` already carries the crossing as a marker line named
    `"d_min = ... Å"`, whose x-coordinate (inverse-square-d units) is the
    value, read directly per (dataset, sample). Shape matches
    `extract_xia2_cumulative_timing`: `{"A": [[dataset, value], ...], "B": [...]}`.
    """
    result = {"A": [], "B": []}

    for composite_id in extract_xia2_datasets(workspace, run_id):
        for variant in ("A", "B"):
            path = f"{_dataset_sample_path(run_id, composite_id)}/dials.estimate_resolution-{variant}.json"
            if not workspace.exists(path):
                continue

            try:
                data = json.loads(workspace.read_text(path))
            except json.JSONDecodeError:
                logger.warning("Skipping corrupt JSON at %s", path)
                continue

            traces = data.get("cc_half", {}).get("data", [])
            trace = next((t for t in traces if str(t.get("name", "")).startswith("d_min")), None)
            if trace is None or not trace.get("x"):
                logger.warning("No d_min marker found in %s", path)
                continue

            result[variant].append([composite_id, trace["x"][0]])

    return result

def _extract_memory_files(workspace: Workspace, run_id: str, filename: str) -> dict:
    """Builds the path directly per (dataset, sample, variant)."""
    # Matches every number in the file; the peak value is the last one, e.g.
    # "mprofile-integrate.dat\t26186.895 MiB" -> ["26186.895"] -> 26186.895.
    pattern = re.compile(r"[-+]?\d*\.\d+|\d+")
    result = {}

    for composite_id in extract_xia2_datasets(workspace, run_id):
        id_ = DatasetSampleId.parse(composite_id)
        entry = result.setdefault(composite_id, {})

        for variant in ("A", "B"):
            path = f"{id_.path(run_id)}/{variant}/{filename}"
            if not workspace.exists(path):
                continue

            matches = pattern.findall(workspace.read_text(path))
            entry[variant] = float(matches[-1]) if matches else None

    return result