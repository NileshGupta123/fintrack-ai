from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, LoginRequest, TokenResponse, UserResponse


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, payload: UserCreate) -> User:
        # Check if email already exists
        existing = await self.db.execute(
            select(User).where(User.email == payload.email)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{payload.email}' is already registered.",
            )

        user = User(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
            role=payload.role,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_user_by_id(self, user_id: int) -> User:
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id {user_id} not found.",
            )
        return user

    async def list_users(self, page: int = 1, page_size: int = 20) -> dict:
        offset = (page - 1) * page_size

        # Get total count
        count_result = await self.db.execute(select(func.count()).select_from(User))
        total = count_result.scalar()

        # Get paginated users
        result = await self.db.execute(
            select(User).offset(offset).limit(page_size)
        )
        users = result.scalars().all()

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": -(-total // page_size),  # ceiling division
            "items": users,
        }

    async def update_user(self, user_id: int, payload: UserUpdate) -> User:
        user = await self.get_user_by_id(user_id)

        # Only update fields that were actually sent
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def delete_user(self, user_id: int) -> None:
        user = await self.get_user_by_id(user_id)
        await self.db.delete(user)
        await self.db.commit()

    async def login(self, payload: LoginRequest) -> TokenResponse:
        # Find user by email
        result = await self.db.execute(
            select(User).where(User.email == payload.email)
        )
        user = result.scalar_one_or_none()

        # Same error for wrong email or wrong password
        # Never tell the client which one was wrong — security best practice
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated. Contact an admin.",
            )

        token = create_access_token({
            "sub": str(user.id),
            "role": user.role.value,
        })

        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        )