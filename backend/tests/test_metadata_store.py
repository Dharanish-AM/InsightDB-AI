import pytest
from httpx import AsyncClient
from app.repositories.schema_repository import SchemaRepository
from app.services.schema_inspector import ColumnMetadata, TableMetadata


@pytest.mark.asyncio
async def test_metadata_annotations_search_and_context(async_client: AsyncClient, db_session):
    await async_client.post(
        "/api/v1/auth/register",
        json={"email": "meta_owner@example.com", "password": "Password123!"}
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "meta_owner@example.com", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = await async_client.post(
        "/api/v1/databases/",
        headers=headers,
        json={
            "name": "ECommerce DB",
            "db_type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "database_name": "ecommerce",
            "username": "admin",
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
                        column_name="total_amount",
                        data_type="DECIMAL(10,2)",
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

    tables = await schema_repo.get_tables_by_connection(conn_id)
    table_id = tables[0].id
    column_id = tables[0].columns[1].id

    table_annot_res = await async_client.put(
        f"/api/v1/metadata/tables/{table_id}",
        headers=headers,
        json={
            "business_name": "Customer Transactions",
            "description": "Contains completed customer purchasing orders.",
            "aliases": ["purchases", "sales"],
            "domain": "finance"
        }
    )
    assert table_annot_res.status_code == 200
    assert table_annot_res.json()["business_name"] == "Customer Transactions"

    col_annot_res = await async_client.put(
        f"/api/v1/metadata/columns/{column_id}",
        headers=headers,
        json={
            "business_name": "Order Revenue",
            "description": "Total monetary value of order.",
            "aliases": ["revenue", "price"],
            "semantic_type": "metric"
        }
    )
    assert col_annot_res.status_code == 200
    assert col_annot_res.json()["semantic_type"] == "metric"

    search_res = await async_client.get(
        f"/api/v1/metadata/search?connection_id={conn_id}&query=revenue",
        headers=headers
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total_matches"] >= 1
    assert search_data["results"][0]["column_name"] == "total_amount"

    context_res = await async_client.get(
        f"/api/v1/metadata/context/{conn_id}",
        headers=headers
    )
    assert context_res.status_code == 200
    prompt_context = context_res.json()["prompt_context"]
    assert "Customer Transactions" in prompt_context
    assert "SEMANTIC: METRIC" in prompt_context
