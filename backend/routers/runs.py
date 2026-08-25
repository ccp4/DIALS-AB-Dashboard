from fastapi import APIRouter, HTTPException
from runs.service import RunService
from workspace.factory import get_workspace
from routers.models import CohortResponse, RunMetadata, CCHalfResponse

router = APIRouter(
    prefix="/runs",
    tags=["runs"],
)

workspace = get_workspace()
service = RunService(workspace=workspace)

def _ensure_run_exists(run_id: str):
    if not service.run_exists(run_id):
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")

def _ensure_dataset_exists(run_id: str, dataset: str):
    if dataset not in service.get_datasets(run_id):
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset}' not found in run '{run_id}'")

@router.get("")
def list_runs():
    """
    Returns all available run folders in workspace area
    """
    return service.list_runs()

@router.get("/{run_id}", response_model=RunMetadata)
def get_run_metatdata(run_id: str):
    """
    Returns run metadata e.g. datasets, processed in cache
    """
    _ensure_run_exists(run_id)
    return service.get_run_metadata(run_id=run_id)

@router.get("/{run_id}/raw")
def get_raw(run_id: str):
    """
    Returns raw data extracted from run folder
    """
    _ensure_run_exists(run_id)
    return service.get_xia2_raw(run_id=run_id)

@router.get("/{run_id}/dataset/{dataset:path}/raw")
def get_raw_dataset(run_id: str, dataset: str):
    _ensure_run_exists(run_id)
    _ensure_dataset_exists(run_id, dataset)
    result = service.get_xia2_dataset_raw(run_id, dataset)
    return result

@router.get("/{run_id}/dataset/{dataset:path}/comparison")
def get_dataset_comparison(run_id: str, dataset: str):
    _ensure_run_exists(run_id)
    _ensure_dataset_exists(run_id, dataset)
    result = service.get_xia2_dataset_comparison(run_id, dataset)
    return result

@router.get("/{run_id}/cc_half", response_model=CCHalfResponse)
def get_cc_half(run_id: str):
    """
    Returns the DIALS-computed CC½ threshold crossing (d_min) per dataset,
    for A and B — a direct extraction, not an interpolation.
    """
    _ensure_run_exists(run_id)
    return service.get_cc_half(run_id=run_id)

@router.get("/{run_id}/comparison")
def get_comparison(run_id: str):
    """
    Returns comparison data extracted from run folder
    """
    _ensure_run_exists(run_id)
    return service.get_xia2_comparison(run_id=run_id)

@router.get("/{run_id}/memory")
def get_memory(run_id: str):
    """
    Returns memory data extracted from run folder
    """
    _ensure_run_exists(run_id)
    return service.get_xia2_memory(run_id=run_id)

@router.get("/{run_id}/memory/{dataset:path}/events")
def get_memory_timings(run_id: str, dataset: str):
    """
    Returns memory data extracted from run folder
    """
    _ensure_run_exists(run_id)
    _ensure_dataset_exists(run_id, dataset)
    return service.get_xia2_dataset_timing(run_id=run_id, dataset=dataset)

@router.get("/{run_id}/memory/{dataset:path}")
def get_memory_plot(run_id: str, dataset: str):
    """
    Returns memory data extracted from run folder
    """
    _ensure_run_exists(run_id)
    _ensure_dataset_exists(run_id, dataset)
    return service.get_xia2_dataset_memplot(run_id=run_id, dataset=dataset)

@router.get("/{run_id}/cumulative")
def get_cumulative_memory_timings(run_id: str):
    """
    Returns cumulative memory TIMINGS
    """
    _ensure_run_exists(run_id)
    return service.get_xia2_dataset_cumulative_timings(run_id=run_id)

@router.get("/{run_id}/info/{dataset:path}")
def get_info(run_id: str, dataset: str):
    """
    Returns unit cell and space group info about dataset
    """
    _ensure_run_exists(run_id)
    _ensure_dataset_exists(run_id, dataset)
    return service.get_xia2_cell_space(run_id=run_id, dataset=dataset)

@router.get("/{run_id}/cohort", response_model=CohortResponse)
def get_cohort(run_id: str):
    """
    Returns the per-sample cohort table: one row per (dataset, sample),
    joining the xia2-summary.dat metrics with peak memory and cumulative
    runtime. Every phase-4 view reads this and nothing else.
    """
    _ensure_run_exists(run_id)
    return service.get_cohort(run_id=run_id)
