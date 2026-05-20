from pathlib import Path

class LocalWorkspace:

    def __init__(self, root: str):
        self.root = Path(root)

    def _resolve(self, path: str):
        return self.root / path

    def list_dirs(self) -> list[str]:
        """
        Returns all directories found
        """
        return [dir.name for dir in self.root.iterdir() if dir.is_dir()]

    def read_text(self, path: str) -> str:
        """
        Read a text file
        """
        return self._resolve(path).read_text(encoding="utf-8")

    def exists(self, path: str) -> bool:
        """
        Check if a file or directory exists
        """
        return self._resolve(path).exists()