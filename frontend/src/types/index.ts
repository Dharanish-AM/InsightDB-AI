export interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface DatabaseConnection {
  id: number;
  name: string;
  db_type: 'postgresql' | 'mysql';
  host: string;
  port: number;
  database_name: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface SchemaColumn {
  id: number;
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  foreign_key_target?: string;
  annotation?: {
    business_name?: string;
    description?: string;
    semantic_type?: string;
    aliases?: string[];
  };
}

export interface SchemaTable {
  id: number;
  table_name: string;
  table_type: string;
  columns: SchemaColumn[];
  annotation?: {
    business_name?: string;
    description?: string;
    aliases?: string[];
  };
}

export interface MetricAggregationSpec {
  expression: string;
  alias?: string;
}

export interface QueryExecutionPlan {
  intent_summary: string;
  target_tables: string[];
  filter_conditions: string[];
  join_paths: string[];
  group_by_columns: string[];
  metrics: MetricAggregationSpec[];
  limit: number;
}

export interface SqlValidateResponse {
  is_valid: boolean;
  connection_id: number;
  sanitized_sql?: string;
  violations: string[];
  statement_type?: string;
}

export interface ColumnHeader {
  name: string;
  data_type: string;
}

export interface QueryExecuteResponse {
  success: boolean;
  connection_id: number;
  columns: ColumnHeader[];
  rows: Record<string, any>[];
  row_count: number;
  omitted_columns: string[];
  execution_time_ms: number;
  sanitized_sql?: string;
  error?: string;
}

export interface TrendHighlight {
  title: string;
  description: string;
}

export interface AnomalyHighlight {
  title: string;
  severity: string;
  description: string;
}

export interface InsightGenerateResponse {
  summary: string;
  key_takeaways: string[];
  trends: TrendHighlight[];
  anomalies: AnomalyHighlight[];
  recommendations: string[];
}

export interface PipelineAskResponse {
  success: boolean;
  connection_id: number;
  user_query: string;
  plan?: QueryExecutionPlan;
  sql_generated?: string;
  sanitized_sql?: string;
  query_results?: QueryExecuteResponse;
  insights?: InsightGenerateResponse;
  error?: string;
}
