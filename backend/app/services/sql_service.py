from fastapi import HTTPException, status
from app.agents.planner_agent import planner_agent
from app.agents.sql_agent import sql_agent
from app.repositories.connection_repository import ConnectionRepository
from app.schemas.sql_generator import SqlGenerateRequest, SqlGenerateResponse
from app.services.metadata_service import MetadataService


class SqlService:
    def __init__(
        self,
        metadata_service: MetadataService,
        connection_repo: ConnectionRepository
    ):
        self.metadata_service = metadata_service
        self.connection_repo = connection_repo

    async def generate_sql_for_request(
        self,
        request: SqlGenerateRequest,
        owner_id: int
    ) -> SqlGenerateResponse:
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

        plan = request.plan
        if not plan:
            if not request.user_query:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Either user_query or plan must be provided."
                )
            context_res = await self.metadata_service.build_prompt_context(conn.id, owner_id)
            plan = await planner_agent.generate_plan(request.user_query, context_res.prompt_context)

        dialect_str = conn.db_type.value if hasattr(conn.db_type, "value") else str(conn.db_type)
        return await sql_agent.generate_sql(
            plan=plan,
            dialect=dialect_str,
            connection_id=conn.id
        )
