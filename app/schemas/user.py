from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import Role


# ─── Request Schemas (what the client sends) ───────────────────────────────


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=6, max_length=100)
    role: Role = Role.viewer  # default role is viewer

    @field_validator("full_name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be blank")
        return v.strip()


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    role: Optional[Role] = None
    is_active: Optional[bool] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


# ─── Response Schemas (what we send back) ──────────────────────────────────


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: Role
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}  # allows converting ORM model to schema


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse