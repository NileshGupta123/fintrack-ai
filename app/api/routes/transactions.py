from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.middleware.auth import get_current_user, require_admin, require_analyst_or_admin
from app.models.transaction import Category, TransactionType
from app.models.user import User, Role
from app.schemas.transaction import (
    PaginatedTransactions,
    TransactionCreate,
    TransactionFilter,
    TransactionResponse,
    TransactionUpdate,
)
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=201,
    summary="Create a transaction",
    description="Create a new financial record. Analyst and Admin only.",
)
async def create_transaction(
    payload: TransactionCreate,
    current_user: Annotated[User, Depends(require_analyst_or_admin)],
    db: AsyncSession = Depends(get_db),
):
    svc = TransactionService(db)
    return await svc.create_transaction(payload, current_user)


@router.get(
    "/",
    response_model=PaginatedTransactions,
    summary="List transactions",
    description="List all transactions with optional filters and pagination. All authenticated users.",
)
async def list_transactions(
    type: Optional[TransactionType] = Query(None, description="Filter by income or expense"),
    category: Optional[Category] = Query(None, description="Filter by category"),
    date_from: Optional[date] = Query(None, description="Filter from date YYYY-MM-DD"),
    date_to: Optional[date] = Query(None, description="Filter to date YYYY-MM-DD"),
    search: Optional[str] = Query(None, description="Search keyword in notes"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db),
):
    svc = TransactionService(db)
    filters = TransactionFilter(
        type=type,
        category=category,
        date_from=date_from,
        date_to=date_to,
        search=search,
        page=page,
        page_size=page_size,
    )
    result = await svc.list_transactions(filters, current_user)
    result["items"] = [TransactionResponse.model_validate(t) for t in result["items"]]
    return result


@router.get(
    "/{tx_id}",
    response_model=TransactionResponse,
    summary="Get a transaction",
    description="Get a single transaction by ID. All authenticated users.",
)
async def get_transaction(
    tx_id: int,
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: AsyncSession = Depends(get_db),
):
    svc = TransactionService(db)
    return await svc.get_transaction(tx_id)


@router.patch(
    "/{tx_id}",
    response_model=TransactionResponse,
    summary="Update a transaction",
    description="Update an existing transaction. Analyst and Admin only.",
)
async def update_transaction(
    tx_id: int,
    payload: TransactionUpdate,
    current_user: Annotated[User, Depends(require_analyst_or_admin)],
    db: AsyncSession = Depends(get_db),
):
    svc = TransactionService(db)
    return await svc.update_transaction(tx_id, payload, current_user)


@router.delete(
    "/{tx_id}",
    status_code=204,
    summary="Delete a transaction",
    description="Soft delete a transaction. Record is hidden but stays in DB. Admin only.",
)
async def delete_transaction(
    tx_id: int,
    current_user: Annotated[User, Depends(require_admin)],
    db: AsyncSession = Depends(get_db),
):
    svc = TransactionService(db)
    await svc.delete_transaction(tx_id, current_user)