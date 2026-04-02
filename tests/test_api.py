"""
Integration tests for Finance Dashboard API.
Uses in-memory SQLite — no external setup needed.
Just run: pytest tests/ -v
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.db.database import Base, get_db
from app.main import app

# ── Test Database Setup ──────────────────────────────────────────────────────

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
)
TestSession = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_db():
    """Replace real DB with in-memory test DB."""
    async with TestSession() as session:
        yield session


# Override the DB dependency for all tests
app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create all tables before each test, drop after."""
    from app.models import user, transaction  # noqa — registers models
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as c:
        yield c


# ── Helpers ──────────────────────────────────────────────────────────────────

async def register_and_login(client, email, password, role="viewer"):
    """Register a user and return their JWT token."""
    await client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Test User",
        "password": password,
        "role": role,
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password,
    })
    return resp.json()["access_token"]


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Auth Tests ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_success(client):
    r = await client.post("/api/v1/auth/register", json={
        "email": "alice@test.com",
        "full_name": "Alice",
        "password": "pass1234",
        "role": "viewer",
    })
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == "alice@test.com"
    assert data["role"] == "viewer"
    assert "hashed_password" not in data  # never expose password


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {"email": "dup@test.com", "full_name": "Dup", "password": "pass1234"}
    await client.post("/api/v1/auth/register", json=payload)
    r = await client.post("/api/v1/auth/register", json=payload)
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_register_invalid_email(client):
    r = await client.post("/api/v1/auth/register", json={
        "email": "not-an-email",
        "full_name": "Bad",
        "password": "pass1234",
    })
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_register_short_password(client):
    r = await client.post("/api/v1/auth/register", json={
        "email": "test@test.com",
        "full_name": "Test",
        "password": "123",  # too short, min is 6
    })
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/api/v1/auth/register", json={
        "email": "bob@test.com",
        "full_name": "Bob",
        "password": "pass1234",
    })
    r = await client.post("/api/v1/auth/login", json={
        "email": "bob@test.com",
        "password": "pass1234",
    })
    assert r.status_code == 200
    assert "access_token" in r.json()
    assert r.json()["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/api/v1/auth/register", json={
        "email": "wp@test.com",
        "full_name": "WP",
        "password": "correct",
    })
    r = await client.post("/api/v1/auth/login", json={
        "email": "wp@test.com",
        "password": "wrong",
    })
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected(client):
    r = await client.get("/api/v1/transactions/")
    assert r.status_code == 403


# ── Role-Based Access Control Tests ─────────────────────────────────────────

@pytest.mark.asyncio
async def test_viewer_cannot_create_transaction(client):
    token = await register_and_login(client, "viewer@test.com", "pass1234", "viewer")
    r = await client.post("/api/v1/transactions/", headers=auth_header(token), json={
        "amount": 100,
        "type": "income",
        "category": "salary",
        "date": "2024-06-01",
    })
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_analyst_can_create_transaction(client):
    token = await register_and_login(client, "analyst@test.com", "pass1234", "analyst")
    r = await client.post("/api/v1/transactions/", headers=auth_header(token), json={
        "amount": 5000.00,
        "type": "income",
        "category": "salary",
        "date": "2024-06-01",
        "notes": "June salary",
    })
    assert r.status_code == 201
    assert r.json()["amount"] == 5000.0


@pytest.mark.asyncio
async def test_viewer_can_read_transactions(client):
    # Analyst creates a transaction
    analyst_token = await register_and_login(client, "a@test.com", "pass1234", "analyst")
    await client.post("/api/v1/transactions/", headers=auth_header(analyst_token), json={
        "amount": 200,
        "type": "expense",
        "category": "food",
        "date": "2024-06-10",
    })
    # Viewer can read it
    viewer_token = await register_and_login(client, "v@test.com", "pass1234", "viewer")
    r = await client.get("/api/v1/transactions/", headers=auth_header(viewer_token))
    assert r.status_code == 200
    assert r.json()["total"] >= 1


@pytest.mark.asyncio
async def test_viewer_cannot_access_dashboard(client):
    token = await register_and_login(client, "vd@test.com", "pass1234", "viewer")
    r = await client.get("/api/v1/dashboard/summary", headers=auth_header(token))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_analyst_can_access_dashboard(client):
    token = await register_and_login(client, "ad@test.com", "pass1234", "analyst")
    r = await client.get("/api/v1/dashboard/summary", headers=auth_header(token))
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_only_admin_can_delete_transaction(client):
    analyst_token = await register_and_login(client, "a2@test.com", "pass1234", "analyst")

    # Create a transaction
    create_r = await client.post("/api/v1/transactions/", headers=auth_header(analyst_token), json={
        "amount": 99,
        "type": "expense",
        "category": "other",
        "date": "2024-07-01",
    })
    tx_id = create_r.json()["id"]

    # Analyst cannot delete
    r = await client.delete(f"/api/v1/transactions/{tx_id}", headers=auth_header(analyst_token))
    assert r.status_code == 403

    # Admin can delete
    admin_token = await register_and_login(client, "adm@test.com", "pass1234", "admin")
    r2 = await client.delete(f"/api/v1/transactions/{tx_id}", headers=auth_header(admin_token))
    assert r2.status_code == 204


# ── Transaction Filter Tests ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_filter_by_type(client):
    token = await register_and_login(client, "f@test.com", "pass1234", "analyst")
    for tx in [
        {"amount": 1000, "type": "income", "category": "salary", "date": "2024-01-10"},
        {"amount": 200, "type": "expense", "category": "food", "date": "2024-01-15"},
    ]:
        await client.post("/api/v1/transactions/", headers=auth_header(token), json=tx)

    r = await client.get("/api/v1/transactions/?type=income", headers=auth_header(token))
    items = r.json()["items"]
    assert all(i["type"] == "income" for i in items)


