from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models.transaction import Category, TransactionType


# ─── Request Schemas ────────────────────────────────────────────────────────


class TransactionCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Must be a positive number")
    type: TransactionType
    category: Category
    date: date
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator("amount")
    @classmethod
    def round_to_two_decimals(cls, v: float) -> float:
        return round(v, 2)


class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[TransactionType] = None
    category: Optional[Category] = None
    date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator("amount")
    @classmethod
    def round_to_two_decimals(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            return round(v, 2)
        return v


# ─── Response Schemas ───────────────────────────────────────────────────────


class TransactionResponse(BaseModel):
    id: int
    amount: float
    type: TransactionType
    category: Category
    date: date
    notes: Optional[str]
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Filter + Pagination ────────────────────────────────────────────────────


class TransactionFilter(BaseModel):
    type: Optional[TransactionType] = None
    category: Optional[Category] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    search: Optional[str] = None       # search by notes keyword
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class PaginatedTransactions(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    items: list[TransactionResponse]