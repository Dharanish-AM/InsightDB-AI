from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.repositories.connection_repository import ConnectionRepository
from app.schemas.sql_validator import SqlValidateRequest, SqlValidateResponse
from app.services.validator_service import ValidatorService

router = APIRouter()


def get_validator_service(db: AsyncSession = Depends(get_db)) -> ValidatorService:
    conn_repo = ConnectionRepository(db)
    return ValidatorService(conn_repo)


@router.post("/validate", response_model=SqlValidateResponse)
async def validate_sql(
    request: SqlValidateRequest,
    current_user: User = Depends(get_current_active_user),
    service: ValidatorService = Depends(get_validator_service)
) -> SqlValidateResponse:
    return await service.validate_query(request, current_user.id)
