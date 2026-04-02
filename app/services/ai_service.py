import json
from datetime import date
from typing import Optional

from groq import Groq
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.transaction import Category
from app.schemas.dashboard import (
    AIInsightResponse,
    AutoCategoryResponse,
    NLSearchResponse,
)
from app.schemas.transaction import TransactionFilter

# Valid categories for AI to choose from
VALID_CATEGORIES = [c.value for c in Category]


class AIService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = Groq(api_key=settings.GROQ_API_KEY)

    def _chat(self, system: str, user: str) -> str:
        """
        Core Groq call — sends system + user message, returns text response.
        All 3 features use this same helper.
        """
        response = self.client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.3,   # lower = more focused, less creative
            max_tokens=1024,
        )
        return response.choices[0].message.content.strip()

    # ── Feature 1: Auto-categorize ─────────────────────────────────────────

    async def suggest_category(self, notes: str) -> AutoCategoryResponse:
        """
        Given a transaction notes/description, Groq suggests the best category.
        Example: "Paid electricity bill" → "utilities"
        """
        system = f"""You are a financial transaction categorizer.
Given a transaction description, return ONLY a JSON object with these exact keys:
- suggested_category: one of {VALID_CATEGORIES}
- confidence: one of "high", "medium", "low"
- reason: one short sentence explaining why

Return only valid JSON. No extra text."""

        user = f'Transaction description: "{notes}"'

        raw = self._chat(system, user)

        try:
            data = json.loads(raw)
            return AutoCategoryResponse(
                suggested_category=data.get("suggested_category", "other"),
                confidence=data.get("confidence", "low"),
                reason=data.get("reason", "Could not determine category."),
            )
        except (json.JSONDecodeError, KeyError):
            # Fallback if Groq returns something unexpected
            return AutoCategoryResponse(
                suggested_category="other",
                confidence="low",
                reason="Could not parse AI response. Defaulting to other.",
            )

    # ── Feature 2: Natural Language Search ────────────────────────────────

    async def natural_language_search(
        self, query: str
    ) -> NLSearchResponse:
        """
        Converts plain English query into structured filters, then runs DB query.
        Example: "food expenses last month" →
            { type: expense, category: food, date_from: ..., date_to: ... }
        """
        today = date.today()
        valid_types = ["income", "expense"]

        system = f"""You are a financial search assistant.
Today's date is {today}.
Convert the user's search query into a JSON filter object with these optional keys:
- type: one of {valid_types} or null
- category: one of {VALID_CATEGORIES} or null
- date_from: YYYY-MM-DD format or null
- date_to: YYYY-MM-DD format or null
- search: keyword string to search in notes or null
- interpreted_as: one clear sentence describing what you understood

Return only valid JSON. No extra text."""

        user = f'Search query: "{query}"'

        raw = self._chat(system, user)

        try:
            data = json.loads(raw)
            interpreted_as = data.pop("interpreted_as", f'Searching for: "{query}"')

            # Build filter from AI response
            filters = TransactionFilter(
                type=data.get("type"),
                category=data.get("category"),
                date_from=data.get("date_from"),
                date_to=data.get("date_to"),
                search=data.get("search"),
                page=1,
                page_size=20,
            )

            # Run actual DB query using transaction service
            from app.services.transaction_service import TransactionService
            from app.models.user import User

            tx_service = TransactionService(self.db)
            # We pass a dummy user since list_transactions needs one
            # Role checking is done at the route level before reaching here
            result = await tx_service.list_transactions(filters, None)

            from app.schemas.transaction import TransactionResponse
            transactions = [
                TransactionResponse.model_validate(t)
                for t in result["items"]
            ]

            return NLSearchResponse(
                interpreted_as=interpreted_as,
                transactions=transactions,
            )

        except Exception:
            return NLSearchResponse(
                interpreted_as=f'Could not interpret query: "{query}"',
                transactions=[],
            )

    # ── Feature 3: AI Dashboard Insights ──────────────────────────────────

    async def get_insights(
        self,
        total_income: float,
        total_expense: float,
        net_balance: float,
        income_by_category: list,
        expense_by_category: list,
        monthly_trends: list,
    ) -> AIInsightResponse:
        """
        Looks at the dashboard summary numbers and returns plain English insights.
        Example: "Your transport spending increased 40% compared to last month."
        """
        from datetime import datetime

        summary_text = f"""
Financial Summary:
- Total Income: {total_income}
- Total Expense: {total_expense}
- Net Balance: {net_balance}

Top Income Sources:
{chr(10).join([f"  - {i['category']}: {i['total']}" for i in income_by_category[:3]])}

Top Expense Categories:
{chr(10).join([f"  - {i['category']}: {i['total']}" for i in expense_by_category[:3]])}

Monthly Trends (last 3 months):
{chr(10).join([f"  - {t['year']}/{t['month']}: income={t['income']}, expense={t['expense']}, net={t['net']}" for t in monthly_trends[-3:]])}
"""

        system = """You are a personal finance advisor analyzing a user's financial dashboard.
Generate exactly 4 to 5 short, specific, actionable insights based on the data.
Each insight should be one clear sentence.
Focus on: spending patterns, savings rate, category anomalies, trends.
Return ONLY a JSON array of strings like: ["insight 1", "insight 2", ...]
No extra text."""

        raw = self._chat(system, summary_text)

        try:
            insights = json.loads(raw)
            if not isinstance(insights, list):
                raise ValueError("Expected a list")
        except (json.JSONDecodeError, ValueError):
            insights = [
                "Unable to generate insights at this time.",
                "Please check your Groq API key and try again.",
            ]

        return AIInsightResponse(
            insights=insights,
            generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        )