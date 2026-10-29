import logging
from fastapi import APIRouter, HTTPException
from app.models.call_model import OperatorDecisionRequest
from app.services import db_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["operator"])


@router.post("/operator-decision")
async def record_operator_decision(request: OperatorDecisionRequest):
    """
    Record the operator's Human-in-the-Loop decision:
    ACCEPT | MODIFY | REJECT
    Updates the call record and marks it as RESOLVED.
    """
    call = await db_service.get_call(request.call_id)
    if not call:
        raise HTTPException(status_code=404, detail=f"Call {request.call_id} not found")

    action = request.operator_action.upper()
    if action not in ("ACCEPT", "MODIFY", "REJECT"):
        raise HTTPException(status_code=400, detail="operator_action must be ACCEPT, MODIFY, or REJECT")

    # Build final decision record
    if action == "ACCEPT":
        final_decision = {
            "services": call.get("recommended_services", []),
            "severity": call.get("severity"),
            "notes": request.operator_notes or "",
        }
    elif action == "MODIFY":
        final_decision = {
            "services": request.final_services or call.get("recommended_services", []),
            "severity": request.final_severity or call.get("severity"),
            "notes": request.operator_notes or "",
        }
    else:  # REJECT
        final_decision = {
            "services": [],
            "severity": call.get("severity"),
            "notes": request.operator_notes or "",
            "rejection_reason": request.rejection_reason or "No reason provided",
        }

    updates = {
        "operator_action": action,
        "final_decision": final_decision,
        "operator_notes": request.operator_notes,
        "status": "RESOLVED",
    }

    updated = await db_service.update_call(request.call_id, updates)
    return {
        "success": True,
        "call_id": request.call_id,
        "operator_action": action,
        "final_decision": final_decision,
        "status": "RESOLVED",
    }
