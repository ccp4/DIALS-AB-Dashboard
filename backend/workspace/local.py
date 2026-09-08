from pathlib import Path

class LocalWorkspace:

    def __init__(self, root: str):
        self.root = Path(root).resolve()

    def resolve(self, path: str) -> Path:
        candidate = (self.root / path).resolve()
        if not candidate.is_relative_to(self.root):
            raise ValueError(f"path '{path}' escapes the workspace root")

        return candidate

    def exists(self, path: str) -> bool:
        try:
            return self.resolve(path).exists()
        except ValueError:
            return False

    def list_dirs(self, path: str | None = None) -> list[str]:
        if path is None:
            path = self.root
        return [dir.name for dir in path.iterdir() if dir.is_dir()]
    
    def list_files(self, path: str) -> list[str]:
        return [
            p.relative_to(self.root)
            for p in (self.root / path).rglob("*")
            if p.is_file()
        ]

    def read_text(self, path: str) -> str:
        return self.resolve(path).read_text(encoding="utf-8")

