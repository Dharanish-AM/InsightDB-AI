from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.insight import InsightGenerateResponse
from app.schemas.planner import QueryExecutionPlan
from app.schemas.query_executor import QueryExecuteResponse


class PipelineAskRequest(BaseModel):
    connection_id: int
    user_query: str = Field(..., min_length=1)
    max_rows: Optional[int] = 1000
    timeout_seconds: Optional[float] = 15.0


class PipelineAskResponse(BaseModel):
    success: bool
    connection_id: int
    user_query: str
    plan: Optional[QueryExecutionPlan] = None
    sql_generated: Optional[str] = None
    sanitized_sql: Optional[str] = None
    query_results: Optional[QueryExecuteResponse] = None
    insights: Optional[InsightGenerateResponse] = None
    error: Optional[str] = None
