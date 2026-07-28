from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.repositories.connection_repository import ConnectionRepository
from app.repositories.metadata_repository import MetadataRepository
from app.schemas.sql_generator import SqlGenerateRequest, SqlGenerateResponse
from app.services.metadata_service import MetadataService
from app.services.sql_service import SqlService

router = APIRouter()


def get_sql_service(db: AsyncSession = Depends(get_db)) -> SqlService:
    meta_repo = MetadataRepository(db)
    conn_repo = ConnectionRepository(db)
    meta_service = MetadataService(db, meta_repo, conn_repo)
    return SqlService(meta_service, conn_repo)


@router.post("/generate", response_model=SqlGenerateResponse)
async def generate_sql(
    request: SqlGenerateRequest,
    current_user: User = Depends(get_current_active_user),
    service: SqlService = Depends(get_sql_service)
) -> SqlGenerateResponse:
    return await service.generate_sql_for_request(request, current_user.id)
