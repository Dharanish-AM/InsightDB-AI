import {
  AuthResponse,
  DatabaseConnection,
  InsightGenerateResponse,
  PipelineAskResponse,
  QueryExecuteResponse,
  SchemaTable,
  SqlValidateResponse,
  User
} from '../types';

const API_BASE = '/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('insightdb_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  async register(email: string, password: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    const data: AuthResponse = await res.json();
    localStorage.setItem('insightdb_token', data.access_token);
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  async getConnections(): Promise<DatabaseConnection[]> {
    const res = await fetch(`${API_BASE}/databases/`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch connections');
    return res.json();
  },

  async createConnection(conn: Omit<DatabaseConnection, 'id' | 'is_active' | 'created_at'> & { password: string }): Promise<DatabaseConnection> {
    const res = await fetch(`${API_BASE}/databases/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(conn),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create connection');
    }
    return res.json();
  },

  async testConnection(conn: Omit<DatabaseConnection, 'id' | 'is_active' | 'created_at'> & { password: string }) {
    const res = await fetch(`${API_BASE}/databases/test-connection`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(conn),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Connection test failed');
    }
    return res.json();
  },

  async syncSchema(connectionId: number) {
    const res = await fetch(`${API_BASE}/schema/${connectionId}/sync`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to sync schema');
    return res.json();
  },

  async getSchema(connectionId: number): Promise<SchemaTable[]> {
    const res = await fetch(`${API_BASE}/schema/${connectionId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch schema');
    return res.json();
  },

  async updateTableAnnotation(tableId: number, data: { business_name?: string; description?: string; aliases?: string[] }) {
    const res = await fetch(`${API_BASE}/metadata/tables/${tableId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update table annotation');
    return res.json();
  },

  async updateColumnAnnotation(columnId: number, data: { business_name?: string; description?: string; semantic_type?: string; aliases?: string[] }) {
    const res = await fetch(`${API_BASE}/metadata/columns/${columnId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update column annotation');
    return res.json();
  },

  async validateSql(connectionId: number, sql: string): Promise<SqlValidateResponse> {
    const res = await fetch(`${API_BASE}/sql/validate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ connection_id: connectionId, sql }),
    });
    if (!res.ok) throw new Error('Validation request failed');
    return res.json();
  },

  async executeQuery(connectionId: number, sql: string): Promise<QueryExecuteResponse> {
    const res = await fetch(`${API_BASE}/query/execute`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ connection_id: connectionId, sql }),
    });
    if (!res.ok) throw new Error('Execution request failed');
    return res.json();
  },

  async generateInsights(userQuery: string, rows: any[], columns: string[]): Promise<InsightGenerateResponse> {
    const res = await fetch(`${API_BASE}/insights/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ user_query: userQuery, rows, columns }),
    });
    if (!res.ok) throw new Error('Insight generation failed');
    return res.json();
  },

  async askPipeline(connectionId: number, userQuery: string): Promise<PipelineAskResponse> {
    const res = await fetch(`${API_BASE}/pipeline/ask`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ connection_id: connectionId, user_query: userQuery }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Pipeline request failed');
    }
    return res.json();
  }
};
