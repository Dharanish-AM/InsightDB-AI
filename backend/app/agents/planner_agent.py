import json
import os
import re
from pathlib import Path
from typing import Dict, Optional, Set
from app.core.config import settings
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

        # Listing requests should return rows, rather than an arbitrary count.  This
        # is also the safe fallback when an LLM plan mentions schema fields that do
        # not exist in the synced connection metadata.
        is_listing_request = any(
            phrase in q_lower
            for phrase in ("show", "list", "display", "get all", "retrieve all")
        )
        is_aggregate_request = any(
            phrase in q_lower
            for phrase in ("how many", "count", "total", "average", "sum")
        )

        return QueryExecutionPlan(
            intent_summary=f"Query intent derived for: {user_query}",
            target_tables=target_tables[:2],
            join_paths=[],
            metrics=[] if is_listing_request and not is_aggregate_request else [
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
            limit=1000
        )

    @staticmethod
    def _schema_columns(schema_context: str) -> Dict[str, Set[str]]:
        """Parse the compact prompt context into table-to-column lookup data."""
        tables: Dict[str, Set[str]] = {}
        current_table: Optional[str] = None
        for line in schema_context.splitlines():
            table_match = re.match(r"^## Table:\s*([^\s(]+)", line)
            if table_match:
                current_table = table_match.group(1)
                tables[current_table] = set()
                continue
            column_match = re.match(r"^\s*-\s*([^:\s]+):", line)
            if current_table and column_match:
                tables[current_table].add(column_match.group(1))
        return tables

    @classmethod
    def _plan_matches_schema(cls, plan: QueryExecutionPlan, schema_context: str) -> bool:
        """Reject LLM plans that reference tables or fields absent from metadata."""
        tables = cls._schema_columns(schema_context)
        if not tables or any(table not in tables for table in plan.target_tables):
            return False

        selected_tables = set(plan.target_tables)
        selected_tables.update(join.target_table for join in plan.join_paths)
        if any(table not in tables for table in selected_tables):
            return False

        def has_column(reference: str) -> bool:
            # Aliases (for example, a COUNT alias in ORDER BY) are not schema
            # columns and are intentionally handled by the caller.
            parts = reference.split(".")
            if len(parts) == 2:
                return parts[0] in tables and parts[1] in tables[parts[0]]
            return any(reference in tables[table] for table in selected_tables)

        for filter_spec in plan.filters:
            if not has_column(filter_spec.column):
                return False
        for column in [*plan.dimensions, *plan.group_by]:
            if not has_column(column):
                return False
        metric_aliases = {metric.alias for metric in plan.metrics}
        for sort in plan.sort_by:
            if sort.column not in metric_aliases and not has_column(sort.column):
                return False
        return True

    async def create_plan(
        self,
        user_query: str,
        schema_context: str
    ) -> QueryExecutionPlan:
        api_key = os.getenv("OPENAI_API_KEY", settings.OPENAI_API_KEY)
        base_url = os.getenv("OPENAI_BASE_URL", settings.OPENAI_BASE_URL)
        model_name = os.getenv("LLM_MODEL_NAME", settings.LLM_MODEL_NAME)

        if not api_key:
            return self._fallback_plan(user_query, schema_context)

        try:
            import openai
            client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
            formatted_prompt = self.prompt_template.format(
                schema_context=schema_context,
                user_query=user_query
            )
            response = await client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "user", "content": formatted_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.0
            )
            content = response.choices[0].message.content
            data = json.loads(content)
            plan = QueryExecutionPlan.model_validate(data)
            if self._plan_matches_schema(plan, schema_context):
                return plan
            return self._fallback_plan(user_query, schema_context)
        except Exception:
            return self._fallback_plan(user_query, schema_context)

    generate_plan = create_plan


planner_agent = PlannerAgent()
