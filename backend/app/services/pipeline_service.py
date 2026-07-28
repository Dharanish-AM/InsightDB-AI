from fastapi import HTTPException, status
from app.agents.insight_agent import insight_agent
from app.agents.planner_agent import planner_agent
from app.agents.sql_agent import sql_agent
from app.repositories.connection_repository import ConnectionRepository
from app.schemas.pipeline import PipelineAskRequest, PipelineAskResponse
from app.schemas.query_executor import QueryExecuteRequest
from app.services.metadata_service import MetadataService
from app.services.query_executor_service import QueryExecutorService


class PipelineService:
    def __init__(
        self,
        connection_repo: ConnectionRepository,
        metadata_service: MetadataService,
        query_executor_service: QueryExecutorService
    ):
        self.connection_repo = connection_repo
        self.metadata_service = metadata_service
        self.query_executor_service = query_executor_service

    async def run_pipeline(
        self,
        request: PipelineAskRequest,
        owner_id: int
    ) -> PipelineAskResponse:
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

        context_res = await self.metadata_service.build_prompt_context(conn.id, owner_id)
        schema_context = context_res.prompt_context
        dialect_str = conn.db_type.value if hasattr(conn.db_type, "value") else str(conn.db_type)

        try:
            plan = await planner_agent.create_plan(
                user_query=request.user_query,
                schema_context=schema_context
            )
        except Exception as err:
            return PipelineAskResponse(
                success=False,
                connection_id=conn.id,
                user_query=request.user_query,
                error=f"Planner Agent failure: {str(err)}"
            )

        try:
            sql_res = await sql_agent.generate_sql(
                plan=plan,
                dialect=dialect_str,
                connection_id=conn.id
            )
            raw_sql = sql_res.sql
        except Exception as err:
            return PipelineAskResponse(
                success=False,
                connection_id=conn.id,
                user_query=request.user_query,
                plan=plan,
                error=f"SQL Generator failure: {str(err)}"
            )

        exec_req = QueryExecuteRequest(
            connection_id=conn.id,
            sql=raw_sql,
            max_rows=request.max_rows or 1000,
            timeout_seconds=request.timeout_seconds or 15.0
        )
        query_res = await self.query_executor_service.execute_query(exec_req, owner_id)

        if not query_res.success:
            return PipelineAskResponse(
                success=False,
                connection_id=conn.id,
                user_query=request.user_query,
                plan=plan,
                sql_generated=raw_sql,
                sanitized_sql=query_res.sanitized_sql,
                query_results=query_res,
                error=f"Query Execution / Validation failed: {query_res.error}"
            )

        col_names = [c.name for c in query_res.columns]
        insights = await insight_agent.generate_insights(
            user_query=request.user_query,
            sql_query=query_res.sanitized_sql,
            columns=col_names,
            rows=query_res.rows
        )

        return PipelineAskResponse(
            success=True,
            connection_id=conn.id,
            user_query=request.user_query,
            plan=plan,
            sql_generated=raw_sql,
            sanitized_sql=query_res.sanitized_sql,
            query_results=query_res,
            insights=insights,
            error=None
        )
