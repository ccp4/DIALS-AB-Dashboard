from typing import Protocol

class Workspace(Protocol):

    def list_dirs(self) -> list[str]:
        """
        Returns all directories found
        """

    def read_text(self, path: str) -> str:
        """
        Read a text file
        """

    def exists(self, path: str) -> bool:
        """
        Check if a file or directory exists
        """