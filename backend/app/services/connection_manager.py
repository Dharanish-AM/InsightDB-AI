import time
from typing import Dict, Optional, Tuple
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from app.models.database_connection import DbType
from app.schemas.database_connection import TestConnectionRequest, TestConnectionResponse


class ConnectionManager:
    def __init__(self):
        self._engine_cache: Dict[int, AsyncEngine] = {}

    @staticmethod
    def build_connection_url(
        db_type: DbType | str,
        host: str,
        port: int,
        database_name: str,
        username: str,
        password: str
    ) -> str:
        db_type_str = db_type.value if isinstance(db_type, DbType) else str(db_type).lower()
        if db_type_str == DbType.POSTGRESQL.value:
            driver = "postgresql+asyncpg"
        elif db_type_str == DbType.MYSQL.value:
            driver = "mysql+aiomysql"
        else:
            driver = db_type_str
        return f"{driver}://{username}:{password}@{host}:{port}/{database_name}"

    async def get_engine_for_connection(
        self,
        connection_id: int,
        db_type: DbType,
        host: str,
        port: int,
        database_name: str,
        username: str,
        password: str
    ) -> AsyncEngine:
        if connection_id in self._engine_cache:
            return self._engine_cache[connection_id]

        url = self.build_connection_url(
            db_type=db_type,
            host=host,
            port=port,
            database_name=database_name,
            username=username,
            password=password
        )
        engine = create_async_engine(
            url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10
        )
        self._engine_cache[connection_id] = engine
        return engine

    async def test_connection_params(
        self,
        params: TestConnectionRequest
    ) -> TestConnectionResponse:
        url = self.build_connection_url(
            db_type=params.db_type,
            host=params.host,
            port=params.port,
            database_name=params.database_name,
            username=params.username,
            password=params.password
        )
        start_time = time.perf_counter()
        temp_engine: Optional[AsyncEngine] = None
        try:
            temp_engine = create_async_engine(url, pool_pre_ping=True)
            async with temp_engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            latency = (time.perf_counter() - start_time) * 1000.0
            return TestConnectionResponse(
                success=True,
                message="Successfully connected to database.",
                latency_ms=round(latency, 2)
            )
        except Exception as err:
            return TestConnectionResponse(
                success=False,
                message=f"Connection failed: {str(err)}",
                latency_ms=None
            )
        finally:
            if temp_engine:
                await temp_engine.dispose()

    async def remove_cached_engine(self, connection_id: int) -> None:
        if connection_id in self._engine_cache:
            engine = self._engine_cache.pop(connection_id)
            await engine.dispose()


connection_manager = ConnectionManager()
