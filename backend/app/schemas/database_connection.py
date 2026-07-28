from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.database_connection import DbType


class DatabaseConnectionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    db_type: DbType
    host: str = Field(..., min_length=1, max_length=255)
    port: int = Field(..., ge=1, le=65535)
    database_name: str = Field(..., min_length=1, max_length=255)
    username: str = Field(..., min_length=1, max_length=255)
    ssl_mode: Optional[str] = "prefer"
    is_active: bool = True


class DatabaseConnectionCreate(DatabaseConnectionBase):
    password: str = Field(..., min_length=1)


class DatabaseConnectionUpdate(BaseModel):
    name: Optional[str] = None
    db_type: Optional[DbType] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssl_mode: Optional[str] = None
    is_active: Optional[bool] = None


class DatabaseConnectionResponse(DatabaseConnectionBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TestConnectionRequest(BaseModel):
    db_type: DbType
    host: str
    port: int
    database_name: str
    username: str
    password: str
    ssl_mode: Optional[str] = "prefer"


class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    latency_ms: Optional[float] = None
