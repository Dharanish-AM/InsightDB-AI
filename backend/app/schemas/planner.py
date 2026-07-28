from typing import Any, List, Optional
from pydantic import BaseModel, Field


class JoinPathSpec(BaseModel):
    source_table: str
    target_table: str
    join_type: str = "INNER"
    on_condition: str


class MetricAggregationSpec(BaseModel):
    expression: str
    alias: str
    aggregation_function: Optional[str] = None


class FilterConditionSpec(BaseModel):
    column: str
    operator: str
    value: Any


class SortCriterionSpec(BaseModel):
    column: str
    direction: str = "ASC"


class QueryExecutionPlan(BaseModel):
    intent_summary: str
    target_tables: List[str]
    join_paths: List[JoinPathSpec] = []
    metrics: List[MetricAggregationSpec] = []
    dimensions: List[str] = []
    filters: List[FilterConditionSpec] = []
    group_by: List[str] = []
    sort_by: List[SortCriterionSpec] = []
    limit: Optional[int] = 100


class PlannerRequest(BaseModel):
    connection_id: int
    user_query: str = Field(..., min_length=1)


class PlannerResponse(BaseModel):
    connection_id: int
    user_query: str
    plan: QueryExecutionPlan
