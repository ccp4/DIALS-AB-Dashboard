from fastapi import APIRouter, HTTPException
from runs.service import RunService

router = APIRouter(
    prefix="/runs",
    tags=["runs"],
)


@router.get("/")
async def list_runs():
    """
    Returns all available run folders in workspace area
    """
    service = RunService()
    return service.list_run_summaries()


@router.get("/{run_id}")
async def get_run(run_id: str):
    """
    Returns run metadata e.g. processed in cache
    """
    return


@router.get("/{run_id}/data")
async def get_run_data(run_id: str):
    """
    Returns refined data extracted from run folder
    """

    return