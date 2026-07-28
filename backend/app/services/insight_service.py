from app.agents.insight_agent import insight_agent
from app.schemas.insight import InsightGenerateRequest, InsightGenerateResponse


class InsightService:
    async def create_insights(
        self,
        request: InsightGenerateRequest
    ) -> InsightGenerateResponse:
        cols = request.columns
        if not cols and request.rows:
            cols = list(request.rows[0].keys())

        return await insight_agent.generate_insights(
            user_query=request.user_query,
            sql_query=request.sql_query,
            columns=cols,
            rows=request.rows
        )
