from typing import List, Optional
from pydantic import BaseModel, Field


class SqlValidateRequest(BaseModel):
    connection_id: int
    sql: str = Field(..., min_length=1)
    max_rows: Optional[int] = 1000


class SqlValidateResponse(BaseModel):
    is_valid: bool
    connection_id: int
    sanitized_sql: Optional[str] = None
    violations: List[str] = []
    statement_type: Optional[str] = None
