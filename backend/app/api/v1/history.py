from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.api.deps import get_current_active_user, get_history_service
from app.models.user import User
from app.schemas.history import HistoryListResponse, HistoryStatsResponse, QueryHistoryResponse
from app.services.history_service import HistoryService

router = APIRouter()


@router.get("", response_model=HistoryListResponse)
async def list_history(
    connection_id: Optional[int] = Query(None, description="Filter by connection ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_active_user),
    history_service: HistoryService = Depends(get_history_service)
):
    return await history_service.get_history(
        user_id=current_user.id,
        connection_id=connection_id,
        skip=skip,
        limit=limit
    )


@router.get("/stats", response_model=HistoryStatsResponse)
async def get_history_stats(
    current_user: User = Depends(get_current_active_user),
    history_service: HistoryService = Depends(get_history_service)
):
    return await history_service.get_stats(current_user.id)


@router.get("/{history_id}", response_model=QueryHistoryResponse)
async def get_history_detail(
    history_id: int,
    current_user: User = Depends(get_current_active_user),
    history_service: HistoryService = Depends(get_history_service)
):
    return await history_service.get_history_detail(history_id, current_user.id)


@router.delete("/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history_item(
    history_id: int,
    current_user: User = Depends(get_current_active_user),
    history_service: HistoryService = Depends(get_history_service)
):
    await history_service.delete_history_item(history_id, current_user.id)
    return None
