import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean, Date, DateTime, Enum,
    ForeignKey, Integer, Numeric, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"


class Category(str, enum.Enum):
    salary = "salary"
    freelance = "freelance"
    investment = "investment"
    food = "food"
    transport = "transport"
    utilities = "utilities"
    healthcare = "healthcare"
    entertainment = "entertainment"
    rent = "rent"
    shopping = "shopping"
    education = "education"
    other = "other"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False)
    category: Mapped[Category] = mapped_column(Enum(Category), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Soft delete — record stays in DB but is hidden from all queries
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Who created this transaction
    created_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationship back to user
    created_by_user: Mapped["User"] = relationship(
        "User", back_populates="transactions"
    )

    def __repr__(self):
        return f"<Transaction id={self.id} type={self.type} amount={self.amount}>"