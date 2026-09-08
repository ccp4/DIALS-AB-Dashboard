from typing import Protocol
from pathlib import Path

class Workspace(Protocol):

    def resolve(self, path: str) -> Path:
        """
        Return path
        """

    def list_dirs(self, path: str | Path | None = None) -> list[str]:
        """
        Returns the names of the immediate child directories of `path`
        (workspace root if omitted).
        """

    def list_files(self, path: str | Path) -> list[Path]:
        """
        Returns every file under `path`, recursively, as `Path`s relative to
        the workspace root — callers rely on `.name`, `.parent.name` and
        `.parts` on the returned paths.
        """

    def read_text(self, path: str) -> str:
        """
        Read a text file
        """

    def exists(self, path: str) -> bool:
        """
        Check if a file or directory exists
        """