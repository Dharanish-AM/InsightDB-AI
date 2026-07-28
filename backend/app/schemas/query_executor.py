from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ColumnHeader(BaseModel):
    name: str
    data_type: str = "string"


class QueryExecuteRequest(BaseModel):
    connection_id: int
    sql: str = Field(..., min_length=1)
    max_rows: Optional[int] = 1000
    timeout_seconds: Optional[float] = 15.0


class QueryExecuteResponse(BaseModel):
    success: bool
    connection_id: int
    columns: List[ColumnHeader] = []
    rows: List[Dict[str, Any]] = []
    row_count: int = 0
    execution_time_ms: float = 0.0
    sanitized_sql: Optional[str] = None
    error: Optional[str] = None
