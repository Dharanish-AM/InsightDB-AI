from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TrendHighlight(BaseModel):
    title: str
    description: str


class AnomalyHighlight(BaseModel):
    title: str
    severity: str = "medium"
    description: str


class InsightGenerateRequest(BaseModel):
    user_query: Optional[str] = None
    sql_query: Optional[str] = None
    columns: List[str] = []
    rows: List[Dict[str, Any]] = Field(..., min_length=0)


class InsightGenerateResponse(BaseModel):
    summary: str
    key_takeaways: List[str] = []
    trends: List[TrendHighlight] = []
    anomalies: List[AnomalyHighlight] = []
    recommendations: List[str] = []
