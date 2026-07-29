import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database_connection import DatabaseConnection, DbType
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token


@pytest.mark.asyncio
async def test_query_history_flow(async_client: AsyncClient, db_session: AsyncSession):
    # Setup test user
    user = User(
        email="history_user@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="History User",
        role=UserRole.ANALYST,
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    conn = DatabaseConnection(
        name="History Test DB",
        db_type=DbType.POSTGRESQL,
        host="localhost",
        port=5432,
        database_name="test_db",
        username="postgres",
        encrypted_password="secret_password",
        owner_id=user.id
    )
    db_session.add(conn)
    await db_session.commit()
    await db_session.refresh(conn)

    token = create_access_token(user.id, user.role.value)
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch initial history (should be empty)
    res = await async_client.get("/api/v1/history", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 0
    assert data["items"] == []

    # Fetch history stats
    res_stats = await async_client.get("/api/v1/history/stats", headers=headers)
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["total_queries"] == 0
    assert stats["successful_queries"] == 0
