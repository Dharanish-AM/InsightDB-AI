from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.repositories.connection_repository import ConnectionRepository
from app.repositories.schema_repository import SchemaRepository
from app.schemas.schema_metadata import SchemaDetailResponse, SchemaSyncResponse
from app.services.schema_service import SchemaService

router = APIRouter()


def get_schema_service(db: AsyncSession = Depends(get_db)) -> SchemaService:
    schema_repo = SchemaRepository(db)
    connection_repo = ConnectionRepository(db)
    return SchemaService(schema_repo, connection_repo)


@router.post("/{connection_id}/sync", response_model=SchemaSyncResponse)
async def sync_schema(
    connection_id: int,
    current_user: User = Depends(get_current_active_user),
    service: SchemaService = Depends(get_schema_service)
) -> SchemaSyncResponse:
    return await service.sync_connection_schema(connection_id, current_user.id)


@router.get("/{connection_id}", response_model=List[SchemaDetailResponse])
async def get_schema_tree(
    connection_id: int,
    current_user: User = Depends(get_current_active_user),
    service: SchemaService = Depends(get_schema_service)
) -> List[SchemaDetailResponse]:
    return await service.get_schema_tree(connection_id, current_user.id)


@router.get("/{connection_id}/tables/{table_name}", response_model=SchemaDetailResponse)
async def get_table_detail(
    connection_id: int,
    table_name: str,
    current_user: User = Depends(get_current_active_user),
    service: SchemaService = Depends(get_schema_service)
) -> SchemaDetailResponse:
    return await service.get_table_detail(connection_id, table_name, current_user.id)
