from fastapi import APIRouter, Depends, HTTPException
from runs.service import RunService
from workspace.factory import get_workspace
from models import (
    CohortResponse,
    RunMetadata,
    CCHalfResponse,
    DatasetSeries,
    MemoryRow,
    MemoryProfile,
    MemoryEventsResponse,
    DatasetInfoResponse,
)

router = APIRouter(
    prefix="/runs",
    tags=["runs"],
)

workspace = get_workspace()
service = RunService(workspace=workspace)

def valid_run(run_id: str) -> str:
    if not service.run_exists(run_id):
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    return run_id

def valid_dataset(dataset: str, run_id: str = Depends(valid_run)) -> str:
    if dataset not in service.get_datasets(run_id):
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset}' not found in run '{run_id}'")
    return dataset

@router.get("")
def list_runs():
    """
    Returns all available run folders in workspace area
    """
    return service.list_runs()

@router.get("/{run_id}", response_model=RunMetadata)
def get_run_metatdata(run_id: str = Depends(valid_run)):
    """
    Returns run metadata e.g. datasets
    """
    return service.get_run_metadata(run_id=run_id)

@router.get("/{run_id}/resolution")
def get_resolution(run_id: str = Depends(valid_run)):
    """
    Returns data extracted from dials.estimate_resolution-{A,B}.json for a run
    """
    return service.get_xia2_resolution(run_id=run_id)

@router.get("/{run_id}/dataset/{dataset:path}/resolution", response_model=DatasetSeries)
def get_dataset_resolution(run_id: str = Depends(valid_run), dataset: str = Depends(valid_dataset)):
    "Returns data extracted from dials.estimate_resolution-{A,B}.json for a dataset of a run"
    result = service.get_xia2_dataset_resolution(run_id, dataset)
    return result

@router.get("/{run_id}/dataset/{dataset:path}/merging_stats", response_model=DatasetSeries)
def get_dataset_merging_stats(run_id: str = Depends(valid_run), dataset: str = Depends(valid_dataset)):
    "Returns data extracted from xia2.compare_merging_stats.json for a dataset of a run"
    result = service.get_xia2_dataset_merging_stats(run_id, dataset)
    return result

@router.get("/{run_id}/cc_half", response_model=CCHalfResponse)
def get_cc_half(run_id: str = Depends(valid_run)):
    """
    Returns the DIALS-computed CC½ threshold crossing (d_min) per dataset,
    for A and B — a direct extraction, not an interpolation.
    """
    return service.get_cc_half(run_id=run_id)

@router.get("/{run_id}/merging_stats")
def get_merging_stats(run_id: str = Depends(valid_run)):
    """
    Returns data extracted from xia2.compare_merging_stats.json for a run
    """
    return service.get_xia2_merging_stats(run_id=run_id)

@router.get("/{run_id}/memory", response_model=list[MemoryRow])
def get_memory(run_id: str = Depends(valid_run)):
    """
    Returns peak memory per dataset, from peak_memory-integrate.txt
    """
    return service.get_xia2_memory(run_id=run_id)

@router.get("/{run_id}/memory/{dataset:path}/events", response_model=MemoryEventsResponse)
def get_memory_timings(run_id: str = Depends(valid_run), dataset: str = Depends(valid_dataset)):
    """
    Returns command timing events for a dataset, from xia2-timing.json
    """
    return service.get_xia2_dataset_timing(run_id=run_id, dataset=dataset)

@router.get("/{run_id}/memory/{dataset:path}", response_model=MemoryProfile)
def get_memory_plot(run_id: str = Depends(valid_run), dataset: str = Depends(valid_dataset)):
    """
    Returns the memory-over-time trace for a dataset, from mprofile.dat
    """
    return service.get_xia2_dataset_memplot(run_id=run_id, dataset=dataset)

@router.get("/{run_id}/cumulative", response_model=CCHalfResponse)
def get_cumulative_memory_timings(run_id: str = Depends(valid_run)):
    """
    Returns cumulative runtime per dataset, summed from xia2-timing.json
    """
    return service.get_xia2_dataset_cumulative_timings(run_id=run_id)

@router.get("/{run_id}/info/{dataset:path}", response_model=DatasetInfoResponse)
def get_info(run_id: str = Depends(valid_run), dataset: str = Depends(valid_dataset)):
    """
    Returns unit cell and space group for a dataset, from xia2-summary.dat
    """
    return service.get_xia2_cell_space(run_id=run_id, dataset=dataset)

@router.get("/{run_id}/cohort", response_model=CohortResponse)
def get_cohort(run_id: str = Depends(valid_run)):
    """
    Returns the per-sample cohort table: one row per (dataset, sample),
    joining the xia2-summary.dat metrics with peak memory and cumulative runtime.
    """
    return service.get_cohort(run_id=run_id)
