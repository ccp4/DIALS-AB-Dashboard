from pathlib import Path
import json

class FileSystemRunRepository:

    def __init__(self, root: str = "storage/processed_runs"):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def resolve(self, run_id: str) -> Path:
        return self.root / f"{run_id}.json"

    def exists(self, run_id: str) -> bool:
        return self.resolve(run_id).exists()

    def load(self, run_id: str) -> dict:
        with open(self.resolve(run_id)) as f:
            return json.load(f)

    def save(self, run_id: str, data: dict) -> None:
        path = self.resolve(run_id)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(data, f, indent=2)