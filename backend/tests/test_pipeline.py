import pytest
from httpx import AsyncClient
from app.repositories.schema_repository import SchemaRepository
from app.services.schema_inspector import ColumnMetadata, TableMetadata


@pytest.mark.asyncio
async def test_pipeline_ask_api_endpoint(async_client: AsyncClient, db_session):
    await async_client.post(
        "/api/v1/auth/register",
        json={"email": "pipeline_user@example.com", "password": "Password123!"}
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "pipeline_user@example.com", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = await async_client.post(
        "/api/v1/databases/",
        headers=headers,
        json={
            "name": "Pipeline Target DB",
            "db_type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "database_name": "pipeline_db",
            "username": "user",
            "password": "password"
        }
    )
    conn_id = create_res.json()["id"]

    schema_repo = SchemaRepository(db_session)
    await schema_repo.save_schema_metadata(
        connection_id=conn_id,
        tables_metadata=[
            TableMetadata(
                table_name="orders",
                table_type="table",
                schema_name=None,
                comment=None,
                columns=[
                    ColumnMetadata(
                        column_name="id",
                        data_type="INTEGER",
                        is_nullable=False,
                        is_primary_key=True,
                        is_foreign_key=False,
                        foreign_key_target=None,
                        default_value=None,
                        comment=None
                    ),
                    ColumnMetadata(
                        column_name="amount",
                        data_type="NUMERIC",
                        is_nullable=False,
                        is_primary_key=False,
                        is_foreign_key=False,
                        foreign_key_target=None,
                        default_value=None,
                        comment=None
                    )
                ]
            )
        ]
    )

    ask_res = await async_client.post(
        "/api/v1/pipeline/ask",
        headers=headers,
        json={
            "connection_id": conn_id,
            "user_query": "Calculate total order amounts",
            "max_rows": 50
        }
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert data["connection_id"] == conn_id
    assert data["user_query"] == "Calculate total order amounts"
    assert "error" in data or "plan" in data


@pytest.mark.asyncio
async def test_pipeline_requires_schema_metadata_before_querying(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={"email": "pipeline_empty_schema@example.com", "password": "Password123!"}
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "pipeline_empty_schema@example.com", "password": "Password123!"}
    )
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
    create_res = await async_client.post(
        "/api/v1/databases/",
        headers=headers,
        json={
            "name": "Unsynced DB",
            "db_type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "database_name": "unsynced",
            "username": "user",
            "password": "password"
        }
    )

    ask_res = await async_client.post(
        "/api/v1/pipeline/ask",
        headers=headers,
        json={
            "connection_id": create_res.json()["id"],
            "user_query": "Show all database connections"
        }
    )

    assert ask_res.status_code == 200
    data = ask_res.json()
    assert data["success"] is False
    assert data["plan"] is None
    assert data["sql_generated"] is None
    assert "Sync the schema" in data["error"]
