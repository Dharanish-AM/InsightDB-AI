import os
import pytest
import httpx

SKIP_LLM = os.getenv("SKIP_LLM_TESTS", "false").lower() == "true"


@pytest.mark.api
async def test_pipeline_ask_requires_auth(
    api_client: httpx.AsyncClient, created_connection: dict
):
    res = await api_client.post(
        "/api/v1/pipeline/ask",
        json={
            "connection_id": created_connection["id"],
            "user_query": "show all tables",
            "max_rows": 10,
        },
    )
    assert res.status_code == 401


@pytest.mark.api
async def test_pipeline_ask_nonexistent_connection_returns_404(
    api_client: httpx.AsyncClient, auth_headers: dict
):
    res = await api_client.post(
        "/api/v1/pipeline/ask",
        headers=auth_headers,
        json={
            "connection_id": 999999,
            "user_query": "show all tables",
            "max_rows": 10,
        },
    )
    assert res.status_code == 404


@pytest.mark.api
@pytest.mark.slow
@pytest.mark.skipif(SKIP_LLM, reason="SKIP_LLM_TESTS=true")
async def test_pipeline_ask_returns_structured_response(
    api_client: httpx.AsyncClient, auth_headers: dict, created_connection: dict
):
    res = await api_client.post(
        "/api/v1/pipeline/ask",
        headers=auth_headers,
        json={
            "connection_id": created_connection["id"],
            "user_query": "Show me all records",
            "max_rows": 50,
        },
        timeout=120.0,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["connection_id"] == created_connection["id"]
    assert data["user_query"] == "Show me all records"
    assert "plan" in data or "error" in data
    assert "success" in data


@pytest.mark.api
@pytest.mark.slow
@pytest.mark.skipif(SKIP_LLM, reason="SKIP_LLM_TESTS=true")
async def test_pipeline_ask_with_empty_query_fails_gracefully(
    api_client: httpx.AsyncClient, auth_headers: dict, created_connection: dict
):
    res = await api_client.post(
        "/api/v1/pipeline/ask",
        headers=auth_headers,
        json={
            "connection_id": created_connection["id"],
            "user_query": "",
            "max_rows": 10,
        },
        timeout=30.0,
    )
    assert res.status_code in (200, 422)
    if res.status_code == 200:
        data = res.json()
        assert data["success"] is False or "error" in data
