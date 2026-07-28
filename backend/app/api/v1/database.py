from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.repositories.connection_repository import ConnectionRepository
from app.schemas.database_connection import (
    DatabaseConnectionCreate,
    DatabaseConnectionResponse,
    DatabaseConnectionUpdate,
    TestConnectionRequest,
    TestConnectionResponse
)
from app.services.database_service import DatabaseService

router = APIRouter()


def get_database_service(db: AsyncSession = Depends(get_db)) -> DatabaseService:
    repo = ConnectionRepository(db)
    return DatabaseService(repo)


@router.post("/", response_model=DatabaseConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_connection(
    connection_in: DatabaseConnectionCreate,
    current_user: User = Depends(get_current_active_user),
    service: DatabaseService = Depends(get_database_service)
) -> DatabaseConnectionResponse:
    return await service.create_connection(connection_in, current_user.id)


@router.get("/", response_model=List[DatabaseConnectionResponse])
async def list_connections(
    current_user: User = Depends(get_current_active_user),
    service: DatabaseService = Depends(get_database_service)
) -> List[DatabaseConnectionResponse]:
    return await service.list_user_connections(current_user.id)


@router.get("/{connection_id}", response_model=DatabaseConnectionResponse)
async def get_connection(
    connection_id: int,
    current_user: User = Depends(get_current_active_user),
    service: DatabaseService = Depends(get_database_service)
) -> DatabaseConnectionResponse:
    return await service.get_connection(connection_id, current_user.id)


@router.put("/{connection_id}", response_model=DatabaseConnectionResponse)
async def update_connection(
    connection_id: int,
    connection_in: DatabaseConnectionUpdate,
    current_user: User = Depends(get_current_active_user),
    service: DatabaseService = Depends(get_database_service)
) -> DatabaseConnectionResponse:
    return await service.update_connection(connection_id, connection_in, current_user.id)


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(
    connection_id: int,
    current_user: User = Depends(get_current_active_user),
    service: DatabaseService = Depends(get_database_service)
) -> None:
    await service.delete_connection(connection_id, current_user.id)


@router.post("/test-connection", response_model=TestConnectionResponse)
async def test_connection_raw(
    params: TestConnectionRequest,
    current_user: User = Depends(get_current_active_user),
    service: DatabaseService = Depends(get_database_service)
) -> TestConnectionResponse:
    return await service.test_raw_connection(params)


@router.post("/{connection_id}/test", response_model=TestConnectionResponse)
async def test_connection_saved(
    connection_id: int,
    current_user: User = Depends(get_current_active_user),
    service: DatabaseService = Depends(get_database_service)
) -> TestConnectionResponse:
    return await service.test_saved_connection(connection_id, current_user.id)
