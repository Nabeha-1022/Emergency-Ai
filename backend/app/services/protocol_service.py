"""
Protocol Retrieval Service (RAG-based)
Retrieves relevant emergency protocols from a local knowledge base
based on detected intent and severity.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

PROTOCOLS_PATH = Path(__file__).parent.parent / "data" / "protocols.json"

_protocols_cache: Optional[Dict[str, Any]] = None


def _load_protocols() -> Dict[str, Any]:
    global _protocols_cache
    if _protocols_cache is None:
        try:
            with open(PROTOCOLS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            _protocols_cache = data.get("protocols", {})
            logger.info(f"Loaded {len(_protocols_cache)} protocol categories")
        except FileNotFoundError:
            logger.error(f"Protocols file not found: {PROTOCOLS_PATH}")
            _protocols_cache = {}
    return _protocols_cache


def get_all_protocols() -> Dict[str, Any]:
    """Return full protocol knowledge base."""
    return _load_protocols()


def retrieve_protocol(intent: str, severity: str = "HIGH") -> Dict[str, Any]:
    """
    Retrieve emergency protocol for given intent and severity.
    Implements simple RAG: exact match → fuzzy match → default.
    """
    protocols = _load_protocols()

    # Exact match
    if intent in protocols:
        protocol_data = protocols[intent]
        steps = protocol_data["steps"].get(severity, protocol_data["steps"].get("HIGH", []))
        services = protocol_data["recommended_services"].get(
            severity, protocol_data["recommended_services"].get("HIGH", ["Police"])
        )
        return {
            "intent": intent,
            "severity": severity,
            "steps": steps,
            "recommended_services": services,
            "description": protocol_data.get("description", ""),
        }

    # Fuzzy match – find the closest protocol
    intent_lower = intent.lower()
    for protocol_name, protocol_data in protocols.items():
        if intent_lower in protocol_name.lower() or protocol_name.lower() in intent_lower:
            steps = protocol_data["steps"].get(severity, protocol_data["steps"].get("HIGH", []))
            services = protocol_data["recommended_services"].get(
                severity, protocol_data["recommended_services"].get("HIGH", ["Police"])
            )
            return {
                "intent": protocol_name,
                "severity": severity,
                "steps": steps,
                "recommended_services": services,
                "description": protocol_data.get("description", ""),
            }

    # Default fallback – generic emergency
    fallback = protocols.get("Other Emergency", {})
    steps = fallback.get("steps", {}).get(severity, ["Assess situation", "Dispatch appropriate services", "Document incident"])
    services = fallback.get("recommended_services", {}).get(severity, ["Police"])

    return {
        "intent": "Other Emergency",
        "severity": severity,
        "steps": steps,
        "recommended_services": services,
        "description": "General emergency protocol applied.",
    }


def list_protocol_categories() -> List[str]:
    """Return list of all protocol category names."""
    return list(_load_protocols().keys())
