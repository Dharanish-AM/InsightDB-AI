import pytest
from app.schemas.report import ReportExportRequest
from app.services.report_export_service import ReportExportService


def test_csv_export():
    service = ReportExportService()
    req = ReportExportRequest(
        format="csv",
        filename="users_report",
        columns=["id", "name", "email"],
        rows=[
            {"id": 1, "name": "Alice", "email": "alice@example.com"},
            {"id": 2, "name": "Bob", "email": "bob@example.com"}
        ],
        user_query="List all active users"
    )
    resp = service.export(req)
    assert resp.filename == "users_report.csv"
    assert resp.content_type == "text/csv"
    assert "id,name,email" in resp.content
    assert "Alice,alice@example.com" in resp.content


def test_markdown_export():
    service = ReportExportService()
    req = ReportExportRequest(
        format="markdown",
        filename="sales_summary",
        columns=["region", "revenue"],
        rows=[
            {"region": "North America", "revenue": 150000},
            {"region": "Europe", "revenue": 120000}
        ],
        user_query="Total revenue by region",
        summary="North America generated highest revenue."
    )
    resp = service.export(req)
    assert resp.filename == "sales_summary.md"
    assert resp.content_type == "text/markdown"
    assert "# Insight Report: Total revenue by region" in resp.content
    assert "| region | revenue |" in resp.content
    assert "| North America | 150000 |" in resp.content


def test_json_export():
    service = ReportExportService()
    req = ReportExportRequest(
        format="json",
        filename="raw_data",
        columns=["category", "total"],
        rows=[{"category": "Electronics", "total": 450}],
        user_query="Electronics sales"
    )
    resp = service.export(req)
    assert resp.filename == "raw_data.json"
    assert resp.content_type == "application/json"
    assert '"Electronics"' in resp.content
