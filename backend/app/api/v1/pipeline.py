from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.repositories.connection_repository import ConnectionRepository
from app.repositories.metadata_repository import MetadataRepository
from app.schemas.pipeline import PipelineAskRequest, PipelineAskResponse
from app.services.metadata_service import MetadataService
from app.services.pipeline_service import PipelineService
from app.services.query_executor_service import QueryExecutorService

router = APIRouter()


def get_pipeline_service(db: AsyncSession = Depends(get_db)) -> PipelineService:
    conn_repo = ConnectionRepository(db)
    meta_repo = MetadataRepository(db)
    meta_service = MetadataService(db, meta_repo, conn_repo)
    exec_service = QueryExecutorService(conn_repo)
    return PipelineService(conn_repo, meta_service, exec_service)


@router.post("/ask", response_model=PipelineAskResponse)
async def ask_pipeline(
    request: PipelineAskRequest,
    current_user: User = Depends(get_current_active_user),
    service: PipelineService = Depends(get_pipeline_service)
) -> PipelineAskResponse:
    return await service.run_pipeline(request, current_user.id)
