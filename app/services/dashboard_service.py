from datetime import date, timedelta
from typing import Optional

from sqlalchemy import select, func, extract, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction, TransactionType
from app.schemas.dashboard import (
    CategoryTotal, MonthlyTrend, WeeklySummary,
    DashboardSummary,
)
from app.schemas.transaction import TransactionResponse


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _active(self):
        """Always exclude soft deleted records."""
        return Transaction.is_deleted == False  # noqa: E712

    async def get_summary(
        self,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> DashboardSummary:

        # Build base condition
        conditions = [self._active()]
        if date_from:
            conditions.append(Transaction.date >= date_from)
        if date_to:
            conditions.append(Transaction.date <= date_to)
        base = and_(*conditions)

        # ── Total income ───────────────────────────────────────────
        income_result = await self.db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                and_(base, Transaction.type == TransactionType.income)
            )
        )
        total_income = float(income_result.scalar())

        # ── Total expense ──────────────────────────────────────────
        expense_result = await self.db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                and_(base, Transaction.type == TransactionType.expense)
            )
        )
        total_expense = float(expense_result.scalar())

        # ── Transaction count ──────────────────────────────────────
        count_result = await self.db.execute(
            select(func.count(Transaction.id)).where(base)
        )
        tx_count = count_result.scalar()

        # ── Income by category ─────────────────────────────────────
        income_cat = await self.db.execute(
            select(
                Transaction.category,
                func.sum(Transaction.amount).label("total"),
                func.count(Transaction.id).label("count"),
            )
            .where(and_(base, Transaction.type == TransactionType.income))
            .group_by(Transaction.category)
            .order_by(func.sum(Transaction.amount).desc())
        )

        # ── Expense by category ────────────────────────────────────
        expense_cat = await self.db.execute(
            select(
                Transaction.category,
                func.sum(Transaction.amount).label("total"),
                func.count(Transaction.id).label("count"),
            )
            .where(and_(base, Transaction.type == TransactionType.expense))
            .group_by(Transaction.category)
            .order_by(func.sum(Transaction.amount).desc())
        )

        # ── Monthly trends ─────────────────────────────────────────
        monthly_result = await self.db.execute(
            select(
                extract("year", Transaction.date).label("year"),
                extract("month", Transaction.date).label("month"),
                Transaction.type,
                func.sum(Transaction.amount).label("total"),
            )
            .where(base)
            .group_by("year", "month", Transaction.type)
            .order_by("year", "month")
        )

        # Build monthly trends map
        monthly_map: dict[tuple, dict] = {}
        for row in monthly_result.all():
            key = (int(row.year), int(row.month))
            if key not in monthly_map:
                monthly_map[key] = {"income": 0.0, "expense": 0.0}
            monthly_map[key][row.type.value] += float(row.total)

        monthly_trends = [
            MonthlyTrend(
                year=y,
                month=m,
                income=v["income"],
                expense=v["expense"],
                net=round(v["income"] - v["expense"], 2),
            )
            for (y, m), v in sorted(monthly_map.items())
        ]

        # ── Recent 5 transactions ──────────────────────────────────
        recent_result = await self.db.execute(
            select(Transaction)
            .where(base)
            .order_by(Transaction.date.desc(), Transaction.id.desc())
            .limit(5)
        )
        recent = [
            TransactionResponse.model_validate(t)
            for t in recent_result.scalars().all()
        ]

        return DashboardSummary(
            total_income=total_income,
            total_expense=total_expense,
            net_balance=round(total_income - total_expense, 2),
            transaction_count=tx_count,
            income_by_category=[
                CategoryTotal(
                    category=r.category.value,
                    total=float(r.total),
                    count=r.count,
                )
                for r in income_cat.all()
            ],
            expense_by_category=[
                CategoryTotal(
                    category=r.category.value,
                    total=float(r.total),
                    count=r.count,
                )
                for r in expense_cat.all()
            ],
            monthly_trends=monthly_trends,
            recent_transactions=recent,
        )

    async def get_weekly_summary(self) -> list[WeeklySummary]:
        """Returns income/expense breakdown for the last 8 weeks."""
        today = date.today()
        # Align to Monday of current week
        start_of_week = today - timedelta(days=today.weekday())
        summaries = []

        for i in range(8):
            week_start = start_of_week - timedelta(weeks=i)
            week_end = week_start + timedelta(days=6)

            cond = and_(
                self._active(),
                Transaction.date >= week_start,
                Transaction.date <= week_end,
            )

            income_r = await self.db.execute(
                select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                    and_(cond, Transaction.type == TransactionType.income)
                )
            )
            expense_r = await self.db.execute(
                select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                    and_(cond, Transaction.type == TransactionType.expense)
                )
            )
            count_r = await self.db.execute(
                select(func.count(Transaction.id)).where(cond)
            )

            income = float(income_r.scalar())
            expense = float(expense_r.scalar())

            summaries.append(WeeklySummary(
                week_start=str(week_start),
                week_end=str(week_end),
                income=income,
                expense=expense,
                net=round(income - expense, 2),
                transaction_count=count_r.scalar(),
            ))

        return summaries