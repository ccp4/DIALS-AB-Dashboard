from typing import Protocol


class RunRepository(Protocol):

    def exists(self, run_id: str) -> bool:
        """
        Check if file exists
        """

    def load(self, run_id: str) -> dict:
        """
        Load file
        """

    def save(self, run_id: str, data: dict) -> None:
        """
        Save file
        """