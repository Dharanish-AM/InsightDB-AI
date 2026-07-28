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
    # InsightDB's own operational tables are not part of the customer's data
    # catalog. Keeping them out of this API also avoids disclosing connection
    # infrastructure and credential-field names to the browser.
    INTERNAL_TABLES = {
        "database_connections", "schema_tables", "schema_columns",
        "column_annotations", "table_annotations", "users",
        "business_metadata",
    }
    SENSITIVE_COLUMN_TOKENS = (
        "password", "passwd", "secret", "token", "api_key", "apikey",
        "private_key", "access_key", "credential", "authorization",
    )
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
            business_tables = [
                table for table in tables_metadata
                if not self._is_internal_table(table.table_name)
            ]
            business_columns_count = sum(
                sum(
                    not self._is_sensitive_column(column.column_name)
                    for column in table.columns
                )
                for table in business_tables
            )
            return SchemaSyncResponse(
                success=True,
                connection_id=conn.id,
                tables_synced=tables_count,
                columns_synced=columns_count,
                business_tables_synced=len(business_tables),
                business_columns_synced=business_columns_count,
                message=(
                    f"Inspected {tables_count} tables and {columns_count} columns; "
                    f"{len(business_tables)} business tables and {business_columns_count} "
                    "safe columns are available in the catalog."
                )
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
        return [self._safe_table_response(t) for t in tables if not self._is_internal_table(t.table_name)]

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
        if self._is_internal_table(table.table_name):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' is not available in the data catalog."
            )
        return self._safe_table_response(table)

    @classmethod
    def _is_internal_table(cls, table_name: str) -> bool:
        return table_name.lower() in cls.INTERNAL_TABLES

    @classmethod
    def _is_sensitive_column(cls, column_name: str) -> bool:
        normalized = column_name.lower().replace("-", "_").replace(" ", "_")
        return any(token in normalized for token in cls.SENSITIVE_COLUMN_TOKENS)

    @classmethod
    def _safe_table_response(cls, table) -> SchemaDetailResponse:
        response = SchemaDetailResponse.model_validate(table)
        response.columns = [
            column for column in response.columns
            if not cls._is_sensitive_column(column.column_name)
        ]
        return response
