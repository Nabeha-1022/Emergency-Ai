from fastapi import APIRouter, HTTPException
from app.models.auth_model import LoginRequest, TokenResponse
from app.services.auth_service import verify_credentials, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Authenticate operator and return JWT token."""
    operator = verify_credentials(request.email, request.password)
    if not operator:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": operator["email"], "name": operator["name"]})
    return TokenResponse(
        access_token=token,
        operator_name=operator["name"],
        operator_email=operator["email"],
    )


@router.get("/me")
async def get_me():
    """Demo endpoint — returns hardcoded operator info."""
    return {"name": "John Smith", "email": "operator@emergency.ai", "role": "operator"}
