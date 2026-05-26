from pathlib import Path
from workspace.base import Workspace
import json
import re

def process_xia2_raw(workspace: Workspace, run_id: str) -> dict:
    return _process_json_files(
        workspace,
        run_id,
         [
            "dials.estimate_resolution-A.json",
            "dials.estimate_resolution-B.json"
        ]
    )

def process_xia2_comparison(workspace: Workspace, run_id: str) -> dict:
    return _process_json_files(
        workspace,
        run_id,
        ["xia2.compare_merging_stats.json"],
    )


def process_xia2_memory(workspace: Workspace, run_id: str) -> dict:
    return _process_memory_files(
        workspace,
        run_id,
        ["peak_memory.txt"],
    )


def _top_dir(path: Path) -> str:
    return path.parts[1] if len(path.parts) > 1 else "overall"

def _process_json_files(workspace: Workspace, run_id: str, names: list[str]) -> dict:
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


def _process_memory_files(workspace: Workspace, run_id: str, names: list[str]) -> dict:
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