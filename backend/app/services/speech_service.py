"""
Speech-to-Text Service
Uses Whisper if available; falls back to demo mode gracefully.
"""

import logging
import os
import tempfile
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL", "demo")

# Pre-defined demo transcripts for testing when Whisper is unavailable
DEMO_TRANSCRIPTS = [
    (
        "There has been a major road accident near Vadapalani. Two cars have collided "
        "and three people are injured. Please send an ambulance immediately.",
        0.92
    ),
    (
        "There is a fire in the building on Anna Salai. Smoke is coming from the third floor. "
        "Several people are trapped inside. Please send the fire department right away.",
        0.89
    ),
    (
        "A person has collapsed on the street near T Nagar bus stop. They are unconscious "
        "and not responding. We need an ambulance urgently.",
        0.95
    ),
]

_whisper_model = None
_whisper_available = False


def _try_load_whisper():
    """Attempt to load Whisper model. Returns True if successful."""
    global _whisper_model, _whisper_available
    if WHISPER_MODEL_SIZE == "demo":
        logger.info("Whisper model set to 'demo' — using fallback STT")
        return False
    try:
        import whisper
        logger.info(f"Loading Whisper model: {WHISPER_MODEL_SIZE}")
        _whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
        _whisper_available = True
        logger.info("Whisper model loaded successfully")
        return True
    except ImportError:
        logger.warning("Whisper not installed. Using demo fallback.")
        return False
    except Exception as e:
        logger.warning(f"Failed to load Whisper: {e}. Using demo fallback.")
        return False


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.wav") -> Tuple[str, float, str]:
    """
    Transcribe audio bytes to text.
    Returns: (transcript, confidence, source)
    source is 'whisper' or 'demo'
    """
    global _whisper_model, _whisper_available

    # Try Whisper first
    if _whisper_available and _whisper_model is not None:
        try:
            suffix = Path(filename).suffix or ".wav"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            result = _whisper_model.transcribe(tmp_path)
            transcript = result.get("text", "").strip()
            confidence = 0.90  # Whisper doesn't return confidence; use fixed estimate

            # Cleanup
            Path(tmp_path).unlink(missing_ok=True)

            if transcript:
                return transcript, confidence, "whisper"
        except Exception as e:
            logger.error(f"Whisper transcription failed: {e}")

    # Demo fallback
    logger.info("Using demo STT fallback")
    transcript, confidence = DEMO_TRANSCRIPTS[0]
    return transcript, confidence, "demo"


def get_stt_status() -> dict:
    """Return current STT engine status."""
    return {
        "whisper_available": _whisper_available,
        "model_size": WHISPER_MODEL_SIZE if _whisper_available else None,
        "mode": "whisper" if _whisper_available else "demo",
    }


# Initialize on import
_try_load_whisper()
