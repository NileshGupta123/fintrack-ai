from fastapi import APIRouter

from app.api.routes import auth, users, transactions, dashboard, ai

# Main API router — all routes live under /api/v1
api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(transactions.router)
api_router.include_router(dashboard.router)
api_router.include_router(ai.router)