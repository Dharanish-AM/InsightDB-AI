import uuid
import pytest
import httpx


def _unique_email() -> str:
    return f"e2e_auth_{uuid.uuid4().hex[:8]}@insightdb-e2e.com"


@pytest.mark.api
async def test_register_new_user(api_client: httpx.AsyncClient):
    email = _unique_email()
    res = await api_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "full_name": "E2E Auth User"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == email
    assert data["full_name"] == "E2E Auth User"
    assert "id" in data
    assert "hashed_password" not in data


@pytest.mark.api
async def test_register_duplicate_email_returns_400(api_client: httpx.AsyncClient):
    email = _unique_email()
    payload = {"email": email, "password": "Password123!"}
    first = await api_client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    second = await api_client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 400
    assert "already exists" in second.json()["detail"].lower()


@pytest.mark.api
async def test_login_returns_tokens(api_client: httpx.AsyncClient):
    email = _unique_email()
    await api_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!"},
    )
    res = await api_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.api
async def test_login_wrong_password_returns_401(api_client: httpx.AsyncClient):
    email = _unique_email()
    await api_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "CorrectPassword123!"},
    )
    res = await api_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "WrongPassword!"},
    )
    assert res.status_code == 401


@pytest.mark.api
async def test_login_nonexistent_user_returns_401(api_client: httpx.AsyncClient):
    res = await api_client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@insightdb-e2e.com", "password": "irrelevant"},
    )
    assert res.status_code == 401


@pytest.mark.api
async def test_get_me_with_valid_token(api_client: httpx.AsyncClient, auth_headers: dict):
    res = await api_client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "email" in data
    assert "id" in data
    assert "hashed_password" not in data


@pytest.mark.api
async def test_get_me_without_token_returns_401(api_client: httpx.AsyncClient):
    res = await api_client.get("/api/v1/auth/me")
    assert res.status_code == 401


@pytest.mark.api
async def test_get_me_with_invalid_token_returns_401(api_client: httpx.AsyncClient):
    res = await api_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer this.is.not.a.valid.token"},
    )
    assert res.status_code == 401


@pytest.mark.api
async def test_refresh_token_returns_new_tokens(api_client: httpx.AsyncClient):
    email = _unique_email()
    await api_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!"},
    )
    login_res = await api_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    refresh_token = login_res.json()["refresh_token"]

    res = await api_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
