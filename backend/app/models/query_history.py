from datetime import datetime
from typing import Optional
from sqlalchemy import Float, ForeignKey, Integer, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin


class QueryHistory(Base, TimestampMixin):
    __tablename__ = "query_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    connection_id: Mapped[int] = mapped_column(Integer, ForeignKey("database_connections.id", ondelete="CASCADE"), nullable=False, index=True)
    
    user_query: Mapped[str] = mapped_column(Text, nullable=False)
    generated_sql: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sanitized_sql: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="success")  # "success" or "failed"
    row_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    execution_time_ms: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    insights_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user = relationship("User", backref="query_histories")
    connection = relationship("DatabaseConnection", backref="query_histories")
