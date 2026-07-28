from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.insight import InsightGenerateRequest, InsightGenerateResponse
from app.services.insight_service import InsightService

router = APIRouter()


def get_insight_service() -> InsightService:
    return InsightService()


@router.post("/generate", response_model=InsightGenerateResponse)
async def generate_insights(
    request: InsightGenerateRequest,
    current_user: User = Depends(get_current_active_user),
    service: InsightService = Depends(get_insight_service)
) -> InsightGenerateResponse:
    return await service.create_insights(request)
