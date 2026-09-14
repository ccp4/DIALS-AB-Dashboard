from models.ab_pair import ab_status


def _clean_trace_data(raw_data):
    """Drops trace entries that are empty, missing `x`/`y`, or have mismatched `x`/`y` lengths."""
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
    """Cleans every trace's `data` list in place, via `_clean_trace_data`."""
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
            **values,
            "status": ab_status(values.get("A"), values.get("B")),
        })

    return result

def process_xia2_data(raw_data: dict) -> dict:
    """Reshapes extracted run/file/trace data into `{run: {trace_name: [series, ...]}}` for front-end consumption"""
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
    """Builds one chart series `{"name": ..., "data": [[x, y], ...]}`,
    prefixing the name with `"A - "`/`"B - "` for resolution files and
    stripping HTML subscript tags DIALS embeds in some metric names."""

    if file == "dials.estimate_resolution-A.json":
        name = "A - " + data["name"]
    elif file == "dials.estimate_resolution-B.json":
        name = "B - " + data["name"]
    elif file == "xia2.compare_merging_stats.json":
        name = data["name"]
    else:
        # Unrecognised source files return None instead of raising; the caller drops it.
        return None

    if "sub" in name:
        name = name.replace("<sub>","")
        name = name.replace("</sub>", "")

    return {
        "name": name,
        "data": [[x, y] for x, y in zip(data["x"], data["y"])]
    }

def _cumulative_timing_lookup(cumulative_timing: dict) -> dict:
    """Reindexes `{"A": [[key, value], ...], "B": [...]}` into `{key: {"A": value, "B": value}}`."""
    lookup = {}

    for variant in ("A", "B"):
        for key, total in cumulative_timing.get(variant, []):
            lookup.setdefault(key, {})[variant] = total

    return lookup

def build_cohort(summary_records: list[dict], memory: dict, cumulative_timing: dict) -> tuple[list[dict], dict]:
    """
    Joins the per-sample `xia2-summary.dat` records with the peak-memory and
    cumulative-timing extractions, keyed by the same `"dataset/sample"`
    composite id — exact per sample, including multi-sample datasets.
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

        counts[ab_status(row["A"], row["B"])] += 1
        rows.append(row)

    coverage = {"total": len(rows), **counts}

    return rows, coverage