from typing import Callable, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import PyJWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import decode_token
from app.database.session import get_db
from app.models.user import User, UserRole
from app.repositories.connection_repository import ConnectionRepository
from app.repositories.history_repository import HistoryRepository
from app.repositories.metadata_repository import MetadataRepository
from app.repositories.user_repository import UserRepository
from app.services.connection_manager import connection_manager
from app.services.history_service import HistoryService
from app.services.metadata_service import MetadataService
from app.services.pipeline_service import PipelineService
from app.services.query_executor_service import QueryExecutorService
from app.services.report_export_service import ReportExportService

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


async def get_user_repository(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(get_user_repository)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise credentials_exception
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (PyJWTError, ValueError):
        raise credentials_exception

    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def require_roles(allowed_roles: List[UserRole]) -> Callable:
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for your role"
            )
        return current_user
    return role_checker


async def get_history_repository(db: AsyncSession = Depends(get_db)) -> HistoryRepository:
    return HistoryRepository(db)


async def get_history_service(
    history_repo: HistoryRepository = Depends(get_history_repository)
) -> HistoryService:
    return HistoryService(history_repo)


def get_report_export_service() -> ReportExportService:
    return ReportExportService()


async def get_pipeline_service(
    db: AsyncSession = Depends(get_db)
) -> PipelineService:
    connection_repo = ConnectionRepository(db)
    metadata_repo = MetadataRepository(db)
    history_repo = HistoryRepository(db)
    metadata_service = MetadataService(db, metadata_repo, connection_repo)
    query_executor_service = QueryExecutorService(connection_repo)
    return PipelineService(connection_repo, metadata_service, query_executor_service, history_repo)
