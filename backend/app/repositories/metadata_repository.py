from typing import List, Optional
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.business_metadata import ColumnAnnotation, TableAnnotation
from app.models.schema_metadata import SchemaColumn, SchemaTable
from app.schemas.metadata_store import ColumnAnnotationUpdate, TableAnnotationUpdate


class MetadataRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_table_annotation(self, table_id: int) -> Optional[TableAnnotation]:
        result = await self.db.execute(
            select(TableAnnotation).where(TableAnnotation.table_id == table_id)
        )
        return result.scalar_one_or_none()

    async def upsert_table_annotation(
        self,
        table_id: int,
        annotation_in: TableAnnotationUpdate
    ) -> TableAnnotation:
        annotation = await self.get_table_annotation(table_id)
        if not annotation:
            annotation = TableAnnotation(table_id=table_id)
            self.db.add(annotation)

        if annotation_in.business_name is not None:
            annotation.business_name = annotation_in.business_name
        if annotation_in.description is not None:
            annotation.description = annotation_in.description
        if annotation_in.aliases is not None:
            annotation.aliases = annotation_in.aliases
        if annotation_in.domain is not None:
            annotation.domain = annotation_in.domain

        await self.db.commit()
        await self.db.refresh(annotation)
        return annotation

    async def get_column_annotation(self, column_id: int) -> Optional[ColumnAnnotation]:
        result = await self.db.execute(
            select(ColumnAnnotation).where(ColumnAnnotation.column_id == column_id)
        )
        return result.scalar_one_or_none()

    async def upsert_column_annotation(
        self,
        column_id: int,
        annotation_in: ColumnAnnotationUpdate
    ) -> ColumnAnnotation:
        annotation = await self.get_column_annotation(column_id)
        if not annotation:
            annotation = ColumnAnnotation(column_id=column_id)
            self.db.add(annotation)

        if annotation_in.business_name is not None:
            annotation.business_name = annotation_in.business_name
        if annotation_in.description is not None:
            annotation.description = annotation_in.description
        if annotation_in.aliases is not None:
            annotation.aliases = annotation_in.aliases
        if annotation_in.semantic_type is not None:
            annotation.semantic_type = annotation_in.semantic_type
        if annotation_in.sample_values is not None:
            annotation.sample_values = annotation_in.sample_values

        await self.db.commit()
        await self.db.refresh(annotation)
        return annotation

    async def get_annotated_schema(self, connection_id: int) -> List[SchemaTable]:
        result = await self.db.execute(
            select(SchemaTable)
            .where(SchemaTable.connection_id == connection_id)
            .options(
                selectinload(SchemaTable.annotation),
                selectinload(SchemaTable.columns).selectinload(SchemaColumn.annotation)
            )
            .order_by(SchemaTable.table_name)
        )
        return list(result.scalars().all())
