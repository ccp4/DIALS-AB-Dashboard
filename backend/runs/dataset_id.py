"""The composite `"dataset/sample"` id every per-sample extractor is addressed by."""

from dataclasses import dataclass


@dataclass(frozen=True)
class DatasetSampleId:
    dataset: str
    sample: str

    @classmethod
    def parse(cls, composite: str) -> "DatasetSampleId":
        dataset, sample = composite.split("/", 1)
        return cls(dataset, sample)

    def __str__(self) -> str:
        return f"{self.dataset}/{self.sample}"

    def path(self, run_id: str) -> str:
        return f"{run_id}/{self.dataset}/data/{self.sample}"
