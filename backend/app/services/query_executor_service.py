import asyncio
import time
from typing import Any, Dict, List
from fastapi import HTTPException, status
from sqlalchemy import text
from app.agents.validator_agent import validator_agent
from app.core.encryption import decrypt_string
from app.repositories.connection_repository import ConnectionRepository
from app.schemas.query_executor import (
    ColumnHeader,
    QueryExecuteRequest,
    QueryExecuteResponse
)
from app.services.connection_manager import connection_manager


class QueryExecutorService:
    def __init__(self, connection_repo: ConnectionRepository):
        self.connection_repo = connection_repo

    async def execute_query(
        self,
        request: QueryExecuteRequest,
        owner_id: int
    ) -> QueryExecuteResponse:
        conn = await self.connection_repo.get_by_id(request.connection_id)
        if not conn:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Database connection not found."
            )
        if conn.owner_id != owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden."
            )

        dialect_str = conn.db_type.value if hasattr(conn.db_type, "value") else str(conn.db_type)
        validation_res = validator_agent.validate_sql(
            sql=request.sql,
            dialect=dialect_str,
            connection_id=conn.id,
            max_rows=request.max_rows or 1000
        )

        if not validation_res.is_valid:
            return QueryExecuteResponse(
                success=False,
                connection_id=conn.id,
                columns=[],
                rows=[],
                row_count=0,
                execution_time_ms=0.0,
                sanitized_sql=None,
                error="; ".join(validation_res.violations)
            )

        sanitized_sql = validation_res.sanitized_sql
        plain_password = decrypt_string(conn.encrypted_password)

        try:
            engine = await connection_manager.get_engine_for_connection(
                connection_id=conn.id,
                db_type=conn.db_type,
                host=conn.host,
                port=conn.port,
                database_name=conn.database_name,
                username=conn.username,
                password=plain_password
            )

            start_time = time.perf_counter()

            async def _run_query():
                async with engine.connect() as db_conn:
                    result = await db_conn.execute(text(sanitized_sql))
                    keys = list(result.keys()) if result.returns_rows else []
                    rows_raw = result.fetchall() if result.returns_rows else []
                    return keys, rows_raw

            timeout_sec = request.timeout_seconds or 15.0
            keys, rows_raw = await asyncio.wait_for(_run_query(), timeout=timeout_sec)
            latency_ms = (time.perf_counter() - start_time) * 1000.0

            columns = [ColumnHeader(name=k) for k in keys]
            formatted_rows: List[Dict[str, Any]] = [
                {k: (str(v) if not isinstance(v, (int, float, bool, type(None))) else v) for k, v in zip(keys, row)}
                for row in rows_raw
            ]

            return QueryExecuteResponse(
                success=True,
                connection_id=conn.id,
                columns=columns,
                rows=formatted_rows,
                row_count=len(formatted_rows),
                execution_time_ms=round(latency_ms, 2),
                sanitized_sql=sanitized_sql,
                error=None
            )

        except asyncio.TimeoutError:
            return QueryExecuteResponse(
                success=False,
                connection_id=conn.id,
                columns=[],
                rows=[],
                row_count=0,
                execution_time_ms=0.0,
                sanitized_sql=sanitized_sql,
                error=f"Query execution timed out after {request.timeout_seconds} seconds."
            )
        except Exception as err:
            return QueryExecuteResponse(
                success=False,
                connection_id=conn.id,
                columns=[],
                rows=[],
                row_count=0,
                execution_time_ms=0.0,
                sanitized_sql=sanitized_sql,
                error=f"Query execution error: {str(err)}"
            )
