from typing import List
from fastapi import HTTPException, status
from app.core.encryption import decrypt_string
from app.repositories.connection_repository import ConnectionRepository
from app.repositories.schema_repository import SchemaRepository
from app.schemas.schema_metadata import (
    SchemaDetailResponse,
    SchemaSyncResponse
)
from app.services.connection_manager import connection_manager
from app.services.schema_inspector import schema_inspector_service


class SchemaService:
    def __init__(
        self,
        schema_repo: SchemaRepository,
        connection_repo: ConnectionRepository
    ):
        self.schema_repo = schema_repo
        self.connection_repo = connection_repo

    async def _verify_connection_owner(self, connection_id: int, owner_id: int):
        conn = await self.connection_repo.get_by_id(connection_id)
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
        return conn

    async def sync_connection_schema(
        self,
        connection_id: int,
        owner_id: int
    ) -> SchemaSyncResponse:
        conn = await self._verify_connection_owner(connection_id, owner_id)
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
            tables_metadata = await schema_inspector_service.inspect_engine(engine)
            tables_count, columns_count = await self.schema_repo.save_schema_metadata(
                connection_id=conn.id,
                tables_metadata=tables_metadata
            )
            return SchemaSyncResponse(
                success=True,
                connection_id=conn.id,
                tables_synced=tables_count,
                columns_synced=columns_count,
                message=f"Successfully synchronized schema with {tables_count} tables and {columns_count} columns."
            )
        except Exception as err:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to extract schema: {str(err)}"
            )

    async def get_schema_tree(
        self,
        connection_id: int,
        owner_id: int
    ) -> List[SchemaDetailResponse]:
        await self._verify_connection_owner(connection_id, owner_id)
        tables = await self.schema_repo.get_tables_by_connection(connection_id)
        return [SchemaDetailResponse.model_validate(t) for t in tables]

    async def get_table_detail(
        self,
        connection_id: int,
        table_name: str,
        owner_id: int
    ) -> SchemaDetailResponse:
        await self._verify_connection_owner(connection_id, owner_id)
        table = await self.schema_repo.get_table_by_name(connection_id, table_name)
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found in schema metadata."
            )
        return SchemaDetailResponse.model_validate(table)
