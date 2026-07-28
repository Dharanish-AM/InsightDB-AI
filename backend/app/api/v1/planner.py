from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.repositories.connection_repository import ConnectionRepository
from app.repositories.metadata_repository import MetadataRepository
from app.schemas.planner import PlannerRequest, PlannerResponse
from app.services.metadata_service import MetadataService
from app.services.planner_service import PlannerService

router = APIRouter()


def get_planner_service(db: AsyncSession = Depends(get_db)) -> PlannerService:
    meta_repo = MetadataRepository(db)
    conn_repo = ConnectionRepository(db)
    meta_service = MetadataService(db, meta_repo, conn_repo)
    return PlannerService(meta_service, conn_repo)


@router.post("/plan", response_model=PlannerResponse)
async def generate_plan(
    request: PlannerRequest,
    current_user: User = Depends(get_current_active_user),
    service: PlannerService = Depends(get_planner_service)
) -> PlannerResponse:
    return await service.create_query_plan(
        connection_id=request.connection_id,
        user_query=request.user_query,
        owner_id=current_user.id
    )
