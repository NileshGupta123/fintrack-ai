from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.database import get_db
from app.models.user import Role, User

# Tells FastAPI to expect "Authorization: Bearer <token>" header
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Core auth dependency.
    1. Reads the Bearer token from the request header
    2. Decodes and validates the JWT
    3. Loads the user from DB
    4. Returns the user — or raises 401/403
    """
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is malformed.",
        )

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact an admin.",
        )

    return user


def require_roles(*roles: Role):
    """
    Role guard factory — returns a dependency that enforces role-based access.

    Usage:
        @router.post("/")
        async def create(user: Annotated[User, Depends(require_roles(Role.admin))]):

    How it works:
        - Calls get_current_user first to verify the JWT
        - Then checks if the user's role is in the allowed list
        - Raises 403 if not allowed
    """
    async def role_checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}",
            )
        return current_user

    return role_checker


# ─── Convenience guards ─────────────────────────────────────────────────────
# Use these directly in routes instead of calling require_roles() every time

require_admin = require_roles(Role.admin)
require_analyst_or_admin = require_roles(Role.analyst, Role.admin)
require_any_role = require_roles(Role.viewer, Role.analyst, Role.admin)