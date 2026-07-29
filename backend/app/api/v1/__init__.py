from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.database import router as db_router
from app.api.v1.health import router as health_router
from app.api.v1.history import router as history_router
from app.api.v1.insight import router as insight_router
from app.api.v1.metadata import router as metadata_router
from app.api.v1.pipeline import router as pipeline_router
from app.api.v1.planner import router as planner_router
from app.api.v1.query import router as query_router
from app.api.v1.report import router as report_router
from app.api.v1.schema import router as schema_router
from app.api.v1.sql import router as sql_router
from app.api.v1.validator import router as validator_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(db_router, prefix="/databases", tags=["Database Connectors"])
api_router.include_router(schema_router, prefix="/schema", tags=["Schema Discovery"])
api_router.include_router(metadata_router, prefix="/metadata", tags=["Metadata Store"])
api_router.include_router(planner_router, prefix="/planner", tags=["Planner Agent"])
api_router.include_router(sql_router, prefix="/sql", tags=["SQL Generator"])
api_router.include_router(validator_router, prefix="/sql", tags=["SQL Validator"])
api_router.include_router(query_router, prefix="/query", tags=["Query Executor"])
api_router.include_router(insight_router, prefix="/insights", tags=["Insight Generator"])
api_router.include_router(pipeline_router, prefix="/pipeline", tags=["Pipeline Orchestrator"])
api_router.include_router(history_router, prefix="/history", tags=["Query History"])
api_router.include_router(report_router, prefix="/reports", tags=["Reports & Export"])
