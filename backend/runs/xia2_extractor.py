from pathlib import Path
from workspace.base import Workspace
import json
import re
from bisect import bisect_left


def _dataset_sample_path(run_id: str, dataset: str) -> str:
    """`dataset` is a composite `"dataset/sample"` id — resolve it to the sample's directory."""
    top, sample = dataset.split("/", 1)
    return f"{run_id}/{top}/data/{sample}"

def extract_xia2_datasets(workspace: Workspace, run_id: str) -> list:
    """
    Every selectable `"dataset/sample"` id for a run — always composite, even
    for the common single-sample case, so nothing downstream has to special-case
    which format an id is in.

    Derived from `good_master_files.txt` (one line per sample, path shape
    `.../{dataset}/data/{sample}_master.h5`, confirmed against every run in the
    workspace) instead of listing every dataset directory and then listing each
    one's `data/` subdirectory — that walk cost ~227 dataset-directory listings
    for one `/runs/{run_id}` request. A handful of manifest entries have no
    local `data/{sample}` directory (aborted/incomplete processing), so each
    candidate is still checked with `exists()` before being included.
    """
    manifest = workspace.read_text(f"{run_id}/good_master_files.txt").splitlines()

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
    `"DIALS 3.dev.1493-gf324578a1"` — the provenance CLAUDE.md's domain
    conventions say is "on disk, unextracted": A tracks whatever main was at
    run time, not a fixed baseline, so this is what makes a cross-run
    comparison's confound visible instead of implied.

    One build per variant is used for the whole run, logged identically in
    every sample's `xia2-debug.txt` — so this checks the direct
    `<dataset>/data/<sample>/{A,B}/xia2-debug.txt` path for each already-known
    dataset/sample id in turn, stopping as soon as both are found, rather than
    recursively walking every file in the run to find one by name. `datasets`
    is `extract_xia2_datasets`'s output, passed in rather than recomputed since
    the caller (`get_run_metadata`) already has it.
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
    """Builds the path directly rather than listing and filtering — called once per sample."""
    top, sample = dataset.split("/", 1)
    res = {"A": [], "B": []}

    for variant in ("A", "B"):
        path = f"{run_id}/{top}/data/{sample}/{variant}/xia2-timing.json"
        if not workspace.exists(path):
            continue

        timing = json.loads(workspace.read_text(path))
        events = []

        for item in timing:
            if "time_start" not in item or "time_end" not in item or "runtime" not in item:
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
    return _extract_memory_files(workspace, run_id, "peak_memory-integrate.txt")

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

def extract_xia2_cc_half(workspace: Workspace, run_id: str) -> dict:
    """
    The DIALS-computed CC½ threshold crossing (`d_min`) per dataset, for A and
    B. Not an interpolation — `dials.estimate_resolution-{A,B}.json`'s
    `cc_half.data` already carries the crossing as a marker line named
    `"d_min = ... Å"`, whose x-coordinate (inverse-square-d units, same as the
    curve's own x-axis) is the value; this reads it directly per
    (dataset, sample) rather than downloading and grepping the whole `/raw`
    payload client-side.

    Shape matches `extract_xia2_cumulative_timing`: `{"A": [[dataset, value],
    ...], "B": [...]}` — one entry per dataset that has a value for that
    variant.
    """
    result = {"A": [], "B": []}

    for composite_id in extract_xia2_datasets(workspace, run_id):
        for variant in ("A", "B"):
            path = f"{_dataset_sample_path(run_id, composite_id)}/dials.estimate_resolution-{variant}.json"
            if not workspace.exists(path):
                continue

            data = json.loads(workspace.read_text(path))
            traces = data.get("cc_half", {}).get("data", [])
            trace = next((t for t in traces if str(t.get("name", "")).startswith("d_min")), None)
            if trace is None or not trace.get("x"):
                continue

            result[variant].append([composite_id, trace["x"][0]])

    return result

def _extract_memory_files(workspace: Workspace, run_id: str, filename: str) -> dict:
    """Builds the path directly per (dataset, sample, variant) rather than listing and filtering."""
    # Matches every number in the file; the peak value is the last one, e.g.
    # "mprofile-integrate.dat\t26186.895 MiB" -> ["26186.895"] -> 26186.895.
    pattern = re.compile(r"[-+]?\d*\.\d+|\d+")
    result = {}

    for composite_id in extract_xia2_datasets(workspace, run_id):
        top, sample = composite_id.split("/", 1)

        for variant in ("A", "B"):
            path = f"{run_id}/{top}/data/{sample}/{variant}/{filename}"
            if not workspace.exists(path):
                continue

            matches = pattern.findall(workspace.read_text(path))
            value = float(matches[-1]) if matches else None

            result.setdefault(composite_id, {})[variant] = value

    return result