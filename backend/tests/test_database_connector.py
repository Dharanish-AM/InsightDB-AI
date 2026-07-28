import pytest
from httpx import AsyncClient
from app.core.encryption import decrypt_string, encrypt_string
from app.services.connection_manager import connection_manager


def test_encryption_decryption():
    secret = "SuperSecretDbPassword123!"
    encrypted = encrypt_string(secret)
    assert encrypted != secret
    decrypted = decrypt_string(encrypted)
    assert decrypted == secret


def test_connection_url_builder():
    pg_url = connection_manager.build_connection_url(
        db_type="postgresql",
        host="localhost",
        port=5432,
        database_name="test_db",
        username="db_user",
        password="db_password"
    )
    assert pg_url == "postgresql+asyncpg://db_user:db_password@localhost:5432/test_db"

    mysql_url = connection_manager.build_connection_url(
        db_type="mysql",
        host="127.0.0.1",
        port=3306,
        database_name="analytics",
        username="root",
        password="secretpassword"
    )
    assert mysql_url == "mysql+aiomysql://root:secretpassword@127.0.0.1:3306/analytics"


@pytest.mark.asyncio
async def test_database_connection_crud(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={"email": "dbowner@example.com", "password": "Password123!"}
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "dbowner@example.com", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = await async_client.post(
        "/api/v1/databases/",
        headers=headers,
        json={
            "name": "Production Postgres",
            "db_type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "database_name": "prod_db",
            "username": "postgres",
            "password": "Password123!",
            "ssl_mode": "prefer"
        }
    )
    assert create_res.status_code == 201
    conn_data = create_res.json()
    assert conn_data["name"] == "Production Postgres"
    assert conn_data["db_type"] == "postgresql"
    assert "password" not in conn_data
    assert "encrypted_password" not in conn_data
    conn_id = conn_data["id"]

    list_res = await async_client.get("/api/v1/databases/", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1
    assert list_res.json()[0]["id"] == conn_id

    get_res = await async_client.get(f"/api/v1/databases/{conn_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Production Postgres"

    update_res = await async_client.put(
        f"/api/v1/databases/{conn_id}",
        headers=headers,
        json={"name": "Updated Postgres Name"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Postgres Name"

    del_res = await async_client.delete(f"/api/v1/databases/{conn_id}", headers=headers)
    assert del_res.status_code == 204

    get_after_del = await async_client.get(f"/api/v1/databases/{conn_id}", headers=headers)
    assert get_after_del.status_code == 404


@pytest.mark.asyncio
async def test_database_connection_isolation(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={"email": "user1@example.com", "password": "Password123!"}
    )
    res1 = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "user1@example.com", "password": "Password123!"}
    )
    token1 = res1.json()["access_token"]

    await async_client.post(
        "/api/v1/auth/register",
        json={"email": "user2@example.com", "password": "Password123!"}
    )
    res2 = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "user2@example.com", "password": "Password123!"}
    )
    token2 = res2.json()["access_token"]

    create_res = await async_client.post(
        "/api/v1/databases/",
        headers={"Authorization": f"Bearer {token1}"},
        json={
            "name": "User 1 Connection",
            "db_type": "mysql",
            "host": "localhost",
            "port": 3306,
            "database_name": "db1",
            "username": "user1",
            "password": "Password123!"
        }
    )
    conn_id = create_res.json()["id"]

    forbidden_res = await async_client.get(
        f"/api/v1/databases/{conn_id}",
        headers={"Authorization": f"Bearer {token2}"}
    )
    assert forbidden_res.status_code == 403


@pytest.mark.asyncio
async def test_raw_connection_test(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={"email": "tester@example.com", "password": "Password123!"}
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "tester@example.com", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]

    test_res = await async_client.post(
        "/api/v1/databases/test-connection",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "db_type": "postgresql",
            "host": "invalid-host-name-12345.local",
            "port": 5432,
            "database_name": "non_existent_db",
            "username": "invalid_user",
            "password": "invalid_password"
        }
    )
    assert test_res.status_code == 200
    data = test_res.json()
    assert data["success"] is False
    assert "Connection failed" in data["message"]
