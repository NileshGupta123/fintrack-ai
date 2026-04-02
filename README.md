# Finance Dashboard Backend

A role-based finance management REST API built with **Python + FastAPI**, featuring AI-powered transaction insights using **Groq API**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | FastAPI 0.115 |
| Database | SQLite + SQLAlchemy 2.0 (async) |
| Auth | JWT (python-jose) + Argon2 password hashing |
| AI | Groq API (llama / gpt-oss model) |
| Validation | Pydantic v2 |
| Rate Limiting | SlowAPI |
| Testing | Pytest + HTTPX (async) |

---

## Project Structure

```
finance-backend/
├── app/
│   ├── api/
│   │   ├── router.py              # connects all route files under /api/v1
│   │   └── routes/
│   │       ├── auth.py            # register, login
│   │       ├── users.py           # user management
│   │       ├── transactions.py    # CRUD + filters + search
│   │       ├── dashboard.py       # summary + weekly trends
│   │       └── ai.py              # Groq AI endpoints
│   ├── core/
│   │   ├── config.py              # all settings from .env
│   │   └── security.py            # JWT + Argon2 hashing
│   ├── db/
│   │   └── database.py            # async SQLAlchemy engine + session
│   ├── middleware/
│   │   ├── auth.py                # JWT dependency + role guards
│   │   └── request_id.py          # unique X-Request-ID on every request
│   ├── models/
│   │   ├── user.py                # users table
│   │   └── transaction.py         # transactions table
│   ├── schemas/
│   │   ├── user.py                # request/response shapes
│   │   ├── transaction.py         # request/response + filters
│   │   └── dashboard.py           # summary + AI response shapes
│   ├── services/
│   │   ├── user_service.py        # user business logic
│   │   ├── transaction_service.py # transaction business logic
│   │   ├── dashboard_service.py   # analytics aggregation
│   │   └── ai_service.py          # all 3 Groq AI features
│   └── main.py                    # app entry point
├── tests/
│   └── test_api.py                # 23 integration tests
├── .env.example                   # environment variable template
├── .gitignore
├── pytest.ini
├── requirements.txt
└── README.md
```

---

## Quick Start

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd finance-backend
```

### 2. Create and activate virtual environment
```bash
python -m venv venv