@pytest.mark.asyncio
async def test_filter_by_date_range(client):
    token = await register_and_login(client, "dr@test.com", "pass1234", "analyst")
    for tx in [
        {"amount": 100, "type": "income", "category": "other", "date": "2024-03-01"},
        {"amount": 200, "type": "income", "category": "other", "date": "2024-05-15"},
        {"amount": 300, "type": "income", "category": "other", "date": "2024-07-01"},
    ]:
        await client.post("/api/v1/transactions/", headers=auth_header(token), json=tx)

    r = await client.get(
        "/api/v1/transactions/?date_from=2024-04-01&date_to=2024-06-30",
        headers=auth_header(token),
    )
    items = r.json()["items"]
    assert len(items) == 1
    assert items[0]["amount"] == 200.0


@pytest.mark.asyncio
async def test_search_by_notes(client):
    token = await register_and_login(client, "s@test.com", "pass1234", "analyst")
    for tx in [
        {"amount": 500, "type": "expense", "category": "utilities", "date": "2024-06-01", "notes": "electricity bill payment"},
        {"amount": 200, "type": "expense", "category": "food", "date": "2024-06-05", "notes": "grocery shopping"},
    ]:
        await client.post("/api/v1/transactions/", headers=auth_header(token), json=tx)

    r = await client.get(
        "/api/v1/transactions/?search=electricity",
        headers=auth_header(token),
    )
    items = r.json()["items"]
    assert len(items) == 1
    assert "electricity" in items[0]["notes"]


# ── Dashboard Tests ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_dashboard_totals(client):
    token = await register_and_login(client, "ds@test.com", "pass1234", "analyst")
    for tx in [
        {"amount": 3000, "type": "income", "category": "salary", "date": "2024-06-01"},
        {"amount": 500,  "type": "expense", "category": "rent", "date": "2024-06-05"},
        {"amount": 200,  "type": "expense", "category": "food", "date": "2024-06-10"},
    ]:
        await client.post("/api/v1/transactions/", headers=auth_header(token), json=tx)

    r = await client.get("/api/v1/dashboard/summary", headers=auth_header(token))
    data = r.json()
    assert data["total_income"] == 3000.0
    assert data["total_expense"] == 700.0
    assert data["net_balance"] == 2300.0
    assert data["transaction_count"] == 3


@pytest.mark.asyncio
async def test_dashboard_weekly(client):
    token = await register_and_login(client, "dw@test.com", "pass1234", "analyst")
    r = await client.get("/api/v1/dashboard/weekly", headers=auth_header(token))
    assert r.status_code == 200
    assert len(r.json()) == 8  # last 8 weeks


# ── Soft Delete Test ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_soft_delete_hides_transaction(client):
    analyst_token = await register_and_login(client, "sd@test.com", "pass1234", "analyst")
    admin_token = await register_and_login(client, "sdadm@test.com", "pass1234", "admin")

    # Create transaction
    create_r = await client.post("/api/v1/transactions/", headers=auth_header(analyst_token), json={
        "amount": 50,
        "type": "expense",
        "category": "transport",
        "date": "2024-06-20",
    })
    tx_id = create_r.json()["id"]

    # Admin soft deletes it
    await client.delete(f"/api/v1/transactions/{tx_id}", headers=auth_header(admin_token))

    # Should no longer appear in list
    r = await client.get("/api/v1/transactions/", headers=auth_header(analyst_token))
    ids = [i["id"] for i in r.json()["items"]]
    assert tx_id not in ids

    # Should also return 404 when fetched directly
    r2 = await client.get(f"/api/v1/transactions/{tx_id}", headers=auth_header(analyst_token))
    assert r2.status_code == 404


# ── User Management Tests ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_my_profile(client):
    token = await register_and_login(client, "me@test.com", "pass1234", "viewer")
    r = await client.get("/api/v1/users/me", headers=auth_header(token))
    assert r.status_code == 200
    assert r.json()["email"] == "me@test.com"


@pytest.mark.asyncio
async def test_viewer_cannot_list_users(client):
    token = await register_and_login(client, "vu@test.com", "pass1234", "viewer")
    r = await client.get("/api/v1/users/", headers=auth_header(token))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_update_user_role(client):
    # Register a viewer
    await client.post("/api/v1/auth/register", json={
        "email": "promote@test.com",
        "full_name": "Promote Me",
        "password": "pass1234",
        "role": "viewer",
    })
    viewer_resp = await client.post("/api/v1/auth/login", json={
        "email": "promote@test.com", "password": "pass1234"
    })
    viewer_id = viewer_resp.json()["user"]["id"]

    # Admin promotes them to analyst
    admin_token = await register_and_login(client, "adm2@test.com", "pass1234", "admin")
    r = await client.patch(
        f"/api/v1/users/{viewer_id}",
        headers=auth_header(admin_token),
        json={"role": "analyst"},
    )
    assert r.status_code == 200
    assert r.json()["role"] == "analyst"


# ── Pagination Test ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_pagination(client):
    token = await register_and_login(client, "pg@test.com", "pass1234", "analyst")

    # Create 5 transactions
    for i in range(5):
        await client.post("/api/v1/transactions/", headers=auth_header(token), json={
            "amount": 100 + i,
            "type": "expense",
            "category": "other",
            "date": f"2024-0{i+1}-01",
        })

    # Get page 1 with page_size 2
    r = await client.get(
        "/api/v1/transactions/?page=1&page_size=2",
        headers=auth_header(token),
    )
    data = r.json()
    assert data["total"] == 5
    assert data["pages"] == 3
    assert len(data["items"]) == 2