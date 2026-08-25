"""
Response models for the newer, typed endpoints. Older routes (`/raw`,
`/memory`, etc.) stay untyped dicts deliberately — see TODO.md section 4.
"""

from pydantic import BaseModel


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


class CohortRow(BaseModel):
    dataset: str
    sample: str
    status: str
    A: VariantSummary | None = None
    B: VariantSummary | None = None


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
    raw: bool
    comparison: bool
    memory: bool


class CCHalfResponse(BaseModel):
    A: list[tuple[str, float]]
    B: list[tuple[str, float]]
