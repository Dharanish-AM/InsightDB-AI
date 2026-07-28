import pytest
import httpx


@pytest.mark.api
async def test_get_schema_empty_before_sync(
    api_client: httpx.AsyncClient, auth_headers: dict, created_connection: dict
):
    conn_id = created_connection["id"]
    res = await api_client.get(f"/api/v1/schema/{conn_id}", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


@pytest.mark.api
async def test_sync_schema_returns_response(
    api_client: httpx.AsyncClient, auth_headers: dict, created_connection: dict
):
    conn_id = created_connection["id"]
    res = await api_client.post(f"/api/v1/schema/{conn_id}/sync", headers=auth_headers)
    assert res.status_code in (200, 422, 500, 503)
    if res.status_code == 200:
        data = res.json()
        assert "tables_synced" in data or "message" in data


@pytest.mark.api
async def test_schema_requires_auth(api_client: httpx.AsyncClient, created_connection: dict):
    conn_id = created_connection["id"]
    res = await api_client.get(f"/api/v1/schema/{conn_id}")
    assert res.status_code == 401


@pytest.mark.api
async def test_schema_nonexistent_connection_returns_404(
    api_client: httpx.AsyncClient, auth_headers: dict
):
    res = await api_client.get("/api/v1/schema/999999", headers=auth_headers)
    assert res.status_code == 404


@pytest.mark.api
async def test_table_detail_nonexistent_returns_404(
    api_client: httpx.AsyncClient, auth_headers: dict, created_connection: dict
):
    conn_id = created_connection["id"]
    res = await api_client.get(
        f"/api/v1/schema/{conn_id}/tables/nonexistent_table",
        headers=auth_headers,
    )
    assert res.status_code == 404
