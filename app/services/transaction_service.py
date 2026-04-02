import math

from fastapi import HTTPException, status
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction
from app.models.user import User, Role
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionFilter


class TransactionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _active(self):
        """Base filter — always exclude soft deleted records."""
        return Transaction.is_deleted == False  # noqa: E712

    async def create_transaction(
        self, payload: TransactionCreate, current_user: User
    ) -> Transaction:
        tx = Transaction(
            amount=payload.amount,
            type=payload.type,
            category=payload.category,
            date=payload.date,
            notes=payload.notes,
            created_by=current_user.id,
        )
        self.db.add(tx)
        await self.db.commit()
        await self.db.refresh(tx)
        return tx

    async def get_transaction(self, tx_id: int) -> Transaction:
        result = await self.db.execute(
            select(Transaction).where(
                and_(Transaction.id == tx_id, self._active())
            )
        )
        tx = result.scalar_one_or_none()
        if not tx:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction {tx_id} not found.",
            )
        return tx

    async def list_transactions(
        self, filters: TransactionFilter, current_user: User
    ) -> dict:
        query = select(Transaction).where(self._active())

        # ── Filters ────────────────────────────────────────────────
        if filters.type:
            query = query.where(Transaction.type == filters.type)

        if filters.category:
            query = query.where(Transaction.category == filters.category)

        if filters.date_from:
            query = query.where(Transaction.date >= filters.date_from)

        if filters.date_to:
            query = query.where(Transaction.date <= filters.date_to)

        # Keyword search on notes field
        if filters.search:
            query = query.where(
                Transaction.notes.ilike(f"%{filters.search}%")
            )

        # ── Pagination ─────────────────────────────────────────────
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar()

        offset = (filters.page - 1) * filters.page_size
        query = query.order_by(
            Transaction.date.desc(), Transaction.id.desc()
        ).offset(offset).limit(filters.page_size)

        result = await self.db.execute(query)
        items = result.scalars().all()

        return {
            "total": total,
            "page": filters.page,
            "page_size": filters.page_size,
            "pages": math.ceil(total / filters.page_size) if total else 0,
            "items": items,
        }

    async def update_transaction(
        self, tx_id: int, payload: TransactionUpdate, current_user: User
    ) -> Transaction:
        tx = await self.get_transaction(tx_id)

        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tx, field, value)

        await self.db.commit()
        await self.db.refresh(tx)
        return tx

    async def delete_transaction(self, tx_id: int, current_user: User) -> None:
        """
        Soft delete — sets is_deleted=True instead of removing the row.
        Record stays in DB for audit trail but disappears from all queries.
        """
        tx = await self.get_transaction(tx_id)
        tx.is_deleted = True
        await self.db.commit()