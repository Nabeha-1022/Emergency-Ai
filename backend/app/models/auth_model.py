from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    operator_name: str
    operator_email: str


class OperatorInfo(BaseModel):
    name: str
    email: str
    role: str = "operator"
