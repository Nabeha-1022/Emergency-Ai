"""
NLP Pipeline Service
Implements: Preprocessing → Intent Classification → Severity Classification → Entity Extraction
Uses keyword-based fallback when Transformer models are unavailable.
"""

import re
import logging
from typing import Dict, Any, List, Tuple, Optional

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# Intent keyword mapping (fallback classifier)
# ─────────────────────────────────────────────
INTENT_KEYWORDS: Dict[str, List[str]] = {
    "Road Accident": [
        "accident", "crash", "collision", "collided", "vehicle", "car", "truck",
        "motorcycle", "bike", "road", "highway", "highway", "overturn", "overturned",
        "skid", "skidded", "hit", "rammed", "smashed", "fender", "pedestrian hit",
        "road accident", "traffic accident", "car accident", "vehicle accident",
    ],
    "Medical Emergency": [
        "heart attack", "cardiac arrest", "cardiac", "unconscious", "not breathing",
        "stopped breathing", "bleeding", "heavy bleeding", "severe bleeding",
        "injury", "injured", "hurt", "pain", "chest pain", "stroke", "seizure",
        "epilepsy", "diabetic", "overdose", "poison", "poisoned", "allergic",
        "anaphylaxis", "choking", "ambulance", "medical", "sick", "ill", "collapse",
        "collapsed", "fell", "fall", "fainted", "faint", "unconscious", "not waking",
    ],
    "Fire": [
        "fire", "smoke", "burning", "burn", "burnt", "flames", "blaze",
        "explosion", "explode", "exploded", "arson", "ignite", "ignited",
        "flammable", "gas leak", "gas leaking", "on fire", "house fire",
        "building fire", "forest fire",
    ],
    "Crime": [
        "robbery", "robbing", "rob", "theft", "stolen", "steal", "stole",
        "attack", "attacking", "assault", "assaulted", "violence", "violent",
        "weapon", "gun", "gunshot", "knife", "stabbing", "stabbed", "shot",
        "murder", "killing", "killed", "break-in", "broke in", "burglary",
        "burglar", "rape", "kidnap", "kidnapped", "abduct", "abducted",
        "threat", "threatening", "crime", "criminal", "suspect",
    ],
    "Missing Person": [
        "missing", "disappeared", "disappear", "lost person", "cannot find",
        "not found", "gone missing", "missing child", "missing person",
        "abducted", "kidnapped", "runaway", "ran away", "not come home",
        "not returned", "whereabouts unknown",
    ],
    "Natural Disaster": [
        "earthquake", "quake", "tremor", "flood", "flooding", "flooded",
        "cyclone", "hurricane", "tornado", "typhoon", "tsunami", "landslide",
        "mudslide", "storm", "severe storm", "disaster", "natural disaster",
        "collapsed building", "building collapse", "structure collapse", "trapped",
        "sinkhole",
    ],
}

# ─────────────────────────────────────────────
# Severity keyword mapping
# ─────────────────────────────────────────────
HIGH_SEVERITY_KEYWORDS = [
    "serious", "critical", "severe", "major", "multiple injured", "many injured",
    "multiple people", "several people", "unconscious", "not breathing",
    "heavy bleeding", "trapped", "on fire", "explosion", "immediate", "urgent",
    "life-threatening", "life threatening", "dying", "dead", "fatality", "fatal",
    "multiple victims", "mass casualty", "help immediately", "emergency",
]

MEDIUM_SEVERITY_KEYWORDS = [
    "injured", "injury", "hurt", "bleeding", "accident", "moderate", "broken",
    "fracture", "some people", "few people", "two people", "one person",
    "minor accident", "fender bender", "property damage",
]

LOW_SEVERITY_KEYWORDS = [
    "minor", "small", "slight", "complaint", "non-critical", "not serious",
    "information", "report", "no injuries", "nobody hurt",
]

# ─────────────────────────────────────────────
# Entity extraction patterns
# ─────────────────────────────────────────────
NUMBER_WORDS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "a": 1, "an": 1,
}

ACCIDENT_TYPE_PATTERNS = {
    "Vehicle Collision": ["collision", "collided", "crash", "crashed", "smashed", "rammed", "hit"],
    "Vehicle Overturn": ["overturned", "overturn", "flipped", "rolled over"],
    "Pedestrian Hit": ["pedestrian", "person hit", "person struck", "walking"],
    "Head-on Collision": ["head-on", "head on", "frontal"],
    "Rear-end Collision": ["rear-end", "rear end", "from behind"],
    "Chain Accident": ["chain accident", "multiple vehicles", "pile-up", "pileup"],
}


def preprocess_text(text: str) -> str:
    """Clean and normalize transcript text."""
    text = text.strip()
    text = re.sub(r'\s+', ' ', text)
    text = text.lower()
    return text


