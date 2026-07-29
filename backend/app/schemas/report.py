from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ReportExportRequest(BaseModel):
    format: str = Field(..., description="Export format: csv, json, or markdown")
    filename: Optional[str] = Field("insight_report", description="Base filename for download")
    columns: List[str] = Field(default_factory=list, description="Column header list")
    rows: List[Dict[str, Any]] = Field(default_factory=list, description="Data row list")
    user_query: Optional[str] = Field(None, description="Natural language query description")
    summary: Optional[str] = Field(None, description="Executive summary insight text")


class ReportExportResponse(BaseModel):
    filename: str
    format: str
    content_type: str
    content: str
