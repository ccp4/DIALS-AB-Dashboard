from workspace.factory import get_workspace

class RunService:
    def __init__(self):
        self.workspace = get_workspace()

    def list_run_summaries(self):
        runs = []
        for dir in self.workspace.list_dirs():
            xia_path = f"{dir}/xia2-irrmc-A-B.sh"

            if not self.workspace.exists(xia_path):
                continue

            # potential to turn this into an entity, e.g. with size
            runs.append(dir)
        
        return runs
    
    def get_run_summary(self, run_id: str):
        # TO DO
        return
    
    def get_run_detail(self, run_id: str):
        # TO DO
        return
    
    def run_exists(self, run_id: str):
        # TO DO
        return
        