from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.planner import QueryExecutionPlan


class SqlGenerateRequest(BaseModel):
    connection_id: int
    user_query: Optional[str] = None
    plan: Optional[QueryExecutionPlan] = None


class SqlGenerateResponse(BaseModel):
    connection_id: int
    sql: str
    dialect: str
    explanation: str
    tables_used: List[str] = []
