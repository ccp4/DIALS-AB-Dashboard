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
            if "time_start" not in item or "time_end" not in item:
                continue

            events.append({
                "command": item["short_command"],
                "time_start": float(item["time_start"]),
                "time_end": float(item["time_end"]),
            })
        
        res[f.parent.name] = events
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