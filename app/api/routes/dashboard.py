from datetime import date
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.middleware.auth import require_analyst_or_admin
from app.models.user import User
from app.schemas.dashboard import DashboardSummary, WeeklySummary
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummary,
    summary="Get dashboard summary",
    description="""
    Returns a full financial summary including:
    - Total income, total expense, net balance
    - Income and expense broken down by category
    - Monthly income/expense trends
    - 5 most recent transactions

    Analyst and Admin only. Optionally filter by date range.
    """,
)
async def get_summary(
    date_from: Optional[date] = Query(None, description="Filter from this date"),
    date_to: Optional[date] = Query(None, description="Filter to this date"),
    _: Annotated[User, Depends(require_analyst_or_admin)] = None,
    db: AsyncSession = Depends(get_db),
):
    svc = DashboardService(db)
    return await svc.get_summary(date_from=date_from, date_to=date_to)


@router.get(
    "/weekly",
    response_model=list[WeeklySummary],
    summary="Get weekly trends",
    description="Returns income and expense breakdown for the last 8 weeks. Analyst and Admin only.",
)
async def get_weekly_trends(
    _: Annotated[User, Depends(require_analyst_or_admin)] = None,
    db: AsyncSession = Depends(get_db),
):
    svc = DashboardService(db)
    return await svc.get_weekly_summary()