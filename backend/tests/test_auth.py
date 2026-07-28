import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_user(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "SecurePassword123!",
            "full_name": "Test User",
            "role": "analyst"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    assert data["role"] == "analyst"
    assert "id" in data
    assert "hashed_password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_user(async_client: AsyncClient):
    payload = {
        "email": "duplicate@example.com",
        "password": "SecurePassword123!",
        "full_name": "Duplicate User"
    }
    first_res = await async_client.post("/api/v1/auth/register", json=payload)
    assert first_res.status_code == 201

    second_res = await async_client.post("/api/v1/auth/register", json=payload)
    assert second_res.status_code == 400
    assert second_res.json()["detail"] == "A user with this email address already exists."


@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "password": "Password123!",
            "full_name": "Login User"
        }
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@example.com",
            "password": "Password123!"
        }
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_password(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "invalid@example.com",
            "password": "CorrectPassword"
        }
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "invalid@example.com",
            "password": "WrongPassword"
        }
    )
    assert login_res.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_me(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "me@example.com",
            "password": "Password123!",
            "full_name": "Me User"
        }
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "me@example.com",
            "password": "Password123!"
        }
    )
    token = login_res.json()["access_token"]

    me_res = await async_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert user_data["email"] == "me@example.com"
    assert user_data["full_name"] == "Me User"


@pytest.mark.asyncio
async def test_get_me_unauthorized(async_client: AsyncClient):
    res = await async_client.get("/api/v1/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": "refresh@example.com",
            "password": "Password123!"
        }
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": "refresh@example.com",
            "password": "Password123!"
        }
    )
    refresh_token = login_res.json()["refresh_token"]

    refresh_res = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_res.status_code == 200
    new_tokens = refresh_res.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
