import pytest
from httpx import AsyncClient
from app.agents.planner_agent import planner_agent
from app.repositories.schema_repository import SchemaRepository
from app.schemas.planner import QueryExecutionPlan
from app.services.schema_inspector import ColumnMetadata, TableMetadata


@pytest.mark.asyncio
async def test_planner_agent_fallback_and_rules():
    sample_context = """
## Table: users
Columns:
  - id: INTEGER [PRIMARY KEY]
  - email: VARCHAR(255)
## Table: orders
Columns:
  - id: INTEGER [PRIMARY KEY]
  - total_amount: DECIMAL(10,2) [SEMANTIC: METRIC]
"""
    plan = await planner_agent.generate_plan(
        user_query="Show total sales by order",
        schema_context=sample_context
    )
    assert isinstance(plan, QueryExecutionPlan)
    assert len(plan.target_tables) >= 1
    assert "SELECT" not in plan.intent_summary.upper()


@pytest.mark.asyncio
async def test_planner_api_endpoint(async_client: AsyncClient, db_session):
    await async_client.post(
        "/api/v1/auth/register",
        json={"email": "planner_user@example.com", "password": "Password123!"}
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "planner_user@example.com", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_res = await async_client.post(
        "/api/v1/databases/",
        headers=headers,
        json={
            "name": "Analytics DB",
            "db_type": "postgresql",
            "host": "localhost",
            "port": 5432,
            "database_name": "analytics",
            "username": "analytics_user",
            "password": "password"
        }
    )
    conn_id = create_res.json()["id"]

    schema_repo = SchemaRepository(db_session)
    await schema_repo.save_schema_metadata(
        connection_id=conn_id,
        tables_metadata=[
            TableMetadata(
                table_name="sales",
                table_type="table",
                schema_name=None,
                comment=None,
                columns=[
                    ColumnMetadata(
                        column_name="amount",
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

    plan_res = await async_client.post(
        "/api/v1/planner/plan",
        headers=headers,
        json={
            "connection_id": conn_id,
            "user_query": "What is the total sales amount?"
        }
    )
    assert plan_res.status_code == 200
    plan_data = plan_res.json()
    assert plan_data["connection_id"] == conn_id
    assert "plan" in plan_data
    assert len(plan_data["plan"]["target_tables"]) >= 1
