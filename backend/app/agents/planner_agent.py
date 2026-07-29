import json
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Set
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

    def _fallback_plan(self, user_query: str, schema_context: str) -> QueryExecutionPlan:
        q_lower = user_query.lower()
        tables_map = self._schema_columns(schema_context)
        all_tables = list(tables_map.keys())

        if not all_tables:
            return QueryExecutionPlan(
                intent_summary=f"Query intent derived for: {user_query}",
                target_tables=["default_table"],
                join_paths=[],
                metrics=[MetricAggregationSpec(expression="COUNT(*)", alias="total_records", aggregation_function="COUNT")],
                dimensions=[],
                filters=[],
                group_by=[],
                sort_by=[],
                limit=1000
            )

        # 1. Identify primary entity and intent keywords
        has_revenue_intent = any(word in q_lower for word in ("revenue", "amount", "sales", "earnings", "income", "total paid", "spent"))
        has_count_intent = any(word in q_lower for word in ("count", "how many", "number of", "total drivers", "total vehicles", "total spots", "total reservations"))
        has_location_intent = any(word in q_lower for word in ("location", "garage", "lot", "deck", "hub", "facility"))

        # Find best matching primary table
        primary_table = None
        for t_name in all_tables:
            t_normalized = t_name.lower().replace("_", " ").rstrip("s")
            words = t_normalized.split()
            if any(w in q_lower for w in words):
                primary_table = t_name
                break

        if not primary_table:
            if has_location_intent and "parking_locations" in tables_map:
                primary_table = "parking_locations"
            elif has_revenue_intent and "parking_reservations" in tables_map:
                primary_table = "parking_reservations"
            else:
                primary_table = all_tables[0]

        # 2. Build intelligent dimensions, metrics, joins, and grouping
        dimensions: List[str] = []
        metrics: List[MetricAggregationSpec] = []
        join_paths: List[JoinPathSpec] = []
        group_by: List[str] = []
        sort_by: List[SortCriterionSpec] = []

        # Revenue query handling
        if has_revenue_intent:
            fact_table = None
            amount_col = None

            for candidate in ("parking_reservations", "payments"):
                if candidate in tables_map:
                    for col in ("total_amount", "amount", "hourly_rate"):
                        if col in tables_map[candidate]:
                            fact_table = candidate
                            amount_col = col
                            break
                if fact_table:
                    break

            if not fact_table:
                # Find any numeric column across tables
                for t, cols in tables_map.items():
                    for col in cols:
                        if any(term in col for term in ("amount", "rate", "price", "revenue", "cost")):
                            fact_table = t
                            amount_col = col
                            break

            if fact_table and amount_col:
                metrics.append(
                    MetricAggregationSpec(
                        expression=f"SUM({fact_table}.{amount_col})",
                        alias="total_revenue",
                        aggregation_function="SUM"
                    )
                )
                sort_by.append(SortCriterionSpec(column="total_revenue", direction="DESC"))

                # Location breakdown handling
                if has_location_intent and "parking_locations" in tables_map:
                    primary_table = "parking_locations"
                    loc_name_col = "name" if "name" in tables_map["parking_locations"] else list(tables_map["parking_locations"])[0]
                    dim_ref = f"parking_locations.{loc_name_col}"
                    dimensions.append(dim_ref)
                    group_by.append(dim_ref)

                    if fact_table != "parking_locations" and "location_id" in tables_map[fact_table]:
                        join_paths.append(
                            JoinPathSpec(
                                source_table="parking_locations",
                                target_table=fact_table,
                                join_type="INNER",
                                on_condition=f"parking_locations.id = {fact_table}.location_id"
                            )
                        )

        # Count or Breakdown handling if no metric assigned yet
        is_listing_query = any(kw in q_lower for kw in ("show all", "list all", "get all", "select all", "all database", "all ")) and not has_count_intent
        if not metrics and not is_listing_query:
            if "name" in tables_map.get(primary_table, set()):
                dimensions.append(f"{primary_table}.name")
                group_by.append(f"{primary_table}.name")
            elif "spot_type" in tables_map.get(primary_table, set()):
                dimensions.append(f"{primary_table}.spot_type")
                group_by.append(f"{primary_table}.spot_type")

            metrics.append(
                MetricAggregationSpec(
                    expression="COUNT(*)",
                    alias="total_records",
                    aggregation_function="COUNT"
                )
            )
            sort_by.append(SortCriterionSpec(column="total_records", direction="DESC"))

        return QueryExecutionPlan(
            intent_summary=f"Execution plan derived for: {user_query}",
            target_tables=[primary_table],
            join_paths=join_paths,
            metrics=metrics,
            dimensions=dimensions,
            filters=[],
            group_by=group_by,
            sort_by=sort_by,
            limit=1000
        )

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

        if not api_key or os.getenv("SKIP_LLM_TESTS", "false").lower() == "true":
            return self._fallback_plan(user_query, schema_context)

        try:
            import openai
            timeout_sec = float(os.getenv("LLM_TIMEOUT", "3.0"))
            client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url, timeout=timeout_sec)
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
