import pytest
from httpx import AsyncClient
from app.agents.insight_agent import insight_agent


@pytest.mark.asyncio
async def test_insight_agent_fallback():
    columns = ["region", "sales"]
    rows = [
        {"region": "North", "sales": 100},
        {"region": "South", "sales": 150},
        {"region": "East", "sales": 900}
    ]
    res = await insight_agent.generate_insights(
        user_query="Regional sales breakdown",
        sql_query="SELECT region, sales FROM regional_sales",
        columns=columns,
        rows=rows
    )
    assert "Regional sales breakdown" in res.summary
    assert len(res.key_takeaways) >= 1
    assert len(res.trends) >= 1
    assert len(res.anomalies) >= 1


@pytest.mark.asyncio
async def test_insight_agent_empty_rows():
    res = await insight_agent.generate_insights(
        user_query="Empty result query",
        sql_query="SELECT * FROM empty_table",
        columns=["id"],
        rows=[]
    )
    assert "zero records" in res.summary.lower()


@pytest.mark.asyncio
async def test_insight_api_endpoint(async_client: AsyncClient):
    await async_client.post(
        "/api/v1/auth/register",
        json={"email": "insight_user@example.com", "password": "Password123!"}
    )
    login_res = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "insight_user@example.com", "password": "Password123!"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    generate_res = await async_client.post(
        "/api/v1/insights/generate",
        headers=headers,
        json={
            "user_query": "Quarterly performance",
            "columns": ["quarter", "revenue"],
            "rows": [
                {"quarter": "Q1", "revenue": 50000},
                {"quarter": "Q2", "revenue": 75000}
            ]
        }
    )
    assert generate_res.status_code == 200
    data = generate_res.json()
    assert "summary" in data
    assert len(data["key_takeaways"]) > 0
