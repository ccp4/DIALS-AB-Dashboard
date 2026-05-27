from workspace.factory import get_workspace
from storage.local import FileSystemRunRepository
from runs.xia2_extractor import extract_xia2_raw, extract_xia2_memory, extract_xia2_comparison
from runs.xia2_processor import process_xia2_data, clean_xia2_data, process_xia2_memory_data

class RunService:
    def __init__(self):
        self.workspace = get_workspace()
        self.repo = FileSystemRunRepository()
        self.xia_marker = "xia2-irrmc-A-B.sh"

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
            "raw" : self.repo.exists(f"{run_id}/raw"),
            "comparison" : self.repo.exists(f"{run_id}/comparison"),
            "memory" : self.repo.exists(f"{run_id}/memory"),
        }
    
    def get_xia2_raw(self, run_id: str):
        key = f"{run_id}/raw"
        # if self.repo.exists(key):
        #     return self.repo.load(key)
        data = extract_xia2_raw(self.workspace, run_id)
        self.repo.save(key, data)
        clean = clean_xia2_data(data)
        return process_xia2_data(clean)

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

    def run_exists(self, run_id: str):
        return self.workspace.exists(f"{run_id}/{self.xia_marker}")
    
        