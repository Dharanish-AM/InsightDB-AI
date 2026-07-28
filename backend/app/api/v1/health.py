from datetime import datetime, timezone
from fastapi import APIRouter, status
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter()


class HealthCheckResponse(BaseModel):
    status: str
    version: str
    environment: str
    timestamp: str


@router.get("/health", response_model=HealthCheckResponse, status_code=status.HTTP_200_OK)
async def health_check():
    return HealthCheckResponse(
        status="ok",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
