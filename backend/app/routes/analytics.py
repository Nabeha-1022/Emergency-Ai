from fastapi import APIRouter
from app.services import db_service

router = APIRouter(prefix="/api", tags=["analytics"])


@router.get("/analytics")
async def get_analytics():
    """Return aggregated analytics data for the dashboard."""
    return await db_service.get_analytics()
