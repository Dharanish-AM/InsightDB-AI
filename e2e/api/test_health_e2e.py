import pytest
import httpx


@pytest.mark.api
async def test_root_returns_app_name(api_client: httpx.AsyncClient):
    res = await api_client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "InsightDB AI"
    assert "version" in data
    assert "docs" in data
    assert "health" in data


@pytest.mark.api
async def test_health_check_returns_ok(api_client: httpx.AsyncClient):
    res = await api_client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data


@pytest.mark.api
async def test_docs_accessible(api_client: httpx.AsyncClient):
    res = await api_client.get("/docs")
    assert res.status_code == 200


@pytest.mark.api
async def test_openapi_schema_accessible(api_client: httpx.AsyncClient):
    res = await api_client.get("/api/v1/openapi.json")
    assert res.status_code == 200
    schema = res.json()
    assert "openapi" in schema
    assert "paths" in schema
