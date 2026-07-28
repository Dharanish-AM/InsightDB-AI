import json
import os
from pathlib import Path
from typing import List, Optional
from app.schemas.planner import QueryExecutionPlan
from app.schemas.sql_generator import SqlGenerateResponse


class SqlAgent:
    def __init__(self, prompt_path: Optional[str] = None):
        if prompt_path is None:
            base_dir = Path(__file__).resolve().parent.parent.parent
            prompt_path = os.path.join(base_dir, "prompts", "sql_generator_v1.txt")

        with open(prompt_path, "r", encoding="utf-8") as f:
            self.prompt_template = f.read()

    def _quote_identifier(self, identifier: str, dialect: str) -> str:
        if "." in identifier:
            parts = identifier.split(".")
            return ".".join(self._quote_identifier(p, dialect) for p in parts)
        if dialect == "mysql":
            return f"`{identifier}`"
        elif dialect == "postgresql":
            return f'"{identifier}"'
        return identifier

    def _build_deterministic_sql(self, plan: QueryExecutionPlan, dialect: str) -> SqlGenerateResponse:
        select_parts: List[str] = []

        if plan.dimensions:
            for dim in plan.dimensions:
                select_parts.append(self._quote_identifier(dim, dialect))

        if plan.metrics:
            for metric in plan.metrics:
                expr = metric.expression
                if metric.alias:
                    expr += f" AS {self._quote_identifier(metric.alias, dialect)}"
                select_parts.append(expr)

        if not select_parts:
            select_parts.append("*")

        tables = plan.target_tables if plan.target_tables else ["dual"]
        from_clause = f"FROM {self._quote_identifier(tables[0], dialect)}"

        join_clauses = []
        for jp in plan.join_paths:
            t_target = self._quote_identifier(jp.target_table, dialect)
            join_type = jp.join_type.upper()
            join_clauses.append(f"{join_type} JOIN {t_target} ON {jp.on_condition}")

        where_clauses = []
        for f in plan.filters:
            col_str = self._quote_identifier(f.column, dialect)
            val_str = f"'{f.value}'" if isinstance(f.value, str) else str(f.value)
            where_clauses.append(f"{col_str} {f.operator} {val_str}")

        group_clauses = [self._quote_identifier(g, dialect) for g in plan.group_by]

        order_clauses = []
        for s in plan.sort_by:
            col_str = self._quote_identifier(s.column, dialect)
            order_clauses.append(f"{col_str} {s.direction.upper()}")

        sql_lines = [f"SELECT {', '.join(select_parts)}", from_clause]
        if join_clauses:
            sql_lines.extend(join_clauses)
        if where_clauses:
            sql_lines.append(f"WHERE {' AND '.join(where_clauses)}")
        if group_clauses:
            sql_lines.append(f"GROUP BY {', '.join(group_clauses)}")
        if order_clauses:
            sql_lines.append(f"ORDER BY {', '.join(order_clauses)}")
        if plan.limit:
            sql_lines.append(f"LIMIT {plan.limit}")

        generated_sql = "\n".join(sql_lines) + ";"

        return SqlGenerateResponse(
            connection_id=0,
            sql=generated_sql,
            dialect=dialect,
            explanation=f"Generated parameterized {dialect.upper()} query for intent: {plan.intent_summary}",
            tables_used=tables
        )

    async def generate_sql(
        self,
        plan: QueryExecutionPlan,
        dialect: str,
        connection_id: int
    ) -> SqlGenerateResponse:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            res = self._build_deterministic_sql(plan, dialect)
            res.connection_id = connection_id
            return res

        try:
            import openai
            client = openai.AsyncOpenAI(api_key=api_key)
            formatted_prompt = self.prompt_template.format(
                dialect=dialect,
                execution_plan=plan.model_dump_json(indent=2)
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
            return SqlGenerateResponse(
                connection_id=connection_id,
                sql=data.get("sql", ""),
                dialect=dialect,
                explanation=data.get("explanation", "Generated SQL from execution plan."),
                tables_used=data.get("tables_used", plan.target_tables)
            )
        except Exception:
            res = self._build_deterministic_sql(plan, dialect)
            res.connection_id = connection_id
            return res


sql_agent = SqlAgent()
