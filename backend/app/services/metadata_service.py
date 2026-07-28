from typing import List
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schema_metadata import SchemaColumn, SchemaTable
from app.repositories.connection_repository import ConnectionRepository
from app.repositories.metadata_repository import MetadataRepository
from app.schemas.metadata_store import (
    ColumnAnnotationResponse,
    ColumnAnnotationUpdate,
    MetadataSearchResult,
    MetadataSearchResultItem,
    SchemaContextResponse,
    TableAnnotationResponse,
    TableAnnotationUpdate
)


class MetadataService:
    def __init__(
        self,
        db: AsyncSession,
        metadata_repo: MetadataRepository,
        connection_repo: ConnectionRepository
    ):
        self.db = db
        self.metadata_repo = metadata_repo
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

    async def update_table_annotation(
        self,
        table_id: int,
        annotation_in: TableAnnotationUpdate,
        owner_id: int
    ) -> TableAnnotationResponse:
        res = await self.db.execute(select(SchemaTable).where(SchemaTable.id == table_id))
        table = res.scalar_one_or_none()
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found."
            )
        await self._verify_connection_owner(table.connection_id, owner_id)

        annotation = await self.metadata_repo.upsert_table_annotation(table_id, annotation_in)
        return TableAnnotationResponse.model_validate(annotation)

    async def update_column_annotation(
        self,
        column_id: int,
        annotation_in: ColumnAnnotationUpdate,
        owner_id: int
    ) -> ColumnAnnotationResponse:
        res = await self.db.execute(
            select(SchemaColumn, SchemaTable.connection_id)
            .join(SchemaTable, SchemaColumn.table_id == SchemaTable.id)
            .where(SchemaColumn.id == column_id)
        )
        row = res.first()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Column not found."
            )
        col, connection_id = row
        await self._verify_connection_owner(connection_id, owner_id)

        annotation = await self.metadata_repo.upsert_column_annotation(column_id, annotation_in)
        return ColumnAnnotationResponse.model_validate(annotation)

    async def search_metadata(
        self,
        connection_id: int,
        query: str,
        owner_id: int
    ) -> MetadataSearchResult:
        await self._verify_connection_owner(connection_id, owner_id)
        q_lower = query.lower().strip()
        tables = await self.metadata_repo.get_annotated_schema(connection_id)

        results: List[MetadataSearchResultItem] = []

        for t in tables:
            t_name = t.table_name.lower()
            t_bname = (t.annotation.business_name if t.annotation and t.annotation.business_name else "").lower()
            t_desc = (t.annotation.description if t.annotation and t.annotation.description else "").lower()
            t_aliases = [a.lower() for a in (t.annotation.aliases if t.annotation and t.annotation.aliases else [])]

            if q_lower in t_name or q_lower in t_bname or q_lower in t_desc or any(q_lower in a for a in t_aliases):
                results.append(
                    MetadataSearchResultItem(
                        type="table",
                        target_id=t.id,
                        table_name=t.table_name,
                        column_name=None,
                        match_score=1.0 if q_lower in t_name else 0.8,
                        business_name=t.annotation.business_name if t.annotation else None,
                        description=t.annotation.description if t.annotation else None,
                        aliases=t.annotation.aliases if t.annotation and t.annotation.aliases else []
                    )
                )

            for c in t.columns:
                c_name = c.column_name.lower()
                c_bname = (c.annotation.business_name if c.annotation and c.annotation.business_name else "").lower()
                c_desc = (c.annotation.description if c.annotation and c.annotation.description else "").lower()
                c_aliases = [a.lower() for a in (c.annotation.aliases if c.annotation and c.annotation.aliases else [])]

                if q_lower in c_name or q_lower in c_bname or q_lower in c_desc or any(q_lower in a for a in c_aliases):
                    results.append(
                        MetadataSearchResultItem(
                            type="column",
                            target_id=c.id,
                            table_name=t.table_name,
                            column_name=c.column_name,
                            match_score=1.0 if q_lower in c_name else 0.8,
                            business_name=c.annotation.business_name if c.annotation else None,
                            description=c.annotation.description if c.annotation else None,
                            aliases=c.annotation.aliases if c.annotation and c.annotation.aliases else []
                        )
                    )

        return MetadataSearchResult(
            query=query,
            total_matches=len(results),
            results=results
        )

    async def build_prompt_context(
        self,
        connection_id: int,
        owner_id: int
    ) -> SchemaContextResponse:
        await self._verify_connection_owner(connection_id, owner_id)
        tables = await self.metadata_repo.get_annotated_schema(connection_id)

        lines: List[str] = ["# Database Schema Context", ""]

        for t in tables:
            title = f"Table: {t.table_name}"
            if t.annotation and t.annotation.business_name:
                title += f" ({t.annotation.business_name})"
            lines.append(f"## {title}")
            if t.annotation and t.annotation.description:
                lines.append(f"Description: {t.annotation.description}")
            if t.annotation and t.annotation.aliases:
                lines.append(f"Aliases: {', '.join(t.annotation.aliases)}")

            lines.append("Columns:")
            for c in t.columns:
                col_str = f"  - {c.column_name}: {c.data_type}"
                flags = []
                if c.is_primary_key:
                    flags.append("PRIMARY KEY")
                if c.is_foreign_key and c.foreign_key_target:
                    flags.append(f"FOREIGN KEY -> {c.foreign_key_target}")
                if c.annotation and c.annotation.semantic_type:
                    flags.append(f"SEMANTIC: {c.annotation.semantic_type.upper()}")
                if flags:
                    col_str += f" [{', '.join(flags)}]"
                if c.annotation and c.annotation.business_name:
                    col_str += f" | {c.annotation.business_name}"
                lines.append(col_str)

            lines.append("")

        return SchemaContextResponse(
            connection_id=connection_id,
            prompt_context="\n".join(lines).strip()
        )
