from fastapi import APIRouter
from runs.service import RunService
from workspace.factory import get_workspace

router = APIRouter(
    prefix="/runs",
    tags=["runs"],
)

workspace = get_workspace()
service = RunService(workspace=workspace)

@router.get("")
def list_runs():
    """
    Returns all available run folders in workspace area
    """
    return service.list_runs()

@router.get("/{run_id}")
def get_run_metatdata(run_id: str):
    """
    Returns run metadata e.g. datasets, processed in cache
    """
    return service.get_run_metadata(run_id=run_id)

@router.get("/{run_id}/raw")
def get_raw(run_id: str):
    """
    Returns raw data extracted from run folder
    """
    return service.get_xia2_raw(run_id=run_id)

@router.get("/{run_id}/dataset/{dataset}/raw")
def get_raw_dataset(run_id: str, dataset: str):

    result = service.get_xia2_dataset_raw(run_id, dataset)
    return result

@router.get("/{run_id}/dataset/{dataset}/comparison")
def get_dataset_comparison(run_id: str, dataset: str):

    result = service.get_xia2_dataset_comparison(run_id, dataset)
    return result

@router.get("/{run_id}/raw/interpolated")
def get_interpolated_points(run_id: str, x: float):
    """
    Returns interpolated points at given value for CC_half
    """
    return service.get_cc_half_points(run_id=run_id, x=x)

@router.get("/{run_id}/comparison")
def get_comparison(run_id: str):
    """
    Returns comparison data extracted from run folder
    """
    return service.get_xia2_comparison(run_id=run_id)

@router.get("/{run_id}/memory")
def get_memory(run_id: str):
    """
    Returns memory data extracted from run folder
    """
    return service.get_xia2_memory(run_id=run_id)

@router.get("/{run_id}/memory/{dataset}")
def get_memory_plot(run_id: str, dataset: str):
    """
    Returns memory data extracted from run folder
    """
    return service.get_xia2_dataset_memplot(run_id=run_id, dataset=dataset)

@router.get("/{run_id}/memory/{dataset}/events")
def get_memory_timings(run_id: str, dataset: str):
    """
    Returns memory data extracted from run folder
    """
    return service.get_xia2_dataset_timing(run_id=run_id, dataset=dataset)

@router.get("/{run_id}/cumulative")
def get_cumulative_memory_timings(run_id: str):
    """
    Returns cumulative memory TIMINGS 
    """
    return service.get_xia2_dataset_cumulative_timings(run_id=run_id)

@router.get("/{run_id}/info/{dataset}")
def get_info(run_id: str, dataset: str):
    """
    Returns unit cell and space group info about dataset
    """
    return service.get_xia2_cell_space(run_id=run_id, dataset=dataset)