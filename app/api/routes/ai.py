from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.middleware.auth import require_analyst_or_admin
from app.models.user import User
from app.schemas.dashboard import (
    AIInsightResponse,
    AutoCategoryRequest,
    AutoCategoryResponse,
    NLSearchRequest,
    NLSearchResponse,
)
from app.services.ai_service import AIService
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/ai", tags=["AI Features"])


@router.post(
    "/categorize",
    response_model=AutoCategoryResponse,
    summary="Auto-categorize a transaction",
    description="""
    Send a transaction description/notes and Groq AI will suggest
    the best category for it.

    Example:
    - "Paid electricity bill" → utilities
    - "Monthly Netflix subscription" → entertainment
    - "Grocery shopping at DMart" → food

    Analyst and Admin only.
    """,
)
async def auto_categorize(
    payload: AutoCategoryRequest,
    _: Annotated[User, Depends(require_analyst_or_admin)],
    db: AsyncSession = Depends(get_db),
):
    svc = AIService(db)
    return await svc.suggest_category(payload.notes)


@router.post(
    "/search",
    response_model=NLSearchResponse,
    summary="Natural language transaction search",
    description="""
    Search transactions using plain English.
    Groq AI converts your query into filters and runs the actual DB query.

    Examples:
    - "food expenses last month"
    - "all income from salary in 2024"
    - "transport costs this week"
    - "entertainment spending above 500"

    Analyst and Admin only.
    """,
)
async def natural_language_search(
    payload: NLSearchRequest,
    _: Annotated[User, Depends(require_analyst_or_admin)],
    db: AsyncSession = Depends(get_db),
):
    svc = AIService(db)
    return await svc.natural_language_search(payload.query)


@router.get(
    "/insights",
    response_model=AIInsightResponse,
    summary="Get AI-powered financial insights",
    description="""
    Groq AI analyzes your dashboard data and returns
    4 to 5 plain English observations about your finances.

    Examples of insights:
    - "Your food spending is 40% of total expenses this month."
    - "Net balance is positive — you saved 30% of your income."
    - "Transport costs increased compared to last month."

    Analyst and Admin only.
    """,
)
async def get_insights(
    _: Annotated[User, Depends(require_analyst_or_admin)],
    db: AsyncSession = Depends(get_db),
):
    # First get the dashboard summary data
    dashboard_svc = DashboardService(db)
    summary = await dashboard_svc.get_summary()

    # Then pass it to AI service for analysis
    ai_svc = AIService(db)
    return await ai_svc.get_insights(
        total_income=summary.total_income,
        total_expense=summary.total_expense,
        net_balance=summary.net_balance,
        income_by_category=[c.model_dump() for c in summary.income_by_category],
        expense_by_category=[c.model_dump() for c in summary.expense_by_category],
        monthly_trends=[m.model_dump() for m in summary.monthly_trends],
    )