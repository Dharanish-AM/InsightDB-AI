import pytest
from httpx import AsyncClient
from app.schemas.query_executor import QueryExecuteRequest, QueryExecuteResponse


@pytest.mark.asyncio
async def test_query_executor_validation_block(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={"email": "executor_user@example.com", "password": "Password123!"}
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "executor_user@example.com", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = await async_client.post(
        "/api/v1/databases/",
        headers=headers,
        json={
            "name": "Target Execute DB",
            "db_type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "database_name": "target_db",
            "username": "user",
            "password": "password"
        }
    )
    conn_id = create_res.json()["id"]

    exec_res = await async_client.post(
        "/api/v1/query/execute",
        headers=headers,
        json={
            "connection_id": conn_id,
            "sql": "DROP TABLE users;"
        }
    )
    assert exec_res.status_code == 200
    data = exec_res.json()
    assert data["success"] is False
    assert "Forbidden" in data["error"] or "SELECT" in data["error"]
