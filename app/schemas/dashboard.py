from typing import Optional
from pydantic import BaseModel


class CategoryTotal(BaseModel):
    category: str
    total: float
    count: int


class MonthlyTrend(BaseModel):
    year: int
    month: int
    income: float
    expense: float
    net: float


class WeeklySummary(BaseModel):
    week_start: str
    week_end: str
    income: float
    expense: float
    net: float
    transaction_count: int


class DashboardSummary(BaseModel):
    total_income: float
    total_expense: float
    net_balance: float
    transaction_count: int
    income_by_category: list[CategoryTotal]
    expense_by_category: list[CategoryTotal]
    monthly_trends: list[MonthlyTrend]
    recent_transactions: list


# ─── AI Schema ──────────────────────────────────────────────────────────────


class AIInsightResponse(BaseModel):
    insights: list[str]          # e.g. ["Your food spending is up 30% this month"]
    generated_at: str


class AutoCategoryRequest(BaseModel):
    notes: str                   # e.g. "Paid electricity bill"


class AutoCategoryResponse(BaseModel):
    suggested_category: str      # e.g. "utilities"
    confidence: str              # e.g. "high"
    reason: str                  # e.g. "Notes mention electricity which is a utility"


class NLSearchRequest(BaseModel):
    query: str                   # e.g. "food expenses last month"


class NLSearchResponse(BaseModel):
    interpreted_as: str          # e.g. "Showing food expenses from June 2024"
    transactions: list