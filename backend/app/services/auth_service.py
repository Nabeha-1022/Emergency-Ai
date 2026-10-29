"""Auth service — JWT token creation and verification."""

import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
# pyrefly: ignore [missing-import]
from passlib.context import CryptContext
from typing import Optional

SECRET_KEY = os.getenv("SECRET_KEY", "emergency-ai-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# Demo credentials
DEMO_EMAIL = os.getenv("DEMO_OPERATOR_EMAIL", "operator@emergency.ai")
DEMO_PASSWORD = os.getenv("DEMO_OPERATOR_PASSWORD", "operator123")
DEMO_NAME = os.getenv("DEMO_OPERATOR_NAME", "John Smith")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash the demo password at startup
_DEMO_PASSWORD_HASH = pwd_context.hash(DEMO_PASSWORD)


def verify_credentials(email: str, password: str) -> Optional[dict]:
    """Verify login credentials. Returns operator info dict or None."""
    if email.lower() == DEMO_EMAIL.lower() and password == DEMO_PASSWORD:
        return {"email": DEMO_EMAIL, "name": DEMO_NAME, "role": "operator"}
    return None


def create_access_token(data: dict) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