# Mac/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up environment variables
```bash
cp .env.example .env
```
Open `.env` and fill in:
- `SECRET_KEY` — generate with: `python -c "import secrets; print(secrets.token_hex(32))"`
- `GROQ_API_KEY` — free at [console.groq.com](https://console.groq.com)

### 5. Run the server
```bash
uvicorn app.main:app --reload
```

Server runs at: **http://localhost:8000**
Swagger docs at: **http://localhost:8000/docs**

### 6. Default admin account
On first startup, a default admin is created automatically:

| Field | Value |
|-------|-------|
| Email | admin@finance.dev |
| Password | admin123 |

> Change this password after first login.

---

## Roles and Permissions

| Action | Viewer | Analyst | Admin |
|--------|:------:|:-------:|:-----:|
| Read transactions | ✅ | ✅ | ✅ |
| Create / Update transactions | ❌ | ✅ | ✅ |
| Delete transactions | ❌ | ❌ | ✅ |
| Dashboard summary + trends | ❌ | ✅ | ✅ |
| AI features | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## API Endpoints

All routes are prefixed with `/api/v1`

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/register | Register new user | No |
| POST | /auth/login | Login, get JWT token | No |

### Users
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /users/me | My profile | Any |
| GET | /users/ | List all users | Admin |
| GET | /users/{id} | Get user by ID | Admin |
| PATCH | /users/{id} | Update role/status | Admin |
| DELETE | /users/{id} | Delete user | Admin |

### Transactions
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /transactions/ | Create transaction | Analyst, Admin |
| GET | /transactions/ | List with filters | Any |
| GET | /transactions/{id} | Get single | Any |
| PATCH | /transactions/{id} | Update | Analyst, Admin |
| DELETE | /transactions/{id} | Soft delete | Admin |

**Filter params for GET /transactions/:**
```
type        income or expense
category    salary, food, rent, transport ...
date_from   YYYY-MM-DD
date_to     YYYY-MM-DD
search      keyword in notes
page        default 1
page_size   default 20, max 100
```

### Dashboard
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /dashboard/summary | Full summary with trends | Analyst, Admin |
| GET | /dashboard/weekly | Last 8 weeks breakdown | Analyst, Admin |

### AI Features (Groq)
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /ai/categorize | Suggest category from notes | Analyst, Admin |
| POST | /ai/search | Natural language search | Analyst, Admin |
| GET | /ai/insights | Plain English dashboard insights | Analyst, Admin |

---

## AI Features Explained

### 1. Auto-categorize
Send a transaction description and get a suggested category back.

**Request:**
```json
POST /api/v1/ai/categorize
{
  "notes": "Paid electricity bill for the month"
}
```
**Response:**
```json
{
  "suggested_category": "utilities",
  "confidence": "high",
  "reason": "Description mentions electricity which is a utility expense"
}
```

### 2. Natural Language Search
Search transactions using plain English instead of filters.

**Request:**
```json
POST /api/v1/ai/search
{
  "query": "food expenses last month"
}
```
**Response:**
```json
{
  "interpreted_as": "Showing food expenses from March 2024",
  "transactions": [...]
}
```

### 3. AI Insights
Get plain English observations about your financial data.

**Request:**
```
GET /api/v1/ai/insights
```
**Response:**
```json
{
  "insights": [
    "Your salary accounts for 90% of total income this period.",
    "Food spending is your highest expense category at 35%.",
    "Net balance is positive — you saved 40% of your income.",
    "Transport costs increased compared to last month."
  ],
  "generated_at": "2024-06-01 10:30:00 UTC"
}
```

---

## Running Tests

```bash
pytest tests/ -v
```

Tests use an **in-memory SQLite database** — no setup needed.

```
23 passed in ~16s
```

**Test coverage includes:**
- Register, login, duplicate email, invalid input
- Role enforcement for all 3 roles
- Transaction filters — by type, date range, keyword search
- Dashboard total accuracy
- Soft delete — hidden from list and returns 404
- Pagination — total count, page count, items per page
- User management — profile, role update

---

## Design Decisions

### Why FastAPI?
Native async support, automatic Swagger docs, and Pydantic v2 integration. The auto-generated `/docs` page means reviewers can test every endpoint without Postman.

### Why SQLite?
Zero setup — just run the server and the database file is created automatically. The SQLAlchemy ORM layer means switching to PostgreSQL only requires changing `DATABASE_URL` in `.env`.

### Why Argon2 over bcrypt?
Argon2 won the Password Hashing Competition and is more resistant to GPU-based attacks than bcrypt. It is the modern standard for new projects.

### Why soft delete?
Financial records should never be permanently deleted. Setting `is_deleted=True` hides the record from all queries while keeping it in the database for audit purposes. Only admins can soft delete.

### Why request IDs?
Every request gets a unique `X-Request-ID` header. When something goes wrong, you can search logs by this ID to trace exactly what happened. This is standard practice in production systems.

### Why Groq for AI?
Groq provides free, fast inference. The AI features are built as a separate service layer (`ai_service.py`) with its own prompts and JSON parsing. Each feature gracefully falls back if Groq returns an unexpected response — the app never crashes because of AI.

---

## Assumptions

- A viewer can read all transactions system-wide, not just their own
- Analysts can create and update but cannot delete — deletion is a higher-stakes action reserved for admins
- The `notes` field is optional on transactions but required for AI categorization
- Categories are a fixed enum — this keeps data consistent and queryable
- Soft deleted transactions are excluded from all dashboard calculations
- The default admin credentials are printed to the terminal on first startup only

---

## Optional Enhancements Implemented

- ✅ JWT authentication with 24 hour expiry
- ✅ Pagination on all list endpoints
- ✅ Keyword search on transaction notes
- ✅ Soft delete with audit trail
- ✅ Rate limiting via SlowAPI
- ✅ 23 integration tests
- ✅ Auto-generated Swagger + ReDoc documentation
- ✅ AI auto-categorization (Groq)
- ✅ Natural language search (Groq)
- ✅ AI financial insights (Groq)
- ✅ Request ID middleware for traceability