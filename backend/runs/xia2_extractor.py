from pathlib import Path
from workspace.base import Workspace
import json
import re
from bisect import bisect_left


def _list_dataset_dirs(workspace: Workspace, run_id: str) -> list:
    return workspace.list_dirs(workspace.resolve(run_id))

def extract_xia2_datasets(workspace: Workspace, run_id: str) -> list:
    """
    Every selectable `"dataset/sample"` id for a run — always composite, even
    for the common single-sample case, so nothing downstream has to special-case
    which format an id is in.
    """
    return [
        f"{dataset}/{sample}"
        for dataset in _list_dataset_dirs(workspace, run_id)
        for sample in extract_xia2_samples(workspace, run_id, dataset)
    ]

def _dataset_sample_path(run_id: str, dataset: str) -> str:
    """`dataset` is a composite `"dataset/sample"` id — resolve it to the sample's directory."""
    top, sample = dataset.split("/", 1)
    return f"{run_id}/{top}/data/{sample}"

def extract_xia2_samples(workspace: Workspace, run_id: str, dataset: str) -> list:
    # Some dataset dirs are missing the `data/` layer entirely (a handful of
    # incomplete/aborted entries in run 2700) — no samples, not a crash.
    data_dir = f"{run_id}/{dataset}/data"
    if not workspace.exists(data_dir):
        return []

    return workspace.list_dirs(workspace.resolve(data_dir))

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
    # Matched by label, not line number: the format is completely regular in
    # every file checked (460/460 at 22 lines each), but a label match is
    # free insurance against a future xia2 version reordering fields.
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
        dataset, sample = composite_id.split("/", 1)
        record = {"dataset": dataset, "sample": sample, "A": None, "B": None}

        for variant in ("A", "B"):
            path = f"{run_id}/{dataset}/data/{sample}/{variant}/xia2-summary.dat"
            if workspace.exists(path):
                record[variant] = _parse_xia2_summary(workspace.read_text(path))

        records.append(record)

    return records

def extract_xia2_dataset_memplot(workspace: Workspace, run_id:str, dataset: str):
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
    data_src = workspace.resolve(_dataset_sample_path(run_id, dataset))
    files = workspace.list_files(data_src)
    wanted = ["xia2-timing.json"]

    res = {"A": [],"B": []}

    for f in files:
        if f.name not in wanted:
            continue
        
        events = []
        text = workspace.read_text(f)
        timing = json.loads(text)

        for item in timing:
            if "time_start" not in item or "time_end" not in item or "runtime" not in item:
                continue

            events.append({
                "command": item["short_command"],
                "time_start": float(item["time_start"]),
                "time_end": float(item["time_end"]),
                "runtime": float(item["runtime"])
            })
        
        res[f.parent.name] = events
    return res

def extract_xia2_cumulative_timing(workspace: Workspace, run_id: str):
    res = {"A": [],"B": []}

    for composite_id in extract_xia2_datasets(workspace=workspace, run_id=run_id):
        timings = extract_xia2_timing(workspace=workspace, run_id=run_id, dataset=composite_id)

        for process in ("A", "B"):
            total = 0

            for command in timings.get(process, []):
                total += command.get("runtime", 0)

            res[process].append([composite_id, total])

    return res

def extract_xia2_unit_cell(workspace: Workspace, run_id: str, dataset: str):
    data_src = workspace.resolve(_dataset_sample_path(run_id, dataset))
    files = workspace.list_files(data_src)
    wanted = ["xia2-summary.dat"]

    res = {"A": [],"B": []}

    for f in files:
        if f.name not in wanted:
            continue

        text = workspace.read_text(f)
        for line in text.splitlines():
            if "Cell:" in line:
                res[f.parent.name] = line
                break

    return res

def extract_xia2_space_group(workspace: Workspace, run_id: str, dataset: str):
    data_src = workspace.resolve(_dataset_sample_path(run_id, dataset))
    files = workspace.list_files(data_src)
    wanted = ["xia2-summary.dat"]

    res = {"A": [],"B": []}

    for f in files:
        if f.name not in wanted:
            continue

        text = workspace.read_text(f)
        for line in text.splitlines():
            if "Spacegroup:" in line:
                res[f.parent.name] = line
                break

    return res

def extract_xia2_raw(workspace: Workspace, run_id: str) -> dict:
    return _extract_json_files(
        workspace,
        run_id,
         [
            "dials.estimate_resolution-A.json",
            "dials.estimate_resolution-B.json"
        ]
    )

def extract_xia2_dataset_raw(workspace: Workspace, run_id: str, dataset: str) -> dict:
    return extract_xia2_raw(workspace=workspace, run_id=_dataset_sample_path(run_id, dataset))

def extract_xia2_dataset_comparison(workspace: Workspace, run_id: str, dataset: str) -> dict:
    return extract_xia2_comparison(workspace=workspace, run_id=_dataset_sample_path(run_id, dataset))

def extract_xia2_comparison(workspace: Workspace, run_id: str) -> dict:
    return _extract_json_files(
        workspace,
        run_id,
        ["xia2.compare_merging_stats.json"],
    )

def extract_xia2_memory(workspace: Workspace, run_id: str) -> dict:
    return _extract_memory_files(
        workspace,
        run_id,
        ["peak_memory-integrate.txt"],
    )

def _sample_key(path: Path) -> str:
    # Composite `"dataset/sample"` when the path is deep enough to have both
    # (parts[1]/parts[3], per the workspace layout in CLAUDE.md); falls back
    # the way the old dataset-only `_top_dir` did for shorter paths.
    if len(path.parts) > 3:
        return f"{path.parts[1]}/{path.parts[3]}"
    if len(path.parts) > 1:
        return path.parts[1]
    return "overall"

def _extract_json_files(workspace: Workspace, run_id: str, names: list[str]) -> dict:
    files = workspace.list_files(workspace.resolve(run_id))
    wanted = set(names)

    result = {}

    for f in files:
        if f.name not in wanted:
            continue

        td = _sample_key(f)
        result.setdefault(td, {})
        result[td][f.name] = json.loads(workspace.read_text(f))

    return result

def _extract_cc_half_from_raw(workspace: Workspace, run_id: str, names: list[str]) -> dict:
    files = workspace.list_files(workspace.resolve(run_id))
    wanted = set(names)

    result = {}

    for f in files:
        if f.name not in wanted:
            continue

        td = _sample_key(f)

        data = json.loads(workspace.read_text(f))
        cc_half = data.get("cc_half", {}).get("data", {})
        for trace in cc_half:
            if "d_min" not in trace["name"]:
                continue


    return result

def _extract_memory_files(workspace: Workspace, run_id: str, names: list[str]) -> dict:
    pattern = re.compile(r"[-+]?\d*\.\d+|\d+")

    files = workspace.list_files(workspace.resolve(run_id))
    wanted = set(names)

    result = {}

    for f in files:
        if f.name not in wanted:
            continue

        td = _sample_key(f)
        matches = pattern.findall(workspace.read_text(f))
        value = float(matches[-1]) if matches else None

        result.setdefault(td, {})
        # Differentiate between the peak memory values in the A vs B folder
        result[td][f.parent.name] = value

    return result