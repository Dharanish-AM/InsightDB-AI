from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user, get_report_export_service
from app.models.user import User
from app.schemas.report import ReportExportRequest, ReportExportResponse
from app.services.report_export_service import ReportExportService

router = APIRouter()


@router.post("/export", response_model=ReportExportResponse)
async def export_report(
    request: ReportExportRequest,
    current_user: User = Depends(get_current_active_user),
    export_service: ReportExportService = Depends(get_report_export_service)
):
    return export_service.export(request)
