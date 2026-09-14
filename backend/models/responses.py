"""
Response models for the typed endpoints. `/resolution` and `/merging_stats` are dev/test routes
"""

from pydantic import BaseModel

from models.ab_pair import ABPair


class MetricDefinition(BaseModel):
    key: str
    label: str
    unit: str
    formatter: str
    better: str | None = None


class ShellValue(BaseModel):
    overall: float
    inner: float
    outer: float


class VariantSummary(BaseModel):
    high_resolution_limit: ShellValue | None = None
    low_resolution_limit: ShellValue | None = None
    completeness: ShellValue | None = None
    multiplicity: ShellValue | None = None
    i_over_sigma: ShellValue | None = None
    r_merge: ShellValue | None = None
    cc_half: ShellValue | None = None
    anomalous_completeness: ShellValue | None = None
    anomalous_multiplicity: ShellValue | None = None
    cell: list[float] | None = None
    spacegroup: str | None = None
    peak_memory: float | None = None
    cumulative_runtime: float | None = None


class CohortRow(ABPair[VariantSummary]):
    dataset: str
    sample: str


class CohortCoverage(BaseModel):
    total: int
    complete: int
    missing_a: int
    missing_b: int


class CohortResponse(BaseModel):
    rows: list[CohortRow]
    coverage: CohortCoverage
    metrics: list[MetricDefinition]


class RunBuilds(BaseModel):
    A: str | None = None
    B: str | None = None


class RunMetadata(BaseModel):
    run_id: str
    datasets: list[str]
    builds: RunBuilds


class CCHalfResponse(BaseModel):
    A: list[tuple[str, float]]
    B: list[tuple[str, float]]


class TraceSeries(BaseModel):
    name: str
    data: list[tuple[float, float]]


DatasetSeries = dict[str, list[TraceSeries]]


class MemoryRow(BaseModel):
    label: str
    A: float | None = None
    B: float | None = None
    status: str


class MemoryProfile(BaseModel):
    A: list[tuple[float, float]] = []
    B: list[tuple[float, float]] = []


class TimingEvent(BaseModel):
    command: str
    time_start: float
    time_end: float
    runtime: float


class MemoryEventsResponse(BaseModel):
    A: list[TimingEvent] = []
    B: list[TimingEvent] = []


class DatasetInfoResponse(BaseModel):
    unit_cell: ABPair[str]
    space_group: ABPair[str]
