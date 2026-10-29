"""
Database Service
Supports MongoDB (via motor) with automatic fallback to TinyDB JSON file storage.
"""

import logging
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

USE_JSON_FALLBACK = os.getenv("USE_JSON_FALLBACK", "false").lower() == "true"
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "emergency_ai")

DB_FILE_PATH = Path(__file__).parent.parent / "data" / "calls_db.json"

# ─────────────────────────────────────────────
# TinyDB Fallback
# ─────────────────────────────────────────────
_tinydb = None


def _get_tinydb():
    global _tinydb
    if _tinydb is None:
        from tinydb import TinyDB
        DB_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        _tinydb = TinyDB(str(DB_FILE_PATH))
        logger.info(f"TinyDB initialized at {DB_FILE_PATH}")
    return _tinydb


# ─────────────────────────────────────────────
# MongoDB
# ─────────────────────────────────────────────
_mongo_client = None
_mongo_db = None
_using_mongo = False


async def init_db():
    """Initialize database connection. Falls back to TinyDB if MongoDB unavailable."""
    global _mongo_client, _mongo_db, _using_mongo

    if USE_JSON_FALLBACK:
        logger.info("JSON fallback mode forced via environment variable.")
        _get_tinydb()
        return

    try:
        import motor.motor_asyncio
        client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGO_URL, serverSelectionTimeoutMS=3000
        )
        # Test connection
        await client.admin.command("ping")
        _mongo_client = client
        _mongo_db = client[MONGO_DB_NAME]
        _using_mongo = True
        logger.info(f"Connected to MongoDB: {MONGO_DB_NAME}")

        # Create indexes
        await _mongo_db.calls.create_index("call_id", unique=True)
        await _mongo_db.calls.create_index("timestamp")
    except ImportError:
        logger.warning("motor not installed. Falling back to TinyDB JSON storage.")
        _get_tinydb()
    except Exception as e:
        logger.warning(f"MongoDB unavailable ({e}). Falling back to TinyDB JSON storage.")
        _get_tinydb()


def is_using_mongo() -> bool:
    return _using_mongo


# ─────────────────────────────────────────────
# Unified DB operations
# ─────────────────────────────────────────────

async def create_call(call_data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a new call record."""
    call_data.setdefault("call_id", str(uuid.uuid4())[:8].upper())
    call_data.setdefault("timestamp", datetime.utcnow().isoformat())
    call_data.setdefault("status", "PENDING")

    if _using_mongo:
        await _mongo_db.calls.insert_one({**call_data})
        call_data.pop("_id", None)
    else:
        db = _get_tinydb()
        db.table("calls").insert(call_data)

    return call_data


async def get_call(call_id: str) -> Optional[Dict[str, Any]]:
    """Get a single call by ID."""
    if _using_mongo:
        doc = await _mongo_db.calls.find_one({"call_id": call_id}, {"_id": 0})
        return doc
    else:
        from tinydb import Query
        db = _get_tinydb()
        Call = Query()
        results = db.table("calls").search(Call.call_id == call_id)
        return results[0] if results else None


async def get_all_calls(
    limit: int = 100,
    skip: int = 0,
    severity_filter: Optional[str] = None,
    intent_filter: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Get all calls with optional filtering."""
    if _using_mongo:
        query: Dict = {}
        if severity_filter:
            query["severity"] = severity_filter
        if intent_filter:
            query["intent"] = intent_filter
        if search:
            query["$or"] = [
                {"transcript": {"$regex": search, "$options": "i"}},
                {"entities.location": {"$regex": search, "$options": "i"}},
            ]
        cursor = _mongo_db.calls.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
    else:
        from tinydb import Query
        db = _get_tinydb()
        all_calls = db.table("calls").all()

        # Apply filters
        if severity_filter:
            all_calls = [c for c in all_calls if c.get("severity") == severity_filter]
        if intent_filter:
            all_calls = [c for c in all_calls if c.get("intent") == intent_filter]
        if search:
            search_lower = search.lower()
            all_calls = [
                c for c in all_calls
                if search_lower in (c.get("transcript") or "").lower()
                or search_lower in str(c.get("entities", {}).get("location") or "").lower()
            ]

        # Sort by timestamp descending
        all_calls.sort(key=lambda c: c.get("timestamp", ""), reverse=True)
        return all_calls[skip: skip + limit]


async def update_call(call_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a call record."""
    if _using_mongo:
        await _mongo_db.calls.update_one({"call_id": call_id}, {"$set": updates})
        return await get_call(call_id)
    else:
        from tinydb import Query
        db = _get_tinydb()
        Call = Query()
        db.table("calls").update(updates, Call.call_id == call_id)
        return await get_call(call_id)


async def get_analytics() -> Dict[str, Any]:
    """Compute analytics from all call records."""
    all_calls = await get_all_calls(limit=10000)

    total = len(all_calls)
    severity_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    intent_counts: Dict[str, int] = {}
    action_counts = {"ACCEPT": 0, "MODIFY": 0, "REJECT": 0}
    status_counts = {"PENDING": 0, "RESOLVED": 0, "ESCALATED": 0}

    for call in all_calls:
        sev = call.get("severity", "LOW")
        if sev in severity_counts:
            severity_counts[sev] += 1

        intent = call.get("intent", "Other Emergency")
        intent_counts[intent] = intent_counts.get(intent, 0) + 1

        action = call.get("operator_action")
        if action in action_counts:
            action_counts[action] += 1

        status = call.get("status", "PENDING")
        if status in status_counts:
            status_counts[status] += 1

    resolved = sum(1 for c in all_calls if c.get("status") == "RESOLVED")
    active = sum(1 for c in all_calls if c.get("status") == "PENDING")

    return {
        "total_calls": total,
        "active_calls": active,
        "resolved_calls": resolved,
        "high_severity": severity_counts["HIGH"],
        "severity_breakdown": severity_counts,
        "intent_breakdown": intent_counts,
        "action_breakdown": action_counts,
        "status_breakdown": status_counts,
        "db_mode": "mongodb" if _using_mongo else "json",
    }


async def seed_demo_data():
    """Seed database with realistic demo data if empty."""
    existing = await get_all_calls(limit=1)
    if existing:
        return  # Already has data

    logger.info("Seeding demo data...")
    import json
    seed_path = Path(__file__).parent.parent / "data" / "sample_calls.json"
    if seed_path.exists():
        with open(seed_path, "r") as f:
            sample_calls = json.load(f)
        for call in sample_calls:
            await create_call(call)
        logger.info(f"Seeded {len(sample_calls)} demo calls")
