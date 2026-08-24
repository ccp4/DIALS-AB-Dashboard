from storage.local import FileSystemRunRepository
from runs.xia2_extractor import extract_xia2_raw, extract_xia2_dataset_raw, extract_xia2_dataset_comparison, extract_xia2_memory, extract_xia2_comparison, extract_xia2_datasets, extract_xia2_dataset_memplot, extract_xia2_timing, extract_xia2_unit_cell, extract_xia2_space_group, extract_xia2_cumulative_timing, extract_xia2_summary, extract_xia2_build_info, extract_xia2_cc_half
from runs.xia2_processor import process_xia2_data, clean_xia2_data, process_xia2_memory_data, build_cohort
from runs.metrics import METRICS

class RunService:
    def __init__(self, workspace):
        self.workspace = workspace
        self.repo = FileSystemRunRepository()
        self.xia_marker = "good_master_files.txt"

    def list_runs(self):
        runs = []
        for dir in self.workspace.list_dirs():
            xia_path = f"{dir}/{self.xia_marker}"

            if not self.workspace.exists(xia_path):
                continue

            runs.append(dir)
        
        return runs
    
    def get_run_metadata(self, run_id: str):
        datasets = self.get_datasets(run_id=run_id)
        return {
            "run_id" : run_id,
            "datasets": datasets,
            "builds": extract_xia2_build_info(self.workspace, run_id, datasets),
            "raw" : self.repo.exists(f"{run_id}/raw"),
            "comparison" : self.repo.exists(f"{run_id}/comparison"),
            "memory" : self.repo.exists(f"{run_id}/memory"),
        }

    def get_datasets(self, run_id: str):
        return extract_xia2_datasets(self.workspace, run_id)
    
    def get_xia2_raw(self, run_id: str):
        key = f"{run_id}/raw"
        # if self.repo.exists(key):
        #     return self.repo.load(key)
        data = extract_xia2_raw(self.workspace, run_id)
        self.repo.save(key, data)
        clean = clean_xia2_data(data)
        return process_xia2_data(clean)
    
    def get_xia2_dataset_raw(self, run_id:str, dataset: str):
        # Returns raw data for a dataset of a run
        data = extract_xia2_dataset_raw(self.workspace, run_id, dataset)
        clean = clean_xia2_data(data)
        processed = process_xia2_data(clean)
        return processed.get(dataset, {})

    def get_xia2_dataset_comparison(self, run_id:str, dataset: str):
        # Returns raw data for a dataset of a run
        data = extract_xia2_dataset_comparison(self.workspace, run_id, dataset)
        clean = clean_xia2_data(data)
        processed = process_xia2_data(clean)
        return processed.get(dataset, {})
    
    def get_cc_half(self, run_id: str):
        return extract_xia2_cc_half(self.workspace, run_id)

    def get_xia2_comparison(self, run_id: str):
        key = f"{run_id}/comparison"
        data = extract_xia2_comparison(self.workspace, run_id)
        self.repo.save(key, data)
        clean = clean_xia2_data(data)
        return process_xia2_data(clean)
    
    def get_xia2_memory(self, run_id: str):
        key = f"{run_id}/memory"
        data = extract_xia2_memory(self.workspace, run_id)
        self.repo.save(key, data)
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
        cell_data = extract_xia2_unit_cell(self.workspace, run_id=run_id, dataset=dataset)
        space_group = extract_xia2_space_group(self.workspace, run_id=run_id, dataset=dataset)
        return {"unit_cell": cell_data,"space_group": space_group}


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
