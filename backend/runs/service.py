from runs.xia2_extractor import extract_xia2_resolution, extract_xia2_dataset_resolution, extract_xia2_dataset_merging_stats, extract_xia2_memory, extract_xia2_merging_stats, extract_xia2_datasets, extract_xia2_dataset_memplot, extract_xia2_timing, extract_xia2_unit_cell_space, extract_xia2_cumulative_timing, extract_xia2_summary, extract_xia2_build_info, extract_xia2_cc_half
from runs.xia2_processor import process_xia2_data, clean_xia2_data, process_xia2_memory_data, build_cohort
from runs.metrics import METRICS

class RunService:
    """Orchestrates extraction and processing per run/dataset — the one entry point `routers/runs.py` calls into."""

    def __init__(self, workspace):
        self.workspace = workspace
        self.xia_marker = "datasets.txt"

    def list_runs(self):
        """Most recent first, by the marker file's mtime as `list_dirs` order is filesystem-dependent"""
        runs = []
        for dir in self.workspace.list_dirs():
            xia_path = f"{dir}/{self.xia_marker}"

            if not self.workspace.exists(xia_path):
                continue

            runs.append(dir)

        runs.sort(key=lambda run: self.workspace.resolve(f"{run}/{self.xia_marker}").stat().st_mtime, reverse=True)

        return runs
    
    def get_run_metadata(self, run_id: str):
        datasets = self.get_datasets(run_id=run_id)
        return {
            "run_id" : run_id,
            "datasets": datasets,
            "builds": extract_xia2_build_info(self.workspace, run_id, datasets),
        }

    def get_datasets(self, run_id: str):
        return extract_xia2_datasets(self.workspace, run_id)
    
    def get_xia2_resolution(self, run_id: str):
        data = extract_xia2_resolution(self.workspace, run_id)
        clean = clean_xia2_data(data)
        return process_xia2_data(clean)

    def get_xia2_dataset_resolution(self, run_id:str, dataset: str):
        data = extract_xia2_dataset_resolution(self.workspace, run_id, dataset)
        clean = clean_xia2_data(data)
        processed = process_xia2_data(clean)
        return processed.get(dataset, {})

    def get_xia2_dataset_merging_stats(self, run_id:str, dataset: str):
        data = extract_xia2_dataset_merging_stats(self.workspace, run_id, dataset)
        clean = clean_xia2_data(data)
        processed = process_xia2_data(clean)
        return processed.get(dataset, {})

    def get_cc_half(self, run_id: str):
        return extract_xia2_cc_half(self.workspace, run_id)

    def get_xia2_merging_stats(self, run_id: str):
        data = extract_xia2_merging_stats(self.workspace, run_id)
        clean = clean_xia2_data(data)
        return process_xia2_data(clean)

    def get_xia2_memory(self, run_id: str):
        data = extract_xia2_memory(self.workspace, run_id)
        return process_xia2_memory_data(data)
    
    def get_xia2_dataset_memplot(self, run_id:str, dataset: str):
        data = extract_xia2_dataset_memplot(self.workspace, run_id=run_id, dataset=dataset)
        return data

    def get_xia2_dataset_timing(self, run_id:str, dataset: str):
        data = extract_xia2_timing(self.workspace, run_id=run_id, dataset=dataset)
        return data

    def get_xia2_dataset_cumulative_timings(self, run_id: str):
        return extract_xia2_cumulative_timing(self.workspace, run_id=run_id)

    def get_xia2_cell_space(self, run_id: str, dataset: str):
        return extract_xia2_unit_cell_space(self.workspace, run_id=run_id, dataset=dataset)


    def run_exists(self, run_id: str):
        return self.workspace.exists(f"{run_id}/{self.xia_marker}")

    def get_cohort(self, run_id: str):
        summary_records = extract_xia2_summary(self.workspace, run_id)
        memory = extract_xia2_memory(self.workspace, run_id)
        timing = extract_xia2_cumulative_timing(self.workspace, run_id)

        rows, coverage = build_cohort(summary_records, memory, timing)

        return {
            "rows": rows,
            "coverage": coverage,
            "metrics": METRICS,
        }
