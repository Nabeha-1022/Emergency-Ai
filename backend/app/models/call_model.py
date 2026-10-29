from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid


class EntitiesModel(BaseModel):
    location: Optional[str] = None
    people: Optional[int] = None
    injuries: Optional[bool] = None
    vehicles: Optional[int] = None
    accident_type: Optional[str] = None
    emergency_type: Optional[str] = None
    additional_details: Optional[str] = None


class AnalysisResult(BaseModel):
    intent: str
    confidence: float
    severity: str
    severity_confidence: float
    entities: EntitiesModel
    recommended_services: List[str]
    protocol: List[str]
    explanation: str
    stress_level: str
    suggested_questions: List[str]


class CallCreate(BaseModel):
    transcript: str
    audio_source: Optional[str] = "text"  # text | audio | upload


class OperatorDecisionRequest(BaseModel):
    call_id: str
    operator_action: str  # ACCEPT | MODIFY | REJECT
    final_services: Optional[List[str]] = None
    final_severity: Optional[str] = None
    operator_notes: Optional[str] = None
    rejection_reason: Optional[str] = None


class CallRecord(BaseModel):
    call_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
    transcript: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    audio_source: str = "text"
    intent: Optional[str] = None
    confidence: Optional[float] = None
    severity: Optional[str] = None
    severity_confidence: Optional[float] = None
    entities: Optional[Dict[str, Any]] = None
    recommended_services: Optional[List[str]] = None
    retrieved_protocol: Optional[List[str]] = None
    explanation: Optional[str] = None
    stress_level: Optional[str] = None
    suggested_questions: Optional[List[str]] = None
    operator_action: Optional[str] = None
    final_decision: Optional[Dict[str, Any]] = None
    operator_notes: Optional[str] = None
    status: str = "PENDING"  # PENDING | RESOLVED | ESCALATED


class TranscribeResponse(BaseModel):
    transcript: str
    confidence: float
    source: str  # whisper | demo


class AnalyzeCallRequest(BaseModel):
    transcript: Optional[str] = None
    call_id: Optional[str] = None
