import numpy as np

def _clean_trace_data(raw_data):
    cleaned = []

    for item in raw_data:
        if not item:
            continue
        if "x" not in item or "y" not in item:
            continue
        if len(item["x"]) != len(item["y"]):
            continue
        cleaned.append(item)

    return cleaned

def clean_xia2_data(raw_data: dict) -> dict:
    # remove empty data points and note singleton values
    # majority is 50,50 2,2

    # remove empty sets
    for run, files in raw_data.items():
        for file, traces in files.items():
            for trace_name, trace_obj in traces.items():

                trace_obj["data"] = _clean_trace_data(
                    trace_obj.get("data", [])
                )

    return raw_data

def process_xia2_memory_data(raw_data: dict) -> list[dict]:
    result = []

    for label, values in raw_data.items():
        result.append({
            "label": label,
            **values
        })

    return result

def interpolate_cc_half(processed_data: dict, x: float) -> list:
    result = []
    for label, values in processed_data.items():
        temp = { "label" : label}
        data = values["cc_half"]
        for item in data:
            if item["name"] == "A - CC½":
                temp["A"] = interpolate(item["data"], x)
            if item["name"] == "B - CC½":
                temp["B"] = interpolate(item["data"], x)
        result.append(temp)

    return result

def interpolate(data: list, target: float):
    arr = np.array(data)
    # arr = arr[::-1]
    
    xs = arr[:,0]
    ys = arr[:,1]

    y = np.interp(target, xs, ys)

    return y

def process_xia2_data(raw_data: dict) -> dict:
    result = {}

    for run, files in raw_data.items():
        if not result.get(run, {}):
            result[run] = {}

        for file, traces in files.items():

            for trace_name, trace_obj in traces.items():
                if not result[run].get(trace_name, []):
                    result[run][trace_name] = []

                for variant in trace_obj["data"]:

                    series = _apache_series_builder(variant, file)
                    if series is not None:
                        result[run][trace_name].append(series)

    return result

def _apache_series_builder(data: dict, file: str) -> dict | None:

    if file == "dials.estimate_resolution-A.json":
        name = "A - " + data["name"]
    elif file == "dials.estimate_resolution-B.json":
        name = "B - " + data["name"]
    elif file == "xia2.compare_merging_stats.json":
        name = data["name"]
    else:
        # An unrecognised source file is skipped rather than crashing the
        # whole extraction — the caller drops a `None` result.
        return None

    if "sub" in name:
        name = name.replace("<sub>","")
        name = name.replace("</sub>", "")

    return {
        "name": name,
        "data": [[x, y] for x, y in zip(data["x"], data["y"])]
    }

def _cumulative_timing_lookup(cumulative_timing: dict) -> dict:
    lookup = {}

    for variant in ("A", "B"):
        for key, total in cumulative_timing.get(variant, []):
            lookup.setdefault(key, {})[variant] = total

    return lookup

def build_cohort(summary_records: list[dict], memory: dict, cumulative_timing: dict) -> tuple[list[dict], dict]:
    """
    Joins the per-sample `xia2-summary.dat` records with the existing
    peak-memory and cumulative-timing extractions, both keyed by the same
    `"dataset/sample"` composite id (TODO phase 2b) — so this join is exact
    even for the datasets with more than one sample.
    """
    timing_by_key = _cumulative_timing_lookup(cumulative_timing)

    rows = []
    counts = {"complete": 0, "missing_a": 0, "missing_b": 0}

    for record in summary_records:
        dataset = record["dataset"]
        sample = record["sample"]
        key = f"{dataset}/{sample}"
        mem = memory.get(key, {})
        timing = timing_by_key.get(key, {})

        row = {"dataset": dataset, "sample": sample, "A": None, "B": None}

        for variant in ("A", "B"):
            summary = record.get(variant)
            if summary is None:
                continue

            row[variant] = {
                **summary,
                "peak_memory": mem.get(variant),
                "cumulative_runtime": timing.get(variant),
            }

        if row["A"] is not None and row["B"] is not None:
            status = "complete"
        elif row["A"] is None:
            status = "missing_a"
        else:
            status = "missing_b"

        counts[status] += 1
        row["status"] = status
        rows.append(row)

    coverage = {"total": len(rows), **counts}

    return rows, coverage