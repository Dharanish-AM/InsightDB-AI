from typing import Any, List, Optional
from sqlalchemy import ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, backref, mapped_column, relationship
from app.database.base import Base, TimestampMixin


class TableAnnotation(Base, TimestampMixin):
    __tablename__ = "table_annotations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    table_id: Mapped[int] = mapped_column(Integer, ForeignKey("schema_tables.id", ondelete="CASCADE"), unique=True, nullable=False)
    business_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    aliases: Mapped[Optional[List[Any]]] = mapped_column(JSON, default=list, nullable=True)
    domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    table = relationship("SchemaTable", backref=backref("annotation", uselist=False))


class ColumnAnnotation(Base, TimestampMixin):
    __tablename__ = "column_annotations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    column_id: Mapped[int] = mapped_column(Integer, ForeignKey("schema_columns.id", ondelete="CASCADE"), unique=True, nullable=False)
    business_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    aliases: Mapped[Optional[List[Any]]] = mapped_column(JSON, default=list, nullable=True)
    semantic_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    sample_values: Mapped[Optional[List[Any]]] = mapped_column(JSON, default=list, nullable=True)

    column = relationship("SchemaColumn", backref=backref("annotation", uselist=False))
