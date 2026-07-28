from typing import List
from fastapi import HTTPException, status
from app.core.encryption import decrypt_string, encrypt_string
from app.models.database_connection import DatabaseConnection
from app.repositories.connection_repository import ConnectionRepository
from app.schemas.database_connection import (
    DatabaseConnectionCreate,
    DatabaseConnectionResponse,
    DatabaseConnectionUpdate,
    TestConnectionRequest,
    TestConnectionResponse
)
from app.services.connection_manager import connection_manager


class DatabaseService:
    def __init__(self, connection_repo: ConnectionRepository):
        self.connection_repo = connection_repo

    async def create_connection(
        self,
        connection_in: DatabaseConnectionCreate,
        owner_id: int
    ) -> DatabaseConnectionResponse:
        encrypted_pass = encrypt_string(connection_in.password)
        conn = await self.connection_repo.create(
            connection_in=connection_in,
            owner_id=owner_id,
            encrypted_password=encrypted_pass
        )
        return DatabaseConnectionResponse.model_validate(conn)

    async def list_user_connections(
        self,
        owner_id: int
    ) -> List[DatabaseConnectionResponse]:
        connections = await self.connection_repo.get_by_owner(owner_id)
        return [DatabaseConnectionResponse.model_validate(c) for c in connections]

    async def get_connection_model(
        self,
        connection_id: int,
        owner_id: int
    ) -> DatabaseConnection:
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

    async def get_connection(
        self,
        connection_id: int,
        owner_id: int
    ) -> DatabaseConnectionResponse:
        conn = await self.get_connection_model(connection_id, owner_id)
        return DatabaseConnectionResponse.model_validate(conn)

    async def update_connection(
        self,
        connection_id: int,
        connection_in: DatabaseConnectionUpdate,
        owner_id: int
    ) -> DatabaseConnectionResponse:
        conn = await self.get_connection_model(connection_id, owner_id)
        encrypted_pass = None
        if connection_in.password:
            encrypted_pass = encrypt_string(connection_in.password)

        updated_conn = await self.connection_repo.update(
            connection=conn,
            connection_in=connection_in,
            encrypted_password=encrypted_pass
        )
        await connection_manager.remove_cached_engine(connection_id)
        return DatabaseConnectionResponse.model_validate(updated_conn)

    async def delete_connection(
        self,
        connection_id: int,
        owner_id: int
    ) -> None:
        conn = await self.get_connection_model(connection_id, owner_id)
        await self.connection_repo.delete(conn)
        await connection_manager.remove_cached_engine(connection_id)

    async def test_saved_connection(
        self,
        connection_id: int,
        owner_id: int
    ) -> TestConnectionResponse:
        conn = await self.get_connection_model(connection_id, owner_id)
        plain_pass = decrypt_string(conn.encrypted_password)
        test_request = TestConnectionRequest(
            db_type=conn.db_type,
            host=conn.host,
            port=conn.port,
            database_name=conn.database_name,
            username=conn.username,
            password=plain_pass,
            ssl_mode=conn.ssl_mode
        )
        return await connection_manager.test_connection_params(test_request)

    async def test_raw_connection(
        self,
        params: TestConnectionRequest
    ) -> TestConnectionResponse:
        return await connection_manager.test_connection_params(params)
