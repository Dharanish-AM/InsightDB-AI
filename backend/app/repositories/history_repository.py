from typing import List, Optional, Tuple
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.query_history import QueryHistory


class HistoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        user_id: int,
        connection_id: int,
        user_query: str,
        generated_sql: Optional[str] = None,
        sanitized_sql: Optional[str] = None,
        status: str = "success",
        row_count: int = 0,
        execution_time_ms: float = 0.0,
        error: Optional[str] = None,
        insights_json: Optional[str] = None
    ) -> QueryHistory:
        item = QueryHistory(
            user_id=user_id,
            connection_id=connection_id,
            user_query=user_query,
            generated_sql=generated_sql,
            sanitized_sql=sanitized_sql,
            status=status,
            row_count=row_count,
            execution_time_ms=execution_time_ms,
            error=error,
            insights_json=insights_json
        )
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def get_by_id(self, history_id: int, user_id: int) -> Optional[QueryHistory]:
        stmt = select(QueryHistory).where(
            QueryHistory.id == history_id,
            QueryHistory.user_id == user_id
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: int,
        connection_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[QueryHistory], int]:
        stmt = select(QueryHistory).where(QueryHistory.user_id == user_id)
        count_stmt = select(func.count(QueryHistory.id)).where(QueryHistory.user_id == user_id)

        if connection_id:
            stmt = stmt.where(QueryHistory.connection_id == connection_id)
            count_stmt = count_stmt.where(QueryHistory.connection_id == connection_id)

        stmt = stmt.order_by(QueryHistory.created_at.desc()).offset(skip).limit(limit)

        total_res = await self.session.execute(count_stmt)
        total = total_res.scalar_one()

        items_res = await self.session.execute(stmt)
        items = list(items_res.scalars().all())

        return items, total

    async def delete(self, history_id: int, user_id: int) -> bool:
        item = await self.get_by_id(history_id, user_id)
        if not item:
            return False
        await self.session.delete(item)
        await self.session.commit()
        return True

    async def get_user_stats(self, user_id: int) -> dict:
        stmt = select(
            func.count(QueryHistory.id).label("total"),
            func.sum(case((QueryHistory.status == "success", 1), else_=0)).label("success_count"),
            func.sum(case((QueryHistory.status == "failed", 1), else_=0)).label("failed_count"),
            func.avg(QueryHistory.execution_time_ms).label("avg_time"),
            func.sum(QueryHistory.row_count).label("total_rows")
        ).where(QueryHistory.user_id == user_id)

        res = await self.session.execute(stmt)
        row = res.one()

        total = row[0] or 0
        success_count = row[1] or 0
        failed_count = row[2] or 0
        avg_time = float(row[3] or 0.0)
        total_rows = row[4] or 0

        success_rate = (success_count / total * 100.0) if total > 0 else 0.0

        return {
            "total_queries": total,
            "successful_queries": success_count,
            "failed_queries": failed_count,
            "success_rate_percentage": round(success_rate, 2),
            "average_execution_time_ms": round(avg_time, 2),
            "total_rows_fetched": total_rows
        }
