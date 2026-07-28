from fastapi import HTTPException, status
from app.agents.planner_agent import planner_agent
from app.repositories.connection_repository import ConnectionRepository
from app.schemas.planner import PlannerResponse
from app.services.metadata_service import MetadataService


class PlannerService:
    def __init__(
        self,
        metadata_service: MetadataService,
        connection_repo: ConnectionRepository
    ):
        self.metadata_service = metadata_service
        self.connection_repo = connection_repo

    async def create_query_plan(
        self,
        connection_id: int,
        user_query: str,
        owner_id: int
    ) -> PlannerResponse:
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

        context_res = await self.metadata_service.build_prompt_context(connection_id, owner_id)
        plan = await planner_agent.generate_plan(user_query, context_res.prompt_context)

        return PlannerResponse(
            connection_id=connection_id,
            user_query=user_query,
            plan=plan
        )
