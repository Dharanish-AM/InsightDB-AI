import csv
import io
import json
from app.schemas.report import ReportExportRequest, ReportExportResponse


class ReportExportService:
    def export(self, request: ReportExportRequest) -> ReportExportResponse:
        fmt = request.format.lower().strip()
        filename_base = request.filename or "insight_report"

        if fmt == "csv":
            content, content_type, ext = self._generate_csv(request)
        elif fmt == "markdown":
            content, content_type, ext = self._generate_markdown(request)
        else:  # default to json
            content, content_type, ext = self._generate_json(request)

        filename = f"{filename_base}.{ext}" if not filename_base.endswith(f".{ext}") else filename_base

        return ReportExportResponse(
            filename=filename,
            format=fmt,
            content_type=content_type,
            content=content
        )

    def _generate_csv(self, request: ReportExportRequest):
        output = io.StringIO()
        columns = request.columns
        if not columns and request.rows:
            columns = list(request.rows[0].keys())

        writer = csv.DictWriter(output, fieldnames=columns)
        writer.writeheader()
        for row in request.rows:
            writer.writerow(row)

        return output.getvalue(), "text/csv", "csv"

    def _generate_json(self, request: ReportExportRequest):
        data = {
            "query": request.user_query,
            "summary": request.summary,
            "columns": request.columns,
            "total_rows": len(request.rows),
            "rows": request.rows
        }
        return json.dumps(data, indent=2, default=str), "application/json", "json"

    def _generate_markdown(self, request: ReportExportRequest):
        lines = []
        if request.user_query:
            lines.append(f"# Insight Report: {request.user_query}\n")
        else:
            lines.append("# InsightDB AI Data Report\n")

        if request.summary:
            lines.append("## Executive Summary\n")
            lines.append(f"{request.summary}\n")

        lines.append("## Data Table\n")
        columns = request.columns
        if not columns and request.rows:
            columns = list(request.rows[0].keys())

        if columns:
            lines.append("| " + " | ".join(str(c) for c in columns) + " |")
            lines.append("| " + " | ".join(["---"] * len(columns)) + " |")
            for row in request.rows:
                row_str = "| " + " | ".join(str(row.get(c, "")) for c in columns) + " |"
                lines.append(row_str)

        lines.append(f"\n*Total rows: {len(request.rows)}*")

        return "\n".join(lines), "text/markdown", "md"