def classify_intent(text: str) -> Tuple[str, float]:
    """
    Keyword-based intent classifier.
    Returns (intent_label, confidence_score).
    Confidence is computed from keyword match density.
    """
    text_lower = text.lower()
    scores: Dict[str, int] = {}

    for intent, keywords in INTENT_KEYWORDS.items():
        score = 0
        for kw in keywords:
            if kw in text_lower:
                # Multi-word keywords get higher weight
                weight = len(kw.split())
                score += weight
        scores[intent] = score

    if not any(scores.values()):
        return "Other Emergency", 0.55

    best_intent = max(scores, key=lambda k: scores[k])
    best_score = scores[best_intent]
    total_score = sum(scores.values()) + 1e-9

    # Normalize to a confidence range [0.60, 0.99]
    raw_confidence = min(best_score / max(total_score * 0.6, 1), 1.0)
    confidence = 0.60 + raw_confidence * 0.39

    return best_intent, round(confidence, 2)


def classify_severity(text: str, intent: str, entities: Dict[str, Any]) -> Tuple[str, float]:
    """
    Rule-based severity classifier.
    Returns (severity_label, confidence_score).
    """
    text_lower = text.lower()

    high_score = sum(1 for kw in HIGH_SEVERITY_KEYWORDS if kw in text_lower)
    medium_score = sum(1 for kw in MEDIUM_SEVERITY_KEYWORDS if kw in text_lower)
    low_score = sum(1 for kw in LOW_SEVERITY_KEYWORDS if kw in text_lower)

    # Boost severity based on entity signals
    people = entities.get("people") or 0
    injuries = entities.get("injuries", False)
    vehicles = entities.get("vehicles") or 0

    if people >= 3:
        high_score += 2
    elif people == 2:
        medium_score += 1
    elif people == 1:
        medium_score += 0.5

    if injuries:
        high_score += 1

    if vehicles >= 2:
        high_score += 1

    # Intent-based severity defaults
    intent_high_defaults = ["Fire", "Natural Disaster"]
    intent_medium_defaults = ["Crime", "Medical Emergency"]

    if intent in intent_high_defaults and high_score == 0:
        high_score += 1

    if high_score > medium_score and high_score > low_score:
        confidence = min(0.70 + (high_score * 0.05), 0.99)
        return "HIGH", round(confidence, 2)
    elif medium_score > low_score:
        confidence = min(0.65 + (medium_score * 0.05), 0.95)
        return "MEDIUM", round(confidence, 2)
    else:
        return "LOW", 0.70


def extract_entities(text: str, intent: str) -> Dict[str, Any]:
    """Extract structured entities from emergency transcript."""
    text_lower = text.lower()
    entities: Dict[str, Any] = {}

    # --- Location extraction ---
    location = _extract_location(text_lower)
    if location:
        entities["location"] = location

    # --- People count ---
    people = _extract_count(text_lower, ["person", "people", "individual", "victim", "passenger", "pedestrian"])
    if people:
        entities["people"] = people

    # --- Vehicle count ---
    vehicles = _extract_count(text_lower, ["car", "vehicle", "truck", "motorcycle", "bike", "bus", "lorry"])
    if vehicles:
        entities["vehicles"] = vehicles

    # --- Injuries ---
    injury_keywords = ["injur", "hurt", "wound", "bleed", "fracture", "broken bone", "critical condition"]
    entities["injuries"] = any(kw in text_lower for kw in injury_keywords)

    # --- Accident type ---
    if intent == "Road Accident":
        accident_type = _extract_accident_type(text_lower)
        if accident_type:
            entities["accident_type"] = accident_type

    # --- Emergency type ---
    entities["emergency_type"] = intent

    return entities


def _extract_location(text: str) -> Optional[str]:
    """Extract location mentions from text using pattern matching."""
    # Pattern: "near X", "at X", "in X", "on X road/street/avenue"
    patterns = [
        r'near\s+([A-Za-z][A-Za-z\s]{2,30}?)(?:\.|,|$|\band\b|\bthe\b)',
        r'at\s+([A-Za-z][A-Za-z\s]{2,30}?)(?:\.|,|$|\band\b)',
        r'in\s+([A-Za-z][A-Za-z\s]{2,30}?)(?:\.|,|$|\band\b)',
        r'on\s+([A-Za-z][A-Za-z\s]{2,30}?(?:road|street|avenue|lane|highway|junction|signal|bridge|flyover))',
        r'at\s+the\s+([A-Za-z][A-Za-z\s]{2,30}?)(?:\.|,|$)',
    ]

    # Use original (non-lowercased) text for proper noun detection
    import re
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            location = match.group(1).strip()
            if len(location) > 2:
                return location.title()
    return None


def _extract_count(text: str, entity_keywords: List[str]) -> Optional[int]:
    """Extract numeric count preceding an entity keyword."""
    import re

    # Match: "3 cars", "two vehicles", "a person"
    pattern = r'(\d+|' + '|'.join(NUMBER_WORDS.keys()) + r')\s+(?:\w+\s+)?(?:' + '|'.join(entity_keywords) + r')'
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        raw = match.group(1).lower()
        if raw.isdigit():
            return int(raw)
        return NUMBER_WORDS.get(raw, 1)
    return None


