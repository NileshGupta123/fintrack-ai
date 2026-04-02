from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.user import LoginRequest, TokenResponse, UserCreate, UserResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
    summary="Register a new user",
    description="Creates a new user account. Default role is viewer.",
)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    svc = UserService(db)
    return await svc.create_user(payload)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and get access token",
    description="Authenticate with email and password. Returns a JWT token valid for 24 hours.",
)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    svc = UserService(db)
    return await svc.login(payload)