from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.router import api_router
from app.core.config import settings
from app.db.database import init_db
from app.middleware.request_id import RequestIDMiddleware


# ── Rate Limiter ────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


# ── Startup / Shutdown ──────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once when the app starts.
    - Creates all DB tables if they don't exist
    - Seeds a default admin user so you can log in immediately
    """
    await init_db()
    await seed_admin()
    yield  # app runs here
    # anything after yield runs on shutdown


async def seed_admin():
    """
    Creates a default admin user on first startup.
    Only runs if no admin exists yet.
    """
    from app.db.database import AsyncSessionLocal
    from app.core.security import hash_password
    from app.models.user import User, Role
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(User.role == Role.admin)
        )
        if result.scalar_one_or_none() is None:
            admin = User(
                email="admin@finance.dev",
                full_name="System Admin",
                hashed_password=hash_password("admin123"),
                role=Role.admin,
            )
            db.add(admin)
            await db.commit()
            print("=" * 50)
            print("  Default admin created:")
            print("  Email   : admin@finance.dev")
            print("  Password: admin123")
            print("  Please change this password after first login.")
            print("=" * 50)


# ── App Instance ────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## Finance Dashboard Backend

A role-based finance management API with AI-powered features.

### Roles
| Role | Permissions |
|------|------------|
| **Viewer** | Read transactions |
| **Analyst** | Read + Create + Update transactions, Dashboard, AI features |
| **Admin** | Full access including user management and delete |

### AI Features (powered by Groq)
- **Auto-categorize** — suggest category from transaction notes
- **Natural language search** — search transactions in plain English
- **AI insights** — plain English analysis of your financial dashboard

### Quick Start
1. Login with `admin@finance.dev` / `admin123`
2. Copy the `access_token` from the response
3. Click **Authorize** above and paste the token
4. Start making requests
    """,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ───────────────────────────────────────────────────────────────

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Unique request ID on every request
app.add_middleware(RequestIDMiddleware)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global Error Handlers ────────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    """
    Makes validation errors readable.
    Instead of the default Pydantic error format,
    returns a clean list of { field, message } objects.
    """
    errors = []
    for error in exc.errors():
        field = " -> ".join(
            str(loc) for loc in error["loc"] if loc != "body"
        )
        errors.append({
            "field": field,
            "message": error["msg"],
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation failed",
            "errors": errors,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all handler — never expose raw error details to client."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Something went wrong. Please try again later."
        },
    )


# ── Routes ───────────────────────────────────────────────────────────────────
app.include_router(api_router)


# ── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"], summary="Root")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"], summary="Health check")
async def health():
    return {"status": "ok"}