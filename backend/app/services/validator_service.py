from fastapi import HTTPException, status
from app.agents.validator_agent import validator_agent
from app.repositories.connection_repository import ConnectionRepository
from app.schemas.sql_validator import SqlValidateRequest, SqlValidateResponse


class ValidatorService:
    def __init__(self, connection_repo: ConnectionRepository):
        self.connection_repo = connection_repo

    async def validate_query(
        self,
        request: SqlValidateRequest,
        owner_id: int
    ) -> SqlValidateResponse:
        conn = await self.connection_repo.get_by_id(request.connection_id)
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

        dialect_str = conn.db_type.value if hasattr(conn.db_type, "value") else str(conn.db_type)
        return validator_agent.validate_sql(
            sql=request.sql,
            dialect=dialect_str,
            connection_id=conn.id,
            max_rows=request.max_rows or 1000
        )
