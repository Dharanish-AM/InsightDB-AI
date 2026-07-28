import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.core.config import settings
from app.schemas.insight import (
    AnomalyHighlight,
    InsightGenerateResponse,
    TrendHighlight
)


class InsightAgent:
    def __init__(self, prompt_path: Optional[str] = None):
        if prompt_path is None:
            base_dir = Path(__file__).resolve().parent.parent.parent
            prompt_path = os.path.join(base_dir, "prompts", "insight_v1.txt")

        with open(prompt_path, "r", encoding="utf-8") as f:
            self.prompt_template = f.read()

    def _fallback_insights(
        self,
        user_query: Optional[str],
        columns: List[str],
        rows: List[Dict[str, Any]]
    ) -> InsightGenerateResponse:
        row_count = len(rows)
        if row_count == 0:
            return InsightGenerateResponse(
                summary="The query returned zero records.",
                key_takeaways=["No records matched the specified filter criteria."],
                trends=[],
                anomalies=[],
                recommendations=["Verify table filter parameters or broaden search constraints."]
            )

        numeric_cols = []
        if rows:
            for k, v in rows[0].items():
                if isinstance(v, (int, float)) and not isinstance(v, bool):
                    numeric_cols.append(k)

        takeaways = [f"Dataset contains {row_count} records and {len(columns)} columns."]
        trends: List[TrendHighlight] = []
        anomalies: List[AnomalyHighlight] = []
        recommendations = ["Consider exporting results for detailed offline reporting."]

        if numeric_cols:
            num_col = numeric_cols[0]
            vals = [r[num_col] for r in rows if isinstance(r.get(num_col), (int, float))]
            if vals:
                avg_val = sum(vals) / len(vals)
                max_val = max(vals)
                min_val = min(vals)
                takeaways.append(f"Average value for '{num_col}' is {avg_val:.2f} (Range: {min_val} to {max_val}).")
                trends.append(
                    TrendHighlight(
                        title=f"{num_col.title()} Metric Overview",
                        description=f"Observed peak value of {max_val} and minimum of {min_val} across sample."
                    )
                )
                if max_val > (avg_val * 1.8) and len(vals) > 2:
                    anomalies.append(
                        AnomalyHighlight(
                            title=f"Outlier detected in '{num_col}'",
                            severity="medium",
                            description=f"Maximum value {max_val} significantly exceeds the group mean of {avg_val:.2f}."
                        )
                    )

        return InsightGenerateResponse(
            summary=f"Analysis of {row_count} query result records for request: '{user_query or 'Database Query'}'",
            key_takeaways=takeaways,
            trends=trends,
            anomalies=anomalies,
            recommendations=recommendations
        )

    async def generate_insights(
        self,
        user_query: Optional[str],
        sql_query: Optional[str],
        columns: List[str],
        rows: List[Dict[str, Any]]
    ) -> InsightGenerateResponse:
        api_key = os.getenv("OPENAI_API_KEY", settings.OPENAI_API_KEY)
        base_url = os.getenv("OPENAI_BASE_URL", settings.OPENAI_BASE_URL)
        model_name = os.getenv("LLM_MODEL_NAME", settings.LLM_MODEL_NAME)

        try:
            import openai
            client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
            rows_sample = json.dumps(rows[:100], indent=2, default=str)
            formatted_prompt = self.prompt_template.format(
                user_query=user_query or "N/A",
                sql_query=sql_query or "N/A",
                columns=", ".join(columns),
                rows_sample=rows_sample
            )
            response = await client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "user", "content": formatted_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            content = response.choices[0].message.content
            data = json.loads(content)
            return InsightGenerateResponse.model_validate(data)
        except Exception:
            return self._fallback_insights(user_query, columns, rows)


insight_agent = InsightAgent()
