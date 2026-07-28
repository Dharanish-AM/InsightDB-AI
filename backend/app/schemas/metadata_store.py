from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class TableAnnotationUpdate(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
    aliases: Optional[List[str]] = None
    domain: Optional[str] = None


class TableAnnotationResponse(BaseModel):
    id: int
    table_id: int
    business_name: Optional[str] = None
    description: Optional[str] = None
    aliases: List[str] = []
    domain: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ColumnAnnotationUpdate(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
    aliases: Optional[List[str]] = None
    semantic_type: Optional[str] = None
    sample_values: Optional[List[str]] = None


class ColumnAnnotationResponse(BaseModel):
    id: int
    column_id: int
    business_name: Optional[str] = None
    description: Optional[str] = None
    aliases: List[str] = []
    semantic_type: Optional[str] = None
    sample_values: List[str] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MetadataSearchResultItem(BaseModel):
    type: str
    target_id: int
    table_name: str
    column_name: Optional[str] = None
    match_score: float
    business_name: Optional[str] = None
    description: Optional[str] = None
    aliases: List[str] = []


class MetadataSearchResult(BaseModel):
    query: str
    total_matches: int
    results: List[MetadataSearchResultItem]


class SchemaContextResponse(BaseModel):
    connection_id: int
    prompt_context: str
