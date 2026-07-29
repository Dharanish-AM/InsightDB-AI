import pytest
from httpx import AsyncClient
from app.agents.planner_agent import planner_agent
from app.repositories.schema_repository import SchemaRepository
from app.schemas.planner import FilterConditionSpec, QueryExecutionPlan
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


def test_planner_rejects_hallucinated_column_and_falls_back_to_listing():
    schema_context = """# Database Schema Context

## Table: database_connections
Columns:
  - id: INTEGER [PRIMARY KEY]
  - name: VARCHAR
  - is_active: BOOLEAN
"""
    invalid_plan = QueryExecutionPlan(
        intent_summary="List active connections",
        target_tables=["database_connections"],
        filters=[FilterConditionSpec(column="connection_status", operator="=", value="active")],
    )

    assert not planner_agent._plan_matches_schema(invalid_plan, schema_context)

    fallback = planner_agent._fallback_plan("Show all database connections", schema_context)
    assert fallback.target_tables == ["database_connections"]
    assert fallback.filters == []
    assert fallback.metrics == []
    assert fallback.limit == 1000


def test_planner_fallback_sorting_and_limits():
    schema_context = """# Database Schema Context

## Table: parking_locations
Columns:
  - id: INTEGER [PRIMARY KEY]
  - name: VARCHAR
## Table: parking_reservations
Columns:
  - id: INTEGER [PRIMARY KEY]
  - location_id: INTEGER [FOREIGN KEY -> parking_locations.id]
  - total_amount: DECIMAL(10,2) [SEMANTIC: METRIC]
"""
    plan1 = planner_agent._fallback_plan("Show lowest revenue location", schema_context)
    assert plan1.limit == 1
    assert len(plan1.sort_by) == 1
    assert plan1.sort_by[0].column == "total_revenue"
    assert plan1.sort_by[0].direction == "ASC"

    plan2 = planner_agent._fallback_plan("top 5 locations by revenue", schema_context)
    assert plan2.limit == 5
    assert len(plan2.sort_by) == 1
    assert plan2.sort_by[0].column == "total_revenue"
    assert plan2.sort_by[0].direction == "DESC"

    plan3 = planner_agent._fallback_plan("show all locations", schema_context)
    assert plan3.limit == 1000


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
