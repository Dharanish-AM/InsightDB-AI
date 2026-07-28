from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class SchemaColumnResponse(BaseModel):
    id: int
    column_name: str
    data_type: str
    is_nullable: bool
    is_primary_key: bool
    is_foreign_key: bool
    foreign_key_target: Optional[str] = None
    default_value: Optional[str] = None
    comment: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SchemaTableResponse(BaseModel):
    id: int
    connection_id: int
    table_name: str
    table_type: str
    schema_name: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SchemaDetailResponse(SchemaTableResponse):
    columns: List[SchemaColumnResponse] = []


class SchemaSyncResponse(BaseModel):
    success: bool
    connection_id: int
    tables_synced: int
    columns_synced: int
    business_tables_synced: int
    business_columns_synced: int
    message: str
