import pytest
from httpx import AsyncClient
from app.agents.validator_agent import validator_agent


def test_valid_select_query():
    res = validator_agent.validate_sql("SELECT id, name FROM users WHERE is_active = true", dialect="postgres")
    assert res.is_valid is True
    assert "LIMIT 1000" in res.sanitized_sql
    assert len(res.violations) == 0


def test_reject_drop_statement():
    res = validator_agent.validate_sql("DROP TABLE users;", dialect="postgres")
    assert res.is_valid is False
    assert any("Only SELECT" in v or "DROP" in v for v in res.violations)


def test_reject_delete_statement():
    res = validator_agent.validate_sql("DELETE FROM users WHERE id = 1;", dialect="postgres")
    assert res.is_valid is False
    assert any("Only SELECT" in v or "DELETE" in v for v in res.violations)


def test_reject_insert_statement():
    res = validator_agent.validate_sql("INSERT INTO users (name) VALUES ('Hacker');", dialect="postgres")
    assert res.is_valid is False


def test_reject_multi_statement_chaining():
    res = validator_agent.validate_sql("SELECT * FROM users; DROP TABLE users;", dialect="postgres")
    assert res.is_valid is False
    assert any("Multiple SQL statements" in v for v in res.violations)


def test_row_limit_enforcement():
    res = validator_agent.validate_sql("SELECT * FROM users LIMIT 5000", max_rows=500, dialect="postgres")
    assert res.is_valid is True
    assert "LIMIT 500" in res.sanitized_sql


@pytest.mark.asyncio
async def test_validate_api_endpoint(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={"email": "validator_user@example.com", "password": "Password123!"}
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "validator_user@example.com", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = await async_client.post(
        "/api/v1/databases/",
        headers=headers,
        json={
            "name": "Validation Target DB",
            "db_type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "database_name": "target",
            "username": "user",
            "password": "password"
        }
    )
    conn_id = create_res.json()["id"]

    valid_res = await async_client.post(
        "/api/v1/sql/validate",
        headers=headers,
        json={
            "connection_id": conn_id,
            "sql": "SELECT id, email FROM users",
            "max_rows": 100
        }
    )
    assert valid_res.status_code == 200
    valid_data = valid_res.json()
    assert valid_data["is_valid"] is True
    assert "LIMIT 100" in valid_data["sanitized_sql"]

    invalid_res = await async_client.post(
        "/api/v1/sql/validate",
        headers=headers,
        json={
            "connection_id": conn_id,
            "sql": "TRUNCATE TABLE users"
        }
    )
    assert invalid_res.status_code == 200
    invalid_data = invalid_res.json()
    assert invalid_data["is_valid"] is False
    assert len(invalid_data["violations"]) > 0
