from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# Engine — the actual connection to the database file
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,        # logs all SQL queries when DEBUG=True
    connect_args={"check_same_thread": False},  # needed for SQLite only
)

# Session factory — creates a new session for each request
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,     # keeps objects usable after commit
)


# Base class — all models will inherit from this
class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """
    FastAPI dependency — gives each route its own DB session.
    Automatically closes the session when the request is done.

    Usage in a route:
        async def my_route(db: AsyncSession = Depends(get_db)):
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """
    Called once on app startup.
    Creates all tables in the database if they don't exist yet.
    """
    from app.models import user, transaction  # noqa: F401 — registers models with Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)