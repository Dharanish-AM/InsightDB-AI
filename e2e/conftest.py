import os
import uuid
import pytest
import httpx

BASE_URL = os.getenv("E2E_BASE_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("E2E_FRONTEND_URL", "http://localhost:5173")
SKIP_LLM = os.getenv("SKIP_LLM_TESTS", "false").lower() == "true"


@pytest.fixture(scope="session")
def base_url() -> str:
    return BASE_URL


@pytest.fixture(scope="session")
def frontend_url() -> str:
    return FRONTEND_URL


def _unique_email() -> str:
    return f"e2e_{uuid.uuid4().hex[:8]}@insightdb-e2e.com"


@pytest.fixture
async def api_client(base_url: str):
    async with httpx.AsyncClient(base_url=base_url, timeout=30.0) as client:
        yield client


@pytest.fixture
async def auth_headers(api_client: httpx.AsyncClient) -> dict:
    email = _unique_email()
    password = "E2ePassword123!"

    await api_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "E2E User"},
    )

    login_res = await api_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    login_res.raise_for_status()
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def created_connection(api_client: httpx.AsyncClient, auth_headers: dict) -> dict:
    res = await api_client.post(
        "/api/v1/databases/",
        headers=auth_headers,
        json={
            "name": f"E2E DB {uuid.uuid4().hex[:6]}",
            "db_type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "database_name": "e2e_db",
            "username": "e2e_user",
            "password": "e2e_pass",
        },
    )
    res.raise_for_status()
    yield res.json()
    conn_id = res.json()["id"]
    await api_client.delete(f"/api/v1/databases/{conn_id}", headers=auth_headers)
