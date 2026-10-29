import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.nlp_pipeline import run_full_pipeline
from app.services.protocol_service import retrieve_protocol
from app.services.speech_service import transcribe_audio, get_stt_status
from app.services import db_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["analysis"])


class AnalyzeTextRequest(BaseModel):
    transcript: str
    save: Optional[bool] = True


@router.post("/analyze-call")
async def analyze_call(request: AnalyzeTextRequest):
    """
    Full AI analysis pipeline:
    Preprocessing → Intent → Severity → Entities → Protocol → Recommendation
    """
    if not request.transcript or not request.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")

    transcript = request.transcript.strip()

    try:
        # Run NLP pipeline
        analysis = run_full_pipeline(transcript)

        # Retrieve emergency protocol
        protocol_data = retrieve_protocol(
            intent=analysis["intent"],
            severity=analysis["severity"]
        )

        # Build full response
        result = {
            "intent": analysis["intent"],
            "confidence": analysis["confidence"],
            "severity": analysis["severity"],
            "severity_confidence": analysis["severity_confidence"],
            "entities": analysis["entities"],
            "recommended_services": protocol_data["recommended_services"],
            "protocol": protocol_data["steps"],
            "explanation": analysis["explanation"],
            "ai_mode": "nlp_pipeline",
        }

        # Save to DB if requested
        if request.save:
            call_record = await db_service.create_call({
                "transcript": transcript,
                "audio_source": "text",
                "intent": result["intent"],
                "confidence": result["confidence"],
                "severity": result["severity"],
                "severity_confidence": result["severity_confidence"],
                "entities": result["entities"],
                "recommended_services": result["recommended_services"],
                "retrieved_protocol": result["protocol"],
                "explanation": result["explanation"],
                "status": "PENDING",
            })
            result["call_id"] = call_record["call_id"]

        return result

    except Exception as e:
        logger.error(f"Analysis pipeline error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """
    Convert uploaded audio file to text using Whisper (or demo fallback).
    Supports: wav, mp3, m4a, ogg, webm
    """
    allowed_types = [
        "audio/wav", "audio/mpeg", "audio/mp3", "audio/ogg",
        "audio/webm", "audio/x-wav", "audio/wave", "video/webm",
        "application/octet-stream",
    ]

    if file.content_type not in allowed_types:
        # Try to infer from filename
        filename = file.filename or ""
        if not any(filename.lower().endswith(ext) for ext in [".wav", ".mp3", ".m4a", ".ogg", ".webm"]):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}. Use wav, mp3, m4a, ogg, or webm."
            )

    try:
        audio_bytes = await file.read()
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Audio file is empty")

        transcript, confidence, source = transcribe_audio(audio_bytes, file.filename or "audio.wav")

        return {
            "transcript": transcript,
            "confidence": confidence,
            "source": source,
            "filename": file.filename,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/retrieve-protocol")
async def retrieve_protocol_endpoint(body: dict):
    """Retrieve emergency protocol for a given intent and severity."""
    intent = body.get("intent", "Other Emergency")
    severity = body.get("severity", "HIGH")
    return retrieve_protocol(intent=intent, severity=severity)


@router.get("/stt-status")
async def stt_status():
    """Return current STT engine status."""
    return get_stt_status()
