from pathlib import Path

class LocalWorkspace:

    def __init__(self, root: str):
        self.root = Path(root)

    def resolve(self, path: str) -> Path:
        return self.root / path

    def exists(self, path: str) -> bool:
        return self.resolve(path).exists()

    def list_dirs(self) -> list[str]:
        return [dir.name for dir in self.root.iterdir() if dir.is_dir()]
    
    def list_files(self, path: str) -> list[str]:
        return [
            p.relative_to(self.root)
            for p in (self.root / path).rglob("*")
            if p.is_file()
        ]

    def read_text(self, path: str) -> str:
        return self.resolve(path).read_text(encoding="utf-8")

