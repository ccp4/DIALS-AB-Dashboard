from pathlib import Path
from workspace.base import Workspace
import json
import re
from bisect import bisect_left


def extract_xia2_datasets(workspace: Workspace, run_id: str) -> list:
    return workspace.list_dirs(workspace.resolve(run_id))

def extract_xia2_dataset_memplot(workspace: Workspace, run_id:str, dataset: str):
    data_src = workspace.resolve(run_id + "/" + dataset)
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
    data_src = workspace.resolve(run_id + "/" + dataset)
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
    datasets = extract_xia2_datasets(workspace=workspace, run_id=run_id)
    res = {"A": [],"B": []}

    for data in datasets:
        timings = extract_xia2_timing(workspace=workspace, run_id=run_id, dataset=data)
        total = 0

        for process in ("A", "B"):
            total = 0

            for command in timings.get(process, []):
                total += command.get("runtime", 0)

            res[process].append([data, total])

    return res

def extract_xia2_unit_cell(workspace: Workspace, run_id: str, dataset: str):
    data_src = workspace.resolve(run_id + "/" + dataset)
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
    data_src = workspace.resolve(run_id + "/" + dataset)
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
    return extract_xia2_raw(workspace=workspace, run_id=f"{run_id}/{dataset}")

def extract_xia2_dataset_comparison(workspace: Workspace, run_id: str, dataset: str) -> dict:
    return extract_xia2_comparison(workspace=workspace, run_id=f"{run_id}/{dataset}")

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

def _top_dir(path: Path) -> str:
    return path.parts[1] if len(path.parts) > 1 else "overall"

def _extract_json_files(workspace: Workspace, run_id: str, names: list[str]) -> dict:
    files = workspace.list_files(workspace.resolve(run_id))
    wanted = set(names)

    result = {}

    for f in files:
        if f.name not in wanted:
            continue

        td = _top_dir(f)
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

        td = _top_dir(f)
        
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

        td = _top_dir(f)
        matches = pattern.findall(workspace.read_text(f))
        value = float(matches[-1]) if matches else None

        result.setdefault(td, {})
        # Differentiate between the peak memory values in the A vs B folder
        result[td][f.parent.name] = value

    return result