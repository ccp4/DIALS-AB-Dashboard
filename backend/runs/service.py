from workspace.factory import get_workspace
from storage.local import FileSystemRunRepository
from runs.xia2_extractor import extract_xia2_raw, extract_xia2_memory, extract_xia2_comparison, extract_xia2_datasets, extract_xia2_dataset_memplot, extract_xia2_timing, extract_xia2_unit_cell, extract_xia2_space_group, extract_xia2_cumulative_timing
from runs.xia2_processor import process_xia2_data, clean_xia2_data, process_xia2_memory_data, interpolate_cc_half

class RunService:
    def __init__(self):
        self.workspace = get_workspace()
        self.repo = FileSystemRunRepository()
        self.xia_marker = "good_master_files.txt"

    def list_run_summaries(self):
        runs = []
        for dir in self.workspace.list_dirs():
            xia_path = f"{dir}/{self.xia_marker}"

            if not self.workspace.exists(xia_path):
                continue

            # potential to turn this into an entity, e.g. with size
            runs.append(dir)
        
        return runs
    
    def get_run_summary(self, run_id: str):
        return {
            "run_id" : run_id,
            "datasets": self.get_datasets(run_id=run_id),
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
    
    def get_cc_half_points(self, run_id: str, x: float):
        data = extract_xia2_raw(self.workspace, run_id)
        clean = clean_xia2_data(data)
        processed = process_xia2_data(clean)

        return interpolate_cc_half(processed, x)

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
    
        