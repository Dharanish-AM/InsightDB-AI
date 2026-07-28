import json
import os
from pathlib import Path
from typing import Optional
from app.schemas.planner import (
    FilterConditionSpec,
    JoinPathSpec,
    MetricAggregationSpec,
    QueryExecutionPlan,
    SortCriterionSpec
)


class PlannerAgent:
    def __init__(self, prompt_path: Optional[str] = None):
        if prompt_path is None:
            base_dir = Path(__file__).resolve().parent.parent.parent
            prompt_path = os.path.join(base_dir, "prompts", "planner_v1.txt")

        with open(prompt_path, "r", encoding="utf-8") as f:
            self.prompt_template = f.read()

    def _fallback_plan(self, user_query: str, schema_context: str) -> QueryExecutionPlan:
        q_lower = user_query.lower()
        target_tables = []
        
        for line in schema_context.split("\n"):
            if line.startswith("## Table:"):
                t_name = line.split("## Table:")[1].split("(")[0].strip()
                if t_name.lower() in q_lower or not target_tables:
                    target_tables.append(t_name)

        if not target_tables:
            target_tables = ["default_table"]

        return QueryExecutionPlan(
            intent_summary=f"Query intent derived for: {user_query}",
            target_tables=target_tables[:2],
            join_paths=[],
            metrics=[
                MetricAggregationSpec(
                    expression="COUNT(*)",
                    alias="total_records",
                    aggregation_function="COUNT"
                )
            ],
            dimensions=[],
            filters=[],
            group_by=[],
            sort_by=[],
            limit=100
        )

    async def generate_plan(
        self,
        user_query: str,
        schema_context: str
    ) -> QueryExecutionPlan:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return self._fallback_plan(user_query, schema_context)

        try:
            import openai
            client = openai.AsyncOpenAI(api_key=api_key)
            formatted_prompt = self.prompt_template.format(
                schema_context=schema_context,
                user_query=user_query
            )
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "user", "content": formatted_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.0
            )
            content = response.choices[0].message.content
            data = json.loads(content)
            return QueryExecutionPlan.model_validate(data)
        except Exception:
            return self._fallback_plan(user_query, schema_context)


planner_agent = PlannerAgent()
