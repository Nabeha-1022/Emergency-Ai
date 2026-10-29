from fastapi import APIRouter
from app.services.protocol_service import get_all_protocols, list_protocol_categories

router = APIRouter(prefix="/api", tags=["protocols"])


@router.get("/protocols")
async def get_protocols():
    """Return full emergency protocol knowledge base."""
    return {"protocols": get_all_protocols(), "categories": list_protocol_categories()}
