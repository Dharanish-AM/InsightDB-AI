from typing import List, Optional, Sequence, Tuple
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.schema_metadata import SchemaColumn, SchemaTable
from app.services.schema_inspector import TableMetadata


class SchemaRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_tables_by_connection(self, connection_id: int) -> Sequence[SchemaTable]:
        result = await self.db.execute(
            select(SchemaTable)
            .where(SchemaTable.connection_id == connection_id)
            .options(selectinload(SchemaTable.columns))
            .order_by(SchemaTable.table_name)
        )
        return result.scalars().all()

    async def get_table_by_name(self, connection_id: int, table_name: str) -> Optional[SchemaTable]:
        result = await self.db.execute(
            select(SchemaTable)
            .where(
                SchemaTable.connection_id == connection_id,
                SchemaTable.table_name == table_name
            )
            .options(selectinload(SchemaTable.columns))
        )
        return result.scalar_one_or_none()

    async def clear_schema(self, connection_id: int) -> None:
        await self.db.execute(
            delete(SchemaTable).where(SchemaTable.connection_id == connection_id)
        )
        await self.db.commit()

    async def save_schema_metadata(
        self,
        connection_id: int,
        tables_metadata: List[TableMetadata]
    ) -> Tuple[int, int]:
        await self.clear_schema(connection_id)

        total_tables = len(tables_metadata)
        total_columns = 0

        for t_meta in tables_metadata:
            table_entry = SchemaTable(
                connection_id=connection_id,
                table_name=t_meta.table_name,
                table_type=t_meta.table_type,
                schema_name=t_meta.schema_name,
                comment=t_meta.comment
            )
            self.db.add(table_entry)
            await self.db.flush()

            for c_meta in t_meta.columns:
                col_entry = SchemaColumn(
                    table_id=table_entry.id,
                    column_name=c_meta.column_name,
                    data_type=c_meta.data_type,
                    is_nullable=c_meta.is_nullable,
                    is_primary_key=c_meta.is_primary_key,
                    is_foreign_key=c_meta.is_foreign_key,
                    foreign_key_target=c_meta.foreign_key_target,
                    default_value=c_meta.default_value,
                    comment=c_meta.comment
                )
                self.db.add(col_entry)
                total_columns += 1

        await self.db.commit()
        return total_tables, total_columns