def _extract_accident_type(text: str) -> Optional[str]:
    """Detect type of road accident."""
    for accident_type, keywords in ACCIDENT_TYPE_PATTERNS.items():
        if any(kw in text for kw in keywords):
            return accident_type
    return "Vehicle Collision"  # default for road accidents


def analyze_stress_level(text: str) -> str:
    """Detect caller panic/stress level based on keywords."""
    text_lower = text.lower()
    
    severe_keywords = ["help", "oh my god", "omg", "hurry", "fast", "blood", "fire", "dying", "dead", "please", "gun", "shot"]
    elevated_keywords = ["scared", "worried", "pain", "hurt", "injured", "stolen", "lost"]
    
    # Check for excessive uppercase words as a sign of panic
    uppercase_words = [w for w in text.split() if w.isupper() and len(w) > 2]
    
    severe_count = sum(1 for kw in severe_keywords if kw in text_lower)
    elevated_count = sum(1 for kw in elevated_keywords if kw in text_lower)
    
    if severe_count >= 2 or len(uppercase_words) >= 2:
        return "SEVERE"
    elif severe_count == 1 or elevated_count >= 1:
        return "ELEVATED"
    else:
        return "NORMAL"


def generate_suggested_questions(intent: str, entities: Dict[str, Any]) -> List[str]:
    """Generate dynamic follow-up questions based on missing entities."""
    questions = []
    
    if "location" not in entities:
        questions.append("Can you confirm your exact location or nearest landmark?")
        
    if "people" not in entities and intent in ["Road Accident", "Medical Emergency", "Fire"]:
        questions.append("How many people are involved or injured?")
        
    if intent == "Road Accident" and "vehicles" not in entities:
        questions.append("How many vehicles are involved in the collision?")
        
    if intent == "Crime":
        if "injuries" not in entities:
            questions.append("Is anyone hurt or bleeding?")
        questions.append("Is the suspect still at the scene or armed?")
        
    if intent == "Fire":
        questions.append("Is anyone trapped inside the building?")
        
    if intent == "Medical Emergency" and "people" in entities and "injuries" not in entities:
        questions.append("Is the person conscious and breathing?")
        
    # Default fallback questions if none applied but we still want to suggest something
    if not questions:
        questions.append("Are you currently in a safe location?")
        questions.append("Can you provide any additional descriptive details?")
        
    return questions[:3]  # Return max 3 questions


def generate_explanation(intent: str, severity: str, entities: Dict[str, Any]) -> str:
    """Generate a human-readable explanation for the AI recommendation."""
    parts = []

    people = entities.get("people")
    injuries = entities.get("injuries", False)
    location = entities.get("location")
    vehicles = entities.get("vehicles")
    accident_type = entities.get("accident_type")

    if people and people > 1:
        parts.append(f"{people} people reported involved")
    elif people == 1:
        parts.append("1 person reported involved")

    if injuries:
        parts.append("injuries confirmed")

    if vehicles and vehicles > 1:
        parts.append(f"{vehicles} vehicles involved")

    if accident_type:
        parts.append(f"incident classified as {accident_type}")

    if location:
        parts.append(f"location identified as {location}")

    if parts:
        detail = ", ".join(parts)
        return f"Analysis detected {intent.lower()} with {severity.lower()} severity: {detail}."
    else:
        return f"Analysis detected {intent.lower()} with {severity.lower()} severity based on transcript keywords."


def run_full_pipeline(transcript: str) -> Dict[str, Any]:
    """
    Execute the full NLP analysis pipeline.
    Returns a complete analysis dict ready for API response.
    """
    logger.info("Starting NLP pipeline analysis...")

    # Step 1: Preprocess
    clean_text = preprocess_text(transcript)

    # Step 2: Intent classification
    intent, intent_confidence = classify_intent(clean_text)
    logger.info(f"Intent: {intent} ({intent_confidence:.2f})")

    # Step 3: Entity extraction
    entities = extract_entities(transcript, intent)
    logger.info(f"Entities: {entities}")

    # Step 4: Severity classification
    severity, severity_confidence = classify_severity(clean_text, intent, entities)
    logger.info(f"Severity: {severity} ({severity_confidence:.2f})")

    # Step 5: Generate explanation
    explanation = generate_explanation(intent, severity, entities)
    
    # Step 6: Analyze stress and generate questions
    stress_level = analyze_stress_level(transcript)
    suggested_questions = generate_suggested_questions(intent, entities)

    return {
        "intent": intent,
        "confidence": intent_confidence,
        "severity": severity,
        "severity_confidence": severity_confidence,
        "entities": entities,
        "explanation": explanation,
        "stress_level": stress_level,
        "suggested_questions": suggested_questions,
    }
