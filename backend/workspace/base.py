from typing import Protocol
from pathlib import Path

class Workspace(Protocol):

    def resolve(self, path: str) -> Path:
        """
        Return path
        """

    def list_dirs(self) -> list[str]:
        """
        Returns all directories found
        """

    def list_files(self) -> list[str]:
        """
        Returns all files found
        """

    def read_text(self, path: str) -> str:
        """
        Read a text file
        """

    def exists(self, path: str) -> bool:
        """
        Check if a file or directory exists
        """