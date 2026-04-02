from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get my profile",
    description="Returns the currently authenticated user's profile.",
)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return current_user


@router.get(
    "/",
    summary="List all users",
    description="Returns paginated list of all users. Admin only.",
)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: Annotated[User, Depends(require_admin)] = None,
    db: AsyncSession = Depends(get_db),
):
    svc = UserService(db)
    result = await svc.list_users(page=page, page_size=page_size)
    result["items"] = [UserResponse.model_validate(u) for u in result["items"]]
    return result


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID",
    description="Returns a single user by ID. Admin only.",
)
async def get_user(
    user_id: int,
    _: Annotated[User, Depends(require_admin)] = None,
    db: AsyncSession = Depends(get_db),
):
    svc = UserService(db)
    return await svc.get_user_by_id(user_id)


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user",
    description="Update a user's role or active status. Admin only.",
)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    _: Annotated[User, Depends(require_admin)] = None,
    db: AsyncSession = Depends(get_db),
):
    svc = UserService(db)
    return await svc.update_user(user_id, payload)


@router.delete(
    "/{user_id}",
    status_code=204,
    summary="Delete user",
    description="Permanently delete a user. Admin only.",
)
async def delete_user(
    user_id: int,
    _: Annotated[User, Depends(require_admin)] = None,
    db: AsyncSession = Depends(get_db),
):
    svc = UserService(db)
    await svc.delete_user(user_id)