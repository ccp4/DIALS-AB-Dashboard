# TODO
# Clean data
# Build returnable series
# Front-end can then recieve it
# And submit data processing requests

def _clean_trace_data(raw_data):
    cleaned = []

    for item in raw_data:
        if not item:
            continue
        if "x" not in item or "y" not in item:
            continue
        if len(item["x"]) != len(item["y"]):
            print("AAAAAAAAAAAAARRGGHHHHHH")
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

def process_xia2_memory_data(raw_data: dict) -> dict:
    series_map = {}

    # initialize keys (A, B, etc.)
    for inner in raw_data.values():
        for series_name in inner.keys():
            series_map.setdefault(series_name, [])

    # build (x, y) pairs
    for x_key, inner in raw_data.items():
        for series_name, y_value in inner.items():
            series_map[series_name].append([x_key, y_value])

    return series_map

def process_xia2_data(raw_data: dict) -> dict:
    result = {}

    for run, files in raw_data.items():
        result[run] = {}

        for file, traces in files.items():
            result[run][file] = {}

            for trace_name, trace_obj in traces.items():
                result[run][file][trace_name] = []

                for variant in trace_obj["data"]:

                    series = _apache_series_builder(variant)
                    result[run][file][trace_name].append(series)

    return result

def _apache_series_builder(data: dict) -> dict:

    return {
        "name": data["name"],
        "data": [[x, y] for x, y in zip(data["x"], data["y"])]
    }