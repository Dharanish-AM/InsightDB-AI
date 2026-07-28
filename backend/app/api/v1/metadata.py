from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.repositories.connection_repository import ConnectionRepository
from app.repositories.metadata_repository import MetadataRepository
from app.schemas.metadata_store import (
    ColumnAnnotationResponse,
    ColumnAnnotationUpdate,
    MetadataSearchResult,
    SchemaContextResponse,
    TableAnnotationResponse,
    TableAnnotationUpdate
)
from app.services.metadata_service import MetadataService

router = APIRouter()


def get_metadata_service(db: AsyncSession = Depends(get_db)) -> MetadataService:
    meta_repo = MetadataRepository(db)
    conn_repo = ConnectionRepository(db)
    return MetadataService(db, meta_repo, conn_repo)


@router.put("/tables/{table_id}", response_model=TableAnnotationResponse)
async def update_table_annotation(
    table_id: int,
    annotation_in: TableAnnotationUpdate,
    current_user: User = Depends(get_current_active_user),
    service: MetadataService = Depends(get_metadata_service)
) -> TableAnnotationResponse:
    return await service.update_table_annotation(table_id, annotation_in, current_user.id)


@router.put("/columns/{column_id}", response_model=ColumnAnnotationResponse)
async def update_column_annotation(
    column_id: int,
    annotation_in: ColumnAnnotationUpdate,
    current_user: User = Depends(get_current_active_user),
    service: MetadataService = Depends(get_metadata_service)
) -> ColumnAnnotationResponse:
    return await service.update_column_annotation(column_id, annotation_in, current_user.id)


@router.get("/search", response_model=MetadataSearchResult)
async def search_metadata(
    connection_id: int = Query(..., ge=1),
    query: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_active_user),
    service: MetadataService = Depends(get_metadata_service)
) -> MetadataSearchResult:
    return await service.search_metadata(connection_id, query, current_user.id)


@router.get("/context/{connection_id}", response_model=SchemaContextResponse)
async def get_prompt_context(
    connection_id: int,
    current_user: User = Depends(get_current_active_user),
    service: MetadataService = Depends(get_metadata_service)
) -> SchemaContextResponse:
    return await service.build_prompt_context(connection_id, current_user.id)
