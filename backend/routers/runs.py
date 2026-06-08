from fastapi import APIRouter, HTTPException
from runs.service import RunService

router = APIRouter(
    prefix="/runs",
    tags=["runs"],
)

service = RunService()

@router.get("/")
async def list_runs():
    """
    Returns all available run folders in workspace area
    """
    return service.list_run_summaries()


@router.get("/{run_id}")
async def get_run(run_id: str):
    """
    Returns run metadata e.g. processed in cache
    """
    return service.get_run_summary(run_id=run_id)

@router.get("/{run_id}/raw")
async def get_raw(run_id: str):
    """
    Returns raw data extracted from run folder
    """
    return service.get_xia2_raw(run_id=run_id)

@router.get("/{run_id}/interpolated")
async def get_interpolated_points(run_id: str, x: float):
    """
    Returns interpolated points at given value for CC_half
    """
    return service.get_cc_half_points(run_id=run_id, x=x)

@router.get("/{run_id}/comparison")
async def get_comparison(run_id: str):
    """
    Returns comparison data extracted from run folder
    """
    return service.get_xia2_comparison(run_id=run_id)

@router.get("/{run_id}/memory")
async def get_memory(run_id: str):
    """
    Returns memory data extracted from run folder
    """
    return service.get_xia2_memory(run_id=run_id)