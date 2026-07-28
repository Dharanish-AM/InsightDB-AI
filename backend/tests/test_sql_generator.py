import pytest
from httpx import AsyncClient
from app.agents.sql_agent import sql_agent
from app.repositories.schema_repository import SchemaRepository
from app.schemas.planner import MetricAggregationSpec, QueryExecutionPlan
from app.services.schema_inspector import ColumnMetadata, TableMetadata


@pytest.mark.asyncio
async def test_sql_agent_postgresql_formatting():
    plan = QueryExecutionPlan(
        intent_summary="Count all orders",
        target_tables=["orders"],
        metrics=[MetricAggregationSpec(expression="COUNT(*)", alias="total_orders")],
        limit=50
    )
    res = await sql_agent.generate_sql(plan=plan, dialect="postgresql", connection_id=1)
    assert res.dialect == "postgresql"
    assert "orders" in res.sql
    assert "LIMIT 50" in res.sql


@pytest.mark.asyncio
async def test_sql_agent_mysql_formatting():
    plan = QueryExecutionPlan(
        intent_summary="Count all users",
        target_tables=["users"],
        metrics=[MetricAggregationSpec(expression="COUNT(*)", alias="total_users")],
        limit=10
    )
    res = await sql_agent.generate_sql(plan=plan, dialect="mysql", connection_id=1)
    assert res.dialect == "mysql"
    assert "`users`" in res.sql
    assert "LIMIT 10" in res.sql


@pytest.mark.asyncio
async def test_sql_generate_api_endpoint(async_client: AsyncClient, db_session):
    await async_client.post(
        "/api/v1/auth/register",
        json={"email": "sql_user@example.com", "password": "Password123!"}
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "sql_user@example.com", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = await async_client.post(
        "/api/v1/databases/",
        headers=headers,
        json={
            "name": "MySQL Sales DB",
            "db_type": "mysql",
            "host": "localhost",
            "port": 3306,
            "database_name": "sales_db",
            "username": "root",
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
                    )
                ]
            )
        ]
    )

    generate_res = await async_client.post(
        "/api/v1/sql/generate",
        headers=headers,
        json={
            "connection_id": conn_id,
            "user_query": "How many orders are there?"
        }
    )
    assert generate_res.status_code == 200
    sql_data = generate_res.json()
    assert sql_data["connection_id"] == conn_id
    assert sql_data["dialect"] == "mysql"
    assert "SELECT" in sql_data["sql"].upper()
