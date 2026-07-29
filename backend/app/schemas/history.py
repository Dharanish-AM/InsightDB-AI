from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class QueryHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    connection_id: int
    user_query: str
    generated_sql: Optional[str] = None
    sanitized_sql: Optional[str] = None
    status: str
    row_count: int
    execution_time_ms: float
    error: Optional[str] = None
    insights_json: Optional[str] = None
    created_at: datetime


class HistoryListResponse(BaseModel):
    total: int
    items: List[QueryHistoryResponse]


class HistoryStatsResponse(BaseModel):
    total_queries: int
    successful_queries: int
    failed_queries: int
    success_rate_percentage: float
    average_execution_time_ms: float
    total_rows_fetched: int
