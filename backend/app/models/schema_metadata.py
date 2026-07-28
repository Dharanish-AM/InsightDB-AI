from typing import List, Optional
from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin


class SchemaTable(Base, TimestampMixin):
    __tablename__ = "schema_tables"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    connection_id: Mapped[int] = mapped_column(Integer, ForeignKey("database_connections.id", ondelete="CASCADE"), nullable=False)
    table_name: Mapped[str] = mapped_column(String(255), nullable=False)
    table_type: Mapped[str] = mapped_column(String(50), default="table", nullable=False)
    schema_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    columns: Mapped[List["SchemaColumn"]] = relationship(
        "SchemaColumn",
        back_populates="table",
        cascade="all, delete-orphan",
        order_by="SchemaColumn.id"
    )
    connection = relationship("DatabaseConnection", backref="tables")


class SchemaColumn(Base, TimestampMixin):
    __tablename__ = "schema_columns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    table_id: Mapped[int] = mapped_column(Integer, ForeignKey("schema_tables.id", ondelete="CASCADE"), nullable=False)
    column_name: Mapped[str] = mapped_column(String(255), nullable=False)
    data_type: Mapped[str] = mapped_column(String(255), nullable=False)
    is_nullable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_primary_key: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_foreign_key: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    foreign_key_target: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    default_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    table: Mapped["SchemaTable"] = relationship("SchemaTable", back_populates="columns")
