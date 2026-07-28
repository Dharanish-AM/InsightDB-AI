from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.repositories.connection_repository import ConnectionRepository
from app.schemas.query_executor import QueryExecuteRequest, QueryExecuteResponse
from app.services.query_executor_service import QueryExecutorService

router = APIRouter()


def get_query_executor_service(db: AsyncSession = Depends(get_db)) -> QueryExecutorService:
    conn_repo = ConnectionRepository(db)
    return QueryExecutorService(conn_repo)


@router.post("/execute", response_model=QueryExecuteResponse)
async def execute_query(
    request: QueryExecuteRequest,
    current_user: User = Depends(get_current_active_user),
    service: QueryExecutorService = Depends(get_query_executor_service)
) -> QueryExecuteResponse:
    return await service.execute_query(request, current_user.id)
