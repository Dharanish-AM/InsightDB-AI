<div align="center">

# 🧠 InsightDB AI

**Enterprise-Grade AI Database Intelligence Platform**

*Ask questions in plain English. Get trusted SQL. Surface the signal in your data.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Agentic Pipeline](#-agentic-pipeline)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Key Features](#-key-features)
- [Security Model](#-security-model)
- [API Reference](#-api-reference)
- [Frontend Components](#-frontend-components)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Testing](#-testing)
- [Development Rules](#-development-rules)
- [Roadmap](#-roadmap)

---

## 🌟 Overview

InsightDB AI is an **enterprise-grade AI layer** that sits above your existing databases and enables any team member to query PostgreSQL and MySQL databases using natural language — without writing a single line of SQL.

The platform is **not a replacement** for tools like Apache Superset. Instead, it acts as an AI intelligence layer _above_ existing BI systems, translating human intent into safe, explainable, audited SQL queries, then surfacing business insights from the results.

### Core Capabilities

| Capability | Description |
|---|---|
| 🗣️ **Natural Language → SQL** | Plain-English questions translated to dialect-correct SQL |
| 🛡️ **Safe Execution** | AST-level SQL validation enforces read-only access at all times |
| 🤖 **AI Insights** | LLM-generated summaries, trends, anomalies, and recommendations |
| 📊 **Query Studio** | Interactive interface for running, reviewing, and exporting results |
| 🕰️ **Audit History** | Full trace log of every query, its SQL, latency, and row count |
| 🔍 **Schema Explorer** | Visual catalog of all tables, columns, types, and relationships |
| 🔐 **Encryption** | Database credentials stored encrypted at rest |
| 📤 **Report Export** | Download results as CSV, Markdown, or JSON |

---

## 🏗️ Architecture

InsightDB AI follows a strict **layered architecture** with full separation between API routing, service orchestration, data access, and AI agents.

```
┌──────────────────────────────────────────────────┐
│                 React Frontend                    │
│  (Vite + TypeScript + TailwindCSS + TanStack)     │
└────────────────────┬─────────────────────────────┘
                     │ HTTPS / REST
┌────────────────────▼─────────────────────────────┐
│               FastAPI Backend                     │
│         (Async, Pydantic, JWT Auth)               │
│                                                   │
│   ┌──────────────────────────────────────────┐    │
│   │           Pipeline Orchestrator          │    │
│   │  (PipelineService — single source of     │    │
│   │   truth for the agentic flow)            │    │
│   └──────┬────────┬────────┬────────┬────────┘    │
│          │        │        │        │              │
│   ┌──────▼──┐ ┌───▼───┐ ┌──▼────┐ ┌▼──────────┐  │
│   │Planner  │ │  SQL  │ │Valida-│ │ Insight   │  │
│   │ Agent   │ │ Agent │ │tor Ag.│ │  Agent    │  │
│   └──────┬──┘ └───┬───┘ └──┬────┘ └─────┬─────┘  │
│          │        │        │             │         │
│   ┌──────▼────────▼────────▼─────────────▼──────┐ │
│   │              Service Layer                   │ │
│   │  MetadataService · QueryExecutorService      │ │
│   │  SchemaService · ConnectionManager           │ │
│   │  HistoryService · ReportExportService        │ │
│   └──────────────────────────────────────────────┘ │
│                                                   │
│   ┌────────────────────────────────────────────┐  │
│   │           Repository Layer                  │  │
│   │  ConnectionRepo · SchemaRepo · HistoryRepo  │  │
│   │  MetadataRepo · UserRepo                    │  │
│   └──────────────────┬─────────────────────────┘  │
└──────────────────────┼─────────────────────────────┘
                       │
     ┌─────────────────┼──────────────────┐
     │                 │                  │
┌────▼────┐     ┌──────▼──────┐    ┌──────▼──────┐
│Postgres │     │    Redis    │    │  Ollama /   │
│ (App DB)│     │  (Cache /   │    │  OpenAI     │
│         │     │   State)    │    │  (LLM API)  │
└─────────┘     └─────────────┘    └─────────────┘
     │
┌────▼───────────────────────────────────────────┐
│       Target Customer Databases                 │
│   (PostgreSQL · MySQL — user-connected)         │
└─────────────────────────────────────────────────┘
```

### Design Principles

- **No business logic in API routes** — all logic lives in services.
- **No raw SQL in endpoints** — all database access goes through repositories.
- **No hardcoded prompts** — all LLM prompts are versioned files in `backend/prompts/`.
- **No global state** — all dependencies injected via FastAPI's DI system.
- **Async all the way down** — every I/O operation is `async/await`.

---

## 🤖 Agentic Pipeline

The heart of InsightDB AI is a **multi-agent pipeline** orchestrated by `PipelineService`. Each agent has a single, well-defined responsibility and cannot access anything outside its domain.

```
User Natural Language Query
        │
        ▼
┌───────────────────┐
│  PipelineService  │  ← Orchestrator — validates ownership,
│  (Orchestrator)   │    routes errors, persists history
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  MetadataService  │  ← Builds a compact schema context string
│  (Schema Context) │    (tables, columns, PKs, FKs, semantic types,
└────────┬──────────┘    business annotations, aliases)
         │ schema_context: str
         ▼
┌───────────────────┐
│  PlannerAgent     │  ← Calls LLM to produce a QueryExecutionPlan
│  (Intent Planner) │    (target_tables, metrics, filters, joins,
└────────┬──────────┘    dimensions, sort, group_by, limit)
         │                 Falls back to deterministic heuristic
         │ QueryExecutionPlan  if LLM is unavailable or returns
         │                     a plan that references unknown tables
         ▼
┌───────────────────┐
│  SqlAgent         │  ← Converts plan to dialect-correct SQL
│  (SQL Generator)  │    Handles PostgreSQL/MySQL quoting rules
└────────┬──────────┘    Falls back to deterministic SQL builder
         │ raw SQL string
         ▼
┌───────────────────┐
│  ValidatorAgent   │  ← AST validation using sqlglot
│  (SQL Validator)  │    Blocks: INSERT, UPDATE, DELETE, DROP,
└────────┬──────────┘    ALTER, TRUNCATE, CREATE, GRANT, EXEC,
         │               multi-statement chaining, SHUTDOWN
         │ sanitized_sql (LIMIT enforced to 1000 rows max)
         ▼
┌───────────────────┐
│  QueryExecutor    │  ← Decrypts credentials, gets pooled engine,
│  Service          │    executes with asyncio timeout (default 15s),
└────────┬──────────┘    strips sensitive columns from output
         │ rows, columns, execution_time_ms
         ▼
┌───────────────────┐
│  InsightAgent     │  ← Calls LLM with result data (up to 100 rows)
│  (Insight Gen.)   │    Returns: summary, key_takeaways, trends,
└────────┬──────────┘    anomalies, recommendations
         │                 Falls back to statistical heuristics
         │ InsightGenerateResponse
         ▼
┌───────────────────┐
│  HistoryRepo      │  ← Persists entire pipeline trace:
│  (Audit Log)      │    user_query, generated_sql, sanitized_sql,
└───────────────────┘    status, row_count, execution_time_ms,
                         insights_json
```

### Agent Details

#### 🧭 PlannerAgent (`agents/planner_agent.py`)

The Planner receives the user's natural language query plus the schema context and produces a structured **`QueryExecutionPlan`** — a Pydantic model describing:

| Field | Type | Description |
|---|---|---|
| `intent_summary` | str | Human-readable explanation of the query intent |
| `target_tables` | list[str] | Primary tables the query should target |
| `join_paths` | list[JoinPathSpec] | Explicit JOIN conditions (source, target, type, ON clause) |
| `metrics` | list[MetricAggregationSpec] | Aggregate expressions (SUM, COUNT, AVG) with aliases |
| `dimensions` | list[str] | Non-aggregate SELECT columns |
| `filters` | list[FilterConditionSpec] | WHERE conditions |
| `group_by` | list[str] | GROUP BY columns |
| `sort_by` | list[SortCriterionSpec] | ORDER BY directives |
| `limit` | int | Row cap (default 1000) |

**Fallback strategy**: If the LLM is unavailable or produces a plan referencing unknown tables/columns (validated by `_plan_matches_schema`), the agent falls back to a rule-based heuristic that analyzes intent keywords (`revenue`, `count`, `location`, etc.) and builds a safe, schema-grounded plan deterministically.

#### ⚙️ SqlAgent (`agents/sql_agent.py`)

Translates the execution plan into a dialect-correct SQL string. Key behaviors:
- Correctly quotes identifiers per dialect (`"col"` for PostgreSQL, backtick-col-backtick for MySQL).
- Produces structured `SELECT FROM JOIN WHERE GROUP BY ORDER BY LIMIT` queries.
- Has a fully deterministic fallback `_build_deterministic_sql()` that produces valid SQL from the plan without LLM involvement, ensuring the pipeline **never halts** due to LLM failure.

#### 🛡️ ValidatorAgent (`agents/validator_agent.py`)

The security gate of the pipeline — performs two-layer validation using **sqlglot**:

1. **Keyword scan**: Blocks any SQL containing `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`, `GRANT`, `REVOKE`, `EXEC`, `EXECUTE`, or `SHUTDOWN`.
2. **AST walk**: Parses the SQL into an Abstract Syntax Tree and checks every node against a set of `FORBIDDEN_EXPRESSIONS`. Only `exp.Select` is permitted as the root statement type.
3. **LIMIT enforcement**: Automatically appends `LIMIT 1000` if absent, or clamps an existing limit down to `max_rows`.
4. **Multi-statement blocking**: Rejects semicolon-chained statements.

#### 🏃 QueryExecutorService (`services/query_executor_service.py`)

Executes the validated SQL against the user's target database:
- Decrypts the stored password using `core/encryption.py`.
- Uses a **connection pool cache** via `ConnectionManager` (pool_size=5, max_overflow=10).
- Wraps execution in `asyncio.wait_for()` with a configurable timeout.
- **Sensitive column filtering**: Columns whose names match tokens like `password`, `secret`, `token`, `api_key`, `credential`, etc. are **silently omitted** from output — both by header name and by tracking aliased sensitive expressions via an AST scan.

#### 🔮 InsightAgent (`agents/insight_agent.py`)

Sends up to 100 result rows to the LLM with the original user query and generated SQL. Returns a structured `InsightGenerateResponse` containing:
- **summary**: Overall narrative interpretation
- **key_takeaways**: Bullet-point observations
- **trends**: `TrendHighlight` objects (title + description)
- **anomalies**: `AnomalyHighlight` objects (title + severity + description)
- **recommendations**: Actionable next steps

**Statistical fallback**: If the LLM is unavailable, computes basic statistics (count, average, max, min) on the first numeric column and flags outliers where max > 1.8 times the mean.

---

## 🛠️ Tech Stack

### Backend

| Component | Technology | Version |
|---|---|---|
| Framework | FastAPI | >=0.110 |
| ORM | SQLAlchemy (async) | >=2.0 |
| Migrations | Alembic | >=1.13 |
| Validation | Pydantic v2 | >=2.6 |
| Auth | PyJWT + passlib[bcrypt] | >=2.8 |
| Encryption | cryptography (Fernet) | >=42.0 |
| App DB | PostgreSQL (asyncpg) | 16 |
| MySQL support | aiomysql | >=0.2 |
| SQL Parsing | sqlglot | >=23.0 |
| Cache | Redis | 7 |
| LLM Client | openai (OpenAI-compatible) | >=1.10 |
| LLM Backend | Ollama (local) or OpenAI API | — |
| Testing | pytest + pytest-asyncio | >=8.0 |

### Frontend

| Component | Technology | Version |
|---|---|---|
| Framework | React | 18.2 |
| Language | TypeScript | 5.2 |
| Build Tool | Vite | 5.1 |
| Styling | TailwindCSS | 3.4 |
| Data Fetching | TanStack Query | 5.28 |
| Routing | React Router | 6.22 |
| Icons | Lucide React | 0.359 |

### Infrastructure

| Service | Image |
|---|---|
| Application DB | postgres:16-alpine |
| Cache | redis:7-alpine |
| LLM (local) | ollama/ollama:latest |
| Backend | Custom Python Dockerfile |
| Frontend | Custom Nginx Dockerfile |

---

## 📁 Project Structure

```
InsightDB-AI/
├── .env.example               # Environment variable template
├── docker-compose.yml         # Full-stack Docker Compose (5 services)
├── docker-compose.e2e.yml     # E2E test Compose overlay
├── IMPLEMENTATION_PLAN.md     # 19-milestone development roadmap
├── Makefile                   # E2E test commands
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── prompts/               # Versioned LLM prompt files
│   │   ├── planner_v1.txt
│   │   ├── sql_generator_v1.txt
│   │   └── insight_v1.txt
│   │
│   ├── app/
│   │   ├── main.py            # FastAPI app factory + lifespan
│   │   ├── agents/
│   │   │   ├── planner_agent.py
│   │   │   ├── sql_agent.py
│   │   │   ├── validator_agent.py
│   │   │   └── insight_agent.py
│   │   │
│   │   ├── api/v1/            # REST API route handlers (thin layer)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── database.py
│   │   │   ├── schema.py
│   │   │   ├── metadata.py
│   │   │   ├── pipeline.py    # POST /pipeline/ask — main AI endpoint
│   │   │   ├── query.py
│   │   │   ├── history.py
│   │   │   ├── planner.py
│   │   │   ├── sql.py
│   │   │   ├── validator.py
│   │   │   ├── insight.py
│   │   │   ├── report.py
│   │   │   └── health.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py      # Pydantic settings (env-based)
│   │   │   ├── security.py    # JWT create/decode, bcrypt hashing
│   │   │   ├── encryption.py  # Fernet credential encryption
│   │   │   └── logging.py
│   │   │
│   │   ├── services/
│   │   │   ├── pipeline_service.py        # Master pipeline orchestrator
│   │   │   ├── query_executor_service.py  # SQL execution + column filtering
│   │   │   ├── schema_service.py          # Schema sync + safe tree response
│   │   │   ├── metadata_service.py        # Annotation management + context builder
│   │   │   ├── connection_manager.py      # Async engine pool + connection test
│   │   │   ├── auth_service.py
│   │   │   ├── history_service.py
│   │   │   ├── report_export_service.py   # CSV / Markdown / JSON export
│   │   │   └── schema_inspector.py        # SQLAlchemy inspection of target DBs
│   │   │
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic I/O schemas
│   │   ├── repositories/      # DB access layer
│   │   └── database/          # Session factory + base declarative
│   │
│   └── tests/                 # 14 unit/integration test modules
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── App.tsx            # Root: auth guard + tab router
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── AuthView.tsx
│       │   ├── ConnectionManager.tsx
│       │   ├── SchemaExplorer.tsx
│       │   ├── QueryStudio.tsx    # Main AI query interface
│       │   └── QueryHistory.tsx   # Audit log + analytics dashboard
│       ├── services/api.ts    # Typed API client
│       └── types/index.ts     # Shared TypeScript interfaces
│
└── e2e/                       # End-to-end test suite (Playwright + pytest)
    ├── api/
    └── browser/
```

---

## ✨ Key Features

### 1. Natural Language Query Studio

The `QueryStudio` component is the primary user interface. Users type a question in plain English — e.g., _"Show total revenue by location for the last quarter"_ — and the system:

1. Auto-syncs the schema if not already cached.
2. Sends the query through the full AI pipeline.
3. Displays the **Planner Execution Strategy** (intent summary, tables, metrics).
4. Shows the **Generated and Validated SQL** with an "AST Validated and Read-Only Guaranteed" badge.
5. Renders an **interactive results table** with horizontal scroll for wide schemas.
6. Surfaces **AI Business Intelligence Insights** (summary, key takeaways, trends, anomalies, recommendations).
7. Offers one-click **export** to CSV, Markdown, or JSON.

### 2. Schema Explorer

A live, browsable catalog of every table and column in the connected database. Displays:
- Table names, column names, data types
- Primary key and foreign key indicators
- Sensitive column redaction (password, secret, token fields hidden automatically)
- Internal InsightDB operational tables excluded from the catalog

### 3. Connection Manager

Users can register multiple PostgreSQL and MySQL database connections. For each connection:
- Credentials are **encrypted at rest** using Fernet symmetric encryption before storage.
- A **test connection** feature validates reachability and reports latency before saving.
- Schema sync is triggered on-demand to populate the metadata catalog.

### 4. Query History and Analytics

A full audit log of every pipeline execution:
- Filter by connection or search free-text across query text and SQL.
- Statistics dashboard: total queries, success rate %, average latency (ms), total rows processed.
- Per-item inspection modal showing natural language intent, sanitized SQL, error details, and execution metrics.
- **"Use in Studio"** button loads any historical query back into Query Studio for re-execution.

### 5. Metadata Catalog and Business Annotations

Operators can enrich schema metadata with business context:
- **Business name**: Human-friendly alias for a table or column (e.g., `prk_rsv` → "Parking Reservations").
- **Description**: Free-text explanation of what a table/column represents.
- **Aliases**: Alternate names used in natural language questions.
- **Semantic type**: Typed annotation (e.g., `CURRENCY`, `DATE`, `IDENTIFIER`).

This metadata is injected into the LLM prompt context, dramatically improving query accuracy for domain-specific databases.

### 6. Report Export

Results from any successful query can be exported in three formats:
- **CSV**: Flat tabular data, perfect for spreadsheet analysis.
- **Markdown**: Formatted table with an executive summary header, ideal for reports and documentation.
- **JSON**: Structured payload with query context, column names, and all result rows.

---

## 🔒 Security Model

InsightDB AI implements defense-in-depth across multiple layers:

### Authentication
- **JWT-based auth** with separate access tokens (8-day expiry) and refresh tokens (30-day expiry).
- Passwords hashed with **bcrypt** via passlib.
- All protected endpoints require a valid `Bearer` token.

### SQL Safety — ValidatorAgent
- **Keyword blocklist**: 12 forbidden SQL keywords scanned at the string level before parsing.
- **AST analysis**: sqlglot parses all SQL into an AST; any node type from `FORBIDDEN_EXPRESSIONS` causes immediate rejection.
- **SELECT-only enforcement**: Any statement type other than `SELECT` is rejected.
- **Statement chaining blocked**: Multiple statements separated by semicolons are rejected.
- **Row cap**: `LIMIT` is enforced to a maximum of 1,000 rows per query.

### Credential Security
- Database passwords are encrypted with **Fernet** (AES-128-CBC + HMAC-SHA256) before storage.
- The encryption key is an environment variable — never hardcoded.
- Decrypted passwords exist only in-memory during query execution and are never logged or returned via API.

### Data Redaction
- Columns whose names match sensitive tokens (`password`, `secret`, `token`, `api_key`, `credential`, `authorization`, `private_key`, etc.) are automatically **stripped from query results**.
- Aliased sensitive columns are detected via an additional AST scan of the SELECT clause.
- Internal InsightDB operational tables (users, database_connections, etc.) are excluded from the schema catalog and cannot be queried through the AI pipeline.

### Access Control
- Every data access operation verifies `connection.owner_id == current_user.id`, enforcing strict per-user data isolation.

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Obtain access + refresh tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/auth/me` | Get current user profile |

### Database Connections

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/database/connections` | List all user connections |
| `POST` | `/database/connections` | Create a new connection |
| `GET` | `/database/connections/{id}` | Get connection details |
| `PUT` | `/database/connections/{id}` | Update connection |
| `DELETE` | `/database/connections/{id}` | Delete connection |
| `POST` | `/database/connections/test` | Test connection params |

### Schema and Metadata

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/schema/{connection_id}/sync` | Introspect and cache schema |
| `GET` | `/schema/{connection_id}/tables` | Get schema tree |
| `GET` | `/schema/{connection_id}/tables/{table}` | Get table details |
| `PUT` | `/metadata/tables/{table_id}` | Update table annotation |
| `PUT` | `/metadata/columns/{column_id}` | Update column annotation |
| `GET` | `/metadata/{connection_id}/search` | Search metadata catalog |
| `GET` | `/metadata/{connection_id}/context` | Get LLM prompt context |

### AI Pipeline

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/pipeline/ask` | **Main endpoint** — full NL to SQL to Results to Insights |
| `POST` | `/planner/plan` | Standalone: generate execution plan only |
| `POST` | `/sql/generate` | Standalone: generate SQL from plan |
| `POST` | `/validator/validate` | Standalone: validate SQL string |
| `POST` | `/query/execute` | Direct SQL execution (validated) |
| `POST` | `/insight/generate` | Standalone: generate insights from data |

### History and Reports

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/history` | List query history (filterable by connection) |
| `GET` | `/history/stats` | Aggregate statistics |
| `DELETE` | `/history/{id}` | Delete a history record |
| `POST` | `/report/export` | Export results as CSV/Markdown/JSON |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |

Interactive API documentation is auto-generated at `http://localhost:8000/docs`.

---

## 🖥️ Frontend Components

### `App.tsx`
Root component implementing JWT session restoration from `localStorage` on mount, auth guard routing, global state management for user/connections, and tab-based navigation. Query history to Studio integration is handled via `handleSelectHistoryQuery`.

### `AuthView.tsx`
Login and registration form with inline mode switching and validation feedback.

### `Navbar.tsx`
Top navigation bar with app branding, active connection selector dropdown, tab links (Studio, Connections, Schema, History), and user menu with logout.

### `QueryStudio.tsx`
The primary query interface featuring:
- Natural language input with sparkle icon and live connection status badge
- Auto-schema-sync before first query
- Planner Execution Strategy panel (intent summary, target tables, metrics tags)
- Generated SQL panel with AST-validation badge
- Scrollable results table with omitted column disclosure notification
- Export toolbar (CSV / Markdown / JSON)
- AI Insights panel (summary, takeaways, trends, anomaly warnings, strategic recommendations)

### `SchemaExplorer.tsx`
Schema tree browser with sync button, expandable table/column tree, and column type/PK/FK badges.

### `ConnectionManager.tsx`
Full CRUD interface for database connections with add form, test connection button (displays latency), active connection highlight, and delete with confirmation.

### `QueryHistory.tsx`
Audit log dashboard with statistics cards (total queries, success rate, avg latency, total rows), searchable/filterable history table, inspect modal (full SQL, error details, metrics), and "Use in Studio" shortcut.

---

## 🚀 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Dharanish-AM/InsightDB-AI.git
cd InsightDB-AI
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — configure `OPENAI_API_KEY` if you want cloud LLM responses, or leave it as `ollama` to use the bundled local Ollama instance.

### 3. Start all services

```bash
docker compose up --build
```

This brings up:
- **PostgreSQL** on `localhost:5433`
- **Redis** on `localhost:6380`
- **Ollama** on `localhost:11434`
- **Backend** (FastAPI) on `localhost:8000`
- **Frontend** (Nginx/React) on `localhost:5173`

### 4. Pull an Ollama model (for local AI)

```bash
docker exec -it insightdb_ollama ollama pull llama3.2:1b
```

### 5. Open the app

Navigate to **http://localhost:5173**, register an account, add a database connection, sync its schema, and start asking questions.

---

## ⚙️ Environment Configuration

| Variable | Default | Description |
|---|---|---|
| `ENVIRONMENT` | `development` | Runtime environment |
| `DEBUG` | `True` | FastAPI debug mode |
| `SECRET_KEY` | `(change me)` | JWT signing key — **change in production** |
| `ENCRYPTION_KEY` | `(base64)` | Fernet key for credential encryption |
| `DATABASE_URL` | `postgresql+asyncpg://...` | InsightDB app database URL |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL |
| `OPENAI_API_KEY` | `ollama` | API key (use `ollama` for local, real key for OpenAI) |
| `OPENAI_BASE_URL` | `http://ollama:11434/v1` | LLM API base URL |
| `LLM_MODEL_NAME` | `llama3.2:1b` | Model name to use |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `11520` (8 days) | JWT access token lifetime |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins |

> **Production note**: Always rotate `SECRET_KEY` and `ENCRYPTION_KEY` before deploying. Use a secrets manager rather than plain `.env` files.

---

## 🧪 Testing

### Unit and Integration Tests (Backend)

```bash
# Run all backend tests
cd backend
pip install -r requirements.txt
pytest tests/ -v

# Skip LLM calls (for CI without API keys)
SKIP_LLM_TESTS=true pytest tests/ -v
```

The test suite covers 14 modules:

| Module | What it tests |
|---|---|
| `test_auth.py` | Registration, login, token refresh, protected endpoints |
| `test_pipeline.py` | Full NL to SQL to Results to Insights pipeline |
| `test_planner_agent.py` | LLM planning + deterministic fallback |
| `test_sql_generator.py` | SQL generation for PostgreSQL and MySQL dialects |
| `test_sql_validator.py` | Keyword blocking, AST rejection, LIMIT enforcement |
| `test_insight_generator.py` | LLM insights + statistical fallback |
| `test_query_executor.py` | Execution, timeout, sensitive column filtering |
| `test_schema_discovery.py` | Schema introspection and metadata persistence |
| `test_metadata_store.py` | Table/column annotation CRUD |
| `test_database_connector.py` | Connection creation, test, deletion |
| `test_query_history.py` | History storage and statistics |
| `test_report_exporter.py` | CSV, Markdown, JSON export formats |
| `test_health.py` | Health endpoint |

### End-to-End Tests

E2E tests use **pytest + Playwright** for browser automation and API-level testing.

```bash
# Install E2E dependencies
make e2e-install
make e2e-browsers

# Start services for E2E
make e2e-up

# Run API E2E tests (fastest, no LLM calls)
make e2e-api

# Run browser E2E tests (headless)
make e2e-browser-headless

# Run all E2E tests
make e2e

# CI mode (no LLM)
make e2e-skip-llm

# Tear down
make e2e-down
```

---

## 📐 Development Rules

### DO

- Use the **Repository Pattern** for all DB access — never touch `Session` directly in routes or services.
- Use **Dependency Injection** via FastAPI's `Depends()` — `api/deps.py` is the single place to assemble service instances.
- Use **Pydantic models** for every request and response — no dicts crossing service boundaries.
- Write **async** service methods — synchronous blocking calls are not permitted.
- Add **type hints** to every function signature.
- Store all LLM prompts in `backend/prompts/` as versioned `.txt` files.
- Include **unit tests** for every new service and agent.
- Log at appropriate levels (`INFO` for pipeline milestones, `WARNING` for fallbacks, `ERROR` for failures).

### DON'T

- No business logic inside API routes — routes only validate auth and delegate to services.
- No raw SQL in endpoints or services — use SQLAlchemy ORM or repositories.
- No hardcoded prompt strings — all prompts are external files.
- No duplicated utility code — add shared helpers to `core/`.
- No global mutable state — use FastAPI DI and module-level singletons only where stateless.

---

## 🗺️ Roadmap

InsightDB AI follows a 19-milestone delivery plan:

| Milestone | Feature | Status |
|---|---|---|
| 1 | Project Setup | Complete |
| 2 | Authentication (JWT) | Complete |
| 3 | Database Connector | Complete |
| 4 | Schema Discovery | Complete |
| 5 | Metadata Store and Annotations | Complete |
| 6 | Planner Agent | Complete |
| 7 | SQL Generator Agent | Complete |
| 8 | SQL Validator Agent | Complete |
| 9 | Query Executor | Complete |
| 10 | Insight Generator | Complete |
| 11 | Visualization Engine | Planned |
| 12 | Conversation Memory | Planned |
| 13 | Complete REST API | Complete |
| 14 | Frontend UI | Complete |
| 15 | Report Export (CSV/MD/JSON) | Complete |
| 16 | Enterprise Security (RBAC, Rate Limiting) | Planned |
| 17 | Monitoring and Observability | Planned |
| 18 | Test Coverage (90% target) | In Progress |
| 19 | Production Deployment Configs | In Progress |

### Future Enhancements

- **Apache Superset API integration** — push AI-generated charts directly into Superset dashboards
- **Visualization Engine** — auto-select chart type (line, area, bar, pie, table) based on data shape
- **Conversation Memory** — multi-turn chat with context retention via Redis
- **Forecasting** — time-series prediction from historical data
- **Multi-agent collaboration** — parallel agents working on different sub-queries
- **Fine-tuned SQL model** — domain-specific LLM trained on customer schema patterns
- **MCP Server** — expose InsightDB as a Model Context Protocol server
- **Slack / Teams integration** — query data directly from chat platforms
- **Voice interface** — speak your business questions

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`.
3. Follow the Development Rules strictly.
4. Ensure all existing tests pass and add tests for your new code.
5. Open a pull request with a clear description of what changed and why.

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

<div align="center">

**InsightDB AI** · *Intelligence for every SQL decision*

Built with FastAPI, React, and LLMs

</div>
