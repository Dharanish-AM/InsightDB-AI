from dataclasses import dataclass
from typing import List, Optional
from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncEngine


@dataclass
class ColumnMetadata:
    column_name: str
    data_type: str
    is_nullable: bool
    is_primary_key: bool
    is_foreign_key: bool
    foreign_key_target: Optional[str]
    default_value: Optional[str]
    comment: Optional[str]


@dataclass
class TableMetadata:
    table_name: str
    table_type: str
    schema_name: Optional[str]
    comment: Optional[str]
    columns: List[ColumnMetadata]


class SchemaInspectorService:
    @staticmethod
    def _inspect_sync(conn) -> List[TableMetadata]:
        inspector = inspect(conn)
        tables_metadata: List[TableMetadata] = []

        table_names = inspector.get_table_names()
        view_names = inspector.get_view_names()

        all_entries = [(t, "table") for t in table_names] + [(v, "view") for v in view_names]

        for name, t_type in all_entries:
            pk_constraint = inspector.get_pk_constraint(name)
            pk_cols = set(pk_constraint.get("constrained_columns", [])) if pk_constraint else set()

            fk_constraints = inspector.get_foreign_keys(name)
            fk_map = {}
            for fk in fk_constraints:
                constrained = fk.get("constrained_columns", [])
                referred_table = fk.get("referred_table")
                referred_cols = fk.get("referred_columns", [])
                for idx, col in enumerate(constrained):
                    target_col = referred_cols[idx] if idx < len(referred_cols) else ""
                    fk_map[col] = f"{referred_table}.{target_col}"

            columns_info = inspector.get_columns(name)
            col_metadatas: List[ColumnMetadata] = []

            for col in columns_info:
                col_name = col["name"]
                data_type_str = str(col["type"])
                is_nullable = bool(col.get("nullable", True))
                is_pk = col_name in pk_cols
                is_fk = col_name in fk_map
                fk_target = fk_map.get(col_name)
                default_val = str(col.get("default")) if col.get("default") is not None else None
                comment = col.get("comment")

                col_metadatas.append(
                    ColumnMetadata(
                        column_name=col_name,
                        data_type=data_type_str,
                        is_nullable=is_nullable,
                        is_primary_key=is_pk,
                        is_foreign_key=is_fk,
                        foreign_key_target=fk_target,
                        default_value=default_val,
                        comment=comment
                    )
                )

            tables_metadata.append(
                TableMetadata(
                    table_name=name,
                    table_type=t_type,
                    schema_name=None,
                    comment=None,
                    columns=col_metadatas
                )
            )

        return tables_metadata

    async def inspect_engine(self, engine: AsyncEngine) -> List[TableMetadata]:
        async with engine.connect() as conn:
            return await conn.run_sync(self._inspect_sync)


schema_inspector_service = SchemaInspectorService()
