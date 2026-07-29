from typing import Optional
from fastapi import HTTPException, status
from app.repositories.history_repository import HistoryRepository
from app.schemas.history import HistoryListResponse, HistoryStatsResponse, QueryHistoryResponse


class HistoryService:
    def __init__(self, history_repo: HistoryRepository):
        self.history_repo = history_repo

    async def get_history(
        self,
        user_id: int,
        connection_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 50
    ) -> HistoryListResponse:
        items, total = await self.history_repo.list_for_user(
            user_id=user_id,
            connection_id=connection_id,
            skip=skip,
            limit=limit
        )
        return HistoryListResponse(
            total=total,
            items=[QueryHistoryResponse.model_validate(item) for item in items]
        )

    async def get_history_detail(self, history_id: int, user_id: int) -> QueryHistoryResponse:
        item = await self.history_repo.get_by_id(history_id, user_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Query history item not found."
            )
        return QueryHistoryResponse.model_validate(item)

    async def delete_history_item(self, history_id: int, user_id: int) -> bool:
        deleted = await self.history_repo.delete(history_id, user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Query history item not found."
            )
        return True

    async def get_stats(self, user_id: int) -> HistoryStatsResponse:
        stats = await self.history_repo.get_user_stats(user_id)
        return HistoryStatsResponse(**stats)
