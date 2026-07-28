import uuid
import pytest
import httpx


def _conn_payload(name: str | None = None) -> dict:
    return {
        "name": name or f"E2E Connection {uuid.uuid4().hex[:6]}",
        "db_type": "postgresql",
        "host": "localhost",
        "port": 5432,
        "database_name": "e2e_target_db",
        "username": "e2e_user",
        "password": "e2e_pass",
    }


@pytest.mark.api
async def test_create_connection_returns_201(
    api_client: httpx.AsyncClient, auth_headers: dict
):
    res = await api_client.post(
        "/api/v1/databases/", headers=auth_headers, json=_conn_payload()
    )
    assert res.status_code == 201
    data = res.json()
    assert "id" in data
    assert data["db_type"] == "postgresql"
    assert data["host"] == "localhost"
    assert "password" not in data


@pytest.mark.api
async def test_list_connections_includes_created(
    api_client: httpx.AsyncClient, auth_headers: dict, created_connection: dict
):
    res = await api_client.get("/api/v1/databases/", headers=auth_headers)
    assert res.status_code == 200
    ids = [c["id"] for c in res.json()]
    assert created_connection["id"] in ids


@pytest.mark.api
async def test_get_single_connection_returns_200(
    api_client: httpx.AsyncClient, auth_headers: dict, created_connection: dict
):
    conn_id = created_connection["id"]
    res = await api_client.get(f"/api/v1/databases/{conn_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == conn_id


@pytest.mark.api
async def test_get_nonexistent_connection_returns_404(
    api_client: httpx.AsyncClient, auth_headers: dict
):
    res = await api_client.get("/api/v1/databases/999999", headers=auth_headers)
    assert res.status_code == 404


@pytest.mark.api
async def test_update_connection_name(
    api_client: httpx.AsyncClient, auth_headers: dict, created_connection: dict
):
    conn_id = created_connection["id"]
    new_name = f"Updated {uuid.uuid4().hex[:6]}"
    res = await api_client.put(
        f"/api/v1/databases/{conn_id}",
        headers=auth_headers,
        json={"name": new_name},
    )
    assert res.status_code == 200
    assert res.json()["name"] == new_name


@pytest.mark.api
async def test_delete_connection_returns_204(
    api_client: httpx.AsyncClient, auth_headers: dict
):
    create_res = await api_client.post(
        "/api/v1/databases/", headers=auth_headers, json=_conn_payload()
    )
    conn_id = create_res.json()["id"]

    delete_res = await api_client.delete(
        f"/api/v1/databases/{conn_id}", headers=auth_headers
    )
    assert delete_res.status_code == 204

    get_res = await api_client.get(f"/api/v1/databases/{conn_id}", headers=auth_headers)
    assert get_res.status_code == 404


@pytest.mark.api
async def test_test_raw_connection_returns_response(
    api_client: httpx.AsyncClient, auth_headers: dict
):
    res = await api_client.post(
        "/api/v1/databases/test-connection",
        headers=auth_headers,
        json={
            "db_type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "database_name": "does_not_exist",
            "username": "nobody",
            "password": "wrong",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "success" in data
    assert data["success"] is False


@pytest.mark.api
async def test_connections_isolated_between_users(
    api_client: httpx.AsyncClient, auth_headers: dict
):
    other_email = f"other_{uuid.uuid4().hex[:6]}@insightdb-e2e.com"
    await api_client.post(
        "/api/v1/auth/register",
        json={"email": other_email, "password": "Password123!"},
    )
    other_login = await api_client.post(
        "/api/v1/auth/login",
        json={"email": other_email, "password": "Password123!"},
    )
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}

    res = await api_client.post(
        "/api/v1/databases/", headers=auth_headers, json=_conn_payload()
    )
    conn_id = res.json()["id"]

    other_res = await api_client.get(
        f"/api/v1/databases/{conn_id}", headers=other_headers
    )
    assert other_res.status_code in (403, 404)
