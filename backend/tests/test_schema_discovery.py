import pytest
from httpx import AsyncClient
from app.services.schema_inspector import ColumnMetadata, TableMetadata
from app.repositories.schema_repository import SchemaRepository


@pytest.mark.asyncio
async def test_schema_inspector_data_structures():
    table_meta = TableMetadata(
        table_name="users",
        table_type="table",
        schema_name=None,
        comment="User accounts table",
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
                column_name="email",
                data_type="VARCHAR(255)",
                is_nullable=False,
                is_primary_key=False,
                is_foreign_key=False,
                foreign_key_target=None,
                default_value=None,
                comment=None
            )
        ]
    )
    assert table_meta.table_name == "users"
    assert len(table_meta.columns) == 2
    assert table_meta.columns[0].is_primary_key is True


@pytest.mark.asyncio
async def test_schema_repository_save_and_retrieve(db_session):
    repo = SchemaRepository(db_session)
    mock_meta = [
        TableMetadata(
            table_name="orders",
            table_type="table",
            schema_name=None,
            comment="Customer orders",
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
                    column_name="user_id",
                    data_type="INTEGER",
                    is_nullable=False,
                    is_primary_key=False,
                    is_foreign_key=True,
                    foreign_key_target="users.id",
                    default_value=None,
                    comment=None
                )
            ]
        )
    ]
    t_count, c_count = await repo.save_schema_metadata(connection_id=1, tables_metadata=mock_meta)
    assert t_count == 1
    assert c_count == 2

    tables = await repo.get_tables_by_connection(1)
    assert len(tables) == 1
    assert tables[0].table_name == "orders"
    assert len(tables[0].columns) == 2
    assert tables[0].columns[1].foreign_key_target == "users.id"


@pytest.mark.asyncio
async def test_schema_api_routes(async_client: AsyncClient, db_session):
    await async_client.post(
        "/api/v1/auth/register",
        json={"email": "schema_user@example.com", "password": "Password123!"}
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "schema_user@example.com", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = await async_client.post(
        "/api/v1/databases/",
        headers=headers,
        json={
            "name": "App Database",
            "db_type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "database_name": "app_db",
            "username": "user",
            "password": "pass"
        }
    )
    conn_id = create_res.json()["id"]

    repo = SchemaRepository(db_session)
    await repo.save_schema_metadata(
        connection_id=conn_id,
        tables_metadata=[
            TableMetadata(
                table_name="products",
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
                        column_name="name",
                        data_type="VARCHAR(100)",
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

    tree_res = await async_client.get(f"/api/v1/schema/{conn_id}", headers=headers)
    assert tree_res.status_code == 200
    tree_data = tree_res.json()
    assert len(tree_data) == 1
    assert tree_data[0]["table_name"] == "products"
    assert len(tree_data[0]["columns"]) == 2

    table_detail_res = await async_client.get(
        f"/api/v1/schema/{conn_id}/tables/products",
        headers=headers
    )
    assert table_detail_res.status_code == 200
    table_data = table_detail_res.json()
    assert table_data["table_name"] == "products"
    assert table_data["columns"][1]["column_name"] == "name"

    not_found_res = await async_client.get(
        f"/api/v1/schema/{conn_id}/tables/non_existent",
        headers=headers
    )
    assert not_found_res.status_code == 404
