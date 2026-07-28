from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database_connection import DatabaseConnection
from app.schemas.database_connection import DatabaseConnectionCreate, DatabaseConnectionUpdate


class ConnectionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, connection_id: int) -> Optional[DatabaseConnection]:
        result = await self.db.execute(
            select(DatabaseConnection).where(DatabaseConnection.id == connection_id)
        )
        return result.scalar_one_or_none()

    async def get_by_owner(self, owner_id: int) -> Sequence[DatabaseConnection]:
        result = await self.db.execute(
            select(DatabaseConnection).where(DatabaseConnection.owner_id == owner_id)
        )
        return result.scalars().all()

    async def create(
        self,
        connection_in: DatabaseConnectionCreate,
        owner_id: int,
        encrypted_password: str
    ) -> DatabaseConnection:
        db_conn = DatabaseConnection(
            name=connection_in.name,
            db_type=connection_in.db_type,
            host=connection_in.host,
            port=connection_in.port,
            database_name=connection_in.database_name,
            username=connection_in.username,
            encrypted_password=encrypted_password,
            ssl_mode=connection_in.ssl_mode,
            is_active=connection_in.is_active,
            owner_id=owner_id
        )
        self.db.add(db_conn)
        await self.db.commit()
        await self.db.refresh(db_conn)
        return db_conn

    async def update(
        self,
        connection: DatabaseConnection,
        connection_in: DatabaseConnectionUpdate,
        encrypted_password: Optional[str] = None
    ) -> DatabaseConnection:
        if connection_in.name is not None:
            connection.name = connection_in.name
        if connection_in.db_type is not None:
            connection.db_type = connection_in.db_type
        if connection_in.host is not None:
            connection.host = connection_in.host
        if connection_in.port is not None:
            connection.port = connection_in.port
        if connection_in.database_name is not None:
            connection.database_name = connection_in.database_name
        if connection_in.username is not None:
            connection.username = connection_in.username
        if connection_in.ssl_mode is not None:
            connection.ssl_mode = connection_in.ssl_mode
        if connection_in.is_active is not None:
            connection.is_active = connection_in.is_active
        if encrypted_password is not None:
            connection.encrypted_password = encrypted_password

        self.db.add(connection)
        await self.db.commit()
        await self.db.refresh(connection)
        return connection

    async def delete(self, connection: DatabaseConnection) -> None:
        await self.db.delete(connection)
        await self.db.commit()
