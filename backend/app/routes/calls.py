from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.models.call_model import CallCreate, CallRecord
from app.services import db_service

router = APIRouter(prefix="/api/calls", tags=["calls"])


@router.get("")
async def get_calls(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    severity: Optional[str] = Query(None),
    intent: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    """Get all calls with optional filtering."""
    calls = await db_service.get_all_calls(
        limit=limit, skip=skip,
        severity_filter=severity,
        intent_filter=intent,
        search=search,
    )
    return {"calls": calls, "count": len(calls)}


@router.get("/{call_id}")
async def get_call(call_id: str):
    """Get a single call by ID."""
    call = await db_service.get_call(call_id)
    if not call:
        raise HTTPException(status_code=404, detail=f"Call {call_id} not found")
    return call


@router.post("")
async def create_call(call: CallCreate):
    """Create a new call record (transcript only, no analysis)."""
    record = await db_service.create_call({
        "transcript": call.transcript,
        "audio_source": call.audio_source,
        "status": "PENDING",
    })
    return record
