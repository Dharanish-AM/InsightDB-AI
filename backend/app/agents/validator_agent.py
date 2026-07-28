from typing import List
import sqlglot
from sqlglot import exp
from app.schemas.sql_validator import SqlValidateResponse


class ValidatorAgent:
    FORBIDDEN_EXPRESSIONS = (
        exp.Insert,
        exp.Update,
        exp.Delete,
        exp.Drop,
        exp.Alter,
        exp.TruncateTable,
        exp.Create,
        exp.Grant,
        exp.Command,
    )

    FORBIDDEN_KEYWORDS = {
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER",
        "TRUNCATE", "CREATE", "GRANT", "REVOKE", "EXEC",
        "EXECUTE", "SHUTDOWN"
    }

    def validate_sql(
        self,
        sql: str,
        dialect: str = "postgres",
        connection_id: int = 0,
        max_rows: int = 1000
    ) -> SqlValidateResponse:
        violations: List[str] = []
        sql_clean = sql.strip().rstrip(";")

        for kw in self.FORBIDDEN_KEYWORDS:
            if f" {kw} " in f" {sql_clean.upper()} " or sql_clean.upper().startswith(f"{kw} "):
                violations.append(f"Forbidden SQL keyword detected: '{kw}'")

        try:
            target_dialect = "postgres" if dialect == "postgresql" else dialect
            parsed_expressions = sqlglot.parse(sql_clean, read=target_dialect)
        except Exception as err:
            return SqlValidateResponse(
                is_valid=False,
                connection_id=connection_id,
                sanitized_sql=None,
                violations=[f"SQL syntax error: {str(err)}"],
                statement_type=None
            )

        if not parsed_expressions:
            return SqlValidateResponse(
                is_valid=False,
                connection_id=connection_id,
                sanitized_sql=None,
                violations=["Empty SQL statement."],
                statement_type=None
            )

        if len(parsed_expressions) > 1:
            violations.append("Multiple SQL statements (semicolon chaining) are strictly prohibited.")

        first_expr = parsed_expressions[0]
        if first_expr is None:
            return SqlValidateResponse(
                is_valid=False,
                connection_id=connection_id,
                sanitized_sql=None,
                violations=["Invalid SQL statement."],
                statement_type=None
            )

        stmt_type = first_expr.key.upper()

        if not isinstance(first_expr, exp.Select):
            violations.append(f"Only SELECT queries are allowed. Received statement type: '{stmt_type}'.")

        for node in first_expr.walk():
            if isinstance(node, self.FORBIDDEN_EXPRESSIONS):
                violations.append(f"Forbidden SQL operation detected: '{node.key.upper()}'.")

        if violations:
            return SqlValidateResponse(
                is_valid=False,
                connection_id=connection_id,
                sanitized_sql=None,
                violations=list(set(violations)),
                statement_type=stmt_type
            )

        current_limit = first_expr.args.get("limit")
        if current_limit is None:
            first_expr = first_expr.limit(max_rows)
        else:
            try:
                limit_val = int(current_limit.expression.this)
                if limit_val > max_rows:
                    first_expr = first_expr.limit(max_rows)
            except Exception:
                first_expr = first_expr.limit(max_rows)

        sanitized = first_expr.sql(dialect=target_dialect) + ";"

        return SqlValidateResponse(
            is_valid=True,
            connection_id=connection_id,
            sanitized_sql=sanitized,
            violations=[],
            statement_type="SELECT"
        )


validator_agent = ValidatorAgent()
